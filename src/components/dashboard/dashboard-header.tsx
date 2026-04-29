'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect } from 'react';

export function DashboardHeader() {
  const [userId, setUserId] = useState<string>('user-admin-1');

  useEffect(() => {
    const savedId = sessionStorage.getItem('mockUserId');
    if (savedId) setUserId(savedId);
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between gap-4 border-b bg-background/95 backdrop-blur-md px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />
        <div className="hidden md:flex items-center gap-3">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 px-3 py-1 font-bold">
                MÓDULO GESTÃO
            </Badge>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="hidden sm:flex flex-col items-end">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">Ambiente de Operação</p>
            <p className="text-[11px] font-bold text-primary">Guardian Cloud v2.5</p>
        </div>
        <NotificationBell />
      </div>
    </header>
  );
}
