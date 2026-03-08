
"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, CheckCircle, Clock, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractGenerateForm } from './contract-generate-form';
import { ContractViewerModal } from './contract-viewer-modal';

type Contract = {
  id: string;
  templateId: string;
  studentId: string;
  parentUserId: string;
  status: 'pending_acceptance' | 'accepted';
  createdAt: string;
  acceptedAt?: string;
  generatedContent: string;
};

interface ContractsListProps {
  initialContracts: Contract[];
  initialStudents: any[];
  initialParents: any[];
  initialTemplates: any[];
}

const statusVariantMap: Record<Contract['status'], 'secondary' | 'default'> = {
  pending_acceptance: 'secondary',
  accepted: 'default',
};

const statusTextMap: Record<Contract['status'], string> = {
  pending_acceptance: 'Aguardando Aceite',
  accepted: 'Aceito',
};

export function ContractsList({ initialContracts, initialStudents, initialParents, initialTemplates }: ContractsListProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [viewingContract, setViewingContract] = useState<Contract | null>(null);
  
  // Fetch live data to ensure reactivity
  const { data: liveContracts, isLoading: areContractsLoading } = useMockCollection('contracts');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: liveTemplates, isLoading: areTemplatesLoading } = useMockCollection('contract_templates');

  const contracts = liveContracts ?? initialContracts;
  const students = liveStudents ?? initialStudents;
  const parents = liveParents ?? initialParents;
  const templates = liveTemplates ?? initialTemplates;
  
  const isLoading = areContractsLoading || areStudentsLoading || areParentsLoading || areTemplatesLoading;
  
  const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s.name])), [students]);
  const parentDataMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  const handleFormSubmit = useCallback(() => {
    setIsFormOpen(false);
  }, []);
  
  const sortedContracts = useMemo(() => {
    if (!contracts) return [];
    return [...contracts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
        return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch (e) {
        return dateString;
    }
  };
  
  const handleViewContract = (contract: Contract) => {
    setViewingContract(contract);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-foreground italic uppercase">
          Gestão de Contratos
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
                  <TableHead>Gerado em</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aceite em</TableHead>
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
                      <TableCell className="text-xs text-muted-foreground">{formatDate(contract.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[contract.status]} className="font-bold uppercase text-[9px] tracking-tight">
                          {contract.status === 'accepted' ? <CheckCircle className="mr-1 h-3 w-3" /> : <Clock className="mr-1 h-3 w-3" />}
                          {statusTextMap[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{formatDate(contract.acceptedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleViewContract(contract)} className="h-8 text-xs font-bold border-primary/20 text-primary">
                          <FileText className="mr-1.5 h-3.5 w-3.5" />
                          Visualizar
                        </Button>
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
                       <Badge variant={statusVariantMap[contract.status]} className="text-[9px] font-black h-5">
                          {statusTextMap[contract.status].toUpperCase()}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-3 rounded-lg border border-dashed">
                      <div>
                        <p className="text-[9px] text-muted-foreground font-black uppercase">Gerado</p>
                        <p className="text-[10px]">{formatDate(contract.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-muted-foreground font-black uppercase">Aceite</p>
                        <p className="text-[10px]">{formatDate(contract.acceptedAt)}</p>
                      </div>
                    </div>
                     <Button variant="outline" size="sm" className="w-full font-bold border-primary/30 text-primary h-10" onClick={() => handleViewContract(contract)}>
                        <FileText className="mr-2 h-4 w-4" />
                        VISUALIZAR CONTRATO
                    </Button>
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
    </div>
  );
}
