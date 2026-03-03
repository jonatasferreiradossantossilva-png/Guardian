
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

// --- FASE 1: SLIDES DE APRESENTAÇÃO (COMO FUNCIONA) ---
const introSlides = [
  {
    title: "Bem-vindo ao Futuro da sua Frota!",
    description: "O Guardian não é apenas um sistema de gestão, é uma inteligência que trabalha para você. Veja como transformamos burocracia em lucro em 3 passos.",
    icon: <Sparkles className="w-12 h-12" />,
    imageId: "onboarding-welcome"
  },
  {
    title: "1. O Link que Trabalha por Você",
    description: "Esqueça a digitação manual. Você envia um link pelo WhatsApp, o pai tira foto do documento e a nossa IA preenche tudo instantaneamente.",
    icon: <Share2 className="w-12 h-12" />,
    imageId: "onboarding-parent-link"
  },
  {
    title: "2. Triagem e Aprovação em 1 Clique",
    description: "Os dados chegam prontos na sua tela. Você revisa o endereço de embarque, define o valor da mensalidade e aprova. O contrato digital é enviado na hora.",
    icon: <ClipboardCheck className="w-12 h-12" />,
    imageId: "onboarding-approval"
  },
  {
    title: "3. Rotas Otimizadas por IA",
    description: "Com os alunos aprovados, nossa IA calcula a sequência perfeita de embarque para economizar km e combustível. Você vê a economia real no painel.",
    icon: <RouteIcon className="w-12 h-12" />,
    imageId: "onboarding-ai-routes"
  }
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
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20 shadow-2xl">
        
        {/* Header Visual */}
        <div className={cn(
            "p-0 flex flex-col items-center justify-center border-b transition-colors duration-500 overflow-hidden",
            view === 'presentation' ? "bg-primary/5 border-primary/10 h-64" : "bg-secondary/20 border-border h-40"
        )}>
            {view === 'presentation' && currentImageData ? (
                <div className="relative w-full h-full group">
                    <Image 
                        src={currentImageData.imageUrl} 
                        alt={currentImageData.description}
                        fill
                        className="object-cover"
                        data-ai-hint={currentImageData.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white p-2 rounded-full bg-primary/20 backdrop-blur-md border border-white/20 animate-in zoom-in duration-500">
                        {currentData.icon}
                    </div>
                </div>
            ) : view === 'checklist' ? (
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-background text-primary rounded-full border-2 border-primary/20 shadow-lg">
                        {currentData.icon}
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold tracking-widest text-[10px]">
                        FASE DE CONFIGURAÇÃO
                    </Badge>
                </div>
            ) : null}
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
            <div className="space-y-2 text-center min-h-[100px]">
                <DialogTitle className="text-xl font-bold tracking-tight">
                    {currentData.title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-relaxed px-2">
                    {currentData.description}
                </DialogDescription>
            </div>

            {/* Step Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <span>{view === 'presentation' ? "Apresentação" : "Implementação"}</span>
                    <span>{currentIndex + 1} de {view === 'presentation' ? introSlides.length : configSteps.length}</span>
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
                    {isLastSlide ? "Entendido, vamos configurar!" : "Continuar Apresentação"}
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
                  Pular Introdução
              </Button>
          ) : (
              !isLastChecklist ? (
                <Button size="sm" variant="ghost" onClick={handleNext} className="text-xs font-bold text-primary">
                    Próximo Passo <ArrowRight className="ml-2 h-3 w-3"/>
                </Button>
              ) : (
                <Button size="sm" onClick={handleClose} variant="ghost" className="text-xs font-bold text-green-600">
                    <Check className="mr-2 h-3 w-3" /> Finalizar Guia
                </Button>
              )
          )}
        </DialogFooter>

        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-white/70 hover:text-white" onClick={handleClose}>
             <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
