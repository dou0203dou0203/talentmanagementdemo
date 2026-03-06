import { useState, useMemo } from 'react';
import { users as allUsers, occupations, facilities as allFacilities, facilityStaffingTargets as allTargets } from '../data/mockData';
import type { FacilityStaffingTarget } from '../types';
import { useAuth } from '../context/AuthContext';

export default function StaffingSimulation() {
    const { user: currentUser, permissions } = useAuth();
    const [selectedFacility, setSelectedFacility] = useState<string>('all');
    const [simTransfers, setSimTransfers] = useState<{ from: string; to: string; count: number }[]>([]);
    const [newHires, setNewHires] = useState<{ facility: string; occupation: string; count: number }[]>([]);

    // Editable targets (initialized from mock data)
    const [editableTargets, setEditableTargets] = useState<FacilityStaffingTarget[]>(() => [...allTargets]);
    const [editingTarget, setEditingTarget] = useState<string | null>(null); // key: "facId-occId"
    const [editValue, setEditValue] = useState<string>('');

    const isHR = currentUser?.role === 'hr_admin';

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
        return editableTargets.filter(t => facIds.has(t.facility_id));
    }, [facilities, editableTargets]);

    const activeUsers = users.filter((u) => u.status === 'active');

    const getStaffCount = (facId: string, occId: string) => {
        let base = activeUsers.filter((u) => u.facility_id === facId && u.occupation_id === occId).length;
        simTransfers.forEach((t) => { if (t.from === facId) base -= t.count; if (t.to === facId) base += t.count; });
        newHires.forEach((h) => { if (h.facility === facId && h.occupation === occId) base += h.count; });
        return Math.max(0, base);
    };

    const facilitiesToShow = selectedFacility === 'all' ? facilities : facilities.filter((f) => f.id === selectedFacility);

    const addTransfer = () => setSimTransfers([...simTransfers, { from: facilities[0].id, to: facilities[1]?.id || facilities[0].id, count: 1 }]);
    const addNewHire = () => setNewHires([...newHires, { facility: facilities[0].id, occupation: occupations[0].id, count: 1 }]);
    const removeTransfer = (i: number) => setSimTransfers(simTransfers.filter((_, idx) => idx !== i));
    const removeHire = (i: number) => setNewHires(newHires.filter((_, idx) => idx !== i));

    // Target editing handlers
    const startEdit = (facId: string, occId: string) => {
        const key = `${facId}-${occId}`;
        const existing = editableTargets.find(t => t.facility_id === facId && t.occupation_id === occId);
        setEditingTarget(key);
        setEditValue(existing ? String(existing.target_count) : '0');
    };

    const saveEdit = (facId: string, occId: string) => {
        const val = Math.max(0, parseInt(editValue) || 0);
        setEditableTargets(prev => {
            const idx = prev.findIndex(t => t.facility_id === facId && t.occupation_id === occId);
            if (idx >= 0) {
                if (val === 0) {
                    // Remove target
                    return prev.filter((_, i) => i !== idx);
                }
                const next = [...prev];
                next[idx] = { ...next[idx], target_count: val };
                return next;
            } else if (val > 0) {
                // Add new target
                return [...prev, { id: `fst-new-${Date.now()}`, facility_id: facId, occupation_id: occId, target_count: val }];
            }
            return prev;
        });
        setEditingTarget(null);
    };

    const cancelEdit = () => setEditingTarget(null);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="org-section-title" style={{ marginBottom: 0 }}>📋 事業所別人員配置状況 {simTransfers.length > 0 || newHires.length > 0 ? '（シミュレーション反映中）' : ''}</h3>
                    {isHR && (
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-primary-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>✏️</span> 基準値をクリックして編集できます
                        </div>
                    )}
                </div>
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
                                            const editKey = `${fac.id}-${o.id}`;
                                            const isEditing = editingTarget === editKey;

                                            return (
                                                <td key={o.id} className={isShort ? 'sim-short' : isOver ? 'sim-over' : ''}>
                                                    <span>{count}</span>
                                                    {isEditing ? (
                                                        <span className="sim-target-edit">
                                                            /
                                                            <input
                                                                type="number"
                                                                min={0}
                                                                max={99}
                                                                value={editValue}
                                                                onChange={(e) => setEditValue(e.target.value)}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') saveEdit(fac.id, o.id);
                                                                    if (e.key === 'Escape') cancelEdit();
                                                                }}
                                                                onBlur={() => saveEdit(fac.id, o.id)}
                                                                autoFocus
                                                                className="sim-target-input"
                                                            />
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`sim-target ${isHR ? 'sim-target-editable' : ''}`}
                                                            onClick={() => isHR && startEdit(fac.id, o.id)}
                                                            title={isHR ? 'クリックして基準値を編集' : ''}
                                                        >
                                                            {target ? `/${target.target_count}` : isHR ? '/—' : ''}
                                                        </span>
                                                    )}
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
