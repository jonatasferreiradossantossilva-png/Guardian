import { initialMockData } from '@/lib/mock-data';
import { MonitorsList } from '@/components/dashboard/management/monitors/monitors-list';

export default async function MonitorsPage() {
  const monitors = initialMockData.monitors;
  const vehicles = initialMockData.vehicles;

  return <MonitorsList initialMonitors={monitors} initialVehicles={vehicles} />;
}
