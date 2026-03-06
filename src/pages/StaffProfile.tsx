import { useState } from 'react';
import { users, occupations, facilities, interviewLogs } from '../data/mockData';
import { transferHistories, promotionHistories, salaryHistories } from '../data/hrData';
import { useAuth } from '../context/AuthContext';

export default function StaffProfile() {
    const { user: currentUser, permissions, roleLabel: _rl } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || 'u-1');
    const [activeTab, setActiveTab] = useState<'basic' | 'qualifications' | 'history' | 'interviews' | 'hr'>('basic');

    // Filter users based on permissions
    const visibleUsers = permissions.canViewAllStaff
        ? users
        : permissions.canViewFacility
            ? users.filter((u) => u.facility_id === currentUser?.facility_id)
            : users.filter((u) => u.id === currentUser?.id);

    const selected = users.find((u) => u.id === selectedUserId) || users[0];
    const occ = occupations.find((o) => o.id === selected.occupation_id);
    const fac = facilities.find((f) => f.id === selected.facility_id);

    const userInterviews = interviewLogs.filter((i) => i.user_id === selectedUserId);
    const userTransfers = transferHistories.filter((t) => t.user_id === selectedUserId);
    const userPromotions = promotionHistories.filter((p) => p.user_id === selectedUserId);
    const userSalary = salaryHistories.filter((s) => s.user_id === selectedUserId);

    const tenure = selected.hire_date
        ? Math.floor((Date.now() - new Date(selected.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        : null;

    const statusLabel: Record<string, string> = { active: '在籍', inactive: '退職', leave: '休職' };
    const moodEmoji = ['', '😫', '😟', '😐', '😊', '😄'];

    const tabs = [
        { key: 'basic' as const, label: '基本情報', icon: '👤' },
        { key: 'qualifications' as const, label: '資格情報', icon: '🎓' },
        { key: 'history' as const, label: '異動・昇格', icon: '📋' },
        { key: 'interviews' as const, label: '面談記録', icon: '💬' },
        ...(permissions.canViewHRInfo ? [{ key: 'hr' as const, label: '人事情報', icon: '🔒' }] : []),
    ];

    return (
        <div className="staff-profile-page">
            {/* User Selector */}
            <div className="sp-selector card">
                <select
                    className="sp-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                >
                    {visibleUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name} ({occupations.find((o) => o.id === u.occupation_id)?.name})
                        </option>
                    ))}
                </select>
            </div>

            {/* Profile Header */}
            <div className="sp-header card">
                <div className="sp-avatar">{selected.name.charAt(0)}</div>
                <div className="sp-header-info">
                    <h2 className="sp-name">{selected.name}</h2>
                    <div className="sp-meta">
                        <span className="sp-badge">{occ?.name}</span>
                        <span className="sp-badge sp-badge-green">{fac?.name}</span>
                        <span className={`sp-badge ${selected.status === 'active' ? 'sp-badge-active' : 'sp-badge-warn'}`}>
                            {statusLabel[selected.status] || selected.status}
                        </span>
                        {selected.position && <span className="sp-badge sp-badge-outline">{selected.position}</span>}
                    </div>
                    {tenure !== null && (
                        <p className="sp-tenure">勤続 {tenure}年（{selected.hire_date} 入社）</p>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="sp-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`sp-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="sp-content card">
                {activeTab === 'basic' && (
                    <div className="sp-grid">
                        <InfoRow label="氏名" value={selected.name} />
                        <InfoRow label="メール" value={selected.email} />
                        <InfoRow label="生年月日" value={selected.birth_date || '未登録'} />
                        <InfoRow label="入社日" value={selected.hire_date || '未登録'} />
                        <InfoRow label="勤続年数" value={tenure !== null ? `${tenure}年` : '未登録'} />
                        <InfoRow label="所属法人" value={selected.corporation || '未登録'} />
                        <InfoRow label="所属事業所" value={fac?.name || '未登録'} />
                        <InfoRow label="職種" value={occ?.name || '未登録'} />
                        <InfoRow label="役職" value={selected.position || '未登録'} />
                        <InfoRow label="雇用形態" value={selected.employment_type || '未登録'} />
                        <InfoRow label="勤務形態" value={selected.work_pattern || '未登録'} />
                    </div>
                )}

                {activeTab === 'qualifications' && (
                    <div>
                        {selected.qualifications && selected.qualifications.length > 0 ? (
                            <table className="sp-table">
                                <thead>
                                    <tr><th>資格名</th><th>取得日</th><th>有効期限</th></tr>
                                </thead>
                                <tbody>
                                    {selected.qualifications.map((q, i) => (
                                        <tr key={i}>
                                            <td>{q.name}</td>
                                            <td>{q.acquired_date}</td>
                                            <td>{q.expiry_date || '—'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : (
                            <p className="sp-empty">資格情報が登録されていません</p>
                        )}
                    </div>
                )}

                {activeTab === 'history' && (
                    <div>
                        <h3 className="sp-section-title">異動履歴</h3>
                        {userTransfers.length > 0 ? (
                            <div className="sp-timeline">
                                {userTransfers.map((t) => (
                                    <div key={t.id} className="sp-timeline-item">
                                        <div className="sp-timeline-date">{t.date}</div>
                                        <div className="sp-timeline-content">
                                            <strong>{t.from_facility}</strong> → <strong>{t.to_facility}</strong>
                                            <p>{t.reason}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="sp-empty">異動履歴はありません</p>}

                        <h3 className="sp-section-title" style={{ marginTop: 24 }}>昇格履歴</h3>
                        {userPromotions.length > 0 ? (
                            <div className="sp-timeline">
                                {userPromotions.map((p) => (
                                    <div key={p.id} className="sp-timeline-item">
                                        <div className="sp-timeline-date">{p.date}</div>
                                        <div className="sp-timeline-content">
                                            <span className="sp-badge sp-badge-outline">{p.type}</span>{' '}
                                            {p.from_position} → <strong>{p.to_position}</strong>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="sp-empty">昇格履歴はありません</p>}
                    </div>
                )}

                {activeTab === 'interviews' && (
                    <div>
                        {userInterviews.length > 0 ? (
                            <div className="sp-interview-list">
                                {userInterviews.map((iv) => (
                                    <div key={iv.id} className="sp-interview-card">
                                        <div className="sp-interview-header">
                                            <span className="sp-badge">{iv.type}</span>
                                            <span className="sp-interview-date">{iv.date}</span>
                                            <span>{moodEmoji[iv.mood]}</span>
                                        </div>
                                        <p className="sp-interview-summary"><strong>{iv.summary}</strong></p>
                                        <p className="sp-interview-details">{iv.details}</p>
                                        {iv.action_items.length > 0 && (
                                            <div className="sp-interview-actions">
                                                <strong>アクション項目:</strong>
                                                <ul>{iv.action_items.map((a, i) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="sp-empty">面談記録はありません</p>}
                    </div>
                )}

                {activeTab === 'hr' && permissions.canViewHRInfo && (
                    <div>
                        <h3 className="sp-section-title">🔒 人事情報（人事本部のみ閲覧可）</h3>
                        <h4 className="sp-subsection-title">昇給履歴</h4>
                        {userSalary.length > 0 ? (
                            <table className="sp-table">
                                <thead><tr><th>日付</th><th>種別</th><th>等級</th><th>備考</th></tr></thead>
                                <tbody>
                                    {userSalary.map((s) => (
                                        <tr key={s.id}>
                                            <td>{s.date}</td>
                                            <td><span className="sp-badge">{s.change_type}</span></td>
                                            <td>{s.salary_range}</td>
                                            <td>{s.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="sp-empty">昇給履歴はありません</p>}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="sp-info-row">
            <span className="sp-info-label">{label}</span>
            <span className="sp-info-value">{value}</span>
        </div>
    );
}
