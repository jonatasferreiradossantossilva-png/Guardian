
'use client';

import { useState, useMemo, useEffect } from 'react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { useDataCollection } from '@/hooks/use-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { validateGeoapifyApi, type ValidateApiOutput } from '@/ai/flows/validate-api-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AutonomousShortcut } from '@/components/dashboard/autonomous-shortcut';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DashboardOverviewPage() {
  const { data: allInvoices } = useDataCollection('invoices', undefined);
  const { data: allExpenses } = useDataCollection('expenses', undefined);

  const [selectedYear, setSelectedYear] = useState<string>('latest');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);
  
  // API Validation State
  const [apiStatus, setApiStatus] = useState<ValidateApiOutput | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-validate on mount
  useEffect(() => {
    setIsClient(true);
    handleValidateApis();
  }, []);

  const handleValidateApis = async () => {
    setIsValidating(true);
    try {
      const result = await validateGeoapifyApi();
      setApiStatus(result);
    } catch (error) {
      console.error("Erro ao validar APIs:", error);
    } finally {
      setIsValidating(false);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (allInvoices || []).forEach(inv => {
      if (inv?.dueDate && typeof inv.dueDate === 'string' && inv.dueDate.length >= 4) {
        years.add(inv.dueDate.substring(0, 4));
      }
    });
    (allExpenses || []).forEach(exp => {
      if (exp?.date && typeof exp.date === 'string' && exp.date.length >= 4) {
        years.add(exp.date.substring(0, 4));
      }
    });
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allInvoices, allExpenses]);

  const effectiveYear = selectedYear === 'latest' ? (availableYears[0] || new Date().getFullYear().toString()) : selectedYear;

  const filters = { year: effectiveYear, month: selectedMonth };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Saúde financeira e operacional da sua frota.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="latest">Mais Recente</SelectItem>
                    {availableYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {monthNames.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                            {month}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <AutonomousShortcut />

      <OverviewCards filters={filters} />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <MonthlyRevenueChart />
        <InvoicesStatusChart filters={filters}/>
        <div className="lg:col-span-2">
            <ExpensesCategoryChart filters={filters} />
        </div>
      </div>
    </div>
  );
}
