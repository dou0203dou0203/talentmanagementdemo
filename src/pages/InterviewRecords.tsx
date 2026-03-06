import { useState } from 'react';
import { users, occupations, facilities, interviewLogs } from '../data/mockData';
import { useAuth } from '../context/AuthContext';
import type { InterviewType } from '../types';

export default function InterviewRecords() {
    const { user: currentUser, permissions } = useAuth();
    const [filterFacility, setFilterFacility] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

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
                <div className="iv-count">
                    {filteredLogs.length}件の面談記録
                </div>
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
                                            <div className="iv-card-meta">
                                                {occ?.name} · {fac?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="iv-card-right">
                                        <span className="sp-badge">{log.type}</span>
                                        <span className="iv-card-date">{log.date}</span>
                                        <span className="iv-expand-icon">{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="iv-card-body">
                                        <div className="iv-card-summary">
                                            <strong>概要:</strong> {log.summary}
                                        </div>
                                        <div className="iv-card-details">
                                            <strong>詳細:</strong>
                                            <p>{log.details}</p>
                                        </div>
                                        <div className="iv-card-interviewer">
                                            <strong>面談者:</strong> {interviewer?.name || '不明'}
                                        </div>
                                        {log.action_items.length > 0 && (
                                            <div className="iv-card-actions">
                                                <strong>アクション項目:</strong>
                                                <ul>
                                                    {log.action_items.map((a, i) => <li key={i}>{a}</li>)}
                                                </ul>
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
