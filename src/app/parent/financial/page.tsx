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

type Invoice = {
  id: string;
  studentId: string;
  parentUserId: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
};

const statusVariantMap: Record<Invoice['status'], 'secondary' | 'default' | 'destructive'> = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
};

const statusTextMap: Record<Invoice['status'], string> = {
  pending: 'Pendente',
  paid: 'Pago',
  overdue: 'Vencida',
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

  const handlePay = (invoiceId: string) => {
    updateDoc('invoices', invoiceId, { status: 'paid' });
    toast({
      title: 'Pagamento Simulado!',
      description: 'A fatura foi marcada como paga.',
    });
  };

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    return [...invoices].sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());
  }, [invoices]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <Button asChild variant="outline" size="icon">
                <Link href="/parent/tracking"><ArrowLeft /></Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Meu Financeiro</h1>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <DollarSign /> Histórico de Faturas
                </CardTitle>
                <CardDescription>Visualize seu histórico de pagamentos e faturas pendentes.</CardDescription>
            </CardHeader>
            <CardContent>
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
                        <TableCell>Mensalidade Transporte</TableCell>
                        <TableCell>{invoice.dueDate.split('T')[0].split('-').reverse().join('/')}</TableCell>
                        <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={statusVariantMap[invoice.status]}>
                            {statusTextMap[invoice.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {invoice.status === 'pending' && (
                            <Button size="sm" onClick={() => handlePay(invoice.id)}>Pagar</Button>
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
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
