import { useState, useMemo } from 'react';
import { occupations, facilities } from '../data/mockData';

export default function RetiredStaff() {
  const [searchName, setSearchName] = useState('');
  const [filterFac, setFilterFac] = useState('all');
  const [filterOcc, setFilterOcc] = useState('all');

  // Mock retired staff (users with status 'inactive' or we add mock data)
  const retiredStaff = useMemo(() => {
    // Add mock retired data if none exist
    const mockRetired = [
      { id: 'ret-1', name: '山田太郎', occupation_id: 'occ-2', facility_id: 'fac-1', hire_date: '2019-04-01', retired_date: '2025-09-30', reason: '転職', years: 6.5 },
      { id: 'ret-2', name: '小川美樹', occupation_id: 'occ-4', facility_id: 'fac-3', hire_date: '2021-10-01', retired_date: '2025-06-15', reason: '家庭の事情', years: 3.7 },
      { id: 'ret-3', name: '渡辺健一', occupation_id: 'occ-3', facility_id: 'fac-2', hire_date: '2020-04-01', retired_date: '2025-03-31', reason: '体調不良', years: 5.0 },
      { id: 'ret-4', name: '松崎かおり', occupation_id: 'occ-5', facility_id: 'fac-4', hire_date: '2022-01-15', retired_date: '2025-12-31', reason: '転職', years: 3.9 },
      { id: 'ret-5', name: '村上淳', occupation_id: 'occ-1', facility_id: 'fac-5', hire_date: '2018-07-01', retired_date: '2026-01-31', reason: '定年退職', years: 7.6 },
    ];
    return mockRetired;
  }, []);

  const filtered = retiredStaff
    .filter(s => filterFac === 'all' || s.facility_id === filterFac)
    .filter(s => filterOcc === 'all' || s.occupation_id === filterOcc)
    .filter(s => !searchName.trim() || s.name.includes(searchName.trim()))
    .sort((a,b) => b.retired_date.localeCompare(a.retired_date));

  const avgYears = retiredStaff.length > 0 ? (retiredStaff.reduce((s,r) => s+r.years, 0) / retiredStaff.length).toFixed(1) : '0';
  const reasonCounts = retiredStaff.reduce((acc: Record<string,number>, r) => { acc[r.reason] = (acc[r.reason]||0)+1; return acc; }, {});

  return (
    <div className='fade-in'>
      <h2 className='page-title'>📋 退職者管理・職員名簿</h2>
      <p className='page-subtitle'>退職済み職員の情報を管理します</p>

      <div className='an-kpi-grid'>
        <div className='an-kpi card'><div className='an-kpi-icon'>👥</div><div><div className='an-kpi-value'>{retiredStaff.length}名</div><div className='an-kpi-label'>退職者総数</div></div></div>
        <div className='an-kpi card'><div className='an-kpi-icon'>📅</div><div><div className='an-kpi-value'>{avgYears}年</div><div className='an-kpi-label'>平均勤続年数</div></div></div>
        {Object.entries(reasonCounts).map(([reason, count]) => (
          <div key={reason} className='an-kpi card'><div className='an-kpi-icon'>{reason==='転職'?'🔀':reason==='定年退職'?'🏆':'📌'}</div><div><div className='an-kpi-value'>{count}名</div><div className='an-kpi-label'>{reason}</div></div></div>
        ))}
      </div>

      <div className='iv-filters card'>
        <div className='iv-filter-group'><label>施設:</label><select value={filterFac} onChange={e=>setFilterFac(e.target.value)}><option value='all'>すべて</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>職種:</label><select value={filterOcc} onChange={e=>setFilterOcc(e.target.value)}><option value='all'>すべて</option>{occupations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
        <div className='iv-filter-group'><label>検索:</label><input type='text' className='form-input' placeholder='名前で検索...' value={searchName} onChange={e=>setSearchName(e.target.value)} style={{width:160}} /></div>
        <div className='iv-count'>{filtered.length}件</div>
      </div>

      <div style={{display:'flex',flexDirection:'column',gap:'var(--space-3)'}}>
        {filtered.map(staff => {
          const occ = occupations.find(o => o.id === staff.occupation_id);
          const fac = facilities.find(f => f.id === staff.facility_id);
          return (
            <div key={staff.id} className='card' style={{padding:'var(--space-4)'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',gap:'var(--space-3)',alignItems:'center'}}>
                  <div className='sp-avatar' style={{width:40,height:40,fontSize:14,background:'var(--color-neutral-200)',color:'var(--color-neutral-500)'}}>{staff.name.charAt(0)}</div>
                  <div>
                    <div style={{fontWeight:600}}>{staff.name}</div>
                    <div style={{fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>{occ?.name} · {fac?.name}</div>
                  </div>
                </div>
                <div style={{display:'flex',gap:'var(--space-3)',alignItems:'center',flexWrap:'wrap'}}>
                  <div style={{fontSize:'var(--font-size-sm)'}}>入社: <strong>{staff.hire_date}</strong></div>
                  <div style={{fontSize:'var(--font-size-sm)'}}>退職: <strong>{staff.retired_date}</strong></div>
                  <div style={{fontSize:'var(--font-size-sm)'}}>勤続: <strong>{staff.years}年</strong></div>
                  <span className='sp-badge' style={{background:staff.reason==='転職'?'#fef2f2':staff.reason==='定年退職'?'#ecfdf5':'#f8fafb',color:staff.reason==='転職'?'#ef4444':staff.reason==='定年退職'?'#10b981':'#6b7a87'}}>{staff.reason}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}