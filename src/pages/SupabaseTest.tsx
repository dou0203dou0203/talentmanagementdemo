import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useData } from '../context/DataContext';

export default function SupabaseTest() {
  const dataCtx = useData();
  const [status, setStatus] = useState<'checking'|'ok'|'error'>('checking');
  const [tables, setTables] = useState<{name:string;count:number}[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setStatus('error');
      setError('Supabaseの環境変数が設定されていません');
      return;
    }
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const tableNames = ['occupations','facilities','users','survey_periods','evaluations','surveys','interview_logs','aptitude_tests'];
      const results: {name:string;count:number}[] = [];
      for (const t of tableNames) {
        const { count, error: e } = await supabase.from(t).select('*', { count: 'exact', head: true });
        if (e) { results.push({name:t, count:-1}); }
        else { results.push({name:t, count: count||0}); }
      }
      setTables(results);
      setStatus('ok');
    } catch (e: any) {
      setStatus('error');
      setError(e.message);
    }
  };

  return (
    <div className='fade-in'>
      <h2 className='page-title'>🔌 Supabase 接続確認</h2>
      <p className='page-subtitle'>Supabaseとの接続状況と各テーブルのデータ件数を確認できます。</p>

      <div className='card' style={{marginBottom:'var(--space-5)'}}>
        <div className='card-header'>
          <h3 className='card-title'>📡 接続ステータス</h3>
          <span className={'badge '+(status==='ok'?'badge-success':status==='error'?'badge-danger':'badge-warning')}>
            {status==='checking'?'確認中...':status==='ok'?'✅ 接続成功':'❌ エラー'}
          </span>
        </div>
        <div className='card-body'>
          <div style={{display:'grid',gap:8}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>URL:</span><code style={{fontSize:'var(--font-size-xs)'}}>{import.meta.env.VITE_SUPABASE_URL||'未設定'}</code></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>Key:</span><code style={{fontSize:'var(--font-size-xs)'}}>{(import.meta.env.VITE_SUPABASE_ANON_KEY||'').substring(0,20)}...</code></div>
          </div>
          {error && <div style={{marginTop:12,color:'var(--color-danger)',fontSize:'var(--font-size-sm)'}}>{error}</div>}
        </div>
      </div>

      <div className='card' style={{marginBottom:'var(--space-5)'}}>
        <div className='card-header'>
          <h3 className='card-title'>📦 データソース</h3>
          <span className={'badge '+(dataCtx.source==='supabase'?'badge-success':'badge-warning')}>
            {dataCtx.source==='supabase'?'🔌 Supabase':'📁 MockData'}
          </span>
        </div>
        <div className='card-body'>
          <div style={{display:'grid',gap:8,fontSize:'var(--font-size-sm)'}}>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>ユーザー数:</span><strong>{dataCtx.users.length}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>施設数:</span><strong>{dataCtx.facilities.length}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>サーベイ回答:</span><strong>{dataCtx.surveys.length}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>面談記録:</span><strong>{dataCtx.interviewLogs.length}</strong></div>
            <div style={{display:'flex',justifyContent:'space-between'}}><span>ローディング:</span><strong>{dataCtx.loading?'読み込み中...':'完了'}</strong></div>
          </div>
        </div>
      </div>

      {tables.length>0 && (
        <div className='card'>
          <div className='card-header'><h3 className='card-title'>📊 テーブル状況</h3></div>
          <div className='card-body' style={{padding:0}}>
            <table className='data-table'>
              <thead><tr><th>テーブル名</th><th>レコード数</th><th>ステータス</th></tr></thead>
              <tbody>
                {tables.map(t => (
                  <tr key={t.name}>
                    <td style={{fontWeight:500}}>{t.name}</td>
                    <td style={{fontWeight:600,color:t.count>0?'var(--color-success)':t.count===0?'var(--color-warning)':'var(--color-danger)'}}>{t.count>=0?t.count:'エラー'}</td>
                    <td><span className={'badge '+(t.count>0?'badge-success':t.count===0?'badge-warning':'badge-danger')}>{t.count>0?'✅ データあり':t.count===0?'⚠️ 空':'❌ アクセス不可'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{marginTop:'var(--space-5)',textAlign:'center'}}>
        <button className='btn btn-primary' onClick={()=>{setStatus('checking');setTables([]);checkConnection();}}>🔄 再確認</button>
      </div>
    </div>
  );
}