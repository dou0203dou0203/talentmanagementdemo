import { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { facilityMutations } from '../lib/mutations';
import { useAuth } from '../context/AuthContext';

const FACILITY_ICONS: Record<string, string> = {
    '病院': '🏥', 'クリニック': '🏪', '介護施設': '🏠', '本部': '🏢',
    '訪問看護': '🩺', '訪問介護': '🤲', 'ケアプランセンター': '📋',
};

export default function OrgChart() {
    const { users: allUsers, occupations, facilities: allFacilities } = useData();
    const { user: currentUser, permissions } = useAuth();

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
                <h3 className="org-section-title">🏢 組織図（法人 → 事業所 → 職種）</h3>
                <div className="org-tree">
                    <div className="org-tree-root">
                        <div className="org-tree-node org-tree-corp" style={{ background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-accent-500))', color: '#fff', fontWeight: 700 }}>
                            <span className="org-tree-icon">🌸</span>
                            さくらの樹グループ
                            <span className="org-tree-count" style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>{totalActive}名</span>
                        </div>
                        <div className="org-tree-children">
                            {corpGroups.map((corp) => (
                                <div key={corp.name} className="org-tree-branch">
                                    <div className="org-tree-node org-tree-corp">
                                        <span className="org-tree-icon">🏛️</span>
                                        {corp.name}
                                        <span className="org-tree-count">{corp.totalActive}名</span>
                                    </div>
                                    <div className="org-tree-children">
                                        {corp.facilities.map((fac) => (
                                            <div key={fac.id} className="org-tree-branch">
                                                <div className="org-tree-node org-tree-facility">
                                                    <span className="org-tree-icon">
                                                        {FACILITY_ICONS[fac.type] || '🏢'}
                                                    </span>
                                                    {fac.name}
                                                    <span className="org-tree-badge">{fac.type}</span>
                                                    <span className="org-tree-count">{fac.total}名</span>
                                                </div>
                                                <div className="org-tree-children org-tree-occs">
                                                    {fac.occGroups.map((occ) => (
                                                        <div key={occ.id} className="org-tree-node org-tree-occ">
                                                            {occ.name}: <strong>{occ.count}名</strong>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
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
