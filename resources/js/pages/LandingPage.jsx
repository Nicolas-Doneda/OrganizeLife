import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LogoMark from '../components/ui/LogoMark';
import AuroraCanvas from '../components/landing/AuroraCanvas';
import MagneticButton from '../components/landing/MagneticButton';
import FluidBlob from '../components/landing/FluidBlob';
import {
    CalendarDays, PiggyBank, LayoutDashboard,
    ArrowRight, CheckCircle2, Moon, Sun,
    Shield, Zap, TrendingUp, Sparkles
} from 'lucide-react';

/* ─── Easing curves (ease-out-expo for motion curves) ─── */
const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';

/* ─── useScrollReveal ─── */
function useScrollReveal(threshold = 0.12) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => { if (e.isIntersecting) { setVisible(true); io.disconnect(); } },
            { threshold }
        );
        io.observe(el);
        return () => io.disconnect();
    }, [threshold]);
    return [ref, visible];
}

/* ─── AnimatedNumber — count-up number entrance ─── */
function AnimatedNumber({ target, suffix = '', delay = 0 }) {
    const [value, setValue] = useState(0);
    const [ref, visible] = useScrollReveal(0.3);
    const [entered, setEntered] = useState(false);
    useEffect(() => {
        if (!visible) return;
        const timer = setTimeout(() => setEntered(true), delay);
        let start; const dur = 1400;
        const tick = (t) => {
            if (!start) start = t;
            const p = Math.min((t - start) / dur, 1);
            setValue(Math.floor((1 - Math.pow(1 - p, 4)) * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        setTimeout(() => requestAnimationFrame(tick), delay);
        return () => clearTimeout(timer);
    }, [visible, target, delay]);
    return (
        <span 
            ref={ref} 
            className="inline-block transition-all duration-800"
            style={{
                transform: entered ? 'scale(1) translateY(0)' : 'scale(1.5) translateY(16px)',
                filter: entered ? 'blur(0)' : 'blur(8px)',
                opacity: entered ? 1 : 0,
                transitionTimingFunction: EASE_EXPO
            }}
        >
            {value}{suffix}
        </span>
    );
}

/* ─── WordReveal — text stagger reveal ─── */
function WordReveal({ text, startDelay = 0, wordDelay = 80, className = '' }) {
    const [ref, visible] = useScrollReveal(0.2);
    const words = text.split(' ');
    return (
        <span ref={ref} className={className}>
            {words.map((word, i) => (
                <span 
                    key={i} 
                    className="inline-block mr-[0.28em] origin-bottom transition-all duration-600"
                    style={{
                        opacity: visible ? 1 : 0,
                        transform: visible ? 'translateY(0) rotateX(0)' : 'translateY(100%) rotateX(-80deg)',
                        filter: visible ? 'blur(0)' : 'blur(4px)',
                        transitionDelay: `${startDelay + i * wordDelay}ms`,
                        transitionTimingFunction: EASE_EXPO
                    }}
                >
                    {word}
                </span>
            ))}
        </span>
    );
}

/* ─── TypeWriter — typing subtitles ─── */
function TypeWriter({ text, speed = 25, startDelay = 600, className = '' }) {
    const [displayed, setDisplayed] = useState('');
    const [started, setStarted] = useState(false);
    const [ref, visible] = useScrollReveal(0.2);
    useEffect(() => {
        if (!visible || started) return;
        const timer = setTimeout(() => {
            setStarted(true);
            let i = 0;
            const interval = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));
                if (i >= text.length) clearInterval(interval);
            }, speed);
            return () => clearInterval(interval);
        }, startDelay);
        return () => clearTimeout(timer);
    }, [visible, text, speed, startDelay, started]);
    return (
        <span ref={ref} className={className}>
            {displayed}
            {started && displayed.length < text.length && (
                <span className="inline-block w-[2px] h-[1em] bg-primary-500 ml-[2px] animate-pulse align-text-bottom" />
            )}
        </span>
    );
}

/* ─── smoothScrollTo ─── */
function smoothScrollTo(targetId) {
    const el = document.getElementById(targetId);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* ─── useScrollProgress ─── */
function useScrollProgress() {
    const [progress, setProgress] = useState(0);
    useEffect(() => {
        const onScroll = () => {
            const p = Math.min(window.scrollY / (window.innerHeight * 0.9), 1);
            setProgress(p);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);
    return progress;
}

export default function LandingPage() {
    const { isAuthenticated, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [logoSpins, setLogoSpins] = useState(0);
    const heroRef = useRef(null);
    const scrollProgress = useScrollProgress();

    // Stats strip reveal triggers
    const [statsRef, statsVisible] = useScrollReveal(0.2);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="min-h-screen overflow-x-hidden bg-background-primary text-text-main transition-colors duration-300 page-enter">
            <style>{CSS_KEYFRAMES}</style>

            {/* ── NAVBAR ── */}
            <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                scrolled 
                    ? 'bg-background-primary/80 backdrop-blur-xl border-b shadow-[0_4px_30px_rgba(0,0,0,0.03)] header-scrolled' 
                    : 'bg-transparent border-b border-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <button
                        onClick={() => setLogoSpins(n => n + 1)}
                        className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer p-0"
                        title="✨"
                    >
                        <div 
                            className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 shadow-md shadow-primary-600/20"
                            style={{
                                animation: logoSpins ? `logoSpin 0.5s ${EASE_EXPO}` : 'none',
                                animationIterationCount: logoSpins,
                            }}
                        >
                            <LogoMark size={17} strokeColor="white" fillColor="white" strokeWidth="2.2" />
                        </div>
                        <span className="font-heading font-extrabold text-lg text-text-main tracking-tight">OrganizeLife</span>
                    </button>

                    <nav className="flex items-center gap-3">
                        <button 
                            onClick={toggleTheme} 
                            className="p-2.5 rounded-xl text-text-muted hover:bg-background-hover hover:text-text-main transition-colors cursor-pointer"
                            aria-label="Toggle theme"
                        >
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        {loading ? (
                            <div className="w-20 h-9 rounded-xl bg-background-tertiary animate-pulse" />
                        ) : isAuthenticated ? (
                            <Link to="/dashboard" className="btn-primary text-xs !py-2 !px-4">Painel</Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-xs font-bold text-text-muted hover:text-text-main transition-colors no-underline px-2.5 py-2">
                                    Login
                                </Link>
                                <Link to="/register" className="btn-primary text-xs !py-2 !px-4">
                                    Começar
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </header>

            {/* ── HERO ── */}
            <section
                ref={heroRef}
                className="relative min-h-screen flex items-center justify-center pt-24 pb-16 overflow-hidden bg-background-primary"
            >
                {/* WebGL Canvas Background */}
                <AuroraCanvas />
                
                {/* Fine grid pattern overlay */}
                <div aria-hidden className="absolute inset-0 opacity-[0.025] dark:opacity-[0.035] bg-[radial-gradient(circle_at_1px_1px,var(--text-tertiary)_1px,transparent_0)] bg-[size:36px_36px] pointer-events-none z-1" />

                <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
                    
                    {/* Left Column: Heading & Call to Actions */}
                    <div className="lg:col-span-7 text-center lg:text-left flex flex-col items-center lg:items-start">
                        {/* Heading */}
                        <h1 
                            className="font-heading font-extrabold tracking-tight leading-[1.08] text-4xl sm:text-5xl lg:text-6xl mb-6 select-none"
                            style={{
                                transform: `translateY(${scrollProgress * -60}px) scale(${1 - scrollProgress * 0.08})`,
                                opacity: 1 - scrollProgress * 1.2,
                                transition: 'none',
                            }}
                        >
                            <WordReveal text="A clareza financeira" startDelay={100} wordDelay={90} />
                            <br />
                            <WordReveal text="que a sua rotina" startDelay={450} wordDelay={90} />
                            <br />
                            <span className="relative inline-block text-primary-500 dark:text-primary-400">
                                <WordReveal text="exige." startDelay={800} />
                                <svg viewBox="0 0 160 10" className="absolute -bottom-1 left-0 w-full h-2.5" preserveAspectRatio="none">
                                    <path 
                                        d="M4 7 Q40 1 80 6 Q120 11 156 5" 
                                        stroke="var(--color-primary-450, var(--color-primary-400))" 
                                        strokeWidth="2.5" 
                                        fill="none" 
                                        strokeLinecap="round" 
                                        style={{ strokeDasharray: 200, animation: `drawLine 0.9s 0.8s ${EASE_EXPO} both` }} 
                                    />
                                </svg>
                            </span>
                        </h1>

                        {/* Subtitle (Staggered fade-up entry) */}
                        <p 
                            className="text-base sm:text-lg text-text-muted max-w-xl mb-10 leading-relaxed font-medium min-h-[3.6em] hero-desc"
                            style={{
                                transform: `translateY(${scrollProgress * -35}px)`,
                                opacity: 1 - scrollProgress * 1.5,
                                transition: 'none',
                            }}
                        >
                            <TypeWriter text="O OrganizeLife unifica o controle de contas, caixas de poupança e tarefas em uma única interface minimalista. Abandone planilhas complexas e tome decisões financeiras conscientes." startDelay={1100} speed={15} />
                        </p>

                        {/* CTAs (Staggered fade-up entry) */}
                        <div 
                            className="flex flex-wrap gap-4 mb-10 justify-center lg:justify-start hero-buttons"
                            style={{
                                transform: `translateY(${scrollProgress * -15}px)`,
                                opacity: 1 - scrollProgress * 1.8,
                                transition: 'none',
                            }}
                        >
                            {!isAuthenticated && (
                                <MagneticButton as="div" radius={140} strength={0.35} className="rounded-xl">
                                    <Link 
                                        to="/register" 
                                        className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm text-white no-underline bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-600/20 hover:shadow-primary-600/35 transition-all duration-300"
                                    >
                                        Crie sua conta
                                    </Link>
                                </MagneticButton>
                            )}
                            <MagneticButton as="div" radius={100} strength={0.25} className="rounded-xl">
                                <a 
                                    href="#features" 
                                    onClick={(e) => { e.preventDefault(); smoothScrollTo('features'); }} 
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-sm no-underline bg-background-card text-text-main border border-border-main hover:bg-background-hover transition-colors"
                                >
                                    Conhecer recursos
                                </a>
                            </MagneticButton>
                        </div>

                        {/* Trust signals (Staggered fade-up entry) */}
                        <div 
                            className="flex flex-wrap gap-x-7 gap-y-2 justify-center lg:justify-start hero-pills"
                        >
                            {[
                                { text: 'Metodologia Aplicada', tip: 'Alocação Inteligente baseada na regra 50/30/20' },
                                { text: 'Dados sob seu controle', tip: 'Sessões seguras de alta fidelidade e sem logouts inesperados' },
                                { text: 'Privacidade Nativa', tip: 'Controle absoluto e privado de seus registros financeiros' },
                            ].map(({ text, tip }) => (
                                <TrustPill key={text} text={text} tip={tip} />
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Fluid Gooey Blob Artwork */}
                    <div 
                        className="lg:col-span-5 flex justify-center items-center"
                        style={{
                            animation: `fadeUp 0.8s 0.4s ${EASE_EXPO} both`,
                            transform: `translateY(${scrollProgress * -25}px)`,
                            opacity: 1 - scrollProgress * 1.5,
                        }}
                    >
                        <FluidBlob />
                    </div>

                </div>

                {/* Scroll Indicator */}
                <div 
                    aria-hidden 
                    className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-none z-2"
                    style={{
                        opacity: Math.max(0, 0.35 - scrollProgress * 2),
                        animation: `fadeUp 1s 0.8s ${EASE_EXPO} both`
                    }}
                >
                    <span className="text-[10px] font-bold tracking-widest uppercase text-text-dim">scroll</span>
                    <div className="w-[1px] h-7 bg-gradient-to-b from-text-dim to-transparent animate-[scrollPulse_2s_ease-in-out_infinite]" />
                </div>
            </section>

            {/* ── STATS STRIP ── */}
            <section ref={statsRef} className="border-y border-border-main bg-background-secondary py-10 px-6 relative overflow-hidden">
                {/* Dot background texture */}
                <div aria-hidden className="absolute inset-0 opacity-[0.015] dark:opacity-[0.025] bg-[radial-gradient(circle_at_1px_1px,var(--text-tertiary)_1px,transparent_0)] bg-[size:16px_16px] pointer-events-none" />

                {/* Subtle horizontal animated lines (expanding on enter) */}
                <div className={`stats-divider w-full mb-8 ${statsVisible ? 'stats-divider-animated' : 'scale-x-0'}`} />

                <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                    {[
                        { 
                            value: '50/30/20', 
                            label: 'método aplicado',
                            viz: (
                                <div className="flex gap-[2px] w-12 h-1.5 mt-2 bg-background-hover/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500/80" style={{ width: '50%' }} />
                                    <div className="h-full bg-primary-500/80" style={{ width: '30%' }} />
                                    <div className="h-full bg-amber-500/80" style={{ width: '20%' }} />
                                </div>
                            )
                        },
                        { 
                            value: '3 fluxos', 
                            label: 'finanças, faturas e rotina',
                            viz: (
                                <svg width="36" height="12" viewBox="0 0 36 12" className="mt-2 text-text-dim/40 dark:text-text-dim/30">
                                    <circle cx="6" cy="6" r="3" fill="var(--color-success-500)" opacity="0.8" />
                                    <circle cx="18" cy="6" r="3" fill="var(--color-primary-500)" opacity="0.8" />
                                    <circle cx="30" cy="6" r="3" fill="var(--color-warning-500)" opacity="0.8" />
                                    <line x1="9" y1="6" x2="15" y2="6" stroke="currentColor" strokeWidth="1" />
                                    <line x1="21" y1="6" x2="27" y2="6" stroke="currentColor" strokeWidth="1" />
                                </svg>
                            )
                        },
                        { 
                            value: '1 agenda', 
                            label: 'datas importantes reunidas',
                            viz: (
                                <div className="flex gap-1 mt-2">
                                    {[...Array(4)].map((_, idx) => (
                                        <span 
                                            key={idx} 
                                            className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center text-[5px] font-bold ${
                                                idx === 2 
                                                    ? 'bg-primary-500/20 border-primary-500/50 text-primary-500' 
                                                    : 'bg-background-hover/30 border-border-main text-text-dim/60'
                                            }`}
                                        >
                                            {idx === 2 ? '10' : ''}
                                        </span>
                                    ))}
                                </div>
                            )
                        },
                        { 
                            value: 'controle local', 
                            label: 'seus dados no centro',
                            viz: (
                                <div className="relative w-8 h-4 mt-2 flex items-center justify-center">
                                    <div className="absolute inset-0 rounded-full border border-primary-500/20 animate-ping opacity-25" style={{ animationDuration: '3s' }} />
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-primary-500/80">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                </div>
                            )
                        },
                    ].map(({ value, label, viz }, i) => (
                        <div 
                            key={label} 
                            className={`flex flex-col items-center transition-all duration-700 ${
                                statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                            } ${i < 3 ? 'md:border-r md:border-border-main' : ''}`}
                            style={{ transitionDelay: `${i * 120}ms` }}
                        >
                            <p className="text-2xl lg:text-3xl font-extrabold font-heading tracking-tight text-primary-700 dark:text-primary-400">
                                {value}
                            </p>
                            <p className="text-[10px] font-bold mt-1 text-text-dim tracking-wider uppercase">{label}</p>
                            {viz}
                        </div>
                    ))}
                </div>
            </section>

            {/* ── ECOSYSTEM SECTION ── */}
            <EcosystemSection />

            {/* ── FEATURES ── */}
            <section id="features" className="py-24 px-6 bg-background-secondary">
                <div className="max-w-6xl mx-auto">
                    <RevealBlock className="text-center max-w-xl mx-auto mb-16">
                        <p className="text-[10px] font-bold tracking-widest uppercase text-primary-600 dark:text-primary-400 mb-3">Método e Equilíbrio</p>
                        <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight text-text-main mb-4">A arquitetura da sua rotina</h2>
                        <p className="text-base text-text-muted leading-relaxed">Projetado sob rigorosos critérios de design para modelar seu fluxo financeiro com clareza matemática e facilidade visual.</p>
                    </RevealBlock>

                    <div className="grid grid-cols-12 gap-6 w-full animate-in">
                        {FEATURES.map((f, i) => (
                            <FeatureCard key={f.title} {...f} index={i} delay={i * 120} />
                        ))}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section className="py-24 px-6 bg-background-primary">
                <div className="max-w-4xl mx-auto">
                    <RevealBlock>
                        <div 
                            className="relative rounded-3xl py-16 px-8 sm:px-16 text-center overflow-hidden border transition-all duration-500
                                       border-[oklch(86%_0.018_78_/_0.75)] dark:border-border-main/50"
                            style={{
                                background: theme === 'dark' 
                                    ? 'radial-gradient(circle at center, var(--color-primary-900) 0%, var(--color-background-primary) 100%)' 
                                    : 'linear-gradient(135deg, oklch(98.5% 0.010 82), oklch(94.5% 0.018 78))',
                                boxShadow: theme === 'dark' 
                                    ? 'none' 
                                    : '0 28px 80px oklch(42% 0.030 75 / 0.10)'
                            }}
                        >
                            {/* Ambient amber halo behind content */}
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500/[0.05] dark:bg-primary-500/[0.01] blur-3xl pointer-events-none z-0" />

                            {/* Line motion overlay for Light Mode */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden block dark:hidden opacity-100 z-0">
                                <svg className="w-[200%] h-full top-0 left-0 absolute" viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none">
                                    {/* Line 1 (Faster) */}
                                    <g className="cta-wave-group" style={{ animation: 'wave-move 26s linear infinite' }}>
                                        <path d="M 0 50 Q 250 20 500 50 T 1000 50 T 1500 50 T 2000 50" stroke="oklch(72% 0.082 74 / 0.16)" strokeWidth="1" />
                                        <circle cx="150" cy="45" r="3" fill="oklch(72% 0.082 74)" opacity="0.75" />
                                    </g>
                                    {/* Line 2 (Slower) */}
                                    <g className="cta-wave-group" style={{ animation: 'wave-move 40s linear infinite' }}>
                                        <path d="M 0 130 Q 250 160 500 130 T 1000 130 T 1500 130 T 2000 130" stroke="oklch(72% 0.082 74 / 0.12)" strokeWidth="0.8" />
                                        <circle cx="450" cy="135" r="2.5" fill="oklch(72% 0.082 74)" opacity="0.65" />
                                    </g>
                                </svg>
                            </div>

                            {/* Dot overlay */}
                            <div aria-hidden className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] bg-[size:24px_24px] pointer-events-none dark:block hidden" />

                            <div className="relative z-10 flex flex-col items-center">
                                <div 
                                    className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase mb-6 transition-all duration-300 hover:scale-105 hover:bg-primary-500/15"
                                    style={{
                                        backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'oklch(91% 0.035 78 / 0.55)',
                                        color: theme === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'oklch(44% 0.045 74)'
                                    }}
                                >
                                    <Sparkles size={11} /> Comece hoje
                                </div>
                                <h2 
                                    className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight mb-4"
                                    style={{
                                        color: theme === 'dark' ? '#ffffff' : 'oklch(22% 0.018 70)'
                                    }}
                                >
                                    Simplifique sua rotina financeira
                                </h2>
                                <p 
                                    className="text-base leading-relaxed max-w-lg mb-9 font-medium"
                                    style={{
                                        color: theme === 'dark' ? 'var(--color-primary-200)' : 'oklch(38% 0.020 72)'
                                    }}
                                >
                                    Contas, categorias e compromissos no calendário reunidos em uma interface projetada para dar controle e clareza total. Comece hoje gratuitamente.
                                </p>
                                {!isAuthenticated && (
                                    <Link 
                                        to="/register" 
                                        className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 dark:bg-white dark:hover:bg-slate-50 font-extrabold text-sm no-underline shadow-lg hover:shadow-[0_15px_35px_oklch(72%_0.082_74_/_0.25)] dark:hover:shadow-white/10 hover:-translate-y-0.5 transition-all duration-300"
                                        style={{
                                            color: theme === 'dark' ? 'var(--color-primary-900)' : '#ffffff'
                                        }}
                                    >
                                        Criar conta gratuitamente <ArrowRight size={16} style={{ color: theme === 'dark' ? 'var(--color-primary-800)' : '#ffffff' }} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RevealBlock>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer className="bg-background-secondary border-t border-border-main py-12 px-6">
                <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 text-center">
                    <div className="flex items-center gap-2 opacity-80">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-700 shadow-md">
                            <LogoMark size={13} strokeColor="white" fillColor="white" strokeWidth="2.2" />
                        </div>
                        <span className="font-heading font-extrabold text-base text-text-main tracking-tight">OrganizeLife</span>
                    </div>
                    <p className="text-xs sm:text-sm text-text-muted font-medium">Desenvolvido com carinho para simplificar dias complexos.</p>
                    <p className="text-[11px] text-text-dim mt-2">© {new Date().getFullYear()} OrganizeLife. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

/* ── TrustPill ── */
function TrustPill({ text, tip }) {
    const [show, setShow] = useState(false);
    return (
        <div 
            className="relative inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted cursor-default"
            onMouseEnter={() => setShow(true)} 
            onMouseLeave={() => setShow(false)}
        >
            <CheckCircle2 size={14} className="text-primary-500 dark:text-primary-400 shrink-0" />
            {text}
            {show && (
                <span 
                    className="absolute bottom-[135%] left-1/2 -translate-x-1/2 whitespace-nowrap bg-background-card border border-border-main rounded-lg px-3 py-1.5 text-[11px] font-bold text-text-main shadow-lg z-50 pointer-events-none"
                    style={{
                        animation: `fadeUp 0.2s ${EASE_EXPO} both`
                    }}
                >
                    {tip}
                </span>
            )}
        </div>
    );
}

/* ── RevealBlock ── */
function RevealBlock({ children, className = '' }) {
    const [ref, visible] = useScrollReveal(0.1);
    return (
        <div 
            ref={ref} 
            className={`transition-all duration-650 ${className}`}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(24px)',
                transitionTimingFunction: EASE_EXPO
            }}
        >
            {children}
        </div>
    );
}

/* ── FeatureCard ── */
function FeatureCard({ icon: Icon, title, description, delay, color, index, gridClass }) {
    const [ref, visible] = useScrollReveal(0.08);
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef(null);
    const [tilt, setTilt] = useState({ x: 0, y: 0 });

    const handleMouseMove = useCallback((e) => {
        const el = cardRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        setTilt({ x: y * -10, y: x * 10 });
    }, []);

    const handleMouseLeave = useCallback(() => {
        setHovered(false);
        setTilt({ x: 0, y: 0 });
    }, []);

    return (
        <div 
            ref={(el) => { ref.current = el; cardRef.current = el; }}
            className={`p-7 rounded-2xl cursor-default relative overflow-hidden bg-background-card border text-left ${gridClass} fade-up-card ${visible ? 'fade-up-card-animated' : ''}`}
            style={{
                borderColor: hovered ? 'oklch(72% 0.082 74 / 0.3)' : 'var(--border-primary)',
                boxShadow: hovered ? '0 20px 60px oklch(72% 0.082 74 / 0.12), 0 0 0 1px oklch(72% 0.082 74 / 0.08)' : 'var(--shadow-card)',
                transform: hovered ? `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.015)` : 'perspective(800px) rotateX(0deg) rotateY(0deg) scale(1)',
                animationDelay: `${index * 80}ms`,
                transition: hovered ? 'transform 0.15s ease-out, border-color 0.3s, box-shadow 0.3s' : 'transform 0.3s ease, border-color 0.3s, box-shadow 0.3s',
                transformStyle: 'preserve-3d',
                willChange: 'transform, opacity',
            }}
            onMouseEnter={() => setHovered(true)}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {/* Inner content with slight depth */}
            <div style={{ transform: hovered ? 'translateZ(18px)' : 'translateZ(0)', transition: `transform 0.3s ${EASE_EXPO}` }}>
                <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-transform duration-300"
                    style={{
                        backgroundColor: color + '15',
                        transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
                    }}
                >
                    <Icon size={18} style={{ color }} />
                </div>

                <h3 className="font-heading font-bold text-[15px] text-text-main tracking-tight mb-2.5">{title}</h3>
                <p className="text-xs sm:text-sm text-text-muted leading-relaxed">{description}</p>
            </div>

            {/* Shine effect */}
            {hovered && (
                <div 
                    aria-hidden 
                    className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-300"
                    style={{
                        background: `radial-gradient(circle at ${(tilt.y / 10 + 0.5) * 100}% ${(-tilt.x / 10 + 0.5) * 100}%, oklch(72% 0.082 74 / 0.08), transparent 65%)`
                    }} 
                />
            )}
        </div>
    );
}

/* ── Features Data ── */
const FEATURES = [
    { 
        icon: PiggyBank, 
        color: 'var(--color-primary-500)', 
        title: 'Alocação Patrimonial Inteligente', 
        description: 'Estruture seus gastos fixos e variáveis. Acompanhe a conformidade e integridade do seu fluxo de caixa de forma organizada.', 
        gridClass: 'col-span-12 md:col-span-8' 
    },
    { 
        icon: CalendarDays, 
        color: 'var(--color-accent-500)', 
        title: 'Organização de Compromissos', 
        description: 'Linha do tempo para datas de vencimento de faturas e compromissos importantes registrados.', 
        gridClass: 'col-span-12 md:col-span-4' 
    },
    { 
        icon: LayoutDashboard, 
        color: 'var(--color-primary-600)', 
        title: 'Painel Analítico Unificado', 
        description: 'Consolidação simplificada do seu saldo, contas a pagar e rendimentos em uma tela limpa e de alta legibilidade.', 
        gridClass: 'col-span-12 md:col-span-4' 
    },
    { 
        icon: Shield, 
        color: 'var(--color-primary-500)', 
        title: 'Custódia Privada & Segurança', 
        description: 'Sessões protegidas por criptografia e autenticação de dois fatores nativa para garantir a segurança dos seus dados.', 
        gridClass: 'col-span-12 md:col-span-8' 
    },
    { 
        icon: Zap, 
        color: 'var(--color-warning-500)', 
        title: 'Performance e Baixa Latência', 
        description: 'Engine otimizado que carrega instantaneamente, livre de trackers invasivos de publicidade ou scripts inflados.', 
        gridClass: 'col-span-12 md:col-span-6' 
    },
    { 
        icon: TrendingUp, 
        color: 'var(--color-danger-500)', 
        title: 'Método Orçamentário 50/30/20', 
        description: 'Planeje sua divisão mensal ideal entre despesas essenciais, desejos pessoais e investimentos de longo prazo.', 
        gridClass: 'col-span-12 md:col-span-6' 
    },
];

/* ── Ecosystem Section ── */
function EcosystemSection() {
    const [ref, visible] = useScrollReveal(0.1);
    const [hovered, setHovered] = useState(null);

    return (
        <section 
            ref={ref} 
            className="py-24 px-6 relative overflow-hidden bg-background-primary border-b border-border-main/30"
        >
            {/* Topographic Background Waves */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <svg 
                    className={`absolute w-[200%] h-full top-0 left-0 transition-all duration-[1200ms] ${
                        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
                    }`}
                    viewBox="0 0 2000 600"
                    fill="none"
                    style={{
                        willChange: 'transform, opacity',
                    }}
                >
                    <g style={{ animation: 'wave-move 45s linear infinite' }}>
                        {/* Wave 1 */}
                        <path 
                            d="M 0 200 C 300 120, 600 280, 900 200 C 1200 120, 1500 280, 1800 200 C 2100 120, 2400 280, 2700 200 L 3000 200" 
                            stroke="var(--color-primary-500)" 
                            strokeWidth="1.2"
                            className="opacity-[0.04] dark:opacity-[0.025]"
                        />
                    </g>
                    <g style={{ animation: 'wave-move 60s linear infinite reverse' }}>
                        {/* Wave 2 */}
                        <path 
                            d="M 0 350 C 400 280, 800 420, 1200 350 C 1600 280, 2000 420, 2400 350 L 3000 350" 
                            stroke="var(--color-primary-500)" 
                            strokeWidth="0.8"
                            className="opacity-[0.03] dark:opacity-[0.015]"
                        />
                    </g>
                </svg>
            </div>

            {/* Content Container */}
            <div className="max-w-6xl mx-auto relative z-10">
                {/* Section Header */}
                <div className="text-center max-w-xl mx-auto mb-16">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-500/10 text-primary-900 dark:text-primary-400 text-[10px] font-bold tracking-widest uppercase mb-4">
                        <Sparkles size={11} /> ECOSSISTEMA ORGANIZADO
                    </div>
                    <h2 className="font-heading font-extrabold text-3xl sm:text-4xl tracking-tight leading-tight text-text-main mb-4">
                        Conheça o ecossistema
                    </h2>
                    <p className="text-base text-text-muted leading-relaxed font-medium">
                        Contas, categorias e calendário trabalhando juntos para organizar sua rotina sem ruído.
                    </p>
                </div>

                {/* --- 1. DESKTOP RADIAL MAP --- */}
                <div className="hidden lg:block relative w-full h-[480px] mx-auto">
                    {/* Subtle glow behind core */}
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-primary-500/5 dark:bg-primary-500/[0.03] blur-3xl pointer-events-none" />

                    {/* SVG Connector Lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 480">
                        {/* Connection 1: Module 1 (Top Left) */}
                        <path 
                            d="M 500 230 C 400 230, 350 200, 270 160"
                            fill="none"
                            stroke="var(--color-primary-500)"
                            strokeWidth="1.2"
                            opacity={visible ? 0.35 : 0.1}
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={visible ? 0 : 100}
                            style={{ 
                                transition: `stroke-dashoffset 1.2s ${EASE_EXPO} 600ms, opacity 1s, stroke-width 1s`,
                            }}
                        />

                        {/* Connection 2: Module 2 (Top Right) */}
                        <path 
                            d="M 500 230 C 600 230, 650 200, 730 160"
                            fill="none"
                            stroke="var(--color-primary-500)"
                            strokeWidth="1.2"
                            opacity={visible ? 0.35 : 0.1}
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={visible ? 0 : 100}
                            style={{ 
                                transition: `stroke-dashoffset 1.2s ${EASE_EXPO} 690ms, opacity 1s, stroke-width 1s`,
                            }}
                        />

                        {/* Connection 3: Module 3 (Bottom Left) */}
                        <path 
                            d="M 500 230 C 400 230, 350 260, 270 300"
                            fill="none"
                            stroke="var(--color-primary-500)"
                            strokeWidth="1.2"
                            opacity={visible ? 0.35 : 0.1}
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={visible ? 0 : 100}
                            style={{ 
                                transition: `stroke-dashoffset 1.2s ${EASE_EXPO} 780ms, opacity 1s, stroke-width 1s`,
                            }}
                        />

                        {/* Connection 4: Module 4 (Bottom Right) */}
                        <path 
                            d="M 500 230 C 600 230, 650 260, 730 300"
                            fill="none"
                            stroke="var(--color-primary-500)"
                            strokeWidth="1.2"
                            opacity={visible ? 0.35 : 0.1}
                            pathLength="100"
                            strokeDasharray="100"
                            strokeDashoffset={visible ? 0 : 100}
                            style={{ 
                                transition: `stroke-dashoffset 1.2s ${EASE_EXPO} 870ms, opacity 1s, stroke-width 1s`,
                            }}
                        />

                        {/* Flowing Data Dots */}
                        {visible && (
                            <>
                                {/* Dot 1: Top Left to Center (Inward) */}
                                <circle r="2.5" fill="var(--color-primary-400)" className="flowing-dot">
                                    <animateMotion 
                                        path="M 270 160 C 350 200, 400 230, 500 230" 
                                        dur="6s" 
                                        repeatCount="indefinite" 
                                    />
                                </circle>

                                {/* Dot 2: Center to Top Right (Outward) */}
                                <circle r="2.5" fill="var(--color-primary-400)" className="flowing-dot">
                                    <animateMotion 
                                        path="M 500 230 C 600 230, 650 200, 730 160" 
                                        dur="5s" 
                                        repeatCount="indefinite" 
                                    />
                                </circle>

                                {/* Dot 3: Bottom Left to Center (Inward) */}
                                <circle r="2.5" fill="var(--color-primary-400)" className="flowing-dot">
                                    <animateMotion 
                                        path="M 270 300 C 350 260, 400 230, 500 230" 
                                        dur="7s" 
                                        repeatCount="indefinite" 
                                    />
                                </circle>

                                {/* Dot 4: Center to Bottom Right (Outward) */}
                                <circle r="2.5" fill="var(--color-primary-400)" className="flowing-dot">
                                    <animateMotion 
                                        path="M 500 230 C 600 230, 650 260, 730 300" 
                                        dur="5.5s" 
                                        repeatCount="indefinite" 
                                    />
                                </circle>
                            </>
                        )}
                    </svg>

                    {/* Central Core */}
                    <div 
                        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-[800ms] delay-300 ease-[var(--ease-out-expo)] ${
                            visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <div className="w-28 h-28 rounded-full border border-primary-500/25 bg-background-card flex flex-col items-center justify-center shadow-lg relative hover:border-primary-500/40 transition-colors duration-500 select-none">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 shadow-md shadow-primary-500/10 mb-1 animate-[pulse_3s_infinite]">
                                <LogoMark size={16} strokeColor="white" fillColor="white" strokeWidth="2.2" />
                            </div>
                            <span className="font-heading font-extrabold text-[11px] text-text-main tracking-tight">OrganizeLife</span>
                            <span className="text-[7px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-widest mt-0.5">NÚCLEO</span>
                        </div>
                    </div>

                    {/* Module 1: Orçamento (Top Left) */}
                    <div 
                        className={`absolute left-[5%] top-[5%] w-[250px] transition-all duration-[750ms] delay-[900ms] ease-[var(--ease-out-expo)] ${
                            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <EcosystemModuleCard 
                            id={1}
                            hovered={hovered}
                            setHovered={setHovered}
                            icon={PiggyBank}
                            iconColor="text-emerald-500"
                            iconBg="bg-emerald-500/10"
                            title="Orçamento 50/30/20"
                            subtitle="Alocação inteligente"
                            mainText="Essencial 50% • Livre 30% • Meta 20%"
                            subText="Configurado para o mês corrente"
                            hoverInfo="Dentro do limite mensal"
                            hoverInfoColor="text-emerald-500"
                            customContent={
                                <div className="h-1.5 w-full bg-background-hover/50 rounded-full overflow-hidden flex gap-[1px] mt-1.5">
                                    <div className="h-full bg-emerald-500" style={{ width: '50%' }} />
                                    <div className="h-full bg-primary-500" style={{ width: '30%' }} />
                                    <div className="h-full bg-amber-500" style={{ width: '20%' }} />
                                </div>
                            }
                        />
                    </div>

                    {/* Module 2: Cartão de Crédito (Top Right) */}
                    <div 
                        className={`absolute right-[5%] top-[5%] w-[250px] transition-all duration-[750ms] delay-[990ms] ease-[var(--ease-out-expo)] ${
                            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <EcosystemModuleCard 
                            id={2}
                            hovered={hovered}
                            setHovered={setHovered}
                            icon={() => (
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <rect x="2" y="5" width="20" height="14" rx="2" />
                                    <line x1="2" y1="10" x2="22" y2="10" />
                                </svg>
                            )}
                            iconColor="text-primary-500"
                            iconBg="bg-primary-500/10"
                            title="Cartão de crédito organizado"
                            subtitle="Gastos agrupados por conta"
                            mainText="Nubank Visa Gold"
                            subText="Vence em 10 de maio"
                            hoverInfo="Vencimento registrado"
                            hoverInfoColor="text-primary-600 dark:text-primary-400"
                        />
                    </div>

                    {/* Module 3: Calendário Financeiro (Bottom Left) */}
                    <div 
                        className={`absolute left-[5%] bottom-[5%] w-[250px] transition-all duration-[750ms] delay-[1080ms] ease-[var(--ease-out-expo)] ${
                            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <EcosystemModuleCard 
                            id={3}
                            hovered={hovered}
                            setHovered={setHovered}
                            icon={CalendarDays}
                            iconColor="text-amber-500"
                            iconBg="bg-amber-500/10"
                            title="Calendário financeiro"
                            subtitle="Compromissos e vencimentos"
                            mainText="10 Mai — Jantar de negócios"
                            subText="Fatura do cartão"
                            hoverInfo="Compromisso no calendário"
                            hoverInfoColor="text-amber-500"
                        />
                    </div>

                    {/* Module 4: Metas (Bottom Right) */}
                    <div 
                        className={`absolute right-[5%] bottom-[5%] w-[250px] transition-all duration-[750ms] delay-[1170ms] ease-[var(--ease-out-expo)] ${
                            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                        }`}
                        style={{ willChange: 'transform, opacity' }}
                    >
                        <EcosystemModuleCard 
                            id={4}
                            hovered={hovered}
                            setHovered={setHovered}
                            icon={TrendingUp}
                            iconColor="text-primary-600"
                            iconBg="bg-primary-600/10"
                            title="Metas e saldo mensal"
                            subtitle="Previsão do mês"
                            mainText="Meta: R$ 800 • Previsto: R$ 3.450"
                            subText="Acompanhado manualmente"
                            hoverInfo="Meta acompanhada"
                            hoverInfoColor="text-emerald-500"
                            customContent={
                                <div className="h-1 w-full bg-background-hover/50 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-primary-500" style={{ width: '92%' }} />
                                </div>
                            }
                        />
                    </div>
                </div>

                {/* --- 2. TABLET 2X2 GRID MAP --- */}
                <div className="hidden md:block lg:hidden relative w-full py-4">
                    <div className="flex flex-col items-center gap-10">
                        {/* Core at the top */}
                        <div 
                            className={`transition-all duration-700 ease-[var(--ease-out-expo)] ${
                                visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                            }`}
                        >
                            <div className="w-24 h-24 rounded-full border border-primary-500/25 bg-background-card flex flex-col items-center justify-center shadow-md">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-600 shadow mb-1">
                                    <LogoMark size={16} strokeColor="white" fillColor="white" strokeWidth="2.2" />
                                </div>
                                <span className="font-heading font-extrabold text-[10px] text-text-main tracking-tight">OrganizeLife</span>
                            </div>
                        </div>

                        {/* 2x2 grid */}
                        <div className="grid grid-cols-2 gap-6 w-full max-w-xl mx-auto relative">
                            {/* SVG connections for tablet */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none -z-1" viewBox="0 0 600 400" preserveAspectRatio="none">
                                <path 
                                    d="M 300 0 C 300 50, 150 50, 150 90 M 300 0 C 300 50, 450 50, 450 90 M 150 90 L 150 240 M 450 90 L 450 240"
                                    fill="none"
                                    stroke="var(--color-primary-500)"
                                    strokeWidth="1.2"
                                    opacity="0.2"
                                />
                            </svg>

                            {/* Card 1 */}
                            <div className={`transition-all duration-700 delay-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <EcosystemModuleCard 
                                    id={11}
                                    hovered={hovered}
                                    setHovered={setHovered}
                                    icon={PiggyBank}
                                    iconColor="text-emerald-500"
                                    iconBg="bg-emerald-500/10"
                                    title="Orçamento 50/30/20"
                                    subtitle="Alocação inteligente"
                                    mainText="Essencial 50% • Livre 30% • Meta 20%"
                                    subText="Dentro do planejado"
                                    hoverInfo="Dentro do limite mensal"
                                    hoverInfoColor="text-emerald-500"
                                />
                            </div>

                            {/* Card 2 */}
                            <div className={`transition-all duration-700 delay-600 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <EcosystemModuleCard 
                                    id={12}
                                    hovered={hovered}
                                    setHovered={setHovered}
                                    icon={() => (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <rect x="2" y="5" width="20" height="14" rx="2" />
                                            <line x1="2" y1="10" x2="22" y2="10" />
                                        </svg>
                                    )}
                                    iconColor="text-primary-500"
                                    iconBg="bg-primary-500/10"
                                    title="Cartão de crédito organizado"
                                    subtitle="Gastos agrupados por conta"
                                    mainText="Nubank Visa Gold"
                                    subText="Vence em 10 de maio"
                                    hoverInfo="Vencimento registrado"
                                    hoverInfoColor="text-primary-600 dark:text-primary-400"
                                />
                            </div>

                            {/* Card 3 */}
                            <div className={`transition-all duration-700 delay-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <EcosystemModuleCard 
                                    id={13}
                                    hovered={hovered}
                                    setHovered={setHovered}
                                    icon={CalendarDays}
                                    iconColor="text-amber-500"
                                    iconBg="bg-amber-500/10"
                                    title="Calendário financeiro"
                                    subtitle="Compromissos e vencimentos"
                                    mainText="10 Mai — Jantar de negócios"
                                    subText="Fatura do cartão"
                                    hoverInfo="Vencimento registrado"
                                    hoverInfoColor="text-amber-500"
                                />
                            </div>

                            {/* Card 4 */}
                            <div className={`transition-all duration-700 delay-800 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                                <EcosystemModuleCard 
                                    id={14}
                                    hovered={hovered}
                                    setHovered={setHovered}
                                    icon={TrendingUp}
                                    iconColor="text-primary-600"
                                    iconBg="bg-primary-600/10"
                                    title="Metas e saldo mensal"
                                    subtitle="Previsão do mês"
                                    mainText="Meta: R$ 800 • Previsto: R$ 3.450"
                                    subText="Acompanhado manualmente"
                                    hoverInfo="Meta acompanhada"
                                    hoverInfoColor="text-emerald-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* --- 3. MOBILE TIMELINE LAYOUT --- */}
                <div className="block md:hidden relative pl-8 py-2">
                    {/* Vertical connector line */}
                    <div 
                        className={`absolute left-[12px] top-4 bottom-4 w-[1.5px] bg-border-main/50 transition-all duration-1000 ${
                            visible ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0'
                        }`}
                        style={{ transformOrigin: 'top', willChange: 'transform, opacity' }}
                    />

                    {/* Flowing dot on mobile line */}
                    {visible && (
                        <div 
                            className="absolute left-[9px] w-2 h-2 rounded-full bg-primary-400 shadow-sm"
                            style={{
                                animation: 'slide-down-mobile 8s linear infinite',
                                willChange: 'top',
                            }}
                        />
                    )}

                    <div className="flex flex-col gap-8">
                        {/* Mobile Module 1 */}
                        <div className={`relative transition-all duration-700 delay-[400ms] ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                            {/* Dot indicator */}
                            <div className="absolute -left-[24px] top-6 w-2.5 h-2.5 rounded-full border-2 border-emerald-500 bg-background-card z-10" />
                            <EcosystemModuleCard 
                                id={21}
                                hovered={hovered}
                                setHovered={setHovered}
                                icon={PiggyBank}
                                iconColor="text-emerald-500"
                                iconBg="bg-emerald-500/10"
                                title="Orçamento 50/30/20"
                                subtitle="Alocação inteligente"
                                mainText="Essencial 50% • Livre 30% • Meta 20%"
                                subText="Dentro do planejado"
                                hoverInfo="Dentro do limite mensal"
                                hoverInfoColor="text-emerald-500"
                            />
                        </div>

                        {/* Mobile Module 2 */}
                        <div className={`relative transition-all duration-700 delay-[500ms] ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                            {/* Dot indicator */}
                            <div className="absolute -left-[24px] top-6 w-2.5 h-2.5 rounded-full border-2 border-primary-500 bg-background-card z-10" />
                            <EcosystemModuleCard 
                                id={22}
                                hovered={hovered}
                                setHovered={setHovered}
                                icon={() => (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <rect x="2" y="5" width="20" height="14" rx="2" />
                                        <line x1="2" y1="10" x2="22" y2="10" />
                                    </svg>
                                )}
                                iconColor="text-primary-500"
                                iconBg="bg-primary-500/10"
                                title="Cartão de crédito organizado"
                                subtitle="Gastos agrupados por conta"
                                mainText="Nubank Visa Gold"
                                subText="Vence em 10 de maio"
                                hoverInfo="Conta organizada"
                                hoverInfoColor="text-primary-600 dark:text-primary-400"
                            />
                        </div>

                        {/* Mobile Module 3 */}
                        <div className={`relative transition-all duration-700 delay-[600ms] ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                            {/* Dot indicator */}
                            <div className="absolute -left-[24px] top-6 w-2.5 h-2.5 rounded-full border-2 border-amber-500 bg-background-card z-10" />
                            <EcosystemModuleCard 
                                id={23}
                                hovered={hovered}
                                setHovered={setHovered}
                                icon={CalendarDays}
                                iconColor="text-amber-500"
                                iconBg="bg-amber-500/10"
                                title="Calendário financeiro"
                                subtitle="Compromissos e vencimentos"
                                mainText="10 Mai — Jantar de negócios"
                                subText="Fatura do cartão"
                                hoverInfo="Vencimento registrado"
                                hoverInfoColor="text-amber-500"
                            />
                        </div>

                        {/* Mobile Module 4 */}
                        <div className={`relative transition-all duration-700 delay-[700ms] ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-3'}`}>
                            {/* Dot indicator */}
                            <div className="absolute -left-[24px] top-6 w-2.5 h-2.5 rounded-full border-2 border-primary-600 bg-background-card z-10" />
                            <EcosystemModuleCard 
                                id={24}
                                hovered={hovered}
                                setHovered={setHovered}
                                icon={TrendingUp}
                                iconColor="text-primary-600"
                                iconBg="bg-primary-600/10"
                                title="Metas e saldo mensal"
                                subtitle="Previsão do mês"
                                mainText="Meta: R$ 800 • Previsto: R$ 3.450"
                                subText="Acompanhado manualmente"
                                hoverInfo="Meta acompanhada"
                                hoverInfoColor="text-emerald-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

/* Helper Module Card Component */
function EcosystemModuleCard({ 
    id, 
    hovered, 
    setHovered, 
    icon: Icon, 
    iconColor, 
    iconBg, 
    title, 
    subtitle, 
    mainText, 
    subText, 
    hoverInfo, 
    hoverInfoColor, 
    customContent 
}) {
    const isHovered = hovered === id || (id > 10 && id < 20 && hovered === id - 10) || (id > 20 && hovered === id - 20);
    const activeHoverId = id > 20 ? id - 20 : (id > 10 ? id - 10 : id);

    return (
        <div 
            tabIndex={0}
            className="p-4 rounded-xl border bg-background-card border-border-main hover:border-primary-500/40 hover:-translate-y-1 shadow-[0_4px_20px_rgba(0,0,0,0.01)] hover:shadow-md transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 select-none group text-left"
            style={{
                borderColor: isHovered ? 'var(--color-primary-500)' : undefined,
                transform: isHovered ? 'translateY(-4px)' : undefined,
                boxShadow: isHovered ? '0 12px 30px oklch(72% 0.082 74 / 0.08), 0 0 0 1px oklch(72% 0.082 74 / 0.05)' : undefined
            }}
            onMouseEnter={() => setHovered(activeHoverId)}
            onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(activeHoverId)}
            onBlur={() => setHovered(null)}
        >
            <div className="flex items-center gap-2.5 mb-2">
                <div className={`w-7 h-7 rounded-lg ${iconBg} ${iconColor} flex items-center justify-center shrink-0`}>
                    <Icon size={14} />
                </div>
                <div>
                    <h4 className="text-xs font-bold text-text-main leading-tight">{title}</h4>
                    <p className="text-[9px] text-text-dim leading-none mt-0.5">{subtitle}</p>
                </div>
            </div>
            
            <p className="text-[10px] font-semibold text-text-muted">{mainText}</p>
            <p className="text-[9px] text-text-dim mt-0.5">{subText}</p>
            
            {customContent}

            {/* Hover micro-info expandable block */}
            <div 
                className={`flex items-center gap-1.5 text-[9px] font-bold ${hoverInfoColor} transition-all duration-300 overflow-hidden ${
                    isHovered ? 'max-h-6 opacity-100 mt-2.5 pt-2.5 border-t border-border-main/50' : 'max-h-0 opacity-0 mt-0 pt-0'
                }`}
                style={{
                    willChange: 'max-height, opacity, margin-top, padding-top'
                }}
            >
                <CheckCircle2 size={10} className="shrink-0" />
                {hoverInfo}
            </div>
        </div>
    );
}


/* ── Keyframes ── */
const CSS_KEYFRAMES = `
  @keyframes drawLine {
    from { stroke-dashoffset: 250; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes logoSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes scrollPulse {
    0%,100% { opacity: 0.35; transform: scaleY(1); }
    50% { opacity: 0.85; transform: scaleY(1.2); }
  }
  @keyframes wave-move {
    0% { transform: translate3d(0, 0, 0); }
    100% { transform: translate3d(-1000px, 0, 0); }
  }
  @keyframes slide-down-mobile {
    0% { top: 0%; opacity: 0; }
    8% { opacity: 1; }
    92% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    .flowing-dot, .cta-wave-group {
      display: none !important;
    }
  }
`;

