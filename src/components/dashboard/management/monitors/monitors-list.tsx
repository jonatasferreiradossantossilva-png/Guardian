"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { MonitorForm } from "@/components/dashboard/management/monitors/monitor-form";
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SafeTableRow, SafeRow } from "@/components/shared/safe-table";
import { safeInitials, safeArray, safeString } from "@/lib/safe-render";
import { cn } from "@/lib/utils";



type Monitor = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  rg?: string;
  userId: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  status?: 'inativo' | 'em_rota' | 'pausa';
  vehicleId?: string;
  active?: boolean;
  pin?: string;
};

type Vehicle = { id: string; model: string; licensePlate: string };

export function MonitorsList({ initialMonitors, initialVehicles }: { initialMonitors: Monitor[]; initialVehicles?: Vehicle[] }) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();
  
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liveMonitors, isLoading: areMonitorsLoading } = useMockCollection<Monitor>('monitors');
  const { data: liveVehicles } = useMockCollection<Vehicle>('vehicles');

  const monitors = liveMonitors ?? initialMonitors;
  const vehicles = liveVehicles ?? initialVehicles ?? [];
  const isLoading = areMonitorsLoading;

  const vehiclesMap = useMemo(() => {
    if (!vehicles) return new Map();
    return new Map(vehicles.map(v => [v.id, `${v.model} (${v.licensePlate})`]));
  }, [vehicles]);

  const handleEdit = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setIsFormOpen(true);
  };

  const handleDelete = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedMonitor) return;
    deleteDoc('monitors', selectedMonitor.id);
    toast({
        title: "Monitor deletado!",
        description: `${selectedMonitor.name} foi removido do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedMonitor(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedMonitor(null);
  };

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
          Monitores
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedMonitor(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Monitor
            </Button>
          </DialogTrigger>
          <MonitorForm 
            monitor={selectedMonitor || undefined} 
            vehicles={vehicles}
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Monitores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status (Rota)</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && safeArray<Monitor>(monitors).length > 0 ? (
                  safeArray<Monitor>(monitors).map((monitor: Monitor) => (


                    <SafeTableRow key={monitor.id} name={`MonitorRow-${monitor.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/monitor-${monitor.id}/100/100`} alt={monitor.name} />
                            <AvatarFallback>{safeInitials(monitor.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{safeString(monitor.name, 'N/A')}</p>
                            <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>CPF: {monitor.cpf || "N/A"}</span>
                                <span>PIN: { (monitor as any).pin || "••••" }</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{monitor.email || "N/A"}</TableCell>
                      <TableCell>{monitor.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={monitor.status === 'em_rota' ? 'default' : 'outline'}
                          className={cn(
                            monitor.status === 'em_rota' && "bg-blue-600 hover:bg-blue-700",
                            monitor.status === 'pausa' && "border-amber-500 text-amber-600 hover:bg-amber-50",
                            monitor.status === 'inativo' && "text-muted-foreground"
                          )}
                        >
                          {monitor.status === 'em_rota' ? 'Em Rota' : monitor.status === 'pausa' ? 'Em Pausa' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>{vehiclesMap.get(monitor.vehicleId || '') || "N/A"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={monitor.active !== false ? 'default' : 'secondary'} 
                          className={cn(
                            monitor.active !== false ? 'bg-emerald-600 hover:bg-emerald-700' : 'opacity-70'
                          )}
                        >
                          {monitor.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(monitor)}>
                               <Edit className="mr-2 h-4 w-4" /> Editar
                           </Button>
                           <DropdownMenu>
                               <DropdownMenuTrigger asChild>
                                   <Button variant="ghost" className="h-8 w-8 p-0">
                                       <span className="sr-only">Mais Ações</span>
                                       <MoreHorizontal className="h-4 w-4" />
                                   </Button>
                               </DropdownMenuTrigger>
                               <DropdownMenuContent align="end">
                                   <DropdownMenuLabel>Mais Ações</DropdownMenuLabel>
                                   <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(monitor)}>
                                       <Trash2 className="mr-2 h-4 w-4" /> Deletar
                                   </DropdownMenuItem>
                               </DropdownMenuContent>
                           </DropdownMenu>
                       </div>
                    </TableCell>
                    </SafeTableRow>
                  ))

                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center h-24">
                        Nenhum monitor cadastrado.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden">
            {isLoading && <p className="text-center py-10">Carregando...</p>}
            {!isLoading && safeArray<Monitor>(monitors).length > 0 ? (
              <div className="space-y-4">
                {safeArray<Monitor>(monitors).map((monitor: Monitor) => (


                  <SafeRow key={monitor.id} name={`MonitorCard-${monitor.id}`}>
                    <Card className="overflow-hidden">
                      <div className="p-4">
                          <div className="flex items-center gap-3">
                              <Avatar>
                              <AvatarImage src={`https://picsum.photos/seed/monitor-${monitor.id}/100/100`} alt={monitor.name} />
                              <AvatarFallback>{safeInitials(monitor.name)}</AvatarFallback>
                              </Avatar>
                              <div>
                              <p className="font-medium">{safeString(monitor.name, 'N/A')}</p>
                              <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                  <span>CPF: {monitor.cpf || "---"}</span>
                                  <span>PIN: {(monitor as any).pin || "••••"}</span>
                              </div>
                              </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-muted-foreground text-xs">Email</p>
                              <p className="font-medium">{monitor.email || "N/A"}</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground text-xs">Telefone</p>
                              <p className="font-medium">{monitor.phone || "N/A"}</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Situação</p>
                              <Badge 
                                  variant={monitor.active !== false ? 'default' : 'secondary'} 
                                  className={cn(
                                      "mt-1",
                                      monitor.active !== false ? 'bg-emerald-600' : 'opacity-70'
                                  )}
                              >
                                  {monitor.active !== false ? 'Ativo' : 'Inativo'}
                              </Badge>
                          </div>
                          </div>
                      </div>
                      <CardFooter className="p-2 bg-secondary/30 border-t flex gap-2">
                          <Button variant="outline" size="sm" className="w-full h-9" onClick={() => handleEdit(monitor)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full h-9 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(monitor)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                          </Button>
                      </CardFooter>
                    </Card>
                  </SafeRow>
                ))}
              </div>

            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum monitor cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o monitor <span className="font-bold">{selectedMonitor?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedMonitor(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
