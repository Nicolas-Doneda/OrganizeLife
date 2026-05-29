import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import useSubmitGuard, { useActionGuard } from '../hooks/useSubmitGuard';
import { Plus, PiggyBank, Pencil, Trash2, TrendingUp, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import CurrencyInput from '../components/ui/CurrencyInput';
import { formatDateBR } from '../utils/date';

const COLORS = [
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'green', hex: 'var(--color-success-500)' },
    { name: 'red', hex: 'var(--color-danger-500)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'gray', hex: 'var(--color-accent-400)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'indigo', hex: 'var(--color-primary-600)' }, { name: 'pink', hex: 'var(--color-danger-500)' },
    { name: 'rose', hex: '#e11d48' }, { name: 'amber', hex: '#d97706' },
    { name: 'emerald', hex: '#059669' }, { name: 'cyan', hex: '#0891b2' },
    { name: 'sky', hex: '#0284c7' }, { name: 'violet', hex: '#7c3aed' },
];

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function SavingsPage() {
    const [savings, setSavings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showAddFunds, setShowAddFunds] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', target_amount: '', current_amount: '', color: 'blue' });
    const [fundsAmount, setFundsAmount] = useState('');
    const [expandedDeposits, setExpandedDeposits] = useState({});
    const [depositsData, setDepositsData] = useState({});
    const { isSubmitting, guard } = useSubmitGuard();
    const { isSubmitting: isDepositing, guard: guardDeposit } = useSubmitGuard();
    const { isActionInProgress, guardAction } = useActionGuard();
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, saving: null });

    useEffect(() => { fetchSavings(); }, []);

    async function fetchSavings() {
        setLoading(true);
        try {
            const res = await api.get('/savings');
            setSavings(res.data.data);
        } catch (err) { console.error('Erro:', err); }
        finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await guard(async () => {
            try {
                const payload = { ...form, target_amount: form.target_amount || null };
                if (editing) { await api.put(`/savings/${editing.id}`, payload); }
                else { await api.post('/savings', payload); }
                closeModal(); fetchSavings();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    async function handleAddFunds(e) {
        e.preventDefault();
        await guardDeposit(async () => {
            try {
                await api.post(`/savings/${editing.id}/add-funds`, { amount: fundsAmount });
                closeModal(); fetchSavings();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openDeleteConfirm(sv) {
        setDeleteDialog({ isOpen: true, saving: sv });
    }

    async function handleConfirmDelete() {
        const sv = deleteDialog.saving;
        if (!sv) return;
        await guardAction(sv.id, async () => {
            try { await api.delete(`/savings/${sv.id}`); fetchSavings(); } catch (err) { console.error('Erro:', err); }
        });
        setDeleteDialog({ isOpen: false, saving: null });
    }

    function openCreate() {
        setEditing(null);
        setForm({ name: '', target_amount: '', current_amount: '', color: 'blue' });
        setShowModal(true);
    }

    function openEdit(sv) {
        setEditing(sv);
        setForm({ name: sv.name, target_amount: sv.target_amount || '', current_amount: sv.current_amount || '', color: sv.color || 'blue' });
        setShowModal(true);
    }

    function openAddFunds(sv) {
        setEditing(sv);
        setFundsAmount('');
        setShowAddFunds(true);
    }

    function closeModal() {
        setShowModal(false);
        setShowAddFunds(false);
        setEditing(null);
    }

    const totalSaved = savings.reduce((acc, sv) => acc + parseFloat(sv.current_amount || 0), 0);
    const totalGoals = savings.reduce((acc, sv) => acc + parseFloat(sv.target_amount || 0), 0);

    async function toggleDeposits(savingId) {
        if (expandedDeposits[savingId]) {
            setExpandedDeposits(prev => ({ ...prev, [savingId]: false }));
            return;
        }
        try {
            const res = await api.get(`/savings/${savingId}/deposits`);
            setDepositsData(prev => ({ ...prev, [savingId]: res.data.data }));
            setExpandedDeposits(prev => ({ ...prev, [savingId]: true }));
        } catch (err) { console.error('Erro:', err); }
    }

    return (
        <AppLayout>
            {/* PageHeader */}
            <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-3">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">
                            Minhas Caixinhas
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1.5 font-medium">
                            Planeje suas metas de médio e longo prazo e organize seus depósitos de reserva.
                        </p>
                    </div>
                    <button onClick={openCreate} className="btn-primary px-4 py-2.5 active:scale-95 text-xs">
                        <Plus size={16} /> Nova Reserva
                    </button>
                </div>
            </div>

            {/* MetricStrip */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-sm flex items-center justify-between hover:bg-[var(--bg-hover)]/10 transition-colors">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Total Guardado</span>
                        <p className="mt-1 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums] text-[var(--color-success-600)]">{formatCurrency(totalSaved)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--color-success-600)]">
                        <PiggyBank size={18} />
                    </div>
                </div>
                <div className="rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-5 shadow-sm flex items-center justify-between hover:bg-[var(--bg-hover)]/10 transition-colors">
                    <div>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Soma de Metas</span>
                        <p className="mt-1 text-2xl font-bold tracking-tight [font-variant-numeric:tabular-nums] text-[var(--text-primary)]">{formatCurrency(totalGoals)}</p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[var(--text-secondary)]">
                        <TrendingUp size={18} />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-[var(--color-primary-200)] border-t-[var(--color-primary-600)]" />
                </div>
            ) : savings.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-primary)' }}>
                    <div className="p-4 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] mb-4 text-[var(--text-tertiary)]">
                        <PiggyBank size={36} />
                    </div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] font-heading">Nenhum Envelope de Reserva</h3>
                    <p className="mt-1 text-xs text-[var(--text-tertiary)] max-w-sm text-center">
                        Crie sua primeira caixinha de poupança contábil para categorizar e rastrear suas metas financeiras.
                    </p>
                    <button onClick={openCreate} className="btn-primary mt-4 px-4 py-2 text-xs active:scale-95">
                        <Plus size={16} /> Nova Reserva
                    </button>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {savings.map((sv) => {
                        const percent = sv.target_amount > 0 ? Math.min((sv.current_amount / sv.target_amount) * 100, 100) : 0;
                        const tColorStr = COLORS.find(c => c.name === sv.color)?.hex || '#3b82f6';
                        return (
                            <div key={sv.id} className="relative rounded-xl border border-[var(--border-primary)] p-5 bg-[var(--bg-card)] shadow-sm"
                                 style={{ borderTop: `6px solid ${tColorStr}` }}>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-base text-[var(--text-primary)] pr-2">{sv.name}</h3>
                                    <button onClick={() => openAddFunds(sv)} 
                                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-lg transition-all hover:opacity-80 active:scale-95 border" 
                                            style={{ backgroundColor: `color-mix(in srgb, ${tColorStr} 12%, transparent)`, color: tColorStr, borderColor: `color-mix(in srgb, ${tColorStr} 25%, transparent)` }}>
                                        <TrendingUp size={12} /> Depositar
                                    </button>
                                </div>
                                <div className="mb-4">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Saldo Acumulado</span>
                                    <p className="text-2xl font-black tracking-tight text-[var(--text-primary)] mt-0.5 [font-variant-numeric:tabular-nums]">{formatCurrency(sv.current_amount)}</p>
                                    {Number(sv.target_amount) > 0 && (
                                        <p className="text-xs font-semibold mt-1.5" style={{ color: Number(sv.current_amount) >= Number(sv.target_amount) ? 'var(--color-success-600)' : 'var(--text-secondary)' }}>
                                            {Number(sv.current_amount) > Number(sv.target_amount)
                                                ? `Meta superada! +${formatCurrency(sv.current_amount - sv.target_amount)}`
                                                : Number(sv.current_amount) === Number(sv.target_amount)
                                                    ? 'Meta 100% atingida!'
                                                    : `Faltam ${formatCurrency(sv.target_amount - sv.current_amount)} para a meta`
                                            }
                                        </p>
                                    )}
                                </div>

                                {/* Custom progress bar */}
                                {Number(sv.target_amount) > 0 && (() => {
                                    let progressColor = 'var(--color-danger-500)';
                                    if (percent >= 100) progressColor = 'var(--color-success-500)';
                                    else if (percent >= 60) progressColor = 'var(--color-primary-500)';
                                    else if (percent >= 30) progressColor = 'var(--color-warning-500)';
                                    
                                    return (
                                        <div className="mt-4">
                                            <div className="relative h-2 w-full rounded-full bg-[var(--bg-secondary)] overflow-hidden border border-[var(--border-primary)]">
                                                <div className="h-full rounded-full transition-all duration-700" 
                                                     style={{ 
                                                         width: `${percent}%`, 
                                                         backgroundColor: progressColor,
                                                     }} 
                                                />
                                            </div>
                                            <div className="flex justify-between items-center mt-1.5 text-[10px] font-semibold text-[var(--text-tertiary)]">
                                                <span style={{ color: progressColor }}>{percent.toFixed(0)}% concluído</span>
                                                <span>Alvo: {formatCurrency(sv.target_amount)}</span>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* Fine list divider / options */}
                                <div className="flex gap-2 border-t mt-4 pt-3 border-[var(--border-primary)]" style={{ borderColor: 'var(--border-primary)' }}>
                                    <button onClick={() => toggleDeposits(sv.id)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-semibold hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]">
                                        {expandedDeposits[sv.id] ? <ChevronUp size={14} /> : <Clock size={14} />}
                                        {expandedDeposits[sv.id] ? 'Fechar' : 'Histórico'}
                                    </button>
                                    <button onClick={() => openEdit(sv)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-semibold hover:bg-[var(--bg-hover)] transition-colors text-[var(--text-secondary)]">
                                        <Pencil size={14} /> Editar
                                    </button>
                                    <button onClick={() => openDeleteConfirm(sv)} disabled={isActionInProgress(sv.id)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all hover:bg-[var(--color-danger-50)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-danger-500)]">
                                        <Trash2 size={14} /> {isActionInProgress(sv.id) ? 'Excluindo...' : 'Excluir'}
                                    </button>
                                </div>

                                {/* Deposits receipt styled container */}
                                {expandedDeposits[sv.id] && (
                                    <div className="mt-4 border-t border-dashed pt-4 space-y-2 border-[var(--border-primary)]">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Histórico de Depósitos</p>
                                            <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded">Aportes: {(depositsData[sv.id] || []).length}</span>
                                        </div>
                                        {(depositsData[sv.id] || []).length === 0 ? (
                                            <p className="text-xs italic text-[var(--text-tertiary)] py-1">Nenhum depósito registrado.</p>
                                        ) : (
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                {(depositsData[sv.id] || []).map((dep, idx) => (
                                                    <div key={dep.id || idx} className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs border border-[var(--border-primary)] bg-[var(--bg-secondary)] [font-variant-numeric:tabular-nums]">
                                                        <span className="text-[var(--text-secondary)]">{formatDateBR(dep.deposit_date)}</span>
                                                        <span className="font-bold text-[var(--color-success-600)]">+{formatCurrency(dep.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal Principal (Criar/Editar) */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-md rounded-xl border p-6 bg-[var(--bg-card)] shadow-lg overflow-hidden relative" 
                          style={{ borderTop: '6px solid var(--color-primary-500)', borderColor: 'var(--border-primary)' }}>
                        
                        <div className="mt-2 mb-4">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-primary-600)]">Meta de Reserva</span>
                            <h3 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading mt-1">
                                {editing ? 'Editar Envelope de Reserva' : 'Novo Envelope de Reserva'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Nome da Caixinha</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    placeholder="Ex: Reserva de Emergência"
                                    className="input-base" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Meta (Opcional)</label>
                                    <CurrencyInput value={form.target_amount} onChange={(v) => setForm({ ...form, target_amount: v })}
                                        placeholder="0,00"
                                        className="input-base" />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Saldo Inicial</label>
                                    <CurrencyInput value={form.current_amount} onChange={(v) => setForm({ ...form, current_amount: v })} required={editing == null}
                                        placeholder="0,00"
                                        className="input-base" />
                                </div>
                            </div>
                            <div>
                                <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">Identificador de Cor</label>
                                <div className="flex flex-wrap gap-2.5 p-3 rounded-lg border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
                                    {COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })}
                                            className={`h-7 w-7 rounded-full border-2 transition-all hover:scale-110 active:scale-95`}
                                            style={{ 
                                                backgroundColor: c.hex, 
                                                borderColor: form.color === c.name ? 'var(--text-primary)' : 'rgba(0,0,0,0.15)' 
                                            }} 
                                            title={c.name}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border-primary)]">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isSubmitting} className="btn-primary px-4 py-2.5 disabled:opacity-50 text-xs">
                                    {isSubmitting ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : (editing ? 'Confirmar Ajustes' : 'Criar Reserva')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {/* Modal de Depósito */}
            {showAddFunds && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="w-full max-w-sm rounded-xl border p-6 bg-[var(--bg-card)] shadow-lg relative overflow-hidden"
                         style={{ borderTop: '6px solid var(--color-success-500)', borderColor: 'var(--border-primary)' }}>
                        
                        <div className="mt-2 mb-3">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-success-600)]">Depósito de Reserva</span>
                            <h3 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading mt-1">Depositar Fundos</h3>
                            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Registre um aporte no envelope de reserva <strong>"{editing?.name}"</strong>.</p>
                        </div>

                        <form onSubmit={handleAddFunds} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Quantia (R$)</label>
                                <CurrencyInput value={fundsAmount} onChange={(v) => setFundsAmount(v)} required autoFocus placeholder="0,00"
                                    className="input-base" />
                            </div>
                            <div className="flex justify-end gap-3 pt-2 border-t border-dashed border-[var(--border-primary)] mt-4">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                                    Cancelar
                                </button>
                                <button type="submit" disabled={isDepositing} className="btn-primary px-4 py-2.5 disabled:opacity-50 text-xs" style={{ background: 'linear-gradient(135deg, var(--color-success-600), var(--color-success-700))' }}>
                                    {isDepositing ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Confirmar Depósito'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, saving: null })}
                title="Excluir Reserva"
                description={deleteDialog.saving ? `Deseja mesmo remover a reserva "${deleteDialog.saving.name}"? Esta ação não pode ser desfeita.` : ''}
                variant="danger"
                confirmLabel="Remover"
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
