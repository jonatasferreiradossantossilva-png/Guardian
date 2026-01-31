
'use client';

import { useState, useMemo, useEffect, memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { cn } from '@/lib/utils';

type Shift = 'Manhã' | 'Tarde';
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

interface StudentListItemProps {
  student: Student;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
  onOpenAuthorizedModal: (student: Student) => void;
}

const StudentListItem = memo(({ student, onStatusChange, onOpenAuthorizedModal }: StudentListItemProps) => {
  const isFinished = student.status === 'desembarcado' || student.status === 'ausente';
  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-secondary gap-3">
        <div className="flex items-center gap-4">
            <div title={statusText[student.status]}>{statusIconMap[student.status]}</div>
            <div>
                <div className="flex items-center gap-2">
                    <span className={cn("font-medium", isFinished && "line-through text-muted-foreground")}>
                    {student.name}
                    </span>
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
        <div className="flex items-center gap-2 w-full sm:w-[220px]">
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
                <Button size="sm" className="w-full" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                <Bus className="mr-2 h-4 w-4" /> Desembarcar
                </Button>
            )}
            {(student.status === 'desembarcado' || student.status === 'ausente') && (
                <Badge variant={statusBadgeVariant[student.status]} className="w-full justify-center py-1.5 text-xs">
                {statusText[student.status]}
                </Badge>
            )}
        </div>
    </li>
  );
});
StudentListItem.displayName = 'StudentListItem';


export default function AssistantRoutePlanPage() {
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  // State for the modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] =
    useState<Student | null>(null);

  useEffect(() => {
    // For this prototype, we get the logged-in user's ID from session storage.
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || 'user-aux-1'); // Default to a known assistant for direct page access
  }, []);

  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    mockUserId
      ? [
          { field: 'assistantId', op: '==', value: mockUserId },
        ]
      : []
  );
  const route = useMemo(
    () => (routes && routes.length > 0 ? routes[0] : null),
    [routes]
  );

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
      .filter((s): s is Student => !!s);
  }, [route?.studentIds, students]);

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

  const isLoading = isRouteLoading || areStudentsLoading || areSchoolsLoading;

  // Derive shift from the active route
  const activeShift = useMemo(
    () => (route?.shift === 'manha' ? 'Manhã' : 'Tarde'),
    [route]
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">
            Painel do Auxiliar
          </h1>
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
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="flex items-center gap-2">
                <ClipboardCheck />
                Controle de Embarque/Desembarque
              </CardTitle>
              {route && <Badge variant="outline">{activeShift}</Badge>}
            </div>
            <p className="text-muted-foreground text-sm pt-2">
              {route ? route.name : 'Carregando rota...'}
            </p>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {!isLoading && !route && (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
                <p className="font-semibold">
                  Nenhuma rota ativa encontrada para você.
                </p>
                <p className="text-muted-foreground text-sm">
                  Verifique com o administrador se uma rota foi atribuída.
                </p>
              </div>
            )}

            {!isLoading && route && (
              <ol className="space-y-2">
                {orderedStudents.map((student) => (
                   <StudentListItem
                    key={student.id}
                    student={student}
                    onStatusChange={handleStatusChange}
                    onOpenAuthorizedModal={handleOpenAuthorizedModal}
                  />
                ))}
                <li className="flex items-center gap-4 p-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                        <School className="h-5 w-5 text-muted-foreground/50"/>
                    </div>
                    <span className="font-medium text-muted-foreground">{school?.name || "Escola"} (Destino Final)</span>
                </li>
                {orderedStudents.length === 0 && (
                    <div className="text-center text-muted-foreground py-10">
                    <p>
                        Nenhum aluno para o turno da {activeShift?.toLowerCase()}.
                    </p>
                    </div>
                )}
            </ol>
            )}
          </CardContent>
        </Card>
      </div>

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
