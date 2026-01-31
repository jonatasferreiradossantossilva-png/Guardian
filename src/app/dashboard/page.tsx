'use client';

import { OverviewCards } from "@/components/dashboard/overview-cards";
import { DriverStatusList } from "@/components/dashboard/driver-status-list";
import { MonthlyRevenueChart, InvoicesStatusChart } from '@/components/dashboard/charts';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da operação em tempo real.</p>
        </div>
      </div>

      <OverviewCards />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <div className="flex flex-col gap-8">
            <MonthlyRevenueChart />
            <InvoicesStatusChart />
        </div>
        <div>
            <h2 className="text-2xl font-semibold mb-4">Status dos Motoristas</h2>
            <DriverStatusList />
        </div>
      </div>
    </div>
  );
}
