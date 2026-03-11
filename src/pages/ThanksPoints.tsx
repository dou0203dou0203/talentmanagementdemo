import { useState, useMemo } from 'react';
import { users as allUsers, facilities } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

// ==========================================
// Types & Mock Data
// ==========================================
interface ThanksTransaction {
    id: string;
    from_user_id: string;
    to_user_id: string;
    message: string;
    date: string;
}

interface AwardRecord {
    year: number;
    rankings: { user_id: string; points: number; rank: number }[];
}

const INITIAL_POINTS = 10;

const PRESET_MESSAGES = [
    'いつもありがとう！',
    '助かりました！',
    'ナイスフォロー！',
    '丁寧な対応ありがとう！',
    '素晴らしい仕事ぶりです！',
    'チームの力になってくれてありがとう！',
    'お疲れ様でした！',
    '気配りに感謝！',
];

// Sample transactions (mock)
const initialTransactions: ThanksTransaction[] = [
    { id: 'thx-1', from_user_id: 'u-2', to_user_id: 'u-11', message: '丁寧な対応ありがとう！', date: '2026-03-01' },
    { id: 'thx-2', from_user_id: 'u-3', to_user_id: 'u-11', message: '助かりました！', date: '2026-03-02' },
    { id: 'thx-3', from_user_id: 'u-11', to_user_id: 'u-2', message: 'ナイスフォロー！', date: '2026-03-02' },
    { id: 'thx-4', from_user_id: 'u-4', to_user_id: 'u-1', message: 'いつもありがとう！', date: '2026-03-03' },
    { id: 'thx-5', from_user_id: 'u-5', to_user_id: 'u-17', message: '素晴らしい仕事ぶりです！', date: '2026-03-04' },
    { id: 'thx-6', from_user_id: 'u-1', to_user_id: 'u-11', message: 'チームの力になってくれてありがとう！', date: '2026-03-05' },
    { id: 'thx-7', from_user_id: 'u-6', to_user_id: 'u-2', message: '気配りに感謝！', date: '2026-03-06' },
    { id: 'thx-8', from_user_id: 'u-12', to_user_id: 'u-1', message: 'お疲れ様でした！', date: '2026-03-07' },
    { id: 'thx-9', from_user_id: 'u-17', to_user_id: 'u-5', message: '助かりました！', date: '2026-03-08' },
    { id: 'thx-10', from_user_id: 'u-24', to_user_id: 'u-11', message: 'いつもありがとう！', date: '2026-03-08' },
    { id: 'thx-11', from_user_id: 'u-30', to_user_id: 'u-1', message: 'ナイスフォロー！', date: '2026-03-09' },
    { id: 'thx-12', from_user_id: 'u-39', to_user_id: 'u-2', message: '素晴らしい仕事ぶりです！', date: '2026-03-10' },
];

const pastAwards: AwardRecord[] = [
    {
        year: 2025,
        rankings: [
            { user_id: 'u-11', points: 42, rank: 1 },
            { user_id: 'u-2', points: 38, rank: 2 },
            { user_id: 'u-1', points: 35, rank: 3 },
            { user_id: 'u-17', points: 28, rank: 4 },
            { user_id: 'u-5', points: 22, rank: 5 },
        ],
    },
];

// ==========================================
// Component
// ==========================================
export default function ThanksPoints() {
    const { user: currentUser } = useAuth();
    const [transactions, setTransactions] = useState<ThanksTransaction[]>(initialTransactions);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [messageType, setMessageType] = useState<'preset' | 'custom'>('preset');
    const [presetMessage, setPresetMessage] = useState<string>(PRESET_MESSAGES[0]);
    const [customMessage, setCustomMessage] = useState<string>('');
    const [sendSuccess, setSendSuccess] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'send' | 'ranking' | 'history' | 'awards'>('send');

    const activeUsers = allUsers.filter(u => u.status === 'active');

    // My balance: INITIAL_POINTS - points sent by me
    const mySentCount = transactions.filter(t => t.from_user_id === currentUser?.id).length;
    const myBalance = Math.max(0, INITIAL_POINTS - mySentCount);

    // My received points
    const myReceivedCount = transactions.filter(t => t.to_user_id === currentUser?.id).length;

    // Ranking: received points per user
    const ranking = useMemo(() => {
        const counts: Record<string, number> = {};
        transactions.forEach(t => { counts[t.to_user_id] = (counts[t.to_user_id] || 0) + 1; });
        return Object.entries(counts)
            .map(([uid, pts]) => ({ user: allUsers.find(u => u.id === uid), points: pts }))
            .filter(r => r.user)
            .sort((a, b) => b.points - a.points);
    }, [transactions]);

    // Recent received (for me)
    const myReceivedHistory = useMemo(() => {
        return transactions
            .filter(t => t.to_user_id === currentUser?.id)
            .sort((a, b) => b.date.localeCompare(a.date));
    }, [transactions, currentUser]);

    // All recent transactions
    const recentAll = useMemo(() => {
        return [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
    }, [transactions]);

    const sendPoint = () => {
        if (!selectedUserId || !currentUser) return;
        if (myBalance <= 0) { alert('持ち点がありません'); return; }
        if (selectedUserId === currentUser.id) { alert('自分自身には送れません'); return; }

        const msg = messageType === 'preset' ? presetMessage : customMessage.trim();
        if (!msg) { alert('メッセージを入力してください'); return; }

        const newTx: ThanksTransaction = {
            id: `thx-${Date.now()}`,
            from_user_id: currentUser.id,
            to_user_id: selectedUserId,
            message: msg,
            date: new Date().toISOString().split('T')[0],
        };
        setTransactions([...transactions, newTx]);
        const toUser = allUsers.find(u => u.id === selectedUserId);
        setSendSuccess(`${toUser?.name} さんに1ポイント送りました！`);
        setSelectedUserId('');
        setCustomMessage('');
        setTimeout(() => setSendSuccess(null), 3000);
    };

    const getUserName = (uid: string) => allUsers.find(u => u.id === uid)?.name || '不明';
    const getUserFac = (uid: string) => {
        const u = allUsers.find(x => x.id === uid);
        return facilities.find(f => f.id === u?.facility_id)?.name || '';
    };

    const rankMedal = (i: number) => i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;

    const tabs = [
        { key: 'send' as const, label: 'ポイントを送る', icon: '💝' },
        { key: 'ranking' as const, label: 'ランキング', icon: '🏆' },
        { key: 'history' as const, label: '履歴', icon: '📜' },
        { key: 'awards' as const, label: '過去のアワード', icon: '🎖️' },
    ];

    return (
        <div className="thanks-page">
            {/* My Status Cards */}
            <div className="thanks-stats">
                <div className="thanks-stat-card card thanks-stat-balance">
                    <div className="thanks-stat-icon">💎</div>
                    <div className="thanks-stat-info">
                        <div className="thanks-stat-value">{myBalance}</div>
                        <div className="thanks-stat-label">残り持ち点</div>
                    </div>
                    <div className="thanks-stat-sub">初期 {INITIAL_POINTS}pt</div>
                </div>
                <div className="thanks-stat-card card thanks-stat-received">
                    <div className="thanks-stat-icon">🌸</div>
                    <div className="thanks-stat-info">
                        <div className="thanks-stat-value">{myReceivedCount}</div>
                        <div className="thanks-stat-label">受け取りポイント</div>
                    </div>
                    <div className="thanks-stat-sub">今期累計</div>
                </div>
                <div className="thanks-stat-card card thanks-stat-sent">
                    <div className="thanks-stat-icon">✨</div>
                    <div className="thanks-stat-info">
                        <div className="thanks-stat-value">{mySentCount}</div>
                        <div className="thanks-stat-label">送ったポイント</div>
                    </div>
                    <div className="thanks-stat-sub">感謝を伝えた回数</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="thanks-tabs">
                {tabs.map(t => (
                    <button key={t.key} className={`thanks-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="card thanks-content">
                {/* ===== SEND ===== */}
                {activeTab === 'send' && (
                    <div className="thanks-send">
                        <h3 className="thanks-section-title">💝 ありがとうポイントを送る</h3>
                        <p className="thanks-send-desc">日頃の感謝を1ポイントに込めて、仲間に送りましょう！</p>

                        {sendSuccess && (
                            <div className="thanks-success-banner">
                                <span>🎉</span> {sendSuccess}
                            </div>
                        )}

                        <div className="thanks-send-form">
                            <div className="thanks-form-field">
                                <label>送り先スタッフ</label>
                                <select value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)}>
                                    <option value="">選択してください</option>
                                    {activeUsers
                                        .filter(u => u.id !== currentUser?.id)
                                        .map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name}（{facilities.find(f => f.id === u.facility_id)?.name || ''}）
                                            </option>
                                        ))}
                                </select>
                            </div>

                            <div className="thanks-form-field">
                                <label>メッセージタイプ</label>
                                <div className="thanks-msg-toggle">
                                    <button className={messageType === 'preset' ? 'active' : ''} onClick={() => setMessageType('preset')}>定型メッセージ</button>
                                    <button className={messageType === 'custom' ? 'active' : ''} onClick={() => setMessageType('custom')}>自由記述</button>
                                </div>
                            </div>

                            {messageType === 'preset' ? (
                                <div className="thanks-form-field">
                                    <label>定型メッセージ</label>
                                    <div className="thanks-preset-grid">
                                        {PRESET_MESSAGES.map(m => (
                                            <button key={m} className={`thanks-preset-btn ${presetMessage === m ? 'selected' : ''}`} onClick={() => setPresetMessage(m)}>
                                                {m}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="thanks-form-field">
                                    <label>ひとことメッセージ（50文字まで）</label>
                                    <input
                                        type="text"
                                        maxLength={50}
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="感謝のメッセージを入力..."
                                        className="thanks-custom-input"
                                    />
                                    <div className="thanks-char-count">{customMessage.length}/50</div>
                                </div>
                            )}

                            <button
                                className="thanks-send-btn"
                                onClick={sendPoint}
                                disabled={myBalance <= 0 || !selectedUserId}
                            >
                                💝 1ポイント送る
                                {myBalance <= 0 && <span className="thanks-send-disabled-msg">（持ち点がありません）</span>}
                            </button>
                        </div>

                        {/* Recent received */}
                        {myReceivedHistory.length > 0 && (
                            <div className="thanks-my-received">
                                <h4>🌸 最近受け取ったポイント</h4>
                                <div className="thanks-received-list">
                                    {myReceivedHistory.slice(0, 5).map(tx => (
                                        <div key={tx.id} className="thanks-received-item">
                                            <div className="thanks-received-from">
                                                <strong>{getUserName(tx.from_user_id)}</strong>
                                                <span className="thanks-received-fac">{getUserFac(tx.from_user_id)}</span>
                                            </div>
                                            <div className="thanks-received-msg">「{tx.message}」</div>
                                            <div className="thanks-received-date">{tx.date}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ===== RANKING ===== */}
                {activeTab === 'ranking' && (
                    <div className="thanks-ranking">
                        <h3 className="thanks-section-title">🏆 ありがとうポイント ランキング</h3>
                        <p className="thanks-ranking-desc">今期、最も感謝を集めたスタッフ</p>
                        <div className="thanks-ranking-list">
                            {ranking.map((r, i) => (
                                <div key={r.user!.id} className={`thanks-rank-item ${i < 3 ? 'thanks-rank-top' : ''}`}>
                                    <div className="thanks-rank-medal">{rankMedal(i)}</div>
                                    <div className="thanks-rank-info">
                                        <div className="thanks-rank-name">{r.user!.name}</div>
                                        <div className="thanks-rank-fac">{getUserFac(r.user!.id)}</div>
                                    </div>
                                    <div className="thanks-rank-points">
                                        <span className="thanks-rank-pts-value">{r.points}</span>
                                        <span className="thanks-rank-pts-label">pt</span>
                                    </div>
                                    <div className="thanks-rank-bar">
                                        <div className="thanks-rank-bar-fill" style={{ width: `${(r.points / Math.max(ranking[0]?.points || 1, 1)) * 100}%` }} />
                                    </div>
                                </div>
                            ))}
                            {ranking.length === 0 && <p className="thanks-empty">まだポイントのやり取りがありません</p>}
                        </div>
                    </div>
                )}

                {/* ===== HISTORY ===== */}
                {activeTab === 'history' && (
                    <div className="thanks-history">
                        <h3 className="thanks-section-title">📜 全体の送付履歴</h3>
                        <div className="thanks-history-list">
                            {recentAll.map(tx => (
                                <div key={tx.id} className="thanks-history-item">
                                    <div className="thanks-history-arrow">
                                        <span className="thanks-history-from">{getUserName(tx.from_user_id)}</span>
                                        <span className="thanks-history-icon">💝→</span>
                                        <span className="thanks-history-to">{getUserName(tx.to_user_id)}</span>
                                    </div>
                                    <div className="thanks-history-msg">「{tx.message}」</div>
                                    <div className="thanks-history-date">{tx.date}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ===== AWARDS ===== */}
                {activeTab === 'awards' && (
                    <div className="thanks-awards">
                        <h3 className="thanks-section-title">🎖️ 過去のアワード</h3>
                        <p className="thanks-awards-desc">年間で最も感謝を集めたスタッフの記録</p>
                        {pastAwards.map(award => (
                            <div key={award.year} className="thanks-award-year">
                                <h4 className="thanks-award-year-title">🏅 {award.year}年度 アワード</h4>
                                <div className="thanks-award-list">
                                    {award.rankings.map(r => (
                                        <div key={r.user_id} className={`thanks-award-item ${r.rank <= 3 ? 'thanks-award-top' : ''}`}>
                                            <span className="thanks-award-rank">{rankMedal(r.rank - 1)}</span>
                                            <span className="thanks-award-name">{getUserName(r.user_id)}</span>
                                            <span className="thanks-award-fac">{getUserFac(r.user_id)}</span>
                                            <span className="thanks-award-pts">{r.points}pt</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
