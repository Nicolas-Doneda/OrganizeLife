import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layouts/AuthLayout';
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

            <p className="mt-8 text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>
                Já tem uma conta?{' '}
                <Link to="/login" className="font-semibold transition-colors" style={{ color: 'var(--color-primary-600)' }}>
                    Entrar
                </Link>
            </p>
        </AuthLayout>
    );
}
