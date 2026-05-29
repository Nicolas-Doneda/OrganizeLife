import React, { useState, useEffect } from 'react';
import { Sparkles, Wallet, PiggyBank, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

export default function FluidBlob() {
    const [isOrganized, setIsOrganized] = useState(false);
    const { theme } = useTheme();

    // Auto-toggle the layout animation on a calm, slow loop
    useEffect(() => {
        const interval = setInterval(() => {
            setIsOrganized(prev => !prev);
        }, 6000);
        return () => clearInterval(interval);
    }, []);

    const toggleState = () => {
        setIsOrganized(prev => !prev);
    };

    return (
        <div 
            onClick={toggleState}
            className="relative w-full max-w-[370px] sm:max-w-[410px] min-h-[460px] p-6 rounded-3xl cursor-pointer select-none overflow-hidden flex flex-col justify-between transition-all duration-500
                       border border-[oklch(86%_0.018_78_/_0.70)] dark:border-border-main/50 
                       shadow-[0_20px_50px_oklch(45%_0.035_75_/_0.10)] dark:shadow-xl hover:border-primary-500/30 dark:hover:border-primary-500/30"
            style={{
                background: theme === 'dark' 
                    ? 'linear-gradient(to bottom right, var(--color-background-card), oklch(17% 0.008 75))' 
                    : 'linear-gradient(135deg, oklch(99% 0.016 85), oklch(95% 0.026 80))',
                willChange: 'transform, opacity'
            }}
            title="Clique para ordenar as despesas ✨"
        >
            {/* Ambient amber glow behind */}
            <div aria-hidden className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-primary-500/5 dark:bg-primary-500/[0.02] blur-2xl pointer-events-none" />

            {/* Light dot overlay for texture */}
            <div aria-hidden className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] bg-[radial-gradient(circle_at_1px_1px,var(--color-primary-500)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

            {/* Header info */}
            <div className="flex items-center justify-between border-b border-border-main/40 pb-4 mb-4 relative z-10">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full transition-colors duration-500 ${isOrganized ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted dark:text-text-dim">
                        Lançamentos por Conta
                    </span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border transition-all duration-500 ${
                    isOrganized 
                        ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                        : 'text-text-muted bg-background-secondary border-border-main'
                }`}>
                    {isOrganized ? "Organizado" : "Não Categorizado"}
                </span>
            </div>

            {/* Showcase Stack Area */}
            <div className="relative flex-1 flex flex-col gap-3 py-2 z-10">
                
                {/* Item 1: Supermercado (Necessidade) */}
                <div 
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-800 
                                bg-[oklch(99.5%_0.004_82)] dark:bg-background-primary/95 
                                border-[oklch(86%_0.018_78_/_0.70)] dark:border-border-main ${
                                    isOrganized 
                                        ? 'translate-x-0 translate-y-0 rotate-0 shadow-[0_10px_26px_oklch(42%_0.030_75_/_0.10)] dark:shadow-md' 
                                        : 'translate-x-[-14px] translate-y-[8px] rotate-[-2.5deg] shadow-sm'
                                }`}
                                style={{ willChange: 'transform, opacity' }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wider transition-colors duration-500 ${
                                        isOrganized ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-background-secondary text-text-muted border border-border-main'
                                    }`}>
                                        50%
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text-main">Supermercado CompreBem</p>
                                        <p className="text-[9px] text-text-muted dark:text-text-dim transition-colors duration-500">
                                            {isOrganized ? "Necessidades Essenciais" : "Despesa Manual"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-text-main">- R$ 342,80</span>
                            </div>

                {/* Item 2: Netflix Premium (Desejo) */}
                <div 
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-800 
                                bg-[oklch(99.5%_0.004_82)] dark:bg-background-primary/95 
                                border-[oklch(86%_0.018_78_/_0.70)] dark:border-border-main ${
                                    isOrganized 
                                        ? 'translate-x-0 translate-y-0 rotate-0 shadow-[0_10px_26px_oklch(42%_0.030_75_/_0.10)] dark:shadow-md' 
                                        : 'translate-x-[12px] translate-y-[-4px] rotate-[1.8deg] shadow-sm'
                                }`}
                                style={{ 
                                    willChange: 'transform, opacity', 
                                    transitionDelay: isOrganized ? '80ms' : '0ms' 
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wider transition-colors duration-500 ${
                                        isOrganized ? 'bg-primary-500/10 text-primary-500 border border-primary-500/20' : 'bg-background-secondary text-text-muted border border-border-main'
                                    }`}>
                                        30%
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text-main">Assinatura Netflix</p>
                                        <p className="text-[9px] text-text-muted dark:text-text-dim transition-colors duration-500">
                                            {isOrganized ? "Desejos Pessoais" : "Despesa Manual"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-text-main">- R$ 55,90</span>
                            </div>

                {/* Item 3: Investimento (Poupança) */}
                <div 
                    className={`p-3.5 rounded-xl border flex items-center justify-between transition-all duration-800 
                                bg-[oklch(99.5%_0.004_82)] dark:bg-background-primary/95 
                                border-[oklch(86%_0.018_78_/_0.70)] dark:border-border-main ${
                                    isOrganized 
                                        ? 'translate-x-0 translate-y-0 rotate-0 shadow-[0_10px_26px_oklch(42%_0.030_75_/_0.10)] dark:shadow-md' 
                                        : 'translate-x-[-8px] translate-y-[-16px] rotate-[-1.2deg] shadow-sm'
                                }`}
                                style={{ 
                                    willChange: 'transform, opacity', 
                                    transitionDelay: isOrganized ? '160ms' : '0ms' 
                                }}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold tracking-wider transition-colors duration-500 ${
                                        isOrganized ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-background-secondary text-text-muted border border-border-main'
                                    }`}>
                                        20%
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-text-main">Aporte Tesouro Direto</p>
                                        <p className="text-[9px] text-text-muted dark:text-text-dim transition-colors duration-500">
                                            {isOrganized ? "Poupança e Futuro" : "Aporte Manual"}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs font-bold text-text-main">- R$ 500,00</span>
                            </div>

                {/* Item 4: Scheduled Invoice mapped to calendar */}
                <div className="grid grid-cols-2 gap-4 items-center relative py-2 mt-2">
                    {/* Left: Invoice details */}
                    <div className={`p-3 rounded-xl border transition-all duration-500 bg-[oklch(99.5%_0.004_82)]/80 dark:bg-background-primary/70 ${
                        isOrganized ? 'border-primary-500/20 dark:border-primary-500/20' : 'border-[oklch(86%_0.018_78_/_0.70)] dark:border-border-main'
                    }`}>
                        <span className="text-[8px] font-bold text-text-muted dark:text-text-dim uppercase tracking-wider">Fatura do Cartão</span>
                        <p className="text-sm font-extrabold text-text-main mt-0.5">R$ 1.230,50</p>
                        <p className="text-[9px] text-primary-500 font-bold mt-1">Registrado p/ Dia 10</p>
                    </div>

                    {/* Right: Calendar date box */}
                    <div className="p-3 rounded-xl border border-border-main/50 bg-[oklch(99.5%_0.004_82)]/80 dark:bg-background-primary/70 flex flex-col items-center justify-center">
                        <span className="text-[8px] font-bold text-text-muted dark:text-text-dim uppercase tracking-wider">No Calendário</span>
                        <div className="w-8 h-8 rounded bg-primary-500/10 border border-primary-500/20 flex flex-col items-center justify-center mt-1">
                            <span className="text-[6px] font-extrabold uppercase text-primary-500 tracking-wide">MAIO</span>
                            <span className="text-xs font-extrabold text-text-main leading-none mt-0.5">10</span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Bottom 50/30/20 Progress Bar representation */}
            <div className="p-4 rounded-2xl border border-border-main/50 bg-[oklch(94%_0.014_78)]/30 dark:bg-background-secondary/30 mt-4 relative z-10">
                <div className="flex justify-between items-center mb-2.5">
                    <span className="text-[10px] font-bold text-text-muted tracking-wide">Orçamento 50 / 30 / 20</span>
                    <span className="text-[9px] font-extrabold text-primary-500 transition-opacity duration-300">
                        {isOrganized ? "Organização Concluída" : "Aguardando Classificação"}
                    </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-background-hover/50 overflow-hidden flex gap-[2px]">
                    <div 
                        className="h-full bg-emerald-500 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: isOrganized ? '50%' : '0%' }}
                    />
                    <div 
                        className="h-full bg-primary-500 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: isOrganized ? '30%' : '0%', transitionDelay: '150ms' }}
                    />
                    <div 
                        className="h-full bg-amber-500 transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{ width: isOrganized ? '20%' : '0%', transitionDelay: '300ms' }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-[8px] font-extrabold text-text-muted dark:text-text-dim tracking-wider uppercase">
                    <span>Essencial (50)</span>
                    <span>Livre (30)</span>
                    <span>Futuro (20)</span>
                </div>
            </div>

            {/* Click indicators */}
            <div className="absolute bottom-1 right-3 opacity-25 group-hover:opacity-65 transition-opacity text-[8px] font-bold text-text-muted dark:text-text-dim uppercase pointer-events-none">
                Clique para ordenar
            </div>
        </div>
    );
}
