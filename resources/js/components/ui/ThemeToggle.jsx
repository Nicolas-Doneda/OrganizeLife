import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors"
            style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
            }}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            {theme === 'dark' ? (
                <Sun size={18} strokeWidth={2} />
            ) : (
                <Moon size={18} strokeWidth={2} />
            )}
        </button>
    );
}
