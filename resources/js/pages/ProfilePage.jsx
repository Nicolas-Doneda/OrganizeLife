import { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AppLayout from '../components/layouts/AppLayout';
import api from '../services/api';
import { User, Camera, Save, Check, Upload, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ConfirmDialog from '../components/ui/ConfirmDialog';

const AVATAR_COLORS = [
    '#059669', '#e11d48', '#d97706', '#16a34a', '#0ea5e9',
    '#78716c', '#dc2626', '#3b82f6', '#ea580c', '#34d399',
    '#f43f5e', '#f59e0b', '#10b981', '#0891b2', '#0284c7', '#7c3aed',
];

function isImageAvatar(avatar) {
    return avatar && !avatar.startsWith('#') && avatar.length > 7;
}

export default function ProfilePage() {
    const { user, fetchUser } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [budgetNeeds, setBudgetNeeds] = useState(user?.budget_needs_percent ?? 50);
    const [budgetWants, setBudgetWants] = useState(user?.budget_wants_percent ?? 30);
    const [budgetSavings, setBudgetSavings] = useState(user?.budget_savings_percent ?? 20);
    const [avatarColor, setAvatarColor] = useState(
        isImageAvatar(user?.avatar) ? '#6366f1' : (user?.avatar || '#6366f1')
    );
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(
        isImageAvatar(user?.avatar) ? (user?.avatar_url ?? null) : null
    );
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);
    const [twoFaData, setTwoFaData] = useState(null);
    const [twoFaCode, setTwoFaCode] = useState('');
    const [twoFaLoading, setTwoFaLoading] = useState(false);
    const [disableTwoFaDialog, setDisableTwoFaDialog] = useState(false);

    async function handleEnable2FA() {
        if (twoFaLoading) return;
        setTwoFaLoading(true);
        try {
            setError('');
            const res = await api.post('/auth/2fa/enable');
            setTwoFaData(res.data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao ativar 2FA.');
        } finally {
            setTwoFaLoading(false);
        }
    }

    async function handleConfirm2FA() {
        if (twoFaLoading) return;
        setTwoFaLoading(true);
        try {
            setError('');
            await api.post('/auth/2fa/confirm', { code: twoFaCode });
            setTwoFaData(null);
            setTwoFaCode('');
            await fetchUser();
        } catch (err) {
            setError(err.response?.data?.message || 'Codigo invalido.');
        } finally {
            setTwoFaLoading(false);
        }
    }

    function triggerDisable2FA() {
        setDisableTwoFaDialog(true);
    }

    async function handleConfirmDisable2FA(password) {
        if (twoFaLoading) return;
        setTwoFaLoading(true);
        try {
            setError('');
            await api.delete('/auth/2fa/disable', { data: { password } });
            await fetchUser();
            setDisableTwoFaDialog(false);
        } catch (err) {
            setError(err.response?.data?.message || 'Senha incorreta.');
        } finally {
            setTwoFaLoading(false);
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            setError('A imagem deve ter no maximo 2MB.');
            return;
        }

        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => setAvatarPreview(reader.result);
        reader.readAsDataURL(file);
        setError('');
    }

    function removeImage() {
        setAvatarFile(null);
        setAvatarPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }

    async function handleSave(e) {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSaved(false);

        try {
            if (avatarFile) {
                // Upload com FormData
                const formData = new FormData();
                formData.append('_method', 'PUT');
                formData.append('name', name);
                formData.append('avatar', avatarFile);
                formData.append('budget_needs_percent', budgetNeeds);
                formData.append('budget_wants_percent', budgetWants);
                formData.append('budget_savings_percent', budgetSavings);
                await api.post('/auth/profile', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.put('/auth/profile', {
                    name,
                    avatar: avatarPreview ? undefined : avatarColor,
                    budget_needs_percent: budgetNeeds,
                    budget_wants_percent: budgetWants,
                    budget_savings_percent: budgetSavings,
                });
            }
            await fetchUser();
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao salvar.');
        } finally {
            setSaving(false);
        }
    }

    return (
        <AppLayout>
            <div className="mx-auto max-w-2xl">
                {/* PageHeader */}
                <div className="mb-6 pb-6 border-b border-[var(--border-primary)]">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mt-3">
                        <div>
                            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] font-heading">
                                Configurações e Perfil
                            </h1>
                            <p className="text-sm text-[var(--text-tertiary)] mt-1.5 font-medium">
                                Ajuste suas informações básicas, distribua suas metas do orçamento e gerencie suas preferências de segurança.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {/* Avatar: Identidade Visual / Sticker */}
                    <div 
                        className="relative rounded-2xl border p-6 bg-[var(--bg-card)] shadow-sm overflow-hidden" 
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <div className="mt-2">
                            <h2 className="text-sm font-bold text-[var(--text-secondary)] border-b pb-1.5 border-[var(--border-primary)] mb-4 font-heading">
                                Foto de Perfil
                            </h2>
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                                {/* Avatar Preview styled as a scrapbook photo patch */}
                                <div className="relative shrink-0 group">
                                    <div className="p-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-lg shadow-inner">
                                        {avatarPreview ? (
                                            <div className="relative">
                                                <img
                                                    src={avatarPreview}
                                                    alt="Avatar"
                                                    className="h-20 w-20 rounded-md object-cover border border-[var(--border-primary)]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={removeImage}
                                                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-danger-500)] text-white shadow-md hover:bg-[var(--color-danger-600)] transition-colors"
                                                >
                                                    <X size={10} />
                                                </button>
                                            </div>
                                        ) : (
                                            <div
                                                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md text-2xl font-bold text-white shadow-md font-heading"
                                                style={{ backgroundColor: avatarColor }}
                                            >
                                                {name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--color-primary-600)] shadow-md hover:bg-[var(--bg-hover)] transition-all active:scale-90"
                                    >
                                        <Camera size={12} />
                                    </button>
                                </div>

                                <div className="flex-1 text-center sm:text-left">
                                    {/* Upload button */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="mb-2.5 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors hover:bg-[var(--bg-hover)]"
                                        style={{ borderColor: 'var(--border-primary)', color: 'var(--color-primary-600)', backgroundColor: 'var(--bg-card)' }}
                                    >
                                        <Upload size={13} />
                                        Carregar Fotografia
                                    </button>
                                    <p className="mb-4 text-xs text-[var(--text-tertiary)] font-medium">
                                        Formatos recomendados: JPG, PNG ou WebP (máx. 2MB).
                                    </p>

                                    {/* Color fallback */}
                                    {!avatarPreview && (
                                        <div className="border-t border-dashed pt-3" style={{ borderColor: 'var(--border-primary)' }}>
                                            <p className="mb-2.5 text-xs font-semibold text-[var(--text-secondary)]">Ou selecione uma cor</p>
                                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                                {AVATAR_COLORS.map((color) => (
                                                    <button
                                                        key={color}
                                                        type="button"
                                                        onClick={() => setAvatarColor(color)}
                                                        className={`h-6 w-6 rounded-full border transition-transform duration-155 hover:scale-110 active:scale-95 ${avatarColor === color ? 'scale-110 ring-2 ring-[var(--color-primary-400)]' : 'opacity-80'}`}
                                                        style={{
                                                            backgroundColor: color,
                                                            borderColor: avatarColor === color ? 'var(--text-primary)' : 'transparent',
                                                        }}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Informações de Cadastro */}
                    <div 
                        className="rounded-2xl border p-6 bg-[var(--bg-card)] shadow-sm" 
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <h2 className="text-sm font-bold text-[var(--text-secondary)] border-b pb-1.5 border-[var(--border-primary)] mb-4 font-heading">
                            Dados Pessoais
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                    Nome Completo
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                    className="focus-ring w-full rounded-lg border px-4 py-2.5 text-xs outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-xs font-semibold text-[var(--text-secondary)]">
                                    Endereço de E-mail
                                </label>
                                <input
                                    type="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="w-full rounded-lg border px-4 py-2.5 text-xs opacity-60 tracking-wide [font-variant-numeric:tabular-nums]"
                                    style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                                />
                                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>
                                    ✓ Este endereço é fixo por questões de segurança.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Regra de Orçamento */}
                    <div 
                        className="rounded-2xl border p-6 bg-[var(--bg-card)] shadow-sm" 
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <h2 className="text-sm font-bold text-[var(--text-secondary)] border-b pb-1.5 border-[var(--border-primary)] mb-2 font-heading">
                            Regra de Orçamento ({budgetNeeds}/{budgetWants}/{budgetSavings})
                        </h2>
                        <p className="mb-6 text-[11px] leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                            Defina os limites de repartição para a regra 50/30/20. O acumulado das porcentagens deve atingir exatamente 100%.
                        </p>
                        
                        <div className="space-y-6">
                            {/* Needs */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-primary-500)]" />
                                        Gastos Essenciais (Needs)
                                    </label>
                                    <span className="text-xs font-extrabold text-[var(--color-primary-600)] px-2 py-0.5 rounded border border-[var(--color-primary-200)] bg-[var(--color-primary-50)] [font-variant-numeric:tabular-nums]">
                                        {budgetNeeds}%
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={budgetNeeds} 
                                    onChange={(e) => setBudgetNeeds(parseInt(e.target.value))} 
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-primary-600)]" 
                                />
                                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Aluguel, contas básicas, alimentação, transporte, saúde.</p>
                            </div>
                            
                            {/* Wants */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-warning-500)]" />
                                        Estilo de Vida (Wants)
                                    </label>
                                    <span className="text-xs font-extrabold text-[var(--color-warning-600)] px-2 py-0.5 rounded border border-[var(--color-warning-200)] bg-[var(--color-warning-50)] [font-variant-numeric:tabular-nums]">
                                        {budgetWants}%
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={budgetWants} 
                                    onChange={(e) => setBudgetWants(parseInt(e.target.value))} 
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-warning-600)]" 
                                />
                                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Lazer, jantares fora, hobbies, assinaturas digitais.</p>
                            </div>
                            
                            {/* Savings */}
                            <div>
                                <div className="flex justify-between mb-1.5">
                                    <label className="text-xs font-bold text-[var(--text-secondary)] flex items-center gap-1.5">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--color-success-500)]" />
                                        Reserva & Investimentos (Savings)
                                    </label>
                                    <span className="text-xs font-extrabold text-[var(--color-success-600)] px-2 py-0.5 rounded border border-[var(--color-success-200)] bg-[var(--color-success-50)] [font-variant-numeric:tabular-nums]">
                                        {budgetSavings}%
                                    </span>
                                </div>
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={budgetSavings} 
                                    onChange={(e) => setBudgetSavings(parseInt(e.target.value))} 
                                    className="w-full h-1.5 bg-[var(--bg-input)] rounded-lg appearance-none cursor-pointer accent-[var(--color-success-500)]" 
                                />
                                <p className="mt-1.5 text-[10px]" style={{ color: 'var(--text-tertiary)' }}>Reserva financeira, investimentos de longo prazo, quitação de dívidas.</p>
                            </div>

                            {budgetNeeds + budgetWants + budgetSavings !== 100 && (
                                <div className="rounded-lg border px-4 py-3 text-xs font-semibold" style={{ backgroundColor: 'var(--color-danger-50)', borderColor: 'var(--color-danger-200)', color: 'var(--color-danger-600)' }}>
                                    A soma atual é {(budgetNeeds + budgetWants + budgetSavings)}% (o total deve ser exatamente 100%).
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Conta - 2FA */}
                    <div 
                        className="rounded-2xl border p-6 bg-[var(--bg-card)] shadow-sm" 
                        style={{ borderColor: 'var(--border-primary)' }}
                    >
                        <h2 className="text-sm font-bold text-[var(--text-secondary)] border-b pb-1.5 border-[var(--border-primary)] mb-4 font-heading">
                            Segurança de Acesso
                        </h2>

                        {/* Estado: 2FA desativado */}
                        {!user?.two_factor_enabled && !twoFaData && (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
                                <div>
                                    <p className="text-xs font-bold text-[var(--text-primary)]">Proteção Adicional de Acesso (2FA)</p>
                                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                        Adicione uma segunda camada de segurança solicitando código temporário via Google Authenticator.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleEnable2FA}
                                    disabled={saving || twoFaLoading}
                                    className="btn-primary px-4 py-2 text-xs font-semibold shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {twoFaLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Ativar 2FA'}
                                </button>
                            </div>
                        )}

                        {/* Estado: QR Code gerado, aguardando confirmacao */}
                        {twoFaData && (
                            <div className="space-y-4">
                                <div className="rounded-lg border p-4 bg-[var(--bg-secondary)]/50 border-dashed" style={{ borderColor: 'var(--border-primary)' }}>
                                    <p className="mb-4 text-xs font-semibold text-[var(--text-secondary)]">
                                        1. Escaneie o código bidimensional abaixo no aplicativo autenticador:
                                    </p>
                                    <div className="flex justify-center mb-5">
                                        <div className="rounded-xl bg-white p-4 shadow-sm border">
                                            <QRCodeSVG
                                                value={twoFaData.otpauth_url}
                                                size={160}
                                                level="M"
                                                includeMargin={false}
                                            />
                                        </div>
                                    </div>
                                    <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                                        Ou registre a chave secreta manualmente:
                                    </p>
                                    <div className="flex items-center gap-2 rounded-lg border px-3 py-2.5 mb-5" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-input)' }}>
                                        <code className="flex-1 text-[11px] break-all font-mono text-[var(--text-secondary)] select-all">
                                            {twoFaData.secret}
                                        </code>
                                        <button 
                                            type="button" 
                                            onClick={() => { navigator.clipboard.writeText(twoFaData.secret); }}
                                            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold bg-[var(--bg-card)] border border-[var(--border-primary)] hover:bg-[var(--bg-hover)] transition-colors"
                                            style={{ color: 'var(--color-primary-600)' }}
                                        >
                                            Copiar
                                        </button>
                                    </div>
                                    
                                    <p className="mb-2 text-xs font-semibold text-[var(--text-secondary)]">
                                        2. Digite o código temporário gerado no aplicativo:
                                    </p>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={6}
                                            value={twoFaCode}
                                            onChange={(e) => setTwoFaCode(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="focus-ring w-32 rounded-lg border px-4 py-2 text-sm text-center font-mono tracking-widest outline-none bg-[var(--bg-input)] text-[var(--text-primary)] border-[var(--border-primary)]"
                                        />
                                        <button 
                                            type="button" 
                                            onClick={handleConfirm2FA} 
                                            disabled={twoFaCode.length !== 6 || twoFaLoading}
                                            className="rounded-lg bg-[var(--color-primary-600)] px-4 py-2 text-xs font-semibold text-white hover:bg-[var(--color-primary-700)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {twoFaLoading ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : 'Confirmar'}
                                        </button>
                                    </div>
                                </div>

                                {/* Codigos de recuperacao */}
                                <div className="rounded-lg border p-4 border-l-4" style={{ borderColor: 'var(--color-warning-300)', backgroundColor: 'var(--color-warning-50)' }}>
                                    <p className="mb-2.5 text-xs font-semibold text-[var(--color-warning-700)]">
                                        ⚠️ Salve os códigos de segurança reserva em local físico ou protegido:
                                    </p>
                                    <div className="grid grid-cols-2 gap-2">
                                        {twoFaData.recovery_codes?.map((code, i) => (
                                            <code key={i} className="text-xs font-mono text-[var(--color-warning-800)] bg-[var(--color-warning-100)]/40 px-2 py-0.5 rounded text-center border border-[var(--color-warning-200)]">
                                                {code}
                                            </code>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Estado: 2FA ativo */}
                        {user?.two_factor_enabled && !twoFaData && (
                            <div className="flex items-center justify-between py-2">
                                <div>
                                    <p className="text-xs font-bold text-[var(--color-success-600)] flex items-center gap-1.5">
                                        <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success-500)]" />
                                        Segurança Avançada Ativa
                                    </p>
                                    <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                                        Sua credencial de login está protegida por verificação em duas etapas.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={triggerDisable2FA}
                                    disabled={twoFaLoading}
                                    className="rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ borderColor: 'var(--color-danger-300)', color: 'var(--color-danger-500)' }}
                                >
                                    {twoFaLoading ? 'Desativando...' : 'Desativar 2FA'}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Error Display */}
                    {error && (
                        <div className="rounded-lg border px-4 py-3 text-xs font-medium" style={{ backgroundColor: 'var(--color-danger-50)', borderColor: 'var(--color-danger-200)', color: 'var(--color-danger-600)' }}>
                            Ocorreu um erro: {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={saving}
                            className="btn-primary px-6 py-3 text-xs font-semibold disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                            ) : saved ? (
                                <Check size={14} strokeWidth={2.5} />
                            ) : (
                                <Save size={14} />
                            )}
                            {saved ? 'Alterações Salvas!' : 'Salvar Preferências'}
                        </button>
                    </div>
                </form>
            </div>
            <ConfirmDialog
                isOpen={disableTwoFaDialog}
                onClose={() => setDisableTwoFaDialog(false)}
                title="Desativar verificação em duas etapas"
                description="Digite sua senha para confirmar esta alteração de segurança."
                variant="credential"
                confirmLabel="Desativar 2FA"
                onConfirm={handleConfirmDisable2FA}
                loading={twoFaLoading}
            />
        </AppLayout>
    );
}
