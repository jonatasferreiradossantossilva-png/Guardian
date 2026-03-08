'use client';

import { useState, useMemo, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { 
    Users, 
    School, 
    ArrowUp, 
    ArrowDown, 
    Sparkles, 
    Loader2, 
    X, 
    PlusCircle, 
    CheckCircle2, 
    Search, 
    ShieldCheck, 
    Zap,
    Route as RouteIcon,
    GraduationCap,
    Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';
import { routingGeoapify } from '@/ai/flows/routing-geoapify';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const [optimizationMode, setOptimizationMode] = useState<'safe' | 'flexible'>('safe');
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

  const handleAddStudent = (s: Student) => {
    const studentSchool = schoolsMap.get(s.schoolId);
    
    setStops(prev => {
        const hasSchool = prev.some(st => st.id === s.schoolId && st.type === 'school');
        const newStops = [...prev, { 
            id: s.id, 
            type: 'student' as const, 
            name: s.name, 
            details: studentSchool?.name 
        }];
        
        if (!hasSchool && studentSchool) {
            newStops.push({ 
                id: s.schoolId, 
                type: 'school' as const, 
                name: studentSchool.name, 
                details: 'Destino Final (Auto-Inclusão)' 
            });
            setSelectedSchoolIds(prevIds => prevIds.includes(s.schoolId) ? prevIds : [...prevIds, s.schoolId]);
        }
        return newStops;
    });
    setIsOptimized(false);
  };

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
            optimizationMode: optimizationMode
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
        toast({ title: `Ordem dos alunos otimizada!` });
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
    <DialogContent className="sm:max-w-7xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-background z-20 shadow-sm">
        <DialogTitle className="text-xl font-black uppercase italic text-primary">Configuração de Itinerário Inteligente</DialogTitle>
        <DialogDescription>A IA calculará a melhor rota priorizando o bem-estar dos alunos e a economia da operação.</DialogDescription>
      </DialogHeader>
      
      <div className="flex-1 overflow-y-auto bg-background scroll-smooth">
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-[0.8fr_1.2fr] gap-10">
                {/* COLUNA DA ESQUERDA: CONFIGURAÇÃO (40%) */}
                <div className="space-y-8">
                    <div className="space-y-4 bg-muted/20 p-5 rounded-xl border border-dashed">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">Dados da Rota</Label>
                            <Input placeholder="Nome da Rota" value={name} onChange={e => setName(e.target.value)} className={cn("bg-background font-bold h-11", errors.name && "border-destructive")} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Turno</Label>
                                <Select onValueChange={v => setShift(v as any)} value={shift}>
                                    <SelectTrigger className={cn("bg-background h-11", errors.shift && "border-destructive")}><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent><SelectItem value="Manhã">Manhã</SelectItem><SelectItem value="Tarde">Tarde</SelectItem></SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Motorista</Label>
                                <Select onValueChange={setDriverId} value={driverId}>
                                    <SelectTrigger className={cn("bg-background h-11", errors.driverId && "border-destructive")}><SelectValue placeholder="Escolha" /></SelectTrigger>
                                    <SelectContent>{drivers.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">1. Escolas Atendidas</Label>
                        <div className="flex flex-wrap gap-3 p-4 border-2 rounded-xl bg-background shadow-sm">
                            {schools.map(school => (
                                <div key={school.id} className="flex items-center space-x-2 bg-secondary/30 px-3 py-2 rounded-lg border">
                                    <Checkbox 
                                        id={`sch-${school.id}`} 
                                        checked={selectedSchoolIds.includes(school.id)} 
                                        onCheckedChange={checked => {
                                            setSelectedSchoolIds(prev => checked ? [...prev, school.id] : prev.filter(id => id !== school.id));
                                            setIsOptimized(false);
                                        }} 
                                    />
                                    <Label htmlFor={`sch-${school.id}`} className="text-xs cursor-pointer font-bold uppercase tracking-tight">{school.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedSchoolIds.length >= 2 && (
                        <div className="space-y-4 p-6 bg-primary/5 rounded-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Zap className="h-4 w-4" /> Inteligência Guardian
                                </Label>
                                <h3 className="text-base font-black uppercase italic tracking-tight">Como a IA deve organizar os alunos?</h3>
                            </div>
                            
                            <RadioGroup value={optimizationMode} onValueChange={(v) => { setOptimizationMode(v as any); setIsOptimized(false); }} className="grid grid-cols-1 gap-4">
                                <div className={cn(
                                    "relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md bg-background",
                                    optimizationMode === 'safe' ? "border-primary ring-1 ring-primary/20" : "border-border opacity-70"
                                )} onClick={() => setOptimizationMode('safe')}>
                                    <div className="mt-1"><RadioGroupItem value="safe" id="safe" /></div>
                                    <div className="space-y-1.5 flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <ShieldCheck className="h-4 w-4 text-primary" />
                                            <Label htmlFor="safe" className="font-black text-sm uppercase cursor-pointer">Priorizar Embarque (Segurança Total)</Label>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            A van embarca todos os alunos de todas as escolas antes de iniciar qualquer desembarque. Ideal para conferência de lotação completa.
                                        </p>
                                    </div>
                                </div>

                                <div className={cn(
                                    "relative flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-md bg-background",
                                    optimizationMode === 'flexible' ? "border-amber-500 ring-1 ring-amber-500/20" : "border-border opacity-70"
                                )} onClick={() => setOptimizationMode('flexible')}>
                                    <div className="mt-1"><RadioGroupItem value="flexible" id="flexible" /></div>
                                    <div className="space-y-1.5 flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-amber-500" />
                                            <Label htmlFor="flexible" className="font-black text-sm uppercase text-amber-600 cursor-pointer">Entrega por Proximidade (Mais Agilidade)</Label>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground leading-relaxed italic">
                                            A IA sugere deixar os alunos assim que estiverem próximos da escola. Reduz drasticamente o tempo das crianças no veículo.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-primary">2. Alunos Disponíveis</Label>
                        <div className="border-2 rounded-xl overflow-hidden bg-background shadow-lg">
                            <div className="p-3 border-b bg-muted/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        placeholder="Filtrar por nome do aluno..." 
                                        value={studentSearch} 
                                        onChange={e => setStudentSearch(e.target.value)} 
                                        className="h-10 border-none focus-visible:ring-0 shadow-none bg-transparent text-sm outline-none w-full pl-9" 
                                    />
                                </div>
                            </div>
                            <div className="max-h-[400px] overflow-y-auto">
                                {availableStudents.length > 0 ? (
                                    availableStudents.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-primary/5 transition-colors group">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase truncate group-hover:text-primary transition-colors">{s.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">{schoolsMap.get(s.schoolId)?.name} • {getAbbreviatedClass(s)}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-10 w-10 text-primary hover:bg-primary hover:text-white rounded-full transition-all" onClick={() => handleAddStudent(s)}>
                                                <PlusCircle className="h-6 w-6" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-12 text-center text-muted-foreground" key="empty-available">
                                        <Users className="h-10 w-10 mx-auto mb-3 opacity-20" />
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-tight">
                                            Selecione escolas e turno <br/> para visualizar os alunos
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DA DIREITA: ITINERÁRIO FINAL (60%) */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border-2 border-primary/20 shadow-md">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-background text-primary border-primary/30 h-8 px-3 font-black text-base">{stops.length}</Badge>
                            <Label className="text-sm font-black uppercase tracking-tighter">Itinerário Final Gerado</Label>
                        </div>
                        <Button size="sm" onClick={handleOptimizeOrder} disabled={isOptimizing || studentsOnRoute.length < 2 || isOptimized} className="bg-primary text-white h-10 px-4 font-black text-xs shadow-xl active:scale-95 transition-all">
                            {isOptimizing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            OTIMIZAR IA
                        </Button>
                    </div>

                    <div className="rounded-2xl min-h-[500px]">
                        <div className="space-y-3">
                            {stops.length > 0 ? (
                                stops.map((stop, idx) => {
                                    const studentObj = stop.type === 'student' ? studentsMap.get(stop.id) : null;
                                    return (
                                    <div key={`${stop.id}-${idx}`} className={cn(
                                        "flex items-center gap-4 p-4 border-2 rounded-xl group animate-in fade-in slide-in-from-right-4 duration-300 shadow-sm",
                                        stop.type === 'school' ? "bg-primary/5 border-primary/20 border-primary/30" : "bg-background border-border"
                                    )}>
                                        <span className="text-xs font-black bg-muted w-8 h-8 flex items-center justify-center rounded-full text-muted-foreground shrink-0">{idx + 1}</span>
                                        
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                {stop.type === 'school' ? (
                                                    <>
                                                        <School className="h-5 w-5 text-primary shrink-0" />
                                                        <p className="text-base font-black uppercase leading-tight text-primary">{stop.name}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                                        <p className="text-base font-black uppercase leading-tight">{stop.name}</p>
                                                    </>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                                    <School className="h-3 w-3" />
                                                    {stop.details}
                                                </div>
                                                {studentObj && (
                                                    <>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                                            <GraduationCap className="h-3 w-3" />
                                                            {studentObj.serie} {studentObj.turma ? `• ${studentObj.turma}` : ''}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase">
                                                            <Clock className="h-3 w-3" />
                                                            {studentObj.shift}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity shrink-0">
                                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { 
                                                const newStops = [...stops];
                                                if (idx > 0) { [newStops[idx], newStops[idx-1]] = [newStops[idx-1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === 0}><ArrowUp className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => {
                                                const newStops = [...stops];
                                                if (idx < stops.length - 1) { [newStops[idx], newStops[idx+1]] = [newStops[idx+1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === stops.length - 1}><ArrowDown className="h-5 w-5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => { setStops(prev => prev.filter((_, i) => i !== idx)); setIsOptimized(false); }}><X className="h-5 w-5" /></Button>
                                        </div>
                                    </div>
                                )})
                            ) : (
                                <div className="py-32 text-center text-muted-foreground flex flex-col items-center">
                                    <RouteIcon className="h-16 w-16 mb-4 opacity-5" />
                                    <p className="text-xs font-black uppercase tracking-widest text-center opacity-30 leading-tight">
                                        Seu itinerário detalhado aparecerá aqui <br/> conforme você adiciona alunos
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-12 pb-24 flex flex-col sm:flex-row gap-4 border-t mt-10">
                <DialogClose asChild>
                    <Button variant="ghost" className="h-16 px-10 flex-1 text-base uppercase font-bold">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSubmit} disabled={isOptimizing || stops.length === 0} className="flex-[2] h-16 text-xl font-black shadow-2xl bg-primary text-white hover:bg-primary/90 transition-all active:scale-[0.98]">
                    <CheckCircle2 className="mr-3 h-7 w-7" />
                    SALVAR ROTA COMPLETA
                </Button>
            </div>
        </div>
      </div>
    </DialogContent>
  );
}
