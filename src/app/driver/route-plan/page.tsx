'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
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
  MapPin,
  School,
  Circle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal'; // Import the modal
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { cn } from '@/lib/utils';

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

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const Polyline = (props: google.maps.PolylineOptions) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline>();

  useEffect(() => {
    if (!map) {
      return;
    }
    polylineRef.current = new google.maps.Polyline();
    polylineRef.current.setMap(map);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map]);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setOptions(props);
    }
  }, [props]);

  return null;
};

export default function DriverRoutePlanPage() {
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
    setMockUserId(storedUserId || 'user-motorista-2'); // Default to a known driver for direct page access
  }, []);

  // Fetch driver profile
  const driverFilter = useMemo(
    () => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined),
    [mockUserId]
  );
  const { data: drivers, isLoading: areDriversLoading } =
    useMockCollection('drivers', driverFilter);
  const driverProfile = useMemo(
    () => (drivers && drivers.length > 0 ? drivers[0] : null),
    [drivers]
  );
  const driverId = driverProfile?.id;

  // Fetch active route for driver
  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    driverId
      ? [
          { field: 'driverId', op: '==', value: driverId },
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

    // Updated demo data logic
    const studentStatusMap: Record<string, StudentStatus> = {
      [route.studentIds[0]]: 'aguardando',
      [route.studentIds[1]]: 'a_bordo',
    };

    return route.studentIds
      .map((id, index) => {
        const student = studentMap.get(id);
        if (student) {
          // Override status for demonstration if it's one of the first two
          if (index < 2) {
             student.status = studentStatusMap[id] || student.status;
          }
        }
        return student;
      })
      .filter((s): s is Student => !!s);
  }, [route?.studentIds, students]);
  
  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');

  const school = useMemo(() => {
    if (!orderedStudents.length || !schools) return null;
    const studentWithSchool = orderedStudents.find(s => s.schoolId);
    if (!studentWithSchool) return null;
    return schools.find(s => s.id === studentWithSchool.schoolId);
  }, [orderedStudents, schools]);
  
  const useMockNestedDocSnapshot = (path) => {
    const { getNestedDoc, db } = useMockData();
    const [data, setData] = useState(() => path ? getNestedDoc(path) : null);

    useEffect(() => {
        if (path) {
            setData(getNestedDoc(path));
        } else {
            setData(null);
        }
    }, [db, path, getNestedDoc]);

    return { data, isLoading: false, error: null };
  }
  
  const { data: driverLocation, isLoading: isLocationLoading } = useMockNestedDocSnapshot(driverId ? `locations/${driverId}` : null);


  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
  };

  const handleOpenAuthorizedModal = (student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  };

  const isLoading =
    isUserLoading || areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading || isLocationLoading;

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
            Painel do Motorista
          </h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/driver/messages">
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
                Progresso da Rota
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
                {orderedStudents.map((student) => {
                    const isFinished = student.status === 'desembarcado' || student.status === 'ausente';
                    return (
                    <li key={student.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-secondary gap-3">
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
                                        onClick={() => handleOpenAuthorizedModal(student)}
                                        title="Ver contatos autorizados"
                                    >
                                        <IdCard className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {student.street ? `${student.street}, ${student.number} - ${student.neighborhood}` : 'Endereço indisponível'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto max-w-[220px] self-end sm:self-center">
                            {student.status === 'aguardando' && (
                                <>
                                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleStatusChange(student.id, 'a_bordo')}>
                                    <CheckCircle className="mr-2 h-4 w-4" /> Embarcar
                                </Button>
                                <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleStatusChange(student.id, 'ausente')}>
                                    <XCircle className="mr-2 h-4 w-4" /> Ausente
                                </Button>
                                </>
                            )}
                            {student.status === 'a_bordo' && (
                                <Button size="sm" className="w-full" onClick={() => handleStatusChange(student.id, 'desembarcado')}>
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
                })}
                <li className="flex items-center gap-4 p-3">
                    <School className="h-5 w-5 text-muted-foreground/50"/>
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
        
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin /> Mapa da Rota</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden border bg-secondary">
                    {!API_KEY ? (
                        <div className="flex h-full w-full items-center justify-center bg-secondary/30">
                          <div className="text-center p-4">
                              <p className="font-semibold text-lg">Mapa Indisponível</p>
                              <p className="text-muted-foreground text-sm">
                                  A chave da API do Google Maps não foi configurada.
                              </p>
                          </div>
                        </div>
                    ) : (
                        <APIProvider apiKey={API_KEY}>
                            <GoogleMap
                                defaultCenter={{ lat: -23.55, lng: -46.63 }}
                                defaultZoom={12}
                                mapId="driver-route-map"
                                gestureHandling={'greedy'}
                                disableDefaultUI={true}
                            >
                                <RouteMap
                                    driverLocation={driverLocation}
                                    students={orderedStudents}
                                    school={school}
                                />
                            </GoogleMap>
                        </APIProvider>
                    )}
                </div>
            </CardContent>
        </Card>

        {isModalOpen && selectedStudentForModal && (
            <AuthorizedContactsModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            studentId={selectedStudentForModal.id}
            studentName={selectedStudentForModal.name}
            />
        )}
      </div>
    </div>
  );
}

function RouteMap({ driverLocation, students, school }) {
  const map = useMap();

  useEffect(() => {
    if (!map || (!students.length && !school)) return;

    const bounds = new google.maps.LatLngBounds();
    students.forEach(stop => {
        if (stop.latitude && stop.longitude) {
            bounds.extend({ lat: stop.latitude, lng: stop.longitude });
        }
    });
    if (school?.latitude && school?.longitude) {
        bounds.extend({ lat: school.latitude, lng: school.longitude });
    }
    if (driverLocation?.latitude && driverLocation?.longitude) {
        bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
    }

    if (bounds.isEmpty()) return;
    map.fitBounds(bounds, 100);

  }, [map, driverLocation, students, school]);
  
  if (!school) return null;

  const routePath = [
    ...(driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : []),
    ...students.map(s => ({ lat: s.latitude, lng: s.longitude })),
    { lat: school.latitude, lng: school.longitude }
  ].filter(p => p.lat && p.lng);

  return (
      <>
          {/* Markers */}
          {driverLocation && (
              <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição">
                  <div className="p-1 bg-primary rounded-full shadow-lg">
                      <Bus className="h-6 w-6 text-primary-foreground" />
                  </div>
              </AdvancedMarker>
          )}

          {students.map(student => (
              <AdvancedMarker key={`marker-${student.id}`} position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
                  <div className="p-1 rounded-full shadow border-2 border-white bg-blue-500">
                      <User className="h-4 w-4 text-white" />
                  </div>
              </AdvancedMarker>
          ))}
          <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
               <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
                  <School className="h-5 w-5 text-white" />
               </div>
          </AdvancedMarker>

          {/* Polyline */}
          {routePath.length > 1 && (
              <Polyline path={routePath} strokeColor="#4f46e5" strokeOpacity={0.8} strokeWeight={6} />
          )}
      </>
  );
}
