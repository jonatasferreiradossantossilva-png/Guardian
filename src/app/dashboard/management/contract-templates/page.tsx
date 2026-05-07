import { initialMockData } from '@/lib/mock-data';
import { ContractTemplatesList } from '@/components/dashboard/management/contract-templates/contract-templates-list';

// This is a Server Component
export default async function ContractTemplatesPage() {
  const isFirestore = process.env.NEXT_PUBLIC_DATA_MODE === 'firestore';
  // Data is fetched on the server (using mock data for now)
  const templates = isFirestore ? [] : (initialMockData.contract_templates || []);

  // The client component receives the initial data as props
  return <ContractTemplatesList initialTemplates={templates} />;
}
