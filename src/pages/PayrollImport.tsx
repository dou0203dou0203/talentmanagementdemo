import React, { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { usePayrollUpload } from '../hooks/usePayrollUpload';

export default function PayrollImport() {
  const { permissions } = useAuth();
  const { users } = useData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [yearMonth, setYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const { state, upload, reset } = usePayrollUpload();

  if (!permissions.canViewPayroll) {
    return <div style={{ padding: 20 }}>アクセス権限がありません。（給与担当者のみ閲覧可能です）</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    await upload(file, yearMonth, users);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: 60 }}>
      <h2 className="page-title">給与データ一括登録（バックエンド処理）</h2>
      <p className="page-subtitle">
        月次の給与支給控除一覧（PDF）をアップロードし、自動でスタッフ情報の紐付けとデータベースへの保存・マスキング済みExcelへの変換を行います。
      </p>

      <div className="card" style={{ maxWidth: 600, margin: '0 auto', marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">📄 PDFアップロード</h3>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">対象年月</label>
              <input
                type="month"
                className="form-input"
                value={yearMonth}
                onChange={e => setYearMonth(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">給与支給控除一覧（PDF）</label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="form-input"
                style={{ padding: '8px' }}
              />
              <p className="form-help">PDFファイルのみ対応しています。</p>
            </div>
            
            <button
              type="submit"
              disabled={state.status === 'uploading' || !yearMonth}
              className="btn btn-primary btn-lg"
              style={{ marginTop: 'var(--space-2)' }}
            >
              {state.status === 'uploading' ? '🔄 解析と保存を実行中...' : '解析してSupabaseへ保存'}
            </button>
          </form>
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
            </p>
            
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
