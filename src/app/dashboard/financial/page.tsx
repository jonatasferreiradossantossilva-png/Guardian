'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, MoreHorizontal, Filter, Users, Calendar, CheckCircle, Clock, AlertCircle, Wallet } from 'lucide-react';
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
  paid: 'Paga',
  overdue: 'Vencida',
  pagamento_em_analise: 'Pagto. em Análise',
};

const statusIconMap: Record<Invoice['status'], React.ElementType> = {
  paid: CheckCircle,
  pending: Clock,
  overdue: AlertCircle,
  pagamento_em_analise: Wallet,
};

const StatCard = ({ title, value, count, icon: Icon, status, selectedStatus, onSelect }: { title: string, value: number, count: number, icon: React.ElementType, status: Invoice['status'], selectedStatus: Invoice['status'] | 'all', onSelect: (status: Invoice['status']) => void }) => (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:bg-secondary/50",
        selectedStatus === status && 'ring-2 ring-primary shadow-lg',
      )}
      onClick={() => onSelect(status)}
    >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className={cn("h-4 w-4 text-muted-foreground", 
                status === 'paid' && 'text-green-500',
                status === 'overdue' && 'text-red-500',
                status === 'pending' && 'text-yellow-500',
                status === 'pagamento_em_analise' && 'text-blue-500',
            )} />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">R$ {value.toFixed(2).replace('.',',')}</div>
            <p className="text-xs text-muted-foreground">{count} fatura(s)</p>
        </CardContent>
    </Card>
);


export default function FinancialPage() {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isGenerating, setIsGenerating] = useState(false);

  // State for filters
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<Invoice['status'] | 'all'>('all');
  const listRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);


  const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');

  const studentsMap = useMemo(() => new Map(students?.map((s) => [s.id, s.name])), [students]);
  const parentUserToNameMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
    } else {
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedStatus]);

  const availableMonths = useMemo(() => {
    if (!invoices) return [];
    const months = new Set<string>();
    invoices.forEach(inv => {
        months.add(inv.dueDate.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [invoices]);
  
  const filteredInvoicesForSummary = useMemo(() => {
    if (!invoices) return [];
    let filtered = invoices;
    if (selectedStudentId !== 'all') {
        filtered = filtered.filter(inv => inv.studentId === selectedStudentId);
    }
    if (selectedMonth !== 'all') {
        filtered = filtered.filter(inv => inv.dueDate.substring(0, 7) === selectedMonth);
    }
    return filtered;
  }, [invoices, selectedStudentId, selectedMonth]);

  const summaryStats = useMemo(() => {
      const initialStats = {
          paid: { total: 0, count: 0 },
          pending: { total: 0, count: 0 },
          overdue: { total: 0, count: 0 },
          pagamento_em_analise: { total: 0, count: 0 },
          total: { total: 0, count: 0 },
      };

      if (!filteredInvoicesForSummary) return initialStats;
      
      return filteredInvoicesForSummary.reduce((acc, inv) => {
          if (acc[inv.status]) {
            acc[inv.status].total += inv.amount;
            acc[inv.status].count += 1;
          }
          acc.total.total += inv.amount;
          acc.total.count += 1;
          return acc;
      }, JSON.parse(JSON.stringify(initialStats)));
  }, [filteredInvoicesForSummary]);

  const finalInvoiceList = useMemo(() => {
      let list = filteredInvoicesForSummary || [];
      if (selectedStatus !== 'all') {
        list = list.filter(inv => inv.status === selectedStatus);
      }
      
      const statusOrder: Record<Invoice['status'], number> = {
        overdue: 1,
        pagamento_em_analise: 2,
        pending: 3,
        paid: 4,
      };
      
      return [...list].sort((a, b) => {
        const statusComparison = (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
        if (statusComparison !== 0) return statusComparison;
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
      });
  }, [filteredInvoicesForSummary, selectedStatus]);


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

  const handleSelectStatus = (status: Invoice['status']) => {
      setSelectedStatus(prev => prev === status ? 'all' : status);
  }

  const isLoading = areInvoicesLoading || areStudentsLoading || areParentsLoading;
  
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

  const statusCardsData: {title: string, value: number, count: number, icon: React.ElementType, status: Invoice['status']}[] = [
      { title: 'Pagas', value: summaryStats.paid.total, count: summaryStats.paid.count, icon: statusIconMap.paid, status: 'paid' },
      { title: 'Pendentes', value: summaryStats.pending.total, count: summaryStats.pending.count, icon: statusIconMap.pending, status: 'pending' },
      { title: 'Vencidas', value: summaryStats.overdue.total, count: summaryStats.overdue.count, icon: statusIconMap.overdue, status: 'overdue' },
      { title: 'Em Análise', value: summaryStats.pagamento_em_analise.total, count: summaryStats.pagamento_em_analise.count, icon: statusIconMap.pagamento_em_analise, status: 'pagamento_em_analise' },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
        <Button onClick={handleGenerateInvoices} disabled={isGenerating} className="w-full sm:w-auto">
          {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <FilePlus className="mr-2" />}
          Gerar Faturas do Mês
        </Button>
      </div>

       <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Filtros e Resumo</CardTitle>
                    <CardDescription>Filtre por mês ou aluno e veja um resumo dos status das faturas.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Filter className="text-muted-foreground hidden sm:block" />
                        <div className="flex items-center gap-2">
                            <Calendar className="text-muted-foreground h-4 w-4"/>
                            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                <SelectTrigger className="w-full sm:w-[200px]">
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
                        <div className="flex items-center gap-2">
                            <Users className="text-muted-foreground h-4 w-4"/>
                            <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                                <SelectTrigger className="w-full sm:w-[200px]">
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
                    </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {statusCardsData.map(stat => (
                            <StatCard 
                                key={stat.status}
                                {...stat}
                                selectedStatus={selectedStatus}
                                onSelect={handleSelectStatus}
                            />
                        ))}
                        <Card 
                            className={cn(
                                "cursor-pointer transition-all hover:bg-secondary/50",
                                selectedStatus === 'all' && 'ring-2 ring-primary shadow-lg',
                            )}
                            onClick={() => setSelectedStatus('all')}
                            >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
                                <Wallet className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">R$ {summaryStats.total.total.toFixed(2).replace('.',',')}</div>
                                <p className="text-xs text-muted-foreground">{summaryStats.total.count} fatura(s)</p>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>

            <Card ref={listRef}>
                <CardHeader>
                <CardTitle>Histórico de Faturas</CardTitle>
                <CardDescription>Visualize, filtre e gerencie todas as faturas geradas para os alunos.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading && <div className="text-center p-8">Carregando faturas...</div>}
                    {!isLoading && finalInvoiceList.length > 0 ? (
                        <>
                            {/* Desktop Table */}
                            <div className="hidden md:block">
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
                                    {finalInvoiceList.map((invoice) => (
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
                            </div>
                            {/* Mobile Cards */}
                            <div className="md:hidden space-y-4">
                                {finalInvoiceList.map((invoice) => (
                                    <Card key={invoice.id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-medium">{studentsMap.get(invoice.studentId) || 'Aluno removido'}</p>
                                                <p className="text-sm text-muted-foreground">{parentUserToNameMap.get(invoice.parentUserId) || 'Responsável não encontrado'}</p>
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 -mt-1 -mr-2">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>Marcar como Paga</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pending')}>Marcar como Pendente</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'overdue')} className="text-red-600">Marcar como Vencida</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-4 grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground">Descrição</p>
                                                <p>{invoice.description}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Vencimento</p>
                                                <p>{invoice.dueDate.split('-').reverse().join('/')}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground">Valor</p>
                                                <p>R$ {invoice.amount.toFixed(2)}</p>
                                            </div>
                                            <div className="col-span-2">
                                                <p className="text-xs text-muted-foreground">Status</p>
                                                <Badge variant={statusVariantMap[invoice.status]} className={cn('mt-1', invoice.status === 'pagamento_em_analise' && 'border-amber-500 text-amber-500')}>
                                                    {statusTextMap[invoice.status]}
                                                </Badge>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </>
                    ) : (
                        !isLoading && <div className="h-24 text-center content-center text-muted-foreground">Nenhuma fatura encontrada para os filtros selecionados.</div>
                    )}
                </CardContent>
            </Card>
       </div>
    </div>
  );
}
