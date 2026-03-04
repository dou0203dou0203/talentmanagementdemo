import { useState, useMemo } from 'react';
import { surveyQuestions as initialQuestions } from '../data/mockData';
import type { SurveyQuestion, SurveyCategory } from '../types';

const CATEGORY_ICONS: Record<SurveyCategory, string> = {
    '仕事満足度': '💼',
    '人間関係': '🤝',
    '健康状態': '❤️',
    'キャリア展望': '🎯',
    'ワークライフバランス': '⚖️',
};

const MOOD_ICONS = ['😫', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['とても悪い', 'やや悪い', '普通', 'やや良い', 'とても良い'];

type ViewMode = 'edit' | 'preview';

export default function SurveySettings() {
    const [questions, setQuestions] = useState<SurveyQuestion[]>([...initialQuestions]);
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQuestion, setNewQuestion] = useState('');
    const [newCategory, setNewCategory] = useState<SurveyCategory>('仕事満足度');
    const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Get unique categories
    const categories = useMemo(() => {
        const cats = [...new Set(questions.map(q => q.category))];
        return cats;
    }, [questions]);

    // Group questions by category
    const groupedQuestions = useMemo(() => {
        return categories.map(cat => ({
            category: cat,
            icon: CATEGORY_ICONS[cat] || '📝',
            questions: questions
                .filter(q => q.category === cat)
                .sort((a, b) => a.sort_order - b.sort_order),
        }));
    }, [questions, categories]);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Add Question ---
    const handleAddQuestion = () => {
        if (!newQuestion.trim()) return;

        const categoryQuestions = questions.filter(q => q.category === newCategory);
        const maxOrder = categoryQuestions.length > 0
            ? Math.max(...categoryQuestions.map(q => q.sort_order))
            : 0;

        const newQ: SurveyQuestion = {
            id: `sq-${Date.now()}`,
            category: newCategory,
            question: newQuestion.trim(),
            sort_order: maxOrder + 1,
        };

        setQuestions(prev => [...prev, newQ]);
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

        setQuestions(prev => [...prev, newQ]);
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
        setQuestions(prev =>
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
        setQuestions(prev => prev.filter(q => q.id !== id));
        setDeleteConfirmId(null);
        showToast('設問を削除しました');
    };

    // --- Reorder ---
    const moveQuestion = (id: string, direction: 'up' | 'down') => {
        setQuestions(prev => {
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
    const totalQuestions = questions.length;
    const totalCategories = categories.length;

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
                サーベイで使用する設問の追加・編集・並び替えを行えます。
            </p>

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
        </div>
    );
}
