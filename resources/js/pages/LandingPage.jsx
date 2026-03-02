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
    Sun
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300">
            {/* Header / Navbar */}
            <header className="fixed top-0 w-full bg-[var(--bg-primary)]/80 backdrop-blur-md z-50 border-b border-[var(--border-primary)] transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-600)] flex items-center justify-center text-white font-bold text-xl shadow-md">
                            O
                        </div>
                        <span className="font-bold text-xl tracking-tight">OrganizeLife</span>
                    </div>

                    <nav className="flex items-center gap-4">
                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors focus-ring"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {loading ? (
                            <div className="w-20 h-8 bg-[var(--bg-tertiary)] animate-pulse rounded-md"></div>
                        ) : isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[var(--color-primary-700)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 transition-all"
                            >
                                Acesse seu painel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[var(--color-primary-700)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2 transition-all hover:scale-105"
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
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden flex flex-col items-center justify-center">
                    {/* Background decorations matched to pine/emerald */}
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-[var(--color-primary-100)] dark:bg-[var(--color-primary-900)] rounded-full blur-[120px] -z-10 opacity-30"></div>
                    <div className="absolute top-32 left-0 -translate-x-1/3 w-[600px] h-[600px] bg-[var(--color-primary-200)] dark:bg-[var(--color-primary-800)] rounded-full blur-[120px] -z-10 opacity-20"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-balance z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-sm font-medium text-[var(--color-primary-600)] mb-8">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-primary-400)] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-primary-500)]"></span>
                            </span>
                            Simplifique sua vida
                        </div>

                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
                            Domine o seu
                            <span className="text-[var(--color-primary-600)]"> tempo </span>
                            e o seu
                            <span className="text-[var(--color-primary-500)]"> dinheiro </span>
                        </h1>
                        <p className="mt-4 text-xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-10 leading-relaxed">
                            OrganizeLife reúne gestão financeira, calendário inteligente e organização pessoal em um único aplicativo bonito e fácil de usar. Esqueça as dezenas de planilhas.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-600)] px-8 py-4 text-base font-semibold text-white shadow-lg hover:bg-[var(--color-primary-700)] transition-all hover:-translate-y-1"
                                >
                                    Criar conta gratuita
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            )}
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-[var(--bg-card)] px-8 py-4 text-base font-semibold text-[var(--text-primary)] shadow-sm ring-1 ring-inset ring-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-all"
                            >
                                Conhecer recursos
                            </a>
                        </div>
                        
                        <div className="mt-14 flex flex-wrap items-center justify-center gap-8 text-sm text-[var(--text-secondary)] font-medium">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                                <span>100% Gratuito</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                                <span>Seguro & Privado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[var(--color-primary-500)]" />
                                <span>Sem propagandas</span>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-[var(--bg-secondary)] border-y border-[var(--border-primary)] transition-colors duration-300">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-[var(--color-primary-600)] font-bold tracking-wide uppercase text-sm mb-3">Tudo em um só lugar</h2>
                            <p className="text-3xl font-bold sm:text-4xl tracking-tight">O fim do caos na sua rotina</p>
                            <p className="mt-4 text-lg text-[var(--text-secondary)]">Projetado com paixão para te dar controle total sobre o que realmente importa na sua vida.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-primary)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-600)] flex items-center justify-center mb-6">
                                    <PiggyBank className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Gastos sob controle</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    Adicione suas contas fixas, saiba exatamente para onde seu dinheiro vai todo mês e evite surpresas na fatura. O fim do sofrimento nas finanças.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-primary)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-600)] flex items-center justify-center mb-6">
                                    <CalendarDays className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Agenda Inteligente</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    Uma visão completa das suas tarefas, compromissos e datas de vencimento. Prazos não passarão mais batido na sua rotina corrida.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-[var(--bg-card)] rounded-3xl p-8 shadow-[var(--shadow-card)] ring-1 ring-[var(--border-primary)] hover:shadow-[var(--shadow-md)] hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary-50)] dark:bg-[var(--color-primary-900)] text-[var(--color-primary-600)] flex items-center justify-center mb-6">
                                    <LayoutDashboard className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">Visão Completa</h3>
                                <p className="text-[var(--text-secondary)] leading-relaxed">
                                    Um dashboard impecável e minimalista. Em poucos segundos de manhã, você sabe tudo o que precisa ser feito e pago naquele dia.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 bg-[var(--bg-primary)] transition-colors duration-300">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-[var(--color-primary-800)] rounded-[2.5rem] p-10 md:p-16 text-center shadow-[var(--shadow-lg)] overflow-hidden relative">
                             {/* Decorative circles */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl mix-blend-overlay"></div>
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-black/20 blur-3xl mix-blend-overlay"></div>
                            
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Pronto para assumir as rédeas?</h2>
                            <p className="text-[var(--color-primary-100)] text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10 font-medium">
                                Junte-se a nós hoje. Leva menos de 2 minutos para se cadastrar e começar a organizar uma vida fantástica.
                            </p>
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="relative z-10 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-bold text-[var(--color-primary-800)] shadow-xl hover:bg-[var(--bg-secondary)] transition-all hover:scale-105"
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
                        <div className="w-6 h-6 rounded bg-[var(--text-primary)] flex items-center justify-center text-[var(--bg-primary)] font-bold text-xs">O</div>
                        <span className="font-semibold text-[var(--text-primary)]">OrganizeLife</span>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">
                        Desenvolvido com carinho para simplificar dias complexos.
                    </p>
                    <p className="text-[var(--text-tertiary)] text-xs mt-4">
                        &copy; {new Date().getFullYear()} OrganizeLife. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
