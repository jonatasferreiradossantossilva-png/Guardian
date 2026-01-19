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
import { MoreHorizontal, PlusCircle, ArrowLeft, Users } from 'lucide-react';
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
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import Link from 'next/link';
import { AuthorizedPersonForm } from '@/components/parent/authorized/authorized-form';

type AuthorizedPickup = {
  id: string;
  name: string;
  cpf: string;
  phone: string;
  studentId: string;
  parentUserId: string;
};

export default function AuthorizedPage() {
  const { toast } = useToast();
  const { deleteDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<AuthorizedPickup | null>(null);
  
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);

  const { data: students } = useMockCollection('students', mockUserId ? [{ field: 'parentId', op: '==', value: 'parent-1' }] : undefined); // Simplified for mock
  const student = useMemo(() => students?.[0], [students]);

  const { data: authorizedPersons, isLoading } = useMockCollection('authorized_pickups', mockUserId ? [
    { field: 'parentUserId', op: '==', value: mockUserId }
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
    deleteDoc('authorized_pickups', selectedPerson.id);
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
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Autorizados</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Users/>Pessoas Autorizadas</CardTitle>
                    <CardDescription className="mt-2">Adicione ou remova pessoas de confiança para a retirada do(a) {student?.name || 'aluno'}.</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setSelectedPerson(null); setIsFormOpen(true); }} disabled={!student}>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
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
                {!isLoading && authorizedPersons && authorizedPersons.length > 0 ? (
                  authorizedPersons.map((person) => (
                    <TableRow key={person.id}>
                      <TableCell>{person.name}</TableCell>
                      <TableCell>{person.cpf}</TableCell>
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
                      <TableCell colSpan={4} className="text-center h-24">
                        Nenhuma pessoa autorizada cadastrada.
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
                Esta ação não pode ser desfeita. Isso irá remover permanentemente <span className="font-bold">{selectedPerson?.name}</span> da lista de pessoas autorizadas.
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
