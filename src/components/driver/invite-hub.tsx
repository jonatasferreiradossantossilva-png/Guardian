'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageSquare, 
  QrCode, 
  Share2, 
  Copy, 
  Check, 
  Megaphone,
  Sparkles,
  Smartphone,
  Shield
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface InviteHubProps {
  driverName: string;
  routeId: string;
  routeName: string;
}

export function InviteHub({ driverName, routeId, routeName }: InviteHubProps) {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const getBaseOrigin = () => {
    if (typeof window === 'undefined') return '';
    let origin = window.location.origin;
    if (window.location.hostname === 'localhost') {
      // Fallback para IP de rede local para testes em dispositivos físicos
      return origin.replace('localhost', '192.168.0.30');
    }
    return origin;
  };

  const inviteUrl = `${getBaseOrigin()}/register?routeId=${routeId}&isTesting=true`;
  
  const handleWhatsAppShare = () => {
    const message = encodeURIComponent(
      `🚐 *Olá! Aqui é o ${driverName}.*\n\nEstou organizando as vagas para a minha van escolar na rota *${routeName}*. \n\nPara garantir a segurança do seu filho(a) e você acompanhar o trajeto em tempo real, por favor realize o cadastro rápido pelo link abaixo:\n\n🔗 ${inviteUrl}\n\n*Guardian: Segurança e Transparência no Transporte Escolar.*`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteUrl);
    setHasCopied(true);
    toast({
      title: "Link Copiado!",
      description: "Agora é só colar no grupo de pais.",
    });
    setTimeout(() => setHasCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <Card className="border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Megaphone className="h-16 w-16 text-primary rotate-12" />
        </div>
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-1">
             <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black tracking-widest">{String('Captação Ativa')}</Badge>
          </div>
          <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            {String('Lotar minha Van')}
          </CardTitle>
          <CardDescription className="text-xs font-medium">
            {String('Convide novos pais e gerencie sua lista de espera sem esforço.')}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-2">
          <div className="grid grid-cols-1 gap-3">
            <Button 
              onClick={handleWhatsAppShare}
              className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black text-sm uppercase tracking-widest shadow-md flex items-center justify-center gap-3 active:scale-95 transition-all"
            >
              <MessageSquare className="h-5 w-5 fill-current" />
              {String('Enviar via WhatsApp')}
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline" 
                onClick={copyToClipboard}
                className="h-12 border-primary/30 font-bold hover:bg-primary/5 gap-2"
              >
                {hasCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-primary" />}
                {String('Copiar Link')}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsQrModalOpen(true)}
                className="h-12 border-primary/30 font-bold hover:bg-primary/5 gap-2"
              >
                <QrCode className="h-4 w-4 text-primary" />
                {String('Gerar QR')}
              </Button>
            </div>
          </div>

          <div className="p-3 bg-background/50 rounded-lg border border-dashed border-primary/20 flex items-start gap-3">
             <Shield className="h-4 w-4 text-primary mt-0.5 shrink-0" />
             <p className="text-[10px] text-muted-foreground leading-tight italic">
               <strong>Dica Guardião:</strong> {String('Ao usar o link, os pais marcam o endereço exato no mapa, evitando erros de roteirização para você.')}
             </p>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="max-w-[320px] rounded-3xl p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">QR Code da Rota</DialogTitle>
            <DialogDescription className="text-xs">
              Mantenha no para-brisa ou mostre aos pais para um cadastro instantâneo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-4 border-primary/10 shadow-inner my-2">
            {/* Mock QR Code Display */}
            <div className="w-48 h-48 bg-primary/5 rounded-xl border-8 border-white flex flex-col items-center justify-center relative">
               <div className="absolute inset-4 border-2 border-primary/20 opacity-50"></div>
               <QrCode className="h-24 w-24 text-primary" />
               <p className="mt-2 text-[8px] font-black text-primary/50 uppercase tracking-widest">Guardian Auth</p>
            </div>
          </div>

          <p className="text-center text-[10px] font-bold text-muted-foreground mt-2">
            Escaneie para cadastrar na rota:<br/>
            <span className="text-primary uppercase">{routeName}</span>
          </p>

          <DialogFooter className="mt-4">
            <Button className="w-full h-12 font-black uppercase tracking-widest" onClick={() => window.print()}>
              Imprimir QR Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
    return <span className={cn("px-2 py-0.5 rounded-full text-xs font-bold", className)}>{children}</span>
}
