'use client';

import dynamic from 'next/dynamic';

const ClientComponent = dynamic(
  () => import('./route-planning-client').then(mod => mod.RoutePlanningClient),
  { ssr: false, loading: () => <div className="p-20 text-center font-bold text-slate-400">Carregando Planejador Guardian...</div> }
);

export function RoutePlanningWrapper() {
  return <ClientComponent />;
}
