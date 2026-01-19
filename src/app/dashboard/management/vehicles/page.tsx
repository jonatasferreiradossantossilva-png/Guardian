import { initialMockData } from '@/lib/mock-data';
import { VehiclesList } from '@/components/dashboard/management/vehicles/vehicles-list';

// This is a Server Component
export default async function VehiclesPage() {
  // Data is fetched on the server
  const vehicles = initialMockData.vehicles;

  // The client component receives the initial data as props
  return <VehiclesList initialVehicles={vehicles} />;
}
