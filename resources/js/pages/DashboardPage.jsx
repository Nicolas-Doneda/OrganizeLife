import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    AlertTriangle,
    CalendarDays,
    DollarSign,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Wallet,
    Calendar,
    BookOpen,
} from 'lucide-react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { formatDateBR } from '../utils/date';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    const activePeriodRef = useRef({ year, month });

    useEffect(() => {
        activePeriodRef.current = { year, month };
    }, [year, month]);

    useEffect(() => {
        fetchData();

        function handleVisibility() {
            if (document.visibilityState === 'visible') fetchData();
        }
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [year, month]);

    async function fetchData() {
        const reqYear = year;
        const reqMonth = month;
        setLoading(true);
        try {
            const [summaryRes, historyRes] = await Promise.all([
                api.get('/dashboard/summary', { params: { year: reqYear, month: reqMonth } }),
                api.get('/dashboard/history', { params: { year: reqYear, month: reqMonth, months: 6 } }),
            ]);
            if (activePeriodRef.current.year !== reqYear || activePeriodRef.current.month !== reqMonth) {
                return;
            }
            setData(summaryRes.data);
            setHistory(
                historyRes.data.data.map((h) => ({
                    ...h,
                    label: `${MONTH_NAMES[h.month].slice(0, 3)}/${String(h.year).slice(2)}`,
                }))
            );
        } catch (err) {
            console.error('Erro ao buscar dados do dashboard:', err);
        } finally {
            if (activePeriodRef.current.year === reqYear && activePeriodRef.current.month === reqMonth) {
                setLoading(false);
            }
        }
    }

    function prevMonth() {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    }

    function nextMonth() {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    }

    const goToCurrentMonth = () => {
        setYear(new Date().getFullYear());
        setMonth(new Date().getMonth() + 1);
    };

    const summary = data?.financial_summary || {};
    const byCategory = data?.by_category || [];
    const upcomingBills = data?.upcoming_bills || [];
    const overdueBills = data?.overdue_bills || [];
    const upcomingEvents = data?.upcoming_events || [];

    const totalIncome = summary.total_incomes || 0;
    const rules = summary.budget_rules || { needs: 50, wants: 30, savings: 20 };
    const spent = summary.budget_spent || { needs: 0, wants: 0, savings: 0 };
    const balanceExpected = totalIncome - (summary.total_expected || 0);

    const allSavings = data?.savings || [];
    const totalSaved = allSavings.reduce((acc, sv) => acc + Number(sv.current_amount || 0), 0);
    const totalCategoriesSum = byCategory.reduce((acc, cat) => acc + Number(cat.total || 0), 0);

    const isCurrentMonth = year === new Date().getFullYear() && month === (new Date().getMonth() + 1);

    return (
        <AppLayout>
            {/* Header com estética de Livro Contábil / Diário Financeiro */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b-2 border-dashed border-[var(--border-primary)] pb-6">
                <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary-600)] bg-[var(--color-primary-50)] px-2.5 py-1 rounded-full">
                        Folha de Caixa
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight mt-2 text-[var(--text-primary)] font-heading">
                        Sua Rotina Financeira
                    </h1>
                    <p className="text-xs mt-1.5 text-[var(--text-secondary)] font-medium">
                        Olá, {user?.name?.split(' ')[0]}! Veja entradas, saídas e compromissos para o período de{' '}
                        <strong className="text-[var(--text-primary)]">{MONTH_NAMES[month]} de {year}</strong>.
                    </p>
                </div>

                {/* Seletor de Período estilo Ficha Contábil */}
                <div className="flex items-center gap-2">
                    {!isCurrentMonth && (
                        <button
                            onClick={goToCurrentMonth}
                            className="text-[10px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] active:scale-95 transition-all text-[var(--color-primary-600)]"
                            style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
                        >
                            Mês Atual
                        </button>
                    )}
                    <div
                        className="flex items-center gap-1.5 rounded-xl p-1 border border-[var(--border-primary)] shadow-sm bg-[var(--bg-card)]"
                    >
                        <button
                            onClick={prevMonth}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Mês anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span
                            className="min-w-[120px] text-center text-xs font-semibold uppercase tracking-wider text-[var(--text-primary)]"
                        >
                            {MONTH_NAMES[month].slice(0, 3)} {year}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="flex h-8 w-8 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95"
                            style={{ color: 'var(--text-secondary)' }}
                            title="Próximo mês"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <DashboardSkeleton />
            ) : (
                <div className="space-y-6">
                    {/* Fichas Financeiras (Summary Cards) com microvisualizações */}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        <IncomeCard summary={summary} delay={0} />
                        <ExpenseCard summary={summary} delay={1} />
                        <BalanceCard balanceExpected={balanceExpected} summary={summary} delay={2} />
                        <PendingCard summary={summary} delay={3} />
                    </div>

                    {/* Orçamento Inteligente (Mapa do Mês) */}
                    {totalIncome > 0 && (
                        <div
                            className="rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 border-b border-dashed border-[var(--border-primary)] pb-4">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                        Distribuição de Recursos
                                    </span>
                                    <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] font-heading mt-0.5">
                                        Orçamento Inteligente ({rules.needs}/{rules.wants}/{rules.savings})
                                    </h3>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1">
                                        Limites de gastos projetados com base na sua renda líquida mensal esperada.
                                    </p>
                                </div>
                                <Link
                                    to="/profile"
                                    className="text-xs font-bold uppercase tracking-wider px-3.5 py-2 border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-hover)] text-[var(--color-primary-600)] transition-all shrink-0 self-start sm:self-center"
                                >
                                    Configurar Regra
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <BudgetProgress
                                    label="Gastos Essenciais (Needs)"
                                    spent={spent.needs}
                                    budget={(totalIncome * rules.needs) / 100}
                                    color="var(--color-primary-500)"
                                />
                                <BudgetProgress
                                    label="Desejos Pessoais (Wants)"
                                    spent={spent.wants}
                                    budget={(totalIncome * rules.wants) / 100}
                                    color="var(--color-warning-500)"
                                />
                                <BudgetProgress
                                    label="Metas e Reservas (Savings)"
                                    spent={spent.savings}
                                    budget={(totalIncome * rules.savings) / 100}
                                    color="var(--color-success-500)"
                                    savingMode={true}
                                    totalSaved={totalSaved}
                                />
                            </div>
                        </div>
                    )}

                    {/* Caixinhas (Metas de Reserva) */}
                    {data?.savings && data.savings.length > 0 && (
                        <div
                            className="rounded-2xl border p-6 flex flex-col gap-4 transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div className="flex items-center justify-between border-b border-dashed border-[var(--border-primary)] pb-4">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                        Projeções de Poupança
                                    </span>
                                    <h3 className="text-lg font-bold tracking-tight text-[var(--text-primary)] font-heading mt-0.5">
                                        Minhas Caixinhas (Meta de Reservas)
                                    </h3>
                                    <p className="text-xs text-[var(--text-tertiary)] mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                        <span>Total Reservado: <strong className="text-[var(--color-success-600)] [font-variant-numeric:tabular-nums] font-bold">{formatCurrency(totalSaved)}</strong></span>
                                        <span className="text-[var(--border-primary)]">|</span>
                                        <span>Guardado este mês: <strong className="text-[var(--text-primary)] [font-variant-numeric:tabular-nums] font-bold">{formatCurrency(spent.savings)}</strong></span>
                                    </p>
                                </div>
                                <Link
                                    to="/savings"
                                    className="text-xs font-bold uppercase tracking-wider px-3 py-2 border border-[var(--border-primary)] rounded-xl hover:bg-[var(--bg-hover)] text-[var(--color-primary-600)] transition-all flex items-center gap-1.5"
                                >
                                    Ver Detalhes <ArrowRight size={12} />
                                </Link>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {data.savings.map((sv) => {
                                    const percent = sv.target_amount > 0 ? Math.min((sv.current_amount / sv.target_amount) * 100, 100) : 0;
                                    let statusText = 'Em progresso';
                                    let trueColor = 'var(--color-warning-500)';
                                    if (percent >= 100) {
                                        statusText = 'Concluída';
                                        trueColor = 'var(--color-success-500)';
                                    } else if (percent >= 80) {
                                        statusText = 'Quase lá';
                                        trueColor = 'var(--color-primary-500)';
                                    }

                                    return (
                                        <div 
                                            key={sv.id} 
                                            className="rounded-xl border p-4 bg-[var(--bg-tertiary)]/20 hover-lift hover:shadow-md transition-all duration-300 border-[var(--border-primary)]"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-xs font-bold text-[var(--text-secondary)] tracking-tight">{sv.name}</span>
                                                <span 
                                                    className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full" 
                                                    style={{ backgroundColor: `${trueColor}15`, color: trueColor }}
                                                >
                                                    {statusText}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-lg font-bold tracking-tight [font-variant-numeric:tabular-nums] text-[var(--text-primary)]">
                                                    {formatCurrency(sv.current_amount)}
                                                </p>
                                                {sv.target_amount > 0 && (
                                                    <p className="text-[11px] font-semibold text-[var(--text-tertiary)] [font-variant-numeric:tabular-nums]">
                                                        de {formatCurrency(sv.target_amount)}
                                                    </p>
                                                )}
                                            </div>
                                            {sv.target_amount > 0 && (
                                                <>
                                                    <div className="h-1.5 w-full rounded-full bg-[var(--bg-hover)] overflow-hidden">
                                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: trueColor }} />
                                                    </div>
                                                    <p className="text-[10px] font-bold uppercase mt-1.5 text-right [font-variant-numeric:tabular-nums]" style={{ color: trueColor }}>
                                                        {percent.toFixed(0)}%
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Bloco de Gráficos e Distribuição */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full">
                        {/* Histórico Ledger (Ledger Timeline) */}
                        <div
                            className="w-full min-w-0 h-full min-h-[440px] rounded-2xl border p-6 transition-all duration-300 flex flex-col justify-between"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 border-b border-dashed border-[var(--border-primary)] pb-3">
                                <div>
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                        Histórico Contábil
                                    </span>
                                    <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)] font-heading mt-0.5">
                                        Evolução de Gastos
                                    </h3>
                                </div>
                                {/* Legenda Customizada */}
                                <div className="flex items-center gap-3.5 text-[11px] font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-[var(--chart-expected)] border border-[var(--border-primary)]/40" />
                                        <span className="text-[var(--text-secondary)]">Previsto</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="h-3 w-3 rounded bg-[var(--chart-paid)]" />
                                        <span className="text-[var(--text-secondary)]">Pago</span>
                                    </div>
                                </div>
                            </div>

                            {history.length > 0 ? (
                                <div className="w-full h-[260px] xl:h-[320px] flex-1">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={history} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="colorPaid" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--chart-paid)" stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor="var(--chart-paid)" stopOpacity={0.01}/>
                                                </linearGradient>
                                                <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="var(--chart-expected)" stopOpacity={0.15}/>
                                                    <stop offset="95%" stopColor="var(--chart-expected)" stopOpacity={0.01}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" vertical={false} opacity={0.15} />
                                            <XAxis 
                                                dataKey="label" 
                                                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
                                                tickLine={false} 
                                                axisLine={false} 
                                            />
                                            <YAxis 
                                                tick={{ fontSize: 10, fill: 'var(--text-tertiary)' }} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                width={45}
                                                tickFormatter={(v) => `R$${v}`}
                                            />
                                            <Tooltip 
                                                content={<CustomTooltip />} 
                                                cursor={{ stroke: 'var(--border-primary)', strokeWidth: 1, strokeDasharray: '3 3' }} 
                                            />
                                            {/* expected area suave */}
                                            <Area 
                                                type="monotoneX" 
                                                dataKey="total_expected" 
                                                name="Previsto" 
                                                stroke="var(--chart-expected)" 
                                                strokeWidth={1.5} 
                                                fillOpacity={1} 
                                                fill="url(#colorExpected)" 
                                                dot={false}
                                                activeDot={false}
                                                animationDuration={1000}
                                            />
                                            {/* paid area/linha principal */}
                                            <Area 
                                                type="monotoneX" 
                                                dataKey="total_paid" 
                                                name="Pago" 
                                                stroke="var(--chart-paid)" 
                                                strokeWidth={2.8} 
                                                fillOpacity={1} 
                                                fill="url(#colorPaid)" 
                                                dot={false}
                                                activeDot={{ r: 4, stroke: 'var(--bg-card)', strokeWidth: 2, fill: 'var(--chart-paid)' }}
                                                animationDuration={1100}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <EmptyState text="Sem dados de histórico disponíveis" />
                                </div>
                            )}
                        </div>

                        {/* Gastos por Categoria (Mapa de Envelopes) */}
                        <div
                            className="w-full min-w-0 h-full min-h-[440px] rounded-2xl border p-6 transition-all duration-300 flex flex-col"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div className="mb-4 border-b border-dashed border-[var(--border-primary)] pb-3">
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                                    Setorial de Custos
                                </span>
                                <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)] font-heading mt-0.5">
                                    Mapa de Envelopes (Categorias)
                                </h3>
                                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                                    Participação proporcional de cada categoria sobre os gastos gerais previstos.
                                </p>
                            </div>

                            {byCategory.length > 0 ? (
                                <div className="space-y-3.5 max-h-[300px] xl:max-h-[320px] overflow-y-auto pr-2 pb-2 pt-1 flex-1">
                                    {[...byCategory]
                                        .sort((a, b) => b.total - a.total)
                                        .map((cat, idx) => {
                                            const percentOfTotal = totalCategoriesSum > 0 ? (cat.total / totalCategoriesSum) * 100 : 0;
                                            const isLargest = idx === 0;
                                            const catColor = `var(--color-cat-${cat.category_color || 'gray'})`;

                                            return (
                                                <div 
                                                    key={idx} 
                                                    className={`group relative rounded-xl border p-3.5 transition-all duration-300 ${
                                                        isLargest 
                                                            ? 'bg-[var(--bg-tertiary)]/40 border-[var(--color-primary-300)] shadow-sm' 
                                                            : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-[var(--border-secondary)]'
                                                    }`}
                                                >
                                                    {isLargest && (
                                                        <div className="mb-2">
                                                            <span className="inline-block text-[8px] font-extrabold uppercase tracking-wider bg-[var(--color-primary-500)] text-white px-2.5 py-0.5 rounded-full shadow-sm">
                                                                Maior Gasto do Mês
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span className="h-2 w-2 rounded-full shrink-0 transition-transform duration-300 group-hover:scale-125" style={{ backgroundColor: catColor }} />
                                                            <span className={`text-xs truncate ${isLargest ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-secondary)]'}`}>
                                                                {cat.category_name}
                                                            </span>
                                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-[var(--bg-hover)] text-[var(--text-tertiary)] rounded shrink-0 [font-variant-numeric:tabular-nums]">
                                                                {cat.count} {cat.count === 1 ? 'lançamento' : 'lançamentos'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between sm:justify-end gap-1.5 text-xs shrink-0 [font-variant-numeric:tabular-nums]">
                                                            <span className="font-bold text-[var(--text-primary)]">{formatCurrency(cat.total)}</span>
                                                            <span className="text-[10px] text-[var(--text-tertiary)]">({percentOfTotal.toFixed(0)}%)</span>
                                                        </div>
                                                    </div>

                                                    {/* Proporção horizontal */}
                                                    <div className="h-1.5 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden">
                                                        <div 
                                                            className="h-full rounded-full transition-all duration-700" 
                                                            style={{ 
                                                                width: `${percentOfTotal}%`, 
                                                                backgroundColor: catColor,
                                                                opacity: 0.95
                                                            }} 
                                                        />
                                                    </div>

                                                    <div className="flex justify-between items-center mt-2 text-[10px] text-[var(--text-tertiary)] [font-variant-numeric:tabular-nums] font-medium border-t border-dashed border-[var(--border-primary)]/40 pt-2">
                                                        <span>Pago: <strong className="text-[var(--text-secondary)] font-semibold">{formatCurrency(cat.paid)}</strong></span>
                                                        <span>Pendente: <strong className="text-[var(--text-secondary)] font-semibold">{formatCurrency(cat.total - cat.paid)}</strong></span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <EmptyState text="Sem lançamentos categorizados neste mês" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Listas Inferiores - Estilo Agenda Financeira */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Próximas Contas */}
                        <ListCard
                            title="Agenda de Vencimentos"
                            icon={Clock}
                            iconColor="var(--color-warning-500)"
                            items={upcomingBills}
                            emptyText="Nenhum pagamento pendente no radar."
                            renderItem={(bill) => (
                                <div 
                                    key={bill.id} 
                                    className="group flex items-center gap-3.5 py-3 border-b border-dashed border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]/30 px-1 rounded transition-colors"
                                >
                                    {/* Mini ficha de data estilo calendário */}
                                    <div className="flex flex-col items-center justify-center h-10 w-11 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-center shrink-0">
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">Dia</span>
                                        <span className="text-[13px] font-bold text-[var(--text-primary)] [font-variant-numeric:tabular-nums] leading-none mt-0.5">
                                            {bill.due_date ? new Date(bill.due_date).getUTCDate() : ''}
                                        </span>
                                    </div>
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-500)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-[9px] text-[var(--text-tertiary)] truncate uppercase tracking-wider font-semibold">
                                            {bill.category?.name || 'Geral'}
                                        </p>
                                    </div>
                                    <div className="text-right [font-variant-numeric:tabular-nums] text-xs font-bold text-[var(--text-primary)] shrink-0 pl-2">
                                        {formatCurrency(bill.expected_amount)}
                                    </div>
                                </div>
                            )}
                        />

                        {/* Contas Atrasadas */}
                        <ListCard
                            title="Folha de Pendências"
                            icon={AlertTriangle}
                            iconColor="var(--color-danger-500)"
                            items={overdueBills}
                            emptyText="Excelente! Nenhuma pendência em atraso."
                            renderItem={(bill) => (
                                <div 
                                    key={bill.id} 
                                    className="group flex items-center gap-3.5 py-3 border-b border-dashed border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]/30 px-1 rounded transition-colors"
                                >
                                    {/* Data */}
                                    <div className="flex flex-col items-center justify-center h-10 w-11 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--color-danger-500)]/20 text-center shrink-0">
                                        <span className="text-[8px] font-extrabold uppercase tracking-wider text-[var(--color-danger-600)]">Dia</span>
                                        <span className="text-[13px] font-extrabold text-[var(--color-danger-600)] [font-variant-numeric:tabular-nums] leading-none mt-0.5">
                                            {bill.due_date ? new Date(bill.due_date).getUTCDate() : ''}
                                        </span>
                                    </div>
                                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger-500)] shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-[9px] text-[var(--text-tertiary)] truncate uppercase tracking-wider font-semibold">
                                            {bill.category?.name || 'Geral'}
                                        </p>
                                    </div>
                                    <div className="text-right [font-variant-numeric:tabular-nums] text-xs font-extrabold text-[var(--color-danger-600)] shrink-0 pl-2">
                                        {formatCurrency(bill.expected_amount)}
                                    </div>
                                </div>
                            )}
                        />

                        {/* Próximos Eventos */}
                        <ListCard
                            title="Diário de Eventos"
                            icon={CalendarDays}
                            iconColor="var(--color-primary-500)"
                            items={upcomingEvents}
                            emptyText="Sem compromissos agendados nos próximos dias."
                            renderItem={(event) => (
                                <div 
                                    key={event.id} 
                                    className="group flex items-center gap-3.5 py-3 border-b border-dashed border-[var(--border-primary)] last:border-b-0 hover:bg-[var(--bg-hover)]/30 px-1 rounded transition-colors"
                                >
                                    {/* Ficha de calendário curta */}
                                    <div className="flex flex-col items-center justify-center h-10 w-11 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-center shrink-0">
                                        <span className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-tertiary)]">
                                            {event.start_date ? new Date(event.start_date).toLocaleString('pt-BR', { month: 'short' }).slice(0, 3) : ''}
                                        </span>
                                        <span className="text-[13px] font-bold text-[var(--text-primary)] [font-variant-numeric:tabular-nums] leading-none mt-0.5">
                                            {event.start_date ? new Date(event.start_date).getUTCDate() : ''}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                                            {event.title}
                                        </p>
                                        <p className="text-[9px] text-[var(--text-tertiary)] truncate font-semibold">
                                            {event.start_date ? formatDateBR(event.start_date) : ''}
                                        </p>
                                    </div>
                                    <PriorityBadge priority={event.priority} />
                                </div>
                            )}
                        />
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

/* ---------- Sub-componentes customizados ---------- */

// Ficha 1: Renda Prevista (Com mini recibo pontilhado)
function IncomeCard({ summary, delay = 0 }) {
    return (
        <div
            className="rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-card)] transition-all duration-300 hover-lift shadow-sm animate-in flex flex-col justify-between"
            style={{
                animationDelay: `${delay * 0.08}s`,
                borderTop: '3px solid var(--color-success-500)',
                opacity: 0,
            }}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Entradas
                    </span>
                    <Wallet size={15} className="text-[var(--color-success-600)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Renda Prevista</span>
                <p className="text-2xl font-bold tracking-tight mt-1 [font-variant-numeric:tabular-nums] text-[var(--color-success-600)]">
                    {formatCurrency(summary.total_incomes)}
                </p>
            </div>

            {/* Recibo Microvisualização */}
            <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-primary)] space-y-1 text-[10px] text-[var(--text-secondary)] font-medium">
                <div className="flex justify-between [font-variant-numeric:tabular-nums]">
                    <span>Previsto</span>
                    <span>{formatCurrency(summary.total_incomes)}</span>
                </div>
                <div className="flex justify-between text-[var(--color-success-600)] font-semibold [font-variant-numeric:tabular-nums]">
                    <span>Recebido</span>
                    <span>{formatCurrency(summary.total_incomes_received)}</span>
                </div>
            </div>
        </div>
    );
}

// Ficha 2: Gastos Previstos (Com trilho/régua de pagamentos)
function ExpenseCard({ summary, delay = 0 }) {
    const totalExpected = summary.total_expected || 0;
    const totalPaid = summary.total_paid || 0;
    const paidPercent = totalExpected > 0 ? Math.min((totalPaid / totalExpected) * 100, 100) : 0;

    return (
        <div
            className="rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-card)] transition-all duration-300 hover-lift shadow-sm animate-in flex flex-col justify-between"
            style={{
                animationDelay: `${delay * 0.08}s`,
                borderTop: '3px solid var(--color-danger-500)',
                opacity: 0,
            }}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Saídas
                    </span>
                    <DollarSign size={15} className="text-[var(--color-danger-600)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Gastos Esperados</span>
                <p className="text-2xl font-bold tracking-tight mt-1 [font-variant-numeric:tabular-nums] text-[var(--color-danger-600)]">
                    {formatCurrency(totalExpected)}
                </p>
            </div>

            {/* Trilho de Pagamento Microvisualização */}
            <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-primary)] space-y-1.5">
                <div className="h-1.5 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                    <div 
                        className="h-full bg-[var(--color-danger-500)] rounded-full" 
                        style={{ width: `${paidPercent}%` }} 
                    />
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] [font-variant-numeric:tabular-nums] font-medium">
                    <span>Pago: {paidPercent.toFixed(0)}%</span>
                    <span>Total: {formatCurrency(totalPaid)}</span>
                </div>
            </div>
        </div>
    );
}

// Ficha 3: Balanço Projetado (Com medidor de margem bidirecional)
function BalanceCard({ balanceExpected, summary, delay = 0 }) {
    const totalIncomes = summary.total_incomes || 1;
    // Margem calculada de balanço esperado sobre receita total
    const marginPercent = Math.min((Math.abs(balanceExpected) / totalIncomes) * 50, 50);

    return (
        <div
            className="rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-card)] transition-all duration-300 hover-lift shadow-sm animate-in flex flex-col justify-between"
            style={{
                animationDelay: `${delay * 0.08}s`,
                borderTop: balanceExpected >= 0 ? '3px solid var(--color-primary-500)' : '3px solid var(--color-danger-500)',
                opacity: 0,
            }}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Balanço
                    </span>
                    <TrendingUp size={15} className={balanceExpected >= 0 ? 'text-[var(--color-primary-600)]' : 'text-[var(--color-danger-600)]'} />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Resultado Projetado</span>
                <p 
                    className="text-2xl font-bold tracking-tight mt-1 [font-variant-numeric:tabular-nums]"
                    style={{ color: balanceExpected >= 0 ? 'var(--color-primary-600)' : 'var(--color-danger-600)' }}
                >
                    {formatCurrency(balanceExpected)}
                </p>
            </div>

            {/* Medidor Horizontal de Margem */}
            <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-primary)] space-y-1.5">
                <div className="h-1.5 w-full bg-[var(--bg-hover)] rounded-full overflow-hidden flex relative border border-[var(--border-primary)]">
                    {/* Linha central divisória */}
                    <span className="absolute h-full w-[1.5px] bg-[var(--text-tertiary)] left-1/2" />
                    {balanceExpected >= 0 ? (
                        <>
                            <div className="w-1/2" />
                            <div 
                                className="h-full bg-[var(--color-primary-500)]" 
                                style={{ width: `${marginPercent}%` }} 
                            />
                        </>
                    ) : (
                        <>
                            <div className="w-1/2 flex justify-end">
                                <div 
                                    className="h-full bg-[var(--color-danger-500)]" 
                                    style={{ width: `${marginPercent}%` }} 
                                />
                            </div>
                            <div className="w-1/2" />
                        </>
                    )}
                </div>
                <div className="flex justify-between text-[9px] text-[var(--text-tertiary)] [font-variant-numeric:tabular-nums] font-medium">
                    <span>{balanceExpected >= 0 ? 'Superávit' : 'Déficit'}</span>
                    <span>Margem: {((Math.abs(balanceExpected) / totalIncomes) * 100).toFixed(0)}%</span>
                </div>
            </div>
        </div>
    );
}

// Ficha 4: Pagamentos Pendentes (Com indicador de calendário)
function PendingCard({ summary, delay = 0 }) {
    const totalPending = (summary.total_pending || 0) + (summary.total_overdue || 0);
    const billsCount = (summary.bills_pending || 0) + (summary.bills_overdue || 0);

    return (
        <div
            className="rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-card)] transition-all duration-300 hover-lift shadow-sm animate-in flex flex-col justify-between"
            style={{
                animationDelay: `${delay * 0.08}s`,
                borderTop: '3px solid var(--color-warning-500)',
                opacity: 0,
            }}
        >
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
                        Compromissos
                    </span>
                    <Calendar size={15} className="text-[var(--color-warning-600)]" />
                </div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Total Pendente</span>
                <p className="text-2xl font-bold tracking-tight mt-1 [font-variant-numeric:tabular-nums] text-[var(--color-warning-600)]">
                    {formatCurrency(totalPending)}
                </p>
            </div>

            {/* Marcadores de vencimento */}
            <div className="mt-4 pt-3 border-t border-dashed border-[var(--border-primary)] flex justify-between items-center text-[10px] text-[var(--text-secondary)] font-medium">
                <div className="flex items-center gap-1.5 [font-variant-numeric:tabular-nums]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-500)]" />
                    <span>Em aberto: {summary.bills_pending || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 [font-variant-numeric:tabular-nums]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-danger-500)]" />
                    <span className={summary.bills_overdue > 0 ? 'text-[var(--color-danger-600)] font-bold' : ''}>
                        Atrasado: {summary.bills_overdue || 0}
                    </span>
                </div>
            </div>
        </div>
    );
}

// Régua Contábil de Progresso de Orçamento Inteligente (Needs, Wants, Savings)
function BudgetProgress({ label, spent, budget, color, savingMode = false, totalSaved }) {
    const rawPercent = budget > 0 ? (spent / budget) * 100 : (spent > 0 ? 100 : 0);
    const isOver = spent > budget && !savingMode;
    const isSavingGoalMet = savingMode && spent >= budget && budget > 0;
    const leftover = Math.abs(budget - spent);

    // Escala máxima de 120% na régua. O limite (100%) está em 83.33% da régua
    const MAX_SCALE = 120;
    const percentOnScale = Math.min((rawPercent / MAX_SCALE) * 100, 100);
    const limitMarkPos = 83.33; // (100 / 120) * 100

    const normalFillWidth = Math.min(rawPercent, 100) / MAX_SCALE * 100;
    const overflowFillWidth = isOver ? Math.max(0, percentOnScale - limitMarkPos) : 0;

    return (
        <div className="relative group/budget rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-tertiary)]/20 hover:border-[var(--color-primary-300)] transition-all duration-300">
            {/* Header com dados do orçamento */}
            <div className="flex justify-between items-start mb-2.5">
                <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] block truncate">
                        {label}
                    </span>
                    <h4 className="text-base font-bold [font-variant-numeric:tabular-nums] tracking-tight mt-0.5 truncate" style={{ color: isOver ? 'var(--color-danger-600)' : 'var(--text-primary)' }}>
                        {formatCurrency(spent)}
                        <span className="text-[11px] font-normal text-[var(--text-tertiary)] font-sans ml-1">
                            de {formatCurrency(budget)}
                        </span>
                    </h4>
                </div>
                <div className="shrink-0 pl-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isOver ? 'bg-[var(--color-danger-50)] text-[var(--color-danger-600)]' :
                        isSavingGoalMet ? 'bg-[var(--color-success-50)] text-[var(--color-success-600)]' :
                        'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                        {rawPercent.toFixed(0)}%
                    </span>
                </div>
            </div>

            {/* Barra de Progresso Simples e Moderna */}
            <div className="relative h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden border border-[var(--border-primary)]">
                <div 
                    className="h-full rounded-full transition-all duration-1000 ease-out" 
                    style={{ 
                        width: `${Math.min(rawPercent, 100)}%`, 
                        backgroundColor: isOver ? 'var(--color-danger-500)' : color,
                    }} 
                />
            </div>

            {/* Footer informando saldo disponível/excedido */}
            <div className="flex justify-between items-center mt-2.5">
                <span className="text-[10px] font-medium text-[var(--text-tertiary)]">
                    {isOver ? (
                        <span className="text-[var(--color-danger-600)] font-bold">Limite Excedido</span>
                    ) : isSavingGoalMet ? (
                        <span className="text-[var(--color-success-600)] font-bold">Acúmulo concluído</span>
                    ) : (
                        <span>Zona sob controle</span>
                    )}
                </span>
                
                <span className="text-[10px] font-semibold text-[var(--text-secondary)] [font-variant-numeric:tabular-nums]">
                    {isOver ? (
                        `+ ${formatCurrency(leftover)}`
                    ) : (
                        `${formatCurrency(leftover)} livres`
                    )}
                </span>
            </div>

            {/* Hover tooltip com visual de ficha física */}
            <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 translate-y-full hidden group-hover/budget:flex flex-col items-center z-10 pointer-events-none">
                <div className="w-1.5 h-1.5 rotate-45 bg-[var(--bg-tertiary)] border-l border-t border-[var(--border-primary)]" />
                <div className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[10px] text-[var(--text-primary)] px-2.5 py-1 rounded-md shadow-md -mt-1 [font-variant-numeric:tabular-nums] font-medium whitespace-nowrap">
                    {isOver ? (
                        `Estouro: ${formatCurrency(leftover)}`
                    ) : savingMode ? (
                        `Poupar: ${formatCurrency(leftover)}`
                    ) : (
                        `Livre: ${formatCurrency(leftover)}`
                    )}
                </div>
            </div>
        </div>
    );
}

// Tooltip customizado do histórico de gastos (Estilo Ficha Contábil física)
function CustomTooltip({ active, payload }) {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-3.5 rounded-xl shadow-md text-[11px] min-w-[150px] space-y-2 [font-variant-numeric:tabular-nums]">
                <p className="font-bold border-b border-[var(--border-primary)] pb-1.5 text-[var(--text-primary)] tracking-wide font-heading">
                    {data.label}
                </p>
                <div className="flex justify-between gap-4 text-[var(--text-secondary)] font-medium">
                    <span>Previsto:</span>
                    <span>{formatCurrency(data.total_expected)}</span>
                </div>
                <div className="flex justify-between gap-4 text-[var(--color-success-600)] font-bold">
                    <span>Pago:</span>
                    <span>{formatCurrency(data.total_paid)}</span>
                </div>
                <div className="flex justify-between gap-4 text-[var(--text-tertiary)] text-[10px] pt-2 border-t border-dashed border-[var(--border-primary)] font-medium">
                    <span>Lançamentos:</span>
                    <span>{data.bills_count} ({data.paid_count} pg)</span>
                </div>
            </div>
        );
    }
    return null;
}

// Componente ListCard customizado estilo Agenda Financeira de Argolas
function ListCard({ title, icon: Icon, iconColor, items, emptyText, renderItem }) {
    return (
        <div
            className="rounded-2xl border p-5 transition-all duration-300 relative bg-[var(--bg-card)] border-[var(--border-primary)] shadow-sm"
        >
            {/* Visual de caderno espiral / argolas no topo esquerdo */}
            <div className="absolute top-3 left-4 flex gap-1 pointer-events-none opacity-40">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]" />
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]" />
            </div>

            <div className="mb-4 flex items-center gap-2 border-b border-dashed border-[var(--border-primary)] pb-3 pl-4">
                <div
                    className="flex items-center justify-center w-7 h-7 rounded-lg shrink-0"
                    style={{ backgroundColor: `${iconColor || 'var(--text-secondary)'}15` }}
                >
                    <Icon size={14} style={{ color: iconColor || 'var(--text-secondary)' }} strokeWidth={2.5} />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)] font-heading">
                    {title}
                </h3>
            </div>

            {items.length > 0 ? (
                <div className="space-y-1">
                    {items.map(renderItem)}
                </div>
            ) : (
                <EmptyState text={emptyText} />
            )}
        </div>
    );
}

function EmptyState({ text }) {
    return (
        <div className="flex h-20 items-center justify-center">
            <p className="text-xs text-[var(--text-tertiary)] text-center font-medium italic">{text}</p>
        </div>
    );
}

function PriorityBadge({ priority }) {
    const styles = {
        1: { bg: 'var(--color-danger-50)', color: 'var(--color-danger-600)', label: 'Alta' },
        2: { bg: 'var(--color-primary-550)', color: 'var(--color-primary-600)', label: 'Normal' },
        3: { bg: 'var(--color-success-50)', color: 'var(--color-success-600)', label: 'Baixa' },
    };
    const s = styles[priority] || styles[2];
    return (
        <span
            className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}

// Shimmer Skeleton do Dashboard (Creme/Areia suave)
function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Cards Skeleton */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="rounded-xl border border-[var(--border-primary)] p-5 bg-[var(--bg-card)] space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="h-3 w-16 rounded bg-[var(--bg-hover)] shimmer" />
                            <div className="h-6 w-6 rounded bg-[var(--bg-hover)] shimmer" />
                        </div>
                        <div className="h-5 w-28 rounded bg-[var(--bg-hover)] shimmer" />
                        <div className="h-3.5 w-20 rounded bg-[var(--bg-hover)] shimmer" />
                    </div>
                ))}
            </div>

            {/* Smart Budget Ruler Skeleton */}
            <div className="rounded-2xl border border-[var(--border-primary)] p-6 bg-[var(--bg-card)] space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-dashed border-[var(--border-primary)]">
                    <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-[var(--bg-hover)] shimmer" />
                        <div className="h-3 w-56 rounded bg-[var(--bg-hover)] shimmer" />
                    </div>
                    <div className="h-3.5 w-20 rounded bg-[var(--bg-hover)] shimmer" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="rounded-xl border border-[var(--border-primary)] p-4 bg-[var(--bg-tertiary)]/20 space-y-4">
                            <div className="flex justify-between">
                                <div className="h-3 w-20 rounded bg-[var(--bg-hover)] shimmer" />
                                <div className="h-3 w-8 rounded bg-[var(--bg-hover)] shimmer" />
                            </div>
                            <div className="h-5 w-full rounded bg-[var(--bg-hover)] shimmer" />
                            <div className="h-3 w-24 rounded bg-[var(--bg-hover)] shimmer" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Charts Rows Skeleton */}
            <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-primary)] p-6 bg-[var(--bg-card)] space-y-6">
                    <div className="h-4 w-32 rounded bg-[var(--bg-hover)] shimmer" />
                    <div className="h-44 w-full rounded bg-[var(--bg-hover)] shimmer" />
                </div>
                <div className="rounded-2xl border border-[var(--border-primary)] p-6 bg-[var(--bg-card)] space-y-6">
                    <div className="h-4 w-32 rounded bg-[var(--bg-hover)] shimmer" />
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-10 w-full rounded bg-[var(--bg-hover)] shimmer" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row Skeleton */}
            <div className="grid gap-6 lg:grid-cols-3">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="rounded-2xl border border-[var(--border-primary)] p-6 bg-[var(--bg-card)] space-y-4">
                        <div className="flex gap-2 items-center">
                            <div className="h-5 w-5 rounded bg-[var(--bg-hover)] shimmer" />
                            <div className="h-3.5 w-24 rounded bg-[var(--bg-hover)] shimmer" />
                        </div>
                        <div className="space-y-3 pt-2">
                            {[...Array(3)].map((_, j) => (
                                <div key={j} className="flex justify-between items-center border-b border-dashed border-[var(--border-primary)] pb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded bg-[var(--bg-hover)] shimmer" />
                                        <div className="space-y-1">
                                            <div className="h-3 w-16 rounded bg-[var(--bg-hover)] shimmer" />
                                            <div className="h-2 w-10 rounded bg-[var(--bg-hover)] shimmer" />
                                        </div>
                                    </div>
                                    <div className="h-3 w-12 rounded bg-[var(--bg-hover)] shimmer" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

