import { initialMockData } from '@/lib/mock-data';
import { VehiclesList } from '@/components/dashboard/management/vehicles/vehicles-list';

// This is a Server Component
export default async function VehiclesPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is empty in production, mock in dev
  const vehicles = isFirestore ? [] : initialMockData.vehicles;

  // The client component receives the initial data as props
  return <VehiclesList initialVehicles={vehicles} />;
}
