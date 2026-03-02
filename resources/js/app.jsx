import './bootstrap';
import '../css/app.css';

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import BillsPage from './pages/BillsPage';
import CalendarPage from './pages/CalendarPage';
import CategoriesPage from './pages/CategoriesPage';
import ProfilePage from './pages/ProfilePage';

// Error Boundary para capturar erros silenciosos de render
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, info) {
        console.error('[OrganizeLife] React render error:', error, info);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                    <h2 style={{ color: 'var(--color-danger-600)' }}>Algo deu errado</h2>
                    <p>{this.state.error?.message}</p>
                    <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                        Recarregar
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

function ProtectedRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-secondary)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ width: 40, height: 40, border: '3px solid var(--border-secondary)', borderTopColor: 'var(--color-primary-600)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
}

function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <ThemeProvider>
                    <AuthProvider>
                        <Routes>
                            <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                            <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                            <Route path="/bills" element={<ProtectedRoute><BillsPage /></ProtectedRoute>} />
                            <Route path="/calendar" element={<ProtectedRoute><CalendarPage /></ProtectedRoute>} />
                            <Route path="/categories" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
                            <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                            <Route path="/" element={<Navigate to="/dashboard" replace />} />
                            <Route path="/monthly-bills" element={<Navigate to="/bills" replace />} />
                            <Route path="/recurring-bills" element={<Navigate to="/bills" replace />} />
                            <Route path="/events" element={<Navigate to="/calendar" replace />} />
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                        </Routes>
                    </AuthProvider>
                </ThemeProvider>
            </BrowserRouter>
        </ErrorBoundary>
    );
}

const container = document.getElementById('app');
if (container) {
    try {
        createRoot(container).render(<App />);
    } catch (err) {
        console.error('[OrganizeLife] Failed to mount:', err);
        container.innerHTML = '<p style="padding:2rem;color:red;">Erro ao carregar: ' + err.message + '</p>';
    }
}

