
'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, ArrowLeft, Users, Phone, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useDataCollection, useData } from '@/hooks/use-data';
import Link from 'next/link';
import { AuthorizedPersonForm } from '@/components/parent/authorized/authorized-form';

type AuthorizedPickup = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  relationship: string;
  studentId: string;
  parentUserId: string;
};

export default function AuthorizedPage() {
  const { toast } = useToast();
  const { deleteDoc } = useData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<AuthorizedPickup | null>(null);
  
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    
    // Phase 2: Context sync
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    setSelectedStudentId(lastSelectedId);
  }, []);

  const { data: parents } = useDataCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined);
  const parent = useMemo(() => parents?.[0], [parents]);

  const { data: students } = useDataCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : undefined);
  
  // Phase 2: Selected student
  const student = useMemo(() => {
      if (!students || students.length === 0) return null;
      if (!selectedStudentId) return students[0];
      return students.find((s: any) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const { data: authorizedPersons, isLoading } = useDataCollection('authorized_pickups', student ? [
    { field: 'studentId', op: '==', value: student.id }
  ]: undefined);

  const handleEdit = (person: AuthorizedPickup) => {
    setSelectedPerson(person);
    setIsFormOpen(true);
  };

  const handleDelete = (person: AuthorizedPickup) => {
    setSelectedPerson(person);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedPerson) return;
    (deleteDoc as any)('authorized_pickups', selectedPerson.id);
    toast({
      title: 'Pessoa autorizada removida!',
      description: `${selectedPerson.name} foi removido da lista.`,
      variant: 'destructive',
    });
    setIsDeleteDialogOpen(false);
    setSelectedPerson(null);
  };

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedPerson(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-32 md:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking">
              <ArrowLeft />
            </Link>
          </Button>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users/>Pessoas Autorizadas</CardTitle>
                    <CardDescription className="mt-2 text-primary font-semibold">Aluno(a): {student?.name}</CardDescription>
                    <CardDescription className="mt-1">Adicione ou remova pessoas de confiança para a retirada do aluno.</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setSelectedPerson(null); setIsFormOpen(true); }} disabled={!student} className="w-full sm:w-auto">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Adicionar Pessoa
                        </Button>
                    </DialogTrigger>
                    {student && mockUserId && (
                        <AuthorizedPersonForm
                            person={selectedPerson || undefined}
                            studentId={student.id}
                            parentUserId={mockUserId}
                            onFormSubmit={handleFormSubmit}
                        />
                    )}
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {/* Desktop View */}
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Relação</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center">
                        Carregando...
                        </TableCell>
                    </TableRow>
                    )}
                    {!isLoading && authorizedPersons && authorizedPersons.length > 0 ? (
                    authorizedPersons.map((person: any) => (
                        <TableRow key={person.id}>
                        <TableCell>{person.name}</TableCell>
                        <TableCell>{person.cpf}</TableCell>
                        <TableCell className="font-semibold text-primary">{person.relationship}</TableCell>
                        <TableCell>{person.phone}</TableCell>
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
                                <DropdownMenuItem onClick={() => handleEdit(person)}>Editar</DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(person)}>Remover</DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    !isLoading && (
                        <TableRow>
                        <TableCell colSpan={5} className="text-center h-24">
                            Nenhuma pessoa autorizada para {student?.name}.
                        </TableCell>
                        </TableRow>
                    )
                    )}
                </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden space-y-4">
                 {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
                 {!isLoading && authorizedPersons && authorizedPersons.length > 0 ? (
                    authorizedPersons.map((person: any) => (
                        <Card key={person.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-medium">{person.name}</p>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0 -mt-1 -mr-2 flex-shrink-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(person)}>Editar</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(person)}>Remover</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                             <div className="mt-2 text-sm text-muted-foreground space-y-2">
                               <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4"/>
                                <span>CPF: {person.cpf}</span>
                               </div>
                                <div className="flex items-center gap-2 text-primary font-bold">
                                <Users className="h-4 w-4"/>
                                <span>{person.relationship}</span>
                               </div>
                                <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4"/>
                                <span>Tel: {person.phone || 'Não informado'}</span>
                               </div>
                            </div>
                        </Card>
                    ))
                 ) : (
                    !isLoading && <p className="text-center text-muted-foreground py-10">Nenhuma pessoa autorizada cadastrada para {student?.name}.</p>
                 )}
            </div>

          </CardContent>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. Isso irá remover permanentemente <span className="font-bold">{selectedPerson?.name}</span> da lista de pessoas autorizadas para {student?.name}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSelectedPerson(null)}>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>Remover</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
