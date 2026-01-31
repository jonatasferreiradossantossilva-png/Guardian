"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { DriverForm } from "@/components/dashboard/management/drivers/driver-form";
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
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
  const { deleteDoc } = useMockData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  // Use live data from the hook for reactivity, falling back to initial data.
  const { data: liveDrivers, isLoading: areDriversLoading } = useMockCollection('drivers');
  const { data: liveVehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles');

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
  
  const formatAddress = (driver: Driver) => {
    if (!driver.street) return 'N/A';
    return `${driver.street}, ${driver.number} - ${driver.city}, ${driver.state}`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Motoristas
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>CNH</TableHead>
                <TableHead>Endereço</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Veículo</TableHead>
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
              {!isLoading && drivers && drivers.length > 0 ? (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://picsum.photos/seed/driver-${driver.id}/100/100`} alt={driver.name} />
                          <AvatarFallback>{driver.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{driver.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{driver.userId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{driver.cpf || 'N/A'}</TableCell>
                    <TableCell>{driver.cnh || 'N/A'}</TableCell>
                    <TableCell>{formatAddress(driver)}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariantMap[driver.status]}>
                         {statusLabelMap[driver.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>{vehiclesMap.get(driver.vehicleId || '') || "N/A"}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(driver)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(driver)}
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
                      Nenhum motorista cadastrado.
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
