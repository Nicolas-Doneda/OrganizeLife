import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import {
    LayoutDashboard,
    Receipt,
    Tag,
    CalendarDays,
    LogOut,
    Settings,
    ChevronLeft,
    Menu,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/bills', label: 'Contas', icon: Receipt },
    { to: '/calendar', label: 'Calendario', icon: CalendarDays },
    { to: '/categories', label: 'Categorias', icon: Tag },
    { to: '/profile', label: 'Configuracoes', icon: Settings },
];

export default function Sidebar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const sidebarWidth = collapsed ? 72 : 260;

    const avatarColor = user?.avatar || '#6366f1';

    async function handleLogout() {
        await logout();
        navigate('/login');
    }

    return (
        <>
            {/* Mobile toggle */}
            <button
                onClick={() => setMobileOpen(true)}
                className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg lg:hidden"
                style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-md)', color: 'var(--text-primary)' }}
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            {mobileOpen && (
                <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
            )}

            {/* Desktop spacer — reserves space for the fixed sidebar */}
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
                <div className="flex h-16 items-center justify-between px-4">
                    {!collapsed && (
                        <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                    <path d="M2 17l10 5 10-5" />
                                    <path d="M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            <span className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                                OrganizeLife
                            </span>
                        </div>
                    )}
                    <button
                        onClick={() => { setCollapsed(!collapsed); setMobileOpen(false); }}
                        className="hidden h-8 w-8 items-center justify-center rounded-lg transition-colors lg:flex"
                        style={{ color: 'var(--text-tertiary)' }}
                    >
                        <ChevronLeft size={18} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-2">
                    <div className="space-y-1">
                        {navItems.map(({ to, label, icon: Icon }) => (
                            <NavLink
                                key={to}
                                to={to}
                                onClick={() => setMobileOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''}`
                                }
                                style={({ isActive }) => ({
                                    backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                                    color: isActive ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                                })}
                            >
                                <Icon size={20} strokeWidth={1.8} />
                                {!collapsed && <span>{label}</span>}
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
                        <div className="mb-2 flex items-center gap-3 rounded-lg px-3 py-2" style={{ backgroundColor: 'var(--bg-hover)' }}>
                            {user.avatar && !user.avatar.startsWith('#') && user.avatar.length > 7 ? (
                                <img
                                    src={`/storage/${user.avatar}`}
                                    alt={user.name}
                                    className="h-8 w-8 shrink-0 rounded-full object-cover"
                                />
                            ) : (
                                <div
                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                                    style={{ backgroundColor: avatarColor }}
                                >
                                    {user.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{user.name}</p>
                                <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{user.email}</p>
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''}`}
                        style={{ color: 'var(--color-danger-500)' }}
                    >
                        <LogOut size={20} strokeWidth={1.8} />
                        {!collapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>
        </>
    );
}
