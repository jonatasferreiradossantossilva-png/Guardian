'use client';

import React, { useState, useEffect } from 'react';

/**
 * ClientOnly: Um wrapper utilitário para evitar erros de hidratação no Next.js.
 * Garante que o conteúdo dentro dele só seja montado após a inicialização 
 * completa do React no navegador. Útil para PWA e componentes mobile-only.
 */
export function ClientOnly({ children, fallback = null }: { children: React.ReactNode, fallback?: React.ReactNode }) {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
