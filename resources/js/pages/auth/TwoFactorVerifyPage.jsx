import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export default function TwoFactorVerifyPage() {
    const { verify2fa, recovery2fa } = useAuth();
    const navigate = useNavigate();
    
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecoveryMode, setIsRecoveryMode] = useState(false);
    const [remember, setRemember] = useState(false);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRecoveryMode) {
                await recovery2fa(code, remember);
            } else {
                await verify2fa(code, remember);
            }
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Código inválido. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout>
            <div className="mb-6">
                <h2 className="text-xl font-extrabold tracking-tight font-heading text-[var(--text-primary)]">
                    {isRecoveryMode ? 'Código de Emergência' : 'Verificação de Identidade'}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                    {isRecoveryMode 
                        ? 'Insira um dos seus códigos de recuperação impressos.'
                        : 'Insira o código temporário de 6 dígitos gerado pelo seu app.'}
                </p>
            </div>

            {error && (
                <div
                    className="mb-5 flex items-center gap-2.5 rounded-xl px-4 py-3 text-xs font-mono animate-in"
                    style={{
                        backgroundColor: 'var(--color-danger-50)',
                        border: '2px double var(--color-danger-500)',
                        color: 'var(--color-danger-600)',
                    }}
                >
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="mb-2 block text-xs font-semibold tracking-wide text-[var(--text-secondary)]">
                        {isRecoveryMode ? 'Código de Recuperação' : 'Código Verificador'}
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={isRecoveryMode ? "XXXX-XXXX" : "123456"}
                        required
                        className="input-base text-center text-xl tracking-widest font-mono focus-ring"
                        maxLength={isRecoveryMode ? null : 6}
                    />
                </div>

                <div className="flex items-center gap-2 py-1">
                    <input
                        type="checkbox"
                        id="remember"
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--border-primary)] bg-[var(--bg-card)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)] focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="remember" className="text-xs font-mono uppercase tracking-wider cursor-pointer select-none text-[var(--text-secondary)]">
                        Confiar neste dispositivo por 30 dias
                    </label>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRecoveryMode(!isRecoveryMode);
                            setCode('');
                            setError('');
                        }}
                        className="text-[10px] font-mono uppercase font-bold tracking-wider transition-colors hover:underline"
                        style={{ color: 'var(--color-primary-600)' }}
                    >
                        {isRecoveryMode ? 'Usar código do autenticador' : 'Perdeu acesso ao aplicativo?'}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading || (!isRecoveryMode && code.length < 6)}
                    className="btn-primary w-full py-3 text-xs font-mono uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <ShieldCheck size={14} />
                            Confirmar Acesso
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
