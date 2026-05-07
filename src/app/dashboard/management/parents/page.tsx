import { initialMockData } from '@/lib/mock-data';
import { ParentsList } from '@/components/dashboard/management/parents/parents-list';

// This is a Server Component
export default async function ParentsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const parents = isFirestore ? [] : initialMockData.parents;

  // The client component receives the initial data as props
  return <ParentsList initialParents={parents} />;
}
