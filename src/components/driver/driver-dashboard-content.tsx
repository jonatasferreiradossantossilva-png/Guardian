'use client';

/**
 * Guardian Driver Dashboard - Qualidade Verificada 06/04/2026
 * Responsável pelo fluxo operacional do motorista, telemetria e gestão de paradas.
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns';
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
  Megaphone,
  ShieldCheck,
  Clock,
  Info,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useDataCollection, useData, useDataNestedDoc } from '@/hooks/use-data';
import { AuthorizedContactsModal } from '@/components/shared/authorized-contacts-modal';
import { useToast } from '@/hooks/use-toast';
import { getSafeDateStr } from '@/lib/safe-render';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label as RawLabel } from '@/components/ui/label';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { QrScannerModal } from '@/components/shared/qr-scanner-modal';
import { cn } from '@/lib/utils';
import { SmartMap } from '@/components/shared/smart-map';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { ReportIncidentForm } from '@/components/dashboard/report-incident-form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteHub } from '@/components/driver/invite-hub';
import { PendingApprovals } from '@/components/driver/pending-approvals';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { GoogleMapMarkers } from '@/components/driver/google-map-markers';
import { useTelemetry } from '@/hooks/use-telemetry';
import { NotificationBell } from '@/components/dashboard/notification-bell';
import { Student, SchoolData, Route, Driver, User, Shift, JourneyStatus, StudentStatus, RouteManifest } from '@/types/mock-data';
import { SafeRow } from '@/components/shared/safe-table';
import { safeString, safeArray, safeInitials } from '@/lib/safe-render';
import { ErrorBoundary } from '@/components/shared/error-boundary';


type Stop = 
  | { id: string; type: 'student'; data: Student; isExtra?: boolean }
  | { id: string; type: 'school'; data: SchoolData };

const statusText: Record<StudentStatus, string> = {
  aguardando: 'Aguardando',
  a_bordo: 'A Bordo',
  desembarcado: 'Desembarcado',
  ausente_ida: 'Ausente (Ida)',
  ausente_volta: 'Ausente (Volta)',
  ausente_dia_todo: 'Ausente (Dia Todo)',
  aguardando_aprovacao: 'Aguardando Aprovação',
  pendente_alocacao: 'Pendente Alocação',
};

const modalityLabels: Record<string, string> = {
  completo: 'IDA E VOLTA',
  so_ida: 'SOMENTE IDA',
  so_volta: 'SOMENTE VOLTA',
  avulso: 'AVULSA',
};

const formatStudentClassInfo = (student: Student) => {
    if (!student.serie) return student.shift;
    const serie = student.serie.replace(/\s*ano/i, '').replace(/º/g, '').trim();
    const turma = student.turma ? student.turma.replace(/Sala/gi, 'SL') : '';
    return `${serie}º • ${turma} • ${student.shift}`;
};

export default function DriverDashboardContent() {
  const { updateDoc, setIsSimulating, forceScenario, createNotification } = useData() as any;
  const { data: allParents } = useDataCollection('parents');
  const { updateLocation: syncTelemetry } = useTelemetry();
  const { toast } = useToast();
  
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<Student | null>(null);
  const [selectedShift, setSelectedShift] = useState<Shift>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  const [selectedRouteIdForStart, setSelectedRouteIdForStart] = useState<string>('');
  const [substituteDriverId, setSubstituteDriverId] = useState<string>('default');
  const [substituteMonitorId, setSubstituteMonitorId] = useState<string>('default');
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStep, setOptimizationStep] = useState<'idle' | 'routing' | 'polyline' | 'done'>('idle');
  const [absentStudentsNames, setAbsentStudentsNames] = useState<string[]>([]);
  const [showAbsenceAlert, setShowAbsenceAlert] = useState(false);
  const [showExtraAlert, setShowExtraAlert] = useState(true);
  const [showAnnouncement, setShowAnnouncement] = useState(true);
  const [lastActionFeedback, setLastActionFeedback] = useState<{ studentName: string; action: string } | null>(null);
  const isOnline = useOnlineStatus();
  const [isMounted, setIsMounted] = useState(false);
  const lastNotifiedStopId = useRef<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem('mockUserId') : null;
    setMockUserId(userId || "user-motorista-4"); 
    
    const savedRouteId = typeof window !== 'undefined' ? sessionStorage.getItem('activeRouteId') : null;
    if (savedRouteId) setActiveRouteId(savedRouteId);
    
    const savedShift = typeof window !== 'undefined' ? sessionStorage.getItem('activeShift') as Shift : null;
    if (savedShift) setSelectedShift(savedShift);
    
    const savedDir = typeof window !== 'undefined' ? sessionStorage.getItem('activeDirection') as 'ida' | 'volta' : null;
    if (savedDir) setSelectedDirection(savedDir);
  }, []);

  const driverFilter = useMemo(() => (mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined), [mockUserId]);
  const { data: drivers, isLoading: areDriversLoading } = useDataCollection('drivers', driverFilter);
  const driverProfile = useMemo(() => (drivers && drivers.length > 0 ? drivers[0] : null), [drivers]);
  const driverId = driverProfile?.id;
  const { data: driverLocation } = useDataNestedDoc(driverId ? `locations/${driverId}` : null);

  const { data: routes, isLoading: isRouteLoading } = useDataCollection('routes', driverId ? [{ field: 'driverId', op: '==', value: driverId }] : []);
  const route = useMemo(() => {
    if (activeRouteId && routes) {
      const found = routes.find(r => r.id === activeRouteId);
      if (found) return found;
    }
    if (selectedRouteIdForStart && routes) {
      const found = routes.find(r => r.id === selectedRouteIdForStart);
      if (found) return found;
    }
    return (routes && routes.length > 0) ? routes[0] : null;
  }, [routes, activeRouteId, selectedRouteIdForStart]);

  const isTripActive = useMemo(() => {
    if (!driverProfile || driverProfile.status === 'inativo') return false;
    if (driverProfile.status === 'em_rota' || driverProfile.status === 'pausa') {
      return route?.journeyStatus === 'em_rota' && Boolean(activeRouteId);
    }
    return false;
  }, [driverProfile?.status, route?.journeyStatus, activeRouteId]);
  const { data: allStudents, isLoading: areStudentsLoading } = useDataCollection('students') as { data: Student[] | undefined, isLoading: boolean };
  const { data: schools, isLoading: areSchoolsLoading } = useDataCollection('schools') as { data: SchoolData[] | undefined, isLoading: boolean };
  const { data: routeManifests } = useDataCollection<RouteManifest>('route_manifests');

  const todayStr = useMemo(() => {
    return typeof window !== 'undefined' ? format(new Date(), 'yyyy-MM-dd') : '';
  }, []);

  const activeManifest = useMemo(() => {
    if (!route || !routeManifests || !todayStr) return null;
    return routeManifests.find(m =>
      m && m.routeId === route.id &&
      getSafeDateStr(m.date) === todayStr &&
      m.direction === selectedDirection
    );
  }, [route, routeManifests, todayStr, selectedDirection]);

  const activeStudentIds = useMemo(() => {
    if (!route) return [];
    if (activeManifest) {
      return activeManifest.studentIds || [];
    }
    return route.baseStudentIds || route.studentIds || [];
  }, [route, activeManifest]);
  
  const { data: allDrivers } = useDataCollection('drivers');
  const { data: monitors } = useDataCollection('users', [{ field: 'profile', op: '==', value: 'monitor' }]);
  const { data: announcements } = useDataCollection('announcements', [{ field: 'target', op: 'in', value: ['all', 'drivers'] }]);
  const latestAnnouncement = useMemo(() => {
    const list = safeArray(announcements);
    if (list.length === 0) return null;
    return [...list].sort((a: any, b: any) => {
        const dateA = new Date(a?.createdAt || 0).getTime();
        const dateB = new Date(b?.createdAt || 0).getTime();
        return dateB - dateA;
    })[0];
  }, [announcements]);


  // Reset de rota ao carregar para garantir consistência de turno
  useEffect(() => { if (routes?.length && !selectedRouteIdForStart) setSelectedRouteIdForStart(routes[0].id); }, [routes, selectedRouteIdForStart]);

  const schoolsMap = useMemo(() => {
    const map = new Map<string, SchoolData>();
    if (Array.isArray(schools)) {
        schools.filter(s => !!s && !!s.id).forEach(s => map.set(s.id, s));
    }
    return map;
  }, [schools]);

  const studentsMap = useMemo(() => {
    const map = new Map<string, Student>();
    if (Array.isArray(allStudents)) {
        allStudents.filter(s => !!s && !!s.id).forEach(s => map.set(s.id, s));
    }
    return map;
  }, [allStudents]);

  const orderedStops = useMemo<Stop[]>(() => {
    if (!activeStudentIds || !Array.isArray(activeStudentIds) || !allStudents || !schools) return [];

    const neededSchoolIds = new Set<string>();

    const studentStops: Stop[] = [];
    for (const id of activeStudentIds) {
        const student = studentsMap.get(id);
        if (!student || student.active === false) continue;

        const modality = student.serviceModality || 'completo';
        if (selectedDirection === 'ida' && modality === 'so_volta') continue;
        if (selectedDirection === 'volta' && modality === 'so_ida') continue;
        if (student.shift !== 'Integral' && student.shift !== selectedShift) continue;
        
        const isAbsentIda = student.status === 'ausente_ida' || student.status === 'ausente_dia_todo';
        const isAbsentVolta = student.status === 'ausente_volta' || student.status === 'ausente_dia_todo';
        if (selectedDirection === 'ida' && isAbsentIda) continue;
        if (selectedDirection === 'volta' && isAbsentVolta) continue;

        const isExtra = route && !(route.baseStudentIds || route.studentIds || []).includes(id);
        studentStops.push({ id, type: 'student', data: student as Student, isExtra });
        if (student.schoolId) neededSchoolIds.add(student.schoolId);
    }

        const schoolStops = Array.from(neededSchoolIds)
            .map((schoolId: string) => {
                const school = schoolsMap.get(schoolId);
                return school ? ({ id: schoolId, type: 'school' as const, data: school as SchoolData } as Stop) : null;
            })
            .filter((s): s is Stop => s !== null);

        if (selectedDirection === 'ida') {
            return [...studentStops, ...schoolStops];
        } else {
            return [...schoolStops, ...studentStops];
        }
  }, [activeStudentIds, allStudents, schools, selectedShift, selectedDirection, studentsMap, schoolsMap]);

  const boardedStops = useMemo<Stop[]>(() => {
    if (!orderedStops) return [];
    return orderedStops.filter(s => s.type === 'student' && s.data.status === 'a_bordo');
  }, [orderedStops]);

  const { activeStop, upcomingStops, progressData } = useMemo(() => {
    if (!orderedStops || driverProfile?.status === 'inativo') return { activeStop: null, upcomingStops: [], progressData: { current: 0, total: 0, percentage: 0 } };
    
    const nextStopIndex = orderedStops.findIndex(s => {
        if (selectedDirection === 'ida') {
            if (s.type === 'student') return s.data.status === 'aguardando';
            return orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'a_bordo');
        } else {
            if (s.type === 'school') return orderedStops.some(st => st.type === 'student' && st.data.schoolId === s.id && st.data.status === 'aguardando');
            if (s.type === 'student') return s.data.status === 'a_bordo';
            return false;
        }
    });

    const total = orderedStops.length;
    
    if (nextStopIndex === -1) {
        return { activeStop: null, upcomingStops: [], progressData: { current: total, total, percentage: 100 } };
    }
    
    const percentage = total > 0 ? (nextStopIndex / total) * 100 : 0;
    
    return { 
        activeStop: orderedStops[nextStopIndex], 
        upcomingStops: orderedStops.slice(nextStopIndex + 1),
        progressData: { current: nextStopIndex, total, percentage }
    };
  }, [orderedStops, driverProfile?.status, selectedDirection]);

   const studentsAtCurrentStop = useMemo(() => {
      if (!activeStop || activeStop.type !== 'school' || !allStudents || !route) return [];
      const isIda = selectedDirection === 'ida';
      const currentStatus = isIda ? 'a_bordo' : 'aguardando';
      
      return allStudents.filter(s => {
          // 1. Deve pertencer a esta escola
          if (s.schoolId !== activeStop.id) return false;
          // 2. Deve pertencer a esta rota específica
          if (!activeStudentIds.includes(s.id)) return false;
          // 3. Deve ter o status correto para a ação (a bordo para desembarcar na ida, aguardando para embarcar na volta)
          if (s.status !== currentStatus) return false;
          // 4. Deve respeitar o turno
          if (s.shift !== 'Integral' && s.shift !== selectedShift) return false;
          // 5. Deve respeitar a modalidade (quem é só ida não embarca na volta)
          const modality = s.serviceModality || 'completo';
          if (isIda && modality === 'so_volta') return false;
          if (!isIda && modality === 'so_ida') return false;
          // 6. Não deve estar inativo
          if (s.active === false) return false;
          
          return true;
      });
   }, [activeStop, allStudents, selectedDirection, selectedShift, activeStudentIds]);

  const handleEndRoute = useCallback(() => {
      // 1. Atualizar status no banco de dados (funciona em Mock E em Firestore)
      if (route?.id) {
          (updateDoc as any)('routes', route.id, { 
              journeyStatus: 'pendente',
              completedAt: new Date().toISOString()
          });
      }
      if (driverId) {
          (updateDoc as any)('drivers', driverId, { status: 'inativo' });
      }
      
      // 2. Resetar status de alunos para novo ciclo
      if (activeStudentIds && Array.isArray(activeStudentIds)) {
          activeStudentIds.forEach((id: string) => {
              const student = studentsMap.get(id);
              if (student && !student.status?.startsWith('ausente')) {
                  (updateDoc as any)('students', id, { status: 'aguardando' });
              }
          });
      }

      // 3. Resetar cenário mock se disponível
      if (forceScenario) {
          forceScenario('motorista_inicio');
      }
      
      // 4. Limpar sessões locais e desativar tela de viagem
      setActiveRouteId(null);
      setLastActionFeedback(null);
      if (typeof window !== 'undefined') {
          sessionStorage.removeItem('activeRouteId');
          sessionStorage.removeItem('activeShift');
          sessionStorage.removeItem('activeDirection');
      }

      toast({
          title: "Operação Finalizada",
          description: "O itinerário foi concluído e o sistema está pronto para uma nova viagem."
      });
  }, [route?.id, driverId, activeStudentIds, studentsMap, updateDoc, forceScenario, toast]);

  const performRouteOptimization = useCallback(async (currentRoute: Route | null, currentStops: Stop[], isManualStart: boolean = false) => {
    if (!currentRoute || !allStudents || !schools) return;

    // Se estiver em modo de teste/apresentação, ignorar otimização pesada para resposta instantânea
    if (typeof window !== 'undefined' && (window as any).IS_TESTING) {
        console.log("Demo Mode: Skipping heavy optimization for instant UI response.");
        return;
    }

    setIsOptimizing(true);
    setOptimizationStep('routing');
    try {
        const studentStops = currentStops
            .filter((s): s is { id: string; type: 'student'; data: Student } => s.type === 'student')
            .map(s => ({
                id: s.id,
                name: s.data.name,
                address: `${s.data.latitude},${s.data.longitude}`,
                schoolId: s.data.schoolId
            }));
        const schoolStops = schools
            .filter(sch => studentStops.some(s => s.schoolId === sch.id))
            .map(sch => ({
                id: sch.id,
                name: sch.name,
                address: `${sch.latitude},${sch.longitude}`
            }));
        if (studentStops.length >= 1) {
            const startAddress = (driverLocation?.latitude && driverLocation?.longitude) 
                ? `${driverLocation.latitude},${driverLocation.longitude}` 
                : undefined;
            const result = await optimizeSchoolVanRoute({
                students: studentStops,
                schools: schoolStops,
                direction: selectedDirection,
                optimizationMode: 'flexible',
                startAddress
            });
            const validIds = new Set([
                ...studentStops.map(s => s.id),
                ...schoolStops.map(s => s.id)
            ]);
            const safeOptimizedIds = result.optimizedStops
                .map(s => s.id)
                .filter(id => validIds.has(id));
            const missingIds = [...validIds].filter(id => !safeOptimizedIds.includes(id));
            const newIds = [...safeOptimizedIds, ...missingIds];
            setOptimizationStep('polyline');
            const waypoints = newIds.map(id => {
                const ent = studentsMap.get(id) || schoolsMap.get(id);
                return ent ? { lat: ent.latitude, lng: ent.longitude } : null;
            }).filter(Boolean) as {lat: number, lng: number}[];
            let polylineData = "";
            if (waypoints.length >= 2) {
                try {
                    const routing = await routingGeoapify({ waypoints, mode: 'drive' });
                    polylineData = routing.polyline;
                } catch (routingErr) { 
                    console.warn('Polyline geração falhou:', routingErr);
                }
            }
            if (activeManifest) {
                updateDoc('route_manifests', activeManifest.id, {
                    studentIds: newIds,
                    updatedAt: new Date().toISOString()
                });
                updateDoc('routes', currentRoute.id, {
                    polyline: polylineData,
                    lastOptimizedAt: new Date().toISOString()
                });
            } else {
                updateDoc('routes', currentRoute.id, { 
                    studentIds: newIds, 
                    polyline: polylineData, 
                    lastOptimizedAt: new Date().toISOString() 
                });
            }
            if (!isManualStart) {
                toast({ title: "Rota Atualizada", description: "O itinerário foi recalculado devido à ausência encontrada." });
            }
        }
    } catch (e) {
        console.error("Erro na otimização automatizada:", e);
    } finally {
        setOptimizationStep('idle');
        setIsOptimizing(false);
    }
  }, [allStudents, schools, selectedDirection, driverLocation, studentsMap, schoolsMap, updateDoc, toast, activeManifest]);

  const handleStartRoute = async () => {
    if (!route || !driverProfile || !allStudents) return;
    
    setShowExtraAlert(true);
    
    // 1. Resetar status de todos os alunos da rota para o estado inicial (aguardando)
    // Isso evita que a rota comece "finalizada" se houver lixo de sessões anteriores no localStorage
    const studentIdsToReset = safeArray(activeStudentIds) as string[];
    studentIdsToReset.forEach((id: string) => {
        const student = studentsMap.get(id);
        if (student) {
            const isAbsentIda = student.status === 'ausente_ida' || student.status === 'ausente_dia_todo';
            const isAbsentVolta = student.status === 'ausente_volta' || student.status === 'ausente_dia_todo';
            const shouldKeepAbsent = selectedDirection === 'ida' ? isAbsentIda : isAbsentVolta;
            
            // Se não for uma falta justificada, reseta para aguardando
            if (!shouldKeepAbsent) {
                updateDoc('students', id, { status: 'aguardando' });
            }
        }
    });

    // 2. Identificar faltas para o alerta
    const missing = allStudents.filter(s => 
        (safeArray(activeStudentIds) as string[]).includes(s.id) && 
        s.status.startsWith('ausente') && 
        (s.shift === 'Integral' || s.shift === selectedShift)
    );
    if (missing.length > 0) {
        setAbsentStudentsNames((safeArray(missing) as any[]).filter(m => !!m && !!m.name).map(m => safeString(m.name).split(' ')[0]));
        setShowAbsenceAlert(true);
    }


    // 3. Atualizar status do motorista e da rota IMEDIATAMENTE (antes da otimização que é lenta)
    (updateDoc as any)('drivers', driverId, { status: 'em_rota' });
    (updateDoc as any)('routes', route.id, {
        activeShift: selectedShift,
        activeDirection: selectedDirection,
        journeyStatus: 'em_rota',
        startedBy: driverProfile?.name || 'Motorista',
        actualDriverId: substituteDriverId === 'default' ? route.driverId : substituteDriverId,
        actualMonitorId: substituteMonitorId === 'default' ? route.monitorId : substituteMonitorId
    });

    // 4. Salvar no sessionStorage para persistência em refresh
    sessionStorage.setItem('activeRouteId', route.id);
    sessionStorage.setItem('activeShift', selectedShift);
    sessionStorage.setItem('activeDirection', selectedDirection);
    
    // 5. Otimizar a rota (isso vai gerar a polyline e atualizar o itinerário)
    // Passamos orderedStops atualizado (que o React re-calculará no próximo tick)
    // Para garantir sucesso imediato, podemos forçar o setActiveRouteId agora
    setActiveRouteId(route.id);
    
    // 6. Criar Notificação para o Monitor e para todos os PAIS da rota
    const monitorUserId = (monitors as any)?.find((m: any) => m.id === route.monitorId)?.userId || route.monitorId;
    if (monitorUserId) {
        createNotification(
            monitorUserId,
            "Viagem Iniciada",
            `🚐 A rota ${route.name} foi iniciada pelo motorista ${driverProfile?.name}.`,
            "success"
        );
    }

    // Notificar todos os pais
    (safeArray(activeStudentIds) as string[]).forEach((sId: string) => {
        const student = studentsMap.get(sId);
        if (student && student.parentId) {
            const parent = (allParents as any)?.find((p: any) => p.id === student.parentId);
            if (parent) {
                createNotification(
                    parent.userId,
                    "Van em Movimento",
                    `🚐 Olá! A rota ${route.name} foi iniciada. Acompanhe o trajeto de ${student.name.split(' ')[0]} em tempo real!`,
                    "info"
                );
            }
        }
    });

    toast({ title: "Viagem Iniciada!" });

    // [MELHORIA DE UX] Roda a otimização em background (não aguarda para não travar a UI)
    performRouteOptimization(route, orderedStops, true);
  };

  const handleStatusChange = useCallback((studentId: string, newStatus: StudentStatus) => {
    updateDoc('students', studentId, { status: newStatus });
    
    // Notificação e Toast automático sobre o embarque/desembarque
    const student = studentsMap.get(studentId);
    const firstName = student?.name ? student.name.split(' ')[0] : 'Aluno';

    if (newStatus === 'a_bordo') {
        setLastActionFeedback({
            studentName: student?.name || 'Aluno',
            action: 'embarcou com sucesso na van'
        });
        toast({
            title: "Embarque Confirmado!",
            description: `✅ ${firstName} embarcou com segurança na van.`,
        });
    } else if (newStatus === 'desembarcado') {
        setLastActionFeedback({
            studentName: student?.name || 'Aluno',
            action: 'desembarcou no destino final'
        });
        toast({
            title: "Desembarque Confirmado!",
            description: `🏠 ${firstName} desembarcou com segurança.`,
        });
    } else if (newStatus.startsWith('ausente')) {
        setLastActionFeedback({
            studentName: student?.name || 'Aluno',
            action: 'marcado como ausente'
        });
        toast({
            title: "Ausência Registrada",
            description: `⚠️ ${firstName} registrado como ausente hoje.`,
            variant: "destructive"
        });
    }

    if (student && student.parentId) {
        const parent = (allParents as any)?.find((p: any) => p.id === student.parentId);
        if (parent) {
            if (newStatus === 'a_bordo') {
                createNotification(
                    parent.userId,
                    "Embarque Confirmado",
                    `✅ ${firstName} embarcou com segurança na van. Boa viagem!`,
                    "success"
                );
            } else if (newStatus === 'desembarcado') {
                createNotification(
                    parent.userId,
                    "Desembarque Confirmado",
                    `🏠 ${firstName} desembarcou com segurança no destino final.`,
                    "success"
                );
            }
        }
    }

    const isAbsentStatus = newStatus.startsWith('ausente');
    if (isAbsentStatus && driverProfile?.status === 'em_rota' && route) {
        // [BUG FIX] Pre-emptively remove the newly absent student so the AI optimization 
        // doesn't receive the stale React state array containing them.
        const adjustedStops = orderedStops.filter(s => s.type !== 'student' || s.id !== studentId);
        setTimeout(() => {
            performRouteOptimization(route, adjustedStops);
        }, 500);
    }
  }, [updateDoc, studentsMap, allParents, createNotification, toast, driverProfile?.status, route, orderedStops, performRouteOptimization]);

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

  useEffect(() => {
    if (driverProfile?.status !== 'em_rota' || !driverId) return;
    let watchId: number;
    let fallbackInterval: NodeJS.Timeout;
    const updateLoc = (lat: number, lng: number) => {
        (updateDoc as any)('locations', driverId, {
            latitude: lat,
            longitude: lng,
            timestamp: new Date().toISOString()
        });
        syncTelemetry(driverId, lat, lng);
    };

    const runSimulation = () => {
        let stepCount = 0;
        const initialLat = driverLocation?.latitude || -23.55;
        const initialLng = driverLocation?.longitude || -46.63;
        fallbackInterval = setInterval(() => {
            stepCount += 0.001;
            const newLat = initialLat + (Math.sin(stepCount) * 0.005);
            const newLng = initialLng + (Math.cos(stepCount) * 0.005);
            updateLoc(newLat, newLng);

            // Lógica de Proximidade (500m)
            if (activeStop && activeStop.type === 'student' && lastNotifiedStopId.current !== activeStop.id) {
                const student = activeStop.data as Student;
                const dist = getDistance(newLat, newLng, student.latitude, student.longitude);
                
                if (dist <= 500) {
                    const parent = (allParents as any)?.find((p: any) => p.id === student.parentId);
                    if (parent) {
                        createNotification(
                            parent.userId,
                            "Van Chegando!",
                            `📍 A van está se aproximando! Por favor, prepare ${student.name.split(' ')[0]} para o embarque (500m de distância).`,
                            "warning"
                        );
                        lastNotifiedStopId.current = activeStop.id; // Evitar spam
                    }
                }
            }
        }, 4000);
    };

    if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
            (pos) => {
                updateLoc(pos.coords.latitude, pos.coords.longitude);
                // Proximidade no GPS Real
                if (activeStop && activeStop.type === 'student' && lastNotifiedStopId.current !== activeStop.id) {
                    const student = activeStop.data as Student;
                    const dist = getDistance(pos.coords.latitude, pos.coords.longitude, student.latitude, student.longitude);
                    if (dist <= 500) {
                        const parent = (allParents as any)?.find((p: any) => p.id === student.parentId);
                        if (parent) {
                            createNotification(
                                parent.userId,
                                "Van Chegando!",
                                `📍 A van está se aproximando! Por favor, prepare ${student.name.split(' ')[0]} para o embarque (500m de distância).`,
                                "warning"
                            );
                            lastNotifiedStopId.current = activeStop.id;
                        }
                    }
                }
            },
            (err) => {
                runSimulation();
            },
            { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
    } else {
        runSimulation();
    }
    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
        if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [driverProfile?.status, driverId, updateDoc, syncTelemetry, activeStop, allParents, createNotification]); // REMOVIDO driverLocation para evitar loop infinito

// Helper function for distance
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; // meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

  if (!isMounted) return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="animate-spin text-primary" /></div>;
  const isLoading = areDriversLoading || isRouteLoading || areStudentsLoading || areSchoolsLoading;
  if (isLoading) return <div className="flex items-center justify-center h-screen bg-background"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="bg-background flex flex-col min-h-[100dvh] h-[100dvh] overflow-hidden">
        {!isOnline && <div className="bg-destructive text-destructive-foreground text-center p-2 text-sm z-[2000] shrink-0"><WifiOff className="h-4 w-4 inline mr-2" />Offline.</div>}
        
        {!isTripActive ? (
            <div className="flex-1 flex flex-col bg-background w-full relative">
                <div className="w-full bg-primary/10 pt-6 pb-4 px-6 flex flex-col items-center justify-center border-b shadow-sm relative overflow-hidden shrink-0">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl"></div>
                    <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-2 border-4 border-primary/20 shadow-xl relative z-10 transition-transform active:scale-95">
                        <Bus className="text-primary h-6 w-6" />
                    </div>
                    <h1 className="text-secondary-foreground text-xl font-black italic uppercase relative z-10">Guardian</h1>
                    <p className="font-bold text-foreground/70 text-[10px] tracking-widest uppercase mt-0 relative z-10">Central de Operações</p>
                </div>
                
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <Tabs defaultValue="operacao" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="grid w-full grid-cols-1 h-14 bg-muted/50 p-1 border-b shrink-0">
                        <TabsTrigger value="operacao" className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary">
                            <Play className="h-4 w-4" /> Operação de Viagem
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="operacao" className="flex-1 overflow-y-auto min-h-0 m-0 p-0 relative">
                        <div className="px-6 py-8 space-y-8 pb-48">
                            <div className="space-y-3">
                                    <RawLabel className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><Navigation className="h-4 w-4"/> Rota Operacional</RawLabel>
                                    <Select value={selectedRouteIdForStart} onValueChange={setSelectedRouteIdForStart}>
                                        <SelectTrigger className="h-14 rounded-xl border-primary/30 font-black text-base bg-card shadow-sm"><SelectValue placeholder="Toque para selecionar a rota" /></SelectTrigger>
                                        <SelectContent>
                                            {(safeArray(routes) as any[]).filter(r => !!r && !!r.id).map((r: any) => (
                                                <SelectItem key={`route-sel-${r.id}`} value={r.id} className="font-bold">{safeString(r.name, 'Rota sem nome')}</SelectItem>
                                            ))}
                                        </SelectContent>

                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-2">
                                    <div className="space-y-3">
                                        <RawLabel className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><Users className="h-4 w-4"/> Motorista (Hoje)</RawLabel>
                                        <Select value={substituteDriverId} onValueChange={setSubstituteDriverId}>
                                            <SelectTrigger className="h-14 rounded-xl border-primary/30 font-black text-sm bg-card shadow-sm"><SelectValue placeholder="Original" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default" className="font-bold italic">Titular da Rota</SelectItem>
                                                {(safeArray(allDrivers) as any[]).filter(d => !!d && !!d.id).map((d: any) => (
                                                    <SelectItem key={`driver-sub-${d.id}`} value={d.id} className="font-bold">{safeString(d.name, 'Motorista')}</SelectItem>
                                                ))}
                                            </SelectContent>

                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <RawLabel className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><Users className="h-4 w-4"/> Monitor (Hoje)</RawLabel>
                                        <Select value={substituteMonitorId} onValueChange={setSubstituteMonitorId}>
                                            <SelectTrigger className="h-14 rounded-xl border-primary/30 font-black text-sm bg-card shadow-sm"><SelectValue placeholder="Original" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="default" className="font-bold italic">Titular da Rota</SelectItem>
                                                <SelectItem value="none" className="font-bold">Sem Monitor</SelectItem>
                                                {(safeArray(monitors) as any[]).filter(m => !!m && !!m.id).map((m: any) => (
                                                    <SelectItem key={`monitor-sub-${m.id}`} value={m.id} className="font-bold">{safeString(m.name, 'Monitor')}</SelectItem>
                                                ))}
                                            </SelectContent>

                                        </Select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-3">
                                        <RawLabel className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><Activity className="h-4 w-4"/> Turno</RawLabel>
                                        <RadioGroup value={selectedShift} onValueChange={(v) => setSelectedShift(v as Shift)} className="grid grid-cols-1 gap-3">
                                            {(['Manhã', 'Tarde'] as Shift[]).map(s => (
                                                <div key={`shift-opt-${s}`} className="flex flex-row items-center justify-between p-4 border-2 rounded-xl cursor-default bg-card shadow-sm hover:border-primary/50 transition-colors">
                                                    <RawLabel htmlFor={`s-${s}`} className="flex-1 cursor-pointer font-black text-sm">{s}</RawLabel>
                                                    <RadioGroupItem value={s} id={`s-${s}`} className="h-5 w-5"/>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                    <div className="space-y-3">
                                        <RawLabel className="font-black uppercase text-xs tracking-widest text-primary flex items-center gap-2"><LocateFixed className="h-4 w-4"/> Sentido</RawLabel>
                                        <RadioGroup value={selectedDirection} onValueChange={(v) => setSelectedDirection(v as any)} className="grid grid-cols-1 gap-3">
                                            {(['ida', 'volta'] as const).map(d => (
                                                <div key={`dir-opt-${d}`} className="flex flex-row items-center justify-between p-4 border-2 rounded-xl cursor-default bg-card shadow-sm hover:border-primary/50 transition-colors">
                                                    <RawLabel htmlFor={`d-${d}`} className="flex-1 cursor-pointer font-black text-sm uppercase">{d}</RawLabel>
                                                    <RadioGroupItem value={d} id={`d-${d}`} className="h-5 w-5"/>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    </div>
                                </div>

                                {route?.journeyStatus === 'em_rota' && (
                                    <div className="bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-4 space-y-3 shadow-md animate-in fade-in duration-300">
                                        <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-black text-xs uppercase tracking-wide">
                                            <AlertTriangle className="h-5 w-5 shrink-0 animate-pulse text-amber-500" />
                                            <span>Viagem em andamento detectada nesta rota</span>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground font-bold leading-tight">
                                            Esta rota já possui uma viagem iniciada anteriormente ({route.activeShift || 'Manhã'} • {route.activeDirection || 'ida'}). Você pode continuar de onde parou ou resetar para começar uma nova operação limpa.
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 pt-1">
                                            <Button 
                                                type="button"
                                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-12 shadow"
                                                onClick={() => {
                                                    setActiveRouteId(route.id);
                                                    if (typeof window !== 'undefined') {
                                                        sessionStorage.setItem('activeRouteId', route.id);
                                                        if (route.activeShift) sessionStorage.setItem('activeShift', route.activeShift);
                                                        if (route.activeDirection) sessionStorage.setItem('activeDirection', route.activeDirection);
                                                    }
                                                    if (route.activeShift) setSelectedShift(route.activeShift);
                                                    if (route.activeDirection) setSelectedDirection(route.activeDirection);
                                                    toast({ title: "Retomando Viagem", description: "Continuando a rota em andamento." });
                                                }}
                                            >
                                                <Play className="h-4 w-4 mr-1 fill-current" /> Retomar Viagem
                                            </Button>
                                            <Button 
                                                type="button"
                                                variant="outline"
                                                className="border-destructive/40 text-destructive hover:bg-destructive/10 font-black text-xs h-12"
                                                onClick={handleEndRoute}
                                            >
                                                <RotateCcw className="h-4 w-4 mr-1" /> Resetar Rota
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="pt-8 pb-12 mt-8 border-t flex flex-col gap-4 sticky bottom-0 bg-background/95 backdrop-blur-sm z-50 w-full mb-[-120px]">
                                    <Button className="w-full h-20 font-black text-lg shadow-2xl bg-primary hover:bg-primary/90 text-white rounded-xl relative overflow-hidden group" onClick={handleStartRoute} disabled={isOptimizing}>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                                        {isOptimizing ? (
                                            <div className="flex flex-col items-center relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <Loader2 className="h-6 w-6 animate-spin"/> 
                                                    <span>{optimizationStep === 'routing' ? 'OTIMIZANDO ROTEIRO...' : optimizationStep === 'polyline' ? 'TRAÇANDO MAPA...' : 'PREPARANDO VIAGEM...'}</span>
                                                </div>
                                            </div>
                                        ) : <><Play className="mr-3 h-8 w-8 fill-current relative z-10" /> <span className="relative z-10 uppercase tracking-widest text-lg">INICIAR OPERAÇÃO</span></>}
                                    </Button>
                                    <Link href="/" className="w-full text-center text-xs font-black text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest pb-8">Voltar ao Login</Link>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* BOTÃO FIXO DE INICIAR - SEMPRE VISÍVEL NO MOBILE */}
            <div className="w-full p-4 bg-background border-t shadow-[0_-8px_30px_rgb(0,0,0,0.12)] shrink-0 z-50">
                <Button 
                    className="w-full h-16 font-black text-lg shadow-xl bg-primary hover:bg-primary/90 text-white rounded-xl relative overflow-hidden group" 
                    onClick={handleStartRoute} 
                    disabled={isOptimizing}
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                    {isOptimizing ? (
                        <div className="flex flex-col items-center relative z-10">
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-5 w-5 animate-spin"/> 
                                <span>{optimizationStep === 'routing' ? 'OTIMIZANDO...' : optimizationStep === 'polyline' ? 'MAPA...' : 'INICIANDO...'}</span>
                            </div>
                        </div>
                    ) : <><Play className="mr-3 h-6 w-6 fill-current relative z-10" /> <span className="relative z-10 uppercase tracking-widest text-base">INICIAR OPERAÇÃO</span></>}
                </Button>
            </div>
        </div>
        ) : (
            <div className="flex-1 flex flex-col overflow-hidden max-w-md mx-auto w-full border-x">
                <div className="bg-background pt-3 pb-2 px-4 border-b space-y-2 shrink-0">
                    <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black uppercase text-primary tracking-widest">Progresso da Rota</p>
                        <p className="text-[10px] font-bold text-muted-foreground">{progressData.current} de {progressData.total} paradas</p>
                    </div>
                    <Progress value={progressData.percentage} className="h-2" />
                </div>

                <div className="p-4 border-b bg-primary/10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <Bus className="text-primary h-6 w-6" />
                        <div>
                            <h1 className="font-black text-lg uppercase truncate max-w-[180px]">{safeString(route?.name, 'Rota')}</h1>
                            <p className="text-[10px] text-primary uppercase font-black tracking-widest">{safeString(selectedShift)} • {safeString(selectedDirection)}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button variant={driverProfile?.status === 'pausa' ? 'default' : 'outline'} size="icon" onClick={handlePauseToggle} className="h-10 w-10 bg-background">
                            {driverProfile?.status === 'pausa' ? <Play className="fill-current text-white"/> : <Pause className="text-primary" />}
                        </Button>
                        <Button variant="outline" size="icon" title="Reiniciar/Encerrar Rota" onClick={handleEndRoute} className="h-10 w-10 bg-background text-muted-foreground hover:text-destructive">
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                        <NotificationBell />
                        <Button variant="outline" size="icon" asChild className="h-10 w-10 bg-background"><Link href="/driver/messages"><MessageSquare className="text-primary" /></Link></Button>
                        <Dialog><DialogTrigger asChild><Button variant="destructive" size="icon" className="h-10 w-10"><Siren className="animate-pulse"/></Button></DialogTrigger><ReportIncidentForm onFormSubmit={() => {}} /></Dialog>
                    </div>
                </div>

                {!!latestAnnouncement && showAnnouncement && (
                    <div className={cn(
                        "px-4 py-2 border-b flex items-center justify-between gap-3 animate-in slide-in-from-top duration-500",
                        (latestAnnouncement as any).priority === 'high' ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
                    )}>
                        <div className="flex items-center gap-2 min-w-0">
                            <Megaphone className="h-4 w-4 shrink-0" />
                            <p className="text-[10px] font-black uppercase truncate leading-tight">
                                {safeString((latestAnnouncement as any).title)}: {safeString((latestAnnouncement as any).content)}
                            </p>

                        </div>
                        <button onClick={() => setShowAnnouncement(false)} className="opacity-70 hover:opacity-100">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}

                <Tabs defaultValue="itinerario" className="flex-1 flex flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3 h-14 bg-muted p-1 border-b">
                        <TabsTrigger value="itinerario" className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                            <Activity className="h-4 w-4" /> Itinerário
                        </TabsTrigger>
                        <TabsTrigger value="mapa" className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                            <LocateFixed className="h-4 w-4" /> Mapa
                        </TabsTrigger>
                        <TabsTrigger value="alunos" className="gap-2 font-black text-xs uppercase data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-md">
                            <Users className="h-4 w-4" /> Alunos
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="itinerario" className="flex-1 overflow-y-auto min-h-0 relative p-4 h-full">
                        <div className="space-y-6 pb-20">
                            {showAbsenceAlert && absentStudentsNames.length > 0 && (
                                    <Alert data-testid="absence-alert" className="bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400 relative">
                                        <AlertTriangle className="h-4 w-4" />
                                        <AlertTitle className="text-xs font-black uppercase tracking-tight">Rota Otimizada</AlertTitle>
                                        <AlertDescription className="text-[11px] leading-tight">
                                            {safeArray(absentStudentsNames).join(', ')} {absentStudentsNames.length > 1 ? 'foram marcados' : 'foi marcado'} como ausente. A sequência de paradas foi recalculada automaticamente.
                                        </AlertDescription>

                                        <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setShowAbsenceAlert(false)}>
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </Alert>
                                )}

                                {showExtraAlert && (() => {
                                  const extraStudentsCount = (safeArray(activeStudentIds) as string[]).filter(id => 
                                      route && !(route.baseStudentIds || route.studentIds || []).includes(id)
                                  ).length;
                                  if (extraStudentsCount === 0) return null;
                                  return (
                                        <Alert className="bg-orange-500/10 border-orange-500/20 text-orange-700 dark:text-orange-400 relative mt-2">
                                            <Info className="h-4 w-4 text-orange-500" />
                                            <AlertTitle className="text-xs font-black uppercase tracking-tight text-orange-500">Alunos Extras Alocados</AlertTitle>
                                            <AlertDescription className="text-[11px] leading-tight text-muted-foreground mt-1">
                                                Há {extraStudentsCount} {extraStudentsCount > 1 ? 'alunos de encaixe temporário alocados' : 'aluno de encaixe temporário alocado'} nesta rota hoje. Eles estão sinalizados com o badge **"ENCAIXE"** no trajeto.
                                            </AlertDescription>

                                            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-50 hover:opacity-100" onClick={() => setShowExtraAlert(false)}>
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </Alert>
                                  );
                                })()}

                                {!activeStop ? (
                                    <div className="w-full flex-1 flex items-center justify-center animate-in zoom-in-95 duration-500 py-10">
                                        <Card className="text-center p-8 bg-green-500/10 border-green-500/30 border-2 shadow-2xl w-full">
                                            <div className="mx-auto w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
                                                <CheckCircle className="h-12 w-12 text-green-500 animate-pulse"/>
                                            </div>
                                            <CardTitle className="text-3xl font-black text-green-600 uppercase tracking-tighter mb-2">Rota Concluída!</CardTitle>
                                            <CardDescription className="text-sm font-bold text-green-700/80 mb-8">Todas as {progressData.total} paradas foram finalizadas com sucesso.</CardDescription>
                                            <Button variant="default" className="w-full h-14 text-sm font-black shadow-xl bg-green-600 hover:bg-green-700 text-white" onClick={handleEndRoute}>FINALIZAR OPERAÇÃO</Button>
                                        </Card>
                                    </div>
                                ) : activeStop.type === 'student' ? (
                                    <div className="space-y-4 w-full animate-in slide-in-from-bottom-4 duration-300" key={activeStop.id}>
                                        {lastActionFeedback && (
                                            <div className="bg-emerald-500/15 border-2 border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-emerald-800 dark:text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                                                <div className="flex items-center gap-2 font-black text-xs uppercase">
                                                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span>✅ {lastActionFeedback.studentName} {lastActionFeedback.action}!</span>
                                                </div>
                                                <Badge variant="outline" className="text-[9px] font-black uppercase text-emerald-600 border-emerald-500/40 bg-emerald-500/10">
                                                    Registrado
                                                </Badge>
                                            </div>
                                        )}
                                        <SafeRow name="ActiveStopCard">
                                            <NextStopCard 
                                                student={activeStop.data as Student} 
                                                isExtra={activeStop.isExtra}
                                                stopNumber={progressData.current + 1}
                                                totalStops={progressData.total}
                                                onStatusChange={handleStatusChange} 
                                                onOpenAuthorizedModal={(s) => { setSelectedStudentForModal(s); setIsModalOpen(true); }} 
                                                direction={selectedDirection} 
                                                onScanQrCode={() => setIsScannerOpen(true)} 
                                                onEndEarly={handleEndRoute}
                                            />
                                        </SafeRow>
                                        
                                        {safeArray(boardedStops).length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-green-600 px-3 flex items-center gap-1.5">
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                    Alunos a Bordo ({boardedStops.length})
                                                </h3>
                                                {(safeArray(boardedStops) as Stop[]).map((stop) => (
                                                    <SafeRow key={`boarded-${stop.id}`} name={`BoardedStop-${stop.id}`}>
                                                        <div className="flex items-center gap-3 p-2.5 rounded-lg border-2 bg-green-500/5 border-green-500/20 shadow-sm">
                                                            <Avatar className="h-8 w-8 border border-green-500/30">
                                                                <AvatarImage src={(stop.data as any)?.photoUrl || undefined}/>
                                                                <AvatarFallback className="text-xs bg-green-500/20 text-green-700 font-black">{safeInitials(stop.data?.name)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-xs font-black truncate uppercase text-foreground">{safeString(stop.data?.name, 'Aluno')}</p>
                                                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{safeString(formatStudentClassInfo(stop.data as Student))}</p>
                                                            </div>
                                                            <Badge variant="outline" className="text-[9px] font-black uppercase text-green-600 border-green-500/40 bg-green-500/10">
                                                                A Bordo
                                                            </Badge>
                                                        </div>
                                                    </SafeRow>
                                                ))}
                                            </div>
                                        )}
                                        {safeArray(upcomingStops).length > 0 && (
                                            <div className="space-y-2">
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/70 px-3">Próximas Paradas</h3>
                                                {(safeArray(upcomingStops) as Stop[]).filter(stop => !!stop && !!stop.id).map((stop) => (
                                                    <SafeRow key={`upcoming-${stop.type}-${stop.id}`} name={`UpcomingStop-${stop.id}`}>
                                                        <div className="flex items-center gap-3 p-3 rounded-lg border-2 bg-card shadow-sm">
                                                            {stop.type === 'student' ? (
                                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                                    <Avatar className="h-8 w-8"><AvatarImage src={(stop.data as any)?.photoUrl || undefined}/><AvatarFallback>{safeInitials(stop.data?.name)}</AvatarFallback></Avatar>
                                                                    <div className="min-w-0">
                                                                        <p className="text-xs font-black truncate uppercase">{safeString(stop.data?.name, 'Aluno')}</p>
                                                                        <p className="text-[9px] text-muted-foreground uppercase font-bold">{safeString(formatStudentClassInfo(stop.data as Student))}</p>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div className="flex-1 min-w-0 flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded-full bg-destructive text-white flex items-center justify-center"><School className="h-4 w-4" /></div>
                                                                    <span className="text-xs font-black truncate uppercase">{safeString(stop.data?.name, 'Escola')}</span>
                                                                </div>
                                                            )}
                                                            <Badge variant="secondary" className={cn("text-[9px] font-black uppercase", stop.type === 'student' && stop.isExtra && "bg-orange-500 text-white hover:bg-orange-600")}>
                                                              {stop.type === 'student' ? (stop.isExtra ? 'Encaixe' : 'Aluno') : 'Escola'}
                                                            </Badge>
                                                        </div>
                                                    </SafeRow>
                                                ))}
                                            </div>
                                        )}

                                    </div>
                                ) : (
                                    <div className="animate-in slide-in-from-bottom-4 duration-300" key={activeStop.id}>
                                        <NextStopSchoolCard 
                                            school={activeStop.data as SchoolData} 
                                            direction={selectedDirection}
                                            onAction={handleSchoolAction} 
                                            students={studentsAtCurrentStop}
                                            onStatusChange={handleStatusChange}
                                            onEndEarly={handleEndRoute}
                                        />
                                    </div>
                                )}
                            </div>
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
                        >
                            <GoogleMapMarkers driverLocation={driverLocation} stops={orderedStops} routePolyline={route?.polyline} />
                        </SmartMap>
                    </TabsContent>

                    <TabsContent value="alunos" className="flex-1 overflow-y-auto p-4 space-y-6">
                        {route && (
                            <>
                                <PendingApprovals route={route} />
                                <InviteHub 
                                    driverName={driverProfile?.name || 'Motorista'} 
                                    routeId={route.id} 
                                    routeName={route.name} 
                                />
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        )}

        {isModalOpen && selectedStudentForModal && (
            <AuthorizedContactsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                studentId={selectedStudentForModal.id} 
                studentName={safeString(selectedStudentForModal.name)}
                targetStatus={selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'}

                onConfirmHandover={() => setIsModalOpen(false)} 
            />
        )}
        <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} onScanSuccess={(id) => { 
            handleStatusChange(id, selectedDirection === 'ida' ? 'a_bordo' : 'desembarcado'); 
            setIsScannerOpen(false); 
            toast({ title: "QR Code Identificado!", description: "Status do aluno atualizado." });
        }} />
    </div>
  );
}

function NextStopCard({ student, isExtra, stopNumber, totalStops, onStatusChange, onOpenAuthorizedModal, direction, onScanQrCode, onEndEarly }: { student: Student, isExtra?: boolean, stopNumber?: number, totalStops?: number, onStatusChange: (id: string, status: StudentStatus) => void, onOpenAuthorizedModal: (student: Student) => void, direction: 'ida' | 'volta', onScanQrCode: () => void, onEndEarly: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isVolta = direction === 'volta';
  const isGoing = direction === 'ida';
  const hasMedicalAlert = (student.medicalConditions && student.medicalConditions.length > 0) || student.medicalNote;

  const handleAction = (status: StudentStatus) => {
    if (isProcessing) return;
    setIsProcessing(true);
    onStatusChange(student.id, status);
  };

  return (
    <Card className={cn("w-full shadow-2xl border-primary border-2", hasMedicalAlert && "ring-4 ring-destructive border-destructive bg-destructive/5")}>
        <CardHeader className="pb-3 border-b bg-muted/10">
            <div className="flex justify-between items-center mb-3">
                <Badge variant="outline" className="text-[10px] font-black tracking-[0.2em] uppercase text-primary">
                    {stopNumber && totalStops ? `Parada ${stopNumber} de ${totalStops}` : 'Parada Atual'} • {isGoing ? 'EMBARQUE' : 'DESEMBARQUE'}
                </Badge>
                {hasMedicalAlert && <Badge variant="destructive" className="animate-pulse font-black"><HeartPulse className="h-3 w-3 mr-1" /> CUIDADO MÉDICO</Badge>}
            </div>
            <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-2 border-primary shadow-xl">
                    <AvatarImage src={student.photoUrl || undefined} />
                    <AvatarFallback className="text-3xl font-black">{safeInitials(student.name)}</AvatarFallback>
                </Avatar>

                <div className="flex-grow min-w-0">
                    <CardTitle className="text-base font-black truncate uppercase leading-tight">{safeString(student?.name, 'Aluno')}</CardTitle>

                    <div className="space-y-1 mt-1">
                        <div className="flex flex-wrap items-center gap-1.5 text-primary font-bold text-[10px] uppercase">
                            <span>{formatStudentClassInfo(student)}</span>
                            {student.serviceModality === 'avulso' && <Badge variant="secondary" className="bg-amber-500 border-transparent text-white hover:bg-amber-600 text-[9px] py-0 h-4 px-1.5 font-black">AVULSA</Badge>}
                            {student.shift === 'Integral' && <Badge variant="secondary" className="bg-indigo-500 border-transparent text-white hover:bg-indigo-600 text-[9px] py-0 h-4 px-1.5 font-black">INTEGRAL</Badge>}
                            {isExtra && <Badge variant="secondary" className="bg-orange-500 border-transparent text-white hover:bg-orange-600 text-[9px] py-0 h-4 px-1.5 font-black animate-pulse">ENCAIXE</Badge>}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3 w-3 text-primary shrink-0" />
                            <span className="text-[10px] font-black truncate uppercase">{safeString(student?.street, 'Endereço')}, {safeString(student?.number, 'S/N')}</span>
                        </div>

                    </div>
                </div>
            </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
                {isGoing ? (
                    <Button 
                        disabled={isProcessing}
                        className={cn(
                            "h-14 font-black text-white text-xs transition-all shadow-md active:scale-95",
                            isProcessing ? "bg-emerald-500 opacity-90 cursor-wait" : "bg-green-600 hover:bg-green-700"
                        )} 
                        onClick={() => handleAction('a_bordo')}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                REGISTRANDO...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                EMBARCOU
                            </>
                        )}
                    </Button>
                ) : (
                    <Button 
                        disabled={isProcessing}
                        className={cn(
                            "h-14 font-black text-white text-xs transition-all shadow-md active:scale-95",
                            isProcessing ? "bg-blue-400 opacity-90 cursor-wait" : "bg-blue-600 hover:bg-blue-700"
                        )} 
                        onClick={() => handleAction('desembarcado')}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                REGISTRANDO...
                            </>
                        ) : (
                            <>
                                <CheckCircle className="mr-2 h-5 w-5" />
                                DESEMBARCOU
                            </>
                        )}
                    </Button>
                )}
                <Button 
                    disabled={isProcessing}
                    variant="destructive" 
                    className="h-14 font-black text-xs transition-all shadow-md active:scale-95" 
                    onClick={() => handleAction(isGoing ? 'ausente_ida' : 'ausente_volta')}
                >
                    <XCircle className="mr-2 h-5 w-5" /> AUSENTE
                </Button>
            </div>
            
            {hasMedicalAlert && (
                <div className="flex flex-wrap gap-2 pt-2">
                    {(safeArray(student.medicalConditions) as string[]).filter(cond => !!cond).map((cond: string, cIdx: number) => (
                        <Badge key={`med-cond-${student.id}-${cIdx}`} variant="destructive" className="text-[9px] font-black uppercase tracking-wider">{safeString(cond)}</Badge>
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
                {isVolta ? (
                    <Button variant="secondary" className={cn("h-12 text-[8px] font-black uppercase tracking-tighter p-1 border-2 border-green-500/30 bg-green-500/5 hover:bg-green-500/15")} onClick={() => onOpenAuthorizedModal(student)}>
                        <ShieldCheck className="mr-1 h-4 w-4 text-green-600" /> Autorizados
                    </Button>
                ) : (
                    <Button variant="secondary" className="h-12 text-[8px] font-black uppercase tracking-tighter p-1" onClick={() => onOpenAuthorizedModal(student)}>
                        <IdCard className="mr-1 h-4 w-4 text-primary"/> Info
                    </Button>
                )}
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
                <CardTitle className="text-xl font-black uppercase truncate">{safeString(school?.name, 'Escola')}</CardTitle>
                <div className="flex items-center justify-center gap-2 mt-1 text-[10px] font-black text-primary uppercase">

                    <Clock className="h-3 w-3" />
                    <span>{isIda ? `Entrada: ${safeString(school.startTime)}` : `Saída: ${safeString(school.endTime)}`}</span>
                </div>

            </CardHeader>
            <CardContent className="p-3 space-y-4">
                <div className="flex justify-between items-center bg-muted/20 p-3 rounded-lg border-2 border-dashed border-primary/20">
                    <p className="text-[10px] font-black text-muted-foreground uppercase flex items-center gap-2"><Users className="h-4 w-4" /> Checklist ({safeArray(students).length})</p>
                    <Button size="sm" className="bg-primary hover:bg-primary/90 text-[10px] h-9 font-black text-white" onClick={onAction}><CheckCircle className="mr-2 h-4 w-4" /> {isIda ? 'DESEMBARQUE' : 'EMBARQUE'}</Button>
                </div>
                <div className="space-y-2">
                    {(safeArray(students) as Student[]).filter(s => !!s && !!s.id).map((s: Student) => {
                        const hasAlert = (safeArray(s.medicalConditions).length > 0) || s.medicalNote;
                        return (
                            <SafeRow key={`school-list-student-${s.id}`} name={`SchoolMember-${s.id}`}>
                                <div className={cn("flex items-center gap-2 p-2 rounded-xl border-2 bg-background shadow-sm", hasAlert && "border-destructive/30")}>
                                    <Avatar className="h-10 w-10 shrink-0"><AvatarImage src={s.photoUrl || undefined} /><AvatarFallback>{safeInitials(s.name)}</AvatarFallback></Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1">
                                            <p className="text-[11px] font-bold truncate uppercase leading-tight">{safeString(s?.name, "Aluno")}</p>
                                            {hasAlert && <HeartPulse className="h-2.5 w-2.5 text-destructive animate-pulse shrink-0" />}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                            <p className="text-[8px] text-primary font-black uppercase truncate">{safeString(formatStudentClassInfo(s))}</p>
                                            {s.serviceModality === 'avulso' && <Badge variant="secondary" className="bg-amber-500 border-transparent text-white text-[7px] py-0 h-3 leading-none px-1 rounded-sm uppercase tracking-widest font-black">AVULSA</Badge>}
                                            {s.shift === 'Integral' && <Badge variant="secondary" className="bg-indigo-500 border-transparent text-white text-[7px] py-0 h-3 leading-none px-1 rounded-sm uppercase tracking-widest font-black">INTEGRAL</Badge>}
                                        </div>
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-green-600" onClick={() => onStatusChange(s.id, isIda ? 'desembarcado' : 'a_bordo')}><Check className="h-4 w-4" /></Button>
                                        <Button size="icon" variant="outline" className="h-8 w-8 text-destructive" onClick={() => onStatusChange(s.id, isIda ? 'ausente_ida' : 'ausente_volta')}><XCircle className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </SafeRow>
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
