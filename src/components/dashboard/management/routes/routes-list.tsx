
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Sparkles, Users, User, AlertTriangle, Car, Edit, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RouteForm } from "@/components/dashboard/management/routes/route-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useDataCollection, useData } from '@/hooks/use-data';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SafeTableRow, SafeRow } from "@/components/shared/safe-table";
import { safeInitials, safeArray } from "@/lib/safe-render";



import { Route, Driver, Student, User as Monitor, Vehicle, SchoolData as School } from '@/types/mock-data';

interface RoutesListProps {
  initialRoutes: Route[];
  initialDrivers: Driver[];
  initialStudents: Student[];
  initialMonitors: Monitor[];
  initialVehicles: Vehicle[];
  initialSchools: School[];
}

export function RoutesList({ initialRoutes, initialDrivers, initialStudents, initialMonitors, initialVehicles, initialSchools }: RoutesListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useData();

  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  const { data: liveRoutes, isLoading: areRoutesLoading } = useDataCollection('routes');
  const { data: liveDrivers, isLoading: areDriversLoading } = useDataCollection('drivers');
  const { data: liveStudents, isLoading: areStudentsLoading } = useDataCollection('students');
  const { data: liveUsers, isLoading: areUsersLoading } = useDataCollection('users');
  const { data: liveVehicles, isLoading: areVehiclesLoading } = useDataCollection('vehicles');
  const { data: liveSchools, isLoading: areSchoolsLoading } = useDataCollection('schools');


  const routes = useMemo(() => {
    const rawRoutes = liveRoutes ?? initialRoutes;
    if (!rawRoutes) return [];
    // Filtro defensivo para evitar duplicidade visual se houver erro no salvamento
    const uniqueIds = new Set();
    return rawRoutes.filter(r => {
        if (uniqueIds.has(r.id)) return false;
        uniqueIds.add(r.id);
        return true;
    });
  }, [liveRoutes, initialRoutes]);

  const rawDrivers = liveDrivers ?? initialDrivers ?? [];
  const rawStudents = liveStudents ?? initialStudents ?? [];
  const rawMonitors = useMemo(() => (liveUsers ?? initialMonitors ?? []).filter(u => u.profile === 'monitor'), [liveUsers, initialMonitors]);
  const rawVehicles = liveVehicles ?? initialVehicles ?? [];
  const rawSchools = liveSchools ?? initialSchools ?? [];
  
  const isLoading = areRoutesLoading || areDriversLoading || areStudentsLoading || areUsersLoading || areVehiclesLoading || areSchoolsLoading;

  const driversMap = useMemo(() => {
    return new Map(rawDrivers.map(d => [d.id, d.name]));
  }, [rawDrivers]);

  const monitorsMap = useMemo(() => {
      return new Map(rawMonitors.map(m => [m.id, m.name]));
  }, [rawMonitors]);

  const handleEdit = useCallback((route: Route) => {
    setSelectedRoute(route);
    setIsFormOpen(true);
  }, []);

  const handleDelete = useCallback((route: Route) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  }, []);
  
  const confirmDelete = useCallback(() => {
    if (!selectedRoute) return;
    deleteDoc('routes', selectedRoute.id);
    toast({
        title: "Rota deletada!",
        description: `A rota ${selectedRoute.name} foi removida do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedRoute(null);
  }, [selectedRoute, deleteDoc, toast]);

  const handleFormSubmit = useCallback(() => {
    setIsFormOpen(false);
    setSelectedRoute(null);
  }, []);
  
  const getStudentCount = (studentIds: any[] = []) => {
      if (!studentIds || !Array.isArray(studentIds)) return 0;
      // Conta IDs que parecem ser de alunos (não escolas)
      return studentIds.filter(id => id && String(id).includes('student')).length;
  }

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Rotas
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button id="add-route-btn" onClick={() => { setSelectedRoute(null); setIsFormOpen(true); }} className="gap-2 bg-primary hover:bg-primary/90 text-white font-bold">
              <PlusCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Adicionar Rota</span>
              <span className="sm:hidden">Nova Rota</span>
            </Button>
          </DialogTrigger>
          <RouteForm
            key={selectedRoute?.id || 'new-route'}
            route={selectedRoute || undefined} 
            allRoutes={routes || []}
            drivers={rawDrivers}
            students={rawStudents}
            monitors={rawMonitors}
            vehicles={rawVehicles}
            schools={rawSchools}
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Rotas</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Rota</TableHead>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Última Otimização</TableHead>
                  <TableHead className="text-right w-[200px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && safeArray<Route>(routes).length > 0 ? (
                  safeArray<Route>(routes).map((route: Route) => (


                    <SafeTableRow key={route.id} name={`RouteRow-${route.id}`}>
                      <TableCell className="font-medium">{String(route.name || 'N/A')}</TableCell>
                      <TableCell>{driversMap.get(route.driverId) || 'N/A'}</TableCell>
                      <TableCell>
                          {!route.monitorId || route.monitorId === 'none' ? (
                              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"><User className="mr-1.5 h-3 w-3 inline-block" /> Motorista Solo</Badge>
                          ) : monitorsMap.get(route.monitorId) ? (
                              <Badge variant="outline" className="font-bold">{monitorsMap.get(route.monitorId)}</Badge>
                          ) : (
                              <Badge variant="outline" className="text-muted-foreground opacity-50">N/A</Badge>
                          )}
                      </TableCell>
                      <TableCell>{getStudentCount(route.studentIds)}</TableCell>
                      <TableCell>
                        {(() => {
                          if (!route.lastOptimizedAt) return <Badge variant="secondary">Não otimizada</Badge>;
                          try {
                            const date = new Date(route.lastOptimizedAt);
                            if (isNaN(date.getTime())) return <Badge variant="secondary">Não otimizada</Badge>;
                            return (
                              <span className="text-sm text-muted-foreground">
                                {formatDistanceToNow(date, { addSuffix: true, locale: ptBR })}
                              </span>
                            );
                          } catch (e) {
                            return <Badge variant="secondary">Não otimizada</Badge>;
                          }
                        })()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                           <Button variant="destructive" size="sm" onClick={() => handleDelete(route)}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Deletar
                           </Button>
                        </div>
                      </TableCell>
                    </SafeTableRow>
                  ))

                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center h-24">
                        Nenhuma rota cadastrada.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile View */}
           <div className="md:hidden">
            {isLoading && <p className="text-center py-10">Carregando...</p>}
            {!isLoading && safeArray<Route>(routes).length > 0 ? (
              <div className="space-y-4">
                {safeArray<Route>(routes).map((route: Route) => {


                  const driverName = driversMap.get(route.driverId) || 'N/A';
                  const monitorName = monitorsMap.get(route.monitorId);

                  return (
                  <SafeRow key={route.id} name={`RouteCard-${route.id}`}>
                    <Card className="overflow-hidden">
                      <div className="p-4">
                          <div className="flex items-start justify-between mb-4">
                              <h3 className="font-bold text-lg pr-2">{String(route.name || 'N/A')}</h3>
                          </div>
                          <div className="space-y-4">
                              <div className="flex items-center gap-3">
                                  <Avatar>
                                      <AvatarImage src={`https://picsum.photos/seed/driver-${route.driverId}/100/100`} />
                                      <AvatarFallback>{safeInitials(driverName)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                      <p className="text-sm text-muted-foreground">Motorista</p>
                                      <p className="font-medium">{driverName}</p>
                                  </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                  <Badge variant="outline"><Users className="mr-1.5 h-3 w-3" />{getStudentCount(route.studentIds)} alunos</Badge>
                                  {!route.monitorId || route.monitorId === 'none' ? (
                                      <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"><User className="mr-1.5 h-3 w-3" />Motorista Solo</Badge>
                                  ) : (
                                      <Badge variant="outline"><User className="mr-1.5 h-3 w-3" />{monitorName ? `Monitor: ${monitorName}` : 'Sem monitor'}</Badge>
                                  )}
                                  {route.lastOptimizedAt ? (
                                      <Badge variant="default" className="border-transparent bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700 hover:bg-green-100/80">
                                          <Sparkles className="mr-1.5 h-3 w-3" /> Otimizada
                                      </Badge>
                                  ) : (
                                      <Badge variant="destructive" className="border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700 hover:bg-amber-100/80">
                                          <AlertTriangle className="mr-1.5 h-3 w-3" /> Não Otimizada
                                      </Badge>
                                  )}
                              </div>
                          </div>
                      </div>
                      <CardFooter className="p-2 border-t bg-secondary/50 flex flex-col sm:flex-row gap-2">
                          <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(route)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar Rota
                          </Button>
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(route)}>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Deletar
                          </Button>
                      </CardFooter>
                    </Card>
                  </SafeRow>
                )})}
              </div>

            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhuma rota cadastrada.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente a rota <span className="font-bold">{selectedRoute?.name || 'selecionada'}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedRoute(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
