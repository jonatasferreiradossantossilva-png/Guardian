'use client';

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { FinancialTrendCards } from "@/components/dashboard/financial-trend-cards";
import { MonthlyRevenueChart } from "@/components/dashboard/monthly-revenue-chart";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral da saúde financeira da sua operação.</p>
        </div>
      </div>

      <OverviewCards />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <FinancialTrendCards />
        <InvoicesStatusChart />
      </div>

      <div className="grid gap-8 grid-cols-1">
        <MonthlyRevenueChart />
      </div>

    </div>
  );
}
