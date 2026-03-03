
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
  Navigation,
  CheckCircle2,
  User,
  MapPin,
  GraduationCap
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useMockCollection } from '@/hooks/use-mock-data';

const introSlides = [
  { title: "1. Convite WhatsApp", description: "O gestor compartilha o link exclusivo de cadastro com o pai via WhatsApp.", icon: <Share2 />, imageId: "ob-1-invite" },
  { title: "2. Link Recebido", description: "O pai recebe o convite e clica para iniciar o processo sem burocracia.", icon: <MessageSquare />, imageId: "ob-2-received" },
  { title: "3. Boas-vindas", description: "Interface moderna e amigável para o pai iniciar o cadastro.", icon: <Smartphone />, imageId: "ob-3-welcome" },
  { title: "4. Leitura via IA", description: "O pai tira foto do documento e nossa IA lê todos os dados instantaneamente.", icon: <Sparkles />, imageId: "ob-4-scan" },
  { title: "5. Revisão Identidade", description: "Primeira etapa do formulário: confirmação dos dados pessoais extraídos pela IA.", icon: <User />, imageId: "ob-5-review" },
  { title: "6. Local de Embarque", description: "O pai define o ponto exato de coleta no mapa para evitar erros de navegação.", icon: <MapPin />, imageId: "ob-6-address" },
  { title: "7. Escola de Destino", description: "Seleção da instituição através da nossa base proprietária de escolas ativas.", icon: <School />, imageId: "ob-7-school" },
  { title: "8. Série e Turma", description: "Organização escolar para garantir que o monitor saiba exatamente onde desembarcar.", icon: <GraduationCap />, imageId: "ob-8-class" },
  { title: "9. Plano Financeiro", description: "Configuração do vencimento e preferências de cobrança do responsável.", icon: <DollarSign />, imageId: "ob-9-finance" },
  { title: "10. Conferência Geral", description: "Revisão completa do cadastro antes de avançar para a parte de saúde.", icon: <ClipboardCheck />, imageId: "ob-10-summary" },
  { title: "11. Parte Médica", description: "Alertas de saúde críticos que aparecerão para o motorista no momento do embarque.", icon: <HeartPulse />, imageId: "ob-11-health" },
  { title: "12. Cadastro Enviado", description: "O pai finaliza o fluxo e os dados são enviados instantaneamente para o gestor.", icon: <Check />, imageId: "ob-12-done" },
  { title: "13. Notificação Gestor", description: "O admin recebe um alerta push informando que há uma nova solicitação pendente.", icon: <Smartphone />, imageId: "ob-13-notification" },
  { title: "14. Lista de Triagem", description: "O gestor visualiza todas as solicitações prontas para aprovação comercial.", icon: <Search />, imageId: "ob-14-triage" },
  { title: "15. Validação GPS", description: "A IA valida a viabilidade da rota comparando o endereço com a frota atual.", icon: <Navigation />, imageId: "ob-15-gps" },
  { title: "16. Mensalidade", description: "Definição do valor final e geração automática do contrato digital.", icon: <DollarSign />, imageId: "ob-16-price" },
  { title: "17. Aceite do Contrato", description: "O pai recebe o documento e assina digitalmente pelo próprio celular.", icon: <FileText />, imageId: "ob-17-sign" },
  { title: "18. Montagem de Rota", description: "Vínculo do novo aluno a um motorista e veículo com capacidade disponível.", icon: <RouteIcon />, imageId: "ob-18-itinerary" },
  { title: "19. Otimização IA", description: "O motor de logística recalcula a melhor sequência para economizar combustível.", icon: <Sparkles />, imageId: "ob-19-optimization" },
  { title: "20. Rota Ativa", description: "Início da operação com tracking real e segurança garantida pelo Guardian.", icon: <Car />, imageId: "ob-20-live" }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [view, setView] = useState<'presentation' | 'checklist'>('presentation');
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: schools } = useMockCollection('schools');
  const { data: drivers } = useMockCollection('drivers');
  const { data: routes } = useMockCollection('routes');
  const { data: pending } = useMockCollection('pending_registrations');

  const configSteps = useMemo(() => [
    {
      title: "Infraestrutura: Escolas",
      description: "Cadastre os destinos. Use nossa busca regionalizada para preencher endereço e GPS em segundos.",
      icon: <School className="w-8 h-8" />,
      link: "/dashboard/management/schools",
      linkText: "Configurar Escolas",
      isDone: schools && schools.length > 0
    },
    {
      title: "Crescimento: Convite",
      description: "Copie seu link exclusivo e envie para os pais. Deixe que eles façam o trabalho pesado de cadastro.",
      icon: <Share2 className="w-8 h-8" />,
      link: "/dashboard",
      linkText: "Copiar Link de Convite",
      isDone: false 
    },
    {
      title: "Gestão: Triagem",
      description: "Revise as solicitações pendentes e integre os novos alunos à sua frota operacional.",
      icon: <ClipboardCheck className="w-8 h-8" />,
      link: "/dashboard/management/pending-registrations",
      linkText: "Ver Solicitações",
      isDone: pending && pending.length === 0 && (schools?.length || 0) > 0
    },
    {
      title: "Equipe: Motoristas",
      description: "Adicione sua equipe e vincule cada motorista a um veículo com capacidade definida.",
      icon: <Car className="w-8 h-8" />,
      link: "/dashboard/management/drivers",
      linkText: "Gerenciar Equipe",
      isDone: drivers && drivers.length > 0
    },
    {
      title: "Operação: Montar Rotas",
      description: "Junte tudo e deixe a IA calcular a ordem perfeita. Sua frota está pronta para rodar!",
      icon: <RouteIcon className="w-8 h-8" />,
      link: "/dashboard/management/routes",
      linkText: "Criar Itinerário",
      isDone: routes && routes.length > 0
    }
  ], [schools, drivers, routes, pending]);

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
                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Jornada Guardian • Passo {currentIndex + 1}</p>
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
                    <span>{view === 'presentation' ? "Apresentação do Produto" : "Implementação Prática"}</span>
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
                    {isLastSlide ? "Entendido, vamos configurar!" : "Próximo Passo"}
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
