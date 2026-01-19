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
import { MoreHorizontal, PlusCircle, ArrowLeft, Route } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { TripRequestForm } from '@/components/parent/requests/request-form';
import { Badge } from '@/components/ui/badge';
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

const statusVariantMap: Record<TripRequest['status'], 'secondary' | 'default' | 'destructive'> = {
  pendente: 'secondary',
  aprovada: 'default',
  rejeitada: 'destructive',
};

const typeMap = {
    'ida': 'Ida para a escola',
    'volta': 'Volta da escola',
    'ida_e_volta': 'Ida e volta',
}

export default function TripRequestsPage() {
  const { toast } = useToast();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TripRequest | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);
  
  const { data: students } = useMockCollection('students', mockUserId ? [{ field: 'parentId', op: '==', value: 'parent-1' }] : undefined); // Simplified for mock
  const student = useMemo(() => students?.[0], [students]);

  const { data: tripRequests, isLoading } = useMockCollection('trip_requests', mockUserId ? [
    { field: 'parentUserId', op: '==', value: mockUserId }
  ] : undefined);
  
  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedRequest(null);
  };
  
  const sortedRequests = useMemo(() => {
    if (!tripRequests) return [];
    return [...tripRequests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [tripRequests]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button asChild variant="outline" size="icon">
            <Link href="/parent/tracking">
              <ArrowLeft />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Solicitações de Viagem</h1>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2"><Route/>Viagens Avulsas</CardTitle>
                    <CardDescription className="mt-2">Solicite um transporte extra para {student?.name || 'o aluno'} ou veja o histórico.</CardDescription>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => { setSelectedRequest(null); setIsFormOpen(true); }} disabled={!student}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Solicitação
                        </Button>
                    </DialogTrigger>
                    {student && mockUserId && (
                        <TripRequestForm
                            request={selectedRequest || undefined}
                            studentId={student.id}
                            parentUserId={mockUserId}
                            onFormSubmit={handleFormSubmit}
                        />
                    )}
                </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Carregando...
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && sortedRequests && sortedRequests.length > 0 ? (
                  sortedRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{format(new Date(request.date), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                      <TableCell>{typeMap[request.type]}</TableCell>
                      <TableCell>{request.shift === 'manha' ? 'Manhã' : 'Tarde'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[request.status]} className="capitalize">{request.status}</Badge>
                      </TableCell>
                      <TableCell>{format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  !isLoading && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        Nenhuma solicitação de viagem encontrada.
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    