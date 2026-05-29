import ThemeToggle from '../ui/ThemeToggle';
import LogoMark from '../ui/LogoMark';

export default function AuthLayout({ children }) {
    return (
        <div className="relative flex min-h-screen items-center justify-center px-4 overflow-hidden bg-[var(--bg-primary)] transition-colors duration-300 page-enter">
            {/* Stationery Dot Matrix Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
                    style={{
                        backgroundImage: `radial-gradient(var(--border-primary) 1.5px, transparent 1.5px)`,
                        backgroundSize: '24px 24px',
                    }}
                />

            </div>

            {/* Theme toggle */}
            <div className="fixed right-6 top-6 z-50">
                <ThemeToggle />
            </div>

            <div className="w-full max-w-md relative z-10 my-8">
                {/* Logo & Header styled as a ledger header */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--border-primary)]"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600))',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <LogoMark size={26} strokeColor="white" fillColor="white" strokeWidth="2.2" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-600)] bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-950)] px-2.5 py-0.5 rounded border border-[var(--color-primary-200)]/40">
                        Gestão Financeira
                    </span>
                    <h1 className="text-2xl font-extrabold tracking-tight mt-2 text-[var(--text-primary)] font-heading">
                        OrganizeLife
                    </h1>
                    <p className="mt-1 text-xs font-medium text-[var(--text-tertiary)]">
                        Organização Simples e Inteligente
                    </p>
                </div>

                {/* Form card styled as an index card / physical voucher sheet */}
                <div
                    className="relative rounded-xl border border-[var(--border-primary)] p-8 bg-[var(--bg-card)] shadow-md overflow-hidden"
                    style={{
                        borderTop: '6px solid var(--color-primary-500)',
                    }}
                >
                    <div className="relative">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
