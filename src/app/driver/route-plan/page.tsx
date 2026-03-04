
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
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc, useMockDoc } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { RoutePolyline } from '@/components/shared/route-polyline';
import { SmartMap } from '@/components/shared/smart-map';
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
        <div className="flex justify-between items-start"><CardDescription>Próxima Parada</CardDescription>
            {hasMedicalAlert && <Badge variant="destructive" className="animate-pulse flex gap-1 cursor-pointer" onClick={() => toast({ title: "🚨 ALERTA DE SAÚDE", description: student.medicalNote || `Condições: ${student.medicalConditions?.join(', ')}`, duration: 8000 })}><HeartPulse className="h-3 w-3" /> ALERTA CRÍTICO</Badge>}
        </div>
        <CardTitle className="flex items-start gap-3 text-2xl"><Avatar className="h-12 w-12 flex-shrink-0 border-2 border-background shadow-sm"><AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} /><AvatarFallback>{student.name[0]}</AvatarFallback></Avatar>
            <div className="flex-grow"><span>{student.name}</span>{details && <p className="text-base font-medium text-muted-foreground">{details}</p>}</div>
            <Badge variant="secondary" className="text-sm font-medium self-center">{student.shift}</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground pt-1">{student.street ? `${student.street}, ${student.number}` : 'Endereço não disponível'}</p>
        {student.medicalConditions && student.medicalConditions.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{student.medicalConditions.map(c => <Badge key={c} variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20 font-bold uppercase">{c}</Badge>)}</div>}
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">{isGoing ? <Button size="lg" className="bg-green-600 hover:bg-green-700" onClick={() => onStatusChange(student.id, 'a_bordo')}><CheckCircle className="mr-2 h-5 w-5" /> Embarcou</Button> : <Button size="lg" className="bg-blue-600 hover:bg-blue-700" onClick={() => onStatusChange(student.id, 'desembarcado')}><CheckCircle className="mr-2 h-5 w-5" /> Desembarcou</Button>}
        <Button size="lg" variant="destructive" onClick={() => onStatusChange(student.id, direction === 'ida' ? 'ausente_ida' : 'ausente_volta')}><XCircle className="mr-2 h-5 w-5" /> Ausente</Button>
      </CardContent>
       <CardFooter className="grid grid-cols-4 gap-2">
           <Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={onScanQrCode}><QrCode className="h-5 w-5" /><span>Escanear</span></Button>
           <Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={() => onNavigate(student)}><Navigation className="h-5 w-5" /><span>Navegar</span></Button>
           <Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={() => onOpenAuthorizedModal(student)}><IdCard className="h-5 w-5"/><span>Contatos</span></Button>
            <Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={onShareRoute}><Share2 className="h-5 w-5"/><span>Localização</span></Button>
       </CardFooter>
    </Card>
  );
};

const NextStopSchoolCard = ({ school, onDropOff, onNavigate, onShareRoute }: { school: SchoolData, onDropOff: (id: string) => void, onNavigate: (data: any) => void, onShareRoute: () => void }) => (
    <Card className="w-full shadow-lg border-destructive/20">
      <CardHeader><CardDescription>Parada na Escola (Desembarque)</CardDescription><CardTitle className="flex items-center gap-3 text-2xl"><div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10 text-destructive"><School className="h-6 w-6" /></div><span>{school.name}</span></CardTitle><p className="text-sm text-muted-foreground pt-1">{school.street ? `${school.street}, ${school.number}` : 'Endereço não disponível'}</p></CardHeader>
      <CardContent><Button size="lg" className="w-full bg-destructive hover:bg-destructive/90" onClick={() => onDropOff(school.id)}><Bus className="mr-2 h-5 w-5" /> Desembarcar Alunos</Button></CardContent>
       <CardFooter className="grid grid-cols-2 gap-2"><Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={() => onNavigate(school)}><Navigation className="h-5 w-5" /><span>Navegar</span></Button><Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={onShareRoute}><Share2 className="h-5 w-5"/><span>Localização</span></Button></CardFooter>
    </Card>
);

const NextStopSchoolPickupCard = ({ school, onPickup, onNavigate, onShareRoute }: { school: SchoolData, onPickup: (id: string) => void, onNavigate: (data: any) => void, onShareRoute: () => void }) => (
    <Card className="w-full shadow-lg border-primary/20">
      <CardHeader><CardDescription>Parada na Escola (Embarque)</CardDescription><CardTitle className="flex items-center gap-3 text-2xl"><div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary/10 text-primary"><School className="h-6 w-6" /></div><span>{school.name}</span></CardTitle><p className="text-sm text-muted-foreground pt-1">{school.street ? `${school.street}, ${school.number}` : 'Endereço não disponível'}</p></CardHeader>
      <CardContent><Button size="lg" className="w-full" onClick={() => onPickup(school.id)}><Users className="mr-2 h-5 w-5" /> Checklist de Embarque</Button></CardContent>
       <CardFooter className="grid grid-cols-2 gap-2"><Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={() => onNavigate(school)}><Navigation className="h-5 w-5" /><span>Navegar</span></Button><Button variant="outline" className="flex flex-col h-auto py-2 text-xs" onClick={onShareRoute}><Share2 className="h-5 w-5"/><span>Localização</span></Button></CardFooter>
    </Card>
);

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
                        <Pin background={ hasAlert ? '#dc2626' : '#3b82f6'} borderColor={'#fff'}><Avatar className="h-6 w-6"><AvatarImage src={`https://picsum.photos/seed/student-${item.id}/40/40`} /><AvatarFallback>{item.name[0]}</AvatarFallback></Avatar></Pin>
                    ) : (
                        <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff"><School /></Pin>
                    )}
                </AdvancedMarker>
            );
        })}
    </>
);

// Haversine formula
function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) {
  if (!coords1 || !coords2) return Infinity;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; 
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords1.lat);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
  const [isSchoolSelectorOpen, setIsSchoolSelectorOpen] = useState(false);
  const [schoolsForSelection, setSchoolsForSelection] = useState<SchoolData[]>([]);
  const [selectedStartSchoolId, setSelectedStartSchoolId] = useState<string>('');
  const [currentView, setCurrentView] = useState<'route' | 'checklist'>('route');
  const [checklistSchool, setChecklistSchool] = useState<SchoolData | null>(null);

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
    let nextStopIndex = selectedDirection === 'ida' ? orderedStops.findIndex(s => s.type === 'student' ? s.data.status === 'aguardando' : true) : orderedStops.findIndex(s => s.type === 'school' ? orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'aguardando') : s.data.status === 'a_bordo');
    if (nextStopIndex === -1) return { activeStop: null, upcomingStops: [] };
    return { activeStop: orderedStops[nextStopIndex], upcomingStops: orderedStops.slice(nextStopIndex + 1) };
  }, [orderedStops, driverProfile?.status, selectedDirection]);

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    const student = (orderedStops.find(s => s.id === studentId)?.data as Student);
    if (student) setLastProcessedStudent(student); 
    updateDoc('students', studentId, { status: newStatus });
    toast({ title: 'Status Atualizado', description: `${student?.name || 'O aluno'} foi marcado(a) como ${statusText[newStatus]}.` });
  }, [updateDoc, orderedStops, toast]);

  const handleEndRoute = useCallback(() => {
      if (!driverId || !allStudents || !route || !vehicle || !driverProfile) return;
      const startOdo = Number(sessionStorage.getItem('startOdometer') || vehicle.currentOdometer);
      const actualDistance = vehicle.currentOdometer - startOdo;
      const savingsKm = Math.max(0, actualDistance * 0.15);
      const fuelSaved = (savingsKm / 8) * 6.00;
      addDoc('trip_history', { date: new Date().toISOString().split('T')[0], routeName: route.name, plannedKm: route.plannedDistanceKm || 10, actualKm: Number(actualDistance.toFixed(1)), driverName: driverProfile.name, savingsKm: Number(savingsKm.toFixed(1)), fuelSaved: Number(fuelSaved.toFixed(2)) });
      updateDoc('drivers', driverId, { status: 'inativo' });
      sessionStorage.removeItem('activeRouteId');
      setActiveRouteId(null);
      toast({ title: "Rota Finalizada!", description: `Economia estimada: R$ ${fuelSaved.toFixed(2)}.` });
  }, [driverId, allStudents, route, vehicle, driverProfile, updateDoc, addDoc, toast]);

  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm sticky top-0 z-50"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        <Tabs defaultValue="plan" className="w-full">
             <div className="px-4 pt-4"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="plan"><ListTree className="mr-2 h-4 w-4"/>Plano</TabsTrigger><TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger></TabsList></div>
            <TabsContent value="plan" className="mt-4 p-4">
                {driverProfile?.status === 'inativo' ? (
                    <Card className="max-w-sm mx-auto"><CardHeader><CardTitle>Iniciar Viagem</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent></Select>
                            <div className="grid grid-cols-2 gap-4">
                                <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)}><Label>Turno</Label><div className="flex items-center space-x-2"><RadioGroupItem value="Manhã" id="m"/><Label htmlFor="m">Manhã</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="Tarde" id="t"/><Label htmlFor="t">Tarde</Label></div></RadioGroup>
                                <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as any)}><Label>Viagem</Label><div className="flex items-center space-x-2"><RadioGroupItem value="ida" id="i"/><Label htmlFor="i">Ida</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="volta" id="v"/><Label htmlFor="v">Volta</Label></div></RadioGroup>
                            </div>
                        </CardContent>
                        <CardFooter><Button className="w-full" onClick={() => { updateDoc('drivers', driverId, { status: 'em_rota' }); sessionStorage.setItem('activeRouteId', selectedRouteIdForStart); setActiveRouteId(selectedRouteIdForStart); }}><Play className="mr-2 h-4 w-4"/>Iniciar Rota</Button></CardFooter>
                    </Card>
                ) : (
                    <div className="max-w-md mx-auto space-y-4">
                        {!activeStop ? <Card className="text-center p-8"><CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/><CardTitle>Concluído!</CardTitle><Button variant="destructive" className="mt-6 w-full" onClick={handleEndRoute}>Finalizar</Button></Card> : 
                        activeStop.type === 'student' ? <NextStopCard student={activeStop.data as Student} onStatusChange={handleStatusChange} onNavigate={() => {}} onOpenAuthorizedModal={(s) => { setSelectedStudentForModal(s); setIsModalOpen(true); }} direction={selectedDirection} onShareRoute={() => {}} onScanQrCode={() => setIsScannerOpen(true)} details={activeStop.data.name} /> : 
                        <NextStopSchoolCard school={activeStop.data as SchoolData} onDropOff={() => { orderedStops.filter(s => s.type === 'student' && s.data.status === 'a_bordo').forEach(s => updateDoc('students', s.id, { status: 'desembarcado' })); toast({ title: "Desembarçados!" }); }} onNavigate={() => {}} onShareRoute={() => {}} />}
                    </div>
                )}
            </TabsContent>
            <TabsContent value="map" className="mt-4">
                 <div className="relative h-[70vh] w-full border-y">
                    <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="absolute top-3 left-3 z-[1000] bg-background/80"><LocateFixed /></Button>
                    <SmartMap 
                        center={{ lat: driverLocation?.latitude || -23.55, lng: driverLocation?.longitude || -46.63 }}
                        zoom={12}
                        stops={orderedStops}
                        driverLocation={driverLocation}
                        routePolyline={route?.polyline}
                        recenterTrigger={recenterTrigger}
                        forcedMode="google" // Motorista sempre usa Google
                    >
                        <GoogleMapMarkers driverLocation={driverLocation} stops={orderedStops} routePolyline={route?.polyline} />
                    </SmartMap>
                 </div>
            </TabsContent>
        </Tabs>
        {driverProfile?.status !== 'inativo' && <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-3 z-50 flex gap-2 justify-center"><Button variant="outline" asChild><Link href="/driver/messages"><MessageSquare className="h-5 w-5" /></Link></Button><Button variant="destructive" onClick={handleEndRoute}><Square className="h-5 w-5" /></Button></div>}
        {isModalOpen && selectedStudentForModal && <AuthorizedContactsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} studentId={selectedStudentForModal.id} studentName={selectedStudentForModal.name} />}
        <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(id) => { handleStatusChange(id, selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'); setIsScannerOpen(false); }} />
    </div>
  );
}
