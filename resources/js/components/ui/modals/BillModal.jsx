import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Repeat, CreditCard } from 'lucide-react';
import CurrencyInput from '../CurrencyInput';

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
    lockedType = null     // 'monthly', 'recurring' or null (general hub)
}) {
    // Mode states
    const [isRecurring, setIsRecurring] = useState(lockedType === 'recurring');
    const [isInstallment, setIsInstallment] = useState(false);
    const [installmentMath, setInstallmentMath] = useState('installment_value');

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
                setForm({
                    name_snapshot: '',
                    name: '',
                    expected_amount: '',
                    due_date: '',
                    due_day: '1',
                    category_id: '',
                    notes: '',
                    wallet_id: '',
                    installments_count: '2',
                });
            }
        }
    }, [isOpen, bill, lockedType]);

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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-2xl border p-6 max-h-[90vh] overflow-y-auto shadow-lg" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-lg)' }}>
                <h3 className="mb-5 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    {bill ? 'Editar Conta' : 'Nova Conta'}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Nome */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome da conta</label>
                        <input type="text" value={form.name_snapshot} onChange={(e) => setForm({ ...form, name_snapshot: e.target.value, name: e.target.value })} required placeholder="Ex: Netflix, Aluguel, Conta de luz"
                            className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                    </div>

                    {/* Valor + Vencimento */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {isInstallment && installmentMath === 'total_value' ? 'Valor Total (R$)' : 'Valor (R$)'}
                            </label>
                            <CurrencyInput value={form.expected_amount} onChange={(v) => setForm({ ...form, expected_amount: v })} required placeholder="0,00"
                                className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                        </div>
                        <div>
                            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                {isRecurring || isInstallment ? 'Dia do vencimento' : 'Vencimento'}
                            </label>
                            {isRecurring || isInstallment ? (
                                <select value={isInstallment ? (form.due_date ? String(parseInt(form.due_date.split('-')[2])) : form.due_day) : form.due_day} onChange={(e) => {
                                    const day = e.target.value;
                                    setForm(prev => {
                                        const newForm = { ...prev, due_day: day };
                                        if (isInstallment) {
                                            const dDate = prev.due_date ? new Date(prev.due_date) : new Date();
                                            newForm.due_date = `${dDate.getFullYear()}-${String(dDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                        }
                                        return newForm;
                                    });
                                }} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                                        <option key={d} value={String(d)}>Dia {d}</option>
                                    ))}
                                </select>
                            ) : (
                                <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            )}
                        </div>
                    </div>

                    {/* Installment Options */}
                    {isInstallment && !bill && (
                        <div className="grid grid-cols-2 gap-4 p-4 mt-2 rounded-xl bg-[var(--bg-tertiary)]/30 border" style={{ borderColor: 'var(--color-primary-200)' }}>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Em quantas vezes?</label>
                                <select value={form.installments_count} onChange={(e) => setForm({ ...form, installments_count: e.target.value })} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    {Array.from({ length: 36 }, (_, i) => i + 2).map((num) => (
                                        <option key={num} value={num}>{num}x parcelas</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>O valor digitado é...</label>
                                <select value={installmentMath} onChange={(e) => setInstallmentMath(e.target.value)} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="installment_value">Valor da Parcela</option>
                                    <option value="total_value">Valor Total da Compra</option>
                                </select>
                            </div>
                            {installmentMath === 'total_value' && form.expected_amount && (
                                <div className="col-span-2 text-xs font-medium px-2 py-1 text-[var(--color-primary-600)]">
                                    Valor de cada parcela: {formatCurrency((parseFloat(form.expected_amount) || 0) / parseInt(form.installments_count))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Categoria */}
                    {categories && categories.length > 0 && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Categoria</label>
                            <div className="flex gap-2">
                                <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                                    className="focus-ring flex-1 rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                    <option value="">Sem categoria</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Carteira */}
                    {wallets && wallets.length > 0 && (
                        <div>
                            <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Carteira / Forma de pagamento</label>
                            <select value={form.wallet_id} onChange={(e) => setForm({ ...form, wallet_id: e.target.value })}
                                className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
                                <option value="">Sem carteira vinculada</option>
                                {wallets.map((w) => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Type Selection Hub */}
                    {!bill && lockedType === null && (
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <div
                                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-3 cursor-pointer transition-all"
                                style={{
                                    borderColor: isRecurring && !isInstallment ? 'var(--color-primary-500)' : 'var(--border-primary)',
                                    backgroundColor: isRecurring && !isInstallment ? 'var(--color-primary-50)' : 'var(--bg-card)',
                                }}
                                onClick={() => { setIsRecurring(!isRecurring); setIsInstallment(false); }}
                            >
                                <Repeat size={18} style={{ color: isRecurring && !isInstallment ? 'var(--color-primary-600)' : 'var(--text-tertiary)' }} />
                                <p className="text-sm font-semibold" style={{ color: isRecurring && !isInstallment ? 'var(--color-primary-700)' : 'var(--text-secondary)' }}>Conta Recorrente</p>
                            </div>
                            <div
                                className="flex flex-col items-center justify-center gap-1 rounded-xl border p-3 cursor-pointer transition-all"
                                style={{
                                    borderColor: isInstallment ? 'var(--color-primary-500)' : 'var(--border-primary)',
                                    backgroundColor: isInstallment ? 'var(--color-primary-50)' : 'var(--bg-card)',
                                }}
                                onClick={() => { setIsInstallment(!isInstallment); setIsRecurring(false); }}
                            >
                                <CreditCard size={18} style={{ color: isInstallment ? 'var(--color-primary-600)' : 'var(--text-tertiary)' }} />
                                <p className="text-sm font-semibold" style={{ color: isInstallment ? 'var(--color-primary-700)' : 'var(--text-secondary)' }}>Compra Parcelada</p>
                            </div>
                        </div>
                    )}

                    {/* Notas */}
                    <div>
                        <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Observações (opcional)</label>
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Alguma observação..."
                            className="focus-ring w-full resize-none rounded-lg border px-4 py-2.5 text-sm outline-none"
                            style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                        <button type="submit" className="btn-primary px-4 py-2.5">
                            {bill ? 'Salvar' : 'Criar Conta'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}
