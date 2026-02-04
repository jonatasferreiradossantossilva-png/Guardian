"use client";

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
import { MoreHorizontal, PlusCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ContractGenerateForm } from './contract-generate-form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


type Contract = {
  id: string;
  templateId: string;
  studentId: string;
  parentUserId: string;
  status: 'pending_acceptance' | 'accepted';
  createdAt: string;
  acceptedAt?: string;
};
type Student = { id: string; name: string };
type Parent = { id: string; name: string; userId: string };
type Template = { id: string; name: string };

interface ContractsListProps {
  initialContracts: Contract[];
  initialStudents: Student[];
  initialParents: Parent[];
  initialTemplates: Template[];
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
  
  const { data: liveContracts, isLoading: areContractsLoading } = useMockCollection('contracts');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');

  const contracts = liveContracts ?? initialContracts;
  const students = liveStudents ?? initialStudents;
  const parents = liveParents ?? initialParents;
  const isLoading = areContractsLoading || areStudentsLoading || areParentsLoading;
  
  const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s.name])), [students]);
  const parentDataMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  const handleFormSubmit = () => {
    setIsFormOpen(false);
  };
  
  const sortedContracts = useMemo(() => {
    if (!contracts) return [];
    return [...contracts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return format(new Date(dateString), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Contratos Gerados
        </h1>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsFormOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Gerar Novo Contrato
            </Button>
          </DialogTrigger>
          <ContractGenerateForm 
            students={students || []}
            parents={parents || []}
            templates={initialTemplates || []}
            existingContracts={contracts || []}
            onFormSubmit={handleFormSubmit}
          />
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Contratos</CardTitle>
          <CardDescription>Acompanhe o status de todos os contratos gerados para seus alunos.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data de Geração</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data do Aceite</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                )}
                {!isLoading && sortedContracts && sortedContracts.length > 0 ? (
                  sortedContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell className="font-medium">{studentsMap.get(contract.studentId) || 'Aluno não encontrado'}</TableCell>
                      <TableCell>{parentDataMap.get(contract.parentUserId) || 'Responsável não encontrado'}</TableCell>
                      <TableCell>{formatDate(contract.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[contract.status]} className="capitalize">
                          {contract.status === 'accepted' ? <CheckCircle className="mr-2 h-3 w-3" /> : <Clock className="mr-2 h-3 w-3" />}
                          {statusTextMap[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(contract.acceptedAt)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum contrato gerado.</TableCell></TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-4">
            {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
            {!isLoading && sortedContracts && sortedContracts.length > 0 ? (
                sortedContracts.map((contract) => (
                  <Card key={contract.id} className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="font-medium">{studentsMap.get(contract.studentId) || 'Aluno não encontrado'}</p>
                        <p className="text-sm text-muted-foreground">{parentDataMap.get(contract.parentUserId) || 'Responsável não encontrado'}</p>
                      </div>
                       <Badge variant={statusVariantMap[contract.status]} className="capitalize h-fit">
                          {contract.status === 'accepted' ? <CheckCircle className="mr-2 h-3 w-3" /> : <Clock className="mr-2 h-3 w-3" />}
                          {statusTextMap[contract.status]}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-xs text-muted-foreground">Gerado em</p>
                        <p>{formatDate(contract.createdAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Aceito em</p>
                        <p>{formatDate(contract.acceptedAt)}</p>
                      </div>
                    </div>
                  </Card>
                ))
            ) : (
              !isLoading && <p className="text-center text-muted-foreground py-10">Nenhum contrato gerado.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
