
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
import { MoreHorizontal, PlusCircle, Edit, Trash2, Search, Loader2, HeartPulse, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { cn } from "@/lib/utils";


type Student = {
  id: string;
  name: string;
  schoolId: string;
  parentId: string;
  shift: 'Manhã' | 'Tarde' | 'Integral';
  status: string;
  serviceModality?: 'completo' | 'so_ida' | 'so_volta';
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  monthlyFee?: number;
  active?: boolean;
  serie?: string;
  turma?: string;
  medicalNote?: string;
  medicalConditions?: string[];
};
type School = { id: string; name: string };
type Parent = { id: string; name: string };

interface StudentsListProps {
  initialStudents: Student[];
  initialSchools: School[];
  initialParents: Parent[];
}

const modalityLabels: Record<string, string> = {
    'completo': 'Ida e Volta',
    'so_ida': 'Só Ida',
    'so_volta': 'Só Volta'
};

const ITEMS_PER_PAGE = 10;

export function StudentsList({ initialStudents, initialSchools, initialParents }: StudentsListProps) {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();

  const [mounted, setMounted] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  
  // Search and Pagination State
  const [searchQuery, setSearchSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use live data from hooks for reactivity, falling back to initial data.
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveSchools, isLoading: areSchoolsLoading } = useMockCollection('schools');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');

  const students = liveStudents ?? initialStudents;
  const schools = liveSchools ?? initialSchools;
  const parents = liveParents ?? initialParents;
  const isLoading = areStudentsLoading || areSchoolsLoading || areParentsLoading;
  
  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Memoized maps for quick lookups
  const schoolsMap = useMemo(() => {
    if (!schools) return new Map();
    return new Map(schools.map(s => [s.id, s.name]));
  }, [schools]);

  const parentsMap = useMemo(() => {
    if (!parents) return new Map();
    return new Map(parents.map(p => [p.id, p.name]));
  }, [parents]);

  // 1. Filter
  const filteredStudentsList = useMemo(() => {
    if (!students) return [];
    return students.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        schoolsMap.get(s.schoolId)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        parentsMap.get(s.parentId)?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery, schoolsMap, parentsMap]);

  // 2. Paginate
  const paginatedStudents = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredStudentsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredStudentsList, currentPage]);

  const totalPages = Math.ceil(filteredStudentsList.length / ITEMS_PER_PAGE);


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

  const formatSerieTurma = (student: Student) => {
      return [student.serie, student.turma].filter(Boolean).join(' / ') || 'N/A';
  }

  if (!mounted) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciamento de Alunos
        </h1>
         <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => {
                    setSelectedStudent(null);
                    setIsFormOpen(true);
                }} className="w-full md:w-auto">
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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
            placeholder="Buscar por nome do aluno, escola ou responsável..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchSearchQuery(e.target.value)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alunos</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Escola</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center h-24">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && paginatedStudents && paginatedStudents.length > 0 ? (
                  paginatedStudents.map((student) => {
                    const hasAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;
                    return (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="relative">
                            <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} alt={student.name} />
                            <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                            {hasAlert && (
                                <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 border border-background shadow-sm animate-pulse">
                                    <HeartPulse className="h-2.5 w-2.5 text-white" />
                                </div>
                            )}
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="font-medium flex items-center gap-1.5">
                                {student.name}
                                {hasAlert && <HeartPulse className="h-3.5 w-3.5 text-destructive" />}
                            </span>
                            <p className="text-[10px] text-muted-foreground">{formatSerieTurma(student)}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{schoolsMap.get(student.schoolId) || 'N/A'}</TableCell>
                      <TableCell>{parentsMap.get(student.parentId) || 'N/A'}</TableCell>
                      <TableCell><Badge variant="outline">{student.shift}</Badge></TableCell>
                      <TableCell>
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                              {modalityLabels[student.serviceModality || 'completo']}
                          </Badge>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{student.status}</Badge></TableCell>
                       <TableCell>
                        <Badge variant={student.active !== false ? 'default' : 'secondary'} className={student.active !== false ? 'bg-green-600' : ''}>
                          {student.active !== false ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleEdit(student)}>
                                <Edit className="mr-2 h-4 w-4" /> Editar
                            </Button>
                      </TableCell>
                    </TableRow>
                  )})
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center h-24">
                        {searchQuery ? "Nenhum aluno encontrado para sua busca." : "Nenhum aluno cadastrado."}
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
            {!isLoading && paginatedStudents && paginatedStudents.length > 0 ? (
              <div className="space-y-4">
                {paginatedStudents.map((student) => {
                  const hasAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;
                  return (
                  <Card key={student.id} className={cn("overflow-hidden", hasAlert && "border-destructive/20")}>
                    <div className="p-4">
                        <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <Avatar className="relative">
                                <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} alt={student.name} />
                                <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                {hasAlert && (
                                    <div className="absolute -top-1 -right-1 bg-destructive rounded-full p-0.5 border border-background shadow-sm animate-pulse">
                                        <HeartPulse className="h-2.5 w-2.5 text-white" />
                                    </div>
                                )}
                            </Avatar>
                            <div className="flex flex-col">
                                <p className="font-medium flex items-center gap-1.5">
                                    {student.name}
                                    {hasAlert && <HeartPulse className="h-3.5 w-3.5 text-destructive" />}
                                </p>
                                <p className="text-[10px] text-muted-foreground">{formatSerieTurma(student)}</p>
                            </div>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground text-xs font-bold uppercase">Modalidade</p>
                            <div className="flex items-center gap-1.5 mt-1 text-primary">
                                <ArrowRightLeft className="h-3 w-3" />
                                <span className="font-bold">{modalityLabels[student.serviceModality || 'completo']}</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold">Turno</p>
                            <Badge variant="outline" className="mt-1">{student.shift}</Badge>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold">Escola</p>
                            <p className="font-medium truncate">{schoolsMap.get(student.schoolId) || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs uppercase font-bold">Situação</p>
                            <Badge variant={student.active !== false ? 'default' : 'secondary'} className={student.active !== false ? 'mt-1 bg-green-600' : 'mt-1'}>
                            {student.active !== false ? 'Ativo' : 'Inativo'}
                            </Badge>
                        </div>
                        </div>
                    </div>
                    <CardFooter className="p-2 bg-secondary/50 border-t flex gap-2">
                        <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(student)}>
                            <Edit className="mr-2 h-4 w-4" /> Editar
                        </Button>
                        <Button variant="destructive" size="sm" className="w-full" onClick={() => handleDelete(student)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Deletar
                        </Button>
                    </CardFooter>
                  </Card>
                )})}
              </div>
            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum aluno encontrado.</p>
            )}
          </div>

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredStudentsList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
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
