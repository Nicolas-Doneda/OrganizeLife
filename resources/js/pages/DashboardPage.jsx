import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Link } from 'react-router-dom';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    CheckCircle2,
    AlertTriangle,
    CalendarDays,
    DollarSign,
    ArrowRight,
    ChevronLeft,
    ChevronRight,
    Wallet,
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts';

const CHART_COLORS = [
    '#0bc4af', // Teal primary
    '#f59e0b', // Amber
    '#3b82f6', // Blue
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#14b8a6', // Teal light
    '#f97316', // Orange
];

const MONTH_NAMES = [
    '', 'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value || 0);
}

function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const d = String(dateStr).substring(0, 10);
    if (d.length < 10) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

export default function DashboardPage() {
    const { user } = useAuth();
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);

    useEffect(() => {
        fetchData();

        function handleVisibility() {
            if (document.visibilityState === 'visible') fetchData();
        }
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, [year, month]);

    async function fetchData() {
        setLoading(true);
        try {
            const [summaryRes, historyRes] = await Promise.all([
                api.get('/dashboard/summary', { params: { year, month } }),
                api.get('/dashboard/history', { params: { months: 6 } }),
            ]);
            setData(summaryRes.data);
            setHistory(
                historyRes.data.data.map((h) => ({
                    ...h,
                    label: `${MONTH_NAMES[h.month]}/${String(h.year).slice(2)}`,
                }))
            );
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
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

    const summary = data?.financial_summary || {};
    const byCategory = data?.by_category || [];
    const upcomingBills = data?.upcoming_bills || [];
    const overdueBills = data?.overdue_bills || [];
    const upcomingEvents = data?.upcoming_events || [];

    const totalIncome = summary.total_incomes || 0;
    const rules = summary.budget_rules || { needs: 50, wants: 30, savings: 20 };
    const spent = summary.budget_spent || { needs: 0, wants: 0, savings: 0 };
    const balanceExpected = totalIncome - (summary.total_expected || 0);

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Dashboard
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Olá, {user?.name?.split(' ')[0]}! Aqui está o resumo do seu mês.
                    </p>
                </div>

                {/* Month navigator */}
                <div className="flex items-center gap-1 rounded-xl p-1 ring-1" style={{ backgroundColor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)', ringColor: 'var(--border-primary)' }}>
                    <button
                        onClick={prevMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span
                        className="min-w-[140px] text-center text-sm font-semibold tracking-tight"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95"
                        style={{ color: 'var(--text-secondary)' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-t-transparent" style={{ borderColor: 'var(--border-secondary)', borderTopColor: 'var(--color-primary-600)' }} />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard
                            icon={Wallet}
                            label="Renda Prevista"
                            value={formatCurrency(summary.total_incomes)}
                            subtitle={`Recebido: ${formatCurrency(summary.total_incomes_received)}`}
                            color="var(--color-success-600)"
                            bgColor="var(--color-success-50)"
                            delay={0}
                        />
                        <SummaryCard
                            icon={DollarSign}
                            label="Gastos Previstos"
                            value={formatCurrency(summary.total_expected)}
                            subtitle={`Pago: ${formatCurrency(summary.total_paid)}`}
                            color="var(--color-danger-600)"
                            bgColor="var(--color-danger-50)"
                            delay={1}
                        />
                        <SummaryCard
                            icon={TrendingUp}
                            label="Balanço Projetado"
                            value={formatCurrency(balanceExpected)}
                            subtitle={balanceExpected >= 0 ? 'Mês no verde' : 'Mês no vermelho'}
                            color={balanceExpected >= 0 ? "var(--color-primary-600)" : "var(--color-danger-600)"}
                            bgColor={balanceExpected >= 0 ? "var(--color-primary-50)" : "var(--color-danger-50)"}
                            delay={2}
                        />
                        <SummaryCard
                            icon={AlertTriangle}
                            label="Pagamentos Pendentes"
                            value={formatCurrency((summary.total_pending || 0) + (summary.total_overdue || 0))}
                            subtitle={`${(summary.bills_pending || 0) + (summary.bills_overdue || 0)} contas`}
                            color="var(--color-warning-600)"
                            bgColor="var(--color-warning-50)"
                            delay={3}
                        />
                    </div>

                    {/* Regra de Orçamento Inteligente */}
                    {totalIncome > 0 && (
                        <div
                            className="mb-6 rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-[16px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                        Orçamento Inteligente ({rules.needs}/{rules.wants}/{rules.savings})
                                    </h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                                        Acompanhe o limite dos seus gastos com base na sua renda e regra escolhida.
                                    </p>
                                </div>
                                <Link
                                    to="/profile"
                                    className="text-sm font-semibold transition-colors"
                                    style={{ color: 'var(--color-primary-600)' }}
                                >
                                    Configurar Regra
                                </Link>
                            </div>

                            <div className="grid gap-6 md:grid-cols-3">
                                <BudgetProgress
                                    label="Gastos Essenciais"
                                    spent={spent.needs}
                                    budget={(totalIncome * rules.needs) / 100}
                                    color="var(--color-primary-500)"
                                />
                                <BudgetProgress
                                    label="Desejos Pessoais"
                                    spent={spent.wants}
                                    budget={(totalIncome * rules.wants) / 100}
                                    color="var(--color-warning-500)"
                                />
                                <BudgetProgress
                                    label="Metas / Poupança"
                                    spent={spent.savings}
                                    budget={(totalIncome * rules.savings) / 100}
                                    color="var(--color-success-500)"
                                    savingMode={true}
                                />
                            </div>
                        </div>
                    )}

                    {/* Charts Row */}
                    <div className="mb-6 grid gap-6 lg:grid-cols-2">
                        {/* Bar Chart */}
                        <div
                            className="rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <h3 className="mb-6 text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                Histórico de Gastos
                            </h3>
                            {history.length > 0 ? (
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={history}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                                        <YAxis tick={{ fontSize: 12, fill: 'var(--text-tertiary)' }} />
                                        <Tooltip
                                            formatter={(value) => formatCurrency(value)}
                                            contentStyle={{
                                                backgroundColor: 'var(--bg-card)',
                                                borderColor: 'var(--border-primary)',
                                                borderRadius: '12px',
                                                fontSize: '13px',
                                                boxShadow: 'var(--shadow-md)',
                                            }}
                                        />
                                        <Bar dataKey="total_paid" name="Pago" fill="var(--color-primary-500)" radius={[6, 6, 0, 0]} />
                                        <Bar dataKey="total_expected" name="Previsto" fill="var(--color-primary-200)" radius={[6, 6, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState text="Sem dados para exibir" />
                            )}
                        </div>

                        {/* Pie Chart */}
                        <div
                            className="rounded-2xl border p-6 transition-all duration-300"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <h3 className="mb-6 text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                                Gastos por Categoria
                            </h3>
                            {byCategory.length > 0 ? (
                                <div className="flex items-center gap-4">
                                    <ResponsiveContainer width="50%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={byCategory}
                                                dataKey="total"
                                                nameKey="category_name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={2}
                                            >
                                                {byCategory.map((_, idx) => (
                                                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => formatCurrency(value)} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="flex-1 space-y-2.5">
                                        {byCategory.slice(0, 5).map((cat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <div
                                                    className="h-3 w-3 rounded-full shrink-0"
                                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                />
                                                <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                                    {cat.category_name}
                                                </span>
                                                <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                                                    {formatCurrency(cat.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState text="Sem categorias neste mês" />
                            )}
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        <ListCard
                            title="Próximas Contas"
                            icon={Clock}
                            items={upcomingBills}
                            emptyText="Nenhuma conta pendente"
                            renderItem={(bill) => (
                                <div key={bill.id} className="group flex items-center justify-between py-3 transition-colors hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-lg cursor-default">
                                    <div>
                                        <p className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-[11px] font-medium mt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                            Vence {formatDateBR(bill.due_date)}
                                        </p>
                                    </div>
                                    <span className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(bill.expected_amount)}
                                    </span>
                                </div>
                            )}
                        />

                        <ListCard
                            title="Contas Atrasadas"
                            icon={AlertTriangle}
                            iconColor="var(--color-danger-500)"
                            items={overdueBills}
                            emptyText="Nenhuma conta atrasada"
                            renderItem={(bill) => (
                                <div key={bill.id} className="group flex items-center justify-between py-3 transition-colors hover:bg-red-50/50 dark:hover:bg-red-900/10 -mx-2 px-2 rounded-lg cursor-default">
                                    <div>
                                        <p className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--color-danger-600)' }}>
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-[11px] font-medium mt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                            Venceu {formatDateBR(bill.due_date)}
                                        </p>
                                    </div>
                                    <span className="text-[14px] font-bold tracking-tight" style={{ color: 'var(--color-danger-600)' }}>
                                        {formatCurrency(bill.expected_amount)}
                                    </span>
                                </div>
                            )}
                        />

                        <ListCard
                            title="Próximos Eventos"
                            icon={CalendarDays}
                            iconColor="var(--color-primary-500)"
                            items={upcomingEvents}
                            emptyText="Nenhum evento próximo"
                            renderItem={(event) => (
                                <div key={event.id} className="group flex items-center justify-between py-3 transition-colors hover:bg-[var(--bg-hover)] -mx-2 px-2 rounded-lg cursor-default">
                                    <div>
                                        <p className="text-[14px] font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                                            {event.title}
                                        </p>
                                        <p className="text-[11px] font-medium mt-0.5 uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                                            {formatDateBR(event.start_date)}
                                        </p>
                                    </div>
                                    <PriorityBadge priority={event.priority} />
                                </div>
                            )}
                        />
                    </div>
                </>
            )}
        </AppLayout>
    );
}

/* ---------- Sub-components ---------- */

function SummaryCard({ icon: Icon, label, value, subtitle, color, bgColor, delay = 0 }) {
    return (
        <div
            className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 animate-in"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
                animationDelay: `${delay * 0.08}s`,
                opacity: 0,
            }}
        >
            <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>
                    {label}
                </span>
                <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: bgColor, color }}
                >
                    <Icon size={20} />
                </div>
            </div>
            <p className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {value}
            </p>
            {subtitle && (
                <p className="mt-2 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function ListCard({ title, icon: Icon, iconColor, items, emptyText, renderItem }) {
    return (
        <div
            className="rounded-2xl border p-6 transition-all duration-300"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
            }}
        >
            <div className="mb-4 flex items-center gap-2.5">
                <div
                    className="flex items-center justify-center w-8 h-8 rounded-lg"
                    style={{ backgroundColor: `${iconColor || 'var(--text-secondary)'}20` }}
                >
                    <Icon size={16} style={{ color: iconColor || 'var(--text-secondary)' }} strokeWidth={2.5} />
                </div>
                <h3 className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {title}
                </h3>
            </div>
            {items.length > 0 ? (
                <div className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
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
        <div className="flex h-24 items-center justify-center">
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{text}</p>
        </div>
    );
}

function BudgetProgress({ label, spent, budget, color, savingMode = false }) {
    const percent = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const isOver = spent > budget && !savingMode;
    const leftover = budget - spent;

    return (
        <div>
            <div className="flex justify-between items-end mb-2">
                <div>
                    <p className="text-[13px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-secondary)' }}>{label}</p>
                    <p className="text-[20px] font-bold mt-1 tracking-tight" style={{ color: isOver ? 'var(--color-danger-600)' : 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        {formatCurrency(spent)} <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>/ {formatCurrency(budget)}</span>
                    </p>
                </div>
            </div>

            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                        width: `${percent}%`,
                        backgroundColor: isOver ? 'var(--color-danger-500)' : color
                    }}
                />
            </div>

            <p className="text-xs font-semibold mt-2" style={{ color: isOver ? 'var(--color-danger-600)' : 'var(--text-tertiary)' }}>
                {isOver ? (
                    `Excedeu ${formatCurrency(spent - budget)}`
                ) : savingMode ? (
                    `Falta aplicar ${formatCurrency(leftover)}`
                ) : (
                    `Ainda pode gastar ${formatCurrency(leftover)}`
                )}
            </p>
        </div>
    );
}

function PriorityBadge({ priority }) {
    const styles = {
        1: { bg: 'var(--color-danger-50)', color: 'var(--color-danger-600)', label: 'Alta' },
        2: { bg: 'var(--color-primary-50)', color: 'var(--color-primary-600)', label: 'Normal' },
        3: { bg: 'var(--color-success-50)', color: 'var(--color-success-600)', label: 'Baixa' },
    };
    const s = styles[priority] || styles[2];
    return (
        <span
            className="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}
