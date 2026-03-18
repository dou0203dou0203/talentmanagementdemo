import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import type { SurveyAnswer, SurveyCategory } from '../types';
import { useAuth } from '../context/AuthContext';

const MOOD_ICONS = ['😫', '😟', '😐', '🙂', '😊'];
const MOOD_LABELS = ['とても悪い', 'やや悪い', '普通', 'やや良い', 'とても良い'];
const MOOD_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

export default function SurveyForm() {
    const { surveyQuestions, surveyPeriods, surveys: existingSurveys, users, facilities, occupations } = useData();
    // Use the actually logged-in user
    const { user: authUser } = useAuth();
    const currentUserId = authUser?.id || 'u-1';
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
    const [hrMessage, setHrMessage] = useState('');
    const [submitted, setSubmitted] = useState(existingAnswer?.submitted || false);
    const [showConfirmation, setShowConfirmation] = useState(false);
    const [surveyMode, setSurveyMode] = useState<'regular'|'leader'>('regular');
    const [thanksTargets, setThanksTargets] = useState<{userId:string;message:string}[]>([]);
    const [thanksInput, setThanksInput] = useState({userId:'',message:''});

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

    // Survey frequency calculation
    const monthsSinceHire = useMemo(() => {
        if (!currentUser.hire_date) return 999;
        const hire = new Date(currentUser.hire_date);
        const now = new Date();
        return (now.getFullYear()-hire.getFullYear())*12 + (now.getMonth()-hire.getMonth());
    }, [currentUser]);
    const isNewcomer = monthsSinceHire <= 3;
    const frequencyLabel = isNewcomer ? '毎月実施（入職後3ヶ月以内）' : '3ヶ月に1回実施';

    // Leader survey questions
    const leaderQuestions = [
        { id: 'lq-1', q: '他のスタッフから相談されることが多い', cat: '信頼性' },
        { id: 'lq-2', q: '困難な場面でも冷静に判断できる', cat: '判断力' },
        { id: 'lq-3', q: 'チームの目標を明確に伝えられる', cat: 'コミュニケーション' },
        { id: 'lq-4', q: '後輩の指導・育成に積極的に取り組んでいる', cat: '育成力' },
        { id: 'lq-5', q: '業務改善の提案を自発的に行っている', cat: '主体性' },
        { id: 'lq-6', q: '他職種との連携を円滑に進められる', cat: '調整力' },
        { id: 'lq-7', q: 'ストレスの高い状況でも安定したパフォーマンスを発揮する', cat: '耐性' },
        { id: 'lq-8', q: '組織のルールや理念を理解し、模範となる行動ができる', cat: '規律性' },
    ];
    const [leaderScores, setLeaderScores] = useState<Record<string,number>>({});
    const [leaderTarget, setLeaderTarget] = useState('u-4');
    const leaderAllAnswered = leaderQuestions.every(q => (leaderScores[q.id]||0) > 0);
    const leaderAvg = (() => { const vals = Object.values(leaderScores).filter(v=>v>0); return vals.length>0 ? (vals.reduce((a,b)=>a+b,0)/vals.length) : 0; })();

    // Other staff for thanks points (exclude self)
    const otherStaff = users.filter(u => u.id !== currentUserId && u.status === 'active');
    const addThanksTarget = () => {
        if (!thanksInput.userId || thanksTargets.length >= 3) return;
        if (thanksTargets.some(t => t.userId === thanksInput.userId)) return;
        setThanksTargets(prev => [...prev, { ...thanksInput }]);
        setThanksInput({ userId: '', message: '' });
    };
    const removeThanksTarget = (userId: string) => setThanksTargets(prev => prev.filter(t => t.userId !== userId));

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
            <h2 className="page-title">サーベイ</h2>
            <p className="page-subtitle">あなたの現在の気持ちを教えてください。回答は匿名で集計され、職場環境の改善に活用されます。</p>

            {/* Survey Mode Tabs */}
            <div className="sp-tabs" style={{marginBottom:'var(--space-5)'}}>
                <button className={'sp-tab '+(surveyMode==='regular'?'active':'')} onClick={()=>setSurveyMode('regular')}>
                    <span>📋</span> 定期サーベイ
                </button>
                <button className={'sp-tab '+(surveyMode==='leader'?'active':'')} onClick={()=>setSurveyMode('leader')}>
                    <span>👑</span> リーダー適性サーベイ
                </button>
            </div>

            {/* Frequency Info */}
            <div style={{display:'flex',alignItems:'center',gap:'var(--space-3)',padding:'var(--space-3) var(--space-4)',background:isNewcomer?'#fffbeb':'var(--color-primary-50)',borderRadius:'var(--radius-md)',marginBottom:'var(--space-5)',border:'1px solid '+(isNewcomer?'#fde68a':'var(--color-primary-100)'),fontSize:'var(--font-size-sm)'}}>
                <span style={{fontSize:'var(--font-size-lg)'}}>{isNewcomer?'🌱':'📅'}</span>
                <div>
                    <strong>実施頻度:</strong> {frequencyLabel}
                    {isNewcomer && <span style={{marginLeft:8,color:'#f59e0b',fontWeight:600}}>★ 新人期間中</span>}
                </div>
            </div>

            {surveyMode==='regular' && (<>
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

            {/* Free-text question: HR message */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--font-size-xl)' }}>📝</span>
                        <h3 className="card-title">人事部への自由記述</h3>
                    </div>
                </div>
                <div className="card-body">
                    <div className="survey-question-item" style={{ borderBottom: 'none' }}>
                        <div className="survey-question-text" style={{ fontWeight: 500 }}>
                            人事部に伝えたいことがあればご自由にお書きください（任意）
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', marginBottom: 'var(--space-3)' }}>
                            例：職場環境の改善要望、キャリアに関する相談、制度への意見など
                        </div>
                        <textarea
                            className="form-textarea"
                            placeholder="人事部に伝えたいことをご記入ください..."
                            value={hrMessage}
                            onChange={(e) => setHrMessage(e.target.value)}
                            disabled={submitted || isPastPeriod}
                            rows={4}
                            style={{ width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Free Comment */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 className="card-title">💬 その他の自由コメント（任意）</h3>
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

            {/* Thanks Points Section */}
            {!submitted && !isPastPeriod && (
            <div className="card" style={{marginBottom:'var(--space-6)'}}>
                <div className="card-header">
                    <div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
                        <span style={{fontSize:'var(--font-size-xl)'}}>💝</span>
                        <h3 className="card-title">ありがとうポイントを送る（最大3名）</h3>
                    </div>
                    <span className="badge badge-neutral">{thanksTargets.length}/3</span>
                </div>
                <div className="card-body">
                    <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-500)',marginBottom:'var(--space-3)'}}>感謝を伝えたい同僚を選んで、メッセージを送りましょう。</p>
                    {thanksTargets.map(t => {
                        const tu = users.find(u2=>u2.id===t.userId);
                        return (
                            <div key={t.userId} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)',marginBottom:8}}>
                                <span>💝</span>
                                <strong style={{fontSize:'var(--font-size-sm)'}}>{tu?.name}</strong>
                                <span style={{flex:1,fontSize:'var(--font-size-xs)',color:'var(--color-neutral-500)'}}>{t.message}</span>
                                <button className="btn btn-sm" style={{padding:'2px 8px',fontSize:12}} onClick={()=>removeThanksTarget(t.userId)}>✕</button>
                            </div>
                        );
                    })}
                    {thanksTargets.length < 3 && (
                        <div style={{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}}>
                            <div className="form-group" style={{flex:'0 0 200px',marginBottom:0}}>
                                <select className="form-select" value={thanksInput.userId} onChange={e=>setThanksInput(p=>({...p,userId:e.target.value}))}>
                                    <option value="">選択してください</option>
                                    {otherStaff.filter(u=>!thanksTargets.some(t=>t.userId===u.id)).map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{flex:1,marginBottom:0}}>
                                <input type="text" className="form-input" placeholder="メッセージ（任意）" value={thanksInput.message} onChange={e=>setThanksInput(p=>({...p,message:e.target.value}))} />
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={addThanksTarget} disabled={!thanksInput.userId}>💝 追加</button>
                        </div>
                    )}
                </div>
            </div>
            )}

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
            </>)}

            {/* ===== LEADER SURVEY MODE ===== */}
            {surveyMode==='leader' && (
            <div>
                <div className='card' style={{marginBottom:'var(--space-5)'}}>
                    <div className='card-header'>
                        <div style={{display:'flex',alignItems:'center',gap:'var(--space-2)'}}>
                            <span style={{fontSize:'var(--font-size-xl)'}}>👑</span>
                            <h3 className='card-title'>リーダー適性サーベイ（年次）</h3>
                        </div>
                        <span className='badge badge-primary'>管理職候補発見用</span>
                    </div>
                    <div className='card-body'>
                        <p style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-600)',marginBottom:'var(--space-4)'}}>次のスタッフのリーダーとしての適性を評価してください。年に1回実施されます。</p>
                        <div className='form-group' style={{maxWidth:300}}>
                            <label className='form-label'>評価対象者</label>
                            <select className='form-select' value={leaderTarget} onChange={e=>{setLeaderTarget(e.target.value);setLeaderScores({});}}>
                                {otherStaff.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>
                {leaderQuestions.map((lq) => {
                    const sc = leaderScores[lq.id]||0;
                    return (
                        <div key={lq.id} className='card' style={{marginBottom:'var(--space-3)'}}>
                            <div className='card-body'>
                                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8}}>
                                    <div style={{fontSize:'var(--font-size-sm)',fontWeight:500}}>{lq.q}</div>
                                    <span className='badge badge-neutral' style={{fontSize:10,flexShrink:0}}>{lq.cat}</span>
                                </div>
                                <div className='survey-mood-group'>
                                    {MOOD_ICONS.map((icon,idx) => {
                                        const val = idx+1;
                                        return (
                                            <button key={val} className={'survey-mood-btn '+(sc===val?'active':'')}
                                                onClick={()=>setLeaderScores(p=>({...p,[lq.id]:val}))}
                                                title={MOOD_LABELS[idx]}
                                                style={{'--mood-color':MOOD_COLORS[idx]} as React.CSSProperties}>
                                                <span className='survey-mood-icon'>{icon}</span>
                                                <span className='survey-mood-label'>{MOOD_LABELS[idx]}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {leaderAvg > 0 && (
                    <div style={{textAlign:'center',padding:'var(--space-4)',background:'var(--color-neutral-50)',borderRadius:'var(--radius-lg)',marginBottom:'var(--space-4)'}}>
                        <div style={{fontSize:'var(--font-size-sm)',color:'var(--color-neutral-500)'}}>リーダー適性スコア</div>
                        <div style={{fontSize:'var(--font-size-xl)',fontWeight:700,color:leaderAvg>=4?'var(--color-success)':leaderAvg>=3?'var(--color-warning)':'var(--color-danger)'}}>{leaderAvg.toFixed(1)} / 5.0</div>
                    </div>
                )}
                <div style={{display:'flex',justifyContent:'center',padding:'var(--space-4) 0 var(--space-8)'}}>
                    <button className='btn btn-primary btn-lg' disabled={!leaderAllAnswered}
                        onClick={()=>alert(users.find(u=>u.id===leaderTarget)?.name+'さんのリーダー適性評価を送信しました（デモ）')} style={{minWidth:200}}>
                        {leaderAllAnswered ? '👑 評価を送信する' : '全設問に回答してください'}
                    </button>
                </div>
            </div>
            )}
        </div>
    );
}
