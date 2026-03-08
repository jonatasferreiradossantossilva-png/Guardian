'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMockData } from '@/hooks/use-mock-data';
import { Users, AlertCircle, X, PlusCircle, School, Info, ArrowUp, ArrowDown, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';


type Driver = { id: string; name: string; vehicleId?: string; latitude?: number; longitude?: number; };
type Student = { id: string; name: string; shift: string; active?: boolean; schoolId: string; serie?: string; turma?: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string; latitude?: number; longitude?: number; };
type Monitor = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };
type SchoolData = { id: string; name: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string; latitude?: number; longitude?: number; };
type Route = { id: string; studentIds?: string[]; name?: string; driverId?: string; monitorId?: string; shift?: 'Manhã' | 'Tarde'; lastOptimizedAt?: string; polyline?: string; };
type Stop = { id: string; type: 'student' | 'school'; name: string, details?: string };


interface RouteFormProps {
  route?: Route;
  allRoutes: Route[];
  drivers: Driver[];
  students: Student[];
  monitors: Monitor[];
  vehicles: Vehicle[];
  schools: SchoolData[];
  onFormSubmit: () => void;
}

const getAbbreviatedClass = (student: Student | null | undefined) => {
    if (!student?.serie) return null;
    const seriePart = student.serie.replace(/\s*ano/i, '').trim();
    return [seriePart, student.turma].filter(Boolean).join(' ');
};

export function RouteForm({
  route,
  allRoutes,
  drivers,
  students,
  monitors,
  vehicles,
  schools,
  onFormSubmit,
}: RouteFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  
  const [name, setName] = useState(route?.name || '');
  const [driverId, setDriverId] = useState(route?.driverId || '');
  const [monitorId, setMonitorId] = useState(route?.monitorId || '');
  const [shift, setShift] = useState<'Manhã' | 'Tarde' | ''>(route?.shift || '');
  const [polyline, setPolyline] = useState(route?.polyline || '');

  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [errors, setErrors] = useState<{name?: string, driverId?: string, schoolIds?: string, shift?: string}>({});
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isOptimized, setIsOptimized] = useState(false);
  
  const [isInitializing, setIsInitializing] = useState(true);
  const prevSchoolIdsRef = useRef<string[]>([]);


  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const schoolsMap = useMemo(() => new Map(schools.map(s => [s.id, s])), [schools]);
  const driversMap = useMemo(() => new Map(drivers.map(d => [d.id, d])), [drivers]);

 useEffect(() => {
    setIsInitializing(true);
    const initialStops: Stop[] = [];
    const initialSchoolIds = new Set<string>();

    route?.studentIds?.forEach(stopId => {
        const student = studentsMap.get(stopId);
        const school = schoolsMap.get(stopId);

        if (student) {
            initialStops.push({ id: stopId, type: 'student', name: student.name, details: schoolsMap.get(student.schoolId)?.name });
            initialSchoolIds.add(student.schoolId);
        } else if (school) {
            initialStops.push({ id: stopId, type: 'school', name: school.name, details: 'Ponto de desembarque' });
            initialSchoolIds.add(stopId);
        }
    });
    setStops(initialStops);
    const schoolIdArray = Array.from(initialSchoolIds);
    setSelectedSchoolIds(schoolIdArray);
    prevSchoolIdsRef.current = schoolIdArray;
    setIsOptimized(!!route?.lastOptimizedAt);
    setIsInitializing(false);
}, [route, studentsMap, schoolsMap]);


  const { vehicle, vehicleCapacity } = useMemo(() => {
     if (!driverId || !drivers || !vehicles) return { vehicle: null, vehicleCapacity: Infinity };
     const driver = drivers.find(d => d.id === driverId);
     if (!driver?.vehicleId) return { vehicle: null, vehicleCapacity: Infinity };
     const vehicle = vehicles.find(v => v.id === driver.vehicleId);
     if (!vehicle) return { vehicle: null, vehicleCapacity: Infinity };
     return { vehicle, vehicleCapacity: vehicle.capacity };
  }, [driverId, drivers, vehicles]);

  const assignedStudentsInOtherRoutes = useMemo(() => {
    const studentIdSet = new Set<string>();
    if (!shift || !allRoutes) return studentIdSet;

    for (const r of allRoutes) {
        if (r.id === route?.id) continue;
        if (r.shift === shift) {
            r.studentIds?.forEach(id => {
                const student = studentsMap.get(id);
                if (student) {
                    studentIdSet.add(id);
                }
            });
        }
    }
    return studentIdSet;
  }, [allRoutes, shift, route, studentsMap]);


  const { isCapacityExceeded, availableStudents, studentsOnRoute } = useMemo(() => {
    const currentStudentIds = new Set(stops.filter(s => s.type === 'student').map(s => s.id));
    const studentsOnRoute = stops
      .filter(stop => stop.type === 'student')
      .map(stop => studentsMap.get(stop.id))
      .filter(Boolean) as Student[];

    const isExceeded = studentsOnRoute.length > vehicleCapacity;

    let filteredAvailableStudents = [];
    if (selectedSchoolIds.length > 0 && shift) {
        filteredAvailableStudents = students.filter(s => {
            if (!selectedSchoolIds.includes(s.schoolId)) return false;
            if (assignedStudentsInOtherRoutes.has(s.id)) return false;
            if (currentStudentIds.has(s.id)) return false;
            
            const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
            const isCompatibleShift = s.shift === 'Integral' || s.shift === shift;

            return s.active !== false && matchesSearch && isCompatibleShift;
        });
    }

    return { isCapacityExceeded: isExceeded, availableStudents: filteredAvailableStudents, studentsOnRoute: studentsOnRoute };
  }, [stops, students, studentSearch, vehicleCapacity, selectedSchoolIds, shift, assignedStudentsInOtherRoutes, studentsMap]);
    
    const moveStop = (index: number, direction: 'up' | 'down') => {
        setStops(currentStops => {
            const newStops = [...currentStops];
            const to = direction === 'up' ? index - 1 : index + 1;
            if (to < 0 || to >= newStops.length) {
                return newStops;
            }
            const [movedItem] = newStops.splice(index, 1);
            newStops.splice(to, 0, movedItem);
            return newStops;
        });
        setIsOptimized(false);
    };

  const addStop = (stop: Stop) => {
    if (stop.type === 'student' && studentsOnRoute.length >= vehicleCapacity) {
      toast({
        title: "Capacidade do veículo excedida!",
        description: `A rota não pode ter mais de ${vehicleCapacity} alunos para este veículo.`,
        variant: "destructive",
      });
      return;
    }
    setStops((prev) => [...prev, stop]);
    setIsOptimized(false);
  };
  
  const handleAddSchoolToRoute = (schoolId: string) => {
    const school = schoolsMap.get(schoolId);
    if (school) {
        if (stops.some(stop => stop.type === 'school' && stop.id === schoolId)) {
            toast({
                title: "Escola já está no itinerário",
                variant: "destructive"
            });
            return;
        }
        addStop({id: schoolId, type: 'school', name: school.name, details: 'Ponto de desembarque'});
    }
  }

  const removeStop = (index: number) => {
    const stopToRemove = stops[index];
    if (stopToRemove.type === 'school') {
        const isSchoolInUse = stops.some(s => {
            if (s.type !== 'student') return false;
            const student = studentsMap.get(s.id);
            return student?.schoolId === stopToRemove.id;
        });

        if (isSchoolInUse) {
            toast({
                title: "Ação não permitida",
                description: "Você não pode remover uma escola do itinerário enquanto houver alunos dela na rota.",
                variant: "destructive",
            });
            return;
        }
    }
    setStops(prev => prev.filter((_, i) => i !== index));
    setIsOptimized(false);
  }

  const handleAddStudentsBySchool = async (schoolId: string) => {
    setIsOptimized(false);
    const currentStudentCount = stops.filter(s => s.type === 'student').length;
    const availableSpots = vehicleCapacity - currentStudentCount;

    if (availableSpots <= 0) {
        toast({ title: "Capacidade máxima atingida", description: "Não há mais vagas no veículo.", variant: "destructive" });
        return;
    }

    const currentStudentIds = new Set(stops.map(s => s.id));
    const studentsForSchool = students.filter(s => 
        s.schoolId === schoolId && 
        !currentStudentIds.has(s.id) &&
        s.active !== false
    );
    
    const studentsToAdd = studentsForSchool
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, availableSpots);

    if (studentsToAdd.length === 0) {
        toast({ title: "Nenhum aluno a adicionar", description: "Todos os alunos disponíveis desta escola já estão na rota.", variant: "default" });
        return;
    }

    const newStudentStops: Stop[] = studentsToAdd.map(s => ({
        id: s.id,
        type: 'student',
        name: s.name,
        details: schoolsMap.get(s.schoolId)?.name
    }));

    const updatedStops = [...stops, ...newStudentStops];
    setStops(updatedStops);
  };

  useEffect(() => {
    if (isInitializing) {
        return;
    }
    
    const prevIds = prevSchoolIdsRef.current || [];
    const currentIdsSet = new Set(selectedSchoolIds);

    const hasChanged = selectedSchoolIds.length !== prevIds.length || prevIds.some(id => !currentIdsSet.has(id));

    if (hasChanged) {
        setIsOptimized(false);
        
        const removedSchoolIds = prevIds.filter(id => !currentIdsSet.has(id));
      
        if (removedSchoolIds.length > 0) {
            setStops(currentStops => {
                return currentStops.filter(stop => {
                    if (stop.type === 'student') {
                        const student = studentsMap.get(stop.id);
                        return !(student && removedSchoolIds.includes(student.schoolId));
                    }
                    if (stop.type === 'school') {
                        return !removedSchoolIds.includes(stop.id);
                    }
                    return true;
                });
            });
        }
    }
    
    prevSchoolIdsRef.current = selectedSchoolIds;
  }, [selectedSchoolIds, isInitializing, studentsMap]);


  const handleOptimizeOrder = async () => {
    if (studentsOnRoute.length < 2) {
      toast({
        title: "Otimização não aplicável",
        description: "A otimização por IA requer pelo menos dois alunos na rota.",
        variant: "destructive",
      });
      return;
    }
    setIsOptimizing(true);
    try {
        const schoolsOnRoute = selectedSchoolIds.map(id => schoolsMap.get(id)).filter(Boolean) as SchoolData[];
        const driver = drivers.find(d => d.id === driverId);

        if (schoolsOnRoute.length === 0 || !driver) {
            throw new Error("Dados da escola ou motorista não encontrados.");
        }

        const formatAddress = (entity: Student | SchoolData | null) => {
            if (!entity?.street) return 'Endereço indisponível';
            return `${entity.street}, ${entity.number}, ${entity.neighborhood}, ${entity.city} - ${entity.state}`;
        };

        const studentInput = studentsOnRoute.map(s => ({
            id: s.id,
            name: s.name,
            address: formatAddress(s),
            schoolId: s.schoolId,
        }));
        
        const schoolsInput = schoolsOnRoute.map(s => ({
            id: s.id,
            name: s.name,
            address: formatAddress(s)
        }));

        const result = await optimizeSchoolVanRoute({
            students: studentInput,
            schools: schoolsInput,
            startAddress: (driver.latitude && driver.longitude) ? `${driver.latitude},${driver.longitude}` : undefined,
            vehicleCapacity: vehicleCapacity,
            optimizationMode: 'safe' as 'safe',
            direction: 'ida' as 'ida',
        });
        
        const newOptimizedStops = result.optimizedStops.map(stop => {
            const student = studentsMap.get(stop.id);
            const school = schoolsMap.get(stop.id);
            
            if (student) return { id: stop.id, type: 'student', name: student.name, details: schoolsMap.get(student.schoolId)?.name };
            if (school) return { id: stop.id, type: 'school', name: school.name, details: 'Ponto de desembarque/embarque' };
            
            return null;
        }).filter(Boolean) as Stop[];
        
        const waypoints = newOptimizedStops.map(stop => {
            const entity = stop.type === 'student' ? studentsMap.get(stop.id) : schoolsMap.get(stop.id);
            if (entity?.latitude && entity?.longitude) {
                return { lat: entity.latitude, lng: entity.longitude };
            }
            return null;
        }).filter(Boolean) as { lat: number, lng: number }[];

        if (waypoints.length >= 2) {
            const routingResult = await routingGeoapify({ waypoints });
            setPolyline(routingResult.polyline);
        }

        setStops(newOptimizedStops);
        setIsOptimized(true);

        toast({
            title: "Ordem da rota otimizada!",
            description: "A IA sugeriu uma nova sequência e o traçado visual foi gerado.",
        });

    } catch (error) {
        console.error("Failed to optimize route order:", error);
        toast({
            title: "Erro na Otimização",
            description: "Não foi possível obter uma sugestão completa. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsOptimizing(false);
    }
  };
  
  const handleSubmit = () => {
    const newErrors: {name?: string, driverId?: string, schoolIds?: string, shift?: string} = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!driverId) newErrors.driverId = 'Selecione um motorista.';
    if (selectedSchoolIds.length === 0) newErrors.schoolIds = 'Selecione pelo menos uma escola.';
    if (!shift) newErrors.shift = 'Selecione um turno para a rota.';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    const finalData: Partial<Route> & { name: string; driverId: string; shift: 'Manhã' | 'Tarde' } = {
        name,
        driverId,
        monitorId: monitorId === 'none' ? '' : monitorId,
        studentIds: stops.map(s => s.id), 
        shift,
        polyline,
    };
    
    if (isOptimized) {
        finalData.lastOptimizedAt = new Date().toISOString();
    }
    
    if (route) {
      if (!isOptimized) {
          finalData.lastOptimizedAt = '';
      }
      updateDoc('routes', route.id, finalData);
      toast({ title: 'Rota atualizada!', description: `A rota ${finalData.name} foi atualizada.` });
    } else {
      addDoc('routes', finalData);
      toast({ title: 'Rota adicionada!', description: `A rota ${finalData.name} foi adicionada ao sistema.` });
    }
    onFormSubmit();
  };

  const handleDriverChange = (newDriverId: string) => {
    setDriverId(newDriverId);
    setIsOptimized(false);
  };

  const handleShiftChange = (newShift: 'Manhã' | 'Tarde' | '') => {
    setShift(newShift);
    setIsOptimized(false);
    setStops([]);
    setSelectedSchoolIds([]);
  };
  
  return (
    <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{route ? 'Editar Rota' : 'Adicionar Rota'}</DialogTitle>
        <DialogDescription>
          Preencha as informações, adicione escolas, e monte o itinerário da rota.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="routeName">Nome da Rota</Label>
                    <Input id="routeName" placeholder="Ex: Rota Matinal - Escolas A e B" value={name} onChange={(e) => setName(e.target.value)} />
                    {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="shiftId">Turno da Rota</Label>
                        <Select onValueChange={(v) => handleShiftChange(v as 'Manhã' | 'Tarde')} value={shift}>
                            <SelectTrigger id="shiftId"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Manhã">Manhã</SelectItem>
                                <SelectItem value="Tarde">Tarde</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.shift && <p className="text-sm font-medium text-destructive">{errors.shift}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="driverId">Motorista</Label>
                        <Select onValueChange={handleDriverChange} value={driverId}>
                            <SelectTrigger id="driverId"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                            <SelectContent>{drivers.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                        </Select>
                        {vehicle && <p className="text-[10px] text-muted-foreground">Veículo: {vehicle.model} (Cap: {vehicle.capacity})</p>}
                        {errors.driverId && <p className="text-sm font-medium text-destructive">{errors.driverId}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="monitorId">Monitor (Opcional)</Label>
                    <Select onValueChange={setMonitorId} value={monitorId || 'none'}>
                        <SelectTrigger id="monitorId"><SelectValue placeholder="Selecione um monitor" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {monitors.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                        </SelectContent>
                    </Select>
                </div>
                
                <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs font-bold uppercase text-primary">Escolas Atendidas</Label>
                    <div className="space-y-2 rounded-md border p-3 max-h-32 overflow-y-auto bg-muted/20">
                        {schools.length > 0 ? (
                            schools.map(school => (
                                <div key={school.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`school-${school.id}`}
                                        checked={selectedSchoolIds.includes(school.id)}
                                        onCheckedChange={(checked) => {
                                            setSelectedSchoolIds(prev =>
                                                checked
                                                    ? [...prev, school.id]
                                                    : prev.filter(id => id !== school.id)
                                            );
                                        }}
                                    />
                                    <label
                                        htmlFor={`school-${school.id}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        {school.name}
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">Nenhuma escola cadastrada.</p>
                        )}
                    </div>
                    {errors.schoolIds && <p className="text-sm font-medium text-destructive">{errors.schoolIds}</p>}
                </div>

                <div className="space-y-2 border-t pt-4">
                    <Label className="text-xs font-bold uppercase text-primary">Alunos Disponíveis</Label>
                    <div className="border rounded-md overflow-hidden bg-background">
                        <div className="p-2 border-b bg-muted/30">
                            <Input placeholder="Buscar aluno..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="h-8 border-none focus-visible:ring-0 shadow-none bg-transparent"/>
                        </div>
                        <div>
                            {!selectedSchoolIds.length || !shift ? (
                                <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                                    <School className="h-6 w-6 mb-2 opacity-30"/>
                                    <p className="text-xs font-semibold">Selecione escolas e turno primeiro</p>
                                </div>
                            ) : (
                                <div className="h-48 overflow-y-auto">
                                    {availableStudents.length > 0 ? (
                                        Object.entries(
                                            availableStudents.reduce((acc, student) => {
                                                const schoolName = schoolsMap.get(student.schoolId)?.name || 'Outra';
                                                if (!acc[schoolName]) acc[schoolName] = [];
                                                acc[schoolName].push(student);
                                                return acc;
                                            }, {} as Record<string, Student[]>)
                                        ).map(([schoolName, students]) => {
                                            const schoolId = students[0]?.schoolId;
                                            return(
                                                <div key={schoolName}>
                                                    <div className="flex justify-between items-center px-2 py-1 bg-secondary/50 border-y">
                                                        <h4 className="font-bold text-[10px] text-muted-foreground uppercase">{schoolName}</h4>
                                                        {schoolId && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 text-[10px] hover:text-primary"
                                                                onClick={() => handleAddStudentsBySchool(schoolId)}
                                                                disabled={isOptimizing}
                                                            >
                                                                Add Todos
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {students.map(s => {
                                                        const studentWithClass = getAbbreviatedClass(s);
                                                        return (
                                                            <div key={s.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/50 border-b last:border-0">
                                                                <div className="flex-grow flex items-center gap-2 min-w-0">
                                                                    <p className="font-medium text-xs truncate">{s.name}</p>
                                                                    {studentWithClass && <span className="text-[10px] text-muted-foreground">({studentWithClass})</span>}
                                                                </div>
                                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => addStop({id: s.id, type: 'student', name: s.name, details: schoolName})}>
                                                                    <PlusCircle className="h-4 w-4 text-primary" />
                                                                </Button>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )
                                        })
                                    ) : <p className="p-8 text-center text-xs text-muted-foreground">Nenhum aluno compatível.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                    <div>
                        <Label className="text-sm font-bold flex items-center gap-2">
                            Itinerário ({stops.length} paradas)
                        </Label>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold">Ordem de execução da van</p>
                    </div>
                    <Button type="button" size="sm" variant="default" onClick={handleOptimizeOrder} disabled={isOptimizing || studentsOnRoute.length < 2 || isOptimized} className="h-9 font-bold bg-primary text-white">
                        {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Otimizar IA
                    </Button>
                </div>

                <div className="border-2 border-dashed rounded-lg bg-background overflow-hidden">
                    <ScrollArea className="h-[32rem] p-3">
                        {stops.length > 0 ? (
                            <div className="space-y-2">
                            {stops.map((stop, index) => (
                                    <div key={`${stop.id}-${index}`} className="grid grid-cols-[auto_1fr_auto] items-center w-full bg-muted/20 border rounded-md p-2 hover:bg-accent/50 gap-3 transition-colors">
                                        <span className="w-5 flex-shrink-0 text-[10px] font-black text-muted-foreground flex items-center justify-center h-5 bg-background rounded border">{index + 1}</span>

                                        <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 min-w-0">
                                            <div className="row-span-2 self-center">
                                                {stop.type === 'student' ? (
                                                    <Avatar className="h-9 w-9 border shadow-sm">
                                                        <AvatarImage src={`https://picsum.photos/seed/student-${stop.id}/40/40`} alt={stop.name} />
                                                        <AvatarFallback>{stop.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                ) : (
                                                    <div className="flex items-center justify-center h-9 w-9 rounded-full bg-destructive/10 text-destructive border-2 border-destructive/20 flex-shrink-0">
                                                        <School className="h-5 w-5" />
                                                    </div>
                                                )}
                                            </div>
                                            <p className="font-bold text-xs truncate col-start-2">{stop.name.toUpperCase()}</p>
                                            <p className="text-[10px] text-muted-foreground truncate col-start-2 uppercase font-medium">
                                                {stop.details}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0">
                                            <div className="flex flex-col">
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStop(index, 'up')} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                            </div>
                                            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 text-destructive" onClick={() => removeStop(index)}><X className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                                <Users className="h-8 w-8 mb-2 opacity-20"/>
                                <p className="text-xs font-bold uppercase tracking-widest">Seu itinerário está vazio</p>
                            </div>
                        )}
                    </ScrollArea>
                    <div className="p-3 border-t bg-muted/10">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full h-10 font-bold border-dashed">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Parada Escolar
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-[300px]">
                                {selectedSchoolIds.map(schoolId => schoolsMap.get(schoolId)).filter(Boolean).map(school => (
                                    <DropdownMenuItem key={school.id} onSelect={() => handleAddSchoolToRoute(school.id)} className="text-xs">
                                        <School className="mr-2 h-3 w-3" /> {school.name}
                                    </DropdownMenuItem>
                                ))}
                                {selectedSchoolIds.length === 0 && <DropdownMenuItem disabled className="text-xs italic">Selecione uma escola no formulário</DropdownMenuItem>}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background flex flex-col sm:flex-row gap-3">
        <DialogClose asChild>
            <Button type="button" variant="ghost" className="w-full sm:w-auto h-12 px-8">Cancelar</Button>
        </DialogClose>
        <Button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isCapacityExceeded || isOptimizing}
            className="w-full sm:flex-1 h-12 text-lg font-black shadow-xl"
        >
            SALVAR ROTA COMPLETA
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
