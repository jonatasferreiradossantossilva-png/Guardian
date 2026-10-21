'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, ArrowLeft, Route, Check, X, Clock, Calendar, School, DollarSign, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useDataCollection, useData } from '@/hooks/use-data';
import { TripRequestForm } from '@/components/parent/requests/request-form';
import { Badge } from '@/components/ui/badge';
import { getSafeDate, getSafeDateStr } from '@/lib/safe-render';

type TripRequest = {
  id: string;
  studentId: string;
  parentUserId: string;
  schoolId: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  type: 'ida' | 'volta' | 'ida_e_volta';
  shift: 'manha' | 'tarde';
  status: 'pendente' | 'aprovada' | 'rejeitada' | 'aguardando_aprovacao_pai';
  reason?: string;
  createdAt: string;
  amount?: number;
};

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
  aguardando_aprovacao_pai: 'Aguardando Sua Aprovação',
};

const typeMap = {
    'ida': 'Ida para a escola',
    'volta': 'Volta da escola',
    'ida_e_volta': 'Ida e volta',
}

export default function TripRequestsPage() {
  const { toast } = useToast();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const { updateDoc, addDoc } = useData();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    let storedUserId = sessionStorage.getItem('mockUserId');
    if (!storedUserId) {
      storedUserId = 'user_parent_1'; // Safe fallback for dev/demo
      sessionStorage.setItem('mockUserId', storedUserId);
    }
    setMockUserId(storedUserId);
    
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    setSelectedStudentId(lastSelectedId);
  }, []);
  
  const { data: parents } = useDataCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined);
  const parent = useMemo(() => parents?.[0], [parents]);
  
  const { data: students } = useDataCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : undefined) as { data: any[] | undefined };
  
  const student = useMemo(() => {
      if (!students || students.length === 0) return null;
      if (!selectedStudentId) return students[0];
      return students.find((s: any) => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);

  const { data: tripRequests, isLoading } = useDataCollection('trip_requests', student ? [
    { field: 'studentId', op: '==', value: student.id }
  ] : undefined) as { data: TripRequest[] | undefined, isLoading: boolean };
  
  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedRequest(null);
  };

  const handleApproval = (request: TripRequest, approved: boolean) => {
    const newStatus = approved ? 'aprovada' : 'rejeitada';
    (updateDoc as any)('trip_requests', request.id, { status: newStatus });
    
    if (approved && request.amount) {
        const startStr = getSafeDateStr(request.startDate);
        const dateStr = getSafeDateStr(request.date);
        (addDoc as any)('invoices', {
            studentId: request.studentId,
            parentUserId: request.parentUserId,
            description: `Viagem Avulsa - ${startStr ? startStr.split('-').reverse().join('/') : (dateStr ? dateStr.split('-').reverse().join('/') : '')}`,
            amount: request.amount,
            dueDate: startStr || dateStr || new Date().toISOString().split('T')[0],
            status: 'pending'
        });
        toast({
            title: `Solicitação Aprovada!`,
            description: `Uma nova fatura de R$ ${request.amount.toFixed(2)} foi gerada para ${student?.name}.`,
        });
    } else {
        toast({
            title: `Solicitação ${approved ? 'aprovada' : 'rejeitada'}!`,
            description: `Sua decisão foi registrada.`,
        });
    }
  };
  
  const sortedRequests = useMemo(() => {
    if (!tripRequests) return [];
    return [...tripRequests].sort((a, b) => getSafeDate(b.createdAt).getTime() - getSafeDate(a.createdAt).getTime());
  }, [tripRequests]);

  const handleEdit = (request: TripRequest) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground p-4 pb-32 md:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-xl font-bold md:hidden">Viagens Extras</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <CardTitle className="flex items-center gap-2">Viagens Avulsas</CardTitle>
                    <CardDescription className="mt-2 text-primary font-semibold">Aluno(a): {student?.name || 'Carregando...'}</CardDescription>
                    <CardDescription className="mt-1">Solicite um transporte extra para o aluno.</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setSelectedRequest(null); setIsFormOpen(true); }} disabled={!student} className="w-full sm:w-auto h-12 sm:h-10 text-base sm:text-sm">
                        <PlusCircle className="mr-2 h-5 w-5 sm:h-4 sm:w-4" />
                        Nova Solicitação
                        </Button>
                    </DialogTrigger>
                    {student && mockUserId && (
                        <TripRequestForm
                            request={selectedRequest || undefined}
                            studentId={student.id}
                            schoolId={student.schoolId}
                            parentUserId={mockUserId}
                            onFormSubmit={handleFormSubmit}
                        />
                    )}
                </Dialog>
            </div>
          </CardHeader>
          <CardContent className="p-0 sm:p-6">
            {/* Desktop View */}
            <div className="hidden md:block">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">
                        Carregando...
                        </TableCell>
                    </TableRow>
                    )}
                    {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
                    sortedRequests.map((request) => (
                        <TableRow key={request.id}>
                        <TableCell className="font-medium">
                            {request.startDate ? (
                                <span>
                                    {getSafeDateStr(request.startDate).split('-').reverse().join('/')}
                                    {request.endDate && getSafeDateStr(request.endDate) !== getSafeDateStr(request.startDate) && ` - ${getSafeDateStr(request.endDate).split('-').reverse().join('/')}`}
                                </span>
                            ) : (
                                request.date ? getSafeDateStr(request.date).split('-').reverse().join('/') : ''
                            )}
                        </TableCell>
                        <TableCell>{typeMap[request.type]}</TableCell>
                        <TableCell className="capitalize">{request.shift}</TableCell>
                        <TableCell>{request.amount ? `R$ ${request.amount.toFixed(2)}` : '-'}</TableCell>
                        <TableCell>
                            <Badge variant={(statusVariantMap[request.status] || 'secondary') as any} className="capitalize">{(statusTextMap[request.status] || 'Pendente')}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            {request.status === 'aguardando_aprovacao_pai' ? (
                            <div className="flex gap-2 justify-end">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 h-8" onClick={() => handleApproval(request, true)}>
                                    <Check className="mr-2 h-4 w-4" /> Aprovar
                                </Button>
                                <Button size="sm" variant="destructive" className="h-8" onClick={() => handleApproval(request, false)}>
                                    <X className="mr-2 h-4 w-4" /> Recusar
                                </Button>
                            </div>
                            ) : request.status === 'pendente' ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                        <span className="sr-only">Abrir menu</span>
                                        <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleEdit(request)}>
                                            Editar
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                            <span className="text-xs italic text-muted-foreground">
                                Finalizado
                            </span>
                            )}
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    !isLoading && (
                        <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                            Nenhuma solicitação encontrada para {student?.name}.
                        </TableCell>
                        </TableRow>
                    )
                    )}
                </TableBody>
                </Table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden divide-y">
                {isLoading && <div className="flex justify-center py-10"><Clock className="animate-spin" /></div>}
                {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
                    sortedRequests.map((request) => (
                        <div key={request.id} className="p-4 space-y-4">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-sm font-bold">
                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                        {request.startDate ? (
                                            <span>
                                                {getSafeDateStr(request.startDate).split('-').reverse().join('/')}
                                                {request.endDate && getSafeDateStr(request.endDate) !== getSafeDateStr(request.startDate) && ` - ${getSafeDateStr(request.endDate).split('-').reverse().join('/')}`}
                                            </span>
                                        ) : (
                                            request.date ? getSafeDateStr(request.date).split('-').reverse().join('/') : ''
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">{typeMap[request.type]}</p>
                                </div>
                                <Badge variant={(statusVariantMap[request.status] || 'secondary') as any} className="text-[10px] uppercase">
                                    {(statusTextMap[request.status] || 'Pendente').replace('Sua ', '')}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/20 p-3 rounded-lg border border-secondary">
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Turno</p>
                                    <p className="capitalize font-medium">{request.shift}</p>
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-[10px] text-muted-foreground uppercase font-bold">Valor</p>
                                    <p className="font-bold text-primary">{request.amount ? `R$ ${request.amount.toFixed(2)}` : 'A definir'}</p>
                                </div>
                                {request.reason && (
                                    <div className="col-span-2 space-y-0.5 border-t pt-2 mt-1">
                                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Motivo</p>
                                        <p className="text-xs italic">"{request.reason}"</p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2">
                                {request.status === 'aguardando_aprovacao_pai' && (
                                    <>
                                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleApproval(request, true)}>
                                            <Check className="mr-2 h-4 w-4" /> Aceitar Valor
                                        </Button>
                                        <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleApproval(request, false)}>
                                            <X className="mr-2 h-4 w-4" /> Recusar
                                        </Button>
                                    </>
                                )}
                                {request.status === 'pendente' && (
                                    <Button variant="outline" size="sm" className="w-full" onClick={() => handleEdit(request)}>
                                        <Edit className="mr-2 h-4 w-4" /> Editar Solicitação
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    !isLoading && <div className="text-center py-16 text-muted-foreground italic">Nenhuma solicitação para {student?.name}.</div>
                )}
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}
