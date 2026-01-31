'use client';

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { FinancialTrendCards } from "@/components/dashboard/financial-trend-cards";
import { MonthlyBalanceChart } from "@/components/dashboard/monthly-balance-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";

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

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MonthlyBalanceChart />
        </div>
        <div className="space-y-8">
          <FinancialTrendCards />
          <ExpensesCategoryChart />
        </div>
      </div>

    </div>
  );
}
