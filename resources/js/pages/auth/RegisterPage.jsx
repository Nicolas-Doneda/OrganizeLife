import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
import api from '../../services/api';
import { UserPlus, Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    async function handleGoogleLogin() {
        try {
            const res = await api.get('/auth/google/url');
            window.location.href = res.data.url;
        } catch (err) {
            setErrors({ general: ['Serviço do Google indisponível no momento.'] });
        }
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setErrors({});
        setLoading(true);

        try {
            await register(name, email, password, passwordConfirmation);
            navigate('/dashboard');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data.errors || {});
            } else {
                setErrors({ general: [err.response?.data?.message || 'Erro ao criar conta.'] });
            }
        } finally {
            setLoading(false);
        }
    }

    function getError(field) {
        return errors[field]?.[0] || '';
    }

    return (
        <AuthLayout>
            <h2 className="mb-1 text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-heading)' }}>
                Criar sua conta
            </h2>
            <p className="mb-8 text-[15px]" style={{ color: 'var(--text-tertiary)' }}>
                Junte-se a nós e centralize sua rotina
            </p>

            {errors.general && (
                <div
                    className="mb-5 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm animate-in"
                    style={{
                        backgroundColor: 'var(--color-danger-50)',
                        borderColor: 'var(--color-danger-500)',
                        color: 'var(--color-danger-600)',
                    }}
                >
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{errors.general[0]}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nome */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Nome
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Seu nome completo"
                        required
                        className="input-base"
                        style={{
                            borderColor: getError('name') ? 'var(--color-danger-500)' : undefined,
                        }}
                    />
                    {getError('name') && (
                        <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>{getError('name')}</p>
                    )}
                </div>

                {/* Email */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        E-mail
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@email.com"
                        required
                        className="input-base"
                        style={{
                            borderColor: getError('email') ? 'var(--color-danger-500)' : undefined,
                        }}
                    />
                    {getError('email') && (
                        <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>{getError('email')}</p>
                    )}
                </div>

                {/* Senha */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Senha
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Mínimo 8 caracteres"
                            required
                            className="input-base pr-10"
                            style={{
                                borderColor: getError('password') ? 'var(--color-danger-500)' : undefined,
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors hover:text-[var(--text-primary)]"
                            style={{ color: 'var(--text-tertiary)' }}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {getError('password') && (
                        <p className="mt-1.5 text-xs font-medium" style={{ color: 'var(--color-danger-500)' }}>{getError('password')}</p>
                    )}
                </div>

                {/* Confirmar senha */}
                <div>
                    <label className="mb-2 block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                        Confirmar senha
                    </label>
                    <input
                        type="password"
                        value={passwordConfirmation}
                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                        placeholder="Repita a senha"
                        required
                        className="input-base"
                    />
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                >
                    {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    ) : (
                        <>
                            <UserPlus size={18} />
                            Criar conta
                        </>
                    )}
                </button>
            </form>

            <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }}></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 font-medium" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-tertiary)' }}>Ou continue com</span>
                </div>
            </div>

            <button
                onClick={handleGoogleLogin}
                type="button"
                className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border py-3 text-[15px] font-semibold transition-all hover:bg-[var(--bg-hover)] active:scale-[0.98]"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)' }}
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continuar com Google
            </button>

            <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Já tem uma conta?{' '}
                <Link to="/login" className="font-semibold transition-colors" style={{ color: 'var(--color-primary-600)' }}>
                    Entrar
                </Link>
            </p>
        </AuthLayout>
    );
}
