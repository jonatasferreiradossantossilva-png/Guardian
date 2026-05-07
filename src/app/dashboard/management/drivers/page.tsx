import { initialMockData } from '@/lib/mock-data';
import { DriversList } from '@/components/dashboard/management/drivers/drivers-list';

// This is a Server Component
export default async function DriversPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const drivers = isFirestore ? [] : initialMockData.drivers;
  const vehicles = isFirestore ? [] : initialMockData.vehicles;

  // The client component receives the initial data as props
  return <DriversList initialDrivers={drivers} initialVehicles={vehicles} />;
}
