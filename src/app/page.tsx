'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase/provider';
import { useDataCollection } from '@/hooks/use-data';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const router = useRouter();
  const auth = useAuth();
  const { data: users, isLoading } = useDataCollection('users');

  useEffect(() => {
    if (isLoading) return;

    const storedUserId = typeof window !== 'undefined'
      ? (sessionStorage.getItem('mockUserId') || localStorage.getItem('mockUserId'))
      : null;
    const currentUid = auth?.currentUser?.uid || storedUserId;

    if (!currentUid) {
      router.replace('/login');
      return;
    }

    const matchedUser = Array.isArray(users) 
      ? users.find((u: any) => u.id === currentUid || u.userId === currentUid) 
      : null;
    const profile = matchedUser?.profile;

    if (profile === 'motorista') {
      const activeRouteId = typeof window !== 'undefined'
        ? (sessionStorage.getItem('activeRouteId') || localStorage.getItem('activeRouteId'))
        : null;
      router.replace(activeRouteId ? '/driver/active' : '/driver/route-plan');
    } else if (profile === 'pai') {
      router.replace('/parent/tracking');
    } else if (profile === 'monitor') {
      router.replace('/monitor');
    } else if (profile === 'gestor') {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [auth?.currentUser?.uid, users, isLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
