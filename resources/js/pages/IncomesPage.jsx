import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
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
} from 'lucide-react';

const MONTH_NAMES = [
    '', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONFIG = {
    pending: { label: 'Pendente', color: 'var(--color-warning-600)', bg: 'var(--color-warning-50)' },
    received: { label: 'Recebido', color: 'var(--color-success-600)', bg: 'var(--color-success-50)' },
};

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function normalizeDate(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).substring(0, 10);
}

function formatDateBR(dateStr) {
    const d = normalizeDate(dateStr);
    if (!d || d.length < 10) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}

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
        type: 'fixed',
        expected_date: '',
        status: 'pending',
        wallet_id: '',
    });

    const fetchIncomes = useCallback(async () => {
        setLoading(true);
        try {
            const [incRes, walRes] = await Promise.all([
                api.get('/incomes', { params: { year, month } }),
                api.get('/wallets'),
            ]);
            setIncomes(incRes.data.data);
            setWallets(walRes.data.data);
        } catch {
            // silently handle
        } finally {
            setLoading(false);
        }
    }, [year, month]);

    useEffect(() => {
        fetchIncomes();
    }, [fetchIncomes]);

    async function handleReceive(income) {
        try {
            await api.patch(`/incomes/${income.id}/receive`);
            fetchIncomes();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleUndoReceive(income) {
        try {
            await api.put(`/incomes/${income.id}`, { status: 'pending' });
            fetchIncomes();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(income) {
        if (!confirm('Remover esta renda?')) return;
        try {
            await api.delete(`/incomes/${income.id}`);
            fetchIncomes();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
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
    }

    function openCreate() {
        setEditingIncome(null);
        setForm({
            name: '',
            amount: '',
            type: 'fixed',
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
            type: income.type,
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
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Rendas e Entradas
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
                        <Plus size={18} /> Adicionar Renda
                    </button>
                </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>Renda Total do Mês</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalExpected)}</p>
                </div>
                <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>Já Recebido</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--color-success-600)' }}>{formatCurrency(totalReceived)}</p>
                </div>
                <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all duration-300 hover:-translate-y-1" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>A Receber</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--color-warning-600)' }}>{formatCurrency(totalPending)}</p>
                </div>
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar entrada..."
                        className="w-full rounded-xl border bg-[var(--bg-input)] px-4 py-3 pl-11 text-sm text-[var(--text-primary)] outline-none transition-all focus:border-[var(--color-primary-500)] focus:ring-4 focus:ring-[var(--color-primary-500)]/10"
                        style={{ borderColor: 'var(--border-primary)' }}
                    />
                </div>
                <div className="flex gap-2 min-w-max">
                    <button onClick={() => setFilterStatus('all')} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style={{ backgroundColor: filterStatus === 'all' ? 'var(--bg-active)' : 'var(--bg-card)', color: filterStatus === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)', border: `1px solid ${filterStatus === 'all' ? 'var(--border-secondary)' : 'var(--border-primary)'}` }}>
                        Todas
                    </button>
                    <button onClick={() => setFilterStatus('pending')} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style={{ backgroundColor: filterStatus === 'pending' ? 'var(--color-warning-50)' : 'var(--bg-card)', color: filterStatus === 'pending' ? 'var(--color-warning-600)' : 'var(--text-secondary)', border: `1px solid ${filterStatus === 'pending' ? 'var(--color-warning-200)' : 'var(--border-primary)'}` }}>
                        Pendentes
                    </button>
                    <button onClick={() => setFilterStatus('received')} className="rounded-xl px-4 py-2.5 text-sm font-medium transition-all"
                        style={{ backgroundColor: filterStatus === 'received' ? 'var(--color-success-50)' : 'var(--bg-card)', color: filterStatus === 'received' ? 'var(--color-success-600)' : 'var(--text-secondary)', border: `1px solid ${filterStatus === 'received' ? 'var(--color-success-200)' : 'var(--border-primary)'}` }}>
                        Recebidas
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : filteredIncomes.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border bg-[var(--bg-card)] shadow-[var(--shadow-sm)]" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--bg-tertiary)]/50 mb-3">
                        <Wallet size={24} className="text-[var(--text-tertiary)]" />
                    </div>
                    <p className="text-sm font-medium text-[var(--text-secondary)]">
                        {incomes.length === 0 ? 'Nenhuma renda cadastrada neste mês' : 'Nenhuma renda encontrada'}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredIncomes.map((income) => {
                        const status = STATUS_CONFIG[income.status] || STATUS_CONFIG.pending;
                        return (
                            <div key={income.id} className="group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-primary)' }}>
                                {income.status === 'pending' ? (
                                    <button onClick={() => handleReceive(income)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 hover:scale-110 hover:border-success-500 hover:bg-success-50" style={{ borderColor: 'var(--border-secondary)' }} title="Marcar como recebido">
                                        <Check size={14} className="opacity-0 transition-opacity group-hover:opacity-100" style={{ color: 'var(--color-success-600)' }} />
                                    </button>
                                ) : (
                                    <div className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full transition-all duration-300 hover:opacity-80 hover:scale-105" style={{ backgroundColor: status.bg, color: status.color }} onClick={() => handleUndoReceive(income)} title="Desfazer recebimento">
                                        <Check size={14} />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="text-[15px] font-semibold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                            {income.name}
                                        </p>
                                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                            {income.type === 'fixed' ? 'Fixo' : 'Variável'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                        <span>Cai na conta dia {formatDateBR(income.expected_date)}</span>
                                        {income.wallet_id && wallets.find(w => w.id === income.wallet_id) && (
                                            <span className="ml-1 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}>
                                                <CreditCard size={10} />
                                                {wallets.find(w => w.id === income.wallet_id)?.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="text-right shrink-0">
                                    <p className="text-[15px] font-bold tracking-tight" style={{ color: income.status === 'received' ? 'var(--color-success-600)' : 'var(--text-primary)' }}>
                                        {formatCurrency(income.amount)}
                                    </p>
                                </div>

                                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                    <button onClick={() => openEdit(income)} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--color-primary-600)]" title="Editar">
                                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                    </button>
                                    <button onClick={() => handleDelete(income)} className="flex items-center justify-center h-8 w-8 rounded-lg transition-colors hover:bg-red-50 text-[var(--text-secondary)] hover:text-[var(--color-danger-500)]" title="Remover">
                                        <Trash2 size={15} strokeWidth={2.5} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className="w-full max-w-lg rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 className="mb-5 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            {editingIncome ? 'Editar Entrada' : 'Nova Entrada de Dinheiro'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Qual a origem?</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Salário, Freelance, Rendimentos..."
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
                                    <input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="0,00"
                                        className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Data prevista na conta</label>
                                    <input type="date" value={form.expected_date} onChange={(e) => setForm({ ...form, expected_date: e.target.value })} required
                                        className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tipo de Renda</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="fixed">Fixo (ex: Salário mensal)</option>
                                    <option value="variable">Variável (ex: Venda extra, freelance)</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Carteira / Conta</label>
                                <select value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="">Sem carteira vinculada</option>
                                    {wallets.map((w) => (
                                        <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                <input id="status-checkbox" type="checkbox" checked={form.status === 'received'} onChange={(e) => setForm({ ...form, status: e.target.checked ? 'received' : 'pending' })} className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500" />
                                <label htmlFor="status-checkbox" className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                    O dinheiro já está na minha conta
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5">
                                    {editingIncome ? 'Salvar Alterações' : 'Adicionar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}
