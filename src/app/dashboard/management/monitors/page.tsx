import { initialMockData } from '@/lib/mock-data';
import { MonitorsList } from '@/components/dashboard/management/monitors/monitors-list';

export default async function MonitorsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  const monitors = isFirestore ? [] : initialMockData.monitors;
  const vehicles = isFirestore ? [] : initialMockData.vehicles;

  return <MonitorsList initialMonitors={monitors} initialVehicles={vehicles} />;
}
