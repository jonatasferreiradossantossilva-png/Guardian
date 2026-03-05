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
  Info,
  ChevronRight,
  Sparkles,
  Navigation,
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
        {routePolyline && <RoutePolyline geoJsonPath={routePolyline} />}
        {driverLocation && (
            <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição" zIndex={10}>
                 <Pin background={'#2ab0c1'} borderColor={'#fff'} glyphColor="#fff"><Bus /></Pin>
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
                        <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff"><School /></Pin>
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

  // Telemetria por Delta: 30 metros ou 30 segundos
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
    let nextStopIndex = selectedDirection === 'ida' ? orderedStops.findIndex(s => s.type === 'student' ? s.data.status === 'aguardando' : true) : orderedStops.findIndex(s => s.type === 'school' ? orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'a_bordo') : s.data.status === 'a_bordo');
    if (nextStopIndex === -1) return { activeStop: null, upcomingStops: [] };
    return { activeStop: orderedStops[nextStopIndex], upcomingStops: orderedStops.slice(nextStopIndex + 1) };
  }, [orderedStops, driverProfile?.status, selectedDirection]);

  // Pulo do Gato: Re-otimização Instantânea com Gemini no Início
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

        const result = await optimizeSchoolVanRoute({
            students: studentStops,
            schools: schoolStops,
            startAddress: startPoint,
            direction: selectedDirection,
            optimizationMode: 'flexible'
        });

        // Atualiza a ordem e o traçado
        const newIds = result.optimizedStops.map(s => s.id);
        const waypoints = result.optimizedStops.map(s => {
            const ent = studentsMap.get(s.id) || schoolsMap.get(s.id);
            return ent ? { lat: ent.latitude, lng: ent.longitude } : null;
        }).filter(Boolean) as {lat: number, lng: number}[];

        const routing = await routingGeoapify({ waypoints });

        updateDoc('routes', route.id, { studentIds: newIds, polyline: routing.polyline, lastOptimizedAt: new Date().toISOString() });
        updateDoc('drivers', driverId, { status: 'em_rota' });
        
        sessionStorage.setItem('activeRouteId', route.id);
        sessionStorage.setItem('startOdometer', vehicle?.currentOdometer?.toString() || '0');
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
  }, [updateDoc, toast]);

  const handleEndRoute = useCallback(() => {
      if (!driverId || !allStudents || !route || !vehicle || !driverProfile) return;
      const startOdo = Number(sessionStorage.getItem('startOdometer') || vehicle.currentOdometer);
      const actualDistance = vehicle.currentOdometer - startOdo;
      const savingsKm = Math.max(0, actualDistance * 0.15); // Simulação de ROI
      const fuelSaved = (savingsKm / 8) * 6.00;
      addDoc('trip_history', { date: new Date().toISOString().split('T')[0], routeName: route.name, plannedKm: 15, actualKm: Number(actualDistance.toFixed(1)), driverName: driverProfile.name, savingsKm: Number(savingsKm.toFixed(1)), fuelSaved: Number(fuelSaved.toFixed(2)) });
      updateDoc('drivers', driverId, { status: 'inativo' });
      sessionStorage.removeItem('activeRouteId');
      setActiveRouteId(null);
      toast({ title: "Rota Finalizada!", description: `Economia estimada: R$ ${fuelSaved.toFixed(2)}.` });
  }, [driverId, allStudents, route, vehicle, driverProfile, updateDoc, addDoc, toast]);

  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col h-screen overflow-hidden">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm z-[2000]"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        
        {driverProfile?.status === 'inativo' ? (
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl border-primary/20">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Bus className="text-primary h-8 w-8" />
                        </div>
                        <CardTitle>Configurar Viagem</CardTitle>
                        <CardDescription>Selecione os parâmetros da sua jornada de hoje.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Selecione a Rota</Label>
                            <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                                <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                                <SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Turno</Label>
                                <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-secondary/50">
                                        <RadioGroupItem value="Manhã" id="shift-m"/>
                                        <Label htmlFor="shift-m" className="flex-1 cursor-pointer">Manhã</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-secondary/50">
                                        <RadioGroupItem value="Tarde" id="shift-t"/>
                                        <Label htmlFor="shift-t" className="flex-1 cursor-pointer">Tarde</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <Label>Sentido</Label>
                                <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as any)} className="grid grid-cols-1 gap-2">
                                    <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-secondary/50">
                                        <RadioGroupItem value="ida" id="dir-i"/>
                                        <Label htmlFor="dir-i" className="flex-1 cursor-pointer font-medium">Ida</Label>
                                    </div>
                                    <div className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-secondary/50">
                                        <RadioGroupItem value="volta" id="dir-v"/>
                                        <Label htmlFor="dir-v" className="flex-1 cursor-pointer font-medium">Volta</Label>
                                    </div>
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t">
                        <Button className="w-full h-14 text-lg font-bold shadow-lg" onClick={handleStartRoute} disabled={isOptimizing}>
                            {isOptimizing ? <><Loader2 className="mr-2 h-6 w-6 animate-spin"/> Otimizando...</> : <><Play className="mr-2 h-6 w-6" /> Iniciar Rota Agora</>}
                        </Button>
                        <Link href="/" className="w-full"><Button variant="ghost" className="w-full">Voltar ao Início</Button></Link>
                    </CardFooter>
                </Card>
            </div>
        ) : (
            <div className="flex-1 flex flex-col">
                <div className="p-4 border-b bg-muted/30 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Bus className="text-primary h-6 w-6" />
                        <div>
                            <h1 className="font-bold text-lg leading-tight">{route?.name}</h1>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{selectedShift} • {selectedDirection === 'ida' ? 'Sentido Escola' : 'Sentido Casa'}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" asChild><Link href="/driver/messages"><MessageSquare className="h-4 w-4" /></Link></Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="destructive" size="icon"><Siren className="h-4 w-4 animate-pulse"/></Button>
                            </DialogTrigger>
                            <ReportIncidentForm onFormSubmit={() => {}} />
                        </Dialog>
                    </div>
                </div>

                <Tabs defaultValue="itinerario" className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-4 bg-muted/30 border-b">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="itinerario" className="gap-2"><Activity className="h-4 w-4" /> Itinerário</TabsTrigger>
                            <TabsTrigger value="mapa" className="gap-2"><LocateFixed className="h-4 w-4" /> Mapa ao Vivo</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="itinerario" className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto animate-in fade-in duration-300">
                        {!activeStop ? (
                            <Card className="text-center p-10 bg-green-500/10 border-green-500/30 flex-1 flex flex-col justify-center">
                                <div className="mx-auto w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-6">
                                    <CheckCircle className="h-14 w-14 text-green-500"/>
                                </div>
                                <CardTitle className="text-2xl">Todas as Paradas Concluídas!</CardTitle>
                                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Itinerário finalizado com sucesso. Você pode encerrar a viagem agora.</p>
                                <Button variant="destructive" className="mt-10 w-full h-16 text-xl font-bold shadow-xl" onClick={handleEndRoute}>
                                    <Square className="mr-3 h-6 w-6 fill-current"/> Finalizar Operação
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
                                />
                                {upcomingStops.length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Próximas Paradas ({upcomingStops.length})</h3>
                                        <div className="space-y-2">
                                            {upcomingStops.slice(0, 5).map((stop, idx) => (
                                                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 opacity-80">
                                                    {stop.type === 'student' ? (
                                                        <Avatar className="h-8 w-8 border shadow-sm">
                                                            <AvatarImage src={`https://picsum.photos/seed/student-${stop.id}/40/40`}/>
                                                            <AvatarFallback>S</AvatarFallback>
                                                        </Avatar>
                                                    ) : (
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive">
                                                            <School className="h-4 w-4" />
                                                        </div>
                                                    )}
                                                    <span className="text-sm font-medium truncate flex-1">{stop.data.name}</span>
                                                    <Badge variant="ghost" className="text-[9px] uppercase tracking-tighter">{stop.type === 'student' ? 'Aluno' : 'Escola'}</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <NextStopSchoolCard 
                                school={activeStop.data as SchoolData} 
                                onDropOff={() => { 
                                    orderedStops.filter(s => s.type === 'student' && s.data.status === 'a_bordo').forEach(s => updateDoc('students', s.id, { status: 'desembarcado' })); 
                                    toast({ title: "Desembarque Coletivo!", description: "Status atualizado para todos os alunos." }); 
                                }} 
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="mapa" className="flex-1 relative animate-in fade-in duration-300">
                        <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="absolute top-4 left-4 z-[1000] bg-background/90 shadow-md border-primary/20">
                            <LocateFixed className="text-primary h-5 w-5"/>
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

        {/* Modals */}
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

function NextStopCard({ student, onStatusChange, onOpenAuthorizedModal, direction, onScanQrCode }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onScanQrCode: () => void }) {
  const isGoing = direction === 'ida';
  const hasMedicalAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  const handleNavigate = () => {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${student.latitude},${student.longitude}`, '_blank');
  };

  return (
    <Card className={cn("w-full shadow-xl border-primary/30", hasMedicalAlert && "ring-2 ring-destructive border-destructive/50 bg-destructive/5")}>
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex justify-between items-center mb-3">
            <Badge variant="outline" className="text-[10px] font-bold tracking-[0.2em] uppercase bg-background">Parada Atual</Badge>
            {hasMedicalAlert && (
                <Badge variant="destructive" className="animate-pulse font-black tracking-tighter">
                    <HeartPulse className="h-3 w-3 mr-1" /> CUIDADO MÉDICO
                </Badge>
            )}
        </div>
        <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-primary/20 shadow-md">
                <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{student.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-grow min-w-0">
                <CardTitle className="text-xl truncate leading-none mb-1">{student.name}</CardTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="text-xs font-medium truncate">{student.street}, {student.number}</span>
                </div>
            </div>
            <Button variant="outline" size="icon" onClick={handleNavigate} className="shrink-0 h-12 w-12 border-primary/20">
                <Navigation className="h-6 w-6 text-primary" />
            </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            {isGoing ? (
                <Button size="lg" className="bg-green-600 hover:bg-green-700 h-16 text-lg font-black" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <CheckCircle className="mr-2 h-6 w-6" /> EMBARCOU
                </Button>
            ) : (
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-16 text-lg font-black" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                    <CheckCircle className="mr-2 h-6 w-6" /> DESEMBARCOU
                </Button>
            )}
            <Button size="lg" variant="destructive" className="h-16 text-lg font-black" onClick={() => onStatusChange(student.id, isGoing ? 'ausente_ida' : 'ausente_volta')}>
                <XCircle className="mr-2 h-6 w-6" /> AUSENTE
            </Button>
        </div>
        
        {hasMedicalAlert && student.medicalNote && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs italic text-destructive font-medium leading-tight">
                "{student.medicalNote}"
            </div>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3 pt-2 bg-muted/10 rounded-b-lg border-t">
           <Button variant="secondary" className="h-12 text-sm font-bold" onClick={onScanQrCode}>
               <QrCode className="mr-2 h-5 w-5" /> QR Code
           </Button>
           <Button variant="secondary" className="h-12 text-sm font-bold" onClick={() => onOpenAuthorizedModal(student)}>
               <IdCard className="mr-2 h-5 w-5"/> Autorizados
           </Button>
      </CardFooter>
    </Card>
  );
}

function NextStopSchoolCard({ school, onDropOff }: { school: SchoolData, onDropOff: (id: string) => void }) {
    return (
        <Card className="w-full shadow-2xl border-destructive/30 bg-destructive/5 overflow-hidden flex-1 flex flex-col justify-center">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto w-20 h-20 rounded-full bg-background border-4 border-destructive/20 text-destructive shadow-lg flex items-center justify-center mb-4">
                <School className="h-10 w-10" />
            </div>
            <Badge variant="destructive" className="w-fit mx-auto mb-2 font-bold uppercase tracking-widest">Ponto de Desembarque</Badge>
            <CardTitle className="text-2xl truncate">{school.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Button size="lg" className="w-full h-24 bg-destructive hover:bg-destructive/90 text-2xl font-black shadow-xl" onClick={() => onDropOff(school.id)}>
                <Bus className="mr-4 h-10 w-10" /> CHEGAMOS NA ESCOLA
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase font-bold tracking-widest mt-6">Clique no botão apenas quando todos os alunos estiverem seguros no portão.</p>
          </CardContent>
        </Card>
    );
}