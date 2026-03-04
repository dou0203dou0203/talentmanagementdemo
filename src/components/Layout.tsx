import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

const navItems = [
    {
        group: 'メイン',
        items: [
            { path: '/', label: 'ダチE��ュボ�EチE, icon: '📊' },
            { path: '/evaluation', label: '評価入劁E, icon: '📝' },
            { path: '/survey', label: 'サーベイ回筁E, icon: '�E' },
        ],
    },
    {
        group: '管琁E,
        items: [
            { path: '/survey/history', label: 'サーベイ管琁E, icon: '📋' },
            { path: '/staffing', label: '人員配置', icon: '🏥' },
            { path: '/alerts', label: '離職アラーチE, icon: '🔔' },
        ],
    },
];

const pageTitles: Record<string, string> = {
    '/': 'ダチE��ュボ�EチE,
    '/evaluation': '評価入劁E,
    '/survey': '定期サーベイ',
    '/survey/history': 'サーベイ管琁E,
    '/staffing': '人員配置管琁E,
    '/alerts': '離職防止アラーチE,
};

export default function Layout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const currentTitle = pageTitles[location.pathname] || 'タレント�EネジメンチE;

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
                        <div className="sidebar-logo-icon">TM</div>
                        <div>
                            <div className="sidebar-logo-text">タレント�EネジメンチE/div>
                            <div className="sidebar-logo-subtitle">医療�E介護グルーチE/div>
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
                    <div className="sidebar-user-avatar">田</div>
                    <div className="sidebar-user-info">
                        <div className="sidebar-user-name">田中 太郁E/div>
                        <div className="sidebar-user-role">統括本部 / 管琁E��E/div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-content">
                <header className="main-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button
                            className="mobile-menu-toggle"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            aria-label="メニューを開ぁE
                        >
                            ☰
                        </button>
                        <h1 className="main-header-title">{currentTitle}</h1>
                    </div>
                    <div className="main-header-actions">
                        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
                            2026年3朁E
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
