"use client";

import { useState, useMemo } from "react";
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
import { MoreHorizontal, PlusCircle, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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


type Route = {
  id: string;
  name: string;
  driverId: string;
  assistantId?: string;
  studentIds: string[];
  shift: 'manha' | 'tarde';
};
type Driver = { id: string; name: string };
type Student = { id: string; name: string };
type Assistant = { id: string; name: string; profile: string };


interface RoutesListProps {
  initialRoutes: Route[];
  initialDrivers: Driver[];
  initialStudents: Student[];
  initialAssistants: Assistant[];
}

export function RoutesList({ initialRoutes, initialDrivers, initialStudents, initialAssistants }: RoutesListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);
  
  const { data: liveRoutes, isLoading: areRoutesLoading } = useMockCollection('routes');
  const { data: liveDrivers, isLoading: areDriversLoading } = useMockCollection('drivers');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveUsers, isLoading: areUsersLoading } = useMockCollection('users');


  const routes = liveRoutes ?? initialRoutes;
  const drivers = liveDrivers ?? initialDrivers;
  const students = liveStudents ?? initialStudents;
  const assistants = useMemo(() => (liveUsers ?? initialAssistants)?.filter(u => u.profile === 'auxiliar'), [liveUsers, initialAssistants]);
  const isLoading = areRoutesLoading || areDriversLoading || areStudentsLoading || areUsersLoading;

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
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Rotas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome da Rota</TableHead>
                <TableHead>Motorista</TableHead>
                <TableHead>Auxiliar</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Otimizar</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
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
                        <Badge variant="outline">{route.shift === 'manha' ? 'Manhã' : 'Tarde'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/dashboard/optimizer?routeId=${route.id}`}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Otimizar
                        </Link>
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Abrir menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEdit(route)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(route)}
                          >
                            Deletar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Nenhuma rota cadastrada.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
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
