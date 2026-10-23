'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const DriverDashboard = dynamic(() => import('@/components/driver/driver-dashboard-content'), { 
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-screen space-y-4">
      <Loader2 className="animate-spin text-primary h-10 w-10" />
      <p className="text-xs font-black uppercase tracking-widest text-primary/70">Carregando Viagem Ativa...</p>
    </div>
  )
});

export default function DriverActiveTripPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return <DriverDashboard mode="active" />;
}
