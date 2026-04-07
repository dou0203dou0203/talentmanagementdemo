import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { evaluationMutations } from '../lib/mutations';
import { evaluationTemplateItems } from '../data/mockData';
import type { EvaluationScore, EvaluationStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ============= Newcomer Checklist Data =============
const checklistCategories = [
    {
        name: '接遇・マナー', icon: '🤝', items: [
            '髪はきちんとまとめる、爪は短くしている、香水等をつけていないなどの清潔管理ができている',
            '利用者や家族への説明時に、安心感や納得感を持たせる対応ができる',
            '利用者やご家族様に対して丁寧な敬語・態度で接することができる',
            'ご自宅や施設に入る際、明るい挨拶や靴を揃える、荷物は床にまとめておくことができている',
            '移動時間を含めたスケジュールの自己管理と遅刻防止',
        ]
    },
    {
        name: '勤務態度・コンプライアンス', icon: '📏', items: [
            '無断での遅刻・欠勤なく就業にあたっている',
            '業務において、自己判断の許容範囲を理解し、必要に応じ管理者や同職員への報連相ができている',
            '会社のルールを守って就業にしている',
            'iPadや血圧計、体温計、自転車や原付バイク等の備品をなるべく丁寧に扱っている',
            '利用者の個人情報や会社内の情報を漏洩させず、正しく管理できる',
            '誰も見ていないところでも、倫理的に正しい行動を選択できる',
        ]
    },
    {
        name: 'リスク管理', icon: '⚠️', items: [
            '手指消毒などの標準予防策を含め、感染症に応じた対策を実施した上で介入できる',
            '既往歴や現病歴から考えられるリスクを想起できる',
            'フィジカルアセスメントからリスクを考えれる',
            '急変などが発生した際、バイタルサインや意識レベルをすぐ確認し、管理者や事務所へ報告できる',
            '緊急時対応（救急要請）の流れを理解できている',
        ]
    },
    {
        name: '事務・書類', icon: '📄', items: [
            'カイポケの基本操作ができる',
            '当日の訪問記録はその日のうちに抜けがなく完了させている',
            '訪問看護計画書・報告書が作成できる（専門用語が多すぎず、多職種に伝わりやすい内容か）',
            '書類などの提出物の期日を守れている',
        ]
    },
    {
        name: '臨床スキル・環境調整', icon: '🏥', items: [
            '利用者・ご家族の要望と利用者の状態を踏まえた上で目標設定・リハビリ内容の立案ができる',
            '利用者の体調・環境などの変化に応じて、介入方法を柔軟に調整できる',
            '利用者の全身状態を把握し、適切なポジショニングができる',
            '福祉用具の選定・変更、住宅改修の具体的な提案を、利用者の状態や環境に応じて適切に実施できる',
        ]
    },
    {
        name: '説明・指導', icon: '📢', items: [
            '必要に応じて、ご家族や施設スタッフへ介助方法（移乗・ポジショニング等）を指導したり、確認ができる',
        ]
    },
    {
        name: '多職種連携', icon: '👥', items: [
            '看護師・他療法士と連携し、日常的に必要な情報共有や申し送りができている',
            '利用者の状態や生活背景に合わせて、訪問時に確認または実施してほしいことを依頼できる',
        ]
    },
    {
        name: '制度理解', icon: '📚', items: [
            '介護保険・医療保険の仕組みを理解し、利用者へ説明できる',
        ]
    },
    {
        name: '自己成長', icon: '🌱', items: [
            '同じミスを繰り返さないための工夫を自分なりに考えているか',
            'サービスを実施する上で、不明な点や疑問点はその場で確認し、解決させている',
            'より良いサービスを提供するための自己学習を行い、利用者に還元しようとしている',
        ]
    },
];
const SCORE_DEFS = [
    { value: 1, label: '未習得', desc: '見学・同行し指導が必要', color: '#ef4444' },
    { value: 2, label: '要サポート', desc: '随時助言やサポートが必要', color: '#f59e0b' },
    { value: 3, label: '概ね遂行可', desc: '基本業務は概ね遂行可', color: '#22c55e' },
    { value: 4, label: '自立遂行', desc: '1人で遂行でき事後報告で可', color: '#10b981' },
];
const NCL_PERIODS = ['3ヵ月', '6ヵ月', '12ヵ月'];

type ScoreMap = Record<string, number>;

export default function EvaluationForm() {
    const { users, occupations, evaluations, facilities } = useData();
    const { user: currentUser, permissions } = useAuth();
    const [activeMode, setActiveMode] = useState<'evaluation' | 'checklist'>('evaluation');
    const [searchFilter, setSearchFilter] = useState('');
    const [facFilter, setFacFilter] = useState('all');
    const [occFilter, setOccFilter] = useState('all');
    
    // AI Loading State
    const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

    // ===== Evaluation State =====
    const [selectedUserId, setSelectedUserId] = useState('u-4');
    const [period] = useState('2025-H2');

    const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId), [selectedUserId]);
    const userOccupation = useMemo(() => occupations.find((o) => o.id === selectedUser?.occupation_id), [selectedUser]);

    const templateItems = useMemo(
        () => evaluationTemplateItems.filter((item) => item.occupation_id === selectedUser?.occupation_id).sort((a, b) => a.sort_order - b.sort_order),
        [selectedUser]
    );

    const existingEval = useMemo(
        () => evaluations.find((e) => e.user_id === selectedUserId && e.period === period),
        [selectedUserId, period]
    );

    const getInitialScores = (): EvaluationScore[] => {
        if (existingEval) return [...existingEval.scores];
        return templateItems.map((item) => ({ item_id: item.id, score: 0, comment: '' }));
    };

    const [scores, setScores] = useState<EvaluationScore[]>(getInitialScores);
    const [overallComment, setOverallComment] = useState(existingEval?.overall_comment || '');
    const [status, setStatus] = useState<EvaluationStatus>(existingEval?.status || 'draft');

    // ===== Checklist State =====
    const [nclUserId, setNclUserId] = useState('u-4');
    const [nclPeriod, setNclPeriod] = useState('3ヵ月');
    const [nclScores, setNclScores] = useState<ScoreMap>({});
    const [nclComment, setNclComment] = useState('');

    // Staff list
    const staffUsers = useMemo(() => {
        let filtered = users.filter((u) => u.role === 'staff');
        if (facFilter !== 'all') filtered = filtered.filter(u => u.facility_id === facFilter);
        if (occFilter !== 'all') filtered = filtered.filter(u => u.occupation_id === occFilter);
        if (searchFilter.trim()) filtered = filtered.filter(u => u.name.includes(searchFilter.trim()));
        if (!permissions.canViewAllStaff && permissions.canViewFacility) {
            filtered = filtered.filter((u) => u.facility_id === currentUser?.facility_id);
        }
        return filtered;
    }, [currentUser, permissions, facFilter, occFilter, searchFilter]);

    const allStaffActive = useMemo(() => {
        let filtered = users.filter((u) => u.status === 'active');
        if (!permissions.canViewAllStaff && permissions.canViewFacility) {
            filtered = filtered.filter((u) => u.facility_id === currentUser?.facility_id);
        }
        return filtered;
    }, [currentUser, permissions]);

    // ===== Evaluation Handlers =====
    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
        const user = users.find((u) => u.id === userId);
        const items = evaluationTemplateItems.filter((item) => item.occupation_id === user?.occupation_id).sort((a, b) => a.sort_order - b.sort_order);
        const existEval = evaluations.find((e) => e.user_id === userId && e.period === period);
        if (existEval) { setScores([...existEval.scores]); setOverallComment(existEval.overall_comment); setStatus(existEval.status); }
        else { setScores(items.map((item) => ({ item_id: item.id, score: 0, comment: '' }))); setOverallComment(''); setStatus('draft'); }
    };
    const handleScoreChange = (itemId: string, score: number) => setScores((prev) => prev.map((s) => (s.item_id === itemId ? { ...s, score } : s)));
    const handleCommentChange = (itemId: string, comment: string) => setScores((prev) => prev.map((s) => (s.item_id === itemId ? { ...s, comment } : s)));
    const handleSubmit = () => { setStatus('submitted'); evaluationMutations.submitEvaluation({id:'ev-'+Date.now(),user_id:selectedUserId,evaluator_id:currentUser?.id||'',period:'2025年度 上期',status:'submitted',overall_comment:overallComment},scores.map(s=>({item_id:s.item_id,score:s.score,comment:s.comment}))); alert('✅ 評価を提出しました。'); };
    const handleApprove = () => { setStatus('approved'); evaluationMutations.submitEvaluation({id:'ev-'+Date.now(),user_id:selectedUserId,evaluator_id:currentUser?.id||'',period:'2025年度 上期',status:'approved',overall_comment:overallComment},scores.map(s=>({item_id:s.item_id,score:s.score,comment:s.comment}))); alert('✅ 評価を承認しました。'); };
    const handleSaveDraft = () => { evaluationMutations.submitEvaluation({id:'ev-'+Date.now(),user_id:selectedUserId,evaluator_id:currentUser?.id||'',period:'2025年度 上期',status:'draft',overall_comment:overallComment},scores.map(s=>({item_id:s.item_id,score:s.score,comment:s.comment}))); alert('✅ 下書きを保存しました。'); };

    const handleGenerateAIDraft = async () => {
        const apiKey = localStorage.getItem('gemini_api_key');
        if (!apiKey) {
            alert('Gemini APIキーが設定されていません。「給与データ取込」画面の最上部で設定してください。');
            return;
        }

        setIsGeneratingDraft(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

            // プロンプトを組み立てる
            const scoredItems = scores.filter(s => s.score > 0).map(s => {
                const itemDef = templateItems.find(t => t.id === s.item_id);
                return `- ${itemDef?.question}: ${s.score}点`;
            }).join('\n');

            const promptText = `あなたはプロフェッショナルな人事・施設長です。以下の情報を元に、部下（${selectedUser?.name}）への「期末評価の総合コメント（総評）」を作成してください。
字数は約200文字〜300文字で、最初は労いと強みの称賛から入り、後半に改善点や次期への期待を込める構成にしてください。口調は「〜ですね。」「〜を期待しています。」のような丁寧な言葉遣い（です・ます調）にしてください。

【評価データ】
${scoredItems || 'まだ点数が入力されていません'}

※上記以外の細かい補足情報なしで、そのまま入力欄に貼り付けられる純粋なコメント本文のみを出力してください。`;

            const result = await model.generateContent(promptText);
            setOverallComment(result.response.text().trim());
        } catch (e: any) {
            alert('AIによる下書き作成に失敗しました: ' + e.message);
        } finally {
            setIsGeneratingDraft(false);
        }
    };

    const evaluator = useMemo(() => users.find((u) => u.id === selectedUser?.evaluator_id), [selectedUser]);
    const categories = useMemo(() => {
        const cats: { name: string; items: typeof templateItems }[] = [];
        templateItems.forEach((item) => { const existing = cats.find((c) => c.name === item.category); if (existing) existing.items.push(item); else cats.push({ name: item.category, items: [item] }); });
        return cats;
    }, [templateItems]);
    const avgScore = useMemo(() => { const scored = scores.filter((s) => s.score > 0); if (scored.length === 0) return 0; return scored.reduce((sum, s) => sum + s.score, 0) / scored.length; }, [scores]);

    const statusLabel: Record<EvaluationStatus, string> = { draft: '下書き', submitted: '提出済み', approved: '承認済み' };
    const statusBadge: Record<EvaluationStatus, string> = { draft: 'badge-neutral', submitted: 'badge-warning', approved: 'badge-success' };

    // ===== Checklist Handlers =====
    const nclUser = users.find((u) => u.id === nclUserId);
    const nclOcc = occupations.find((o) => o.id === nclUser?.occupation_id);
    const nclFac = facilities.find((f) => f.id === nclUser?.facility_id);
    const setNclScore = (key: string, value: number) => setNclScores((prev) => ({ ...prev, [key]: prev[key] === value ? 0 : value }));
    const totalItems = checklistCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const answeredItems = Object.values(nclScores).filter((v) => v > 0).length;
    const completionRate = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
    const nclAvg = answeredItems > 0 ? Object.values(nclScores).filter((v) => v > 0).reduce((s, v) => s + v, 0) / answeredItems : 0;

    return (
        <div className="fade-in">
            <h2 className="page-title">評価入力</h2>
            <p className="page-subtitle">人事評価と新人チェックシートの2つのモードで評価を行えます</p>

            {/* Mode Tabs */}
            <div className="sp-tabs" style={{ marginBottom: 'var(--space-5)' }}>
                <button className={`sp-tab ${activeMode === 'evaluation' ? 'active' : ''}`} onClick={() => setActiveMode('evaluation')}>
                    <span>📝</span> 人事評価
                </button>
                <button className={`sp-tab ${activeMode === 'checklist' ? 'active' : ''}`} onClick={() => setActiveMode('checklist')}>
                    <span>✅</span> 新人チェックシート
                </button>
            </div>

            {/* ==================== EVALUATION MODE ==================== */}
            {activeMode === 'evaluation' && (
                <>
                    {/* User Selection */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'end' }}>
                                <div className='form-group' style={{flex:'1 1 150px',marginBottom:0}}>
                                    <label className='form-label'>事業所</label>
                                    <select className='form-select' value={facFilter} onChange={e=>setFacFilter(e.target.value)}><option value='all'>すべて</option>{facilities.map(f=><option key={f.id} value={f.id}>{f.name}</option>)}</select>
                                </div>
                                <div className='form-group' style={{flex:'0 0 120px',marginBottom:0}}>
                                    <label className='form-label'>職種</label>
                                    <select className='form-select' value={occFilter} onChange={e=>setOccFilter(e.target.value)}><option value='all'>すべて</option>{occupations.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select>
                                </div>
                                <div className='form-group' style={{flex:'0 0 160px',marginBottom:0}}>
                                    <label className='form-label'>名前検索</label>
                                    <input type='text' className='form-input' placeholder='名前で検索...' value={searchFilter} onChange={e=>setSearchFilter(e.target.value)} />
                                </div>
                                <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
                                    <label className="form-label">対象者</label>
                                    <select className="form-select" value={selectedUserId} onChange={(e) => handleUserChange(e.target.value)} id="user-select">
                                        {staffUsers.map((u) => {
                                            const occ = occupations.find((o) => o.id === u.occupation_id);
                                            const fac = facilities.find((f) => f.id === u.facility_id);
                                            return <option key={u.id} value={u.id}>{u.name} （{occ?.name}・{fac?.name}）</option>;
                                        })}
                                    </select>
                                </div>
                                <div className="form-group" style={{ flex: '0 0 180px', marginBottom: 0 }}>
                                    <label className="form-label">評価期間</label>
                                    <select className="form-select" value={period} disabled id="period-select">
                                        <option value="2025-H2">2025年度 下期</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                                    <span className={`badge ${statusBadge[status]}`}>{statusLabel[status]}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Approval Flow */}
                    <div className="flow-status">
                        <div className="flow-step">
                            <div className={`flow-step-icon ${status === 'draft' ? 'current' : 'completed'}`}>{status === 'draft' ? '✏️' : '✓'}</div>
                            <span className="flow-step-label">本人入力{selectedUser && <br />}<small>{selectedUser?.name}</small></span>
                        </div>
                        <div className={`flow-connector ${status !== 'draft' ? 'completed' : ''}`} />
                        <div className="flow-step">
                            <div className={`flow-step-icon ${status === 'submitted' ? 'current' : status === 'approved' ? 'completed' : 'pending'}`}>{status === 'approved' ? '✓' : status === 'submitted' ? '👁️' : '⏳'}</div>
                            <span className="flow-step-label">評価者確認{evaluator && <br />}<small>{evaluator?.name || '未設定'}</small></span>
                        </div>
                        <div className={`flow-connector ${status === 'approved' ? 'completed' : ''}`} />
                        <div className="flow-step">
                            <div className={`flow-step-icon ${status === 'approved' ? 'completed' : 'pending'}`}>{status === 'approved' ? '✓' : '📋'}</div>
                            <span className="flow-step-label">承認完了</span>
                        </div>
                    </div>

                    {/* Occupation Banner */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', padding: 'var(--space-3) var(--space-5)', background: 'var(--color-primary-50)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-6)', border: '1px solid var(--color-primary-100)', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 'var(--font-size-lg)' }}>🏷️</span>
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-700)' }}>職種: {userOccupation?.name} の評価項目（{templateItems.length}項目）</span>
                        {avgScore > 0 && <span style={{ marginLeft: 'auto', fontSize: 'var(--font-size-sm)', fontWeight: 700, color: 'var(--color-primary-600)' }}>平均スコア: {avgScore.toFixed(1)} / 5.0</span>}
                    </div>

                    {/* Evaluation Items */}
                    {categories.map((cat) => (
                        <div key={cat.name} style={{ marginBottom: 'var(--space-6)' }}>
                            <h3 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600, color: 'var(--color-neutral-800)', marginBottom: 'var(--space-4)', paddingBottom: 'var(--space-2)', borderBottom: '2px solid var(--color-primary-100)' }}>{cat.name}</h3>
                            {cat.items.map((item) => {
                                const scoreData = scores.find((s) => s.item_id === item.id);
                                return (
                                    <div key={item.id} className="eval-item">
                                        <div className="eval-item-header">
                                            <span className="eval-item-category">{item.category}</span>
                                            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>#{item.sort_order}</span>
                                        </div>
                                        <div className="eval-item-question">{item.question}</div>
                                        <div className="rating-group">
                                            {[1, 2, 3, 4, 5].map((n) => (
                                                <button key={n} className={`rating-star ${(scoreData?.score || 0) >= n ? 'active' : ''}`}
                                                    onClick={() => handleScoreChange(item.id, n)} disabled={status === 'approved'} title={`${n}点`}>
                                                    {(scoreData?.score || 0) >= n ? '★' : '☆'}
                                                </button>
                                            ))}
                                            <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)', alignSelf: 'center' }}>
                                                {scoreData?.score ? `${scoreData.score} / 5` : '未評価'}
                                            </span>
                                        </div>
                                        <div className="eval-item-comment">
                                            <textarea className="form-textarea" placeholder="コメントを入力（任意）" value={scoreData?.comment || ''}
                                                onChange={(e) => handleCommentChange(item.id, e.target.value)} disabled={status === 'approved'} rows={2} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Overall Comment */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="card-title">総合コメント</h3>
                            {currentUser?.role === 'hr_admin' && (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}
                                    onClick={handleGenerateAIDraft}
                                    disabled={isGeneratingDraft || status === 'approved'}
                                >
                                    {isGeneratingDraft ? '⏳ AIが執筆中...' : '✨ AIで下書きを生成'}
                                </button>
                            )}
                        </div>
                        <div className="card-body">
                            <textarea className="form-textarea" placeholder="総合的な評価コメントを入力してください" value={overallComment}
                                onChange={(e) => setOverallComment(e.target.value)} disabled={status === 'approved'} rows={4} id="overall-comment" />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        {status === 'draft' && (<>
                            <button className="btn btn-secondary" onClick={handleSaveDraft}>下書き保存</button>
                            <button className="btn btn-primary btn-lg" onClick={handleSubmit}>提出する</button>
                        </>)}
                        {status === 'submitted' && <button className="btn btn-primary btn-lg" onClick={handleApprove}>✓ 承認する</button>}
                        {status === 'approved' && <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-success)', fontWeight: 600 }}>✓ この評価は承認済みです</span>}
                    </div>
                </>
            )}

            {/* ==================== CHECKLIST MODE ==================== */}
            {activeMode === 'checklist' && (
                <>
                    {/* Controls */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'end' }}>
                            <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                                <label className="form-label">対象者</label>
                                <select className="form-select" value={nclUserId} onChange={(e) => { setNclUserId(e.target.value); setNclScores({}); setNclComment(''); }}>
                                    {allStaffActive.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}（{occupations.find((o) => o.id === u.occupation_id)?.name}）</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
                                <label className="form-label">評価時期</label>
                                <select className="form-select" value={nclPeriod} onChange={(e) => setNclPeriod(e.target.value)}>
                                    {NCL_PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div className="sp-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{nclUser?.name.charAt(0)}</div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{nclUser?.name}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>{nclOcc?.name} · {nclFac?.name}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Score Legend */}
                    <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                        <div className="card-body">
                            <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-neutral-500)', marginBottom: 'var(--space-2)' }}>評価基準</div>
                            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                                {SCORE_DEFS.map((d) => (
                                    <div key={d.value} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span className="ncl-score-dot" style={{ background: d.color }}>{d.value}</span>
                                        <span style={{ fontSize: 'var(--font-size-xs)' }}><strong>{d.label}</strong>：{d.desc}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: 'var(--space-5)', padding: 'var(--space-4) var(--space-5)', background: 'var(--color-neutral-0)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-neutral-200)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                            <span style={{ fontWeight: 500 }}>評価進捗</span>
                            <span style={{ fontWeight: 600, color: completionRate === 100 ? 'var(--color-success)' : 'var(--color-primary-500)' }}>{answeredItems}/{totalItems} 項目（{completionRate}%）</span>
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                            <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--color-neutral-100)', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${completionRate}%`, borderRadius: 4, background: completionRate === 100 ? 'linear-gradient(90deg, var(--color-success), #10b981)' : 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-500))', transition: 'width 0.4s ease-out' }} />
                            </div>
                            {answeredItems > 0 && (
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: nclAvg >= 3.5 ? 'var(--color-success)' : nclAvg >= 2.5 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                                    平均: {nclAvg.toFixed(1)}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Checklist */}
                    {checklistCategories.map((cat, catIdx) => {
                        const catScores = cat.items.map((_, itemIdx) => nclScores[`${catIdx}-${itemIdx}`] || 0);
                        const catAnswered = catScores.filter((s) => s > 0);
                        const catAvg = catAnswered.length > 0 ? catAnswered.reduce((a, b) => a + b, 0) / catAnswered.length : 0;
                        return (
                            <div key={cat.name} className="card" style={{ marginBottom: 'var(--space-5)', animation: `fadeIn 0.4s ease-out ${catIdx * 0.05}s both` }}>
                                <div className="card-header">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: 'var(--font-size-xl)' }}>{cat.icon}</span>
                                        <h3 className="card-title">{cat.name}</h3>
                                        <span className="badge badge-neutral" style={{ marginLeft: 'var(--space-2)' }}>{catAnswered.length}/{cat.items.length}</span>
                                    </div>
                                    {catAvg > 0 && <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: catAvg >= 3.5 ? 'var(--color-success)' : catAvg >= 2.5 ? '#f59e0b' : 'var(--color-danger)' }}>平均: {catAvg.toFixed(1)}</span>}
                                </div>
                                <div className="card-body" style={{ padding: 0 }}>
                                    {cat.items.map((item, itemIdx) => {
                                        const key = `${catIdx}-${itemIdx}`;
                                        const currentScore = nclScores[key] || 0;
                                        return (
                                            <div key={itemIdx} className="ncl-item">
                                                <div className="ncl-item-text"><span className="ncl-item-num">{itemIdx + 1}</span>{item}</div>
                                                <div className="ncl-score-group">
                                                    {SCORE_DEFS.map((d) => (
                                                        <button key={d.value} type="button"
                                                            className={`ncl-score-btn ${currentScore === d.value ? 'active' : ''}`}
                                                            style={{ '--ncl-color': d.color } as React.CSSProperties}
                                                            onClick={() => setNclScore(key, d.value)} title={`${d.value}: ${d.label}`}>{d.value}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {/* Feedback */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="card-header"><h3 className="card-title">📝 振り返り・フィードバックコメント</h3></div>
                        <div className="card-body">
                            <textarea className="form-textarea" rows={5} placeholder="新人スタッフの成長や改善点について、具体的にフィードバックを記入してください..."
                                value={nclComment} onChange={(e) => setNclComment(e.target.value)} />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0 var(--space-8)' }}>
                        <button className="btn btn-secondary" onClick={() => alert(`${nclUser?.name}の${nclPeriod}チェックシートを保存しました（デモ）`)} style={{ minWidth: 140 }}>💾 一時保存</button>
                        <button className="btn btn-primary btn-lg" onClick={() => {
                            if (answeredItems < totalItems) { alert(`未評価の項目が${totalItems - answeredItems}件あります`); return; }
                            alert(`${nclUser?.name}の${nclPeriod}チェックシートを提出しました（デモ）`);
                        }} style={{ minWidth: 200 }}>
                            {completionRate === 100 ? '✅ チェックシートを提出' : `未評価: ${totalItems - answeredItems}件`}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
