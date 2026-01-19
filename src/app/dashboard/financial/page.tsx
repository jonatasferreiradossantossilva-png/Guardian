'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, MoreHorizontal, Filter, Users, Calendar } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { format, startOfMonth, endOfMonth, set } from 'date-fns';
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
  pagamento_em_analise: 'Pagto. em Análise',
};

export default function FinancialPage() {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isGenerating, setIsGenerating] = useState(false);

  // State for filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');

  const studentsMap = useMemo(() => new Map(students?.map((s) => [s.id, s.name])), [students]);
  const parentUserToNameMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  const availableMonths = useMemo(() => {
    if (!invoices) return [];
    const months = new Set<string>();
    invoices.forEach(inv => {
        months.add(inv.dueDate.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);
  
  const filteredAndGroupedInvoices = useMemo(() => {
    if (!invoices) return {};

    // 1. Filter
    let filtered = invoices;
    if (selectedStudentId !== 'all') {
        filtered = filtered.filter(inv => inv.studentId === selectedStudentId);
    }
    if (selectedMonth !== 'all') {
        filtered = filtered.filter(inv => inv.dueDate.substring(0, 7) === selectedMonth);
    }

    // 2. Sort within groups
    const statusOrder: Record<Invoice['status'], number> = {
      pagamento_em_analise: 1,
      pending: 2,
      overdue: 3,
      paid: 4,
    };
    const sorted = [...filtered].sort((a, b) => {
      const statusComparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
      if (statusComparison !== 0) return statusComparison;
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });

    // 3. Group by month
    const grouped = sorted.reduce((acc, inv) => {
        const month = inv.dueDate.substring(0, 7);
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(inv);
        return acc;
    }, {});

    return grouped;

  }, [invoices, selectedStudentId, selectedMonth]);

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
                   inv.description === "Mensalidade Transporte" &&
                   dueDate >= currentMonthStart && 
                   dueDate <= endOfMonth(currentMonthStart);
        });

        if (!hasInvoiceThisMonth) {
            const dueDate = set(currentMonthStart, { date: 10 });
            const studentFee = student.monthlyFee || 450.00; // Use individual fee or fallback
            addDoc('invoices', {
                studentId: student.id,
                parentUserId: parentUserId,
                description: "Mensalidade Transporte",
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
  const monthKeys = Object.keys(filteredAndGroupedInvoices).sort().reverse();
  
  const formatMonth = (monthStr: string) => {
      const monthNames: Record<string, string> = {
        '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
        '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
        '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
      };
      const [year, monthNum] = monthStr.split('-');
      const monthName = monthNames[monthNum] || '';
      return `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} de ${year}`;
  }

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
          <CardDescription>Visualize, filtre e gerencie todas as faturas geradas para os alunos.</CardDescription>
          <div className="flex items-center gap-4 pt-4">
            <Filter className="text-muted-foreground" />
             <div className="flex items-center gap-2">
                <Users className="text-muted-foreground h-4 w-4"/>
                <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por aluno..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Alunos</SelectItem>
                        {students?.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="flex items-center gap-2">
                <Calendar className="text-muted-foreground h-4 w-4"/>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Filtrar por mês..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Meses</SelectItem>
                        {availableMonths.map(month => (
                            <SelectItem key={month} value={month}>{formatMonth(month)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
            {isLoading && <div className="text-center p-8">Carregando faturas...</div>}
            {!isLoading && monthKeys.length > 0 ? (
                 <Accordion type="multiple" defaultValue={monthKeys} className="w-full">
                    {monthKeys.map(monthKey => {
                        const monthInvoices = filteredAndGroupedInvoices[monthKey];
                        const totalAmount = monthInvoices.reduce((sum, inv) => sum + inv.amount, 0);
                        const totalPaid = monthInvoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

                        return (
                            <AccordionItem value={monthKey} key={monthKey}>
                                <AccordionTrigger className="capitalize text-lg hover:no-underline px-2">
                                    <div className="flex items-center justify-between w-full">
                                        <span>{formatMonth(monthKey)}</span>
                                        <div className="flex items-center gap-4 text-sm font-normal text-muted-foreground pr-4">
                                            <span>Total: <span className="font-semibold text-foreground">R$ {totalAmount.toFixed(2)}</span></span>
                                            <span>Recebido: <span className="font-semibold text-green-500">R$ {totalPaid.toFixed(2)}</span></span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                        <TableRow>
                                            <TableHead>Aluno</TableHead>
                                            <TableHead>Responsável</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Vencimento</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                        {monthInvoices.map((invoice) => (
                                            <TableRow key={invoice.id}>
                                                <TableCell className="font-medium">{studentsMap.get(invoice.studentId) || 'Aluno removido'}</TableCell>
                                                <TableCell>{parentUserToNameMap.get(invoice.parentUserId) || 'Responsável não encontrado'}</TableCell>
                                                <TableCell>{invoice.description}</TableCell>
                                                <TableCell>{invoice.dueDate.split('-').reverse().join('/')}</TableCell>
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
                                        ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                 </Accordion>
            ) : (
                 !isLoading && <div className="h-24 text-center content-center text-muted-foreground">Nenhuma fatura encontrada para os filtros selecionados.</div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
