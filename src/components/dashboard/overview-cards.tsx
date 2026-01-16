'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, Smile, GraduationCap, Truck, FileText } from "lucide-react";
import { useMockCollection } from "@/hooks/use-mock-data";


export function OverviewCards() {
  const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: activeVehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles', [{ field: 'active', op: '==', value: true }]);
  const { data: pendingInvoices, isLoading: areInvoicesLoading } = useMockCollection('invoices', [{ field: 'status', op: '==', value: 'pending' }]);

  const isLoading = areStudentsLoading || areVehiclesLoading || areInvoicesLoading;

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
      title: "Faturas Pendentes",
      value: isLoading ? "-" : pendingInvoices?.length.toString() ?? "0",
      icon: FileText,
      changeText: "Faturas aguardando pagamento"
    },
    {
        title: "Satisfação dos Pais",
        value: "98%",
        icon: Smile,
        change: "+0.5%",
        changeType: "increase",
        changeText: "em relação a ontem"
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
              {stat.change ? (
                <>
                  <span className={cn(
                    "flex items-center gap-1",
                    stat.changeType === 'increase' ? 'text-green-400' : 'text-red-400'
                  )}>
                    {stat.changeType === 'increase' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                    {stat.change}
                  </span>
                  {stat.changeText}
                </>
              ) : (
                stat.changeText
              )}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
