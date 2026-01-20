'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Car, Users, ArrowRight, Loader2, Edit } from 'lucide-react';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AssistantQuickEditForm } from './assistant-quick-edit-form';

export function DriverRouteInfoCard() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // For this prototype, we get the logged-in user's ID from session storage.
    const storedUserId = sessionStorage.getItem('mockUserId');
    setCurrentUserId(storedUserId);
    setIsClient(true);
  }, []);


  // 1. Check if the currently logged-in user is also a driver
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', currentUserId ? [
    { field: 'userId', op: '==', value: currentUserId },
  ] : undefined);
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
  
  // 4. Get all users to find assistants
  const { data: users, isLoading: areUsersLoading } = useMockCollection('users');

  const assistants = useMemo(() => (users || []).filter(u => u.profile === 'auxiliar'), [users]);
  const assistantsMap = useMemo(() => new Map(assistants.map(a => [a.id, a.name])), [assistants]);
  const currentAssistantName = useMemo(() => {
    if (!activeRoute?.assistantId) return "Nenhum";
    return assistantsMap.get(activeRoute.assistantId) || "Desconhecido";
  }, [activeRoute, assistantsMap]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const isLoading = areDriversLoading || areRoutesLoading || areStudentsLoading || areUsersLoading;

  if (!isClient || isLoading) {
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

  const handleFormSubmit = () => {
      setIsFormOpen(false);
  }

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
        <div className="flex justify-between items-center p-4 rounded-lg bg-background border">
            <div>
                <p className="text-sm text-muted-foreground">Auxiliar da Rota</p>
                <p className="font-semibold text-lg">{currentAssistantName}</p>
            </div>
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Edit className="mr-2 h-3 w-3"/>
                        Trocar
                    </Button>
                </DialogTrigger>
                <AssistantQuickEditForm 
                    route={activeRoute}
                    assistants={assistants}
                    onFormSubmit={handleFormSubmit}
                />
            </Dialog>
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
