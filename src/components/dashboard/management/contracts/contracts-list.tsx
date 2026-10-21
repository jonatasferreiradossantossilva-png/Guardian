"use client";

import { useState, useMemo, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, FileText, Loader2, MessageCircle, Edit, PlusCircle, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useDataCollection } from '@/hooks/use-data';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractGenerateForm } from './contract-generate-form';
import { ContractEditForm } from './contract-edit-form';
import { ContractViewerModal } from './contract-viewer-modal';
import { useToast } from '@/hooks/use-toast';
import { getSafeDate } from '@/lib/safe-render';

import { Student, Parent, MockDB } from '@/types/mock-data';

type Template = MockDB['contract_templates'][number];
type Contract = MockDB['contracts'][number];

interface ContractsListProps {
  initialContracts: Contract[];
  initialStudents: Student[];
  initialParents: Parent[];
  initialTemplates: Template[];
}

const modalityLabels: Record<string, string> = {
    'completo': 'Ida e Volta',
    'so_ida': 'Só Ida',
    'so_volta': 'Só Volta'
};

const statusVariantMap: Record<"pending_acceptance" | "accepted", "secondary" | "default"> = {
  pending_acceptance: 'secondary',
  accepted: 'default',
};

const statusTextMap: Record<"pending_acceptance" | "accepted", string> = {
  pending_acceptance: 'Aguardando Aceite',
  accepted: 'Aceito',
};

export function ContractsList({ initialContracts, initialStudents, initialParents, initialTemplates }: ContractsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const { toast } = useToast();
  
  const { data: liveContracts, isLoading: areContractsLoading } = useDataCollection('contracts');
  const { data: liveStudents, isLoading: areStudentsLoading } = useDataCollection('students');
  const { data: liveParents, isLoading: areParentsLoading } = useDataCollection('parents');
  const { data: liveTemplates, isLoading: areTemplatesLoading } = useDataCollection('contract_templates');

  const contracts = liveContracts ?? initialContracts;
  const students = liveStudents ?? initialStudents;
  const parents = liveParents ?? initialParents;
  const templates = liveTemplates ?? initialTemplates;
  
  const isLoading = areContractsLoading || areStudentsLoading || areParentsLoading || areTemplatesLoading;
  
  const studentsMap = useMemo(() => new Map(students?.map((s: Student) => [s.id, s.name]) || []), [students]);
  const parentDataMap = useMemo(() => new Map(parents?.map((p: Parent) => [p.userId, p.name]) || []), [parents]);

  const handleFormSubmit = useCallback(() => {
    setIsFormOpen(false);
    setIsEditOpen(false);
    setEditingContract(null);
  }, []);
  
  const sortedContracts = useMemo(() => {
    if (!contracts) return [];
    return [...contracts].sort((a, b) => getSafeDate(b.createdAt).getTime() - getSafeDate(a.createdAt).getTime());
  }, [contracts]);

  const formatDate = (dateString?: any) => {
    if (!dateString) return '-';
    try {
        return format(getSafeDate(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
        return String(dateString);
    }
  };
  
  const handleViewContract = (contract: Contract) => {
    setViewingContract(contract);
  };

  const handleEditContract = (contract: Contract) => {
    setEditingContract(contract);
    setIsEditOpen(true);
  };

  const handleShareContract = (contract: Contract) => {
      const studentName = studentsMap.get(contract.studentId);
      const parentName = parentDataMap.get(contract.parentUserId);
      const message = `Olá, ${parentName}! O contrato de transporte do aluno ${studentName} foi gerado. Por favor, acesse seu painel no Guardian para assinar digitalmente:\n\n${window.location.origin}/parent/contract`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      toast({ title: "Link enviado!", description: "Compartilhamento via WhatsApp iniciado." });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground italic uppercase">
          Contratos
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)} className="font-bold">
              <PlusCircle className="mr-2 h-4 w-4" />
              Gerar Novo Contrato
            </Button>
          </DialogTrigger>
          <ContractGenerateForm 
            students={students || []}
            parents={parents || []}
            templates={templates || []}
            existingContracts={contracts || []}
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card className="border-secondary shadow-lg">
        <CardHeader className="bg-muted/10 border-b">
          <CardTitle className="text-lg">Histórico de Contratos</CardTitle>
          <CardDescription>Acompanhe o status de aceite dos contratos gerados.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Aluno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                ) : sortedContracts && sortedContracts.length > 0 ? (
                  sortedContracts.map((contract) => (
                    <TableRow key={contract.id} className="hover:bg-muted/30">
                      <TableCell className="font-bold">{studentsMap.get(contract.studentId) || 'N/A'}</TableCell>
                      <TableCell className="text-sm">{parentDataMap.get(contract.parentUserId) || 'N/A'}</TableCell>
                      <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold border-primary/20 text-primary">
                              <ArrowRightLeft className="mr-1 h-2.5 w-2.5" />
                              {modalityLabels[contract.serviceModality || 'completo']}
                          </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(contract.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[contract.status as "pending_acceptance" | "accepted"]} className="font-bold uppercase text-[9px] tracking-tight">
                          {contract.status === 'accepted' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                          {statusTextMap[contract.status as "pending_acceptance" | "accepted"]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleViewContract(contract)} className="h-8 text-xs font-bold border-primary/20 text-primary">
                                <FileText className="mr-1.5 h-3.5 w-3.5" />
                                Visualizar
                            </Button>
                            {contract.status === 'pending_acceptance' && (
                                <>
                                    <Button variant="outline" size="sm" onClick={() => handleEditContract(contract)} className="h-8 text-xs font-bold border-primary/20 text-primary">
                                        <Edit className="mr-1.5 h-3.5 w-3.5" />
                                        Editar
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleShareContract(contract)} className="h-8 text-xs font-bold text-green-600 hover:text-green-700 hover:bg-green-50">
                                        <MessageCircle className="mr-1.5 h-3.5 w-3.5" />
                                        Notificar
                                    </Button>
                                </>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={6} className="h-32 text-center text-muted-foreground">Nenhum contrato gerado ainda.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="md:hidden divide-y">
            {!isLoading && sortedContracts && sortedContracts.length > 0 ? (
                sortedContracts.map((contract) => (
                  <div key={contract.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-base">{studentsMap.get(contract.studentId) || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground uppercase font-medium">{parentDataMap.get(contract.parentUserId)}</p>
                      </div>
                       <Badge variant={statusVariantMap[contract.status as "pending_acceptance" | "accepted"]} className="text-[9px] font-black h-5">
                          {statusTextMap[contract.status as "pending_acceptance" | "accepted"].toUpperCase()}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-dashed">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-black uppercase">Modalidade</p>
                        <p className="text-[10px] font-bold text-primary">{modalityLabels[contract.serviceModality || 'completo']}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-black uppercase">Gerado</p>
                        <p className="text-[10px]">{formatDate(contract.createdAt).split(' às')[0]}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="flex-1 font-bold border-primary/30 text-primary h-10" onClick={() => handleViewContract(contract)}>
                            <FileText className="mr-2 h-4 w-4" />
                            VER
                        </Button>
                        {contract.status === 'pending_acceptance' && (
                            <>
                                <Button variant="outline" size="sm" className="flex-1 font-bold border-primary/30 text-primary h-10" onClick={() => handleEditContract(contract)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    EDITAR
                                </Button>
                                <Button variant="outline" size="sm" className="w-full font-bold border-green-600/30 text-green-600 h-10" onClick={() => handleShareContract(contract)}>
                                    <MessageCircle className="mr-2 h-4 w-4" />
                                    NOTIFICAR NO WHATSAPP
                                </Button>
                            </>
                        )}
                    </div>
                  </div>
                ))
            ) : !isLoading && (
              <div className="p-10 text-center text-muted-foreground">Nenhum contrato gerado.</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <ContractViewerModal 
        isOpen={!!viewingContract}
        onClose={() => setViewingContract(null)}
        contract={viewingContract ? { ...viewingContract, studentName: studentsMap.get(viewingContract.studentId) || 'Aluno desconhecido' } : null}
      />

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          {editingContract && (
              <ContractEditForm 
                contract={editingContract}
                studentName={studentsMap.get(editingContract.studentId) || 'Aluno'}
                onFormSubmit={handleFormSubmit}
              />
          )}
      </Dialog>
    </div>
  );
}
