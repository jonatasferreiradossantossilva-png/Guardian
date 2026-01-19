import { initialMockData } from '@/lib/mock-data';
import { SchoolsList } from '@/components/dashboard/management/schools/schools-list';

// This is a Server Component
export default async function SchoolsPage() {
  // Data is fetched on the server
  const schools = initialMockData.schools;

  // The client component receives the initial data as props
  return <SchoolsList initialSchools={schools} />;
}
