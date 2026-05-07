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
import { DriverForm } from "@/components/dashboard/management/drivers/driver-form";
import { useToast } from "@/hooks/use-toast";
import { useDataCollection, useData } from '@/hooks/use-data';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type Driver = {
  id: string;
  name: string;
  status: 'inativo' | 'em_rota' | 'pausa';
  vehicleId?: string;
  userId: string;
  cpf?: string;
  rg?: string;
  cnh?: string;
  cnhCategory?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  active?: boolean;
  pin?: string;
};
type Vehicle = { id: string; model: string; licensePlate: string };

const statusVariantMap: Record<Driver['status'], 'secondary' | 'default' | 'outline'> = {
    'inativo': 'secondary',
    'em_rota': 'default',
    'pausa': 'outline'
};
const statusLabelMap: Record<Driver['status'], string> = {
    'inativo': 'Inativo',
    'em_rota': 'Em Rota',
    'pausa': 'Em Pausa'
};

interface DriversListProps {
  initialDrivers: Driver[];
  initialVehicles: Vehicle[];
}

export function DriversList({ initialDrivers, initialVehicles }: DriversListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useData();
  
  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liveDrivers, isLoading: areDriversLoading } = useDataCollection<Driver>('drivers');
  const { data: liveVehicles, isLoading: areVehiclesLoading } = useDataCollection<Vehicle>('vehicles');

  const drivers = liveDrivers ?? initialDrivers;
  const vehicles = liveVehicles ?? initialVehicles;
  const isLoading = areDriversLoading || areVehiclesLoading;

  const vehiclesMap = useMemo(() => {
    if (!vehicles) return new Map();
    return new Map(vehicles.map(v => [v.id, `${v.model} (${v.licensePlate})`]));
  }, [vehicles]);

  const handleEdit = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsFormOpen(true);
  };

  const handleDelete = (driver: Driver) => {
    setSelectedDriver(driver);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedDriver) return;
    deleteDoc('drivers', selectedDriver.id);
    toast({
        title: "Motorista deletado!",
        description: `O motorista ${selectedDriver.name} foi removido do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedDriver(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedDriver(null);
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
          Motoristas
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setSelectedDriver(null);
              setIsFormOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Motorista
            </Button>
          </DialogTrigger>
          <DriverForm 
            driver={selectedDriver || undefined} 
            vehicles={vehicles || []} 
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Motoristas</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Motorista</TableHead>
                  <TableHead>Veículo</TableHead>
                  <TableHead>Status (Rota)</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && drivers && drivers.length > 0 ? (
                  drivers.map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={`https://picsum.photos/seed/driver-${driver.id}/100/100`} alt={driver.name} />
                            <AvatarFallback>{driver.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{driver.name}</p>
                            <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                <span>CPF: {driver.cpf || "---"}</span>
                                <span>PIN: {(driver as any).pin || "••••"}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{vehiclesMap.get(driver.vehicleId || '') || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[driver.status]}>
                         {statusLabelMap[driver.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={driver.active !== false ? 'default' : 'secondary'} className={driver.active !== false ? 'bg-green-600' : ''}>
                          {driver.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleEdit(driver)}>
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
                                   <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(driver)}>
                                       <Trash2 className="mr-2 h-4 w-4" /> Deletar
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
                    <TableCell colSpan={5} className="text-center h-24">
                      Nenhum motorista cadastrado.
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
          </div>
          {/* Mobile Card View */}
          <div className="md:hidden">
            {isLoading && <p className="text-center py-10">Carregando...</p>}
            {!isLoading && drivers && drivers.length > 0 ? (
              <div className="space-y-4">
                {drivers.map((driver) => (
                  <Card key={driver.id} className="overflow-hidden">
                    <div className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                <AvatarImage src={`https://picsum.photos/seed/driver-${driver.id}/100/100`} alt={driver.name} />
                                <AvatarFallback>{driver.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                                </Avatar>
                                <div>
                                <p className="font-medium">{driver.name}</p>
                                <div className="flex gap-2 text-[10px] text-muted-foreground font-mono">
                                    <span>CPF: {driver.cpf || "---"}</span>
                                    <span>PIN: {(driver as any).pin || "••••"}</span>
                                </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs">Veículo</p>
                            <p className="font-medium">{vehiclesMap.get(driver.vehicleId || '') || "N/A"}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Status (Rota)</p>
                            <Badge variant={statusVariantMap[driver.status]} className="mt-1">{statusLabelMap[driver.status]}</Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Situação</p>
                            <Badge variant={driver.active !== false ? 'default' : 'secondary'} className={driver.active !== false ? 'mt-1 bg-green-600' : 'mt-1'}>
                            {driver.active !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        </div>
                    </div>
                    <CardFooter className="p-2 bg-secondary/50 border-t flex gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(driver)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(driver)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum motorista cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o motorista <span className="font-bold">{selectedDriver?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedDriver(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
