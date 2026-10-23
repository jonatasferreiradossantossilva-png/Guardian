'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import {
  Users,
  Loader2,
  MessageSquare,
  ShieldCheck,
  HeartPulse,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Phone,
  AlertTriangle,
  Navigation,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDataCollection, useData } from '@/hooks/use-data';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { Student, StudentStatus, Notification as MockNotification } from '@/types/mock-data';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';

import { ReportIncidentForm } from '@/components/dashboard/report-incident-form';
import { SafeRow } from '@/components/shared/safe-table';
import { safeString, safeArray, safeInitials, getSafeDate } from '@/lib/safe-render';


export default function MonitorDashboardContent() {
  const router = useRouter();
  const { updateDoc } = useData() as any;
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    setMockUserId(sessionStorage.getItem('mockUserId') || "user-monitor-1");
  }, []);

  // Notificações em tempo real (Toast)
  const { data: notifications } = useDataCollection('notifications', 
    mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined
  );

  useEffect(() => {
    const list = safeArray<MockNotification>(notifications);
    if (list.length) {
        const sorted = [...list].sort((a: MockNotification, b: MockNotification) => getSafeDate(b.createdAt).getTime() - getSafeDate(a.createdAt).getTime());
        const lastNotif = sorted[0];
        const isRecent = new Date().getTime() - getSafeDate(lastNotif.createdAt).getTime() < 10000;
        
        if (isRecent && !lastNotif.read) {
            toast({
                title: safeString(lastNotif.title),
                description: safeString(lastNotif.message),
                variant: lastNotif.type === 'emergency' ? 'destructive' : 'default',
            });
        }
    }
  }, [notifications, toast]);




  // Perfil do Monitor
  const monitorFilter = useMemo(() => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined), [mockUserId]);
  const { data: monitorProfiles, isLoading: isMonitorLoading } = useDataCollection('monitors', monitorFilter);
  const monitorProfile = useMemo(() => (monitorProfiles ? monitorProfiles[0] : null), [monitorProfiles]);
  
  // Rota ativa vinculada ao PERFIL do monitor
  const routeFilter = useMemo(() => (monitorProfile?.id ? [{ field: 'monitorId', op: '==', value: monitorProfile.id }] : []), [monitorProfile]);
  const { data: routes, isLoading: isRouteLoading } = useDataCollection('routes', routeFilter);
  const activeRoute = useMemo(() => routes?.[0] || null, [routes]);

  // Alunos desta rota divididos por estágios lógicos
  const { data: allStudents, isLoading: isStudentsLoading } = useDataCollection('students');
  const { routeStudents, waitingStudents, inTransitStudents, finishedStudents } = useMemo(() => {
    if (!activeRoute || !allStudents) return { routeStudents: [], waitingStudents: [], inTransitStudents: [], finishedStudents: [] };
    
    const uniqueIds = Array.from(new Set(activeRoute.studentIds));
    const students = allStudents.filter(s => uniqueIds.includes(s.id));
    
    return {
        routeStudents: students,
        waitingStudents: students.filter(s => s.status === 'aguardando'),
        inTransitStudents: students.filter(s => s.status === 'a_bordo'),
        finishedStudents: students.filter(s => s.status === 'desembarcado' || s.status.startsWith('ausente'))
    };
  }, [activeRoute, allStudents]);

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
    toast({
        title: "Status Atualizado",
        description: `Aluno marcado como ${newStatus.replace('_', ' ')}.`,
    });
  }, [updateDoc, toast]);

  const handleCollectiveAction = useCallback((action: 'a_bordo' | 'desembarcado') => {
    if (!safeArray<Student>(routeStudents).length) return;
    
    safeArray<Student>(routeStudents).forEach((s: Student) => {
        updateDoc('students', s.id, { status: action });
    });



    toast({
        title: action === 'a_bordo' ? "Embarque Coletivo!" : "Desembarque Coletivo!",
        description: `Todos os ${safeArray(routeStudents).length} alunos foram atualizados.`,
    });

  }, [updateDoc, toast, routeStudents]);

  const handleLogout = () => {
    sessionStorage.removeItem('mockUserId');
    router.push('/login');
  };

  if (!isMounted || isMonitorLoading || isRouteLoading || isStudentsLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-primary/70">Sincronizando Guardian...</p>
      </div>
    );
  }

  // --- RENDERING LOGIC BASED ON JOURNEY STATUS ---

  // 1. SEM ROTA ATRIBUÍDA
  if (!activeRoute) {
    return (
        <div key="monitor-unassigned" className="min-h-[100dvh] h-[100dvh] bg-background flex flex-col items-center justify-center p-6 text-center">
            <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <h2 className="text-xl font-black uppercase italic mb-2">Sem Rota Ativa</h2>
            <p className="text-xs text-muted-foreground font-bold uppercase max-w-[200px]">Nenhuma rota operacional foi atribuída ao seu perfil hoje.</p>
            <Button variant="ghost" className="mt-8 text-[10px] font-black uppercase" onClick={handleLogout}>Sair do App</Button>
        </div>
    );
  }

  // 2. AGUARDANDO MOTORISTA (PENDENTE)
  if (activeRoute.journeyStatus === 'pendente') {
    return (
        <div key="monitor-pendente" className="min-h-[100dvh] h-[100dvh] bg-background flex flex-col overflow-hidden max-w-md mx-auto border-x">
            <header className="bg-primary pt-14 pb-8 px-6 text-white shrink-0 text-center relative">
                <div className="absolute top-14 right-4">
                    <NotificationBell />
                </div>
                <ShieldCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h1 className="text-2xl font-black italic uppercase italic">Guardian</h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Monitor: {safeString(monitorProfile?.name, 'Monitor')}</p>
            </header>

            
            <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-primary/10 flex items-center justify-center bg-primary/5">
                        <Clock className="h-12 w-12 text-primary animate-pulse" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-xl font-black uppercase leading-tight text-primary">Aguardando o Motorista</h2>
                    <p className="text-xs text-muted-foreground font-bold uppercase leading-relaxed">
                        A rota <span className="text-foreground">"{safeString(activeRoute.name, 'Ativa')}"</span> está vinculada a você, mas ainda não foi iniciada pelo motorista.
                    </p>
                </div>


                <div className="w-full p-4 bg-muted/40 rounded-2xl border flex items-center gap-4 text-left">
                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                        <AvatarFallback className="bg-primary/20 text-primary font-black uppercase">M</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-primary uppercase leading-tight mb-0.5">Veículo</p>
                        <p className="text-xs font-black uppercase truncate">Sincronizando veículo...</p>
                    </div>
                </div>

                <div className="pt-4 w-full">
                    <Button variant="outline" className="w-full h-14 border-2 font-black uppercase text-xs tracking-widest" disabled>
                        Aguardando Sincronização...
                    </Button>
                    <p className="mt-4 text-[9px] font-black text-muted-foreground uppercase">Você será notificado assim que a rota começar.</p>
                </div>
            </main>
        </div>
    );
  }

  // 3. VIAGEM FINALIZADA (CONCLUÍDA)
  if (activeRoute.journeyStatus === 'concluida') {
    return (
        <div key="monitor-concluida" className="min-h-[100dvh] h-[100dvh] bg-background flex flex-col overflow-hidden max-w-md mx-auto border-x">
             <header className="bg-green-600 pt-14 pb-8 px-6 text-white shrink-0 text-center">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <h1 className="text-2xl font-black uppercase italic">Rota Finalizada</h1>
            </header>

            <main className="flex-1 flex flex-col p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h2 className="text-lg font-black uppercase tracking-tight">{safeString(activeRoute.name, 'Rota')}</h2>
                    <p className="text-[10px] font-black uppercase text-muted-foreground">{safeString(activeRoute.shift)} • Operação Concluída</p>
                </div>


                <div className="grid grid-cols-2 gap-4">
                    <Card className="border-2 shadow-none bg-muted/20">
                        <CardContent className="p-4 text-center">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Alunos</p>
                            <p className="text-2xl font-black text-primary">{safeArray(activeRoute.studentIds).length}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-2 shadow-none bg-muted/20">
                        <CardContent className="p-4 text-center">
                             <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Status</p>
                             <Badge className="bg-green-600 text-[8px] font-black uppercase">100% OK</Badge>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4 pt-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Users className="h-4 w-4" /> Resumo da Frequência
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center p-3 rounded-xl bg-muted/50 border">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Aguardando</span>
                            <span className="text-xl font-black italic">{waitingStudents.length}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-primary/10 border border-primary/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Embarcados</span>
                            <span className="text-xl font-black italic text-primary">{inTransitStudents.length}</span>
                        </div>
                        <div className="flex flex-col items-center p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                            <span className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-1">Finalizados</span>
                            <span className="text-xl font-black italic text-green-600">{finishedStudents.length}</span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 shrink-0 bg-transparent"></div>

                <Button className="w-full h-16 font-black uppercase text-sm tracking-widest bg-primary hover:bg-primary/90 shadow-xl" onClick={handleLogout}>
                    Encerrar Turno
                </Button>
            </main>
        </div>
    );
  }

  // 4. FLUXO OPERACIONAL (EM ROTA)
  return (
    <div key="monitor-em_rota" className="min-h-[100dvh] h-[100dvh] bg-background flex flex-col overflow-hidden max-w-md mx-auto border-x">
      {/* Header Estilo Guardian */}
      <header className="bg-primary pt-10 pb-6 px-6 text-white shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
             <div className="h-12 w-12 rounded-full border-2 border-white/30 bg-white/10 flex items-center justify-center">
                <ShieldCheck className="h-6 w-6" />
             </div>
             <div>
                <h1 className="text-xl font-black italic uppercase italic">Guardian</h1>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Monitor: {safeString(monitorProfile?.name, 'Monitor')}</p>
             </div>
          </div>
          <div className="flex items-center gap-1">
             <NotificationBell />
             <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
             </Button>
          </div>
        </div>
      </header>

      {/* Info Rota */}
      <div className="px-6 py-4 bg-muted/30 border-b flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <Clock className="h-5 w-5" />
              </div>
              <div>
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-1">Rota Ativa</p>
                  <h2 className="text-sm font-black uppercase truncate max-w-[180px]">{safeString(activeRoute.name, 'Rota')}</h2>
              </div>

          </div>
          <Badge variant="outline" className="border-primary/30 text-primary font-black uppercase text-[10px]">
              {safeString(activeRoute.shift)}
          </Badge>

      </div>

      {/* Lista Operacional */}
      <main className="flex-1 overflow-hidden flex flex-col p-4 bg-background">
        <div className="space-y-3 shrink-0 mb-2">
          <div className="flex items-center justify-between px-2">
            <h2 className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2">
              <Users className="h-4 w-4" /> 
              Frequência ({safeArray(waitingStudents).length + safeArray(inTransitStudents).length + safeArray(finishedStudents).length})
            </h2>

            <Badge className="bg-primary/10 text-primary border-none text-[10px] font-black uppercase tracking-tight">Tempo Real</Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 pr-2">
           <div className="space-y-10 pb-40">
              {/* STAGE 1: AGUARDANDO EMBARQUE */}
              <div className="space-y-4 p-3 bg-orange-500/5 rounded-2xl border border-orange-500/10 min-h-[100px]">
                  <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        1. Aguardando ({safeArray(waitingStudents).length})
                      </h3>

                  </div>
                  {safeArray(waitingStudents).length > 0 ? (
                    <div className="space-y-4">
                        {safeArray<Student>(waitingStudents).map((student: Student) => (
                          <SafeRow key={student.id} name={`WaitingStudent-${student.id}`}>


                            <StudentActionCard 
                                student={student}
                                onStatusChange={handleStatusChange}
                            />
                          </SafeRow>
                        ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center opacity-30 italic text-[10px] font-bold uppercase">Ninguém aguardando no momento</div>
                  )}
              </div>

              {/* STAGE 2: DENTRO DO VEÍCULO */}
              <div className="space-y-4 p-3 bg-green-500/5 rounded-2xl border border-green-500/10 min-h-[100px]">
                  <div className="flex items-center justify-between px-1">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        2. Embarcados ({safeArray(inTransitStudents).length})
                      </h3>

                  </div>
                  {safeArray(inTransitStudents).length > 0 ? (
                    <div className="space-y-4">
                        {safeArray<Student>(inTransitStudents).map((student: Student) => (
                          <SafeRow key={student.id} name={`InTransitStudent-${student.id}`}>


                            <StudentActionCard 
                                student={student}
                                onStatusChange={handleStatusChange}
                            />
                          </SafeRow>
                        ))}
                    </div>
                  ) : (
                    <div className="py-4 text-center opacity-30 italic text-[10px] font-bold uppercase">Veículo vazio. Inicie o embarque.</div>
                  )}
              </div>

              {/* STAGE 3: VIAGENS FINALIZADAS */}
              <div className="space-y-4 p-3 bg-muted/30 rounded-2xl border border-muted min-h-[100px]">
                  <div className="flex items-center justify-between px-1 mb-2">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                          <CheckCircle className="h-3 w-3" />
                          3. Finalizados ({safeArray(finishedStudents).length})
                      </h3>

                  </div>
                  
                  {safeArray(finishedStudents).length > 0 ? (
                      <div className="space-y-4 opacity-70">
                          {safeArray<Student>(finishedStudents).map((student: Student) => (
                              <SafeRow key={student.id} name={`FinishedStudent-${student.id}`}>


                                <div className="relative">
                                    <StudentActionCard 
                                        student={student}
                                        onStatusChange={handleStatusChange}
                                        isFinished
                                    />
                                    <div className="absolute inset-0 z-10 rounded-xl" /> 
                                </div>
                              </SafeRow>
                          ))}
                      </div>
                  ) : (
                      <div className="py-8 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center opacity-20">
                          <Users className="h-8 w-8 mb-2" />
                          <p className="text-[10px] font-black uppercase text-center leading-tight">Histórico de desembarque</p>
                      </div>
                  )}
              </div>
           </div>
        </ScrollArea>
      </main>

      {/* RODAPÉ DE AÇÕES COLETIVAS FIXO */}
      <footer className="p-4 bg-background border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] grid grid-cols-2 gap-3 shrink-0 z-20">
          <Button 
            className="h-14 bg-green-600 hover:bg-green-700 font-black text-xs uppercase shadow-md active:scale-95 transition-all"
            onClick={() => handleCollectiveAction('a_bordo')}
          >
              <Users className="mr-2 h-4 w-4" />
              Embarque Coletivo
          </Button>
          <Button 
            className="h-14 bg-blue-600 hover:bg-blue-700 font-black text-xs uppercase shadow-md active:scale-95 transition-all"
            onClick={() => handleCollectiveAction('desembarcado')}
          >
              <CheckCircle className="mr-2 h-4 w-4" />
              Desembarque Total
          </Button>
      </footer>
    </div>
  );
}

function StudentActionCard({ student, onStatusChange, isFinished = false }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, isFinished?: boolean }) {
  const hasAlert = (safeArray(student.medicalConditions).length > 0) || student.medicalNote;

  
  return (
    <Card className={cn(
      "w-full border-2 overflow-hidden shadow-md transition-all active:scale-[0.99] touch-feedback",
      student.status === 'a_bordo' ? "border-green-500 bg-green-500/5 shadow-green-500/10" : "border-primary/10",
      hasAlert && "ring-4 ring-destructive border-destructive bg-destructive/5",
      isFinished && "opacity-60 grayscale-[0.2] border-muted bg-muted/5 shadow-none"
    )}>
      <CardHeader className="p-4 pb-2">
         <div className="flex items-center gap-4">
            <Avatar className={cn("h-14 w-14 border-2 shadow-sm", isFinished ? "border-muted" : "border-primary/20")}>
               <AvatarImage src={student.photoUrl || undefined} />
               <AvatarFallback className="font-black">{safeInitials(student.name)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
               <div className="flex items-center justify-between">
                  <h4 className="font-black text-sm uppercase truncate leading-tight">{safeString(student.name, 'Aluno')}</h4>

                  {student.status === 'a_bordo' ? (
                     <Badge className="bg-green-600 text-[8px] font-black uppercase">A BORDO</Badge>
                  ) : isFinished ? (
                     <Badge variant="outline" className="text-[8px] font-black uppercase border-muted text-muted-foreground">{safeString(student.status).replace('_', ' ')}</Badge>
                  ) : null}
               </div>
               <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{safeString(student.serie)} • {safeString(student.turma)}</p>
               
               {hasAlert && !isFinished && (
                 <div className="mt-2 p-2 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-1.5 text-destructive mb-1">
                        <HeartPulse className="h-3 w-3 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-tighter">ALERTA MÉDICO</span>
                    </div>
                    {(safeArray(student.medicalConditions).length > 0) && (
                        <div className="flex flex-wrap gap-1 mb-1">
                            {safeArray<string>(student.medicalConditions).map((c: string, mIdx: number) => (
                                <Badge key={`${student.id}-cond-${mIdx}`} variant="destructive" className="h-4 px-1 text-[7px] font-black uppercase leading-none">
                                    {safeString(c)}
                                </Badge>
                            ))}
                        </div>
                    )}


                    {student.medicalNote && (
                        <p className="text-[9px] font-bold text-destructive italic leading-tight">
                            "{safeString(student.medicalNote)}"
                        </p>
                    )}

                 </div>
               )}
            </div>
         </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-2 space-y-3">
         {/* EXIBIR BOTÕES APENAS SE NÃO ESTIVER FINALIZADO */}
         {!isFinished && (
            <div className="grid grid-cols-2 gap-2">
                <Button 
                className={cn(
                    "h-14 font-black text-xs uppercase shadow-sm",
                    student.status === 'a_bordo' ? "bg-blue-600 hover:bg-blue-700" : "bg-green-600 hover:bg-green-700"
                )} 
                onClick={() => onStatusChange(student.id, student.status === 'a_bordo' ? 'desembarcado' : 'a_bordo')}
                >
                <CheckCircle className="mr-2 h-4 w-4" />
                {student.status === 'a_bordo' ? 'Desembarcar' : 'Embarcou'}
                </Button>
                
                <Button 
                variant="destructive" 
                className="h-14 font-black text-xs uppercase shadow-sm"
                onClick={() => onStatusChange(student.id, 'ausente_dia_todo')}
                >
                <XCircle className="mr-2 h-4 w-4" />
                Ausente
                </Button>
            </div>
         )}
      </CardContent>

      <CardFooter className="p-0 border-t bg-muted/10 flex divide-x">
          <Button variant="ghost" className="flex-1 h-10 text-[9px] font-black text-primary uppercase rounded-none" asChild>
             <a href={`tel:${student.phone}`}>
               <Phone className="mr-2 h-3.5 w-3.5" /> Ligar Pais
             </a>
          </Button>
          <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" className="flex-1 h-10 text-[9px] font-black text-destructive uppercase rounded-none">
                    <AlertTriangle className="mr-2 h-3.5 w-3.5" /> Incidente
                </Button>
            </DialogTrigger>
            <ReportIncidentForm onFormSubmit={() => {}} />
          </Dialog>
      </CardFooter>
    </Card>
  );
}
