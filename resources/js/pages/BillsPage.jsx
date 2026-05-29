import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import useSubmitGuard, { useActionGuard } from '../hooks/useSubmitGuard';
import ConfirmDialog from '../components/ui/ConfirmDialog';
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

import { normalizeDate, formatDateBR } from '../utils/date';

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
    const { isSubmitting, guard } = useSubmitGuard();
    const { isActionInProgress, guardAction } = useActionGuard();
    const [deleteConfirm, setDeleteConfirm] = useState({ isOpen: false, bill: null, variant: 'danger', title: '', description: '', choices: [] });
    const [editConfirm, setEditConfirm] = useState({ isOpen: false, saveParams: null });

    const activePeriodRef = useRef({ year, month });

    useEffect(() => {
        activePeriodRef.current = { year, month };
    }, [year, month]);

    const fetchBills = useCallback(async () => {
        const reqYear = year;
        const reqMonth = month;
        setLoading(true);
        try {
            const [billsRes, catsRes, walRes] = await Promise.all([
                api.get('/monthly-bills', { params: { year: reqYear, month: reqMonth } }),
                api.get('/categories'),
                api.get('/wallets'),
            ]);
            if (activePeriodRef.current.year !== reqYear || activePeriodRef.current.month !== reqMonth) {
                return;
            }
            setBills(billsRes.data.data);
            setTotals(billsRes.data.totals);
            setCategories(catsRes.data.data);
            setWallets(walRes.data.data);
        } catch {
            // silently handle
        } finally {
            if (activePeriodRef.current.year === reqYear && activePeriodRef.current.month === reqMonth) {
                setLoading(false);
            }
        }
    }, [year, month]);

    useEffect(() => {
        fetchBills();
    }, [fetchBills]);

    async function handlePay(bill) {
        await guardAction(bill.id, async () => {
            try {
                await api.patch(`/monthly-bills/${bill.id}/pay`);
                fetchBills(); // Refetch para atualizar totais
            } catch (err) { console.error('Erro:', err); }
        });
    }

    async function handleUndoPay(bill) {
        await guardAction(bill.id, async () => {
            try {
                await api.patch(`/monthly-bills/${bill.id}/pending`);
                fetchBills();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    async function handleCancel(bill) {
        await guardAction(bill.id, async () => {
            try {
                await api.patch(`/monthly-bills/${bill.id}/cancel`);
                fetchBills();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openDeleteConfirm(bill) {
        if (bill.installment_group_id) {
            setDeleteConfirm({
                isOpen: true,
                bill,
                variant: 'choice',
                title: 'Excluir Conta Parcelada',
                description: 'Esta é uma conta parcelada. Como deseja proceder com a exclusão?',
                choices: [
                    {
                        label: 'Excluir apenas esta parcela',
                        description: 'Mantém as próximas parcelas e remove apenas este lançamento.',
                        variant: 'secondary',
                        onClick: () => executeDelete(bill, { deleteAll: false })
                    },
                    {
                        label: 'Excluir esta e as próximas',
                        description: 'Remove esta parcela e todas as parcelas futuras deste parcelamento.',
                        variant: 'danger',
                        onClick: () => executeDelete(bill, { deleteAll: true })
                    }
                ]
            });
        } else if (bill.recurring_bill_id) {
            setDeleteConfirm({
                isOpen: true,
                bill,
                variant: 'choice',
                title: 'Excluir Conta Recorrente',
                description: 'Esta é uma conta recorrente. Deseja cancelar também a assinatura mensal?',
                choices: [
                    {
                        label: 'Remover só este mês',
                        description: 'A recorrência continua gerando os próximos meses.',
                        variant: 'secondary',
                        onClick: () => executeDelete(bill, { deleteRecurring: false })
                    },
                    {
                        label: 'Cancelar recorrência também',
                        description: 'Remove este mês e impede novos lançamentos automáticos.',
                        variant: 'danger',
                        onClick: () => executeDelete(bill, { deleteRecurring: true })
                    }
                ]
            });
        } else {
            setDeleteConfirm({
                isOpen: true,
                bill,
                variant: 'danger',
                title: 'Excluir Conta',
                description: `Deseja mesmo remover a conta "${bill.name_snapshot}"? Esta ação não pode ser desfeita.`,
                choices: []
            });
        }
    }

    async function executeDelete(bill, { deleteAll = false, deleteRecurring = false }) {
        try {
            await api.delete(`/monthly-bills/${bill.id}`, {
                params: { 
                    delete_all_installments: deleteAll ? 1 : 0,
                    delete_recurring: deleteRecurring ? 1 : 0
                }
            });
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
        setDeleteConfirm({ isOpen: false, bill: null, variant: 'danger', title: '', description: '', choices: [] });
    }

    const handleConfirmSimpleDelete = () => {
        if (deleteConfirm.bill) {
            executeDelete(deleteConfirm.bill, {});
        }
    };

    async function handleSave({ payload, isRecurring, isInstallment, installmentMath }) {
        if (editingBill && editingBill.installment_group_id) {
            setEditConfirm({
                isOpen: true,
                saveParams: { payload, isRecurring, isInstallment, installmentMath }
            });
            return;
        }
        await executeSave({ payload, isRecurring, isInstallment, installmentMath, updateAll: false });
    }

    async function executeSave({ payload, isRecurring, isInstallment, installmentMath, updateAll = false }) {
        await guard(async () => {
            try {
                if (editingBill) {
                    let recurringId = payload.recurring_bill_id || editingBill.recurring_bill_id;

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

                    if (!isRecurring && editingBill.recurring_bill_id) {
                        recurringId = null;
                    }

                    let dueDate = payload.due_date;
                    if (isRecurring && payload.due_day) {
                        const dueDay = parseInt(payload.due_day) || 1;
                        dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
                    }

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
                    const dueDay = parseInt(payload.due_day) || 1;
                    const recurringRes = await api.post('/recurring-bills', {
                        name: payload.name_snapshot,
                        expected_amount: parseFloat(payload.expected_amount) || 0,
                        due_day: dueDay,
                        category_id: payload.category_id || null,
                    });

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
        });
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
        purple: 'var(--color-accent-500)', pink: 'var(--color-danger-500)',
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
            {/* Contas Header */}
            <div className="mb-8 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">
                            Contas
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1 font-medium">
                            Controle vencimentos, pagamentos e despesas do mês.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Seletor de período */}
                        <div className="flex items-center gap-1.5 bg-[var(--bg-secondary)] rounded-lg p-1 border border-[var(--border-primary)]">
                            <button onClick={prevMonth} className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Mês anterior">
                                <ChevronLeft size={14} />
                            </button>
                            <span className="min-w-[90px] text-center text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">
                                {MONTH_NAMES[month].slice(0, 3)} {year}
                            </span>
                            <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded transition-all hover:bg-[var(--bg-hover)] active:scale-95 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" title="Próximo mês">
                                <ChevronRight size={14} />
                            </button>
                        </div>
                        <button onClick={openCreate} className="btn-primary px-4 py-2 text-xs font-semibold tracking-wide active:scale-95 flex items-center gap-1.5">
                            <Plus size={14} /> Nova Despesa
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumos de Contas (Metric Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"></span>
                        Previsto
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(calculatedTotals.expected)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success-600 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500"></span>
                        Pago
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-success-600 tabular-nums">
                        {formatCurrency(calculatedTotals.paid)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-warning-600 dark:text-warning-300 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-warning-500"></span>
                        Pendente
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-warning-600 dark:text-warning-300 tabular-nums">
                        {formatCurrency(calculatedTotals.pending)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-danger-600 dark:text-danger-500 flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-danger-500"></span>
                        Atrasado
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-danger-600 dark:text-danger-500 tabular-nums">
                        {formatCurrency(calculatedTotals.overdue)}
                    </p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar despesa..."
                        className="w-full rounded-xl border bg-[var(--bg-card)] px-4 py-2.5 pl-11 text-xs text-[var(--text-primary)] outline-none border-[var(--border-primary)] transition-all focus:border-[var(--color-primary-500)]"
                    />
                </div>

                {/* Segmented Control de Filtro de Status */}
                <div className="inline-flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl items-center overflow-x-auto max-w-full">
                    {['all', 'pending', 'paid', 'overdue', 'canceled'].map((s) => {
                        const isSel = filterStatus === s;
                        return (
                            <button 
                                key={s} 
                                onClick={() => setFilterStatus(s)} 
                                className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all shrink-0 ${
                                    isSel 
                                        ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-primary)]/40' 
                                        : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                                }`}
                            >
                                {s === 'all' ? 'Todas' : STATUS_CONFIG[s]?.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Filtro de Categorias (Chips) */}
            {categories.length > 0 && (
                <div className="mb-6 flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
                    <button
                        onClick={() => setFilterCategory('all')}
                        className="shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all"
                        style={{
                            borderColor: filterCategory === 'all' ? 'var(--color-primary-500)' : 'var(--border-primary)',
                            backgroundColor: filterCategory === 'all' ? 'color-mix(in srgb, var(--color-primary-500) 10%, var(--bg-card))' : 'var(--bg-card)',
                            color: filterCategory === 'all' ? 'color-mix(in srgb, var(--color-primary-500) 90%, var(--text-primary))' : 'var(--text-secondary)',
                        }}
                    >
                        <Tag size={12} /> Todas
                    </button>
                    {categories.map((cat) => {
                        const isSelected = filterCategory === String(cat.id);
                        const baseColor = CATEGORY_COLORS[cat.color] || 'var(--color-accent-400)';
                        return (
                            <button
                                key={cat.id}
                                onClick={() => setFilterCategory(String(cat.id))}
                                className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium border transition-all`}
                                style={{
                                    borderColor: isSelected ? baseColor : 'var(--border-primary)',
                                    backgroundColor: isSelected ? `color-mix(in srgb, ${baseColor} 8%, var(--bg-card))` : 'var(--bg-card)',
                                    color: isSelected ? `color-mix(in srgb, ${baseColor} 90%, var(--text-primary))` : 'var(--text-secondary)',
                                }}
                            >
                                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: baseColor }}></span>
                                {cat.name}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-300)] border-t-[var(--color-primary-600)]" />
                </div>
            ) : filteredBills.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)]/50 shadow-xs">
                    <Receipt size={32} className="text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Nenhum compromisso</h3>
                    <p className="text-xs text-[var(--text-tertiary)] max-w-sm mb-4">
                        {bills.length === 0
                            ? 'Este mês não possui nenhuma conta de despesa lançada no sistema. Crie um registro para iniciar o controle.'
                            : 'Nenhum resultado corresponde aos critérios de pesquisa informados.'}
                    </p>
                    {bills.length === 0 && (
                        <button onClick={openCreate} className="btn-primary py-2 px-4 text-xs font-semibold active:scale-95">
                            Lançar Primeira Conta
                        </button>
                    )}
                </div>
            ) : (
                /* LedgerList */
                <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)] shadow-xs overflow-hidden relative">
                    {/* Header virtual do Ledger */}
                    <div className="hidden sm:flex items-center gap-4 bg-[var(--bg-secondary)]/50 px-6 py-3.5 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                        <div className="w-10 shrink-0 text-center">Status</div>
                        <div className="w-24 shrink-0 sm:pl-4">Vencimento</div>
                        <div className="flex-1">Descrição / Categoria</div>
                        <div className="w-36 shrink-0">Conta / Carteira</div>
                        <div className="w-40 shrink-0 text-right sm:pr-8">Valor</div>
                        <div className="w-32 shrink-0"></div>
                    </div>

                    <div className="divide-y divide-[var(--border-primary)]">
                        {filteredBills.map((bill) => (
                            <BillCard
                                key={bill.id}
                                bill={bill}
                                categoryColors={CATEGORY_COLORS}
                                wallets={wallets}
                                actionInProgress={isActionInProgress(bill.id)}
                                onPay={() => handlePay(bill)}
                                onUndoPay={() => handleUndoPay(bill)}
                                onCancel={() => handleCancel(bill)}
                                onEdit={() => openEdit(bill)}
                                onDelete={() => openDeleteConfirm(bill)}
                            />
                        ))}
                    </div>
                </div>
            )}

            <BillModal
                isOpen={showModal}
                onClose={closeModal}
                onSave={handleSave}
                bill={editingBill}
                categories={categories}
                wallets={wallets}
                submitting={isSubmitting}
                defaultYear={year}
                defaultMonth={month}
                onCategoryCreated={fetchBills}
                onWalletCreated={fetchBills}
            />
            <ConfirmDialog
                isOpen={deleteConfirm.isOpen}
                onClose={() => setDeleteConfirm({ isOpen: false, bill: null, variant: 'danger', title: '', description: '', choices: [] })}
                title={deleteConfirm.title}
                description={deleteConfirm.description}
                variant={deleteConfirm.variant}
                confirmLabel="Remover"
                onConfirm={handleConfirmSimpleDelete}
                choices={deleteConfirm.choices}
            />

            <ConfirmDialog
                isOpen={editConfirm.isOpen}
                onClose={() => setEditConfirm({ isOpen: false, saveParams: null })}
                title="Editar Conta Parcelada"
                description="Como deseja aplicar as alterações nesta conta parcelada?"
                variant="choice"
                choices={[
                    {
                        label: 'Alterar apenas esta parcela',
                        description: 'Aplica os novos valores e categoria apenas a este mês.',
                        variant: 'secondary',
                        onClick: () => {
                            executeSave({ ...editConfirm.saveParams, updateAll: false });
                            setEditConfirm({ isOpen: false, saveParams: null });
                        }
                    },
                    {
                        label: 'Aplicar também às próximas',
                        description: 'Aplica os novos valores e categoria a esta parcela e todas as futuras deste grupo.',
                        variant: 'primary',
                        onClick: () => {
                            executeSave({ ...editConfirm.saveParams, updateAll: true });
                            setEditConfirm({ isOpen: false, saveParams: null });
                        }
                    }
                ]}
            />
        </AppLayout>
    );
}

/* ========== Sub-components ========== */

function BillCard({ bill, categoryColors, wallets = [], actionInProgress = false, onPay, onUndoPay, onCancel, onEdit, onDelete }) {
    const isPaid = bill.status === 'paid';
    const isOverdue = bill.status === 'overdue';
    const isCanceled = bill.status === 'canceled';
    
    const catColor = bill.category ? (categoryColors[bill.category.color] || '#6b7280') : 'var(--text-tertiary)';
    const walletObj = bill.wallet_id ? wallets.find(w => w.id === bill.wallet_id) : null;

    return (
        <div className={`group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 transition-all hover:bg-[var(--bg-hover)]/30 relative bg-[var(--bg-card)] border-l-2 ${
            isPaid 
                ? 'border-l-[var(--color-success-500)]/60 opacity-80' 
                : isOverdue 
                    ? 'border-l-[var(--color-danger-500)] bg-[var(--color-danger-50)]/5 dark:bg-[var(--color-danger-950)]/5' 
                    : isCanceled 
                        ? 'border-l-[var(--text-tertiary)]/30 opacity-60' 
                        : 'border-l-[var(--color-warning-500)]/60'
        }`}>
            {/* Status Checkbox */}
            <div className="w-10 shrink-0 flex items-center justify-center z-10">
                {isPaid ? (
                    <button 
                        onClick={() => !actionInProgress && onUndoPay()} 
                        disabled={actionInProgress}
                        className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-success-500)] bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10 text-[var(--color-success-600)] transition-all hover:scale-95 disabled:opacity-50"
                        title="Estornar pagamento"
                    >
                        {actionInProgress ? (
                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        ) : (
                            <Check size={11} strokeWidth={3.5} />
                        )}
                    </button>
                ) : isCanceled ? (
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-primary)] bg-[var(--bg-secondary)] text-[var(--text-tertiary)] opacity-60">
                        <X size={10} strokeWidth={3.5} />
                    </div>
                ) : (
                    <button 
                        onClick={() => !actionInProgress && onPay()} 
                        disabled={actionInProgress}
                        className={`flex h-5 w-5 items-center justify-center rounded border transition-all hover:scale-95 disabled:opacity-50 ${
                            isOverdue 
                                ? 'border-[var(--color-danger-500)] bg-[var(--color-danger-50)] dark:bg-[var(--color-danger-950)]/40 text-[var(--color-danger-600)] hover:border-[var(--color-danger-500)]' 
                                : 'border-[var(--border-primary)] hover:border-[var(--color-primary-500)] hover:bg-[var(--bg-hover)]'
                        }`}
                        title="Confirmar pagamento"
                    >
                        {actionInProgress ? (
                            <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                        ) : (
                            <div className={`h-1.5 w-1.5 rounded-full opacity-35 group-hover:opacity-100 transition-opacity ${
                                isOverdue ? 'bg-[var(--color-danger-500)]' : 'bg-[var(--text-tertiary)]'
                            }`} />
                        )}
                    </button>
                )}
            </div>

            {/* Data de Vencimento */}
            <div className="w-24 shrink-0 text-xs text-[var(--text-secondary)] sm:pl-4 tabular-nums">
                {formatDateBR(bill.due_date)}
            </div>

            {/* Descrição e Envelopes */}
            <div className="min-w-0 flex-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Lado Esquerdo: Nome e Tags de Recorrência/Parcelamento */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <p className={`text-sm font-semibold tracking-tight text-[var(--text-primary)] truncate ${isPaid ? 'line-through opacity-75' : ''}`}>
                        {bill.name_snapshot}
                    </p>
                    {bill.recurring_bill_id && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-semibold px-2 py-0.5" title="Assinatura Mensal">
                            <Repeat size={10} className="opacity-70" /> Recorrente
                        </span>
                    )}
                    {bill.installment_group_id && (
                        <span 
                            className="inline-flex items-center gap-1 border text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: 'color-mix(in srgb, var(--color-primary-500) 8%, var(--bg-card))',
                                borderColor: 'color-mix(in srgb, var(--color-primary-500) 25%, var(--bg-card))',
                                color: 'color-mix(in srgb, var(--color-primary-500) 90%, var(--text-primary))',
                            }}
                            title="Despesa Parcelada"
                        >
                            Parcela {bill.installment_index}/{bill.installment_total}
                        </span>
                    )}
                </div>

                {/* Lado Direito: Categoria */}
                <div className="flex items-center shrink-0 sm:pr-4">
                    {/* Category styled as a clean chip */}
                    {bill.category && (
                        <span 
                            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border border-[var(--border-primary)] bg-[var(--bg-secondary)]"
                            style={{ 
                                color: `color-mix(in srgb, ${catColor} 85%, var(--text-primary))` 
                            }}
                        >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: catColor }}></span>
                            {bill.category.name}
                        </span>
                    )}
                </div>
            </div>

            {/* Conta/Carteira */}
            <div className="w-36 shrink-0 text-xs text-[var(--text-secondary)]">
                {walletObj ? (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                        <CreditCard size={12} className="opacity-60" />
                        {walletObj.name}
                    </span>
                ) : (
                    <span className="text-[var(--text-tertiary)] italic text-xs">Saldo Geral</span>
                )}
            </div>

            <div className="text-left sm:text-right shrink-0 w-40 sm:pr-8">
                <p className={`text-sm font-semibold tracking-tight tabular-nums ${isPaid ? 'text-success-600' : isOverdue ? 'text-danger-600 dark:text-danger-500' : 'text-[var(--text-primary)]'}`}>
                    {formatCurrency(bill.expected_amount)}
                </p>
                {bill.paid_amount != null && isPaid && bill.paid_amount !== bill.expected_amount && (
                    <p className="text-[10px] tracking-tight text-success-600 mt-0.5 tabular-nums">
                        Pago {formatCurrency(bill.paid_amount)}
                    </p>
                )}
            </div>

            {/* Ações permanentes de baixa opacidade para segurança/não-poluição */}
            <div className="flex items-center justify-start sm:justify-end gap-1 w-full sm:w-32 shrink-0 opacity-65 group-hover:opacity-100 transition-opacity duration-200 z-10">
                {!isPaid && !isCanceled && (
                    <button onClick={onPay} disabled={actionInProgress} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-success-600)] disabled:opacity-50" title="Marcar como Pago">
                        <Check size={12} strokeWidth={2.5} />
                    </button>
                )}
                {isPaid && (
                    <button onClick={onUndoPay} disabled={actionInProgress} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50" title="Desfazer Pagamento">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>
                )}
                {isCanceled && (
                    <button onClick={onUndoPay} disabled={actionInProgress} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50" title="Reativar Despesa (Pendente)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 7v6h6" />
                            <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
                        </svg>
                    </button>
                )}
                <button onClick={onEdit} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary-600)]" title="Editar">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                {(bill.status === 'pending' || bill.status === 'overdue') && (
                    <button onClick={onCancel} disabled={actionInProgress} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-warning-600)] disabled:opacity-50" title="Cancelar Despesa">
                        <X size={12} strokeWidth={2.5} />
                    </button>
                )}
                <button onClick={onDelete} disabled={actionInProgress} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-red-50 text-[var(--text-secondary)] hover:text-[var(--color-danger-500)] disabled:opacity-50" title="Deletar">
                    <Trash2 size={12} strokeWidth={2.5} />
                </button>
            </div>
        </div>
    );
}
