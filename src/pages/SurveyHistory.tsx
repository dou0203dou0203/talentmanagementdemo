import { useMemo, useState } from 'react';
import { Radar, Line } from 'react-chartjs-2';
import { QRCodeSVG } from 'qrcode.react';
import {
    Chart as ChartJS,
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend,
} from 'chart.js';
import {
    surveys,
    surveyPeriods,
    surveyQuestions,
    users,
    facilities,
    occupations,
} from '../data/mockData';
import type { SurveyCategory } from '../types';

ChartJS.register(
    RadialLinearScale,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

type TabKey = 'periods' | 'individual' | 'summary';

const categoryLabels: SurveyCategory[] = [
    '仕事満足度', '人間関係', '健康状態', 'キャリア展望', 'ワークライフバランス',
];

const categoryIcons: Record<SurveyCategory, string> = {
    '仕事満足度': '💼',
    '人間関係': '🤝',
    '健康状態': '❤️',
    'キャリア展望': '🎯',
    'ワークライフバランス': '⚖️',
};

export default function SurveyHistory() {
    const [activeTab, setActiveTab] = useState<TabKey>('periods');
    const [selectedUserId, setSelectedUserId] = useState('u-5');
    const [qrModalUser, setQrModalUser] = useState<string | null>(null);

    const activeStaff = users.filter((u) => u.status === 'active' || u.status === 'leave');

    // ==============================
    // Period Management View
    // ==============================
    const periodStats = useMemo(() => {
        return surveyPeriods.map((period) => {
            const periodSurveys = surveys.filter((s) => s.period_id === period.id);
            const totalStaff = activeStaff.length;
            const responded = periodSurveys.filter((s) => s.submitted).length;
            const responseRate = totalStaff > 0 ? Math.round((responded / totalStaff) * 100) : 0;

            const avgMental = periodSurveys.length > 0
                ? Math.round(periodSurveys.reduce((sum, s) => sum + s.mental_score, 0) / periodSurveys.length)
                : 0;
            const avgMotivation = periodSurveys.length > 0
                ? Math.round(periodSurveys.reduce((sum, s) => sum + s.motivation_score, 0) / periodSurveys.length)
                : 0;

            return {
                ...period,
                responded,
                totalStaff,
                responseRate,
                avgMental,
                avgMotivation,
            };
        }).reverse();
    }, [activeStaff]);

    // ==============================
    // Individual Radar + Trend
    // ==============================
    const selectedUser = users.find((u) => u.id === selectedUserId);
    const selectedFacility = facilities.find((f) => f.id === selectedUser?.facility_id);
    const selectedOccupation = occupations.find((o) => o.id === selectedUser?.occupation_id);

    const userSurveys = useMemo(() => {
        return surveys
            .filter((s) => s.user_id === selectedUserId)
            .sort((a, b) => new Date(a.survey_date).getTime() - new Date(b.survey_date).getTime());
    }, [selectedUserId]);

    // Latest survey with answers for radar chart
    const latestWithAnswers = useMemo(() => {
        return [...userSurveys].reverse().find((s) => s.answers && s.answers.length > 0);
    }, [userSurveys]);

    const radarData = useMemo(() => {
        if (!latestWithAnswers?.answers) return null;

        const categoryScores = categoryLabels.map((cat) => {
            const catQuestions = surveyQuestions.filter((q) => q.category === cat);
            const catAnswers = catQuestions
                .map((q) => latestWithAnswers.answers!.find((a) => a.question_id === q.id))
                .filter((a) => a && a.score > 0);
            if (catAnswers.length === 0) return 0;
            return catAnswers.reduce((sum, a) => sum + (a?.score || 0), 0) / catAnswers.length;
        });

        return {
            labels: categoryLabels,
            datasets: [
                {
                    label: selectedUser?.name || '',
                    data: categoryScores,
                    backgroundColor: 'rgba(13, 158, 158, 0.2)',
                    borderColor: 'rgba(13, 158, 158, 0.8)',
                    borderWidth: 2,
                    pointBackgroundColor: 'rgba(13, 158, 158, 1)',
                    pointRadius: 4,
                },
            ],
        };
    }, [latestWithAnswers, selectedUser]);

    const radarOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
        },
        scales: {
            r: {
                min: 0,
                max: 5,
                ticks: {
                    stepSize: 1,
                    font: { size: 11 },
                    backdropColor: 'transparent',
                },
                pointLabels: {
                    font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 12 },
                },
                grid: {
                    color: 'rgba(0,0,0,0.06)',
                },
            },
        },
    };

    // Trend line chart
    const trendData = useMemo(() => {
        return {
            labels: userSurveys.map((s) => {
                const d = new Date(s.survey_date);
                return `${d.getFullYear()}/${d.getMonth() + 1}`;
            }),
            datasets: [
                {
                    label: 'メンタルスコア',
                    data: userSurveys.map((s) => s.mental_score),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                },
                {
                    label: 'モチベーション',
                    data: userSurveys.map((s) => s.motivation_score),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                },
            ],
        };
    }, [userSurveys]);

    const trendOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 12 },
                    usePointStyle: true,
                },
            },
        },
        scales: {
            y: { min: 0, max: 100, grid: { color: 'rgba(0,0,0,0.04)' } },
            x: { grid: { display: false } },
        },
    };

    // ==============================
    // Summary View - averages by facility
    // ==============================
    const facilitySummary = useMemo(() => {
        const latestClosedPeriod = surveyPeriods.filter((p) => p.status === 'closed').slice(-1)[0];
        if (!latestClosedPeriod) return [];

        return facilities
            .filter((f) => f.type !== '本部')
            .map((facility) => {
                const facilityUsers = users.filter((u) => u.facility_id === facility.id);
                const facilitySurveys = surveys.filter(
                    (s) => s.period_id === latestClosedPeriod.id && facilityUsers.some((u) => u.id === s.user_id)
                );

                const avgMental = facilitySurveys.length > 0
                    ? Math.round(facilitySurveys.reduce((sum, s) => sum + s.mental_score, 0) / facilitySurveys.length)
                    : 0;
                const avgMotivation = facilitySurveys.length > 0
                    ? Math.round(facilitySurveys.reduce((sum, s) => sum + s.motivation_score, 0) / facilitySurveys.length)
                    : 0;

                return {
                    facility,
                    responded: facilitySurveys.length,
                    total: facilityUsers.length,
                    avgMental,
                    avgMotivation,
                    avg: avgMental > 0 ? Math.round((avgMental + avgMotivation) / 2) : 0,
                };
            })
            .filter((f) => f.total > 0);
    }, []);

    // Stats
    const totalSurveys = surveys.length;
    const activePeriod = surveyPeriods.find((p) => p.status === 'active');
    const activePeriodSurveys = activePeriod ? surveys.filter((s) => s.period_id === activePeriod.id) : [];
    const activeResponseRate = activePeriod
        ? Math.round((activePeriodSurveys.length / activeStaff.length) * 100)
        : 0;

    return (
        <div className="fade-in">
            <h2 className="page-title">サーベイ管理</h2>
            <p className="page-subtitle">
                定期サーベイの配信履歴・回答率・個人別の推移を確認できます。
            </p>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-500)' }}>
                        📋
                    </div>
                    <div className="stat-card-value">{surveyPeriods.length}</div>
                    <div className="stat-card-label">配信回数</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                        ✉️
                    </div>
                    <div className="stat-card-value">{totalSurveys}</div>
                    <div className="stat-card-label">累計回答数</div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: activePeriod ? 'var(--color-success-bg)' : 'var(--color-neutral-100)', color: activePeriod ? 'var(--color-success)' : 'var(--color-neutral-400)' }}>
                        📡
                    </div>
                    <div className="stat-card-value">{activePeriod ? '配信中' : '—'}</div>
                    <div className="stat-card-label">
                        {activePeriod ? `回答率: ${activeResponseRate}%` : '次回配信なし'}
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--color-accent-50)', color: 'var(--color-accent-500)' }}>
                        ❓
                    </div>
                    <div className="stat-card-value">{surveyQuestions.length}</div>
                    <div className="stat-card-label">設問数</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tab-nav">
                <button className={`tab-item ${activeTab === 'periods' ? 'active' : ''}`} onClick={() => setActiveTab('periods')}>
                    📅 配信履歴
                </button>
                <button className={`tab-item ${activeTab === 'individual' ? 'active' : ''}`} onClick={() => setActiveTab('individual')}>
                    👤 個人別詳細
                </button>
                <button className={`tab-item ${activeTab === 'summary' ? 'active' : ''}`} onClick={() => setActiveTab('summary')}>
                    🏥 拠点別集計
                </button>
            </div>

            {/* ====== Periods Tab ====== */}
            {activeTab === 'periods' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">📅 サーベイ配信履歴</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>期間名</th>
                                    <th>配信期間</th>
                                    <th>ステータス</th>
                                    <th>回答率</th>
                                    <th>メンタル平均</th>
                                    <th>モチベ平均</th>
                                </tr>
                            </thead>
                            <tbody>
                                {periodStats.map((ps) => (
                                    <tr key={ps.id}>
                                        <td style={{ fontWeight: 500 }}>{ps.name}</td>
                                        <td style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
                                            {ps.start_date} 〜 {ps.end_date}
                                        </td>
                                        <td>
                                            <span className={`badge ${ps.status === 'active' ? 'badge-success' : ps.status === 'closed' ? 'badge-neutral' : 'badge-warning'}`}>
                                                {ps.status === 'active' ? '配信中' : ps.status === 'closed' ? '終了' : '予定'}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                <div style={{
                                                    width: 60,
                                                    height: 6,
                                                    borderRadius: 3,
                                                    background: 'var(--color-neutral-100)',
                                                    overflow: 'hidden',
                                                }}>
                                                    <div style={{
                                                        width: `${ps.responseRate}%`,
                                                        height: '100%',
                                                        borderRadius: 3,
                                                        background: ps.responseRate >= 80 ? 'var(--color-success)' : ps.responseRate >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                    }} />
                                                </div>
                                                <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600 }}>
                                                    {ps.responseRate}% ({ps.responded}/{ps.totalStaff})
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {ps.avgMental > 0 && (
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: ps.avgMental >= 70 ? 'var(--color-success)' : ps.avgMental >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                }}>
                                                    {ps.avgMental}
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            {ps.avgMotivation > 0 && (
                                                <span style={{
                                                    fontWeight: 600,
                                                    color: ps.avgMotivation >= 70 ? 'var(--color-success)' : ps.avgMotivation >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                }}>
                                                    {ps.avgMotivation}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ====== Individual Tab ====== */}
            {activeTab === 'individual' && (
                <div>
                    {/* User Selector */}
                    <div className="card" style={{ marginBottom: 'var(--space-6)' }}>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap', alignItems: 'end' }}>
                                <div className="form-group" style={{ flex: '1 1 300px', marginBottom: 0 }}>
                                    <label className="form-label">スタッフを選択</label>
                                    <select
                                        className="form-select"
                                        value={selectedUserId}
                                        onChange={(e) => setSelectedUserId(e.target.value)}
                                    >
                                        {activeStaff.map((u) => {
                                            const occ = occupations.find((o) => o.id === u.occupation_id);
                                            const fac = facilities.find((f) => f.id === u.facility_id);
                                            return (
                                                <option key={u.id} value={u.id}>
                                                    {u.name} （{occ?.name}・{fac?.name}）{u.status === 'leave' ? ' [休職中]' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                    <span className="badge badge-primary">
                                        回答数: {userSurveys.length}件
                                    </span>
                                    <button
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => setQrModalUser(selectedUserId)}
                                        title="QRコードを表示"
                                    >
                                        📱 QR
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Info Card */}
                    {selectedUser && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--space-4)',
                                padding: 'var(--space-4) var(--space-5)',
                                background: 'linear-gradient(135deg, var(--color-primary-50), var(--color-neutral-50))',
                                borderRadius: 'var(--radius-lg)',
                                marginBottom: 'var(--space-6)',
                                border: '1px solid var(--color-primary-100)',
                            }}
                        >
                            <div
                                style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 'var(--radius-full)',
                                    background: 'linear-gradient(135deg, var(--color-primary-400), var(--color-accent-400))',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 700,
                                    fontSize: 'var(--font-size-lg)',
                                    flexShrink: 0,
                                }}
                            >
                                {selectedUser.name.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)' }}>{selectedUser.name}</div>
                                <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
                                    {selectedFacility?.name} / {selectedOccupation?.name}
                                    {selectedUser.status === 'leave' && (
                                        <span className="badge badge-danger" style={{ marginLeft: 'var(--space-2)' }}>休職中</span>
                                    )}
                                </div>
                            </div>
                            {userSurveys.length > 0 && (
                                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>最新スコア</div>
                                    <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: userSurveys[userSurveys.length - 1].mental_score >= 60 ? 'var(--color-primary-600)' : 'var(--color-danger)' }}>
                                        M:{userSurveys[userSurveys.length - 1].mental_score} / V:{userSurveys[userSurveys.length - 1].motivation_score}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="grid-2">
                        {/* Radar Chart */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">🕸️ カテゴリ別スコア</h3>
                                {latestWithAnswers && (
                                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
                                        {latestWithAnswers.survey_date} 回答分
                                    </span>
                                )}
                            </div>
                            <div className="card-body">
                                {radarData ? (
                                    <div style={{ height: 300 }}>
                                        <Radar data={radarData} options={radarOptions} />
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 300,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-neutral-400)',
                                        flexDirection: 'column',
                                        gap: 'var(--space-2)',
                                    }}>
                                        <span style={{ fontSize: '2rem' }}>📊</span>
                                        <span style={{ fontSize: 'var(--font-size-sm)' }}>詳細回答データなし</span>
                                    </div>
                                )}

                                {/* Category breakdown */}
                                {latestWithAnswers?.answers && (
                                    <div style={{ marginTop: 'var(--space-4)' }}>
                                        {categoryLabels.map((cat) => {
                                            const catQuestions = surveyQuestions.filter((q) => q.category === cat);
                                            const catAnswers = catQuestions
                                                .map((q) => latestWithAnswers.answers!.find((a) => a.question_id === q.id))
                                                .filter((a) => a && a.score > 0);
                                            const avg = catAnswers.length > 0
                                                ? catAnswers.reduce((sum, a) => sum + (a?.score || 0), 0) / catAnswers.length
                                                : 0;

                                            return (
                                                <div
                                                    key={cat}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--space-3)',
                                                        padding: 'var(--space-2) 0',
                                                        borderBottom: '1px solid var(--color-neutral-100)',
                                                    }}
                                                >
                                                    <span style={{ fontSize: 'var(--font-size-sm)', width: 24 }}>{categoryIcons[cat]}</span>
                                                    <span style={{ fontSize: 'var(--font-size-xs)', flex: 1 }}>{cat}</span>
                                                    <div style={{
                                                        width: 80,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: 'var(--color-neutral-100)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            width: `${(avg / 5) * 100}%`,
                                                            height: '100%',
                                                            borderRadius: 3,
                                                            background: avg >= 4 ? 'var(--color-success)' : avg >= 3 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                            transition: 'width 0.3s',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: 'var(--font-size-xs)',
                                                        fontWeight: 600,
                                                        width: 30,
                                                        textAlign: 'right',
                                                        color: avg >= 4 ? 'var(--color-success)' : avg >= 3 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                    }}>
                                                        {avg.toFixed(1)}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Trend Chart */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">📈 スコア推移</h3>
                            </div>
                            <div className="card-body">
                                {userSurveys.length > 0 ? (
                                    <div className="chart-container">
                                        <Line data={trendData} options={trendOptions} />
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 300,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-neutral-400)',
                                    }}>
                                        回答データなし
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Free comments */}
                    {latestWithAnswers?.free_comment && (
                        <div className="card" style={{ marginTop: 'var(--space-6)' }}>
                            <div className="card-header">
                                <h3 className="card-title">💬 フリーコメント</h3>
                            </div>
                            <div className="card-body">
                                <div style={{
                                    padding: 'var(--space-4)',
                                    background: 'var(--color-neutral-50)',
                                    borderRadius: 'var(--radius-md)',
                                    borderLeft: '4px solid var(--color-primary-400)',
                                    fontSize: 'var(--font-size-sm)',
                                    lineHeight: 'var(--line-height-relaxed)',
                                    fontStyle: 'italic',
                                    color: 'var(--color-neutral-700)',
                                }}>
                                    "{latestWithAnswers.free_comment}"
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ====== Summary Tab ====== */}
            {activeTab === 'summary' && (
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">🏥 拠点別サーベイ集計（最新期間）</h3>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>拠点</th>
                                    <th>種別</th>
                                    <th>回答数</th>
                                    <th>メンタル平均</th>
                                    <th>モチベ平均</th>
                                    <th>総合</th>
                                </tr>
                            </thead>
                            <tbody>
                                {facilitySummary.map((fs) => (
                                    <tr key={fs.facility.id}>
                                        <td style={{ fontWeight: 500 }}>{fs.facility.name}</td>
                                        <td>
                                            <span className="badge badge-neutral">{fs.facility.type}</span>
                                        </td>
                                        <td style={{ fontSize: 'var(--font-size-sm)' }}>
                                            {fs.responded}/{fs.total}
                                        </td>
                                        <td>
                                            {fs.avgMental > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <div style={{
                                                        width: 50,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: 'var(--color-neutral-100)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            width: `${fs.avgMental}%`,
                                                            height: '100%',
                                                            borderRadius: 3,
                                                            background: fs.avgMental >= 70 ? 'var(--color-success)' : fs.avgMental >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        fontWeight: 600,
                                                        color: fs.avgMental >= 70 ? 'var(--color-success)' : fs.avgMental >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                    }}>
                                                        {fs.avgMental}
                                                    </span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            {fs.avgMotivation > 0 ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                                                    <div style={{
                                                        width: 50,
                                                        height: 6,
                                                        borderRadius: 3,
                                                        background: 'var(--color-neutral-100)',
                                                        overflow: 'hidden',
                                                    }}>
                                                        <div style={{
                                                            width: `${fs.avgMotivation}%`,
                                                            height: '100%',
                                                            borderRadius: 3,
                                                            background: fs.avgMotivation >= 70 ? 'var(--color-success)' : fs.avgMotivation >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                        }} />
                                                    </div>
                                                    <span style={{
                                                        fontSize: 'var(--font-size-sm)',
                                                        fontWeight: 600,
                                                        color: fs.avgMotivation >= 70 ? 'var(--color-success)' : fs.avgMotivation >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                    }}>
                                                        {fs.avgMotivation}
                                                    </span>
                                                </div>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    fontSize: 'var(--font-size-base)',
                                                    color: fs.avg >= 70 ? 'var(--color-success)' : fs.avg >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
                                                }}
                                            >
                                                {fs.avg > 0 ? fs.avg : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            {/* ====== QR Code Modal ====== */}
            {qrModalUser && (() => {
                const qrUser = users.find((u) => u.id === qrModalUser);
                const qrFac = facilities.find((f) => f.id === qrUser?.facility_id);
                const qrOcc = occupations.find((o) => o.id === qrUser?.occupation_id);
                const activePrd = surveyPeriods.find((p) => p.status === 'active');
                const token = `${qrModalUser}-${activePrd?.id || surveyPeriods[surveyPeriods.length - 1].id}`;
                const url = `${window.location.origin}/s/${token}`;
                return (
                    <div className="sm-qr-modal-overlay" onClick={() => setQrModalUser(null)}>
                        <div className="sm-qr-modal" onClick={(e) => e.stopPropagation()}>
                            <h3>{qrUser?.name}</h3>
                            <p>{qrFac?.name} / {qrOcc?.name}</p>
                            <QRCodeSVG value={url} size={200} level="M" style={{ margin: '0 auto' }} />
                            <code className="sm-qr-url">{url}</code>
                            <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                <button
                                    className="btn btn-sm btn-primary"
                                    style={{ flex: 1 }}
                                    onClick={() => { navigator.clipboard.writeText(url); }}
                                >
                                    📋 URLコピー
                                </button>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    style={{ flex: 1 }}
                                    onClick={() => setQrModalUser(null)}
                                >
                                    閉じる
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
}
