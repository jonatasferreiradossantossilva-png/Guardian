'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, ArrowLeft, QrCode, CreditCard } from "lucide-react";
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
  
  // Pix Payment State
  const [selectedInvoiceForPix, setSelectedInvoiceForPix] = useState<Invoice | null>(null);

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
            <h1 className="text-xl font-bold md:hidden">Financeiro</h1>
        </div>
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
                        <Card key={invoice.id} className="p-4 border-2">
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
