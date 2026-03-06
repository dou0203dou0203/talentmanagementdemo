import { useState } from 'react';
import { users, occupations, facilities, interviewLogs } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import type { InterviewType, InterviewLog } from '../types';

export default function InterviewRecords() {
    const { user: currentUser, permissions } = useAuth();
    const [filterFacility, setFilterFacility] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingLog, setEditingLog] = useState<InterviewLog | null>(null);
    const [form, setForm] = useState({ user_id: '', type: '定期面談' as string, summary: '', details: '', mood: 3 as number, action_items: '' });

    // Filter users based on permissions
    const visibleUserIds = new Set(
        (permissions.canViewAllStaff
            ? users
            : permissions.canViewFacility
                ? users.filter((u) => u.facility_id === currentUser?.facility_id)
                : users.filter((u) => u.id === currentUser?.id)
        ).map((u) => u.id)
    );

    const filteredLogs = interviewLogs
        .filter((log) => visibleUserIds.has(log.user_id))
        .filter((log) => filterFacility === 'all' || users.find((u) => u.id === log.user_id)?.facility_id === filterFacility)
        .filter((log) => filterType === 'all' || log.type === filterType)
        .sort((a, b) => b.date.localeCompare(a.date));

    const interviewTypes: InterviewType[] = ['定期面談', '1on1', 'フォローアップ', 'キャリア面談', 'その他'];
    const moodEmoji = ['', '😫', '😟', '😐', '😊', '😄'];
    const moodColors = ['', '#ef4444', '#f59e0b', '#6b7a87', '#22c55e', '#10b981'];

    const visibleUsers = permissions.canViewAllStaff
        ? users.filter((u) => u.status === 'active')
        : permissions.canViewFacility
            ? users.filter((u) => u.facility_id === currentUser?.facility_id && u.status === 'active')
            : users.filter((u) => u.id === currentUser?.id);

    const startAdd = () => {
        setForm({ user_id: visibleUsers[0]?.id || '', type: '定期面談', summary: '', details: '', mood: 3, action_items: '' });
        setEditingLog(null);
        setShowForm(true);
    };

    const startEdit = (log: InterviewLog) => {
        setForm({ user_id: log.user_id, type: log.type, summary: log.summary, details: log.details, mood: log.mood, action_items: log.action_items.join('\n') });
        setEditingLog(log);
        setShowForm(true);
    };

    const saveForm = () => {
        if (!form.summary || !form.user_id) { alert('対象者と概要は必須です'); return; }
        const staffName = users.find((u) => u.id === form.user_id)?.name || '';
        alert(editingLog ? `${staffName}の面談記録を更新しました（デモ）` : `${staffName}の面談記録を追加しました（デモ）`);
        setShowForm(false);
    };

    return (
        <div className="interview-page">
            {/* Filters */}
            <div className="iv-filters card">
                <div className="iv-filter-group">
                    <label>施設:</label>
                    <select value={filterFacility} onChange={(e) => setFilterFacility(e.target.value)}>
                        <option value="all">すべて</option>
                        {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>種別:</label>
                    <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="all">すべて</option>
                        {interviewTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="iv-count">{filteredLogs.length}件の面談記録</div>
                {permissions.canEditInterviews && (
                    <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={startAdd}>＋ 面談記録を追加</button>
                )}
            </div>

            {/* Interview List */}
            <div className="iv-list">
                {filteredLogs.length === 0 ? (
                    <div className="card" style={{ padding: 40, textAlign: 'center', color: '#9aa5b0' }}>
                        面談記録はありません
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        const staff = users.find((u) => u.id === log.user_id);
                        const interviewer = users.find((u) => u.id === log.interviewer_id);
                        const occ = occupations.find((o) => o.id === staff?.occupation_id);
                        const fac = facilities.find((f) => f.id === staff?.facility_id);
                        const isExpanded = expandedId === log.id;

                        return (
                            <div key={log.id} className={`iv-card card ${isExpanded ? 'expanded' : ''}`}>
                                <div className="iv-card-header" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                                    <div className="iv-card-left">
                                        <div className="iv-mood" style={{ background: moodColors[log.mood] + '18', color: moodColors[log.mood] }}>
                                            {moodEmoji[log.mood]}
                                        </div>
                                        <div>
                                            <div className="iv-card-name">{staff?.name || '不明'}</div>
                                            <div className="iv-card-meta">{occ?.name} · {fac?.name}</div>
                                        </div>
                                    </div>
                                    <div className="iv-card-right">
                                        <span className="sp-badge">{log.type}</span>
                                        <span className="iv-card-date">{log.date}</span>
                                        {permissions.canEditInterviews && (
                                            <button className="btn-icon" title="編集" onClick={(e) => { e.stopPropagation(); startEdit(log); }}>✏️</button>
                                        )}
                                        <span className="iv-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="iv-card-body">
                                        <div className="iv-card-summary"><strong>概要:</strong> {log.summary}</div>
                                        <div className="iv-card-details"><strong>詳細:</strong><p>{log.details}</p></div>
                                        <div className="iv-card-interviewer"><strong>面談者:</strong> {interviewer?.name || '不明'}</div>
                                        {log.action_items.length > 0 && (
                                            <div className="iv-card-actions">
                                                <strong>アクション項目:</strong>
                                                <ul>{log.action_items.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingLog ? '✏️ 面談記録を編集' : '➕ 面談記録を追加'}</h3>
                            <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
                        </div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="sp-form-field">
                                <label>対象者 *</label>
                                <select value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} disabled={!!editingLog}>
                                    {visibleUsers.map((u) => {
                                        const occ = occupations.find((o) => o.id === u.occupation_id);
                                        return <option key={u.id} value={u.id}>{u.name}（{occ?.name}）</option>;
                                    })}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>種別</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                                    {interviewTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>気分スコア</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button key={n} onClick={() => setForm({ ...form, mood: n })}
                                            className={`mood-btn ${form.mood === n ? 'active' : ''}`} type="button">
                                            {moodEmoji[n]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="sp-form-field">
                                <label>概要 *</label>
                                <input type="text" className="form-input" value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
                            </div>
                            <div className="sp-form-field">
                                <label>詳細</label>
                                <textarea className="form-textarea" rows={3} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
                            </div>
                            <div className="sp-form-field">
                                <label>アクション項目（1行1項目）</label>
                                <textarea className="form-textarea" rows={3} value={form.action_items} onChange={(e) => setForm({ ...form, action_items: e.target.value })} placeholder="各行に1つずつ入力" />
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowForm(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveForm}>{editingLog ? '更新' : '追加'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
