import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';

// Column definitions
type ColKey = 'name'|'email'|'facility'|'occupation'|'status'|'role'|'hire_date'|'position'|'employment_type'|'work_pattern'|'corporation'|'qualifications'|'mental'|'motivation'|'eval_score';
const ALL_COLUMNS: {key:ColKey;label:string;default:boolean}[] = [
  {key:'name',label:'氏名',default:true},
  {key:'facility',label:'施設',default:true},
  {key:'occupation',label:'職種',default:true},
  {key:'status',label:'ステータス',default:true},
  {key:'role',label:'権限',default:false},
  {key:'email',label:'メール',default:false},
  {key:'hire_date',label:'入職日',default:true},
  {key:'position',label:'役職',default:true},
  {key:'employment_type',label:'雇用形態',default:false},
  {key:'work_pattern',label:'勤務形態',default:false},
  {key:'corporation',label:'法人',default:false},
  {key:'qualifications',label:'資格',default:false},
  {key:'mental',label:'メンタルスコア',default:true},
  {key:'motivation',label:'モチベーション',default:true},
  {key:'eval_score',label:'評価スコア',default:false},
];

const STATUS_LABELS: Record<string,string> = { active: '在籍', leave: '休職中', inactive: '非アクティブ' };
const ROLE_LABELS: Record<string,string> = { staff: 'スタッフ', facility_manager: '事業所管理者', hr_admin: '人事部', corp_head: '法人代表' };

export default function StaffDataExport() {
    const { users, occupations, facilities, surveys, surveyPeriods, evaluations } = useData();
  const [mode, setMode] = useState<'export'|'import'>('export');
  const [importFile, setImportFile] = useState<File|null>(null);
  const [importData, setImportData] = useState<string[][]>([]);
  const [importHeaders, setImportHeaders] = useState<string[]>([]);
  const [importStatus, setImportStatus] = useState<'idle'|'preview'|'done'>('idle');
  const [importCount, setImportCount] = useState(0);
  const [filterFac, setFilterFac] = useState('all');
  const [filterOcc, setFilterOcc] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchName, setSearchName] = useState('');
  const [sortKey, setSortKey] = useState<ColKey>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [visibleCols, setVisibleCols] = useState<Set<ColKey>>(new Set(ALL_COLUMNS.filter(c=>c.default).map(c=>c.key)));
  const [showColPicker, setShowColPicker] = useState(false);

  const toggleCol = (key: ColKey) => {
    setVisibleCols(prev => {
      const next = new Set(prev);
      if (next.has(key)) { if (next.size > 1) next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  // CSV Import handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.replace(/\r/g, '').split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1).map(l => parseCSVLine(l));
      setImportHeaders(headers);
      setImportData(rows);
      setImportStatus('preview');
    };
    reader.readAsText(file, 'UTF-8');
  };
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []; let cur = ''; let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { if (inQ && line[i+1] === '"') { cur += '"'; i++; } else { inQ = !inQ; } }
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    result.push(cur.trim());
    return result;
  };
  const handleImport = () => {
    setImportCount(importData.length);
    setImportStatus('done');
  };
  const resetImport = () => {
    setImportFile(null); setImportData([]); setImportHeaders([]); setImportStatus('idle'); setImportCount(0);
  };
  // Download template
  const downloadTemplate = () => {
    const header = '氏名,メール,施設,職種,役職,入職日,雇用形態,勤務形態,法人,資格';
    const sample = '山田花子,hanako@example.com,さくらの樹西院,看護師,スタッフ,2025-04-01,正社員,常勤,(株)プラスディー,看護師免許';
    const bom = '\uFEFF';
    const blob = new Blob([bom + header + '\n' + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'staff_import_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Latest survey scores
  const latestPeriod = surveyPeriods.filter(p=>p.status==='closed').slice(-1)[0] || surveyPeriods[surveyPeriods.length-1];
  const surveyMap = useMemo(() => {
    const m: Record<string,{mental:number;motivation:number}> = {};
    surveys.filter(s=>s.period_id===latestPeriod?.id).forEach(s => { m[s.user_id] = {mental:s.mental_score,motivation:s.motivation_score}; });
    return m;
  }, []);

  // Latest eval scores
  const evalMap = useMemo(() => {
    const m: Record<string,number> = {};
    evaluations.forEach(ev => {
      if (!ev.scores || ev.scores.length===0) return;
      const avg = ev.scores.reduce((s,sc)=>s+sc.score,0)/ev.scores.length;
      if (avg > 0) m[ev.user_id] = Math.round(avg*10)/10;
    });
    return m;
  }, []);

  // Get cell value
  const getCellValue = (u: typeof users[0], col: ColKey): string => {
    const occ = occupations.find(o=>o.id===u.occupation_id);
    const fac = facilities.find(f=>f.id===u.facility_id);
    switch(col) {
      case 'name': return u.name;
      case 'email': return u.email;
      case 'facility': return fac?.name||'';
      case 'occupation': return occ?.name||'';
      case 'status': return STATUS_LABELS[u.status]||u.status;
      case 'role': return ROLE_LABELS[u.role]||u.role;
      case 'hire_date': return u.hire_date||'';
      case 'position': return u.position||'';
      case 'employment_type': return u.employment_type||'';
      case 'work_pattern': return u.work_pattern||'';
      case 'corporation': return u.corporation||'';
      case 'qualifications': return u.qualifications?.map(q=>q.name).join(', ')||'';
      case 'mental': return surveyMap[u.id]?.mental?.toString()||'';
      case 'motivation': return surveyMap[u.id]?.motivation?.toString()||'';
      case 'eval_score': return evalMap[u.id]?.toString()||'';
      default: return '';
    }
  };

  // Filtered and sorted data
  const filtered = useMemo(() => {
    return users
      .filter(u => filterFac==='all' || u.facility_id===filterFac)
      .filter(u => filterOcc==='all' || u.occupation_id===filterOcc)
      .filter(u => filterStatus==='all' || u.status===filterStatus)
      .filter(u => !searchName.trim() || u.name.includes(searchName.trim()))
      .sort((a,b) => {
        const va = getCellValue(a, sortKey);
        const vb = getCellValue(b, sortKey);
        const cmp = va.localeCompare(vb, 'ja');
        return sortAsc ? cmp : -cmp;
      });
  }, [filterFac, filterOcc, filterStatus, searchName, sortKey, sortAsc]);

  const handleSort = (key: ColKey) => {
    if (sortKey === key) { setSortAsc(!sortAsc); } else { setSortKey(key); setSortAsc(true); }
  };

  // CSV Export
  const exportCSV = () => {
    const cols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));
    const header = cols.map(c => c.label).join(',');
    const rows = filtered.map(u => cols.map(c => {
      const val = getCellValue(u, c.key);
      return '"' + val.replace(/"/g, '""') + '"';
    }).join(','));
    const bom = '\uFEFF';
    const csv = bom + header + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'staff_data_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const cols = ALL_COLUMNS.filter(c => visibleCols.has(c.key));

  return (
    <div className='fade-in'>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12,marginBottom:'var(--space-5)'}}>
        <div>
          <h2 className='page-title'>📊 スタッフデータ管理</h2>
          <p className='page-subtitle'>データのフィルタリング・エクスポート、CSVインポートが行えます。</p>
        </div>
        <button className='btn btn-primary' onClick={exportCSV} style={{whiteSpace:'nowrap'}}>
          📥 CSVエクスポート（{filtered.length}件）
        </button>
      </div>

      {/* Mode Tabs */}
      <div className='sp-tabs' style={{marginBottom:'var(--space-5)'}}>
        <button className={'sp-tab '+(mode==='export'?'active':'')} onClick={()=>setMode('export')}><span>📥</span> データ出力</button>
        <button className={'sp-tab '+(mode==='import'?'active':'')} onClick={()=>setMode('import')}><span>📤</span> データインポート</button>
      </div>

      {mode==='export' && (<>
      {/* KPI */}
      <div className='an-kpi-grid'>
        <div className='an-kpi card'><div className='an-kpi-icon'>👥</div><div><div className='an-kpi-value'>{filtered.length}</div><div className='an-kpi-label'>表示中</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📋</div><div><div className='an-kpi-value'>{users.length}</div><div className='an-kpi-label'>全スタッフ</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📂</div><div><div className='an-kpi-value'>{cols.length}</div><div className='an-kpi-label'>表示列</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>🏥</div><div><div className='an-kpi-value'>{facilities.length}</div><div className='an-kpi-label'>施設数</div></div></div>
      </div>

      {/* Filters */}
      <div className='iv-filters card'>
        <div className='iv-filter-group'><label>施設:</label><select value={filterFac} onChange={e=>setFilterFac(e.target.value)}><option value='all'>すべて</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>職種:</label><select value={filterOcc} onChange={e=>setFilterOcc(e.target.value)}><option value='all'>すべて</option>{occupations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>ステータス:</label><select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}><option value='all'>すべて</option><option value='active'>在籍</option><option value='leave'>休職中</option></select></div>
        <div className='iv-filter-group'><label>検索:</label><input type='text' className='form-input' placeholder='氏名で検索...' value={searchName} onChange={e=>setSearchName(e.target.value)} style={{width:150}} /></div>
        <button className='btn btn-sm btn-secondary' onClick={()=>setShowColPicker(!showColPicker)} style={{marginLeft:'auto'}}>⚙️ 列設定</button>
      </div>

      {/* Column Picker */}
      {showColPicker && (
        <div className='card' style={{padding:'var(--space-3) var(--space-4)',marginBottom:'var(--space-4)'}}>
          <div style={{fontSize:'var(--font-size-sm)',fontWeight:600,marginBottom:8}}>表示する列を選択:</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:8}}>
            {ALL_COLUMNS.map(c => (
              <label key={c.key} style={{display:'flex',alignItems:'center',gap:4,fontSize:'var(--font-size-sm)',cursor:'pointer',padding:'4px 10px',borderRadius:'var(--radius-md)',background:visibleCols.has(c.key)?'var(--color-primary-50)':'var(--color-neutral-50)',border:'1px solid '+(visibleCols.has(c.key)?'var(--color-primary-200)':'var(--color-neutral-200)'),transition:'all 0.15s'}}>
                <input type='checkbox' checked={visibleCols.has(c.key)} onChange={()=>toggleCol(c.key)} style={{accentColor:'var(--color-primary-500)'}} />
                {c.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className='card' style={{overflow:'auto'}}>
        <table className='data-table' style={{minWidth:cols.length*120}}>
          <thead>
            <tr>
              <th style={{width:40,textAlign:'center'}}>#</th>
              {cols.map(c => (
                <th key={c.key} onClick={()=>handleSort(c.key)} style={{cursor:'pointer',whiteSpace:'nowrap',userSelect:'none'}}>
                  {c.label} {sortKey===c.key ? (sortAsc?'▲':'▼') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((u,i) => (
              <tr key={u.id}>
                <td style={{textAlign:'center',color:'var(--color-neutral-400)',fontSize:'var(--font-size-xs)'}}>{i+1}</td>
                {cols.map(c => {
                  const val = getCellValue(u, c.key);
                  let style: React.CSSProperties = {};
                  if (c.key==='status') {
                    style.color = u.status==='active'?'var(--color-success)':u.status==='leave'?'var(--color-warning)':'var(--color-neutral-400)';
                    style.fontWeight = 600;
                  }
                  if ((c.key==='mental'||c.key==='motivation') && val) {
                    const n = parseInt(val);
                    style.fontWeight = 600;
                    style.color = n>=70?'var(--color-success)':n>=50?'var(--color-warning)':'var(--color-danger)';
                  }
                  return <td key={c.key} style={style}>{val||'—'}</td>;
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length===0 && (
          <div style={{textAlign:'center',padding:'var(--space-8)',color:'var(--color-neutral-400)'}}>該当するスタッフがいません</div>
        )}
      </div>
      </>)}

      {/* ===== IMPORT MODE ===== */}
      {mode==='import' && (
        <div>
          <div className='card' style={{marginBottom:'var(--space-5)'}}>
            <div className='card-header'>
              <h3 className='card-title'>📤 CSVインポート</h3>
              <button className='btn btn-sm btn-secondary' onClick={downloadTemplate}>📋 テンプレートDL</button>
            </div>
            <div className='card-body'>
              {importStatus==='idle' && (
                <div>
                  <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)',marginBottom:'var(--space-4)'}}>スタッフデータのCSVファイルをアップロードしてください。「テンプレートDL」でフォーマットを取得できます。</p>
                  <div style={{border:'2px dashed var(--color-primary-200)',borderRadius:'var(--radius-lg)',padding:'var(--space-8)',textAlign:'center',background:'var(--color-primary-50)',cursor:'pointer'}} onClick={()=>document.getElementById('csv-upload')?.click()}>
                    <div style={{fontSize:'2.5rem',marginBottom:8}}>📁</div>
                    <div style={{fontWeight:600,marginBottom:4}}>クリックしてファイルを選択</div>
                    <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)'}}>CSVファイル（.csv）を選択してください</div>
                    <input id='csv-upload' type='file' accept='.csv' onChange={handleFileChange} style={{display:'none'}} />
                  </div>
                </div>
              )}
              {importStatus==='preview' && (
                <div>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'var(--space-4)'}}>
                    <div>
                      <span style={{fontWeight:600}}>📄 {importFile?.name}</span>
                      <span className='badge badge-primary' style={{marginLeft:8}}>{importData.length}件</span>
                    </div>
                    <div style={{display:'flex',gap:8}}>
                      <button className='btn btn-primary' onClick={handleImport}>✅ インポート実行</button>
                      <button className='btn btn-secondary' onClick={resetImport}>✕ キャンセル</button>
                    </div>
                  </div>
                  <div style={{overflow:'auto',maxHeight:400}}>
                    <table className='data-table' style={{fontSize:'var(--font-size-xs)'}}>
                      <thead><tr>{importHeaders.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
                      <tbody>{importData.slice(0,20).map((row,ri)=><tr key={ri}>{row.map((cell,ci)=><td key={ci}>{cell}</td>)}</tr>)}</tbody>
                    </table>
                    {importData.length>20 && <div style={{textAlign:'center',padding:8,fontSize:'var(--font-size-xs)',color:'var(--color-neutral-400)'}}>...{importData.length-20}件が非表示</div>}
                  </div>
                </div>
              )}
              {importStatus==='done' && (
                <div style={{textAlign:'center',padding:'var(--space-8)'}}>
                  <div style={{fontSize:'3rem',marginBottom:12}}>✅</div>
                  <div style={{fontWeight:700,fontSize:'var(--font-size-lg)',marginBottom:8}}>インポート完了（デモ）</div>
                  <div style={{color:'var(--color-neutral-500)',marginBottom:'var(--space-4)'}}>{importCount}件のスタッフデータを取り込みました。</div>
                  <button className='btn btn-primary' onClick={resetImport}>新規インポート</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}