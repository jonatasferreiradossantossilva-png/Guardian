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
import { Check, MoreHorizontal, X, Clock, Info, DollarSign } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'aguardando_aprovacao_pai';
  reason?: string;
  createdAt: string;
  amount?: number;
};

type Student = { id: string; name: string };
type Parent = { id: string; name: string; userId: string };

interface TripRequestsListProps {
  initialRequests: TripRequest[];
  initialStudents: Student[];
  initialParents: Parent[];
}

const statusVariantMap: Record<TripRequest['status'], 'secondary' | 'default' | 'destructive' | 'outline'> = {
  pendente: 'secondary',
  aprovada: 'default',
  rejeitada: 'destructive',
  aguardando_aprovacao_pai: 'outline',
};

const statusTextMap: Record<TripRequest['status'], string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  aguardando_aprovacao_pai: 'Aguardando Aprovação',
};

const typeMap = {
  ida: 'Ida para a escola',
  volta: 'Volta da escola',
  ida_e_volta: 'Ida e Volta',
};

export function TripRequestsList({ initialRequests, initialStudents, initialParents }: TripRequestsListProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const [priceDialogRequest, setPriceDialogRequest] = useState<TripRequest | null>(null);
  const [price, setPrice] = useState<number | string>("");

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

  const handleSetPrice = () => {
    if (!priceDialogRequest || price === "" || Number(price) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Por favor, insira um valor numérico positivo.",
        variant: "destructive"
      });
      return;
    }
    updateDoc('trip_requests', priceDialogRequest.id, { amount: Number(price), status: 'aguardando_aprovacao_pai' });
    toast({
      title: "Valor atribuído!",
      description: `A solicitação agora aguarda a aprovação do responsável.`,
    });
    setPriceDialogRequest(null);
    setPrice("");
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
          <CardDescription>Aprove, rejeite e defina valores para as solicitações de transporte avulso.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">Carregando...</TableCell>
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
                    <TableCell>{request.amount ? `R$ ${request.amount.toFixed(2)}` : '-'}</TableCell>
                    <TableCell><Badge variant={statusVariantMap[request.status]} className="capitalize">{statusTextMap[request.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                           <Button variant="ghost" className="h-8 w-8 p-0" disabled={request.status === 'aprovada' || request.status === 'rejeitada'}>
                                <span className="sr-only">Abrir menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <DropdownMenuLabel>Ações</DropdownMenuLabel>
                             <DropdownMenuItem onClick={() => handleStatusChange(request.id, 'aprovada')} disabled={request.status !== 'pendente'}>
                                <Check className="mr-2" /> Aprovar Direto
                             </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setPriceDialogRequest(request)} disabled={request.status !== 'pendente'}>
                                 <DollarSign className="mr-2" /> Atribuir Valor
                             </DropdownMenuItem>
                             <DropdownMenuSeparator />
                             <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(request.id, 'rejeitada')}>
                                <X className="mr-2"/> Rejeitar
                             </DropdownMenuItem>
                        </DropdownMenuContent>
                       </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">Nenhuma solicitação encontrada.</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Assign Price Dialog */}
      <Dialog open={!!priceDialogRequest} onOpenChange={() => setPriceDialogRequest(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Atribuir Valor à Viagem Avulsa</DialogTitle>
                <DialogDescription>
                    Defina o custo para a solicitação de {studentsMap.get(priceDialogRequest?.studentId || '')} para o dia {priceDialogRequest?.date ? format(new Date(priceDialogRequest.date), "dd/MM/yyyy") : ''}. O responsável precisará aprovar este valor.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <label htmlFor="price" className="text-sm font-medium">Valor (R$)</label>
                <Input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="mt-2"
                />
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="outline">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSetPrice}>Salvar e Notificar Responsável</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

    