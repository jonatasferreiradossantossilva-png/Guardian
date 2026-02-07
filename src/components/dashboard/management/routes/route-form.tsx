
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { optimizeSchoolVanRoute } from '@/ai/flows/optimizeSchoolVanRoute';


type Driver = { id: string; name: string; vehicleId?: string; latitude?: number; longitude?: number; };
type Student = { id: string; name: string; shift: string; active?: boolean; schoolId: string; serie?: string; turma?: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string; latitude?: number; longitude?: number; };
type Monitor = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };
type SchoolData = { id: string; name: string; street?: string; number?: string; neighborhood?: string; city?: string; state?: string; };
type Route = { id: string; studentIds?: string[]; name?: string; driverId?: string; monitorId?: string; shift?: 'Manhã' | 'Tarde'; };
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
    const seriePart = student.serie.replace(/ ano/i, '°');
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

  const [selectedSchoolIds, setSelectedSchoolIds] = useState<string[]>([]);
  
  const [stops, setStops] = useState<Stop[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [errors, setErrors] = useState<{name?: string, driverId?: string, schoolIds?: string, shift?: string}>({});
  const [isOptimizing, setIsOptimizing] = useState(false);

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
                if (id.startsWith('student-')) {
                    studentIdSet.add(id);
                }
            });
        }
    }
    return studentIdSet;
  }, [allRoutes, shift, route]);


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
                return newStops; // Should not happen if buttons are disabled correctly
            }
            const [movedItem] = newStops.splice(index, 1);
            newStops.splice(to, 0, movedItem);
            return newStops;
        });
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
  }

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

        const formatAddress = (entity) => {
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

        const input = {
            students: studentInput,
            schools: schoolsInput,
            startAddress: (driver.latitude && driver.longitude) ? `${driver.latitude},${driver.longitude}` : undefined,
            vehicleCapacity: vehicleCapacity,
        };

        const result = await optimizeSchoolVanRoute(input);
        
        const newOptimizedStops = result.optimizedStops.map(stop => {
            const student = studentsMap.get(stop.id);
            const school = schoolsMap.get(stop.id);
            
            if (student) return { id: stop.id, type: 'student', name: student.name, details: schoolsMap.get(student.schoolId)?.name };
            if (school) return { id: stop.id, type: 'school', name: school.name, details: 'Ponto de desembarque/embarque' };
            
            return null;
        }).filter(Boolean) as Stop[];
        
        setStops(newOptimizedStops);

        toast({
            title: "Ordem da rota otimizada!",
            description: "A IA sugeriu uma nova sequência para as paradas. Você pode fazer ajustes manuais se necessário.",
        });

    } catch (error) {
        console.error("Failed to optimize route order:", error);
        toast({
            title: "Erro na Otimização",
            description: "Não foi possível obter uma sugestão da IA. Tente novamente.",
            variant: "destructive",
        });
    } finally {
        setIsOptimizing(false);
    }
  };
  
  const performSave = (stopsToSave: Stop[]) => {
    const finalData = {
        name,
        driverId,
        monitorId: monitorId === 'none' ? '' : monitorId,
        studentIds: stopsToSave.map(s => s.id), 
        shift
    };
    
    if (route) {
      updateDoc('routes', route.id, finalData);
      toast({ title: 'Rota atualizada!', description: `A rota ${finalData.name} foi atualizada.` });
    } else {
      addDoc('routes', finalData);
      toast({ title: 'Rota adicionada!', description: `A rota ${finalData.name} foi adicionada ao sistema.` });
    }
    onFormSubmit();
  }

  const handleSubmit = () => {
    const newErrors: {name?: string, driverId?: string, schoolIds?: string, shift?: string} = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!driverId) newErrors.driverId = 'Selecione um motorista.';
    if (selectedSchoolIds.length === 0) newErrors.schoolIds = 'Selecione pelo menos uma escola.';
    if (!shift) newErrors.shift = 'Selecione um turno para a rota.';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    performSave(stops);
  };
  
  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>{route ? 'Editar Rota' : 'Adicionar Rota'}</DialogTitle>
        <DialogDescription>
          Preencha as informações, adicione escolas, e monte o itinerário da rota.
        </DialogDescription>
      </DialogHeader>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 max-h-[70vh] overflow-y-auto pr-2">
        {/* Coluna da Esquerda: Configurações e Alunos Disponíveis */}
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="routeName">Nome da Rota</Label>
                <Input id="routeName" placeholder="Ex: Rota Matinal - Escolas A e B" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="shiftId">Turno da Rota</Label>
                    <Select onValueChange={(v) => setShift(v as 'Manhã' | 'Tarde')} value={shift}>
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
                    <Select onValueChange={setDriverId} value={driverId}>
                        <SelectTrigger id="driverId"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                        <SelectContent>{drivers.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                    </Select>
                    {vehicle && <p className="text-xs text-muted-foreground">Veículo: {vehicle.model} (Capacidade: {vehicle.capacity})</p>}
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
            
            <div className="space-y-2">
                <Label>Escolas Atendidas</Label>
                <div className="space-y-2 rounded-md border p-4 max-h-32 overflow-y-auto">
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

            <div className="border rounded-md overflow-hidden">
                <div className="p-2 border-b">
                    <Input placeholder="Buscar aluno por nome..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="h-8 border-none focus-visible:ring-0 shadow-none"/>
                </div>
                <div>
                    {!selectedSchoolIds.length || !shift ? (
                        <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                            <School className="h-8 w-8 mb-2"/>
                            <p className="font-semibold">Selecione escolas e um turno</p>
                            <p className="text-sm">Escolha as escolas no formulário para ver os alunos disponíveis.</p>
                        </div>
                    ) : (
                        <ScrollArea className="h-56">
                            {availableStudents.length > 0 ? (
                                Object.entries(
                                    availableStudents.reduce((acc, student) => {
                                        const schoolName = schoolsMap.get(student.schoolId)?.name || 'Outra';
                                        if (!acc[schoolName]) acc[schoolName] = [];
                                        acc[schoolName].push(student);
                                        return acc;
                                    }, {} as Record<string, Student[]>)
                                ).map(([schoolName, students]) => (
                                    <div key={schoolName}>
                                        <h4 className="font-semibold text-sm text-muted-foreground px-2 py-1.5">{schoolName}</h4>
                                        {students.map(s => {
                                            const studentWithClass = getAbbreviatedClass(s);
                                            return (
                                                <div key={s.id} className="flex items-center gap-2 rounded-md p-2 hover:bg-accent/50">
                                                    <div className="flex-grow flex items-center gap-2 min-w-0">
                                                        <p className="font-medium text-sm truncate">{s.name}</p>
                                                        {studentWithClass && (
                                                            <span className="text-xs text-muted-foreground">({studentWithClass})</span>
                                                        )}
                                                    </div>
                                                    <div className="flex-shrink-0 flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground">{s.shift}</span>
                                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => addStop({id: s.id, type: 'student', name: s.name, details: schoolName})}>
                                                            <PlusCircle className="h-4 w-4 text-green-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))
                            ) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno disponível para as escolas/turno selecionados ou para a busca.</p>}
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>

        {/* Coluna da Direita: Itinerário */}
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <Label>Itinerário da Rota ({stops.length} paradas)</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleOptimizeOrder} disabled={isOptimizing || studentsOnRoute.length < 2}>
                    {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Otimizar Ordem
                </Button>
             </div>
            <p className="text-sm text-muted-foreground">Adicione alunos, otimize a ordem e use as setas para ajustes finos.</p>
            {isCapacityExceeded && (
                <div className="my-2 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Capacidade de ${vehicleCapacity} alunos excedida!
                </div>
            )}

            <div className="border rounded-md">
                <ScrollArea className="h-[28rem] p-2">
                    {stops.length > 0 ? (
                        <div className="space-y-1">
                           {stops.map((stop, index) => (
                                <div key={`${stop.id}-${index}`} className="grid grid-cols-[auto_1fr_auto] items-center w-full bg-background rounded-md p-2 hover:bg-accent/50 gap-2">
                                    {/* Column 1: Number */}
                                    <span className="w-6 flex-shrink-0 text-xs font-mono text-muted-foreground pt-2 self-start">{index + 1}</span>

                                    {/* Column 2: Content */}
                                    <div className="grid grid-cols-[auto_1fr] items-center gap-x-2 min-w-0">
                                        <div className="row-span-2 self-center">
                                            {stop.type === 'student' ? (
                                                <Avatar className="h-8 w-8 flex-shrink-0">
                                                    <AvatarImage src={`https://picsum.photos/seed/student-${stop.id}/40/40`} alt={stop.name} />
                                                    <AvatarFallback>{stop.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                                                </Avatar>
                                            ) : (
                                                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary flex-shrink-0">
                                                    <School className="h-4 w-4 text-muted-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm truncate col-start-2">{stop.name}</p>
                                        <p className="text-xs text-muted-foreground truncate col-start-2">
                                            {stop.details}
                                        </p>
                                    </div>

                                    {/* Column 3: Buttons */}
                                    <div className="flex items-center flex-shrink-0">
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStop(index, 'up')} disabled={index === 0}>
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveStop(index, 'down')} disabled={index === stops.length - 1}>
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStop(index)}>
                                            <X className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma parada no itinerário. Adicione alunos ou escolas.</p>}
                </ScrollArea>
                <div className="p-2 border-t">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Parada (Escola)
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                             {selectedSchoolIds.map(schoolId => schoolsMap.get(schoolId)).filter(Boolean).map(school => (
                                <DropdownMenuItem key={school.id} onSelect={() => handleAddSchoolToRoute(school.id)}>
                                    {school.name}
                                </DropdownMenuItem>
                            ))}
                            {selectedSchoolIds.length === 0 && <DropdownMenuItem disabled>Selecione uma escola primeiro</DropdownMenuItem>}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
      </div>
      <DialogFooter className="pt-4 mt-4 border-t">
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
        <Button type="button" onClick={handleSubmit} disabled={isCapacityExceeded}>Salvar Rota</Button>
      </DialogFooter>
    </DialogContent>
  )
}
