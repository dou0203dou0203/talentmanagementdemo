import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

type TabMode = 'login' | 'signup';

export default function Login() {
    const { login, signup, isSupabaseAuth } = useAuth();
    const [mode, setMode] = useState<TabMode>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        const result = await login(email, password);
        if (!result.success) {
            setError(result.error || 'ログインに失敗しました');
        }
        setLoading(false);
    };

    const handleSignup = async (e: FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!name.trim()) { setError('氏名を入力してください'); return; }
        if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }

        setLoading(true);
        const result = await signup(email, password, name.trim());
        if (result.success) {
            setSuccess('アカウントが作成されました。ログインしてください。');
            setMode('login');
            setName('');
            setPassword('');
        } else {
            setError(result.error || '登録に失敗しました');
        }
        setLoading(false);
    };

    const inputStyle: React.CSSProperties = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-neutral-200)',
        fontSize: 'var(--font-size-sm)',
        background: 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(8px)',
        transition: 'all 0.2s',
        outline: 'none',
    };

    const labelStyle: React.CSSProperties = {
        display: 'block',
        fontSize: 'var(--font-size-xs)',
        fontWeight: 600,
        color: 'var(--color-neutral-600)',
        marginBottom: 6,
    };

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

                {/* Tab switcher */}
                {isSupabaseAuth && (
                    <div style={{ display: 'flex', marginBottom: 20, borderRadius: 'var(--radius-lg)', overflow: 'hidden', border: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-50)' }}>
                        <button
                            type="button"
                            onClick={() => { setMode('login'); setError(''); setSuccess(''); }}
                            style={{
                                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: 'var(--font-size-sm)', transition: 'all 0.2s',
                                background: mode === 'login' ? 'var(--color-primary-600)' : 'transparent',
                                color: mode === 'login' ? '#fff' : 'var(--color-neutral-500)',
                            }}
                        >🔑 ログイン</button>
                        <button
                            type="button"
                            onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                            style={{
                                flex: 1, padding: '10px', border: 'none', cursor: 'pointer',
                                fontWeight: 600, fontSize: 'var(--font-size-sm)', transition: 'all 0.2s',
                                background: mode === 'signup' ? 'var(--color-primary-600)' : 'transparent',
                                color: mode === 'signup' ? '#fff' : 'var(--color-neutral-500)',
                            }}
                        >📝 新規登録</button>
                    </div>
                )}

                {/* Success message */}
                {success && (
                    <div style={{ padding: '12px 16px', borderRadius: 'var(--radius-md)', background: 'rgba(34,197,94,0.1)', color: '#16a34a', fontSize: 'var(--font-size-sm)', fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ✅ {success}
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="login-error" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Login Form */}
                {mode === 'login' && (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="login-field">
                            <label style={labelStyle} htmlFor="email">📧 メールアドレス</label>
                            <input
                                id="email"
                                type="email"
                                style={inputStyle}
                                placeholder="example@sakuranoki.jp"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="login-field">
                            <label style={labelStyle} htmlFor="password">🔒 パスワード</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    style={inputStyle}
                                    placeholder="パスワードを入力"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5 }}
                                    tabIndex={-1}
                                >{showPassword ? '🙈' : '👁️'}</button>
                            </div>
                        </div>

                        <button type="submit" className="login-button" disabled={loading} style={{ marginTop: 8 }}>
                            {loading ? '⏳ ログイン中...' : '🔑 ログイン'}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {mode === 'signup' && (
                    <form onSubmit={handleSignup} className="login-form">
                        <div className="login-field">
                            <label style={labelStyle} htmlFor="signup-name">👤 氏名 <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input
                                id="signup-name"
                                type="text"
                                style={inputStyle}
                                placeholder="山田 太郎"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="login-field">
                            <label style={labelStyle} htmlFor="signup-email">📧 メールアドレス <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <input
                                id="signup-email"
                                type="email"
                                style={inputStyle}
                                placeholder="example@sakuranoki.jp"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="login-field">
                            <label style={labelStyle} htmlFor="signup-password">🔒 パスワード <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="signup-password"
                                    type={showPassword ? 'text' : 'password'}
                                    style={inputStyle}
                                    placeholder="6文字以上"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', opacity: 0.5 }}
                                    tabIndex={-1}
                                >{showPassword ? '🙈' : '👁️'}</button>
                            </div>
                            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', marginTop: 4 }}>
                                ※ ロール（権限）は管理者により付与されます。初期ロールは「一般職員」です。
                            </div>
                        </div>

                        <button type="submit" className="login-button" disabled={loading} style={{ marginTop: 8 }}>
                            {loading ? '⏳ 登録中...' : '📝 アカウント作成'}
                        </button>
                    </form>
                )}

                {/* Footer info */}
                <div style={{ textAlign: 'center', marginTop: 20, fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)' }}>
                    {isSupabaseAuth ? (
                        <p>🔐 Supabase認証で安全にログインします</p>
                    ) : (
                        <p>⚙️ デモモードで動作中（Supabase未設定）</p>
                    )}
                </div>
            </div>
        </div>
    );
}
