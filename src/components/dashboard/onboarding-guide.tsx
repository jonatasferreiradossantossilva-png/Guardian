
'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  School, 
  Users, 
  Car, 
  Route as RouteIcon, 
  X, 
  Sparkles, 
  Share2, 
  ClipboardCheck,
  Smartphone,
  MessageSquare,
  Search,
  DollarSign,
  HeartPulse,
  FileText,
  MousePointerClick,
  Navigation
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- FASE 1: SLIDES DE APRESENTAÇÃO (JORNADA COMPLETA) ---
const introSlides = [
  { title: "1. Convite WhatsApp", description: "O gestor compartilha o link exclusivo de cadastro com o pai via WhatsApp.", icon: <Share2 />, imageId: "ob-1-invite" },
  { title: "2. Link Recebido", description: "O pai recebe o convite e clica para iniciar o processo sem burocracia.", icon: <MessageSquare />, imageId: "ob-2-received" },
  { title: "3. Boas-vindas", description: "Interface moderna e amigável para o pai iniciar o cadastro.", icon: <Smartphone />, imageId: "ob-3-welcome" },
  { title: "4. Leitura via IA", description: "O pai tira foto do RG ou CNH e nossa IA lê todos os dados instantaneamente.", icon: <Sparkles />, imageId: "ob-4-scan" },
  { title: "5. Revisão de Dados", description: "Os dados extraídos pela IA são revisados pelo pai para garantir precisão.", icon: <ClipboardCheck />, imageId: "ob-5-review" },
  { title: "6. Endereço de Embarque", description: "Preenchimento do local exato onde a criança aguardará a van.", icon: <MapPinIcon />, imageId: "ob-6-address" },
  { title: "7. Escola de Destino", description: "Seleção da escola através da nossa base nacional inteligente.", icon: <School />, imageId: "ob-7-school" },
  { title: "8. Financeiro", description: "O pai sugere o melhor dia de vencimento para seu planejamento.", icon: <DollarSign />, imageId: "ob-8-finance" },
  { title: "9. Alertas de Saúde", description: "Informações críticas de saúde que aparecerão para o motorista no embarque.", icon: <HeartPulse />, imageId: "ob-9-health" },
  { title: "10. Cadastro Finalizado", description: "O pai recebe a confirmação e os dados voam para o gestor.", icon: <Check />, imageId: "ob-10-done-parent" },
  { title: "11. Notificação Gestor", description: "O gestor é avisado que há uma nova solicitação pronta para triagem.", icon: <Sparkles />, imageId: "ob-11-notification" },
  { title: "12. Área de Triagem", description: "Todos os cadastros prontos em uma lista organizada para o gestor.", icon: <Search />, imageId: "ob-12-triagem" },
  { title: "13. Revisão Triagem", description: "O gestor revisa os dados e a localização GPS capturada pela IA.", icon: <MapPinIcon />, imageId: "ob-13-review-triagem" },
  { title: "14. Valor e Vencimento", description: "O gestor define o valor da mensalidade e confirma o dia de pagamento.", icon: <DollarSign />, imageId: "ob-14-set-price" },
  { title: "15. Aprovação Final", description: "Com um clique, o aluno é integrado à frota e o contrato é gerado.", icon: <MousePointerClick />, imageId: "ob-15-approve" },
  { title: "16. Contrato Digital", description: "O contrato com validade jurídica é gerado automaticamente.", icon: <FileText />, imageId: "ob-16-contract" },
  { title: "17. Aceite do Pai", description: "O pai recebe e aceita o contrato direto pelo app. Zero papel.", icon: <Check />, imageId: "ob-17-accept" },
  { title: "18. Cadastro de Rota", description: "O gestor vincula alunos, escolas e motoristas em um itinerário.", icon: <RouteIcon />, imageId: "ob-18-route-setup" },
  { title: "19. Otimização IA", description: "A IA calcula a menor distância, economizando combustível e tempo.", icon: <Sparkles />, imageId: "ob-19-optimize" },
  { title: "20. Rota Ativa", description: "Van na rua com tracking real e segurança total para as crianças.", icon: <Navigation />, imageId: "ob-20-live" }
];

// --- FASE 2: PASSOS DO CHECKLIST DE CONFIGURAÇÃO ---
const configSteps = [
  {
    title: "Infraestrutura: Escolas",
    description: "Cadastre os destinos. Use nossa busca regionalizada para preencher endereço e GPS em segundos.",
    icon: <School className="w-8 h-8" />,
    link: "/dashboard/management/schools",
    linkText: "Configurar Escolas"
  },
  {
    title: "Crescimento: Convite",
    description: "Copie seu link exclusivo e envie para os pais. Deixe que eles façam o trabalho pesado de cadastro.",
    icon: <Share2 className="w-8 h-8" />,
    link: "/dashboard",
    linkText: "Copiar Link de Convite"
  },
  {
    title: "Gestão: Triagem",
    description: "Revise as solicitações pendentes e integre os novos alunos à sua frota operacional.",
    icon: <ClipboardCheck className="w-8 h-8" />,
    link: "/dashboard/management/pending-registrations",
    linkText: "Ver Solicitações"
  },
  {
    title: "Equipe: Motoristas",
    description: "Adicione sua equipe e vincule cada motorista a um veículo com capacidade definida.",
    icon: <Car className="w-8 h-8" />,
    link: "/dashboard/management/drivers",
    linkText: "Gerenciar Equipe"
  },
  {
    title: "Operação: Montar Rotas",
    description: "Junte tudo e deixe a IA calcular a ordem perfeita. Sua frota está pronta para rodar!",
    icon: <RouteIcon className="w-8 h-8" />,
    link: "/dashboard/management/routes",
    linkText: "Criar Itinerário"
  }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [view, setView] = useState<'presentation' | 'checklist'>('presentation');
  const [currentIndex, setCurrentIndex] = useState(0);

  const isLastSlide = view === 'presentation' && currentIndex === introSlides.length - 1;
  const isFirstSlide = currentIndex === 0;
  const isLastChecklist = view === 'checklist' && currentIndex === configSteps.length - 1;

  const handleNext = () => {
    if (view === 'presentation') {
      if (isLastSlide) {
        setView('checklist');
        setCurrentIndex(0);
      } else {
        setCurrentIndex(prev => prev + 1);
      }
    } else {
      if (!isLastChecklist) {
        setCurrentIndex(prev => prev + 1);
      } else {
        handleClose();
      }
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (view === 'checklist') {
      setView('presentation');
      setCurrentIndex(introSlides.length - 1);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setView('presentation');
      setCurrentIndex(0);
    }, 300);
  };

  const currentData = view === 'presentation' ? introSlides[currentIndex] : configSteps[currentIndex];
  const totalSteps = view === 'presentation' ? introSlides.length : configSteps.length;
  const progress = view === 'presentation' 
    ? ((currentIndex + 1) / introSlides.length) * 50 
    : 50 + ((currentIndex + 1) / configSteps.length) * 50;

  const currentImageData = useMemo(() => {
    if (view !== 'presentation') return null;
    const slide = introSlides[currentIndex];
    return PlaceHolderImages.find(img => img.id === slide.imageId);
  }, [view, currentIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-primary/20 shadow-2xl">
        
        {/* Header Visual com Imagem do Processo */}
        <div className={cn(
            "p-0 flex flex-col items-center justify-center border-b transition-all duration-500 overflow-hidden",
            view === 'presentation' ? "bg-black h-[350px]" : "bg-secondary/20 h-40"
        )}>
            {view === 'presentation' && currentImageData ? (
                <div className="relative w-full h-full group">
                    <Image 
                        src={currentImageData.imageUrl} 
                        alt={currentImageData.description}
                        fill
                        className="object-contain bg-black"
                        data-ai-hint={currentImageData.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-3 text-white">
                        <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg">
                            {currentData.icon}
                        </div>
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-70">Passo {currentIndex + 1}</p>
                            {/* FIXED: DialogTitle is required for accessibility */}
                            <DialogTitle className="text-lg font-bold border-none shadow-none bg-transparent p-0 text-white">
                                {currentData.title}
                            </DialogTitle>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-background text-primary rounded-full border-2 border-primary/20 shadow-lg">
                        {currentData.icon}
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold tracking-widest text-[10px]">
                        FASE DE CONFIGURAÇÃO
                    </Badge>
                </div>
            )}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
            <div className="space-y-2 min-h-[80px]">
                {/* FIXED: Ensuring DialogTitle is always present for accessibility */}
                {view === 'checklist' ? (
                    <DialogTitle className="text-xl font-bold tracking-tight">
                        {currentData.title}
                    </DialogTitle>
                ) : (
                    /* Already rendered in header image area for presentation view, 
                       but we provide an sr-only version if the header is not considered enough 
                       by some screen readers or if the component logic requires consistent structure.
                    */
                    <DialogTitle className="sr-only">
                        {currentData.title}
                    </DialogTitle>
                )}
                <DialogDescription className="text-sm leading-relaxed text-foreground">
                    {currentData.description}
                </DialogDescription>
            </div>

            {/* Step Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <span>{view === 'presentation' ? "Jornada Inteligente" : "Implementação Prática"}</span>
                    <span>{currentIndex + 1} de {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
            
            {/* Action Button */}
            {view === 'checklist' ? (
                <Button asChild className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20">
                    <Link href={(currentData as any).link}>
                        {(currentData as any).linkText}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            ) : (
                <Button className="w-full h-14 text-base font-bold" onClick={handleNext}>
                    {isLastSlide ? "Entendido, vamos configurar!" : "Próximo Passo"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            )}
        </div>

        {/* Footer Navigation */}
        <DialogFooter className="p-4 bg-muted/30 flex-row justify-between border-t gap-2 sm:gap-0">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handlePrev} 
            disabled={view === 'presentation' && isFirstSlide}
            className="text-xs"
          >
            <ArrowLeft className="mr-2 h-3 w-3"/> Voltar
          </Button>
          
          {view === 'presentation' ? (
              <Button variant="link" size="sm" onClick={() => { setView('checklist'); setCurrentIndex(0); }} className="text-xs text-muted-foreground">
                  Pular para Configuração
              </Button>
          ) : (
              !isLastChecklist ? (
                <Button size="sm" variant="ghost" onClick={handleNext} className="text-xs font-bold text-primary">
                    Próximo <ArrowRight className="ml-2 h-3 w-3"/>
                </Button>
              ) : (
                <Button size="sm" onClick={handleClose} variant="ghost" className="text-xs font-bold text-green-600">
                    <Check className="mr-2 h-3 w-3" /> Finalizar Guia
                </Button>
              )
          )}
        </DialogFooter>

        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-white/70 hover:text-white z-50" onClick={handleClose}>
             <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function MapPinIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  }
