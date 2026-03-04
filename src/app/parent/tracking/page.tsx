
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useMockCollection,
  useMockData,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AdvancedMarker, useMap, Pin } from "@vis.gl/react-google-maps";
import { MapPin, Bus, MessageCircle, AlertTriangle, Loader2, School, CheckCircle, Activity, Share2, LocateFixed, QrCode, XCircle, DollarSign, Users, Route as RouteIcon, ShieldCheck, ChevronRight, Home, Sparkles, BellRing, Megaphone, Info, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoutePolyline } from "@/components/shared/route-polyline";
import { SmartMap } from "@/components/shared/smart-map";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";


// Types matching mock data
interface Student {
  id: string;
  name: string;
  status: "aguardando" | "a_bordo" | "desembarcado" | "ausente_ida" | "ausente_volta" | "ausente_dia_todo";
  routeId?: string;
  schoolId: string;
  latitude: number;
  longitude: number;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  active?: boolean;
}
interface Parent {
    id: string;
    userId: string;
    name: string;
}
interface Route {
  id: string;
  driverId: string;
  studentIds: string[];
  polyline?: string;
  direction?: 'ida' | 'volta';
}
interface LocationUpdate {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}
interface SchoolData {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
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


function GoogleMapMarkers({ 
    allStudents, 
    allRoutes, 
    allLocations, 
    allSchools,
    selectedStudentId
}: { 
    allStudents: Student[], 
    allRoutes: Route[], 
    allLocations: LocationUpdate[], 
    allSchools: SchoolData[],
    selectedStudentId: string | null
}) {
  const selectedRoute = useMemo(() => {
      const student = allStudents.find(s => s.id === selectedStudentId);
      return allRoutes.find(r => r.id === student?.routeId);
  }, [allStudents, allRoutes, selectedStudentId]);

  return (
    <>
      {selectedRoute?.polyline && <RoutePolyline geoJsonPath={selectedRoute.polyline} />}
      
      {allStudents.map(s => {
          const route = allRoutes.find(r => r.id === s.routeId);
          const busLoc = allLocations.find(l => l.id === route?.driverId);
          const school = allSchools.find(sch => sch.id === s.schoolId);
          const isSelected = s.id === selectedStudentId;

          return (
              <div key={s.id}>
                  {busLoc && (
                    <AdvancedMarker position={{ lat: busLoc.latitude, lng: busLoc.longitude }} title={`Van de ${s.name}`} zIndex={isSelected ? 10 : 5}>
                        <Pin background={isSelected ? '#2ab0c1' : '#94a3b8'} borderColor={'#fff'} glyphColor="#fff">
                            <Bus className="h-4 w-4" />
                        </Pin>
                    </AdvancedMarker>
                  )}
                  <AdvancedMarker position={{ lat: s.latitude, lng: s.longitude }} title={s.name}>
                        <Pin background={isSelected ? '#3b82f6' : '#cbd5e1'} borderColor={'#fff'}>
                            <Avatar className={cn("h-6 w-6", !isSelected && "grayscale opacity-70")}>
                                <AvatarImage src={`https://picsum.photos/seed/student-${s.id}/40/40`} alt={s.name} />
                                <AvatarFallback>{s.name[0]}</AvatarFallback>
                            </Avatar>
                        </Pin>
                  </AdvancedMarker>
                  {school && (
                    <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
                        <Pin background={isSelected ? '#dc2626' : '#f87171'} borderColor={'#fff'} glyphColor="#fff">
                            <School className="h-4 w-4" />
                        </Pin>
                    </AdvancedMarker>
                  )}
              </div>
          );
      })}
    </>
  );
}

function JourneyTimeline({ status, direction }: { status: Student['status'], direction: 'ida' | 'volta' }) {
    const isIda = direction === 'ida';
    const isWaiting = status === 'aguardando';
    const isOnBoard = status === 'a_bordo';
    const isArrived = status === 'desembarcado';
    const isAbsent = status.startsWith('ausente');

    if (isAbsent) return null;

    const steps = isIda 
        ? [
            { label: "Casa", icon: Home, active: true, completed: isOnBoard || isArrived },
            { label: "Van", icon: Bus, active: isOnBoard || isArrived, completed: isArrived },
            { label: "Escola", icon: School, active: isArrived, completed: false }
          ]
        : [
            { label: "Escola", icon: School, active: true, completed: isOnBoard || isArrived },
            { label: "Van", icon: Bus, active: isOnBoard || isArrived, completed: isArrived },
            { label: "Casa", icon: Home, active: isArrived, completed: false }
          ];

    return (
        <div className="py-6 px-4">
            <div className="relative flex justify-between items-center w-full max-w-xs mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0">
                    <div 
                        className={cn(
                            "h-full transition-all duration-500 ease-in-out",
                            isIda ? "bg-primary" : "bg-orange-500"
                        )}
                        style={{ width: isArrived ? '100%' : isOnBoard ? '50%' : '0%' }}
                    />
                </div>
                {steps.map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shadow-sm",
                            step.active 
                                ? (isIda ? "bg-primary border-primary text-primary-foreground" : "bg-orange-500 border-orange-500 text-white") 
                                : "bg-background border-muted text-muted-foreground",
                            step.completed && "scale-90 opacity-80"
                        )}>
                            <step.icon className="h-5 w-5" />
                        </div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-wider",
                            step.active ? "text-foreground" : "text-muted-foreground"
                        )}>
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}


export default function ParentTrackingPage() {
  const { toast } = useToast();
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showProximityAlert, setShowProximityAlert] = useState(false);
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [selectedAbsenceType, setSelectedAbsenceType] = useState<"ausente_ida" | "ausente_volta" | "ausente_dia_todo">("ausente_dia_todo");
  const [applyAbsenceToAll, setApplyAbsenceToAll] = useState(false);

  useEffect(() => {
    setMockUserId(sessionStorage.getItem('mockUserId'));
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    if (lastSelectedId) setSelectedStudentId(lastSelectedId);
  }, []);

  const handleStudentSelect = (id: string) => {
      setSelectedStudentId(id);
      sessionStorage.setItem('selectedStudentId', id);
  };

  const { data: parents, isLoading: areParentsLoading } = useMockCollection("parents", mockUserId ? [
    { field: "userId", op: "==", value: mockUserId },
  ] : undefined);
  const parent = useMemo(() => (parents && parents.length > 0 ? parents[0] : null), [parents]);

  const { data: students, isLoading: areStudentsLoading } = useMockCollection("students", parent ? [
    { field: "parentId", op: "==", value: parent.id },
  ] : undefined);

  const { data: allRoutes, isLoading: areRoutesLoading } = useMockCollection("routes");
  const { data: allLocations, isLoading: areLocationsLoading } = useMockCollection("locations");
  const { data: allSchools, isLoading: areSchoolsLoading } = useMockCollection("schools");
  const { data: config } = useMockCollection('config');

  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
        handleStudentSelect(students[0].id);
    }
  }, [students, selectedStudentId]);

  const student = useMemo(() => {
      if (!students || students.length === 0) return null;
      if (!selectedStudentId) return students[0];
      return students.find(s => s.id === selectedStudentId) || students[0];
  }, [students, selectedStudentId]);
  
  const route = useMemo(() => allRoutes?.find(r => r.id === student?.routeId), [allRoutes, student]);
  const displayLocation = useMemo(() => allLocations?.find(l => l.id === route?.driverId), [allLocations, route]);
  const school = useMemo(() => allSchools?.find(s => s.id === student?.schoolId), [allSchools, student]);

  const { data: announcements } = useMockCollection('announcements', [{ field: 'target', op: 'in', value: ['all', 'parents'] }]);
  
  const latestAnnouncement = useMemo(() => {
      if (!announcements || announcements.length === 0) return null;
      return announcements.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }, [announcements]);

  useEffect(() => {
    if (!student || !displayLocation) return;
    const studentCoords = { lat: student.latitude, lng: student.longitude };
    const busCoords = { lat: displayLocation.latitude, lng: displayLocation.longitude };
    const currentDistance = haversineDistance(busCoords, studentCoords);
    const journeyDirection = (route?.direction as 'ida' | 'volta') || 'ida';
    const isWaitingPickup = journeyDirection === 'ida' && student.status === 'aguardando';
    const isComingHome = journeyDirection === 'volta' && student.status === 'a_bordo';

    if (currentDistance < 0.8 && (isWaitingPickup || isComingHome)) {
        if (!showProximityAlert) {
            setShowProximityAlert(true);
            toast({
                title: `🚌 Van do ${student.name.split(' ')[0]} chegando!`,
                description: "A van entrou num raio de 800m da sua residência.",
                variant: "default"
            });
        }
    } else {
        setShowProximityAlert(false);
    }
  }, [displayLocation, student, route?.direction, showProximityAlert, toast]);


  const handleCommunicateAbsence = useCallback(async () => {
    if (!student || !students) return;
    const targetStudents = applyAbsenceToAll ? students : [student];
    targetStudents.forEach(s => {
        updateDoc('students', s.id, { status: selectedAbsenceType });
    });
    setIsAbsenceDialogOpen(false);
    toast({
      title: applyAbsenceToAll ? "Ausências comunicadas" : "Ausência comunicada",
      description: applyAbsenceToAll ? "Os motoristas de todos os filhos foram notificados." : `O motorista do(a) ${student.name} foi notificado.`,
    });
  }, [student, students, selectedAbsenceType, applyAbsenceToAll, updateDoc, toast]);

  const handleConfirmPresence = () => {
    if (!student) return;
    updateDoc('students', student.id, { status: 'aguardando' });
    toast({ title: "Presença Confirmada!", description: `O motorista foi notificado que ${student.name} aguardará o transporte.` });
  };

  const handleShareTrip = useCallback(() => {
    if (!student || !displayLocation) {
      toast({ title: "Informações incompletas", description: "Aguarde a localização da van para compartilhar.", variant: "destructive" });
      return;
    }
    const journeyDirection = (route?.direction as 'ida' | 'volta') || 'ida';
    const isOnBoard = student.status === 'a_bordo';
    const isTargetSchool = journeyDirection === 'ida' && isOnBoard && school;
    const targetCoords = isTargetSchool ? { lat: school!.latitude, lng: school!.longitude } : { lat: student.latitude, lng: student.longitude };
    const busCoords = { lat: displayLocation.latitude, lng: displayLocation.longitude };
    const distance = haversineDistance(busCoords, targetCoords);
    const avgSpeedKmH = 25;
    const timeMinutes = Math.round((distance / avgSpeedKmH) * 60);
    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + timeMinutes);
    const etaString = arrivalTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${busCoords.lat},${busCoords.lng}&destination=${targetCoords.lat},${targetCoords.lng}`;
    let message = isTargetSchool ? `Olá! O(A) ${student.name} está a caminho da escola ${school!.name}. Previsão de desembarque: ${etaString} (em aprox. ${timeMinutes} min). Acompanhe aqui: ${mapLink}` : (timeMinutes < 2 ? `Olá! A van do(a) ${student.name} está quase chegando em casa. Acompanhe em tempo real aqui: ${mapLink}` : `Olá! A van do(a) ${student.name} está a caminho. A previsão de chegada em casa é às ${etaString} (aprox. ${timeMinutes} min). Acompanhe aqui: ${mapLink}`);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, '_blank');
    toast({ title: "Pronto para compartilhar!" });
  }, [student, displayLocation, route?.direction, school, toast]);

  const isLoading = areParentsLoading || areStudentsLoading || areRoutesLoading || areLocationsLoading || areSchoolsLoading;
  const isScalingMode = config?.[0]?.scaling_mode ?? false;
  const studentStatus = student?.status || 'aguardando';
  const isAbsent = studentStatus.startsWith('ausente');
  const journeyDirection = (route?.direction as 'ida' | 'volta') || 'ida';

  const journeyStatusLabel = useMemo(() => {
      if (isAbsent) return { ausente_ida: "Ausente na Ida", ausente_volta: "Ausente na Volta", ausente_dia_todo: "Ausente o Dia Todo" }[studentStatus] || "Ausente";
      if (journeyDirection === 'ida') {
          if (studentStatus === 'aguardando') return "A van está chegando na sua casa";
          if (studentStatus === 'a_bordo') return "A caminho da escola";
          if (studentStatus === 'desembarcado') return "Chegou com segurança na escola";
      } else {
          if (studentStatus === 'aguardando') return "Aguardando saída da escola";
          if (studentStatus === 'a_bordo') return "A caminho da sua casa";
          if (studentStatus === 'desembarcado') return "Entregue em casa com segurança";
      }
      return "Processando jornada...";
  }, [studentStatus, journeyDirection, isAbsent]);

  // Adapter stops for SmartMap
  const smartStops = useMemo(() => {
      if (!students) return [];
      return students.map(s => {
          const sch = allSchools?.find(sch => sch.id === s.schoolId);
          return [
              { id: `s-${s.id}`, type: 'student', data: s },
              sch ? { id: `sch-${sch.id}`, type: 'school', data: sch } : null
          ];
      }).flat().filter(Boolean);
  }, [students, allSchools]);

  return (
    <div className={cn("min-h-screen transition-colors duration-700 p-4", journeyDirection === 'ida' ? "bg-background" : "bg-orange-50/10 dark:bg-orange-950/10")}>
      <div className="max-w-4xl mx-auto">
        {students && students.length > 1 && (
            <div className="space-y-2 mb-6">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Selecione o Aluno</p>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {students.map((s) => (
                        <button key={s.id} onClick={() => handleStudentSelect(s.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all shrink-0", selectedStudentId === s.id ? "bg-primary border-primary text-primary-foreground shadow-md scale-105" : "bg-background border-muted text-muted-foreground hover:border-primary/50")}>
                            <Avatar className="h-6 w-6"><AvatarImage src={`https://picsum.photos/seed/student-${s.id}/40/40`} /><AvatarFallback>{s.name[0]}</AvatarFallback></Avatar>
                            <span className="text-xs font-bold">{s.name.split(' ')[0]}</span>
                        </button>
                    ))}
                </div>
            </div>
        )}

        {latestAnnouncement && (
            <Link href="/parent/mural" className="block mb-4">
                <div className={cn("p-3 rounded-lg flex items-center justify-between gap-3 border-2 animate-in fade-in slide-in-from-top-4 duration-500", latestAnnouncement.priority === 'high' ? "bg-destructive/10 border-destructive text-destructive" : "bg-primary/10 border-primary/20 text-primary")}>
                    <div className="flex items-center gap-3 overflow-hidden">
                        <Megaphone className="h-5 w-5 shrink-0" />
                        <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{latestAnnouncement.title}</p>
                            <p className="text-xs opacity-80 truncate">{latestAnnouncement.content}</p>
                        </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" />
                </div>
            </Link>
        )}

        <div className="flex justify-end items-center mb-6">
          <Link href="/" passHref><Button variant="outline">Sair</Button></Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
        ) : !parent || !student ? (
          <Card className="text-center p-8"><AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" /><CardTitle>Conta não localizada</CardTitle></Card>
        ) : (
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status"><Activity className="mr-2 h-4 w-4"/>Status & Ações</TabsTrigger>
              <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="mt-4">
              <div className="flex flex-col gap-6">
                 {showProximityAlert && (
                    <Card className="bg-primary border-primary animate-pulse shadow-lg ring-4 ring-primary/20">
                        <CardContent className="p-4 flex items-center justify-between text-primary-foreground">
                            <div className="flex items-center gap-3">
                                <div className="bg-white/20 p-2 rounded-full"><BellRing className="h-6 w-6" /></div>
                                <div><p className="font-bold text-lg">A van do {student.name.split(' ')[0]} está quase chegando!</p><p className="text-sm opacity-90">Prepare-se. Distância menor que 800 metros.</p></div>
                            </div>
                            <Sparkles className="h-8 w-8 opacity-50" />
                        </CardContent>
                    </Card>
                 )}

                 <Card className={cn("border-2 transition-all shadow-xl overflow-hidden", journeyDirection === 'ida' ? "border-primary/20" : "border-orange-500/20")}>
                    <CardHeader className={cn("pb-2", journeyDirection === 'ida' ? "bg-primary/5" : "bg-orange-500/5")}>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                                    <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div><CardTitle className="text-xl">Olá, {parent.name.split(' ')[0]}</CardTitle><CardDescription className="font-medium text-foreground/80">Jornada de {student.name}</CardDescription></div>
                            </div>
                            <Badge variant={isAbsent ? "destructive" : "secondary"} className="mt-1">{journeyDirection === 'ida' ? 'Período: Manhã' : 'Período: Tarde'}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="text-center mb-4">
                            <h3 className={cn("text-lg font-bold tracking-tight", isAbsent ? "text-destructive" : (journeyDirection === 'ida' ? "text-primary" : "text-orange-600"))}>{journeyStatusLabel}</h3>
                            {!isAbsent && <p className="text-[10px] text-muted-foreground mt-1 flex items-center justify-center gap-1"><CheckCircle className="h-3 w-3 text-green-500" />Presença confirmada automaticamente.</p>}
                        </div>
                        {!isAbsent && <JourneyTimeline status={studentStatus} direction={journeyDirection} />}
                        {isAbsent ? (
                            <Button variant="secondary" className="w-full mt-4" onClick={handleConfirmPresence}><CheckCircle className="mr-2 h-4 w-4" /> Confirmar Presença</Button>
                        ) : (
                            <Button variant="outline" className="w-full mt-4 border-destructive/20 text-destructive hover:bg-destructive/10" onClick={() => setIsAbsenceDialogOpen(true)} disabled={student.active === false}><XCircle className="mr-2 h-4 w-4" /> Comunicar Ausência Hoje</Button>
                        )}
                    </CardContent>
                    <CardFooter className="pt-0 justify-center pb-6">
                        <Button variant="outline" size="sm" className={cn("text-xs gap-2 border-green-500/20 hover:bg-green-500/10", showProximityAlert && "bg-green-500/10 border-green-500 text-green-600 animate-pulse")} onClick={handleShareTrip} disabled={studentStatus === 'desembarcado' || isAbsent}>
                            <Share2 className="h-4 w-4" /><span>{journeyDirection === 'ida' && studentStatus === 'a_bordo' ? `Compartilhar Chegada` : "Compartilhar Aproximação"}</span>
                        </Button>
                    </CardFooter>
                </Card>

                 <Card><CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Menu de Gestão</CardTitle></CardHeader>
                     <CardContent className="grid grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/qrcode"><QrCode className="h-6 w-6 text-primary" /><span>Meu QR Code</span></Link></Button>
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/requests"><RouteIcon className="h-6 w-6 text-primary" /><span>Viagens Avulsas</span></Link></Button>
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/messages"><MessageCircle className="h-6 w-6 text-primary" /><span>Mensagens</span></Link></Button>
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/contract"><FileText className="h-6 w-6 text-primary" /><span>Contrato</span></Link></Button>
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/authorized"><Users className="h-6 w-6 text-primary" /><span>Autorizados</span></Link></Button>
                        <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/financial"><DollarSign className="h-6 w-6 text-primary" /><span>Financeiro</span></Link></Button>
                    </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="map" className="mt-4">
               <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary" /><span>Vans Ativas</span></div>
                    <div className="flex items-center gap-1.5"><Users className="h-4 w-4 text-blue-500" /><span>Seus Filhos</span></div>
                    <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600" /><span>Escolas</span></div>
                </div>
              <Card className="h-[70vh] border-2 shadow-2xl overflow-hidden relative">
                <CardContent className="p-0 h-full relative">
                    <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="absolute top-3 left-3 z-[1000] bg-background/80 hover:bg-background border-primary/20 shadow-md"><LocateFixed className="h-5 w-5 text-primary" /></Button>
                    <div className="absolute bottom-3 right-3 z-[1000] bg-background/90 p-2 rounded-lg border border-primary/20 shadow-lg text-[10px] space-y-1 flex flex-col pointer-events-none">
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-primary" /><span>Filho Selecionado</span></div>
                        <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-400" /><span>Outros Irmãos</span></div>
                    </div>

                    <SmartMap 
                        center={{ lat: student.latitude, lng: student.longitude }}
                        zoom={12}
                        stops={smartStops}
                        driverLocation={displayLocation}
                        routePolyline={route?.polyline}
                        recenterTrigger={recenterTrigger}
                    >
                        <GoogleMapMarkers 
                            allStudents={students || []}
                            allRoutes={allRoutes || []}
                            allLocations={allLocations || []}
                            allSchools={allSchools || []}
                            selectedStudentId={selectedStudentId}
                        />
                    </SmartMap>
                </CardContent>
              </Card>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground justify-center bg-secondary/30 p-2 rounded-full">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Modo {isScalingMode ? 'Econômico (OSM)' : 'Alta Precisão (Google)'} Ativo.</span>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      <AlertDialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Informar Falta - {student?.name.split(' ')[0]}</AlertDialogTitle></AlertDialogHeader>
          <div className="py-4 space-y-6">
            <RadioGroup value={selectedAbsenceType} onValueChange={(v) => setSelectedAbsenceType(v as any)} className="space-y-3">
              {["ausente_ida", "ausente_volta", "ausente_dia_todo"].map(t => (
                <div key={t} className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                    <RadioGroupItem value={t} id={`r-${t}`} /><Label htmlFor={`r-${t}`} className="flex-1 cursor-pointer font-medium">{t === 'ausente_ida' ? 'Faltará apenas na IDA' : t === 'ausente_volta' ? 'Faltará apenas na VOLTA' : 'Faltará o DIA TODO'}</Label>
                </div>
              ))}
            </RadioGroup>
            {students && students.length > 1 && (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-md border border-dashed">
                    <Checkbox id="apply-all" checked={applyAbsenceToAll} onCheckedChange={(v) => setApplyAbsenceToAll(!!v)} />
                    <Label htmlFor="apply-all" className="text-xs font-bold text-primary cursor-pointer uppercase">Aplicar a todos os filhos</Label>
                </div>
            )}
          </div>
          <AlertDialogFooter><AlertDialogCancel onClick={() => setApplyAbsenceToAll(false)}>Voltar</AlertDialogCancel><AlertDialogAction onClick={handleCommunicateAbsence} className="bg-destructive">Confirmar Falta</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
