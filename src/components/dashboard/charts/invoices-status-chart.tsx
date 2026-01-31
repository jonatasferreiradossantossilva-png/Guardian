'use client';

import { useMemo } from 'react';
import { Pie, PieChart, Cell } from 'recharts';
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
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Loader2 } from 'lucide-react';

const statusTextMap = {
  pending: 'Pendentes',
  paid: 'Pagas',
  overdue: 'Vencidas',
  pagamento_em_analise: 'Em Análise',
};

const statusColorMap = {
    paid: 'hsl(var(--chart-2))', // green
    pending: 'hsl(var(--chart-4))', // yellow
    overdue: 'hsl(var(--chart-5))', // red/orange
    pagamento_em_analise: 'hsl(var(--chart-3))', // blueish
}

export function InvoicesStatusChart() {
  const { data: invoices, isLoading } = useMockCollection('invoices');

  const chartData = useMemo(() => {
    if (!invoices) return [];
    
    const statusCounts = invoices.reduce((acc, invoice) => {
      const status = invoice.status || 'pendente';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalInvoices = invoices.length;

    return Object.entries(statusCounts).map(([status, count]) => ({
      status: statusTextMap[status] || 'Desconhecido',
      count: count,
      fill: statusColorMap[status],
      percentage: totalInvoices > 0 ? ((count / totalInvoices) * 100).toFixed(0) : 0,
    }));
  }, [invoices]);

  const chartConfig = useMemo(() => {
    const config = {};
    chartData.forEach(item => {
        config[item.status] = {
            label: item.status,
            color: item.fill,
        }
    });
    return config;
  }, [chartData]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Faturas por Status</CardTitle>
        <CardDescription>
          Distribuição de todas as faturas no sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[200px] w-full">
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent formatter={(value, name, item) => `${item.payload.count} (${item.payload.percentage}%)`}/>}
                />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                </Pie>
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
