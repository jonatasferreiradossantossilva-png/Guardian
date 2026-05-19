import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { DataProvider } from '@/hooks/use-data';
import { ErrorBoundary } from '@/components/shared/error-boundary';
import { IosInstallPrompt } from '@/components/pwa/ios-install-prompt';
import { FloatingWhatsApp } from '@/components/pwa/floating-whatsapp';
import { ClientOnly } from "@/components/shared/client-only";

export const metadata: Metadata = {
  title: 'VanGuardian',
  description: 'O Guardião do Transporte Escolar. A jornada do seu filho, protegida em tempo real.',
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VanGuardian",
  },
  formatDetection: {
    telephone: false,
  },
};

import { DemoOrchestrator } from '@/components/dashboard/demo-orchestrator';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                  }, function(err) {
                    console.log('ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <ErrorBoundary>
          <DataProvider>
            <FirebaseClientProvider>
              {children}
            </FirebaseClientProvider>
            <ClientOnly>
              {process.env.NEXT_PUBLIC_DATA_MODE !== 'firestore' && <DemoOrchestrator />}
            </ClientOnly>
          </DataProvider>
        </ErrorBoundary>
        <ClientOnly>
          <IosInstallPrompt />
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
