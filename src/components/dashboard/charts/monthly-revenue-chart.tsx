'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function MonthlyRevenueChart() {
  const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');

  const chartData = useMemo(() => {
    if (!invoices) return [];

    const revenueByMonth = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, invoice) => {
        const month = invoice.dueDate.substring(0, 7); // "YYYY-MM"
        acc[month] = (acc[month] || 0) + invoice.amount;
        return acc;
      }, {} as Record<string, number>);
      
    return Object.entries(revenueByMonth)
      .map(([monthStr, total]) => ({
        monthStr: monthStr,
        month: format(new Date(monthStr + '-02'), 'MMM/yy', { locale: ptBR }), // Using day 02 to avoid timezone issues with YYYY-MM
        Receita: total,
      }))
      .sort((a, b) => a.monthStr.localeCompare(b.monthStr));

  }, [invoices]);

  const chartConfig = {
    Receita: {
      label: 'Receita',
      color: 'hsl(var(--chart-2))',
    },
  };
  
  const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  const formatYAxis = (value: number) => `R$ ${value / 1000}k`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Receita Mensal</CardTitle>
        <CardDescription>
          Evolução da receita total (faturas pagas) por mês.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {areInvoicesLoading ? (
            <div className="flex items-center justify-center h-[250px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
              <BarChart
                accessibilityLayer
                data={chartData}
                margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
              >
                <CartesianGrid vertical={false} />
                <YAxis
                    tickFormatter={formatYAxis}
                    axisLine={false}
                    tickLine={false}
                    width={80}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value) => typeof value === 'number' ? formatCurrency(value) : value} indicator="dot" />}
                />
                <Bar dataKey="Receita" fill="var(--color-Receita)" radius={4} />
              </BarChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
