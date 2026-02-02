'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, ChartConfig } from '@/components/ui/chart';
import { Loader2 } from 'lucide-react';

interface InvoicesStatusChartProps {
    filters: {
        year: string;
        month: string;
    }
}

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

export function InvoicesStatusChart({ filters }: InvoicesStatusChartProps) {
  const { data: allInvoices, isLoading } = useMockCollection('invoices', undefined);

  const chartData = useMemo(() => {
    if (!allInvoices) return [];

    const { year, month } = filters;
    const isYearlyView = month === 'all';

    let filteredInvoices = allInvoices.filter(inv => inv.dueDate.startsWith(year));
    if (!isYearlyView) {
        const monthStr = `${year}-${month}`;
        filteredInvoices = filteredInvoices.filter(inv => inv.dueDate.startsWith(monthStr));
    }

    if (filteredInvoices.length === 0) return [];

    const statusCounts = filteredInvoices.reduce((acc, invoice) => {
      const statusKey = invoice.status;
      acc[statusKey] = (acc[statusKey] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusTextMap[status] || status,
      count: count,
      fill: statusColors[status],
    }));
  }, [allInvoices, filters]);

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
                <CardTitle>Status das Faturas</CardTitle>
                <CardDescription>Distribuição de faturas por status.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-0" style={{ height: '300px' }}>
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status das Faturas</CardTitle>
        <CardDescription>Distribuição de faturas no período selecionado.</CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-0">
         {chartData.length > 0 ? (
            <ChartContainer
                config={chartConfig}
                className="w-full h-[300px]"
            >
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
                            fill="hsl(var(--foreground))"
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
                        content={<ChartLegendContent nameKey="status" className="flex-wrap justify-center"/>}
                    />
                    </PieChart>
                </ResponsiveContainer>
            </ChartContainer>
          ) : (
             <div className="flex h-[300px] items-center justify-center text-muted-foreground text-sm">
                Nenhuma fatura no período.
            </div>
          )}
      </CardContent>
    </Card>
  );
}
