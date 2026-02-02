
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  List,
  Bus,
  User,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  MessageSquare,
  IdCard,
  School,
  Navigation,
  Play,
  Pause,
  Square,
  MoreVertical,
  CheckCircle,
  XCircle,
  Siren,
  Users,
  LocateFixed,
  Phone,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


type Shift = 'Manhã' | 'Tarde';
type StudentStatus = 'aguardando' | 'a_bordo' | 'desembarcado' | 'ausente';
interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  latitude: number;
  longitude: number;
  schoolId: string;
  street?: string;
  number?: string;
  neighborhood?: string;
}

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente: 'Ausente',
};

// --- Sub-components for the new UI ---

const NextStopCard = ({ student, onStatusChange, onNavigate, onOpenAuthorizedModal }) => {
  if (!student) return null;

  const isFinished = student.status === 'desembarcado' || student.status === 'ausente';

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardDescription>Próxima Parada</CardDescription>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <Avatar className="h-12 w-12">
            <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} />
            <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
          </Avatar>
          {student.name}
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {student.street ? `${student.street}, ${student.number}` : 'Endereço não disponível'}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(student.id, 'a_bordo')}>
          <CheckCircle className="mr-2 h-5 w-5" /> Embarcou
        </Button>
        <Button size="lg" variant="destructive" onClick={() => onStatusChange(student.id, 'ausente')}>
          <XCircle className="mr-2 h-5 w-5" /> Ausente
        </Button>
      </CardContent>
       <CardFooter className="gap-2">
           <Button size="lg" variant="outline" className="flex-1" onClick={() => onNavigate(student)}>
              <Navigation className="mr-2 h-5 w-5" /> Navegar
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="h-12 w-12 flex-shrink-0">
                        <MoreVertical />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onOpenAuthorizedModal(student)}>
                        <IdCard className="mr-2"/>Ver Contatos Autorizados
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                        <Phone className="mr-2"/>Ligar para Responsável
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
       </CardFooter>
    </Card>
  );
};


const UpcomingStopsList = ({ students }) => {
  if (!students || students.length === 0) {
    return <p className="text-center text-muted-foreground text-sm py-4">Nenhuma parada futura.</p>;
  }

  return (
    <div className="w-full space-y-2">
       <h3 className="text-sm font-semibold text-muted-foreground px-1">A seguir...</h3>
        <ul className="space-y-1">
            {students.map((student, index) => (
                <li key={student.id} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                    <div className="flex-shrink-0 w-5 text-center text-xs font-mono text-muted-foreground">{index + 2}.</div>
                    <p className="text-sm font-medium truncate">{student.name}</p>
                </li>
            ))}
        </ul>
    </div>
  );
};

const FixedBottomBar = ({ onPause, onResume, onEnd, onRecalculate, onShare, status }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-2 flex justify-around items-center shadow-lg z-50">
        {status === 'em_rota' && (
            <>
                <Button variant="outline" onClick={onPause}><Pause className="mr-2"/>Pausar</Button>
                <Button variant="destructive" onClick={onEnd}><Square className="mr-2"/>Finalizar</Button>
            </>
        )}
        {status === 'pausa' && (
            <>
                <Button onClick={onResume}><Play className="mr-2"/>Retomar</Button>
                <Button variant="destructive" onClick={onEnd}><Square className="mr-2"/>Finalizar</Button>
            </>
        )}
         <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical/></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="mb-2">
                <DropdownMenuItem onClick={onRecalculate}><Siren className="mr-2"/>Recalcular por Ausência</DropdownMenuItem>
                <DropdownMenuItem onClick={onShare}><Share2 className="mr-2"/>Compartilhar Rota</DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/driver/messages"><MessageSquare className="mr-2"/>Mensagens Internas</Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    </div>
);


export default function DriverRoutePlanPage() {
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<'manha-ida' | 'tarde-volta'>('manha-ida');

  useEffect(() => {
    setMockUserId('user-admin-1'); 
  }, []);

  const { shift, direction } = useMemo(() => {
    const [shiftStr, dir] = selectedTrip.split('-');
    return { 
        shift: shiftStr === 'manha' ? 'Manhã' : 'Tarde', 
        direction: dir 
    };
  }, [selectedTrip]);

  const driverFilter = useMemo(
    () => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined),
    [mockUserId]
  );
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', driverFilter);
  const driverProfile = useMemo(() => (drivers ? drivers[0] : null), [drivers]);
  const driverId = driverProfile?.id;

  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    driverId ? [{ field: 'driverId', op: '==', value: driverId }] : []
  );
  
  const route = useMemo(() => routes?.[0] ?? null, [routes]);

  const { data: allStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');

  const studentsOnRoute = useMemo(() => {
      if (!route?.studentIds || !allStudents) return [];
      const studentMap = new Map(allStudents.map(s => [s.id, s]));
      return route.studentIds
        .map(id => studentMap.get(id))
        .filter((s): s is Student => !!s && s.shift === shift);
  }, [route, allStudents, shift]);


  const nextStop = useMemo(() => {
    if (driverProfile?.status !== 'em_rota' || !studentsOnRoute) return null;

    if (direction === 'ida') {
        // Find the first student waiting
        return studentsOnRoute.find(s => s.status === 'aguardando') || null;
    } else { // 'volta'
        // Find the last student on board
        const onBoardStudents = studentsOnRoute.filter(s => s.status === 'a_bordo');
        return onBoardStudents[onBoardStudents.length - 1] || null;
    }
  }, [studentsOnRoute, driverProfile?.status, direction]);
  
  const upcomingStops = useMemo(() => {
    if (!nextStop || !studentsOnRoute) return [];
     if (direction === 'ida') {
        const nextStopIndex = studentsOnRoute.findIndex(s => s.id === nextStop.id);
        return studentsOnRoute.slice(nextStopIndex + 1);
    } else { // 'volta'
        const nextStopIndex = studentsOnRoute.findIndex(s => s.id === nextStop.id);
        return studentsOnRoute.slice(0, nextStopIndex).reverse();
    }
  }, [nextStop, studentsOnRoute, direction]);
  
  const finishedStopsCount = useMemo(() => 
    studentsOnRoute.filter(s => s.status === 'desembarcado' || s.status === 'ausente').length,
    [studentsOnRoute]
  );
  const totalStopsCount = useMemo(() => studentsOnRoute.length, [studentsOnRoute]);


  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    const student = studentsOnRoute.find(s => s.id === studentId);
    let effectiveStatus = newStatus;

    // Logic for return trip: Embarcar becomes Desembarcar
    if (direction === 'volta' && newStatus === 'a_bordo') {
        effectiveStatus = 'desembarcado';
    }

    updateDoc('students', studentId, { status: effectiveStatus });
    toast({
        title: 'Status Atualizado',
        description: `${student?.name || 'O aluno'} foi marcado(a) como ${statusText[effectiveStatus]}.`,
    });
  }, [updateDoc, studentsOnRoute, toast, direction]);

  const handleStartRoute = useCallback(() => {
    if (!driverId) return;
    updateDoc('drivers', driverId, { status: 'em_rota' });
    toast({ title: "Rota Iniciada!", description: "Boa viagem!" });
  }, [driverId, updateDoc, toast]);

  const handlePauseRoute = useCallback(() => {
      if (!driverId) return;
      updateDoc('drivers', driverId, { status: 'pausa' });
      toast({ title: "Rota Pausada" });
  }, [driverId, updateDoc, toast]);

  const handleResumeRoute = useCallback(() => {
      if (!driverId) return;
      updateDoc('drivers', driverId, { status: 'em_rota' });
      toast({ title: "Rota Retomada" });
  }, [driverId, updateDoc, toast]);
  
  const handleEndRoute = useCallback(() => {
      if (!driverId || !studentsOnRoute) return;
      updateDoc('drivers', driverId, { status: 'inativo' });
      studentsOnRoute.forEach(student => {
          updateDoc('students', student.id, { status: 'aguardando' });
      });
      toast({
          title: "Rota Finalizada!",
          description: "Bom descanso! Os status dos alunos foram reiniciados.",
      });
  }, [driverId, studentsOnRoute, updateDoc, toast]);

  const handleOpenAuthorizedModal = useCallback((student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  }, []);
  
  const handleNavigateToStudent = useCallback((student: Student) => {
    if (student.latitude && student.longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${student.latitude},${student.longitude}`;
        window.open(url, '_blank');
    } else {
        toast({
            title: 'Endereço não encontrado',
            description: 'As coordenadas de GPS para este aluno não estão disponíveis.',
            variant: 'destructive'
        });
    }
  }, [toast]);

  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!driverProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 text-center">
        <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
        <h2 className="text-xl font-bold">Perfil de Motorista Não Encontrado</h2>
        <p className="text-muted-foreground">Verifique se seu usuário está corretamente associado a um motorista.</p>
        <Button asChild variant="outline" className="mt-4"><Link href="/">Voltar ao Login</Link></Button>
      </div>
    );
  }
  
  // -- RENDER LOGIC --

  if (driverProfile.status === 'inativo') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6">
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Pronto para Começar?</CardTitle>
            <CardDescription>Selecione a viagem que você irá realizar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedTrip} onValueChange={(v) => setSelectedTrip(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a viagem..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manha-ida">Manhã - Ida para Escola</SelectItem>
                <SelectItem value="tarde-volta">Tarde - Volta para Casa</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
          <CardFooter>
             <Button size="lg" className="w-full" onClick={handleStartRoute}>
                <Play className="mr-2 h-5 w-5"/>
                Iniciar Rota
            </Button>
          </CardFooter>
        </Card>
         <Button asChild variant="ghost"><Link href="/">Voltar ao Login</Link></Button>
      </div>
    );
  }
  
   if (driverProfile.status === 'pausa') {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6 bg-secondary">
                 <Pause className="h-16 w-16 text-muted-foreground" />
                 <h1 className="text-2xl font-bold">Rota Pausada</h1>
                 <Button size="lg" onClick={handleResumeRoute}>
                    <Play className="mr-2 h-5 w-5"/>
                    Retomar Rota
                 </Button>
                  <FixedBottomBar status={driverProfile.status} onEnd={handleEndRoute} onResume={handleResumeRoute} />
            </div>
        );
    }
    
    const isRouteFinished = !nextStop;
    
    // On-Route View
    return (
        <div className="min-h-screen bg-background text-foreground p-4 pb-24">
             <div className="max-w-md mx-auto space-y-6">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">{route?.name}</h1>
                    <p className="text-muted-foreground">{shift} - {direction === 'ida' ? 'Ida' : 'Volta'}</p>
                </div>
                
                {isRouteFinished ? (
                     <Card className="w-full shadow-lg border-green-500/20 text-center p-8">
                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                        <CardTitle className="text-2xl">Rota Finalizada!</CardTitle>
                        <CardDescription className="mt-2">Todos os alunos foram embarcados/desembarcados. Clique em "Finalizar" na barra inferior para concluir.</CardDescription>
                    </Card>
                ) : (
                    <>
                        <NextStopCard 
                            student={nextStop} 
                            onStatusChange={handleStatusChange} 
                            onNavigate={handleNavigateToStudent}
                            onOpenAuthorizedModal={handleOpenAuthorizedModal}
                        />

                        {upcomingStops.length > 0 && <UpcomingStopsList students={upcomingStops} />}
                    </>
                )}
             </div>

             <FixedBottomBar 
                status={driverProfile.status} 
                onPause={handlePauseRoute} 
                onEnd={handleEndRoute}
                onRecalculate={() => toast({ title: "Ainda não implementado" })}
                onShare={() => toast({ title: "Ainda não implementado" })}
            />

            {isModalOpen && selectedStudentForModal && (
                <AuthorizedContactsModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                studentId={selectedStudentForModal.id}
                studentName={selectedStudentForModal.name}
                />
            )}
        </div>
    );
}
