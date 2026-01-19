'use client';

import { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Loader2, UserX } from 'lucide-react';

interface AuthorizedContactsModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AuthorizedContactsModal({
  studentId,
  studentName,
  isOpen,
  onClose,
}: AuthorizedContactsModalProps) {
  const { data: allAuthorized, isLoading } =
    useMockCollection('authorized_pickups');

  const studentAuthorizedContacts = useMemo(() => {
    if (!allAuthorized || !studentId) return [];
    return allAuthorized.filter((person) => person.studentId === studentId);
  }, [allAuthorized, studentId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pessoas Autorizadas para Retirada</DialogTitle>
          <DialogDescription>
            Contatos de confiança autorizados para retirar {studentName}.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 min-h-[150px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : studentAuthorizedContacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Telefone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentAuthorizedContacts.map((person) => (
                  <TableRow key={person.id}>
                    <TableCell>{person.name}</TableCell>
                    <TableCell>{person.cpf}</TableCell>
                    <TableCell>{person.phone || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-6 border rounded-md">
              <UserX className="h-10 w-10 mb-2" />
              <p className="font-semibold">Nenhum contato autorizado</p>
              <p className="text-sm">
                Apenas o responsável principal pode retirar este aluno.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
