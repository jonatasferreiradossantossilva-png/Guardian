
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FilePlus, Loader2, Pencil, Filter, Users, Calendar, CheckCircle, Clock, AlertCircle, Wallet, Receipt, BellRing, AlertTriangle } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ExpenseForm } from '@/components/dashboard/financial/expense-form';
import { generateMonthlyInvoices } from '@/ai/flows/generate-monthly-invoices';
import { PaginationControls } from '@/components/ui/pagination-controls';

type Invoice = {
  id: string;
  studentId: string;
  parentUserId: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue' | 'pagamento_em_analise';
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Combustível' | 'Manutenção' | 'Salários' | 'Impostos' | 'Outros';
}

const ITEMS_PER_PAGE = 10;

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

export default function FinancialPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
                <h1 className="text-3xl font-bold tracking-tight">Gestão Financeira</h1>
            </div>
            <Tabs defaultValue="revenues" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="revenues">
                        <Wallet className="mr-2 h-4 w-4"/>
                        Receitas (Faturas)
                    </TabsTrigger>
                    <TabsTrigger value="expenses">
                        <Receipt className="mr-2 h-4 w-4"/>
                        Despesas
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="revenues" className="mt-6">
                    <RevenuesTab />
                </TabsContent>
                <TabsContent value="expenses" className="mt-6">
                    <ExpensesTab />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function RevenuesTab() {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isReminderAlertOpen, setIsReminderAlertOpen] = useState(false);
  const [reminders, setReminders] = useState<{ parentName: string; studentName: string }[]>([]);
  
  // Validation State for Invoice Generation
  const [isValidationAlertOpen, setIsValidationAlertOpen] = useState(false);
  const [studentsWithMissingFees, setStudentsWithMissingFees] = useState<{ name: string }[]>([]);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<Invoice['status'] | 'all'>('all');

  const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: parents, isLoading: areParentsLoading } = useMockCollection('parents');

  const studentsMap = useMemo(() => new Map(students?.map((s) => [s.id, s.name])), [students]);
  const parentUserToNameMap = useMemo(() => new Map(parents?.map(p => [p.userId, p.name])), [parents]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStudentId, selectedMonth, selectedStatus]);

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

  const finalFilteredList = useMemo(() => {
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

  const paginatedInvoices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return finalFilteredList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [finalFilteredList, currentPage]);

  const totalPages = Math.ceil(finalFilteredList.length / ITEMS_PER_PAGE);


  const handleStartInvoiceGeneration = () => {
    if (!students) return;

    // Validate students with missing fees
    const missing = students.filter(s => s.active !== false && (!s.monthlyFee || s.monthlyFee <= 0));
    if (missing.length > 0) {
        setStudentsWithMissingFees(missing);
        setIsValidationAlertOpen(true);
    } else {
        executeInvoiceGeneration();
    }
  };

  const executeInvoiceGeneration = async () => {
    if (!students || !parents || !invoices) {
      toast({ title: 'Dados não carregados', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setIsValidationAlertOpen(false);

    try {
      const activeStudents = students.filter(s => s.active !== false);
      const result = await generateMonthlyInvoices({ students: activeStudents, parents, invoices });
      const { invoicesToCreate } = result;

      if (invoicesToCreate.length > 0) {
        invoicesToCreate.forEach(invoiceData => {
          addDoc('invoices', invoiceData);
        });
        toast({
          title: 'Faturas Geradas!',
          description: `${invoicesToCreate.length} nova(s) fatura(s) criadas com base nos valores individuais de cada aluno.`
        });
      } else {
        toast({ title: 'Nenhuma fatura nova', description: 'Todos os alunos ativos já possuem faturas para este mês.' });
      }
    } catch (error) {
      console.error("Failed to generate invoices:", error);
      toast({ title: 'Erro ao gerar faturas', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
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
  
  const handleSendReminders = () => {
    if (!invoices || !studentsMap.size || !parentUserToNameMap.size) {
      toast({ title: 'Dados não carregados', variant: 'destructive'});
      return;
    }
  
    const invoicesToRemind = invoices.filter(inv => inv.status === 'pending' || inv.status === 'overdue');
  
    if (invoicesToRemind.length === 0) {
      toast({ title: 'Nenhuma pendência encontrada' });
      return;
    }
  
    const reminderDetails = invoicesToRemind.map(inv => ({
      parentName: parentUserToNameMap.get(inv.parentUserId) || 'Responsável desconhecido',
      studentName: studentsMap.get(inv.studentId) || 'Aluno desconhecido'
    }));

    setReminders(reminderDetails);
    setIsReminderAlertOpen(true);
  };
  
  const confirmSendReminders = () => {
    setIsReminderAlertOpen(false);
    toast({
        title: 'Simulação Concluída!',
        description: `${reminders.length} lembrete(s) de pagamento seriam enviados via WhatsApp.`,
    });
    setReminders([]);
  }

  const isLoading = areInvoicesLoading || areStudentsLoading || areParentsLoading;
  
  const statusCardsData: {title: string, value: number, count: number, icon: React.ElementType, status: Invoice['status']}[] = [
      { title: 'Pagas', value: summaryStats.paid.total, count: summaryStats.paid.count, icon: statusIconMap.paid, status: 'paid' },
      { title: 'Pendentes', value: summaryStats.pending.total, count: summaryStats.pending.count, icon: statusIconMap.pending, status: 'pending' },
      { title: 'Vencidas', value: summaryStats.overdue.total, count: summaryStats.overdue.count, icon: statusIconMap.overdue, status: 'overdue' },
      { title: 'Em Análise', value: summaryStats.pagamento_em_analise.total, count: summaryStats.pagamento_em_analise.count, icon: statusIconMap.pagamento_em_analise, status: 'pagamento_em_analise' },
  ];

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-end gap-2">
            <Button onClick={handleSendReminders} variant="outline" className="w-full sm:w-auto">
                <BellRing className="mr-2 h-4 w-4" />
                Enviar Lembretes de Pagamento
            </Button>
            <Button onClick={handleStartInvoiceGeneration} disabled={isGenerating} className="w-full sm:w-auto">
                {isGenerating ? <Loader2 className="mr-2 animate-spin" /> : <FilePlus className="mr-2 h-4 w-4" />}
                Gerar Faturas do Mês
            </Button>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Filtros e Resumo de Receitas</CardTitle>
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

        <Card>
            <CardHeader>
            <CardTitle>Histórico de Faturas</CardTitle>
            <CardDescription>Visualize, filtre e gerencie todas as faturas geradas para os alunos.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading && <div className="text-center p-8">Carregando faturas...</div>}
                {!isLoading && paginatedInvoices.length > 0 ? (
                    <>
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
                                {paginatedInvoices.map((invoice) => (
                                    <TableRow key={`invoice-${invoice.id}`}>
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
                                            {invoice.status === 'paid' ? (
                                                <Button asChild variant="outline" size="sm">
                                                    <Link href={`/dashboard/receipt/${invoice.id}`}>Ver Recibo</Link>
                                                </Button>
                                            ) : (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menu</span>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>Marcar como Paga</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pending')}>Marcar como Pendente</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pagamento_em_analise')}>Marcar como Pagto. em Análise</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'overdue')} className="text-red-600">Marcar como Vencida</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="md:hidden space-y-4">
                            {paginatedInvoices.map((invoice) => (
                                <Card key={`invoice-card-${invoice.id}`} className="p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-medium">{studentsMap.get(invoice.studentId) || 'Aluno removido'}</p>
                                            <p className="text-sm text-muted-foreground">{parentUserToNameMap.get(invoice.parentUserId) || 'Responsável não encontrado'}</p>
                                        </div>
                                        {invoice.status !== 'paid' && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0 -mt-1 -mr-2">
                                                        <span className="sr-only">Abrir menu</span>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Alterar Status</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'paid')}>Marcar como Paga</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pending')}>Marcar como Pendente</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'pagamento_em_analise')}>Marcar como Pagto. em Análise</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleStatusChange(invoice.id, 'overdue')} className="text-red-600">Marcar como Vencida</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
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
                                    {invoice.status === 'paid' && (
                                        <Button asChild variant="outline" size="sm" className="w-full mt-4">
                                            <Link href={`/dashboard/receipt/${invoice.id}`}>Ver Recibo</Link>
                                        </Button>
                                    )}
                                </Card>
                            ))}
                        </div>
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={finalFilteredList.length}
                            itemsPerPage={ITEMS_PER_PAGE}
                        />
                    </>
                ) : (
                    !isLoading && <div className="h-24 text-center content-center text-muted-foreground">Nenhuma fatura encontrada para os filtros selecionados.</div>
                )}
            </CardContent>
        </Card>

        {/* Reminders Alert Dialog */}
        <AlertDialog open={isReminderAlertOpen} onOpenChange={setIsReminderAlertOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Simular Envio de Lembretes?</AlertDialogTitle>
                  <AlertDialogDescription>
                      A ação a seguir enviaria uma notificação de lembrete para os {reminders.length} responsáveis a seguir:
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="relative max-h-40 overflow-y-auto pr-6 text-sm">
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      {reminders.map((r, i) => (
                          <li key={i}>
                              <b>{r.parentName}</b> (responsável por {r.studentName})
                          </li>
                      ))}
                  </ul>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmSendReminders}>Sim, Enviar Lembretes</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Validation Alert Dialog for Invoice Generation */}
        <AlertDialog open={isValidationAlertOpen} onOpenChange={setIsValidationAlertOpen}>
          <AlertDialogContent className="border-destructive/20">
              <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      Atenção: Alunos com valor Zerado
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                      Os {studentsWithMissingFees.length} alunos listados abaixo estão ativos mas não possuem um valor de mensalidade configurado. Se você prosseguir, as faturas para eles não serão geradas ou terão valor R$ 0,00.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="relative max-h-48 overflow-y-auto pr-2 bg-muted/20 rounded-md p-3">
                  <div className="grid grid-cols-1 gap-2">
                      {studentsWithMissingFees.map((s, i) => (
                          <div key={i} className="text-sm font-medium p-2 border rounded bg-background flex items-center justify-between">
                              {s.name}
                              <Badge variant="outline" className="text-[10px] text-destructive border-destructive/20">R$ 0,00</Badge>
                          </div>
                      ))}
                  </div>
              </div>
              <AlertDialogFooter className="mt-4 gap-2">
                  <AlertDialogCancel onClick={() => setIsValidationAlertOpen(false)}>Cancelar e Corrigir</AlertDialogCancel>
                  <AlertDialogAction onClick={executeInvoiceGeneration} className="bg-amber-600 hover:bg-amber-700">Prosseguir Assim Mesmo</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}

function ExpensesTab() {
  const { toast } = useToast();
  const { addDoc, updateDoc, deleteDoc } = useMockData();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const { data: expenses, isLoading } = useMockCollection('expenses');

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  const availableMonths = useMemo(() => {
    if (!expenses) return [];
    const months = new Set<string>();
    expenses.forEach(exp => {
        months.add(exp.date.substring(0, 7));
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  const filteredExpensesList = useMemo(() => {
    if (!expenses) return [];
    let filtered = expenses;
    if (selectedMonth !== 'all') {
        filtered = filtered.filter(exp => exp.date.substring(0, 7) === selectedMonth);
    }
    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth]);

  const totalSpent = useMemo(() => filteredExpensesList.reduce((acc, exp) => acc + exp.amount, 0), [filteredExpensesList]);

  const paginatedExpenses = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredExpensesList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredExpensesList, currentPage]);

  const totalPages = Math.ceil(filteredExpensesList.length / ITEMS_PER_PAGE);

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleDelete = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = () => {
    if (!selectedExpense) return;
    deleteDoc('expenses', selectedExpense.id);
    toast({ title: "Despesa deletada!", variant: "destructive" });
    setIsDeleteDialogOpen(false);
    setSelectedExpense(null);
  }

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    setSelectedExpense(null);
  };
  
  return (
    <div className="space-y-6">
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                <div className="flex justify-end">
                    <Button onClick={() => { setSelectedExpense(null); setIsFormOpen(true); }} className="w-full sm:w-auto">
                        <FilePlus className="mr-2" />
                        Lançar Nova Despesa
                    </Button>
                </div>
            </DialogTrigger>
            <ExpenseForm 
                expense={selectedExpense || undefined} 
                onFormSubmit={handleFormSubmit}
            />
        </Dialog>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="md:col-span-3">
                <CardHeader>
                    <CardTitle>Filtro de Despesas</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Gasto</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">R$ {totalSpent.toFixed(2).replace('.',',')}</div>
                    <p className="text-xs text-muted-foreground">{filteredExpensesList.length} lançamento(s)</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Histórico de Despesas</CardTitle>
                <CardDescription>Visualize e gerencie todos os custos lançados.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading && <div className="text-center p-8">Carregando despesas...</div>}
                    {!isLoading && paginatedExpenses.length > 0 ? (
                        <>
                            <div className="hidden md:block">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Data</TableHead>
                                            <TableHead>Descrição</TableHead>
                                            <TableHead>Categoria</TableHead>
                                            <TableHead>Valor</TableHead>
                                            <TableHead className="text-right">Ações</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {paginatedExpenses.map((expense) => (
                                        <TableRow key={expense.id}>
                                            <TableCell>{expense.date.split('-').reverse().join('/')}</TableCell>
                                            <TableCell className="font-medium">{expense.description}</TableCell>
                                            <TableCell><Badge variant="outline">{expense.category}</Badge></TableCell>
                                            <TableCell>R$ {expense.amount.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Abrir menu</span><Pencil className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                        <DropdownMenuItem onClick={() => handleEdit(expense)}>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(expense)}>Deletar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div className="md:hidden space-y-4">
                                {paginatedExpenses.map((expense) => (
                                    <Card key={expense.id} className="p-4">
                                        <div className="flex justify-between items-start">
                                            <p className="font-medium pr-4">{expense.description}</p>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 -mt-1 -mr-2 flex-shrink-0"><span className="sr-only">Abrir menu</span><Pencil className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => handleEdit(expense)}>Editar</DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(expense)}>Deletar</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                        <div className="mt-2 grid grid-cols-3 gap-y-2 gap-x-2 text-sm">
                                            <div><p className="text-xs text-muted-foreground">Data</p><p>{expense.date.split('-').reverse().join('/')}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Valor</p><p>R$ {expense.amount.toFixed(2)}</p></div>
                                            <div><p className="text-xs text-muted-foreground">Categoria</p><Badge variant="outline" className="mt-1">{expense.category}</Badge></div>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredExpensesList.length}
                                itemsPerPage={ITEMS_PER_PAGE}
                            />
                        </>
                    ) : (
                         !isLoading && <div className="h-24 text-center content-center text-muted-foreground">Nenhuma despesa encontrada.</div>
                    )}
            </CardContent>
        </Card>
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>Esta ação não pode ser desfeita. Deletar permanentemente a despesa: <span className="font-bold">{selectedExpense?.description}</span>.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedExpense(null)}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
