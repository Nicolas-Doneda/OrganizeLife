import React from 'react';

export default function LogoMark({ className = '', size = 24, strokeColor = 'currentColor', fillColor = 'currentColor', strokeWidth = "2" }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            {/* Outer track - 50% (Right side sweep) */}
            <path d="M 12 3 A 9 9 0 0 1 12 21" />
            
            {/* Middle track - 30% (Left side sweep) */}
            <path d="M 12 6 A 6 6 0 0 0 12 18" />
            
            {/* Inner track - 20% (Right side sweep) */}
            <path d="M 12 9 A 3 3 0 0 1 12 15" />
            
            {/* Nucleus dot */}
            <circle cx="12" cy="12" r="1.2" fill={fillColor} stroke="none" />
        </svg>
    );
}
