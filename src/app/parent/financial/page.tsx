'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ArrowLeft } from "lucide-react";
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

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
  }, []);

  const { data: invoices, isLoading } = useMockCollection('invoices', mockUserId ? [{ field: 'parentUserId', op: '==', value: mockUserId }] : undefined);

  const handleInformPayment = (invoiceId: string) => {
    updateDoc('invoices', invoiceId, { status: 'pagamento_em_analise' });
    toast({
      title: 'Pagamento Informado!',
      description: 'Seu pagamento foi enviado para análise e será confirmado pelo gestor.',
    });
  };

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    const statusOrder: Record<Invoice['status'], number> = {
        overdue: 1,
        pagamento_em_analise: 2,
        pending: 3,
        paid: 4,
    };
    return [...invoices].sort((a, b) => {
        const statusComparison = statusOrder[a.status] - statusOrder[b.status];
        if (statusComparison !== 0) return statusComparison;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()
    });
  }, [invoices]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign /> Histórico de Faturas
                </CardTitle>
                <CardDescription>Visualize seu histórico de pagamentos e faturas pendentes.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {isLoading && (
                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Carregando...</TableCell></TableRow>
                    )}
                    {!isLoading && sortedInvoices && sortedInvoices.length > 0 ? (
                        sortedInvoices.map((invoice) => (
                        <TableRow key={invoice.id}>
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
                                <Button size="sm" onClick={() => handleInformPayment(invoice.id)}>Informar Pagamento</Button>
                            )}
                            </TableCell>
                        </TableRow>
                        ))
                    ) : (
                        !isLoading && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">Nenhuma fatura encontrada.</TableCell>
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
                        <Card key={invoice.id} className="p-4">
                            <div className="flex justify-between items-start">
                                <p className="font-medium pr-2">{invoice.description}</p>
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
                                    <p>R$ {invoice.amount.toFixed(2)}</p>
                                </div>
                            </div>
                            {(invoice.status === 'pending' || invoice.status === 'overdue') && (
                                <Button size="sm" onClick={() => handleInformPayment(invoice.id)} className="w-full mt-4">
                                    Informar Pagamento
                                </Button>
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
    </div>
  );
}
