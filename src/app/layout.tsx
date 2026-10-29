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
    <html lang="pt-BR" className="dark notranslate" translate="no" suppressHydrationWarning>
      <head>
        <meta name="google" content="notranslate" />
        <meta name="googlebot" content="notranslate" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Recuperação automática de erro de versão desatualizada (ChunkLoadError)
              window.addEventListener('error', function(e) {
                if (e.message && (e.message.includes('ChunkLoadError') || e.message.includes('Loading chunk') || e.message.includes('Failed to fetch dynamically imported module'))) {
                  console.warn('Versão desatualizada detectada. Recarregando com versão mais recente...');
                  window.location.reload();
                }
              });

              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('ServiceWorker registered:', registration.scope);
                    registration.update();
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
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
              }
            `,
          }}
        />
      </head>
      <body className={`${inter.className} font-body antialiased notranslate`} translate="no" suppressHydrationWarning>
        <ErrorBoundary>
          <FirebaseClientProvider>
            <DataProvider>
              {children}
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
