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
    ChevronLeft,
    ChevronRight,
    Search,
    Wallet,
    Trash2,
    CreditCard,
    Repeat,
} from 'lucide-react';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

import CurrencyInput from '../components/ui/CurrencyInput';

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'var(--color-warning-600)', bg: 'var(--color-warning-50)' },
    received: { label: 'Recebido', color: 'var(--color-success-600)', bg: 'var(--color-success-50)' },
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

import { normalizeDate, formatDateBR } from '../utils/date';

export default function IncomesPage() {
    const [incomes, setIncomes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(new Date().getFullYear());
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [filterStatus, setFilterStatus] = useState('all');
    const [search, setSearch] = useState('');
    const [wallets, setWallets] = useState([]);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState(null);
    const [form, setForm] = useState({
        name: '',
        amount: '',
        is_recurring: false,
        expected_date: '',
        status: 'pending',
        wallet_id: '',
    });
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, income: null });
    const { isSubmitting, guard } = useSubmitGuard();
    const { isActionInProgress, guardAction } = useActionGuard();

    const activePeriodRef = useRef({ year, month });

    useEffect(() => {
        activePeriodRef.current = { year, month };
    }, [year, month]);

    const fetchIncomes = useCallback(async () => {
        const reqYear = year;
        const reqMonth = month;
        setLoading(true);
        try {
            const [incRes, walRes] = await Promise.all([
                api.get('/incomes', { params: { year: reqYear, month: reqMonth } }),
                api.get('/wallets'),
            ]);
            if (activePeriodRef.current.year !== reqYear || activePeriodRef.current.month !== reqMonth) {
                return;
            }
            setIncomes(incRes.data.data);
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
        fetchIncomes();
    }, [fetchIncomes]);

    async function handleReceive(income) {
        await guardAction(income.id, async () => {
            try {
                await api.patch(`/incomes/${income.id}/receive`);
                fetchIncomes();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    async function handleUndoReceive(income) {
        await guardAction(income.id, async () => {
            try {
                await api.put(`/incomes/${income.id}`, { status: 'pending' });
                fetchIncomes();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openDeleteConfirm(income) {
        setDeleteDialog({ isOpen: true, income });
    }

    async function handleConfirmDelete() {
        const income = deleteDialog.income;
        if (!income) return;
        await guardAction(income.id, async () => {
            try {
                await api.delete(`/incomes/${income.id}`);
                fetchIncomes();
            } catch (err) { console.error('Erro:', err); }
        });
        setDeleteDialog({ isOpen: false, income: null });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await guard(async () => {
            try {
                if (editingIncome) {
                    await api.put(`/incomes/${editingIncome.id}`, {
                        ...form,
                        amount: parseFloat(form.amount) || 0,
                        wallet_id: form.wallet_id || null,
                    });
                } else {
                    await api.post('/incomes', {
                        ...form,
                        amount: parseFloat(form.amount) || 0,
                        wallet_id: form.wallet_id || null,
                    });
                }
                closeModal();
                fetchIncomes();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openCreate() {
        setEditingIncome(null);
        setForm({
            name: '',
            amount: '',
            is_recurring: false,
            expected_date: `${year}-${String(month).padStart(2, '0')}-05`,
            status: 'pending',
            wallet_id: '',
        });
        setShowModal(true);
    }

    function openEdit(income) {
        setEditingIncome(income);
        setForm({
            name: income.name,
            amount: String(income.amount),
            is_recurring: !!income.recurring_income_id,
            expected_date: normalizeDate(income.expected_date),
            status: income.status,
            wallet_id: income.wallet_id || '',
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingIncome(null);
    }

    function prevMonth() {
        if (month === 1) { setMonth(12); setYear(year - 1); }
        else { setMonth(month - 1); }
    }

    function nextMonth() {
        if (month === 12) { setMonth(1); setYear(year + 1); }
        else { setMonth(month + 1); }
    }

    const filteredIncomes = incomes
        .filter((i) => filterStatus === 'all' || i.status === filterStatus)
        .filter((i) => !search || i.name.toLowerCase().includes(search.toLowerCase()));

    const totalExpected = incomes.reduce((acc, i) => acc + parseFloat(i.amount), 0);
    const totalReceived = incomes.filter(i => i.status === 'received').reduce((acc, i) => acc + parseFloat(i.amount), 0);
    const totalPending = totalExpected - totalReceived;

    return (
        <AppLayout>
            {/* PageHeader */}
            <div className="mb-8 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">
                            Rendas e Entradas
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1 font-medium">
                            Acompanhe o que já entrou e o que ainda está previsto para o mês.
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
                            <Plus size={14} /> Nova Renda
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumos de Entradas (Metric Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)]"></span>
                        Previsto
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--text-primary)] tabular-nums">
                        {formatCurrency(totalExpected)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-success-600)] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success-500)]"></span>
                        Recebido
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-success-600)] tabular-nums">
                        {formatCurrency(totalReceived)}
                    </p>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-[var(--shadow-sm)]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning-600)] flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-warning-500)]"></span>
                        A Receber
                    </span>
                    <p className="mt-2 text-2xl font-bold tracking-tight text-[var(--color-warning-600)] tabular-nums">
                        {formatCurrency(totalPending)}
                    </p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar entrada..."
                        className="w-full rounded-xl border bg-[var(--bg-card)] px-4 py-2.5 pl-11 text-xs text-[var(--text-primary)] outline-none border-[var(--border-primary)] transition-all focus:border-[var(--color-primary-500)]"
                    />
                </div>
                
                {/* Segmented Control de Filtro */}
                <div className="inline-flex p-1 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-xl items-center">
                    <button 
                        onClick={() => setFilterStatus('all')} 
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            filterStatus === 'all' 
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-primary)]/40' 
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        Todas
                    </button>
                    <button 
                        onClick={() => setFilterStatus('pending')} 
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            filterStatus === 'pending' 
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-primary)]/40' 
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        Pendentes
                    </button>
                    <button 
                        onClick={() => setFilterStatus('received')} 
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                            filterStatus === 'received' 
                                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-xs border border-[var(--border-primary)]/40' 
                                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                        }`}
                    >
                        Recebidas
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-300)] border-t-[var(--color-primary-600)]" />
                </div>
            ) : filteredIncomes.length === 0 ? (
                /* Empty state com ação */
                <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)]/50 shadow-xs">
                    <Wallet size={32} className="text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Nenhum registro</h3>
                    <p className="text-xs text-[var(--text-tertiary)] max-w-sm mb-4">
                        {incomes.length === 0 
                            ? 'Este mês não possui nenhuma renda lançada no sistema. Crie um registro para iniciar o controle.' 
                             : 'Nenhum resultado corresponde aos critérios de pesquisa informados.'}
                    </p>
                    {incomes.length === 0 && (
                        <button onClick={openCreate} className="btn-primary py-2 px-4 text-xs font-semibold active:scale-95">
                            Lançar Primeira Renda
                        </button>
                    )}
                </div>
            ) : (
                /* Ledger Sheet Container */
                <div className="border border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)] shadow-xs overflow-hidden relative">
                    {/* Header virtual do Ledger */}
                    <div className="hidden sm:flex items-center gap-4 bg-[var(--bg-secondary)]/50 px-6 py-3.5 text-xs font-semibold text-[var(--text-tertiary)] border-b border-[var(--border-primary)]">
                        <div className="w-10 shrink-0 text-center">Status</div>
                        <div className="w-24 shrink-0 sm:pl-4">Vencimento</div>
                        <div className="flex-1">Origem</div>
                        <div className="w-32 shrink-0">Carteira</div>
                        <div className="w-36 text-right sm:pr-8">Valor</div>
                        <div className="w-16 shrink-0"></div>
                    </div>

                    <div className="divide-y divide-[var(--border-primary)]">
                        {filteredIncomes.map((income) => {
                            const isReceived = income.status === 'received';
                            return (
                                <div key={income.id} className={`group flex flex-col sm:flex-row sm:items-center gap-4 px-6 py-4 transition-all hover:bg-[var(--bg-hover)]/30 relative ${isReceived ? 'opacity-80' : ''}`}>
                                    {/* Status Toggle Checkbox */}
                                    <div className="w-10 shrink-0 flex items-center justify-center z-10">
                                        {isReceived ? (
                                            <button 
                                                onClick={() => !isActionInProgress(income.id) && handleUndoReceive(income)} 
                                                disabled={isActionInProgress(income.id)} 
                                                className="flex h-5 w-5 items-center justify-center rounded border border-[var(--color-success-500)] bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10 text-[var(--color-success-600)] transition-all hover:scale-95 disabled:opacity-50" 
                                                title="Estornar recebimento"
                                            >
                                                {isActionInProgress(income.id) ? (
                                                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                                                ) : (
                                                    <Check size={11} strokeWidth={3.5} />
                                                )}
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => !isActionInProgress(income.id) && handleReceive(income)} 
                                                disabled={isActionInProgress(income.id)} 
                                                className="flex h-5 w-5 items-center justify-center rounded border border-[var(--border-primary)] hover:border-[var(--color-primary-500)] hover:bg-[var(--bg-hover)] transition-all hover:scale-95 disabled:opacity-50" 
                                                title="Marcar como recebido"
                                            >
                                                {isActionInProgress(income.id) ? (
                                                    <div className="h-2.5 w-2.5 animate-spin rounded-full border-2 border-[var(--color-primary-600)]/30 border-t-[var(--color-primary-600)]" />
                                                ) : (
                                                    <div className="h-1.5 w-1.5 rounded-full bg-[var(--text-tertiary)] opacity-35 group-hover:opacity-100 transition-opacity" />
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {/* Data de Vencimento */}
                                    <div className="w-24 shrink-0 text-xs text-[var(--text-secondary)] sm:pl-4 tabular-nums">
                                        {formatDateBR(income.expected_date)}
                                    </div>

                                    {/* Descrição e Destino */}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className={`text-sm font-semibold tracking-tight text-[var(--text-primary)] ${isReceived ? 'line-through opacity-75' : ''}`}>
                                                {income.name}
                                            </p>
                                            
                                            {isReceived ? (
                                                <span className="inline-flex items-center gap-1 rounded bg-[var(--color-success-50)] dark:bg-[var(--color-success-500)]/10 border border-[var(--color-success-500)]/20 text-[var(--color-success-600)] text-[10px] font-semibold px-2 py-0.5">
                                                    Recebido
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)] text-[10px] font-semibold px-2 py-0.5">
                                                    Pendente
                                                </span>
                                            )}

                                            {income.recurring_income_id && (
                                                <span className="flex items-center justify-center h-4.5 w-4.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-tertiary)]" title="Lançamento Recorrente Mensal">
                                                    <Repeat size={9} />
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Carteira / Destino */}
                                    <div className="w-32 shrink-0 text-xs text-[var(--text-secondary)]">
                                        {income.wallet_id && wallets.find(w => w.id === income.wallet_id) ? (
                                            <span className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                <CreditCard size={12} className="opacity-60" />
                                                {wallets.find(w => w.id === income.wallet_id)?.name}
                                            </span>
                                        ) : (
                                            <span className="text-[var(--text-tertiary)] italic text-xs">Saldo Geral</span>
                                        )}
                                    </div>

                                    {/* Valor da entrada */}
                                    <div className="text-left sm:text-right shrink-0 w-36 sm:pr-8">
                                        <p className={`text-sm font-semibold tracking-tight tabular-nums ${isReceived ? 'text-[var(--color-success-600)]' : 'text-[var(--text-primary)]'}`}>
                                            {formatCurrency(income.amount)}
                                        </p>
                                    </div>

                                    {/* Ações flutuantes */}
                                    <div className="flex sm:absolute sm:right-6 sm:top-1/2 sm:-translate-y-1/2 items-center gap-1 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[var(--bg-card)] sm:pl-4">
                                        <button onClick={() => openEdit(income)} className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary-600)]" title="Editar">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                            </svg>
                                        </button>
                                        <button onClick={() => openDeleteConfirm(income)} disabled={isActionInProgress(income.id)} 
                                            className="flex items-center justify-center h-7 w-7 rounded-lg border border-[var(--border-primary)] transition-colors hover:bg-red-50 text-[var(--text-secondary)] hover:text-[var(--color-danger-500)] disabled:opacity-50" title="Deletar">
                                            {isActionInProgress(income.id) ? (
                                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-danger-500)]/30 border-t-[var(--color-danger-500)]" />
                                            ) : (
                                                <Trash2 size={14} />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Modal: Ficha de Lançamento (Index Card style) */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-xl bg-[var(--bg-card)]">
                        <div className="px-6 py-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">
                                    Entrada
                                </span>
                                <h3 className="text-lg font-bold tracking-tight mt-1 text-[var(--text-primary)] font-heading">
                                    {editingIncome ? 'Editar Entrada de Recurso' : 'Nova Entrada de Recurso'}
                                </h3>
                            </div>
                            <button onClick={closeModal} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Seção 1: Dados do Recebimento */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Descrição da Origem</label>
                                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Salário Mensal, Freelance UX..."
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Valor Nominal (R$)</label>
                                        <CurrencyInput value={form.amount} onChange={(v) => setForm({ ...form, amount: v })} required placeholder="0,00"
                                            className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold tabular-nums" />
                                    </div>
                                    <div>
                                        <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Data de Vencimento</label>
                                        <input type="date" value={form.expected_date} onChange={(e) => {
                                            const selectedDate = e.target.value;
                                            const today = new Date().toISOString().substring(0, 10);
                                            const isPastOrToday = selectedDate <= today;
                                            setForm({ ...form, expected_date: selectedDate, status: isPastOrToday ? 'received' : 'pending' });
                                        }} required
                                            className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" />
                                    </div>
                                </div>
                            </div>

                            {/* Seção 2: Destinação e Periodicidade */}
                            <div className="space-y-4 pt-1">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Destinar para Conta / Carteira</label>
                                    <select value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                        style={{ color: 'var(--text-primary)' }}>
                                        <option value="">Sem carteira vinculada (saldo geral)</option>
                                        {wallets.map((w) => (
                                            <option key={w.id} value={w.id} style={{ color: 'var(--text-primary)' }}>{w.name}</option>
                                        ))}
                                    </select>
                                </div>

                                {!editingIncome && (
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]/30">
                                        <label htmlFor="is_recurring" className="text-xs font-semibold text-[var(--text-secondary)] cursor-pointer">Lançamento mensal recorrente</label>
                                        <input type="checkbox" id="is_recurring" checked={form.is_recurring} onChange={(e) => setForm({ ...form, is_recurring: e.target.checked })} className="h-4 w-4 rounded text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]" />
                                    </div>
                                )}
                            </div>

                            {/* Seção 3: Estado de Conciliação */}
                            <div className="space-y-4 pt-1">
                                <div className="flex items-start gap-3 rounded-lg border border-[var(--border-primary)] p-3 bg-[var(--bg-secondary)]/30 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-pointer" 
                                     onClick={() => setForm({ ...form, status: form.status === 'received' ? 'pending' : 'received' })}>
                                    <input id="status-checkbox" type="checkbox" checked={form.status === 'received'} readOnly className="w-4 h-4 mt-0.5 rounded text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)] cursor-pointer" />
                                    <div>
                                        <label htmlFor="status-checkbox" className="text-xs font-bold cursor-pointer block" style={{ color: form.status === 'received' ? 'var(--color-success-600)' : 'var(--text-primary)' }}>
                                            {form.status === 'received' ? '✓ Recebido' : 'Dinheiro já recebido'}
                                        </label>
                                        <span className="text-[10px] text-[var(--text-tertiary)] block mt-0.5">
                                            Marque se o dinheiro já está disponível no saldo da conta.
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Botões de Ação */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-primary)]">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]">Cancelar</button>
                                <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2 text-xs font-semibold disabled:opacity-50">
                                    {isSubmitting ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        editingIncome ? 'Confirmar' : 'Salvar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, income: null })}
                title="Excluir Renda"
                description={deleteDialog.income ? `Deseja mesmo remover a renda "${deleteDialog.income.name}"? Esta ação não pode ser desfeita.` : ''}
                variant="danger"
                confirmLabel="Remover"
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
