import { initialMockData } from '@/lib/mock-data';
import { RoutesList } from '@/components/dashboard/management/routes/routes-list';

// This is a Server Component
export default async function RoutesPage() {
  // Data is fetched on the server
  const routes = initialMockData.routes;
  const drivers = initialMockData.drivers;
  const students = initialMockData.students;

  // The client component receives the initial data as props
  return <RoutesList initialRoutes={routes} initialDrivers={drivers} initialStudents={students} />;
}
