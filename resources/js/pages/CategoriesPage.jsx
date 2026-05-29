import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import useSubmitGuard, { useActionGuard } from '../hooks/useSubmitGuard';
import { Plus, Tag, Trash2, Pencil } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const COLORS = [
    { name: 'gray', hex: 'var(--color-accent-400)' }, { name: 'red', hex: 'var(--color-danger-500)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'green', hex: 'var(--color-success-500)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'indigo', hex: 'var(--color-primary-600)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'pink', hex: 'var(--color-danger-500)' },
    { name: 'rose', hex: '#e11d48' }, { name: 'amber', hex: '#d97706' },
    { name: 'emerald', hex: '#059669' }, { name: 'cyan', hex: '#0891b2' },
    { name: 'sky', hex: '#0284c7' }, { name: 'violet', hex: '#7c3aed' },
];

function getColorHex(name) {
    return COLORS.find((c) => c.name === name)?.hex || '#6b7280';
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', color: 'blue', icon: '', budget_group: 'needs' });
    const { isSubmitting, guard } = useSubmitGuard();
    const { isActionInProgress, guardAction } = useActionGuard();
    const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, category: null });

    useEffect(() => { fetch(); }, []);

    async function fetch() {
        setLoading(true);
        try { const res = await api.get('/categories'); setCategories(res.data.data); }
        catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await guard(async () => {
            try {
                if (editing) { await api.put(`/categories/${editing.id}`, form); }
                else { await api.post('/categories', form); }
                setShowModal(false); setEditing(null); setForm({ name: '', color: 'blue', icon: '', budget_group: 'needs' }); fetch();
            } catch (err) { console.error('Erro:', err); }
        });
    }

    function openDeleteConfirm(cat) {
        setDeleteDialog({ isOpen: true, category: cat });
    }

    async function handleConfirmDelete() {
        const cat = deleteDialog.category;
        if (!cat) return;
        await guardAction(cat.id, async () => {
            try { await api.delete(`/categories/${cat.id}`); fetch(); } catch (err) { console.error('Erro:', err); }
        });
        setDeleteDialog({ isOpen: false, category: null });
    }

    return (
        <AppLayout>
            {/* PageHeader */}
            <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] font-heading">
                            Categorias
                        </h1>
                        <p className="text-sm text-[var(--text-tertiary)] mt-1">
                            Gerencie categorias para classificar despesas e monitorar o orçamento 50/30/20.
                        </p>
                    </div>
                    <div>
                        <button 
                            onClick={() => { setEditing(null); setForm({ name: '', color: 'blue', icon: '', budget_group: 'needs' }); setShowModal(true); }}
                            className="btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-1.5"
                        >
                            <Plus size={16} /> Nova Categoria
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center p-12 border border-[var(--border-primary)] rounded-xl bg-[var(--bg-card)]/50 shadow-sm">
                    <Tag size={36} className="text-[var(--text-tertiary)] mb-4" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Nenhuma categoria encontrada</h3>
                    <p className="text-xs text-[var(--text-tertiary)] max-w-sm mb-5">
                        Crie categorias para organizar seus lançamentos e definir limites saudáveis para seus gastos.
                    </p>
                    <button 
                        onClick={() => { setEditing(null); setForm({ name: '', color: 'blue', icon: '', budget_group: 'needs' }); setShowModal(true); }}
                        className="btn-primary py-2 px-4 text-xs font-semibold"
                    >
                        <Plus size={14} /> Criar Primeira Categoria
                    </button>
                </div>
            ) : (
                <div className="relative border border-[var(--border-primary)] bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 md:p-8 min-h-[400px]">
                    <div className="relative z-10">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {categories.map((cat) => (
                                <div 
                                    key={cat.id} 
                                    className="relative group flex items-stretch transition-all duration-300 hover:-translate-y-0.5" 
                                    style={{ filter: 'drop-shadow(var(--shadow-card))' }}
                                >
                                    {/* Main divider sheet body */}
                                    <div 
                                        className="flex-1 rounded-l-xl border border-r-0 p-5 flex flex-col justify-between"
                                        style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
                                    >
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                                                    {cat.name}
                                                </h3>
                                                <span 
                                                    className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider border"
                                                    style={{
                                                        backgroundColor: cat.budget_group === 'needs' ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                                        borderColor: cat.budget_group === 'needs' ? 'var(--color-danger-200)' : 'var(--color-warning-200)',
                                                        color: cat.budget_group === 'needs' ? 'var(--color-danger-600)' : 'var(--color-warning-600)'
                                                    }}
                                                >
                                                    {cat.budget_group === 'needs' ? 'Essencial' : 'Desejo'}
                                                </span>
                                            </div>
                                            
                                            <p className="mt-3 text-[11px] font-medium text-[var(--text-tertiary)] tracking-wide">
                                                <span className="text-[var(--text-primary)] font-semibold [font-variant-numeric:tabular-nums]">{ (cat.recurring_bills_count || 0) }</span> recorrentes · <span className="text-[var(--text-primary)] font-semibold [font-variant-numeric:tabular-nums]">{ (cat.monthly_bills_count || 0) }</span> mensais
                                            </p>
                                        </div>

                                        <div className="flex gap-2 border-t border-[var(--border-primary)] pt-3 mt-1">
                                            <button 
                                                onClick={() => { setEditing(cat); setForm({ name: cat.name, color: cat.color, icon: cat.icon || '', budget_group: cat.budget_group || 'needs' }); setShowModal(true); }}
                                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-colors hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"
                                            >
                                                <Pencil size={11} /> Editar
                                            </button>
                                            <button 
                                                onClick={() => openDeleteConfirm(cat)} 
                                                disabled={isActionInProgress(cat.id)} 
                                                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold transition-all hover:bg-[var(--color-danger-50)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-danger-500)]"
                                            >
                                                <Trash2 size={11} /> {isActionInProgress(cat.id) ? 'Removendo...' : 'Remover'}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Vertical colored index tab divider */}
                                    <div 
                                        className="w-5 shrink-0 rounded-r-xl border border-l-0 flex flex-col items-center justify-center relative overflow-hidden"
                                        style={{ 
                                            backgroundColor: getColorHex(cat.color), 
                                            borderColor: 'var(--border-primary)',
                                            color: '#fff'
                                        }}
                                    >
                                        <div className="rotate-90 origin-center whitespace-nowrap text-[8px] font-bold uppercase tracking-widest opacity-80 text-white pointer-events-none select-none mix-blend-overlay">
                                            {cat.name.slice(0, 10)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal */}
            {showModal && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div 
                        className="w-full max-w-md rounded-xl border border-[var(--border-primary)] overflow-hidden shadow-xl"
                        style={{ backgroundColor: 'var(--bg-card)', borderTop: '6px solid var(--color-primary-500)' }}
                    >
                        <div className="px-6 py-5 border-b border-[var(--border-primary)] bg-[var(--bg-secondary)]/50">
                            <span className="text-[10px] font-semibold text-[var(--color-primary-600)]">Categoria</span>
                            <h3 className="text-lg font-bold tracking-tight mt-0.5 text-[var(--text-primary)] font-heading">
                                {editing ? 'Editar Categoria' : 'Nova Categoria'}
                            </h3>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            {/* Section 1 */}
                            <div className="space-y-4">
                                <h4 className="text-xs font-bold text-[var(--text-tertiary)] border-b pb-1 border-[var(--border-primary)] font-heading">
                                    Identificação
                                </h4>
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                        Nome da Categoria
                                    </label>
                                    <input 
                                        type="text" 
                                        value={form.name} 
                                        onChange={(e) => setForm({ ...form, name: e.target.value })} 
                                        required
                                        placeholder="Ex: Alimentação, Transporte, Lazer..."
                                        className="focus-ring w-full rounded-lg border px-3.5 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]" 
                                    />
                                </div>
                            </div>

                            {/* Section 2 */}
                            <div className="space-y-4 pt-1">
                                <h4 className="text-xs font-bold text-[var(--text-tertiary)] border-b pb-1 border-[var(--border-primary)] font-heading">
                                    Parâmetro de Orçamento
                                </h4>
                                <div>
                                    <label className="mb-2 block text-xs font-semibold text-[var(--text-secondary)]">
                                        Grupo de Enquadramento
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, budget_group: 'needs' })}
                                            className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${form.budget_group === 'needs' ? 'ring-2 ring-[var(--color-danger-500)]' : ''}`}
                                            style={{
                                                backgroundColor: form.budget_group === 'needs' ? 'var(--color-danger-5)' : 'var(--bg-card)',
                                                borderColor: form.budget_group === 'needs' ? 'var(--color-danger-300)' : 'var(--border-primary)',
                                                color: form.budget_group === 'needs' ? 'var(--color-danger-600)' : 'var(--text-secondary)',
                                            }}
                                        >
                                            Essenciais (Needs)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, budget_group: 'wants' })}
                                            className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-all ${form.budget_group === 'wants' ? 'ring-2 ring-[var(--color-warning-500)]' : ''}`}
                                            style={{
                                                backgroundColor: form.budget_group === 'wants' ? 'var(--color-warning-5)' : 'var(--bg-card)',
                                                borderColor: form.budget_group === 'wants' ? 'var(--color-warning-300)' : 'var(--border-primary)',
                                                color: form.budget_group === 'wants' ? 'var(--color-warning-600)' : 'var(--text-secondary)',
                                            }}
                                        >
                                            Desejos (Wants)
                                        </button>
                                    </div>
                                    <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-tertiary)]">
                                        Necessário para acompanhar a distribuição e regra de orçamento 50/30/20.
                                    </p>
                                </div>
                            </div>

                            {/* Section 3 */}
                            <div className="space-y-4 pt-1">
                                <h4 className="text-xs font-bold text-[var(--text-tertiary)] border-b pb-1 border-[var(--border-primary)] font-heading">
                                    Aparência
                                </h4>
                                <div>
                                    <label className="mb-2.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                        Cor do Separador
                                    </label>
                                    <div className="flex flex-wrap gap-2.5">
                                        {COLORS.map((c) => (
                                            <button 
                                                key={c.name} 
                                                type="button" 
                                                onClick={() => setForm({ ...form, color: c.name })}
                                                className={`h-7 w-7 rounded-full border-2 transition-transform duration-200 hover:scale-115 active:scale-95 ${form.color === c.name ? 'scale-110 shadow-sm border-[var(--text-primary)]' : 'opacity-85 border-transparent'}`}
                                                style={{ 
                                                    backgroundColor: c.hex, 
                                                }} 
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2.5 pt-4 border-t border-[var(--border-primary)]">
                                <button 
                                    type="button" 
                                    onClick={() => setShowModal(false)} 
                                    className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)]"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSubmitting} 
                                    className="btn-primary px-4 py-2 text-xs font-semibold"
                                >
                                    {isSubmitting ? (
                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    ) : (
                                        editing ? 'Salvar' : 'Criar'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
            <ConfirmDialog
                isOpen={deleteDialog.isOpen}
                onClose={() => setDeleteDialog({ isOpen: false, category: null })}
                title="Excluir Categoria"
                description={deleteDialog.category ? `Deseja mesmo remover a categoria "${deleteDialog.category.name}"?` : ''}
                variant="danger"
                confirmLabel="Remover"
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
