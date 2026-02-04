import { initialMockData } from '@/lib/mock-data';
import { ContractTemplatesList } from '@/components/dashboard/management/contract-templates/contract-templates-list';

// This is a Server Component
export default async function ContractTemplatesPage() {
  // Data is fetched on the server (using mock data for now)
  const templates = initialMockData.contract_templates || [];

  // The client component receives the initial data as props
  return <ContractTemplatesList initialTemplates={templates} />;
}
