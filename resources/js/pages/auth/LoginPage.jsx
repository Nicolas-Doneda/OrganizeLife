import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import api from '../../services/api';
import { LogIn, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function LoginPage() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    async function handleGoogleLogin() {
        if (googleLoading) return;
        setGoogleLoading(true);
        try {
            const res = await api.get('/auth/google/url');
            window.location.href = res.data.url;
        } catch (err) {
            setError('Serviço do Google indisponível no momento.');
            setGoogleLoading(false);
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.requires2fa) {
                navigate('/2fa-verify');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <AuthLayout>
            <div className="mb-6">
                <span className="text-[9px] font-mono tracking-widest text-[var(--text-tertiary)] uppercase block mb-1">
                    01 // Autenticação
                </span>
                <h2 className="text-xl font-extrabold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                    Bem-vindo de volta
                </h2>
                <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                    Acesse seu painel contábil para continuar
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
                {/* Email */}
                <div>
                    <label className="mb-2 block text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--text-tertiary)]">
                        01. Endereço de E-mail
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="input-base font-mono text-sm focus-ring"
                    />
                </div>

                {/* Password */}
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-[10px] uppercase font-mono font-bold tracking-wider text-[var(--text-tertiary)]">
                            02. Senha de Acesso
                        </label>
                        <Link
                            to="/forgot-password"
                            className="text-[10px] font-mono font-bold uppercase tracking-wider transition-colors hover:underline"
                            style={{ color: 'var(--color-primary-600)' }}
                        >
                            Esqueceu?
                        </Link>
                    </div>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            required
                            className="input-base pr-10 font-mono text-sm focus-ring"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--text-primary)]"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-xs font-mono uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <LogIn size={14} />
                            Entrar no Sistema
                        </>
                    )}
                </button>
            </form>

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }}></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-mono uppercase tracking-wider">
                    <span className="px-3 bg-[var(--bg-card)] text-[var(--text-tertiary)]">Ou continue com</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                type="button"
                disabled={googleLoading}
                className="flex w-full items-center justify-center gap-3 rounded-xl border py-3.5 text-xs font-mono uppercase tracking-wider transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            >
                {googleLoading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--text-tertiary)]/30 border-t-[var(--text-tertiary)]" />
                ) : (
                    <>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Autenticar com Google
                    </>
                )}
            </button>

            {/* Register link */}
            <p className="mt-8 text-center text-[11px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                Não tem uma conta?{' '}
                <Link to="/register" className="font-bold transition-colors" style={{ color: 'var(--color-primary-600)' }}>
                    Criar conta
                </Link>
            </p>
        </AuthLayout>
    );
}
