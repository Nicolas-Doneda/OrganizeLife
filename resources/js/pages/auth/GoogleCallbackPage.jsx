import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

export default function GoogleCallbackPage() {
    const { fetchUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const code = queryParams.get('code');

        if (code) {
            // Faz a troca segura do código temporário pelo token Sanctum final (S4)
            api.post('/auth/google/exchange', { code })
                .then((res) => {
                    const token = res.data.data.token;
                    localStorage.setItem('auth_token', token);
                    return fetchUser();
                })
                .then(() => {
                    navigate('/dashboard');
                })
                .catch((err) => {
                    console.error('Erro na troca de código Google OAuth:', err);
                    navigate('/login?error=google_auth_failed');
                });
        } else {
            // Se chegou aqui sem código, joga pro login com erro
            navigate('/login?error=google_auth_failed');
        }
    }, [location, navigate, fetchUser]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)] overflow-hidden relative">
            {/* Stationery Dot Matrix Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div
                    className="absolute inset-0 opacity-[0.4] dark:opacity-[0.15]"
                    style={{
                        backgroundImage: `radial-gradient(var(--border-primary) 1.5px, transparent 1.5px)`,
                        backgroundSize: '24px 24px',
                    }}
                />
            </div>

            <div className="flex flex-col items-center gap-4 relative z-10">
                <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--color-primary-500)] border-t-transparent" />
                <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-secondary)]">Conectando com o Google...</p>
            </div>
        </div>
    );
}
