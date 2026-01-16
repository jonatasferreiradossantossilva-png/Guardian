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
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from "@/firebase";
import { collection, query, doc } from "firebase/firestore";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
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
import { StudentForm } from "@/components/dashboard/management/students/student-form";
import { deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type Student = {
  id: string;
  name: string;
  schoolId: string;
  parentId: string;
  shift: string;
  status: string;
};
type School = { id: string; name: string };
type Parent = { id: string; name: string };

export default function StudentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Queries for all necessary collections
  const studentsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "students")) : null),
    [user, firestore]
  );
  const schoolsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "schools")) : null),
    [user, firestore]
  );
  const parentsQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "parents")) : null),
    [user, firestore]
  );

  const { data: students, isLoading: areStudentsLoading } = useCollection<Omit<Student, 'id'>>(studentsQuery);
  const { data: schools, isLoading: areSchoolsLoading } = useCollection<School>(schoolsQuery);
  const { data: parents, isLoading: areParentsLoading } = useCollection<Parent>(parentsQuery);

  const isLoading = isUserLoading || areStudentsLoading || areSchoolsLoading || areParentsLoading;
  
  // Memoized maps for quick lookups (the "join" on the frontend)
  const schoolsMap = useMemo(() => {
    if (!schools) return new Map();
    return new Map(schools.map(s => [s.id, s.name]));
  }, [schools]);

  const parentsMap = useMemo(() => {
    if (!parents) return new Map();
    return new Map(parents.map(p => [p.id, p.name]));
  }, [parents]);


  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setIsFormOpen(true);
  };

  const handleDelete = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!firestore || !selectedStudent) return;
    const studentRef = doc(firestore, 'students', selectedStudent.id);
    deleteDocumentNonBlocking(studentRef);
    toast({
        title: "Aluno deletado!",
        description: `O aluno ${selectedStudent.name} foi removido do sistema.`,
        variant: "destructive"
    });
    setIsDeleteDialogOpen(false);
    setSelectedStudent(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedStudent(null);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Alunos
        </h1>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => {
                    setSelectedStudent(null);
                    setIsFormOpen(true);
                }}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Adicionar Aluno
                </Button>
            </DialogTrigger>
            <StudentForm 
                student={selectedStudent || undefined} 
                schools={schools || []}
                parents={parents || []}
                onFormSubmit={handleFormSubmit}
            />
        </Dialog>
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
                <TableHead>Turno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.name}</TableCell>
                    <TableCell>{schoolsMap.get(student.schoolId) || 'N/A'}</TableCell>
                    <TableCell>{parentsMap.get(student.parentId) || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{student.shift}</Badge></TableCell>
                    <TableCell><Badge variant="secondary">{student.status}</Badge></TableCell>
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
                          <DropdownMenuItem onClick={() => handleEdit(student)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(student)}
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
                    <TableCell colSpan={6} className="text-center">
                      {!user ? "Faça login para ver os alunos." : "Nenhum aluno cadastrado."}
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
                    Esta ação não pode ser desfeita. Isso irá deletar permanentemente o aluno <span className="font-bold">{selectedStudent?.name}</span>.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedStudent(null)}>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
