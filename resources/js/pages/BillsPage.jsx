import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import {
    Plus,
    Check,
    X,
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Receipt,
    Search,
    Repeat,
    Tag,
    Calendar,
    Trash2,
    CreditCard,
    Filter,
} from 'lucide-react';
import BillModal from '../components/ui/modals/BillModal';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

import CurrencyInput from '../components/ui/CurrencyInput';

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'var(--color-warning-600)', bg: 'var(--color-warning-50)' },
    paid: { label: 'Pago', color: 'var(--color-success-600)', bg: 'var(--color-success-50)' },
    overdue: { label: 'Atrasado', color: 'var(--color-danger-600)', bg: 'var(--color-danger-50)' },
    canceled: { label: 'Cancelado', color: 'var(--text-tertiary)', bg: 'var(--bg-tertiary)' },
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

// Helper: extrai 'YYYY-MM-DD' de qualquer formato de data
function normalizeDate(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).substring(0, 10);
}

// Helper: formata para exibicao 'DD/MM/AAAA'
function formatDateBR(dateStr) {
    const d = normalizeDate(dateStr);
    if (!d || d.length < 10) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

export default function BillsPage() {
    const [bills, setBills] = useState([]);
    const [categories, setCategories] = useState([]);
    const [totals, setTotals] = useState({});
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [wallets, setWallets] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const [billsRes, catsRes, walRes] = await Promise.all([
                api.get('/monthly-bills', { params: { year, month } }),
                api.get('/categories'),
                api.get('/wallets'),
            ]);
            setBills(billsRes.data.data);
            setTotals(billsRes.data.totals);
            setCategories(catsRes.data.data);
            setWallets(walRes.data.data);
        } catch {
            // silently handle
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    async function handlePay(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/pay`);
            fetchBills(); // Refetch para atualizar totais
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleUndoPay(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/pending`);
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleCancel(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/cancel`);
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(bill) {
        let deleteAll = false;
        let deleteRecurring = false;

        if (bill.installment_group_id) {
            const result = window.confirm('Esta é uma conta parcelada.\n\nClique em OK para excluir esta e TODAS AS PRÓXIMAS parcelas.\nClique em Cancelar para excluir APENAS ESTA parcela (O valor das outras será mantido).');
            if (result) {
                deleteAll = true;
            } else {
                const confirmJustOne = window.confirm('Tem certeza que deseja excluir APENAS ESTA parcela?');
                if (!confirmJustOne) return;
            }
        } else if (bill.recurring_bill_id) {
            deleteRecurring = window.confirm('Esta é uma conta frequente (recorrente).\n\nDeseja cancelar também a "Assinatura" para que esta conta NÃO SEJA MAIS GERADA nos próximos meses?\n\n(OK = Cancelar assinatura e deletar mês atual | Cancelar = Deletar apenas mês atual)');
        } else {
            if (!window.confirm('Excluir esta conta?')) return;
        }

        try {
            await api.delete(`/monthly-bills/${bill.id}`, {
                params: { 
                    delete_all_installments: deleteAll ? 1 : 0,
                    delete_recurring: deleteRecurring ? 1 : 0
                }
            });
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleSave({ payload, isRecurring, isInstallment, installmentMath }) {
        try {
            if (editingBill) {
                let recurringId = payload.recurring_bill_id || editingBill.recurring_bill_id;

                // Se marcou para ser recorrente, mas a conta original NÃO era
                if (isRecurring && !editingBill.recurring_bill_id) {
                    const dueDay = parseInt(payload.due_day) || 1;
                    const recurringRes = await api.post('/recurring-bills', {
                        name: payload.name_snapshot,
                        expected_amount: parseFloat(payload.expected_amount) || 0,
                        due_day: dueDay,
                        category_id: payload.category_id || null,
                    });
                    recurringId = recurringRes.data.data.id;
                }

                // Se desmarcou recorrente de uma conta que ERA recorrente
                if (!isRecurring && editingBill.recurring_bill_id) {
                    recurringId = null;
                }

                let dueDate = payload.due_date;
                if (isRecurring && payload.due_day) {
                    const dueDay = parseInt(payload.due_day) || 1;
                    dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
                }

                let updateAll = false;
                if (editingBill.installment_group_id) {
                    updateAll = window.confirm('Deseja aplicar a Conta/Categoria escrita também para as PRÓXIMAS parcelas deste parcelamento?\n(Clique em OK para aplicar para as próximas, ou Cancelar para alterar apenas esta).');
                }

                // Editar conta existente
                await api.put(`/monthly-bills/${editingBill.id}`, {
                    ...payload,
                    due_date: dueDate,
                    expected_amount: parseFloat(payload.expected_amount) || 0,
                    category_id: payload.category_id || null,
                    wallet_id: payload.wallet_id || null,
                    recurring_bill_id: recurringId,
                    update_all_installments: updateAll ? 1 : 0
                });
            } else if (isRecurring) {
                // Criar recorrente: salva em recurring_bills E cria a primeira monthly_bill
                const dueDay = parseInt(payload.due_day) || 1;
                const recurringRes = await api.post('/recurring-bills', {
                    name: payload.name_snapshot,
                    expected_amount: parseFloat(payload.expected_amount) || 0,
                    due_day: dueDay,
                    category_id: payload.category_id || null,
                });

                // Criar a monthly_bill deste mes vinculada a recorrente
                const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
                await api.post('/monthly-bills', {
                    name_snapshot: payload.name_snapshot,
                    expected_amount: parseFloat(payload.expected_amount) || 0,
                    due_date: dueDate,
                    year,
                    month,
                    category_id: payload.category_id || null,
                    recurring_bill_id: recurringRes.data.data.id,
                    notes: payload.notes || null,
                    wallet_id: payload.wallet_id || null,
                });
            } else {
                // Criar conta avulsa ou parcelada
                let finalAmount = parseFloat(payload.expected_amount) || 0;

                if (isInstallment && installmentMath === 'total_value') {
                    const count = parseInt(payload.installments_count) || 2;
                    finalAmount = finalAmount / count;
                }

                await api.post('/monthly-bills', {
                    ...payload,
                    year,
                    month,
                    expected_amount: finalAmount,
                    category_id: payload.category_id || null,
                    wallet_id: payload.wallet_id || null,
                    is_installment: isInstallment,
                    installments_count: isInstallment ? parseInt(payload.installments_count) || 2 : undefined
                });
            }

            closeModal();
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    function openCreate() {
        setEditingBill(null);
        setShowModal(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingBill(null);
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
        .filter((b) => filterCategory === 'all' || String(b.category_id) === filterCategory)
        .filter((b) => !search || b.name_snapshot.toLowerCase().includes(search.toLowerCase()));

    const CATEGORY_COLORS = {
        gray: 'var(--color-accent-400)', red: 'var(--color-danger-500)', orange: 'var(--color-warning-600)', yellow: 'var(--color-warning-500)',
        green: 'var(--color-success-500)', teal: 'var(--color-primary-400)', blue: 'var(--color-primary-500)', indigo: 'var(--color-primary-600)',
        purple: 'var(--color-accent-500)', pink: 'var(--color-danger-400)',
        rose: '#e11d48', amber: '#d97706', emerald: '#059669', cyan: '#0891b2', sky: '#0284c7', violet: '#7c3aed',
    };

    const displayedBillsForTotals = bills.filter((b) => filterCategory === 'all' || String(b.category_id) === filterCategory);
    const calculatedTotals = {
        expected: displayedBillsForTotals.reduce((acc, b) => acc + parseFloat(b.expected_amount || 0), 0),
        paid: displayedBillsForTotals.filter(b => b.status === 'paid').reduce((acc, b) => acc + parseFloat(b.paid_amount || b.expected_amount || 0), 0),
        pending: displayedBillsForTotals.filter(b => b.status === 'pending').reduce((acc, b) => acc + parseFloat(b.expected_amount || 0), 0),
        overdue: displayedBillsForTotals.filter(b => b.status === 'overdue').reduce((acc, b) => acc + parseFloat(b.expected_amount || 0), 0),
    };

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Contas
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>
                        {MONTH_NAMES[month]} {year}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-[var(--bg-card)] rounded-xl p-1 shadow-sm ring-1 ring-[var(--border-primary)]">
                        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="min-w-[130px] text-center text-sm font-semibold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                            {MONTH_NAMES[month]} {year}
                        </span>
                        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button onClick={openCreate} className="btn-primary px-5 py-2.5 active:scale-95">
                        <Plus size={18} /> Nova Conta
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniCard label="Previsto" value={formatCurrency(calculatedTotals.expected)} />
                <MiniCard label="Pago" value={formatCurrency(calculatedTotals.paid)} color="var(--color-success-600)" />
                <MiniCard label="Pendente" value={formatCurrency(calculatedTotals.pending)} color="var(--color-warning-600)" />
                <MiniCard label="Atrasado" value={formatCurrency(calculatedTotals.overdue)} color="var(--color-danger-600)" />
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar conta..."
                        className="w-full rounded-xl border bg-[var(--bg-input)] px-4 py-3 pl-11 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--color-primary-500)] focus:ring-4 focus:ring-[var(--color-primary-500)]/10"
                        style={{ borderColor: 'var(--border-primary)' }}
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
                    {['all', 'pending', 'paid', 'overdue', 'canceled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all active:scale-95"
                            style={{
                                backgroundColor: filterStatus === s ? 'var(--bg-active)' : 'var(--bg-card)',
                                color: filterStatus === s ? 'var(--text-primary)' : 'var(--text-secondary)',
                                boxShadow: filterStatus === s ? 'var(--shadow-sm)' : 'none',
                                border: `1px solid ${filterStatus === s ? 'var(--border-secondary)' : 'var(--border-primary)'}`
                            }}
                        >
                            {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Category filter */}
            {categories.length > 0 && (
                <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
                    <button
                        onClick={() => setFilterCategory('all')}
                        className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                        style={{
                            borderColor: filterCategory === 'all' ? 'var(--color-primary-500)' : 'var(--border-primary)',
                            backgroundColor: filterCategory === 'all' ? 'var(--bg-active)' : 'transparent',
                            color: filterCategory === 'all' ? 'var(--color-primary-600)' : 'var(--text-tertiary)',
                        }}
                    >
                        <Tag size={12} /> Todas
                    </button>
                    {categories.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setFilterCategory(String(cat.id))}
                            className="shrink-0 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors"
                            style={{
                                borderColor: filterCategory === String(cat.id) ? (CATEGORY_COLORS[cat.color] || 'var(--color-accent-400)') : 'var(--border-primary)',
                                backgroundColor: filterCategory === String(cat.id) ? `color-mix(in srgb, ${CATEGORY_COLORS[cat.color] || 'var(--color-accent-400)'} 15%, transparent)` : 'transparent',
                                color: filterCategory === String(cat.id) ? (CATEGORY_COLORS[cat.color] || 'var(--color-accent-400)') : 'var(--text-tertiary)',
                            }}
                        >
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.color] || 'var(--color-accent-400)' }} />
                            {cat.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Bills List */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : filteredBills.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border bg-[var(--bg-card)] shadow-[var(--shadow-sm)]" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-tertiary)]/50 mb-3">
                        <Receipt size={24} className="text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {bills.length === 0 ? 'Nenhuma conta neste mês' : 'Nenhuma conta encontrada'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredBills.map((bill) => (
                        <BillCard
                            key={bill.id}
                            bill={bill}
                            categoryColors={CATEGORY_COLORS}
                            wallets={wallets}
                            onPay={() => handlePay(bill)}
                            onUndoPay={() => handleUndoPay(bill)}
                            onCancel={() => handleCancel(bill)}
                            onEdit={() => openEdit(bill)}
                            onDelete={() => handleDelete(bill)}
                        />
                    ))}
                </div>
            )}

            <BillModal
                isOpen={showModal}
                onClose={closeModal}
                onSave={handleSave}
                bill={editingBill}
                categories={categories}
                wallets={wallets}
            />
        </AppLayout >
    );
}

/* ========== Sub-components ========== */

function BillCard({ bill, categoryColors, wallets = [], onPay, onUndoPay, onCancel, onEdit, onDelete }) {
    const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;
    const catColor = bill.category ? (categoryColors[bill.category.color] || '#6b7280') : null;
    const walletObj = bill.wallet_id ? wallets.find(w => w.id === bill.wallet_id) : null;

    return (
        <div
            className="group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-[var(--bg-card)]"
            style={{ borderColor: 'var(--border-primary)' }}
        >
            {/* Checkbox / Status Icon */}
            {bill.status === 'pending' ? (
                <button onClick={onPay}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110 hover:border-primary-500 hover:bg-primary-50"
                    style={{ borderColor: 'var(--border-secondary)' }} title="Marcar como paga">
                    <Check size={14} className="opacity-0 transition-all duration-300 group-hover:opacity-100 scale-50 group-hover:scale-100" style={{ color: 'var(--color-primary-600)' }} />
                </button>
            ) : (
                <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 ${bill.status === 'paid' ? 'cursor-pointer hover:opacity-80 hover:scale-105' : ''}`}
                    style={{ backgroundColor: status.bg, color: status.color }}
                    onClick={bill.status === 'paid' ? onUndoPay : undefined}
                    title={bill.status === 'paid' ? "Desfazer pagamento" : ""}
                >
                    {bill.status === 'paid' && <Check size={14} />}
                    {bill.status === 'overdue' && <AlertTriangle size={14} />}
                    {bill.status === 'canceled' && <X size={14} />}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={`text-[15px] font-semibold tracking-tight truncate transition-colors duration-300 ${bill.status === 'paid' ? 'line-through opacity-60' : ''}`}
                        style={{ color: bill.status === 'canceled' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                        {bill.name_snapshot}
                    </p>
                    {bill.recurring_bill_id && (
                        <div className="flex items-center justify-center h-5 w-5 rounded-full bg-[var(--color-primary-50)] text-[var(--color-primary-500)]" title="Recorrente">
                            <Repeat size={10} strokeWidth={3} />
                        </div>
                    )}
                    {bill.installment_group_id && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
                            {bill.installment_index}/{bill.installment_total}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2.5 mt-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                    <div className="flex items-center gap-1">
                        <Calendar size={12} className="opacity-70" />
                        <span>{formatDateBR(bill.due_date)}</span>
                    </div>
                    {bill.category && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)]"></span>
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ backgroundColor: `${catColor}15`, color: catColor }}>
                                {bill.category.name}
                            </span>
                        </>
                    )}
                    {walletObj && (
                        <>
                            <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)]"></span>
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                <CreditCard size={10} />
                                {walletObj.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
                <p className="text-[15px] font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(bill.expected_amount)}
                </p>
                {bill.paid_amount != null && bill.status === 'paid' && bill.paid_amount !== bill.expected_amount && (
                    <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-success-600)' }}>
                        Pago {formatCurrency(bill.paid_amount)}
                    </p>
                )}
            </div>

            {/* Status */}
            <span className="hidden shrink-0 rounded-full px-3 py-1 text-xs font-semibold tracking-wide sm:inline-block border"
                style={{ backgroundColor: status.bg, color: status.color, borderColor: `${status.color}30` }}>
                {status.label}
            </span>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {bill.status === 'paid' && (
                    <button onClick={onUndoPay} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Desfazer">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>
                )}
                <button onClick={onEdit} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary-600)]" title="Editar">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                {bill.status === 'pending' && (
                    <button onClick={onCancel} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]" title="Cancelar">
                        <X size={15} strokeWidth={2.5} />
                    </button>
                )}
                <button onClick={onDelete} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-red-50 text-[var(--text-secondary)] hover:text-[var(--color-danger-500)]" title="Remover">
                    <Trash2 size={15} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}

function MiniCard({ label, value, color }) {
    return (
        <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
            <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: color || 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{value}</p>
        </div>
    );
}
