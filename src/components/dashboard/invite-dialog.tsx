'use client';

import React from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription, 
    DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCircle, Milestone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface InviteDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteDialog({ isOpen, onOpenChange }: InviteDialogProps) {
    const { toast } = useToast();

    const copyToClipboard = async (text: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for non-secure contexts (HTTP over LAN)
                const textArea = document.createElement("textarea");
                textArea.value = text;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (err) {
            console.error('Fallback copy failed', err);
            return false;
        }
    };

    const handleShare = async (type: 'mensalista' | 'avulso') => {
        let baseOrigin = window.location.origin;
        
        // Se estiver em localhost, forçamos o IP da rede local para o link funcionar no celular do pai
        if (window.location.hostname === 'localhost') {
            baseOrigin = baseOrigin.replace('localhost', '192.168.0.30');
        }

        const registrationLink = type === 'avulso' 
            ? `${baseOrigin}/register?type=avulso`
            : `${baseOrigin}/register`;
            
        const shareText = type === 'avulso'
            ? `Olá! Convidamos você para usar o Guardian para esta viagem avulsa. Cadastre-se por aqui:\n\n${registrationLink}`
            : `Olá! Para realizar seu cadastro no Guardian, acesse o link abaixo:\n\n${registrationLink}`;
        
        // 1. Tentar copiar para a área de transferência (Sempre tentamos o fallback se necessário)
        const copied = await copyToClipboard(shareText);
        
        if (copied) {
            toast({ 
                title: "Link Copiado!", 
                description: `O convite para ${type === 'avulso' ? 'Viagem Avulsa' : 'Mensalista'} foi copiado.` 
            });
        }

        // 2. Tentar API de Compartilhamento Nativo (Apenas se disponível e em contexto seguro)
        if (navigator.share && window.isSecureContext) {
            try {
                await navigator.share({ 
                    title: 'Convite Guardian', 
                    text: shareText, 
                    url: registrationLink 
                });
                onOpenChange(false);
                return;
            } catch (e) {
                // Usuário cancelou ou erro no compartilhamento nativo
            }
        }
        
        // 3. Fallback final: Abrir WhatsApp diretamente
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
        window.open(whatsappUrl, '_blank');
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Convidar Novos Pais</DialogTitle>
                    <DialogDescription>
                        Escolha o tipo de cadastro para gerar o link correto.
                    </DialogDescription>
                </DialogHeader>

                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                    <Alert className="bg-blue-500/10 border-blue-500/20 py-2">
                        <AlertCircle className="h-4 w-4 text-blue-500" />
                        <AlertDescription className="text-[10px] text-blue-600 font-medium">
                            Detectamos que você está em <strong>localhost</strong>. O link será convertido automaticamente para <strong>192.168.0.30</strong> para funcionar no celular do pai.
                        </AlertDescription>
                    </Alert>
                )}
                <div className="grid grid-cols-1 gap-4 py-4">
                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col items-center justify-center gap-1 border-primary/20 hover:border-primary/50 hover:bg-primary/5 group transition-all"
                        onClick={() => handleShare('mensalista')}
                    >
                        <UserCircle className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-bold">Pai Mensalista</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Contrato fixo mensal</div>
                    </Button>
                    <Button 
                        variant="outline" 
                        className="h-24 flex flex-col items-center justify-center gap-1 border-orange-500/20 hover:border-orange-500/50 hover:bg-orange-500/5 group transition-all"
                        onClick={() => handleShare('avulso')}
                    >
                        <Milestone className="h-7 w-7 text-orange-500 group-hover:scale-110 transition-transform" />
                        <div className="text-sm font-bold">Pai Avulso (Trip)</div>
                        <div className="text-[10px] text-muted-foreground uppercase">Sem contrato, cobrança por viagem</div>
                    </Button>
                </div>
                <DialogFooter className="text-[10px] text-muted-foreground text-center italic justify-center">
                    O link será copiado e você poderá enviar via WhatsApp.
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
