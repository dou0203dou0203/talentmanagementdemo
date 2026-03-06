import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    {
        group: 'メイン',
        items: [
            { path: '/', label: 'ダッシュボード', icon: '📊' },
            { path: '/staff', label: 'スタッフ詳細', icon: '👤' },
            { path: '/evaluation', label: '評価入力', icon: '📝' },
            { path: '/survey', label: 'サーベイ回答', icon: '😊' },
        ],
    },
    {
        group: '管理',
        items: [
            { path: '/survey/history', label: 'サーベイ管理', icon: '📋' },
            { path: '/interviews', label: '面談記録', icon: '💬' },
            { path: '/org', label: '組織管理', icon: '🏢' },
            { path: '/analytics', label: '分析', icon: '📈' },
            { path: '/staffing', label: '人員配置', icon: '🏥' },
            { path: '/alerts', label: '離職アラート', icon: '🔔' },
        ],
    },
];

const pageTitles: Record<string, string> = {
    '/': 'ダッシュボード',
    '/staff': 'スタッフ詳細',
    '/evaluation': '評価入力',
    '/survey': '定期サーベイ',
    '/survey/history': 'サーベイ管理',
    '/interviews': '面談記録',
    '/org': '組織管理',
    '/analytics': '分析ダッシュボード',
    '/staffing': '人員配置管理',
    '/alerts': '離職防止アラート',
};

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, roleLabel } = useAuth();

    const currentTitle = pageTitles[location.pathname] || 'タレントマネジメント';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="app-layout">
            {/* Sidebar Overlay (mobile) */}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
                onClick={() => setSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon"><img src={import.meta.env.BASE_URL + 'logo.png'} alt="ロゴ" style={{ width: 32, height: 32, objectFit: 'contain' }} /></div>
                        <div>
                            <div className="sidebar-logo-text">さくらの樹グループ</div>
                            <div className="sidebar-logo-subtitle">タレントマネジメント</div>
                        </div>
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((group) => (
                        <div key={group.group} className="sidebar-nav-group">
                            <div className="sidebar-nav-label">{group.group}</div>
                            {group.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) =>
                                        `sidebar-nav-item ${isActive ? 'active' : ''}`
                                    }
                                    onClick={() => setSidebarOpen(false)}
                                    end={item.path === '/'}
                                >
                                    <span className="nav-icon">{item.icon}</span>
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-user">
                    <div className="sidebar-user-avatar">{user?.name.charAt(0) || '?'}</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">{user?.name || 'ゲスト'}</div>
                        <div className="sidebar-user-role">{user?.facility_name} / {roleLabel}</div>
                    </div>
                    <button className="sidebar-logout-btn" onClick={handleLogout} title="ログアウト">
                        🚪
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="main-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="メニューを開く"
                        >
                            ☰
                        </button>
                        <h1 className="main-header-title">{currentTitle}</h1>
                    </div>
                    <div className="main-header-actions">
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
                            2026年3月
                        </span>
                    </div>
                </header>
                <main className="main-body fade-in">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
