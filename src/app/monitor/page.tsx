'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const MonitorDashboardContent = dynamic(() => import('@/components/monitor/monitor-dashboard-content'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-xs font-black uppercase tracking-widest text-primary/70">Sincronizando Lista de Alunos...</p>
    </div>
  )
});

export default function MonitorPage() {
  return <MonitorDashboardContent />;
}
