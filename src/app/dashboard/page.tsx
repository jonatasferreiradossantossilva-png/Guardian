'use client';

import { useState } from 'react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { IncidentMap } from "@/components/dashboard/incident-map";
import { DriverStatusList } from "@/components/dashboard/driver-status-list";

export default function DashboardPage() {
  const [mapTarget, setMapTarget] = useState<google.maps.LatLngLiteral | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da operação em tempo real.</p>
        </div>
      </div>

      <OverviewCards />

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-semibold mb-4">Mapa de Incidentes</h2>
          <div className="aspect-[16/9] rounded-lg overflow-hidden border">
             <IncidentMap target={mapTarget} />
          </div>
        </div>
        <div className="lg:col-span-1 flex flex-col gap-8">
            <div>
                 <h2 className="text-2xl font-semibold mb-4">Status dos Motoristas</h2>
                 <DriverStatusList onLocateDriver={setMapTarget} />
            </div>
        </div>
      </div>
    </div>
  );
}
