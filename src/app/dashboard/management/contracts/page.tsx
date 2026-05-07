import { initialMockData } from '@/lib/mock-data';
import { ContractsList } from '@/components/dashboard/management/contracts/contracts-list';

// This is a Server Component
export default async function ContractsPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server
  const contracts = isFirestore ? [] : (initialMockData.contracts || []);
  const students = isFirestore ? [] : (initialMockData.students || []);
  const parents = isFirestore ? [] : (initialMockData.parents || []);
  const templates = isFirestore ? [] : (initialMockData.contract_templates || []);

  return <ContractsList 
            initialContracts={contracts} 
            initialStudents={students} 
            initialParents={parents} 
            initialTemplates={templates}
        />;
}
