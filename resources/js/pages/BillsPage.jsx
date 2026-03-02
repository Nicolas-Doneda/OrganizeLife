import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';

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

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [isRecurring, setIsRecurring] = useState(false);
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState('blue');
    const [form, setForm] = useState({
        name_snapshot: '',
        expected_amount: '',
        due_date: '',
        due_day: '1',
        category_id: '',
        notes: '',
    });

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const [billsRes, catsRes] = await Promise.all([
                api.get('/monthly-bills', { params: { year, month } }),
                api.get('/categories'),
            ]);
            setBills(billsRes.data.data);
            setTotals(billsRes.data.totals);
            setCategories(catsRes.data.data);
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
        } catch { /* */ }
    }

    async function handleCancel(bill) {
        try {
            await api.patch(`/monthly-bills/${bill.id}/cancel`);
            fetchBills();
        } catch { /* */ }
    }

    async function handleDelete(bill) {
        if (!confirm('Remover esta conta?')) return;
        try {
            await api.delete(`/monthly-bills/${bill.id}`);
            fetchBills();
        } catch { /* */ }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editingBill) {
                // Editar conta existente
                await api.put(`/monthly-bills/${editingBill.id}`, {
                    ...form,
                    expected_amount: parseFloat(form.expected_amount) || 0,
                    category_id: form.category_id || null,
                });
            } else if (isRecurring) {
                // Criar recorrente: salva em recurring_bills E cria a primeira monthly_bill
                const dueDay = parseInt(form.due_day) || 1;
                const recurringRes = await api.post('/recurring-bills', {
                    name: form.name_snapshot,
                    expected_amount: parseFloat(form.expected_amount) || 0,
                    due_day: dueDay,
                    category_id: form.category_id || null,
                });

                // Criar a monthly_bill deste mes vinculada a recorrente
                const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(dueDay).padStart(2, '0')}`;
                await api.post('/monthly-bills', {
                    name_snapshot: form.name_snapshot,
                    expected_amount: parseFloat(form.expected_amount) || 0,
                    due_date: dueDate,
                    year,
                    month,
                    category_id: form.category_id || null,
                    recurring_bill_id: recurringRes.data.data.id,
                    notes: form.notes || null,
                });
            } else {
                // Criar conta avulsa (nao recorrente)
                await api.post('/monthly-bills', {
                    ...form,
                    year,
                    month,
                    expected_amount: parseFloat(form.expected_amount) || 0,
                    category_id: form.category_id || null,
                });
            }

            closeModal();
            fetchBills();
        } catch { /* */ }
    }

    async function handleCreateCategory() {
        if (!newCategoryName.trim()) return;
        try {
            const res = await api.post('/categories', {
                name: newCategoryName,
                color: newCategoryColor,
            });
            setCategories([...categories, res.data.data]);
            setForm({ ...form, category_id: String(res.data.data.id) });
            setShowNewCategory(false);
            setNewCategoryName('');
        } catch { /* */ }
    }

    function openCreate() {
        setEditingBill(null);
        setIsRecurring(false);
        setForm({
            name_snapshot: '',
            expected_amount: '',
            due_date: `${year}-${String(month).padStart(2, '0')}-01`,
            due_day: '1',
            category_id: '',
            notes: '',
        });
        setShowModal(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
        setIsRecurring(!!bill.recurring_bill_id);
        setForm({
            name_snapshot: bill.name_snapshot,
            expected_amount: String(bill.expected_amount),
            due_date: bill.due_date,
            due_day: bill.due_date ? String(parseInt(bill.due_date.split('-')[2])) : '1',
            category_id: bill.category_id ? String(bill.category_id) : '',
            notes: bill.notes || '',
        });
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setEditingBill(null);
        setIsRecurring(false);
        setShowNewCategory(false);
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
        gray: '#6b7280', red: '#ef4444', orange: '#f97316', yellow: '#eab308',
        green: '#22c55e', teal: '#14b8a6', blue: '#3b82f6', indigo: '#6366f1',
        purple: '#a855f7', pink: '#ec4899',
    };

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                        Contas
                    </h1>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {MONTH_NAMES[month]} {year}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                        <button onClick={prevMonth} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                            <ChevronLeft size={18} />
                        </button>
                        <span className="min-w-[130px] text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {MONTH_NAMES[month]} {year}
                        </span>
                        <button onClick={nextMonth} className="flex h-9 w-9 items-center justify-center rounded-lg transition-colors" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700">
                        <Plus size={18} /> Nova Conta
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniCard label="Previsto" value={formatCurrency(totals.expected)} />
                <MiniCard label="Pago" value={formatCurrency(totals.paid)} color="var(--color-success-600)" />
                <MiniCard label="Pendente" value={formatCurrency(totals.pending)} color="var(--color-warning-600)" />
                <MiniCard label="Atrasado" value={formatCurrency(totals.overdue)} color="var(--color-danger-600)" />
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
                <div className="flex gap-2 overflow-x-auto">
                    {['all', 'pending', 'paid', 'overdue', 'canceled'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilterStatus(s)}
                            className="shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
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
                                borderColor: filterCategory === String(cat.id) ? (CATEGORY_COLORS[cat.color] || '#6b7280') : 'var(--border-primary)',
                                backgroundColor: filterCategory === String(cat.id) ? (CATEGORY_COLORS[cat.color] || '#6b7280') + '15' : 'transparent',
                                color: filterCategory === String(cat.id) ? (CATEGORY_COLORS[cat.color] || '#6b7280') : 'var(--text-tertiary)',
                            }}
                        >
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[cat.color] || '#6b7280' }} />
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
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Receipt size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                        {bills.length === 0 ? 'Nenhuma conta neste mes' : 'Nenhuma conta encontrada'}
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredBills.map((bill) => (
                        <BillCard
                            key={bill.id}
                            bill={bill}
                            categoryColors={CATEGORY_COLORS}
                            onPay={() => handlePay(bill)}
                            onCancel={() => handleCancel(bill)}
                            onEdit={() => openEdit(bill)}
                            onDelete={() => handleDelete(bill)}
                        />
                    ))}
                </div>
            )}

            {/* Modal Criar/Editar */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => e.target === e.currentTarget && closeModal()}>
                    <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                            {editingBill ? 'Editar Conta' : 'Nova Conta'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome da conta</label>
                                <input type="text" value={form.name_snapshot} onChange={(e) => setForm({ ...form, name_snapshot: e.target.value })} required placeholder="Ex: Netflix, Aluguel, Conta de luz"
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>

                            {/* Valor + Vencimento */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
                                    <input type="number" step="0.01" min="0" value={form.expected_amount} onChange={(e) => setForm({ ...form, expected_amount: e.target.value })} required placeholder="0,00"
                                        className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                        style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                        {isRecurring && !editingBill ? 'Dia do vencimento' : 'Vencimento'}
                                    </label>
                                    {isRecurring && !editingBill ? (
                                        <select value={form.due_day} onChange={(e) => setForm({ ...form, due_day: e.target.value })} required
                                            className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                                <option key={d} value={d}>Dia {d}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required
                                            className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                    )}
                                </div>
                            </div>

                            {/* Categoria */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                                {!showNewCategory ? (
                                    <div className="flex gap-2">
                                        <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                            className="focus-ring flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                            <option value="">Sem categoria</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                        <button type="button" onClick={() => setShowNewCategory(true)}
                                            className="flex items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-medium transition-colors"
                                            style={{ borderColor: 'var(--border-primary)', color: 'var(--color-primary-600)' }}>
                                            <Plus size={14} /> Nova
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-2 rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)' }}>
                                        <input type="text" value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Nome da categoria"
                                            className="focus-ring w-full rounded-lg border px-3 py-2 text-sm outline-none"
                                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                                        <div className="flex flex-wrap gap-1.5">
                                            {Object.entries(CATEGORY_COLORS).map(([name, hex]) => (
                                                <button key={name} type="button" onClick={() => setNewCategoryColor(name)}
                                                    className={`h-6 w-6 rounded-full border-2 transition-transform ${newCategoryColor === name ? 'scale-110' : ''}`}
                                                    style={{ backgroundColor: hex, borderColor: newCategoryColor === name ? 'var(--text-primary)' : 'transparent' }} />
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={handleCreateCategory} className="rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white">Criar</button>
                                            <button type="button" onClick={() => setShowNewCategory(false)} className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Cancelar</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Toggle recorrente (so na criacao) */}
                            {!editingBill && (
                                <div
                                    className="flex items-center justify-between rounded-lg border px-4 py-3 cursor-pointer transition-colors"
                                    style={{
                                        borderColor: isRecurring ? 'var(--color-primary-500)' : 'var(--border-primary)',
                                        backgroundColor: isRecurring ? 'var(--bg-active)' : 'transparent',
                                    }}
                                    onClick={() => setIsRecurring(!isRecurring)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Repeat size={18} style={{ color: isRecurring ? 'var(--color-primary-600)' : 'var(--text-tertiary)' }} />
                                        <div>
                                            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Conta recorrente</p>
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                                {isRecurring ? 'Sera criada automaticamente todo mes' : 'Sera criada apenas neste mes'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`h-5 w-9 rounded-full transition-colors ${isRecurring ? 'bg-primary-600' : ''}`}
                                        style={{ backgroundColor: isRecurring ? undefined : 'var(--border-secondary)' }}>
                                        <div className={`mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${isRecurring ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                    </div>
                                </div>
                            )}

                            {/* Notas */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Observacoes (opcional)</label>
                                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Alguma observacao..."
                                    className="focus-ring w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700">
                                    {editingBill ? 'Salvar' : 'Criar Conta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}

/* ========== Sub-components ========== */

function BillCard({ bill, categoryColors, onPay, onCancel, onEdit, onDelete }) {
    const status = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending;
    const catColor = bill.category ? (categoryColors[bill.category.color] || '#6b7280') : null;

    return (
        <div
            className="group flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all hover:shadow-sm sm:gap-4 sm:px-5"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
            {/* Checkbox / Status Icon */}
            {bill.status === 'pending' ? (
                <button onClick={onPay}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:border-primary-500 hover:bg-primary-50"
                    style={{ borderColor: 'var(--border-secondary)' }} title="Marcar como paga">
                    <Check size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--color-primary-600)' }} />
                </button>
            ) : (
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: status.bg, color: status.color }}>
                    {bill.status === 'paid' && <Check size={12} />}
                    {bill.status === 'overdue' && <AlertTriangle size={12} />}
                    {bill.status === 'canceled' && <X size={12} />}
                </div>
            )}

            {/* Info */}
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium truncate ${bill.status === 'paid' ? 'line-through' : ''}`}
                        style={{ color: bill.status === 'canceled' ? 'var(--text-tertiary)' : 'var(--text-primary)' }}>
                        {bill.name_snapshot}
                    </p>
                    {bill.recurring_bill_id && (
                        <Repeat size={12} style={{ color: 'var(--color-primary-400)' }} title="Recorrente" />
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    <Calendar size={10} />
                    <span>{formatDateBR(bill.due_date)}</span>
                    {bill.category && (
                        <>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                                <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catColor }} />
                                {bill.category.name}
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right shrink-0">
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(bill.expected_amount)}
                </p>
                {bill.paid_amount != null && bill.status === 'paid' && bill.paid_amount !== bill.expected_amount && (
                    <p className="text-xs" style={{ color: 'var(--color-success-600)' }}>
                        Pago {formatCurrency(bill.paid_amount)}
                    </p>
                )}
            </div>

            {/* Status */}
            <span className="hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium sm:inline-block"
                style={{ backgroundColor: status.bg, color: status.color }}>
                {status.label}
            </span>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={onEdit} className="rounded-lg p-1.5 transition-colors hover:bg-black/5" style={{ color: 'var(--text-tertiary)' }} title="Editar">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                </button>
                {bill.status === 'pending' && (
                    <button onClick={onCancel} className="rounded-lg p-1.5 transition-colors hover:bg-black/5" style={{ color: 'var(--text-tertiary)' }} title="Cancelar">
                        <X size={14} />
                    </button>
                )}
                <button onClick={onDelete} className="rounded-lg p-1.5 transition-colors hover:bg-black/5" style={{ color: 'var(--color-danger-500)' }} title="Remover">
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
}

function MiniCard({ label, value, color }) {
    return (
        <div className="rounded-xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
            <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
            <p className="mt-1 text-lg font-bold" style={{ color: color || 'var(--text-primary)' }}>{value}</p>
        </div>
    );
}
