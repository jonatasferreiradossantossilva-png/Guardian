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

export default function StudentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  
  const studentsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "students")) : null),
    [user, firestore]
  );
  
  const { data: students, isLoading: areStudentsLoading } = useCollection<{
    name: string;
    schoolId: string;
    parentId: string;
  }>(studentsQuery);

  const isLoading = isUserLoading || areStudentsLoading;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Alunos
        </h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Aluno
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Ações</TableHead>
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
              {!isLoading && students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.name}</TableCell>
                    <TableCell>{student.schoolId}</TableCell>
                    <TableCell>{student.parentId}</TableCell>
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
                    <TableCell colSpan={4} className="text-center">
                      {!user ? "Faça login para ver os alunos." : "Nenhum aluno cadastrado."}
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
