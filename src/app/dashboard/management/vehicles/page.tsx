"use client";

import { useState } from "react";
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
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
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
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";


type Vehicle = {
  id: string;
  model: string;
  licensePlate: string;
};

export default function VehiclesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const vehiclesQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "vehicles")) : null),
    [user, firestore]
  );

  const { data: vehicles, isLoading: areVehiclesLoading } =
    useCollection<Omit<Vehicle, 'id'>>(vehiclesQuery);

  const isLoading = isUserLoading || areVehiclesLoading;

  const handleEdit = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsFormOpen(true);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!firestore || !selectedVehicle) return;
    const vehicleRef = doc(firestore, 'vehicles', selectedVehicle.id);
    deleteDocumentNonBlocking(vehicleRef);
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
    setSelectedVehicle(null);
  };

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Modelo</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && vehicles && vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.model}</TableCell>
                    <TableCell>{vehicle.licensePlate}</TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(vehicle)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(vehicle)}
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
                    <TableCell colSpan={3} className="text-center">
                      {!user
                        ? "Faça login para ver os veículos."
                        : "Nenhum veículo cadastrado."}
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
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o veículo <span className="font-bold">{selectedVehicle?.model} ({selectedVehicle?.licensePlate})</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedVehicle(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
