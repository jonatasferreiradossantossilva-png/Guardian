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
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCollection, useFirestore, useMemoFirebase, useUser } from "@/firebase";
import { collection, query } from "firebase/firestore";

export default function RoutesPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const routesQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "routes")) : null),
    [user, firestore]
  );
  
  const { data: routes, isLoading: areRoutesLoading } = useCollection<{
    name: string;
    driverId: string;
  }>(routesQuery);

  const isLoading = isUserLoading || areRoutesLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Rotas
        </h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Rota
        </Button>
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
                <TableHead>Ações</TableHead>
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
              {!isLoading && routes && routes.length > 0 ? (
                routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>{route.name}</TableCell>
                    <TableCell>{route.driverId}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="mr-2">
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm">
                        Deletar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center">
                      {!user ? "Faça login para ver as rotas." : "Nenhuma rota cadastrada."}
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
