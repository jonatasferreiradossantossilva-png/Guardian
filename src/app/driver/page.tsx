'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DriverPage() {
  const router = useRouter();

  useEffect(() => {
    const activeRouteId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('activeRouteId') || localStorage.getItem('activeRouteId'))
      : null;
    router.replace(activeRouteId ? '/driver/active' : '/driver/route-plan');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
