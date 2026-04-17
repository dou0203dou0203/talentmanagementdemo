import { useState } from 'react';
import { useData } from '../context/DataContext';
import { transferHistories, promotionHistories, salaryHistories } from '../data/hrData';
import { useAuth } from '../context/AuthContext';
import { userMutations } from '../lib/saveHelper';
import type { User, EmploymentType, WorkPattern, InterviewLog } from '../types';

export default function StaffProfile() {
    const { users, occupations, facilities, interviewLogs, updateUser } = useData();
    const { user: currentUser, permissions, roleLabel: _rl } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser?.id || 'u-1');
    const [activeTab, setActiveTab] = useState<'basic' | 'qualifications' | 'history' | 'interviews' | 'hr'>('basic');
    const [editMode, setEditMode] = useState(false);
    const [showAddStaff, setShowAddStaff] = useState(false);
    const [editForm, setEditForm] = useState<Partial<User>>({});
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);
    const [showAddInterview, setShowAddInterview] = useState(false);
    const [editingInterview, setEditingInterview] = useState<InterviewLog | null>(null);
    const [ivForm, setIvForm] = useState({ type: '定期面談', summary: '', details: '', mood: 3, action_items: '' });
    const [newStaffForm, setNewStaffForm] = useState({ name: '', email: '', occupation_id: occupations[0]?.id || '', facility_id: facilities[0]?.id || '', role: 'staff' as const, birth_date: '', hire_date: '', position: '', employment_type: '常勤' as EmploymentType, work_pattern: '日勤のみ' as WorkPattern, corporation: 'さくらの樹グループ', master_user_id: '' });

    // Qualification modal
    const [showQualModal, setShowQualModal] = useState(false);
    const [qualForm, setQualForm] = useState({ name: '', acquired_date: '', expiry_date: '' });
    const [editingQualIdx, setEditingQualIdx] = useState<number | null>(null);

    // Transfer modal
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferForm, setTransferForm] = useState({ date: '', from_facility: '', to_facility: '', reason: '' });

    // Promotion modal
    const [showPromotionModal, setShowPromotionModal] = useState(false);
    const [promotionForm, setPromotionForm] = useState({ date: '', from_position: '', to_position: '', type: '昇格' as string });

    // Salary modal
    const [showSalaryModal, setShowSalaryModal] = useState(false);
    const [salaryForm, setSalaryForm] = useState({ date: '', change_type: '昇給' as string, salary_range: '', note: '' });

    // Filter users based on permissions
    const visibleUsers = permissions.canViewAllStaff
        ? users
        : permissions.canViewFacility
            ? users.filter((u) => u.facility_id === currentUser?.facility_id)
            : users.filter((u) => u.id === currentUser?.id);

    const selected = users.find((u) => u.id === selectedUserId) || users[0];

    if (!selected) {
        return <div style={{ padding: 40, textAlign: 'center' }}>🔄 スタッフ情報を取得中、またはデータが存在しません...</div>;
    }

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
    const resignationReasons = ['自己都合', '会社都合', '定年退職', '契約満了', '転職', '家庭の事情', '健康上の理由', 'その他'];
    const moodEmoji = ['', '😫', '😟', '😐', '😊', '😄'];

    const tabs = [
        { key: 'basic' as const, label: '基本情報', icon: '👤' },
        { key: 'qualifications' as const, label: '資格情報', icon: '🎓' },
        { key: 'history' as const, label: '異動・昇格', icon: '📋' },
        { key: 'interviews' as const, label: '面談記録', icon: '💬' },
        ...(permissions.canViewHRInfo ? [{ key: 'hr' as const, label: '人事情報', icon: '🔒' }] : []),
    ];

    // Basic info edit
    const startEdit = () => {
        setEditForm({ name: selected.name, email: selected.email, gender: selected.gender || '', birth_date: selected.birth_date || '', hire_date: selected.hire_date || '', position: selected.position || '', employment_type: selected.employment_type || '常勤', work_pattern: selected.work_pattern || '日勤のみ', corporation: selected.corporation || '', occupation_id: selected.occupation_id, facility_id: selected.facility_id, status: selected.status, resignation_date: selected.resignation_date || '', resignation_reason: selected.resignation_reason || '', master_user_id: selected.master_user_id || '' });
        setEditMode(true);
    };
    const saveEdit = async () => {
        setSaving(true);
        const updates: Partial<User> = {
            name: editForm.name?.trim() || selected.name,
            email: editForm.email?.trim() || selected.email,
            gender: editForm.gender?.trim() || undefined,
            birth_date: editForm.birth_date?.trim() || undefined,
            hire_date: editForm.hire_date?.trim() || undefined,
            facility_id: editForm.facility_id || selected.facility_id,
            occupation_id: editForm.occupation_id || selected.occupation_id,
            position: editForm.position?.trim() || undefined,
            employment_type: editForm.employment_type || undefined,
            work_pattern: editForm.work_pattern || undefined,
            corporation: editForm.corporation?.trim() || undefined,
            status: editForm.status || selected.status,
            resignation_date: editForm.resignation_date?.trim() || undefined,
            resignation_reason: editForm.resignation_reason?.trim() || undefined,
            master_user_id: editForm.master_user_id || undefined,
        };
        // Update in-memory state
        updateUser(selected.id, updates);
        // Save to Supabase
        try {
            const result = await userMutations.updateUser(selected.id, updates);
            if (result.success) {
                setToast('✅ 基本情報をデータベースに保存しました');
            } else {
                setToast('⚠️ ローカル更新済み（DB保存失敗: ' + (result.error || '') + '）');
            }
        } catch (e: any) {
            console.warn('Supabase保存失敗:', e);
            setToast('⚠️ ローカル更新済み（DB保存失敗）');
        }
        setSaving(false);
        setEditMode(false);
        setTimeout(() => setToast(null), 4000);
    };

    // New staff
    const saveNewStaff = () => {
        if (!newStaffForm.name || !newStaffForm.email) { alert('氏名とメールは必須です'); return; }
        alert(`新規職員「${newStaffForm.name}」を登録しました（デモ）`);
        setShowAddStaff(false);
        setNewStaffForm({ name: '', email: '', occupation_id: occupations[0]?.id || '', facility_id: facilities[0]?.id || '', role: 'staff', birth_date: '', hire_date: '', position: '', employment_type: '常勤', work_pattern: '日勤のみ', corporation: 'さくらの樹グループ', master_user_id: '' });
    };

    // Interview
    const startAddInterview = () => { setIvForm({ type: '定期面談', summary: '', details: '', mood: 3, action_items: '' }); setEditingInterview(null); setShowAddInterview(true); };
    const startEditInterview = (iv: InterviewLog) => { setIvForm({ type: iv.type, summary: iv.summary, details: iv.details, mood: iv.mood, action_items: iv.action_items.join('\n') }); setEditingInterview(iv); setShowAddInterview(true); };
    const saveInterview = () => { if (!ivForm.summary) { alert('概要は必須です'); return; } alert(editingInterview ? '面談記録を更新しました（デモ）' : '新しい面談記録を追加しました（デモ）'); setShowAddInterview(false); };

    // Qualification
    const openAddQual = () => { setQualForm({ name: '', acquired_date: '', expiry_date: '' }); setEditingQualIdx(null); setShowQualModal(true); };
    const openEditQual = (idx: number) => { const q = selected.qualifications![idx]; setQualForm({ name: q.name, acquired_date: q.acquired_date, expiry_date: q.expiry_date || '' }); setEditingQualIdx(idx); setShowQualModal(true); };
    const saveQual = () => { if (!qualForm.name) { alert('資格名は必須です'); return; } alert(editingQualIdx !== null ? '資格情報を更新しました（デモ）' : '資格情報を追加しました（デモ）'); setShowQualModal(false); };
    const deleteQual = (idx: number) => { if (confirm(`「${selected.qualifications![idx].name}」を削除しますか？`)) alert('資格情報を削除しました（デモ）'); };

    // Transfer
    const openAddTransfer = () => { setTransferForm({ date: new Date().toISOString().slice(0, 10), from_facility: fac?.name || '', to_facility: '', reason: '' }); setShowTransferModal(true); };
    const saveTransfer = () => { if (!transferForm.to_facility) { alert('異動先は必須です'); return; } alert('異動履歴を追加しました（デモ）'); setShowTransferModal(false); };

    // Promotion
    const openAddPromotion = () => { setPromotionForm({ date: new Date().toISOString().slice(0, 10), from_position: selected.position || '', to_position: '', type: '昇格' }); setShowPromotionModal(true); };
    const savePromotion = () => { if (!promotionForm.to_position) { alert('変更後役職は必須です'); return; } alert('昇格・役職変更履歴を追加しました（デモ）'); setShowPromotionModal(false); };

    // Salary
    const openAddSalary = () => { setSalaryForm({ date: new Date().toISOString().slice(0, 10), change_type: '昇給', salary_range: '', note: '' }); setShowSalaryModal(true); };
    const saveSalary = () => { if (!salaryForm.salary_range) { alert('等級は必須です'); return; } alert('昇給履歴を追加しました（デモ）'); setShowSalaryModal(false); };

    const employmentTypes: EmploymentType[] = ['常勤', '非常勤', 'パート', '派遣', '契約'];
    const workPatterns: WorkPattern[] = ['日勤のみ', '夜勤あり', '交代制', '変則勤務', 'フレックス'];
    const POSITIONS: string[] = ['院長', '理事長兼院長', '医事課係長', '看護師長', '事務長', '事務長代理', '主任', '医療事業部長', 'エリアマネージャー', '施設長'];

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
                        {selected.master_user_id && <span className="sp-badge" style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fca5a5' }}>兼務（主務: {users.find(u => u.id === selected.master_user_id)?.name}）</span>}
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
                {/* ===== BASIC INFO ===== */}
                {activeTab === 'basic' && !editMode && (
                    <div className="sp-grid">
                        <InfoRow label="氏名" value={selected.name} />
                        <InfoRow label="メール" value={selected.email} />
                        <InfoRow label="性別" value={selected.gender || '未登録'} />
                        <InfoRow label="生年月日" value={selected.birth_date || '未登録'} />
                        <InfoRow label="入社日" value={selected.hire_date || '未登録'} />
                        <InfoRow label="勤続年数" value={tenure !== null ? `${tenure}年` : '未登録'} />
                        <InfoRow label="所属法人" value={selected.corporation || '未登録'} />
                        <InfoRow label="所属事業所" value={fac?.name || '未登録'} />
                        <InfoRow label="主務アカウント" value={selected.master_user_id ? users.find(u => u.id === selected.master_user_id)?.name || selected.master_user_id : 'なし'} />
                        <InfoRow label="職種" value={occ?.name || '未登録'} />
                        <InfoRow label="役職" value={selected.position || '未登録'} />
                        <InfoRow label="雇用形態" value={selected.employment_type || '未登録'} />
                        <InfoRow label="勤務形態" value={selected.work_pattern || '未登録'} />
                        {selected.status === 'inactive' && (
                            <>
                                <InfoRow label="離職日" value={selected.resignation_date || '未登録'} />
                                <InfoRow label="離職理由" value={selected.resignation_reason || '未登録'} />
                            </>
                        )}
                    </div>
                )}
                {activeTab === 'basic' && editMode && permissions.canEditStaff && (
                    <div className="sp-edit-form">
                        <h3 className="sp-section-title">✏️ 基本情報を編集</h3>
                        <div className="sp-form-grid">
                            <FormField label="氏名" value={editForm.name || ''} onChange={(v) => setEditForm({ ...editForm, name: v })} />
                            <FormField label="メール" value={editForm.email || ''} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" />
                            <div className="sp-form-field"><label>性別</label><select value={editForm.gender || ''} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}><option value="">未選択</option><option value="男性">男性</option><option value="女性">女性</option><option value="その他">その他</option><option value="未回答">未回答</option></select></div>
                            <FormField label="生年月日" value={editForm.birth_date || ''} onChange={(v) => setEditForm({ ...editForm, birth_date: v })} type="date" />
                            <FormField label="入社日" value={editForm.hire_date || ''} onChange={(v) => setEditForm({ ...editForm, hire_date: v })} type="date" />
                            <div className="sp-form-field"><label>所属事業所</label><select value={editForm.facility_id || ''} onChange={(e) => setEditForm({ ...editForm, facility_id: e.target.value })}>{facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                            <div className="sp-form-field"><label>職種</label><select value={editForm.occupation_id || ''} onChange={(e) => setEditForm({ ...editForm, occupation_id: e.target.value })}>{occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                            <div className="sp-form-field"><label>役職</label><select value={editForm.position || ''} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}><option value="">（役職なし）</option>{POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div className="sp-form-field"><label>雇用形態</label><select value={editForm.employment_type || '常勤'} onChange={(e) => setEditForm({ ...editForm, employment_type: e.target.value as EmploymentType })}>{employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="sp-form-field"><label>勤務形態</label><select value={editForm.work_pattern || '日勤のみ'} onChange={(e) => setEditForm({ ...editForm, work_pattern: e.target.value as WorkPattern })}>{workPatterns.map((w) => <option key={w} value={w}>{w}</option>)}</select></div>
                            <div className="sp-form-field"><label>ステータス</label><select value={editForm.status || 'active'} onChange={(e) => setEditForm({ ...editForm, status: e.target.value as User['status'] })}><option value="active">在籍</option><option value="leave">休職</option><option value="inactive">退職</option></select></div>
                            {editForm.status === 'inactive' && (
                                <>
                                    <FormField label="離職日" value={editForm.resignation_date || ''} onChange={(v) => setEditForm({ ...editForm, resignation_date: v })} type="date" />
                                    <div className="sp-form-field"><label>離職理由</label><select value={editForm.resignation_reason || ''} onChange={(e) => setEditForm({ ...editForm, resignation_reason: e.target.value })}><option value="">選択してください</option>{resignationReasons.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
                                </>
                            )}
                            <FormField label="所属法人" value={editForm.corporation || ''} onChange={(v) => setEditForm({ ...editForm, corporation: v })} />
                            <div className="sp-form-field">
                                <label>主務アカウント（兼務の場合のみ）</label>
                                <select value={editForm.master_user_id || ''} onChange={(e) => setEditForm({ ...editForm, master_user_id: e.target.value })}>
                                    <option value="">（独立アカウント）</option>
                                    {users.filter(u => u.id !== selected.id).map((u) => <option key={u.id} value={u.id}>{u.name} ({facilities.find(f => f.id === u.facility_id)?.name})</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setEditMode(false)} disabled={saving}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? '⏳ 保存中...' : '💾 保存'}</button>
                        </div>
                    </div>
                )}

                {/* ===== QUALIFICATIONS ===== */}
                {activeTab === 'qualifications' && (
                    <div>
                        {permissions.canEditStaff && (
                            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                                <button className="btn btn-primary" onClick={openAddQual}>＋ 資格を追加</button>
                            </div>
                        )}
                        {selected.qualifications && selected.qualifications.length > 0 ? (
                            <table className="sp-table">
                                <thead><tr><th>資格名</th><th>取得日</th><th>有効期限</th>{permissions.canEditStaff && <th style={{ width: 80 }}>操作</th>}</tr></thead>
                                <tbody>
                                    {selected.qualifications.map((q, i) => (
                                        <tr key={i}>
                                            <td>{q.name}</td><td>{q.acquired_date}</td><td>{q.expiry_date || '—'}</td>
                                            {permissions.canEditStaff && (
                                                <td>
                                                    <button className="btn-icon" title="編集" onClick={() => openEditQual(i)}>✏️</button>
                                                    <button className="btn-icon" title="削除" onClick={() => deleteQual(i)}>🗑️</button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        ) : <p className="sp-empty">資格情報が登録されていません</p>}
                    </div>
                )}

                {/* ===== HISTORY (Transfer + Promotion) ===== */}
                {activeTab === 'history' && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="sp-section-title">異動履歴</h3>
                            {permissions.canEditStaff && <button className="btn btn-primary btn-sm" onClick={openAddTransfer}>＋ 異動を追加</button>}
                        </div>
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

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
                            <h3 className="sp-section-title">昇格・役職変更履歴</h3>
                            {permissions.canEditStaff && <button className="btn btn-primary btn-sm" onClick={openAddPromotion}>＋ 昇格を追加</button>}
                        </div>
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

                {/* ===== INTERVIEWS ===== */}
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
                                            {permissions.canEditInterviews && <button className="btn-icon" title="編集" onClick={() => startEditInterview(iv)}>✏️</button>}
                                        </div>
                                        <p className="sp-interview-summary"><strong>{iv.summary}</strong></p>
                                        <p className="sp-interview-details">{iv.details}</p>
                                        {iv.action_items.length > 0 && (
                                            <div className="sp-interview-actions">
                                                <strong>アクション項目:</strong>
                                                <ul>{iv.action_items.map((a: any, i: number) => <li key={i}>{a}</li>)}</ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="sp-empty">面談記録はありません</p>}
                    </div>
                )}

                {/* ===== HR INFO ===== */}
                {activeTab === 'hr' && permissions.canViewHRInfo && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="sp-section-title">🔒 人事情報（人事本部のみ閲覧可）</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                            <h4 className="sp-subsection-title">昇給履歴</h4>
                            {permissions.canEditStaff && permissions.canViewPayroll && <button className="btn btn-primary btn-sm" onClick={openAddSalary}>＋ 昇給を追加</button>}
                        </div>
                        {permissions.canViewPayroll ? (
                            userSalary.length > 0 ? (
                                <table className="sp-table">
                                    <thead><tr><th>日付</th><th>種別</th><th>等級</th><th>備考</th></tr></thead>
                                    <tbody>
                                        {userSalary.map((s) => (
                                            <tr key={s.id}><td>{s.date}</td><td><span className="sp-badge">{s.change_type}</span></td><td>{s.salary_range}</td><td>{s.note}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : <p className="sp-empty">昇給履歴はありません</p>
                        ) : (
                            <p className="sp-empty">🔒 給与情報を閲覧する権限がありません</p>
                        )}
                    </div>
                )}
            </div>

            {/* ========== MODALS ========== */}

            {/* New Staff Modal */}
            {showAddStaff && (
                <div className="modal-overlay" onClick={() => setShowAddStaff(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>➕ 新規職員登録</h3><button className="modal-close" onClick={() => setShowAddStaff(false)}>✕</button></div>
                        <div className="sp-form-grid">
                            <FormField label="氏名 *" value={newStaffForm.name} onChange={(v) => setNewStaffForm({ ...newStaffForm, name: v })} />
                            <FormField label="メール *" value={newStaffForm.email} onChange={(v) => setNewStaffForm({ ...newStaffForm, email: v })} type="email" />
                            <FormField label="生年月日" value={newStaffForm.birth_date} onChange={(v) => setNewStaffForm({ ...newStaffForm, birth_date: v })} type="date" />
                            <FormField label="入社日" value={newStaffForm.hire_date} onChange={(v) => setNewStaffForm({ ...newStaffForm, hire_date: v })} type="date" />
                            <div className="sp-form-field"><label>事業所</label><select value={newStaffForm.facility_id} onChange={(e) => setNewStaffForm({ ...newStaffForm, facility_id: e.target.value })}>{facilities.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}</select></div>
                            <div className="sp-form-field"><label>職種</label><select value={newStaffForm.occupation_id} onChange={(e) => setNewStaffForm({ ...newStaffForm, occupation_id: e.target.value })}>{occupations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select></div>
                            <div className="sp-form-field"><label>役職</label><select value={newStaffForm.position} onChange={(e) => setNewStaffForm({ ...newStaffForm, position: e.target.value })}><option value="">（役職なし）</option>{POSITIONS.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
                            <div className="sp-form-field"><label>雇用形態</label><select value={newStaffForm.employment_type} onChange={(e) => setNewStaffForm({ ...newStaffForm, employment_type: e.target.value as EmploymentType })}>{employmentTypes.map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="sp-form-field"><label>勤務形態</label><select value={newStaffForm.work_pattern} onChange={(e) => setNewStaffForm({ ...newStaffForm, work_pattern: e.target.value as WorkPattern })}>{workPatterns.map((w) => <option key={w} value={w}>{w}</option>)}</select></div>
                            <FormField label="所属法人" value={newStaffForm.corporation} onChange={(v) => setNewStaffForm({ ...newStaffForm, corporation: v })} />
                            <div className="sp-form-field">
                                <label>主務アカウント（兼務の場合のみ）</label>
                                <select value={newStaffForm.master_user_id} onChange={(e) => setNewStaffForm({ ...newStaffForm, master_user_id: e.target.value })}>
                                    <option value="">（独立アカウント）</option>
                                    {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({facilities.find(f => f.id === u.facility_id)?.name})</option>)}
                                </select>
                            </div>
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
                        <div className="modal-header"><h3>{editingInterview ? '✏️ 面談記録を編集' : '➕ 面談記録を追加'}</h3><button className="modal-close" onClick={() => setShowAddInterview(false)}>✕</button></div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <div className="sp-form-field"><label>種別</label><select value={ivForm.type} onChange={(e) => setIvForm({ ...ivForm, type: e.target.value })}>{['定期面談', '1on1', 'フォローアップ', 'キャリア面談', 'その他'].map((t) => <option key={t} value={t}>{t}</option>)}</select></div>
                            <div className="sp-form-field"><label>気分スコア</label><div style={{ display: 'flex', gap: 8 }}>{[1, 2, 3, 4, 5].map((n) => (<button key={n} onClick={() => setIvForm({ ...ivForm, mood: n })} className={`mood-btn ${ivForm.mood === n ? 'active' : ''}`} type="button">{moodEmoji[n]}</button>))}</div></div>
                            <FormField label="概要 *" value={ivForm.summary} onChange={(v) => setIvForm({ ...ivForm, summary: v })} />
                            <div className="sp-form-field"><label>詳細</label><textarea className="form-textarea" rows={3} value={ivForm.details} onChange={(e) => setIvForm({ ...ivForm, details: e.target.value })} /></div>
                            <div className="sp-form-field"><label>アクション項目（1行1項目）</label><textarea className="form-textarea" rows={3} value={ivForm.action_items} onChange={(e) => setIvForm({ ...ivForm, action_items: e.target.value })} placeholder="各行に1つずつ入力" /></div>
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowAddInterview(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveInterview}>{editingInterview ? '更新' : '追加'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Qualification Add/Edit Modal */}
            {showQualModal && (
                <div className="modal-overlay" onClick={() => setShowQualModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editingQualIdx !== null ? '✏️ 資格情報を編集' : '➕ 資格情報を追加'}</h3><button className="modal-close" onClick={() => setShowQualModal(false)}>✕</button></div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField label="資格名 *" value={qualForm.name} onChange={(v) => setQualForm({ ...qualForm, name: v })} />
                            <FormField label="取得日" value={qualForm.acquired_date} onChange={(v) => setQualForm({ ...qualForm, acquired_date: v })} type="date" />
                            <FormField label="有効期限" value={qualForm.expiry_date} onChange={(v) => setQualForm({ ...qualForm, expiry_date: v })} type="date" />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowQualModal(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveQual}>{editingQualIdx !== null ? '更新' : '追加'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transfer Add Modal */}
            {showTransferModal && (
                <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>➕ 異動履歴を追加</h3><button className="modal-close" onClick={() => setShowTransferModal(false)}>✕</button></div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField label="日付" value={transferForm.date} onChange={(v) => setTransferForm({ ...transferForm, date: v })} type="date" />
                            <div className="sp-form-field">
                                <label>異動元</label>
                                <select value={transferForm.from_facility} onChange={(e) => setTransferForm({ ...transferForm, from_facility: e.target.value })}>
                                    <option value="">選択してください</option>
                                    {facilities.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="sp-form-field">
                                <label>異動先 *</label>
                                <select value={transferForm.to_facility} onChange={(e) => setTransferForm({ ...transferForm, to_facility: e.target.value })}>
                                    <option value="">選択してください</option>
                                    {facilities.map((f) => <option key={f.id} value={f.name}>{f.name}</option>)}
                                </select>
                            </div>
                            <FormField label="理由" value={transferForm.reason} onChange={(v) => setTransferForm({ ...transferForm, reason: v })} />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveTransfer}>追加</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Promotion Add Modal */}
            {showPromotionModal && (
                <div className="modal-overlay" onClick={() => setShowPromotionModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>➕ 昇格・役職変更を追加</h3><button className="modal-close" onClick={() => setShowPromotionModal(false)}>✕</button></div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField label="日付" value={promotionForm.date} onChange={(v) => setPromotionForm({ ...promotionForm, date: v })} type="date" />
                            <div className="sp-form-field">
                                <label>種別</label>
                                <select value={promotionForm.type} onChange={(e) => setPromotionForm({ ...promotionForm, type: e.target.value })}>
                                    <option value="昇格">昇格</option>
                                    <option value="降格">降格</option>
                                    <option value="役職変更">役職変更</option>
                                </select>
                            </div>
                            <FormField label="変更前役職" value={promotionForm.from_position} onChange={(v) => setPromotionForm({ ...promotionForm, from_position: v })} />
                            <FormField label="変更後役職 *" value={promotionForm.to_position} onChange={(v) => setPromotionForm({ ...promotionForm, to_position: v })} />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowPromotionModal(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={savePromotion}>追加</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Salary Add Modal */}
            {showSalaryModal && (
                <div className="modal-overlay" onClick={() => setShowSalaryModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h3>➕ 昇給履歴を追加</h3><button className="modal-close" onClick={() => setShowSalaryModal(false)}>✕</button></div>
                        <div className="sp-form-grid" style={{ gridTemplateColumns: '1fr' }}>
                            <FormField label="日付" value={salaryForm.date} onChange={(v) => setSalaryForm({ ...salaryForm, date: v })} type="date" />
                            <div className="sp-form-field">
                                <label>種別</label>
                                <select value={salaryForm.change_type} onChange={(e) => setSalaryForm({ ...salaryForm, change_type: e.target.value })}>
                                    <option value="昇給">昇給</option>
                                    <option value="降給">降給</option>
                                    <option value="初任給">初任給</option>
                                    <option value="契約更新">契約更新</option>
                                </select>
                            </div>
                            <FormField label="等級 *" value={salaryForm.salary_range} onChange={(v) => setSalaryForm({ ...salaryForm, salary_range: v })} />
                            <FormField label="備考" value={salaryForm.note} onChange={(v) => setSalaryForm({ ...salaryForm, note: v })} />
                        </div>
                        <div className="sp-form-actions">
                            <button className="btn btn-secondary" onClick={() => setShowSalaryModal(false)}>キャンセル</button>
                            <button className="btn btn-primary" onClick={saveSalary}>追加</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Toast Notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: 24, right: 24, padding: '12px 24px',
                    borderRadius: 12, background: toast.startsWith('✅') ? '#16a34a' : '#f59e0b',
                    color: '#fff', fontWeight: 600, fontSize: '0.9rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)', zIndex: 9999,
                    animation: 'fadeIn 0.3s ease',
                }}>{toast}</div>
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
