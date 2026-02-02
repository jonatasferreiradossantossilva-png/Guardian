
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  MapPin,
  Sparkles,
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
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';


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
  city?: string;
  state?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente: 'Ausente',
};

// --- Sub-components for the new UI ---

const NextStopCard = ({ student, onStatusChange, onNavigate, onOpenAuthorizedModal }) => {
  if (!student) return null;

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
       <CardFooter className="grid grid-cols-3 gap-2">
           <Button variant="outline" onClick={() => onNavigate(student)}>
              <Navigation className="mr-2 h-4 w-4" /> Navegar
            </Button>
           <Button variant="outline" onClick={() => onOpenAuthorizedModal(student)}>
              <IdCard className="mr-2 h-4 w-4"/> Contatos
            </Button>
            <Button variant="outline">
                <Phone className="mr-2 h-4 w-4"/> Ligar
            </Button>
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
       <h3 className="text-sm font-semibold text-muted-foreground px-1">A seguir...</h3 >
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

    return { data };
};


function RouteMap({ driverLocation, students, school, route, recenterRequest, toast }) {
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
        directionsRendererRef.current?.setMap(map);
    }, [map]);

    useEffect(() => {
        if (!map || !directionsRendererRef.current || !driverLocation || !school || students.length === 0) {
            return;
        }

        const directionsService = new google.maps.DirectionsService();
        const origin = { lat: driverLocation.latitude, lng: driverLocation.longitude };
        const destination = { lat: school.latitude, lng: school.longitude };
        const waypoints = students
            .filter(s => s.latitude && s.longitude)
            .map(s => ({
                location: { lat: s.latitude, lng: s.longitude },
                stopover: true,
            }));

        directionsService.route(
            {
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false, // Route is already pre-optimized
            },
            (response, status) => {
                if (status === "OK") {
                    directionsRendererRef.current.setDirections(response);
                } else {
                    console.error(`Directions request failed due to ${status}`);
                }
            }
        );

    }, [map, driverLocation, students, school, route]);
    
    useEffect(() => {
        if (!map || !recenterRequest) return;
        
        const bounds = new google.maps.LatLngBounds();
        if (driverLocation) bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
        students.forEach(s => s.latitude && bounds.extend({ lat: s.latitude, lng: s.longitude }));
        if (school) bounds.extend({ lat: school.latitude, lng: school.longitude });
        
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, 100);
        }

    }, [map, driverLocation, students, school, recenterRequest]);

    return (
        <>
            {driverLocation && (
                <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição">
                     <div className="p-1 bg-primary rounded-full shadow-lg">
                        <Bus className="h-6 w-6 text-primary-foreground" />
                    </div>
                </AdvancedMarker>
            )}
            {students.map((student) => {
                 if (!student?.latitude || !student?.longitude) return null;
                return (
                    <AdvancedMarker key={student.id} position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
                        <div className="p-1 rounded-full shadow border-2 border-white bg-blue-500">
                            <User className="h-4 w-4 text-white" />
                        </div>
                    </AdvancedMarker>
                );
            })}
            {school && school.latitude && school.longitude && (
                <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
                     <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
                        <School className="h-5 w-5 text-white" />
                     </div>
                </AdvancedMarker>
            )}
        </>
    );
}

export default function DriverRoutePlanPage() {
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<'manha-ida' | 'tarde-volta'>('manha-ida');
  const [recenterRequest, setRecenterRequest] = useState(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [showRecalculatePrompt, setShowRecalculatePrompt] = useState(false);
  const prevStudentsRef = useRef<Student[]>();


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
  
  const { data: driverLocation } = useMockNestedDocSnapshot(driverId ? `locations/${driverId}` : null);

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

  const schoolForRoute = useMemo(() => {
    if (!studentsOnRoute.length || !schools) return null;
    const studentWithSchool = studentsOnRoute.find(s => s.schoolId);
    if (!studentWithSchool) return null;
    return schools.find(s => s.id === studentWithSchool.schoolId);
  }, [studentsOnRoute, schools]);

  const nextStop = useMemo(() => {
    if (driverProfile?.status !== 'em_rota' || !studentsOnRoute) return null;

    if (direction === 'ida') {
        return studentsOnRoute.find(s => s.status === 'aguardando') || null;
    } else {
        const onBoardStudents = studentsOnRoute.filter(s => s.status === 'a_bordo');
        return onBoardStudents[onBoardStudents.length - 1] || null;
    }
  }, [studentsOnRoute, driverProfile?.status, direction]);
  
  const upcomingStops = useMemo(() => {
    if (!nextStop || !studentsOnRoute) return [];
     if (direction === 'ida') {
        const nextStopIndex = studentsOnRoute.findIndex(s => s.id === nextStop.id);
        return studentsOnRoute.slice(nextStopIndex + 1);
    } else {
        const nextStopIndex = studentsOnRoute.findIndex(s => s.id === nextStop.id);
        return studentsOnRoute.slice(0, nextStopIndex).reverse();
    }
  }, [nextStop, studentsOnRoute, direction]);
  
  useEffect(() => {
    if (driverProfile?.status === 'em_rota' && prevStudentsRef.current && studentsOnRoute) {
        const newlyAbsentStudent = studentsOnRoute.find(currentStudent => {
            const prevStudent = prevStudentsRef.current.find(p => p.id === currentStudent.id);
            return prevStudent && prevStudent.status !== 'ausente' && currentStudent.status === 'ausente';
        });

        if (newlyAbsentStudent) {
            setShowRecalculatePrompt(true);
        }
    }
    prevStudentsRef.current = studentsOnRoute;
  }, [studentsOnRoute, driverProfile?.status]);


  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    const student = studentsOnRoute.find(s => s.id === studentId);
    let effectiveStatus = newStatus;

    if (direction === 'volta' && newStatus === 'a_bordo') {
        effectiveStatus = 'desembarcado';
    }

    updateDoc('students', studentId, { status: effectiveStatus });
    toast({
        title: 'Status Atualizado',
        description: `${student?.name || 'O aluno'} foi marcado(a) como ${statusText[effectiveStatus]}.`,
    });

    if (effectiveStatus === 'ausente' && driverProfile?.status === 'em_rota') {
        setShowRecalculatePrompt(true);
    }
  }, [updateDoc, studentsOnRoute, toast, direction, driverProfile?.status]);

  const handleStartRoute = useCallback(() => {
    if (!driverId || !route) return;

    if (route.optimizationNotice) {
        toast({
            title: "Aviso de Rota",
            description: route.optimizationNotice,
        });
        updateDoc('routes', route.id, { optimizationNotice: '' });
    }

    updateDoc('drivers', driverId, { status: 'em_rota' });
    toast({ title: "Rota Iniciada!", description: "Boa viagem!" });
  }, [driverId, route, updateDoc, toast]);

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
  
   const handleRecalculate = useCallback(async () => {
        if (!route || !studentsOnRoute || !schoolForRoute || !driverProfile) return;

        setIsRecalculating(true);
        try {
            const presentStudents = studentsOnRoute.filter(s => s.status !== 'ausente');
            const formatAddress = (entity) => entity && entity.street ? `${entity.street}, ${entity.number}, ${entity.neighborhood}, ${entity.city} - ${entity.state}` : '';
            
            const input = {
                students: presentStudents.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) })),
                schoolAddress: formatAddress(schoolForRoute),
                startAddress: (driverProfile.latitude && driverProfile.longitude) ? `${driverProfile.latitude},${driverProfile.longitude}` : undefined,
            };

            const result = await optimizeSchoolVanRoute(input);
            
            updateDoc('routes', route.id, { 
                studentIds: result.optimizedStudentIds,
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
    }, [route, studentsOnRoute, schoolForRoute, driverProfile, updateDoc, toast, setIsRecalculating]);

   const handleRecalculateFromPrompt = () => {
     setShowRecalculatePrompt(false);
     handleRecalculate();
   }
   
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
                  <FixedBottomBar 
                    status={driverProfile.status} 
                    onEnd={handleEndRoute} 
                    onResume={handleResumeRoute} 
                  />
            </div>
        );
    }
    
    const isRouteFinished = !nextStop;
    
    return (
        <div className="min-h-screen bg-background text-foreground p-4 pb-24">
             <div className="max-w-md mx-auto space-y-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight">{route?.name}</h1>
                    <p className="text-muted-foreground">{shift} - {direction === 'ida' ? 'Ida' : 'Volta'}</p>
                </div>

                <Tabs defaultValue="plan" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="plan"><List className="mr-2 h-4 w-4"/>Plano de Rota</TabsTrigger>
                        <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger>
                    </TabsList>
                    <TabsContent value="plan" className="mt-4 space-y-6">
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
                    </TabsContent>
                    <TabsContent value="map" className="mt-4">
                        <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary"/><span>Van</span></div>
                            <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-blue-500"/><span>Aluno</span></div>
                            <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600"/><span>Escola</span></div>
                        </div>
                        <div className="relative h-[60vh] w-full rounded-lg overflow-hidden border">
                             {!API_KEY ? (
                                <div className="flex h-full w-full items-center justify-center bg-secondary/30 text-center p-4">
                                    <div>
                                        <p className="font-semibold text-lg">Mapa Indisponível</p>
                                        <p className="text-muted-foreground text-sm">A chave da API do Google Maps não foi configurada.</p>
                                    </div>
                                </div>
                            ) : (
                                <APIProvider apiKey={API_KEY}>
                                    <GoogleMap
                                        defaultCenter={{ lat: -23.55, lng: -46.63 }}
                                        defaultZoom={12}
                                        mapId="driver-map"
                                        gestureHandling={'greedy'}
                                        disableDefaultUI={true}
                                    >
                                        <RouteMap 
                                            driverLocation={driverLocation} 
                                            students={studentsOnRoute} 
                                            school={schoolForRoute} 
                                            route={route} 
                                            recenterRequest={recenterRequest}
                                            toast={toast}
                                        />
                                    </GoogleMap>
                                </APIProvider>
                            )}
                            <Button size="icon" variant="secondary" onClick={() => setRecenterRequest(Date.now())} className="absolute bottom-4 right-4 z-10 shadow-lg">
                                <LocateFixed className="h-5 w-5" />
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
             </div>

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
        </div>
    );
}

