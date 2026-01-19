import { initialMockData } from '@/lib/mock-data';
import { DriversList } from '@/components/dashboard/management/drivers/drivers-list';

// This is a Server Component
export default async function DriversPage() {
  // Data is fetched on the server
  const drivers = initialMockData.drivers;
  const vehicles = initialMockData.vehicles;

  // The client component receives the initial data as props
  return <DriversList initialDrivers={drivers} initialVehicles={vehicles} />;
}
