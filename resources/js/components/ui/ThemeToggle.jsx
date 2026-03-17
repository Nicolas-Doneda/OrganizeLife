import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className="focus-ring relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 hover:scale-110 active:scale-95"
            style={{
                backgroundColor: 'var(--bg-hover)',
                color: 'var(--text-secondary)',
            }}
            aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
        >
            <div className="transition-transform duration-300" style={{ transform: theme === 'dark' ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                {theme === 'dark' ? (
                    <Sun size={18} strokeWidth={2} />
                ) : (
                    <Moon size={18} strokeWidth={2} />
                )}
            </div>
        </button>
    );
}
