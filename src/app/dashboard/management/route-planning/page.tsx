import { initialMockData } from '@/lib/mock-data';
import { RoutePlanningClient } from '@/components/dashboard/management/route-planning/route-planning-client';

export default async function RoutePlanningPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  
  // For now, we mock the data. The client component will handle the logic.
  const routes = isFirestore ? [] : initialMockData.routes;
  const students = isFirestore ? [] : initialMockData.students;
  const manifests = isFirestore ? [] : (initialMockData.route_manifests || []);
  const tripRequests = isFirestore ? [] : initialMockData.trip_requests;

  return (
    <RoutePlanningClient 
      initialRoutes={routes} 
      initialStudents={students} 
      initialManifests={manifests}
      initialTripRequests={tripRequests}
    />
  );
}
