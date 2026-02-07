










'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
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
  MessageSquare,
  IdCard,
  School,
  Navigation,
  Play,
  Pause,
  Square,
  CheckCircle,
  XCircle,
  Siren,
  Share2,
  Sparkles,
  ArrowLeft,
  MapPin,
  ListTree,
  LocateFixed,
  WifiOff,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, Pin } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';


type Shift = 'Manhã' | 'Tarde' | 'Integral';
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
  city?: string;
  state?: string;
  active?: boolean;
  serie?: string;
  turma?: string;
}

interface SchoolData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  street?: string;
  number?: string;
}

type Stop = {
  id: string;
  type: 'student' | 'school';
  data: Student | SchoolData;
}


const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente: 'Ausente',
};

// --- Sub-components for the new UI ---

const NextStopCard = ({ student, onStatusChange, onNavigate, onOpenAuthorizedModal, direction, onShareRoute, onScanQrCode, details }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, onNavigate: (data: any) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onShareRoute: () => void, onScanQrCode: () => void, details: string }) => {
  if (!student) return null;

  const isGoing = direction === 'ida';

  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardDescription>Próxima Parada</CardDescription>
        <CardTitle className="flex items-start gap-3 text-2xl">
            <Avatar className="h-12 w-12 flex-shrink-0">
                <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <span>{student.name}</span>
                {details && (
                  <p className="text-base font-medium text-muted-foreground">{details}</p>
                )}
            </div>
            <Badge variant="secondary" className="text-sm font-medium self-center">{student.shift}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {student.street ? `${student.street}, ${student.number}` : 'Endereço não disponível'}
        </p>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {isGoing ? (
            <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                <CheckCircle className="mr-2 h-5 w-5" /> Embarcou
            </Button>
        ) : (
             <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                <CheckCircle className="mr-2 h-5 w-5" /> Desembarcou
            </Button>
        )}
        <Button size="lg" variant="destructive" onClick={() => onStatusChange(student.id, 'ausente')}>
          <XCircle className="mr-2 h-5 w-5" /> Ausente
        </Button>
      </CardContent>
       <CardFooter className="grid grid-cols-4 gap-2">
           <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={onScanQrCode}>
              <QrCode className="h-5 w-5" />
              <span>Escanear</span>
            </Button>
           <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={() => onNavigate(student)}>
              <Navigation className="h-5 w-5" />
              <span>Navegar</span>
            </Button>
           <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={() => onOpenAuthorizedModal(student)}>
              <IdCard className="h-5 w-5"/>
              <span>Contatos</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={onShareRoute}>
                <Share2 className="h-5 w-5"/>
                <span>Localização</span>
            </Button>
       </CardFooter>
    </Card>
  );
};

const NextStopSchoolCard = ({ school, onDropOff, onNavigate, onShareRoute }: { school: SchoolData, onDropOff: (id: string) => void, onNavigate: (data: any) => void, onShareRoute: () => void }) => {
  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardDescription>Próxima Parada (Destino)</CardDescription>
        <CardTitle className="flex items-start gap-3 text-2xl">
          <div className="flex items-center justify-center h-12 w-12 flex-shrink-0 bg-secondary rounded-lg">
            <School className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="flex-grow">
            <span>{school.name}</span>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {school.street ? `${school.street}, ${school.number}` : 'Endereço não disponível'}
        </p>
      </CardHeader>
      <CardContent>
        <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => onDropOff(school.id)}>
          <Bus className="mr-2 h-5 w-5" /> Desembarcar Alunos
        </Button>
      </CardContent>
      <CardFooter className="grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-auto py-3" onClick={() => onNavigate(school)}>
          <Navigation className="mr-2 h-5 w-5" />
          <span>Navegar</span>
        </Button>
        <Button variant="outline" className="h-auto py-3" onClick={onShareRoute}>
          <Share2 className="mr-2 h-5 w-5"/>
          <span>Localização</span>
        </Button>
      </CardFooter>
    </Card>
  );
};


const UpcomingStopsList = ({ stops, formatStudentDetails }: { stops: Stop[], formatStudentDetails: (student: Student) => string }) => {
  if (!stops || stops.length === 0) {
    return <p className="text-center text-muted-foreground text-sm py-4">Nenhuma parada futura.</p>;
  }

  return (
    <div className="w-full space-y-2">
       <h3 className="text-sm font-semibold text-muted-foreground px-1">A seguir...</h3>
        <ul className="space-y-1">
            {stops.map((stop, index) => {
              const isStudent = stop.type === 'student';
              const item = stop.data as Student | SchoolData;

              return (
                <li key={`${stop.id}-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                    <div className="flex-shrink-0 w-5 text-center text-xs font-mono text-muted-foreground">{index + 2}.</div>
                     <Avatar className="h-8 w-8">
                        {isStudent ? (
                            <>
                                <AvatarImage src={`https://picsum.photos/seed/student-${item.id}/40/40`} alt={item.name} />
                                <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full w-full bg-background rounded-full">
                              <School className="h-4 w-4 text-muted-foreground" />
                            </div>
                        )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                           {isStudent ? formatStudentDetails(item as Student) : "Ponto de desembarque"}
                        </p>
                    </div>
                    {isStudent && <Badge variant="outline" className="font-normal text-xs">{(item as Student).shift}</Badge>}
                </li>
              )
            })}
        </ul>
    </div>
  );
};

const FixedBottomBar = ({ onPause, onResume, onEnd, status }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 z-50">
        <div className="mx-auto max-w-md">
            <div className="grid grid-cols-3 gap-3">
                <Button asChild variant="outline" className="flex flex-col h-auto py-2 items-center justify-center gap-1">
                    <Link href="/driver/messages">
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-xs font-normal">Mensagens</span>
                    </Link>
                </Button>
                
                {status === 'em_rota' && (
                    <Button variant="outline" className="flex flex-col h-auto py-2 items-center justify-center gap-1" onClick={onPause}>
                        <Pause className="h-5 w-5" />
                        <span className="text-xs font-normal">Pausar</span>
                    </Button>
                )}
                {status === 'pausa' && (
                    <Button className="flex flex-col h-auto py-2 items-center justify-center gap-1" onClick={onResume}>
                        <Play className="h-5 w-5" />
                        <span className="text-xs font-normal">Retomar</span>
                    </Button>
                )}

                <Button variant="destructive" className="flex flex-col h-auto py-2 items-center justify-center gap-1" onClick={onEnd}>
                    <Square className="h-5 w-5" />
                    <span className="text-xs font-normal">Finalizar</span>
                </Button>
            </div>
        </div>
    </div>
);

function RouteMap({ driverLocation, stops, toast, recenterTrigger }: { driverLocation: any, stops: Stop[], toast: any, recenterTrigger: number }) {
    const map = useMap();
    const directionsRendererRef = useRef(null);

    useEffect(() => {
        if (map && !directionsRendererRef.current) {
            directionsRendererRef.current = new google.maps.DirectionsRenderer({
                suppressMarkers: true,
                polylineOptions: {
                    strokeColor: "#2ab0c1",
                    strokeOpacity: 0.8,
                    strokeWeight: 6,
                },
            });
        }
        if (directionsRendererRef.current) {
          directionsRendererRef.current.setMap(map);
        }
    }, [map]);

    useEffect(() => {
        if (!map || !directionsRendererRef.current || !driverLocation || stops.length === 0) {
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        const destination = { lat: stops[stops.length - 1].data.latitude, lng: stops[stops.length - 1].data.longitude };
        const waypoints = stops
            .slice(0, -1) // All stops except the last one
            .map(stop => ({
                location: { lat: stop.data.latitude, lng: stop.data.longitude },
                stopover: true,
            }));

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false, 
            },
            (response, status) => {
                if (status === "OK") {
                    directionsRendererRef.current.setDirections(response);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            }
        );

    }, [map, driverLocation, stops]);
    
    useEffect(() => {
        if (!map || stops.length === 0) return;
        
        const bounds = new google.maps.LatLngBounds();
        if (driverLocation) bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
        stops.forEach(s => s.data.latitude && bounds.extend({ lat: s.data.latitude, lng: s.data.longitude }));
        
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, 100);
        }

    }, [map, driverLocation, stops, recenterTrigger]);

    return (
        <>
            {driverLocation && (
                <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição" zIndex={10}>
                     <Pin background={'#2ab0c1'} borderColor={'#fff'} glyphColor="#fff">
                        <Bus />
                    </Pin>
                </AdvancedMarker>
            )}
            {stops.map((stop) => {
                 const isStudent = stop.type === 'student';
                 const item = stop.data;
                 if (!item?.latitude || !item?.longitude) return null;

                 return (
                    <AdvancedMarker key={stop.id} position={{ lat: item.latitude, lng: item.longitude }} title={item.name}>
                        {isStudent ? (
                            <Pin background={'#3b82f6'} borderColor={'#fff'}>
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={`https://picsum.photos/seed/student-${item.id}/40/40`} alt={item.name} />
                                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </Pin>
                        ) : (
                            <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff">
                                <School />
                            </Pin>
                        )}
                    </AdvancedMarker>
                );
            })}
        </>
    );
}

export default function DriverRoutePlanPage() {
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  
  const [selectedRouteIdForStart, setSelectedRouteIdForStart] = useState<string>('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRecalculatePrompt, setShowRecalculatePrompt] = useState(false);
  const [lastProcessedStudent, setLastProcessedStudent] = useState<Student | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const prevStudentsRef = useRef<Student[]>();
  const isOnline = useOnlineStatus();


  useEffect(() => {
    // In a real app, you'd get this from your auth state.
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || "user-motorista-2"); 
    const storedActiveRouteId = sessionStorage.getItem('activeRouteId');
    setActiveRouteId(storedActiveRouteId);
  }, []);

  const shift = selectedShift;
  const direction = selectedDirection;

  const driverFilter = useMemo(
    () => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined),
    [mockUserId]
  );
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', driverFilter);
  const driverProfile = useMemo(() => (drivers ? drivers[0] : null), [drivers]);
  const driverId = driverProfile?.id;
  
  const { data: driverLocation } = useMockNestedDoc(driverId ? `locations/${driverId}` : null);

  const { data: routes, isLoading: isRouteLoading } = useMockCollection(
    'routes',
    driverId ? [{ field: 'driverId', op: '==', value: driverId }] : []
  );
  
  const route = useMemo(() => {
    if (driverProfile?.status !== 'inativo' && activeRouteId) {
        return routes?.find(r => r.id === activeRouteId) || null;
    }
    return routes?.find(r => r.id === selectedRouteIdForStart) || null;
  }, [routes, driverProfile, activeRouteId, selectedRouteIdForStart]);


  const { data: allStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');
  
  useEffect(() => {
    if (routes && routes.length > 0 && !selectedRouteIdForStart) {
        setSelectedRouteIdForStart(routes[0].id);
    }
  }, [routes, selectedRouteIdForStart]);

  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s])), [schools]);

  const formatStudentDetails = useCallback((student: Student) => {
    if (!student) return '';
    const school = schoolsMap.get(student.schoolId);

    // School abbreviation
    let schoolAbbr = school?.name?.replace(/^(Escola |Colégio )/i, '') || '';

    // Serie/Turma abbreviation
    let classInfo = '';
    if (student.serie) {
        classInfo = student.serie.replace(/ (Ano|Série)/i, '').trim();
    }
    if (student.turma) {
        const turmaFormatted = student.turma.replace(/Sala /i, 'S:').trim();
        classInfo += classInfo ? ` ${turmaFormatted}` : turmaFormatted;
    }

    return [schoolAbbr, classInfo].filter(Boolean).join(' | ');
  }, [schoolsMap]);


  const routeDetailsMap = useMemo(() => {
    if (!routes || !allStudents || !schools) return new Map();

    const studentMap = new Map(allStudents.map(s => [s.id, s,]));
    const schoolMap = new Map(schools.map(s => [s.id, s.name]));

    const details = new Map();
    routes.forEach(route => {
        const firstStudentId = route.studentIds?.find(id => id.startsWith('student-'));
        const firstStudent = firstStudentId ? studentMap.get(firstStudentId) : undefined;
        const schoolName = firstStudent ? schoolMap.get(firstStudent.schoolId) : 'Escola não encontrada';
        details.set(route.id, {
            ...route,
            schoolName: schoolName
        });
    });
    return details;
  }, [routes, allStudents, schools]);


  const orderedStops = useMemo<Stop[]>(() => {
    if (!route?.studentIds || !allStudents || !schools) return [];
    const studentMap = new Map(allStudents.map(s => [s.id, s]));
    const schoolMap = new Map(schools.map(s => [s.id, s]));

    return route.studentIds.map(id => {
        if (id.startsWith('student-')) {
            const student = studentMap.get(id);
            if (student && student.active !== false) {
                 const isCompatibleShift = student.shift === 'Integral' || student.shift === shift;
                 if (isCompatibleShift) {
                    return { id, type: 'student', data: student as Student };
                 }
            }
        } else if (id.startsWith('school-')) {
            const school = schoolMap.get(id);
            if (school) {
                return { id, type: 'school', data: school as SchoolData };
            }
        }
        return null;
    }).filter((s): s is Stop => s !== null);
  }, [route?.studentIds, allStudents, schools, shift]);

  const { activeStop, upcomingStops } = useMemo(() => {
    if (driverProfile?.status !== 'em_rota' || !orderedStops) {
      return { activeStop: null, upcomingStops: [] };
    }
    
    let nextStopIndex = -1;

    if (direction === 'ida') {
        nextStopIndex = orderedStops.findIndex(stop => {
            if (stop.type === 'student') {
                return stop.data.status === 'aguardando';
            }
            // A school is a valid next stop if there are no 'aguardando' students before it.
            // This is implicitly handled by findIndex.
            return true;
        });
    } else { // 'volta'
        nextStopIndex = orderedStops.findIndex(stop => 
            stop.type === 'student' && (stop.data as Student).status === 'a_bordo'
        );
    }
    
    if (nextStopIndex === -1) {
      return { activeStop: null, upcomingStops: [] };
    }

    const activeStop = orderedStops[nextStopIndex];
    const upcoming = orderedStops.slice(nextStopIndex + 1);

    return { activeStop, upcomingStops: upcoming };
  }, [orderedStops, driverProfile?.status, direction]);

  
  useEffect(() => {
    if (driverProfile?.status === 'em_rota' && prevStudentsRef.current && orderedStops) {
        const currentStudents = orderedStops.filter(s => s.type === 'student').map(s => s.data as Student);
        const newlyAbsentStudent = currentStudents.find(currentStudent => {
            const prevStudent = prevStudentsRef.current.find(p => p.id === currentStudent.id);
            return prevStudent && prevStudent.status !== 'ausente' && currentStudent.status === 'ausente';
        });

        if (newlyAbsentStudent) {
            setShowRecalculatePrompt(true);
        }
    }
    prevStudentsRef.current = orderedStops.filter(s => s.type === 'student').map(s => s.data as Student);
  }, [orderedStops, driverProfile?.status]);


  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    const student = (orderedStops.find(s => s.id === studentId)?.data as Student);
    if (student) setLastProcessedStudent(student); 

    updateDoc('students', studentId, { status: newStatus });
    toast({
        title: 'Status Atualizado',
        description: `${student?.name || 'O aluno'} foi marcado(a) como ${statusText[newStatus]}.`,
    });

    if (newStatus === 'ausente' && driverProfile?.status === 'em_rota') {
        setShowRecalculatePrompt(true);
    }
  }, [updateDoc, orderedStops, toast, driverProfile?.status]);
  
  const handleDropOff = useCallback((schoolId: string) => {
    const studentsToDropOff = orderedStops
        .filter(stop => stop.type === 'student' && (stop.data as Student).status === 'a_bordo' && (stop.data as Student).schoolId === schoolId)
        .map(stop => stop.id);

    if (studentsToDropOff.length === 0) {
        toast({ title: "Nenhum aluno para desembarcar", description: "Não há alunos a bordo para esta escola.", variant: "destructive" });
        return;
    }

    studentsToDropOff.forEach(studentId => {
        updateDoc('students', studentId, { status: 'desembarcado' });
    });

    toast({ title: "Alunos desembarcados!", description: `${studentsToDropOff.length} alunos foram marcados como desembarcados.` });
}, [orderedStops, updateDoc, toast]);


  const handleStartRoute = useCallback(() => {
    if (!driverId || !route) return;
    
    sessionStorage.setItem('activeRouteId', route.id);
    setActiveRouteId(route.id);

    const studentsOnThisRoute = orderedStops.filter(s => s.type === 'student').map(s => s.data as Student);

    if (direction === 'ida') {
        studentsOnThisRoute.forEach(student => {
            updateDoc('students', student.id, { status: 'aguardando' });
        });
    } else if (direction === 'volta') {
        studentsOnThisRoute.forEach(student => {
             if (student.status !== 'ausente') { 
                updateDoc('students', student.id, { status: 'a_bordo' });
            }
        });
    }

    if (route.optimizationNotice) {
        toast({
            title: "Aviso de Rota",
            description: route.optimizationNotice,
        });
        updateDoc('routes', route.id, { optimizationNotice: '' });
    }

    updateDoc('drivers', driverId, { status: 'em_rota' });
    toast({ title: "Viagem Iniciada!", description: "Boa viagem!" });
  }, [driverId, route, direction, orderedStops, updateDoc, toast]);

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
      if (!driverId || !allStudents) return;
      updateDoc('drivers', driverId, { status: 'inativo' });
      sessionStorage.removeItem('activeRouteId');
      setActiveRouteId(null);
      
      allStudents.forEach(student => {
          if (route?.studentIds.includes(student.id)) {
            updateDoc('students', student.id, { status: 'aguardando' });
          }
      });
      toast({
          title: "Rota Finalizada!",
          description: "Bom descanso! Os status dos alunos foram reiniciados.",
      });
  }, [driverId, allStudents, route?.studentIds, updateDoc, toast]);

  const handleOpenAuthorizedModal = useCallback((student: Student) => {
    setSelectedStudentForModal(student);
    setIsModalOpen(true);
  }, []);
  
  const handleNavigateToStudent = useCallback((data: Student | SchoolData) => {
    if (data.latitude && data.longitude) {
        const url = `https://www.google.com/maps/dir/?api=1&destination=${data.latitude},${data.longitude}`;
        window.open(url, '_blank');
    } else {
        toast({
            title: 'Endereço não encontrado',
            description: 'As coordenadas de GPS para esta parada não estão disponíveis.',
            variant: 'destructive'
        });
    }
  }, [toast]);
  
   const handleRecalculate = useCallback(async () => {
        const studentsOnRoute = orderedStops.filter(s => s.type === 'student').map(s => s.data as Student);
        const schoolsOnRoute = Array.from(new Set(studentsOnRoute.map(s => s.schoolId)))
            .map(id => schools.find(s => s.id === id)).filter(Boolean) as SchoolData[];
        
        if (!route || !studentsOnRoute.length || !schoolsOnRoute.length || !driverProfile) return;

        setIsRecalculating(true);
        try {
            const presentStudents = studentsOnRoute.filter(s => s.status !== 'ausente');
            const formatAddress = (entity) => entity && entity.street ? `${entity.street}, ${entity.number}, ${entity.neighborhood}, ${entity.city} - ${entity.state}` : '';
            
            const input = {
                students: presentStudents.map(s => ({ id: s.id, name: s.name, address: formatAddress(s), schoolId: s.schoolId })),
                schools: schoolsOnRoute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) })),
                startAddress: (driverProfile.latitude && driverProfile.longitude) ? `${driverProfile.latitude},${driverProfile.longitude}` : undefined,
            };

            const result = await optimizeSchoolVanRoute(input);
            
            updateDoc('routes', route.id, { 
                studentIds: result.optimizedStops.map(s => s.id),
                turnByTurnDirections: result.turnByTurnDirections,
                lastOptimizedAt: new Date().toISOString(),
            });

            toast({
                title: 'Rota Recalculada!',
                description: 'A rota foi otimizada para pular os alunos ausentes.',
            });

        } catch (error) {
            console.error("Failed to recalculate route:", error);
            toast({
                title: "Erro ao Recalcular",
                description: "Não foi possível otimizar a rota. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsRecalculating(false);
        }
    }, [route, orderedStops, schools, driverProfile, updateDoc, toast, setIsRecalculating]);

   const handleRecalculateFromPrompt = () => {
     setShowRecalculatePrompt(false);
     handleRecalculate();
   }

   const handleUndoLastAction = () => {
       if (!lastProcessedStudent) return;
       // The 'undo' is simply to revert to the previous status
       const previousStatus = direction === 'ida' ? 'aguardando' : 'a_bordo';
       updateDoc('students', lastProcessedStudent.id, { status: previousStatus });
       toast({
           title: "Ação desfeita",
           description: `O status de ${lastProcessedStudent.name} foi revertido.`
       });
   }
   
    const handleShareRoute = useCallback(() => {
        if (!driverLocation) {
            toast({
                title: "Localização não disponível",
                description: "Não foi possível obter sua localização atual para compartilhar.",
                variant: "destructive",
            });
            return;
        }

        const { latitude, longitude } = driverLocation;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `Estou em rota. Acompanhe minha localização em tempo real aqui: ${mapLink}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');

        toast({
            title: "Pronto para compartilhar!",
            description: "Sua mensagem foi gerada para ser enviada no WhatsApp.",
        });
    }, [driverLocation, toast]);

    const handleScanSuccess = useCallback((scannedId: string) => {
        if (!activeStop || activeStop.type !== 'student') {
            toast({ title: "Nenhuma parada de aluno ativa", description: "Não há uma próxima parada de aluno definida para escanear.", variant: "destructive"});
            return;
        }

        if (scannedId !== activeStop.id) {
            toast({ title: "Aluno Incorreto", description: "Este não é o aluno da próxima parada. Siga a ordem da rota.", variant: "destructive"});
            return;
        }
        
        const newStatus = direction === 'ida' ? 'a_bordo' : 'desembarcado';
        handleStatusChange(scannedId, newStatus);
        
        setIsScannerOpen(false);
    }, [activeStop, direction, handleStatusChange, toast]);
   
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
  
  if (driverProfile.status === 'inativo') {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6">
        {!isOnline && (
            <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm flex items-center justify-center gap-2 rounded-md absolute top-4">
                <WifiOff className="h-4 w-4" />
                Você está offline. Conecte-se para iniciar uma rota.
            </div>
        )}
        <Card className="w-full max-w-sm text-center">
          <CardHeader>
            <CardTitle>Pronto para Começar?</CardTitle>
            <CardDescription>Selecione a viagem que você irá realizar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-left">
                <Label>Selecione a Rota</Label>
                <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                    <SelectTrigger>
                        <SelectValue placeholder="Escolha uma rota..."/>
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from(routeDetailsMap.values()).map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.name} ({r.schoolName})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                    <Label className="text-base">Turno</Label>
                    <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)} className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Manhã" id="manha" />
                            <Label htmlFor="manha" className="font-normal">Manhã</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="Tarde" id="tarde" />
                            <Label htmlFor="tarde" className="font-normal">Tarde</Label>
                        </div>
                    </RadioGroup>
                </div>
                <div>
                    <Label className="text-base">Viagem</Label>
                    <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as 'ida' | 'volta')} className="space-y-2 pt-2">
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="ida" id="ida" />
                            <Label htmlFor="ida" className="font-normal">Ida para Escola</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="volta" id="volta" />
                            <Label htmlFor="volta" className="font-normal">Volta para Casa</Label>
                        </div>
                    </RadioGroup>
                </div>
            </div>
          </CardContent>
          <CardFooter>
             <Button size="lg" className="w-full" onClick={handleStartRoute} disabled={!selectedRouteIdForStart || !isOnline}>
                <Play className="mr-2 h-5 w-5"/>
                Iniciar Viagem
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
                 {!isOnline && (
                    <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm flex items-center justify-center gap-2 rounded-md absolute top-4">
                        <WifiOff className="h-4 w-4" />
                        Você está offline. As alterações serão sincronizadas quando a conexão voltar.
                    </div>
                 )}
                 <Pause className="h-16 w-16 text-muted-foreground" />
                 <h1 className="text-2xl font-bold">Viagem Pausada</h1>
                 <Button size="lg" onClick={handleResumeRoute}>
                    <Play className="mr-2 h-5 w-5"/>
                    Retomar Viagem
                 </Button>
                  <FixedBottomBar 
                    status={driverProfile.status} 
                    onEnd={handleEndRoute} 
                    onResume={handleResumeRoute} 
                  />
            </div>
        );
    }
    
    const isRouteFinished = !activeStop;
    
    return (
        <div className="min-h-screen bg-background text-foreground pb-24">
            {!isOnline && (
                <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm flex items-center justify-center gap-2 sticky top-0 z-50">
                    <WifiOff className="h-4 w-4" />
                    Você está offline. As alterações serão salvas e sincronizadas quando a conexão voltar.
                </div>
            )}
            <Tabs defaultValue="plan" className="w-full">
                 <div className="px-4 pt-4">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="plan"><ListTree className="mr-2 h-4 w-4"/>Plano de Rota</TabsTrigger>
                        <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger>
                    </TabsList>
                </div>
                
                <TabsContent value="plan" className="mt-4 p-4">
                    <div className="text-center mb-6">
                        <h1 className="text-2xl font-bold tracking-tight">{route?.name}</h1>
                        <p className="text-muted-foreground mt-1">{shift} - {direction === 'ida' ? 'Ida' : 'Volta'}</p>
                    </div>
                    <div className="max-w-md mx-auto space-y-4">
                        {isRouteFinished ? (
                            <Card className="w-full shadow-lg border-green-500/20 text-center p-8">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                                <CardTitle className="text-2xl">Viagem Finalizada!</CardTitle>
                                <CardDescription className="mt-2">Todos os alunos foram embarcados/desembarcados. Clique em "Finalizar" na barra inferior para concluir.</CardDescription>
                                <CardFooter className="flex-col gap-3 mt-6">
                                    <Button variant="destructive" className="w-full" onClick={handleEndRoute}>
                                    <Square className="mr-2 h-4 w-4" /> Finalizar e Arquivar Viagem
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={handleUndoLastAction} disabled={!lastProcessedStudent}>
                                    <ArrowLeft className="mr-2 h-4 w-4" /> Corrigir Última Parada
                                    </Button>
                                </CardFooter>
                            </Card>
                        ) : (
                            <>
                                {activeStop?.type === 'student' && (
                                  <NextStopCard 
                                      student={activeStop.data as Student} 
                                      onStatusChange={handleStatusChange} 
                                      onNavigate={handleNavigateToStudent}
                                      onOpenAuthorizedModal={() => handleOpenAuthorizedModal(activeStop.data as Student)}
                                      direction={direction}
                                      onShareRoute={handleShareRoute}
                                      onScanQrCode={() => setIsScannerOpen(true)}
                                      details={formatStudentDetails(activeStop.data as Student)}
                                  />
                                )}
                                {activeStop?.type === 'school' && direction === 'ida' && (
                                    <NextStopSchoolCard 
                                        school={activeStop.data as SchoolData}
                                        onDropOff={handleDropOff}
                                        onNavigate={handleNavigateToStudent}
                                        onShareRoute={handleShareRoute}
                                    />
                                )}
                                {upcomingStops.length > 0 && <UpcomingStopsList stops={upcomingStops} formatStudentDetails={formatStudentDetails} />}
                            </>
                        )}
                    </div>
                </TabsContent>
                <TabsContent value="map" className="mt-4">
                     <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground px-4">
                        <div className="flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary" /><span>Sua Posição</span></div>
                        <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-blue-500" /><span>Aluno</span></div>
                        <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600" /><span>Escola</span></div>
                    </div>
                     <div className="relative h-[70vh] w-full border-y">
                        <Button
                             variant="outline"
                             size="icon"
                             onClick={() => setRecenterTrigger(c => c + 1)}
                             className="absolute top-3 left-3 z-10 bg-background/80 hover:bg-background"
                             title="Centralizar Rota"
                         >
                             <LocateFixed />
                         </Button>
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
                                        zoomControl={true}
                                        zoomControlOptions={{
                                            position: 3,
                                        }}
                                    >
                                        <RouteMap 
                                            driverLocation={driverLocation}
                                            stops={orderedStops}
                                            toast={toast}
                                            recenterTrigger={recenterTrigger}
                                        />
                                    </GoogleMap>
                                </APIProvider>
                            )}
                     </div>
                </TabsContent>
             </Tabs>

            {showRecalculatePrompt && (
                <div className="fixed bottom-24 left-4 right-4 z-50 md:left-1/2 md:-translate-x-1/2 md:max-w-md">
                    <Card className="w-full bg-background/95 backdrop-blur-sm border-primary/50 shadow-2xl">
                        <CardHeader className="p-3 flex-row items-center gap-3">
                            <Siren className="h-5 w-5 text-primary"/>
                            <CardTitle className="text-base">Otimizar Rota?</CardTitle>
                        </CardHeader>
                        <CardContent className="p-3 pt-0">
                            <p className="text-sm text-muted-foreground">Detectamos um aluno ausente. Deseja recalcular a rota para um trajeto mais curto?</p>
                        </CardContent>
                        <CardFooter className="p-3 pt-0 flex gap-2">
                            <Button className="flex-1" onClick={handleRecalculateFromPrompt} disabled={isRecalculating}>
                                {isRecalculating ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/> }
                                Sim, Otimizar
                            </Button>
                            <Button className="flex-1" variant="ghost" onClick={() => setShowRecalculatePrompt(false)}>Ignorar</Button>
                        </CardFooter>
                    </Card>
                </div>
            )}


             <FixedBottomBar 
                status={driverProfile.status} 
                onPause={handlePauseRoute} 
                onResume={handleResumeRoute}
                onEnd={handleEndRoute}
            />

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

    



