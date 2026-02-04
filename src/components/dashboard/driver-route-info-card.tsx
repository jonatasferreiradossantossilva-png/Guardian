'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Car, Users, ArrowRight, Loader2, Edit } from 'lucide-react';
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { MonitorQuickEditForm } from './assistant-quick-edit-form';

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
  ] : []);
  const activeRoute = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  // 3. Get students for the route to show stats
   const { data: students, isLoading: areStudentsLoading } = useMockCollection('students', activeRoute ? [
    { field: 'id', op: 'in', value: activeRoute.studentIds }
  ] : []);
  
  // 4. Get all users to find monitors
  const { data: users, isLoading: areUsersLoading } = useMockCollection('users');

  const monitors = useMemo(() => (users || []).filter(u => u.profile === 'monitor'), [users]);
  const monitorsMap = useMemo(() => new Map(monitors.map(a => [a.id, a.name])), [monitors]);
  const currentMonitorName = useMemo(() => {
    if (!activeRoute?.monitorId) return "Nenhum";
    return monitorsMap.get(activeRoute.monitorId) || "Desconhecido";
  }, [activeRoute, monitorsMap]);

  const [isFormOpen, setIsFormOpen] = useState(false);

  const isLoading = areDriversLoading || areRoutesLoading || areStudentsLoading || areUsersLoading;

  if (!isClient) {
    return null;
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
    <div className="group-data-[collapsible=icon]:hidden px-2">
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <div className="p-3 rounded-lg bg-sidebar-accent border border-sidebar-border/50 text-sidebar-foreground">
              <div className="flex items-center gap-3">
                <Car className="text-sidebar-accent-foreground/80 h-5 w-5"/>
                <div>
                  <p className="text-xs text-sidebar-accent-foreground/80">Minha Rota (Motorista)</p>
                  <p className="text-sm font-semibold">{activeRoute.name}</p>
                </div>
              </div>
              <div className="text-xs space-y-2 mt-3">
                <div className="flex justify-between">
                  <span>Progresso:</span>
                  <span className="font-medium">{studentsOnBoard} / {totalStudents} a bordo</span>
                </div>
                 <div className="flex justify-between items-center">
                    <span>Monitor:</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium truncate max-w-[100px]">{currentMonitorName}</span>
                       <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-5 w-5" title="Trocar monitor">
                            <Edit className="h-3 w-3" />
                          </Button>
                       </DialogTrigger>
                    </div>
                </div>
              </div>
              <Button asChild size="sm" className="w-full mt-3">
                  <Link href="/driver/route-plan">
                      Ver Plano de Rota
                      <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
          </div>
           {monitors && (
              <MonitorQuickEditForm 
                route={activeRoute} 
                monitors={monitors} 
                onFormSubmit={handleFormSubmit}
              />
            )}
        </Dialog>
      )}
    </div>
  );
}

    