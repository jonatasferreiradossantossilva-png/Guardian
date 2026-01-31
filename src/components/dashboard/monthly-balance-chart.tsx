'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { format, subMonths, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const chartConfig = {
  receita: {
    label: 'Receita',
    color: 'hsl(var(--chart-2))',
  },
  despesa: {
    label: 'Despesa',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function MonthlyBalanceChart() {
  const { data: invoices, isLoading: invoicesLoading } = useMockCollection('invoices');
  const { data: expenses, isLoading: expensesLoading } = useMockCollection('expenses');
  const [chartData, setChartData] = useState<{ month: string; receita: number; despesa: number }[]>([]);
  
  const isLoading = invoicesLoading || expensesLoading;

  useEffect(() => {
    if (!invoices || !expenses) {
      setChartData([]);
      return;
    }

    const latestInvoiceMonth = invoices.reduce((latest, inv) => (inv.dueDate.substring(0, 7) > latest ? inv.dueDate.substring(0, 7) : latest), '0000-00');
    const latestExpenseMonth = expenses.reduce((latest, exp) => (exp.date.substring(0, 7) > latest ? exp.date.substring(0, 7) : latest), '0000-00');
    const latestMonthStr = latestInvoiceMonth > latestExpenseMonth ? latestInvoiceMonth : latestExpenseMonth;

    if (latestMonthStr === '0000-00') {
        setChartData([]);
        return;
    }
    const latestMonthDate = parse(latestMonthStr, 'yyyy-MM', new Date());

    const monthlyData = new Map<string, { receita: number; despesa: number }>();

    for (let i = 5; i >= 0; i--) {
      const month = subMonths(latestMonthDate, i);
      const monthKey = format(month, 'yyyy-MM');
      monthlyData.set(monthKey, { receita: 0, despesa: 0 });
    }

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const monthKey = invoice.dueDate.substring(0, 7);
        if (monthlyData.has(monthKey)) {
          const current = monthlyData.get(monthKey)!;
          current.receita += invoice.amount;
        }
      }
    });

    expenses.forEach(expense => {
      const monthKey = expense.date.substring(0, 7);
      if (monthlyData.has(monthKey)) {
        const current = monthlyData.get(monthKey)!;
        current.despesa += expense.amount;
      }
    });

    const data = Array.from(monthlyData.entries()).map(([month, values]) => ({
      month: format(new Date(`${month}-02`), "MMM", { locale: ptBR }),
      ...values,
    }));
    setChartData(data);

  }, [invoices, expenses]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Balanço Mensal</CardTitle>
                <CardDescription>Receita vs. Despesa dos últimos 6 meses.</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Balanço Mensal</CardTitle>
        <CardDescription>Receita vs. Despesa dos últimos 6 meses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[350px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
            />
            <YAxis
              tickFormatter={(value) => `R$ ${value / 1000}k`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="receita" fill="var(--color-receita)" radius={4} />
            <Bar dataKey="despesa" fill="var(--color-despesa)" radius={4} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
