import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, Repeat, X, ShieldAlert, Key, Loader2 } from 'lucide-react';

export default function ConfirmDialog({
    isOpen,
    onClose,
    title,
    description,
    variant = 'danger',
    confirmLabel,
    cancelLabel = 'Cancelar',
    onConfirm,
    choices = [],
    loading = false,
}) {
    const modalRef = useRef(null);
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setPassword('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && !loading) {
                onClose();
            }
            if (e.key === 'Tab') {
                const focusableElements = modalRef.current?.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (!focusableElements || focusableElements.length === 0) return;
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        lastElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        firstElement.focus();
                        e.preventDefault();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Autofocus first logical element
        setTimeout(() => {
            const input = modalRef.current?.querySelector('input[type="password"]');
            if (input) {
                input.focus();
            } else {
                const buttons = modalRef.current?.querySelectorAll('button');
                if (buttons && buttons.length > 0) {
                    // Default to cancel or secondary button first to avoid accidental deletions
                    const cancelButton = Array.from(buttons).find(
                        b => b.textContent?.toLowerCase().includes('cancelar') || b.textContent?.toLowerCase().includes('fechar')
                    );
                    if (cancelButton) {
                        cancelButton.focus();
                    } else {
                        buttons[0].focus();
                    }
                }
            }
        }, 50);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, loading, onClose]);

    if (!isOpen) return null;

    const handleConfirmClick = () => {
        if (variant === 'credential') {
            onConfirm(password);
        } else if (onConfirm) {
            onConfirm();
        }
    };

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <Trash2 size={24} className="text-[var(--color-danger-600)]" />;
            case 'warning':
                return <AlertTriangle size={24} className="text-[var(--color-warning-600)]" />;
            case 'choice':
                return <Repeat size={24} className="text-[var(--color-primary-600)]" />;
            case 'credential':
                return <Key size={24} className="text-[var(--color-primary-600)]" />;
            default:
                return <AlertTriangle size={24} className="text-[var(--color-warning-600)]" />;
        }
    };

    const getHeaderBorderColor = () => {
        switch (variant) {
            case 'danger':
                return 'border-t-4 border-t-[var(--color-danger-500)]';
            case 'warning':
                return 'border-t-4 border-t-[var(--color-warning-500)]';
            case 'choice':
            case 'credential':
                return 'border-t-4 border-t-[var(--color-primary-500)]';
            default:
                return '';
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-backdrop">
            <style>{`
                @keyframes confirm-backdrop-enter {
                    from { opacity: 0; backdrop-filter: blur(0); }
                    to { opacity: 1; backdrop-filter: blur(4px); }
                }
                @keyframes confirm-modal-enter {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-backdrop {
                    animation: confirm-backdrop-enter 200ms ease-out forwards;
                }
                .animate-confirm-modal {
                    animation: confirm-modal-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                @media (prefers-reduced-motion: reduce) {
                    .animate-backdrop, .animate-confirm-modal {
                        animation-duration: 0.01ms !important;
                        animation-iteration-count: 1 !important;
                        transition-duration: 0.01ms !important;
                    }
                }
            `}</style>
            
            <div
                ref={modalRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-description"
                className={`w-full max-w-md rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] shadow-2xl overflow-hidden animate-confirm-modal ${getHeaderBorderColor()}`}
            >
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-primary)] shrink-0">
                            {getIcon()}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3
                                id="confirm-dialog-title"
                                className="text-base font-bold text-[var(--text-primary)] font-heading leading-tight"
                            >
                                {title}
                            </h3>
                            <p
                                id="confirm-dialog-description"
                                className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed"
                            >
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Variant Specific Forms */}
                    {variant === 'credential' && (
                        <div className="mt-4">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                                Senha de Acesso
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Digite sua senha..."
                                disabled={loading}
                                className="input-base text-xs font-semibold py-2.5"
                            />
                        </div>
                    )}

                    {/* Choices Variant */}
                    {variant === 'choice' && choices.length > 0 && (
                        <div className="mt-5 space-y-2.5">
                            {choices.map((choice, index) => {
                                const isDanger = choice.variant === 'danger';
                                const isPrimary = choice.variant === 'primary';
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={choice.onClick}
                                        disabled={loading}
                                        className={`w-full text-left p-3.5 rounded-xl border transition-all duration-200 active:scale-[0.99] flex flex-col gap-0.5 ${
                                            isDanger
                                                ? 'bg-[var(--color-danger-50)]/20 dark:bg-[var(--color-danger-500)]/5 border-[var(--color-danger-500)]/20 hover:border-[var(--color-danger-500)]'
                                                : isPrimary
                                                ? 'bg-[var(--color-primary-50)]/20 dark:bg-[var(--color-primary-500)]/5 border-[var(--color-primary-500)]/20 hover:border-[var(--color-primary-500)]'
                                                : 'bg-[var(--bg-secondary)] border-[var(--border-primary)] hover:border-[var(--text-tertiary)]'
                                        }`}
                                    >
                                        <span className={`text-xs font-bold ${
                                            isDanger ? 'text-[var(--color-danger-600)]' :
                                            isPrimary ? 'text-[var(--color-primary-600)]' : 'text-[var(--text-primary)]'
                                        }`}>
                                            {choice.label}
                                        </span>
                                        {choice.description && (
                                            <span className="text-[10px] text-[var(--text-secondary)] font-medium leading-normal">
                                                {choice.description}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Actions footer for non-choice variants */}
                    {variant !== 'choice' && (
                        <div className="mt-6 flex justify-end gap-2.5 pt-4 border-t border-[var(--border-primary)] border-dashed">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors disabled:opacity-50"
                            >
                                {cancelLabel}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmClick}
                                disabled={loading || (variant === 'credential' && !password.trim())}
                                className={`rounded-lg px-4 py-2 text-xs font-bold text-white transition-all flex items-center gap-1.5 ${
                                    variant === 'danger'
                                        ? 'bg-[var(--color-danger-600)] hover:bg-[var(--color-danger-500)] shadow-sm hover:translate-y-[-0.5px] active:scale-95'
                                        : 'bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-500)] shadow-sm hover:translate-y-[-0.5px] active:scale-95'
                                } disabled:opacity-50 disabled:pointer-events-none`}
                            >
                                {loading && <Loader2 size={13} className="animate-spin" />}
                                {confirmLabel || (variant === 'danger' ? 'Remover' : 'Confirmar')}
                            </button>
                        </div>
                    )}

                    {variant === 'choice' && (
                        <div className="mt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}
