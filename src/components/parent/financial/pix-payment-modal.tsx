'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Loader2, QrCode, ShieldCheck, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: { id: string; amount: number; description: string };
  onPaymentSuccess: () => void;
}

export function PixPaymentModal({ isOpen, onClose, invoice, onPaymentSuccess }: PixPaymentModalProps) {
  const { toast } = useToast();
  const [isCopied, setIsCopied] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Simulando um código Pix real (Copia e Cola)
  const pixPayload = `00020101021226850014br.gov.bcb.pix0136guardian-pix-key-random-id-${invoice.id}520400005303986540${invoice.amount.toFixed(2)}5802BR5918GuardianTransporte6009Sao Paulo62070503***6304ABCD`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setIsCopied(true);
    toast({ title: "Código Copiado!", description: "Cole no app do seu banco para pagar." });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSimulateWebhook = () => {
    setIsSimulating(true);
    // Simula o tempo que o banco leva para avisar o Guardian via Webhook
    setTimeout(() => {
      setIsSimulating(false);
      onPaymentSuccess();
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="text-primary" />
            Pagamento via Pix
          </DialogTitle>
          <DialogDescription>
            Escaneie o QR Code abaixo ou utilize o código Copia e Cola.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center gap-6 py-4">
            <div className="bg-white p-4 rounded-xl shadow-inner border-2 border-primary/10">
                {/* QR Code Simulado com placeholder de alta qualidade */}
                <Image 
                    src="https://picsum.photos/seed/pix-qr/300/300" 
                    alt="QR Code Pix" 
                    width={200} 
                    height={200}
                    className="rounded-lg"
                    data-ai-hint="QR code"
                />
            </div>

            <div className="w-full space-y-2">
                <p className="text-sm font-bold text-center text-primary">R$ {invoice.amount.toFixed(2).replace('.', ',')}</p>
                <p className="text-xs text-muted-foreground text-center">{invoice.description}</p>
            </div>

            <div className="w-full space-y-3">
                <div className="relative">
                    <Input 
                        value={pixPayload} 
                        readOnly 
                        className="pr-12 text-xs font-mono h-12 bg-secondary/30"
                    />
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={handleCopy}
                    >
                        {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                    Clique no ícone para copiar o código e pagar no seu banco.
                </p>
            </div>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-3">
            <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                    <p className="text-xs font-bold text-primary">Confirmação Instantânea</p>
                    <p className="text-[10px] text-muted-foreground">Após o pagamento, o sistema identificará o valor automaticamente através da nossa inteligência bancária.</p>
                </div>
            </div>
            {/* Botão de Simulação apenas para o protótipo */}
            <Button 
                variant="outline" 
                className="w-full h-8 text-[10px] border-dashed" 
                onClick={handleSimulateWebhook}
                disabled={isSimulating}
            >
                {isSimulating ? (
                    <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Verificando com o Banco...</>
                ) : (
                    <><Sparkles className="mr-2 h-3 w-3 text-amber-500" /> Simular Confirmação do Banco (Prototipação)</>
                )}
            </Button>
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="ghost" className="w-full">Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
