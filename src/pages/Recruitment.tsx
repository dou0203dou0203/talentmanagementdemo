import { useState } from 'react';
import { users, aptitudeTests } from '../data/mockData';

// Mock recruitment data
const applicants = [
    { id: 'ap-1', name: '佐々木健太', position: '看護師', facility: '中央病院', source: '転職サイト', status: '選考中', interview_score: 4.2, applied_date: '2026-01-15', cost: 85000 },
    { id: 'ap-2', name: '小林愛', position: '介護福祉士', facility: '西部介護センター', source: 'ハローワーク', status: '内定', interview_score: 4.5, applied_date: '2026-01-08', cost: 0 },
    { id: 'ap-3', name: '吉田大輔', position: '理学療法士', facility: '南リハビリ病院', source: '紹介', status: '入社済み', interview_score: 3.8, applied_date: '2025-12-20', cost: 200000 },
    { id: 'ap-4', name: '松田奈々', position: '事務職', facility: '統括本部', source: '自社HP', status: '不採用', interview_score: 2.9, applied_date: '2025-12-10', cost: 0 },
    { id: 'ap-5', name: '森田翼', position: '医師', facility: '駅前クリニック', source: '人材紹介', status: '選考中', interview_score: 4.0, applied_date: '2026-02-01', cost: 350000 },
    { id: 'ap-6', name: '高木美咲', position: '看護師', facility: '中央病院', source: '転職サイト', status: '入社済み', interview_score: 4.3, applied_date: '2025-11-15', cost: 90000 },
    { id: 'ap-7', name: '田村誠一', position: '介護福祉士', facility: '北部介護施設', source: 'ハローワーク', status: '内定', interview_score: 3.5, applied_date: '2026-02-10', cost: 0 },
    { id: 'ap-8', name: '渡部千春', position: '看護師', facility: '東クリニック', source: '紹介', status: '不採用', interview_score: 2.5, applied_date: '2026-01-20', cost: 0 },
];

const sourceColors: Record<string, string> = {
    '転職サイト': '#d4739b',
    'ハローワーク': '#8db93e',
    '紹介': '#3b82f6',
    '自社HP': '#f59e0b',
    '人材紹介': '#8b5cf6',
};

const statusConfig: Record<string, { color: string; bg: string }> = {
    '選考中': { color: '#3b82f6', bg: '#eff6ff' },
    '内定': { color: '#22c55e', bg: '#f0fdf4' },
    '入社済み': { color: '#10b981', bg: '#ecfdf5' },
    '不採用': { color: '#9aa5b0', bg: '#f8fafb' },
};

export default function Recruitment() {
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterSource, setFilterSource] = useState<string>('all');
    const [filterFacility, setFilterFacility] = useState<string>('all');
    const [filterPeriod, setFilterPeriod] = useState<string>('all');
    const [selectedApplicant, setSelectedApplicant] = useState<string|null>(null);

    const filtered = applicants
        .filter((a) => filterStatus === 'all' || a.status === filterStatus)
        .filter((a) => filterSource === 'all' || a.source === filterSource)
        .filter((a) => filterFacility === 'all' || a.facility === filterFacility)
        .filter((a) => { if (filterPeriod === 'all') return true; const m = a.applied_date.substring(0,7); return m === filterPeriod; })
        .sort((a, b) => b.applied_date.localeCompare(a.applied_date));

    const totalCost = applicants.reduce((s, a) => s + a.cost, 0);
    const hired = applicants.filter((a) => a.status === '入社済み').length;
    const sources = [...new Set(applicants.map((a) => a.source))];
    const facList = [...new Set(applicants.map((a) => a.facility))];
    const periods = [...new Set(applicants.map((a) => a.applied_date.substring(0,7)))].sort().reverse();
    const statuses = [...new Set(applicants.map((a) => a.status))];

    // Source breakdown
    const sourceCounts = sources.map((s) => ({
        source: s,
        count: applicants.filter((a) => a.source === s).length,
    }));

    // Aptitude tests summary (from existing mock)
    const recentTests = aptitudeTests.slice(0, 5);

    return (
        <div className="recruit-page">
            {/* KPI */}
            <div className="an-kpi-grid">
                <div className="an-kpi card">
                    <div className="an-kpi-icon">📝</div>
                    <div>
                        <div className="an-kpi-value">{applicants.length}</div>
                        <div className="an-kpi-label">応募総数</div>
                    </div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">✅</div>
                    <div>
                        <div className="an-kpi-value">{hired}名</div>
                        <div className="an-kpi-label">採用数</div>
                    </div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">💰</div>
                    <div>
                        <div className="an-kpi-value">¥{(totalCost / 10000).toFixed(1)}万</div>
                        <div className="an-kpi-label">採用コスト</div>
                    </div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">📊</div>
                    <div>
                        <div className="an-kpi-value">{hired > 0 ? `¥${(totalCost / hired / 10000).toFixed(1)}万` : '—'}</div>
                        <div className="an-kpi-label">一人あたりコスト</div>
                    </div>
                </div>
            </div>

            {/* Source Breakdown */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                <h3 className="org-section-title">📌 応募経路</h3>
                <div className="rc-source-grid">
                    {sourceCounts.map((s) => (
                        <div key={s.source} className="rc-source-chip" style={{ borderColor: sourceColors[s.source] || '#ccc' }}>
                            <span className="rc-source-dot" style={{ background: sourceColors[s.source] || '#ccc' }} />
                            {s.source}: <strong>{s.count}件</strong>
                        </div>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="iv-filters card">
                <div className="iv-filter-group">
                    <label>状態:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">すべて</option>
                        {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>経路:</label>
                    <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
                        <option value="all">すべて</option>
                        {sources.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>施設:</label>
                    <select value={filterFacility} onChange={(e) => setFilterFacility(e.target.value)}>
                        <option value="all">すべて</option>
                        {facList.map((f) => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>期間:</label>
                    <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                        <option value="all">すべて</option>
                        {periods.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                <div className="iv-count">{filtered.length}件</div>
            </div>

            {/* Applicant List */}
            <div className="rc-list">
                {filtered.map((ap) => {
                    const sc = statusConfig[ap.status] || { color: '#666', bg: '#f5f5f5' };
                    return (
                        <div key={ap.id} className="rc-card card" onClick={()=>setSelectedApplicant(selectedApplicant===ap.id?null:ap.id)} style={{cursor:'pointer'}}>
                            <div className="rc-card-top">
                                <div>
                                    <div className="rc-card-name">{ap.name}</div>
                                    <div className="iv-card-meta">{ap.position} · {ap.facility} · {ap.applied_date}</div>
                                </div>
                                <div className="rc-card-right">
                                    <span className="sp-badge" style={{ background: sc.bg, color: sc.color }}>{ap.status}</span>
                                    <span className="sp-badge" style={{ background: (sourceColors[ap.source] || '#666') + '18', color: sourceColors[ap.source] }}>{ap.source}</span>
                                </div>
                            </div>
                            <div className="rc-card-bottom">
                                <div className="rc-score">
                                    面接評価: <strong>{ap.interview_score}/5.0</strong>
                                    <div className="ev-score-bar" style={{ width: 100 }}>
                                        <div className="ev-score-fill" style={{ width: `${(ap.interview_score / 5) * 100}%` }} />
                                    </div>
                                </div>
                                {ap.cost > 0 && <div className="rc-cost">コスト: ¥{ap.cost.toLocaleString()}</div>}
                            </div>
                            {selectedApplicant===ap.id && (
                                <div style={{marginTop:12,padding:16,background:'var(--color-neutral-50)',borderRadius:'var(--radius-md)',borderTop:'1px solid var(--color-neutral-200)'}}>
                                    <h4 style={{fontSize:'var(--font-size-sm)',fontWeight:600,marginBottom:8}}>📋 面接記録</h4>
                                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,fontSize:'var(--font-size-sm)'}}>
                                        <div><strong>印象:</strong> {ap.interview_score>=4?'👍 良好':ap.interview_score>=3?'👌 普通':'👎 不足'}</div>
                                        <div><strong>経路:</strong> {ap.source}</div>
                                        <div><strong>コメント:</strong> デモ用面接メモがここに表示されます</div>
                                        <div><strong>採用コスト:</strong> {ap.cost>0?'¥'+ap.cost.toLocaleString():'—'}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Aptitude Tests */}
            <div className="card" style={{ padding: 24, marginTop: 16 }}>
                <h3 className="org-section-title">🧪 適性検査結果（直近）</h3>
                <table className="sp-table">
                    <thead><tr><th>職員</th><th>検査日</th><th>種別</th><th>スコア</th></tr></thead>
                    <tbody>
                        {recentTests.map((t) => {
                            const u = users.find((u) => u.id === t.user_id);
                            const avgScore = t.scores.length > 0 ? (t.scores.reduce((s, sc) => s + sc.score, 0) / t.scores.length).toFixed(0) : '—';
                            return (
                                <tr key={t.id}>
                                    <td>{u?.name || t.user_id}</td>
                                    <td>{t.test_date}</td>
                                    <td><span className="sp-badge">{t.test_type}</span></td>
                                    <td>{avgScore}/100</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
