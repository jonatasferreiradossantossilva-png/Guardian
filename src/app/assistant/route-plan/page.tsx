'use client';

import { useState, useMemo, useEffect } from 'react';
import { useUser } from '@/firebase';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal'; // Import the modal

type Shift = 'Manhã' | 'Tarde';
type StudentStatus = 'aguardando' | 'a_bordo' | 'desembarcado' | 'ausente';
interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
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

export default function AssistantRoutePlanPage() {
  const { user, isUserLoading } = useUser();
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
          { field: 'active', op: '==', value: true },
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

  const orderedStudents = useMemo(() => {
    if (!route?.studentIds || !students) return [];
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return route.studentIds
      .map((id) => studentMap.get(id))
      .filter((s): s is Student => !!s);
  }, [route?.studentIds, students]);

  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
  };

  const handleOpenAuthorizedModal = (student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  };

  const isLoading = isUserLoading || isRouteLoading || areStudentsLoading;

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
              <div className="space-y-4">
                {orderedStudents.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-secondary"
                  >
                    <div className="flex items-center gap-3 mb-3 sm:mb-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleOpenAuthorizedModal(student)}
                        title="Ver contatos autorizados"
                      >
                        <IdCard className="h-5 w-5 text-muted-foreground" />
                      </Button>
                      <span className="font-medium">{student.name}</span>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {student.status === 'aguardando' && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 flex-1"
                            onClick={() =>
                              handleStatusChange(student.id, 'a_bordo')
                            }
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Embarcar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() =>
                              handleStatusChange(student.id, 'ausente')
                            }
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Ausente
                          </Button>
                        </>
                      )}
                      {student.status === 'a_bordo' && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() =>
                            handleStatusChange(student.id, 'desembarcado')
                          }
                        >
                          <Bus className="mr-2 h-4 w-4" />
                          Desembarcar
                        </Button>
                      )}
                      {(student.status === 'desembarcado' ||
                        student.status === 'ausente') && (
                        <Badge
                          variant={statusBadgeVariant[student.status]}
                          className="w-full justify-center py-1 text-xs"
                        >
                          {statusText[student.status]}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                {orderedStudents.length === 0 && (
                  <div className="text-center text-muted-foreground py-10">
                    <p>
                      Nenhum aluno para o turno da {activeShift.toLowerCase()}.
                    </p>
                  </div>
                )}
              </div>
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
