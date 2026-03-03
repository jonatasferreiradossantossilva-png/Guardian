'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, School, Users, GraduationCap, Truck, Car, Route as RouteIcon, X, Sparkles, Share2, ClipboardCheck } from 'lucide-react';

const steps = [
  {
    title: "Bem-vindo ao Guardian!",
    description: "Vamos configurar sua operação de forma inteligente. Em poucos passos, sua frota estará pronta para rodar com eficiência máxima.",
    icon: <Sparkles className="w-8 h-8" />,
    link: "/dashboard/management/schools",
    linkText: "Começar Configuração"
  },
  {
    title: "1. Cadastre as Escolas",
    description: "Sua primeira responsabilidade como gestor é definir os pontos de destino. Use nossa busca regionalizada para cadastrar escolas instantaneamente.",
    icon: <School className="w-8 h-8" />,
    link: "/dashboard/management/schools",
    linkText: "Configurar Escolas"
  },
  {
    title: "2. Convide os Pais",
    description: "Não perca tempo digitando dados! Compartilhe seu link exclusivo. Os pais realizam o cadastro via leitura automática de documentos (IA).",
    icon: <Share2 className="h-8 w-8" />,
    link: "/dashboard",
    linkText: "Copiar Link de Convite"
  },
  {
    title: "3. Triagem de Alunos",
    description: "Quando um pai termina o cadastro, ele aparece na sua lista de 'Solicitações'. Você revisa o endereço, define o valor e aprova com um clique.",
    icon: <ClipboardCheck className="w-8 h-8" />,
    link: "/dashboard/management/pending-registrations",
    linkText: "Ver Solicitações"
  },
  {
    title: "4. Cadastre seus Veículos",
    description: "Configure sua frota informando o modelo e a capacidade. Isso é essencial para a IA não sobrecarregar as rotas.",
    icon: <Truck className="w-8 h-8" />,
    link: "/dashboard/management/vehicles",
    linkText: "Gerenciar Veículos"
  },
  {
    title: "5. Cadastre os Motoristas",
    description: "Adicione sua equipe e associe cada motorista a um veículo. Eles receberão o acesso ao App do Motorista para iniciar as viagens.",
    icon: <Car className="w-8 h-8" />,
    link: "/dashboard/management/drivers",
    linkText: "Gerenciar Motoristas"
  },
  {
    title: "6. Crie sua Primeira Rota",
    description: "Junte motoristas, alunos e escolas. Nossa IA calculará a ordem perfeita para economizar quilometragem e tempo.",
    icon: <RouteIcon className="w-8 h-8" />,
    link: "/dashboard/management/routes",
    linkText: "Montar Itinerário"
  },
  {
    title: "Tudo Pronto!",
    description: "Sua infraestrutura está montada. Agora o Guardian cuidará da segurança das crianças e da saúde financeira da sua empresa.",
    icon: <Check className="w-8 h-8" />,
    link: "/dashboard",
    linkText: "Finalizar Guia"
  }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length - 1;
  const progress = (currentStep / totalSteps) * 100;
  const isLastStep = currentStep === totalSteps;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (!isLastStep) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            onClose();
            setTimeout(() => setCurrentStep(0), 300);
        }
    }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-primary/20">
        <div className="bg-primary/5 p-8 flex justify-center border-b border-primary/10">
            <div className="p-4 bg-background text-primary rounded-full border-2 border-primary/20 shadow-xl animate-in zoom-in duration-500">
              {step.icon}
            </div>
        </div>

        <div className="p-6 space-y-4">
            <DialogHeader>
                <DialogTitle className="text-center text-xl">{step.title}</DialogTitle>
                <DialogDescription className="text-center text-sm leading-relaxed px-2">
                    {step.description}
                </DialogDescription>
            </DialogHeader>

            <div className="py-2 space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    <span>{isFirstStep ? "Início" : isLastStep ? "Concluído" : `Passo ${currentStep} de ${totalSteps - 1}`}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-1.5" />
            </div>
            
            <Button asChild className="w-full h-12 text-base font-bold shadow-lg shadow-primary/20" onClick={isLastStep ? onClose : undefined}>
                <Link href={step.link}>{step.linkText}</Link>
            </Button>
        </div>

        <DialogFooter className="p-4 bg-muted/30 flex-row justify-between border-t gap-2 sm:gap-0">
          {!isFirstStep ? (
            <Button variant="ghost" size="sm" onClick={handlePrev} className="text-xs">
              <ArrowLeft className="mr-2 h-3 w-3"/> Voltar
            </Button>
          ) : <div />}
          
          {!isLastStep ? (
            <Button size="sm" onClick={handleNext} className="text-xs font-bold">
              Próximo <ArrowRight className="ml-2 h-3 w-3"/>
            </Button>
          ) : (
            <Button size="sm" onClick={onClose} variant="ghost" className="text-xs font-bold text-primary">
                Entendido!
            </Button>
          )}
        </DialogFooter>
         <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
             <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
