'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

const categoryColors: Record<string, string> = {
    Combustível: 'hsl(var(--chart-1))',
    Manutenção: 'hsl(var(--chart-2))',
    Salários: 'hsl(var(--chart-3))',
    Impostos: 'hsl(var(--chart-4))',
    Outros: 'hsl(var(--chart-5))',
};

export function ExpensesCategoryChart() {
  const { data: expenses, isLoading } = useMockCollection('expenses');

  const chartData = useMemo(() => {
    if (!expenses) return [];

    const categoryTotals = expenses.reduce((acc, expense) => {
      const category = expense.category || 'Outros';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
      fill: categoryColors[category] || 'hsl(var(--muted))',
    }));
  }, [expenses]);
  
  const totalExpenses = useMemo(() => chartData.reduce((acc, item) => acc + item.total, 0), [chartData]);


  const chartConfig = useMemo(() => {
    return chartData.reduce((acc, item) => {
      acc[item.category] = {
        label: item.category,
        color: item.fill,
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);


  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Composição das Despesas</CardTitle>
                <CardDescription>Distribuição de custos por categoria.</CardDescription>
            </CardHeader>
            <CardContent className="h-[230px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Composição das Despesas</CardTitle>
        <CardDescription>Distribuição de custos por categoria.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[230px]">
          <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="total"
                nameKey="category"
                innerRadius={60}
                strokeWidth={5}
              >
                 {chartData.map((entry) => (
                    <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                  content={<ChartLegendContent nameKey="category" />}
                  className="-translate-y-4"
                />
            </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
