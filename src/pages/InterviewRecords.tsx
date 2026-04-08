import { useState } from 'react';
import { useData } from '../context/DataContext';
import { interviewMutations } from '../lib/mutations';
import { useAuth } from '../context/AuthContext';
import { useAI } from '../context/AIContext';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { InterviewType, InterviewLog } from '../types';

export default function InterviewRecords() {
    const { users, occupations, facilities, interviewLogs } = useData();
    const { user: currentUser, permissions } = useAuth();
    const { getValidApiKey, handleApiError } = useAI();
    const [filterFacility, setFilterFacility] = useState<string>('all');
    const [filterType, setFilterType] = useState<string>('all');
    const [searchName, setSearchName] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editingLog, setEditingLog] = useState<InterviewLog | null>(null);
    const [form, setForm] = useState({ user_id: '', type: '定期面談' as string, summary: '', details: '', mood: 3 as number, action_items: '', future_tasks: '', notes: '' });
    
    // AI Variables
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [rawMemo, setRawMemo] = useState('');
    const [audioFile, setAudioFile] = useState<File | null>(null);
    const [aiCoaching, setAiCoaching] = useState('');

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
        .filter((log) => { if (!searchName.trim()) return true; const s = users.find(u => u.id === log.user_id); return s?.name.includes(searchName.trim()) || log.summary.includes(searchName.trim()); })
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
        setForm({ user_id: visibleUsers[0]?.id || '', type: '定期面談', summary: '', details: '', mood: 3, action_items: '', future_tasks: '', notes: '' });
        setEditingLog(null);
        setShowForm(true);
    };

    const startEdit = (log: InterviewLog) => {
        setForm({ user_id: log.user_id, type: log.type, summary: log.summary, details: log.details, mood: log.mood, action_items: log.action_items.join('\n'), future_tasks: '', notes: '' });
        setEditingLog(log);
        setShowForm(true);
    };

    const saveForm = () => {
        if (!form.summary || !form.user_id) { alert('対象者と概要は必須です'); return; }
        const staffName = users.find((u) => u.id === form.user_id)?.name || '';
        
        const payloadActions = form.action_items ? form.action_items.split('\n').map((s: string)=>s.trim()).filter(s => s) : [];
        if (aiCoaching) payloadActions.push('【AI助言】 ' + aiCoaching);

        interviewMutations.addInterview({id:'il-'+Date.now(),user_id:form.user_id,interviewer_id:currentUser?.id||'',date:new Date().toISOString().slice(0,10),type:form.type,summary:form.summary,details:form.details,mood:form.mood as any,action_items:payloadActions});
        alert(editingLog ? staffName + 'の面談記録を更新しました' : staffName + 'の面談記録を追加しました');
        setShowForm(false);
        setAiCoaching('');
        setRawMemo('');
        setAudioFile(null);
    };

    const handleRunAI = async () => {
        if (!rawMemo && !audioFile) {
            alert('音声ファイルを選択するか、生のメモを入力してください。');
            return;
        }

        const apiKey = await getValidApiKey();
        if (!apiKey) return;

        setIsProcessingAI(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

            const promptText = `あなたは優秀な人事マネージャーのメンターです。
アップロードされた面談の音声ファイルの文字起こし内容、または上司（面談者）が書き殴った生のメモデータを分析し、以下のJSON形式で出力してください。

{
  "summary": "15文字〜30文字程度の端的な要約タイトル",
  "details": "面談内容の詳細な清書（200文字程度）",
  "action_items": ["本人の次のアクション1", "本人の次のアクション2"],
  "coaching": "上司へのマネジメント助言。この部下に対して今後どのように接するべきか、評価すべき点や気を付けるべき点を、メンターとしてプロ目線で50〜100文字でアドバイスしてください。"
}`;

            let inputs: any[] = [promptText];

            if (audioFile) {
                // 音声ファイルがある場合
                const base64Str = await new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.readAsDataURL(audioFile);
                });
                inputs.push({ inlineData: { data: base64Str, mimeType: audioFile.type } });
            } else if (rawMemo) {
                // テキストメモの場合
                inputs.push(`入力された生の面談メモ:\n${rawMemo}`);
            }

            const result = await model.generateContent(inputs);
            const data = JSON.parse(result.response.text());

            setForm(prev => ({
                ...prev,
                summary: data.summary || prev.summary,
                details: data.details || prev.details,
                action_items: Array.isArray(data.action_items) ? data.action_items.join('\n') : prev.action_items
            }));
            
            if (data.coaching) {
                setAiCoaching(data.coaching);
            }
        } catch (err: any) {
            handleApiError(err);
        } finally {
            setIsProcessingAI(false);
        }
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
                <div className="iv-filter-group">
                    <label>検索:</label>
                    <input type="text" className="form-input" placeholder="名前・概要で検索..." value={searchName} onChange={(e) => setSearchName(e.target.value)} style={{ width: 180 }} />
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
                                                <ul>{log.action_items.map((a: any, i: number) => <li key={i}>{a}</li>)}</ul>
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
                            {currentUser?.role === 'hr_admin' && (
                                <div className="sp-form-field" style={{ background: '#f8fafc', padding: 16, borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 16 }}>
                                    <h4 style={{ margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.9rem', color: '#1e293b' }}>
                                        <span>🎙️</span> AIによる自動要約＆助言（人事システム専用）
                                    </h4>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 4 }}>音声ファイル (面談の録音データ)</label>
                                            <input type="file" accept="audio/*" onChange={(e) => setAudioFile(e.target.files?.[0] || null)} className="form-input" style={{ padding: 4 }} />
                                        </div>
                                        
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', margin: '4px 0' }}>または</div>
                                            <label style={{ fontSize: '0.8rem', color: '#475569', marginBottom: 4 }}>書き殴りの生メモ</label>
                                            <textarea className="form-textarea" rows={3} value={rawMemo} onChange={(e) => setRawMemo(e.target.value)} placeholder="箇条書きや乱雑なメモでも構いません" />
                                        </div>

                                        <button 
                                            className="btn btn-primary" 
                                            type="button" 
                                            onClick={handleRunAI} 
                                            disabled={isProcessingAI || (!audioFile && !rawMemo)}
                                            style={{ background: 'linear-gradient(to right, #8b5cf6, #3b82f6)', border: 'none' }}
                                        >
                                            {isProcessingAI ? '⏳ AIが解析中（数秒〜数十秒かかります）...' : '✨ 音声/メモを解析して要約＆助言を生成'}
                                        </button>
                                    </div>

                                    {aiCoaching && (
                                        <div style={{ marginTop: 16, padding: 12, background: '#f0fdf4', borderLeft: '4px solid #22c55e', borderRadius: '0 8px 8px 0' }}>
                                            <strong style={{ display: 'block', color: '#166534', fontSize: '0.85rem', marginBottom: 4 }}>💡 AIからのマネジメント助言</strong>
                                            <p style={{ fontSize: '0.85rem', color: '#14532d', margin: 0, lineHeight: 1.5 }}>{aiCoaching}</p>
                                        </div>
                                    )}
                                </div>
                            )}

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
