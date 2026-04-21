import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../../components/layouts/AppLayout';
import api from '../../services/api';
import {
    Plus,
    Check,
    X,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Receipt,
    Search,
    Filter,
} from 'lucide-react';
import BillModal from '../../components/ui/modals/BillModal';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'var(--color-warning-600)', bg: 'var(--color-warning-50)' },
    paid: { label: 'Pago', color: 'var(--color-success-600)', bg: 'var(--color-success-50)' },
    overdue: { label: 'Atrasado', color: 'var(--color-danger-600)', bg: 'var(--color-danger-50)' },
    canceled: { label: 'Cancelado', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function MonthlyBillsPage() {
    const [bills, setBills] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    useEffect(() => {
        fetchBills();
    }, [year, month]);

    async function fetchBills() {
        setLoading(true);
        try {
            const res = await api.get('/monthly-bills', { params: { year, month } });
            setBills(res.data.data);
            setTotals(res.data.totals);
        } catch (err) {
            console.error('Erro:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handlePay(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/pay`);
            fetchBills();
        } catch (err) {
            console.error('Erro:', err);
        }
    }

    async function handleCancel(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/cancel`);
            fetchBills();
        } catch (err) {
            console.error('Erro:', err);
        }
    }

    async function handleDelete(bill) {
        if (!confirm('Remover esta conta?')) return;
        try {
            await api.delete(`/monthly-bills/${bill.id}`);
            fetchBills();
        } catch (err) {
            console.error('Erro:', err);
        }
    }

    async function handleSave({ payload }) {
        try {
            const data = {
                ...payload,
                year,
                month,
                expected_amount: parseFloat(payload.expected_amount) || 0,
                category_id: payload.category_id || null,
            };

            if (editingBill) {
                await api.put(`/monthly-bills/${editingBill.id}`, data);
            } else {
                await api.post('/monthly-bills', data);
            }

            setShowModal(false);
            setEditingBill(null);
            fetchBills();
        } catch (err) {
            console.error('Erro:', err);
        }
    }

    function openCreate() {
        setEditingBill(null);
        setShowModal(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
        setShowModal(true);
    }

    function prevMonth() {
        if (month === 1) { setMonth(12); setYear(year - 1); }
        else { setMonth(month - 1); }
    }

    function nextMonth() {
        if (month === 12) { setMonth(1); setYear(year + 1); }
        else { setMonth(month + 1); }
    }

    const filteredBills = bills
        .filter((b) => filterStatus === 'all' || b.status === filterStatus)
        .filter((b) => !search || b.name_snapshot.toLowerCase().includes(search.toLowerCase()));

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Contas do Mes
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        Gerencie suas contas de {MONTH_NAMES[month]} {year}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    {/* Month nav */}
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="min-w-[130px] text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {MONTH_NAMES[month]} {year}
                        </span>
                        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button
                        onClick={openCreate}
                        className="btn-primary px-4 py-2.5 active:scale-95"
                    >
                        <Plus size={18} />
                        Nova Conta
                    </button>
                </div>
            </div>

            {/* Summary bar */}
            <div
                className="mb-4 flex flex-wrap gap-4 rounded-2xl border p-4"
                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}
            >
                <MiniStat label="Previsto" value={formatCurrency(totals.expected)} />
                <MiniStat label="Pago" value={formatCurrency(totals.paid)} color="var(--color-success-600)" />
                <MiniStat label="Pendente" value={formatCurrency(totals.pending)} color="var(--color-warning-600)" />
                <MiniStat label="Atrasado" value={formatCurrency(totals.overdue)} color="var(--color-danger-600)" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar conta..."
                        className="focus-ring w-full rounded-lg border py-2.5 pl-10 pr-4 text-sm outline-none"
                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'paid', 'overdue', 'canceled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className="rounded-lg px-3 py-2 text-xs font-medium transition-colors"
                            style={{
                                backgroundColor: filterStatus === s ? 'var(--bg-active)' : 'var(--bg-hover)',
                                color: filterStatus === s ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                            }}
                        >
                            {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Bills List */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : filteredBills.length === 0 ? (
                <div
                    className="flex h-40 flex-col items-center justify-center rounded-xl border"
                    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                >
                    <Receipt size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma conta encontrada</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredBills.map((bill) => (
                        <BillCard
                            key={bill.id}
                            bill={bill}
                            onPay={() => handlePay(bill)}
                            onCancel={() => handleCancel(bill)}
                            onEdit={() => openEdit(bill)}
                            onDelete={() => handleDelete(bill)}
                        />
                    ))}
                </div>
            )}

            {/* Modal */}
            <BillModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                bill={editingBill}
                lockedType="monthly"
                categories={[]}
                wallets={[]}
            />
        </AppLayout>
    );
}

/* ---------- Sub-components ---------- */

function BillCard({ bill, onPay, onCancel, onEdit, onDelete }) {
    const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;

    return (
        <div
            className="flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-0.5"
            style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-primary)',
                boxShadow: 'var(--shadow-card)',
            }}
        >
            {/* Checkbox / Status */}
            {bill.status === 'pending' ? (
                <button
                    onClick={onPay}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors hover:border-primary-500 hover:bg-primary-50"
                    style={{ borderColor: 'var(--border-secondary)' }}
                    title="Marcar como paga"
                >
                    <Check size={14} style={{ color: 'var(--text-tertiary)' }} />
                </button>
            ) : (
                <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: status.bg, color: status.color }}
                >
                    {bill.status === 'paid' && <Check size={14} />}
                    {bill.status === 'overdue' && <AlertTriangle size={14} />}
                    {bill.status === 'canceled' && <X size={14} />}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <p
                    className={`text-sm font-medium ${bill.status === 'paid' ? 'line-through' : ''}`}
                    style={{ color: bill.status === 'canceled' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
                >
                    {bill.name_snapshot}
                </p>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <span>Vence {new Date(bill.due_date).toLocaleDateString('pt-BR')}</span>
                    {bill.category && (
                        <>
                            <span>·</span>
                            <span>{bill.category.name}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(bill.expected_amount)}
                </p>
                {bill.paid_amount !== null && bill.status === 'paid' && (
                    <p className="text-xs" style={{ color: 'var(--color-success-600)' }}>
                        Pago {formatCurrency(bill.paid_amount)}
                    </p>
                )}
            </div>

            {/* Status badge */}
            <span
                className="hidden rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block"
                style={{ backgroundColor: status.bg, color: status.color }}
            >
                {status.label}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-1">
                <button onClick={onEdit} className="rounded-lg p-1.5 text-xs transition-colors" style={{ color: 'var(--text-tertiary)' }} title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                <button onClick={onDelete} className="rounded-lg p-1.5 text-xs transition-colors" style={{ color: 'var(--color-danger-500)' }} title="Remover">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

function MiniStat({ label, value, color }) {
    return (
        <div className="flex-1 min-w-[120px]">
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            <p className="text-lg font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}

}
