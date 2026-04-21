import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Plus, PiggyBank, Pencil, Trash2, TrendingUp, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import CurrencyInput from '../components/ui/CurrencyInput';

const COLORS = [
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'green', hex: 'var(--color-success-500)' },
    { name: 'red', hex: 'var(--color-danger-500)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'gray', hex: 'var(--color-accent-400)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'indigo', hex: 'var(--color-primary-600)' }, { name: 'pink', hex: 'var(--color-danger-400)' },
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
        try {
            const payload = { ...form, target_amount: form.target_amount || null };
            if (editing) { await api.put(`/savings/${editing.id}`, payload); }
            else { await api.post('/savings', payload); }
            closeModal(); fetchSavings();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleAddFunds(e) {
        e.preventDefault();
        try {
            await api.post(`/savings/${editing.id}/add-funds`, { amount: fundsAmount });
            closeModal(); fetchSavings();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(sv) {
        if (!confirm(`Deseja mesmo remover a reserva "${sv.name}"?`)) return;
        try { await api.delete(`/savings/${sv.id}`); fetchSavings(); } catch (err) { console.error('Erro:', err); }
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

    function formatDateBR(dateStr) {
        if (!dateStr) return '';
        const d = String(dateStr).substring(0, 10);
        const [y, m, dd] = d.split('-');
        return `${dd}/${m}/${y}`;
    }

    return (
        <AppLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                        Minhas Caixinhas
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Suas reservas e metas financeiras</p>
                </div>
                <button onClick={openCreate} className="btn-primary px-4 py-2.5 active:scale-95">
                    <Plus size={18} /> Nova Reserva
                </button>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>Total Guardado</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--color-success-600)' }}>{formatCurrency(totalSaved)}</p>
                </div>
                <div className="rounded-2xl border p-5 bg-[var(--bg-card)] transition-all" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                    <p className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'var(--text-tertiary)' }}>Soma de Metas</p>
                    <p className="mt-2 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{formatCurrency(totalGoals)}</p>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : savings.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-2xl border bg-[var(--bg-card)]" style={{ borderColor: 'var(--border-primary)' }}>
                    <PiggyBank size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma reserva criada ainda.</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {savings.map((sv) => {
                        const percent = sv.target_amount > 0 ? Math.min((sv.current_amount / sv.target_amount) * 100, 100) : 0;
                        const tColorStr = COLORS.find(c => c.name === sv.color)?.hex || '#3b82f6';
                        return (
                            <div key={sv.id} className="rounded-2xl border p-5 bg-[var(--bg-card)] hover:-translate-y-1 transition-transform" style={{ borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{sv.name}</h3>
                                    <button onClick={() => openAddFunds(sv)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all hover:opacity-80 active:scale-95 border" style={{ backgroundColor: `color-mix(in srgb, ${tColorStr} 15%, transparent)`, color: tColorStr, borderColor: `color-mix(in srgb, ${tColorStr} 30%, transparent)` }}>
                                        <TrendingUp size={14} /> Depositar
                                    </button>
                                </div>
                                <div className="mb-3">
                                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Atualmente guardado</p>
                                    <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{formatCurrency(sv.current_amount)}</p>
                                    {Number(sv.target_amount) > 0 && (
                                        <p className="text-xs font-semibold mt-1" style={{ color: Number(sv.current_amount) >= Number(sv.target_amount) ? 'var(--color-success-600)' : 'var(--text-secondary)' }}>
                                            {Number(sv.current_amount) > Number(sv.target_amount)
                                                ? `Meta superada! Você tem ${formatCurrency(sv.current_amount - sv.target_amount)} a mais`
                                                : Number(sv.current_amount) === Number(sv.target_amount)
                                                    ? 'Meta alcançada com precisão!'
                                                    : `Faltam ${formatCurrency(sv.target_amount - sv.current_amount)} para a meta`
                                            }
                                        </p>
                                    )}
                                </div>
                                {Number(sv.target_amount) > 0 && (() => {
                                    let progressColor = 'var(--color-danger-500)';
                                    if (percent >= 100) progressColor = 'var(--color-success-500)';
                                    else if (percent >= 60) progressColor = 'var(--color-primary-500)';
                                    else if (percent >= 30) progressColor = 'var(--color-warning-500)';
                                    
                                    return (
                                        <>
                                            <div className="h-2.5 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-hover)' }}>
                                                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${percent}%`, backgroundColor: progressColor }} />
                                            </div>
                                            <p className="text-xs font-bold mt-2 text-right" style={{ color: progressColor }}>{percent.toFixed(0)}%</p>
                                        </>
                                    );
                                })()}
                                <div className="flex gap-2 border-t mt-4 pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                    <button onClick={() => toggleDeposits(sv.id)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-medium hover:bg-[var(--bg-hover)] transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                        {expandedDeposits[sv.id] ? <ChevronUp size={14} /> : <Clock size={14} />}
                                        {expandedDeposits[sv.id] ? 'Fechar' : 'Histórico'}
                                    </button>
                                    <button onClick={() => openEdit(sv)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-medium hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
                                        <Pencil size={14} /> Editar
                                    </button>
                                    <button onClick={() => handleDelete(sv)} className="flex flex-1 justify-center items-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all hover:bg-[var(--color-danger-50)] active:scale-95" style={{ color: 'var(--color-danger-500)' }}>
                                        <Trash2 size={14} /> Excluir
                                    </button>
                                </div>

                                {expandedDeposits[sv.id] && (
                                    <div className="mt-3 border-t pt-3 space-y-2" style={{ borderColor: 'var(--border-primary)' }}>
                                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>Histórico de Depósitos</p>
                                        {(depositsData[sv.id] || []).length === 0 ? (
                                            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Nenhum depósito registrado.</p>
                                        ) : (
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                {(depositsData[sv.id] || []).map((dep, idx) => (
                                                    <div key={dep.id || idx} className="flex items-center justify-between rounded-lg px-3 py-2 text-xs" style={{ backgroundColor: 'var(--bg-hover)' }}>
                                                        <span style={{ color: 'var(--text-secondary)' }}>{formatDateBR(dep.deposit_date)}</span>
                                                        <span className="font-bold" style={{ color: 'var(--color-success-600)' }}>+{formatCurrency(dep.amount)}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Modal Principal (Criar/Editar) */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md rounded-2xl border p-6 bg-[var(--bg-card)] shadow-lg" style={{ borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-5 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{editing ? 'Editar Reserva' : 'Nova Reserva'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome da Caixinha</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none bg-[var(--bg-input)] text-[var(--text-primary)]" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Meta (R$) (Opcional)</label>
                                    <CurrencyInput value={form.target_amount} onChange={(v) => setForm({ ...form, target_amount: v })}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none bg-[var(--bg-input)] text-[var(--text-primary)]" style={{ borderColor: 'var(--border-primary)' }} />
                                </div>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Saldo Atual</label>
                                    <CurrencyInput value={form.current_amount} onChange={(v) => setForm({ ...form, current_amount: v })} required={editing == null}
                                        className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none bg-[var(--bg-input)] text-[var(--text-primary)]" style={{ borderColor: 'var(--border-primary)' }} />
                                </div>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cor Visual</label>
                                <div className="flex gap-2">
                                    {COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.name ? 'scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex, borderColor: form.color === c.name ? 'var(--text-primary)' : 'transparent' }} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5">{editing ? 'Salvar' : 'Criar'}</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}

            {/* Modal de Depósito */}
            {showAddFunds && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl border p-6 bg-[var(--bg-card)] shadow-lg" style={{ borderColor: 'var(--border-primary)' }}>
                        <h3 className="mb-2 text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Depositar</h3>
                        <p className="text-sm mb-5" style={{ color: 'var(--text-tertiary)' }}>Quantos reais deseja guardar em "{editing?.name}"?</p>
                        <form onSubmit={handleAddFunds} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Valor (R$)</label>
                                <CurrencyInput value={fundsAmount} onChange={(v) => setFundsAmount(v)} required autoFocus placeholder="0,00"
                                    className="w-full rounded-lg border px-4 py-2.5 text-sm outline-none bg-[var(--bg-input)] text-[var(--text-primary)]" style={{ borderColor: 'var(--border-primary)' }} />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">Cancelar</button>
                                <button type="submit" className="btn-primary px-4 py-2.5 bg-success-600 hover:bg-success-700">Confirmar</button>
                            </div>
                        </form>
                    </div>
                </div>, document.body
            )}
        </AppLayout>
    );
}
