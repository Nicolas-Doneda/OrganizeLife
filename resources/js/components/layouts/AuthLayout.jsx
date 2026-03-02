import ThemeToggle from '../ui/ThemeToggle';

export default function AuthLayout({ children }) {
    return (
        <div
            className="flex min-h-screen items-center justify-center px-4"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
            {/* Theme toggle no canto superior direito */}
            <div className="fixed right-4 top-4">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-600">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5" />
                            <path d="M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        OrganizeLife
                    </h1>
                    <p className="mt-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Organize sua vida em um so lugar
                    </p>
                </div>

                {/* Card do form */}
                <div
                    className="rounded-2xl border p-8"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-primary)',
                        boxShadow: 'var(--shadow-lg)',
                    }}
                >
                    {children}
                </div>
            </div>
        </div>
    );
}
