'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

interface ExpensesCategoryChartProps {
    filters: {
        year: string;
        month: string;
    }
}

const categoryColors: Record<string, string> = {
    Combustível: 'hsl(var(--chart-1))',
    Manutenção: 'hsl(var(--chart-2))',
    Salários: 'hsl(var(--chart-3))',
    Impostos: 'hsl(var(--chart-4))',
    Outros: 'hsl(var(--chart-5))',
};

export function ExpensesCategoryChart({ filters }: ExpensesCategoryChartProps) {
  const { data: allExpenses, isLoading } = useMockCollection('expenses', undefined);

  const chartData = useMemo(() => {
    if (!allExpenses) return [];

    const { year, month } = filters;
    const isYearlyView = month === 'all';

    let filteredExpenses = allExpenses.filter(exp => exp.date.startsWith(year));
    if (!isYearlyView) {
        const monthStr = `${year}-${month}`;
        filteredExpenses = filteredExpenses.filter(exp => exp.date.startsWith(monthStr));
    }

    if (filteredExpenses.length === 0) return [];

    const categoryTotals = filteredExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Outros';
      acc[category] = (acc[category] || 0) + expense.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryTotals).map(([category, total]) => ({
      category,
      total,
      fill: categoryColors[category] || 'hsl(var(--muted))',
    }));
  }, [allExpenses, filters]);
  
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
            <CardContent className="flex items-center justify-center p-0" style={{ height: '300px' }}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Composição das Despesas</CardTitle>
        <CardDescription>Distribuição de custos do período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col items-center justify-center p-0">
          {chartData.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="w-full h-[250px]"
            >
              <ResponsiveContainer width="100%" height="100%">
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
                    label={({
                      cx,
                      cy,
                      midAngle,
                      innerRadius,
                      outerRadius,
                      percent,
                    }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="hsl(var(--foreground))"
                          textAnchor={x > cx ? "start" : "end"}
                          dominantBaseline="central"
                          className="text-xs font-medium"
                        >
                          {`${(percent * 100).toFixed(0)}%`}
                        </text>
                      );
                    }}
                  >
                    {chartData.map((entry) => (
                        <Cell key={`cell-${entry.category}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                Nenhuma despesa no período.
            </div>
          )}
      </CardContent>
      <div className="flex items-center justify-center p-4 pt-0">
        {chartData.length > 0 && (
          <ChartLegend
            content={<ChartLegendContent nameKey="category" />}
            className="flex-wrap"
          />
        )}
      </div>
    </Card>
  );
}
