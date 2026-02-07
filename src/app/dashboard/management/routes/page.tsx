
import { initialMockData } from '@/lib/mock-data';
import { RoutesList } from '@/components/dashboard/management/routes/routes-list';

// This is a Server Component
export default async function RoutesPage() {
  // Data is fetched on the server
  const routes = initialMockData.routes;
  const drivers = initialMockData.drivers;
  const students = initialMockData.students;
  const users = initialMockData.users || [];
  const schools = initialMockData.schools;
  
  // Filter for active drivers and monitors
  const activeDrivers = drivers.filter(d => d.active !== false);
  const activeMonitors = users.filter(u => u.profile === 'monitor' && u.active !== false);
  
  const vehicles = initialMockData.vehicles;

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

    
