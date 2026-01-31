'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useMockCollection } from "@/hooks/use-mock-data";

interface OverviewCardsProps {
    filters: {
        year: string;
        month: string;
    }
}

export function OverviewCards({ filters }: OverviewCardsProps) {
  const { data: allInvoices, isLoading: areInvoicesLoading } = useMockCollection('invoices', undefined);
  const { data: allExpenses, isLoading: areExpensesLoading } = useMockCollection('expenses', undefined);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isLoading = areInvoicesLoading || areExpensesLoading;

  const financialStats = useMemo(() => {
    if (!allInvoices || !allExpenses) return { monthlyRevenue: 0, monthlyReceivables: 0, monthlyExpenses: 0, monthlyBalance: 0, displayPeriod: 'N/A' };

    const { year, month } = filters;
    const isYearlyView = month === 'all';
    
    let filteredInvoices = allInvoices.filter(inv => inv.dueDate.startsWith(year));
    let filteredExpenses = allExpenses.filter(exp => exp.date.startsWith(year));
    
    if (!isYearlyView) {
        const monthStr = `${year}-${month}`;
        filteredInvoices = filteredInvoices.filter(inv => inv.dueDate.startsWith(monthStr));
        filteredExpenses = filteredExpenses.filter(exp => exp.date.startsWith(monthStr));
    }
    
    const monthlyRevenue = filteredInvoices.filter(inv => inv.status === 'paid').reduce((acc, inv) => acc + inv.amount, 0);
    const monthlyReceivables = filteredInvoices.filter(inv => ['pending', 'overdue', 'pagamento_em_analise'].includes(inv.status)).reduce((acc, inv) => acc + inv.amount, 0);
    const monthlyExpenses = filteredExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const monthlyBalance = monthlyRevenue - monthlyExpenses;

    let displayPeriod = `Ano de ${year}`;
    if (!isYearlyView) {
        const monthNames: Record<string, string> = {
            '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
            '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
            '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
        };
        displayPeriod = `${monthNames[month]} de ${year}`;
    }

    return { monthlyRevenue, monthlyReceivables, monthlyExpenses, monthlyBalance, displayPeriod };

  }, [allInvoices, allExpenses, filters]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const overviewStats = [
    {
      title: "Receita",
      value: isLoading || !isClient ? "..." : formatCurrency(financialStats.monthlyRevenue),
      changeText: isLoading || !isClient ? "Calculando..." : `Total recebido em ${financialStats.displayPeriod}`,
      icon: DollarSign,
      href: "/dashboard/financial"
    },
    {
      title: "Despesas",
      value: isLoading || !isClient ? "..." : formatCurrency(financialStats.monthlyExpenses),
      changeText: isLoading || !isClient ? "Calculando..." : `Total gasto em ${financialStats.displayPeriod}`,
      icon: TrendingDown,
      href: "/dashboard/financial"
    },
    {
      title: "Balanço",
      value: isLoading || !isClient ? "..." : formatCurrency(financialStats.monthlyBalance),
      changeText: isLoading || !isClient ? "Calculando..." : `Receitas - Despesas em ${financialStats.displayPeriod}`,
      icon: financialStats.monthlyBalance >= 0 ? TrendingUp : TrendingDown,
      href: "/dashboard/financial",
      isBalance: true,
    },
    {
      title: "Contas a Receber",
      value: isLoading || !isClient ? "..." : formatCurrency(financialStats.monthlyReceivables),
      changeText: isLoading || !isClient ? "Calculando..." : `Pendente ou em análise para ${financialStats.displayPeriod}`,
      icon: FileText,
      href: "/dashboard/financial"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewStats.map((stat, index) => {
          const balanceColor = stat.isBalance ? (financialStats.monthlyBalance >= 0 ? 'text-green-500' : 'text-red-500') : 'text-primary';
          return (
            <Link href={stat.href} key={index} className="flex">
                <Card className="w-full border-secondary hover:bg-secondary/50 transition-colors">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                    </CardTitle>
                    <stat.icon className={`h-5 w-5 ${balanceColor}`} />
                </CardHeader>
                <CardContent>
                    <div className={`text-3xl font-bold ${balanceColor}`}>{stat.value}</div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                    {stat.changeText}
                    </p>
                </CardContent>
                </Card>
            </Link>
        )
      })}
    </div>
  );
}
