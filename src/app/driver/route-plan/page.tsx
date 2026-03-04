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
  const [recenterTrigger, setRecenterTrigger] = useState(0);
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
    let nextStopIndex = selectedDirection === 'ida' ? orderedStops.findIndex(s => s.type === 'student' ? s.data.status === 'aguardando' : true) : orderedStops.findIndex(s => s.type === 'school' ? orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'a_bordo') : s.data.status === 'a_bordo');
    if (nextStopIndex === -1) return { activeStop: null, upcomingStops: [] };
    return { activeStop: orderedStops[nextStopIndex], upcomingStops: orderedStops.slice(nextStopIndex + 1) };
  }, [orderedStops, driverProfile?.status, selectedDirection]);

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
    toast({ title: 'Status Atualizado', description: `O aluno foi marcado como ${statusText[newStatus]}.` });
  }, [updateDoc, toast]);

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
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row h-screen overflow-hidden">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm absolute top-0 left-0 right-0 z-[2000]"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        
        {/* Left Action Panel */}
        <div className="w-full md:w-[400px] flex flex-col border-r bg-card overflow-y-auto shrink-0 shadow-xl z-10">
            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                        <Bus className="text-primary h-5 w-5"/>
                    </div>
                    <h1 className="font-bold text-xl">Guardian Equipe</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="icon" asChild><Link href="/driver/messages"><MessageSquare className="h-4 w-4" /></Link></Button>
                    <Link href="/"><Button variant="ghost" size="sm">Sair</Button></Link>
                </div>
            </div>

            <div className="p-4 flex-1">
                {driverProfile?.status === 'inativo' ? (
                    <Card className="shadow-lg border-primary/20">
                        <CardHeader>
                            <CardTitle>Iniciar Viagem</CardTitle>
                            <CardDescription>Configure a rota para começar a transmitir seu GPS.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Selecione a Rota</Label>
                                <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Turno</Label>
                                    <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)} className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="Manhã" id="shift-m"/>
                                            <Label htmlFor="shift-m" className="flex-1 cursor-pointer">Manhã</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="Tarde" id="shift-t"/>
                                            <Label htmlFor="shift-t" className="flex-1 cursor-pointer">Tarde</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                                <div className="space-y-2">
                                    <Label>Sentido</Label>
                                    <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as any)} className="grid grid-cols-1 gap-2">
                                        <div className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="ida" id="dir-i"/>
                                            <Label htmlFor="dir-i" className="flex-1 cursor-pointer font-medium">Ida</Label>
                                        </div>
                                        <div className="flex items-center space-x-2 p-2 border rounded-md cursor-pointer hover:bg-secondary/50">
                                            <RadioGroupItem value="volta" id="dir-v"/>
                                            <Label htmlFor="dir-v" className="flex-1 cursor-pointer font-medium">Volta</Label>
                                        </div>
                                    </RadioGroup>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full h-12 text-lg font-bold" onClick={() => { 
                                updateDoc('drivers', driverId, { status: 'em_rota' }); 
                                sessionStorage.setItem('activeRouteId', selectedRouteIdForStart); 
                                sessionStorage.setItem('startOdometer', vehicle?.currentOdometer?.toString() || '0');
                                setActiveRouteId(selectedRouteIdForStart); 
                            }}>
                                <Play className="mr-2" /> Iniciar Operação
                            </Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {!activeStop ? (
                            <Card className="text-center p-8 bg-green-500/10 border-green-500/30">
                                <div className="mx-auto w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
                                    <CheckCircle className="h-12 w-12 text-green-500"/>
                                </div>
                                <CardTitle className="text-xl">Itinerário Concluído!</CardTitle>
                                <p className="text-sm text-muted-foreground mt-2 px-4">Todas as paradas foram realizadas com sucesso.</p>
                                <Button variant="destructive" className="mt-8 w-full h-14 text-lg font-bold shadow-lg" onClick={handleEndRoute}>
                                    <Square className="mr-2 h-5 w-5 fill-current"/> Finalizar Viagem
                                </Button>
                            </Card>
                        ) : activeStop.type === 'student' ? (
                            <NextStopCard 
                                student={activeStop.data as Student} 
                                onStatusChange={handleStatusChange} 
                                onOpenAuthorizedModal={(s) => { setSelectedStudentForModal(s); setIsModalOpen(true); }} 
                                direction={selectedDirection} 
                                onScanQrCode={() => setIsScannerOpen(true)} 
                            />
                        ) : (
                            <NextStopSchoolCard 
                                school={activeStop.data as SchoolData} 
                                onDropOff={() => { 
                                    orderedStops.filter(s => s.type === 'student' && s.data.status === 'a_bordo').forEach(s => updateDoc('students', s.id, { status: 'desembarcado' })); 
                                    toast({ title: "Alunos Desembarcados!", description: "Status de todos os alunos atualizado para a escola." }); 
                                }} 
                            />
                        )}

                        {upcomingStops.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 px-1 flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-primary" /> Próximas Paradas ({upcomingStops.length})
                                </h3>
                                <div className="space-y-2">
                                    {upcomingStops.slice(0, 3).map((stop, idx) => (
                                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/20 opacity-80">
                                            {stop.type === 'student' ? (
                                                <Avatar className="h-8 w-8 border border-background shadow-sm">
                                                    <AvatarImage src={`https://picsum.photos/seed/student-${stop.id}/40/40`}/>
                                                    <AvatarFallback>S</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-destructive/10 text-destructive">
                                                    <School className="h-4 w-4" />
                                                </div>
                                            )}
                                            <span className="text-sm font-medium truncate flex-1">{stop.data.name}</span>
                                            <Badge variant="ghost" className="text-[9px] uppercase">{stop.type === 'student' ? 'Aluno' : 'Escola'}</Badge>
                                        </div>
                                    ))}
                                    {upcomingStops.length > 3 && (
                                        <p className="text-[10px] text-center text-muted-foreground italic">+ {upcomingStops.length - 3} outras paradas</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            {driverProfile?.status !== 'inativo' && (
                <div className="p-4 border-t bg-muted/20 space-y-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-12 text-destructive border-destructive/20 hover:bg-destructive/10 hover:text-destructive">
                                <Siren className="mr-2 h-5 w-5 animate-pulse"/> Relatar Incidente Crítico
                            </Button>
                        </DialogTrigger>
                        <ReportIncidentForm onFormSubmit={() => {}} />
                    </Dialog>
                </div>
            )}
        </div>

        {/* Right Map Panel */}
        <div className="flex-1 relative bg-secondary/10">
            <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
                <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="bg-background/90 shadow-md border-primary/20 hover:bg-background">
                    <LocateFixed className="text-primary h-5 w-5"/>
                </Button>
            </div>
            
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
        </div>

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

  return (
    <Card className={cn("w-full shadow-2xl border-primary/30", hasMedicalAlert && "ring-2 ring-destructive border-destructive/50 bg-destructive/5")}>
      <CardHeader className="pb-3 border-b bg-muted/10">
        <div className="flex justify-between items-center mb-3">
            <Badge variant="outline" className="text-[10px] font-bold tracking-[0.2em] uppercase bg-background">Próxima Parada</Badge>
            {hasMedicalAlert && (
                <Badge variant="destructive" className="animate-pulse shadow-lg font-black tracking-tighter">
                    <HeartPulse className="h-3 w-3 mr-1" /> ALERTA MÉDICO
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
        </div>
      </CardHeader>
      
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
            {isGoing ? (
                <Button size="lg" className="bg-green-600 hover:bg-green-700 h-16 text-lg font-black shadow-lg" onClick={() => onStatusChange(student.id, 'a_bordo')}>
                    <CheckCircle className="mr-2 h-6 w-6" /> EMBARCOU
                </Button>
            ) : (
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 h-16 text-lg font-black shadow-lg" onClick={() => onStatusChange(student.id, 'desembarcado')}>
                    <CheckCircle className="mr-2 h-6 w-6" /> DESEMBARCOU
                </Button>
            )}
            <Button size="lg" variant="destructive" className="h-16 text-lg font-black shadow-lg" onClick={() => onStatusChange(student.id, isGoing ? 'ausente_ida' : 'ausente_volta')}>
                <XCircle className="mr-2 h-6 w-6" /> AUSENTE
            </Button>
        </div>
        
        {hasMedicalAlert && student.medicalNote && (
            <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-xs italic text-destructive font-medium leading-relaxed">
                "{student.medicalNote}"
            </div>
        )}
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3 pt-2 bg-muted/10 rounded-b-lg border-t">
           <Button variant="secondary" className="h-12 text-sm font-bold shadow-sm" onClick={onScanQrCode}>
               <QrCode className="mr-2 h-5 w-5" /> Escanear QR
           </Button>
           <Button variant="secondary" className="h-12 text-sm font-bold shadow-sm" onClick={() => onOpenAuthorizedModal(student)}>
               <IdCard className="mr-2 h-5 w-5"/> Autorizados
           </Button>
      </CardFooter>
    </Card>
  );
}

function NextStopSchoolCard({ school, onDropOff }: { school: SchoolData, onDropOff: (id: string) => void }) {
    return (
        <Card className="w-full shadow-2xl border-destructive/30 bg-destructive/5 overflow-hidden">
          <CardHeader className="bg-destructive/10 border-b">
            <Badge variant="destructive" className="w-fit mb-3 font-bold">DESTINO ESCOLAR</Badge>
            <div className="flex items-center gap-4">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-background border-4 border-destructive/20 text-destructive shadow-lg">
                    <School className="h-8 w-8" />
                </div>
                <div className="flex-1 min-w-0">
                    <CardTitle className="text-2xl truncate leading-tight">{school.name}</CardTitle>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest mt-1">Ponto de Desembarque</p>
                </div>
            </div>
          </CardHeader>
          <CardContent className="pt-8">
            <Button size="lg" className="w-full h-20 bg-destructive hover:bg-destructive/90 text-xl font-black shadow-xl" onClick={() => onDropOff(school.id)}>
                <Bus className="mr-3 h-8 w-8" /> DESEMBARCAR TODOS
            </Button>
          </CardContent>
          <CardFooter className="justify-center pb-6">
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Confirme apenas ao parar no portão da escola</p>
          </CardFooter>
        </Card>
    );
}

function MapPin(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  }
