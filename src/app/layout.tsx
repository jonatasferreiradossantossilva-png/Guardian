import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registered:', registration.scope);
                    
                    // 1. Forçar verificação de atualizações no carregamento da página
                    registration.update();
                    
                    // 2. Se já houver um Service Worker esperando, mandar ativar imediatamente
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    
                    // 3. Monitorar novas atualizações encontradas em segundo plano
                    registration.addEventListener('updatefound', function() {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', function() {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      }
                    });
                  });
                });

                // 4. Recarregar automaticamente a tela assim que o novo Service Worker assumir
                let refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-body antialiased`} suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            <DataProvider>
              {children}
              <ClientOnly>
                {process.env.NEXT_PUBLIC_DATA_MODE !== 'firestore' && <DemoOrchestrator />}
              </ClientOnly>
            </DataProvider>
          </FirebaseClientProvider>
        </ErrorBoundary>
        <ClientOnly>
          <IosInstallPrompt />
          <Toaster />
        </ClientOnly>
      </body>
    </html>
  );
}
