import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { Plus, Tag, Trash2, Pencil } from 'lucide-react';

const COLORS = [
    { name: 'gray', hex: 'var(--color-accent-400)' }, { name: 'red', hex: 'var(--color-danger-500)' },
    { name: 'orange', hex: 'var(--color-warning-600)' }, { name: 'yellow', hex: 'var(--color-warning-500)' },
    { name: 'green', hex: 'var(--color-success-500)' }, { name: 'teal', hex: 'var(--color-primary-400)' },
    { name: 'blue', hex: 'var(--color-primary-500)' }, { name: 'indigo', hex: 'var(--color-primary-600)' },
    { name: 'purple', hex: 'var(--color-accent-500)' }, { name: 'pink', hex: 'var(--color-danger-400)' },
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

    useEffect(() => { fetch(); }, []);

    async function fetch() {
        setLoading(true);
        try { const res = await api.get('/categories'); setCategories(res.data.data); }
        catch (err) { console.error('Erro:', err); } finally { setLoading(false); }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            if (editing) { await api.put(`/categories/${editing.id}`, form); }
            else { await api.post('/categories', form); }
            setShowModal(false); setEditing(null); setForm({ name: '', color: 'blue', icon: '', budget_group: 'needs' }); fetch();
        } catch (err) { console.error('Erro:', err); }
    }

    async function handleDelete(cat) {
        if (!confirm(`Remover a categoria "${cat.name}"?`)) return;
        try { await api.delete(`/categories/${cat.id}`); fetch(); } catch (err) { console.error('Erro:', err); }
    }

    return (
        <AppLayout>
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>Categorias</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-tertiary)' }}>Organize suas contas por categoria</p>
                </div>
                <button onClick={() => { setEditing(null); setForm({ name: '', color: 'blue', icon: '', budget_group: 'needs' }); setShowModal(true); }}
                    className="btn-primary px-4 py-2.5 active:scale-95">
                    <Plus size={18} /> Nova Categoria
                </button>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary-200 border-t-primary-600" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center rounded-xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                    <Tag size={32} style={{ color: 'var(--text-tertiary)' }} />
                    <p className="mt-2 text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhuma categoria criada</p>
                </div>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {categories.map((cat) => (
                        <div key={cat.id} className="rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}>
                            <div className="mb-3 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg"
                                    style={{ backgroundColor: `color-mix(in srgb, ${getColorHex(cat.color)} 20%, transparent)`, color: getColorHex(cat.color) }}>
                                    <Tag size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{cat.name}</h3>
                                        <span className="rounded px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider" style={{
                                            backgroundColor: cat.budget_group === 'needs' ? 'var(--color-danger-50)' : 'var(--color-warning-50)',
                                            color: cat.budget_group === 'needs' ? 'var(--color-danger-600)' : 'var(--color-warning-600)'
                                        }}>
                                            {cat.budget_group === 'needs' ? 'Essencial' : 'Desejo'}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        {(cat.recurring_bills_count || 0)} recorrentes · {(cat.monthly_bills_count || 0)} mensais
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 border-t pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                <button onClick={() => { setEditing(cat); setForm({ name: cat.name, color: cat.color, icon: cat.icon || '', budget_group: cat.budget_group || 'needs' }); setShowModal(true); }}
                                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--bg-hover)]" style={{ color: 'var(--text-secondary)' }}>
                                    <Pencil size={12} /> Editar
                                </button>
                                <button onClick={() => handleDelete(cat)} className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:bg-[var(--color-danger-50)] active:scale-95" style={{ color: 'var(--color-danger-500)' }}>
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
                        <h3 className="mb-4 text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>{editing ? 'Editar Categoria' : 'Nova Categoria'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Nome</label>
                                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-sm outline-none"
                                    style={{ backgroundColor: 'var(--bg-input)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }} />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Grupo de Orçamento</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, budget_group: 'needs' })}
                                        className={`rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-all ${form.budget_group === 'needs' ? 'ring-2 ring-danger-500' : ''}`}
                                        style={{
                                            backgroundColor: form.budget_group === 'needs' ? 'var(--color-danger-50)' : 'var(--bg-card)',
                                            borderColor: form.budget_group === 'needs' ? 'var(--color-danger-200)' : 'var(--border-primary)',
                                            color: form.budget_group === 'needs' ? 'var(--color-danger-600)' : 'var(--text-secondary)',
                                        }}
                                    >
                                        ESSENCIAIS
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm({ ...form, budget_group: 'wants' })}
                                        className={`rounded-lg border px-3 py-2 text-xs font-semibold tracking-wide transition-all ${form.budget_group === 'wants' ? 'ring-2 ring-warning-500' : ''}`}
                                        style={{
                                            backgroundColor: form.budget_group === 'wants' ? 'var(--color-warning-50)' : 'var(--bg-card)',
                                            borderColor: form.budget_group === 'wants' ? 'var(--color-warning-200)' : 'var(--border-primary)',
                                            color: form.budget_group === 'wants' ? 'var(--color-warning-600)' : 'var(--text-secondary)',
                                        }}
                                    >
                                        DESEJOS
                                    </button>
                                </div>
                                <p className="mt-1.5 text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
                                    Isso ajuda o Dashboard a calcular até onde você gastou dentro da regra 50/30/20.
                                </p>
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Cor</label>
                                <div className="flex flex-wrap gap-2">
                                    {COLORS.map((c) => (
                                        <button key={c.name} type="button" onClick={() => setForm({ ...form, color: c.name })}
                                            className={`h-8 w-8 rounded-full border-2 transition-transform ${form.color === c.name ? 'scale-110' : ''}`}
                                            style={{ backgroundColor: c.hex, borderColor: form.color === c.name ? 'var(--text-primary)' : 'transparent' }} />
                                    ))}
                                </div>
                            </div>
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
