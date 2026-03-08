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
    Zap,
    Route as RouteIcon,
    MessageCircle,
    UserPlus
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

  const formatStudentMetaAbbrev = (s: Student | undefined) => {
    if (!s) return '';
    const serie = s.serie?.replace(/\s*ano/i, '').replace(/º/g, '').trim() || '?';
    const sala = s.turma?.replace(/sala/i, 'SL.').trim() || '';
    const shiftText = s.shift || '';
    return `${serie}° - ${sala} - ${shiftText}`;
  };

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

  const handleAddAllAvailable = () => {
    if (availableStudents.length === 0) return;
    
    setStops(prev => {
        let newStops = [...prev];
        let newSchoolIds = [...selectedSchoolIds];
        
        availableStudents.forEach(s => {
            const studentSchool = schoolsMap.get(s.schoolId);
            // Adiciona o aluno
            newStops.push({ 
                id: s.id, 
                type: 'student' as const, 
                name: s.name, 
                details: studentSchool?.name 
            });
            
            // Adiciona a escola se ela não existir no itinerário
            const hasSchool = newStops.some(st => st.id === s.schoolId && st.type === 'school');
            if (!hasSchool && studentSchool) {
                newStops.push({ 
                    id: s.schoolId, 
                    type: 'school' as const, 
                    name: studentSchool.name, 
                    details: 'Destino Final (Auto-Inclusão)' 
                });
                if (!newSchoolIds.includes(s.schoolId)) {
                    newSchoolIds.push(s.schoolId);
                }
            }
        });
        
        setSelectedSchoolIds(newSchoolIds);
        return newStops;
    });
    
    setIsOptimized(false);
    toast({ 
        title: "Inclusão em Massa!", 
        description: `${availableStudents.length} alunos adicionados ao itinerário.` 
    });
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

  const handleExportToWhatsApp = () => {
    if (stops.length === 0) return;
    
    const stopList = stops.map((s, i) => {
        const num = (i + 1).toString().padStart(2, '0');
        const type = s.type === 'student' ? '👤 ALUNO' : '🏫 ESCOLA';
        let details = "";
        if (s.type === 'student') {
            const st = studentsMap.get(s.id);
            details = ` (${formatStudentMetaAbbrev(st)})`;
        }
        return `${num}. [${type}] ${s.name}${details}`;
    }).join('\n');

    const header = `📋 GUARDIAN: ITINERÁRIO\nROTA: ${name || 'Sem nome'}\nTURNO: ${shift || 'Não definido'}\n--------------------------\n`;
    const fullText = header + stopList;

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullText)}`;
    window.open(whatsappUrl, '_blank');

    toast({
        title: "WhatsApp Aberto!",
        description: "A sequência foi enviada para o aplicativo.",
    });
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
            <div className="grid grid-cols-1 md:grid-cols-[400px_1fr] gap-8">
                {/* COLUNA DA ESQUERDA: CONFIGURAÇÃO */}
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
                        <div className="flex flex-wrap gap-2 p-3 border-2 rounded-xl bg-background shadow-sm">
                            {schools.map(school => (
                                <div key={school.id} className="flex items-center space-x-2 bg-secondary/30 px-2 py-1.5 rounded-lg border">
                                    <Checkbox 
                                        id={`sch-${school.id}`} 
                                        checked={selectedSchoolIds.includes(school.id)} 
                                        onCheckedChange={checked => {
                                            setSelectedSchoolIds(prev => checked ? [...prev, school.id] : prev.filter(id => id !== school.id));
                                            setIsOptimized(false);
                                        }} 
                                    />
                                    <Label htmlFor={`sch-${school.id}`} className="text-[10px] cursor-pointer font-bold uppercase tracking-tight">{school.name}</Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {selectedSchoolIds.length >= 2 && (
                        <div className="space-y-4 p-5 bg-primary/5 rounded-2xl border-2 border-primary/20 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="space-y-1">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Zap className="h-4 w-4" /> Inteligência Guardian
                                </Label>
                                <h3 className="text-xs font-black uppercase italic tracking-tight">Estratégia de Roteirização</h3>
                            </div>
                            
                            <RadioGroup value={optimizationMode} onValueChange={(v) => { setOptimizationMode(v as any); setIsOptimized(false); }} className="grid grid-cols-1 gap-3">
                                <div className={cn(
                                    "relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all bg-background",
                                    optimizationMode === 'safe' ? "border-primary shadow-sm" : "border-border opacity-70"
                                )} onClick={() => setOptimizationMode('safe')}>
                                    <div className="mt-1"><RadioGroupItem value="safe" id="safe" /></div>
                                    <div className="space-y-1 flex-1">
                                        <Label htmlFor="safe" className="font-black text-[10px] uppercase cursor-pointer">Segurança Total (Regras de Ouro)</Label>
                                        <p className="text-[9px] text-muted-foreground leading-tight italic">
                                            A van deve primeiro embarcar TODOS os alunos da lista antes de iniciar qualquer desembarque em escola.
                                        </p>
                                    </div>
                                </div>

                                <div className={cn(
                                    "relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all bg-background",
                                    optimizationMode === 'flexible' ? "border-amber-500 shadow-sm" : "border-border opacity-70"
                                )} onClick={() => setOptimizationMode('flexible')}>
                                    <div className="mt-1"><RadioGroupItem value="flexible" id="flexible" /></div>
                                    <div className="space-y-1 flex-1">
                                        <Label htmlFor="flexible" className="font-black text-[10px] uppercase text-amber-600 cursor-pointer">Máxima Agilidade (Plano do Motorista)</Label>
                                        <p className="text-[9px] text-muted-foreground leading-tight italic">
                                            Permite o desembarque em fases. A IA prioriza a entrega rápida assim que o grupo de uma escola estiver completo no veículo.
                                        </p>
                                    </div>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary">2. Alunos Disponíveis</Label>
                            {availableStudents.length > 0 && (
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-[9px] font-black uppercase text-primary hover:bg-primary/10"
                                    onClick={handleAddAllAvailable}
                                >
                                    <UserPlus className="h-3 w-3 mr-1" /> Adicionar Todos
                                </Button>
                            )}
                        </div>
                        <div className="border-2 rounded-xl overflow-hidden bg-background shadow-lg">
                            <div className="p-3 border-b bg-muted/30">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input 
                                        placeholder="Buscar aluno..." 
                                        value={studentSearch} 
                                        onChange={e => setStudentSearch(e.target.value)} 
                                        className="h-9 border-none focus-visible:ring-0 shadow-none bg-transparent text-sm outline-none w-full pl-9" 
                                    />
                                </div>
                            </div>
                            <div className="max-h-[300px] overflow-y-auto">
                                {availableStudents.length > 0 ? (
                                    availableStudents.map(s => (
                                        <div key={s.id} className="flex items-center justify-between p-3 border-b last:border-0 hover:bg-primary/5 transition-colors group">
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase truncate group-hover:text-primary transition-colors">{s.name}</p>
                                                <p className="text-[9px] text-muted-foreground uppercase font-bold">{schoolsMap.get(s.schoolId)?.name}</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-primary hover:bg-primary hover:text-white rounded-full transition-all" onClick={() => handleAddStudent(s)}>
                                                <PlusCircle className="h-5 w-5" />
                                            </Button>
                                        </div>
                                    ))
                                ) : (
                                    <div key="empty-students" className="p-8 text-center text-muted-foreground">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                        <p className="text-[9px] font-black uppercase tracking-widest opacity-40 leading-tight">
                                            Aguardando seleção <br/> de escolas e turno
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* COLUNA DA DIREITA: ITINERÁRIO FINAL - LAYOUT DE 3 CAMADAS */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-primary/10 p-4 rounded-xl border-2 border-primary/20 shadow-md">
                        <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-background text-primary border-primary/30 h-8 px-3 font-black text-base">{stops.length}</Badge>
                            <Label className="text-sm font-black uppercase tracking-tighter">Itinerário Final Gerado</Label>
                        </div>
                        <Button size="sm" onClick={handleOptimizeOrder} disabled={isOptimizing || stops.filter(s => s.type === 'student').length < 2 || isOptimized} className="bg-primary text-white h-10 px-4 font-black text-xs shadow-xl active:scale-95 transition-all">
                            {isOptimizing ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                            OTIMIZAR IA
                        </Button>
                    </div>

                    <div className="space-y-3 pb-20">
                        {stops.length > 0 ? (
                            stops.map((stop, idx) => {
                                const studentObj = stop.type === 'student' ? studentsMap.get(stop.id) : null;
                                return (
                                <div key={`${stop.id}-${idx}`} className={cn(
                                    "flex flex-col gap-1 p-3 border-2 rounded-xl group animate-in fade-in duration-300 shadow-sm",
                                    stop.type === 'school' ? "bg-primary/5 border-primary/20" : "bg-background border-border"
                                )}>
                                    {/* CAMADA 1: NOME COMPLETO */}
                                    <div className="flex items-center gap-3">
                                        <span className="text-[9px] font-black bg-muted w-5 h-5 flex items-center justify-center rounded-full text-muted-foreground shrink-0">{idx + 1}</span>
                                        <p className="text-sm font-black uppercase leading-tight text-foreground">{stop.name}</p>
                                    </div>
                                    
                                    {/* CAMADA 2: ESCOLA */}
                                    <div className="pl-8 flex items-center gap-2">
                                        {stop.type === 'school' ? (
                                            <p className="text-[9px] font-black text-primary uppercase tracking-widest">Ponto de Desembarque Final</p>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <School className="h-3 w-3 text-muted-foreground/60" />
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">{stop.details}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* CAMADA 3: METADADOS + BOTÕES ALINHADOS */}
                                    <div className="pl-8 mt-1 flex items-center justify-between border-t border-dashed border-muted pt-2">
                                        <div className="text-[10px] font-black text-primary uppercase tracking-tight">
                                            {stop.type === 'student' ? formatStudentMetaAbbrev(studentObj) : "Logística Escola"}
                                        </div>
                                        
                                        <div className="flex items-center gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { 
                                                const newStops = [...stops];
                                                if (idx > 0) { [newStops[idx], newStops[idx-1]] = [newStops[idx-1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === 0}><ArrowUp className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                                                const newStops = [...stops];
                                                if (idx < stops.length - 1) { [newStops[idx], newStops[idx+1]] = [newStops[idx+1], newStops[idx]]; setStops(newStops); setIsOptimized(false); }
                                            }} disabled={idx === stops.length - 1}><ArrowDown className="h-3.5 w-3.5" /></Button>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setStops(prev => prev.filter((_, i) => i !== idx)); setIsOptimized(false); }}><X className="h-3.5 w-3.5" /></Button>
                                        </div>
                                    </div>
                                </div>
                            )})
                        ) : (
                            <div key="empty-itinerary" className="py-24 text-center text-muted-foreground flex flex-col items-center">
                                <RouteIcon className="h-12 w-12 mb-3 opacity-5" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-center opacity-30 leading-tight">
                                    Adicione alunos para <br/> gerar o itinerário
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="pt-8 pb-20 flex flex-col sm:flex-row gap-3 border-t mt-10">
                <DialogClose asChild>
                    <Button variant="ghost" className="h-14 px-8 flex-1 text-sm uppercase font-bold">Cancelar</Button>
                </DialogClose>
                <Button 
                    variant="outline" 
                    className="h-14 px-8 flex-1 text-sm uppercase font-black border-green-600/30 text-green-600 hover:bg-green-50"
                    onClick={handleExportToWhatsApp}
                    disabled={stops.length === 0}
                >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Enviar WhatsApp
                </Button>
                <Button onClick={handleSubmit} disabled={isOptimizing || stops.length === 0} className="flex-[2] h-14 text-lg font-black shadow-xl bg-primary text-white hover:bg-primary/90 transition-all">
                    <CheckCircle2 className="mr-3 h-6 w-6" />
                    SALVAR ROTA
                </Button>
            </div>
        </div>
      </div>
    </DialogContent>
  );
}
