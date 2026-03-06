import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        setTimeout(() => {
            const result = login(email, password);
            if (!result.success) {
                setError(result.error || 'ログインに失敗しました');
            }
            setLoading(false);
        }, 400);
    };

    const demoAccounts = [
        { email: 'user1@example.com', role: '人事本部', color: '#d4739b' },
        { email: 'user11@example.com', role: '事業所管理者', color: '#8db93e' },
        { email: 'user2@example.com', role: '一般職員', color: '#6b7a87' },
    ];

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <img
                        src={import.meta.env.BASE_URL + 'logo.png'}
                        alt="さくらの樹グループ"
                        className="login-logo"
                    />
                    <h1 className="login-title">さくらの樹グループ</h1>
                    <p className="login-subtitle">タレントマネジメントシステム</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && <div className="login-error">{error}</div>}

                    <div className="login-field">
                        <label className="login-label" htmlFor="email">メールアドレス</label>
                        <input
                            id="email"
                            type="email"
                            className="login-input"
                            placeholder="example@sakuranoki.jp"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="login-field">
                        <label className="login-label" htmlFor="password">パスワード</label>
                        <input
                            id="password"
                            type="password"
                            className="login-input"
                            placeholder="パスワードを入力"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'ログイン中...' : 'ログイン'}
                    </button>
                </form>

                <div className="login-demo-info">
                    <p className="login-demo-title">🔑 デモ用アカウント</p>
                    <div className="login-demo-accounts">
                        {demoAccounts.map((acc) => (
                            <button
                                key={acc.email}
                                type="button"
                                className="login-demo-btn"
                                onClick={() => { setEmail(acc.email); setPassword('demo'); }}
                            >
                                <span className="login-demo-role" style={{ background: acc.color + '20', color: acc.color }}>{acc.role}</span>
                                <span className="login-demo-email">{acc.email}</span>
                            </button>
                        ))}
                    </div>
                    <p className="login-demo-note">※ パスワードは任意の値で入力可能です</p>
                </div>
            </div>
        </div>
    );
}
