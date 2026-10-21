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

/**
 * Parses and returns a safe date string in 'yyyy-MM-dd' format.
 * Handles strings, Date objects, and Firestore Timestamp objects ({seconds, nanoseconds}).
 */
export function getSafeDateStr(dateVal: unknown): string {
  if (!dateVal) return '';
  if (typeof dateVal === 'string') return dateVal.split('T')[0];
  if (typeof dateVal === 'object') {
    // Firestore Timestamp checks
    if ('toDate' in dateVal && typeof (dateVal as any).toDate === 'function') {
      try {
        return (dateVal as any).toDate().toISOString().split('T')[0];
      } catch {}
    }
    if ('seconds' in dateVal && typeof (dateVal as any).seconds === 'number') {
      try {
        return new Date((dateVal as any).seconds * 1000).toISOString().split('T')[0];
      } catch {}
    }
    if (dateVal instanceof Date) {
      try {
        return dateVal.toISOString().split('T')[0];
      } catch {}
    }
  }
  return String(dateVal).split('T')[0];
}

/**
 * Resolves any date-like input to a valid JS Date object.
 * Safe fallback to new Date() if invalid, avoiding RangeErrors.
 */
export function getSafeDate(dateVal: unknown): Date {
  if (!dateVal) return new Date();
  if (dateVal instanceof Date) return dateVal;
  if (typeof dateVal === 'object') {
    if ('toDate' in dateVal && typeof (dateVal as any).toDate === 'function') {
      try {
        return (dateVal as any).toDate();
      } catch {}
    }
    if ('seconds' in dateVal && typeof (dateVal as any).seconds === 'number') {
      try {
        return new Date((dateVal as any).seconds * 1000);
      } catch {}
    }
  }
  const parsed = new Date(dateVal as any);
  if (isNaN(parsed.getTime())) {
    return new Date();
  }
  return parsed;
}

