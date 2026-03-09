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
import { Check, MoreHorizontal, X, Clock, Info, DollarSign, Edit, School } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type TripRequest = {
  id: string;
  studentId: string;
  schoolId: string;
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
type SchoolData = { id: string; name: string };

interface TripRequestsListProps {
  initialRequests: TripRequest[];
  initialStudents: Student[];
  initialParents: Parent[];
  initialSchools: SchoolData[];
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

export function TripRequestsList({ initialRequests, initialStudents, initialParents, initialSchools }: TripRequestsListProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const [priceDialogRequest, setPriceDialogRequest] = useState<TripRequest | null>(null);
  const [price, setPrice] = useState<number | string>("");

  const { data: liveRequests, isLoading: areRequestsLoading } = useMockCollection('trip_requests');
  const { data: liveStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: liveParents, isLoading: areParentsLoading } = useMockCollection('parents');
  const { data: liveSchools, isLoading: areSchoolsLoading } = useMockCollection('schools');

  const requests = liveRequests ?? initialRequests;
  const students = liveStudents ?? initialStudents;
  const parents = liveParents ?? initialParents;
  const schools = liveSchools ?? initialSchools;
  const isLoading = areRequestsLoading || areStudentsLoading || areParentsLoading || areSchoolsLoading;
  
  const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s.name])), [students]);
  const parentDataMap = useMemo(() => {
    if (!parents) return new Map();
    return new Map(parents.map(p => [p.userId, { id: p.id, name: p.name }]));
  }, [parents]);
  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);

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
          {/* Desktop View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Aluno</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Escola</TableHead>
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
                    <TableCell colSpan={8} className="text-center h-24">Carregando...</TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
                  sortedRequests.map((request) => {
                    const studentName = studentsMap.get(request.studentId) || 'Aluno não encontrado';
                    const parentInfo = parentDataMap.get(request.parentUserId);
                    const parentName = parentInfo?.name || 'Responsável não encontrado';
                    const parentIdForAvatar = parentInfo?.id;
                    const schoolName = schoolsMap.get(request.schoolId) || 'Não informada';

                    return (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/student-${request.studentId}/100/100`} />
                                  <AvatarFallback>{(studentName || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex items-center gap-2">
                                <span>{studentName}</span>
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
                              </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                  <AvatarImage src={`https://picsum.photos/seed/parent-${parentIdForAvatar}/100/100`} />
                                  <AvatarFallback>{(parentName || '?')[0]}</AvatarFallback>
                              </Avatar>
                              <span>{parentName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{schoolName}</TableCell>
                        <TableCell>{request.date.split('-').reverse().join('/')}</TableCell>
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
                    )
                  })
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">Nenhuma solicitação encontrada.</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile View */}
          <div className="md:hidden space-y-4">
            {isLoading && <div className="flex justify-center py-10"><Clock className="animate-spin" /></div>}
            {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
              sortedRequests.map((request) => {
                const studentName = studentsMap.get(request.studentId) || 'Aluno não encontrado';
                const parentInfo = parentDataMap.get(request.parentUserId);
                const parentName = parentInfo?.name || 'Responsável não encontrado';
                const schoolName = schoolsMap.get(request.schoolId) || 'Não informada';

                return (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={`https://picsum.photos/seed/student-${request.studentId}/100/100`} />
                            <AvatarFallback>{(studentName || '?')[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">{studentName}</CardTitle>
                            <CardDescription className="text-xs">{parentName}</CardDescription>
                          </div>
                        </div>
                        <Badge variant={statusVariantMap[request.status]} className="text-[10px]">
                          {statusTextMap[request.status]}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-4 pt-2">
                      <div className="grid grid-cols-2 gap-y-3 text-sm">
                        <div className="col-span-2 flex items-center gap-2 text-muted-foreground">
                          <School className="h-3 w-3" />
                          <span>{schoolName}</span>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Data</p>
                          <p>{request.date.split('-').reverse().join('/')}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Tipo</p>
                          <p>{request.type === 'ida_e_volta' ? 'Ida/Volta' : request.type === 'ida' ? 'Só Ida' : 'Só Volta'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Turno</p>
                          <p className="capitalize">{request.shift}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor</p>
                          <p className="font-bold text-primary">{request.amount ? `R$ ${request.amount.toFixed(2)}` : '-'}</p>
                        </div>
                        {request.reason && (
                          <div className="col-span-2 p-2 bg-muted/50 rounded text-xs italic">
                            "{request.reason}"
                          </div>
                        )}
                      </div>
                    </CardContent>
                    {(request.status === 'pendente' || request.status === 'aguardando_aprovacao_pai') && (
                      <CardFooter className="p-2 bg-secondary/30 flex gap-2">
                        {request.status === 'pendente' && (
                          <>
                            <Button size="sm" variant="outline" className="flex-1" onClick={() => setPriceDialogRequest(request)}>
                              <DollarSign className="mr-1 h-3 w-3" /> Valor
                            </Button>
                            <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(request.id, 'aprovada')}>
                              <Check className="mr-1 h-3 w-3" /> Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleStatusChange(request.id, 'rejeitada')}>
                              <X className="mr-1 h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {request.status === 'aguardando_aprovacao_pai' && (
                          <div className="w-full text-center py-1 text-xs text-muted-foreground italic flex items-center justify-center gap-2">
                            <Clock className="h-3 w-3" /> Aguardando aceite do pai
                          </div>
                        )}
                      </CardFooter>
                    )}
                  </Card>
                )
              })
            ) : (
              !isLoading && <div className="text-center py-10 text-muted-foreground">Nenhuma solicitação pendente.</div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Assign Price Dialog */}
      <Dialog open={!!priceDialogRequest} onOpenChange={() => setPriceDialogRequest(null)}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Atribuir Valor</DialogTitle>
                <DialogDescription>
                    Defina o custo para esta viagem extra.
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
            <DialogFooter className="gap-2">
                <DialogClose asChild>
                    <Button type="button" variant="outline" className="flex-1">Cancelar</Button>
                </DialogClose>
                <Button type="button" onClick={handleSetPrice} className="flex-1">Salvar e Notificar</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
