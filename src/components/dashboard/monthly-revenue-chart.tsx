'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Loader2 } from 'lucide-react';

const chartConfig = {
  receita: {
    label: 'Receita',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;

export function MonthlyRevenueChart() {
  const { data: invoices, isLoading } = useMockCollection('invoices');

  const chartData = useMemo(() => {
    if (!invoices) return [];

    const monthlyRevenue = new Map<string, number>();
    const now = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const month = subMonths(now, i);
      const monthKey = format(month, 'yyyy-MM');
      monthlyRevenue.set(monthKey, 0);
    }
    
    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        const monthKey = invoice.dueDate.substring(0, 7);
        if (monthlyRevenue.has(monthKey)) {
          monthlyRevenue.set(monthKey, (monthlyRevenue.get(monthKey) || 0) + invoice.amount);
        }
      }
    });

    return Array.from(monthlyRevenue.entries()).map(([month, receita]) => ({
      month: format(new Date(`${month}-02`), "MMM", { locale: ptBR }), // Using day 02 to avoid timezone issues
      receita,
    }));
  }, [invoices]);

  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Receita Mensal</CardTitle>
                <CardDescription>Receita paga dos últimos 6 meses.</CardDescription>
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
        <CardTitle>Receita Mensal</CardTitle>
        <CardDescription>Receita paga dos últimos 6 meses.</CardDescription>
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
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
