
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
  ArrowLeft,
  MapPin,
  ListTree,
  LocateFixed,
  WifiOff,
  QrCode,
  Users,
  Check,
  X,
  Sparkles,
  AlertOctagon,
  RefreshCw,
  HeartPulse,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc, useMockDoc } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, Pin } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { RoutePolyline } from '@/components/shared/route-polyline';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ReportIncidentForm } from '@/components/dashboard/report-incident-form';


type Shift = 'Manhã' | 'Tarde' | 'Integral';
type StudentStatus = 'aguardando' | 'a_bordo' | 'desembarcado' | 'ausente_ida' | 'ausente_volta' | 'ausente_dia_todo';

interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  latitude: number;
  longitude: number;
  schoolId: string;
  medicalNote?: string;
  medicalConditions?: string[];
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
  ausente_ida: 'Ausente (Ida)',
  ausente_volta: 'Ausente (Volta)',
  ausente_dia_todo: 'Ausente (Dia Todo)',
};

// --- Sub-components ---

const NextStopCard = ({ student, onStatusChange, onNavigate, onOpenAuthorizedModal, direction, onShareRoute, onScanQrCode, details }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, onNavigate: (data: any) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onShareRoute: () => void, onScanQrCode: () => void, details: string }) => {
  const { toast } = useToast();
  if (!student) return null;

  const isGoing = direction === 'ida';
  const hasMedicalAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  return (
    <Card className={cn("w-full shadow-lg border-primary/20", hasMedicalAlert && "border-destructive ring-2 ring-destructive/20")}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardDescription>Próxima Parada</CardDescription>
            {hasMedicalAlert && (
                <Badge variant="destructive" className="animate-pulse flex gap-1 cursor-pointer" onClick={() => {
                    toast({
                        title: "🚨 ALERTA DE SAÚDE",
                        description: student.medicalNote || `Condições: ${student.medicalConditions?.join(', ')}`,
                        duration: 8000
                    });
                }}>
                    <HeartPulse className="h-3 w-3" /> ALERTA CRÍTICO
                </Badge>
            )}
        </div>
        <CardTitle className="flex items-start gap-3 text-2xl">
            <Avatar className="h-12 w-12 flex-shrink-0 border-2 border-background shadow-sm">
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
        
        {student.medicalConditions && student.medicalConditions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
                {student.medicalConditions.map(c => (
                    <Badge key={c} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 font-bold uppercase">{c}</Badge>
                ))}
            </div>
        )}
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
        <Button size="lg" variant="destructive" onClick={() => onStatusChange(student.id, direction === 'ida' ? 'ausente_ida' : 'ausente_volta')}>
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
    <Card className="w-full shadow-lg border-destructive/20">
      <CardHeader>
        <CardDescription>Parada na Escola (Desembarque)</CardDescription>
        <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 text-destructive">
                <School className="h-6 w-6" />
            </div>
            <span>{school.name}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {school.street ? `${school.street}, ${school.number}` : 'Endereço não disponível'}
        </p>
      </CardHeader>
      <CardContent>
        <Button size="lg" className="w-full bg-destructive hover:bg-destructive/90" onClick={() => onDropOff(school.id)}>
            <Bus className="mr-2 h-5 w-5" /> Desembarcar Alunos
        </Button>
      </CardContent>
       <CardFooter className="grid grid-cols-2 gap-2">
           <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={() => onNavigate(school)}>
              <Navigation className="h-5 w-5" />
              <span>Navegar</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={onShareRoute}>
                <Share2 className="h-5 w-5"/>
                <span>Localização</span>
            </Button>
       </CardFooter>
    </Card>
  );
};

const NextStopSchoolPickupCard = ({ school, onPickup, onNavigate, onShareRoute }: { school: SchoolData, onPickup: (id: string) => void, onNavigate: (data: any) => void, onShareRoute: () => void }) => {
  return (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader>
        <CardDescription>Parada na Escola (Embarque)</CardDescription>
        <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary">
                <School className="h-6 w-6" />
            </div>
            <span>{school.name}</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">
          {school.street ? `${school.street}, ${school.number}` : 'Endereço não disponível'}
        </p>
      </CardHeader>
      <CardContent>
        <Button size="lg" className="w-full" onClick={() => onPickup(school.id)}>
            <Users className="mr-2 h-5 w-5" /> Abrir Checklist de Embarque
        </Button>
      </CardContent>
       <CardFooter className="grid grid-cols-2 gap-2">
           <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={() => onNavigate(school)}>
              <Navigation className="h-5 w-5" />
              <span>Navegar</span>
            </Button>
            <Button variant="outline" className="flex flex-col h-auto py-2 justify-center gap-1 text-xs" onClick={onShareRoute}>
                <Share2 className="h-5 w-5"/>
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
              const hasAlert = isStudent && ((item as Student).medicalConditions?.length || (item as Student).medicalNote);

              return (
                <li key={`${stop.id}-${index}`} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                    <div className="flex-shrink-0 w-5 text-center text-xs font-mono text-muted-foreground">{index + 2}.</div>
                     <div className="relative">
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
                        {hasAlert && (
                            <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 border border-background">
                                <HeartPulse className="h-2.5 w-2.5" />
                            </div>
                        )}
                    </div>
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

const FixedBottomBar = ({ onPause, onResume, onEnd, status, onReportIncident }: { onPause: () => void, onResume: () => void, onEnd: () => void, status: string, onReportIncident: () => void }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-3 z-50">
        <div className="mx-auto max-lg">
            <div className="grid grid-cols-4 gap-2">
                <Button asChild variant="outline" className="flex flex-col h-auto py-2 items-center justify-center gap-1 px-1">
                    <Link href="/driver/messages">
                        <MessageSquare className="h-5 w-5" />
                        <span className="text-[10px] font-normal">Chat</span>
                    </Link>
                </Button>
                
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="flex flex-col h-auto py-2 items-center justify-center gap-1 px-1 text-amber-500 border-amber-500/20">
                            <AlertOctagon className="h-5 w-5" />
                            <span className="text-[10px] font-normal">Incidente</span>
                        </Button>
                    </DialogTrigger>
                    <ReportIncidentForm onFormSubmit={() => {}} />
                </Dialog>
                
                {status === 'em_rota' && (
                    <Button variant="outline" className="flex flex-col h-auto py-2 items-center justify-center gap-1 px-1" onClick={onPause}>
                        <Pause className="h-5 w-5" />
                        <span className="text-[10px] font-normal">Pausar</span>
                    </Button>
                )}
                {status === 'pausa' && (
                    <Button className="flex flex-col h-auto py-2 items-center justify-center gap-1 px-1" onClick={onResume}>
                        <Play className="h-5 w-5" />
                        <span className="text-[10px] font-normal">Retomar</span>
                    </Button>
                )}

                <Button variant="destructive" className="flex flex-col h-auto py-2 items-center justify-center gap-1 px-1" onClick={onEnd}>
                    <Square className="h-5 w-5" />
                    <span className="text-[10px] font-normal">Finalizar</span>
                </Button>
            </div>
        </div>
    </div>
);

function RouteMap({ driverLocation, stops, routePolyline, toast, recenterTrigger }: { driverLocation: any, stops: Stop[], routePolyline?: string, toast: any, recenterTrigger: number }) {
    const map = useMap();

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
            {routePolyline && <RoutePolyline geoJsonPath={routePolyline} />}
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
                 const hasAlert = isStudent && ((item as Student).medicalConditions?.length || (item as Student).medicalNote);

                 return (
                    <AdvancedMarker key={stop.id} position={{ lat: item.latitude, lng: item.longitude }} title={item.name}>
                        {isStudent ? (
                            <Pin background={ hasAlert ? '#dc2626' : '#3b82f6'} borderColor={'#fff'}>
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

function StudentChecklistRow({ student, onStatusChange, direction }: { student: Student; onStatusChange: (studentId: string, status: StudentStatus) => void; direction: 'ida' | 'volta' }) {
    const isProcessed = student.status !== 'aguardando';
    const { toast } = useToast();
    const hasAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

    return (
        <div className={cn("p-3 flex items-center gap-3 rounded-md transition-colors", isProcessed ? "bg-secondary" : "bg-background")}>
            <div className="relative">
                <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {hasAlert && (
                    <div className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 border-2 border-background cursor-pointer" onClick={() => {
                        toast({ 
                            title: `Atenção: ${student.name}`, 
                            description: student.medicalNote || `Condições: ${student.medicalConditions?.join(', ')}`, 
                            duration: 6000 
                        });
                    }}>
                        <HeartPulse className="h-3 w-3" />
                    </div>
                )}
            </div>
            <div className="flex-1">
                <p className={cn("font-medium", isProcessed && "text-muted-foreground line-through")}>{student.name}</p>
                {hasAlert && (
                    <p className="text-[9px] text-destructive font-bold uppercase truncate max-w-[150px]">
                        {student.medicalConditions?.join(' • ') || 'Ver Observação'}
                    </p>
                )}
            </div>
            {isProcessed ? (
                <Badge variant={student.status === 'a_bordo' ? 'default' : 'destructive'} className={cn(student.status === 'a_bordo' && "bg-green-600")}>
                    {student.status === 'a_bordo' ? 'Embarcou' : 'Ausente'}
                </Badge>
            ) : (
                <div className="flex gap-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(student.id, 'a_bordo')}><Check className="h-4 w-4"/></Button>
                    <Button size="sm" variant="destructive" onClick={() => onStatusChange(student.id, direction === 'ida' ? 'ausente_ida' : 'ausente_volta')}><X className="h-4 w-4"/></Button>
                </div>
            )}
        </div>
    )
}

function BoardingChecklist({
  school,
  students,
  onStatusChange,
  onComplete,
  onScanQrCode,
  direction
}: {
  school: SchoolData;
  students: Student[];
  onStatusChange: (studentId: string, status: StudentStatus) => void;
  onComplete: () => void;
  onScanQrCode: () => void;
  direction: 'ida' | 'volta';
}) {
    return (
        <div className="p-4 max-w-md mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Users />Embarque - {school.name}</CardTitle>
                    <CardDescription>Confirme os alunos que embarcaram ou use o atalho coletivo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Button className="w-full" variant="outline" onClick={onScanQrCode}>
                        <QrCode className="mr-2 h-4 w-4" />
                        Escanear QR Code
                    </Button>
                    <div className="space-y-2 max-h-[50vh] overflow-y-auto p-1">
                        {students.map(student => (
                            <StudentChecklistRow key={student.id} student={student} onStatusChange={onStatusChange} direction={direction} />
                        ))}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full bg-green-600 hover:bg-green-700" onClick={onComplete}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Confirmar Embarque Coletivo
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

// Haversine formula to calculate distance between two lat/lng points in KM
function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) {
  if (!coords1 || !coords2) return Infinity;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords1.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


export default function DriverRoutePlanPage() {
  const { updateDoc, setDoc, addDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  
  const [selectedRouteIdForStart, setSelectedRouteIdForStart] = useState<string>('');
  const [lastProcessedStudent, setLastProcessedStudent] = useState<Student | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [isReoptimizing, setIsReoptimizing] = useState(false);
  const isOnline = useOnlineStatus();

  // State for school selection dialog
  const [isSchoolSelectorOpen, setIsSchoolSelectorOpen] = useState(false);
  const [schoolsForSelection, setSchoolsForSelection] = useState<SchoolData[]>([]);
  const [selectedStartSchoolId, setSelectedStartSchoolId] = useState<string>('');

  // State for managing checklist view
  const [currentView, setCurrentView] = useState<'route' | 'checklist'>('route');
  const [checklistSchool, setChecklistSchool] = useState<SchoolData | null>(null);


  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || "user-motorista-4"); 
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
  const { data: vehicle } = useMockDoc('vehicles', driverProfile?.vehicleId);

  // --- Real-time Scalable Telemetry (Throttling & Delta Movement) ---
  const locRef = useRef(driverLocation);
  const lastSyncRef = useRef({ time: Date.now(), lat: 0, lng: 0 });
  
  useEffect(() => { locRef.current = driverLocation; }, [driverLocation]);

  useEffect(() => {
    if (driverProfile?.status !== 'em_rota' || !driverId || !vehicle) return;

    const interval = setInterval(() => {
        const currentLoc = locRef.current;
        if (!currentLoc) return;

        // Simula uma pequena variação de posição
        const jitterLat = (Math.random() - 0.5) * 0.0004; 
        const jitterLng = (Math.random() - 0.5) * 0.0004;
        const newLat = currentLoc.latitude + jitterLat;
        const newLng = currentLoc.longitude + jitterLng;

        // --- Lógica de Escala (Projeto Zero Custo) ---
        const lastSync = lastSyncRef.current;
        const distMoved = haversineDistance({lat: lastSync.lat, lng: lastSync.lng}, {lat: newLat, lng: newLng});
        const timePassed = (Date.now() - lastSync.time) / 1000;

        // Só atualiza o Firestore se a van se moveu > 30m ou se passou > 30s (Garante cota gratuita)
        if (distMoved > 0.03 || timePassed > 30) {
            setDoc(`locations/${driverId}`, {
                latitude: newLat,
                longitude: newLng,
                timestamp: new Date().toISOString()
            });
            
            lastSyncRef.current = { time: Date.now(), lat: newLat, lng: newLng };

            // Simular Incremento de Odômetro (Preditiva)
            const kmIncrement = distMoved > 0 ? distMoved : 0.1;
            updateDoc('vehicles', vehicle.id, {
                currentOdometer: (vehicle.currentOdometer || 0) + kmIncrement
            });
        }

    }, 10000); // Checagem local rápida, mas escrita lenta

    return () => clearInterval(interval);
  }, [driverProfile?.status, driverId, vehicle?.id, setDoc, updateDoc]);


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
  const studentsMap = useMemo(() => new Map(allStudents?.map(s => [s.id, s])), [allStudents]);

  const formatStudentDetails = useCallback((student: Student) => {
    if (!student) return '';
    const school = schoolsMap.get(student.schoolId);

    let schoolAbbr = school?.name?.replace(/^(Escola |Colégio )/i, '') || '';

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
  
  const schoolsInSelectedRoute = useMemo(() => {
    if (!route || !allStudents || !schools) return [];
    const schoolIdsInRoute = new Set(allStudents.filter(s => route.studentIds.includes(s.id)).map(s => s.schoolId));
    return schools.filter(s => schoolIdsInRoute.has(s.id));
}, [route, allStudents, schools]);


  const orderedStops = useMemo<Stop[]>(() => {
    if (!route?.studentIds || !allStudents || !schools) return [];
    const studentMap = new Map(allStudents.map(s => [s.id, s]));
    const schoolMap = new Map(schools.map(s => [s.id, s]));

    return route.studentIds.map(id => {
        if (id.startsWith('student-')) {
            const student = studentMap.get(id);
            if (student && student.active !== false) {
                 const isCompatibleShift = student.shift === 'Integral' || student.shift === shift;
                 
                 if (direction === 'ida' && (student.status === 'ausente_ida' || student.status === 'ausente_dia_todo')) return null;
                 if (direction === 'volta' && (student.status === 'ausente_volta' || student.status === 'ausente_dia_todo')) return null;

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
  }, [route?.studentIds, allStudents, schools, shift, direction]);

  const { activeStop, upcomingStops } = useMemo(() => {
    if (!orderedStops) {
      return { activeStop: null, upcomingStops: [] };
    }
    
    if (driverProfile?.status !== 'em_rota') {
      return { activeStop: null, upcomingStops: [] };
    }
  
    let nextStopIndex = -1;
  
    if (direction === 'ida') {
      nextStopIndex = orderedStops.findIndex(stop => {
        if (stop.type === 'student') {
          return stop.data.status === 'aguardando';
        }
        return true;
      });
    } else { // 'volta'
      const nextSchoolStopIndex = orderedStops.findIndex(stop => {
        if (stop.type !== 'school') return false;
        return orderedStops.some(s => 
            s.type === 'student' && 
            (s.data as Student).schoolId === stop.id && 
            (s.data as Student).status === 'aguardando'
        );
      });
  
      if (nextSchoolStopIndex !== -1) {
        nextStopIndex = nextSchoolStopIndex;
      } else {
        nextStopIndex = orderedStops.findIndex(stop => 
          stop.type === 'student' && (stop.data as Student).status === 'a_bordo'
        );
      }
    }
    
    if (nextStopIndex === -1) {
      return { activeStop: null, upcomingStops: [] };
    }
  
    const activeStop = orderedStops[nextStopIndex];
    const upcoming = orderedStops.slice(nextStopIndex + 1);
  
    return { activeStop, upcomingStops: upcoming };
  }, [orderedStops, driverProfile?.status, direction]);
  

  const handleContinuousOptimization = useCallback(async () => {
    if (!isOnline || !route || !driverId) return;
    
    const pendingStops = orderedStops.filter(stop => {
        if (stop.type === 'student') {
            return stop.data.status === 'aguardando' || (direction === 'volta' && stop.data.status === 'a_bordo');
        }
        return true; 
    });

    if (pendingStops.length < 2) return;

    setIsReoptimizing(true);
    try {
        const finishedIds = orderedStops
            .filter(stop => {
                if (stop.type === 'student') return stop.data.status !== 'aguardando' && stop.data.status !== 'a_bordo';
                return false; 
            })
            .map(s => s.id);

        const studentsToOptimize = pendingStops.filter(s => s.type === 'student').map(s => s.data as Student);
        const schoolsToOptimize = Array.from(new Set(studentsToOptimize.map(s => s.schoolId)))
            .map(id => schoolsMap.get(id))
            .filter(Boolean) as SchoolData[];

        const formatAddr = (e: Student | SchoolData) => `${e.street || ''}, ${e.number || ''}, ${e.city || ''}`;

        const optimization = await optimizeSchoolVanRoute({
            students: studentsToOptimize.map(s => ({ id: s.id, name: s.name, address: formatAddr(s), schoolId: s.schoolId })),
            schools: schoolsToOptimize.map(s => ({ id: s.id, name: s.name, address: formatAddr(s) })),
            startAddress: (driverLocation?.latitude && driverLocation?.longitude) ? `${driverLocation.latitude},${driverLocation.longitude}` : undefined,
            optimizationMode: 'flexible',
            direction: direction
        });

        const newlyOptimizedIds = optimization.optimizedStops.map(os => os.id);
        const finalSequence = [...finishedIds, ...newlyOptimizedIds];

        const allStopPoints = finalSequence.map(id => {
            const ent = studentsMap.get(id) || schoolsMap.get(id);
            return ent ? { lat: ent.latitude, lng: ent.longitude } : null;
        }).filter((w): w is {lat: number, lng: number} => w !== null && Number.isFinite(w.lat) && Number.isFinite(w.lng));

        if (driverLocation) {
            allStopPoints.unshift({ lat: driverLocation.latitude, lng: driverLocation.longitude });
        }

        let newPolyline = route.polyline;
        if (allStopPoints.length >= 2) {
            const routing = await routingGeoapify({ waypoints: allStopPoints });
            newPolyline = routing.polyline;
        }

        updateDoc('routes', route.id, { 
            studentIds: finalSequence,
            polyline: newPolyline,
            plannedDistanceKm: optimization.estimatedDistanceKm, // Atualiza a estimativa para o ROI final
            lastOptimizedAt: new Date().toISOString()
        });

        toast({ title: "Rota Auto-Ajustada", description: "Sequência otimizada com base na sua posição atual.", variant: "default" });

    } catch (error) {
        console.warn("Continuous optimization failed (silent):", error);
    } finally {
        setIsReoptimizing(false);
    }
  }, [isOnline, route, driverId, orderedStops, direction, schoolsMap, studentsMap, driverLocation, updateDoc, toast]);


  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    const student = (orderedStops.find(s => s.id === studentId)?.data as Student);
    if (student) setLastProcessedStudent(student); 

    updateDoc('students', studentId, { status: newStatus });
    toast({
        title: 'Status Atualizado',
        description: `${student?.name || 'O aluno'} foi marcado(a) como ${statusText[newStatus]}.`,
    });

    if (newStatus !== 'aguardando') {
        setTimeout(handleContinuousOptimization, 1000);
    }
  }, [updateDoc, orderedStops, toast, handleContinuousOptimization]);
  
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
    
    setTimeout(handleContinuousOptimization, 1000);
}, [orderedStops, updateDoc, toast, handleContinuousOptimization]);

    const handleStartRoute = useCallback(async (baseStops: Stop[]) => {
        if (!driverId || !route || !vehicle) return;
        setIsStarting(true);

        try {
            const studentsToInclude = baseStops.filter(s => s.type === 'student').map(s => s.data as Student);
            const schoolsToInclude = Array.from(new Set(studentsToInclude.map(s => s.schoolId)))
                .map(id => schoolsMap.get(id))
                .filter(Boolean) as SchoolData[];

            const formatAddr = (e: Student | SchoolData) => `${e.street || ''}, ${e.number || ''}, ${e.city || ''}`;

            const studentInput = studentsToInclude.map(s => ({
                id: s.id,
                name: s.name,
                address: formatAddr(s),
                schoolId: s.schoolId
            }));

            const schoolInput = schoolsToInclude.map(s => ({
                id: s.id,
                name: s.name,
                address: formatAddr(s)
            }));

            const optimization = await optimizeSchoolVanRoute({
                students: studentInput,
                schools: schoolInput,
                startAddress: (driverLocation?.latitude && driverLocation?.longitude) ? `${driverLocation.latitude},${driverLocation.longitude}` : undefined,
                optimizationMode: 'flexible',
                direction: direction
            });

            const optimizedStops: Stop[] = (optimization.optimizedStops || []).map(os => {
                const student = studentsMap.get(os.id);
                const school = schoolsMap.get(os.id);
                if (student) return { id: student.id, type: 'student', data: student };
                if (school) return { id: school.id, type: 'school', data: school };
                return null;
            }).filter((s): s is Stop => s !== null);

            const waypoints = optimizedStops
                .map(s => ({ lat: s.data.latitude, lng: s.data.longitude }))
                .filter(w => typeof w.lat === 'number' && Number.isFinite(w.lat) && typeof w.lng === 'number' && Number.isFinite(w.lng));
                
            if (driverLocation && Number.isFinite(driverLocation.latitude) && Number.isFinite(driverLocation.longitude)) {
                waypoints.unshift({ lat: driverLocation.latitude, lng: driverLocation.longitude });
            }

            if (waypoints.length >= 2) {
                const routing = await routingGeoapify({ waypoints });
                updateDoc('routes', route.id, { 
                    studentIds: optimizedStops.map(s => s.id),
                    polyline: routing.polyline,
                    direction: direction,
                    plannedDistanceKm: optimization.estimatedDistanceKm,
                    lastOptimizedAt: new Date().toISOString()
                });
            } else {
                updateDoc('routes', route.id, { 
                    studentIds: optimizedStops.map(s => s.id), 
                    direction: direction, 
                    plannedDistanceKm: optimization.estimatedDistanceKm
                });
            }

            // Armazena odômetro inicial para cálculo de ROI ao final
            sessionStorage.setItem('startOdometer', (vehicle.currentOdometer || 0).toString());
            sessionStorage.setItem('activeRouteId', route.id);
            setActiveRouteId(route.id);

            studentsToInclude.forEach(student => {
                if (!student.status.startsWith('ausente')) {
                    updateDoc('students', student.id, { status: 'aguardando' });
                }
            });

            updateDoc('drivers', driverId, { status: 'em_rota' });
            toast({ title: "Inteligência Ativada!", description: "Sua rota foi otimizada para sua posição atual." });

        } catch (error) {
            console.error("Erro ao iniciar rota dinâmica:", error);
            const finalStopIds = baseStops.map(s => s.id);
            updateDoc('routes', route.id, { studentIds: finalStopIds, direction: direction });
            sessionStorage.setItem('startOdometer', (vehicle.currentOdometer || 0).toString());
            sessionStorage.setItem('activeRouteId', route.id);
            setActiveRouteId(route.id);
            updateDoc('drivers', driverId, { status: 'em_rota' });
            toast({ title: "Viagem Iniciada", description: "Seguindo plano padrão." });
        } finally {
            setIsStarting(false);
        }

    }, [driverId, route, vehicle, driverLocation, direction, schoolsMap, studentsMap, updateDoc, toast]);

    const handleInitiateStart = () => {
        if (!route) return;

        if (direction === 'volta' && schoolsInSelectedRoute.length > 1) {
            setSchoolsForSelection(schoolsInSelectedRoute);
            setSelectedStartSchoolId(schoolsInSelectedRoute[0]?.id || '');
            setIsSchoolSelectorOpen(true);
        } else {
            let stopsToUse = orderedStops;
            if (direction === 'volta') {
                const schoolStops = stopsToUse.filter(s => s.type === 'school');
                const studentStops = stopsToUse.filter(s => s.type === 'student');
                const reversedStudentStops = [...studentStops].reverse(); 
                stopsToUse = [...schoolStops, ...reversedStudentStops];
            }
            handleStartRoute(stopsToUse);
        }
    };
    
    const handleConfirmSchoolAndStart = () => {
        if (!selectedStartSchoolId || !route) return;

        const allStudentStops = orderedStops.filter(s => s.type === 'student');
        const allSchoolData = schoolsInSelectedRoute;
        
        const selectedSchool = allSchoolData.find(s => s.id === selectedStartSchoolId);
        const otherSchools = allSchoolData.filter(s => s.id !== selectedStartSchoolId);

        if (!selectedSchool) return;

        const reversedStudentStops = [...allStudentStops].reverse();

        const reorderedStops: Stop[] = [
            { id: selectedSchool.id, type: 'school', data: selectedSchool },
            ...otherSchools.map(s => ({ id: s.id, type: 'school', data: s } as Stop)),
            ...reversedStudentStops
        ];
        
        handleStartRoute(reorderedStops);
        setIsSchoolSelectorOpen(false);
    };

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
      if (!driverId || !allStudents || !route || !vehicle || !driverProfile) return;
      
      const startOdo = Number(sessionStorage.getItem('startOdometer') || vehicle.currentOdometer);
      const actualDistance = vehicle.currentOdometer - startOdo;
      const plannedKm = route.plannedDistanceKm || 10;
      
      // Prova de ROI: Estimamos que sem o Guardian (plano manual), o motorista rodaria 15% mais.
      // SavingsKm = (Manual Estimado) - Real
      const manualBaseline = actualDistance * 1.15;
      const savingsKm = Math.max(0, manualBaseline - actualDistance);
      const fuelPrice = 6.00; // Diesel S10 médio
      const avgConsumption = 8; // 8km/l para Sprinter/Master
      const fuelSaved = (savingsKm / avgConsumption) * fuelPrice;

      // Grava histórico para o dashboard de performance
      addDoc('trip_history', {
          date: new Date().toISOString().split('T')[0],
          routeName: route.name,
          plannedKm: plannedKm,
          actualKm: Number(actualDistance.toFixed(1)),
          driverName: driverProfile.name,
          savingsKm: Number(savingsKm.toFixed(1)),
          fuelSaved: Number(fuelSaved.toFixed(2))
      });

      updateDoc('drivers', driverId, { status: 'inativo' });
      sessionStorage.removeItem('activeRouteId');
      sessionStorage.removeItem('startOdometer');
      setActiveRouteId(null);
      setCurrentView('route'); 
      setChecklistSchool(null);
      
      allStudents.forEach(student => {
          if (route?.studentIds.includes(student.id)) {
            if (!student.status.startsWith('ausente')) {
                updateDoc('students', student.id, { status: 'aguardando' });
            }
          }
      });
      
      toast({
          title: "Rota Finalizada!",
          description: `Você percorreu ${actualDistance.toFixed(1)}km. Economia estimada: R$ ${fuelSaved.toFixed(2)}.`,
      });
  }, [driverId, allStudents, route, vehicle, driverProfile, updateDoc, addDoc, toast]);

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
  

   const handleUndoLastAction = () => {
       if (!lastProcessedStudent) return;
       const previousStatus = 'aguardando';
       updateDoc('students', lastProcessedStudent.id, { status: previousStatus });
       toast({
           title: "Ação desfeita",
           description: `O status de ${lastProcessedStudent.name} foi revertido.`
       });
   }
   
    const handleShareRoute = useCallback(() => {
        if (!driverLocation) {
            toast({ title: "Localização não disponível", variant: "destructive" });
            return;
        }

        const { latitude, longitude } = driverLocation;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const message = `Estou em rota. Acompanhe minha localização em tempo real aqui: ${mapLink}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
        toast({ title: "Pronto para compartilhar!" });
    }, [driverLocation, toast]);

    const handlePickup = (schoolId: string) => {
        const school = schoolsMap.get(schoolId);
        if (school) {
            setChecklistSchool(school);
            setCurrentView('checklist');
        }
    };
    
    const handleCompleteBoarding = useCallback(async () => {
        if (!checklistSchool) return;

        const studentsToAutoBoard = orderedStops.filter(stop => 
            stop.type === 'student' && 
            (stop.data as Student).schoolId === checklistSchool.id && 
            (stop.data as Student).status === 'aguardando'
        );

        if (studentsToAutoBoard.length > 0) {
            studentsToAutoBoard.forEach(stop => {
                updateDoc('students', stop.id, { status: 'a_bordo' });
            });
        }

        setCurrentView('route');
        toast({ 
            title: `Embarque concluído em ${checklistSchool?.name}!`,
            description: studentsToAutoBoard.length > 0 ? `${studentsToAutoBoard.length} alunos embarcados automaticamente.` : undefined
        });
        setChecklistSchool(null);
        
        setTimeout(handleContinuousOptimization, 1000);
    }, [checklistSchool, orderedStops, updateDoc, toast, handleContinuousOptimization]);
    
    const handleScanSuccess = useCallback((scannedId: string) => {
        const student = (allStudents || []).find(s => s.id === scannedId);
        if (!student) {
            toast({ title: "Aluno não encontrado", variant: "destructive"});
            return;
        }

        let newStatus: StudentStatus;
        if (direction === 'ida' && student.status === 'aguardando') {
            newStatus = 'a_bordo';
        } else if (direction === 'volta' && student.status === 'a_bordo') {
            newStatus = 'desembarcado';
        } else if (direction === 'volta' && student.status === 'aguardando') {
            if (checklistSchool && student.schoolId === checklistSchool.id) {
                newStatus = 'a_bordo';
            } else {
                 toast({ title: "Ação não permitida", variant: "destructive"});
                return;
            }
        }
        else {
             toast({ title: "Ação não permitida", variant: "destructive"});
            return;
        }

        handleStatusChange(scannedId, newStatus);
        
        if(!checklistSchool) {
            setIsScannerOpen(false);
        }
    }, [allStudents, direction, checklistSchool, handleStatusChange, toast]);

   
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
      <>
        <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6">
          {!isOnline && (
              <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm flex items-center justify-center gap-2 rounded-md absolute top-4">
                  <WifiOff className="h-4 w-4" />
                  Você está offline.
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
                              <Label htmlFor="ida" className="font-normal">Ida</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="volta" id="volta" />
                              <Label htmlFor="volta" className="font-normal">Volta</Label>
                          </div>
                      </RadioGroup>
                  </div>
              </div>
            </CardContent>
            <CardFooter>
               <Button size="lg" className="w-full" onClick={handleInitiateStart} disabled={!selectedRouteIdForStart || isStarting}>
                  {isStarting ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Otimizando Rota...
                      </>
                  ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5 text-primary"/>
                        Iniciar Viagem Inteligente
                      </>
                  )}
              </Button>
            </CardFooter>
          </Card>
           <Button asChild variant="ghost"><Link href="/">Voltar ao Login</Link></Button>
        </div>

        <AlertDialog open={isSchoolSelectorOpen} onOpenChange={setIsSchoolSelectorOpen}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>Por onde você vai começar?</AlertDialogTitle>
                  <AlertDialogDescription>
                      Selecione a escola de embarque.
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                  <RadioGroup value={selectedStartSchoolId} onValueChange={setSelectedStartSchoolId} className="space-y-2">
                      {schoolsForSelection.map(school => (
                          <div key={school.id} className="flex items-center space-x-3 p-3 rounded-md border has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-secondary">
                              <RadioGroupItem value={school.id} id={`school-select-${school.id}`} />
                              <Label htmlFor={`school-select-${school.id}`} className="font-normal text-base cursor-pointer">{school.name}</Label>
                          </div>
                      ))}
                  </RadioGroup>
              </div>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleConfirmSchoolAndStart} disabled={isStarting}>
                      {isStarting ? "Preparando..." : "Confirmar e Iniciar"}
                  </AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
  
   if (driverProfile.status === 'pausa') {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-4 space-y-6 bg-secondary">
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
                    onReportIncident={() => {}}
                  />
            </div>
        );
    }

    if (currentView === 'checklist' && checklistSchool) {
        const studentsForChecklist = orderedStops
            .filter(stop => stop.type === 'student' && (stop.data as Student).schoolId === checklistSchool.id)
            .map(stop => stop.data as Student);

        return (
            <div className="min-h-screen bg-background text-foreground pb-24">
                <BoardingChecklist
                    school={checklistSchool}
                    students={studentsForChecklist}
                    onStatusChange={handleStatusChange}
                    onComplete={handleCompleteBoarding}
                    onScanQrCode={() => setIsScannerOpen(true)}
                    direction={direction}
                />
                 <QrScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={handleScanSuccess}
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
                    Offline. Sincronização automática pendente.
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
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold tracking-tight">{route?.name}</h1>
                            <p className="text-muted-foreground mt-1">{shift} - {direction === 'ida' ? 'Ida' : 'Volta'}</p>
                        </div>
                        {isReoptimizing && (
                            <Badge variant="outline" className="animate-pulse bg-primary/10 text-primary border-primary/20">
                                <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
                                Ajustando...
                            </Badge>
                        )}
                    </div>

                    <div className="max-w-md mx-auto space-y-4">
                        {isRouteFinished ? (
                            <Card className="w-full shadow-lg border-green-500/20 text-center p-8">
                                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                                <CardTitle className="text-2xl">Viagem Finalizada!</CardTitle>
                                <CardDescription className="mt-2">Todos os alunos foram processados.</CardDescription>
                                <CardFooter className="flex-col gap-3 mt-6">
                                    <Button variant="destructive" className="w-full" onClick={handleEndRoute}>
                                    <Square className="mr-2 h-4 w-4" /> Finalizar Viagem
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
                                {activeStop?.type === 'school' && direction === 'volta' && (
                                    <NextStopSchoolPickupCard 
                                        school={activeStop.data as SchoolData}
                                        onPickup={handlePickup}
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
                                    >
                                        <RouteMap 
                                            driverLocation={driverLocation}
                                            stops={orderedStops}
                                            routePolyline={route?.polyline}
                                            toast={toast}
                                            recenterTrigger={recenterTrigger}
                                        />
                                    </GoogleMap>
                                </APIProvider>
                            )}
                     </div>
                </TabsContent>
             </Tabs>

            
             <FixedBottomBar 
                status={driverProfile.status} 
                onPause={handlePauseRoute} 
                onResume={handleResumeRoute}
                onEnd={handleEndRoute}
                onReportIncident={() => {}}
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
