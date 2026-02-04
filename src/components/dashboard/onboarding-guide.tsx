'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Check, School, Users, GraduationCap, Truck, Car, Route as RouteIcon, X } from 'lucide-react';

const steps = [
  {
    title: "Bem-vindo ao Guardian!",
    description: "Vamos configurar sua operação. Leva apenas alguns minutos. Siga os passos para começar a usar a plataforma.",
    icon: <School className="w-8 h-8" />,
    link: "/dashboard/management/schools",
    linkText: "Cadastrar Escolas"
  },
  {
    title: "Cadastre os Pais",
    description: "Adicione os pais ou responsáveis pelos alunos. Você precisará deles para associar aos alunos no próximo passo.",
    icon: <Users className="w-8 h-8" />,
    link: "/dashboard/management/parents",
    linkText: "Cadastrar Pais"
  },
  {
    title: "Cadastre os Alunos",
    description: "Agora, adicione os alunos, informando a qual escola e responsável eles pertencem.",
    icon: <GraduationCap className="w-8 h-8" />,
    link: "/dashboard/management/students",
    linkText: "Cadastrar Alunos"
  },
  {
    title: "Cadastre seus Veículos",
    description: "Adicione os veículos da sua frota, especificando o modelo e a capacidade de cada um.",
    icon: <Truck className="w-8 h-8" />,
    link: "/dashboard/management/vehicles",
    linkText: "Cadastrar Veículos"
  },
  {
    title: "Cadastre os Motoristas",
    description: "Adicione os motoristas e, se desejar, já os associe a um veículo da sua frota.",
    icon: <Car className="w-8 h-8" />,
    link: "/dashboard/management/drivers",
    linkText: "Cadastrar Motoristas"
  },
  {
    title: "Crie sua Primeira Rota",
    description: "Para finalizar, crie uma rota juntando um motorista e os alunos que ele irá transportar.",
    icon: <RouteIcon className="w-8 h-8" />,
    link: "/dashboard/management/routes",
    linkText: "Criar Rota"
  },
  {
    title: "Configuração Concluída!",
    description: "Você completou os passos essenciais! Agora você pode começar a otimizar suas rotas, gerenciar o financeiro e muito mais.",
    icon: <Check className="w-8 h-8" />,
    link: "/dashboard",
    linkText: "Ir para o Painel"
  }
];

interface OnboardingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OnboardingGuide({ isOpen, onClose }: OnboardingGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const totalSteps = steps.length - 1;
  const progress = (currentStep / (totalSteps - 1)) * 100;
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
  
  // Reset step when dialog is closed/opened
  if (!isOpen && currentStep !== 0) {
      setCurrentStep(0);
  }

  const step = steps[currentStep];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 text-primary rounded-full border-2 border-primary/20">
              {step.icon}
            </div>
          </div>
          <DialogTitle className="text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center px-4">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 px-6">
            { !isLastStep && (
                <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{currentStep > 0 ? `Passo ${currentStep}/${totalSteps - 1}`: 'Início'}</span>
                    <Progress value={progress} />
                </div>
            )}
        </div>
        
        {step.link && (
            <Button asChild className="w-full" onClick={isLastStep ? onClose : undefined}>
                <Link href={step.link}>{step.linkText}</Link>
            </Button>
        )}

        <DialogFooter className="flex-row justify-between pt-4">
          {!isFirstStep ? (
            <Button variant="outline" onClick={handlePrev}>
              <ArrowLeft className="mr-2 h-4 w-4"/> Anterior
            </Button>
          ) : <div></div> /* Empty div to keep Next button on the right */}
          
          {!isLastStep ? (
            <Button onClick={handleNext}>
              Próximo <ArrowRight className="ml-2 h-4 w-4"/>
            </Button>
          ) : null}
        </DialogFooter>
         <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={onClose}>
             <X className="h-4 w-4" />
        </Button>
      </DialogContent>
    </Dialog>
  );
}
