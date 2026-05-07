import { initialMockData } from '@/lib/mock-data';
import { TripRequestsList } from '@/components/dashboard/management/trip-requests/trip-requests-list';

// This is a Server Component
export default async function TripRequestsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const requests = isFirestore ? [] : initialMockData.trip_requests;
  const students = isFirestore ? [] : initialMockData.students;
  const parents = isFirestore ? [] : initialMockData.parents;
  const schools = isFirestore ? [] : initialMockData.schools;

  // The client component receives the initial data as props
  return <TripRequestsList initialRequests={requests} initialStudents={students} initialParents={parents} initialSchools={schools} />;
}

    
