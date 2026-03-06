import { users, occupations, facilities } from '../data/mockData';

export default function OrgChart() {
    // Group users by facility
    const facilityGroups = facilities.map((fac) => {
        const facUsers = users.filter((u) => u.facility_id === fac.id && u.status === 'active');
        const occGroups = occupations.map((occ) => ({
            ...occ,
            count: facUsers.filter((u) => u.occupation_id === occ.id).length,
            users: facUsers.filter((u) => u.occupation_id === occ.id),
        })).filter((g) => g.count > 0);
        return { ...fac, users: facUsers, occGroups, total: facUsers.length };
    });

    const totalActive = users.filter((u) => u.status === 'active').length;
    const totalLeave = users.filter((u) => u.status === 'leave').length;

    // Age distribution
    const ageGroups = getAgeDistribution();
    // Tenure distribution
    const tenureGroups = getTenureDistribution();

    return (
        <div className="org-page">
            {/* Summary Cards */}
            <div className="org-summary">
                <div className="org-stat card">
                    <div className="org-stat-value">{totalActive}</div>
                    <div className="org-stat-label">在籍者数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{totalLeave}</div>
                    <div className="org-stat-label">休職者数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{facilities.length}</div>
                    <div className="org-stat-label">事業所数</div>
                </div>
                <div className="org-stat card">
                    <div className="org-stat-value">{occupations.length}</div>
                    <div className="org-stat-label">職種数</div>
                </div>
            </div>

            {/* Organization Tree */}
            <div className="card" style={{ padding: 24 }}>
                <h3 className="org-section-title">🏢 組織図（法人 → 事業所 → 職種）</h3>
                <div className="org-tree">
                    <div className="org-tree-root">
                        <div className="org-tree-node org-tree-corp">
                            <span className="org-tree-icon">🏛️</span>
                            医療法人さくらの樹
                            <span className="org-tree-count">{totalActive}名</span>
                        </div>
                        <div className="org-tree-children">
                            {facilityGroups.map((fac) => (
                                <div key={fac.id} className="org-tree-branch">
                                    <div className="org-tree-node org-tree-facility">
                                        <span className="org-tree-icon">
                                            {fac.type === '病院' ? '🏥' : fac.type === 'クリニック' ? '🏪' : fac.type === '介護施設' ? '🏠' : '🏢'}
                                        </span>
                                        {fac.name}
                                        <span className="org-tree-badge">{fac.type}</span>
                                        <span className="org-tree-count">{fac.total}名</span>
                                    </div>
                                    <div className="org-tree-children org-tree-occs">
                                        {fac.occGroups.map((occ) => (
                                            <div key={occ.id} className="org-tree-node org-tree-occ">
                                                {occ.name}: <strong>{occ.count}名</strong>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Facility Staff Composition */}
            <div className="card" style={{ padding: 24 }}>
                <h3 className="org-section-title">📊 事業所別人員構成</h3>
                <div className="org-bar-chart">
                    {facilityGroups.map((fac) => (
                        <div key={fac.id} className="org-bar-row">
                            <div className="org-bar-label">{fac.name}</div>
                            <div className="org-bar-track">
                                {fac.occGroups.map((occ, i) => (
                                    <div
                                        key={occ.id}
                                        className="org-bar-segment"
                                        style={{
                                            width: `${(occ.count / Math.max(fac.total, 1)) * 100}%`,
                                            background: occColors[i % occColors.length],
                                        }}
                                        title={`${occ.name}: ${occ.count}名`}
                                    />
                                ))}
                            </div>
                            <div className="org-bar-total">{fac.total}</div>
                        </div>
                    ))}
                </div>
                <div className="org-legend">
                    {occupations.map((occ, i) => (
                        <div key={occ.id} className="org-legend-item">
                            <span className="org-legend-dot" style={{ background: occColors[i % occColors.length] }} />
                            {occ.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Age & Tenure Distribution */}
            <div className="org-distributions">
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="org-section-title">👥 年齢構成</h3>
                    <div className="org-dist-chart">
                        {ageGroups.map((g) => (
                            <div key={g.label} className="org-dist-bar">
                                <div className="org-dist-fill" style={{ height: `${(g.count / Math.max(...ageGroups.map((a) => a.count), 1)) * 100}%` }} />
                                <div className="org-dist-label">{g.label}</div>
                                <div className="org-dist-value">{g.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card" style={{ padding: 24 }}>
                    <h3 className="org-section-title">📅 勤続年数分布</h3>
                    <div className="org-dist-chart">
                        {tenureGroups.map((g) => (
                            <div key={g.label} className="org-dist-bar">
                                <div className="org-dist-fill org-dist-fill-green" style={{ height: `${(g.count / Math.max(...tenureGroups.map((t) => t.count), 1)) * 100}%` }} />
                                <div className="org-dist-label">{g.label}</div>
                                <div className="org-dist-value">{g.count}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const occColors = ['#d4739b', '#8db93e', '#3b82f6', '#f59e0b', '#6b7a87', '#ef4444', '#8b5cf6'];

function getAgeDistribution() {
    const now = new Date();
    const groups = [
        { label: '~29', min: 0, max: 29, count: 0 },
        { label: '30代', min: 30, max: 39, count: 0 },
        { label: '40代', min: 40, max: 49, count: 0 },
        { label: '50代', min: 50, max: 59, count: 0 },
        { label: '60~', min: 60, max: 99, count: 0 },
    ];
    users.forEach((u) => {
        if (u.birth_date) {
            const age = Math.floor((now.getTime() - new Date(u.birth_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const g = groups.find((g) => age >= g.min && age <= g.max);
            if (g) g.count++;
        }
    });
    return groups;
}

function getTenureDistribution() {
    const now = new Date();
    const groups = [
        { label: '~1年', min: 0, max: 1, count: 0 },
        { label: '2-5年', min: 2, max: 5, count: 0 },
        { label: '6-10年', min: 6, max: 10, count: 0 },
        { label: '11-20年', min: 11, max: 20, count: 0 },
        { label: '21年~', min: 21, max: 99, count: 0 },
    ];
    users.forEach((u) => {
        if (u.hire_date) {
            const tenure = Math.floor((now.getTime() - new Date(u.hire_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
            const g = groups.find((g) => tenure >= g.min && tenure <= g.max);
            if (g) g.count++;
        }
    });
    return groups;
}
