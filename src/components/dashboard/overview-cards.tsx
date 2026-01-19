'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, GraduationCap, Truck, FileText } from "lucide-react";
import { useMockCollection } from "@/hooks/use-mock-data";

export function OverviewCards() {
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: activeVehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles', [{ field: 'active', op: '==', value: true }]);
  const { data: allInvoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');

  const isLoading = areStudentsLoading || areVehiclesLoading || areInvoicesLoading;

  const financialStats = useMemo(() => {
    if (!allInvoices || allInvoices.length === 0) return { monthlyRevenue: 0, monthlyReceivables: 0, displayMonth: 'N/A' };

    // Find the latest month string (e.g., "2024-08") from the data
    const latestMonthStr = allInvoices.reduce((latest, inv) => {
        const invMonth = inv.dueDate.substring(0, 7);
        return invMonth > latest ? invMonth : latest;
    }, '0000-00');

    if (latestMonthStr === '0000-00') return { monthlyRevenue: 0, monthlyReceivables: 0, displayMonth: 'N/A' };
    
    let monthlyRevenue = 0;
    let monthlyReceivables = 0;

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
    
    const monthNames: Record<string, string> = {
      '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
      '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
      '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro'
    };
    
    const [year, monthNum] = latestMonthStr.split('-');
    const monthName = monthNames[monthNum] || '';
    const capitalizedDisplayMonth = `${monthName.charAt(0).toUpperCase()}${monthName.slice(1)} de ${year}`;


    return { monthlyRevenue, monthlyReceivables, displayMonth: capitalizedDisplayMonth };

  }, [allInvoices]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  const overviewStats = [
    {
      title: "Total de Alunos",
      value: isLoading ? "-" : students?.length.toString() ?? "0",
      icon: GraduationCap,
      changeText: "Total de alunos cadastrados",
      href: "/dashboard/management/students"
    },
    {
      title: "Veículos em Operação",
      value: isLoading ? "-" : activeVehicles?.length.toString() ?? "0",
      icon: Truck,
      changeText: "Veículos com status 'Ativo'",
      href: "/dashboard/management/vehicles"
    },
    {
      title: "Receita do Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyRevenue),
      icon: DollarSign,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Total recebido em ${financialStats.displayMonth}`,
      href: "/dashboard/financial"
    },
    {
      title: "A Receber no Mês",
      value: isLoading ? "-" : formatCurrency(financialStats.monthlyReceivables),
      icon: FileText,
      changeText: isLoading || financialStats.displayMonth === 'N/A' ? "Calculando..." : `Pendente ou em análise para ${financialStats.displayMonth}`,
      href: "/dashboard/financial"
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {overviewStats.map((stat, index) => (
        <Link href={stat.href} key={index} className="flex">
            <Card className="w-full border-secondary hover:bg-secondary/50 transition-colors">
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
        </Link>
      ))}
    </div>
  );
}
