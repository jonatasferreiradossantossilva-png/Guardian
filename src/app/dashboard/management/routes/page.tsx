
import { initialMockData } from '@/lib/mock-data';
import { RoutesList } from '@/components/dashboard/management/routes/routes-list';

// This is a Server Component
export default async function RoutesPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const routes = isFirestore ? [] : initialMockData.routes;
  const drivers = isFirestore ? [] : initialMockData.drivers;
  const students = isFirestore ? [] : initialMockData.students;
  const users = isFirestore ? [] : (initialMockData.users || []);
  const schools = isFirestore ? [] : initialMockData.schools;
  
  // Filter for active drivers and monitors
  const activeDrivers = drivers.filter(d => d.active !== false);
  const activeMonitors = users.filter(u => u.profile === 'monitor' && u.active !== false);
  
  const vehicles = isFirestore ? [] : initialMockData.vehicles;

  // The client component receives the initial data as props
  return <RoutesList 
            initialRoutes={routes} 
            initialDrivers={activeDrivers} 
            initialStudents={students} 
            initialMonitors={activeMonitors} 
            initialVehicles={vehicles}
            initialSchools={schools}
        />;
}
