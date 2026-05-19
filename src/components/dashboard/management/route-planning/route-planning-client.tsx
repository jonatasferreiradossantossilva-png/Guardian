'use client';

import { useState, useMemo, useEffect } from 'react';
import { Route, Student, RouteManifest, TripRequest, Driver } from '@/types/mock-data';
import { useData, useDataCollection } from '@/hooks/use-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Bus, User as UserIcon, ArrowRightLeft, School, UserPlus, Truck, Info, CheckSquare, Users } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function RoutePlanningClient() {
  const { data: routes } = useDataCollection<Route>('routes');
  const { data: students } = useDataCollection<Student>('students');
  const { data: routeManifests } = useDataCollection<RouteManifest>('route_manifests');
  const { data: schools } = useDataCollection<any>('schools');
  const { data: vehicles } = useDataCollection<any>('vehicles');
  const { data: drivers } = useDataCollection<Driver>('drivers');

  const { addDoc, updateDoc } = useData();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<'Manhã' | 'Tarde' | 'Integral'>('Manhã');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
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

  // Auto-select first route ONLY if selectedRouteId is empty and they haven't explicitly chosen 'none'
  useEffect(() => {
    if (selectedRouteId === 'none') return;
    
    const exists = (availableRoutes || []).some(r => r.id === selectedRouteId);
    if (!exists && (availableRoutes || []).length > 0 && selectedRouteId !== '') {
      setSelectedRouteId(availableRoutes[0].id);
    }
  }, [availableRoutes, selectedRouteId]);

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
      if (m.date === dateStr && m.direction === selectedDirection) {
        if (m.studentIds.includes(studentId)) {
          const r = (routes || []).find(route => route.id === m.routeId);
          if (r) return { id: r.id, name: r.name };
        }
      }
    }

    // 2. Check DB manifests
    const dbManifest = (routeManifests || []).find(m => 
      m && m.date === dateStr && m.direction === selectedDirection && m.studentIds.includes(studentId)
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
      m.date === dateStr &&
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
    console.log("PLANNER DEBUG - vehicleRoutes hook:", { selectedVehicleId, routesCount: routes?.length, driversCount: drivers?.length });
    if (selectedVehicleId === 'all') return [];
    const driverIds = (drivers || []).filter(d => d && d.vehicleId === selectedVehicleId).map(d => d.id);
    const filtered = (routes || []).filter(r => r && driverIds.includes(r.driverId));
    console.log("PLANNER DEBUG - vehicleRoutes filtered:", filtered.map(r => r.name));
    return filtered;
  }, [routes, selectedVehicleId, drivers]);

  // Calculate students inside this selected vehicle's routes
  const vehicleStudents = useMemo(() => {
    console.log("PLANNER DEBUG - vehicleStudents hook:", { selectedVehicleId, vehicleRoutesCount: vehicleRoutes.length });
    if (selectedVehicleId === 'all') return [];
    const studentsList: Student[] = [];
    vehicleRoutes.forEach(r => {
      const manifestId = `manifest_${r.id}_${dateStr}_${selectedDirection}`;
      const manifest = localManifests[manifestId] || (routeManifests || []).find(m => 
        m && m.routeId === r.id && m.date === dateStr && m.direction === selectedDirection
      );
      const studentIds = manifest ? manifest.studentIds : (r.baseStudentIds || r.studentIds || []);
      console.log(`PLANNER DEBUG - vehicleStudents processing route ${r.name}:`, { manifestId, hasManifest: !!manifest, studentIds });
      studentIds.forEach(id => {
        const student = (students || []).find(s => s && s.id === id);
        if (student && !studentsList.some(s => s.id === student.id)) {
          studentsList.push(student);
        }
      });
    });
    console.log("PLANNER DEBUG - vehicleStudents resolved list:", studentsList.map(s => s.name));
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
  const pullMultipleStudentsToRoute = (studentIds: string[], targetRouteId: string) => {
    const targetRoute = (routes || []).find(r => r.id === targetRouteId);
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
            m && m.routeId === currentRoute.id && m.date === dateStr && m.direction === selectedDirection
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
          m && m.routeId === targetRouteId && m.date === dateStr && m.direction === selectedDirection
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
        pullMultipleStudentsToRoute(selectedExtraStudentIds, newRouteId);
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
    const newIds = (activeManifestData.manifest.studentIds || []).filter(id => !selectedRouteStudentIds.includes(id));
    
    updateLocalManifest(newIds);
    setSelectedRouteStudentIds([]);
  };

  const discardChanges = () => {
    setLocalManifests({});
    setSelectedRouteStudentIds([]);
    setSelectedExtraStudentIds([]);
  };

  const publishItinerary = async () => {
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
    } catch (error) {
      console.error("Erro ao salvar os itinerários:", error);
      setToastMessage("Erro ao publicar itinerários.");
    }
  };

  const getSchoolName = (schoolId: string) => {
    if (!schoolId) return 'Sem Escola';
    const school = (schools || []).find(s => s && s.id === schoolId);
    return school ? school.name : 'Escola não encontrada';
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
                  {(schools || []).filter(s => s && s.id).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                  <SelectItem value="Integral">Integral</SelectItem>
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
                  {(vehicles || []).filter(v => v && v.id).map(v => <SelectItem key={v.id} value={v.id}>{v.model}</SelectItem>)}
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
                  {(availableRoutes || []).filter(r => r && r.id).map(r => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
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
                          <div key={student.id} className="p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                            </div>
                            {currentRoute && (
                              <Badge variant="outline" className="text-xs font-bold border-orange-500/30 text-orange-500 bg-orange-500/5">
                                {currentRoute.name}
                              </Badge>
                            )}
                          </div>
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
                    {(extraStudents || []).filter(student => student && student.id).map((student: Student) => (
                      <div key={student.id} className="p-4 flex items-center gap-4 bg-card hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleRouteStudent(student.id)}>
                        <Checkbox checked={selectedRouteStudentIds.includes(student.id)} onCheckedChange={() => {}} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Manifesto Extra • {getSchoolName(student.schoolId)}</p>
                        </div>
                      </div>
                    ))}
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
                    {(fixedStudents || []).filter(student => student && student.id).map((student: Student) => (
                      <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleRouteStudent(student.id)}>
                        <Checkbox checked={selectedRouteStudentIds.includes(student.id)} onCheckedChange={() => {}} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{student.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                        </div>
                      </div>
                    ))}
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
                  return (
                    <div key={student.id} className="p-4 flex items-center gap-4 hover:bg-muted/50 cursor-pointer transition-colors" onClick={() => toggleExtraStudent(student.id)}>
                      <Checkbox checked={selectedExtraStudentIds.includes(student.id)} onCheckedChange={() => {}} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{student.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{student.shift} • {getSchoolName(student.schoolId)}</p>
                      </div>
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
              <Button variant="outline" size="sm" onClick={discardChanges} className="border-border text-foreground hover:bg-muted/50 font-medium">
                Descartar
              </Button>
              <Button size="sm" onClick={publishItinerary} className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md shadow-orange-500/10">
                Publicar Itinerário
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
