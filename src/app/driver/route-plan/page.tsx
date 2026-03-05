
'use client';

import { useState, useMemo, useEffect, useCallback, useRef, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Bus,
  Loader2,
  MessageSquare,
  IdCard,
  School,
  Play,
  Square,
  CheckCircle,
  XCircle,
  Siren,
  LocateFixed,
  WifiOff,
  QrCode,
  HeartPulse,
  MapPin,
  Activity,
  Navigation,
  Pause,
  Users,
  Check,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc, useMockDoc } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { cn } from '@/lib/utils';
import { RoutePolyline } from '@/components/shared/route-polyline';
import { SmartMap } from '@/components/shared/smart-map';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ReportIncidentForm } from '@/components/dashboard/report-incident-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';

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
}

interface SchoolData {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

type Stop = {
  id: string;
  type: 'student' | 'school';
  data: Student | SchoolData;
}

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente_ida: 'Ausente (Ida)',
  ausente_volta: 'Ausente (Volta)',
  ausente_dia_todo: 'Ausente (Dia Todo)',
};

const GoogleMapMarkers = ({ driverLocation, stops, routePolyline }: { driverLocation: any, stops: Stop[], routePolyline?: string }) => (
    <>
        {routePolyline && <RoutePolyline geoJsonPath={routePolyline} strokeColor="#2ab0c1" />}
        {driverLocation && (
            <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição" zIndex={10}>
                 <Pin background={'#2ab0c1'} borderColor={'#fff'} glyphColor="#fff"><Bus className="h-4 w-4"/></Pin>
            </AdvancedMarker>
        )}
        {stops.map((stop) => {
             const item = stop.data;
             if (!item?.latitude) return null;
             const isStudent = stop.type === 'student';
             const hasAlert = isStudent && ((item as Student).medicalConditions?.length || (item as Student).medicalNote);
             return (
                <AdvancedMarker key={stop.id} position={{ lat: item.latitude, lng: item.longitude }} title={item.name}>
                    {isStudent ? (
                        <Pin background={ hasAlert ? '#dc2626' : '#3b82f6'} borderColor={'#fff'}>
                            <Avatar className="h-6 w-6">
                                <AvatarImage src={`https://picsum.photos/seed/student-${item.id}/40/40`} />
                                <AvatarFallback>{item.name[0]}</AvatarFallback>
                            </Avatar>
                        </Pin>
                    ) : (
                        <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff"><School className="h-4 w-4" /></Pin>
                    )}
                </AdvancedMarker>
            );
        })}
    </>
);

function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) {
  if (!coords1 || !coords2) return Infinity;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; 
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords1.lat);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function DriverRoutePlanPage() {
  const { updateDoc, setDoc, addDoc } = useMockData();
  const { toast } = useToast();
  
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  const [selectedRouteIdForStart, setSelectedRouteIdForStart] = useState<string>('');
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setMockUserId(sessionStorage.getItem('mockUserId') || "user-motorista-4"); 
    setActiveRouteId(sessionStorage.getItem('activeRouteId'));
  }, []);

  const driverFilter = useMemo(() => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined), [mockUserId]);
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', driverFilter);
  const driverProfile = useMemo(() => (drivers ? drivers[0] : null), [drivers]);
  const driverId = driverProfile?.id;
  const { data: driverLocation } = useMockNestedDoc(driverId ? `locations/${driverId}` : null);
  const { data: vehicle } = useMockDoc('vehicles', driverProfile?.vehicleId);

  const locRef = useRef(driverLocation);
  const lastSyncRef = useRef({ time: Date.now(), lat: 0, lng: 0 });
  useEffect(() => { locRef.current = driverLocation; }, [driverLocation]);

  useEffect(() => {
    if (driverProfile?.status !== 'em_rota' || !driverId || !vehicle) return;
    const interval = setInterval(() => {
        const currentLoc = locRef.current;
        if (!currentLoc) return;
        const newLat = currentLoc.latitude + (Math.random() - 0.5) * 0.0004;
        const newLng = currentLoc.longitude + (Math.random() - 0.5) * 0.0004;
        const lastSync = lastSyncRef.current;
        const distMoved = haversineDistance({lat: lastSync.lat, lng: lastSync.lng}, {lat: newLat, lng: newLng});
        const timePassed = (Date.now() - lastSync.time) / 1000;

        if (distMoved > 0.03 || timePassed > 30) {
            setDoc(`locations/${driverId}`, { latitude: newLat, longitude: newLng, timestamp: new Date().toISOString() });
            lastSyncRef.current = { time: Date.now(), lat: newLat, lng: newLng };
            updateDoc('vehicles', vehicle.id, { currentOdometer: (vehicle.currentOdometer || 0) + (distMoved > 0 ? distMoved : 0.1) });
        }
    }, 10000);
    return () => clearInterval(interval);
  }, [driverProfile?.status, driverId, vehicle?.id, setDoc, updateDoc]);

  const { data: routes, isLoading: isRouteLoading } = useMockCollection('routes', driverId ? [{ field: 'driverId', op: '==', value: driverId }] : []);
  const route = useMemo(() => (driverProfile?.status !== 'inativo' && activeRouteId) ? (routes?.find(r => r.id === activeRouteId) || null) : (routes?.find(r => r.id === selectedRouteIdForStart) || null), [routes, driverProfile, activeRouteId, selectedRouteIdForStart]);
  const { data: allStudents, isLoading: areStudentsLoading } = useMockCollection('students');
  const { data: schools, isLoading: areSchoolsLoading } = useMockCollection('schools');
  
  useEffect(() => { if (routes?.length && !selectedRouteIdForStart) setSelectedRouteIdForStart(routes[0].id); }, [routes, selectedRouteIdForStart]);

  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s])), [schools]);
  const studentsMap = useMemo(() => new Map(allStudents?.map(s => [s.id, s])), [allStudents]);

  const orderedStops = useMemo<Stop[]>(() => {
    if (!route?.studentIds || !allStudents || !schools) return [];
    return route.studentIds.map(id => {
        const student = studentsMap.get(id);
        const school = schoolsMap.get(id);
        if (student && student.active !== false) {
             if (selectedDirection === 'ida' && student.status.startsWith('ausente')) return null;
             if (selectedDirection === 'volta' && (student.status === 'ausente_volta' || student.status === 'ausente_dia_todo')) return null;
             if (student.shift === 'Integral' || student.shift === selectedShift) return { id, type: 'student', data: student as Student };
        } else if (school) return { id, type: 'school', data: school as SchoolData };
        return null;
    }).filter((s): s is Stop => s !== null);
  }, [route?.studentIds, allStudents, schools, selectedShift, selectedDirection, studentsMap, schoolsMap]);

  const { activeStop, upcomingStops } = useMemo(() => {
    if (!orderedStops || driverProfile?.status !== 'em_rota') return { activeStop: null, upcomingStops: [] };
    
    const nextStopIndex = orderedStops.findIndex(s => {
        if (selectedDirection === 'ida') {
            if (s.type === 'student') return s.data.status === 'aguardando';
            return orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'a_bordo');
        } else {
            if (s.type === 'school') return orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'aguardando');
            return s.data.status === 'a_bordo';
        }
    });

    if (nextStopIndex === -1) return { activeStop: null, upcomingStops: [] };
    return { activeStop: orderedStops[nextStopIndex], upcomingStops: orderedStops.slice(nextStopIndex + 1) };
  }, [orderedStops, driverProfile?.status, selectedDirection]);

  const studentsAtCurrentStop = useMemo(() => {
      if (!activeStop || activeStop.type !== 'school' || !allStudents) return [];
      const isIda = selectedDirection === 'ida';
      const targetStatus = isIda ? 'a_bordo' : 'aguardando';
      
      return allStudents.filter(s => 
          s.schoolId === activeStop.id && 
          s.status === targetStatus &&
          (s.shift === 'Integral' || s.shift === selectedShift) &&
          s.active !== false
      );
  }, [activeStop, allStudents, selectedDirection, selectedShift]);

  const handleEndRoute = useCallback(() => {
      updateDoc('drivers', driverId, { status: 'inativo' });
      sessionStorage.removeItem('activeRouteId');
      setActiveRouteId(null);
      
      toast({ 
          title: "Viagem Encerrada!", 
          description: `Retornando à tela inicial.` 
      });
  }, [driverId, updateDoc, toast]);

  const handleStartRoute = async () => {
    if (!route || !driverProfile) return;
    setIsOptimizing(true);
    try {
        const currentLoc = locRef.current;
        const startPoint = currentLoc ? `${currentLoc.latitude},${currentLoc.longitude}` : undefined;
        
        const studentStops = orderedStops.filter(s => s.type === 'student').map(s => ({
            id: s.id,
            name: s.data.name,
            address: `${(s.data as Student).street}, ${(s.data as Student).number}`,
            schoolId: (s.data as Student).schoolId
        }));

        const schoolStops = schools.filter(sch => studentStops.some(s => s.schoolId === sch.id)).map(sch => ({
            id: sch.id,
            name: sch.name,
            address: `${sch.street}, ${sch.number}`
        }));

        // Reset student status to ensure checklist is ready
        orderedStops.forEach(s => {
            if (s.type === 'student') {
                updateDoc('students', s.id, { status: 'aguardando' });
            }
        });

        const result = await optimizeSchoolVanRoute({
            students: studentStops,
            schools: schoolStops,
            startAddress: startPoint,
            direction: selectedDirection,
            optimizationMode: 'flexible'
        });

        const newIds = result.optimizedStops.map(s => s.id);
        const waypoints = result.optimizedStops.map(s => {
            const ent = studentsMap.get(s.id) || schoolsMap.get(s.id);
            return ent ? { lat: ent.latitude, lng: ent.longitude } : null;
        }).filter(Boolean) as {lat: number, lng: number}[];

        // BLINDAGEM TÉCNICA: Só chama o routing se houver pelo menos 2 pontos (origem/destino)
        let polylineData = "";
        if (waypoints.length >= 2) {
            try {
                const routing = await routingGeoapify({ waypoints });
                polylineData = routing.polyline;
            } catch (routingErr) {
                console.warn("Falha ao gerar traçado visual, prosseguindo apenas com itinerário:", routingErr);
            }
        }

        updateDoc('routes', route.id, { 
            studentIds: newIds, 
            polyline: polylineData, 
            lastOptimizedAt: new Date().toISOString() 
        });
        
        updateDoc('drivers', driverId, { status: 'em_rota' });
        
        sessionStorage.setItem('activeRouteId', route.id);
        setActiveRouteId(route.id);
        
        toast({ title: "IA: Rota Otimizada!", description: "Itinerário ajustado com base na sua posição atual." });
    } catch (e) {
        console.error(e);
        updateDoc('drivers', driverId, { status: 'em_rota' });
        setActiveRouteId(route.id);
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
    toast({ title: 'Status Atualizado', description: `O aluno foi marcado como ${statusText[newStatus]}.` });
    
    // Auto-return to home after last goal in IDA/VOLTA
    if (upcomingStops.length === 0 && (newStatus === 'desembarcado' || newStatus.startsWith('ausente'))) {
        setTimeout(handleEndRoute, 2000);
    }
  }, [updateDoc, toast, upcomingStops.length, handleEndRoute]);

  const handleSchoolAction = useCallback((schoolId: string) => {
      const isIda = selectedDirection === 'ida';
      const targetStatus = isIda ? 'desembarcado' : 'a_bordo';
      
      studentsAtCurrentStop.forEach(s => updateDoc('students', s.id, { status: targetStatus }));
      
      toast({ 
          title: isIda ? "Desembarque Coletivo!" : "Embarque Coletivo!", 
          description: `${studentsAtCurrentStop.length} alunos processados na escola.` 
      });

      if (upcomingStops.length === 0) {
          setTimeout(handleEndRoute, 2000);
      }
  }, [selectedDirection, studentsAtCurrentStop, updateDoc, toast, upcomingStops.length, handleEndRoute]);

  const handlePauseToggle = useCallback(() => {
      const isPaused = driverProfile?.status === 'pausa';
      updateDoc('drivers', driverId, { status: isPaused ? 'em_rota' : 'pausa' });
      toast({ title: isPaused ? 'Viagem Retomada!' : 'Viagem Pausada', description: isPaused ? 'GPS e Telemetria ativos.' : 'GPS em modo stand-by.' });
  }, [driverProfile?.status, driverId, updateDoc, toast]);

  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm z-[2000]"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        
        {driverProfile?.status === 'inativo' ? (
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl border-primary border-2">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-2 border-primary/20">
                            <Bus className="text-primary h-8 w-8" />
                        </div>
                        <CardTitle className="text-primary text-2xl font-black italic">Guardian</CardTitle>
                        <CardDescription className="font-bold text-foreground/80">Configure sua jornada operacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Selecione a Rota</Label>
                            <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                                <SelectTrigger className="h-12 border-primary/30 font-bold text-base bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Turno</Label>
                                <RadioGroup value={selectedShift} onValueChange={(v) => startTransition(() => setSelectedShift(v as Shift))} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 transition-colors bg-background">
                                        <RadioGroupItem value="Manhã" id="shift-m"/>
                                        <Label htmlFor="shift-m" className="flex-1 cursor-pointer font-bold text-sm">Manhã</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 transition-colors bg-background">
                                        <RadioGroupItem value="Tarde" id="shift-t"/>
                                        <Label htmlFor="shift-t" className="flex-1 cursor-pointer font-bold text-sm">Tarde</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Sentido</Label>
                                <RadioGroup value={selectedDirection} onValueChange={(v) => startTransition(() => setSelectedDirection(v as any))} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 transition-colors bg-background">
                                        <RadioGroupItem value="ida" id="dir-i"/>
                                        <Label htmlFor="dir-i" className="flex-1 cursor-pointer font-bold text-sm">Ida</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 transition-colors bg-background">
                                        <RadioGroupItem value="volta" id="dir-v"/>
                                        <Label htmlFor="dir-v" className="flex-1 cursor-pointer font-bold text-sm">Volta</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t bg-muted/10">
                        <Button className="w-full h-14 font-black text-lg shadow-xl bg-primary hover:bg-primary/90 text-white" onClick={handleStartRoute} disabled={isOptimizing}>
                            {isOptimizing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin"/> OTIMIZANDO...</> : <><Play className="mr-2 h-5 w-5 fill-current" /> INICIAR VIAGEM</>}
                        </Button>
                        <Link href="/" className="w-full"><Button variant="ghost" className="w-full font-bold text-muted-foreground">Voltar ao Login</Button></Link>
                    </CardFooter>
                </Card>
            </div>
        ) : (
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b bg-primary/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Bus className="text-primary h-6 w-6" />
                        <div>
                            <h1 className="font-black text-lg leading-tight text-foreground uppercase truncate max-w-[180px]">{route?.name}</h1>
                            <p className="text-[10px] text-primary uppercase font-black tracking-widest">{selectedShift} • {selectedDirection === 'ida' ? 'Sentido Escola' : 'Sentido Casa'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={driverProfile?.status === 'pausa' ? 'default' : 'outline'} size="icon" onClick={handlePauseToggle} className="border-primary/30 h-10 w-10 bg-background">
                            {driverProfile?.status === 'pausa' ? <Play className="h-5 w-5 fill-current text-white"/> : <Pause className="h-5 w-5 text-primary" />}
                        </Button>
                        <Button variant="outline" size="icon" asChild className="border-primary/30 h-10 w-10 bg-background"><Link href="/driver/messages"><MessageSquare className="h-5 w-5 text-primary" /></Link></Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="icon" className="h-10 w-10 shadow-lg shadow-destructive/20"><Siren className="h-5 w-5 animate-pulse"/></Button>
                            </DialogTrigger>
                            <ReportIncidentForm onFormSubmit={() => {}} />
                        </Dialog>
                    </div>
                </div>

                <Tabs defaultValue="itinerario" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 bg-muted/30 border-b">
                        <TabsList className="grid w-full grid-cols-2 h-12">
                            <TabsTrigger value="itinerario" className="gap-2 font-black text-xs uppercase data-[state=active]:text-primary"><Activity className="h-4 w-4" /> Itinerário</TabsTrigger>
                            <TabsTrigger value="mapa" className="gap-2 font-black text-xs uppercase data-[state=active]:text-primary"><LocateFixed className="h-4 w-4" /> Mapa ao Vivo</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="itinerario" className="flex-1 overflow-hidden animate-in fade-in duration-300">
                        <ScrollArea className="h-full">
                            <div className="p-4 space-y-6 pb-20">
                                {driverProfile?.status === 'pausa' && (
                                    <div className="p-4 rounded-lg bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 flex gap-3 animate-pulse">
                                        <Pause className="h-5 w-5 shrink-0" />
                                        <div>
                                            <p className="font-black text-sm uppercase">Viagem Pausada</p>
                                            <p className="text-xs font-medium">GPS e Telemetria em modo stand-by.</p>
                                        </div>
                                    </div>
                                )}

                                {!activeStop ? (
                                    <Card className="text-center p-10 bg-green-500/10 border-green-500/30 flex flex-col justify-center border-2">
                                        <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                                            <CheckCircle className="h-14 w-14 text-green-500"/>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-green-600 uppercase">Fim de Rota!</CardTitle>
                                        <p className="text-muted-foreground mt-2 max-w-xs mx-auto font-bold">Todos os alunos foram processados.</p>
                                        <Button variant="destructive" className="mt-10 w-full h-14 text-lg font-black shadow-xl" onClick={handleEndRoute}>
                                            <Square className="mr-3 h-5 w-5 fill-current"/> FINALIZAR OPERAÇÃO
                                        </Button>
                                    </Card>
                                ) : activeStop.type === 'student' ? (
                                    <div className="space-y-6">
                                        <NextStopCard 
                                            student={activeStop.data as Student} 
                                            onStatusChange={handleStatusChange} 
                                            onOpenAuthorizedModal={(s) => { setSelectedStudentForModal(s); setIsModalOpen(true); }} 
                                            direction={selectedDirection} 
                                            onScanQrCode={() => setIsScannerOpen(true)} 
                                            onEndEarly={handleEndRoute}
                                        />
                                        {upcomingStops.length > 0 && (
                                            <div className="space-y-3">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-1">Próximas Paradas ({upcomingStops.length})</h3>
                                                <div className="space-y-2">
                                                    {upcomingStops.slice(0, 5).map((stop, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border-2 bg-card shadow-sm">
                                                            {stop.type === 'student' ? (
                                                                <Avatar className="h-8 w-8 border shadow-sm">
                                                                    <AvatarImage src={`https://picsum.photos/seed/student-${stop.id}/40/40`}/>
                                                                    <AvatarFallback>S</AvatarFallback>
                                                                </Avatar>
                                                            ) : (
                                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive text-white">
                                                                    <School className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            <span className="text-sm font-black truncate flex-1 text-foreground">{stop.data.name}</span>
                                                            <Badge variant="secondary" className="text-[9px] font-black uppercase tracking-tighter">{stop.type === 'student' ? 'Aluno' : 'Escola'}</Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <NextStopSchoolCard 
                                        school={activeStop.data as SchoolData} 
                                        direction={selectedDirection}
                                        onAction={() => handleSchoolAction(activeStop.id)} 
                                        students={studentsAtCurrentStop}
                                        onStatusChange={handleStatusChange}
                                        onEndEarly={handleEndRoute}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="mapa" className="flex-1 relative animate-in fade-in duration-300">
                        <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="absolute top-4 left-4 z-[1000] bg-background shadow-xl border-primary/30 h-12 w-12">
                            <LocateFixed className="text-primary h-6 w-6"/>
                        </Button>
                        <SmartMap 
                            center={{ lat: driverLocation?.latitude || -23.55, lng: driverLocation?.longitude || -46.63 }}
                            zoom={15}
                            stops={orderedStops}
                            driverLocation={driverLocation}
                            routePolyline={route?.polyline}
                            recenterTrigger={recenterTrigger}
                            forcedMode="google"
                        >
                            <GoogleMapMarkers driverLocation={driverLocation} stops={orderedStops} routePolyline={route?.polyline} />
                        </SmartMap>
                    </TabsContent>
                </Tabs>
            </div>
        )}

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
            onScanSuccess={(id) => { 
                handleStatusChange(id, selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'); 
                setIsScannerOpen(false); 
            }} 
        />
    </div>
  );
}

function NextStopCard({ student, onStatusChange, onOpenAuthorizedModal, direction, onScanQrCode, onEndEarly }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onScanQrCode: () => void, onEndEarly: () => void }) {
  const isGoing = direction === 'ida';
  const hasMedicalAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  const handleNavigate = () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${student.latitude},${student.longitude}`, '_blank');
  };

  return (
    <Card className={cn("w-full shadow-2xl border-primary border-2", hasMedicalAlert && "ring-4 ring-destructive border-destructive bg-destructive/5")}>
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex justify-between items-center mb-3">
            <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase bg-background border-primary/30 text-primary">Parada Atual</Badge>
            {hasMedicalAlert && (
                <Badge variant="destructive" className="animate-pulse font-black tracking-tighter shadow-lg">
                    <HeartPulse className="h-3 w-3 mr-1" /> CUIDADO MÉDICO
                </Badge>
            )}
        </div>
        <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary shadow-xl">
                <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">{student.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
                <CardTitle className="text-xl font-black truncate leading-none mb-1 text-foreground uppercase tracking-tight">{student.name}</CardTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground mt-2">
                    <MapPin className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-xs font-black truncate text-foreground/80">{student.street}, {student.number}</span>
                </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleNavigate} className="shrink-0 h-14 w-14 border-primary/30 hover:bg-primary/10 shadow-md bg-background">
                <Navigation className="h-7 w-7 text-primary" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            {isGoing ? (
                <Button size="default" className="bg-green-600 hover:bg-green-700 h-14 font-black text-white shadow-xl text-sm" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <CheckCircle className="mr-2 h-5 w-5" /> EMBARCOU
                </Button>
            ) : (
                <Button size="default" className="bg-blue-600 hover:bg-blue-700 h-14 font-black text-white shadow-xl text-sm" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                    <CheckCircle className="mr-2 h-5 w-5" /> DESEMBARCOU
                </Button>
            )}
            <Button size="default" variant="destructive" className="h-14 font-black shadow-xl text-sm" onClick={() => onStatusChange(student.id, isGoing ? 'ausente_ida' : 'ausente_volta')}>
                <XCircle className="mr-2 h-5 w-5" /> AUSENTE
            </Button>
        </div>
        
        {hasMedicalAlert && student.medicalNote && (
            <div className="p-4 rounded-md bg-destructive/10 border-2 border-destructive/20 text-sm italic text-destructive font-black leading-tight flex gap-3">
                <HeartPulse className="h-5 w-5 shrink-0" />
                <span>"{student.medicalNote}"</span>
            </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col gap-3 pt-3 bg-muted/10 rounded-b-lg border-t">
           <div className="grid grid-cols-2 gap-3 w-full">
                <Button variant="secondary" className="h-12 text-[10px] font-black uppercase tracking-widest border-2 border-primary/10 bg-background hover:bg-primary/5" onClick={onScanQrCode}>
                    <QrCode className="mr-2 h-5 w-5 text-primary" /> QR Code
                </Button>
                <Button variant="secondary" className="h-12 text-[10px] font-black uppercase tracking-widest border-2 border-primary/10 bg-background hover:bg-primary/5" onClick={() => onOpenAuthorizedModal(student)}>
                    <IdCard className="mr-2 h-5 w-5 text-primary"/> Autorizados
                </Button>
           </div>
           <Button variant="ghost" size="sm" className="w-full text-destructive text-[10px] font-black uppercase tracking-widest py-4" onClick={onEndEarly}>
               <Square className="mr-2 h-3 w-3 fill-current" /> Encerrar Viagem Manualmente
           </Button>
      </CardFooter>
    </Card>
  );
}

function NextStopSchoolCard({ school, direction, onAction, students, onStatusChange, onEndEarly }: { school: SchoolData, direction: 'ida' | 'volta', onAction: () => void, students: Student[], onStatusChange: (id: string, status: StudentStatus) => void, onEndEarly: () => void }) {
    const isIda = direction === 'ida';
    return (
        <div className="space-y-6">
            <Card className="w-full shadow-2xl border-primary border-2 bg-card overflow-hidden">
              <CardHeader className="text-center pb-4 bg-primary/10 border-b">
                <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary/20 text-primary shadow-lg flex items-center justify-center mb-2">
                    <School className="h-8 w-8" />
                </div>
                <Badge className="w-fit mx-auto mb-1 font-black uppercase tracking-widest text-[10px] bg-primary text-white shadow-md">{isIda ? 'Ponto de Desembarque' : 'Ponto de Embarque'}</Badge>
                <CardTitle className="text-2xl font-black truncate text-foreground uppercase tracking-tight">{school.name}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="flex justify-between items-center bg-muted/20 p-4 rounded-lg border-2 border-dashed border-primary/20">
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" /> Checklist ({students.length})
                    </p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-[10px] h-10 font-black text-white shadow-lg" onClick={onAction}>
                        <CheckCircle className="mr-2 h-4 w-4" /> {isIda ? 'DESEMBARQUE COLETIVO' : 'EMBARQUE COLETIVO'}
                    </Button>
                </div>
                
                <div className="space-y-3">
                    {students.length > 0 ? (
                        students.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border-2 bg-background group hover:border-primary transition-all shadow-sm">
                                <Avatar className="h-12 w-12 border-2 border-primary/10 shrink-0">
                                    <AvatarImage src={`https://picsum.photos/seed/student-${s.id}/100/100`} />
                                    <AvatarFallback>{s.name[0]}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black truncate flex items-center gap-2 text-foreground uppercase">
                                        {s.name}
                                        {((s.medicalConditions?.length || 0) > 0 || s.medicalNote) && <HeartPulse className="h-4 w-4 text-destructive animate-pulse" />}
                                    </p>
                                    <p className="text-[9px] text-primary font-black uppercase tracking-widest opacity-70">{s.status}</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-10 w-10 text-green-600 border-green-200 bg-green-50 shadow-sm"
                                        onClick={() => onStatusChange(s.id, isIda ? 'desembarcado' : 'a_bordo')}
                                    >
                                        <Check className="h-5 w-5" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        variant="outline" 
                                        className="h-10 w-10 text-destructive border-red-200 bg-red-50 shadow-sm"
                                        onClick={() => onStatusChange(s.id, isIda ? 'ausente_ida' : 'ausente_volta')}
                                    >
                                        <XCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10 bg-muted/10 rounded-xl border-2 border-dashed">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Todos processados</p>
                        </div>
                    )}
                </div>
              </CardContent>
              <CardFooter className="p-4 border-t bg-muted/10 flex flex-col gap-3">
                <p className="text-[9px] text-center text-muted-foreground uppercase font-black tracking-[0.2em] w-full">
                    A telemetria detectou chegada na escola.
                </p>
                <Button variant="ghost" size="sm" className="w-full text-destructive text-[10px] font-black uppercase tracking-widest" onClick={onEndEarly}>
                    <Square className="mr-2 h-3 w-3 fill-current" /> Finalizar Operação Agora
                </Button>
              </CardFooter>
            </Card>
        </div>
    );
}
