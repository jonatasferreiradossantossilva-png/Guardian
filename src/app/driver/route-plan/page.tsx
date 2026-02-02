
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
  CheckCircle,
  Play,
  Pause,
  Square,
  Share2,
  LocateFixed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc } from '@/hooks/use-mock-data';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';


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
interface Route {
  id: string;
  name: string;
  driverId: string;
  assistantId?: string;
  studentIds: string[];
  turnByTurnDirections?: string[];
  lastOptimizedAt?: string;
}

const formatAddress = (entity) => {
    if (!entity?.street) return 'Endereço indisponível';
    return `${entity.street}, ${entity.number}, ${entity.neighborhood}, ${entity.city} - ${entity.state}`;
};

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
        <div className="flex items-center gap-2 w-full sm:w-auto">
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


export default function DriverRoutePlanPage() {
  const { updateDoc, setDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const { toast } = useToast();
  const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] =
    useState<Student | null>(null);
    
  const [dynamicRoute, setDynamicRoute] = useState<{ students: Student[], directions?: string[] } | null>(null);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isAutoRecalculateEnabled, setIsAutoRecalculateEnabled] = useState(true);
  const [isStartingRoute, setIsStartingRoute] = useState(false);
  const [recenterRequest, setRecenterRequest] = useState(null);


  const [isClient, setIsClient] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<'manha-ida' | 'tarde-volta'>('manha-ida');


  useEffect(() => {
    // For this prototype, we'll force the user to be the main driver with a full route.
    setMockUserId('user-admin-1'); 
    setIsClient(true);
  }, []);

  const { shift, direction } = useMemo(() => {
    const [shiftStr, dir] = selectedTrip.split('-');
    return { 
        shift: shiftStr === 'manha' ? 'Manhã' : 'Tarde', 
        direction: dir 
    };
  }, [selectedTrip]);

  // Fetch driver profile based on logged-in user ID
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

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // Effect to select a default route
  useEffect(() => {
    if (routes && routes.length > 0 && !selectedRouteId) {
      setSelectedRouteId(routes[0].id);
    }
  }, [routes, selectedRouteId]);

  const route = useMemo(
    () => {
        if (!routes || !selectedRouteId) return null;
        return routes.find(r => r.id === selectedRouteId) ?? null;
    },
    [routes, selectedRouteId]
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
      .filter((s): s is Student => !!s && s.shift === shift);
  }, [route?.studentIds, students, shift]);
  
  const displayStudents = dynamicRoute ? dynamicRoute.students : orderedStudents;

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
  
  const { data: driverLocation, isLoading: isLocationLoading } = useMockNestedDoc(driverId ? `locations/${driverId}` : null);
  
  const locationRef = useRef(driverLocation);
  useEffect(() => {
    locationRef.current = driverLocation;
  }, [driverLocation]);

  const directionsToShow = dynamicRoute?.directions || route?.turnByTurnDirections;

  // Location simulation effect
  useEffect(() => {
    if (simulationIntervalRef.current) {
      clearInterval(simulationIntervalRef.current);
    }
    
    if (!driverId || driverProfile?.status !== 'em_rota' || !nextStop || !locationRef.current) {
      return;
    }

    const startPoint = { lat: locationRef.current.latitude, lng: locationRef.current.longitude };
    const endPoint = { lat: nextStop.latitude, lng: nextStop.longitude };

    const distance = Math.sqrt(Math.pow(endPoint.lat - startPoint.lat, 2) + Math.pow(endPoint.lng - startPoint.lng, 2));
    if (distance < 0.0001) {
        return;
    }

    let step = 0;
    const totalSteps = 20; 

    simulationIntervalRef.current = setInterval(() => {
      step++;
      if (step > totalSteps) {
        if(simulationIntervalRef.current) clearInterval(simulationIntervalRef.current);
        setDoc(`locations/${driverId}`, { 
          latitude: endPoint.lat, 
          longitude: endPoint.lng,
          timestamp: new Date().toISOString()
        });
        return;
      }
      const factor = step / totalSteps;
      const newLat = startPoint.lat + (endPoint.lat - startPoint.lat) * factor;
      const newLng = startPoint.lng + (endPoint.lng - startPoint.lng) * factor;

      setDoc(`locations/${driverId}`, { 
        latitude: newLat, 
        longitude: newLng,
        timestamp: new Date().toISOString()
      });
    }, 5000);

    return () => {
      if (simulationIntervalRef.current) {
        clearInterval(simulationIntervalRef.current);
      }
    };
  }, [driverId, driverProfile?.status, nextStop, setDoc]);

  const handleRecalculate = useCallback(async () => {
    if (direction === 'volta' || !displayStudents || displayStudents.length === 0 || !school) {
        toast({ title: "Não é possível recalcular", description: "Recalcular só está disponível para viagens de ida.", variant: "destructive" });
        return;
    }

    setIsRecalculating(true);
    
    const studentsToReroute = displayStudents.filter(s => s.status === 'aguardando');
    
    if (studentsToReroute.length === 0) {
        toast({ title: "Nenhuma parada restante", description: "Todos os alunos já foram visitados." });
        setIsRecalculating(false);
        return;
    }
    
    try {
        const studentInputs = studentsToReroute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) }));
        const schoolAddress = formatAddress(school);
        const startAddress = driverLocation ? `${driverLocation.latitude},${driverLocation.longitude}` : undefined;

        const input = {
            startAddress,
            students: studentInputs,
            schoolAddress: schoolAddress,
            context: "Recalcule a rota mais eficiente para as paradas restantes, partindo da minha localização atual e terminando na escola. Um ou mais alunos podem ter sido marcados como ausentes.",
        };

        const result = await optimizeSchoolVanRoute(input);
        
        const processedStudents = displayStudents.filter(s => s.status !== 'aguardando');
        
        const reorderedWaitingStudents = result.optimizedStudentIds
            .map(id => students.find(s => s.id === id))
            .filter((s): s is Student => !!s);

        const newDisplayOrder = [...processedStudents, ...reorderedWaitingStudents];

        setDynamicRoute({ students: newDisplayOrder, directions: result.turnByTurnDirections });

        toast({ title: "Rota Recalculada!", description: "A ordem das paradas foi atualizada." });

    } catch (error) {
        console.error("Error recalculating route:", error);
        toast({ title: "Erro ao Recalcular", description: "Não foi possível otimizar a rota. Tente novamente.", variant: "destructive" });
    } finally {
        setIsRecalculating(false);
    }
  }, [direction, displayStudents, school, driverLocation, students, toast]);

  // Route control handlers
  const handleStartRoute = useCallback(async () => {
      if (!driverId || !orderedStudents || !school) {
          toast({ title: "Erro", description: "Não foi possível iniciar a rota. Dados incompletos.", variant: "destructive"});
          return;
      }

      setIsStartingRoute(true);
      
      const studentsForTrip = orderedStudents.filter(s => s.status !== 'ausente');

      if (direction === 'ida' && studentsForTrip.length > 0) {
          try {
              const startAddress = driverProfile ? formatAddress(driverProfile) : undefined;
              const schoolAddress = formatAddress(school);
              const studentInputs = studentsForTrip.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) }));
              
              const result = await optimizeSchoolVanRoute({ students: studentInputs, schoolAddress, startAddress });
              const optimizedStudentOrder = result.optimizedStudentIds.map(id => students.find(s => s.id === id)).filter(Boolean) as Student[];

              setDynamicRoute({ students: optimizedStudentOrder, directions: result.turnByTurnDirections });
              toast({ title: "Rota Otimizada para Início!", description: "Sua rota de ida foi otimizada a partir da sua localização." });

          } catch (error) {
              console.error("Pre-flight optimization failed:", error);
              toast({ title: "Falha na otimização inicial", description: "Iniciando com a rota padrão.", variant: "destructive" });
              setDynamicRoute({ students: studentsForTrip, directions: [] }); // Fallback to non-optimized list
          }
      } else if (direction === 'volta') {
          // For the return trip, just reverse the order of students present
          const returnTripStudents = studentsForTrip.slice().reverse();
          setDynamicRoute({ students: returnTripStudents, directions: [] });
          toast({ title: "Rota de Volta Iniciada!", description: "Prepare-se para o desembarque." });
      }

      updateDoc('drivers', driverId, { status: 'em_rota' });
      setIsStartingRoute(false);
  }, [driverId, updateDoc, toast, orderedStudents, school, direction, driverProfile, students]);


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
      if (!driverId || !route) return;
      updateDoc('drivers', driverId, { status: 'inativo' });
      // Only reset students of the current shift
      const studentsToReset = (students || []).filter(s => s.shift === shift);
      studentsToReset.forEach(student => {
          if (student.status !== 'ausente') { // Don't reset absent students
            updateDoc('students', student.id, { status: 'aguardando' });
          }
      });

      if (simulationIntervalRef.current) {
          clearInterval(simulationIntervalRef.current);
      }
      setDynamicRoute(null);
      toast({
          title: "Rota Finalizada!",
          description: "Bom descanso! Os status dos alunos foram reiniciados.",
      });
  }, [driverId, route, updateDoc, toast, students, shift]);


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

    if (newStatus === 'ausente' && isAutoRecalculateEnabled && direction === 'ida') {
        handleRecalculate();
    }
  }, [updateDoc, students, toast, isAutoRecalculateEnabled, direction, handleRecalculate]);
  
  const handleShareToWhatsApp = useCallback(() => {
    if (!displayStudents || displayStudents.length === 0) {
      toast({
        title: "Rota vazia",
        description: "Não há alunos na rota para compartilhar.",
        variant: "destructive",
      });
      return;
    }

    const routeName = route?.name || "Rota";
    const tripType = `${shift} - ${direction === 'ida' ? 'Ida para Escola' : 'Volta para Casa'}`;

    let message = `*Plano de Rota: ${routeName} (${tripType})*\n\n`;
    let stopCounter = 1;

    if (direction === 'volta' && school) {
        message += `*${stopCounter++}. Partida:* ${school.name}\n`;
    }

    displayStudents.forEach((student) => {
        message += `*${stopCounter++}. Aluno:* ${student.name}\n   - Status: ${statusText[student.status]}\n`;
    });

    if (direction === 'ida' && school) {
        message += `*${stopCounter++}. Destino:* ${school.name}\n`;
    }
    
    message += `\n*Motorista:* ${driverProfile?.name || 'N/A'}`;
    
    const currentDirections = dynamicRoute?.directions || route?.turnByTurnDirections;
    if (currentDirections && currentDirections.length > 0) {
        message += `\n\n---\n\n*Instruções de Rota (Sugestão IA):*\n`;
        currentDirections.forEach((direction, index) => {
            message += `${index + 1}. ${direction}\n`;
        });
    }

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  }, [displayStudents, route, shift, direction, school, driverProfile, toast, dynamicRoute]);


  const isLoading =
    areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading || isLocationLoading;
    
  const SchoolStop = ({ isStart }: { isStart: boolean }) => (
    <li className="flex items-center gap-4 p-3">
        <div className="w-8 h-8 flex items-center justify-center">
            <School className="h-5 w-5 text-muted-foreground/50"/>
        </div>
        <span className="font-medium text-muted-foreground">{school?.name || "Escola"} ({isStart ? 'Ponto de Partida' : 'Destino Final'})</span>
    </li>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Painel do Motorista
          </h1>
          <div className="flex items-center gap-2">
            <Link href="/" passHref>
              <Button variant="outline">Voltar ao Login</Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="plan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="plan">
                    <ClipboardCheck className="mr-2 h-4 w-4" />
                    Plano de Rota
                </TabsTrigger>
                <TabsTrigger value="map">
                    <MapPin className="mr-2 h-4 w-4" />
                    Mapa Interativo
                </TabsTrigger>
            </TabsList>
            <TabsContent value="plan" className="mt-6 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Selecionar Viagem</CardTitle>
                        <CardDescription>Escolha a rota e o tipo de viagem que irá realizar.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Rota</Label>
                            <Select value={selectedRouteId || ''} onValueChange={setSelectedRouteId} disabled={!routes || routes.length === 0}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma rota..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {routes?.map(r => (
                                        <SelectItem key={r.id} value={r.id}>
                                            {r.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Viagem</Label>
                            <Select value={selectedTrip} onValueChange={(v) => setSelectedTrip(v as any)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a viagem..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="manha-ida">Manhã - Ida para Escola</SelectItem>
                                    <SelectItem value="tarde-volta">Tarde - Volta para Casa</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <ClipboardCheck />
                                    Progresso da Rota
                                </CardTitle>
                                <p className="text-muted-foreground text-sm pt-2">
                                {route ? `${route.name} - ${shift}` : 'Carregando rota...'}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                                {!isClient || isLoading ? (
                                     <Button disabled className="bg-green-600">
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Carregando...
                                    </Button>
                                ) : (
                                    <>
                                        {driverProfile?.status === 'inativo' && (
                                            <Button onClick={handleStartRoute} className="bg-green-600 hover:bg-green-700" disabled={isStartingRoute}>
                                                {isStartingRoute ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                                                Iniciar Rota
                                            </Button>
                                        )}
                                        {driverProfile?.status === 'em_rota' && (
                                            <>
                                                <Button onClick={handlePauseRoute} variant="outline">
                                                    <Pause className="mr-2 h-4 w-4" /> Pausar
                                                </Button>
                                                <Button onClick={handleEndRoute} variant="destructive">
                                                    <Square className="mr-2 h-4 w-4" /> Finalizar Rota
                                                </Button>
                                            </>
                                        )}
                                        {driverProfile?.status === 'pausa' && (
                                            <>
                                                <Button onClick={handleResumeRoute}>
                                                    <Play className="mr-2 h-4 w-4" /> Retomar Rota
                                                </Button>
                                                <Button onClick={handleEndRoute} variant="destructive">
                                                    <Square className="mr-2 h-4 w-4" /> Finalizar Rota
                                                </Button>
                                            </>
                                        )}
                                    </>
                                )}
                                <Button variant="outline" size="sm" onClick={() => handleRecalculate()} disabled={!isClient || isRecalculating || driverProfile?.status !== 'em_rota' || direction === 'volta'}>
                                    {isRecalculating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Recalcular
                                </Button>
                            </div>
                        </div>
                        <div className="flex items-center justify-end space-x-2 pt-4 border-t mt-4">
                            <Label htmlFor="auto-recalculate-toggle" className="text-sm font-normal text-muted-foreground">Recalculagem automática ao marcar ausência</Label>
                            <Switch
                                id="auto-recalculate-toggle"
                                checked={isAutoRecalculateEnabled}
                                onCheckedChange={setIsAutoRecalculateEnabled}
                                aria-label="Ativar ou desativar recalcular rota automaticamente"
                                disabled={!isClient || direction === 'volta'}
                            />
                        </div>
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
                        <>
                            <ol className="space-y-2">
                                {direction === 'volta' && school && <SchoolStop isStart={true} />}
                                {displayStudents.map((student, index) => {
                                    const isNextStop = student.id === nextStop?.id;
                                    return (
                                    <StudentListItem
                                        key={student.id}
                                        student={student}
                                        index={index + (direction === 'volta' ? 1 : 0)}
                                        isNextStop={isNextStop}
                                        onStatusChange={handleStatusChange}
                                        onNavigate={handleNavigateToStudent}
                                        onOpenAuthorizedModal={handleOpenAuthorizedModal}
                                    />
                                    );
                                })}
                                {direction === 'ida' && school && <SchoolStop isStart={false} />}
                                {displayStudents.length === 0 && (
                                    <div className="text-center text-muted-foreground py-10">
                                    <p>
                                        Nenhum aluno para o turno da {shift?.toLowerCase()}.
                                    </p>
                                    </div>
                                )}
                            </ol>
                            {directionsToShow && directionsToShow.length > 0 && (
                                <div className="mt-6 pt-4 border-t">
                                    <Accordion type="single" collapsible className="w-full">
                                        <AccordionItem value="directions">
                                            <AccordionTrigger>
                                                <div className="flex items-center gap-2 text-base">
                                                    <Navigation className="h-5 w-5 text-primary" />
                                                    Instruções de Rota (Sugestão da IA)
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent>
                                                <ScrollArea className="h-40">
                                                    <ol className="space-y-1.5 text-sm text-muted-foreground list-decimal list-inside pr-4">
                                                        {directionsToShow.map((direction, index) => (
                                                            <li key={index}>{direction}</li>
                                                        ))}
                                                    </ol>
                                                </ScrollArea>
                                                <p className="text-xs text-muted-foreground/80 mt-3 italic">
                                                    Atenção: Estas são instruções geradas por IA para planejamento e podem não refletir as condições de trânsito em tempo real.
                                                </p>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </div>
                            )}
                        </>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare /> Comunicação
                        </CardTitle>
                        <CardDescription>
                        Comunique-se com gestores e auxiliares, ou compartilhe o plano de rota.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button onClick={handleShareToWhatsApp} className="w-full">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-whatsapp mr-2 h-5 w-5"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.898 6.988c-.001 5.45-4.436-9.884-9.888-9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.204-1.639a11.819 11.819 0 0 0 5.79 1.583h.003c6.556 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
                                Compartilhar via WhatsApp
                            </Button>
                             <Button asChild variant="outline" className="w-full">
                                <Link href="/driver/messages">
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Mensagens Internas
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="map" className="mt-2">
                <div className="flex justify-center flex-wrap gap-x-3 sm:gap-x-4 gap-y-2 text-xs sm:text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-[10px] animate-pulse">1</div>Próxima</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500"></div>A Bordo</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-500 opacity-50"></div>Futura</div>
                    <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-400"></div>Concluída</div>
                    <div className="flex items-center gap-1.5"><div className="p-0.5 rounded-full bg-red-600"><School size={10} className="text-white"/></div>Escola</div>
                </div>
                <div className="relative h-[70vh] w-full rounded-lg overflow-hidden border bg-secondary">
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
                                    direction={direction}
                                    recenterRequest={recenterRequest}
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

const RouteMap = memo(({ driverLocation, currentRouteStudents, originalRouteStudents, school, direction, recenterRequest }) => {
  const map = useMap();

  const nextStop = useMemo(() => 
    currentRouteStudents.find(s => s.status === 'aguardando'),
    [currentRouteStudents]
  );
  
  useEffect(() => {
    if (recenterRequest && map && driverLocation) {
        map.panTo({ lat: driverLocation.latitude, lng: driverLocation.longitude });
        map.setZoom(16);
    }
  }, [recenterRequest, map, driverLocation]);

  useEffect(() => {
    if (!map || recenterRequest) return; // Don't auto-fit if a recenter was just requested

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

  }, [map, driverLocation, currentRouteStudents, originalRouteStudents, school, recenterRequest]);
  
  if (!school) return null;
  
  const originalPath = originalRouteStudents ? [
    ...(driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : []),
    ...(direction === 'volta' ? [{ lat: school.latitude, lng: school.longitude }] : []),
    ...originalRouteStudents.map(s => ({ lat: s.latitude, lng: s.longitude })),
    ...(direction === 'ida' ? [{ lat: school.latitude, lng: school.longitude }] : []),
  ].filter(p => p.lat && p.lng) : [];

  const currentPath = [
    ...(driverLocation ? [{ lat: driverLocation.latitude, lng: driverLocation.longitude }] : []),
    ...(direction === 'volta' ? [{ lat: school.latitude, lng: school.longitude }] : []),
    ...currentRouteStudents.map(s => ({ lat: s.latitude, lng: s.longitude })),
    ...(direction === 'ida' ? [{ lat: school.latitude, lng: school.longitude }] : []),
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
                      {index + 1 + (direction === 'volta' ? 1 : 0)}
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

    

    