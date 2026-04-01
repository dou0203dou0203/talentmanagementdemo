import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { facilityMutations } from '../lib/mutations';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const FACILITY_ICONS: Record<string, string> = {
    '病院': '🏥', 'クリニック': '🏪', '介護施設': '🏠', '本部': '🏢',
    '訪問看護': '🩺', '訪問介護': '🤲', 'ケアプランセンター': '📋',
};

export default function OrgChart() {
    const { users: allUsers, occupations, facilities: allFacilities } = useData();
    const { user: currentUser, permissions } = useAuth();
    const navigate = useNavigate();

    // Toggle state for expanding staff lists
    const [expandedCorps, setExpandedCorps] = useState<Set<string>>(new Set());
    const [expandedFacs, setExpandedFacs] = useState<Set<string>>(new Set());
    const [expandedOccs, setExpandedOccs] = useState<Set<string>>(new Set());

    const toggleCorp = (name: string) => {
        setExpandedCorps(prev => { const next = new Set(prev); if (next.has(name)) next.delete(name); else next.add(name); return next; });
    };
    const toggleFac = (id: string) => {
        setExpandedFacs(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
    };
    const toggleOcc = (key: string) => {
        setExpandedOccs(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
    };

    const [showAddCorp, setShowAddCorp] = useState(false);
    const [showAddFac, setShowAddFac] = useState(false);
    const [newCorpName, setNewCorpName] = useState('');
    const [newFacName, setNewFacName] = useState('');
    const [newFacType, setNewFacType] = useState('病院');
    const [newFacCorp, setNewFacCorp] = useState('');
    const [addToast, setAddToast] = useState<string|null>(null);
    const handleAddCorp = () => { if (!newCorpName.trim()) return; setAddToast('法人「'+newCorpName.trim()+'」を追加しました（デモ）'); setNewCorpName(''); setShowAddCorp(false); setTimeout(()=>setAddToast(null),3000); };
    const handleAddFac = () => { if (!newFacName.trim()||!newFacCorp) return; facilityMutations.addFacility({ id:'fac-'+Date.now(), name:newFacName.trim(), type:newFacType, corporation:newFacCorp });
    setAddToast('事業所「'+newFacName.trim()+'」を追加しました'); setNewFacName(''); setShowAddFac(false); setTimeout(()=>setAddToast(null),3000); };
    const corpNames = useMemo(() => [...new Set(allFacilities.map(f=>f.corporation||'未分類'))], []);

    const users = useMemo(() => {
        if (permissions.canViewAllStaff) return allUsers;
        if (permissions.canViewFacility) return allUsers.filter(u => u.facility_id === currentUser?.facility_id);
        return allUsers.filter(u => u.id === currentUser?.id);
    }, [currentUser, permissions]);
    const facilities = useMemo(() => {
        if (permissions.canViewAllStaff) return allFacilities;
        return allFacilities.filter(f => f.id === currentUser?.facility_id);
    }, [currentUser, permissions]);

    // Group facilities by corporation
    const corpGroups = useMemo(() => {
        const map: Record<string, typeof allFacilities> = {};
        facilities.forEach((f) => {
            const corp = f.corporation || '未分類';
            if (!map[corp]) map[corp] = [];
            map[corp].push(f);
        });
        return Object.entries(map).map(([corpName, corpFacilities]) => {
            const corpUsers = users.filter(u => corpFacilities.some(f => f.id === u.facility_id) && u.status === 'active');
            const facilityDetails = corpFacilities.map((fac) => {
                const facUsers = users.filter(u => u.facility_id === fac.id && u.status === 'active');
                const occGroups = occupations.map(occ => ({
                    ...occ,
                    count: facUsers.filter(u => u.occupation_id === occ.id).length,
                })).filter(g => g.count > 0);
                return { ...fac, users: facUsers, occGroups, total: facUsers.length };
            });
            return { name: corpName, facilities: facilityDetails, totalActive: corpUsers.length };
        });
    }, [facilities, users]);

    const totalActive = users.filter(u => u.status === 'active').length;
    const totalLeave = users.filter(u => u.status === 'leave').length;
    const totalCorps = corpGroups.length;

    // Age distribution
    const ageGroups = getAgeDistribution(users);
    // Tenure distribution
    const tenureGroups = getTenureDistribution(users);

    // All facility groups flat for bar chart
    const allFacilityGroups = corpGroups.flatMap(c => c.facilities);

    return (
        <div className="org-page">
            {/* Summary Cards */}
            <div className="org-summary">
                <div className="org-stat card">
                    <div className="org-stat-value">{totalActive}</div>
                    <div className="org-stat-label">在籍者数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{totalLeave}</div>
                    <div className="org-stat-label">休職者数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{totalCorps}</div>
                    <div className="org-stat-label">法人数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{facilities.length}</div>
                    <div className="org-stat-label">事業所数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{occupations.length}</div>
                    <div className="org-stat-label">職種数</div>
                </div>
            </div>

            {/* Add Corporation / Facility */}
            {permissions.canEditStaff && (
              <div style={{display:'flex',gap:'var(--space-3)',marginBottom:'var(--space-5)',flexWrap:'wrap'}}>
                <button className='btn btn-primary' onClick={()=>{setShowAddCorp(true);setShowAddFac(false);}}>🏛️ 法人追加</button>
                <button className='btn btn-secondary' onClick={()=>{setShowAddFac(true);setShowAddCorp(false);}}>🏥 事業所追加</button>
              </div>
            )}

            {showAddCorp && (
              <div className='card' style={{marginBottom:'var(--space-5)',borderColor:'var(--color-primary-200)',borderStyle:'dashed'}}>
                <div className='card-header'><h3 className='card-title'>🏛️ 新規法人追加</h3></div>
                <div className='card-body'>
                  <div style={{display:'flex',gap:'var(--space-3)',alignItems:'end',flexWrap:'wrap'}}>
                    <div className='form-group' style={{flex:'1 1 250px',marginBottom:0}}>
                      <label className='form-label'>法人名</label>
                      <input type='text' className='form-input' placeholder='例: 株式会社XXX' value={newCorpName} onChange={e=>setNewCorpName(e.target.value)} />
                    </div>
                    <button className='btn btn-primary' onClick={handleAddCorp} disabled={!newCorpName.trim()}>追加</button>
                    <button className='btn btn-secondary' onClick={()=>setShowAddCorp(false)}>キャンセル</button>
                  </div>
                </div>
              </div>
            )}

            {showAddFac && (
              <div className='card' style={{marginBottom:'var(--space-5)',borderColor:'var(--color-primary-200)',borderStyle:'dashed'}}>
                <div className='card-header'><h3 className='card-title'>🏥 新規事業所追加</h3></div>
                <div className='card-body'>
                  <div style={{display:'flex',gap:'var(--space-3)',alignItems:'end',flexWrap:'wrap'}}>
                    <div className='form-group' style={{flex:'1 1 200px',marginBottom:0}}>
                      <label className='form-label'>事業所名</label>
                      <input type='text' className='form-input' placeholder='例: さくらの樹南院' value={newFacName} onChange={e=>setNewFacName(e.target.value)} />
                    </div>
                    <div className='form-group' style={{flex:'0 0 150px',marginBottom:0}}>
                      <label className='form-label'>種別</label>
                      <select className='form-select' value={newFacType} onChange={e=>setNewFacType(e.target.value)}>
                        <option>病院</option><option>クリニック</option><option>介護施設</option><option>訪問看護</option><option>訪問介護</option><option>ケアプランセンター</option><option>本部</option>
                      </select>
                    </div>
                    <div className='form-group' style={{flex:'0 0 200px',marginBottom:0}}>
                      <label className='form-label'>所属法人</label>
                      <select className='form-select' value={newFacCorp} onChange={e=>setNewFacCorp(e.target.value)}>
                        <option value=''>選択してください</option>
                        {corpNames.map(c=><option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <button className='btn btn-primary' onClick={handleAddFac} disabled={!newFacName.trim()||!newFacCorp}>追加</button>
                    <button className='btn btn-secondary' onClick={()=>setShowAddFac(false)}>キャンセル</button>
                  </div>
                </div>
              </div>
            )}

            {/* Toast */}
            {addToast && (
              <div style={{position:'fixed',bottom:24,right:24,padding:'12px 24px',background:'var(--color-success)',color:'#fff',borderRadius:'var(--radius-lg)',fontWeight:600,boxShadow:'var(--shadow-lg)',zIndex:9999,animation:'fadeIn 0.3s'}}>✅ {addToast}</div>
            )}

            {/* Organization Tree */}
            <div className="card" style={{ padding: 24 }}>
                <h3 className="org-section-title">🏢 組織図（法人 → 事業所 → 職種）<span style={{fontSize:'var(--font-size-xs)',fontWeight:400,color:'var(--color-neutral-400)',marginLeft:8}}>※クリックで職員一覧を展開</span></h3>
                <div className="org-tree">
                    <div className="org-tree-root">
                        <div className="org-tree-node org-tree-corp" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))', color: '#fff', fontWeight: 700 }}>
                            <span className="org-tree-icon">🌸</span>
                            さくらの樹グループ
                            <span className="org-tree-count" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>{totalActive}名</span>
                        </div>
                        <div className="org-tree-children">
                            {corpGroups.map((corp) => {
                                const corpKey = 'corp-' + corp.name;
                                const isCorpExpanded = expandedCorps.has(corpKey);
                                const corpUsers = corp.facilities.flatMap(f => f.users);
                                return (
                                <div key={corp.name} className="org-tree-branch">
                                    <div
                                        className="org-tree-node org-tree-corp"
                                        onClick={() => toggleCorp(corpKey)}
                                        style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s' }}
                                        title="クリックで職員一覧を展開"
                                    >
                                        <span className="org-tree-icon">🏛️</span>
                                        <span style={{ marginRight: 4, fontSize: '0.7em', opacity: 0.6 }}>{isCorpExpanded ? '▼' : '▶'}</span>
                                        {corp.name}
                                        <span className="org-tree-count">{corp.totalActive}名</span>
                                    </div>
                                    {/* Corporation staff list */}
                                    {isCorpExpanded && (
                                        <div style={{
                                            margin: '4px 0 8px 24px', padding: '8px 12px',
                                            background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)',
                                            border: '1px solid var(--color-neutral-200)',
                                            animation: 'fadeIn 0.2s ease',
                                        }}>
                                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 6, fontWeight: 600 }}>👥 {corp.name} 所属職員（{corpUsers.length}名）</div>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 4 }}>
                                                {corpUsers.map(u => {
                                                    const occ = occupations.find(o => o.id === u.occupation_id);
                                                    return (
                                                        <div key={u.id}
                                                            onClick={(e) => { e.stopPropagation(); navigate('/staff/' + u.id); }}
                                                            style={{
                                                                fontSize: 'var(--font-size-xs)', padding: '4px 8px',
                                                                borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                                                display: 'flex', alignItems: 'center', gap: 6,
                                                                transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                                                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                        >
                                                            <span style={{
                                                                width: 22, height: 22, borderRadius: '50%',
                                                                background: 'var(--color-primary-100)', color: 'var(--color-primary-700)',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                                            }}>{u.name.charAt(0)}</span>
                                                            <span style={{ fontWeight: 500 }}>{u.name}</span>
                                                            <span style={{ color: 'var(--color-neutral-400)', marginLeft: 'auto' }}>{occ?.name || ''}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                    <div className="org-tree-children">
                                        {corp.facilities.map((fac) => {
                                            const facKey = 'fac-' + fac.id;
                                            const isFacExpanded = expandedFacs.has(facKey);
                                            return (
                                            <div key={fac.id} className="org-tree-branch">
                                                <div
                                                    className="org-tree-node org-tree-facility"
                                                    onClick={() => toggleFac(facKey)}
                                                    style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s' }}
                                                    title="クリックで職員一覧を展開"
                                                >
                                                    <span className="org-tree-icon">
                                                        {FACILITY_ICONS[fac.type] || '🏢'}
                                                    </span>
                                                    <span style={{ marginRight: 4, fontSize: '0.7em', opacity: 0.6 }}>{isFacExpanded ? '▼' : '▶'}</span>
                                                    {fac.name}
                                                    <span className="org-tree-badge">{fac.type}</span>
                                                    <span className="org-tree-count">{fac.total}名</span>
                                                </div>
                                                {/* Facility staff list */}
                                                {isFacExpanded && (
                                                    <div style={{
                                                        margin: '4px 0 8px 24px', padding: '8px 12px',
                                                        background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-md)',
                                                        border: '1px solid var(--color-neutral-200)',
                                                        animation: 'fadeIn 0.2s ease',
                                                    }}>
                                                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 6, fontWeight: 600 }}>👥 {fac.name} 所属職員（{fac.total}名）</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 4 }}>
                                                            {fac.users.map(u => {
                                                                const occ = occupations.find(o => o.id === u.occupation_id);
                                                                return (
                                                                    <div key={u.id}
                                                                        onClick={(e) => { e.stopPropagation(); navigate('/staff/' + u.id); }}
                                                                        style={{
                                                                            fontSize: 'var(--font-size-xs)', padding: '4px 8px',
                                                                            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                                                            display: 'flex', alignItems: 'center', gap: 6,
                                                                            transition: 'background 0.15s',
                                                                        }}
                                                                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                                    >
                                                                        <span style={{
                                                                            width: 22, height: 22, borderRadius: '50%',
                                                                            background: 'var(--color-accent-100)', color: 'var(--color-accent-700)',
                                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                            fontSize: '0.65rem', fontWeight: 700, flexShrink: 0,
                                                                        }}>{u.name.charAt(0)}</span>
                                                                        <span style={{ fontWeight: 500 }}>{u.name}</span>
                                                                        <span style={{ color: 'var(--color-neutral-400)' }}>{u.position || ''}</span>
                                                                        <span style={{ color: 'var(--color-neutral-400)', marginLeft: 'auto', fontSize: '0.65rem' }}>{occ?.name || ''}</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="org-tree-children org-tree-occs">
                                                    {fac.occGroups.map((occ) => {
                                                        const occKey = fac.id + '-' + occ.id;
                                                        const isOccExpanded = expandedOccs.has(occKey);
                                                        const occUsers = fac.users.filter(u => u.occupation_id === occ.id);
                                                        return (
                                                            <div key={occ.id}>
                                                                <div
                                                                    className="org-tree-node org-tree-occ"
                                                                    onClick={() => toggleOcc(occKey)}
                                                                    style={{ cursor: 'pointer', userSelect: 'none', transition: 'all 0.15s' }}
                                                                    title="クリックで職員一覧を展開"
                                                                >
                                                                    <span style={{ fontSize: '0.7em', opacity: 0.6, marginRight: 4 }}>{isOccExpanded ? '▼' : '▶'}</span>
                                                                    {occ.name}: <strong>{occ.count}名</strong>
                                                                </div>
                                                                {isOccExpanded && (
                                                                    <div style={{
                                                                        margin: '2px 0 6px 16px', padding: '6px 10px',
                                                                        background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-sm)',
                                                                        border: '1px solid var(--color-neutral-100)',
                                                                        animation: 'fadeIn 0.2s ease',
                                                                    }}>
                                                                        {occUsers.map(u => (
                                                                            <div key={u.id}
                                                                                onClick={(e) => { e.stopPropagation(); navigate('/staff/' + u.id); }}
                                                                                style={{
                                                                                    fontSize: 'var(--font-size-xs)', padding: '3px 6px',
                                                                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                                                                    display: 'flex', alignItems: 'center', gap: 6,
                                                                                    transition: 'background 0.15s',
                                                                                }}
                                                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                                                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                                            >
                                                                                <span style={{
                                                                                    width: 20, height: 20, borderRadius: '50%',
                                                                                    background: 'var(--color-success-bg, #e8f5e9)', color: 'var(--color-success)',
                                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                                    fontSize: '0.6rem', fontWeight: 700, flexShrink: 0,
                                                                                }}>{u.name.charAt(0)}</span>
                                                                                <span style={{ fontWeight: 500 }}>{u.name}</span>
                                                                                <span style={{ color: 'var(--color-neutral-400)', marginLeft: 'auto' }}>{u.position || u.employment_type || ''}</span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Facility Staff Composition */}
            <div className="card" style={{ padding: 24 }}>
                <h3 className="org-section-title">📊 事業所別人員構成</h3>
                <div className="org-bar-chart">
                    {allFacilityGroups.map((fac) => (
                        <div key={fac.id} className="org-bar-row">
                            <div className="org-bar-label">{fac.name}</div>
                            <div className="org-bar-track">
                                {fac.occGroups.map((occ, i) => (
                                    <div
                                        key={occ.id}
                                        className="org-bar-segment"
                                        style={{
                                            width: `${(occ.count / Math.max(fac.total, 1)) * 100}%`,
                                            background: occColors[i % occColors.length],
                                        }}
                                        title={`${occ.name}: ${occ.count}名`}
                                    />
                                ))}
                            </div>
                            <div className="org-bar-total">{fac.total}</div>
                        </div>
                    ))}
                </div>
                <div className="org-legend">
                    {occupations.map((occ, i) => (
                        <div key={occ.id} className="org-legend-item">
                            <span className="org-legend-dot" style={{ background: occColors[i % occColors.length] }} />
                            {occ.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Age & Tenure Distribution */}
            <div className="org-distributions">
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="org-section-title">👥 年齢構成</h3>
                    <div className="org-dist-chart">
                        {ageGroups.map((g) => (
                            <div key={g.label} className="org-dist-bar">
                                <div className="org-dist-fill" style={{ height: `${(g.count / Math.max(...ageGroups.map((a) => a.count), 1)) * 100}%` }} />
                                <div className="org-dist-label">{g.label}</div>
                                <div className="org-dist-value">{g.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="org-section-title">📅 勤続年数分布</h3>
                    <div className="org-dist-chart">
                        {tenureGroups.map((g) => (
                            <div key={g.label} className="org-dist-bar">
                                <div className="org-dist-fill org-dist-fill-green" style={{ height: `${(g.count / Math.max(...tenureGroups.map((t) => t.count), 1)) * 100}%` }} />
                                <div className="org-dist-label">{g.label}</div>
                                <div className="org-dist-value">{g.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const occColors = ['#d4739b', '#8db93e', '#3b82f6', '#f59e0b', '#6b7a87', '#ef4444', '#8b5cf6'];

function getAgeDistribution(users: any[]) {
    const now = new Date();
    const groups = [
        { label: '~29', min: 0, max: 29, count: 0 },
        { label: '30代', min: 30, max: 39, count: 0 },
        { label: '40代', min: 40, max: 49, count: 0 },
        { label: '50代', min: 50, max: 59, count: 0 },
        { label: '60~', min: 60, max: 99, count: 0 },
    ];
    users.forEach((u) => {
        if (u.birth_date) {
            const age = Math.floor((now.getTime() - new Date(u.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const g = groups.find((g) => age >= g.min && age <= g.max);
            if (g) g.count++;
        }
    });
    return groups;
}

function getTenureDistribution(users: any[]) {
    const now = new Date();
    const groups = [
        { label: '~1年', min: 0, max: 1, count: 0 },
        { label: '2-5年', min: 2, max: 5, count: 0 },
        { label: '6-10年', min: 6, max: 10, count: 0 },
        { label: '11-20年', min: 11, max: 20, count: 0 },
        { label: '21年~', min: 21, max: 99, count: 0 },
    ];
    users.forEach((u) => {
        if (u.hire_date) {
            const tenure = Math.floor((now.getTime() - new Date(u.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const g = groups.find((g) => tenure >= g.min && tenure <= g.max);
            if (g) g.count++;
        }
    });
    return groups;
}
