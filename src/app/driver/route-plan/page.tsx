'use client';

import { useState, useMemo, useEffect, useRef, memo, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  MapPin,
  School,
  Navigation,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Undo2,
  GitCommitHorizontal,
  Sparkles,
  XCircle,
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { optimizeSchoolVanRoute, OptimizeSchoolVanRouteOutput } from "@/ai/flows/optimizeSchoolVanRoute";


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
interface School {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
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

function getDirectionDetails(instruction: string) {
  const lowerInstruction = instruction.toLowerCase();
  
  if (lowerInstruction.includes("direita")) return { icon: <ArrowRight className="text-blue-500" />, text: instruction };
  if (lowerInstruction.includes("esquerda")) return { icon: <ArrowLeft className="text-blue-500" />, text: instruction };
  if (lowerInstruction.includes("frente")) return { icon: <ArrowUp className="text-blue-500" />, text: instruction };
  if (lowerInstruction.includes("retorno")) return { icon: <Undo2 className="text-orange-500" />, text: instruction };
  if (lowerInstruction.includes("rotatória")) return { icon: <GitCommitHorizontal className="text-purple-500" />, text: instruction };
  
  return { icon: <Navigation className="text-muted-foreground" />, text: instruction };
}

function RouteDirections({ directions }: { directions?: string[] }) {
    if (!directions || directions.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Navigation /> Instruções de Rota</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center p-4">Nenhuma instrução de rota salva para este percurso.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Navigation /> Instruções de Rota (Plano)</CardTitle>
                 <CardDescription>
                    Este é um plano de rota gerado por IA. Use um app de navegação em tempo real para dirigir.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-64">
                    <ul className="space-y-3 pr-4">
                        {directions.map((instruction, index) => {
                            const { icon, text } = getDirectionDetails(instruction);
                            return (
                                <li key={index} className="flex items-center gap-4 p-2 bg-secondary rounded-md">
                                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-background border">
                                        {icon}
                                    </div>
                                    <span className="text-sm font-medium">{text}</span>
                                </li>
                            );
                        })}
                    </ul>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}

interface StudentListItemProps {
  student: Student;
  index: number;
  isNextStop: boolean;
  onStatusChange: (studentId: string, newStatus: StudentStatus) => void;
  onNavigate: (student: Student) => void;
  onOpenAuthorizedModal: (student: Student) => void;
}

const StudentListItem = memo(({ student, index, isNextStop, onStatusChange, onNavigate, onOpenAuthorizedModal }: StudentListItemProps) => {
  const isFinished = student.status === 'desembarcado' || student.status === 'ausente';
  const isOnBoard = student.status === 'a_bordo';

  return (
    <li className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-secondary gap-3">
        <div className="flex items-center gap-4">
            <div title={statusText[student.status]} className={cn(
                "w-8 h-8 rounded-full shadow-inner flex items-center justify-center font-bold text-white text-sm flex-shrink-0",
                isFinished && "bg-slate-400 opacity-70",
                isOnBoard && "bg-blue-500",
                !isFinished && !isOnBoard && isNextStop && "bg-green-500 scale-110 animate-pulse",
                !isFinished && !isOnBoard && !isNextStop && "bg-blue-500 opacity-50"
            )}>
                {index + 1}
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className={cn("font-medium", isFinished && "line-through text-muted-foreground")}>
                      {student.name}
                    </span>
                     <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => onNavigate(student)}
                        title="Navegar até este aluno"
                    >
                        <Navigation className="h-4 w-4 text-blue-500" />
                    </Button>
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
        <div className="flex items-center gap-2 w-[220px] self-end sm:self-center">
            {student.status === 'aguardando' && (
                <>
                <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <User className="mr-2 h-4 w-4" /> Embarcar
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


export default function DriverRoutePlanPage() {
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] =
    useState<Student | null>(null);
    
  const [dynamicRoute, setDynamicRoute] = useState<{ students: Student[], turnByTurnDirections: string[] } | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);


  useEffect(() => {
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

  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    driverId
      ? [
          { field: 'driverId', op: '==', value: driverId },
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
  
  const displayStudents = dynamicRoute ? dynamicRoute.students : orderedStudents;
  const displayDirections = dynamicRoute ? dynamicRoute.turnByTurnDirections : route?.turnByTurnDirections;

  const nextStop = useMemo(() => 
    displayStudents.find(s => s.status === 'aguardando'),
    [displayStudents]
  );

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
  
  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
    const studentName = students?.find(s => s.id === studentId)?.name || 'o aluno';
    toast({
        title: 'Status Atualizado',
        description: `${studentName} foi marcado(a) como ${statusText[newStatus]}.`,
    });
  }, [updateDoc, students, toast]);

  const handleRecalculate = async () => {
    if (!orderedStudents || orderedStudents.length === 0 || !school) {
        toast({ 
            title: "Dados insuficientes",
            description: "Não é possível recalcular sem uma rota e escola definidos.",
            variant: "destructive"
        });
        return;
    }

    setIsRecalculating(true);
    
    const studentsToReroute = orderedStudents.filter(s => s.status === 'aguardando');
    
    if (studentsToReroute.length === 0) {
        toast({ title: "Nenhuma parada restante", description: "Todos os alunos já foram visitados." });
        setIsRecalculating(false);
        return;
    }
    
    try {
        const studentInputs = studentsToReroute.map(s => ({ 
            id: s.id, 
            name: s.name, 
            address: `${s.street || ''}, ${s.number || ''}, ${s.neighborhood || ''}`.trim()
        }));

        const schoolAddress = `${school.street || ''}, ${school.number || ''}, ${school.neighborhood || ''}`.trim();

        const input = {
            students: studentInputs,
            schoolAddress: schoolAddress,
            context: "Recalcule a rota mais eficiente para as paradas restantes, terminando na escola. Um ou mais alunos podem ter sido marcados como ausentes.",
        };

        const result = await optimizeSchoolVanRoute(input);
        
        const processedStudents = orderedStudents.filter(s => s.status !== 'aguardando');
        
        const reorderedWaitingStudents = result.optimizedStudentIds
            .map(id => students.find(s => s.id === id))
            .filter((s): s is Student => !!s);

        const newDisplayOrder = [...processedStudents, ...reorderedWaitingStudents];

        setDynamicRoute({
            students: newDisplayOrder,
            turnByTurnDirections: result.turnByTurnDirections,
        });

        toast({
            title: "Rota Recalculada!",
            description: "A ordem das paradas e as instruções foram atualizadas.",
        });

    } catch (error) {
        console.error("Error recalculating route:", error);
        toast({
            title: "Erro ao Recalcular",
            description: "Não foi possível otimizar a rota. Tente novamente.",
            variant: "destructive"
        });
    } finally {
        setIsRecalculating(false);
    }
};


  const isLoading =
    areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading || isLocationLoading;

  const activeShift = useMemo(
    () => (route?.shift === 'manha' ? 'Manhã' : 'Tarde'),
    [route]
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
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
            <Link href="/login" passHref>
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
               <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleRecalculate} disabled={isRecalculating}>
                        {isRecalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Recalcular Rota
                    </Button>
                    {route && <Badge variant="outline">{activeShift}</Badge>}
                </div>
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
                {displayStudents.map((student, index) => {
                    const isNextStop = student.id === nextStop?.id;
                    return (
                      <StudentListItem
                        key={student.id}
                        student={student}
                        index={index}
                        isNextStop={isNextStop}
                        onStatusChange={handleStatusChange}
                        onNavigate={handleNavigateToStudent}
                        onOpenAuthorizedModal={handleOpenAuthorizedModal}
                      />
                    );
                })}
                <li className="flex items-center gap-4 p-3">
                    <div className="w-8 h-8 flex items-center justify-center">
                      <School className="h-5 w-5 text-muted-foreground/50"/>
                    </div>
                    <span className="font-medium text-muted-foreground">{school?.name || "Escola"} (Destino Final)</span>
                </li>
                {displayStudents.length === 0 && (
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
        
        <RouteDirections directions={displayDirections} />

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin /> Mapa da Rota</CardTitle>
                 <CardDescription>
                    {dynamicRoute ? 'Visualização da rota original (pontilhada) e da rota recalculada (verde).' : 'Acompanhe a rota planejada em tempo real.'}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex justify-center flex-wrap gap-x-4 gap-y-2 mb-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-xs animate-pulse">1</div>Próxima</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500"></div>A Bordo</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-blue-500 opacity-50"></div>Futura</div>
                    <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-slate-400"></div>Concluída</div>
                    <div className="flex items-center gap-2"><div className="p-1 rounded-full bg-red-600"><School size={12} className="text-white"/></div>Escola</div>
                </div>
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
                                    currentRouteStudents={displayStudents}
                                    originalRouteStudents={dynamicRoute ? orderedStudents : null}
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

const RouteMap = memo(({ driverLocation, currentRouteStudents, originalRouteStudents, school }) => {
  const map = useMap();

  const nextStop = useMemo(() => 
    currentRouteStudents.find(s => s.status === 'aguardando'),
    [currentRouteStudents]
  );

  useEffect(() => {
    if (!map) return;

    const allStops = [...currentRouteStudents, ...(originalRouteStudents || [])];
    if (allStops.length === 0 && !school) return;
    
    const bounds = new google.maps.LatLngBounds();
    allStops.forEach(stop => {
        if (stop?.latitude && stop?.longitude) {
            bounds.extend({ lat: stop.latitude, lng: stop.longitude });
        }
    });
    if (school?.latitude && school?.longitude) {
        bounds.extend({ lat: school.latitude, lng: school.longitude });
    }
    if (driverLocation?.latitude && driverLocation?.longitude) {
        bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
    }

    if (bounds.isEmpty()) {
       if (school?.latitude && school?.longitude) {
         map.setCenter({ lat: school.latitude, lng: school.longitude });
         map.setZoom(14);
       }
       return;
    };
    map.fitBounds(bounds, 100);

  }, [map, driverLocation, currentRouteStudents, originalRouteStudents, school]);
  
  if (!school) return null;
  
  const originalPath = originalRouteStudents ? [
    ...(driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : []),
    ...originalRouteStudents.map(s => ({ lat: s.latitude, lng: s.longitude })),
    { lat: school.latitude, lng: school.longitude }
  ].filter(p => p.lat && p.lng) : [];

  const currentPath = [
    ...(driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : []),
    ...currentRouteStudents.map(s => ({ lat: s.latitude, lng: s.longitude })),
    { lat: school.latitude, lng: school.longitude }
  ].filter(p => p.lat && p.lng);

  return (
      <>
          {/* Driver Marker */}
          {driverLocation && (
              <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição" zIndex={100}>
                  <div className="p-1 bg-primary rounded-full shadow-lg">
                      <Bus className="h-6 w-6 text-primary-foreground" />
                  </div>
              </AdvancedMarker>
          )}

          {/* Student Markers */}
          {currentRouteStudents.map((student, index) => {
            if (!student.latitude || !student.longitude) return null;

            const isFinished = student.status === 'desembarcado' || student.status === 'ausente';
            const isOnBoard = student.status === 'a_bordo';
            const isNextStop = student.id === nextStop?.id;

            return (
              <AdvancedMarker key={`marker-${student.id}`} position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
                  <div className={cn(
                    "w-8 h-8 rounded-full shadow border-2 border-white flex items-center justify-center font-bold text-white text-sm",
                    isFinished && "bg-slate-400 border-slate-200 opacity-70",
                    isOnBoard && "bg-blue-500 border-blue-200",
                    !isFinished && !isOnBoard && isNextStop && "bg-green-500 border-green-200 scale-125 animate-pulse",
                    !isFinished && !isOnBoard && !isNextStop && "bg-blue-500 border-blue-200 opacity-50"
                  )}>
                      {index + 1}
                  </div>
              </AdvancedMarker>
            )
          })}
          
          {/* School Marker */}
          <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
               <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
                  <School className="h-5 w-5 text-white" />
               </div>
          </AdvancedMarker>

          {/* Polylines */}
          {originalPath.length > 1 && (
              <Polyline path={originalPath} strokeColor="#9ca3af" strokeOpacity={0} strokeWeight={6} icons={[{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.6, scale: 3 }, offset: '0', repeat: '10px' }]} />
          )}
          {currentPath.length > 1 && (
              <Polyline path={currentPath} strokeColor={originalPath.length > 1 ? "#22c55e" : "#4f46e5"} strokeOpacity={0.8} strokeWeight={6} />
          )}
      </>
  );
});
RouteMap.displayName = 'RouteMap';
