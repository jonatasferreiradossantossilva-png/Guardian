import { initialMockData } from '@/lib/mock-data';
import { PredefinedMessagesList } from '@/components/dashboard/management/predefined-messages/predefined-messages-list';

// This is a Server Component
export default async function PredefinedMessagesPage() {
  // Data is fetched on the server
  const messages = initialMockData.predefined_messages;

  // The client component receives the initial data as props
  return <PredefinedMessagesList initialMessages={messages} />;
}
