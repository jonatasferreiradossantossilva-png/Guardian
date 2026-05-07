
// @ts-nocheck
'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useDataCollection, useData } from '@/hooks/use-data';
import { Loader2, UserX, ShieldCheck, Phone, CheckCircle, UserCheck, Heart } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuthorizedContactsModalProps {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
  onConfirmHandover?: (authorizedPersonName: string) => void;
  targetStatus?: StudentStatus;
}

export function AuthorizedContactsModal({
  studentId,
  studentName,
  isOpen,
  onClose,
  onConfirmHandover,
  targetStatus = 'desembarcado',
}: AuthorizedContactsModalProps) {
  const { data: allAuthorized, isLoading } =
    useDataCollection('authorized_pickups');
  const { updateDoc } = useData() as any;
  const { toast } = useToast();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const studentAuthorizedContacts = useMemo(() => {
    if (!allAuthorized || !studentId) return [];
    return allAuthorized.filter((person) => person.studentId === studentId);
  }, [allAuthorized, studentId]);

  const maskCpf = (cpf: string) => {
    if (!cpf || cpf.length < 5) return cpf;
    return `***.${cpf.slice(4, 7)}.***-${cpf.slice(-2)}`;
  };

  const handleConfirmHandover = () => {
    const person = studentAuthorizedContacts.find(p => p.id === selectedPersonId);
    if (!person) return;

    setIsConfirming(true);

    // Register the handover on the student record
    updateDoc('students', studentId, {
      status: targetStatus,
      lastHandover: {
        authorizedPersonId: person.id,
        authorizedPersonName: person.name,
        relationship: person.relationship,
        timestamp: new Date().toISOString(),
      }
    });

    toast({
      title: "✅ Entrega Confirmada!",
      description: `${studentName} foi entregue a ${person.name} (${person.relationship}).`,
    });

    onConfirmHandover?.(person.name);

    setTimeout(() => {
      setIsConfirming(false);
      setSelectedPersonId(null);
      onClose();
    }, 600);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { setSelectedPersonId(null); onClose(); } }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="bg-primary/10 p-6 pb-4 border-b">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                <ShieldCheck className="text-primary h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black uppercase tracking-tight">
                  Verificação de Retirada
                </DialogTitle>
                <DialogDescription className="text-xs font-bold uppercase tracking-wide mt-0.5">
                  Confirme visualmente quem está retirando <span className="text-primary font-black">{studentName}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 min-h-[200px]">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="animate-spin text-primary h-8 w-8" />
            </div>
          ) : (studentAuthorizedContacts || []).length > 0 ? (
            (studentAuthorizedContacts || []).filter(p => !!p && !!p.id).map((person, idx) => {
              const isSelected = selectedPersonId === person.id;
              return (
                <button
                  key={`auth-person-${person.id || idx}`}
                  type="button"
                  onClick={() => setSelectedPersonId(isSelected ? null : person.id)}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                    isSelected
                      ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/30 shadow-lg scale-[1.01]"
                      : "border-border bg-card hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  {/* Large Photo */}
                  <div className="relative shrink-0">
                    <Avatar className={cn(
                      "h-20 w-20 rounded-xl border-2 shadow-md transition-all",
                      isSelected ? "border-green-500" : "border-primary/20"
                    )}>
                      <AvatarImage src={person?.photoUrl || ""} style={{ objectFit: 'cover' }} />
                      <AvatarFallback className="rounded-xl text-xl font-black">{person?.name ? person.name[0] : '?'}</AvatarFallback>
                    </Avatar>
                    {isSelected && (
                      <div className="absolute -top-2 -right-2 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center shadow-md animate-in zoom-in duration-200">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="font-black text-sm uppercase truncate leading-tight">{person?.name || 'Sem Nome'}</p>

                    <div className="flex items-center gap-1.5">
                      <Heart className="h-3 w-3 text-primary shrink-0" />
                      <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-wider bg-primary/10 text-primary border-primary/20 py-0 h-5">
                        {person?.relationship || 'Parentesco'}
                      </Badge>
                    </div>

                    <p className="text-[10px] text-muted-foreground font-bold">
                      CPF: {maskCpf(person?.cpf)}
                    </p>

                    {person?.phone && (
                      <a
                        href={`tel:${person.phone.replace(/\D/g, '')}`}
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase tracking-wide"
                      >
                        <Phone className="h-3 w-3" />
                        {person.phone}
                      </a>
                    )}
                  </div>

                  {/* Selection indicator */}
                  <div className={cn(
                    "h-6 w-6 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                    isSelected ? "bg-green-500 border-green-500" : "border-muted-foreground/30"
                  )}>
                    {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                  </div>
                </button>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
              <UserX className="h-14 w-14 mb-4 opacity-15" />
              <p className="font-black text-base uppercase">Sem autorizados cadastrados</p>
              <p className="text-xs mt-1 max-w-[260px]">
                O responsável principal ainda não registrou pessoas autorizadas para {studentName}.
              </p>
            </div>
          )}
        </div>

        {/* Footer with Confirm Button */}
        <DialogFooter className="p-4 pt-0 flex flex-col gap-2">
          {selectedPersonId && (
            <Button
              onClick={handleConfirmHandover}
              disabled={isConfirming}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-wide shadow-xl animate-in slide-in-from-bottom-2 duration-300"
            >
              {isConfirming ? (
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
              ) : (
                <UserCheck className="mr-2 h-5 w-5" />
              )}
              CONFIRMAR PARA {studentAuthorizedContacts.find(p => p.id === selectedPersonId)?.name?.split(' ')[0] || ''}
            </Button>
          )}
          <Button onClick={() => { setSelectedPersonId(null); onClose(); }} variant="outline" className="w-full font-bold text-xs uppercase">
            {selectedPersonId ? 'Cancelar' : 'Fechar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
