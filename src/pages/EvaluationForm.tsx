import { useState, useMemo } from 'react';
import { users, occupations, evaluationTemplateItems, evaluations, facilities } from '../data/mockData';
import type { EvaluationScore, EvaluationStatus } from '../types';
import { useAuth } from '../context/AuthContext';

export default function EvaluationForm() {
    const { user: currentUser, permissions } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('u-4');
    const [period] = useState('2025-H2');

    const selectedUser = useMemo(() => users.find((u) => u.id === selectedUserId), [selectedUserId]);
    const userOccupation = useMemo(
        () => occupations.find((o) => o.id === selectedUser?.occupation_id),
        [selectedUser]
    );

    // Get template items for the selected user's occupation
    const templateItems = useMemo(
        () =>
            evaluationTemplateItems
                .filter((item) => item.occupation_id === selectedUser?.occupation_id)
                .sort((a, b) => a.sort_order - b.sort_order),
        [selectedUser]
    );

    // Get existing evaluation data if any
    const existingEval = useMemo(
        () => evaluations.find((e) => e.user_id === selectedUserId && e.period === period),
        [selectedUserId, period]
    );

    // Initial scores from existing eval or empty
    const getInitialScores = (): EvaluationScore[] => {
        if (existingEval) return [...existingEval.scores];
        return templateItems.map((item) => ({ item_id: item.id, score: 0, comment: '' }));
    };

    const [scores, setScores] = useState<EvaluationScore[]>(getInitialScores);
    const [overallComment, setOverallComment] = useState(existingEval?.overall_comment || '');
    const [status, setStatus] = useState<EvaluationStatus>(existingEval?.status || 'draft');

    // Reset scores when user changes
    const handleUserChange = (userId: string) => {
        setSelectedUserId(userId);
        const user = users.find((u) => u.id === userId);
        const items = evaluationTemplateItems
            .filter((item) => item.occupation_id === user?.occupation_id)
            .sort((a, b) => a.sort_order - b.sort_order);
        const existEval = evaluations.find((e) => e.user_id === userId && e.period === period);
        if (existEval) {
            setScores([...existEval.scores]);
            setOverallComment(existEval.overall_comment);
            setStatus(existEval.status);
        } else {
            setScores(items.map((item) => ({ item_id: item.id, score: 0, comment: '' })));
            setOverallComment('');
            setStatus('draft');
        }
    };

    const handleScoreChange = (itemId: string, score: number) => {
        setScores((prev) =>
            prev.map((s) => (s.item_id === itemId ? { ...s, score } : s))
        );
    };

    const handleCommentChange = (itemId: string, comment: string) => {
        setScores((prev) =>
            prev.map((s) => (s.item_id === itemId ? { ...s, comment } : s))
        );
    };

    const handleSubmit = () => {
        setStatus('submitted');
        alert('評価を提出しました。評価者の承認をお待ちください。');
    };

    const handleApprove = () => {
        setStatus('approved');
        alert('評価を承認しました。');
    };

    const handleSaveDraft = () => {
        alert('下書きを保存しました。');
    };

    // Get evaluator name
    const evaluator = useMemo(
        () => users.find((u) => u.id === selectedUser?.evaluator_id),
        [selectedUser]
    );

    // Group template items by category
    const categories = useMemo(() => {
        const cats: { name: string; items: typeof templateItems }[] = [];
        templateItems.forEach((item) => {
            const existing = cats.find((c) => c.name === item.category);
            if (existing) {
                existing.items.push(item);
            } else {
                cats.push({ name: item.category, items: [item] });
            }
        });
        return cats;
    }, [templateItems]);

    // Average score
    const avgScore = useMemo(() => {
        const scored = scores.filter((s) => s.score > 0);
        if (scored.length === 0) return 0;
        return scored.reduce((sum, s) => sum + s.score, 0) / scored.length;
    }, [scores]);

    const statusLabel: Record<EvaluationStatus, string> = {
        draft: '下書き',
        submitted: '提出済み',
        approved: '承認済み',
    };

    const statusBadge: Record<EvaluationStatus, string> = {
        draft: 'badge-neutral',
        submitted: 'badge-warning',
        approved: 'badge-success',
    };

    // Filter only staff users for evaluation (facility_manager: own facility only)
    const staffUsers = useMemo(
        () => {
            let filtered = users.filter((u) => u.role === 'staff');
            if (!permissions.canViewAllStaff && permissions.canViewFacility) {
                filtered = filtered.filter((u) => u.facility_id === currentUser?.facility_id);
            }
            return filtered;
        },
        [currentUser, permissions]
    );

    return (
        <div className="fade-in">
            <h2 className="page-title">人事評価入力</h2>
            <p className="page-subtitle">
                職種に応じた評価項目が自動で切り替わります。5段階で評価を行い、コメントを記入してください。
            </p>

            {/* User Selection */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'end' }}>
                        <div className="form-group" style={{ flex: '1 1 250px', marginBottom: 0 }}>
                            <label className="form-label">対象者</label>
                            <select
                                className="form-select"
                                value={selectedUserId}
                                onChange={(e) => handleUserChange(e.target.value)}
                                id="user-select"
                            >
                                {staffUsers.map((u) => {
                                    const occ = occupations.find((o) => o.id === u.occupation_id);
                                    const fac = facilities.find((f) => f.id === u.facility_id);
                                    return (
                                        <option key={u.id} value={u.id}>
                                            {u.name} （{occ?.name}・{fac?.name}）
                                        </option>
                                    );
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
                    <div className={`flow-step-icon ${status === 'draft' ? 'current' : 'completed'}`}>
                        {status === 'draft' ? '✏️' : '✓'}
                    </div>
                    <span className="flow-step-label">
                        本人入力
                        {selectedUser && <br />}
                        <small>{selectedUser?.name}</small>
                    </span>
                </div>
                <div className={`flow-connector ${status !== 'draft' ? 'completed' : ''}`} />
                <div className="flow-step">
                    <div className={`flow-step-icon ${status === 'submitted' ? 'current' : status === 'approved' ? 'completed' : 'pending'}`}>
                        {status === 'approved' ? '✓' : status === 'submitted' ? '👁️' : '⏳'}
                    </div>
                    <span className="flow-step-label">
                        評価者確認
                        {evaluator && <br />}
                        <small>{evaluator?.name || '未設定'}</small>
                    </span>
                </div>
                <div className={`flow-connector ${status === 'approved' ? 'completed' : ''}`} />
                <div className="flow-step">
                    <div className={`flow-step-icon ${status === 'approved' ? 'completed' : 'pending'}`}>
                        {status === 'approved' ? '✓' : '📋'}
                    </div>
                    <span className="flow-step-label">承認完了</span>
                </div>
            </div>

            {/* Occupation Banner */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-5)',
                    background: 'var(--color-primary-50)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: 'var(--space-6)',
                    border: '1px solid var(--color-primary-100)',
                    flexWrap: 'wrap',
                }}
            >
                <span style={{ fontSize: 'var(--font-size-lg)' }}>🏷️</span>
                <span
                    style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: 600,
                        color: 'var(--color-primary-700)',
                    }}
                >
                    職種: {userOccupation?.name} の評価項目（{templateItems.length}項目）
                </span>
                {avgScore > 0 && (
                    <span
                        style={{
                            marginLeft: 'auto',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 700,
                            color: 'var(--color-primary-600)',
                        }}
                    >
                        平均スコア: {avgScore.toFixed(1)} / 5.0
                    </span>
                )}
            </div>

            {/* Evaluation Items by Category */}
            {categories.map((cat) => (
                <div key={cat.name} style={{ marginBottom: 'var(--space-6)' }}>
                    <h3
                        style={{
                            fontSize: 'var(--font-size-md)',
                            fontWeight: 600,
                            color: 'var(--color-neutral-800)',
                            marginBottom: 'var(--space-4)',
                            paddingBottom: 'var(--space-2)',
                            borderBottom: '2px solid var(--color-primary-100)',
                        }}
                    >
                        {cat.name}
                    </h3>

                    {cat.items.map((item) => {
                        const scoreData = scores.find((s) => s.item_id === item.id);
                        return (
                            <div key={item.id} className="eval-item">
                                <div className="eval-item-header">
                                    <span className="eval-item-category">{item.category}</span>
                                    <span
                                        style={{
                                            fontSize: 'var(--font-size-xs)',
                                            color: 'var(--color-neutral-400)',
                                        }}
                                    >
                                        #{item.sort_order}
                                    </span>
                                </div>
                                <div className="eval-item-question">{item.question}</div>

                                {/* Rating */}
                                <div className="rating-group">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <button
                                            key={n}
                                            className={`rating-star ${(scoreData?.score || 0) >= n ? 'active' : ''}`}
                                            onClick={() => handleScoreChange(item.id, n)}
                                            disabled={status === 'approved'}
                                            title={`${n}点`}
                                        >
                                            {(scoreData?.score || 0) >= n ? '★' : '☆'}
                                        </button>
                                    ))}
                                    <span
                                        style={{
                                            marginLeft: 'var(--space-2)',
                                            fontSize: 'var(--font-size-sm)',
                                            color: 'var(--color-neutral-500)',
                                            alignSelf: 'center',
                                        }}
                                    >
                                        {scoreData?.score ? `${scoreData.score} / 5` : '未評価'}
                                    </span>
                                </div>

                                {/* Comment */}
                                <div className="eval-item-comment">
                                    <textarea
                                        className="form-textarea"
                                        placeholder="コメントを入力（任意）"
                                        value={scoreData?.comment || ''}
                                        onChange={(e) => handleCommentChange(item.id, e.target.value)}
                                        disabled={status === 'approved'}
                                        rows={2}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            ))}

            {/* Overall Comment */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 className="card-title">総合コメント</h3>
                </div>
                <div className="card-body">
                    <textarea
                        className="form-textarea"
                        placeholder="総合的な評価コメントを入力してください"
                        value={overallComment}
                        onChange={(e) => setOverallComment(e.target.value)}
                        disabled={status === 'approved'}
                        rows={4}
                        id="overall-comment"
                    />
                </div>
            </div>

            {/* Actions */}
            <div
                style={{
                    display: 'flex',
                    gap: 'var(--space-3)',
                    justifyContent: 'flex-end',
                    flexWrap: 'wrap',
                }}
            >
                {status === 'draft' && (
                    <>
                        <button className="btn btn-secondary" onClick={handleSaveDraft}>
                            下書き保存
                        </button>
                        <button className="btn btn-primary btn-lg" onClick={handleSubmit}>
                            提出する
                        </button>
                    </>
                )}
                {status === 'submitted' && (
                    <button className="btn btn-primary btn-lg" onClick={handleApprove}>
                        ✓ 承認する
                    </button>
                )}
                {status === 'approved' && (
                    <span
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                        }}
                    >
                        ✓ この評価は承認済みです
                    </span>
                )}
            </div>
        </div>
    );
}
