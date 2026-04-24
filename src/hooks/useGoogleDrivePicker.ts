import { useState, useCallback, useEffect } from 'react';

// Windowオブジェクトに型定義を追加して、Google APIを安全に呼び出せるようにする
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export function useGoogleDrivePicker() {
  const [isReady, setIsReady] = useState(false);
  const [tokenClient, setTokenClient] = useState<any>(null);
  
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_APP_ID = import.meta.env.VITE_GOOGLE_APP_ID;

  // 1. Google API スクリプトの動的ロード
  useEffect(() => {
    if (!GOOGLE_API_KEY || !GOOGLE_CLIENT_ID || !GOOGLE_APP_ID) {
      console.warn("Google Drive APIの設定が環境変数に見つかりません。");
      return;
    }

    let gapiLoaded = false;
    let gisLoaded = false;

    const checkReady = () => {
      if (gapiLoaded && gisLoaded) setIsReady(true);
    };

    // GAPI (Google Picker) の初期化
    const loadGapi = () => {
      window.gapi.load('picker', { callback: () => { gapiLoaded = true; checkReady(); } });
    };

    // Google Identity Services (OAuth) の初期化
    const loadGis = () => {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.readonly',
        callback: '' // 実行時に上書きする
      });
      setTokenClient(client);
      gisLoaded = true;
      checkReady();
    };

    // <script>タグの注入: gapi
    if (typeof window.gapi !== 'undefined') {
      loadGapi();
    } else {
      const gapiScript = document.createElement('script');
      gapiScript.src = 'https://apis.google.com/js/api.js';
      gapiScript.onload = loadGapi;
      document.body.appendChild(gapiScript);
    }

    // <script>タグの注入: GIS
    if (typeof window.google !== 'undefined' && window.google.accounts) {
      loadGis();
    } else {
      const gisScript = document.createElement('script');
      gisScript.src = 'https://accounts.google.com/gsi/client';
      gisScript.onload = loadGis;
      document.body.appendChild(gisScript);
    }
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID, GOOGLE_APP_ID]);

  // 2. ピッカーを開いてファイルを取得する
  const pickFile = useCallback((): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      if (!isReady || !tokenClient) {
        reject(new Error('Google Picker is not initialized yet.'));
        return;
      }

      // アクセストークンをリクエスト
      tokenClient.callback = async (response: any) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }

        const accessToken = response.access_token;
        showPicker(accessToken, resolve, reject);
      };
      
      tokenClient.requestAccessToken({ prompt: 'consent' });
    });
  }, [isReady, tokenClient, GOOGLE_API_KEY, GOOGLE_APP_ID]);

  // ピッカーUIの表示ロジック
  const showPicker = (accessToken: string, resolve: (buf: ArrayBuffer) => void, reject: (err: any) => void) => {
    const view = new window.gapi.picker.DocsView(window.gapi.picker.ViewId.SPREADSHEETS);
    view.setMimeTypes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.google-apps.spreadsheet');

    const picker = new window.gapi.picker.PickerBuilder()
      .enableFeature(window.gapi.picker.Feature.NAV_HIDDEN)
      .enableFeature(window.gapi.picker.Feature.MULTISELECT_ENABLED)
      .setAppId(GOOGLE_APP_ID)
      .setOAuthToken(accessToken)
      .addView(view)
      .setDeveloperKey(GOOGLE_API_KEY)
      .setCallback(async (data: any) => {
        if (data.action === window.gapi.picker.Action.PICKED) {
          const file = data.docs[0];
          try {
            const buffer = await downloadFile(file.id, accessToken);
            resolve(buffer);
          } catch (error) {
            reject(error);
          }
        } else if (data.action === window.gapi.picker.Action.CANCEL) {
          reject(new Error('ファイル選択がキャンセルされました'));
        }
      })
      .build();
    picker.setVisible(true);
  };

  // Google Drive REST API でファイルをバイナリとしてダウンロード
  const downloadFile = async (fileId: string, accessToken: string): Promise<ArrayBuffer> => {
    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Google Driveからのファイル取得に失敗しました: ${response.statusText}`);
    }

    return await response.arrayBuffer();
  };

  return { isReady, pickFile };
}
