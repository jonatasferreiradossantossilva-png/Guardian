
'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { useMockData } from '@/hooks/use-mock-data';
import { Users, School, ArrowUp, ArrowDown, Sparkles, Loader2, X, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';
import { cn } from '@/lib/utils';

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

  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const schoolsMap = useMemo(() => new Map(schools.map(s => [s.id, s])), [schools]);

  useEffect(() => {
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
    setSelectedSchoolIds(Array.from(initialSchoolIds));
    setIsOptimized(!!route?.lastOptimizedAt);
  }, [route, studentsMap, schoolsMap]);

  const { vehicleCapacity } = useMemo(() => {
     const driver = drivers.find(d => d.id === driverId);
     const v = vehicles.find(v => v.id === driver?.vehicleId);
     return { vehicleCapacity: v?.capacity || Infinity };
  }, [driverId, drivers, vehicles]);

  const assignedStudentsInOtherRoutes = useMemo(() => {
    const studentIdSet = new Set<string>();
    if (!shift || !allRoutes) return studentIdSet;
    for (const r of allRoutes) {
        if (r.id === route?.id) continue;
        if (r.shift === shift) {
            r.studentIds?.forEach(id => { if (studentsMap.has(id)) studentIdSet.add(id); });
        }
    }
    return studentIdSet;
  }, [allRoutes, shift, route, studentsMap]);

  const { availableStudents, studentsOnRoute } = useMemo(() => {
    const currentStudentIds = new Set(stops.filter(s => s.type === 'student').map(s => s.id));
    const studentsOnRoute = stops.filter(s => s.type === 'student').map(s => studentsMap.get(s.id)).filter(Boolean) as Student[];
    
    let filtered = [];
    if (selectedSchoolIds.length > 0 && shift) {
        filtered = students.filter(s => {
            if (!selectedSchoolIds.includes(s.schoolId)) return false;
            if (assignedStudentsInOtherRoutes.has(s.id)) return false;
            if (currentStudentIds.has(s.id)) return false;
            return s.active !== false && s.name.toLowerCase().includes(studentSearch.toLowerCase()) && (s.shift === 'Integral' || s.shift === shift);
        });
    }
    return { availableStudents: filtered, studentsOnRoute };
  }, [stops, students, studentSearch, selectedSchoolIds, shift, assignedStudentsInOtherRoutes, studentsMap]);

  const handleOptimizeOrder = async () => {
    if (studentsOnRoute.length < 2) return;
    setIsOptimizing(true);
    try {
        const schoolsOnRoute = selectedSchoolIds.map(id => schoolsMap.get(id)).filter(Boolean) as SchoolData[];
        const driver = drivers.find(d => d.id === driverId);
        const formatAddress = (e: any) => e?.street ? `${e.street}, ${e.number}, ${e.neighborhood}, ${e.city} - ${e.state}` : 'Endereço indisponível';

        const result = await optimizeSchoolVanRoute({
            students: studentsOnRoute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s), schoolId: s.schoolId })),
            schools: schoolsOnRoute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) })),
            startAddress: (driver?.latitude && driver?.longitude) ? `${driver.latitude},${driver.longitude}` : undefined,
            vehicleCapacity,
            direction: 'ida',
            optimizationMode: 'safe'
        });
        
        const newStops = result.optimizedStops.map(stop => {
            const student = studentsMap.get(stop.id);
            const school = schoolsMap.get(stop.id);
            if (student) return { id: stop.id, type: 'student' as const, name: student.name, details: schoolsMap.get(student.schoolId)?.name };
            if (school) return { id: stop.id, type: 'school' as const, name: school.name, details: 'Ponto de desembarque' };
            return null;
        }).filter(Boolean) as Stop[];
        
        const waypoints = newStops.map(s => {
            const e = s.type === 'student' ? studentsMap.get(s.id) : schoolsMap.get(s.id);
            return e?.latitude ? { lat: e.latitude, lng: e.longitude } : null;
        }).filter(Boolean) as any[];

        if (waypoints.length >= 2) {
            const routing = await routingGeoapify({ waypoints });
            setPolyline(routing.polyline);
        }

        setStops(newStops);
        setIsOptimized(true);
        toast({ title: "Ordem otimizada via IA!" });
    } catch (e) { toast({ title: "Erro na otimização", variant: "destructive" }); } finally { setIsOptimizing(false); }
  };

  const handleSubmit = () => {
    if (!name.trim() || !driverId || !selectedSchoolIds.length || !shift) {
        setErrors({ name: !name.trim() ? 'Obrigatório' : '', driverId: !driverId ? 'Obrigatório' : '', schoolIds: !selectedSchoolIds.length ? 'Selecione uma escola' : '', shift: !shift ? 'Obrigatório' : '' });
        return;
    }
    const finalData = { name, driverId, monitorId: monitorId === 'none' ? '' : monitorId, studentIds: stops.map(s => s.id), shift, polyline, lastOptimizedAt: isOptimized ? new Date().toISOString() : '' };
    if (route) updateDoc('routes', route.id, finalData); else addDoc('routes', finalData);
    toast({ title: route ? 'Rota atualizada!' : 'Rota adicionada!' });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-background z-20">
        <DialogTitle>Montar Itinerário</DialogTitle>
        <DialogDescription>Defina os parâmetros e adicione os alunos. O botão de salvar está ao final da lista.</DialogDescription>
      </DialogHeader>
      
      {/* Área de Scroll Principal - Agora usando overflow-y-auto nativo para evitar travamentos */}
      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Coluna 1: Configuração e Alunos Disponíveis */}
                <div className="space-y-6">
                    <div className="space-y-4 bg-muted/20 p-4 rounded-lg border border-dashed">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Dados da Rota</Label>
                            <Input placeholder="Nome da Rota" value={name} onChange={e => setName(e.target.value)} className="bg-background" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Turno</Label>
                                <Select onValueChange={v => setShift(v as any)} value={shift}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Motorista</Label>
                                <Select onValueChange={setDriverId} value={driverId}>
                                    <SelectTrigger className="bg-background"><SelectValue placeholder="Escolha" /></SelectTrigger>
                                    <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">1. Escolas Atendidas</Label>
                        <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-background">
                            {schools.map(school => (
                                <div key={school.id} className="flex items-center space-x-2">
                                    <Checkbox 
                                        id={`sch-${school.id}`} 
                                        checked={selectedSchoolIds.includes(school.id)} 
                                        onCheckedChange={checked => setSelectedSchoolIds(prev => checked ? [...prev, school.id] : prev.filter(id => id !== school.id))} 
                                    />
                                    <Label htmlFor={`sch-${school.id}`} className="text-xs cursor-pointer">{school.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">2. Alunos a Incluir</Label>
                        <div className="border-2 rounded-lg overflow-hidden bg-background">
                            <div className="p-2 border-b bg-muted/30">
                                <Input placeholder="Filtrar por nome..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} className="h-8 border-none focus-visible:ring-0 shadow-none bg-transparent text-xs" />
                            </div>
                            <div className="max-h-64 overflow-y-auto">
                                {availableStudents.length > 0 ? (
                                    availableStudents.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-secondary/50">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold truncate">{s.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase">{schoolsMap.get(s.schoolId)?.name} • {getAbbreviatedClass(s)}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => { setStops(prev => [...prev, { id: s.id, type: 'student', name: s.name, details: schoolsMap.get(s.schoolId)?.name }]); setIsOptimized(false); }}>
                                                <PlusCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center text-muted-foreground">
                                        <p className="text-[10px] font-bold uppercase">Nenhum aluno disponível</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Coluna 2: Itinerário Final (INCLUÍDOS) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-primary/5 p-3 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="bg-background text-primary border-primary/30 h-6 font-black">{stops.length}</Badge>
                            <Label className="text-xs font-black uppercase tracking-tighter">Itinerário Final</Label>
                        </div>
                        <Button size="sm" onClick={handleOptimizeOrder} disabled={isOptimizing || studentsOnRoute.length < 2 || isOptimized} className="bg-primary text-white h-8 font-bold text-[10px]">
                            {isOptimizing ? <Loader2 className="animate-spin h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            OTIMIZAR IA
                        </Button>
                    </div>

                    <div className="border-2 border-dashed rounded-xl bg-background p-3 min-h-[300px]">
                        <div className="space-y-2">
                            {stops.length > 0 ? (
                                stops.map((stop, idx) => (
                                    <div key={`${stop.id}-${idx}`} className="flex items-center gap-3 p-2 bg-muted/20 border rounded-lg group">
                                        <span className="text-[9px] font-black bg-background w-5 h-5 flex items-center justify-center rounded border text-muted-foreground">{idx + 1}</span>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold uppercase truncate">{stop.name}</p>
                                            <p className="text-[9px] text-muted-foreground truncate uppercase">{stop.details}</p>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { 
                                                const newStops = [...stops];
                                                if (idx > 0) { [newStops[idx], newStops[idx-1]] = [newStops[idx-1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === 0}><ArrowUp className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                                const newStops = [...stops];
                                                if (idx < stops.length - 1) { [newStops[idx], newStops[idx+1]] = [newStops[idx+1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === stops.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => { setStops(prev => prev.filter((_, i) => i !== idx)); setIsOptimized(false); }}><X className="h-3 w-3" /></Button>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="py-20 text-center text-muted-foreground">
                                    <p className="text-xs font-bold uppercase tracking-widest">Adicione paradas ao itinerário</p>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full h-9 font-bold border-dashed border-primary/30 text-primary">
                                        <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Escola (Desembarque)
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[300px]">
                                    {selectedSchoolIds.map(id => schoolsMap.get(id)).filter(Boolean).map(s => (
                                        <DropdownMenuItem key={s.id} onSelect={() => { if (!stops.some(st => st.id === s.id && st.type === 'school')) setStops(prev => [...prev, { id: s.id, type: 'school', name: s.name, details: 'Ponto de desembarque' }]); setIsOptimized(false); }}>
                                            <School className="mr-2 h-3 w-3" /> {s.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </div>

            {/* BOTÃO SALVAR - Agora faz parte do conteúdo e corre com a tela */}
            <div className="pt-10 pb-20 flex flex-col sm:flex-row gap-3">
                <DialogClose asChild>
                    <Button variant="ghost" className="h-14 px-8 flex-1">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isOptimizing || stops.length === 0} className="flex-[2] h-14 text-lg font-black shadow-xl bg-primary text-white">
                    SALVAR ROTA COMPLETA
                </Button>
            </div>
        </div>
      </div>
    </DialogContent>
  );
}
