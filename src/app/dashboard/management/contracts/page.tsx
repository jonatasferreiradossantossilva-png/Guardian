import { initialMockData } from '@/lib/mock-data';
import { ContractsList } from '@/components/dashboard/management/contracts/contracts-list';

// This is a Server Component
export default async function ContractsPage() {
  // Data is fetched on the server
  const contracts = initialMockData.contracts || [];
  const students = initialMockData.students || [];
  const parents = initialMockData.parents || [];
  const templates = initialMockData.contract_templates || [];

  return <ContractsList 
            initialContracts={contracts} 
            initialStudents={students} 
            initialParents={parents} 
            initialTemplates={templates}
        />;
}
