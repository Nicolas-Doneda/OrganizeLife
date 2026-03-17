import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../../components/layouts/AppLayout';
import api from '../../services/api';
import { Plus, Repeat, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function RecurringBillsPage() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);
    const [form, setForm] = useState({ name: '', due_day: '', expected_amount: '', category_id: '' });

    useEffect(() => { fetchBills(); }, []);

    async function fetchBills() {
        setLoading(true);
        try {
            const res = await api.get('/recurring-bills');
            setBills(res.data.data);
        } catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = { ...form, expected_amount: parseFloat(form.expected_amount) || 0, due_day: parseInt(form.due_day) || 1, category_id: form.category_id || null };
            if (editingBill) { await api.put(`/recurring-bills/${editingBill.id}`, data); }
            else { await api.post('/recurring-bills', data); }
            setShowModal(false);
            setEditingBill(null);
            setForm({ name: '', due_day: '', expected_amount: '', category_id: '' });
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleToggle(bill) {
        try {
            await api.patch(`/recurring-bills/${bill.id}/${bill.active ? 'deactivate' : 'activate'}`);
            fetchBills();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(bill) {
        if (!confirm('Remover esta conta recorrente?')) return;
        try { await api.delete(`/recurring-bills/${bill.id}`); fetchBills(); } catch (err) { console.error('Erro:', err); }
    }

    function openCreate() {
        setEditingBill(null);
        setForm({ name: '', due_day: '', expected_amount: '', category_id: '' });
        setShowModal(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
        setForm({ name: bill.name, due_day: String(bill.due_day), expected_amount: String(bill.expected_amount), category_id: bill.category_id || '' });
        setShowModal(true);
    }

    return (
        <AppLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Contas Recorrentes</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Gerencie suas contas fixas mensais</p>
                </div>
                <button onClick={openCreate} className="btn-primary px-4 py-2.5 active:scale-95">
                    <Plus size={18} /> Nova Recorrente
                </button>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : bills.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Repeat size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma conta recorrente</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {bills.map((bill) => (
                        <div key={bill.id} className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)', opacity: bill.active ? 1 : 0.6 }}>
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{bill.name}</h3>
                                <button onClick={() => handleToggle(bill)} title={bill.active ? 'Desativar' : 'Ativar'} style={{ color: bill.active ? 'var(--color-success-500)' : 'var(--text-tertiary)' }}>
                                    {bill.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                </button>
                            </div>
                            <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(bill.expected_amount)}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                <span>Dia {bill.due_day}</span>
                                {bill.category && <><span>·</span><span>{bill.category.name}</span></>}
                                {bill.monthly_bills_count > 0 && <><span>·</span><span>{bill.monthly_bills_count} meses</span></>}
                            </div>
                            <div className="mt-4 flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                <button onClick={() => openEdit(bill)} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                    <Pencil size={12} /> Editar
                                </button>
                                <button onClick={() => handleDelete(bill)} className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>
                                    <Trash2 size={12} /> Remover
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border p-6 shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 className="mb-4 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{editingBill ? 'Editar Recorrente' : 'Nova Recorrente'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Field label="Nome" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Dia Vencimento" type="number" min="1" max="31" value={form.due_day} onChange={(v) => setForm({ ...form, due_day: v })} required />
                                <Field label="Valor" type="number" step="0.01" value={form.expected_amount} onChange={(v) => setForm({ ...form, expected_amount: v })} required />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5">{editingBill ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}

function Field({ label, value, onChange, type = 'text', required = false, ...props }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} required={required}
                className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} {...props} />
        </div>
    );
}
