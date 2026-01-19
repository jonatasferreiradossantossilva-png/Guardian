'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, MoreHorizontal } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, startOfMonth, endOfMonth, set } from 'date-fns';
import { cn } from '@/lib/utils';

type Invoice = {
  id: string;
  studentId: string;
  parentUserId: string;
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
  pagamento_em_analise: 'Pagto. em Análise',
};

export default function FinancialPage() {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');

  const studentsMap = useMemo(() => new Map(students?.map((s) => [s.id, s.name])), [students]);
  const parentsMap = useMemo(() => {
    if (!parents || !students) return new Map();
    const studentToParentMap = new Map(students.map(s => [s.id, s.parentId]));
    const parentIdToNameMap = new Map(parents.map(p => [p.id, p.name]));
    const finalMap = new Map();
    for (const student of students) {
        const parentId = studentToParentMap.get(student.id);
        const parentName = parentIdToNameMap.get(parentId);
        if (parentName) {
            finalMap.set(student.id, parentName);
        }
    }
    return finalMap;
  }, [parents, students]);

  const sortedInvoices = useMemo(() => {
    if (!invoices) return [];
    const statusOrder: Record<Invoice['status'], number> = {
      pagamento_em_analise: 1,
      pending: 2,
      overdue: 3,
      paid: 4,
    };
    return [...invoices].sort((a, b) => {
      const statusComparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusComparison !== 0) {
        return statusComparison;
      }
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });
  }, [invoices]);

  const handleGenerateInvoices = () => {
    if (!students || !parents) {
      toast({ title: 'Dados não carregados', description: 'Aguarde os dados de alunos e pais carregarem.', variant: 'destructive'});
      return;
    }

    setIsGenerating(true);
    const today = new Date();
    const currentMonthStart = startOfMonth(today);
    
    let generatedCount = 0;

    const studentParentMap = new Map(students.map(s => [s.id, s.parentId]));
    const parentUserMap = new Map(parents.map(p => [p.id, p.userId]));

    students.forEach(student => {
        const parentId = studentParentMap.get(student.id);
        const parentUserId = parentId ? parentUserMap.get(parentId) : null;

        if (!parentUserId) {
            console.warn(`Responsável não encontrado para o aluno ${student.name}`);
            return;
        }

        const hasInvoiceThisMonth = (invoices || []).some(inv => {
            const dueDate = new Date(inv.dueDate);
            return inv.studentId === student.id && 
                   dueDate >= currentMonthStart && 
                   dueDate <= endOfMonth(currentMonthStart);
        });

        if (!hasInvoiceThisMonth) {
            const dueDate = set(currentMonthStart, { date: 10 });
            const studentFee = student.monthlyFee || 450.00; // Use individual fee or fallback
            addDoc('invoices', {
                studentId: student.id,
                parentUserId: parentUserId,
                amount: studentFee,
                dueDate: format(dueDate, 'yyyy-MM-dd'),
                status: 'pending'
            });
            generatedCount++;
        }
    });

    setIsGenerating(false);

    if (generatedCount > 0) {
        toast({
            title: 'Faturas Geradas!',
            description: `${generatedCount} nova(s) fatura(s) foram geradas para este mês.`
        });
    } else {
        toast({
            title: 'Nenhuma fatura nova',
            description: 'Todos os alunos já possuem faturas para o mês corrente.'
        });
    }
  };
  
  const handleStatusChange = (invoiceId: string, newStatus: Invoice['status']) => {
    updateDoc('invoices', invoiceId, { status: newStatus });
    toast({
      title: 'Status da Fatura Atualizado!',
      description: `A fatura foi marcada como ${statusTextMap[newStatus]}.`,
    });
  };

  const isLoading = areInvoicesLoading || areStudentsLoading || areParentsLoading;


  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <Button onClick={handleGenerateInvoices} disabled={isGenerating}>
          {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <FilePlus className="mr-2" />}
          Gerar Faturas do Mês
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Visualize e gerencie todas as faturas geradas para os alunos.</CardDescription>
        </CardHeader>
        <CardContent>
           <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24">Carregando...</TableCell>
                </TableRow>
              )}
              {!isLoading && sortedInvoices && sortedInvoices.length > 0 ? (
                sortedInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{studentsMap.get(invoice.studentId) || 'Aluno removido'}</TableCell>
                    <TableCell>{parentsMap.get(invoice.studentId) || 'Responsável não encontrado'}</TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</TableCell>
                    <TableCell>R$ {invoice.amount.toFixed(2)}</TableCell>
                    <TableCell>
                        <Badge variant={statusVariantMap[invoice.status]} className={cn(invoice.status === 'pagamento_em_analise' && 'border-amber-500 text-amber-500')}>
                            {statusTextMap[invoice.status]}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Abrir menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>
                                    Marcar como Paga
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pending')}>
                                    Marcar como Pendente
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'overdue')} className="text-red-600">
                                    Marcar como Vencida
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                !isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Nenhuma fatura encontrada. Gere as faturas do mês para começar.</TableCell>
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

    