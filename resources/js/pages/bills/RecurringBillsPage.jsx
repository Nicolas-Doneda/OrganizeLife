import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../../components/layouts/AppLayout';
import api from '../../services/api';
import { Plus, Repeat, Trash2, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import BillModal from '../../components/ui/modals/BillModal';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function RecurringBillsPage() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingBill, setEditingBill] = useState(null);

    useEffect(() => { fetchBills(); }, []);

    async function fetchBills() {
        setLoading(true);
        try {
            const res = await api.get('/recurring-bills');
            setBills(res.data.data);
        } catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSave({ payload }) {
        try {
            const data = {
                ...payload,
                expected_amount: parseFloat(payload.expected_amount) || 0,
                due_day: parseInt(payload.due_day) || 1,
                category_id: payload.category_id || null
            };
            if (editingBill) {
                await api.put(`/recurring-bills/${editingBill.id}`, data);
            } else {
                await api.post('/recurring-bills', data);
            }
            setShowModal(false);
            setEditingBill(null);
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
        setShowModal(true);
    }

    function openEdit(bill) {
        setEditingBill(bill);
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

            <BillModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSave={handleSave}
                bill={editingBill}
                lockedType="recurring"
                categories={[]}
                wallets={[]}
            />
        </AppLayout>
    );
}
