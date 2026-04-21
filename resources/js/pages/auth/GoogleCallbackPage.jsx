import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function GoogleCallbackPage() {
    const { fetchUser } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const token = queryParams.get('token');

        if (token) {
            // Salva o token fornecido pela URL do backend
            localStorage.setItem('auth_token', token);
            
            // Força a atualização do estado do usuário no AuthContext
            fetchUser().then(() => {
                navigate('/dashboard');
            });
        } else {
            // Se chegou aqui sem token, joga pro login com erro
            navigate('/login?error=google_auth_failed');
        }
    }, [location, navigate, fetchUser]);

    return (
        <div className="flex h-screen w-full items-center justify-center bg-[var(--bg-primary)]">
            <div className="flex flex-col items-center gap-4">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--color-primary-500)] border-t-transparent" />
                <p className="font-semibold text-[var(--text-secondary)]">Conectando com Google...</p>
            </div>
        </div>
    );
}
