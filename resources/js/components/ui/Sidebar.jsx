import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import {
    LayoutDashboard,
    Receipt,
    Wallet,
    Tag,
    CalendarDays,
    LogOut,
    Settings,
    ChevronLeft,
    Menu,
    Home,
    CreditCard
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/', label: 'Início', icon: Home },
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/incomes', label: 'Rendas', icon: Wallet },
    { to: '/bills', label: 'Contas', icon: Receipt },
    { to: '/calendar', label: 'Calendário', icon: CalendarDays },
    { to: '/categories', label: 'Categorias', icon: Tag },
    { to: '/wallets', label: 'Carteiras', icon: CreditCard },
    { to: '/profile', label: 'Configurações', icon: Settings },
];

export default function Sidebar() {
    const { user, avatar_url, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const sidebarWidth = collapsed ? 72 : 260;

    const avatarColor = (user?.avatar && user.avatar.startsWith('#')) ? user.avatar : '#0bc4af';

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl lg:hidden transition-all duration-200 hover:scale-105 active:scale-95"
                style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setMobileOpen(false)} />
            )}

            {/* Desktop spacer */}
            <div
                className="hidden lg:block shrink-0 transition-all duration-300"
                style={{ width: sidebarWidth }}
            />

            {/* Sidebar */}
            <aside
                className={`
                    fixed left-0 top-0 z-50 flex h-screen flex-col border-r transition-all duration-300 overflow-hidden
                    ${collapsed ? 'w-[72px]' : 'w-[260px]'}
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                `}
                style={{ backgroundColor: 'var(--bg-sidebar)', borderColor: 'var(--border-primary)' }}
            >
                {/* Header */}
                <div className="flex h-16 items-center justify-between px-4 mt-2 mb-2">
                    {!collapsed && (
                        <Link to="/dashboard" className="flex items-center gap-2.5 group cursor-pointer transition-transform hover:scale-[1.02] active:scale-95">
                            <div
                                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-md"
                                style={{
                                    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                                    boxShadow: '0 4px 12px -2px rgba(6, 158, 143, 0.3)',
                                }}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                OrganizeLife
                            </span>
                        </Link>
                    )}
                    <button
                        onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
                        className="hidden h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 lg:flex hover:bg-[var(--bg-hover)]"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Separator */}
                <div className="mx-3 border-t mb-2" style={{ borderColor: 'var(--border-primary)' }} />

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-1">
                    <div className="space-y-0.5">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold tracking-tight transition-all duration-200 ${collapsed ? 'justify-center py-3.5' : ''}`
                                }
                                style={({ isActive }) => ({
                                    backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                                    color: isActive ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                                    borderLeft: isActive && !collapsed ? '3px solid var(--color-primary-500)' : '3px solid transparent',
                                })}
                            >
                                {({ isActive }) => (
                                    <>
                                        <Icon
                                            size={20}
                                            strokeWidth={isActive ? 2.5 : 2}
                                            className="transition-all duration-200 group-hover:scale-110"
                                            style={{ color: isActive ? 'var(--color-primary-500)' : undefined }}
                                        />
                                        {!collapsed && <span>{label}</span>}
                                    </>
                                )}
                            </NavLink>
                        ))}
                    </div>
                </nav>

                {/* Footer */}
                <div className="border-t px-3 py-3" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className={`mb-2 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
                        {!collapsed && (
                            <span className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>Tema</span>
                        )}
                        <ThemeToggle />
                    </div>

                    {!collapsed && user && (
                        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ backgroundColor: 'var(--bg-hover)' }}>
                            {avatar_url && !avatar_url.includes('ui-avatars.com') ? (
                                <img
                                    src={avatar_url}
                                    alt={user.name}
                                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-[var(--border-primary)]"
                                />
                            ) : (
                                <div
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-sm"
                                    style={{
                                        background: `linear-gradient(135deg, ${avatarColor}, ${avatarColor}dd)`,
                                    }}
                                >
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                <p className="truncate text-[11px] font-medium tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[14px] font-semibold tracking-tight transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/10 ${collapsed ? 'justify-center' : ''}`}
                        style={{ color: 'var(--color-danger-500)' }}
                    >
                        <LogOut size={20} strokeWidth={2} className="transition-transform duration-200 group-hover:scale-110" />
                        {!collapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
