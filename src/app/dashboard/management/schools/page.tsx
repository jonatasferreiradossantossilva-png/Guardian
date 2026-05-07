import { initialMockData } from '@/lib/mock-data';
import { SchoolsList } from '@/components/dashboard/management/schools/schools-list';

// This is a Server Component
export default async function SchoolsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const schools = isFirestore ? [] : initialMockData.schools;

  // The client component receives the initial data as props
  return <SchoolsList initialSchools={schools} />;
}
