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
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


type Student = {
  id: string;
  name: string;
  schoolId: string;
  parentId: string;
  shift: 'Manhã' | 'Tarde';
  status: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  monthlyFee?: number;
};
type School = { id: string; name: string };
type Parent = { id: string; name: string };

interface StudentsListProps {
  initialStudents: Student[];
  initialSchools: School[];
  initialParents: Parent[];
}

export function StudentsList({ initialStudents, initialSchools, initialParents }: StudentsListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Use live data from hooks for reactivity, falling back to initial data.
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveSchools, isLoading: areSchoolsLoading } = useMockCollection('schools');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');

  const students = liveStudents ?? initialStudents;
  const schools = liveSchools ?? initialSchools;
  const parents = liveParents ?? initialParents;
  const isLoading = areStudentsLoading || areSchoolsLoading || areParentsLoading;
  
  // Memoized maps for quick lookups
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
    if (!selectedStudent) return;
    deleteDoc('students', selectedStudent.id);
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

  const formatAddress = (student: Student) => {
    if (!student.street) return 'N/A';
    return `${student.street}, ${student.number} - ${student.city}, ${student.state}`;
  }

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
                <TableHead>Endereço</TableHead>
                <TableHead>Escola</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Mensalidade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center">
                    Carregando...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && students && students.length > 0 ? (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} alt={student.name} />
                          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatAddress(student)}</TableCell>
                    <TableCell>{schoolsMap.get(student.schoolId) || 'N/A'}</TableCell>
                    <TableCell>{parentsMap.get(student.parentId) || 'N/A'}</TableCell>
                    <TableCell><Badge variant="outline">{student.shift}</Badge></TableCell>
                    <TableCell>R$ {student.monthlyFee ? student.monthlyFee.toFixed(2) : 'N/A'}</TableCell>
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
                    <TableCell colSpan={8} className="text-center">
                      Nenhum aluno cadastrado.
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
