import { initialMockData } from '@/lib/mock-data';
import { TripRequestsList } from '@/components/dashboard/management/trip-requests/trip-requests-list';

// This is a Server Component
export default async function TripRequestsPage() {
  // Data is fetched on the server
  const requests = initialMockData.trip_requests;
  const students = initialMockData.students;
  const parents = initialMockData.parents;


  // The client component receives the initial data as props
  return <TripRequestsList initialRequests={requests} initialStudents={students} initialParents={parents} />;
}

    