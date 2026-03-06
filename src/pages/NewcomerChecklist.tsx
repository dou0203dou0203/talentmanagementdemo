import { useState, useMemo } from 'react';
import { users, occupations, facilities } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// Checklist data from Excel
const checklistCategories = [
    {
        name: '接遇・マナー', icon: '🤝',
        items: [
            '髪はきちんとまとめる、爪は短くしている、香水等をつけていないなどの清潔管理ができている',
            '利用者や家族への説明時に、安心感や納得感を持たせる対応ができる',
            '利用者やご家族様に対して丁寧な敬語・態度で接することができる',
            'ご自宅や施設に入る際、明るい挨拶や靴を揃える、荷物は床にまとめておくことができている',
            '移動時間を含めたスケジュールの自己管理と遅刻防止',
        ],
    },
    {
        name: '勤務態度・コンプライアンス', icon: '📏',
        items: [
            '無断での遅刻・欠勤なく就業にあたっている',
            '業務において、自己判断の許容範囲を理解し、必要に応じ管理者や同職員への報連相ができている',
            '会社のルールを守って就業にしている',
            'iPadや血圧計、体温計、自転車や原付バイク等の備品をなるべく丁寧に扱っている',
            '利用者の個人情報や会社内の情報を漏洩させず、正しく管理できる',
            '誰も見ていないところでも、倫理的に正しい行動を選択できる',
        ],
    },
    {
        name: 'リスク管理', icon: '⚠️',
        items: [
            '手指消毒などの標準予防策を含め、感染症に応じた対策を実施した上で介入できる',
            '既往歴や現病歴から考えられるリスクを想起できる',
            'フィジカルアセスメントからリスクを考えれる',
            '急変などが発生した際、バイタルサインや意識レベルをすぐ確認し、管理者や事務所へ報告できる',
            '緊急時対応（救急要請）の流れを理解できている',
        ],
    },
    {
        name: '事務・書類', icon: '📄',
        items: [
            'カイポケの基本操作ができる',
            '当日の訪問記録はその日のうちに抜けがなく完了させている',
            '訪問看護計画書・報告書が作成できる（専門用語が多すぎず、多職種に伝わりやすい内容か）',
            '書類などの提出物の期日を守れている',
        ],
    },
    {
        name: '臨床スキル・環境調整', icon: '🏥',
        items: [
            '利用者・ご家族の要望と利用者の状態を踏まえた上で目標設定・リハビリ内容の立案ができる',
            '利用者の体調・環境などの変化に応じて、介入方法を柔軟に調整できる',
            '利用者の全身状態を把握し、適切なポジショニングができる',
            '福祉用具の選定・変更、住宅改修の具体的な提案を、利用者の状態や環境に応じて適切に実施できる',
        ],
    },
    {
        name: '説明・指導', icon: '📢',
        items: [
            '必要に応じて、ご家族や施設スタッフへ介助方法（移乗・ポジショニング等）を指導したり、確認ができる',
        ],
    },
    {
        name: '多職種連携', icon: '👥',
        items: [
            '看護師・他療法士と連携し、日常的に必要な情報共有や申し送りができている',
            '利用者の状態や生活背景に合わせて、訪問時に確認または実施してほしいことを依頼できる',
        ],
    },
    {
        name: '制度理解', icon: '📚',
        items: [
            '介護保険・医療保険の仕組みを理解し、利用者へ説明できる',
        ],
    },
    {
        name: '自己成長', icon: '🌱',
        items: [
            '同じミスを繰り返さないための工夫を自分なりに考えているか',
            'サービスを実施する上で、不明な点や疑問点はその場で確認し、解決させている',
            'より良いサービスを提供するための自己学習を行い、利用者に還元しようとしている',
        ],
    },
];

const SCORE_DEFS = [
    { value: 1, label: '未習得', desc: '見学・同行し指導が必要', color: '#ef4444' },
    { value: 2, label: '要サポート', desc: '手順はわかるが、随時助言やサポートが必要', color: '#f59e0b' },
    { value: 3, label: '概ね遂行可', desc: '基本的な業務は概ね遂行可、細かい点はサポートが必要', color: '#22c55e' },
    { value: 4, label: '自立遂行', desc: '1人で遂行でき、事後報告で対応可能なレベル', color: '#10b981' },
];

const PERIODS = ['3ヵ月', '6ヵ月', '12ヵ月'] as const;

type ScoreMap = Record<string, number>; // key = "catIdx-itemIdx"

export default function NewcomerChecklist() {
    const { user: currentUser, permissions } = useAuth();
    const [selectedUserId, setSelectedUserId] = useState('u-4');
    const [selectedPeriod, setSelectedPeriod] = useState<string>('3ヵ月');
    const [scores, setScores] = useState<ScoreMap>({});
    const [fbComment, setFbComment] = useState('');

    // Filterable staff
    const staffUsers = useMemo(() => {
        const base = permissions.canViewAllStaff
            ? users
            : permissions.canViewFacility
                ? users.filter((u) => u.facility_id === currentUser?.facility_id)
                : users.filter((u) => u.id === currentUser?.id);
        return base.filter((u) => u.status === 'active');
    }, [permissions, currentUser]);

    const selectedUser = users.find((u) => u.id === selectedUserId);
    const userOcc = occupations.find((o) => o.id === selectedUser?.occupation_id);
    const userFac = facilities.find((f) => f.id === selectedUser?.facility_id);

    const setScore = (key: string, value: number) => {
        setScores((prev) => ({ ...prev, [key]: prev[key] === value ? 0 : value }));
    };

    const totalItems = checklistCategories.reduce((sum, cat) => sum + cat.items.length, 0);
    const answeredItems = Object.values(scores).filter((v) => v > 0).length;
    const completionRate = totalItems > 0 ? Math.round((answeredItems / totalItems) * 100) : 0;
    const avgScore = answeredItems > 0 ? (Object.values(scores).filter((v) => v > 0).reduce((s, v) => s + v, 0) / answeredItems) : 0;

    const handleSave = () => {
        alert(`${selectedUser?.name}の${selectedPeriod}チェックシートを保存しました（デモ）`);
    };

    const handleSubmit = () => {
        if (answeredItems < totalItems) {
            alert(`未評価の項目が${totalItems - answeredItems}件あります`);
            return;
        }
        alert(`${selectedUser?.name}の${selectedPeriod}チェックシートを提出しました（デモ）`);
    };

    return (
        <div className="fade-in">
            <h2 className="page-title">新人チェックシート</h2>
            <p className="page-subtitle">新入職員の習得状況を3ヵ月・6ヵ月・12ヵ月のタイミングで評価します</p>

            {/* Controls */}
            <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
                <div className="card-body" style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'end' }}>
                    <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
                        <label className="form-label">対象者</label>
                        <select className="form-select" value={selectedUserId} onChange={(e) => { setSelectedUserId(e.target.value); setScores({}); setFbComment(''); }}>
                            {staffUsers.map((u) => (
                                <option key={u.id} value={u.id}>{u.name}（{occupations.find((o) => o.id === u.occupation_id)?.name}）</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group" style={{ flex: '0 0 160px', marginBottom: 0 }}>
                        <label className="form-label">評価時期</label>
                        <select className="form-select" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                            {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                        <div className="sp-avatar" style={{ width: 36, height: 36, fontSize: 14 }}>{selectedUser?.name.charAt(0)}</div>
                        <div>
                            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{selectedUser?.name}</div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>{userOcc?.name} · {userFac?.name}</div>
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
                        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: avgScore >= 3.5 ? 'var(--color-success)' : avgScore >= 2.5 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
                            平均: {avgScore.toFixed(1)}
                        </span>
                    )}
                </div>
            </div>

            {/* Checklist Categories */}
            {checklistCategories.map((cat, catIdx) => {
                const catScores = cat.items.map((_, itemIdx) => scores[`${catIdx}-${itemIdx}`] || 0);
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
                            {catAvg > 0 && (
                                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: catAvg >= 3.5 ? 'var(--color-success)' : catAvg >= 2.5 ? '#f59e0b' : 'var(--color-danger)' }}>
                                    平均: {catAvg.toFixed(1)}
                                </span>
                            )}
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {cat.items.map((item, itemIdx) => {
                                const key = `${catIdx}-${itemIdx}`;
                                const currentScore = scores[key] || 0;
                                return (
                                    <div key={itemIdx} className="ncl-item">
                                        <div className="ncl-item-text">
                                            <span className="ncl-item-num">{itemIdx + 1}</span>
                                            {item}
                                        </div>
                                        <div className="ncl-score-group">
                                            {SCORE_DEFS.map((d) => (
                                                <button key={d.value} type="button"
                                                    className={`ncl-score-btn ${currentScore === d.value ? 'active' : ''}`}
                                                    style={{ '--ncl-color': d.color } as React.CSSProperties}
                                                    onClick={() => setScore(key, d.value)}
                                                    title={`${d.value}: ${d.label}`}
                                                >
                                                    {d.value}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            {/* Feedback Comment */}
            <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                <div className="card-header">
                    <h3 className="card-title">📝 振り返り・フィードバックコメント</h3>
                </div>
                <div className="card-body">
                    <textarea className="form-textarea" rows={5} placeholder="新人スタッフの成長や改善点について、具体的にフィードバックを記入してください..."
                        value={fbComment} onChange={(e) => setFbComment(e.target.value)} />
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-3)', padding: 'var(--space-4) 0 var(--space-8)' }}>
                <button className="btn btn-secondary" onClick={handleSave} style={{ minWidth: 140 }}>💾 一時保存</button>
                <button className="btn btn-primary btn-lg" onClick={handleSubmit} style={{ minWidth: 200 }}>
                    {completionRate === 100 ? '✅ チェックシートを提出' : `未評価: ${totalItems - answeredItems}件`}
                </button>
            </div>
        </div>
    );
}

