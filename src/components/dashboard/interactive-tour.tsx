'use client';

import { useState, useEffect, useMemo } from 'react';
import { Joyride, STATUS, ACTIONS, EVENTS } from 'react-joyride';
import type { Step } from 'react-joyride';
import { useRouter, usePathname } from 'next/navigation';
import { useDataDoc, useData } from '@/hooks/use-data';
import { GESTOR_STEPS, AUTONOMO_STEPS } from './onboarding-steps';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Sparkles, Play } from 'lucide-react';

const JoyrideComponent = Joyride as any;

export function InteractiveTour() {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const { updateDoc } = useData();

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Load user session
  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    }
    setIsClient(true);
  }, []);

  const { data: user } = useDataDoc('users', currentUserId);

  // Check if onboarding is completed or can run
  const hasCompletedOnboarding = useMemo(() => {
    if (!isClient) return true;
    const localCompleted = localStorage.getItem('guardian_onboarding_completed') === 'true';
    const dbCompleted = user?.onboardingCompleted === true;
    return localCompleted || dbCompleted;
  }, [isClient, user]);

  // Determine current profile steps
  const steps = useMemo(() => {
    if (!user) return [];
    if (user.profile === 'gestor') return GESTOR_STEPS;
    if (user.profile === 'motorista') return AUTONOMO_STEPS;
    return [];
  }, [user]);

  // Control start of the tour
  useEffect(() => {
    if (isClient && user && steps.length > 0 && !hasCompletedOnboarding) {
      // Start tour if not completed, with a small timeout to let Next.js completely paint the DOM
      const timer = setTimeout(() => {
        const savedStep = localStorage.getItem('guardian_onboarding_step');
        const parsedStep = savedStep ? parseInt(savedStep, 10) : 0;
        setStepIndex(parsedStep < steps.length ? parsedStep : 0);
        setRun(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isClient, user, steps, hasCompletedOnboarding, pathname]);

  // Force restart onboarding trigger (custom event listener)
  useEffect(() => {
    if (!isClient) return;

    const handleRestartOnboarding = async () => {
      localStorage.removeItem('guardian_onboarding_completed');
      localStorage.setItem('guardian_onboarding_step', '0');
      
      if (currentUserId) {
        try {
          await updateDoc('users', currentUserId, { onboardingCompleted: false });
        } catch (e) {
          console.error("Erro ao resetar onboarding no banco:", e);
        }
      }

      setStepIndex(0);
      setRun(true);
      toast({
        title: "Tour Iniciado!",
        description: "Siga os balões flutuantes para configurar seu Guardian.",
      });
    };

    window.addEventListener('guardian:restart-onboarding', handleRestartOnboarding);
    return () => {
      window.removeEventListener('guardian:restart-onboarding', handleRestartOnboarding);
    };
  }, [isClient, toast, currentUserId, updateDoc]);

  if (!isClient) return null;

  const runTour = run && !!user && steps.length > 0;

  const handleJoyrideCallback = async (data: any) => {
    const { action, index, status, type } = data;

    // Sincronizar passo atual no localStorage para persistência de recarregamento
    // Apenas avançamos na conclusão real do passo (STEP_AFTER), não em TARGET_NOT_FOUND, para evitar pulos acidentais
    if (type === EVENTS.STEP_AFTER) {
      const nextIndex = action === ACTIONS.PREV ? index - 1 : index + 1;
      localStorage.setItem('guardian_onboarding_step', nextIndex.toString());

      const cleanPath = pathname.replace(/\/$/, "");
      const isDashboardHome = cleanPath === '/dashboard' || cleanPath === '/dashboard/overview';
      const willRedirect = isDashboardHome && action === ACTIONS.NEXT;

      if (willRedirect) {
        setRun(false); // Pausar o tour para limpar instantaneamente o overlay antes da navegação!
        
        if (user && user.profile === 'gestor') {
          // Passos de redirect do Gestor
          if (index === 0) {
            router.push('/dashboard/management/company');
            toast({
              title: "Trilho de Trem Ativo 🚂",
              description: "Preencha o perfil da sua empresa e clique em salvar para retornar ao fluxo.",
            });
          } else if (index === 1) {
            router.push('/dashboard/management/schools');
            toast({
              title: "Configurando Escolas 🏫",
              description: "Busque e adicione uma escola na sua área de atendimento.",
            });
          } else if (index === 2) {
            router.push('/dashboard/management/vehicles');
            toast({
              title: "Gerenciando Frota 🚐",
              description: "Adicione seu primeiro veículo (van, ônibus ou microônibus).",
            });
          } else if (index === 3) {
            router.push('/dashboard/management/drivers');
            toast({
              title: "Adicionando Equipe 👥",
              description: "Cadastre um motorista e um monitor para a operação.",
            });
          } else if (index === 4) {
            router.push('/dashboard/management/routes');
            toast({
              title: "Montando Rotas 🗺️",
              description: "Crie o primeiro trajeto automatizado ligando motorista, van e alunos.",
            });
          }
        } else if (user && user.profile === 'motorista') {
          // Passos de redirect do Autônomo
          if (index === 0) {
            router.push('/dashboard/management/vehicles');
            toast({
              title: "Sua Van 🚐",
              description: "Cadastre a van que você utiliza para fazer os trajetos.",
            });
          } else if (index === 1) {
            router.push('/dashboard'); // Redireciona o autônomo de volta para o dashboard inicial para ver o botão de compartilhar link!
            toast({
              title: "Compartilhe o Link 🔗",
              description: "Retornamos ao painel inicial. Envie seu link exclusivo para os pais pelo WhatsApp!",
            });
          }
        }
      } else {
        // Se NÃO há redirecionamento, atualizamos o estado local de stepIndex normalmente na página corrente
        setStepIndex(nextIndex);
      }
    }

    // Fechamento ou cancelamento do Onboarding
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false);
      localStorage.setItem('guardian_onboarding_completed', 'true');
      localStorage.setItem('guardian_onboarding_step', '0');

      if (currentUserId) {
        try {
          updateDoc('users', currentUserId, { onboardingCompleted: true });
        } catch (e) {
          console.error("Erro ao salvar progresso do onboarding no banco:", e);
        }
      }

      toast({
        title: status === STATUS.FINISHED ? "Parabéns! 🎉" : "Tour Ocultado",
        description: status === STATUS.FINISHED 
          ? "Você completou as etapas críticas do setup! Agora seu Guardian está pronto." 
          : "Você pode reativar este guia a qualquer momento na barra lateral.",
      });
    }
  };

  return (
    <JoyrideComponent
      callback={handleJoyrideCallback}
      continuous
      run={runTour}
      stepIndex={stepIndex}
      steps={steps}
      showSkipButton
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Finalizar Tour',
        next: 'Próximo',
        skip: 'Pular Tour',
      }}
      styles={{
        options: {
          arrowColor: 'rgba(23, 23, 23, 0.95)',
          backgroundColor: 'rgba(23, 23, 23, 0.95)',
          overlayColor: 'rgba(0, 0, 0, 0.65)',
          primaryColor: '#0ea5e9', // Vibrant Sky Blue primary
          textColor: '#f8fafc', // Light slate text
          zIndex: 10000,
        },
        tooltipContainer: {
          textAlign: 'left',
          fontFamily: 'inherit',
        },
        tooltipTitle: {
          fontSize: '15px',
          fontWeight: 'bold',
          color: '#ffffff',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '13px',
          color: '#cbd5e1',
          lineHeight: '1.6',
        },
        buttonNext: {
          backgroundColor: '#0ea5e9',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 'black',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderRadius: '8px',
          padding: '10px 16px',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
        },
        buttonBack: {
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: 'bold',
          marginRight: '12px',
        },
        buttonSkip: {
          color: '#ef4444', // Red button skip to be clean
          fontSize: '11px',
          fontWeight: 'bold',
          textTransform: 'uppercase',
        },
        overlay: {
          backdropFilter: 'blur(3px)',
        }
      } as any}
    />
  );
}

// Helper hook component to allow rendering a "Restart Tour" button anywhere in the app
export function RestartTourButton() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const triggerRestart = () => {
    window.dispatchEvent(new CustomEvent('guardian:restart-onboarding'));
  };

  return (
    <Button 
      onClick={triggerRestart} 
      variant="outline" 
      size="sm" 
      className="w-full text-[10px] font-black uppercase text-primary border-primary/20 hover:bg-primary/5 gap-1.5 h-8 mt-2"
    >
      <Sparkles className="h-3.5 w-3.5" />
      Reiniciar Tour Guiado
    </Button>
  );
}
