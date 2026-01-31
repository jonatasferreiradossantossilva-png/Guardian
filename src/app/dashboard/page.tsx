'use client';

import { useState, useMemo } from 'react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { MonthlyBalanceChart } from "@/components/dashboard/monthly-balance-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];


export default function DashboardPage() {
  const { data: allInvoices } = useMockCollection('invoices', undefined);
  const { data: allExpenses } = useMockCollection('expenses', undefined);

  const [selectedYear, setSelectedYear] = useState<string>('latest');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (allInvoices || []).forEach(inv => years.add(inv.dueDate.substring(0, 4)));
    (allExpenses || []).forEach(exp => years.add(exp.date.substring(0, 4)));
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allInvoices, allExpenses]);

  // Handle 'latest' year logic
  const effectiveYear = selectedYear === 'latest' ? (availableYears[0] || new Date().getFullYear().toString()) : selectedYear;

  const filters = { year: effectiveYear, month: selectedMonth };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral da saúde financeira da sua operação.</p>
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

      <OverviewCards filters={filters} />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyBalanceChart />
        </div>
        <div className="lg:col-span-1">
          <ExpensesCategoryChart filters={filters}/>
        </div>
      </div>
    </div>
  );
}
