
"use client";

import { useMemo, useState, useEffect, useCallback, useRef, Suspense } from "react";
import Link from "next/link";
import {
  useMockCollection,
  useMockData,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { 
    Bus, 
    MessageCircle, 
    School, 
    CheckCircle, 
    Share2, 
    LocateFixed, 
    QrCode, 
    XCircle, 
    DollarSign, 
    Users, 
    Route as RouteIcon, 
    ChevronRight, 
    Home, 
    Megaphone, 
    FileText, 
    HeartPulse, 
    Map as MapIcon, 
    Activity, 
    Info,
    Loader2,
    Camera,
    AlertTriangle,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "next/navigation";

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
  active?: boolean;
  photoUrl?: string;
  lastHandover?: {
    authorizedPersonId: string;
    authorizedPersonName: string;
    relationship: string;
    timestamp: string;
  };
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

const statusText: Record<Student['status'], string> = {
  aguardando: "Aguardando embarque",
  a_bordo: "A bordo da van",
  desembarcado: "Desembarcado com segurança",
  ausente_ida: "Ausente na ida",
  ausente_volta: "Ausente na volta",
  ausente_dia_todo: "Ausente o dia todo",
};

/**
 * Fórmula de Haversine estabilizada e blindada.
 * Previna erros de referência garantindo que todas as variáveis de coordenadas estejam definidas.
 */
function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) {
  if (!coords1 || !coords2 || typeof coords1.lat !== 'number' || typeof coords2.lat !== 'number' || typeof coords1.lng !== 'number' || typeof coords2.lng !== 'number') return Infinity;
  
  const toRad = (val: number) => (val * Math.PI) / 180;
  const R = 6371; // Raio da Terra em km
  
  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  
  const lat1Rad = toRad(coords1.lat);
  const lat2Rad = toRad(coords2.lat);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c;
}

function GoogleMapMarkers({ 
    allStudents, 
    allRoutes, 
    allLocations, 
    allSchools,
    selectedStudentId,
    isMounted,
    selectedRoute
}: { 
    allStudents: Student[], 
    allRoutes: Route[], 
    allLocations: LocationUpdate[], 
    allSchools: SchoolData[],
    selectedStudentId: string | null,
    isMounted: boolean,
    selectedRoute?: Route | null
}) {
  const { activeStudents, driverLocations, studentSchools } = useMemo(() => {
    const activeStudents = allStudents; // Mostra todos os filhos no mapa
    const relatedRouteIds = new Set(activeStudents.map(s => s.routeId).filter(Boolean));
    const relatedSchoolIds = new Set(activeStudents.map(s => s.schoolId).filter(Boolean));
    const relatedDriverIds = new Set(allRoutes.filter(r => relatedRouteIds.has(r.id)).map(r => r.driverId));

    return {
        activeStudents,
        driverLocations: allLocations.filter(l => relatedDriverIds.has(l.id)),
        studentSchools: allSchools.filter(sch => relatedSchoolIds.has(sch.id))
    };
  }, [allStudents, allRoutes, allLocations, allSchools]);

  if (!isMounted) return null;

  return (
    <>
      {selectedRoute?.polyline && <RoutePolyline geoJsonPath={selectedRoute.polyline} />}
      
      {/* 1. Renderizar Vans (uma por motorista relevante) */}
      {driverLocations.map(busLoc => (
        <AdvancedMarker 
            key={`bus-${busLoc.id}`}
            position={{ lat: busLoc.latitude, lng: busLoc.longitude }} 
            title="Van" 
            zIndex={10}
        >
            <div className={cn("relative group animate-pulse")}>
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                    <Badge className="bg-red-600 text-[8px] font-black uppercase py-0 px-1 border-none animate-pulse">● VIVO</Badge>
                    <span className="text-[10px] bg-background/80 px-2 py-0.5 rounded shadow text-muted-foreground">Van em movimento</span>
                </div>
                <Pin background={'#2ab0c1'} borderColor={'#fff'} glyphColor="#fff">
                    <Bus className="h-4 w-4" />
                </Pin>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-black/60 text-white text-[7px] font-bold px-1 rounded uppercase tracking-tighter whitespace-nowrap">
                    {busLoc?.timestamp ? new Date(busLoc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
            </div>
        </AdvancedMarker>
      ))}

      {/* 2. Renderizar Escolas (uma por escola relevante) */}
      {studentSchools.map(school => (
        <AdvancedMarker key={`school-${school.id}`} position={{ lat: school.latitude, lng: school.longitude }} title={school.name as any}>
            <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff"><School className="h-4 w-4" /></Pin>
        </AdvancedMarker>
      ))}

      {/* 3. Renderizar Alunos */}
      {activeStudents
        .map(s => {
          const isSelected = s.id === selectedStudentId;

          return (
              <div key={s.id}>
                  <AdvancedMarker position={{ lat: s.latitude, lng: s.longitude }} title={s.name as any}>
                        <Pin background={isSelected ? '#3b82f6' : '#cbd5e1'} borderColor={'#fff'}>
                            <Avatar className={cn("h-6 w-12", !isSelected && "grayscale opacity-70")}>
                                <AvatarImage src={s.photoUrl || undefined} />
                                <AvatarFallback className="font-bold text-[8px] bg-primary text-white">{(String(s.name) || '?')[0]}</AvatarFallback>
                            </Avatar>
                        </Pin>
                  </AdvancedMarker>
              </div>
          );
        })}
    </>
  );
}

function JourneyTimeline({ status, direction }: { status: Student['status'], direction: 'ida' | 'volta' }) {
    const isIda = direction === 'ida';
    const isOnBoard = status === 'a_bordo';
    const isArrived = status === 'desembarcado';
    
    // Ocultar timeline se o aluno estiver ausente NESTE turno
    if (status === 'ausente_dia_todo') return null;
    if (isIda && status === 'ausente_ida') return null;
    if (!isIda && status === 'ausente_volta') return null;

    const steps = isIda 
        ? [{ label: "Casa", icon: Home, active: true }, { label: "Van", icon: Bus, active: isOnBoard || isArrived }, { label: "Escola", icon: School, active: isArrived }]
        : [{ label: "Escola", icon: School, active: true }, { label: "Van", icon: Bus, active: isOnBoard || isArrived }, { label: "Casa", icon: Home, active: isArrived }];

    return (
        <div className="py-6 px-4">
            <div className="relative flex justify-between items-center w-full max-w-xs mx-auto">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -translate-y-1/2 z-0">
                    <div className={cn("h-full transition-all duration-500", isIda ? "bg-primary" : "bg-orange-500")} style={{ width: isArrived ? '100%' : isOnBoard ? '50%' : '0%' }}/>
                </div>
                {steps.map((step, idx) => (
                    <div key={idx} className="relative z-10 flex flex-col items-center gap-2">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 shadow-sm", step.active ? (isIda ? "bg-primary border-primary text-primary-foreground" : "bg-orange-500 border-orange-500 text-white") : "bg-background border-muted text-muted-foreground")}>
                            <step.icon className="h-5 w-5" />
                        </div>
                        <span className={cn("text-[10px] font-bold uppercase", step.active ? "text-foreground" : "text-muted-foreground")}>{step.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

function ParentTrackingContent() {
  const { toast } = useToast();
  const { updateDoc } = useMockData() as any;
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [showProximityAlert, setShowProximityAlert] = useState(false);
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [selectedAbsenceType, setSelectedAbsenceType] = useState<"ausente_ida" | "ausente_volta" | "ausente_dia_todo">("ausente_dia_todo");
  const [applyAbsenceToAll, setApplyAbsenceToAll] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    setIsMounted(true);
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId);
    
    // Prioridade para o studentId da URL (Compartilhamento)
    const urlStudentId = searchParams.get('studentId');
    const lastSelectedId = sessionStorage.getItem('selectedStudentId');
    
    if (urlStudentId) {
        setSelectedStudentId(urlStudentId);
        sessionStorage.setItem('selectedStudentId', urlStudentId);
    } else if (lastSelectedId) {
        setSelectedStudentId(lastSelectedId);
    }
  }, [searchParams]);

  const handleStudentSelect = (id: string) => {
      setSelectedStudentId(id);
      sessionStorage.setItem('selectedStudentId', id);
  };

  const { data: parents, isLoading: areParentsLoading } = useMockCollection("parents", mockUserId ? [{ field: "userId", op: "==", value: mockUserId }] : undefined);
  const parent = useMemo(() => (parents && parents.length > 0 ? parents[0] : null), [parents]);
  
  const studentFilter = useMemo(() => parent ? [{ field: "parentId", op: "==", value: parent.id }] : [{ field: "id", op: "==", value: "none" }], [parent]);
  const { data: students, isLoading: areStudentsLoading } = useMockCollection("students", studentFilter);
  
  const { data: allRoutes } = useMockCollection("routes", []);
  const { data: allLocations } = useMockCollection("locations", []);
  const { data: allSchools } = useMockCollection("schools", []);
  const { data: allMessages } = useMockCollection("messages", []);
  const { data: allAuthorized } = useMockCollection("authorized_pickups", []);

  const unreadCount = useMemo(() => {
      if (!allMessages || !mockUserId) return 0;
      const recentLimit = new Date(Date.now() - 1800000); 
      return allMessages.filter((m: any) => m.recipientId === mockUserId && new Date(m.timestamp) > recentLimit).length;
  }, [allMessages, mockUserId]);

  // Sincronizar seleção inicial
  useEffect(() => {
    if (students && students.length > 0 && !selectedStudentId) {
      const firstId = students[0].id;
      setSelectedStudentId(firstId);
      sessionStorage.setItem('selectedStudentId', firstId);
    }
  }, [students, selectedStudentId]);

  const student = useMemo(() => {
      if (!students || students.length === 0) return null;
      // Busca o selecionado, se não houver ou não bater, pega o primeiro da lista
      const found = students.find((s: any) => s.id === selectedStudentId);
      return found || students[0];
  }, [students, selectedStudentId]);
  
  const route = useMemo(() => allRoutes?.find((r: any) => r.studentIds.includes(student?.id || '')), [allRoutes, student]);
  const displayLocation = useMemo(() => allLocations?.find((l: any) => l.id === route?.driverId), [allLocations, route]);
  const { data: announcements } = useMockCollection('announcements', [{ field: 'target', op: 'in', value: ['all', 'parents'] }]);
  const latestAnnouncement = useMemo(() => announcements?.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0], [announcements]);

  useEffect(() => {
    if (!student || !displayLocation || typeof student.latitude !== 'number' || typeof displayLocation.latitude !== 'number') return;
    const dist = haversineDistance(
        { lat: displayLocation.latitude, lng: displayLocation.longitude }, 
        { lat: student.latitude, lng: student.longitude }
    );
    const dir = (route?.direction as 'ida' | 'volta') || 'ida';
    if (dist < 0.8 && ((dir === 'ida' && student.status === 'aguardando') || (dir === 'volta' && student.status === 'a_bordo'))) {
        if (!showProximityAlert) { 
            setShowProximityAlert(true); 
            toast({ 
                title: `🚌 Van do ${student.name.split(' ')[0]} chegando!`, 
                description: "A van entrou num raio de 800m.",
                variant: "default",
            }); 
        }
    } else { setShowProximityAlert(false); }
  }, [displayLocation, student, route?.direction, showProximityAlert, toast]);

  const handleCommunicateAbsence = useCallback(async () => {
    if (!student || !students) return;
    (applyAbsenceToAll ? students : [student]).forEach((s: any) => updateDoc('students', s.id, { status: selectedAbsenceType }));
    setIsAbsenceDialogOpen(false);
    toast({ title: "Ausência comunicada", description: "O motorista foi notificado." });
  }, [student, students, selectedAbsenceType, applyAbsenceToAll, updateDoc, toast]);

  const handleConfirmPresence = () => { if (student) { updateDoc('students', student.id, { status: 'aguardando' }); toast({ title: "Presença Confirmada!" }); } };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !student) return;

    // [VALIDATION] Limite de 2MB para evitar lentidão no MockDB (Base64)
    if (file.size > 2 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "O limite é 2MB para o protótipo.", variant: "destructive" });
        return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        updateDoc('students', student.id, { photoUrl: reader.result as string });
        setIsUploading(false);
        toast({ title: "Foto Adicionada!", description: "Seu filho já pode ser identificado pelo motorista." });
    };
    reader.readAsDataURL(file);
  };

  const handleShareTrip = useCallback(async () => {
    if (!student || !displayLocation) {
        toast({
            title: "Localização indisponível",
            description: "Aguardando sinal GPS do motorista para compartilhar.",
            variant: "destructive"
        });
        return;
    }

    const shareUrl = `${window.location.origin}/parent/tracking?studentId=${student.id}`;
    const shareText = `📍 Acompanhe em tempo real a van de ${student.name.split(' ')[0]} no Guardian:`;

    // 1. Tenta usar a API nativa de compartilhamento do celular (PWA/Mobile)
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Guardian - Rastreamento',
                text: shareText,
                url: shareUrl,
            });
            return;
        } catch (err) {
            console.log('Compartilhamento nativo cancelado ou falhou', err);
        }
    }

    // 2. Fallback para WhatsApp (Desktop ou navegadores sem navigator.share)
    const waLink = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
    window.open(waLink, '_blank');
  }, [student, displayLocation, toast]);

  const isLoading = areParentsLoading || areStudentsLoading;
  const isAbsent = student?.status.startsWith('ausente');
  const journeyDirection = (route?.direction as 'ida' | 'volta') || 'ida';

  const smartStops = useMemo(() => {
      if (!students || !selectedStudentId) return [];
      const filteredStudents = students.filter((s: any) => s.id === selectedStudentId);
      return filteredStudents.map((s: any) => [
          { id: `s-${s.id}`, type: 'student' as const, data: s }, 
          { id: `sch-${s.schoolId}`, type: 'school' as const, data: allSchools?.find((sch: any) => sch.id === s.schoolId) }
      ]).flat().filter(Boolean);
  }, [students, allSchools, selectedStudentId]);

  // Nome do estudante para exibição no cabeçalho (Direto para evitar sujeira de cache)
  const currentStudentName = students?.find((s: any) => s.id === selectedStudentId)?.name || student?.name || 'Selecione um filho';

  useEffect(() => {
    if (isMounted && currentStudentName !== 'Selecione um filho') {
        document.title = `Rastreamento: ${currentStudentName} | Guardian`;
    }
  }, [isMounted, currentStudentName]);

  if (!isMounted || isLoading) return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  // Fallback: session not set (user accessed directly without going through registration)
  if (!isLoading && !mockUserId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background gap-6">
        <div className="p-5 bg-primary/10 rounded-full">
          <Bus className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Acesso não identificado</h1>
          <p className="text-muted-foreground text-sm max-w-xs">
            Para acessar o painel de rastreamento, você precisa ter feito seu cadastro pelo link enviado pelo gestor da van.
          </p>
        </div>
        <div className="bg-secondary/40 border rounded-xl p-4 text-xs text-muted-foreground max-w-xs space-y-1">
          <p className="font-bold text-foreground uppercase text-[10px] tracking-widest">O que fazer?</p>
          <p>Verifique o WhatsApp enviado pelo seu operador de transporte e acesse o link de cadastro.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen p-4 space-y-6 pb-32 md:pb-6", journeyDirection === 'ida' ? "bg-background" : "bg-orange-50/10")}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold italic text-primary">Guardian</h1>
            <Link href="/"><Button variant="ghost">Sair</Button></Link>
        </div>

        {student && !student.photoUrl && (
            <Card className="border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-full text-amber-600"><AlertTriangle className="h-5 w-5" /></div>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-amber-700">Segurança: Foto Pendente</p>
                        <p className="text-[10px] text-amber-600 leading-tight">Adicione uma foto de {student.name.split(' ')[0]} para que o motorista o identifique no embarque.</p>
                    </div>
                </div>
                <input type="file" accept="image/*" capture="user" className="hidden" ref={fileInputRef} onChange={handlePhotoUpload} />
                <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-700 h-8 text-[10px] font-bold shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Camera className="h-3 w-3 mr-1" /> ADICIONAR AGORA</>}
                </Button>
            </Card>
        )}

        {students && students.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {students.map((s) => (
                    <button key={s.id} onClick={() => handleStudentSelect(s.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all shrink-0", selectedStudentId === s.id ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-card border-muted text-muted-foreground")}>
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={s.photoUrl || undefined} />
                            <AvatarFallback>{s.name[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-bold">{s.name.split(' ')[0]}</span>
                    </button>
                ))}
            </div>
        )}

        {latestAnnouncement && (
            <Link href="/parent/mural" className={cn(
                "block p-4 rounded-xl border-2 transition-all active:scale-[0.98]",
                latestAnnouncement.priority === 'high' ? "bg-destructive/10 border-destructive text-destructive animate-pulse shadow-destructive/20 shadow-lg" : "bg-primary/10 border-primary/20 text-primary"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={cn("p-2 rounded-full", latestAnnouncement.priority === 'high' ? "bg-destructive text-white" : "bg-primary text-white")}>
                            <Megaphone className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Aviso Oficial</p>
                            <p className="font-bold text-sm truncate">{latestAnnouncement.title}</p>
                        </div>
                    </div>
                    <ChevronRight className="h-5 w-5 opacity-50" />
                </div>
            </Link>
        )}

        <Tabs defaultValue="jornada" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="jornada" className="gap-2">
                    <Activity className="h-4 w-4" /> Jornada
                </TabsTrigger>
                <TabsTrigger value="mapa" className="gap-2">
                    <MapIcon className="h-4 w-4" /> Mapa
                </TabsTrigger>
            </TabsList>

            <TabsContent value="jornada" className="space-y-6 animate-in fade-in duration-300">
                <Card className="border-2 shadow-xl overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b pb-4">
                        <div className="flex items-center gap-4">
                            <Avatar className="h-16 w-16 border-2 border-background shadow-md">
                                <AvatarImage src={student?.photoUrl || undefined} />
                                <AvatarFallback className="text-3xl font-black">{(String(student?.name) || '?')[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                                <CardTitle className="text-xl">Olá, {String(parent?.name || 'Responsável').split(' ')[0]}</CardTitle>
                                <CardDescription className="font-medium text-foreground/80">Jornada de {currentStudentName}</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <JourneyTimeline status={student?.status || 'aguardando'} direction={journeyDirection} />
                        
                        {student?.status === 'desembarcado' && student?.lastHandover && (
                            <div className="mt-6 mb-2 p-4 rounded-xl border-2 border-green-500/30 bg-green-500/10 flex items-start gap-3 animate-in fade-in zoom-in-95 duration-500">
                                <Avatar className="h-12 w-12 border-2 border-green-500/20 shadow-sm shrink-0">
                                    <AvatarFallback className="font-black text-green-700 bg-green-500/20 uppercase">
                                        {student.lastHandover.authorizedPersonName.split(' ').map((n: string) => n[0]).join('')}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="space-y-1">
                                    <h4 className="font-black text-green-700 uppercase tracking-tight text-sm">Entrega Confirmada</h4>
                                    <p className="text-[11px] text-green-800 leading-tight">
                                        Entregue para <strong className="uppercase">{student.lastHandover.authorizedPersonName}</strong> ({student.lastHandover.relationship}).
                                    </p>
                                    <p className="text-[9px] text-green-700/80 font-black uppercase mt-1 tracking-widest flex items-center gap-2">
                                        <ShieldCheck className="h-3 w-3" />
                                        {new Date(student.lastHandover.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • Segurado via App
                                    </p>
                                </div>
                            </div>
                        )}

                        {isAbsent ? (
                            <div className="mt-4 p-4 rounded-xl border-2 border-destructive/30 bg-destructive/5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <XCircle className="h-5 w-5 text-destructive" />
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-bold text-destructive uppercase tracking-widest">Ausência Comunicada</p>
                                        <p className="text-[10px] text-muted-foreground">{statusText[(student?.status || 'aguardando') as Student['status']]}</p>
                                    </div>
                                </div>
                                <Button variant="link" className="text-[10px] h-8 p-0 text-primary font-bold uppercase underline" onClick={() => updateDoc('students', student.id, { status: 'aguardando' })}>Desfazer / Presente</Button>
                            </div>
                        ) : (
                            <Button variant="outline" className="w-full mt-4 border-destructive/20 text-destructive h-12 font-bold uppercase tracking-widest text-[10px]" onClick={() => setIsAbsenceDialogOpen(true)}>
                                <XCircle className="mr-2 h-4 w-4" /> Comunicar Ausência Hoje
                            </Button>
                        )}
                    </CardContent>
                    <CardFooter className="justify-center border-t py-4">
                        <Button variant="ghost" size="sm" onClick={handleShareTrip} className="text-xs gap-2">
                            <Share2 className="h-4 w-4" /> Compartilhar Localização
                        </Button>
                    </CardFooter>
                </Card>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/qrcode"><QrCode className="h-6 w-6 text-primary" /><span>QR Code</span></Link></Button>
                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/requests"><RouteIcon className="h-6 w-6 text-primary" /><span>Viagens Avulsas</span></Link></Button>
                    
                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs relative overflow-visible">
                        <Link href="/parent/messages">
                            <div className="relative">
                                <MessageCircle className="h-6 w-6 text-primary" />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-black text-white animate-bounce shadow-lg border-2 border-background">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            <span>Mensagens</span>
                        </Link>
                    </Button>

                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/contract"><FileText className="h-6 w-6 text-primary" /><span>Contrato</span></Link></Button>
                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/authorized"><Users className="h-6 w-6 text-primary" /><span>Autorizados</span></Link></Button>
                    <Button asChild variant="outline" className="flex flex-col h-auto py-4 gap-2 justify-center text-xs"><Link href="/parent/financial"><DollarSign className="h-6 w-6 text-primary" /><span>Financeiro</span></Link></Button>
                </div>
            </TabsContent>

            <TabsContent value="mapa" className="animate-in fade-in duration-300">
                <Card className="h-[clamp(400px,65vh,700px)] border-2 shadow-2xl overflow-hidden relative">
                    <Button variant="outline" size="icon" onClick={() => setRecenterTrigger(c => c + 1)} className="absolute top-3 left-3 z-[1000] bg-background/80 shadow-sm border-primary/20"><LocateFixed className="h-5 w-5 text-primary" /></Button>
                    <SmartMap 
                        center={{ lat: student?.latitude || -23.55, lng: student?.longitude || -46.63 }} 
                        zoom={13} 
                        stops={smartStops} 
                        driverLocation={displayLocation} 
                        routePolyline={route?.polyline} 
                        recenterTrigger={recenterTrigger}
                    >
                        <GoogleMapMarkers allStudents={students || []} allRoutes={allRoutes || []} allLocations={allLocations || []} allSchools={allSchools || []} selectedStudentId={student?.id || null} isMounted={isMounted} selectedRoute={route} />
                    </SmartMap>
                </Card>
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/10 flex items-start gap-3">
                    <Info className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground leading-relaxed">O mapa exibe a localização em tempo real da van vinculada à rota de <strong>{student?.name}</strong>. As atualizações ocorrem a cada 30 segundos ou 30 metros de deslocamento.</p>
                </div>
            </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] rounded-2xl">
          <AlertDialogHeader>
              <AlertDialogTitle className="text-center text-xl font-black italic text-primary">Guardian</AlertDialogTitle>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-center text-sm font-medium text-muted-foreground">Em qual período seu filho(a) faltará?</p>
            <RadioGroup value={selectedAbsenceType} onValueChange={(v) => setSelectedAbsenceType(v as any)} className="space-y-3">
              {[
                { id: "ausente_ida", label: "Faltará na IDA", sub: "Apenas coleta da manhã/tarde", icon: Home },
                { id: "ausente_volta", label: "Faltará na VOLTA", sub: "Apenas entrega da tarde/noite", icon: School },
                { id: "ausente_dia_todo", label: "Faltará o DIA TODO", sub: "Não irá em nenhum turno", icon: XCircle }
              ].map((t) => (
                <div key={t.id} className={cn("flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer", selectedAbsenceType === t.id ? "border-primary bg-primary/5" : "border-muted")} onClick={() => setSelectedAbsenceType(t.id as any)}>
                    <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                    <div className={cn("p-2 rounded-lg", selectedAbsenceType === t.id ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                        <t.icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <Label htmlFor={t.id} className="block cursor-pointer font-black text-sm uppercase tracking-tight">{t.label}</Label>
                        <p className="text-[10px] text-muted-foreground">{t.sub}</p>
                    </div>
                </div>
              ))}
            </RadioGroup>
            {students && students.length > 1 && (
                <div className="flex items-center space-x-2 p-3 bg-muted/50 rounded-xl border border-dashed">
                    <Checkbox id="all" checked={applyAbsenceToAll} onCheckedChange={(v) => setApplyAbsenceToAll(!!v)} />
                    <Label htmlFor="all" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aplicar a todos os filhos</Label>
                </div>
            )}
          </div>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel onClick={() => setApplyAbsenceToAll(false)} className="w-full sm:w-auto rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCommunicateAbsence} className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl">Confirmar Falta</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function ParentTrackingPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ParentTrackingContent />
    </Suspense>
  );
}
