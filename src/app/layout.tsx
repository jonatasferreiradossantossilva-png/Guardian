import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { MockDataProvider } from '@/hooks/use-mock-data';

export const metadata: Metadata = {
  title: 'Rota Segura Mobile',
  description: 'Gestão de transporte escolar em tempo real.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <MockDataProvider>
          <FirebaseClientProvider>
            {children}
          </FirebaseClientProvider>
        </MockDataProvider>
        <Toaster />
      </body>
    </html>
  );
}
