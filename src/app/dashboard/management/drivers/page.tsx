"use client";

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
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function DriversPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const driversQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "drivers")) : null),
    [user, firestore]
  );
  
  const { data: drivers, isLoading: areDriversLoading } = useCollection<{
    name: string;
    status: string;
    vehicleId: string;
  }>(driversQuery);

  const isLoading = isUserLoading || areDriversLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Motoristas
        </h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Motorista
        </Button>
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
                <TableHead>Status</TableHead>
                <TableHead>Veículo</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && drivers && drivers.length > 0 ? (
                drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          driver.status === "em_rota" ? "default" : "secondary"
                        }
                      >
                        {driver.status === "em_rota"
                          ? "Em Rota"
                          : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>{driver.vehicleId || "N/A"}</TableCell>
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
                          <DropdownMenuItem>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
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
                    <TableCell colSpan={4} className="text-center">
                      {!user ? "Faça login para ver os motoristas." : "Nenhum motorista cadastrado."}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
