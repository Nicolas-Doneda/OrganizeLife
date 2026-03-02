import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    CalendarDays,
    PiggyBank,
    LayoutDashboard,
    ArrowRight,
    CheckCircle2,
    BarChart3
} from 'lucide-react';

export default function LandingPage() {
    const { isAuthenticated, loading } = useAuth();

    return (
        <div className="min-h-screen bg-white">
            {/* Header / Navbar */}
            <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                            O
                        </div>
                        <span className="font-bold text-xl text-gray-900 tracking-tight">OrganizeLife</span>
                    </div>

                    <nav className="flex items-center gap-4">
                        {loading ? (
                            <div className="w-20 h-8 bg-gray-100 animate-pulse rounded-md"></div>
                        ) : isAuthenticated ? (
                            <Link
                                to="/dashboard"
                                className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-all"
                            >
                                Acesse seu painel
                            </Link>
                        ) : (
                            <>
                                <Link
                                    to="/login"
                                    className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all hover:scale-105"
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
                <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
                    {/* Background decorations */}
                    <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50 via-white to-white"></div>
                    <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 w-[800px] h-[800px] bg-purple-100/50 rounded-full blur-[120px] -z-10 mix-blend-multiply opacity-50"></div>
                    <div className="absolute top-32 left-0 -translate-x-1/3 w-[600px] h-[600px] bg-indigo-100/50 rounded-full blur-[120px] -z-10 mix-blend-multiply opacity-50"></div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-balance">
                        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 tracking-tight mb-8">
                            Domine o seu
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600"> tempo </span>
                            e o seu
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500"> dinheiro </span>
                        </h1>
                        <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto mb-10 leading-relaxed">
                            OrganizeLife reúne gestão financeira, calendário inteligente e organização pessoal em um único aplicativo bonito e fácil de usar. Esqueça as dezenas de planilhas.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-gray-900/10 hover:bg-gray-800 transition-all hover:-translate-y-1"
                                >
                                    Criar conta gratuita
                                    <ArrowRight className="w-5 h-5" />
                                </Link>
                            )}
                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-gray-50 transition-all"
                            >
                                Conhecer recursos
                            </a>
                        </div>

                        <div className="mt-14 flex items-center justify-center gap-8 text-sm text-gray-500 font-medium">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                <span>100% Gratuito</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                <span>Seguro & Privado</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                                <span>Cancelamento Fácil</span>
                            </div>
                        </div>

                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-24 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center max-w-2xl mx-auto mb-16">
                            <h2 className="text-indigo-600 font-semibold tracking-wide uppercase text-sm mb-3">Tudo em um só lugar</h2>
                            <p className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">O fim do caos na sua rotina</p>
                            <p className="mt-4 text-lg text-gray-600">Projetado com paixão para te dar controle total sobre o que realmente importa na sua vida.</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Feature 1 */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                                    <PiggyBank className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Gastos sob controle</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Adicione suas contas fixas, saiba exatamente para onde seu dinheiro vai todo mês e evite surpresas na fatura. O fim do sofrimento nas finanças.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                                    <CalendarDays className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Agenda Inteligente</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Uma visão completa das suas tarefas, compromissos e datas de vencimento. Prazos não passarão mais batido na sua rotina corrida.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="bg-white rounded-3xl p-8 shadow-sm ring-1 ring-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                                <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mb-6">
                                    <LayoutDashboard className="w-7 h-7" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-3">Visão Completa</h3>
                                <p className="text-gray-600 leading-relaxed">
                                    Um dashboard impecável e minimalista. Em poucos segundos de manhã, você sabe tudo o que precisa ser feito e pago naquele dia.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Call to Action */}
                <section className="py-24 bg-white">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-[2.5rem] p-10 md:p-16 text-center shadow-2xl overflow-hidden relative">
                            {/* Decorative circles */}
                            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>
                            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 rounded-full bg-white/5 blur-3xl"></div>

                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 relative z-10">Pronto para assumir as rédeas?</h2>
                            <p className="text-indigo-100 text-lg md:text-xl max-w-2xl mx-auto mb-10 relative z-10">
                                Junte-se a nós hoje. Leva menos de 2 minutos para se cadastrar e começar a organizar uma vida fantástica.
                            </p>
                            {!isAuthenticated && (
                                <Link
                                    to="/register"
                                    className="relative z-10 inline-flex items-center justify-center rounded-xl bg-white px-8 py-4 text-lg font-bold text-indigo-900 shadow-xl hover:bg-gray-50 transition-all hover:scale-105"
                                >
                                    Criar conta gratuitamente
                                </Link>
                            )}
                        </div>
                    </div>
                </section>

            </main>

            {/* Footer */}
            <footer className="bg-gray-50 py-12 border-t border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-6 opacity-80">
                        <div className="w-6 h-6 rounded bg-gray-900 flex items-center justify-center text-white font-bold text-xs">O</div>
                        <span className="font-semibold text-gray-900">OrganizeLife</span>
                    </div>
                    <p className="text-gray-500 text-sm">
                        Desenvolvido com carinho para simplificar dias complexos.
                    </p>
                    <p className="text-gray-400 text-xs mt-4">
                        &copy; {new Date().getFullYear()} OrganizeLife. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
}
