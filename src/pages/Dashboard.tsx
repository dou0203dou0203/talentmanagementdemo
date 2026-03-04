import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import {
    users,
    occupations,
    facilities,
    surveys,
    facilityStaffingTargets,
} from '../data/mockData';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

type TabKey = 'overview' | 'alerts' | 'staffing';

interface AlertInfo {
    userId: string;
    userName: string;
    facilityName: string;
    occupationName: string;
    mentalChange: number;
    motivationChange: number;
    latestMental: number;
    latestMotivation: number;
    level: 'red' | 'yellow' | 'green';
}

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<TabKey>('overview');
    const navigate = useNavigate();

    // Calculate alerts
    const alerts: AlertInfo[] = useMemo(() => {
        const userIds = [...new Set(surveys.map((s) => s.user_id))];
        return userIds
            .map((userId) => {
                const userSurveys = surveys
                    .filter((s) => s.user_id === userId)
                    .sort((a, b) => new Date(a.survey_date).getTime() - new Date(b.survey_date).getTime());

                if (userSurveys.length < 2) return null;

                const latest = userSurveys[userSurveys.length - 1];
                const prev = userSurveys[userSurveys.length - 2];

                const mentalChange = prev.mental_score > 0
                    ? ((latest.mental_score - prev.mental_score) / prev.mental_score) * 100
                    : 0;
                const motivationChange = prev.motivation_score > 0
                    ? ((latest.motivation_score - prev.motivation_score) / prev.motivation_score) * 100
                    : 0;

                const user = users.find((u) => u.id === userId);
                const facility = facilities.find((f) => f.id === user?.facility_id);
                const occupation = occupations.find((o) => o.id === user?.occupation_id);

                const worstChange = Math.min(mentalChange, motivationChange);
                let level: AlertInfo['level'] = 'green';
                if (worstChange <= -20) level = 'red';
                else if (worstChange <= -10) level = 'yellow';

                return {
                    userId,
                    userName: user?.name || '',
                    facilityName: facility?.name || '',
                    occupationName: occupation?.name || '',
                    mentalChange,
                    motivationChange,
                    latestMental: latest.mental_score,
                    latestMotivation: latest.motivation_score,
                    level,
                };
            })
            .filter((a): a is AlertInfo => a !== null)
            .sort((a, b) => {
                const order = { red: 0, yellow: 1, green: 2 };
                return order[a.level] - order[b.level];
            });
    }, []);

    const redAlerts = alerts.filter((a) => a.level === 'red');
    const yellowAlerts = alerts.filter((a) => a.level === 'yellow');

    // Staffing heatmap data
    const heatmapData = useMemo(() => {
        // Get occupations that have targets
        const relevantOccIds = [...new Set(facilityStaffingTargets.map((t) => t.occupation_id))];
        const relevantOccs = occupations.filter((o) => relevantOccIds.includes(o.id));

        // For each facility, compute actual vs target
        return facilities
            .filter((f) => f.type !== '本部')
            .map((facility) => {
                const cells = relevantOccs.map((occ) => {
                    const target = facilityStaffingTargets.find(
                        (t) => t.facility_id === facility.id && t.occupation_id === occ.id
                    );
                    const actual = users.filter(
                        (u) =>
                            u.facility_id === facility.id &&
                            u.occupation_id === occ.id &&
                            u.status === 'active'
                    ).length;
                    const targetCount = target?.target_count ?? 0;
                    const ratio = targetCount > 0 ? actual / targetCount : -1;

                    return {
                        occupationId: occ.id,
                        actual,
                        target: targetCount,
                        ratio,
                    };
                });
                return {
                    facilityId: facility.id,
                    facilityName: facility.name,
                    facilityType: facility.type,
                    cells,
                };
            });
    }, []);

    const relevantOccs = useMemo(() => {
        const relevantOccIds = [...new Set(facilityStaffingTargets.map((t) => t.occupation_id))];
        return occupations.filter((o) => relevantOccIds.includes(o.id));
    }, []);

    // Get chart data for selected alert user
    const chartData = useMemo(() => {
        const userId = redAlerts.length > 0 ? redAlerts[0].userId : alerts[0]?.userId;
        if (!userId) return null;

        const userSurveys = surveys
            .filter((s) => s.user_id === userId)
            .sort((a, b) => new Date(a.survey_date).getTime() - new Date(b.survey_date).getTime());

        const user = users.find((u) => u.id === userId);

        return {
            labels: userSurveys.map((s) => {
                const d = new Date(s.survey_date);
                return `${d.getMonth() + 1}月`;
            }),
            datasets: [
                {
                    label: 'メンタルスコア',
                    data: userSurveys.map((s) => s.mental_score),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                },
                {
                    label: 'モチベーションスコア',
                    data: userSurveys.map((s) => s.motivation_score),
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                },
            ],
            userName: user?.name || '',
        };
    }, [alerts, redAlerts]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top' as const,
                labels: {
                    font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 12 },
                    usePointStyle: true,
                    pointStyle: 'circle',
                },
            },
            tooltip: {
                backgroundColor: 'rgba(20, 30, 40, 0.9)',
                titleFont: { family: "'Inter', 'Noto Sans JP', sans-serif" },
                bodyFont: { family: "'Inter', 'Noto Sans JP', sans-serif" },
                padding: 12,
                cornerRadius: 8,
            },
        },
        scales: {
            y: {
                min: 0,
                max: 100,
                grid: { color: 'rgba(0,0,0,0.05)' },
                ticks: {
                    font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 11 },
                },
            },
            x: {
                grid: { display: false },
                ticks: {
                    font: { family: "'Inter', 'Noto Sans JP', sans-serif", size: 11 },
                },
            },
        },
    };

    // Stats
    const totalStaff = users.filter((u) => u.status === 'active').length;
    const onLeave = users.filter((u) => u.status === 'leave').length;

    const getCellLevel = (ratio: number) => {
        if (ratio < 0) return 'level-na';
        if (ratio >= 1) return 'level-full';
        if (ratio >= 0.8) return 'level-ok';
        if (ratio >= 0.6) return 'level-slight';
        if (ratio >= 0.4) return 'level-short';
        return 'level-critical';
    };

    const renderStatsGrid = () => (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-500)' }}>
                    👥
                </div>
                <div className="stat-card-value">{totalStaff}</div>
                <div className="stat-card-label">アクティブスタッフ</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)' }}>
                    🚨
                </div>
                <div className="stat-card-value">{redAlerts.length}</div>
                <div className="stat-card-label">赤アラート</div>
                {redAlerts.length > 0 && (
                    <div className="stat-card-change negative">⚠ 要対応</div>
                )}
            </div>
            <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'var(--color-warning-bg)', color: 'var(--color-warning)' }}>
                    ⚡
                </div>
                <div className="stat-card-value">{yellowAlerts.length}</div>
                <div className="stat-card-label">注意アラート</div>
            </div>
            <div className="stat-card">
                <div className="stat-card-icon" style={{ background: 'var(--color-info-bg)', color: 'var(--color-info)' }}>
                    🏥
                </div>
                <div className="stat-card-value">{onLeave}</div>
                <div className="stat-card-label">休職中</div>
            </div>
        </div>
    );

    const renderAlerts = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">🔔 離職防止アラート</h3>
                <span className="badge badge-danger">{redAlerts.length}件の赤アラート</span>
            </div>
            <div className="card-body">
                {alerts.map((alert) => (
                    <div
                        key={alert.userId}
                        className={`alert-card alert-${alert.level}`}
                        onClick={() => navigate('/staff/' + alert.userId)}
                        style={{ cursor: 'pointer' }}
                    >
                        <div className="alert-card-icon">
                            {alert.level === 'red' ? '🚨' : alert.level === 'yellow' ? '⚡' : '✅'}
                        </div>
                        <div className="alert-card-content">
                            <div className="alert-card-title">{alert.userName}</div>
                            <div className="alert-card-desc">
                                {alert.facilityName} / {alert.occupationName}
                            </div>
                            <div className="alert-card-meta">
                                <span className={`badge ${alert.level === 'red' ? 'badge-danger' : alert.level === 'yellow' ? 'badge-warning' : 'badge-success'}`}>
                                    メンタル: {alert.latestMental}点 ({alert.mentalChange >= 0 ? '+' : ''}{alert.mentalChange.toFixed(1)}%)
                                </span>
                                <span className={`badge ${alert.level === 'red' ? 'badge-danger' : alert.level === 'yellow' ? 'badge-warning' : 'badge-success'}`}>
                                    モチベ: {alert.latestMotivation}点 ({alert.motivationChange >= 0 ? '+' : ''}{alert.motivationChange.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    const renderChart = () => {
        if (!chartData) return null;
        return (
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">📈 サーベイ推移: {chartData.userName}</h3>
                </div>
                <div className="card-body">
                    <div className="chart-container">
                        <Line data={chartData} options={chartOptions} />
                    </div>
                    <div
                        style={{
                            marginTop: 'var(--space-4)',
                            padding: 'var(--space-3) var(--space-4)',
                            background: 'var(--color-neutral-50)',
                            borderRadius: 'var(--radius-md)',
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-neutral-600)',
                        }}
                    >
                        💡 スタッフ名をクリックすると、推移グラフが切り替わります。前回比 -20%以上で赤アラートが発生します。
                    </div>
                </div>
            </div>
        );
    };

    const renderHeatmap = () => (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">🏥 拠点別人員配置 充足率</h3>
                <span className="badge badge-primary">{facilities.filter((f) => f.type !== '本部').length}拠点</span>
            </div>
            <div className="card-body">
                <div className="heatmap-container">
                    <table className="heatmap-table">
                        <thead>
                            <tr>
                                <th>拠点</th>
                                {relevantOccs.map((occ) => (
                                    <th key={occ.id}>{occ.name.replace('（理学療法士）', '')}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {heatmapData.map((row) => (
                                <tr key={row.facilityId}>
                                    <th>
                                        <div>{row.facilityName}</div>
                                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', fontWeight: 400 }}>
                                            {row.facilityType}
                                        </span>
                                    </th>
                                    {row.cells.map((cell) => (
                                        <td
                                            key={cell.occupationId}
                                            className={`heatmap-cell ${getCellLevel(cell.ratio)}`}
                                        >
                                            {cell.target === 0 ? (
                                                '—'
                                            ) : (
                                                <>
                                                    {cell.ratio >= 0 ? `${Math.round(cell.ratio * 100)}%` : '—'}
                                                    <span className="heatmap-cell-fraction">
                                                        {cell.actual}/{cell.target}
                                                    </span>
                                                </>
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="heatmap-legend">
                    <div className="heatmap-legend-item">
                        <div className="heatmap-legend-color" style={{ background: 'var(--color-success-bg)', border: '1px solid rgba(22,163,74,0.3)' }} />
                        100%以上
                    </div>
                    <div className="heatmap-legend-item">
                        <div className="heatmap-legend-color" style={{ background: '#ecfdf5', border: '1px solid rgba(5,150,105,0.3)' }} />
                        80-99%
                    </div>
                    <div className="heatmap-legend-item">
                        <div className="heatmap-legend-color" style={{ background: 'var(--color-warning-bg)', border: '1px solid rgba(217,119,6,0.3)' }} />
                        60-79%
                    </div>
                    <div className="heatmap-legend-item">
                        <div className="heatmap-legend-color" style={{ background: '#fff1f2', border: '1px solid rgba(225,29,72,0.3)' }} />
                        40-59%
                    </div>
                    <div className="heatmap-legend-item">
                        <div className="heatmap-legend-color" style={{ background: 'var(--color-danger-bg)', border: '1px solid rgba(220,38,38,0.3)' }} />
                        40%未満
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fade-in">
            <h2 className="page-title">管理者ダッシュボード</h2>
            <p className="page-subtitle">
                離職リスクのあるスタッフと人員配置の充足状況を一目で確認できます。
            </p>

            {renderStatsGrid()}

            {/* Tabs */}
            <div className="tab-nav">
                <button
                    className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    📊 概要
                </button>
                <button
                    className={`tab-item ${activeTab === 'alerts' ? 'active' : ''}`}
                    onClick={() => setActiveTab('alerts')}
                >
                    🔔 離職アラート
                </button>
                <button
                    className={`tab-item ${activeTab === 'staffing' ? 'active' : ''}`}
                    onClick={() => setActiveTab('staffing')}
                >
                    🏥 人員配置
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'overview' && (
                <div className="grid-2">
                    {renderAlerts()}
                    <div>
                        {renderChart()}
                        <div style={{ marginTop: 'var(--space-6)' }}>
                            {renderHeatmap()}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'alerts' && (
                <div className="grid-2">
                    {renderAlerts()}
                    {renderChart()}
                </div>
            )}

            {activeTab === 'staffing' && renderHeatmap()}
        </div>
    );
}
