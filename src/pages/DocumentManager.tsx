import { useState } from 'react';
import { useData } from '../context/DataContext';

type DocCategory = '雇用契約書' | '誓約書' | '資格証' | 'マイナンバー' | '健康診断' | '同意書' | 'その他';

interface MockDocument {
    id: string;
    user_id: string;
    category: DocCategory;
    name: string;
    file_type: string;
    upload_date: string;
    expiry_date?: string;
    status: '有効' | '期限切れ' | '更新待ち';
}

const mockDocuments: MockDocument[] = [
    { id: 'doc-1', user_id: 'u-1', category: '雇用契約書', name: '雇用契約書_高橋拓海_2024.pdf', file_type: 'PDF', upload_date: '2024-04-01', status: '有効' },
    { id: 'doc-2', user_id: 'u-1', category: '資格証', name: '医師免許証.pdf', file_type: 'PDF', upload_date: '2020-05-15', status: '有効' },
    { id: 'doc-3', user_id: 'u-2', category: '雇用契約書', name: '雇用契約書_石井誠_2024.pdf', file_type: 'PDF', upload_date: '2024-04-01', status: '有効' },
    { id: 'doc-4', user_id: 'u-2', category: '資格証', name: '看護師免許証.pdf', file_type: 'PDF', upload_date: '2015-06-01', status: '有効' },
    { id: 'doc-5', user_id: 'u-2', category: '資格証', name: '認定看護師証.pdf', file_type: 'PDF', upload_date: '2020-09-15', expiry_date: '2025-09-14', status: '期限切れ' },
    { id: 'doc-6', user_id: 'u-3', category: '健康診断', name: '健康診断結果_2025.pdf', file_type: 'PDF', upload_date: '2025-06-20', status: '有効' },
    { id: 'doc-7', user_id: 'u-11', category: '雇用契約書', name: '雇用契約書_太田健一_2024.pdf', file_type: 'PDF', upload_date: '2024-04-01', status: '有効' },
    { id: 'doc-8', user_id: 'u-11', category: 'マイナンバー', name: 'マイナンバー届出書.pdf', file_type: 'PDF', upload_date: '2023-01-10', status: '有効' },
    { id: 'doc-9', user_id: 'u-5', category: '誓約書', name: '誓約書_山田悠真.pdf', file_type: 'PDF', upload_date: '2018-04-01', status: '有効' },
    { id: 'doc-10', user_id: 'u-5', category: '同意書', name: '個人情報同意書.pdf', file_type: 'PDF', upload_date: '2018-04-01', status: '有効' },
    { id: 'doc-11', user_id: 'u-6', category: '健康診断', name: '健康診断結果_2024.pdf', file_type: 'PDF', upload_date: '2024-07-15', expiry_date: '2025-07-14', status: '更新待ち' },
    { id: 'doc-12', user_id: 'u-4', category: '資格証', name: '管理栄養士免許証.pdf', file_type: 'PDF', upload_date: '2019-04-01', status: '有効' },
];

const categories: DocCategory[] = ['雇用契約書', '誓約書', '資格証', 'マイナンバー', '健康診断', '同意書', 'その他'];

const categoryIcons: Record<DocCategory, string> = {
    '雇用契約書': '📄',
    '誓約書': '✍️',
    '資格証': '🎓',
    'マイナンバー': '🔢',
    '健康診断': '🏥',
    '同意書': '✅',
    'その他': '📎',
};

const statusConfig: Record<string, { color: string; bg: string }> = {
    '有効': { color: '#16a34a', bg: '#f0fdf4' },
    '期限切れ': { color: '#ef4444', bg: '#fef2f2' },
    '更新待ち': { color: '#f59e0b', bg: '#fffbeb' },
};

export default function DocumentManager() {
    const { users } = useData();
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterUser, setFilterUser] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    const filtered = mockDocuments
        .filter((d) => filterCategory === 'all' || d.category === filterCategory)
        .filter((d) => filterUser === 'all' || d.user_id === filterUser)
        .filter((d) => filterStatus === 'all' || d.status === filterStatus)
        .sort((a, b) => b.upload_date.localeCompare(a.upload_date));

    // Summary counts
    const totalDocs = mockDocuments.length;
    const expiredDocs = mockDocuments.filter((d) => d.status === '期限切れ').length;
    const pendingDocs = mockDocuments.filter((d) => d.status === '更新待ち').length;

    // Category counts
    const catCounts = categories.map((c) => ({
        category: c,
        count: mockDocuments.filter((d) => d.category === c).length,
        icon: categoryIcons[c],
    })).filter((c) => c.count > 0);

    const documentUsers = [...new Set(mockDocuments.map((d) => d.user_id))];

    return (
        <div className="doc-page">
            {/* KPI */}
            <div className="an-kpi-grid">
                <div className="an-kpi card">
                    <div className="an-kpi-icon">📁</div>
                    <div><div className="an-kpi-value">{totalDocs}</div><div className="an-kpi-label">総書類数</div></div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">⚠️</div>
                    <div><div className="an-kpi-value" style={{ color: '#ef4444' }}>{expiredDocs}</div><div className="an-kpi-label">期限切れ</div></div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">🔄</div>
                    <div><div className="an-kpi-value" style={{ color: '#f59e0b' }}>{pendingDocs}</div><div className="an-kpi-label">更新待ち</div></div>
                </div>
                <div className="an-kpi card">
                    <div className="an-kpi-icon">✅</div>
                    <div><div className="an-kpi-value" style={{ color: '#16a34a' }}>{totalDocs - expiredDocs - pendingDocs}</div><div className="an-kpi-label">有効</div></div>
                </div>
            </div>

            {/* Category chips */}
            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <div className="rc-source-grid">
                    {catCounts.map((c) => (
                        <button
                            key={c.category}
                            className={`doc-cat-chip ${filterCategory === c.category ? 'active' : ''}`}
                            onClick={() => setFilterCategory(filterCategory === c.category ? 'all' : c.category)}
                        >
                            {c.icon} {c.category}: <strong>{c.count}</strong>
                        </button>
                    ))}
                </div>
            </div>

            {/* Filters */}
            <div className="iv-filters card">
                <div className="iv-filter-group">
                    <label>種別:</label>
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="all">すべて</option>
                        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>職員:</label>
                    <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                        <option value="all">すべて</option>
                        {documentUsers.map((uid) => {
                            const u = users.find((u) => u.id === uid);
                            return <option key={uid} value={uid}>{u?.name || uid}</option>;
                        })}
                    </select>
                </div>
                <div className="iv-filter-group">
                    <label>状態:</label>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">すべて</option>
                        <option value="有効">有効</option>
                        <option value="期限切れ">期限切れ</option>
                        <option value="更新待ち">更新待ち</option>
                    </select>
                </div>
                <div className="iv-count">{filtered.length}件</div>
            </div>

            {/* Document List */}
            <div className="doc-list">
                {filtered.length === 0 ? (
                    <div className="card sp-empty">書類はありません</div>
                ) : (
                    filtered.map((doc) => {
                        const u = users.find((u) => u.id === doc.user_id);
                        const sc = statusConfig[doc.status] || { color: '#666', bg: '#f5f5f5' };
                        return (
                            <div key={doc.id} className="doc-card card">
                                <div className="doc-card-icon">{categoryIcons[doc.category]}</div>
                                <div className="doc-card-info">
                                    <div className="doc-card-name">{doc.name}</div>
                                    <div className="doc-card-meta">
                                        {u?.name} · {doc.category} · {doc.upload_date}
                                        {doc.expiry_date && <span> · 期限: {doc.expiry_date}</span>}
                                    </div>
                                </div>
                                <div className="doc-card-right">
                                    <span className="sp-badge" style={{ background: sc.bg, color: sc.color }}>{doc.status}</span>
                                    <span className="doc-type-badge">{doc.file_type}</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
