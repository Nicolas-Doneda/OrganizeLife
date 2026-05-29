// Helper: extrai 'YYYY-MM-DD' de qualquer formato de data
export function normalizeDate(dateStr) {
    if (!dateStr) return '';
    return String(dateStr).substring(0, 10);
}

// Helper: formata para exibicao 'DD/MM/AAAA' sem deslocar fuso horario
export function formatDateBR(dateStr) {
    const d = normalizeDate(dateStr);
    if (!d || d.length < 10) return '';
    const [y, m, dd] = d.split('-');
    return `${dd}/${m}/${y}`;
}
