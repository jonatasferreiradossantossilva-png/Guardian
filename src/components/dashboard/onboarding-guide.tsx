
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
  Truck,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useDataCollection } from '@/hooks/use-data';

const introSlides = [
  { 
    title: "1. Prepare o Palco", 
    description: "Cadastre suas escolas usando nosso Big Data e defina sua frota de vans e equipe operacional (Motoristas e Monitores).", 
    icon: <Truck />, 
    imageId: "ob-7-address" 
  },
  { 
    title: "2. Escala Inteligente", 
    description: "Envie o link público para os pais. Eles fazem o cadastro digital e validam o GPS do embarque sem que você precise digitar nada.", 
    icon: <Smartphone />, 
    imageId: "ob-4-scan" 
  },
  { 
    title: "3. Logística em Rota", 
    description: "O sistema calcula a melhor ordem de paradas. Você economiza combustível e o pai recebe alertas de proximidade automáticos.", 
    icon: <Sparkles />, 
    imageId: "ob-16-gps" 
  }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [view, setView] = useState<'presentation' | 'checklist'>('presentation');
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: schools } = useDataCollection('schools');
  const { data: drivers } = useDataCollection('drivers');
  const { data: vehicles } = useDataCollection('vehicles');
  const { data: routes } = useDataCollection('routes');
  const { data: pending } = useDataCollection('pending_registrations');
  const { data: users } = useDataCollection('users');

  const monitors = useMemo(() => users?.filter(u => u.profile === 'monitor') || [], [users]);

  const configSteps = useMemo(() => [
    {
      title: "Infraestrutura: Escolas",
      description: "Cadastre os destinos. Use nossa busca regionalizada para preencher endereço e GPS em segundos.",
      icon: <School className="w-8 h-8" />,
      link: "/dashboard/management/schools",
      linkText: "Configurar Escolas",
      isDone: (schools?.length || 0) > 0
    },
    {
      title: "Frota: Veículos",
      description: "Cadastre as vans da sua frota e defina a capacidade de passageiros de cada uma.",
      icon: <Truck className="w-8 h-8" />,
      link: "/dashboard/management/vehicles",
      linkText: "Gerenciar Veículos",
      isDone: (vehicles?.length || 0) > 0
    },
    {
      title: "Equipe: Motoristas & Monitores",
      description: "Adicione seu time operacional. Lembre-se: o monitor é essencial para a segurança no embarque.",
      icon: <Car className="w-8 h-8" />,
      link: "/dashboard/management/drivers",
      linkText: "Cadastrar Equipe",
      isDone: (drivers?.length || 0) > 0 && monitors.length > 0
    },
    {
      title: "Ativação: Convidar Pais",
      description: "Copie seu link exclusivo e envie para os pais. Deixe que o sistema do Guardian faça o cadastro para você.",
      icon: <Share2 className="w-8 h-8" />,
      link: "/dashboard",
      linkText: "Copiar Link de Convite",
      isDone: false 
    },
    {
      title: "Inteligência: Triagem & Rotas",
      description: "Aprove os alunos que chegaram via auto-cadastro e deixe o otimizador criar o itinerário perfeito para o motorista.",
      icon: <RouteIcon className="w-8 h-8" />,
      link: "/dashboard/management/routes",
      linkText: "Criar Itinerário Inteligente",
      isDone: (routes?.length || 0) > 0
    }
  ], [schools, drivers, vehicles, routes, monitors]);

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

  const onUpdateProfile = async (u: any) => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else if (view === 'checklist') {
      setView('presentation');
      setCurrentIndex(introSlides.length - 1);
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
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && handleClose()}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border-primary/20 shadow-2xl">
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
                        unoptimized
                        className="object-contain"
                        data-ai-hint={currentImageData.imageHint}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-6 flex items-center gap-3 text-white">
                        <div className="p-3 rounded-full bg-primary text-primary-foreground shadow-lg">
                            {currentData.icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Apresentação</p>
                            <DialogTitle className="text-xl font-bold border-none shadow-none bg-transparent p-0 text-white">
                                {currentData.title}
                            </DialogTitle>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-background text-primary rounded-full border-2 border-primary/20 shadow-lg relative">
                        {currentData.icon}
                        {(currentData as any).isDone && (
                            <div className="absolute -top-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-background">
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold tracking-widest text-[10px]">
                        FASE DE CONFIGURAÇÃO
                    </Badge>
                    <DialogTitle className="sr-only">{currentData.title}</DialogTitle>
                </div>
            )}
        </div>

        <div className="p-6 space-y-6">
            <div className="space-y-2 min-h-[80px]">
                {view === 'checklist' && (
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-bold tracking-tight">
                            {currentData.title}
                        </h3>
                        {(currentData as any).isDone && <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] h-5">CONCLUÍDO</Badge>}
                    </div>
                )}
                <DialogDescription className="text-sm leading-relaxed text-foreground">
                    {currentData.description}
                </DialogDescription>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <span>{view === 'presentation' ? "O Conceito" : "Execução"}</span>
                    <span>{currentIndex + 1} de {totalSteps}</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
            
            {view === 'checklist' ? (
                <Button asChild className="w-full h-14 text-base font-bold shadow-lg shadow-primary/20">
                    <Link href={(currentData as any).link}>
                        {(currentData as any).linkText}
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                </Button>
            ) : (
                <Button className="w-full h-14 text-base font-bold" onClick={handleNext}>
                    {isLastSlide ? "Iniciar Configuração" : "Próximo"}
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            )}
        </div>

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
