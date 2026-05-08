'use client';

import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  List,
  CheckCircle,
  XCircle,
  Bus,
  User,
  Loader2,
  AlertTriangle,
  ClipboardCheck,
  MessageSquare,
  IdCard,
  School,
  Circle,
  Check,
  WifiOff,
  QrCode,
  RotateCcw,
  Users,
  HeartPulse,
  Navigation,
  ArrowRightCircle,
  ArrowLeftCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { useDataCollection, useData } from '@/hooks/use-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { cn } from '@/lib/utils';
import { safeInitials } from '@/lib/safe-render';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { useToast } from '@/hooks/use-toast';
import { StudentStatus } from '@/types/mock-data';


type Shift = 'Manhã' | 'Tarde' | 'Integral';
interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  schoolId: string;
  medicalNote?: string;
  medicalConditions?: string[];
  street?: string;
  number?: string;
  neighborhood?: string;
  active?: boolean;
  photoUrl?: string;
}

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente_ida: 'Ausente na Ida',
  ausente_volta: 'Ausente na Volta',
  ausente_dia_todo: 'Ausente Hoje',
  aguardando_aprovacao: 'Aguardando Aprovação',
  pendente_alocacao: 'Pendente de Alocação',
};

const statusBadgeVariant: Record<
  StudentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  a_bordo: 'default',
  aguardando: 'secondary',
  desembarcado: 'outline',
  ausente_ida: 'destructive',
  ausente_volta: 'destructive',
  ausente_dia_todo: 'destructive',
  aguardando_aprovacao: 'outline',
  pendente_alocacao: 'secondary',
};

const statusIconMap: Record<Student['status'], React.ReactNode> = {
  aguardando: <Circle className="h-5 w-5 text-muted-foreground/30" />,
  a_bordo: <CheckCircle className="h-5 w-5 text-primary" />,
  desembarcado: <CheckCircle className="h-5 w-5 text-green-500" />,
  ausente_ida: <XCircle className="h-5 w-5 text-destructive/80" />,
  ausente_volta: <XCircle className="h-5 w-5 text-destructive/80" />,
  ausente_dia_todo: <XCircle className="h-5 w-5 text-destructive/80" />,
  aguardando_aprovacao: <Circle className="h-5 w-5 text-amber-500" />,
  pendente_alocacao: <AlertTriangle className="h-5 w-5 text-slate-400" />,
};

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
  onOpenAuthorizedModal: (student: Student) => void;
}

const StudentCard = memo(({ student, onStatusChange, onOpenAuthorizedModal }: StudentCardProps) => {
  const isFinished = student.status === 'desembarcado' || student.status.startsWith('ausente');
  const { toast } = useToast();
  const hasAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  return (
    <Card className={cn("transition-opacity", isFinished && "opacity-60", hasAlert && !isFinished && "border-destructive/30")}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
            <div title={statusText[student.status]}>{statusIconMap[student.status]}</div>
            <Avatar className="h-10 w-10 border-2 border-muted/20">
                <AvatarImage src={student.photoUrl} />
                <AvatarFallback className="font-black text-xs bg-primary/5 text-primary">{safeInitials(student.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                    <span className={cn("font-bold truncate", isFinished && "line-through text-muted-foreground")}>
                    {student.name}
                    </span>
                    {hasAlert && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center animate-pulse cursor-help shrink-0" title="Alerta Médico" onClick={() => {
                            toast({ title: `Cuidados: ${student.name}`, description: student.medicalNote || `Condições: ${student.medicalConditions?.join(', ')}`, duration: 6000 });
                        }}>
                            <HeartPulse className="h-3 w-3" />
                        </Badge>
                    )}
                    <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-tighter shrink-0">{student.shift}</Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => onOpenAuthorizedModal(student)}
                        title="Ver contatos autorizados"
                    >
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground truncate font-medium">
                    {student.street ? `${student.street}, ${student.number} - ${student.neighborhood}` : 'Endereço de embarque indisponível'}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[220px]">
            {student.status === 'aguardando' && (
                <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Embarcar
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => onStatusChange(student.id, 'ausente_ida')}>
                    <XCircle className="mr-2 h-4 w-4" /> Ausente
                </Button>
                </>
            )}
            {student.status === 'a_bordo' && (
                <>
                    <Button size="sm" className="flex-1" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                    <Bus className="mr-2 h-4 w-4" /> Desembarcar
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onStatusChange(student.id, 'aguardando')} title="Corrigir status">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </>
            )}
            {isFinished && (
                 <>
                    <Badge variant={statusBadgeVariant[student.status]} className="w-full justify-center py-1.5 text-sm flex-1">
                    {statusText[student.status]}
                    </Badge>
                    <Button variant="ghost" size="icon" onClick={() => onStatusChange(student.id, 'aguardando')} title="Corrigir status">
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </>
            )}
        </div>
      </CardContent>
    </Card>
  );
});
StudentCard.displayName = 'StudentCard';


export default function AssistantRoutePlanPage() {
  const { updateDoc } = useData();
  const { toast } = useToast();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || 'user-monitor-1');
    
    // Recovery state from session
    const savedDirection = sessionStorage.getItem('monitor_activeDirection') as 'ida' | 'volta';
    if (savedDirection) setSelectedDirection(savedDirection);
    const savedShift = sessionStorage.getItem('monitor_activeShift') as Shift;
    if (savedShift) setSelectedShift(savedShift);
  }, []);

  const handleDirectionChange = (dir: 'ida' | 'volta') => {
    setSelectedDirection(dir);
    sessionStorage.setItem('monitor_activeDirection', dir);
  };

  const handleShiftChange = (shift: Shift) => {
    setSelectedShift(shift);
    sessionStorage.setItem('monitor_activeShift', shift);
  };

  const { data: routes, isLoading: isRouteLoading } = useDataCollection(
    'routes',
    mockUserId
      ? [
          { field: 'monitorId', op: '==', value: mockUserId },
        ]
      : []
  ) as { data: any[] | null, isLoading: boolean };
  const route = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  const { data: students, isLoading: areStudentsLoading } = useDataCollection(
    'students',
    route ? [{ field: 'id', op: 'in', value: route.studentIds }] : []
  ) as { data: Student[] | null, isLoading: boolean };

  const { data: schools, isLoading: areSchoolsLoading } = useDataCollection('schools') as { data: any[] | null, isLoading: boolean };

  // REAL-TIME SYNC WITH DRIVER
  useEffect(() => {
    if (route?.journeyStatus === 'em_rota' && route?.activeShift && route?.activeDirection) {
        // Only notify if we weren't already in this state
        const isNewJourney = sessionStorage.getItem('lastJourneyId') !== `${route.id}_${route.activeShift}_${route.activeDirection}`;
        
        if (isNewJourney) {
            toast({
                title: "🚚 Viagem Iniciada!",
                description: `${route.startedBy || 'O motorista'} iniciou a rota de ${route.activeDirection === 'ida' ? 'Ida' : 'Volta'} (${route.activeShift}).`,
                duration: 5000,
            });
            sessionStorage.setItem('lastJourneyId', `${route.id}_${route.activeShift}_${route.activeDirection}`);
        }

        setSelectedShift(route.activeShift);
        setSelectedDirection(route.activeDirection);
    } else if (route?.journeyStatus === 'concluida') {
        sessionStorage.removeItem('lastJourneyId');
    }
  }, [route?.journeyStatus, route?.activeShift, route?.activeDirection, route?.startedBy, route?.id, toast]);


  const orderedStudents = useMemo(() => {
    if (!route?.studentIds || !students) return [];
    const studentMap = new Map((students as Student[]).map((s: Student) => [s.id, s]));
    return (route.studentIds as string[])
      .map((id: string) => studentMap.get(id))
      .filter((s): s is Student => {
        if (!s || s.active === false) return false;
        if (s.shift === 'Integral') return true;
        return s.shift === selectedShift;
      });
  }, [route?.studentIds, students, selectedShift]);
  
  const { pendingStudents, completedStudents } = useMemo(() => {
    if (!orderedStudents) return { pendingStudents: [], completedStudents: [] };
    const pending = (orderedStudents as Student[]).filter((s: Student) => s.status === 'aguardando');
    const completed = [...(orderedStudents as Student[])].sort((a: Student, b: Student) => (a.status === 'aguardando' ? -1 : 1)).filter((s: Student) => s.status !== 'aguardando');
    return { pendingStudents: pending, completedStudents: completed };
  }, [orderedStudents]);
  
  const progress = useMemo(() => {
    if (!orderedStudents || orderedStudents.length === 0) return 0;
    return (completedStudents.length / orderedStudents.length) * 100;
  }, [completedStudents, orderedStudents]);


  const school = useMemo(() => {
    if (!orderedStudents.length || !schools) return null;
    const studentWithSchool = orderedStudents.find((s: Student) => s.schoolId);
    if (!studentWithSchool) return null;
    return (schools as any[]).find((s: any) => s.id === studentWithSchool.schoolId);
  }, [orderedStudents, schools]);

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    (updateDoc as any)('students', studentId, { status: newStatus });
  }, [updateDoc]);

  const handleCollectiveBoarding = useCallback(() => {
    if (pendingStudents.length === 0) return;
    
    pendingStudents.forEach((student: Student) => {
      (updateDoc as any)('students', student.id, { status: 'a_bordo' });
    });
    
    toast({ 
      title: "Embarque Coletivo Realizado!", 
      description: `${pendingStudents.length} alunos foram marcados como a bordo.`,
    });
  }, [pendingStudents, updateDoc, toast]);

  const handleOpenAuthorizedModal = useCallback((student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  }, []);

  const handleScanSuccess = useCallback((studentId: string) => {
    const student = orderedStudents.find((s: Student) => s.id === studentId);
    if (!student) {
        toast({ title: "Aluno não encontrado", description: "O QR code não corresponde a um aluno nesta rota.", variant: "destructive"});
        return;
    }

    let newStatus: StudentStatus;
    if (student.status === 'aguardando') {
        newStatus = 'a_bordo';
    } else if (student.status === 'a_bordo') {
        newStatus = 'desembarcado';
    } else {
        toast({ title: "Ação não permitida", description: `O status de ${student.name} não pode ser alterado via QR Code neste momento.`, variant: "destructive"});
        return;
    }

    (handleStatusChange as any)(student.id, newStatus);
    toast({ title: "Status Atualizado!", description: `${student.name} foi marcado(a) como ${statusText[newStatus]}.` });
    setIsScannerOpen(false);

  }, [orderedStudents, handleStatusChange, toast]);

  const handleCollectiveDropoff = useCallback(() => {
    const boardingStudents = orderedStudents.filter((s: Student) => s.status === 'a_bordo');
    if (boardingStudents.length === 0) return;

    boardingStudents.forEach((student: Student) => {
        (updateDoc as any)('students', student.id, { 
            status: 'desembarcado',
            arrivalAtSchool: new Date().toISOString()
        });
    });

    toast({
        title: "🏫 Desembarque Coletivo Realizado!",
        description: `${boardingStudents.length} alunos foram entregues na escola com sucesso.`,
    });
  }, [orderedStudents, updateDoc, toast]);

  const isLoading = isRouteLoading || areStudentsLoading || areSchoolsLoading;

  return (
    <div className="min-h-screen bg-background text-foreground">
       {!isOnline && (
        <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm flex items-center justify-center gap-2">
            <WifiOff className="h-4 w-4" />
            Você está offline. As alterações serão salvas e sincronizadas quando a conexão voltar.
        </div>
      )}
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/assistant/messages">
                <MessageSquare className="mr-2 h-4 w-4" />
                Mensagens
              </Link>
            </Button>
            <Link href="/" passHref>
              <Button variant="outline">Voltar ao Login</Button>
            </Link>
          </div>
        </div>

        {isLoading && (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )}

        {!isLoading && !route && (
            <Card className="flex flex-col items-center justify-center h-64 text-center">
                <CardHeader>
                  <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <CardTitle>Nenhuma rota ativa encontrada</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">
                        Verifique com o administrador se uma rota foi atribuída a você.
                    </p>
                </CardContent>
            </Card>
        )}

        {!isLoading && route && (
          <>
            <Card className="mb-8">
              <CardHeader className="flex flex-col md:flex-row justify-between md:items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck />
                    Controle de Embarque/Desembarque
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {route.name}
                  </CardDescription>
                </div>
                <div className="flex gap-2 items-center w-full md:w-auto mt-4 md:mt-0">
                    <div className="flex bg-muted p-1 rounded-xl gap-1 shrink-0">
                        <Button 
                            variant={selectedDirection === 'ida' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="rounded-lg h-9 px-3 font-bold"
                            onClick={() => handleDirectionChange('ida')}
                            disabled={route?.journeyStatus === 'em_rota'}
                        >
                            <ArrowRightCircle className="mr-2 h-4 w-4" /> Ida
                        </Button>
                        <Button 
                            variant={selectedDirection === 'volta' ? 'default' : 'ghost'} 
                            size="sm" 
                            className="rounded-lg h-9 px-3 font-bold"
                            onClick={() => handleDirectionChange('volta')}
                            disabled={route?.journeyStatus === 'em_rota'}
                        >
                            <ArrowLeftCircle className="mr-2 h-4 w-4" /> Volta
                        </Button>
                    </div>
                    <div className="w-full md:w-[150px]">
                        <Select 
                            value={selectedShift} 
                            onValueChange={(v) => handleShiftChange(v as Shift)} 
                            disabled={route?.journeyStatus === 'em_rota'}
                        >
                            <SelectTrigger className="rounded-xl h-11">
                                <SelectValue placeholder="Turno" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Manhã">Manhã</SelectItem>
                                <SelectItem value="Tarde">Tarde</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-4">
                    <Progress value={progress} className="flex-1"/>
                    <span className="text-sm font-medium text-muted-foreground">{completedStudents.length} de {orderedStudents.length}</span>
                  </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">A Fazer ({pendingStudents.length})</h2>
                    {pendingStudents.length > 0 && selectedDirection === 'ida' && (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-green-600 border-green-600 hover:bg-green-50 dark:hover:bg-green-950/30" 
                            onClick={handleCollectiveBoarding}
                        >
                            <Users className="mr-2 h-4 w-4" /> Embarque Coletivo
                        </Button>
                    )}
                    {pendingStudents.length > 0 && selectedDirection === 'volta' && (
                         <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-primary border-primary bg-primary/5" 
                            onClick={handleCollectiveBoarding}
                        >
                            <Users className="mr-2 h-4 w-4" /> Coletar na Escola
                        </Button>
                    )}
                </div>
                {pendingStudents.length > 0 ? (
                  pendingStudents.map((student: Student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onStatusChange={handleStatusChange}
                      onOpenAuthorizedModal={handleOpenAuthorizedModal}
                    />
                  ))
                ) : (
                  <Card className="flex items-center justify-center h-40 border-dashed">
                      <div className='text-center text-muted-foreground'>
                        <Check className="mx-auto h-8 w-8 mb-2 text-green-500"/>
                        <p>Nenhum aluno aguardando.</p>
                      </div>
                  </Card>
                )}
                 {pendingStudents.length === 0 && orderedStudents.length > 0 && (
                  <Card className="border-dashed">
                    <CardContent className="p-4 flex items-center gap-4">
                       <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-secondary">
                          <School className="h-5 w-5 text-muted-foreground"/>
                      </div>
                      <span className="font-medium text-muted-foreground">{school?.name || "Escola"} (Destino Final)</span>
                    </CardContent>
                  </Card>
                )}
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold tracking-tight">Concluídos ({completedStudents.length})</h2>
                    {selectedDirection === 'ida' && completedStudents.some((s: Student) => s.status === 'a_bordo') && (
                         <Button 
                            size="sm" 
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-black uppercase text-xs tracking-wider" 
                            onClick={handleCollectiveDropoff}
                        >
                            <School className="mr-2 h-4 w-4" /> Desembarque Coletivo (Escola)
                        </Button>
                    )}
                </div>
                 {completedStudents.length > 0 ? (
                  completedStudents.map((student: Student) => (
                    <StudentCard
                      key={student.id}
                      student={student}
                      onStatusChange={handleStatusChange}
                      onOpenAuthorizedModal={handleOpenAuthorizedModal}
                    />
                  ))
                ) : (
                  <Card className="flex items-center justify-center h-40 border-dashed">
                    <p className="text-muted-foreground">Nenhuma parada concluída ainda.</p>
                  </Card>
                )}
              </div>
            </div>
             {orderedStudents.length === 0 && (
                <div className="text-center text-muted-foreground py-16">
                <p>
                    Nenhum aluno para o turno da {selectedShift?.toLowerCase()}.
                </p>
                </div>
            )}
          </>
        )}
      </div>

      {isModalOpen && selectedStudentForModal && (
        <AuthorizedContactsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          studentId={selectedStudentForModal.id}
          studentName={selectedStudentForModal.name}
          targetStatus={selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'}
        />
      )}
      <QrScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
}
