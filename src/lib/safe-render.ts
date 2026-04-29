/**
 * Guardian Safe Render Utilities
 * Centraliza a sanitização de dados para evitar erros de renderização "Child".
 */

/**
 * Garante que o valor retornado seja uma string.
 * Evita que objetos ou undefined tentem ser renderizados como React children.
 */
export function safeString(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    return fallback;
}

/**
 * Garante que o valor seja um array iterável.
 * Previne erros de ".map is not a function".
 */
export function safeArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) return value;
    return [];
}

/**
 * Gera iniciais de forma segura para Avatares.
 * Blindado contra valores undefined, null ou nomes vazios.
 */
export function safeInitials(name: unknown): string {
    const sName = safeString(name);
    if (!sName || sName.trim() === '') return '?';
    
    try {
        const parts = sName.trim().split(/\s+/).filter(Boolean);
        if (parts.length === 0) return '?';
        if (parts.length === 1) return parts[0][0]?.toUpperCase() || '?';
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    } catch (e) {
        return '?';
    }
}

/**
 * Sanitiza campos de um objeto para renderização segura (shallow).
 * Útil para objetos de mock do Firestore.
 */
export function sanitize(obj: any): any {
    if (!obj) return {};
    const result: any = { ...obj };
    Object.keys(result).forEach(key => {
        if (result[key] === null || result[key] === undefined) {
            result[key] = '';
        }
    });
    return result;
}
