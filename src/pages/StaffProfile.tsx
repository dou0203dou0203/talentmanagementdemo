import { useState } from 'react';
import { users, occupations, facilities, interviewLogs } from '../data/mockData';
import { transferHistories, promotionHistories, salaryHistories } from '../data/hrData';
import { useAuth } from '../context/AuthContext';
import type { User, EmploymentType, WorkPattern, InterviewLog } from '../types';

export default function StaffProfile() {
    const { user: currentUser, permissions, roleLabel: _rl } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || 'u-1');
    const [activeTab, setActiveTab] = useState<'basic' | 'qualifications' | 'history' | 'interviews' | 'hr'>('basic');
    const [editMode, setEditMode] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [showAddInterview, setShowAddInterview] = useState(false);
    const [editingInterview, setEditingInterview] = useState<InterviewLog | null>(null);
    const [ivForm, setIvForm] = useState({ type: '定期面談', summary: '', details: '', mood: 3, action_items: '' });
    const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', occupation_id: occupations[0]?.id || '', facility_id: facilities[0]?.id || '', role: 'staff' as const, birth_date: '', hire_date: '', position: '', employment_type: '常勤' as EmploymentType, work_pattern: '日勤のみ' as WorkPattern, corporation: 'さくらの樹グループ' });

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

    const startEdit = () => {
        setEditForm({
            name: selected.name,
            email: selected.email,
            birth_date: selected.birth_date || '',
            hire_date: selected.hire_date || '',
            position: selected.position || '',
            employment_type: selected.employment_type || '常勤',
            work_pattern: selected.work_pattern || '日勤のみ',
            corporation: selected.corporation || '',
            occupation_id: selected.occupation_id,
            facility_id: selected.facility_id,
            status: selected.status,
        });
        setEditMode(true);
    };

    const saveEdit = () => {
        alert(`${selected.name} の情報を更新しました（デモ）`);
        setEditMode(false);
    };

    const saveNewStaff = () => {
        if (!newStaffForm.name || !newStaffForm.email) { alert('氏名とメールは必須です'); return; }
        alert(`新規職員「${newStaffForm.name}」を登録しました（デモ）`);
        setShowAddStaff(false);
        setNewStaffForm({ name: '', email: '', occupation_id: occupations[0]?.id || '', facility_id: facilities[0]?.id || '', role: 'staff', birth_date: '', hire_date: '', position: '', employment_type: '常勤', work_pattern: '日勤のみ', corporation: 'さくらの樹グループ' });
    };

    const startAddInterview = () => {
        setIvForm({ type: '定期面談', summary: '', details: '', mood: 3, action_items: '' });
        setEditingInterview(null);
        setShowAddInterview(true);
    };

    const startEditInterview = (iv: InterviewLog) => {
        setIvForm({ type: iv.type, summary: iv.summary, details: iv.details, mood: iv.mood, action_items: iv.action_items.join('\n') });
        setEditingInterview(iv);
        setShowAddInterview(true);
    };

    const saveInterview = () => {
        if (!ivForm.summary) { alert('概要は必須です'); return; }
        alert(editingInterview ? `面談記録を更新しました（デモ）` : `新しい面談記録を追加しました（デモ）`);
        setShowAddInterview(false);
    };

    const employmentTypes: EmploymentType[] = ['常勤', '非常勤', 'パート', '派遣', '契約'];
    const workPatterns: WorkPattern[] = ['日勤のみ', '夜勤あり', '交代制', '変則勤務', 'フレックス'];

    return (
        <div className="staff-profile-page">
            {/* User Selector + Add Button */}
            <div className="sp-selector card">
                <select className="sp-select" value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setEditMode(false); }}>
                    {visibleUsers.map((u) => (
                        <option key={u.id} value={u.id}>{u.name} ({occupations.find((o) => o.id === u.occupation_id)?.name})</option>
                    ))}
                </select>
                {permissions.canEditStaff && (
                    <button className="btn btn-primary" style={{ marginLeft: 8, whiteSpace: 'nowrap' }} onClick={() => setShowAddStaff(true)}>＋ 新規職員</button>
                )}
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
                    {tenure !== null && <p className="sp-tenure">勤続 {tenure}年（{selected.hire_date} 入社）</p>}
                </div>
                {permissions.canEditStaff && activeTab === 'basic' && !editMode && (
                    <button className="btn btn-secondary" style={{ marginLeft: 'auto', alignSelf: 'flex-start' }} onClick={startEdit}>✏️ 編集</button>
                )}
            </div>

            {/* Tabs */}
            <div className="sp-tabs">
                {tabs.map((tab) => (
                    <button key={tab.key} className={`sp-tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => { setActiveTab(tab.key); setEditMode(false); }}>
                        <span>{tab.icon}</span> {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="sp-content card">
                {activeTab === 'basic' && !editMode && (
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

                {activeTab === 'basic' && editMode && permissions.canEditStaff && (
                    <div className="sp-edit-form">
                        <h3 className="sp-section-title">✏️ 基本情報を編集</h3>
                        <div className="sp-form-grid">
                            <FormField label="氏名" value={editForm.name || ''} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                            <FormField label="メール" value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" />
                            <FormField label="生年月日" value={editForm.birth_date || ''} onChange={(v) => setEditForm({ ...editForm, birth_date: v })} type="date" />
                            <FormField label="入社日" value={editForm.hire_date || ''} onChange={(v) => setEditForm({ ...editForm, hire_date: v })} type="date" />
                            <div className="sp-form-field">
                                <label>所属事業所</label>
                                <select value={editForm.facility_id || ''} onChange={(e) => setEditForm({ ...editForm, facility_id: e.target.value })}>
                                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>職種</label>
                                <select value={editForm.occupation_id || ''} onChange={(e) => setEditForm({ ...editForm, occupation_id: e.target.value })}>
                                    {occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <FormField label="役職" value={editForm.position || ''} onChange={(v) => setEditForm({ ...editForm, position: v })} />
                            <div className="sp-form-field">
                                <label>雇用形態</label>
                                <select value={editForm.employment_type || '常勤'} onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value as EmploymentType })}>
                                    {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>勤務形態</label>
                                <select value={editForm.work_pattern || '日勤のみ'} onChange={(e) => setEditForm({ ...editForm, work_pattern: e.target.value as WorkPattern })}>
                                    {workPatterns.map((w) => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>ステータス</label>
                                <select value={editForm.status || 'active'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as User['status'] })}>
                                    <option value="active">在籍</option>
                                    <option value="leave">休職</option>
                                    <option value="inactive">退職</option>
                                </select>
                            </div>
                            <FormField label="所属法人" value={editForm.corporation || ''} onChange={(v) => setEditForm({ ...editForm, corporation: v })} />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setEditMode(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveEdit}>💾 保存</button>
                        </div>
                    </div>
                )}

                {activeTab === 'qualifications' && (
                    <div>
                        {selected.qualifications && selected.qualifications.length > 0 ? (
                            <table className="sp-table">
                                <thead><tr><th>資格名</th><th>取得日</th><th>有効期限</th></tr></thead>
                                <tbody>
                                    {selected.qualifications.map((q, i) => (
                                        <tr key={i}><td>{q.name}</td><td>{q.acquired_date}</td><td>{q.expiry_date || '—'}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="sp-empty">資格情報が登録されていません</p>}
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
                        {permissions.canEditInterviews && (
                            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                <button className="btn btn-primary" onClick={startAddInterview}>＋ 面談記録を追加</button>
                            </div>
                        )}
                        {userInterviews.length > 0 ? (
                            <div className="sp-interview-list">
                                {userInterviews.map((iv) => (
                                    <div key={iv.id} className="sp-interview-card">
                                        <div className="sp-interview-header">
                                            <span className="sp-badge">{iv.type}</span>
                                            <span className="sp-interview-date">{iv.date}</span>
                                            <span>{moodEmoji[iv.mood]}</span>
                                            {permissions.canEditInterviews && (
                                                <button className="btn-icon" title="編集" onClick={() => startEditInterview(iv)}>✏️</button>
                                            )}
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
                                        <tr key={s.id}><td>{s.date}</td><td><span className="sp-badge">{s.change_type}</span></td><td>{s.salary_range}</td><td>{s.note}</td></tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="sp-empty">昇給履歴はありません</p>}
                    </div>
                )}
            </div>

            {/* New Staff Modal */}
            {showAddStaff && (
                <div className="modal-overlay" onClick={() => setShowAddStaff(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>➕ 新規職員登録</h3>
                            <button className="modal-close" onClick={() => setShowAddStaff(false)}>✕</button>
                        </div>
                        <div className="sp-form-grid">
                            <FormField label="氏名 *" value={newStaffForm.name} onChange={(v) => setNewStaffForm({ ...newStaffForm, name: v })} />
                            <FormField label="メール *" value={newStaffForm.email} onChange={(v) => setNewStaffForm({ ...newStaffForm, email: v })} type="email" />
                            <FormField label="生年月日" value={newStaffForm.birth_date} onChange={(v) => setNewStaffForm({ ...newStaffForm, birth_date: v })} type="date" />
                            <FormField label="入社日" value={newStaffForm.hire_date} onChange={(v) => setNewStaffForm({ ...newStaffForm, hire_date: v })} type="date" />
                            <div className="sp-form-field">
                                <label>事業所</label>
                                <select value={newStaffForm.facility_id} onChange={(e) => setNewStaffForm({ ...newStaffForm, facility_id: e.target.value })}>
                                    {facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>職種</label>
                                <select value={newStaffForm.occupation_id} onChange={(e) => setNewStaffForm({ ...newStaffForm, occupation_id: e.target.value })}>
                                    {occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                                </select>
                            </div>
                            <FormField label="役職" value={newStaffForm.position} onChange={(v) => setNewStaffForm({ ...newStaffForm, position: v })} />
                            <div className="sp-form-field">
                                <label>雇用形態</label>
                                <select value={newStaffForm.employment_type} onChange={(e) => setNewStaffForm({ ...newStaffForm, employment_type: e.target.value as EmploymentType })}>
                                    {employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>勤務形態</label>
                                <select value={newStaffForm.work_pattern} onChange={(e) => setNewStaffForm({ ...newStaffForm, work_pattern: e.target.value as WorkPattern })}>
                                    {workPatterns.map((w) => <option key={w} value={w}>{w}</option>)}
                                </select>
                            </div>
                            <FormField label="所属法人" value={newStaffForm.corporation} onChange={(v) => setNewStaffForm({ ...newStaffForm, corporation: v })} />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAddStaff(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveNewStaff}>登録</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Interview Add/Edit Modal */}
            {showAddInterview && (
                <div className="modal-overlay" onClick={() => setShowAddInterview(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingInterview ? '✏️ 面談記録を編集' : '➕ 面談記録を追加'}</h3>
                            <button className="modal-close" onClick={() => setShowAddInterview(false)}>✕</button>
                        </div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="sp-form-field">
                                <label>種別</label>
                                <select value={ivForm.type} onChange={(e) => setIvForm({ ...ivForm, type: e.target.value })}>
                                    {['定期面談', '1on1', 'フォローアップ', 'キャリア面談', 'その他'].map((t) => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>気分スコア</label>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button key={n} onClick={() => setIvForm({ ...ivForm, mood: n })}
                                            className={`mood-btn ${ivForm.mood === n ? 'active' : ''}`} type="button">
                                            {moodEmoji[n]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <FormField label="概要 *" value={ivForm.summary} onChange={(v) => setIvForm({ ...ivForm, summary: v })} />
                            <div className="sp-form-field">
                                <label>詳細</label>
                                <textarea className="form-textarea" rows={3} value={ivForm.details} onChange={(e) => setIvForm({ ...ivForm, details: e.target.value })} />
                            </div>
                            <div className="sp-form-field">
                                <label>アクション項目（1行1項目）</label>
                                <textarea className="form-textarea" rows={3} value={ivForm.action_items} onChange={(e) => setIvForm({ ...ivForm, action_items: e.target.value })} placeholder="各行に1つずつ入力" />
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAddInterview(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveInterview}>{editingInterview ? '更新' : '追加'}</button>
                        </div>
                    </div>
                </div>
            )}
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

function FormField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
    return (
        <div className="sp-form-field">
            <label>{label}</label>
            <input type={type} className="form-input" value={value} onChange={(e) => onChange(e.target.value)} />
        </div>
    );
}
