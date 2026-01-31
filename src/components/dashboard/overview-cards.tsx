'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, FileText } from "lucide-react";
import { useMockCollection } from "@/hooks/use-mock-data";

export function OverviewCards() {
  const { data: allInvoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
  const { data: allExpenses, isLoading: areExpensesLoading } = useMockCollection('expenses');

  const isLoading = areInvoicesLoading || areExpensesLoading;

  const financialStats = useMemo(() => {
    if (!allInvoices || !allExpenses) return { monthlyRevenue: 0, monthlyReceivables: 0, monthlyExpenses: 0, monthlyBalance: 0, displayMonth: 'N/A' };

    // Find the latest month string (e.g., "2024-08") from both invoices and expenses to define the "current" month.
    const latestInvoiceMonth = allInvoices.reduce((latest, inv) => (inv.dueDate.substring(0, 7) > latest ? inv.dueDate.substring(0, 7) : latest), '0000-00');
    const latestExpenseMonth = allExpenses.reduce((latest, exp) => (exp.date.substring(0, 7) > latest ? exp.date.substring(0, 7) : latest), '0000-00');
    
    const latestMonthStr = latestInvoiceMonth > latestExpenseMonth ? latestInvoiceMonth : latestExpenseMonth;

    if (latestMonthStr === '0000-00') return { monthlyRevenue: 0, monthlyReceivables: 0, monthlyExpenses: 0, monthlyBalance: 0, displayMonth: 'N/A' };
    
    let monthlyRevenue = 0;
    let monthlyReceivables = 0;
    let monthlyExpenses = 0;

    allInvoices.forEach(invoice => {
        if (invoice.dueDate.substring(0, 7) === latestMonthStr) {
            if (invoice.status === 'paid') {
                monthlyRevenue += invoice.amount;
            }
            if (invoice.status === 'pending' || invoice.status === 'overdue' || invoice.status === 'pagamento_em_analise') {
                monthlyReceivables += invoice.amount;
            }
        }
    });

    allExpenses.forEach(expense => {
        if (expense.date.substring(0, 7) === latestMonthStr) {
            monthlyExpenses += expense.amount;
        }
    });
    
    const monthlyBalance = monthlyRevenue - monthlyExpenses;
    
    const monthNames: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    
    const [year, monthNum] = latestMonthStr.split('-');
    const monthName = monthNames[monthNum] || '';
    const capitalizedDisplayMonth = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} de ${year}`;


    return { monthlyRevenue, monthlyReceivables, monthlyExpenses, monthlyBalance, displayMonth: capitalizedDisplayMonth };

  }, [allInvoices, allExpenses]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const overviewStats = [
    {
      title: "Receita do Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyRevenue),
      icon: DollarSign,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Total recebido em ${financialStats.displayMonth}`,
      href: "/dashboard/financial"
    },
    {
      title: "Despesas do Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyExpenses),
      icon: TrendingDown,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Total gasto em ${financialStats.displayMonth}`,
      href: "/dashboard/financial"
    },
    {
      title: "Balanço do Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyBalance),
      icon: financialStats.monthlyBalance >= 0 ? TrendingUp : TrendingDown,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Receitas - Despesas em ${financialStats.displayMonth}`,
      href: "/dashboard/financial",
      isBalance: true,
    },
    {
      title: "Contas a Receber",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyReceivables),
      icon: FileText,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Pendente ou em análise para ${financialStats.displayMonth}`,
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
