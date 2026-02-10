

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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { useToast } from '@/hooks/use-toast';


type Shift = 'Manhã' | 'Tarde' | 'Integral';
type StudentStatus = 'aguardando' | 'a_bordo' | 'desembarcado' | 'ausente';
interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  schoolId: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  active?: boolean;
}

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente: 'Ausente',
};

const statusBadgeVariant: Record<
  StudentStatus,
  'default' | 'secondary' | 'outline' | 'destructive'
> = {
  a_bordo: 'default',
  aguardando: 'secondary',
  desembarcado: 'outline',
  ausente: 'destructive',
};

const statusIconMap: Record<Student['status'], React.ReactNode> = {
  aguardando: <Circle className="h-5 w-5 text-muted-foreground/30" />,
  a_bordo: <CheckCircle className="h-5 w-5 text-primary" />,
  desembarcado: <CheckCircle className="h-5 w-5 text-green-500" />,
  ausente: <XCircle className="h-5 w-5 text-destructive/80" />,
};

interface StudentCardProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
  onOpenAuthorizedModal: (student: Student) => void;
}

const StudentCard = memo(({ student, onStatusChange, onOpenAuthorizedModal }: StudentCardProps) => {
  const isFinished = student.status === 'desembarcado' || student.status === 'ausente';

  return (
    <Card className={cn("transition-opacity", isFinished && "opacity-60")}>
      <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
            <div title={statusText[student.status]}>{statusIconMap[student.status]}</div>
            <div>
                <div className="flex items-center gap-2">
                    <span className={cn("font-medium", isFinished && "line-through text-muted-foreground")}>
                    {student.name}
                    </span>
                    <Badge variant="outline" className="font-normal">{student.shift}</Badge>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onOpenAuthorizedModal(student)}
                        title="Ver contatos autorizados"
                    >
                        <IdCard className="h-4 w-4 text-muted-foreground" />
                    </Button>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                    {student.street ? `${student.street}, ${student.number} - ${student.neighborhood}` : 'Endereço indisponível'}
                </p>
            </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto sm:min-w-[220px]">
            {student.status === 'aguardando' && (
                <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <CheckCircle className="mr-2 h-4 w-4" /> Embarcar
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => onStatusChange(student.id, 'ausente')}>
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
            {(student.status === 'desembarcado' || student.status === 'ausente') && (
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
  const { updateDoc } = useMockData();
  const { toast } = useToast();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const isOnline = useOnlineStatus();

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || 'user-monitor-1');
  }, []);

  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    mockUserId
      ? [
          { field: 'monitorId', op: '==', value: mockUserId },
        ]
      : []
  );
  const route = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  const { data: students, isLoading: areStudentsLoading } = useMockCollection(
    'students',
    route ? [{ field: 'id', op: 'in', value: route.studentIds }] : []
  );

  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');

  const orderedStudents = useMemo(() => {
    if (!route?.studentIds || !students) return [];
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return route.studentIds
      .map((id) => studentMap.get(id))
      .filter((s): s is Student => {
        if (!s || s.active === false) return false;
        if (s.shift === 'Integral') return true;
        return s.shift === selectedShift;
      });
  }, [route?.studentIds, students, selectedShift]);
  
  const { pendingStudents, completedStudents } = useMemo(() => {
    if (!orderedStudents) return { pendingStudents: [], completedStudents: [] };
    const pending = orderedStudents.filter(s => s.status === 'aguardando');
    const completed = orderedStudents.sort((a, b) => (a.status === 'aguardando' ? -1 : 1)).filter(s => s.status !== 'aguardando');
    return { pendingStudents: pending, completedStudents: completed };
  }, [orderedStudents]);
  
  const progress = useMemo(() => {
    if (!orderedStudents || orderedStudents.length === 0) return 0;
    return (completedStudents.length / orderedStudents.length) * 100;
  }, [completedStudents, orderedStudents]);


  const school = useMemo(() => {
    if (!orderedStudents.length || !schools) return null;
    const studentWithSchool = orderedStudents.find(s => s.schoolId);
    if (!studentWithSchool) return null;
    return schools.find(s => s.id === studentWithSchool.schoolId);
  }, [orderedStudents, schools]);

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
  }, [updateDoc]);

  const handleOpenAuthorizedModal = useCallback((student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  }, []);

  const handleScanSuccess = useCallback((studentId: string) => {
    const student = orderedStudents.find(s => s.id === studentId);
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

    handleStatusChange(student.id, newStatus);
    toast({ title: "Status Atualizado!", description: `${student.name} foi marcado(a) como ${statusText[newStatus]}.` });
    setIsScannerOpen(false);

  }, [orderedStudents, handleStatusChange, toast]);

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
                    <Button variant="outline" className="w-full md:w-auto" onClick={() => setIsScannerOpen(true)}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Escanear QR Code
                    </Button>
                    <div className="w-full md:w-[180px]">
                        <Select value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione o turno" />
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
                <h2 className="text-2xl font-bold tracking-tight">A Fazer ({pendingStudents.length})</h2>
                {pendingStudents.length > 0 ? (
                  pendingStudents.map((student) => (
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
                <h2 className="text-2xl font-bold tracking-tight">Concluídos ({completedStudents.length})</h2>
                 {completedStudents.length > 0 ? (
                  completedStudents.map((student) => (
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
