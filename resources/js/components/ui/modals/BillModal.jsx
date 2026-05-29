import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Repeat, CreditCard, X } from 'lucide-react';
import CurrencyInput from '../CurrencyInput';
import api from '../../../services/api';

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

export default function BillModal({
    isOpen,
    onClose,
    onSave,
    bill = null,          // if editing
    categories = [],
    wallets = [],
    lockedType = null,    // 'monthly', 'recurring' or null (general hub)
    submitting = false,   // controlled by parent's useSubmitGuard
    defaultYear = new Date().getFullYear(),
    defaultMonth = new Date().getMonth() + 1,
    onCategoryCreated = null,
    onWalletCreated = null,
}) {
    // Mode states
    const [isRecurring, setIsRecurring] = useState(lockedType === 'recurring');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentMath, setInstallmentMath] = useState('installment_value');

    // Quick create states
    const [quickCategoryName, setQuickCategoryName] = useState('');
    const [showQuickCategory, setShowQuickCategory] = useState(false);
    const [quickWalletName, setQuickWalletName] = useState('');
    const [showQuickWallet, setShowQuickWallet] = useState(false);

    async function handleQuickCategorySave() {
        if (!quickCategoryName.trim()) return;
        try {
            const res = await api.post('/categories', {
                name: quickCategoryName.trim(),
                color: 'blue',
                icon: 'tag',
                budget_group: 'needs'
            });
            setShowQuickCategory(false);
            setQuickCategoryName('');
            if (onCategoryCreated) {
                await onCategoryCreated(res.data.data.id);
                setForm(prev => ({ ...prev, category_id: String(res.data.data.id) }));
            }
        } catch (err) {
            console.error('Erro ao criar categoria rápida:', err);
        }
    }

    async function handleQuickWalletSave() {
        if (!quickWalletName.trim()) return;
        try {
            const res = await api.post('/wallets', {
                name: quickWalletName.trim(),
                type: 'checking',
                color: 'blue',
                icon: 'wallet',
                balance: 0
            });
            setShowQuickWallet(false);
            setQuickWalletName('');
            if (onWalletCreated) {
                await onWalletCreated(res.data.data.id);
                setForm(prev => ({ ...prev, wallet_id: String(res.data.data.id) }));
            }
        } catch (err) {
            console.error('Erro ao criar carteira rápida:', err);
        }
    }

    // Form state matching the heavy payload
    const [form, setForm] = useState({
        name_snapshot: '',
        name: '', // Some endpoints use name, some name_snapshot
        expected_amount: '',
        due_date: '',
        due_day: '1',
        category_id: '',
        notes: '',
        wallet_id: '',
        installments_count: '2',
    });

    // Populate data when opening
    useEffect(() => {
        if (isOpen) {
            setIsInstallment(false);
            if (lockedType === 'recurring') {
                setIsRecurring(true);
            } else if (lockedType === 'monthly') {
                setIsRecurring(false);
            } else {
                setIsRecurring(false);
            }

            if (bill) {
                // Determine if it was recurring or is currently recurring logic context
                const isRec = !!bill.recurring_bill_id || lockedType === 'recurring';
                if (!lockedType) setIsRecurring(isRec);

                setForm({
                    name_snapshot: bill.name_snapshot || bill.name || '',
                    name: bill.name || bill.name_snapshot || '',
                    expected_amount: bill.expected_amount || '',
                    due_date: bill.due_date ? bill.due_date.substring(0, 10) : '',
                    due_day: bill.due_day || '1',
                    category_id: bill.category_id || '',
                    notes: bill.notes || '',
                    wallet_id: bill.wallet_id || '',
                    installments_count: '2',
                });
            } else {
                const today = new Date();
                let defaultDay = '1';
                if (today.getFullYear() === defaultYear && (today.getMonth() + 1) === defaultMonth) {
                    defaultDay = String(today.getDate());
                }
                const initialDueDate = `${defaultYear}-${String(defaultMonth).padStart(2, '0')}-${defaultDay.padStart(2, '0')}`;

                setForm({
                    name_snapshot: '',
                    name: '',
                    expected_amount: '',
                    due_date: initialDueDate,
                    due_day: defaultDay,
                    category_id: '',
                    notes: '',
                    wallet_id: '',
                    installments_count: '2',
                });
            }
        }
    }, [isOpen, bill, lockedType, defaultYear, defaultMonth]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Unify name_snapshot and name internally for the handler
        const payload = { ...form };
        if (!payload.name) payload.name = payload.name_snapshot;
        if (!payload.name_snapshot) payload.name_snapshot = payload.name;

        onSave({ payload, isRecurring, isInstallment, installmentMath });
    };

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-xl max-h-[90vh] flex flex-col bg-[var(--bg-card)]">
                
                <div className="px-6 py-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50 flex items-center justify-between">
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)]">
                            Despesa
                        </span>
                        <h3 className="text-lg font-bold tracking-tight mt-1 text-[var(--text-primary)] font-heading">
                            {bill ? 'Editar Conta' : 'Nova Conta'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
                    {/* Seção 1: Identificação da Despesa */}
                    <div className="space-y-4">
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Descrição da Conta</label>
                            <input type="text" value={form.name_snapshot} onChange={(e) => setForm({ ...form, name_snapshot: e.target.value, name: e.target.value })} required placeholder="Ex: Netflix, Aluguel, Conta de luz"
                                className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-medium" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                    {isInstallment && installmentMath === 'total_value' ? 'Valor Total (R$)' : 'Valor da Parcela (R$)'}
                                </label>
                                <CurrencyInput value={form.expected_amount} onChange={(v) => setForm({ ...form, expected_amount: v })} required placeholder="0,00"
                                    className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold tabular-nums" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                    {isRecurring || isInstallment ? 'Dia do Vencimento' : 'Vencimento'}
                                </label>
                                {isRecurring || isInstallment ? (
                                    <select value={isInstallment ? (form.due_date ? String(parseInt(form.due_date.split('-')[2])) : form.due_day) : form.due_day} onChange={(e) => {
                                        const day = e.target.value;
                                        setForm(prev => {
                                            const newForm = { ...prev, due_day: day };
                                            if (isInstallment || isRecurring) {
                                                let y, m;
                                                if (prev.due_date) {
                                                    const parts = prev.due_date.split('-');
                                                    y = parseInt(parts[0]);
                                                    m = parseInt(parts[1]);
                                                } else {
                                                    y = defaultYear;
                                                    m = defaultMonth;
                                                }
                                                newForm.due_date = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            }
                                            return newForm;
                                        });
                                    }} required
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                            <option key={d} value={String(d)} style={{ color: 'var(--text-primary)' }}>Dia {d}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <input type="date" value={form.due_date} onChange={(e) => {
                                        const dStr = e.target.value;
                                        let day = '1';
                                        if (dStr) {
                                            const parts = dStr.split('-');
                                            if (parts[2]) day = String(parseInt(parts[2]));
                                        }
                                        setForm({ ...form, due_date: dStr, due_day: day });
                                    }} required
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-medium" />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Classificação & Destino */}
                    <div className="space-y-4 pt-1">
                        {/* Categoria */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)]">Categoria</label>
                                <button type="button" onClick={() => setShowQuickCategory(!showQuickCategory)} className="text-[10px] font-bold text-[var(--color-primary-600)] hover:underline">
                                    {showQuickCategory ? 'Cancelar' : '+ Nova Categoria'}
                                </button>
                            </div>
                            {showQuickCategory && (
                                <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input type="text" value={quickCategoryName} onChange={(e) => setQuickCategoryName(e.target.value)} placeholder="Nome da categoria"
                                        className="focus-ring flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" />
                                    <button type="button" onClick={handleQuickCategorySave} className="btn-primary px-3 py-1.5 text-xs active:scale-95">
                                        Salvar
                                    </button>
                                </div>
                            )}
                            <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                style={{ color: 'var(--text-primary)' }}>
                                <option value="" style={{ color: 'var(--text-primary)' }}>Sem categoria</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id} style={{ color: 'var(--text-primary)' }}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Carteira */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-[var(--text-secondary)]">Carteira / Forma de pagamento</label>
                                <button type="button" onClick={() => setShowQuickWallet(!showQuickWallet)} className="text-[10px] font-bold text-[var(--color-primary-600)] hover:underline">
                                    {showQuickWallet ? 'Cancelar' : '+ Nova Carteira'}
                                </button>
                            </div>
                            {showQuickWallet && (
                                <div className="flex gap-2 mb-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                    <input type="text" value={quickWalletName} onChange={(e) => setQuickWalletName(e.target.value)} placeholder="Nome da carteira"
                                        className="focus-ring flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" />
                                    <button type="button" onClick={handleQuickWalletSave} className="btn-primary px-3 py-1.5 text-xs active:scale-95">
                                        Salvar
                                    </button>
                                </div>
                            )}
                            <select value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
                                className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                style={{ color: 'var(--text-primary)' }}>
                                <option value="" style={{ color: 'var(--text-primary)' }}>Sem carteira vinculada</option>
                                {wallets.map((w) => (
                                    <option key={w.id} value={w.id} style={{ color: 'var(--text-primary)' }}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Seção 3: Planejamento Temporal */}
                    <div className="space-y-4 pt-1">
                        {/* Type Selection Hub */}
                        {!bill && lockedType === null && (
                            <div className="grid grid-cols-2 gap-3">
                                <div
                                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 cursor-pointer transition-all active:scale-95"
                                    style={{
                                        borderColor: isRecurring && !isInstallment ? 'var(--color-primary-500)' : 'var(--border-primary)',
                                        backgroundColor: isRecurring && !isInstallment ? 'color-mix(in srgb, var(--color-primary-500) 8%, var(--bg-card))' : 'var(--bg-card)',
                                    }}
                                    onClick={() => { setIsRecurring(!isRecurring); setIsInstallment(false); }}
                                >
                                    <Repeat size={16} style={{ color: isRecurring && !isInstallment ? 'var(--color-primary-600)' : 'var(--text-tertiary)' }} />
                                    <p className="text-xs font-semibold" style={{ color: isRecurring && !isInstallment ? 'var(--color-primary-700)' : 'var(--text-secondary)' }}>Frequente (Mensal)</p>
                                </div>
                                <div
                                    className="flex flex-col items-center justify-center gap-1.5 rounded-xl border p-3.5 cursor-pointer transition-all active:scale-95"
                                    style={{
                                        borderColor: isInstallment ? 'var(--color-primary-500)' : 'var(--border-primary)',
                                        backgroundColor: isInstallment ? 'color-mix(in srgb, var(--color-primary-500) 8%, var(--bg-card))' : 'var(--bg-card)',
                                    }}
                                    onClick={() => { setIsInstallment(!isInstallment); setIsRecurring(false); }}
                                >
                                    <CreditCard size={16} style={{ color: isInstallment ? 'var(--color-primary-600)' : 'var(--text-tertiary)' }} />
                                    <p className="text-xs font-semibold" style={{ color: isInstallment ? 'var(--color-primary-700)' : 'var(--text-secondary)' }}>Compra Parcelada</p>
                                </div>
                            </div>
                        )}

                        {/* Installment Options */}
                        {isInstallment && !bill && (
                            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-lg bg-[var(--bg-secondary)]/50 border border-[var(--border-primary)]">
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Parcelas</label>
                                    <select value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} required
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                        style={{ color: 'var(--text-primary)' }}>
                                        {Array.from({ length: 35 }, (_, i) => i + 2).map((num) => (
                                            <option key={num} value={num} style={{ color: 'var(--text-primary)' }}>{num}x parcelas</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-semibold text-[var(--text-secondary)]">Tipo de Valor</label>
                                    <select value={installmentMath} onChange={(e) => setInstallmentMath(e.target.value)} required
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)] font-semibold"
                                        style={{ color: 'var(--text-primary)' }}>
                                        <option value="installment_value" style={{ color: 'var(--text-primary)' }}>Valor da Parcela</option>
                                        <option value="total_value" style={{ color: 'var(--text-primary)' }}>Valor Total da Compra</option>
                                    </select>
                                </div>
                                {installmentMath === 'total_value' && form.expected_amount && (
                                    <div className="col-span-2 text-[10px] font-semibold text-[var(--color-primary-600)] text-right tabular-nums">
                                        Valor estimado por parcela: {formatCurrency((parseFloat(form.expected_amount) || 0) / parseInt(form.installments_count))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notas */}
                        <div>
                            <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">Observações (opcional)</label>
                            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Observações ou detalhes adicionais..."
                                className="focus-ring w-full resize-none rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" />
                        </div>
                    </div>
                </form>

                {/* Botões de Ação */}
                <div className="flex justify-end gap-2.5 p-5 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                    <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]">Cancelar</button>
                    <button type="button" onClick={(e) => handleSubmit(e)} disabled={submitting} className="btn-primary px-4 py-2 text-xs font-semibold active:scale-95 disabled:opacity-50">
                        {submitting ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        ) : (
                            bill ? 'Confirmar' : 'Salvar'
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
