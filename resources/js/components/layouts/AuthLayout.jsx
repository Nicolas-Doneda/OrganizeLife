import ThemeToggle from '../ui/ThemeToggle';

export default function AuthLayout({ children }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden bg-[var(--bg-secondary)] transition-colors duration-300">
            {/* Decorative background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large gradient orb — top right */}
                <div
                    className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-[0.07] dark:opacity-[0.05]"
                    style={{
                        background: 'radial-gradient(circle, var(--color-primary-400), transparent 70%)',
                    }}
                />
                {/* Small accent orb — bottom left */}
                <div
                    className="absolute -bottom-24 -left-24 w-[350px] h-[350px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
                    style={{
                        background: 'radial-gradient(circle, var(--color-warning-500), transparent 70%)',
                    }}
                />
                {/* Subtle grid pattern overlay */}
                <div
                    className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]"
                    style={{
                        backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-tertiary) 1px, transparent 0)`,
                        backgroundSize: '32px 32px',
                    }}
                />
            </div>

            {/* Theme toggle */}
            <div className="fixed right-6 top-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                            boxShadow: '0 8px 24px -4px rgba(6, 158, 143, 0.35)',
                        }}
                    >
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        OrganizeLife
                    </h1>
                    <p className="mt-1.5 text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
                        Organize sua vida em um só lugar
                    </p>
                </div>

                {/* Form card */}
                <div
                    className="rounded-2xl border p-8 backdrop-blur-sm"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)',
                        boxShadow: 'var(--shadow-lg), var(--shadow-glow)',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
