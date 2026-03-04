import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { surveyQuestions, surveyPeriods, surveys as existingSurveys, users, facilities, occupations } from '../data/mockData';
import type { SurveyAnswer, SurveyCategory } from '../types';

const MOOD_ICONS = ['😫', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['とても悪い', 'やや悪い', '普通', 'やや良い', 'とても良い'];
const MOOD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

const categoryIcons: Record<SurveyCategory, string> = {
    '仕事満足度': '💼',
    '人間関係': '🤝',
    '健康状態': '❤️',
    'キャリア展望': '🎯',
    'ワークライフバランス': '⚖️',
};

export default function SurveyMobile() {
    const { token } = useParams<{ token: string }>();

    // Parse token: format "u{userId}-sp{periodId}"
    const parsed = useMemo(() => {
        if (!token) return null;
        const match = token.match(/^(u[\w-]+)-(sp[\w-]+)$/);
        if (!match) return null;
        const userId = match[1];
        const periodId = match[2];
        const user = users.find((u) => u.id === userId);
        const period = surveyPeriods.find((p) => p.id === periodId);
        if (!user || !period) return null;
        return { user, period };
    }, [token]);

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

    const [currentStep, setCurrentStep] = useState(0); // 0 = welcome, 1..N = categories, N+1 = comment, N+2 = confirm
    const totalSteps = categories.length + 3; // welcome + categories + comment + done

    const [answers, setAnswers] = useState<SurveyAnswer[]>(
        surveyQuestions.map((q) => ({ question_id: q.id, score: 0 }))
    );
    const [freeComment, setFreeComment] = useState('');
    const [submitted, setSubmitted] = useState(false);

    // Check if already answered
    const alreadyAnswered = useMemo(() => {
        if (!parsed) return false;
        return existingSurveys.some(
            (s) => s.user_id === parsed.user.id && s.period_id === parsed.period.id && s.submitted
        );
    }, [parsed]);

    if (!parsed) {
        return (
            <div className="sm-container">
                <div className="sm-error-card">
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>🔗</div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#1a1a2e' }}>無効なリンクです</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        このURLは無効です。<br />管理者から正しいリンクを受け取ってください。
                    </p>
                </div>
            </div>
        );
    }

    const { user, period } = parsed;
    const facility = facilities.find((f) => f.id === user.facility_id);
    const occupation = occupations.find((o) => o.id === user.occupation_id);

    if (alreadyAnswered && !submitted) {
        return (
            <div className="sm-container">
                <div className="sm-header-bar">
                    <span className="sm-header-logo">📋</span>
                    <span className="sm-header-text">定期サーベイ</span>
                </div>
                <div className="sm-error-card">
                    <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                    <h2 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#1a1a2e' }}>回答済みです</h2>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem', lineHeight: 1.6 }}>
                        {period.name} のサーベイには既に回答済みです。<br />ご協力ありがとうございます。
                    </p>
                </div>
            </div>
        );
    }

    // Current category (step 1..N)
    const currentCategory = currentStep >= 1 && currentStep <= categories.length
        ? categories[currentStep - 1]
        : null;

    // Check if current step's questions are answered
    const canProceed = (() => {
        if (currentStep === 0) return true; // welcome
        if (currentCategory) {
            return currentCategory.items.every((q) => {
                const a = answers.find((ans) => ans.question_id === q.id);
                return a && a.score > 0;
            });
        }
        return true;
    })();

    const handleScore = (questionId: string, score: number) => {
        setAnswers((prev) =>
            prev.map((a) => (a.question_id === questionId ? { ...a, score } : a))
        );
    };

    const handleNext = () => {
        if (currentStep < totalSteps - 1) {
            setCurrentStep((s) => s + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((s) => s - 1);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
        setCurrentStep(totalSteps - 1);
    };

    const answeredCount = answers.filter((a) => a.score > 0).length;
    const progressPercent = Math.round((answeredCount / answers.length) * 100);

    // ========= DONE SCREEN =========
    if (submitted) {
        const overallAvg = answers.reduce((s, a) => s + a.score, 0) / answers.length;
        return (
            <div className="sm-container">
                <div className="sm-header-bar">
                    <span className="sm-header-logo">📋</span>
                    <span className="sm-header-text">定期サーベイ</span>
                </div>
                <div className="sm-done-screen fade-in">
                    <div className="sm-done-icon">🎉</div>
                    <h2 className="sm-done-title">回答ありがとうございます！</h2>
                    <p className="sm-done-subtitle">
                        {period.name} のサーベイ回答が完了しました。
                    </p>

                    <div className="sm-done-summary">
                        <div className="sm-done-score-row">
                            <span>総合スコア</span>
                            <span className="sm-done-score" style={{
                                color: overallAvg >= 4 ? '#10b981' : overallAvg >= 3 ? '#f59e0b' : '#ef4444'
                            }}>
                                {overallAvg.toFixed(1)}<span style={{ fontSize: '0.9rem', fontWeight: 400 }}> / 5.0</span>
                            </span>
                        </div>
                        {categories.map((cat) => {
                            const catAnswers = answers.filter((a) =>
                                cat.items.some((q) => q.id === a.question_id)
                            );
                            const avg = catAnswers.reduce((s, a) => s + a.score, 0) / catAnswers.length;
                            return (
                                <div key={cat.name} className="sm-done-cat-row">
                                    <span>{categoryIcons[cat.name]} {cat.name}</span>
                                    <span style={{
                                        fontWeight: 600,
                                        color: avg >= 4 ? '#10b981' : avg >= 3 ? '#f59e0b' : '#ef4444'
                                    }}>
                                        {avg.toFixed(1)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    <p className="sm-done-footer">
                        このページを閉じて大丈夫です 👋
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="sm-container">
            {/* Header */}
            <div className="sm-header-bar">
                <span className="sm-header-logo">📋</span>
                <span className="sm-header-text">定期サーベイ</span>
                <span className="sm-header-period">{period.name.replace(' 定期サーベイ', '')}</span>
            </div>

            {/* Progress */}
            {currentStep > 0 && (
                <div className="sm-progress">
                    <div className="sm-progress-bar">
                        <div
                            className="sm-progress-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                    <div className="sm-progress-text">
                        {answeredCount}/{answers.length} 回答済み
                    </div>
                </div>
            )}

            {/* Step Indicators */}
            {currentStep > 0 && currentStep <= categories.length + 1 && (
                <div className="sm-steps">
                    {categories.map((cat, idx) => (
                        <div
                            key={cat.name}
                            className={`sm-step-dot ${idx + 1 < currentStep ? 'done' : ''} ${idx + 1 === currentStep ? 'active' : ''}`}
                            title={cat.name}
                        >
                            {idx + 1 < currentStep ? '✓' : categoryIcons[cat.name]}
                        </div>
                    ))}
                    <div className={`sm-step-dot ${currentStep > categories.length ? 'active' : ''}`}>
                        💬
                    </div>
                </div>
            )}

            {/* ======= WELCOME STEP ======= */}
            {currentStep === 0 && (
                <div className="sm-welcome fade-in">
                    <div className="sm-welcome-icon">📋</div>
                    <h2 className="sm-welcome-title">定期サーベイ</h2>
                    <p className="sm-welcome-subtitle">{period.name}</p>

                    <div className="sm-welcome-user">
                        <div className="sm-welcome-avatar">
                            {user.name.charAt(0)}
                        </div>
                        <div>
                            <div className="sm-welcome-name">{user.name}</div>
                            <div className="sm-welcome-info">{facility?.name} / {occupation?.name}</div>
                        </div>
                    </div>

                    <div className="sm-welcome-desc">
                        <p>あなたの現在の気持ちを教えてください。</p>
                        <p>5つのカテゴリ × 各2問の全10問です。<br />所要時間は <strong>約2分</strong> です。</p>
                    </div>

                    <div className="sm-welcome-categories">
                        {categories.map((cat) => (
                            <div key={cat.name} className="sm-welcome-cat-item">
                                <span>{categoryIcons[cat.name]}</span>
                                <span>{cat.name}</span>
                            </div>
                        ))}
                    </div>

                    <div className="sm-welcome-note">
                        ※ 回答は匿名で集計され、個人が特定されることはありません。
                    </div>

                    <button className="sm-btn-primary" onClick={handleNext}>
                        回答を始める →
                    </button>
                </div>
            )}

            {/* ======= CATEGORY STEPS ======= */}
            {currentCategory && (
                <div className="sm-category fade-in" key={currentCategory.name}>
                    <div className="sm-category-header">
                        <span className="sm-category-icon">{categoryIcons[currentCategory.name]}</span>
                        <h3 className="sm-category-title">{currentCategory.name}</h3>
                        <span className="sm-category-step">
                            {currentStep} / {categories.length}
                        </span>
                    </div>

                    {currentCategory.items.map((question) => {
                        const answer = answers.find((a) => a.question_id === question.id);
                        const score = answer?.score || 0;

                        return (
                            <div key={question.id} className="sm-question">
                                <div className="sm-question-text">{question.question}</div>
                                <div className="sm-mood-row">
                                    {MOOD_ICONS.map((icon, idx) => {
                                        const value = idx + 1;
                                        const isSelected = score === value;
                                        return (
                                            <button
                                                key={value}
                                                className={`sm-mood-btn ${isSelected ? 'active' : ''}`}
                                                onClick={() => handleScore(question.id, value)}
                                                style={{ '--mood-color': MOOD_COLORS[idx] } as React.CSSProperties}
                                            >
                                                <span className="sm-mood-emoji">{icon}</span>
                                                <span className="sm-mood-text">{MOOD_LABELS[idx]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    <div className="sm-nav-row">
                        <button className="sm-btn-secondary" onClick={handleBack}>
                            ← 戻る
                        </button>
                        <button
                            className="sm-btn-primary"
                            onClick={handleNext}
                            disabled={!canProceed}
                        >
                            次へ →
                        </button>
                    </div>
                </div>
            )}

            {/* ======= COMMENT STEP ======= */}
            {currentStep === categories.length + 1 && (
                <div className="sm-category fade-in">
                    <div className="sm-category-header">
                        <span className="sm-category-icon">💬</span>
                        <h3 className="sm-category-title">自由コメント</h3>
                    </div>

                    <div className="sm-comment-section">
                        <p className="sm-comment-desc">
                            職場環境や業務について、自由にお聞かせください。（任意）
                        </p>
                        <textarea
                            className="sm-textarea"
                            placeholder="改善してほしいこと、良い点、不安に感じていること等…"
                            value={freeComment}
                            onChange={(e) => setFreeComment(e.target.value)}
                            rows={5}
                        />
                    </div>

                    <div className="sm-nav-row">
                        <button className="sm-btn-secondary" onClick={handleBack}>
                            ← 戻る
                        </button>
                        <button className="sm-btn-submit" onClick={handleSubmit}>
                            回答を送信する 📨
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
