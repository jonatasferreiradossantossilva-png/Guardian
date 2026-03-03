
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ArrowLeft, QrCode, CreditCard, Filter, User, Wallet, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PixPaymentModal } from '@/components/parent/financial/pix-payment-modal';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type Invoice = {
  id: string;
  studentId: string;
  parentUserId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'pagamento_em_analise';
};

const statusVariantMap: Record<Invoice['status'], 'secondary' | 'default' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  pagamento_em_analise: 'outline',
};

const statusTextMap: Record<Invoice['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencida',
  pagamento_em_analise: 'Em Análise',
};


export default function ParentFinancialPage() {
  const { toast } = useToast();
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<string | 'all'>('all');
  
  // Pix Payment State
  const [selectedInvoiceForPix, setSelectedInvoiceForPix] = useState<Invoice | null>(null);

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    
    // Phase 2: Read selected student context
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    if (lastSelectedId) setSelectedStudentId(lastSelectedId);
  }, []);

  const { data: parents } = useMockCollection('parents', mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined);
  const parent = useMemo(() => parents?.[0], [parents]);

  const { data: students } = useMockCollection('students', parent ? [{ field: 'parentId', op: '==', value: parent.id }] : undefined);
  const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s.name])), [students]);

  const { data: invoices, isLoading } = useMockCollection('invoices', mockUserId ? [{ field: 'parentUserId', op: '==', value: mockUserId }] : undefined);

  const filteredInvoices = useMemo(() => {
      if (!invoices) return [];
      if (selectedStudentId === 'all') return invoices;
      return invoices.filter(inv => inv.studentId === selectedStudentId);
  }, [invoices, selectedStudentId]);

  // Phase 4: Family Consolidated Summary
  const familySummary = useMemo(() => {
      if (!invoices) return { totalPending: 0, count: 0 };
      const pendingStatuses = ['pending', 'overdue', 'pagamento_em_analise'];
      const pending = invoices.filter(inv => pendingStatuses.includes(inv.status));
      return {
          totalPending: pending.reduce((sum, inv) => sum + inv.amount, 0),
          count: pending.length
      };
  }, [invoices]);

  const handleInformPayment = (invoiceId: string) => {
    updateDoc('invoices', invoiceId, { status: 'pagamento_em_analise' });
    toast({
      title: 'Pagamento Informado!',
      description: 'Seu pagamento foi enviado para análise e será confirmado pelo gestor.',
    });
  };

  const handlePixSuccess = () => {
    if (selectedInvoiceForPix) {
        updateDoc('invoices', selectedInvoiceForPix.id, { status: 'paid' });
        toast({
            title: 'Pagamento Confirmado!',
            description: 'A inteligência do banco confirmou o recebimento do seu Pix.',
        });
        setSelectedInvoiceForPix(null);
    }
  };

  const sortedInvoices = useMemo(() => {
    if (!filteredInvoices) return [];
    const statusOrder: Record<Invoice['status'], number> = {
        overdue: 1,
        pagamento_em_analise: 2,
        pending: 3,
        paid: 4,
    };
    return [...filteredInvoices].sort((a, b) => {
        const statusComparison = statusOrder[a.status] - statusOrder[b.status];
        if (statusComparison !== 0) return statusComparison;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    });
  }, [filteredInvoices]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-xl font-bold md:hidden">Financeiro</h1>
        </div>

        {/* Phase 4: Multi-child Consolidated View */}
        {students && students.length > 1 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card className="md:col-span-2 border-primary/20 bg-primary/5">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between h-full gap-4">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Filter className="h-4 w-4 text-primary" />
                            <span>Filtrar por Aluno:</span>
                        </div>
                        <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                            <SelectTrigger className="w-full sm:w-[240px] bg-background">
                                <SelectValue placeholder="Selecione um aluno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Filhos</SelectItem>
                                {students.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
                
                {selectedStudentId === 'all' && familySummary.totalPending > 0 && (
                    <Card className="border-amber-500/20 bg-amber-500/5">
                        <CardHeader className="p-4 pb-0">
                            <CardTitle className="text-xs font-bold text-amber-600 uppercase flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" /> Total da Família
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-1">
                            <p className="text-2xl font-black text-amber-600">
                                R$ {familySummary.totalPending.toFixed(2).replace('.', ',')}
                            </p>
                            <p className="text-[10px] text-muted-foreground">{familySummary.count} fatura(s) em aberto</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        )}

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign className="text-primary" /> Histórico de Faturas
                </CardTitle>
                <CardDescription>Visualize seu histórico de pagamentos e gere códigos Pix para faturas em aberto.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading && (
                        <TableRow><TableCell colSpan={6} className="h-24 text-center">Carregando...</TableCell></TableRow>
                    )}
                    {!isLoading && sortedInvoices && sortedInvoices.length > 0 ? (
                        sortedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
                            <TableCell className="font-medium">{studentsMap.get(invoice.studentId) || 'N/A'}</TableCell>
                            <TableCell>{invoice.description}</TableCell>
                            <TableCell>{invoice.dueDate.split('T')[0].split('-').reverse().join('/')}</TableCell>
                            <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                            <TableCell>
                            <Badge variant={statusVariantMap[invoice.status]} className={cn(invoice.status === 'pagamento_em_analise' && 'border-amber-500 text-amber-500')}>
                                {statusTextMap[invoice.status]}
                            </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleInformPayment(invoice.id)}>Anexar Comprovante</Button>
                                    <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => setSelectedInvoiceForPix(invoice)}>
                                        <QrCode className="mr-2 h-4 w-4" /> Pagar com Pix
                                    </Button>
                                </div>
                            )}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        !isLoading && (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center">Nenhuma fatura encontrada.</TableCell>
                        </TableRow>
                        )
                    )}
                    </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {isLoading && <p className="text-center text-muted-foreground">Carregando...</p>}
                {!isLoading && sortedInvoices && sortedInvoices.length > 0 ? (
                    sortedInvoices.map((invoice) => (
                        <Card key={invoice.id} className="p-4 border-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] uppercase font-bold text-primary">{studentsMap.get(invoice.studentId)}</p>
                                    <p className="font-medium pr-2">{invoice.description}</p>
                                </div>
                                <Badge variant={statusVariantMap[invoice.status]} className={cn('flex-shrink-0', invoice.status === 'pagamento_em_analise' && 'border-amber-500 text-amber-500')}>
                                    {statusTextMap[invoice.status]}
                                </Badge>
                            </div>
                            <div className="mt-4 grid grid-cols-2 gap-y-4 text-sm">
                                <div>
                                    <p className="text-xs text-muted-foreground">Vencimento</p>
                                    <p>{invoice.dueDate.split('T')[0].split('-').reverse().join('/')}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Valor</p>
                                    <p className="font-bold">R$ {invoice.amount.toFixed(2)}</p>
                                </div>
                            </div>
                            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                <div className="flex flex-col gap-2 mt-4">
                                    <Button onClick={() => setSelectedInvoiceForPix(invoice)} className="w-full h-12 text-base">
                                        <QrCode className="mr-2 h-5 w-5" /> Pagar via Pix (Agora)
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleInformPayment(invoice.id)} className="w-full">
                                        Já paguei / Anexar comprovante
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))
                ) : (
                    !isLoading && <p className="text-center text-muted-foreground py-10">Nenhuma fatura encontrada.</p>
                )}
              </div>
            </CardContent>
        </Card>
      </div>

      {selectedInvoiceForPix && (
          <PixPaymentModal 
            isOpen={!!selectedInvoiceForPix}
            onClose={() => setSelectedInvoiceForPix(null)}
            invoice={selectedInvoiceForPix}
            onPaymentSuccess={handlePixSuccess}
          />
      )}
    </div>
  );
}
