import { useMemo } from 'react';
import { users as allUsers, occupations, facilities as allFacilities, surveys as allSurveys, evaluations as allEvaluations } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

export default function Analytics() {
    const { user: currentUser, permissions } = useAuth();

    const users = useMemo(() => {
        if (permissions.canViewAllStaff) return allUsers;
        if (permissions.canViewFacility) return allUsers.filter(u => u.facility_id === currentUser?.facility_id);
        return allUsers.filter(u => u.id === currentUser?.id);
    }, [currentUser, permissions]);
    const facilities = useMemo(() => {
        if (permissions.canViewAllStaff) return allFacilities;
        return allFacilities.filter(f => f.id === currentUser?.facility_id);
    }, [currentUser, permissions]);
    const surveys = useMemo(() => {
        const uids = new Set(users.map(u => u.id));
        return allSurveys.filter(s => uids.has(s.user_id));
    }, [users]);
    const evaluations = useMemo(() => {
        const uids = new Set(users.map(u => u.id));
        return allEvaluations.filter(e => uids.has(e.user_id));
    }, [users]);

    const activeUsers = users.filter((u) => u.status === 'active');
    const inactiveUsers = users.filter((u) => u.status === 'inactive');
    const leaveUsers = users.filter((u) => u.status === 'leave');

    // Turnover rate — annual: resigned in last 12 months / (active + resigned in last 12 months)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const recentResigned = inactiveUsers.filter(u => {
        if (!u.resignation_date) return false;
        return new Date(u.resignation_date) >= oneYearAgo;
    });
    const turnoverBase = activeUsers.length + recentResigned.length;
    const turnoverRate = turnoverBase > 0 ? ((recentResigned.length / turnoverBase) * 100).toFixed(1) : '0';

    // Qualification rate
    const qualifiedUsers = users.filter((u) => u.qualifications && u.qualifications.length > 0);
    const qualificationRate = activeUsers.length > 0 ? ((qualifiedUsers.length / activeUsers.length) * 100).toFixed(0) : '0';

    // Evaluation distribution
    const evalScores = evaluations
        .filter((e) => e.status === 'approved' || e.status === 'submitted')
        .map((e) => {
            const avg = e.scores.length > 0 ? e.scores.reduce((s, sc) => s + sc.score, 0) / e.scores.length : 0;
            return avg;
        });
    const evalDist = [
        { label: '1.0-1.9', count: evalScores.filter((s) => s >= 1 && s < 2).length, color: '#ef4444' },
        { label: '2.0-2.9', count: evalScores.filter((s) => s >= 2 && s < 3).length, color: '#f59e0b' },
        { label: '3.0-3.9', count: evalScores.filter((s) => s >= 3 && s < 4).length, color: '#8db93e' },
        { label: '4.0-4.9', count: evalScores.filter((s) => s >= 4 && s < 5).length, color: '#22c55e' },
        { label: '5.0', count: evalScores.filter((s) => s >= 5).length, color: '#10b981' },
    ];

    // Staff by occupation
    const occStats = occupations.map((occ) => ({
        ...occ,
        count: activeUsers.filter((u) => u.occupation_id === occ.id).length,
    }));
    const maxOcc = Math.max(...occStats.map((o) => o.count), 1);

    // Staff by facility
    const facStats = facilities.map((fac) => ({
        ...fac,
        count: activeUsers.filter((u) => u.facility_id === fac.id).length,
    }));
    const maxFac = Math.max(...facStats.map((f) => f.count), 1);

    // Survey completion rate
    const totalSurveys = surveys.length;
    const submittedSurveys = surveys.filter((s) => s.submitted).length;
    const surveyRate = totalSurveys > 0 ? ((submittedSurveys / totalSurveys) * 100).toFixed(0) : '0';

    const occColors = ['#d4739b', '#8db93e', '#3b82f6', '#f59e0b', '#6b7a87'];
    const facColors = ['#d4739b', '#8db93e', '#3b82f6', '#f59e0b', '#6b7a87', '#ef4444', '#8b5cf6', '#10b981'];

    return (
        <div className="analytics-page">
            {/* KPI Cards */}
            <div className="an-kpi-grid">
                <KPI icon="👥" label="総在籍数" value={`${activeUsers.length}名`} sub={`休職 ${leaveUsers.length}名`} />
                <KPI icon="📉" label="離職率（年間）" value={`${turnoverRate}%`} sub={`直近1年 ${recentResigned.length}名 / 退職累計 ${inactiveUsers.length}名`} color={Number(turnoverRate) > 10 ? '#ef4444' : '#22c55e'} />
                <KPI icon="🎓" label="資格保有率" value={`${qualificationRate}%`} sub={`${qualifiedUsers.length}/${activeUsers.length}名`} />
                <KPI icon="📋" label="サーベイ回答率" value={`${surveyRate}%`} sub={`${submittedSurveys}/${totalSurveys}件`} />
            </div>

            {/* Charts Row */}
            <div className="an-charts-row">
                {/* Occupation Distribution */}
                <div className="card" style={{ padding: 24, flex: 1 }}>
                    <h3 className="org-section-title">👔 職種別人員数</h3>
                    <div className="an-hbar-chart">
                        {occStats.map((occ, i) => (
                            <div key={occ.id} className="an-hbar-row">
                                <div className="an-hbar-label">{occ.name}</div>
                                <div className="an-hbar-track">
                                    <div
                                        className="an-hbar-fill"
                                        style={{ width: `${(occ.count / maxOcc) * 100}%`, background: occColors[i % occColors.length] }}
                                    />
                                </div>
                                <div className="an-hbar-value">{occ.count}名</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Facility Distribution */}
                <div className="card" style={{ padding: 24, flex: 1 }}>
                    <h3 className="org-section-title">🏢 事業所別人員数</h3>
                    <div className="an-hbar-chart">
                        {facStats.map((fac, i) => (
                            <div key={fac.id} className="an-hbar-row">
                                <div className="an-hbar-label">{fac.name}</div>
                                <div className="an-hbar-track">
                                    <div
                                        className="an-hbar-fill"
                                        style={{ width: `${(fac.count / maxFac) * 100}%`, background: facColors[i % facColors.length] }}
                                    />
                                </div>
                                <div className="an-hbar-value">{fac.count}名</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Evaluation Distribution */}
            <div className="card" style={{ padding: 24 }}>
                <h3 className="org-section-title">⭐ 評価分布</h3>
                <div className="an-eval-chart">
                    {evalDist.map((d) => (
                        <div key={d.label} className="an-eval-bar">
                            <div
                                className="an-eval-fill"
                                style={{ height: `${(d.count / Math.max(...evalDist.map((e) => e.count), 1)) * 100}%`, background: d.color }}
                            />
                            <div className="an-eval-label">{d.label}</div>
                            <div className="an-eval-value">{d.count}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function KPI({ icon, label, value, sub, color }: {
    icon: string;
    label: string;
    value: string;
    sub: string;
    color?: string;
}) {
    return (
        <div className="an-kpi card">
            <div className="an-kpi-icon">{icon}</div>
            <div>
                <div className="an-kpi-value" style={color ? { color } : {}}>{value}</div>
                <div className="an-kpi-label">{label}</div>
                <div className="an-kpi-sub">{sub}</div>
            </div>
        </div>
    );
}
