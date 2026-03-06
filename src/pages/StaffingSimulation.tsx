import { useState, useMemo } from 'react';
import { users as allUsers, occupations, facilities as allFacilities, facilityStaffingTargets as allTargets } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export default function StaffingSimulation() {
    const { user: currentUser, permissions } = useAuth();
    const [selectedFacility, setSelectedFacility] = useState<string>('all');
    const [simTransfers, setSimTransfers] = useState<{ from: string; to: string; count: number }[]>([]);
    const [newHires, setNewHires] = useState<{ facility: string; occupation: string; count: number }[]>([]);

    const facilities = useMemo(() => {
        if (permissions.canViewAllStaff) return allFacilities;
        return allFacilities.filter(f => f.id === currentUser?.facility_id);
    }, [currentUser, permissions]);
    const users = useMemo(() => {
        if (permissions.canViewAllStaff) return allUsers;
        if (permissions.canViewFacility) return allUsers.filter(u => u.facility_id === currentUser?.facility_id);
        return allUsers.filter(u => u.id === currentUser?.id);
    }, [currentUser, permissions]);
    const facilityStaffingTargets = useMemo(() => {
        const facIds = new Set(facilities.map(f => f.id));
        return allTargets.filter(t => facIds.has(t.facility_id));
    }, [facilities]);

    const activeUsers = users.filter((u) => u.status === 'active');

    // Current staffing per facility/occupation
    const getStaffCount = (facId: string, occId: string) => {
        let base = activeUsers.filter((u) => u.facility_id === facId && u.occupation_id === occId).length;
        // apply sim transfers
        simTransfers.forEach((t) => {
            if (t.from === facId) base -= t.count;
            if (t.to === facId) base += t.count;
        });
        // apply new hires
        newHires.forEach((h) => {
            if (h.facility === facId && h.occupation === occId) base += h.count;
        });
        return Math.max(0, base);
    };

    const facilitiesToShow = selectedFacility === 'all' ? facilities : facilities.filter((f) => f.id === selectedFacility);

    const addTransfer = () => {
        setSimTransfers([...simTransfers, { from: facilities[0].id, to: facilities[1]?.id || facilities[0].id, count: 1 }]);
    };

    const addNewHire = () => {
        setNewHires([...newHires, { facility: facilities[0].id, occupation: occupations[0].id, count: 1 }]);
    };

    const removeTransfer = (i: number) => setSimTransfers(simTransfers.filter((_, idx) => idx !== i));
    const removeHire = (i: number) => setNewHires(newHires.filter((_, idx) => idx !== i));

    return (
        <div className="sim-page">
            {/* Facility Filter */}
            <div className="iv-filters card">
                <div className="iv-filter-group">
                    <label>事業所:</label>
                    <select value={selectedFacility} onChange={(e) => setSelectedFacility(e.target.value)}>
                        <option value="all">すべて</option>
                        {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
            </div>

            {/* Current Staffing Table */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 className="org-section-title">📋 事業所別人員配置状況 {simTransfers.length > 0 || newHires.length > 0 ? '（シミュレーション反映中）' : ''}</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table className="sim-table">
                        <thead>
                            <tr>
                                <th>事業所</th>
                                {occupations.map((o) => <th key={o.id}>{o.name}</th>)}
                                <th>合計</th>
                                <th>充足率</th>
                            </tr>
                        </thead>
                        <tbody>
                            {facilitiesToShow.map((fac) => {
                                const total = occupations.reduce((s, o) => s + getStaffCount(fac.id, o.id), 0);
                                const targetTotal = facilityStaffingTargets
                                    .filter((t) => t.facility_id === fac.id)
                                    .reduce((s, t) => s + t.target_count, 0);
                                const rate = targetTotal > 0 ? ((total / targetTotal) * 100).toFixed(0) : '—';

                                return (
                                    <tr key={fac.id}>
                                        <td className="sim-fac-name">{fac.name}</td>
                                        {occupations.map((o) => {
                                            const count = getStaffCount(fac.id, o.id);
                                            const target = facilityStaffingTargets.find((t) => t.facility_id === fac.id && t.occupation_id === o.id);
                                            const isShort = target && count < target.target_count;
                                            const isOver = target && count > target.target_count;
                                            return (
                                                <td key={o.id} className={isShort ? 'sim-short' : isOver ? 'sim-over' : ''}>
                                                    {count}
                                                    {target && <span className="sim-target">/{target.target_count}</span>}
                                                </td>
                                            );
                                        })}
                                        <td><strong>{total}</strong></td>
                                        <td>
                                            <span className={`sp-badge ${Number(rate) >= 100 ? 'sp-badge-active' : Number(rate) >= 80 ? 'sp-badge' : 'sp-badge-warn'}`}>
                                                {rate}%
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Simulation Controls */}
            <div className="sim-controls">
                {/* Transfer Simulation */}
                <div className="card" style={{ padding: 24, flex: 1 }}>
                    <h3 className="org-section-title">🔄 異動シミュレーション</h3>
                    {simTransfers.map((t, i) => (
                        <div key={i} className="sim-row">
                            <select value={t.from} onChange={(e) => {
                                const next = [...simTransfers]; next[i].from = e.target.value; setSimTransfers(next);
                            }}>
                                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <span className="sim-arrow">→</span>
                            <select value={t.to} onChange={(e) => {
                                const next = [...simTransfers]; next[i].to = e.target.value; setSimTransfers(next);
                            }}>
                                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <input type="number" min={1} max={10} value={t.count} className="sim-count-input"
                                onChange={(e) => {
                                    const next = [...simTransfers]; next[i].count = Number(e.target.value); setSimTransfers(next);
                                }}
                            />
                            <span>名</span>
                            <button className="sim-remove" onClick={() => removeTransfer(i)}>✕</button>
                        </div>
                    ))}
                    <button className="sim-add-btn" onClick={addTransfer}>+ 異動を追加</button>
                </div>

                {/* New Hire Simulation */}
                <div className="card" style={{ padding: 24, flex: 1 }}>
                    <h3 className="org-section-title">➕ 新規採用シミュレーション</h3>
                    {newHires.map((h, i) => (
                        <div key={i} className="sim-row">
                            <select value={h.facility} onChange={(e) => {
                                const next = [...newHires]; next[i].facility = e.target.value; setNewHires(next);
                            }}>
                                {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                            </select>
                            <select value={h.occupation} onChange={(e) => {
                                const next = [...newHires]; next[i].occupation = e.target.value; setNewHires(next);
                            }}>
                                {occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                            </select>
                            <input type="number" min={1} max={10} value={h.count} className="sim-count-input"
                                onChange={(e) => {
                                    const next = [...newHires]; next[i].count = Number(e.target.value); setNewHires(next);
                                }}
                            />
                            <span>名</span>
                            <button className="sim-remove" onClick={() => removeHire(i)}>✕</button>
                        </div>
                    ))}
                    <button className="sim-add-btn" onClick={addNewHire}>+ 採用を追加</button>
                </div>
            </div>

            {simTransfers.length > 0 || newHires.length > 0 ? (
                <div className="sim-reset-bar">
                    <button className="sim-reset-btn" onClick={() => { setSimTransfers([]); setNewHires([]); }}>
                        🔄 シミュレーションをリセット
                    </button>
                </div>
            ) : null}
        </div>
    );
}
