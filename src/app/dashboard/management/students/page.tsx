import { initialMockData } from '@/lib/mock-data';
import { StudentsList } from '@/components/dashboard/management/students/students-list';

// This is a Server Component
export default async function StudentsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const students = isFirestore ? [] : initialMockData.students;
  const schools = isFirestore ? [] : initialMockData.schools;
  const parents = isFirestore ? [] : initialMockData.parents;

  // The client component receives the initial data as props
  return <StudentsList initialStudents={students} initialSchools={schools} initialParents={parents} />;
}
