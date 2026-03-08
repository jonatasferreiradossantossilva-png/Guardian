'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useMockCollection, useMockData, useMockNestedDoc } from '@/hooks/use-mock-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label as RawLabel } from '@/components/ui/label';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
  serie?: string;
  turma?: string;
  photoUrl?: string;
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

const formatStudentClassInfo = (student: Student) => {
    if (!student.serie) return student.shift;
    const serie = student.serie.replace(/\s*ano/i, '').trim();
    const turma = student.turma ? student.turma.replace(/Sala/gi, 'SL') : '';
    return `${serie} • ${turma} • ${student.shift}`;
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
                                <AvatarImage src={(item as Student).photoUrl || `https://picsum.photos/seed/student-${item.id}/40/40`} />
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

export default function DriverRoutePlanPage() {
  const { updateDoc } = useMockData();
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
  const [absentStudentsNames, setAbsentStudentsNames] = useState<string[]>([]);
  const [showAbsenceAlert, setShowAbsenceAlert] = useState(false);
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
             if (student.shift !== 'Integral' && student.shift !== selectedShift) return null;
             if (selectedDirection === 'ida' && student.status.startsWith('ausente')) return null;
             return { id, type: 'student', data: student as Student };
        } else if (school) return { id, type: 'school', data: school as SchoolData };
        return null;
    }).filter((s): s is Stop => s !== null);
  }, [route?.studentIds, allStudents, schools, selectedShift, selectedDirection, studentsMap, schoolsMap]);

  const { activeStop, upcomingStops } = useMemo(() => {
    if (!orderedStops || driverProfile?.status === 'inativo') return { activeStop: null, upcomingStops: [] };
    
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
      setShowAbsenceAlert(false);
      setAbsentStudentsNames([]);
      toast({ title: "Viagem Encerrada!" });
  }, [driverId, updateDoc, toast]);

  const handleStartRoute = async () => {
    if (!route || !driverProfile || !allStudents) return;
    setIsOptimizing(true);
    try {
        const missing = allStudents.filter(s => 
            route.studentIds.includes(s.id) && 
            s.status.startsWith('ausente') && 
            (s.shift === 'Integral' || s.shift === selectedShift)
        );
        
        if (missing.length > 0) {
            setAbsentStudentsNames(missing.map(m => m.name.split(' ')[0]));
            setShowAbsenceAlert(true);
        }

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

        if (studentStops.length >= 2) {
            const result = await optimizeSchoolVanRoute({
                students: studentStops,
                schools: schoolStops,
                direction: selectedDirection,
                optimizationMode: 'flexible'
            });

            const newIds = result.optimizedStops.map(s => s.id);
            const waypoints = result.optimizedStops.map(s => {
                const ent = studentsMap.get(s.id) || schoolsMap.get(s.id);
                return ent ? { lat: ent.latitude, lng: ent.longitude } : null;
            }).filter(Boolean) as {lat: number, lng: number}[];

            let polylineData = "";
            if (waypoints.length >= 2) {
                try {
                    const routing = await routingGeoapify({ waypoints });
                    polylineData = routing.polyline;
                } catch (routingErr) { console.warn(routingErr); }
            }

            updateDoc('routes', route.id, { 
                studentIds: newIds, 
                polyline: polylineData, 
                lastOptimizedAt: new Date().toISOString() 
            });
        }
        
        updateDoc('drivers', driverId, { status: 'em_rota' });
        sessionStorage.setItem('activeRouteId', route.id);
        setActiveRouteId(route.id);
        toast({ title: "Viagem Iniciada!" });
    } catch (e) {
        updateDoc('drivers', driverId, { status: 'em_rota' });
        setActiveRouteId(route.id);
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
  }, [updateDoc]);

  const handleSchoolAction = useCallback(() => {
      const isIda = selectedDirection === 'ida';
      const targetStatus = isIda ? 'desembarcado' : 'a_bordo';
      
      studentsAtCurrentStop.forEach(s => updateDoc('students', s.id, { status: targetStatus }));
      toast({ title: isIda ? "Desembarque Coletivo!" : "Embarque Coletivo!" });
  }, [selectedDirection, studentsAtCurrentStop, updateDoc, toast]);

  const handlePauseToggle = useCallback(() => {
      const isPaused = driverProfile?.status === 'pausa';
      updateDoc('drivers', driverId, { status: isPaused ? 'em_rota' : 'pausa' });
  }, [driverProfile?.status, driverId, updateDoc]);

  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;

  if (isLoading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen overflow-hidden">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm z-[2000]"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        
        {driverProfile?.status === 'inativo' ? (
            <div className="flex-1 flex items-center justify-center p-4">
                <Card className="max-w-md w-full shadow-2xl border-primary border-2 mx-auto">
                    <CardHeader className="text-center">
                        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-2 border-primary/20">
                            <Bus className="text-primary h-8 w-8" />
                        </div>
                        <CardTitle className="text-primary text-2xl font-black italic uppercase">Guardian</CardTitle>
                        <CardDescription className="font-bold text-foreground/80">Configure sua jornada operacional.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <RawLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Selecione a Rota</RawLabel>
                            <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                                <SelectTrigger className="h-12 border-primary/30 font-bold text-base bg-background"><SelectValue /></SelectTrigger>
                                <SelectContent>{routes?.map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <RawLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Turno</RawLabel>
                                <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)} className="grid grid-cols-1 gap-2">
                                    {['Manhã', 'Tarde'].map(s => (
                                        <div key={s} className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 bg-background">
                                            <RadioGroupItem value={s} id={`s-${s}`}/>
                                            <RawLabel htmlFor={`s-${s}`} className="flex-1 cursor-pointer font-bold text-sm">{s}</RawLabel>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                            <div className="space-y-2">
                                <RawLabel className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Sentido</RawLabel>
                                <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as any)} className="grid grid-cols-1 gap-2">
                                    {['ida', 'volta'].map(d => (
                                        <div key={d} className="flex items-center space-x-2 p-3 border-2 rounded-md cursor-pointer hover:bg-primary/5 bg-background">
                                            <RadioGroupItem value={d} id={`d-${d}`}/>
                                            <RawLabel htmlFor={`d-${d}`} className="flex-1 cursor-pointer font-bold text-sm uppercase">{d}</RawLabel>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-3 pt-4 border-t bg-muted/10">
                        <Button className="w-full h-14 font-black text-lg shadow-xl bg-primary hover:bg-primary/90 text-white" onClick={handleStartRoute} disabled={isOptimizing}>
                            {isOptimizing ? <><Loader2 className="mr-2 animate-spin"/> OTIMIZANDO...</> : <><Play className="mr-2 fill-current" /> INICIAR VIAGEM</>}
                        </Button>
                        <Link href="/" className="w-full text-center text-xs font-bold text-muted-foreground">Voltar ao Login</Link>
                    </CardFooter>
                </Card>
            </div>
        ) : (
            <div className="flex-1 flex flex-col overflow-hidden max-w-md mx-auto w-full border-x">
                <div className="p-4 border-b bg-primary/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Bus className="text-primary h-6 w-6" />
                        <div>
                            <h1 className="font-black text-lg uppercase truncate max-w-[180px]">{route?.name}</h1>
                            <p className="text-[10px] text-primary uppercase font-black tracking-widest">{selectedShift} • {selectedDirection}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={driverProfile?.status === 'pausa' ? 'default' : 'outline'} size="icon" onClick={handlePauseToggle} className="h-10 w-10 bg-background">
                            {driverProfile?.status === 'pausa' ? <Play className="fill-current text-white"/> : <Pause className="text-primary" />}
                        </Button>
                        <Button variant="outline" size="icon" asChild className="h-10 w-10 bg-background"><Link href="/driver/messages"><MessageSquare className="text-primary" /></Link></Button>
                        <Dialog><DialogTrigger asChild><Button variant="destructive" size="icon" className="h-10 w-10"><Siren className="animate-pulse"/></Button></DialogTrigger><ReportIncidentForm onFormSubmit={() => {}} /></Dialog>
                    </div>
                </div>

                <Tabs defaultValue="itinerario" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-2 h-14 bg-muted p-1 border-b">
                        <TabsTrigger 
                            value="itinerario" 
                            className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                        >
                            <Activity className="h-4 w-4" /> Itinerário
                        </TabsTrigger>
                        <TabsTrigger 
                            value="mapa" 
                            className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md"
                        >
                            <LocateFixed className="h-4 w-4" /> Mapa
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="itinerario" className="flex-1 overflow-hidden p-4">
                        <ScrollArea className="h-full">
                            <div className="space-y-6 pb-20">
                                {showAbsenceAlert && absentStudentsNames.length > 0 && (
                                    <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 relative">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-black uppercase tracking-tight">Rota Otimizada</AlertTitle>
                                        <AlertDescription className="text-[11px] leading-tight">
                                            {absentStudentsNames.join(', ')} {absentStudentsNames.length > 1 ? 'foram marcados' : 'foi marcado'} como ausente. A sequência de paradas foi recalculada automaticamente.
                                        </AlertDescription>
                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setShowAbsenceAlert(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Alert>
                                )}

                                {!activeStop ? (
                                    <div className="w-full">
                                        <Card className="text-center p-10 bg-green-500/10 border-green-500/30 border-2">
                                            <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-6"/>
                                            <CardTitle className="text-2xl font-black text-green-600 uppercase">Fim de Rota!</CardTitle>
                                            <Button variant="destructive" className="mt-10 w-full h-14 text-lg font-black shadow-xl" onClick={handleEndRoute}>FINALIZAR OPERAÇÃO</Button>
                                        </Card>
                                    </div>
                                ) : activeStop.type === 'student' ? (
                                    <div className="space-y-6 w-full">
                                        <NextStopCard 
                                            student={activeStop.data as Student} 
                                            onStatusChange={handleStatusChange} 
                                            onOpenAuthorizedModal={(s) => { setSelectedStudentForModal(s); setIsModalOpen(true); }} 
                                            direction={selectedDirection} 
                                            onScanQrCode={() => setIsScannerOpen(true)} 
                                            onEndEarly={handleEndRoute}
                                        />
                                        {upcomingStops.length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-3">Próximas Paradas</h3>
                                                {upcomingStops.map((stop, idx) => (
                                                    <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border-2 bg-card shadow-sm">
                                                        {stop.type === 'student' ? (
                                                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                                                <Avatar className="h-8 w-8"><AvatarImage src={(stop.data as Student).photoUrl || `https://picsum.photos/seed/student-${stop.id}/40/40`}/><AvatarFallback>S</AvatarFallback></Avatar>
                                                                <div className="min-w-0">
                                                                    <p className="text-xs font-black truncate uppercase">{stop.data.name}</p>
                                                                    <p className="text-[9px] text-muted-foreground uppercase font-bold">{formatStudentClassInfo(stop.data as Student)}</p>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 min-w-0 flex items-center gap-3">
                                                                <div className="h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center"><School className="h-4 w-4" /></div>
                                                                <span className="text-xs font-black truncate uppercase">{stop.data.name}</span>
                                                            </div>
                                                        )}
                                                        <Badge variant="secondary" className="text-[9px] font-black uppercase">{stop.type === 'student' ? 'Aluno' : 'Escola'}</Badge>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <NextStopSchoolCard 
                                        school={activeStop.data as SchoolData} 
                                        direction={selectedDirection}
                                        onAction={handleSchoolAction} 
                                        students={studentsAtCurrentStop}
                                        onStatusChange={handleStatusChange}
                                        onEndEarly={handleEndRoute}
                                    />
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="mapa" className="flex-1 relative">
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

        {isModalOpen && selectedStudentForModal && <AuthorizedContactsModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} studentId={selectedStudentForModal.id} studentName={selectedStudentForModal.name} />}
        <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(id) => { handleStatusChange(id, selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'); setIsScannerOpen(false); }} />
    </div>
  );
}

function NextStopCard({ student, onStatusChange, onOpenAuthorizedModal, direction, onScanQrCode, onEndEarly }: { student: Student, onStatusChange: (id: string, status: StudentStatus) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onScanQrCode: () => void, onEndEarly: () => void }) {
  const isGoing = direction === 'ida';
  const hasMedicalAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  return (
    <Card className={cn("w-full shadow-2xl border-primary border-2", hasMedicalAlert && "ring-4 ring-destructive border-destructive bg-destructive/5")}>
        <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex justify-between items-center mb-3">
                <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">Parada Atual</Badge>
                {hasMedicalAlert && <Badge variant="destructive" className="animate-pulse font-black"><HeartPulse className="h-3 w-3 mr-1" /> CUIDADO MÉDICO</Badge>}
            </div>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary shadow-xl">
                    <AvatarImage src={student.photoUrl || `https://picsum.photos/seed/student-${student.id}/100/100`} />
                    <AvatarFallback className="text-3xl font-black">{student.name[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-grow min-w-0">
                    <CardTitle className="text-base font-black truncate uppercase leading-tight">{student.name}</CardTitle>
                    <div className="space-y-1 mt-1">
                        <div className="flex items-center gap-1.5 text-primary font-bold text-[10px] uppercase">
                            <span>{formatStudentClassInfo(student)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary" />
                            <span className="text-[10px] font-black truncate uppercase">{student.street}, {student.number}</span>
                        </div>
                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {isGoing ? (
                    <Button className="bg-green-600 hover:bg-green-700 h-14 font-black text-white text-xs" onClick={() => onStatusChange(student.id, 'a_bordo')}><CheckCircle className="mr-2" /> EMBARCOU</Button>
                ) : (
                    <Button className="bg-blue-600 hover:bg-blue-700 h-14 font-black text-white text-xs" onClick={() => onStatusChange(student.id, 'desembarcado')}><CheckCircle className="mr-2" /> DESEMBARCOU</Button>
                )}
                <Button variant="destructive" className="h-14 font-black text-xs" onClick={() => onStatusChange(student.id, isGoing ? 'ausente_ida' : 'ausente_volta')}><XCircle className="mr-2" /> AUSENTE</Button>
            </div>
            
            {hasMedicalAlert && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {student.medicalConditions?.map(cond => (
                        <Badge key={cond} variant="destructive" className="text-[9px] font-black uppercase tracking-wider">{cond}</Badge>
                    ))}
                </div>
            )}

            {hasMedicalAlert && student.medicalNote && (
                <div className="p-4 rounded-md bg-destructive/10 border-2 border-destructive/20 text-sm italic text-destructive font-black flex gap-3"><HeartPulse className="h-5 w-5 shrink-0" /><span>"{student.medicalNote}"</span></div>
            )}
        </CardContent>
        <CardFooter className="flex flex-col gap-3 pt-3 bg-muted/10 rounded-b-lg border-t">
            <div className="grid grid-cols-3 gap-2 w-full">
                <Button variant="secondary" className="h-12 text-[8px] font-black uppercase tracking-tighter p-1" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${student.latitude},${student.longitude}`, '_blank')}>
                    <Navigation className="mr-1 h-4 w-4 text-primary" /> NAVEGAR
                </Button>
                <Button variant="secondary" className="h-12 text-[8px] font-black uppercase tracking-tighter p-1" onClick={onScanQrCode}>
                    <QrCode className="mr-1 h-4 w-4 text-primary" /> QR Code
                </Button>
                <Button variant="secondary" className="h-12 text-[8px] font-black uppercase tracking-tighter p-1" onClick={() => onOpenAuthorizedModal(student)}>
                    <IdCard className="mr-1 h-4 w-4 text-primary"/> Autorizados
                </Button>
            </div>
            <Button variant="ghost" className="w-full text-destructive text-[10px] font-black uppercase" onClick={onEndEarly}>Encerrar Viagem Manualmente</Button>
        </CardFooter>
    </Card>
  );
}

function NextStopSchoolCard({ school, direction, onAction, students, onStatusChange, onEndEarly }: { school: SchoolData, direction: 'ida' | 'volta', onAction: () => void, students: Student[], onStatusChange: (id: string, status: StudentStatus) => void, onEndEarly: () => void }) {
    const isIda = direction === 'ida';
    return (
        <Card className="w-full shadow-2xl border-primary border-2 bg-card overflow-hidden">
            <CardHeader className="text-center pb-4 bg-primary/10 border-b">
                <div className="mx-auto w-16 h-16 rounded-full bg-background border-4 border-primary/20 text-primary shadow-lg flex items-center justify-center mb-2"><School className="h-8 w-8" /></div>
                <Badge className="w-fit mx-auto mb-1 font-black uppercase tracking-widest text-[10px] bg-primary text-white">{isIda ? 'Desembarque Coletivo' : 'Embarque Coletivo'}</Badge>
                <CardTitle className="text-xl font-black uppercase truncate">{school.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-3 space-y-4">
                <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border-2 border-dashed border-primary/20">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2"><Users className="h-4 w-4" /> Checklist ({students.length})</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-[10px] h-9 font-black text-white" onClick={onAction}><CheckCircle className="mr-2 h-4 w-4" /> {isIda ? 'DESEMBARQUE' : 'EMBARQUE'}</Button>
                </div>
                <div className="space-y-2">
                    {students.map((s) => {
                        const hasAlert = (s.medicalConditions && s.medicalConditions.length > 0) || s.medicalNote;
                        return (
                            <div key={s.id} className={cn("flex items-center gap-2 p-2 rounded-xl border-2 bg-background shadow-sm", hasAlert && "border-destructive/30")}>
                                <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={s.photoUrl || `https://picsum.photos/seed/student-${s.id}/100/100`} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1">
                                        <p className="text-[11px] font-bold truncate uppercase leading-tight">{s.name}</p>
                                        {hasAlert && <HeartPulse className="h-2.5 w-2.5 text-destructive animate-pulse shrink-0" />}
                                    </div>
                                    <p className="text-[8px] text-primary font-black uppercase truncate">{formatStudentClassInfo(s)}</p>
                                </div>
                                <div className="flex gap-1 shrink-0">
                                    <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => onStatusChange(s.id, isIda ? 'desembarcado' : 'a_bordo')}><Check className="h-4 w-4" /></Button>
                                    <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => onStatusChange(s.id, isIda ? 'ausente_ida' : 'ausente_volta')}><XCircle className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
            <CardFooter className="p-4 border-t bg-muted/10 flex flex-col gap-3">
                <Button variant="ghost" size="sm" className="w-full text-destructive text-[10px] font-black uppercase" onClick={onEndEarly}>Finalizar Operação Agora</Button>
            </CardFooter>
        </Card>
    );
}
