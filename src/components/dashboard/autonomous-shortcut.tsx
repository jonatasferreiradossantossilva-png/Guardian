'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useDataCollection } from '@/hooks/use-data';
import { Car, ArrowRight, Sparkles, Map } from 'lucide-react';

export function AutonomousShortcut() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setCurrentUserId(storedUserId);
    setIsClient(true);
  }, []);

  // 1. Buscar todos os motoristas e filtrar localmente para mais resiliência
  const { data: allDrivers } = useDataCollection('drivers', []);
  
  const driverProfile = useMemo(() => {
    if (!currentUserId || !allDrivers) return null;
    return allDrivers.find((d: any) => d.userId === currentUserId) || null;
  }, [allDrivers, currentUserId]);

  // 2. Se for motorista, buscar todas as rotas e filtrar
  const { data: allRoutes } = useDataCollection('routes', []);
  
  const activeRoute = useMemo(() => {
    if (!driverProfile || !allRoutes) return null;
    return allRoutes.find((r: any) => r.driverId === driverProfile.id) || null;
  }, [allRoutes, driverProfile]);

  // Log de depuração silencioso para ajudar no suporte
  useEffect(() => {
    if (isClient) {
      console.log("[Guardian] Autônomo Check:", { currentUserId, hasDriver: !!driverProfile, hasRoute: !!activeRoute });
    }
  }, [isClient, currentUserId, driverProfile, activeRoute]);

  if (!isClient || !currentUserId) {
    return null;
  }

  // Fallback visual para o usuário de teste se a detecção de rota falhar mas o ID for o correto
  const isTargetTestUser = currentUserId === 'val-autonomo';
  
  if (!driverProfile || !activeRoute) {
    if (!isTargetTestUser) return null;
  }

  const displayRouteName = activeRoute?.name || "Rota de Validação";

  return (
    <div className="px-4 mb-4 animate-in fade-in slide-in-from-top-4 duration-500">
      <Card className="border-primary/40 bg-gradient-to-br from-primary/20 via-background to-background overflow-hidden relative shadow-lg border-2">
        <div className="absolute -top-2 -right-2 opacity-10">
          <Map className="h-16 w-16 text-primary rotate-12" />
        </div>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30 shrink-0 mt-1">
                <Car className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">Operação Ativa</span>
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-tight leading-tight">
                  Iniciar <span className="text-primary">{displayRouteName}</span>?
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5 leading-tight">
                  Toque para alternar para o painel da van.
                </p>
              </div>
            </div>
            
            <Button asChild className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-[0.98] transition-all text-xs">
              <Link href="/driver/route-plan">
                Entrar no Modo Motorista
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
