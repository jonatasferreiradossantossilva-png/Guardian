"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, MoreHorizontal, X, Clock, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { Badge } from "@/components/ui/badge";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TripRequest = {
  id: string;
  studentId: string;
  parentUserId: string;
  date: string;
  type: 'ida' | 'volta' | 'ida_e_volta';
  shift: 'manha' | 'tarde';
  status: 'pendente' | 'aprovada' | 'rejeitada';
  reason?: string;
  createdAt: string;
};

type Student = { id: string; name: string };
type Parent = { id: string; name: string };

interface TripRequestsListProps {
  initialRequests: TripRequest[];
  initialStudents: Student[];
  initialParents: Parent[];
}

const statusVariantMap: Record<TripRequest['status'], 'secondary' | 'default' | 'destructive'> = {
  pendente: 'secondary',
  aprovada: 'default',
  rejeitada: 'destructive',
};

const typeMap = {
  ida: 'Ida para a escola',
  volta: 'Volta da escola',
  ida_e_volta: 'Ida e Volta',
};

export function TripRequestsList({ initialRequests, initialStudents, initialParents }: TripRequestsListProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const { data: liveRequests, isLoading: areRequestsLoading } = useMockCollection('trip_requests');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');

  const requests = liveRequests ?? initialRequests;
  const students = liveStudents ?? initialStudents;
  const parents = liveParents ?? initialParents;
  const isLoading = areRequestsLoading || areStudentsLoading || areParentsLoading;
  
  const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s.name])), [students]);
  const parentsMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  const handleStatusChange = (requestId: string, newStatus: TripRequest['status']) => {
    updateDoc('trip_requests', requestId, { status: newStatus });
    toast({
      title: `Solicitação ${newStatus === 'aprovada' ? 'Aprovada' : 'Rejeitada'}!`,
      description: `O status da solicitação foi atualizado.`,
    });
  };
  
  const sortedRequests = useMemo(() => {
    if (!requests) return [];
    return [...requests].sort((a, b) => {
        if (a.status === 'pendente' && b.status !== 'pendente') return -1;
        if (a.status !== 'pendente' && b.status === 'pendente') return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [requests]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Gerenciar Viagens Avulsas
        </h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Solicitações de Viagem</CardTitle>
          <CardDescription>Aprove ou rejeite as solicitações de transporte avulso enviadas pelos pais.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">Carregando...</TableCell>
                </TableRow>
              )}
              {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
                sortedRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium flex items-center gap-2">
                        {studentsMap.get(request.studentId) || 'Aluno não encontrado'}
                        {request.reason && (
                           <TooltipProvider>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                                </TooltipTrigger>
                                <TooltipContent><p>{request.reason}</p></TooltipContent>
                             </Tooltip>
                           </TooltipProvider>
                        )}
                    </TableCell>
                    <TableCell>{parentsMap.get(request.parentUserId) || 'Responsável não encontrado'}</TableCell>
                    <TableCell>{format(new Date(request.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                    <TableCell>{typeMap[request.type]}</TableCell>
                    <TableCell><Badge variant={statusVariantMap[request.status]} className="capitalize">{request.status}</Badge></TableCell>
                    <TableCell className="text-right">
                       {request.status === 'pendente' ? (
                          <div className="flex gap-2 justify-end">
                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(request.id, 'aprovada')}>
                                <Check />
                            </Button>
                             <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => handleStatusChange(request.id, 'rejeitada')}>
                                <X />
                            </Button>
                          </div>
                       ) : (
                           <div className="flex items-center justify-end text-muted-foreground text-sm gap-2">
                            <Clock className="h-4 w-4"/>
                            <span>Processado</span>
                           </div>
                       )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma solicitação encontrada.</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

    