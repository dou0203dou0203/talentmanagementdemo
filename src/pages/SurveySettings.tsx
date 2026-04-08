import { useState, useMemo } from 'react';
import { surveyQuestions as initialQuestions } from '../data/mockData';
import type { SurveyQuestion, SurveyCategory } from '../types';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { useAI } from '../context/AIContext';

const CATEGORY_ICONS: Record<SurveyCategory, string> = {
    '仕事満足度': '💼',
    '人間関係': '🤝',
    '健康状態': '❤️',
    'キャリア展望': '🎯',
    'ワークライフバランス': '⚖️',
};

// Newcomer survey questions
const newcomerQuestions: SurveyQuestion[] = [
    { id: 'nq-1', category: '業務理解' as SurveyCategory, question: '業務内容を理解できていますか？', sort_order: 1 },
    { id: 'nq-2', category: '業務理解' as SurveyCategory, question: '必要な研修やOJTを受けられていますか？', sort_order: 2 },
    { id: 'nq-3', category: '職場環境' as SurveyCategory, question: '職場の雰囲気に馴染めていますか？', sort_order: 1 },
    { id: 'nq-4', category: '職場環境' as SurveyCategory, question: '団ったときに相談できる人がいますか？', sort_order: 2 },
    { id: 'nq-5', category: 'メンタル' as SurveyCategory, question: '不安やストレスを感じていませんか？', sort_order: 1 },
    { id: 'nq-6', category: 'メンタル' as SurveyCategory, question: '体調は良好ですか？', sort_order: 2 },
    { id: 'nq-7', category: '今後の展望' as SurveyCategory, question: 'この職場で長く働きたいと思いますか？', sort_order: 1 },
    { id: 'nq-8', category: '今後の展望' as SurveyCategory, question: '今後身につけたいスキルや知識はありますか？', sort_order: 2 },
];

// Leader aptitude survey questions
const leaderSurveyQuestions: SurveyQuestion[] = [
    { id: 'lsq-1', category: '信頼性' as SurveyCategory, question: '他のスタッフから相談されることが多い', sort_order: 1 },
    { id: 'lsq-2', category: '判断力' as SurveyCategory, question: '困難な場面でも冷静に判断できる', sort_order: 1 },
    { id: 'lsq-3', category: 'コミュニケーション' as SurveyCategory, question: 'チームの目標を明確に伝えられる', sort_order: 1 },
    { id: 'lsq-4', category: '育成力' as SurveyCategory, question: '後輩の指導・育成に積極的に取り組んでいる', sort_order: 1 },
    { id: 'lsq-5', category: '主体性' as SurveyCategory, question: '業務改善の提案を自発的に行っている', sort_order: 1 },
    { id: 'lsq-6', category: '調整力' as SurveyCategory, question: '他職種との連携を円滑に進められる', sort_order: 1 },
    { id: 'lsq-7', category: '耐性' as SurveyCategory, question: 'ストレスの高い状況でも安定したパフォーマンスを発揮する', sort_order: 1 },
    { id: 'lsq-8', category: '規律性' as SurveyCategory, question: '組織のルールや理念を理解し、模範となる行動ができる', sort_order: 1 },
];

const MOOD_ICONS = ['😫', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['とても悪い', 'やや悪い', '普通', 'やや良い', 'とても良い'];

type ViewMode = 'edit' | 'preview';

export default function SurveySettings() {
    const { getValidApiKey, handleApiError } = useAI();
    const [questions, setQuestions] = useState<SurveyQuestion[]>([...initialQuestions]);
    const [ncQuestions, setNcQuestions] = useState<SurveyQuestion[]>([...newcomerQuestions]);
    const [ldQuestions, setLdQuestions] = useState<SurveyQuestion[]>([...leaderSurveyQuestions]);
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [surveyType, setSurveyType] = useState<'regular'|'newcomer'|'leader'>('regular');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    
    // AI Generation State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiTheme, setAiTheme] = useState('');
    const [isGeneratingAi, setIsGeneratingAi] = useState(false);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newCategory, setNewCategory] = useState<SurveyCategory>('仕事満足度');
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Active questions based on survey type
    const activeQuestions = surveyType === 'regular' ? questions : surveyType === 'newcomer' ? ncQuestions : ldQuestions;
    const setActiveQuestions = surveyType === 'regular' ? setQuestions : surveyType === 'newcomer' ? setNcQuestions : setLdQuestions;

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(activeQuestions.map(q => q.category))];
        return cats;
    }, [activeQuestions]);

    // Group questions by category
    const groupedQuestions = useMemo(() => {
        return categories.map(cat => ({
            category: cat,
            icon: CATEGORY_ICONS[cat] || '📝',
            questions: activeQuestions
                .filter(q => q.category === cat)
                .sort((a, b) => a.sort_order - b.sort_order),
        }));
    }, [activeQuestions, categories]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Add Question ---
    const handleAddQuestion = () => {
        if (!newQuestion.trim()) return;

        const categoryQuestions = activeQuestions.filter(q => q.category === newCategory);
        const maxOrder = categoryQuestions.length > 0
            ? Math.max(...categoryQuestions.map(q => q.sort_order))
            : 0;

        const newQ: SurveyQuestion = {
            id: `sq-${Date.now()}`,
            category: newCategory,
            question: newQuestion.trim(),
            sort_order: maxOrder + 1,
        };

        setActiveQuestions(prev => [...prev, newQ]);
        setNewQuestion('');
        setShowAddForm(false);
        showToast('設問を追加しました');
    };

    // --- Add Category ---
    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;
        const catName = newCategoryName.trim() as SurveyCategory;
        if (categories.includes(catName)) {
            showToast('同名のカテゴリが既に存在します', 'error');
            return;
        }

        const newQ: SurveyQuestion = {
            id: `sq-${Date.now()}`,
            category: catName,
            question: '新しい設問を入力してください',
            sort_order: 1,
        };

        setActiveQuestions(prev => [...prev, newQ]);
        setNewCategoryName('');
        setShowNewCategoryInput(false);
        showToast(`カテゴリ「${catName}」を追加しました`);
    };

    // --- Edit Question ---
    const startEdit = (q: SurveyQuestion) => {
        setEditingId(q.id);
        setEditText(q.question);
    };

    const saveEdit = () => {
        if (!editingId || !editText.trim()) return;
        setActiveQuestions(prev =>
            prev.map(q => q.id === editingId ? { ...q, question: editText.trim() } : q)
        );
        setEditingId(null);
        setEditText('');
        showToast('設問を更新しました');
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditText('');
    };

    // --- Delete Question ---
    const handleDelete = (id: string) => {
        setActiveQuestions(prev => prev.filter(q => q.id !== id));
        setDeleteConfirmId(null);
        showToast('設問を削除しました');
    };

    // --- Reorder ---
    const moveQuestion = (id: string, direction: 'up' | 'down') => {
        setActiveQuestions(prev => {
            const q = prev.find(x => x.id === id);
            if (!q) return prev;

            const catQuestions = prev.filter(x => x.category === q.category).sort((a, b) => a.sort_order - b.sort_order);
            const idx = catQuestions.findIndex(x => x.id === id);

            if (direction === 'up' && idx === 0) return prev;
            if (direction === 'down' && idx === catQuestions.length - 1) return prev;

            const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
            const swapQ = catQuestions[swapIdx];

            return prev.map(x => {
                if (x.id === q.id) return { ...x, sort_order: swapQ.sort_order };
                if (x.id === swapQ.id) return { ...x, sort_order: q.sort_order };
                return x;
            });
        });
    };

    // --- Stats ---
    const totalQuestions = activeQuestions.length;
    const totalCategories = categories.length;

    // --- AI Generator ---
    const handleGenerateAiQuestions = async () => {
        if (!aiTheme.trim()) return;
        const apiKey = await getValidApiKey();
        if (!apiKey) return;

        setIsGeneratingAi(true);
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

            const targetLabel = surveyType === 'regular' ? '全スタッフ向け定期サーベイ' : surveyType === 'newcomer' ? '新入社員向けサーベイ' : 'リーダー適性サーベイ';
            const existingCatLabels = categories.join(', ');

            const prompt = `あなたはプロフェッショナルな組織コンサルタントです。「${targetLabel}」に利用するアンケート設問を作成してください。
今回は特に「${aiTheme}」というテーマ・課題にフォーカスした設問を5個生成してください。

以下の形式のJSON配列のみを出力してください。
[
  { "category": "既存のカテゴリ（${existingCatLabels}）または新規のカテゴリ名", "question": "質問のテキスト（ はい/いいえ、あるいは5段階評価で答えやすい文章にしてください ）" }
]`;

            const result = await model.generateContent(prompt);
            const data = JSON.parse(result.response.text());
            
            // Add to active questions
            if (Array.isArray(data)) {
                let maxOrderBase = activeQuestions.length > 0 ? Math.max(...activeQuestions.map(q => q.sort_order)) : 0;
                const newQs: SurveyQuestion[] = data.map((item: any, idx: number) => ({
                    id: `sq-ai-${Date.now()}-${idx}`,
                    category: item.category as SurveyCategory,
                    question: item.question,
                    sort_order: maxOrderBase + idx + 1
                }));
                setActiveQuestions(prev => [...prev, ...newQs]);
                showToast('✨ AIが設問を5個作成し、追加しました！');
                setShowAiModal(false);
                setAiTheme('');
            }
        } catch (e: any) {
            handleApiError(e);
            handleApiError(e);
            showToast('AI生成失敗: ' + e.message, 'error');
        } finally {
            setIsGeneratingAi(false);
        }
    };

    // ========================================
    // EDIT MODE
    // ========================================
    const renderEditMode = () => (
        <div>
            {groupedQuestions.map((group, gIdx) => (
                <div
                    key={group.category}
                    className="card"
                    style={{
                        marginBottom: 'var(--space-5)',
                        animation: `fadeIn 0.3s ease-out ${gIdx * 0.08}s both`,
                    }}
                >
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--font-size-xl)' }}>{group.icon}</span>
                            <h3 className="card-title">{group.category}</h3>
                            <span className="badge badge-neutral">{group.questions.length}問</span>
                        </div>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {group.questions.map((q, qIdx) => (
                            <div
                                key={q.id}
                                className="sq-item"
                            >
                                <div className="sq-item-order">
                                    <button
                                        className="sq-order-btn"
                                        onClick={() => moveQuestion(q.id, 'up')}
                                        disabled={qIdx === 0}
                                        title="上へ移動"
                                    >
                                        ▲
                                    </button>
                                    <span className="sq-order-num">{qIdx + 1}</span>
                                    <button
                                        className="sq-order-btn"
                                        onClick={() => moveQuestion(q.id, 'down')}
                                        disabled={qIdx === group.questions.length - 1}
                                        title="下へ移動"
                                    >
                                        ▼
                                    </button>
                                </div>

                                <div className="sq-item-content">
                                    {editingId === q.id ? (
                                        <div className="sq-edit-form">
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') saveEdit();
                                                    if (e.key === 'Escape') cancelEdit();
                                                }}
                                                autoFocus
                                            />
                                            <div className="sq-edit-actions">
                                                <button className="btn btn-sm btn-primary" onClick={saveEdit}>
                                                    保存
                                                </button>
                                                <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                                                    キャンセル
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="sq-item-text" onClick={() => startEdit(q)}>
                                            {q.question}
                                        </div>
                                    )}
                                </div>

                                <div className="sq-item-actions">
                                    {editingId !== q.id && (
                                        <>
                                            <button
                                                className="sq-action-btn edit"
                                                onClick={() => startEdit(q)}
                                                title="編集"
                                            >
                                                ✏️
                                            </button>
                                            {deleteConfirmId === q.id ? (
                                                <div className="sq-delete-confirm">
                                                    <button
                                                        className="btn btn-sm"
                                                        style={{ background: 'var(--color-danger)', color: '#fff', fontSize: 'var(--font-size-xs)' }}
                                                        onClick={() => handleDelete(q.id)}
                                                    >
                                                        削除
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-secondary"
                                                        style={{ fontSize: 'var(--font-size-xs)' }}
                                                        onClick={() => setDeleteConfirmId(null)}
                                                    >
                                                        戻す
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    className="sq-action-btn delete"
                                                    onClick={() => setDeleteConfirmId(q.id)}
                                                    title="削除"
                                                >
                                                    🗑️
                                                </button>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Add Question Form */}
            {showAddForm ? (
                <div className="card" style={{ borderColor: 'var(--color-primary-200)', borderStyle: 'dashed' }}>
                    <div className="card-header">
                        <h3 className="card-title">➕ 新しい設問を追加</h3>
                    </div>
                    <div className="card-body">
                        <div className="form-group">
                            <label className="form-label">カテゴリ</label>
                            <select
                                className="form-select"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value as SurveyCategory)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>
                                        {CATEGORY_ICONS[cat] || '📝'} {cat}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">質問文</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="例: 職場の雰囲気に満足していますか？"
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddQuestion();
                                }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddQuestion}
                                disabled={!newQuestion.trim()}
                            >
                                追加する
                            </button>
                            <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>
                                キャンセル
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                    <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                        ➕ 設問を追加
                    </button>
                    {showNewCategoryInput ? (
                        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="新しいカテゴリ名"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleAddCategory();
                                    if (e.key === 'Escape') setShowNewCategoryInput(false);
                                }}
                                autoFocus
                                style={{ width: 200 }}
                            />
                            <button className="btn btn-sm btn-primary" onClick={handleAddCategory} disabled={!newCategoryName.trim()}>
                                作成
                            </button>
                            <button className="btn btn-sm btn-secondary" onClick={() => setShowNewCategoryInput(false)}>
                                ✕
                            </button>
                        </div>
                    ) : (
                        <button className="btn btn-secondary" onClick={() => setShowNewCategoryInput(true)}>
                            📂 カテゴリを追加
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={() => setShowAiModal(true)} style={{ background: 'linear-gradient(to right, #8b5cf6, #d946ef)', border: 'none' }}>
                        ✨ AIにおまかせ生成
                    </button>
                </div>
            )}
        </div>
    );

    // ========================================
    // PREVIEW MODE
    // ========================================
    const renderPreviewMode = () => (
        <div>
            <div
                style={{
                    padding: 'var(--space-4) var(--space-5)',
                    background: 'linear-gradient(135deg, var(--color-info-bg), var(--color-primary-50))',
                    borderRadius: 'var(--radius-lg)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid var(--color-primary-100)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-neutral-600)',
                }}
            >
                👁️ これはプレビューです。実際のサーベイ画面での設問の表示を確認できます。
            </div>

            {groupedQuestions.map((group, gIdx) => (
                <div
                    key={group.category}
                    className="card"
                    style={{
                        marginBottom: 'var(--space-5)',
                        animation: `fadeIn 0.4s ease-out ${gIdx * 0.1}s both`,
                    }}
                >
                    <div className="card-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            <span style={{ fontSize: 'var(--font-size-xl)' }}>{group.icon}</span>
                            <h3 className="card-title">{group.category}</h3>
                        </div>
                    </div>
                    <div className="card-body">
                        {group.questions.map((q) => (
                            <div key={q.id} className="survey-question-item">
                                <div className="survey-question-text">{q.question}</div>
                                <div className="survey-mood-group">
                                    {MOOD_ICONS.map((icon, idx) => (
                                        <button
                                            key={idx}
                                            className="survey-mood-btn"
                                            disabled
                                            title={MOOD_LABELS[idx]}
                                            style={{ opacity: 0.5 }}
                                        >
                                            <span className="survey-mood-icon">{icon}</span>
                                            <span className="survey-mood-label">{MOOD_LABELS[idx]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="fade-in">
            <h2 className="page-title">サーベイ設問管理</h2>
            <p className="page-subtitle">
                各サーベイ種別（定期・新人・リーダー適性）の設問を管理できます。
            </p>

            {/* Survey Type Tabs */}
            <div className='sp-tabs' style={{marginBottom:'var(--space-5)'}}>
                <button className={'sp-tab '+(surveyType==='regular'?'active':'')} onClick={()=>{setSurveyType('regular');setEditingId(null);}}>
                    <span>📋</span> 定期サーベイ
                </button>
                <button className={'sp-tab '+(surveyType==='newcomer'?'active':'')} onClick={()=>{setSurveyType('newcomer');setEditingId(null);}}>
                    <span>🌱</span> 新人サーベイ
                </button>
                <button className={'sp-tab '+(surveyType==='leader'?'active':'')} onClick={()=>{setSurveyType('leader');setEditingId(null);}}>
                    <span>👑</span> リーダー適性
                </button>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-500)' }}>
                        ❓
                    </div>
                    <div className="stat-card-value">{totalQuestions}</div>
                    <div className="stat-card-label">設問数</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-accent-50)', color: 'var(--color-accent-500)' }}>
                        📂
                    </div>
                    <div className="stat-card-value">{totalCategories}</div>
                    <div className="stat-card-label">カテゴリ数</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)' }}>
                        ✅
                    </div>
                    <div className="stat-card-value">
                        {Math.round(totalQuestions / Math.max(totalCategories, 1) * 10) / 10}
                    </div>
                    <div className="stat-card-label">カテゴリ平均</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                        ⏱️
                    </div>
                    <div className="stat-card-value">~{Math.ceil(totalQuestions * 0.5)}分</div>
                    <div className="stat-card-label">想定回答時間</div>
                </div>
            </div>

            {/* View Toggle */}
            <div className="tab-nav">
                <button
                    className={`tab-item ${viewMode === 'edit' ? 'active' : ''}`}
                    onClick={() => setViewMode('edit')}
                >
                    ✏️ 編集モード
                </button>
                <button
                    className={`tab-item ${viewMode === 'preview' ? 'active' : ''}`}
                    onClick={() => setViewMode('preview')}
                >
                    👁️ プレビュー
                </button>
            </div>

            {viewMode === 'edit' ? renderEditMode() : renderPreviewMode()}

            {/* Toast */}
            {toast && (
                <div className={`sq-toast ${toast.type}`}>
                    {toast.type === 'success' ? '✅' : '⚠️'} {toast.message}
                </div>
            )}

            {/* AI Generator Modal */}
            {showAiModal && (
                <div className="modal-overlay" onClick={() => setShowAiModal(false)}>
                    <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">✨ AIに設問を一括生成してもらう</h3>
                            <button className="modal-close" onClick={() => setShowAiModal(false)}>✕</button>
                        </div>
                        <div className="modal-body">
                            <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: 'var(--space-4)' }}>
                                現在のサーベイ種別（{surveyType === 'regular' ? '定期' : surveyType === 'newcomer' ? '新人' : 'リーダー'}）に合わせて、AIが最適な設問を5つ自動生成します。重点的に測りたいテーマを入力してください。
                            </p>
                            <textarea 
                                className="form-textarea" 
                                placeholder="例: リモートワーク下でのコミュニケーション不足や、最近の残業増加によるメンタル不調の兆候を測りたい"
                                rows={4}
                                value={aiTheme}
                                onChange={e => setAiTheme(e.target.value)}
                            />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowAiModal(false)}>キャンセル</button>
                            <button 
                                className="btn btn-primary" 
                                onClick={handleGenerateAiQuestions}
                                disabled={isGeneratingAi || !aiTheme.trim()}
                                style={{ background: 'linear-gradient(to right, #8b5cf6, #d946ef)', border: 'none' }}
                            >
                                {isGeneratingAi ? '⏳ 生成中...' : '✨ 生成する'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
