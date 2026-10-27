'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [hasActiveTrip, setHasActiveTrip] = useState<boolean | null>(null);
  
  useEffect(() => {
    const savedRouteId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('activeRouteId') || localStorage.getItem('activeRouteId'))
      : null;

    if (!savedRouteId) {
      // Se não há viagem ativa registrada, redireciona imediatamente para a Central de Operações
      router.replace('/driver/route-plan');
    } else {
      setHasActiveTrip(true);
    }
  }, [router]);

  if (hasActiveTrip === null) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="animate-spin text-primary h-10 w-10" />
        <p className="text-xs font-black uppercase tracking-widest text-primary/70">Verificando Viagem Ativa...</p>
      </div>
    );
  }

  return <DriverDashboard mode="active" />;
}
