'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, GraduationCap, Truck, FileText } from "lucide-react";
import { useMockCollection } from "@/hooks/use-mock-data";
import { getYear, getMonth } from 'date-fns';

export function OverviewCards() {
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: activeVehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles', [{ field: 'active', op: '==', value: true }]);
  const { data: allInvoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');

  const isLoading = areStudentsLoading || areVehiclesLoading || areInvoicesLoading;

  const financialStats = useMemo(() => {
    if (!allInvoices) return { monthlyRevenue: 0, monthlyReceivables: 0 };
    
    const today = new Date();
    const currentYear = getYear(today);
    const currentMonth = getMonth(today); // 0-indexed

    let monthlyRevenue = 0;
    let monthlyReceivables = 0;

    allInvoices.forEach(invoice => {
        // Dates in mock data are strings like 'YYYY-MM-DD'.
        const [year, month] = invoice.dueDate.split('-').map(Number);
        
        if (year === currentYear && (month - 1) === currentMonth) {
            if (invoice.status === 'paid') {
                monthlyRevenue += invoice.amount;
            }
            if (invoice.status === 'pending' || invoice.status === 'overdue' || invoice.status === 'pagamento_em_analise') {
                monthlyReceivables += invoice.amount;
            }
        }
    });

    return { monthlyRevenue, monthlyReceivables };

  }, [allInvoices]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const overviewStats = [
    {
      title: "Total de Alunos",
      value: isLoading ? "-" : students?.length.toString() ?? "0",
      icon: GraduationCap,
      changeText: "Total de alunos cadastrados"
    },
    {
      title: "Veículos em Operação",
      value: isLoading ? "-" : activeVehicles?.length.toString() ?? "0",
      icon: Truck,
      changeText: "Veículos com status 'Ativo'"
    },
    {
      title: "Receita do Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyRevenue),
      icon: DollarSign,
      changeText: "Total recebido no mês corrente"
    },
    {
      title: "A Receber no Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyReceivables),
      icon: FileText,
      changeText: "Faturas pendentes ou em análise"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewStats.map((stat, index) => (
        <Card key={index} className="border-secondary hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              {stat.changeText}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
