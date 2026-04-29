
"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle, Edit, Trash2, Wrench, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { SafeTableRow, SafeRow } from "@/components/shared/safe-table";
import { safeString, safeArray } from "@/lib/safe-render";
import {
  Dialog,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { VehicleForm } from "@/components/dashboard/management/vehicles/vehicle-form";
import { MaintenanceForm } from "@/components/dashboard/management/vehicles/maintenance-form";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";


type Vehicle = {
  id: string;
  model: string;
  licensePlate: string;
  capacity: number;
  active: boolean;
  currentOdometer: number;
  lastMaintenanceOdometer: number;
};

interface VehiclesListProps {
  initialVehicles: Vehicle[];
}

export function VehiclesList({ initialVehicles }: VehiclesListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: liveVehicles, isLoading } = useMockCollection('vehicles');
  const vehicles = liveVehicles ?? initialVehicles;

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleMaintenance = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsMaintenanceOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedVehicle) return;
    deleteDoc('vehicles', selectedVehicle.id);
    toast({
        title: "Veículo deletado!",
        description: `O veículo ${selectedVehicle.model} foi removido da frota.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedVehicle(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setIsMaintenanceOpen(false);
    setSelectedVehicle(null);
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
          Gerenciamento de Veículos
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => {
                    setSelectedVehicle(null);
                    setIsFormOpen(true);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Veículo
                </Button>
            </DialogTrigger>
            <VehicleForm vehicle={selectedVehicle || undefined} onFormSubmit={handleFormSubmit} />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Frota de Veículos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Placa</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Odômetro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
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
                {!isLoading && safeArray<Vehicle>(vehicles).length > 0 ? (
                  safeArray<Vehicle>(vehicles).map((vehicle: Vehicle) => (
                    <SafeTableRow key={vehicle.id} name={`VehicleRow-${vehicle.id}`}>
                      <TableCell className="font-medium">{safeString(vehicle.model, 'Veículo')}</TableCell>
                      <TableCell>{safeString(vehicle.licensePlate, '---')}</TableCell>
                      <TableCell>{vehicle.capacity || 0}</TableCell>
                      <TableCell>{(vehicle.currentOdometer || 0).toLocaleString()} km</TableCell>
                      <TableCell>
                        <Badge variant={vehicle.active ? 'default' : 'secondary'} className={vehicle.active ? 'bg-green-600' : ''}>
                          {vehicle.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button variant="outline" size="sm" onClick={() => handleMaintenance(vehicle)}>
                               <Wrench className="mr-2 h-4 w-4" /> Manutenção
                           </Button>
                           <Button variant="outline" size="sm" onClick={() => handleEdit(vehicle)}>
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
                                   <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(vehicle)}>
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
                      <TableCell colSpan={6} className="text-center h-24">
                          Nenhum veículo cadastrado.
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
            {!isLoading && safeArray<Vehicle>(vehicles).length > 0 ? (
              <div className="space-y-4">
                {safeArray<Vehicle>(vehicles).map((vehicle: Vehicle) => (
                  <SafeRow key={vehicle.id} name={`VehicleCard-${vehicle.id}`}>
                    <Card key={vehicle.id} className="overflow-hidden">
                      <div className="p-4">
                          <div className="flex items-start justify-between">
                          <div>
                              <p className="font-medium">{safeString(vehicle.model, 'Veículo')}</p>
                              <p className="text-xs text-muted-foreground">Placa: {safeString(vehicle.licensePlate, '---')}</p>
                          </div>
                          </div>
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                          <div>
                              <p className="text-muted-foreground text-xs">Odômetro</p>
                              <p className="font-medium">{(vehicle.currentOdometer || 0).toLocaleString()} km</p>
                          </div>
                          <div>
                              <p className="text-muted-foreground text-xs">Status</p>
                              <Badge variant={vehicle.active ? 'default' : 'secondary'} className={vehicle.active ? 'mt-1 bg-green-600' : 'mt-1'}>
                              {vehicle.active ? 'Ativo' : 'Inativo'}
                              </Badge>
                          </div>
                          </div>
                      </div>
                       <CardFooter className="p-2 bg-secondary/50 border-t flex flex-wrap gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleMaintenance(vehicle)}>
                              <Wrench className="mr-2 h-4 w-4" /> Manutenção
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(vehicle)}>
                              <Edit className="mr-2 h-4 w-4" /> Editar
                          </Button>
                          <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(vehicle)}>
                              <Trash2 className="mr-2 h-4 w-4" /> Deletar
                          </Button>
                      </CardFooter>
                    </Card>
                  </SafeRow>
                ))}
              </div>

            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum veículo cadastrado.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o veículo <span className="font-bold">{selectedVehicle?.model} ({selectedVehicle?.licensePlate})</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedVehicle(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance Dialog */}
      <Dialog open={isMaintenanceOpen} onOpenChange={(open) => !open && handleFormSubmit()}>
        {selectedVehicle && (
            <MaintenanceForm 
                vehicle={selectedVehicle} 
                onFormSubmit={handleFormSubmit}
            />
        )}
      </Dialog>

    </div>
  );
}
