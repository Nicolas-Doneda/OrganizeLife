import { useState, useEffect } from 'react';

export default function CurrencyInput({ value, onChange, ...props }) {
    const [displayValue, setDisplayValue] = useState('');

    useEffect(() => {
        // Handle initialization or external resets
        if (value === undefined || value === null || value === '') {
            setDisplayValue('');
            return;
        }

        const parsed = Number(value);
        if (!isNaN(parsed)) {
            // Check if the current typed digits match the external value
            // so we don't accidentally overwrite the user's continuous typing
            const currentRaw = displayValue.replace(/\D/g, '');
            const currentNum = Number(currentRaw) / 100;
            
            // Only update display if they differ (e.g., initial load or API update)
            if (currentNum !== parsed) {
                setDisplayValue(
                    parsed.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                );
            }
        }
    }, [value]);

    const handleChange = (e) => {
        let val = e.target.value;
        // Strip everything except digits
        let digits = val.replace(/\D/g, '');

        if (!digits) {
            setDisplayValue('');
            onChange(''); // Let parent clear it
            return;
        }

        // Convert exactly to float by moving decimal point 2 places left
        const numericValue = Number(digits) / 100;

        // Immediately format to visually update
        setDisplayValue(
            numericValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        );

        // Feed purely the numeric/string equivalent upwards to forms
        onChange(numericValue.toString());
    };

    return (
        <input
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            {...props}
        />
    );
}
