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

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isRecoveryMode) {
                await recovery2fa(code);
            } else {
                await verify2fa(code);
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
            <h2 className="mb-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                {isRecoveryMode ? 'Recuperação de Acesso' : 'Verificação em Duas Etapas'}
            </h2>
            <p className="mb-8 text-[15px]" style={{ color: 'var(--text-tertiary)' }}>
                {isRecoveryMode 
                    ? 'Insira um dos seus códigos de recuperação de emergência.'
                    : 'Insira o código de 6 dígitos do seu aplicativo autenticador.'}
            </p>

            {error && (
                <div
                    className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm animate-in"
                    style={{
                        backgroundColor: 'var(--color-danger-50)',
                        borderColor: 'var(--color-danger-500)',
                        color: 'var(--color-danger-600)',
                    }}
                >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        {isRecoveryMode ? 'Código de Recuperação' : 'Código de 6 dígitos'}
                    </label>
                    <input
                        type="text"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder={isRecoveryMode ? "XXXX-XXXX" : "123456"}
                        required
                        className="input-base text-center text-xl tracking-widest font-mono"
                        maxLength={isRecoveryMode ? null : 6}
                    />
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => {
                            setIsRecoveryMode(!isRecoveryMode);
                            setCode('');
                            setError('');
                        }}
                        className="text-sm font-semibold transition-colors"
                        style={{ color: 'var(--color-primary-600)' }}
                    >
                        {isRecoveryMode ? 'Usar código do autenticador' : 'Perdeu acesso ao aplicativo?'}
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={loading || (!isRecoveryMode && code.length < 6)}
                    className="btn-primary w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <ShieldCheck size={18} />
                            Verificar
                        </>
                    )}
                </button>
            </form>
        </AuthLayout>
    );
}
