'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockDoc } from '@/hooks/use-mock-data';
import { Car, Route, Users, ArrowRight, Loader2 } from 'lucide-react';

export function DriverRouteInfoCard() {
  // In a real app, this would come from the logged-in user context.
  // For this simulation, we hardcode the admin's user ID.
  const mockAdminUserId = 'user-admin-1';

  // 1. Check if this admin user is also a driver
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', [
    { field: 'userId', op: '==', value: mockAdminUserId },
  ]);
  const driverProfile = useMemo(() => (drivers && drivers.length > 0 ? drivers[0] : null), [drivers]);

  // 2. If they are a driver, find their active route
  const { data: routes, isLoading: areRoutesLoading } = useMockCollection('routes', driverProfile ? [
    { field: 'driverId', op: '==', value: driverProfile.id },
    { field: 'active', op: '==', value: true },
  ] : []);
  const activeRoute = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  // 3. Get students for the route to show stats
   const { data: students, isLoading: areStudentsLoading } = useMockCollection('students', activeRoute ? [
    { field: 'id', op: 'in', value: activeRoute.studentIds }
  ] : []);

  const isLoading = areDriversLoading || areRoutesLoading || areStudentsLoading;

  if (isLoading) {
    return (
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Car />
                    Visão do Motorista
                </CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-6">
                 <Loader2 className="h-6 w-6 animate-spin" />
            </CardContent>
        </Card>
    );
  }

  // If the admin is not a driver or has no active route, render nothing.
  if (!driverProfile || !activeRoute || !students) {
    return null;
  }
  
  const studentsOnBoard = students.filter(s => s.status === 'a_bordo').length;
  const totalStudents = activeRoute.studentIds.length;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <Car className="text-primary"/>
          <div>
            Minha Rota como Motorista
            <p className="text-sm font-normal text-muted-foreground mt-1">Você também tem uma rota ativa atribuída.</p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center p-4 rounded-lg bg-background border">
            <div>
                <p className="text-sm text-muted-foreground">Rota Ativa</p>
                <p className="font-semibold text-lg">{activeRoute.name}</p>
            </div>
            <Badge variant="outline">{activeRoute.shift === 'manha' ? 'Manhã' : 'Tarde'}</Badge>
        </div>
         <div className="flex justify-between items-center p-4 rounded-lg bg-background border">
            <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="font-semibold text-lg">{studentsOnBoard} / {totalStudents} alunos a bordo</p>
            </div>
            <Users className="text-muted-foreground" />
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
            <Link href="/driver/route-plan">
                Ir para o Plano de Rota
                <ArrowRight className="ml-2"/>
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
