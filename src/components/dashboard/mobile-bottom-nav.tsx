'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, DollarSign, MapPin, Menu, Megaphone, Milestone, Bus, CircleDashed, CarFront, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar';
import { useDataCollection } from '@/hooks/use-data';
import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

/**
 * MobileBottomNav - Inteligente e Adaptativa.
 * Aparece apenas no final da tela ou quando necessário, liberando espaço de leitura.
 */
export const MobileBottomNav = React.memo(() => {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();
  const [isVisible, setIsVisible] = useState(true);

  const isParent = pathname.includes('/parent');

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      
      // Regra: Visível no final da tela (margem de 100px) ou se a página for muito curta (sem scroll)
      const isAtBottom = (scrollY + windowHeight) >= (docHeight - 100);
      const isShortPage = docHeight <= windowHeight + 50;

      setIsVisible(isAtBottom || isShortPage);
    };

    // Registrar o evento com debouncing natural do browser
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Executar uma vez no load para garantir estado inicial correto
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUserId(sessionStorage.getItem('mockUserId'));
  }, []);

  // Detectar se é motorista para habilitar o atalho autônomo
  const { data: drivers } = useDataCollection('drivers', []);
  const isDriver = useMemo(() => {
    if (!currentUserId || !drivers) return false;
    return drivers.some((d: any) => d.userId === currentUserId);
  }, [drivers, currentUserId]);

  // Itens dinâmicos baseados na rota atual
  const navItems = isParent 
    ? [
        { href: '/parent/tracking', label: 'Mapa', icon: MapPin },
        { href: '/parent/mural', label: 'Mural', icon: Megaphone },
        { href: '/parent/requests', label: 'Viagens', icon: Milestone },
      ]
    : [
        { href: '/dashboard', label: 'Painel', icon: LayoutGrid },
        // Se for autônomo, trocamos "Frotas" por "Minha Van"
        isDriver 
            ? { href: '/driver/route-plan', label: 'Minha Van', icon: CarFront, isSpecial: true }
            : { href: '/dashboard/management/routes', label: 'Frotas', icon: Bus },
        { href: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
      ];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.nav 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
          className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-xl border-t border-white/5 h-[75px] flex items-center justify-around px-4 pb-safe md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.4)]"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href === '/driver/route-plan' && pathname === '/driver/active');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all duration-300 flex-1 relative",
                  isActive ? "text-primary" : "text-zinc-500 hover:text-zinc-300",
                  (item as any).isSpecial && "text-amber-400"
                )}
              >
                <div className={cn(
                  "p-2 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10" : "bg-transparent",
                  (item as any).isSpecial && !isActive && "bg-amber-400/5"
                )}>
                    <item.icon className={cn("h-5 w-5", isActive && "stroke-[2.5px] scale-110", (item as any).isSpecial && "text-amber-400")} />
                    {(item as any).isSpecial && (
                        <div className="absolute top-1 right-1">
                            <Sparkles className="h-2 w-2 text-amber-300 animate-pulse" />
                        </div>
                    )}
                </div>
                <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest leading-none", 
                    isActive ? "text-primary" : "text-zinc-500",
                    (item as any).isSpecial && "text-amber-400"
                )}>
                    {item.label}
                </span>
              </Link>
            );
          })}
          
          <button
            onClick={toggleSidebar}
            className="flex flex-col items-center gap-1.5 p-2 rounded-2xl text-zinc-500 hover:text-zinc-300 transition-all duration-300 flex-1 relative"
          >
            <div className="p-2 rounded-xl bg-transparent">
                <Menu className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-none">Mais</span>
          </button>
        </motion.nav>
      )}
    </AnimatePresence>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
