'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

const statusTextMap: Record<string, string> = {
  paid: 'Pagas',
  pending: 'Pendentes',
  overdue: 'Vencidas',
  pagamento_em_analise: 'Em Análise',
};

const statusColors: Record<string, string> = {
  paid: 'hsl(var(--chart-2))', // green
  pending: 'hsl(var(--chart-4))', // yellow
  overdue: 'hsl(var(--chart-5))', // red
  pagamento_em_analise: 'hsl(var(--chart-1))', // blue
};

export function InvoicesStatusChart() {
  const { data: invoices, isLoading } = useMockCollection('invoices');

  const chartData = useMemo(() => {
    if (!invoices) return [];

    const statusCounts = invoices.reduce((acc, invoice) => {
      const statusKey = invoice.status;
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusTextMap[status] || status,
      count: count,
      fill: statusColors[status],
    }));
  }, [invoices]);

  const chartConfig = useMemo(() => {
    return chartData.reduce((acc, item) => {
      acc[item.status] = {
        label: item.status,
        color: item.fill,
      };
      return acc;
    }, {} as ChartConfig);
  }, [chartData]);


  if (isLoading) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Composição das Faturas</CardTitle>
                <CardDescription>Distribuição de faturas por status.</CardDescription>
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
        <CardTitle>Composição das Faturas</CardTitle>
        <CardDescription>Distribuição de faturas por status no período total.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[230px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
                labelLine={false}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  percent,
                }) => {
                   const RADIAN = Math.PI / 180
                   const radius = innerRadius + (outerRadius - innerRadius) * 0.5
                   const x = cx + radius * Math.cos(-midAngle * RADIAN)
                   const y = cy + radius * Math.sin(-midAngle * RADIAN)
            
                   return (
                     <text
                       x={x}
                       y={y}
                       fill="hsl(var(--card-foreground))"
                       textAnchor={x > cx ? "start" : "end"}
                       dominantBaseline="central"
                       className="text-xs font-medium"
                     >
                       {`${(percent * 100).toFixed(0)}%`}
                     </text>
                   )
                 }}
              >
                 {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend
                  content={<ChartLegendContent nameKey="status" />}
                  className="-translate-y-4"
                />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
