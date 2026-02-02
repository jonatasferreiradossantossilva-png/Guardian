"use client";

import { useState, useMemo, useEffect } from "react";
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
import { MoreHorizontal, PlusCircle, Sparkles, Users, AlertTriangle, Car, Edit } from "lucide-react";
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
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type Route = {
  id: string;
  name: string;
  driverId: string;
  assistantId?: string;
  studentIds: string[];
  lastOptimizedAt?: string;
};
type Driver = { id: string; name: string };
type Student = { id: string; name: string };
type Assistant = { id: string; name: string; profile: string };
type Vehicle = { id: string; model: string; licensePlate: string; capacity: number };


interface RoutesListProps {
  initialRoutes: Route[];
  initialDrivers: Driver[];
  initialStudents: Student[];
  initialAssistants: Assistant[];
  initialVehicles: Vehicle[];
}

export function RoutesList({ initialRoutes, initialDrivers, initialStudents, initialAssistants, initialVehicles }: RoutesListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);
  
  const { data: liveRoutes, isLoading: areRoutesLoading } = useMockCollection('routes');
  const { data: liveDrivers, isLoading: areDriversLoading } = useMockCollection('drivers');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveUsers, isLoading: areUsersLoading } = useMockCollection('users');
  const { data: liveVehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles');


  const routes = liveRoutes ?? initialRoutes;
  const drivers = liveDrivers ?? initialDrivers;
  const students = liveStudents ?? initialStudents;
  const assistants = useMemo(() => (liveUsers ?? initialAssistants)?.filter(u => u.profile === 'auxiliar'), [liveUsers, initialAssistants]);
  const vehicles = liveVehicles ?? initialVehicles;
  const isLoading = areRoutesLoading || areDriversLoading || areStudentsLoading || areUsersLoading || areVehiclesLoading;

  const driversMap = useMemo(() => {
    if (!drivers) return new Map();
    return new Map(drivers.map(d => [d.id, d.name]));
  }, [drivers]);

  const assistantsMap = useMemo(() => {
      if (!assistants) return new Map();
      return new Map(assistants.map(a => [a.id, a.name]));
  }, [assistants]);

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsFormOpen(true);
  };

  const handleDelete = (route: Route) => {
    setSelectedRoute(route);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedRoute) return;
    deleteDoc('routes', selectedRoute.id);
    toast({
        title: "Rota deletada!",
        description: `A rota ${selectedRoute.name} foi removida do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedRoute(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedRoute(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Rotas
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedRoute(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Rota
            </Button>
          </DialogTrigger>
          <RouteForm 
            route={selectedRoute || undefined} 
            drivers={drivers || []}
            students={students || []}
            assistants={assistants || []}
            vehicles={vehicles || []}
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
                  <TableHead>Auxiliar</TableHead>
                  <TableHead>Alunos</TableHead>
                  <TableHead>Última Otimização</TableHead>
                  <TableHead className="text-right w-[280px]">Ações</TableHead>
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
                {!isLoading && routes && routes.length > 0 ? (
                  routes.map((route) => (
                    <TableRow key={route.id}>
                      <TableCell className="font-medium">{route.name}</TableCell>
                      <TableCell>{driversMap.get(route.driverId) || 'N/A'}</TableCell>
                      <TableCell>{assistantsMap.get(route.assistantId) || 'N/A'}</TableCell>
                      <TableCell>{route.studentIds?.length || 0}</TableCell>
                      <TableCell>
                          {route.lastOptimizedAt ? (
                              <span className="text-sm text-muted-foreground">
                                  {isClient ? formatDistanceToNow(new Date(route.lastOptimizedAt), { addSuffix: true, locale: ptBR }) : '...'}
                              </span>
                          ) : (
                              <Badge variant="secondary">Não otimizada</Badge>
                          )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/dashboard/optimizer?routeId=${route.id}&autoOptimize=true`}>
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Otimizar
                                </Link>
                            </Button>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Mais Ações</DropdownMenuLabel>
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleDelete(route)}
                                    >
                                        Deletar
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
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
            {!isLoading && routes && routes.length > 0 ? (
              <div className="space-y-4">
                {routes.map((route) => {
                  const driverName = driversMap.get(route.driverId) || 'N/A';
                  const assistantName = assistantsMap.get(route.assistantId);

                  return (
                  <Card key={route.id} className="overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="font-bold text-lg pr-2">{route.name}</h3>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 flex-shrink-0 -mt-1 -mr-2">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleDelete(route)}
                                    >
                                        Deletar Rota
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={`https://picsum.photos/seed/driver-${route.driverId}/100/100`} />
                                    <AvatarFallback>{driverName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm text-muted-foreground">Motorista</p>
                                    <p className="font-medium">{driverName}</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline"><Users className="mr-1.5 h-3 w-3" />{route.studentIds?.length || 0} alunos</Badge>
                                <Badge variant="outline"><Car className="mr-1.5 h-3 w-3" />{assistantName ? `Aux: ${assistantName}` : 'Sem auxiliar'}</Badge>
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
                    <CardFooter className="p-2 border-t bg-secondary/50 grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(route)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar Rota
                        </Button>
                        <Button asChild size="sm">
                            <Link href={`/dashboard/optimizer?routeId=${route.id}&autoOptimize=true`}>
                                <Sparkles className="mr-2 h-4 w-4" />
                                Otimizar
                            </Link>
                        </Button>
                    </CardFooter>
                  </Card>
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
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente a rota <span className="font-bold">{selectedRoute?.name}</span>.
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
