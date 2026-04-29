'use client';

import { useState, useEffect } from 'react';
import { Share, PlusSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

export function IosInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Verificar se deve ocultar (útil para testes E2E)
    const isTesting = 
      localStorage.getItem('hide-ios-prompt') === 'true' || 
      (window as any).IS_TESTING ||
      window.location.search.includes('test=true');
      
    if (isTesting) return;

    // Verificar se é iOS
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    
    // Verificar se já está instalado (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

    if (isIos && !isStandalone) {
      // Mostrar após 3 segundos para não ser invasivo logo de cara
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!showPrompt) return null;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 left-4 right-4 z-[100] flex justify-center pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="pointer-events-auto max-w-sm w-full"
        >
          <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-xl relative overflow-hidden">
            {/* Barra de progresso visual no topo */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10">
                <div className="h-full bg-primary w-1/3 animate-[progress_3s_ease-in-out_infinite]" />
            </div>

            <CardContent className="p-5">
              <button 
                onClick={() => setShowPrompt(false)}
                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Share className="h-6 w-6 text-primary" />
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-bold text-sm">Instalar no iPhone (iOS)</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Para usar o **Guardian** como aplicativo:
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-xl border border-border/50">
                    <div className="bg-background p-1.5 rounded-lg shadow-sm">
                        <Share className="h-4 w-4 text-blue-500" />
                    </div>
                    <span className="text-[11px] font-medium">1. Toque no ícone de "Compartilhar" na barra do Safari.</span>
                </div>

                <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-xl border border-border/50">
                    <div className="bg-background p-1.5 rounded-lg shadow-sm">
                        <PlusSquare className="h-4 w-4 text-foreground" />
                    </div>
                    <span className="text-[11px] font-medium">2. Role para baixo e toque em "Adicionar à Tela de Início".</span>
                </div>
              </div>

              <Button 
                variant="ghost" 
                className="w-full mt-4 h-9 text-xs font-bold text-primary"
                onClick={() => setShowPrompt(false)}
              >
                Entendi, farei isso
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
