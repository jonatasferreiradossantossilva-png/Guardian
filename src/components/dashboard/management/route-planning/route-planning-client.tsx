'use client';

import { useState, useMemo, useEffect } from 'react';
import { Route, Student, RouteManifest, TripRequest, Driver } from '@/types/mock-data';
import { useData, useDataCollection } from '@/hooks/use-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Bus, User as UserIcon, ArrowRightLeft, School, UserPlus, Truck, Info, CheckSquare, Users, Plus, Search, ArrowLeft, History, Loader2, Trash2, Check, X, Sun, Moon, SlidersHorizontal, Sparkles, MapPin } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { SafeRow } from '@/components/shared/safe-table';
import { safeString, safeArray, getSafeDateStr } from '@/lib/safe-render';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function RoutePlanningClient() {
  const { data: routes } = useDataCollection<Route>('routes');
  const { data: students } = useDataCollection<Student>('students');
  const { data: routeManifests } = useDataCollection<RouteManifest>('route_manifests');
  const { data: schools } = useDataCollection<any>('schools');
  const { data: vehicles } = useDataCollection<any>('vehicles');
  const { data: drivers } = useDataCollection<Driver>('drivers');
  const { data: tripRequests } = useDataCollection<TripRequest>('trip_requests');

  const { addDoc, updateDoc, deleteDoc } = useData();

  // ─── Modo de Visualização (Rápido vs Avançado) ────────────
  const [viewMode, setViewMode] = useState<'easy' | 'advanced'>('easy');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddSearch, setQuickAddSearch] = useState('');

  // ─── Gate / Landing View States ───────────────────────────────
  const [isPlanningActive, setIsPlanningActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  // Wizard form states (temporary until user confirms)
  const [wizardDate, setWizardDate] = useState<Date>(new Date());
  const [wizardShift, setWizardShift] = useState<'Manhã' | 'Tarde' | 'Integral'>('Manhã');
  const [wizardDirection, setWizardDirection] = useState<'ida' | 'volta'>('ida');
  const [wizardRouteId, setWizardRouteId] = useState<string>('none');
  const [wizardDriverId, setWizardDriverId] = useState<string>('');

  // ─── Workspace States com Inicialização Inteligente pelo Horário ────────
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    // Se passar das 18h, o tio da van já está planejando o dia seguinte!
    if (now.getHours() >= 18) {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
    return now;
  });

  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<'Manhã' | 'Tarde' | 'Integral'>(() => {
    const h = new Date().getHours();
    return (h >= 12 && h < 18) ? 'Tarde' : 'Manhã';
  });

  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>(() => {
    const h = new Date().getHours();
    return (h >= 11 && h < 14) || h >= 16 ? 'volta' : 'ida';
  });

  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('none');
  
  // Local cache for unsaved daily manifest changes before DB publication (manifestId -> RouteManifest)
  const [localManifests, setLocalManifests] = useState<Record<string, RouteManifest>>({});

  const [activeTab, setActiveTab] = useState('adicionar');
  const [selectedRouteStudentIds, setSelectedRouteStudentIds] = useState<string[]>([]);
  const [selectedExtraStudentIds, setSelectedExtraStudentIds] = useState<string[]>([]);

  // Pills filter state in general view
  const [statusFilter, setStatusFilter] = useState<'all' | 'unallocated' | 'allocated'>('all');
  // Visual Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const hasActiveRoute = selectedRouteId && selectedRouteId !== 'none';

  const isDirty = useMemo(() => {
    return Object.keys(localManifests).length > 0;
  }, [localManifests]);

  // When switching selectedRouteId, reset selection arrays
  useEffect(() => {
    setSelectedRouteStudentIds([]);
    setSelectedExtraStudentIds([]);
  }, [selectedRouteId]);

  // If selectedRouteId is "none" (Geral), auto-switch tab to "adicionar" ("Buscar / Puxar")
  useEffect(() => {
    if (selectedRouteId === 'none') {
      setActiveTab('adicionar');
    } else {
      setActiveTab('minha-rota');
    }
  }, [selectedRouteId]);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Sync wizard default driver based on chosen route
  useEffect(() => {
    if (wizardRouteId && wizardRouteId !== 'none' && routes) {
      const r = routes.find(route => route.id === wizardRouteId);
      if (r) {
        setWizardDriverId(r.driverId || '');
      }
    } else {
      setWizardDriverId('');
    }
  }, [wizardRouteId, routes]);

  const isStudentAbsent = (student: Student): boolean => {
    if (!student || !student.status) return false;
    if (student.status === 'ausente_dia_todo') return true;
    if (selectedDirection === 'ida' && student.status === 'ausente_ida') return true;
    if (selectedDirection === 'volta' && student.status === 'ausente_volta') return true;
    return false;
  };

  const hasApprovedTripRequestToday = (studentId: string): boolean => {
    if (!tripRequests) return false;
    return tripRequests.some(tr => 
      tr.studentId === studentId && 
      tr.status === 'aprovada' && 
      (getSafeDateStr(tr.date) === dateStr || (tr.startDate && tr.endDate && dateStr >= getSafeDateStr(tr.startDate) && dateStr <= getSafeDateStr(tr.endDate)))
    );
  };

  // 1. Available Routes (filtered by shift + vehicle)
  const availableRoutes = useMemo(() => {
    let filtered = (routes || []).filter(r => r && (r.shift === selectedShift || r.shift === 'Integral'));
    if (selectedVehicleId !== 'all') {
      const driverIds = (drivers || []).filter(d => d && d.vehicleId === selectedVehicleId).map(d => d.id);
      filtered = filtered.filter(r => r && driverIds.includes(r.driverId));
    }
    return filtered;
  }, [routes, selectedShift, selectedVehicleId, drivers]);

  // Active Vehicle from collection
  const activeVehicle = useMemo(() => {
    if (selectedVehicleId === 'all' || !vehicles) return null;
    return vehicles.find((v: any) => v && v.id === selectedVehicleId);
  }, [selectedVehicleId, vehicles]);

  // If there's exactly 1 route associated, or if a specific vehicle is filtered, default to its first route
  const singleRouteFromFilter = useMemo(() => {
    if (availableRoutes && availableRoutes.length > 0) {
      if (selectedVehicleId !== 'all') {
        return availableRoutes[0];
      }
      if (availableRoutes.length === 1) {
        return availableRoutes[0];
      }
    }
    return null;
  }, [availableRoutes, selectedVehicleId]);

  // Auto-seleção inteligente de van e rota para o Modo Rápido
  useEffect(() => {
    if (vehicles && vehicles.length === 1 && selectedVehicleId === 'all') {
      setSelectedVehicleId(vehicles[0].id);
    }
  }, [vehicles, selectedVehicleId]);

  useEffect(() => {
    if (availableRoutes && availableRoutes.length > 0) {
      const exists = availableRoutes.some(r => r.id === selectedRouteId);
      if (!exists) {
        if (availableRoutes.length === 1 || selectedVehicleId !== 'all' || viewMode === 'easy') {
          setSelectedRouteId(availableRoutes[0].id);
        } else if (selectedRouteId !== 'none') {
          setSelectedRouteId('none');
        }
      }
    }
  }, [availableRoutes, selectedRouteId, selectedVehicleId, viewMode]);

  // Dynamic Route summary tracking in the sticky bottom save bar
  const modifiedRoutesList = useMemo(() => {
    const list: string[] = [];
    Object.keys(localManifests).forEach(manifestId => {
      const manifest = localManifests[manifestId];
      const r = (routes || []).find(route => route.id === manifest.routeId);
      if (r && !list.includes(r.name)) {
        list.push(r.name);
      }
    });
    return list;
  }, [localManifests, routes]);

  // Find which route a student is currently assigned to (local manifest, DB manifest, or base route)
  const getStudentCurrentRoute = (studentId: string): { id: string; name: string } | null => {
    // 1. Check local manifests
    for (const manifestId of Object.keys(localManifests)) {
      const m = localManifests[manifestId];
      if (getSafeDateStr(m.date) === dateStr && m.direction === selectedDirection) {
        if (m.studentIds.includes(studentId)) {
          const r = (routes || []).find(route => route.id === m.routeId);
          if (r) return { id: r.id, name: r.name };
        }
      }
    }

    // 2. Check DB manifests
    const dbManifest = (routeManifests || []).find(m => 
      m && getSafeDateStr(m.date) === dateStr && m.direction === selectedDirection && m.studentIds.includes(studentId)
    );
    if (dbManifest) {
      const r = (routes || []).find(route => route.id === dbManifest.routeId);
      if (r) return { id: r.id, name: r.name };
    }

    // 3. Check base routes
    const baseRoute = (routes || []).find(r => 
      r && (r.baseStudentIds || r.studentIds || []).includes(studentId)
    );
    
    if (baseRoute) {
      const manifestId = `manifest_${baseRoute.id}_${dateStr}_${selectedDirection}`;
      const hasManifestToday = localManifests[manifestId] || (routeManifests || []).some(m => m.id === manifestId);
      
      if (hasManifestToday) {
        const m = localManifests[manifestId] || (routeManifests || []).find(m => m.id === manifestId);
        if (m && m.studentIds.includes(studentId)) {
          return { id: baseRoute.id, name: baseRoute.name };
        }
      } else {
        // No daily manifest override exists yet, so they are on their default base route
        return { id: baseRoute.id, name: baseRoute.name };
      }
    }

    return null;
  };

  // 2. Active Manifest
  const activeManifestData = useMemo(() => {
    if (!hasActiveRoute) return null;
    const route = (availableRoutes || []).find(r => r.id === selectedRouteId);
    if (!route) return null;

    const manifestId = `manifest_${route.id}_${dateStr}_${selectedDirection}`;

    // 1. Check local manifests first
    if (localManifests[manifestId]) {
      return { route, manifest: localManifests[manifestId] };
    }

    // 2. Check DB manifests
    const existing = (routeManifests || []).find(m =>
      m && m.routeId === route.id &&
      getSafeDateStr(m.date) === dateStr &&
      m.direction === selectedDirection
    );

    if (existing) return { route, manifest: existing };

    // 3. Fallback to default draft
    const mockManifest: RouteManifest = {
      id: manifestId,
      routeId: route.id,
      date: dateStr,
      shift: route.shift,
      direction: selectedDirection,
      studentIds: route.baseStudentIds || route.studentIds || [],
      updatedAt: new Date().toISOString()
    };

    return { route, manifest: mockManifest };
  }, [hasActiveRoute, availableRoutes, selectedRouteId, localManifests, routeManifests, dateStr, selectedDirection]);

  // 3. Students in current route (fixed vs extra)
  const { fixed: fixedStudents, extra: extraStudents } = useMemo(() => {
    const fixed: Student[] = [];
    const extra: Student[] = [];
    if (!activeManifestData) return { fixed, extra };

    const ids = activeManifestData.manifest.studentIds || [];
    const baseIds = activeManifestData.route.baseStudentIds || activeManifestData.route.studentIds || [];

    (ids || []).forEach(id => {
      const s = (students || []).find(st => st && st.id === id);
      if (s) {
        if ((baseIds || []).includes(id)) fixed.push(s);
        else extra.push(s);
      }
    });
    return { fixed, extra };
  }, [activeManifestData, students]);

  const allRouteStudents = [...(fixedStudents || []), ...(extraStudents || [])];

  // Calculate routes for the selected vehicle
  const vehicleRoutes = useMemo(() => {
    if (selectedVehicleId === 'all') return [];
    const driverIds = (drivers || []).filter(d => d && d.vehicleId === selectedVehicleId).map(d => d.id);
    return (routes || []).filter(r => r && driverIds.includes(r.driverId));
  }, [routes, selectedVehicleId, drivers]);

  // Calculate students inside this selected vehicle's routes
  const vehicleStudents = useMemo(() => {
    if (selectedVehicleId === 'all') return [];
    const studentsList: Student[] = [];
    vehicleRoutes.forEach(r => {
      const manifestId = `manifest_${r.id}_${dateStr}_${selectedDirection}`;
      const manifest = localManifests[manifestId] || (routeManifests || []).find(m => 
        m && m.routeId === r.id && getSafeDateStr(m.date) === dateStr && m.direction === selectedDirection
      );
      const studentIds = manifest ? manifest.studentIds : (r.baseStudentIds || r.studentIds || []);
      studentIds.forEach(id => {
        const student = (students || []).find(s => s && s.id === id);
        if (student && !studentsList.some(s => s.id === student.id)) {
          studentsList.push(student);
        }
      });
    });
    return studentsList;
  }, [vehicleRoutes, students, localManifests, routeManifests, dateStr, selectedDirection]);

  // 4. Available extras (students NOT in this route, or filtered list in General mode)
  const availableExtras = useMemo(() => {
    const filteredStudents = (students || []).filter(s => {
      if (!s) return false;
      const matchSchool = selectedSchoolId === 'all' || s.schoolId === selectedSchoolId;
      const matchShift = s.shift === selectedShift || s.shift === 'Integral';
      return matchSchool && matchShift;
    });

    if (!hasActiveRoute) {
      // IN GERAL MODE: filter students based on statusFilter pill
      return filteredStudents.filter(s => {
        const activeRoute = getStudentCurrentRoute(s.id);
        if (statusFilter === 'unallocated') {
          return !activeRoute;
        }
        if (statusFilter === 'allocated') {
          return !!activeRoute;
        }
        return true; // 'all'
      });
    }

    // IN SPECIFIC ROUTE MODE: filter students NOT already in this active route
    const currentIds = new Set(activeManifestData?.manifest?.studentIds || []);
    return filteredStudents.filter(s => !currentIds.has(s.id));
  }, [students, activeManifestData, selectedSchoolId, selectedShift, selectedRouteId, statusFilter, localManifests, routeManifests, dateStr, selectedDirection, routes]);

  // Handlers
  const toggleRouteStudent = (id: string) => {
    setSelectedRouteStudentIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleExtraStudent = (id: string) => {
    setSelectedExtraStudentIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAllRouteStudents = () => {
    const currentList = allRouteStudents || [];
    if (selectedRouteStudentIds.length === currentList.length) {
      setSelectedRouteStudentIds([]);
    } else {
      setSelectedRouteStudentIds(currentList.map(s => s?.id).filter(Boolean) as string[]);
    }
  };

  const selectAllExtras = () => {
    const currentList = availableExtras || [];
    if (selectedExtraStudentIds.length === currentList.length) {
      setSelectedExtraStudentIds([]);
    } else {
      setSelectedExtraStudentIds(currentList.map(s => s?.id).filter(Boolean) as string[]);
    }
  };

  const updateLocalManifest = (studentIds: string[]) => {
    if (!hasActiveRoute || !activeManifestData) return;

    const manifestId = activeManifestData.manifest.id;
    setLocalManifests(prev => ({
      ...prev,
      [manifestId]: {
        ...activeManifestData.manifest,
        studentIds,
        updatedAt: new Date().toISOString()
      }
    }));
  };

  // Atomic transfer logic with double-allocation prevention
  const pullMultipleStudentsToRoute = (studentIds: string[], targetRouteId: string, newlyCreatedRoute?: Route) => {
    const targetRoute = newlyCreatedRoute || (routes || []).find(r => r.id === targetRouteId);
    if (!targetRoute || studentIds.length === 0) return;

    const newLocalManifests = { ...localManifests };

    studentIds.forEach(studentId => {
      // 1. Remove from its current route manifest (if any) to prevent double allocation
      const currentRoute = getStudentCurrentRoute(studentId);
      if (currentRoute) {
        const sourceManifestId = `manifest_${currentRoute.id}_${dateStr}_${selectedDirection}`;
        let sourceManifest = newLocalManifests[sourceManifestId];
        
        if (!sourceManifest) {
          const dbManifest = (routeManifests || []).find(m => 
            m && m.routeId === currentRoute.id && getSafeDateStr(m.date) === dateStr && m.direction === selectedDirection
          );
          if (dbManifest) {
            sourceManifest = { ...dbManifest };
          } else {
            const srcRouteObj = (routes || []).find(r => r.id === currentRoute.id);
            sourceManifest = {
              id: sourceManifestId,
              routeId: currentRoute.id,
              date: dateStr,
              shift: srcRouteObj?.shift || selectedShift,
              direction: selectedDirection,
              studentIds: srcRouteObj?.baseStudentIds || srcRouteObj?.studentIds || [],
              updatedAt: new Date().toISOString()
            };
          }
        }
        
        sourceManifest.studentIds = (sourceManifest.studentIds || []).filter(id => id !== studentId);
        newLocalManifests[sourceManifestId] = {
          ...sourceManifest,
          updatedAt: new Date().toISOString()
        };
      }

      // 2. Add to target route manifest
      const targetManifestId = `manifest_${targetRouteId}_${dateStr}_${selectedDirection}`;
      let targetManifest = newLocalManifests[targetManifestId];

      if (!targetManifest) {
        const dbManifest = (routeManifests || []).find(m => 
          m && m.routeId === targetRouteId && getSafeDateStr(m.date) === dateStr && m.direction === selectedDirection
        );
        if (dbManifest) {
          targetManifest = { ...dbManifest };
        } else {
          targetManifest = {
            id: targetManifestId,
            routeId: targetRouteId,
            date: dateStr,
            shift: targetRoute.shift,
            direction: selectedDirection,
            studentIds: targetRoute.baseStudentIds || targetRoute.studentIds || [],
            updatedAt: new Date().toISOString()
          };
        }
      }

      const currentTargetIds = targetManifest.studentIds || [];
      if (!currentTargetIds.includes(studentId)) {
        targetManifest.studentIds = [...currentTargetIds, studentId];
        newLocalManifests[targetManifestId] = {
          ...targetManifest,
          updatedAt: new Date().toISOString()
        };
      }
    });

    setLocalManifests(newLocalManifests);
    setSelectedExtraStudentIds([]);
    setToastMessage(`Sucesso: ${studentIds.length} ${studentIds.length === 1 ? 'aluno transferido' : 'alunos transferidos'} para a rota ${targetRoute.name}.`);
    
    // Automatically transition to the target route and switch to the "Na Van" tab
    setSelectedRouteId(targetRouteId);
    setActiveTab('minha-rota');
  };

  const handleSelectAllocationTarget = async (targetValue: string) => {
    if (targetValue === 'create_new_route') {
      const schoolObj = selectedSchoolId !== 'all' ? (schools || []).find((s: any) => s.id === selectedSchoolId) : null;
      const schoolName = schoolObj ? schoolObj.name : 'Geral';
      const vehicleModel = activeVehicle ? activeVehicle.model : 'Mercedes';
      
      const driver = (drivers || []).find(d => d.vehicleId === selectedVehicleId) || (drivers || [])[0];
      const driverId = driver ? driver.id : 'val-driver';
      
      const newRouteId = `route_${Date.now()}`;
      const newRoute = {
        id: newRouteId,
        name: `Rota ${schoolName} - ${vehicleModel}`,
        driverId,
        monitorId: 'monitor-1',
        shift: selectedShift,
        studentIds: [],
        lastOptimizedAt: new Date().toISOString(),
        lastResetDate: new Date().toISOString().split('T')[0],
        journeyStatus: 'pendente' as const
      };

      try {
        await addDoc('routes', newRoute);
        pullMultipleStudentsToRoute(selectedExtraStudentIds, newRouteId, newRoute);
      } catch (err) {
        console.error("Erro ao criar rota dinâmica:", err);
      }
    } else {
      pullMultipleStudentsToRoute(selectedExtraStudentIds, targetValue);
    }
  };

  const allocateStudentToRoute = (studentId: string, routeId: string) => {
    pullMultipleStudentsToRoute([studentId], routeId);
  };

  const pullStudentsToRoute = () => {
    if (!activeManifestData || selectedExtraStudentIds.length === 0) return;
    pullMultipleStudentsToRoute(selectedExtraStudentIds, selectedRouteId);
    setActiveTab('minha-rota');
  };

  const removeStudentsFromRoute = () => {
    if (!activeManifestData || selectedRouteStudentIds.length === 0) return;
    const count = selectedRouteStudentIds.length;
    const newIds = (activeManifestData.manifest.studentIds || []).filter(id => !selectedRouteStudentIds.includes(id));
    
    updateLocalManifest(newIds);
    setSelectedRouteStudentIds([]);
    setToastMessage(`${count} ${count === 1 ? 'aluno removido' : 'alunos removidos'} da rota.`);
  };

  const discardChanges = () => {
    setLocalManifests({});
    setSelectedRouteStudentIds([]);
    setSelectedExtraStudentIds([]);
  };

  const publishItinerary = async () => {
    setIsPublishing(true);
    try {
      for (const manifestId of Object.keys(localManifests)) {
        const localManifest = localManifests[manifestId];
        const dbManifest = (routeManifests || []).find(m => m.id === manifestId);
        if (dbManifest) {
          await updateDoc('route_manifests', manifestId, {
            studentIds: localManifest.studentIds,
            updatedAt: new Date().toISOString()
          });
        } else {
          await addDoc('route_manifests', {
            ...localManifest,
            updatedAt: new Date().toISOString()
          });
        }
      }
      setLocalManifests({});
      setSelectedRouteStudentIds([]);
      setSelectedExtraStudentIds([]);
      setToastMessage("Itinerários publicados com sucesso!");
      
      // Smoothly redirect back to landing page after 1.2 seconds if in advanced mode
      setTimeout(() => {
        if (viewMode === 'advanced') {
          setIsPlanningActive(false);
        }
        setIsPublishing(false);
      }, 1200);
    } catch (error) {
      console.error("Erro ao salvar os itinerários:", error);
      setToastMessage("Erro ao publicar itinerários.");
      setIsPublishing(false);
    }
  };

  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return 'Sem Escola';
    const school = (schools || []).find(s => s && s.id === schoolId);
    return school ? school.name : 'Escola não encontrada';
  };

  // ─── MODO RÁPIDO: Helpers e Ações Rápidas ─────────────────
  const isSelectedDateToday = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    return dateStr === todayStr;
  }, [dateStr]);

  const isSelectedDateTomorrow = useMemo(() => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    return dateStr === tomorrowStr;
  }, [dateStr]);

  const setDateToday = () => {
    setSelectedDate(new Date());
  };

  const setDateTomorrow = () => {
    setSelectedDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  };

  // Motorista ativo da van/rota
  const activeDriver = useMemo(() => {
    if (activeManifestData && drivers) {
      const driverId = activeManifestData.route.driverId;
      const found = drivers.find(d => d.id === driverId);
      if (found) return found;
    }
    if (selectedVehicleId !== 'all' && drivers) {
      const found = drivers.find(d => d.vehicleId === selectedVehicleId);
      if (found) return found;
    }
    return (drivers || [])[0] || null;
  }, [activeManifestData, selectedVehicleId, drivers]);

  // Lista consolidada de alunos para o Checklist do Tio da Van
  const easyModeStudents = useMemo(() => {
    if (!activeManifestData) {
      if (selectedVehicleId !== 'all' && vehicleStudents.length > 0) {
        return vehicleStudents;
      }
      return [];
    }
    const baseIds = activeManifestData.route.baseStudentIds || activeManifestData.route.studentIds || [];
    const manifestIds = activeManifestData.manifest.studentIds || [];
    
    // União sem duplicatas de todos os alunos associados a esta rota hoje
    const allIds = Array.from(new Set([...baseIds, ...manifestIds]));
    
    return allIds
      .map(id => (students || []).find(s => s && s.id === id))
      .filter(Boolean) as Student[];
  }, [activeManifestData, students, selectedVehicleId, vehicleStudents]);

  // Contagem de passageiros e lotação
  const easyModeConfirmedCount = useMemo(() => {
    return (activeManifestData?.manifest?.studentIds || []).length;
  }, [activeManifestData]);

  const maxCapacity = activeVehicle?.capacity || 15;
  const easyModeAvailableSeats = Math.max(0, maxCapacity - easyModeConfirmedCount);
  const easyModeCapacityPercent = Math.min(100, Math.round((easyModeConfirmedCount / maxCapacity) * 100));

  // Ação de 1 toque: Alternar presença do aluno na van hoje
  const handleToggleStudentPresence = (student: Student) => {
    if (!activeManifestData) return;
    const currentIds = activeManifestData.manifest.studentIds || [];
    const isCurrentlyIn = currentIds.includes(student.id);
    
    let nextIds: string[];
    if (isCurrentlyIn) {
      nextIds = currentIds.filter(id => id !== student.id);
      setToastMessage(`${student.name} marcado como não vai nesta viagem.`);
    } else {
      nextIds = [...currentIds, student.id];
      setToastMessage(`${student.name} confirmado na van!`);
    }
    updateLocalManifest(nextIds);
  };

  // Alunos filtrados para encaixe rápido
  const quickAddFilteredStudents = useMemo(() => {
    const list = availableExtras || [];
    if (!quickAddSearch.trim()) return list.slice(0, 15);
    const q = quickAddSearch.toLowerCase();
    return list.filter(st => {
      const matchName = safeString(st.name).toLowerCase().includes(q);
      const matchSchool = getSchoolName(st.schoolId).toLowerCase().includes(q);
      return matchName || matchSchool;
    }).slice(0, 15);
  }, [availableExtras, quickAddSearch, schools]);

  // Ação de encaixar aluno rápido
  const handleQuickAddStudent = (studentId: string) => {
    const targetRouteId = hasActiveRoute ? selectedRouteId : ((availableRoutes || [])[0]?.id || '');
    if (!targetRouteId) {
      setToastMessage("Selecione uma rota para adicionar o aluno.");
      return;
    }
    pullMultipleStudentsToRoute([studentId], targetRouteId);
    setToastMessage("Aluno encaixado na van com sucesso!");
    setIsQuickAddOpen(false);
    setQuickAddSearch('');
  };

  // ─── Gate / Landing Helpers ───────────────────────────────────

  // Grouped manifest summaries for the Landing view
  const publishedManifestSummaries = useMemo(() => {
    const manifests = routeManifests || [];
    const summaries = manifests
      .filter(m => {
        if (!m || !m.routeId) return false;
        const dateStr = getSafeDateStr(m.date);
        return !!dateStr;
      })
      .map(m => {
        const route = (routes || []).find(r => r && r.id === m.routeId);
        const dateStr = getSafeDateStr(m.date);
        return {
          ...m,
          date: dateStr,
          routeName: route?.name || 'Rota desconhecida',
          studentCount: (m.studentIds || []).length,
        };
      })
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Apply search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return summaries.filter(s =>
        s.routeName.toLowerCase().includes(q) ||
        s.date.includes(q) ||
        (s.shift || '').toLowerCase().includes(q)
      );
    }
    return summaries;
  }, [routeManifests, routes, searchQuery]);

  // Stats for the landing dashboard
  const landingStats = useMemo(() => {
    const totalStudents = (students || []).length;
    const totalRoutes = (routes || []).length;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const todayManifests = (routeManifests || []).filter(m => m && getSafeDateStr(m.date) === todayStr);
    const studentsAllocatedToday = new Set(todayManifests.flatMap(m => m.studentIds || [])).size;
    return { totalStudents, totalRoutes, todayManifests: todayManifests.length, studentsAllocatedToday };
  }, [students, routes, routeManifests]);

  // Wizard routes (filtered by wizardShift)
  const wizardAvailableRoutes = useMemo(() => {
    return (routes || []).filter(r => r && (r.shift === wizardShift || r.shift === 'Integral'));
  }, [routes, wizardShift]);

  const handleWizardConfirm = async () => {
    setSelectedDate(wizardDate);
    setSelectedShift(wizardShift);
    setSelectedDirection(wizardDirection);
    setSelectedSchoolId('all');

    let targetRouteId = wizardRouteId;
    let targetVehicleId = 'all';

    if (wizardRouteId === 'none') {
      if (wizardDriverId && wizardDriverId !== 'none') {
        // Find route associated with this driver for active shift
        const assocRoute = (routes || []).find(r => 
          r && r.driverId === wizardDriverId && 
          (r.shift === wizardShift || r.shift === 'Integral')
        );
        if (assocRoute) {
          targetRouteId = assocRoute.id;
        } else {
          targetRouteId = 'none';
        }
        
        // Find driver's vehicle
        const d = (drivers || []).find(drv => drv.id === wizardDriverId);
        if (d && d.vehicleId) {
          targetVehicleId = d.vehicleId;
        }
      } else {
        targetRouteId = 'none';
        targetVehicleId = 'all';
      }
    } else {
      // Specific route selected
      targetRouteId = wizardRouteId;
      const r = (routes || []).find(route => route.id === wizardRouteId);
      if (r) {
        // Find route's vehicle via its assigned driver
        const d = (drivers || []).find(drv => drv.id === (wizardDriverId || r.driverId));
        if (d && d.vehicleId) {
          targetVehicleId = d.vehicleId;
        }
        
        // Update route's driver if changed in wizard
        if (wizardDriverId && wizardDriverId !== 'none' && r.driverId !== wizardDriverId) {
          try {
            await updateDoc('routes', wizardRouteId, { driverId: wizardDriverId });
          } catch (err) {
            console.error("Erro ao atualizar motorista da rota via wizard:", err);
          }
        }
      }
    }

    setSelectedRouteId(targetRouteId);
    setSelectedVehicleId(targetVehicleId);
    setIsWizardOpen(false);
    setIsPlanningActive(true);
  };

  const handleBackToLanding = () => {
    if (isDirty) {
      const confirmed = window.confirm('Você tem alterações não publicadas. Deseja realmente sair sem publicar?');
      if (!confirmed) return;
      setLocalManifests({});
    }
    setIsPlanningActive(false);
    setSelectedRouteStudentIds([]);
    setSelectedExtraStudentIds([]);
  };

  const handleEditManifest = (manifest: RouteManifest & { routeName: string }) => {
    const safeDate = getSafeDateStr(manifest.date);
    setSelectedDate(new Date(safeDate + 'T12:00:00'));
    setSelectedShift(manifest.shift as 'Manhã' | 'Tarde' | 'Integral');
    setSelectedDirection(manifest.direction as 'ida' | 'volta');
    setSelectedRouteId(manifest.routeId);
    setSelectedSchoolId('all');
    setSelectedVehicleId('all');
    setIsPlanningActive(true);
  };

  const handleDeleteManifest = async (manifestId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = window.confirm('Deseja realmente excluir este planejamento publicado? Esta ação não pode ser desfeita.');
    if (!confirmed) return;

    try {
      await deleteDoc('route_manifests', manifestId);
      setToastMessage('Planejamento excluído com sucesso.');
    } catch (err) {
      console.error('Erro ao excluir planejamento:', err);
      setToastMessage('Erro ao excluir o planejamento.');
    }
  };

  const activeRouteDriverId = useMemo(() => {
    if (!selectedRouteId || selectedRouteId === 'none' || !routes) return '';
    const r = routes.find(route => route.id === selectedRouteId);
    return r?.driverId || '';
  }, [routes, selectedRouteId]);

  const handleDriverChange = async (newDriverId: string) => {
    if (!selectedRouteId || selectedRouteId === 'none') return;
    try {
      await updateDoc('routes', selectedRouteId, { driverId: newDriverId });
      setToastMessage('Motorista da rota atualizado com sucesso.');
    } catch (err) {
      console.error('Erro ao atualizar motorista da rota:', err);
      setToastMessage('Erro ao atualizar motorista da rota.');
    }
  };

  return (
    <div className="relative pb-24">
      {/* PREMIUM TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-zinc-950 border border-orange-500/40 text-foreground px-4 py-3 rounded-lg shadow-xl shadow-orange-500/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <p className="text-xs font-bold tracking-wide uppercase text-zinc-100">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* ═══════════════════ WIZARD MODAL ═══════════════════ */}
      <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Plus className="w-5 h-5 text-orange-500" />
              Novo Planejamento
            </DialogTitle>
            <DialogDescription>
              Configure os parâmetros para iniciar um novo planejamento de rota.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            {/* Wizard: Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Data do Planejamento
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(wizardDate, 'PPP', { locale: ptBR })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={wizardDate} onSelect={(d) => d && setWizardDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Wizard: Shift */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Turno</label>
              <Select value={wizardShift} onValueChange={(v: any) => setWizardShift(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manhã">Manhã</SelectItem>
                  <SelectItem value="Tarde">Tarde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wizard: Direction */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sentido</label>
              <Select value={wizardDirection} onValueChange={(v: any) => setWizardDirection(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sentido" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ida">Ida (Casa ➔ Escola)</SelectItem>
                  <SelectItem value="volta">Volta (Escola ➔ Casa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Wizard: Route */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Rota</label>
              <Select value={wizardRouteId} onValueChange={setWizardRouteId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolher Rota" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Visão Geral (Todas)</SelectItem>
                  {(wizardAvailableRoutes || []).filter(r => r && r.id).map(r => (
                    <SelectItem key={r.id} value={r.id}>{safeString(r.name)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wizard: Driver (always shown) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Motorista</label>
              <Select value={wizardDriverId} onValueChange={setWizardDriverId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o Motorista" />
                </SelectTrigger>
                <SelectContent>
                  {wizardRouteId === 'none' && (
                    <SelectItem value="none">Todos os Motoristas</SelectItem>
                  )}
                  {(drivers || []).filter(d => d && d.id).map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      {safeString(d.name)} {d.vehicleId ? `(Van: ${safeString((vehicles || []).find((v: any) => v.id === d.vehicleId)?.model, 'Atribuída')})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsWizardOpen(false)}>Cancelar</Button>
            <Button onClick={handleWizardConfirm} className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/20">
              Iniciar Planejamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ DIALOG: ENCAIXAR ALUNO RÁPIDO ═══════════════════ */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <UserPlus className="w-5 h-5 text-orange-500" />
              Encaixar Aluno na Van
            </DialogTitle>
            <DialogDescription>
              Pesquise pelo nome ou escola da criança para adicioná-la à viagem de hoje.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome do aluno ou escola..."
                value={quickAddSearch}
                onChange={(e) => setQuickAddSearch(e.target.value)}
                className="pl-9 h-10 text-sm rounded-xl"
                autoFocus
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto divide-y divide-border/60 -mx-1 px-1">
              {quickAddFilteredStudents.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  Nenhum aluno disponível encontrado para este filtro.
                </div>
              ) : (
                quickAddFilteredStudents.map(st => (
                  <div key={st.id} className="py-2.5 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground truncate">{safeString(st.name)}</p>
                      <p className="text-xs text-muted-foreground truncate">{st.shift} • {getSchoolName(st.schoolId)}</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleQuickAddStudent(st.id)}
                      className="h-8 px-3 text-xs font-bold bg-orange-500 hover:bg-orange-600 text-white rounded-lg flex-shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Puxar
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setIsQuickAddOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════════════ TOP HEADER & VIEW MODE SELECTOR ═══════════════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 bg-card border border-border/50 p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2.5 text-foreground">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
              <Bus className="w-5 h-5" />
            </div>
            Planejamento da Van
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            {viewMode === 'easy' 
              ? 'Visualização rápida e prática para conferência dos passageiros de hoje.'
              : 'Painel gerencial avançado para orquestração de múltiplos manifestos.'}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-muted/70 p-1 rounded-xl border border-border/40 w-full sm:w-auto">
          <Button
            type="button"
            variant={viewMode === 'easy' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('easy')}
            className={cn(
              "flex-1 sm:flex-none h-9 text-xs font-bold rounded-lg transition-all",
              viewMode === 'easy'
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bus className="w-3.5 h-3.5 mr-1.5" />
            Modo Rápido
          </Button>
          <Button
            type="button"
            variant={viewMode === 'advanced' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('advanced')}
            className={cn(
              "flex-1 sm:flex-none h-9 text-xs font-bold rounded-lg transition-all",
              viewMode === 'advanced'
                ? "bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 mr-1.5" />
            Modo Avançado
          </Button>
        </div>
      </div>

      {viewMode === 'easy' ? (
        /* ═══════════════════ MODO TIO DA VAN (EASY / MOBILE FIRST) ═══════════════════ */
        <div className="space-y-4">
          {/* Visual Switcher / Controls Card */}
          <Card className="border border-border/60 shadow-sm bg-card overflow-hidden">
            <CardContent className="p-4 space-y-4">
              {/* Date Selector Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-orange-500" />
                  Dia da Viagem
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={isSelectedDateToday ? 'default' : 'outline'}
                    size="sm"
                    onClick={setDateToday}
                    className={cn(
                      "h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all",
                      isSelectedDateToday
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    Hoje ({format(new Date(), 'EEE, dd/MM', { locale: ptBR })})
                  </Button>
                  <Button
                    type="button"
                    variant={isSelectedDateTomorrow ? 'default' : 'outline'}
                    size="sm"
                    onClick={setDateTomorrow}
                    className={cn(
                      "h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all",
                      isSelectedDateTomorrow
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    Amanhã ({format(new Date(Date.now() + 86400000), 'EEE, dd/MM', { locale: ptBR })})
                  </Button>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={!isSelectedDateToday && !isSelectedDateTomorrow ? 'default' : 'outline'}
                        size="sm"
                        className={cn(
                          "h-9 px-3 rounded-xl text-xs font-medium",
                          !isSelectedDateToday && !isSelectedDateTomorrow
                            ? "bg-orange-500 text-white"
                            : "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="w-3.5 h-3.5 mr-1" />
                        {!isSelectedDateToday && !isSelectedDateTomorrow
                          ? format(selectedDate, 'dd/MM/yyyy')
                          : 'Outra Data'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(d) => d && setSelectedDate(d)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Direction & Shift Switcher */}
              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-orange-500" />
                  Sentido da Viagem
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={selectedDirection === 'ida' ? 'default' : 'outline'}
                    onClick={() => setSelectedDirection('ida')}
                    className={cn(
                      "h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      selectedDirection === 'ida'
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <Bus className="w-4 h-4" />
                    <span>Ida (Casa ➔ Escola)</span>
                  </Button>
                  <Button
                    type="button"
                    variant={selectedDirection === 'volta' ? 'default' : 'outline'}
                    onClick={() => setSelectedDirection('volta')}
                    className={cn(
                      "h-11 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all",
                      selectedDirection === 'volta'
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-md shadow-orange-500/20"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    <ArrowRightLeft className="w-4 h-4" />
                    <span>Volta (Escola ➔ Casa)</span>
                  </Button>
                </div>
                
                {/* Turno toggle */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">Turno:</span>
                  <Button
                    type="button"
                    variant={selectedShift === 'Manhã' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedShift('Manhã')}
                    className={cn(
                      "h-7 px-3 text-xs rounded-full font-bold",
                      selectedShift === 'Manhã' ? "bg-orange-500 text-white" : "text-muted-foreground"
                    )}
                  >
                    ☀️ Manhã
                  </Button>
                  <Button
                    type="button"
                    variant={selectedShift === 'Tarde' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedShift('Tarde')}
                    className={cn(
                      "h-7 px-3 text-xs rounded-full font-bold",
                      selectedShift === 'Tarde' ? "bg-orange-500 text-white" : "text-muted-foreground"
                    )}
                  >
                    ⛅ Tarde
                  </Button>
                </div>
              </div>

              {/* Multi-Van Selector (only if > 1 vehicle) */}
              {(vehicles || []).length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Bus className="w-3.5 h-3.5 text-orange-500" />
                    Escolha a Van
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(vehicles || []).map((v: any) => {
                      const isSelected = selectedVehicleId === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVehicleId(v.id);
                          }}
                          className={cn(
                            "flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex-shrink-0",
                            isSelected
                              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                              : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                          )}
                        >
                          <Bus className="w-4 h-4" />
                          <span>{v.model || 'Van'}</span>
                          {v.plate && <span className="opacity-80 text-[10px]">({v.plate})</span>}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleId('all')}
                      className={cn(
                        "px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap flex-shrink-0",
                        selectedVehicleId === 'all'
                          ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                          : "bg-muted/40 hover:bg-muted text-muted-foreground border-border/60"
                      )}
                    >
                      Todas as Vans
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Route Selector (if vehicle has multiple routes in this shift) */}
              {(availableRoutes || []).length > 1 && (
                <div className="space-y-1.5 pt-2 border-t border-border/40">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-orange-500" />
                    Rota / Linha da Van
                  </label>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(availableRoutes || []).map(r => {
                      const isSelected = selectedRouteId === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRouteId(r.id)}
                          className={cn(
                            "flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex-shrink-0",
                            isSelected
                              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
                              : "bg-muted/40 hover:bg-muted text-foreground border-border/60"
                          )}
                        >
                          <span>{r.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Van Capacity Banner */}
          <Card className="border border-orange-500/30 bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 flex-shrink-0">
                    <Bus className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground">
                        {activeVehicle?.model || activeManifestData?.route?.name || 'Van Escolar'}
                      </h3>
                      {activeVehicle?.plate && (
                        <Badge variant="outline" className="text-[10px] font-mono border-border">
                          {activeVehicle.plate}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activeDriver ? `Motorista: ${activeDriver.name}` : 'Condutor padrão'} • {selectedShift} ({selectedDirection === 'ida' ? 'Ida' : 'Volta'})
                    </p>
                  </div>
                </div>

                <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-0 border-border/40">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-muted-foreground">Lotação</p>
                    <p className="text-sm font-bold text-foreground">
                      <span className="text-orange-500 text-base">{easyModeConfirmedCount}</span> / {maxCapacity} lugares
                    </p>
                  </div>
                  {easyModeAvailableSeats > 0 ? (
                    <Badge className="bg-emerald-600/10 text-emerald-500 border border-emerald-600/30 font-bold px-2.5 py-1 text-xs">
                      {easyModeAvailableSeats} {easyModeAvailableSeats === 1 ? 'vaga livre' : 'vagas livres'}
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="font-bold px-2.5 py-1 text-xs">
                      ⚠️ Van Lotada
                    </Badge>
                  )}
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full h-2 bg-muted/60 rounded-full mt-3 overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-300 rounded-full",
                    easyModeCapacityPercent >= 100 
                      ? "bg-rose-500" 
                      : easyModeCapacityPercent > 80 
                        ? "bg-amber-500" 
                        : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(100, easyModeCapacityPercent)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section Header: Checklist de Alunos */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span>Passageiros da Viagem</span>
                <Badge variant="secondary" className="font-bold">
                  {easyModeStudents.length}
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Toque no botão ao lado do nome para confirmar quem vai ou tirar quem avisou falta.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => setIsQuickAddOpen(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs h-9 px-3 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Encaixar Aluno
            </Button>
          </div>

          {/* Checklist de Alunos Cards */}
          {easyModeStudents.length === 0 ? (
            <Card className="p-10 text-center border-dashed border-border/80 bg-muted/10">
              <Info className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-bold text-foreground">Nenhum aluno alocado nesta van para este turno.</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Toque no botão abaixo para puxar alunos cadastrados e montar a lista de hoje em 1 toque.
              </p>
              <Button
                type="button"
                onClick={() => setIsQuickAddOpen(true)}
                className="mt-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl"
              >
                <UserPlus className="w-4 h-4 mr-1.5" />
                Encaixar Primeiro Aluno
              </Button>
            </Card>
          ) : (
            <div className="space-y-2.5">
              {easyModeStudents.map((student) => {
                const isConfirmed = (activeManifestData?.manifest?.studentIds || []).includes(student.id);
                const isAbsentByParent = isStudentAbsent(student);
                const isExtraApproved = hasApprovedTripRequestToday(student.id);
                const schoolName = getSchoolName(student.schoolId);

                return (
                  <Card
                    key={student.id}
                    className={cn(
                      "border transition-all duration-200 overflow-hidden",
                      isConfirmed
                        ? "bg-card border-border/80 shadow-sm"
                        : "bg-muted/20 border-border/40 opacity-70"
                    )}
                  >
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        {/* Initials Avatar */}
                        <div className={cn(
                          "w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors",
                          isConfirmed 
                            ? "bg-orange-500/10 text-orange-500 border border-orange-500/20" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          {safeString(student.name).substring(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <p className={cn(
                              "text-base font-bold text-foreground leading-tight",
                              !isConfirmed && "line-through text-muted-foreground"
                            )}>
                              {safeString(student.name)}
                            </p>
                            {isAbsentByParent && (
                              <Badge variant="destructive" className="text-[10px] font-bold px-1.5 py-0.5">
                                🚫 Pai avisou falta no app
                              </Badge>
                            )}
                            {isExtraApproved && (
                              <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5">
                                ✨ Avulso
                              </Badge>
                            )}
                          </div>

                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <School className="w-3 h-3 text-muted-foreground/70" />
                            <span>{schoolName}</span>
                            <span className="opacity-40">•</span>
                            <span>{student.shift}</span>
                          </p>

                          {student.address && (
                            <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-muted-foreground/70" />
                              <span>{student.address}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* 1-Tap Action Button */}
                      <div className="flex items-center justify-end">
                        {isConfirmed ? (
                          <Button
                            type="button"
                            onClick={() => handleToggleStudentPresence(student)}
                            className="w-full sm:w-auto h-11 px-5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-sm transition-transform active:scale-95"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Vai na Van</span>
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleToggleStudentPresence(student)}
                            className="w-full sm:w-auto h-11 px-5 border-rose-500/40 text-rose-500 hover:bg-rose-500/10 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95"
                          >
                            <X className="w-4 h-4 stroke-[2.5]" />
                            <span>Não Vai Hoje</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Big Action: Encaixar Aluno Button */}
          <Button
            type="button"
            onClick={() => setIsQuickAddOpen(true)}
            variant="outline"
            className="w-full h-12 border-2 border-dashed border-orange-500/40 bg-orange-500/5 hover:bg-orange-500/10 text-orange-500 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-all mt-4"
          >
            <UserPlus className="w-5 h-5" />
            <span>➕ Encaixar Aluno / Carona nesta Viagem</span>
          </Button>

          {/* Sticky Bottom Bar for Tio da Van */}
          <div className="sticky bottom-4 z-40 bg-zinc-950/95 backdrop-blur-md border border-orange-500/30 rounded-2xl p-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-3 mt-6">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 flex-shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {easyModeConfirmedCount} {easyModeConfirmedCount === 1 ? 'passageiro confirmado' : 'passageiros confirmados'}
                  </span>
                  {easyModeAvailableSeats > 0 ? (
                    <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400 bg-emerald-500/10 font-bold">
                      {easyModeAvailableSeats} vagas livres
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-[10px] font-bold">
                      Van Lotada
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-zinc-400">
                  {isDirty ? 'Alterações não salvas na memória local.' : 'Manifesto sincronizado e pronto.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {isDirty && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={discardChanges}
                  disabled={isPublishing}
                  className="h-10 px-4 text-xs font-semibold text-zinc-300 border-zinc-700 hover:bg-zinc-800 rounded-xl"
                >
                  Descartar
                </Button>
              )}
              <Button
                size="sm"
                onClick={publishItinerary}
                disabled={isPublishing}
                className="h-10 px-6 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20 rounded-xl flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando Rota...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    Confirmar e Salvar Rota
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* ═══════════════════ MODO AVANÇADO (GESTOR DE FROTA) ═══════════════════ */
        !isPlanningActive ? (
        <div className="space-y-6">
          {/* Landing Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Planejamento de Rotas</h1>
              <p className="text-muted-foreground mt-1">Gerencie e crie planejamentos de transporte escolar.</p>
            </div>
            <Button
              onClick={() => {
                setWizardDate(new Date());
                setWizardShift('Manhã');
                setWizardDirection('ida');
                setWizardRouteId('none');
                setIsWizardOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 h-11 px-6 text-sm"
              id="btn-new-planning"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Planejamento
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{landingStats.totalStudents}</p>
                    <p className="text-xs text-muted-foreground font-medium">Total de Alunos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Bus className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{landingStats.totalRoutes}</p>
                    <p className="text-xs text-muted-foreground font-medium">Rotas Cadastradas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{landingStats.todayManifests}</p>
                    <p className="text-xs text-muted-foreground font-medium">Manifestos Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{landingStats.studentsAllocatedToday}</p>
                    <p className="text-xs text-muted-foreground font-medium">Alocados Hoje</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search + Manifest History */}
          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <History className="w-5 h-5 text-muted-foreground" />
                  Planejamentos Publicados
                </CardTitle>
                <div className="relative w-full sm:w-96 group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                  <Input
                    placeholder="Buscar por rota, data, turno..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-10 h-11 bg-zinc-900/40 border-zinc-800 text-zinc-100 placeholder:text-zinc-500 rounded-lg focus-visible:ring-1 focus-visible:ring-orange-500/30 focus-visible:border-orange-500/50 transition-all duration-300"
                    id="search-manifests"
                    aria-label="Buscar planejamentos de rotas por nome, data ou turno"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                      type="button"
                      aria-label="Limpar campo de busca"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {publishedManifestSummaries.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4 border border-muted-foreground/10 text-muted-foreground/50">
                    <Bus className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-foreground mb-1">Nenhum planejamento encontrado</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery.trim()
                      ? 'Tente buscar com outros termos ou limpe a pesquisa.'
                      : 'Clique em "Novo Planejamento" para criar seu primeiro manifesto de rota.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border rounded-lg border overflow-hidden bg-zinc-950/20">
                  {publishedManifestSummaries.map((manifest) => (
                    <SafeRow key={manifest.id} name={`manifest-row-${manifest.id}`}>
                      <div className="p-4 flex flex-col gap-2 hover:bg-zinc-900/10 transition-colors border-b border-zinc-800 last:border-none">
                        {/* Top line: Route Name (left) & Actions (right) */}
                        <div className="flex items-center justify-between gap-4">
                          <p className="text-sm font-semibold text-zinc-100 truncate">{safeString(manifest.routeName)}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditManifest(manifest)}
                              className="h-8 text-xs font-semibold hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all duration-300"
                              aria-label={`Editar planejamento da rota ${safeString(manifest.routeName)}`}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteManifest(manifest.id, e)}
                              className="h-8 w-8 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Excluir Planejamento"
                              aria-label={`Excluir planejamento da rota ${safeString(manifest.routeName)}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {/* Bottom line: Date & Badges */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              try {
                                const safeDate = getSafeDateStr(manifest.date);
                                if (!safeDate) return '—';
                                return format(new Date(safeDate + 'T12:00:00'), 'dd MMM yyyy', { locale: ptBR });
                              } catch {
                                return typeof manifest.date === 'string' ? manifest.date : '—';
                              }
                            })()}
                          </p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-[10px] font-bold border-zinc-800 text-zinc-300">
                              {manifest.shift || '—'}
                            </Badge>
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold",
                              manifest.direction === 'ida'
                                ? 'border-blue-500/30 text-blue-500 bg-blue-500/5'
                                : 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5'
                            )}>
                              {manifest.direction === 'ida' ? '↗ Ida' : '↙ Volta'}
                            </Badge>
                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/30 text-[10px] font-bold">
                              {manifest.studentCount} {manifest.studentCount === 1 ? 'aluno' : 'alunos'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </SafeRow>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* ═══════════════════ WORKSPACE VIEW ═══════════════════ */
        <>
          {/* Back Button */}
          <div className="mb-4">
            <Button variant="ghost" size="sm" onClick={handleBackToLanding} className="text-muted-foreground hover:text-foreground gap-2 -ml-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para o Painel
            </Button>
          </div>

          {/* HEADER */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Planejamento de Rotas</h1>
              <p className="text-muted-foreground">Orquestração de manifestos e rotas em tempo real.</p>
            </div>
          </div>

          {/* FILTER CARD */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Filtros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <School className="w-4 h-4 text-muted-foreground" /> Escola Base
                  </label>
                  <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a Escola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Escolas</SelectItem>
                      {(schools || []).filter(s => s && s.id).map(s => <SelectItem key={s.id} value={s.id}>{safeString(s.name)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" /> Data do Planejamento
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(selectedDate, 'PPP', { locale: ptBR })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={selectedDate} onSelect={(d) => d && setSelectedDate(d)} initialFocus />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turno</label>
                  <Select value={selectedShift} onValueChange={(v: any) => setSelectedShift(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Turno" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Manhã">Manhã</SelectItem>
                      <SelectItem value="Tarde">Tarde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Sentido</label>
                  <Select value={selectedDirection} onValueChange={(v: any) => setSelectedDirection(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sentido" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ida">Ida (Casa ➔ Escola)</SelectItem>
                      <SelectItem value="volta">Volta (Escola ➔ Casa)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Van</label>
                  <Select value={selectedVehicleId} onValueChange={setSelectedVehicleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Frota" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Vans</SelectItem>
                      {(vehicles || []).filter(v => v && v.id).map(v => <SelectItem key={v.id} value={v.id}>{safeString(v.model)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rota</label>
                  <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
                    <SelectTrigger>
                      <SelectValue placeholder={(availableRoutes || []).length > 0 ? "Escolher Rota" : "Vazio"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geral</SelectItem>
                      {(availableRoutes || []).filter(r => r && r.id).map(r => <SelectItem key={r.id} value={r.id}>{safeString(r.name)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {hasActiveRoute && (
                <div className="pt-4 border-t border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500">
                      <UserIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-200">Motorista da Rota</p>
                      <p className="text-xs text-muted-foreground">Altere o motorista atribuído a esta rota para as próximas viagens.</p>
                    </div>
                  </div>
                  <div className="w-full md:w-64">
                    <Select
                      value={activeRouteDriverId}
                      onValueChange={handleDriverChange}
                    >
                      <SelectTrigger className="bg-zinc-900 border-zinc-800 text-zinc-100">
                        <SelectValue placeholder="Selecione o Motorista" />
                      </SelectTrigger>
                      <SelectContent>
                        {(drivers || []).filter(d => d && d.id).map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {safeString(d.name)} {d.vehicleId ? `(Van: ${safeString((vehicles || []).find((v: any) => v.id === d.vehicleId)?.model, 'Atribuída')})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* UNIFIED TABS & CONTENT */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="minha-rota">
                <Bus className="w-4 h-4 mr-2" />
                Na Van ({hasActiveRoute ? (allRouteStudents || []).length : (selectedVehicleId !== 'all' ? (vehicleStudents || []).length : 0)})
              </TabsTrigger>
              <TabsTrigger value="adicionar">
                <UserPlus className="w-4 h-4 mr-2" />
                Buscar / Puxar ({(availableExtras || []).length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: NA VAN */}
            <TabsContent value="minha-rota" className="space-y-4">
              {!hasActiveRoute ? (
                selectedVehicleId !== 'all' ? (
                  <>
                    <div className="flex items-center justify-between bg-card rounded-md p-4 border shadow-sm">
                      <span className="text-sm font-semibold text-muted-foreground">
                        Alunos alocados neste veículo ({vehicleStudents.length})
                      </span>
                    </div>

                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-3">
                        <CardTitle className="text-sm font-semibold text-muted-foreground">Manifesto Consolidado do Veículo</CardTitle>
                      </CardHeader>
                      {vehicleStudents.length === 0 ? (
                        <div className="p-10 text-center text-muted-foreground text-sm">Nenhum aluno alocado neste veículo hoje.</div>
                      ) : (
                        <div className="divide-y divide-border">
                          {vehicleStudents.filter(student => student && student.id).map((student: Student) => {
                            const currentRoute = getStudentCurrentRoute(student.id);
                            return (
                              <SafeRow key={student.id} name={`vehicle-student-${student.id}`}>
                                <div className="p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium">{safeString(student.name)}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                                  </div>
                                  {currentRoute && (
                                    <Badge variant="outline" className="text-xs font-bold border-orange-500/30 text-orange-500 bg-orange-500/5">
                                      {currentRoute.name}
                                    </Badge>
                                  )}
                                </div>
                              </SafeRow>
                            );
                          })}
                        </div>
                      )}
                    </Card>
                  </>
                ) : (
                  <Card className="p-16 text-center flex flex-col items-center justify-center border-dashed bg-muted/10 border-muted-foreground/20">
                    <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-6 border border-muted-foreground/10 text-muted-foreground/60">
                      <Truck className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Nenhuma Rota Selecionada</h3>
                    <p className="text-muted-foreground max-w-sm text-sm">
                      Selecione uma rota/van específica no filtro acima para visualizar e gerenciar os alunos que estão alocados nela.
                    </p>
                  </Card>
                )
              ) : (
                <>
                  <div className="flex items-center justify-between bg-card rounded-md p-4 border shadow-sm">
                    <Button variant="ghost" size="sm" onClick={selectAllRouteStudents}>
                      <CheckSquare className="w-4 h-4 mr-2" />
                      {selectedRouteStudentIds.length === (allRouteStudents || []).length && (allRouteStudents || []).length > 0 ? 'Desmarcar' : 'Selecionar Tudo'}
                    </Button>
                    {(selectedRouteStudentIds || []).length > 0 && (
                      <Button variant="destructive" size="sm" onClick={removeStudentsFromRoute}>
                        Remover {selectedRouteStudentIds.length} da Rota
                      </Button>
                    )}
                  </div>

                  {(extraStudents || []).length > 0 && (
                    <Card className="overflow-hidden">
                      <CardHeader className="bg-muted/50 py-3 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          Encaixes Temporários
                        </CardTitle>
                        <Badge variant="secondary">{(extraStudents || []).length}</Badge>
                      </CardHeader>
                      <div className="divide-y divide-border">
                        {(extraStudents || []).filter(student => student && student.id).map((student: Student) => {
                          const isAbsent = isStudentAbsent(student);
                          return (
                            <SafeRow key={student.id} name={`extra-student-${student.id}`}>
                              <div className={cn("p-4 flex items-center gap-4 bg-card hover:bg-muted/50 cursor-pointer transition-colors", isAbsent && "opacity-50")} onClick={() => toggleRouteStudent(student.id)}>
                                <Checkbox 
                                  checked={selectedRouteStudentIds.includes(student.id)} 
                                  onCheckedChange={() => toggleRouteStudent(student.id)} 
                                  onClick={(e) => e.stopPropagation()} 
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium", isAbsent && "line-through")}>{safeString(student.name)}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">Manifesto Extra • {getSchoolName(student.schoolId)}</p>
                                </div>
                                {isAbsent && (
                                  <Badge variant="destructive" className="text-[10px] font-bold">
                                    🚫 Falta
                                  </Badge>
                                )}
                              </div>
                            </SafeRow>
                          );
                        })}
                      </div>
                    </Card>
                  )}

                  <Card className="overflow-hidden">
                    <CardHeader className="bg-muted/50 py-3">
                      <CardTitle className="text-sm font-semibold text-muted-foreground">Manifesto Regular ({(fixedStudents || []).length})</CardTitle>
                    </CardHeader>
                    {(fixedStudents || []).length === 0 ? (
                      <div className="p-10 text-center text-muted-foreground text-sm">Nenhum aluno fixo nesta rota.</div>
                    ) : (
                      <div className="divide-y divide-border">
                        {(fixedStudents || []).filter(student => student && student.id).map((student: Student) => {
                          const isAbsent = isStudentAbsent(student);
                          return (
                            <SafeRow key={student.id} name={`fixed-student-${student.id}`}>
                              <div className={cn("p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors", isAbsent && "opacity-50")} onClick={() => toggleRouteStudent(student.id)}>
                                <Checkbox 
                                  checked={selectedRouteStudentIds.includes(student.id)} 
                                  onCheckedChange={() => toggleRouteStudent(student.id)} 
                                  onClick={(e) => e.stopPropagation()} 
                                />
                                <div className="flex-1 min-w-0">
                                  <p className={cn("text-sm font-medium", isAbsent && "line-through")}>{safeString(student.name)}</p>
                                  <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                                </div>
                                {isAbsent && (
                                  <Badge variant="destructive" className="text-[10px] font-bold">
                                    🚫 Falta
                                  </Badge>
                                )}
                              </div>
                            </SafeRow>
                          );
                        })}
                      </div>
                    )}
                  </Card>
                </>
              )}
            </TabsContent>

            {/* TAB: BUSCAR / PUXAR */}
            <TabsContent value="adicionar" className="space-y-4">
              {/* Pill Status Filters in General view */}
              {!hasActiveRoute && (
                <div className="flex flex-wrap items-center gap-2 mb-4 bg-muted/20 p-2 rounded-lg border border-border/40">
                  <span className="text-xs text-muted-foreground font-semibold px-2">Filtrar Alunos:</span>
                  <Button 
                    variant={statusFilter === 'all' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setStatusFilter('all')}
                    className={statusFilter === 'all' ? 'bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 rounded-full' : 'h-8 rounded-full text-foreground hover:bg-muted/50'}
                  >
                    Todos ({(students || []).filter(s => s && (selectedSchoolId === 'all' || s.schoolId === selectedSchoolId) && (s.shift === selectedShift || s.shift === 'Integral')).length})
                  </Button>
                  <Button 
                    variant={statusFilter === 'unallocated' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setStatusFilter('unallocated')}
                    className={statusFilter === 'unallocated' ? 'bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 rounded-full' : 'h-8 rounded-full text-foreground hover:bg-muted/50'}
                  >
                    Sem Rota ({
                      (students || []).filter(s => {
                        if (!s) return false;
                        const matchSchool = selectedSchoolId === 'all' || s.schoolId === selectedSchoolId;
                        const matchShift = s.shift === selectedShift || s.shift === 'Integral';
                        return matchSchool && matchShift && !getStudentCurrentRoute(s.id);
                      }).length
                    })
                  </Button>
                  <Button 
                    variant={statusFilter === 'allocated' ? 'default' : 'ghost'} 
                    size="sm" 
                    onClick={() => setStatusFilter('allocated')}
                    className={statusFilter === 'allocated' ? 'bg-orange-500 hover:bg-orange-600 text-white font-bold h-8 rounded-full' : 'h-8 rounded-full text-foreground hover:bg-muted/50'}
                  >
                    Já Alocados ({
                      (students || []).filter(s => {
                        if (!s) return false;
                        const matchSchool = selectedSchoolId === 'all' || s.schoolId === selectedSchoolId;
                        const matchShift = s.shift === selectedShift || s.shift === 'Integral';
                        return matchSchool && matchShift && !!getStudentCurrentRoute(s.id);
                      }).length
                    })
                  </Button>
                </div>
              )}

              <div className="flex items-center justify-between bg-card rounded-md p-4 border shadow-sm">
                <Button variant="ghost" size="sm" onClick={selectAllExtras}>
                  <CheckSquare className="w-4 h-4 mr-2" />
                  {selectedExtraStudentIds.length === (availableExtras || []).length && (availableExtras || []).length > 0 ? 'Desmarcar' : 'Selecionar Tudo'}
                </Button>
                {(selectedExtraStudentIds || []).length > 0 && (
                  (hasActiveRoute || singleRouteFromFilter) ? (
                    <Button 
                      size="sm" 
                      onClick={() => {
                        const targetRouteId = hasActiveRoute ? selectedRouteId : (singleRouteFromFilter?.id || '');
                        pullMultipleStudentsToRoute(selectedExtraStudentIds, targetRouteId);
                      }} 
                      className="bg-orange-500 hover:bg-orange-600 text-white font-bold"
                    >
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Puxar {selectedExtraStudentIds.length} para a Van {activeVehicle ? `(${activeVehicle.model})` : ''}
                    </Button>
                  ) : (
                    <Select onValueChange={(routeId) => pullMultipleStudentsToRoute(selectedExtraStudentIds, routeId)}>
                      <SelectTrigger className="w-[240px] h-9 bg-orange-500 hover:bg-orange-600 text-white font-bold border-none shadow-md shadow-orange-500/10 cursor-pointer">
                        <div className="flex items-center justify-center w-full">
                          <ArrowRightLeft className="mr-2 h-4 w-4 shrink-0" />
                          <span>Puxar {selectedExtraStudentIds.length} para a Van ▾</span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {(availableRoutes || []).filter(r => r && r.id).map(r => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.name}
                          </SelectItem>
                        ))}
                        {(availableRoutes || []).length === 0 && (
                          <div className="p-3 text-xs text-muted-foreground text-center">Nenhuma rota disponível</div>
                        )}
                      </SelectContent>
                    </Select>
                  )
                )}
              </div>

              <Card className="overflow-hidden">
                <CardHeader className="bg-muted/50 py-3">
                  <CardTitle className="text-sm font-semibold text-muted-foreground">Alunos Disponíveis</CardTitle>
                </CardHeader>
                {(availableExtras || []).length === 0 ? (
                  <div className="p-16 text-center text-muted-foreground">
                    <Info className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">Nenhum aluno disponível</p>
                    <p className="text-xs mt-1">Tente ajustar os filtros ou mudar o status das pílulas.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {(availableExtras || []).filter(student => student && student.id).map((student: Student) => {
                      const currentRoute = getStudentCurrentRoute(student.id);
                      const isAbsent = isStudentAbsent(student);
                      const isExtra = hasApprovedTripRequestToday(student.id);
                      return (
                        <SafeRow key={student.id} name={`available-extra-${student.id}`}>
                          <div className={cn("p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors", isAbsent && "opacity-50")} onClick={() => toggleExtraStudent(student.id)}>
                            <Checkbox 
                              checked={selectedExtraStudentIds.includes(student.id)} 
                              onCheckedChange={() => toggleExtraStudent(student.id)} 
                              onClick={(e) => e.stopPropagation()} 
                            />
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-sm font-medium", isAbsent && "line-through")}>{safeString(student.name)}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                            </div>
                            {isAbsent && (
                              <Badge variant="destructive" className="text-[10px] font-bold mr-2">
                                🚫 Falta
                              </Badge>
                            )}
                            {isExtra && (
                              <Badge variant="outline" className="text-[10px] font-bold border-amber-500 text-amber-500 bg-amber-500/5 mr-2">
                                ✨ Avulso (Aprovado)
                              </Badge>
                            )}
                            {currentRoute ? (
                              <Badge variant="outline" className="text-xs font-bold border-orange-500/30 text-orange-500 bg-orange-500/5">
                                {currentRoute.name}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs font-semibold text-muted-foreground bg-muted">
                                Sem Rota
                              </Badge>
                            )}
                          </div>
                        </SafeRow>
                      );
                    })}
                  </div>
                )}
              </Card>
            </TabsContent>
          </Tabs>

          {/* STICKY BOTTOM SAVE ACTION BAR */}
          {isDirty && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-300 ease-out">
              <div className="bg-background/80 backdrop-blur-md border border-orange-500/30 rounded-xl p-4 shadow-[0_10px_30px_-10px_rgba(249,115,22,0.3)] flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 animate-pulse">
                    <Info className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Alterações Não Publicadas</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {modifiedRoutesList.length > 0 ? (
                        <>Edições pendentes em: <span className="font-semibold text-orange-500">{modifiedRoutesList.join(', ')}</span></>
                      ) : (
                        'Você possui manifestos modificados na memória local.'
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={discardChanges} 
                    disabled={isPublishing}
                    className="border-border text-foreground hover:bg-muted/50 font-medium"
                  >
                    Descartar
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={publishItinerary} 
                    disabled={isPublishing}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/10 min-w-[150px] flex items-center justify-center gap-2"
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Publicar Itinerário'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      ))}
    </div>
  );
}
