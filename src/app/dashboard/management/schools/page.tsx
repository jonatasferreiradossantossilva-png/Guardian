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

export default function SchoolsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const schoolsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "schools")) : null),
    [user, firestore]
  );
  
  const { data: schools, isLoading: areSchoolsLoading } = useCollection<{
    name: string;
    address: string;
  }>(schoolsQuery);

  const isLoading = isUserLoading || areSchoolsLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Escolas
        </h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Escola
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Escolas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Endereço</TableHead>
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
              {!isLoading && schools && schools.length > 0 ? (
                schools.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell>{school.name}</TableCell>
                    <TableCell>{school.address}</TableCell>
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
                    <TableCell colSpan={3} className="text-center">
                      {!user ? "Faça login para ver as escolas." : "Nenhuma escola cadastrada."}
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
