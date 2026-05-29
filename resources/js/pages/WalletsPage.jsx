import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import useSubmitGuard, { useActionGuard } from '../hooks/useSubmitGuard';
import { Plus, CreditCard, Trash2, Pencil, Banknote, Landmark, DollarSign, X } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const CURATED_COLORS = [
    { name: 'gray', hex: 'var(--color-accent-400)' }, { name: 'red', hex: 'var(--color-danger-500)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'green', hex: 'var(--color-success-500)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'indigo', hex: 'var(--color-primary-600)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'pink', hex: 'var(--color-danger-500)' },
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
    const [form, setForm] = useState({ name: '', color: 'purple', icon: 'credit-card', type: 'checking', balance: '0' });
    const { isSubmitting, guard } = useSubmitGuard();
    const { isActionInProgress, guardAction } = useActionGuard();
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, wallet: null });

    useEffect(() => { fetchWallets(); }, []);

    async function fetchWallets() {
        setLoading(true);
        try { const res = await api.get('/wallets'); setWallets(res.data.data); }
        catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await guard(async () => {
            try {
                const payload = { ...form };
                if (editing) { await api.put(`/wallets/${editing.id}`, payload); }
                else { await api.post('/wallets', payload); }
                setShowModal(false); setEditing(null); setForm({ name: '', color: 'purple', icon: 'credit-card' }); fetchWallets();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openDeleteConfirm(wallet) {
        setDeleteDialog({ isOpen: true, wallet });
    }

    async function handleConfirmDelete() {
        const wallet = deleteDialog.wallet;
        if (!wallet) return;
        await guardAction(wallet.id, async () => {
            try { await api.delete(`/wallets/${wallet.id}`); fetchWallets(); } catch (err) { console.error('Erro:', err); }
        });
        setDeleteDialog({ isOpen: false, wallet: null });
    }

    return (
        <AppLayout>
            {/* PageHeader */}
            <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
                            Contas & Carteiras
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            Gerencie suas contas bancárias, cartões e reservas de caixa.
                        </p>
                    </div>

                    <button onClick={() => { setEditing(null); setForm({ name: '', color: 'purple', icon: 'credit-card' }); setShowModal(true); }}
                        className="btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5 self-start sm:self-auto">
                        <Plus size={16} /> Nova Carteira
                    </button>
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary-300)] border-t-[var(--color-primary-600)]" />
                </div>
            ) : wallets.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 border border-dashed border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)]/50 shadow-sm">
                    <CreditCard size={36} className="text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Nenhuma carteira cadastrada</h3>
                    <p className="text-xs text-[var(--text-tertiary)] max-w-sm mb-4">
                        Cadastre contas bancárias, cartões de crédito ou dinheiro em espécie para conciliar seus lançamentos de entrada e saída.
                    </p>
                    <button onClick={() => { setEditing(null); setForm({ name: '', color: 'purple', icon: 'credit-card' }); setShowModal(true); }}
                        className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1">
                        <Plus size={14} /> Cadastrar Primeira Carteira
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {wallets.map((wallet) => {
                        const colorHex = getColorHex(wallet.color);
                        const IconComp = getIconComponent(wallet.icon);
                        return (
                            <div key={wallet.id}
                                className="group relative rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] overflow-hidden shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md flex flex-col"
                                style={{ borderTop: `5px solid ${colorHex}` }}>
                                
                                <div className="p-5 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="text-[10px] font-semibold tracking-wider text-[var(--text-tertiary)] uppercase">
                                            Carteira
                                        </span>
                                        <div className="flex h-8 w-8 items-center justify-center rounded-lg"
                                            style={{ backgroundColor: `color-mix(in srgb, ${colorHex} 15%, transparent)`, color: colorHex }}>
                                            <IconComp size={16} strokeWidth={2.5} />
                                        </div>
                                    </div>

                                    <h3 className="text-base font-bold tracking-tight text-[var(--text-primary)] font-heading">
                                        {wallet.name}
                                    </h3>

                                    <div className="mt-5 pt-3 border-t border-dashed border-[var(--border-primary)] flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                                        <span>Contas Vinculadas</span>
                                        <span className="text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">{(wallet.monthly_bills_count || 0)}</span>
                                    </div>
                                    <div className="mt-2 flex justify-between text-xs font-semibold text-[var(--text-secondary)]">
                                        <span>Rendas Vinculadas</span>
                                        <span className="text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">{(wallet.incomes_count || 0)}</span>
                                    </div>
                                </div>

                                {/* Actions strip at bottom */}
                                <div className="px-5 py-3 bg-[var(--bg-secondary)]/50 border-t border-[var(--border-primary)] flex justify-between items-center opacity-90 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setEditing(wallet); setForm({ name: wallet.name, color: wallet.color, icon: wallet.icon || 'credit-card' }); setShowModal(true); }}
                                        className="flex items-center gap-1 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--color-primary-600)] transition-colors">
                                        <Pencil size={11} /> Editar
                                    </button>
                                    <button onClick={() => openDeleteConfirm(wallet)}
                                        disabled={isActionInProgress(wallet.id)}
                                        className="flex items-center gap-1 text-xs font-semibold text-[var(--color-danger-500)] hover:text-red-600 transition-colors disabled:opacity-50">
                                        <Trash2 size={11} /> {isActionInProgress(wallet.id) ? 'Removendo...' : 'Remover'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create / Edit Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200" 
                         style={{ backgroundColor: 'var(--bg-card)', borderTop: '6px solid var(--color-primary-500)' }}>
                        
                        <div className="px-6 py-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
                            <div>
                                <span className="text-[10px] font-semibold tracking-wider text-[var(--color-primary-600)] uppercase">Carteira</span>
                                <h3 className="text-lg font-bold tracking-tight mt-0.5 text-[var(--text-primary)] font-heading">
                                    {editing ? 'Editar Carteira' : 'Nova Carteira'}
                                </h3>
                            </div>
                            <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                            {/* Name */}
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Nome da Carteira / Banco</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    placeholder="Ex: Nubank, Itaú, Carteira Dinheiro"
                                    className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-medium" />
                            </div>

                            {/* Icon */}
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Tipo de Conta</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {ICONS.map(({ name, label, icon: Icon }) => {
                                        const isSel = form.icon === name;
                                        return (
                                            <button key={name} type="button" onClick={() => setForm({ ...form, icon: name })}
                                                className="flex flex-col items-center gap-1.5 rounded-lg border p-2.5 text-xs font-semibold transition-all active:scale-95"
                                                style={{
                                                    backgroundColor: isSel ? 'var(--color-primary-50)' : 'var(--bg-card)',
                                                    borderColor: isSel ? 'var(--color-primary-400)' : 'var(--border-primary)',
                                                    color: isSel ? 'var(--color-primary-700)' : 'var(--text-secondary)',
                                                }}>
                                                <Icon size={16} strokeWidth={2} />
                                                <span className="text-[10px] tracking-wide font-medium">{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Color */}
                            <div className="space-y-4">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)] border-b pb-1 border-[var(--border-primary)]">
                                        Paleta Geral
                                    </label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {CURATED_COLORS.map((c) => (
                                            <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })} title={c.name}
                                                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 active:scale-95 ${form.color === c.name ? 'scale-110 border-[var(--text-primary)]' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.hex }} />
                                        ))}
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)] border-b pb-1 border-[var(--border-primary)]">
                                        Bancos Oficiais
                                    </label>
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {BANK_COLORS.map((c) => (
                                            <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })} title={c.label}
                                                className={`h-7 w-7 rounded-full border-2 transition-transform hover:scale-105 active:scale-95 ${form.color === c.name ? 'scale-110 border-[var(--text-primary)]' : 'border-transparent'}`}
                                                style={{ backgroundColor: c.hex, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Actions */}
                        <div className="flex justify-end gap-2.5 p-5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/10">
                            <button type="button" onClick={() => setShowModal(false)} className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]">Cancelar</button>
                            <button type="button" onClick={(e) => handleSubmit(e)} disabled={isSubmitting} className="btn-primary px-4 py-2 text-xs font-semibold">
                                {isSubmitting ? (
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                ) : (
                                    editing ? 'Salvar' : 'Criar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, wallet: null })}
                title="Excluir Carteira"
                description={deleteDialog.wallet ? `Deseja mesmo remover a carteira "${deleteDialog.wallet.name}"? As contas de receitas e despesas vinculadas a ela não serão removidas.` : ''}
                variant="danger"
                confirmLabel="Remover"
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
