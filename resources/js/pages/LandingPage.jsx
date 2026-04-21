import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
    CalendarDays, PiggyBank, LayoutDashboard,
    ArrowRight, CheckCircle2, Moon, Sun,
    Shield, Zap, TrendingUp, Sparkles, Wallet
} from 'lucide-react';

/* ─── Easing curves (ease-out-expo for confident motion) ─── */
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

/* ─── AnimatedNumber ─── */
function AnimatedNumber({ target, suffix = '' }) {
    const [value, setValue] = useState(0);
    const [ref, visible] = useScrollReveal(0.3);
    useEffect(() => {
        if (!visible) return;
        let start; const dur = 1200;
        const tick = (t) => {
            if (!start) start = t;
            const p = Math.min((t - start) / dur, 1);
            setValue(Math.floor((1 - Math.pow(1 - p, 4)) * target));
            if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }, [visible, target]);
    return <span ref={ref}>{value}{suffix}</span>;
}

/* ─── CursorSpotlight ─── */
function CursorSpotlight() {
    const ref = useRef(null);
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const move = (e) => {
            const rect = el.getBoundingClientRect();
            el.style.setProperty('--cx', `${e.clientX - rect.left}px`);
            el.style.setProperty('--cy', `${e.clientY - rect.top}px`);
        };
        el.addEventListener('mousemove', move, { passive: true });
        return () => el.removeEventListener('mousemove', move);
    }, []);
    return ref;
}

export default function LandingPage() {
    const { isAuthenticated, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const [scrolled, setScrolled] = useState(false);
    const [logoSpins, setLogoSpins] = useState(0);
    const heroRef = CursorSpotlight();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    return (
        <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
            <style>{CSS_KEYFRAMES}</style>

            {/* ── NAVBAR ── */}
            <header style={{
                position: 'fixed', top: 0, width: '100%', zIndex: 50,
                backgroundColor: scrolled ? 'var(--bg-primary)' : 'transparent',
                backdropFilter: scrolled ? 'blur(18px) saturate(180%)' : 'none',
                borderBottom: scrolled ? '1px solid var(--border-primary)' : '1px solid transparent',
                transition: `background-color 0.4s ${EASE_EXPO}, border-color 0.4s ${EASE_EXPO}, backdrop-filter 0.4s`,
            }}>
                <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    {/* Logo — easter egg: click rotates */}
                    <button
                        onClick={() => setLogoSpins(n => n + 1)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        title="✨"
                    >
                        <div style={{
                            width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                            boxShadow: '0 3px 10px -3px oklch(42% 0.108 148 / 0.28)',
                            animation: logoSpins ? `logoSpin 0.5s ${EASE_EXPO}` : 'none',
                            animationIterationCount: logoSpins,
                        }}>
                            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em' }}>OrganizeLife</span>
                    </button>

                    <nav style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <button onClick={toggleTheme} style={{ padding: 8, borderRadius: 10, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                            aria-label="Toggle theme">
                            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                        </button>
                        {loading ? <div style={{ width: 80, height: 34, borderRadius: 8, backgroundColor: 'var(--bg-tertiary)', animation: 'pulse 1.5s ease infinite' }} />
                            : isAuthenticated ? <Link to="/dashboard" className="btn-primary" style={{ fontSize: 14 }}>Meu painel</Link>
                                : <>
                                    <Link to="/login" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', textDecoration: 'none' }}>Login</Link>
                                    <Link to="/register" className="btn-primary" style={{ fontSize: 14 }}>Começar</Link>
                                </>
                        }
                    </nav>
                </div>
            </header>

            {/* ── HERO ── */}
            <section
                ref={heroRef}
                style={{
                    minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', paddingTop: 80, paddingBottom: 60,
                    position: 'relative', overflow: 'hidden',
                    /* cursor spotlight */
                    background: `radial-gradient(600px circle at var(--cx, 50%) var(--cy, 40%), oklch(42% 0.108 148 / 0.07), transparent 60%), var(--bg-primary)`,
                }}
            >
                {/* Background shapes */}
                <div aria-hidden style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', width: 560, height: 560, borderRadius: '50%', top: '2%', left: '12%', background: 'radial-gradient(circle, oklch(42% 0.108 148 / 0.06), transparent 70%)', animation: `orb1 13s ease-in-out infinite` }} />
                    <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', bottom: '8%', right: '10%', background: 'radial-gradient(circle, oklch(57% 0.130 65 / 0.05), transparent 70%)', animation: `orb2 18s ease-in-out infinite` }} />
                    <div style={{ position: 'absolute', inset: 0, opacity: 0.025, backgroundImage: `radial-gradient(circle at 1px 1px, var(--text-tertiary) 1px, transparent 0)`, backgroundSize: '38px 38px' }} />
                </div>

                <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px', textAlign: 'center', position: 'relative', zIndex: 1 }}>

                    {/* Heading */}
                    <h1 style={{
                        fontFamily: 'var(--font-heading)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.04,
                        fontSize: 'clamp(2.6rem, 7vw, 5.2rem)',
                        marginBottom: 24, animation: `fadeUp 0.65s 0.08s ${EASE_EXPO} both`
                    }}>
                        Uma nova forma de
                        <span style={{ position: 'relative', display: 'inline-block', color: 'var(--color-primary-500)', margin: '0 0.15em' }}>
                            organizar
                            {/* Animated underline */}
                            <svg viewBox="0 0 240 10" style={{ position: 'absolute', bottom: -4, left: 0, width: '100%', height: 10 }} preserveAspectRatio="none">
                                <path d="M4 7 Q60 1 120 6 Q180 11 236 5" stroke="var(--color-primary-400)" strokeWidth="2.5" fill="none" strokeLinecap="round" style={{ strokeDasharray: 250, animation: `drawLine 0.9s 0.5s ${EASE_EXPO} both` }} />
                            </svg>
                        </span>
                        <br />
                        o que <span style={{ color: 'var(--color-primary-700)' }}>importa</span>
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: 'clamp(1rem, 2.2vw, 1.2rem)', maxWidth: 580, margin: '0 auto 40px', lineHeight: 1.7,
                        color: 'var(--text-secondary)', fontWeight: 500,
                        animation: `fadeUp 0.65s 0.16s ${EASE_EXPO} both`
                    }}>
                        O OrganizeLife é um sistema centralizado para organizar suas contas, rendas e compromissos. Abandone a fricção das rotinas complexas e ganhe clareza do seu dia a dia.
                    </p>

                    {/* CTAs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', animation: `fadeUp 0.65s 0.24s ${EASE_EXPO} both` }}>
                        {!isAuthenticated && (
                            <Link to="/register" style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '14px 28px', borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: 'none', color: '#fff',
                                background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))',
                                boxShadow: '0 6px 18px -4px oklch(34% 0.090 149 / 0.35)',
                                transition: `transform 0.25s ${EASE_EXPO}, box-shadow 0.25s ${EASE_EXPO}`,
                            }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 26px -4px oklch(34% 0.090 149 / 0.45)'; }}
                                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 6px 18px -4px oklch(34% 0.090 149 / 0.35)'; }}
                                onMouseDown={e => e.currentTarget.style.transform = 'translateY(1px) scale(0.98)'}
                                onMouseUp={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                            >
                                Crie sua conta
                            </Link>
                        )}
                        <a href="#features" style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            padding: '14px 28px', borderRadius: 12, fontWeight: 600, fontSize: 15, textDecoration: 'none',
                            backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)',
                            outline: '1px solid var(--border-primary)',
                            transition: `transform 0.25s ${EASE_EXPO}, background-color 0.2s`,
                        }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'var(--bg-card)'; e.currentTarget.style.transform = ''; }}
                        >
                            Conhecer recursos
                        </a>
                    </div>

                    {/* Trust signals */}
                    <div style={{ marginTop: 48, display: 'flex', flexWrap: 'wrap', gap: '10px 28px', justifyContent: 'center', animation: `fadeUp 0.65s 0.34s ${EASE_EXPO} both` }}>
                        {[
                            { text: 'Foco em Produtividade', tip: 'Sem distrações. Direto ao ponto.' },
                            { text: 'Interface Minimalista', tip: 'Menos ruído, mais clareza.' },
                            { text: 'Controle Total dos Dados', tip: 'Seus dados são seus.' },
                        ].map(({ text, tip }) => (
                            <TrustPill key={text} text={text} tip={tip} />
                        ))}
                    </div>
                </div>

                {/* Scroll cue */}
                <div aria-hidden style={{ position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, opacity: 0.35, animation: `fadeUp 1s 0.8s ${EASE_EXPO} both` }}>
                    <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>scroll</span>
                    <div style={{ width: 1, height: 28, background: 'linear-gradient(to bottom, var(--text-tertiary), transparent)' }} />
                </div>
            </section>

            {/* ── STATS STRIP ── */}
            <section style={{ borderTop: '1px solid var(--border-primary)', borderBottom: '1px solid var(--border-primary)', backgroundColor: 'var(--bg-secondary)', padding: '28px 24px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, textAlign: 'center' }}>
                    {[
                        { label: 'Categorias', target: 20, suffix: '+' },
                        { label: 'Módulos', target: 5, suffix: '' },
                        { label: 'Widgets', target: 8, suffix: '+' },
                        { label: 'Gratuito', target: 100, suffix: '%' },
                    ].map(({ label, target, suffix }) => (
                        <div key={label}>
                            <p style={{ fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontWeight: 800, fontFamily: 'var(--font-heading)', letterSpacing: '-0.04em', color: 'var(--color-primary-600)' }}><AnimatedNumber target={target} suffix={suffix} /></p>
                            <p style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: 'var(--text-tertiary)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── FEATURES ── */}
            <section id="features" style={{ padding: 'clamp(60px, 8vw, 112px) 24px', backgroundColor: 'var(--bg-secondary)' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                    <RevealBlock style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto 56px' }}>
                        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--color-primary-600)', marginBottom: 12 }}>Tudo em um só lugar</p>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 16 }}>A arquitetura da sua rotina</h2>
                        <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--text-secondary)' }}>Projetado com rigor técnico para modelar sua rotina de forma fluida.</p>
                    </RevealBlock>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        {FEATURES.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 70} />)}
                    </div>
                </div>
            </section>

            {/* ── CTA ── */}
            <section style={{ padding: 'clamp(60px, 8vw, 96px) 24px', backgroundColor: 'var(--bg-primary)' }}>
                <div style={{ maxWidth: 860, margin: '0 auto' }}>
                    <RevealBlock>
                        <div style={{
                            borderRadius: 28, padding: 'clamp(40px, 6vw, 72px) clamp(32px, 5vw, 64px)',
                            textAlign: 'center', position: 'relative', overflow: 'hidden',
                            background: 'linear-gradient(160deg, var(--color-primary-800), var(--color-primary-900))',
                        }}>
                            {/* Particles */}
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} aria-hidden style={{
                                    position: 'absolute', borderRadius: '50%', opacity: 0.12,
                                    background: i % 2 === 0 ? 'var(--color-primary-500)' : 'var(--color-warning-500)',
                                    width: [80, 120, 60, 100, 70, 90][i], height: [80, 120, 60, 100, 70, 90][i],
                                    top: ['10%', '-15%', '60%', '75%', '20%', '55%'][i],
                                    left: ['-5%', '70%', '85%', '-8%', '40%', '55%'][i],
                                    filter: 'blur(30px)',
                                    animation: `orb${i % 2 + 1} ${14 + i * 2}s ease-in-out infinite`,
                                }} />
                            ))}
                            <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '26px 26px' }} />

                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>
                                    <Sparkles size={12} /> Comece hoje
                                </div>
                                <h2 style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: 'clamp(1.7rem, 4vw, 2.6rem)', letterSpacing: '-0.03em', lineHeight: 1.1, color: '#fff', marginBottom: 16 }}>Conheça o ecossistema</h2>
                                <p style={{ fontSize: 17, lineHeight: 1.65, color: 'var(--color-primary-200)', maxWidth: 480, margin: '0 auto 36px', fontWeight: 500 }}>
                                    Um espaço digital desenvolvido para manter o equilíbrio das suas finanças e calendário. Menos distrações, mais clareza.
                                </p>
                                {!isAuthenticated && (
                                    <Link to="/register" style={{
                                        display: 'inline-flex', alignItems: 'center', gap: 8,
                                        padding: '15px 32px', borderRadius: 12, backgroundColor: '#fff',
                                        color: 'var(--color-primary-800)', fontWeight: 700, fontSize: 15, textDecoration: 'none',
                                        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
                                        transition: `transform 0.25s ${EASE_EXPO}, box-shadow 0.25s`,
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 14px 40px rgba(0,0,0,0.25)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.18)'; }}
                                    >
                                        Criar conta gratuitamente <ArrowRight size={16} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </RevealBlock>
                </div>
            </section>

            {/* ── FOOTER ── */}
            <footer style={{ backgroundColor: 'var(--bg-secondary)', borderTop: '1px solid var(--border-primary)', padding: '40px 24px' }}>
                <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.75 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--color-primary-600), var(--color-primary-700))' }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                            </svg>
                        </div>
                        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 15 }}>OrganizeLife</span>
                    </div>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Desenvolvido com carinho para simplificar dias complexos.</p>
                    <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>© {new Date().getFullYear()} OrganizeLife. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

/* ── TrustPill — delight: tooltip reveal ── */
function TrustPill({ text, tip }) {
    const [show, setShow] = useState(false);
    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)', cursor: 'default' }}
            onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            <CheckCircle2 size={15} style={{ color: 'var(--color-primary-500)', flexShrink: 0 }} />
            {text}
            {show && (
                <span style={{
                    position: 'absolute', bottom: '130%', left: '50%', transform: 'translateX(-50%)',
                    whiteSpace: 'nowrap', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)',
                    borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 600,
                    color: 'var(--text-primary)', boxShadow: 'var(--shadow-md)',
                    animation: `fadeUp 0.2s ${EASE_EXPO} both`, pointerEvents: 'none', zIndex: 10,
                }}>
                    {tip}
                </span>
            )}
        </div>
    );
}

/* ── RevealBlock ── */
function RevealBlock({ children, style = {} }) {
    const [ref, visible] = useScrollReveal(0.1);
    return (
        <div ref={ref} style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(26px)',
            transition: `opacity 0.65s ${EASE_EXPO}, transform 0.65s ${EASE_EXPO}`,
            ...style,
        }}>{children}</div>
    );
}

/* ── FeatureCard ── */
function FeatureCard({ icon: Icon, title, description, delay, color }) {
    const [ref, visible] = useScrollReveal(0.08);
    const [hovered, setHovered] = useState(false);

    return (
        <div ref={ref} style={{
            padding: '28px 26px', borderRadius: 18, cursor: 'default',
            backgroundColor: 'var(--bg-card)',
            border: `1px solid ${hovered ? color + '60' : 'var(--border-primary)'}`,
            boxShadow: hovered ? `0 12px 36px -8px ${color}30` : 'var(--shadow-card)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(28px)',
            transition: `opacity 0.6s ${delay}ms ${EASE_EXPO}, transform 0.6s ${delay}ms ${EASE_EXPO}, border-color 0.3s, box-shadow 0.3s`,
        }}
            onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

            {/* Icon */}
            <div style={{
                width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18,
                backgroundColor: color + '18',
                transform: hovered ? 'scale(1.1) rotate(-4deg)' : 'scale(1)',
                transition: `transform 0.3s ${EASE_EXPO}`,
            }}>
                <Icon size={20} style={{ color }} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-secondary)' }}>{description}</p>
        </div>
    );
}

/* ── Data ──
   Paleta sóbria: chroma baixo (0.08–0.10), análoga ao hue primary (178),
   evita arco-íris neon. Dois tons quentes, dois frios, dois neutros.
── */
const FEATURES = [
    /* Paleta discreta: todos derivados do emerald hue 148, chroma contido */
    { icon: PiggyBank, color: 'oklch(42% 0.108 148)', title: 'Gastos sob controle', description: 'Adicione suas contas fixas, saiba exatamente para onde seu dinheiro vai todo mês e evite surpresas na fatura.' },
    { icon: CalendarDays, color: 'oklch(38% 0.090 195)', title: 'Agenda Inteligente', description: 'Uma visão completa das suas tarefas, compromissos e datas de vencimento. Prazos nunca mais serão esquecidos.' },
    { icon: LayoutDashboard, color: 'oklch(36% 0.082 230)', title: 'Visão Completa', description: 'Um dashboard impecável e minimalista. Em poucos segundos de manhã, você sabe tudo o que precisa ser feito.' },
    { icon: Shield, color: 'oklch(40% 0.098 148)', title: 'Seguro & Privado', description: 'Seus dados criptografados e protegidos. Autenticação de dois fatores e controle de sessão disponíveis.' },
    { icon: Zap, color: 'oklch(52% 0.118 68)', title: 'Rápido & Leve', description: 'Interface construída para ser instantânea. Sem carregamentos desnecessários, sem travamentos.' },
    { icon: TrendingUp, color: 'oklch(46% 0.100 28)', title: 'Orçamento Inteligente', description: 'Regras de orçamento flexíveis (50/30/20) que se adaptam às suas metas financeiras pessoais.' },
];

/* ── Keyframes ── */
const CSS_KEYFRAMES = `
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes drawLine {
    from { stroke-dashoffset: 250; }
    to   { stroke-dashoffset: 0; }
  }
  @keyframes ping {
    75%, 100% { transform: scale(2); opacity: 0; }
  }
  @keyframes orb1 {
    0%,100% { transform: translate(0,0) scale(1); }
    33% { transform: translate(45px,-35px) scale(1.08); }
    66% { transform: translate(-25px,20px) scale(0.95); }
  }
  @keyframes orb2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50% { transform: translate(-40px,-30px) scale(1.1); }
  }
  @keyframes logoSpin {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulse {
    0%,100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
