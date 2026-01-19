import { initialMockData } from '@/lib/mock-data';
import { StudentsList } from '@/components/dashboard/management/students/students-list';

// This is a Server Component
export default async function StudentsPage() {
  // Data is fetched on the server
  const students = initialMockData.students;
  const schools = initialMockData.schools;
  const parents = initialMockData.parents;

  // The client component receives the initial data as props
  return <StudentsList initialStudents={students} initialSchools={schools} initialParents={parents} />;
}
