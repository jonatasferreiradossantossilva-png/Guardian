'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
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
  Truck, 
  Car, 
  Route as RouteIcon, 
  X, 
  Sparkles, 
  Share2, 
  ClipboardCheck,
  Smartphone,
  MousePointerClick,
  Zap,
  Play,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

// --- FASE 1: SLIDES DE APRESENTAÇÃO (COMO FUNCIONA) ---
const introSlides = [
  {
    title: "Bem-vindo ao Futuro da sua Frota!",
    description: "O Guardian não é apenas um sistema de gestão, é uma inteligência que trabalha para você. Veja como transformamos burocracia em lucro em 3 passos.",
    icon: <Sparkles className="w-12 h-12" />,
    image: (
        <div className="relative w-full h-40 bg-primary/10 rounded-xl flex items-center justify-center border-2 border-primary/20 overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-transparent to-transparent animate-pulse" />
            <div className="relative flex items-center gap-4">
                <div className="p-4 bg-background rounded-2xl shadow-xl border border-primary/20 rotate-[-6deg]">
                    <Smartphone className="text-primary h-8 w-8" />
                </div>
                <Zap className="text-yellow-500 h-6 w-6 animate-bounce" />
                <div className="p-4 bg-background rounded-2xl shadow-xl border border-primary/20 rotate-[6deg]">
                    <Zap className="text-primary h-8 w-8" />
                </div>
            </div>
        </div>
    )
  },
  {
    title: "1. O Link que Trabalha por Você",
    description: "Esqueça a digitação manual. Você envia um link pelo WhatsApp, o pai tira foto do documento e a nossa IA preenche tudo instantaneamente.",
    icon: <Share2 className="w-12 h-12" />,
    image: (
        <div className="relative w-full h-40 bg-secondary/30 rounded-xl flex items-center justify-center border-2 border-dashed border-muted-foreground/30 p-4">
            <div className="flex flex-col items-center gap-2">
                <div className="bg-background p-3 rounded-lg border shadow-sm flex items-center gap-2 w-48 animate-in slide-in-from-left duration-700">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="h-2 w-full bg-muted rounded" />
                </div>
                <div className="bg-primary/20 p-2 rounded-md border border-primary/30 flex items-center gap-2 w-56 animate-in slide-in-from-right delay-300 duration-700">
                    <div className="h-2 w-full bg-primary/40 rounded" />
                    <MousePointerClick className="h-4 w-4 text-primary" />
                </div>
            </div>
        </div>
    )
  },
  {
    title: "2. Triagem e Aprovação em 1 Clique",
    description: "Os dados chegam prontos na sua tela. Você revisa o endereço de embarque, define o valor da mensalidade e aprova. O contrato digital é enviado na hora.",
    icon: <ClipboardCheck className="w-12 h-12" />,
    image: (
        <div className="relative w-full h-40 bg-primary/5 rounded-xl flex items-center justify-center border-2 border-primary/10">
            <div className="space-y-2">
                <div className="h-8 w-40 bg-background border rounded-full flex items-center px-3 gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Aprovar Aluno</span>
                </div>
                <div className="h-8 w-40 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg animate-pulse">
                    GERAR CONTRATO
                </div>
            </div>
        </div>
    )
  },
  {
    title: "3. Rotas Otimizadas por IA",
    description: "Com os alunos aprovados, nossa IA calcula a sequência perfeita de embarque para economizar km e combustível. Você vê a economia real no painel.",
    icon: <RouteIcon className="w-12 h-12" />,
    image: (
        <div className="relative w-full h-40 bg-secondary/20 rounded-xl overflow-hidden border-2 border-primary/10">
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-0.5 bg-primary/30 relative">
                    <div className="absolute top-1/2 left-0 w-1/2 h-1 bg-primary -translate-y-1/2 rounded-full animate-[shimmer_2s_infinite]" />
                    <BusIcon className="absolute left-1/2 top-[-12px] h-6 w-6 text-primary fill-background" />
                </div>
            </div>
        </div>
    )
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20 shadow-2xl">
        
        {/* Header Visual */}
        <div className={cn(
            "p-8 flex flex-col items-center justify-center border-b transition-colors duration-500",
            view === 'presentation' ? "bg-primary/5 border-primary/10" : "bg-secondary/20 border-border"
        )}>
            {view === 'presentation' ? (
                <div className="w-full space-y-6">
                    <div className="flex justify-center">
                        <div className="p-4 bg-background text-primary rounded-full border-2 border-primary/20 shadow-xl animate-in zoom-in duration-500">
                            {currentData.icon}
                        </div>
                    </div>
                    {currentIndex >= 0 && (currentData as any).image}
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

        <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={handleClose}>
             <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function BusIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M8 6v6" />
        <path d="M15 6v6" />
        <path d="M2 12h19.6" />
        <path d="M18 18h3s.5-1.7.8-3.6c.1-.9-.7-1.4-1.4-1.4H3.6c-.7 0-1.5.5-1.4 1.4.3 1.9.8 3.6.8 3.6h3" />
        <circle cx="7" cy="18" r="2" />
        <path d="M9 18h5" />
        <circle cx="17" cy="18" r="2" />
      </svg>
    )
}
