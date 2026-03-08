
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
import { Loader2, UserX, ShieldCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="text-primary" />
            Identificação Visual para Retirada
          </DialogTitle>
          <DialogDescription>
            Confirme o rosto da pessoa autorizada antes de liberar {studentName}.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : studentAuthorizedContacts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {studentAuthorizedContacts.map((person) => (
                    <div key={person.id} className="flex items-center gap-4 p-4 rounded-lg border bg-secondary/20 overflow-hidden">
                        <Avatar className="h-20 w-20 shrink-0 rounded-lg">
                            <AvatarImage src={person.photoUrl} style={{ objectFit: 'cover' }} />
                            <AvatarFallback className="rounded-lg">IMG</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="font-bold text-base truncate">{person.name}</p>
                            <p className="text-xs text-muted-foreground truncate">CPF: {person.cpf}</p>
                            <p className="text-xs text-muted-foreground mt-1 truncate">Tel: {person.phone || 'N/A'}</p>
                        </div>
                    </div>
                ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full p-10 border-2 border-dashed rounded-md">
              <UserX className="h-12 w-12 mb-4 opacity-20" />
              <p className="font-semibold text-lg">Sem identificação por foto</p>
              <p className="text-sm">
                Apenas o responsável principal possui autorização no sistema.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full sm:w-auto">
            Entendido, fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
