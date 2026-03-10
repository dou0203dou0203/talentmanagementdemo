import { useState } from 'react';
import { users, occupations, facilities, evaluations, evaluationTemplateItems } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export default function EvaluationHistory() {
    const { user: currentUser, permissions } = useAuth();
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterPeriod, setFilterPeriod] = useState<string>('all');
    const [filterFacility, setFilterFacility] = useState<string>('all');
    const [filterOcc, setFilterOcc] = useState<string>('all');
    const [filterCorp, setFilterCorp] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const visibleUsers = permissions.canViewAllStaff
        ? users
        : permissions.canViewFacility
            ? users.filter((u) => u.facility_id === currentUser?.facility_id)
            : users.filter((u) => u.id === currentUser?.id);

    const periods = [...new Set(evaluations.map((e) => e.period))].sort().reverse();
    const corporations = [...new Set(facilities.map(f => f.corporation))];

    const filtered = evaluations
        .filter((e) => filterUser === 'all' || e.user_id === filterUser)
        .filter((e) => filterPeriod === 'all' || e.period === filterPeriod)
        .filter((e) => { if (filterFacility === 'all') return true; const s = users.find(u => u.id === e.user_id); return s?.facility_id === filterFacility; })
        .filter((e) => { if (filterOcc === 'all') return true; const s = users.find(u => u.id === e.user_id); return s?.occupation_id === filterOcc; })
        .filter((e) => { if (filterCorp === 'all') return true; const s = users.find(u => u.id === e.user_id); const f = facilities.find(fa => fa.id === s?.facility_id); return f?.corporation === filterCorp; })
        .filter((e) => visibleUsers.some((u) => u.id === e.user_id))
        .sort((a, b) => b.period.localeCompare(a.period));

    const statusLabel: Record<string, { text: string; class: string }> = {
        draft: { text: '下書き', class: 'ev-status-draft' },
        submitted: { text: '提出済み', class: 'ev-status-submitted' },
        approved: { text: '承認済み', class: 'ev-status-approved' },
    };

    return (
        <div className="eval-history-page">
            <div className="ev-filters card">
                <div className="iv-filter-group">
                    <label>職員:</label>
                    <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                        <option value="all">すべて</option>
                        {visibleUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>期間:</label>
                    <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                        <option value="all">すべて</option>
                        {periods.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                </div>
                <div className="iv-filter-group">
                    <label>法人:</label>
                    <select value={filterCorp} onChange={(e) => setFilterCorp(e.target.value)}>
                        <option value="all">すべて</option>
                        {corporations.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>事業所:</label>
                    <select value={filterFacility} onChange={(e) => setFilterFacility(e.target.value)}>
                        <option value="all">すべて</option>
                        {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>職種:</label>
                    <select value={filterOcc} onChange={(e) => setFilterOcc(e.target.value)}>
                        <option value="all">すべて</option>
                        {occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                </div>
                <div className="iv-count">{filtered.length}件</div>
            </div>

            <div className="ev-list">
                {filtered.length === 0 ? (
                    <div className="card sp-empty">評価記録はありません</div>
                ) : (
                    filtered.map((ev) => {
                        const staff = users.find((u) => u.id === ev.user_id);
                        const evaluator = users.find((u) => u.id === ev.evaluator_id);
                        const occ = occupations.find((o) => o.id === staff?.occupation_id);
                        const fac = facilities.find((f) => f.id === staff?.facility_id);
                        const avgScore = ev.scores.length > 0
                            ? (ev.scores.reduce((s, sc) => s + sc.score, 0) / ev.scores.length).toFixed(1)
                            : '—';
                        const isExpanded = expandedId === ev.id;
                        const st = statusLabel[ev.status] || { text: ev.status, class: '' };

                        return (
                            <div key={ev.id} className={`ev-card card ${isExpanded ? 'expanded' : ''}`}>
                                <div className="ev-card-header" onClick={() => setExpandedId(isExpanded ? null : ev.id)}>
                                    <div className="iv-card-left">
                                        <div className="ev-score-circle">
                                            <span className="ev-score-num">{avgScore}</span>
                                        </div>
                                        <div>
                                            <div className="iv-card-name">{staff?.name || '不明'}</div>
                                            <div className="iv-card-meta">{occ?.name} · {fac?.name}</div>
                                        </div>
                                    </div>
                                    <div className="iv-card-right">
                                        <span className={`sp-badge ${st.class}`}>{st.text}</span>
                                        <span className="ev-period">{ev.period}</span>
                                        <span className="iv-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="ev-card-body">
                                        <div className="ev-meta-row">
                                            <span>評価者: <strong>{evaluator?.name || '不明'}</strong></span>
                                            <span>更新日: {ev.updated_at}</span>
                                        </div>

                                        {ev.scores.length > 0 && (
                                            <table className="sp-table">
                                                <thead><tr><th>評価項目</th><th>スコア</th><th>コメント</th></tr></thead>
                                                <tbody>
                                                    {ev.scores.map((sc) => {
                                                        const item = evaluationTemplateItems.find((t) => t.id === sc.item_id);
                                                        return (
                                                            <tr key={sc.item_id}>
                                                                <td>{item?.question || sc.item_id}</td>
                                                                <td>
                                                                    <div className="ev-score-bar">
                                                                        <div className="ev-score-fill" style={{ width: `${(sc.score / 5) * 100}%` }} />
                                                                        <span>{sc.score}/5</span>
                                                                    </div>
                                                                </td>
                                                                <td className="ev-comment">{sc.comment || '—'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        )}

                                        {ev.overall_comment && (
                                            <div className="ev-overall">
                                                <strong>総合コメント:</strong>
                                                <p>{ev.overall_comment}</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
