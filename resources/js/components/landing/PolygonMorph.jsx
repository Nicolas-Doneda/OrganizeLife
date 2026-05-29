import React, { useState, useEffect } from 'react';

const SHAPES = {
    COIN: [
        [50, 50, 85, 50, 80, 68],
        [50, 50, 80, 68, 68, 80],
        [50, 50, 68, 80, 50, 85],
        [50, 50, 50, 85, 32, 80],
        [50, 50, 32, 80, 20, 68],
        [50, 50, 20, 68, 15, 50],
        [50, 50, 15, 50, 20, 32],
        [50, 50, 20, 32, 32, 20],
        [50, 50, 32, 20, 50, 15],
        [50, 50, 50, 15, 68, 20],
        [50, 50, 68, 20, 80, 32],
        [50, 50, 80, 32, 85, 50],
    ],
    WALLET: [
        [50, 50, 80, 50, 80, 30],
        [50, 50, 80, 30, 50, 32],
        [50, 50, 50, 32, 20, 30],
        [50, 50, 20, 30, 20, 50],
        [50, 50, 20, 50, 20, 70],
        [50, 50, 20, 70, 35, 70],
        [50, 50, 35, 70, 50, 68],
        [50, 50, 50, 68, 65, 70],
        [50, 50, 65, 70, 80, 70],
        [50, 50, 80, 70, 80, 50],
        [50, 50, 35, 45, 20, 50],
        [50, 50, 65, 45, 80, 50],
    ],
    ARROW: [
        [65, 35, 85, 15, 75, 75],
        [65, 35, 85, 15, 45, 45],
        [65, 35, 45, 45, 55, 45],
        [65, 35, 55, 45, 75, 75],
        [55, 45, 45, 55, 15, 85],
        [55, 45, 15, 85, 25, 75],
        [25, 75, 15, 85, 20, 80],
        [20, 80, 15, 85, 15, 85],
        [65, 35, 65, 35, 85, 15],
        [45, 45, 45, 45, 85, 15],
        [55, 45, 55, 45, 45, 55],
        [15, 85, 15, 85, 25, 75],
    ]
};

const SHARD_BRIGHTNESS = [
    1.12, 0.90, 0.78, 1.08, 0.95, 0.82,
    1.04, 0.74, 0.68, 1.00, 0.86, 0.92
];

const STATES = ['COIN', 'WALLET', 'ARROW'];
const STATE_LABELS = {
    COIN: 'Evolução e Receitas',
    WALLET: 'Orçamento Inteligente',
    ARROW: 'Poupança e Metas'
};

export default function PolygonMorph() {
    const [stateIndex, setStateIndex] = useState(0);
    const currentState = STATES[stateIndex];

    useEffect(() => {
        const interval = setInterval(() => {
            setStateIndex((prev) => (prev + 1) % STATES.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const cycleState = () => {
        setStateIndex((prev) => (prev + 1) % STATES.length);
    };

    const getClipPath = (shardIndex) => {
        const coords = SHAPES[currentState][shardIndex];
        return `polygon(${coords[0]}% ${coords[1]}%, ${coords[2]}% ${coords[3]}%, ${coords[4]}% ${coords[5]}%)`;
    };

    return (
        <div 
            onClick={cycleState}
            style={{
                position: 'relative',
                width: 'min(280px, 75vw)',
                height: 'min(280px, 75vw)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                userSelect: 'none',
            }}
            title="Clique para mudar a forma ✨"
        >
            {/* The Shard Container */}
            <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                {Array.from({ length: 12 }).map((_, i) => (
                    <div
                        key={i}
                        className="polygon-shard"
                        style={{
                            position: 'absolute',
                            inset: 0,
                            backgroundColor: 'var(--color-primary-500)',
                            filter: `brightness(${SHARD_BRIGHTNESS[i]})`,
                            clipPath: getClipPath(i),
                            WebkitClipPath: getClipPath(i),
                            willChange: 'clip-path',
                        }}
                    />
                ))}
            </div>

            {/* Sub-label showing current conceptual focus */}
            <div style={{
                marginTop: 16,
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text-secondary)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                transition: 'opacity 0.4s ease',
                textAlign: 'center',
                minHeight: '1.2em'
            }}>
                {STATE_LABELS[currentState]}
            </div>
        </div>
    );
}
