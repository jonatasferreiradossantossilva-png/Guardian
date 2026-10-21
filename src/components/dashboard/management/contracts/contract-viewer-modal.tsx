"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSafeDate } from '@/lib/safe-render';

type Contract = {
  id: string;
  generatedContent: string;
  status: 'pending_acceptance' | 'accepted';
  acceptedAt?: string;
  createdAt: string;
  studentName: string; 
};

interface ContractViewerModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractViewerModal({ contract, isOpen, onClose }: ContractViewerModalProps) {
  if (!contract) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText />
            Visualizar Contrato
          </DialogTitle>
          <DialogDescription>
            Contrato gerado para <span className="font-semibold">{contract.studentName}</span> em {format(getSafeDate(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
            <ScrollArea className="h-[60vh] border rounded-md p-4 bg-secondary/30">
                <pre className="whitespace-pre-wrap font-sans text-sm">{contract.generatedContent}</pre>
            </ScrollArea>
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
