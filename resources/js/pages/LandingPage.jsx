import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    CalendarDays,
    PiggyBank,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    Moon,
    Sun,
    Shield,
    Zap,
    TrendingUp
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            {/* Header / Navbar */}
            <header className="fixed top-0 w-full bg-[var(--bg-primary)]/80 backdrop-blur-xl z-50 border-b border-[var(--border-primary)] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
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
                        <span className="font-bold text-xl tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>OrganizeLife</span>
                    </div>

                    <nav className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-all hover:scale-110 active:scale-95 focus-ring"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {loading ? (
                            <div className="w-20 h-8 bg-[var(--bg-tertiary)] shimmer rounded-lg"></div>
                        ) : isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="btn-primary"
                            >
                                Acesse seu painel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="btn-primary"
                                >
                                    Começar Grátis
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 lg:pt-44 lg:pb-32 overflow-hidden flex flex-col items-center justify-center">
                    {/* Background decorations */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div
                            className="absolute top-20 left-1/4 w-[600px] h-[600px] rounded-full opacity-[0.06] dark:opacity-[0.04]"
                            style={{ background: 'radial-gradient(circle, var(--color-primary-400), transparent 70%)' }}
                        />
                        <div
                            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.05] dark:opacity-[0.03]"
                            style={{ background: 'radial-gradient(circle, var(--color-warning-400), transparent 70%)' }}
                        />
                        <div
                            className="absolute inset-0 opacity-[0.025] dark:opacity-[0.015]"
                            style={{
                                backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-tertiary) 1px, transparent 0)`,
                                backgroundSize: '40px 40px',
                            }}
                        />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-balance z-10">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-card)] border border-[var(--border-primary)] text-sm font-semibold mb-8 animate-in shadow-sm"
                            style={{ color: 'var(--color-primary-600)' }}
                        >
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--color-primary-400)' }}></span>
                                <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--color-primary-500)' }}></span>
                            </span>
                            Release 1.0 — Conheça o ecossistema
                        </div>

                        {/* Heading */}
                        <h1
                            className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 animate-in delay-1"
                            style={{ fontFamily: 'var(--font-heading)', opacity: 0 }}
                        >
                            Uma nova forma de
                            <span style={{ color: 'var(--color-primary-500)' }}> organizar </span>
                            <br className="hidden sm:block" />
                            o que
                            <span style={{ color: 'var(--color-primary-600)' }}> importa</span>
                        </h1>

                        {/* Subtitle */}
                        <p
                            className="text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-medium animate-in delay-2"
                            style={{ color: 'var(--text-secondary)', opacity: 0 }}
                        >
                            O OrganizeLife é um sistema centralizado para organizar suas tarefas, contas e eventos. Abandone a fricção das rotinas complexas e ganhe clareza do seu dia a dia.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in delay-3" style={{ opacity: 0 }}>
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-lg transition-all hover:-translate-y-1"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                                        boxShadow: '0 8px 24px -4px rgba(6, 158, 143, 0.35)',
                                    }}
                                >
                                    Criar conta gratuita
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            )}
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--bg-card)] px-8 py-4 text-base font-semibold text-[var(--text-primary)] shadow-sm ring-1 ring-inset ring-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-all hover:-translate-y-0.5"
                            >
                                Conhecer recursos
                            </a>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm font-medium animate-in delay-4" style={{ color: 'var(--text-secondary)', opacity: 0 }}>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                                <span>Foco em Produtividade</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                                <span>Interface Minimalista</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" style={{ color: 'var(--color-primary-500)' }} />
                                <span>Controle Total dos Dados</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <p className="text-sm font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--color-primary-600)' }}>
                                Tudo em um só lugar
                            </p>
                            <h2 className="text-3xl font-bold sm:text-4xl tracking-tight mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
                                A arquitetura da sua rotina
                            </h2>
                            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                                Projetado com rigor técnico para modelar sua rotina de forma fluida.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <FeatureCard
                                icon={PiggyBank}
                                title="Gastos sob controle"
                                description="Adicione suas contas fixas, saiba exatamente para onde seu dinheiro vai todo mês e evite surpresas na fatura."
                                delay="1"
                            />
                            <FeatureCard
                                icon={CalendarDays}
                                title="Agenda Inteligente"
                                description="Uma visão completa das suas tarefas, compromissos e datas de vencimento. Prazos nunca mais serão esquecidos."
                                delay="2"
                            />
                            <FeatureCard
                                icon={LayoutDashboard}
                                title="Visão Completa"
                                description="Um dashboard impecável e minimalista. Em poucos segundos de manhã, você sabe tudo o que precisa ser feito."
                                delay="3"
                            />
                        </div>

                        {/* Secondary features */}
                        <div className="grid md:grid-cols-3 gap-6 mt-6">
                            <FeatureCard
                                icon={Shield}
                                title="Seguro & Privado"
                                description="Seus dados criptografados e protegidos. Autenticação de dois fatores e controle de sessão disponíveis."
                                delay="4"
                            />
                            <FeatureCard
                                icon={Zap}
                                title="Rápido & Leve"
                                description="Interface construída para ser instantânea. Sem carregamentos desnecessários, sem travamentos."
                                delay="5"
                            />
                            <FeatureCard
                                icon={TrendingUp}
                                title="Orçamento Inteligente"
                                description="Regras de orçamento flexíveis (50/30/20, 60/30/10) que se adaptam às suas metas financeiras."
                                delay="6"
                            />
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 bg-[var(--bg-primary)] transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div
                            className="rounded-3xl p-10 md:p-16 text-center shadow-lg overflow-hidden relative"
                            style={{
                                background: 'linear-gradient(135deg, var(--color-primary-800), var(--color-primary-900))',
                            }}
                        >
                            {/* Decorative circles */}
                            <div
                                className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full opacity-10"
                                style={{ background: 'radial-gradient(circle, var(--color-primary-300), transparent 70%)' }}
                            />
                            <div
                                className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full opacity-10"
                                style={{ background: 'radial-gradient(circle, var(--color-warning-400), transparent 70%)' }}
                            />

                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10" style={{ fontFamily: 'var(--font-heading)' }}>
                                Conheça o ecossistema
                            </h2>
                            <p className="text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10 font-medium" style={{ color: 'var(--color-primary-200)' }}>
                                Um espaço digital desenvolvido para manter o equilíbrio de suas finanças e calendário. Menos distrações, mais clareza.
                            </p>
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="relative z-10 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-bold shadow-xl hover:scale-105 transition-all"
                                    style={{ color: 'var(--color-primary-800)' }}
                                >
                                    Criar conta gratuitamente
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-[var(--bg-secondary)] py-12 border-t border-[var(--border-primary)] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <div
                            className="flex h-7 w-7 items-center justify-center rounded-lg"
                            style={{ background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))' }}
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                                <path d="M2 17l10 5 10-5" />
                                <path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span className="font-bold" style={{ fontFamily: 'var(--font-heading)' }}>OrganizeLife</span>
                    </div>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        Desenvolvido com carinho para simplificar dias complexos.
                    </p>
                    <p className="text-xs mt-4" style={{ color: 'var(--text-tertiary)' }}>
                        &copy; {new Date().getFullYear()} OrganizeLife. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}

/* Feature Card Component */
function FeatureCard({ icon: Icon, title, description, delay }) {
    return (
        <div
            className={`rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 group`}
            style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md), var(--shadow-glow)';
                e.currentTarget.style.borderColor = 'var(--color-primary-500)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                e.currentTarget.style.borderColor = 'var(--border-primary)';
            }}
        >
            <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                style={{
                    background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                    boxShadow: '0 4px 12px -2px rgba(6, 158, 143, 0.25)',
                }}
            >
                <Icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
            <p className="text-[15px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                {description}
            </p>
        </div>
    );
}
