import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePayrollUpload } from '../hooks/usePayrollUpload';

export default function PayrollImport() {
  const { permissions } = useAuth();
  const { users } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const excelFileRef = useRef<HTMLInputElement>(null);
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const { state, upload, uploadExcelBuffer, reset } = usePayrollUpload();

  if (!permissions.canViewPayroll) {
    return <div style={{ padding: 20 }}>アクセス権限がありません。（給与担当者のみ閲覧可能です）</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await upload(file, yearMonth, users);
  };

  const handleLocalExcelImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      await uploadExcelBuffer(buffer, yearMonth, users);
    } catch (err: any) {
      console.error(err);
      alert('Excelファイルの読み込みに失敗しました');
    }
    // reset input
    if (excelFileRef.current) excelFileRef.current.value = '';
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <h2 className="page-title">給与データ一括登録（バックエンド処理）</h2>
      <p className="page-subtitle">
        月次の給与支給控除一覧（PDF）をアップロードし、自動でスタッフ情報の紐付けとデータベースへの保存・マスキング済みExcelへの変換を行います。
      </p>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto', marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">☁️ データインポート</h3>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">対象年月</label>
              <input
                type="month"
                className="form-input"
                value={yearMonth}
                onChange={e => setYearMonth(e.target.value)}
              />
            </div>
            
            <div style={{ background: '#f8fafc', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
              <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-md)' }}>GAS出力済み Excelアップロード</h4>
              <p className="form-help" style={{ marginBottom: 'var(--space-3)' }}>Google Drive(GAS)で変換済みのExcelファイルをアップロードしてください。</p>

              <div style={{ position: 'relative' }}>
                <input
                  ref={excelFileRef}
                  type="file"
                  accept=".xlsx"
                  onChange={handleLocalExcelImport}
                  style={{ display: 'none' }}
                  id="local-excel-upload"
                />
                <label htmlFor="local-excel-upload" className="btn btn-primary btn-lg" style={{ width: '100%', textAlign: 'center', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Excelファイルを選択して保存
                </label>
              </div>
            </div>

            <div style={{ padding: 'var(--space-4)', borderRadius: 'var(--radius-md)', border: '1px dashed #e2e8f0' }}>
              <form onSubmit={handleSubmit}>
                <h4 style={{ marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-md)', color: 'var(--color-neutral-600)' }}>PDFからの直接解析（旧方式）</h4>
                <div className="form-group" style={{ marginBottom: 'var(--space-3)' }}>
                  <input ref={fileRef} type="file" accept=".pdf" className="form-input" style={{ padding: '8px' }} />
                </div>
                <button
                  type="submit"
                  disabled={state.status === 'uploading' || !yearMonth}
                  className="btn btn-secondary"
                  style={{ width: '100%' }}
                >
                  PDFを解析
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {state.status === 'success' && (
        <div className="card fade-in" style={{ maxWidth: 600, margin: '0 auto', border: '1px solid var(--color-success)', background: 'var(--color-success-bg)' }}>
          <div className="card-body" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-2)' }}>✅</div>
            <h3 style={{ color: 'var(--color-success)', marginBottom: 'var(--space-2)' }}>処理が完了しました</h3>
            <p style={{ marginBottom: 'var(--space-4)', fontSize: 'var(--font-size-md)', color: 'var(--color-neutral-700)' }}>
              Supabaseへの保存件数: <strong>{state.savedCount}</strong> 件のレコード<br />
              紐付け成功: <strong>{state.mappedCount}</strong> 名のスタッフ
              {state.unmatchedNames.length > 0 && (
                <><br />未紐付け: <strong style={{ color: 'var(--color-danger)' }}>{state.unmatchedNames.length}</strong> 名</>
              )}
            </p>
            {state.unmatchedNames.length > 0 && (
              <div style={{ background: '#fffbeb', border: '1px solid #f59e0b', borderRadius: 'var(--radius-md)', padding: 'var(--space-3)', marginBottom: 'var(--space-4)', textAlign: 'left', fontSize: 'var(--font-size-sm)' }}>
                <strong style={{ color: '#92400e' }}>⚠️ 以下の名前がシステム上のスタッフと一致しませんでした:</strong>
                <ul style={{ margin: '8px 0 0 16px', color: '#78350f' }}>
                  {state.unmatchedNames.map((name, i) => <li key={i}>{name}</li>)}
                </ul>
                <p style={{ margin: '8px 0 0', color: '#92400e', fontSize: 'var(--font-size-xs)' }}>
                  💡 スタッフデータの氏名欄をPDFの表記と一致させると、次回から自動紐付けされます。<br />
                  ※ブラウザのDevTools → Console で詳細なデバッグログを確認できます。
                </p>
              </div>
            )}
            
            <a
              href={state.downloadUrl}
              download={state.filename}
              className="btn btn-primary"
              style={{ display: 'inline-flex', marginBottom: 'var(--space-4)' }}
            >
              📥 トークナイズ済みExcelをダウンロード
            </a>
            
            <div>
              <button onClick={reset} className="btn btn-secondary">
                別のファイルを処理する
              </button>
            </div>
          </div>
        </div>
      )}

      {state.status === 'error' && (
        <div className="card fade-in" style={{ maxWidth: 600, margin: '0 auto', border: '1px solid var(--color-danger)', background: '#fef2f2' }}>
          <div className="card-body">
            <h3 style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-2)' }}>⚠️ エラーが発生しました</h3>
            <p style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-4)' }}>{state.message}</p>
            <button onClick={reset} className="btn btn-secondary">
              やり直す
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
