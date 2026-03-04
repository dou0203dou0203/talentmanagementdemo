import { useState, useMemo } from 'react';
import { surveyQuestions, surveyPeriods, surveys as existingSurveys, users, facilities, occupations } from '../data/mockData';
import type { SurveyAnswer, SurveyCategory } from '../types';

const MOOD_ICONS = ['😫', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['とても悪い', 'やや悪い', '普通', 'やや良い', 'とても良い'];
const MOOD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

export default function SurveyForm() {
    // Simulate current user as u-4 (高橋 美咲)
    const [currentUserId] = useState('u-4');
    const currentUser = users.find((u) => u.id === currentUserId)!;
    const currentFacility = facilities.find((f) => f.id === currentUser.facility_id);
    const currentOccupation = occupations.find((o) => o.id === currentUser.occupation_id);

    // Active survey period
    const activePeriod = surveyPeriods.find((p) => p.status === 'active');
    const [selectedPeriodId, setSelectedPeriodId] = useState(activePeriod?.id || surveyPeriods[surveyPeriods.length - 1].id);
    const selectedPeriod = surveyPeriods.find((p) => p.id === selectedPeriodId)!;

    // Check if already answered
    const existingAnswer = existingSurveys.find(
        (s) => s.user_id === currentUserId && s.period_id === selectedPeriodId
    );

    // Form state
    const [answers, setAnswers] = useState<SurveyAnswer[]>(
        existingAnswer?.answers || surveyQuestions.map((q) => ({ question_id: q.id, score: 0 }))
    );
    const [freeComment, setFreeComment] = useState(existingAnswer?.free_comment || '');
    const [submitted, setSubmitted] = useState(existingAnswer?.submitted || false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Group questions by category
    const categories = useMemo(() => {
        const cats: { name: SurveyCategory; items: typeof surveyQuestions }[] = [];
        surveyQuestions.forEach((q) => {
            const existing = cats.find((c) => c.name === q.category);
            if (existing) {
                existing.items.push(q);
            } else {
                cats.push({ name: q.category, items: [q] });
            }
        });
        return cats;
    }, []);

    const categoryIcons: Record<SurveyCategory, string> = {
        '仕事満足度': '💼',
        '人間関係': '🤝',
        '健康状態': '❤️',
        'キャリア展望': '🎯',
        'ワークライフバランス': '⚖️',
    };

    const handleScoreChange = (questionId: string, score: number) => {
        if (submitted) return;
        setAnswers((prev) =>
            prev.map((a) => (a.question_id === questionId ? { ...a, score } : a))
        );
    };

    const handlePeriodChange = (periodId: string) => {
        setSelectedPeriodId(periodId);
        const existing = existingSurveys.find(
            (s) => s.user_id === currentUserId && s.period_id === periodId
        );
        if (existing) {
            setAnswers(existing.answers || surveyQuestions.map((q) => ({ question_id: q.id, score: 0 })));
            setFreeComment(existing.free_comment || '');
            setSubmitted(existing.submitted);
        } else {
            setAnswers(surveyQuestions.map((q) => ({ question_id: q.id, score: 0 })));
            setFreeComment('');
            setSubmitted(false);
        }
        setShowConfirmation(false);
    };

    const allAnswered = answers.every((a) => a.score > 0);

    // Calculate category averages
    const categoryAverages = useMemo(() => {
        return categories.map((cat) => {
            const catAnswers = answers.filter((a) =>
                cat.items.some((q) => q.id === a.question_id)
            );
            const scored = catAnswers.filter((a) => a.score > 0);
            const avg = scored.length > 0
                ? scored.reduce((sum, a) => sum + a.score, 0) / scored.length
                : 0;
            return { name: cat.name, average: avg };
        });
    }, [answers, categories]);

    // Overall averages for mental / motivation composite
    const overallAverage = useMemo(() => {
        const scored = answers.filter((a) => a.score > 0);
        if (scored.length === 0) return 0;
        return scored.reduce((sum, a) => sum + a.score, 0) / scored.length;
    }, [answers]);

    const handleSubmit = () => {
        setSubmitted(true);
        setShowConfirmation(true);
    };

    const completionRate = Math.round(
        (answers.filter((a) => a.score > 0).length / answers.length) * 100
    );

    const isPastPeriod = selectedPeriod.status === 'closed';

    if (showConfirmation) {
        return (
            <div className="fade-in">
                <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', padding: 'var(--space-12) 0' }}>
                    <div
                        style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'var(--color-success-bg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '2.5rem',
                            margin: '0 auto var(--space-6)',
                            animation: 'fadeIn 0.5s ease-out',
                        }}
                    >
                        ✅
                    </div>
                    <h2 className="page-title" style={{ marginBottom: 'var(--space-4)' }}>
                        回答を送信しました
                    </h2>
                    <p className="page-subtitle" style={{ marginBottom: 'var(--space-8)' }}>
                        {selectedPeriod.name}のサーベイ回答が完了しました。<br />
                        ご協力ありがとうございます。
                    </p>

                    {/* Summary */}
                    <div className="card" style={{ textAlign: 'left', marginBottom: 'var(--space-6)' }}>
                        <div className="card-header">
                            <h3 className="card-title">回答サマリー</h3>
                        </div>
                        <div className="card-body">
                            {categoryAverages.map((cat) => (
                                <div
                                    key={cat.name}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: 'var(--space-3) 0',
                                        borderBottom: '1px solid var(--color-neutral-100)',
                                    }}
                                >
                                    <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 500 }}>
                                        {categoryIcons[cat.name]} {cat.name}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                        <span style={{ fontSize: '1.2rem' }}>
                                            {MOOD_ICONS[Math.round(cat.average) - 1] || '—'}
                                        </span>
                                        <span style={{
                                            fontSize: 'var(--font-size-sm)',
                                            fontWeight: 600,
                                            color: cat.average >= 4 ? 'var(--color-success)' : cat.average >= 3 ? 'var(--color-warning)' : 'var(--color-danger)',
                                        }}>
                                            {cat.average.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: 'var(--space-4) 0 0',
                                    fontWeight: 600,
                                }}
                            >
                                <span>総合スコア</span>
                                <span style={{
                                    fontSize: 'var(--font-size-lg)',
                                    color: overallAverage >= 4 ? 'var(--color-success)' : overallAverage >= 3 ? 'var(--color-warning)' : 'var(--color-danger)',
                                }}>
                                    {overallAverage.toFixed(1)} / 5.0
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        className="btn btn-primary btn-lg"
                        onClick={() => setShowConfirmation(false)}
                    >
                        回答内容を確認する
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fade-in">
            <h2 className="page-title">定期サーベイ</h2>
            <p className="page-subtitle">
                あなたの現在の気持ちを教えてください。回答は匿名で集計され、職場環境の改善に活用されます。
            </p>

            {/* User Info & Period Selection */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-body">
                    <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', alignItems: 'end' }}>
                        <div style={{ flex: '1 1 200px' }}>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', marginBottom: 'var(--space-1)' }}>
                                回答者
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                                <div
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 'var(--radius-full)',
                                        background: 'linear-gradient(135deg, var(--color-primary-300), var(--color-accent-400))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: 'var(--font-size-sm)',
                                        fontWeight: 700,
                                        color: '#fff',
                                        flexShrink: 0,
                                    }}
                                >
                                    {currentUser.name.charAt(0)}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: 'var(--font-size-base)' }}>{currentUser.name}</div>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
                                        {currentFacility?.name} / {currentOccupation?.name}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group" style={{ flex: '0 0 240px', marginBottom: 0 }}>
                            <label className="form-label">サーベイ期間</label>
                            <select
                                className="form-select"
                                value={selectedPeriodId}
                                onChange={(e) => handlePeriodChange(e.target.value)}
                            >
                                {surveyPeriods.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} {p.status === 'active' ? '（受付中）' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                            {submitted ? (
                                <span className="badge badge-success">回答済み ✓</span>
                            ) : isPastPeriod ? (
                                <span className="badge badge-neutral">未回答（期限切れ）</span>
                            ) : (
                                <span className="badge badge-warning">未回答</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            {!submitted && !isPastPeriod && (
                <div
                    style={{
                        marginBottom: 'var(--space-6)',
                        padding: 'var(--space-4) var(--space-5)',
                        background: 'var(--color-neutral-0)',
                        borderRadius: 'var(--radius-lg)',
                        border: '1px solid var(--color-neutral-200)',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 'var(--space-2)',
                        fontSize: 'var(--font-size-sm)',
                    }}>
                        <span style={{ fontWeight: 500 }}>回答進捗</span>
                        <span style={{ fontWeight: 600, color: completionRate === 100 ? 'var(--color-success)' : 'var(--color-primary-500)' }}>
                            {completionRate}%
                        </span>
                    </div>
                    <div
                        style={{
                            height: 8,
                            borderRadius: 4,
                            background: 'var(--color-neutral-100)',
                            overflow: 'hidden',
                        }}
                    >
                        <div
                            style={{
                                height: '100%',
                                width: `${completionRate}%`,
                                borderRadius: 4,
                                background: completionRate === 100
                                    ? 'linear-gradient(90deg, var(--color-success), #10b981)'
                                    : 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-500))',
                                transition: 'width 0.4s ease-out',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* Questions by Category */}
            {categories.map((cat, catIdx) => {
                const catAvg = categoryAverages.find((c) => c.name === cat.name);
                return (
                    <div
                        key={cat.name}
                        className="card"
                        style={{
                            marginBottom: 'var(--space-5)',
                            animation: `fadeIn 0.4s ease-out ${catIdx * 0.1}s both`,
                        }}
                    >
                        <div className="card-header">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                <span style={{ fontSize: 'var(--font-size-xl)' }}>{categoryIcons[cat.name]}</span>
                                <h3 className="card-title">{cat.name}</h3>
                            </div>
                            {catAvg && catAvg.average > 0 && (
                                <span style={{
                                    fontSize: 'var(--font-size-sm)',
                                    fontWeight: 600,
                                    color: catAvg.average >= 4 ? 'var(--color-success)' : catAvg.average >= 3 ? 'var(--color-warning)' : 'var(--color-danger)',
                                }}>
                                    平均: {catAvg.average.toFixed(1)}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            {cat.items.map((question) => {
                                const answer = answers.find((a) => a.question_id === question.id);
                                const score = answer?.score || 0;

                                return (
                                    <div key={question.id} className="survey-question-item">
                                        <div className="survey-question-text">{question.question}</div>
                                        <div className="survey-mood-group">
                                            {MOOD_ICONS.map((icon, idx) => {
                                                const value = idx + 1;
                                                const isSelected = score === value;
                                                const isDisabled = submitted || isPastPeriod;
                                                return (
                                                    <button
                                                        key={value}
                                                        className={`survey-mood-btn ${isSelected ? 'active' : ''}`}
                                                        onClick={() => handleScoreChange(question.id, value)}
                                                        disabled={isDisabled}
                                                        title={MOOD_LABELS[idx]}
                                                        style={{
                                                            '--mood-color': MOOD_COLORS[idx],
                                                            opacity: isDisabled && !isSelected ? 0.4 : 1,
                                                        } as React.CSSProperties}
                                                    >
                                                        <span className="survey-mood-icon">{icon}</span>
                                                        <span className="survey-mood-label">{MOOD_LABELS[idx]}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Free Comment */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 className="card-title">💬 自由コメント（任意）</h3>
                </div>
                <div className="card-body">
                    <textarea
                        className="form-textarea"
                        placeholder="職場環境や業務について、自由にお聞かせください。&#10;（例: 改善してほしいこと、良い点、不安に感じていること等）"
                        value={freeComment}
                        onChange={(e) => setFreeComment(e.target.value)}
                        disabled={submitted || isPastPeriod}
                        rows={4}
                    />
                    <div className="form-hint">
                        ※ 回答内容は統計的に処理され、個人が特定されることはありません。
                    </div>
                </div>
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-4) 0 var(--space-8)' }}>
                {!submitted && !isPastPeriod && (
                    <button
                        className="btn btn-primary btn-lg"
                        onClick={handleSubmit}
                        disabled={!allAnswered}
                        style={{ minWidth: 200 }}
                    >
                        {allAnswered ? '回答を送信する 📨' : `未回答の設問があります（${answers.filter(a => a.score > 0).length}/${answers.length}）`}
                    </button>
                )}
                {submitted && (
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--space-2)',
                            color: 'var(--color-success)',
                            fontWeight: 600,
                            fontSize: 'var(--font-size-md)',
                        }}
                    >
                        ✓ このサーベイは回答済みです
                    </div>
                )}
            </div>
        </div>
    );
}
