import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
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
    'var(--color-primary-500)',
    'var(--color-primary-400)',
    'var(--color-success-500)',
    'var(--color-warning-500)',
    'var(--color-danger-500)',
    'var(--color-primary-600)',
    'var(--color-success-600)',
    'var(--color-warning-600)',
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

        // Refetch quando o usuario volta pra aba (ex: voltou do Bills depois de pagar conta)
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
        } catch {
            // silently fail
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

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Dashboard
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        Ola, {user?.name?.split(' ')[0]}! Aqui esta o resumo do seu mes.
                    </p>
                </div>

                {/* Month navigator */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={prevMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    >
                        <ChevronLeft size={18} />
                    </button>
                    <span
                        className="min-w-[140px] text-center text-sm font-semibold"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {MONTH_NAMES[month]} {year}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
                        style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <SummaryCard
                            icon={DollarSign}
                            label="Total Previsto"
                            value={formatCurrency(summary.total_expected)}
                            color="var(--color-primary-600)"
                            bgColor="var(--color-primary-50)"
                        />
                        <SummaryCard
                            icon={CheckCircle2}
                            label="Total Pago"
                            value={formatCurrency(summary.total_paid)}
                            subtitle={`${summary.bills_paid || 0} de ${summary.bills_count || 0} contas`}
                            color="var(--color-success-600)"
                            bgColor="var(--color-success-50)"
                        />
                        <SummaryCard
                            icon={Clock}
                            label="Pendente"
                            value={formatCurrency(summary.total_pending)}
                            subtitle={`${summary.bills_pending || 0} contas`}
                            color="var(--color-warning-600)"
                            bgColor="var(--color-warning-50)"
                        />
                        <SummaryCard
                            icon={AlertTriangle}
                            label="Atrasado"
                            value={formatCurrency(summary.total_overdue)}
                            subtitle={`${summary.bills_overdue || 0} contas`}
                            color="var(--color-danger-600)"
                            bgColor="var(--color-danger-50)"
                        />
                    </div>

                    {/* Charts Row */}
                    <div className="mb-6 grid gap-6 lg:grid-cols-2">
                        {/* Bar Chart - Historico */}
                        <div
                            className="rounded-xl border p-6"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                Historico de Gastos
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
                                                borderRadius: '8px',
                                                fontSize: '13px',
                                            }}
                                        />
                                        <Bar dataKey="total_paid" name="Pago" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="total_expected" name="Previsto" fill="var(--color-primary-200)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <EmptyState text="Sem dados para exibir" />
                            )}
                        </div>

                        {/* Pie Chart - Por Categoria */}
                        <div
                            className="rounded-xl border p-6"
                            style={{
                                backgroundColor: 'var(--bg-card)',
                                borderColor: 'var(--border-primary)',
                                boxShadow: 'var(--shadow-card)',
                            }}
                        >
                            <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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
                                    <div className="flex-1 space-y-2">
                                        {byCategory.slice(0, 5).map((cat, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-sm">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }}
                                                />
                                                <span className="flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>
                                                    {cat.category_name}
                                                </span>
                                                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                                    {formatCurrency(cat.total)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <EmptyState text="Sem categorias neste mes" />
                            )}
                        </div>
                    </div>

                    {/* Bottom Row */}
                    <div className="grid gap-6 lg:grid-cols-3">
                        {/* Proximas contas */}
                        <ListCard
                            title="Proximas Contas"
                            icon={Clock}
                            items={upcomingBills}
                            emptyText="Nenhuma conta pendente"
                            renderItem={(bill) => (
                                <div key={bill.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Vence {formatDateBR(bill.due_date)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(bill.expected_amount)}
                                    </span>
                                </div>
                            )}
                        />

                        {/* Contas atrasadas */}
                        <ListCard
                            title="Contas Atrasadas"
                            icon={AlertTriangle}
                            iconColor="var(--color-danger-500)"
                            items={overdueBills}
                            emptyText="Nenhuma conta atrasada"
                            renderItem={(bill) => (
                                <div key={bill.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--color-danger-600)' }}>
                                            {bill.name_snapshot}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                            Venceu {formatDateBR(bill.due_date)}
                                        </p>
                                    </div>
                                    <span className="text-sm font-semibold" style={{ color: 'var(--color-danger-600)' }}>
                                        {formatCurrency(bill.expected_amount)}
                                    </span>
                                </div>
                            )}
                        />

                        {/* Proximos eventos */}
                        <ListCard
                            title="Proximos Eventos"
                            icon={CalendarDays}
                            iconColor="var(--color-primary-500)"
                            items={upcomingEvents}
                            emptyText="Nenhum evento proximo"
                            renderItem={(event) => (
                                <div key={event.id} className="flex items-center justify-between py-2.5">
                                    <div>
                                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                            {event.title}
                                        </p>
                                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
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

function SummaryCard({ icon: Icon, label, value, subtitle, color, bgColor }) {
    return (
        <div
            className="rounded-xl border p-5"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
            }}
        >
            <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {label}
                </span>
                <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg"
                    style={{ backgroundColor: bgColor, color }}
                >
                    <Icon size={18} />
                </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {value}
            </p>
            {subtitle && (
                <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    {subtitle}
                </p>
            )}
        </div>
    );
}

function ListCard({ title, icon: Icon, iconColor, items, emptyText, renderItem }) {
    return (
        <div
            className="rounded-xl border p-5"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
            }}
        >
            <div className="mb-3 flex items-center gap-2">
                <Icon size={18} style={{ color: iconColor || 'var(--text-secondary)' }} />
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
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

function PriorityBadge({ priority }) {
    const styles = {
        1: { bg: 'var(--color-danger-50)', color: 'var(--color-danger-600)', label: 'Alta' },
        2: { bg: 'var(--color-primary-50)', color: 'var(--color-primary-600)', label: 'Normal' },
        3: { bg: 'var(--color-success-50)', color: 'var(--color-success-600)', label: 'Baixa' },
    };
    const s = styles[priority] || styles[2];
    return (
        <span
            className="rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: s.bg, color: s.color }}
        >
            {s.label}
        </span>
    );
}
