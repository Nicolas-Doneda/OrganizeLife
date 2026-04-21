import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Plus, CreditCard, Trash2, Pencil, Banknote, Landmark, DollarSign } from 'lucide-react';

const CURATED_COLORS = [
    { name: 'gray', hex: 'var(--color-accent-400)' }, { name: 'red', hex: 'var(--color-danger-500)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'green', hex: 'var(--color-success-500)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'indigo', hex: 'var(--color-primary-600)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'pink', hex: 'var(--color-danger-400)' },
];

const BANK_COLORS = [
    { name: 'nubank', hex: '#8A05BE', label: 'Nubank' },
    { name: 'itau', hex: '#EC7000', label: 'Itaú' },
    { name: 'inter', hex: '#FF7A00', label: 'Inter' },
    { name: 'bradesco', hex: '#CC092F', label: 'Bradesco' },
    { name: 'santander', hex: '#EC0000', label: 'Santander' },
    { name: 'bb', hex: '#FCEE21', label: 'Banco do Brasil' },
    { name: 'caixa', hex: '#005CA9', label: 'Caixa' },
    { name: 'sicredi', hex: '#32A041', label: 'Sicredi' },
    { name: 'mercadopago', hex: '#009EE3', label: 'Mercado Pago' },
    { name: 'picpay', hex: '#11C76F', label: 'PicPay' },
];

const COLORS = [...CURATED_COLORS, ...BANK_COLORS];

const ICONS = [
    { name: 'credit-card', label: 'Cartão', icon: CreditCard },
    { name: 'banknote', label: 'Dinheiro', icon: Banknote },
    { name: 'landmark', label: 'Banco', icon: Landmark },
    { name: 'dollar', label: 'Outro', icon: DollarSign },
];

function getColorHex(name) {
    return COLORS.find((c) => c.name === name)?.hex || '#6b7280';
}

function getIconComponent(name) {
    return ICONS.find((i) => i.name === name)?.icon || CreditCard;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function WalletsPage() {
    const [wallets, setWallets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', color: 'purple', icon: 'credit-card' });

    useEffect(() => { fetchWallets(); }, []);

    async function fetchWallets() {
        setLoading(true);
        try { const res = await api.get('/wallets'); setWallets(res.data.data); }
        catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const payload = { ...form };
            if (editing) { await api.put(`/wallets/${editing.id}`, payload); }
            else { await api.post('/wallets', payload); }
            setShowModal(false); setEditing(null); setForm({ name: '', color: 'purple', icon: 'credit-card' }); fetchWallets();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(wallet) {
        if (!confirm(`Remover a carteira "${wallet.name}"? As contas vinculadas não serão removidas.`)) return;
        try { await api.delete(`/wallets/${wallet.id}`); fetchWallets(); } catch (err) { console.error('Erro:', err); }
    }

    return (
        <AppLayout>
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Carteiras</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Gerencie suas formas de pagamento e contas bancárias</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', color: 'purple', icon: 'credit-card' }); setShowModal(true); }}
                    className="btn-primary px-4 py-2.5 active:scale-95">
                    <Plus size={18} /> Nova Carteira
                </button>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : wallets.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <CreditCard size={40} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-3 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nenhuma carteira criada</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--text-tertiary)' }}>Crie carteiras para vincular às suas contas e rendas</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {wallets.map((wallet) => {
                        const colorHex = getColorHex(wallet.color);
                        const IconComp = getIconComponent(wallet.icon);
                        return (
                            <div key={wallet.id}
                                className="group rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>

                                {/* Top: Icon + Name */}
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm"
                                        style={{ backgroundColor: `color-mix(in srgb, ${colorHex} 15%, transparent)`, color: colorHex }}>
                                        <IconComp size={24} strokeWidth={2} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-[15px] font-bold tracking-tight truncate" style={{ color: 'var(--text-primary)' }}>
                                            {wallet.name}
                                        </h3>
                                        <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                                            {(wallet.monthly_bills_count || 0)} contas · {(wallet.incomes_count || 0)} rendas
                                        </p>
                                    </div>
                                </div>



                                {/* Actions */}
                                <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                    <button onClick={() => { setEditing(wallet); setForm({ name: wallet.name, color: wallet.color, icon: wallet.icon || 'credit-card' }); setShowModal(true); }}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]"
                                        style={{ color: 'var(--text-secondary)' }}>
                                        <Pencil size={12} /> Editar
                                    </button>
                                    <button onClick={() => handleDelete(wallet)}
                                        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-[var(--color-danger-50)] active:scale-95"
                                        style={{ color: 'var(--color-danger-500)' }}>
                                        <Trash2 size={12} /> Remover
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border p-6 max-h-[90vh] overflow-y-auto shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
                        <h3 className="mb-5 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                            {editing ? 'Editar Carteira' : 'Nova Carteira'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    placeholder="Ex: Nubank, Itaú, Dinheiro"
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tipo</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {ICONS.map(({ name, label, icon: Icon }) => (
                                        <button key={name} type="button" onClick={() => setForm({ ...form, icon: name })}
                                            className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-all ${form.icon === name ? 'ring-2 ring-primary-500' : ''}`}
                                            style={{
                                                backgroundColor: form.icon === name ? 'var(--bg-active)' : 'var(--bg-card)',
                                                borderColor: form.icon === name ? 'var(--color-primary-300)' : 'var(--border-primary)',
                                                color: form.icon === name ? 'var(--color-primary-600)' : 'var(--text-secondary)',
                                            }}>
                                            <Icon size={20} />
                                            <span>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Color */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Paleta Padrão</label>
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {CURATED_COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })} title={c.name}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.name ? 'scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex, borderColor: form.color === c.name ? 'var(--text-primary)' : 'transparent' }} />
                                    ))}
                                </div>
                                
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Bancos Oficiais</label>
                                <div className="flex flex-wrap gap-2">
                                    {BANK_COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })} title={c.label}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.name ? 'scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex, borderColor: form.color === c.name ? 'var(--text-primary)' : 'transparent', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }} />
                                    ))}
                                </div>
                            </div>



                            {/* Actions */}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-[var(--bg-hover)] active:scale-95" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5">{editing ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </AppLayout>
    );
}
