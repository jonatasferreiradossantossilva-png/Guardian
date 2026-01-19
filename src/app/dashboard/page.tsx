import { OverviewCards } from "@/components/dashboard/overview-cards";
import { IncidentList } from "@/components/dashboard/incident-list";
import { IncidentMap } from "@/components/dashboard/incident-map";
import { DriverStatusList } from "@/components/dashboard/driver-status-list";
import { incidents } from "@/lib/placeholder-data";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DriverRouteInfoCard } from "@/components/dashboard/driver-route-info-card";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da operação em tempo real.</p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Relatar Incidente
        </Button>
      </div>

      <DriverRouteInfoCard />

      <OverviewCards />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Mapa de Incidentes</h2>
          <div className="aspect-[16/9] rounded-lg overflow-hidden border">
             <IncidentMap incidents={incidents} />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
            <div>
                 <h2 className="text-2xl font-semibold mb-4">Status dos Motoristas</h2>
                 <DriverStatusList />
            </div>
            <div>
                 <h2 className="text-2xl font-semibold mb-4">Incidentes Recentes</h2>
                 <IncidentList incidents={incidents} />
            </div>
        </div>
      </div>
    </div>
  );
}
