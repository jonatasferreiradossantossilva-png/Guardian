

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
import { ArrowUp, ArrowDown, Users, AlertCircle, X, PlusCircle, School, Info } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';


type Driver = { id: string; name: string; vehicleId?: string; };
type Student = { id: string; name: string; shift: string; active?: boolean; schoolId: string; serie?: string; turma?: string; };
type Monitor = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };
type SchoolData = { id: string; name: string; }; // Renamed from School to avoid conflict
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

  const [isMissingStudentAlertOpen, setIsMissingStudentAlertOpen] = useState(false);
  const [missingIntegralStudents, setMissingIntegralStudents] = useState<Student[]>([]);

  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const schoolsMap = useMemo(() => new Map(schools.map(s => [s.id, s])), [schools]);

 useEffect(() => {
    const initialStops: Stop[] = [];
    const initialSchoolIds = new Set<string>();

    route?.studentIds?.forEach(stopId => {
        const type = stopId.substring(0, stopId.indexOf('-'));
        const id = stopId.substring(stopId.indexOf('-') + 1);

        if (type === 'student') {
            const student = studentsMap.get(id);
            if (student) {
                initialStops.push({ id, type: 'student', name: student.name, details: schoolsMap.get(student.schoolId)?.name });
                initialSchoolIds.add(student.schoolId);
            }
        } else if (type === 'school') {
            const school = schoolsMap.get(id);
            if (school) {
                initialStops.push({ id, type: 'school', name: school.name, details: 'Ponto de desembarque' });
                initialSchoolIds.add(id);
            }
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
                    const studentId = id.substring(id.indexOf('-') + 1);
                    studentIdSet.add(studentId);
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

    const { missingRouteWarning } = useMemo(() => {
        if (!shift || selectedSchoolIds.length === 0 || studentsOnRoute.length === 0) return { missingRouteWarning: null };

        const integralStudentsOnThisRoute = studentsOnRoute.some(s => s.shift === 'Integral');
        if (!integralStudentsOnThisRoute) {
            return { missingRouteWarning: null };
        }

        const oppositeShift = shift === 'Manhã' ? 'Tarde' : 'Manhã';
        const correspondingRouteExists = allRoutes.some(r => {
            if (r.id === route?.id || r.shift !== oppositeShift) return false;
            const firstStudentOnOtherRoute = students.find(s => r.studentIds && s.id === r.studentIds[0]?.substring(r.studentIds[0].indexOf('-') + 1));
            return firstStudentOnOtherRoute && selectedSchoolIds.includes(firstStudentOnOtherRoute.schoolId);
        });

        if (correspondingRouteExists) {
            return { missingRouteWarning: `Atenção: Você adicionou aluno(s) de período integral. Certifique-se de que ele(s) também esteja(m) na rota de '${oppositeShift}' correspondente.` };
        } else {
            return { missingRouteWarning: `Atenção: Aluno(s) integral(is) adicionado(s), mas não foi encontrada uma rota de '${oppositeShift}' para esta(s) escola(s). Lembre-se de criá-la.`};
        }
    }, [studentsOnRoute, shift, selectedSchoolIds, allRoutes, route?.id, students]);

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
        // Prevent adding duplicate school stops
        if (stops.some(stop => stop.type === 'school' && stop.id === schoolId)) {
            toast({
                title: "Escola já está no itinerário",
                variant: "destructive"
            });
            return;
        }
        addStop({id: schoolId, type: 'school', name: school.name, details: 'Ponto de desembarque'});
        if (!selectedSchoolIds.includes(schoolId)) {
            setSelectedSchoolIds(prev => [...prev, schoolId]);
        }
    }
  }

  const moveStop = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === stops.length - 1) return;

    const newList = [...stops];
    const item = newList.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newList.splice(newIndex, 0, item);
    setStops(newList);
  };
  
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
        // Also remove from the selectedSchoolIds list
        setSelectedSchoolIds(prev => prev.filter(id => id !== stopToRemove.id));
    }
    setStops(prev => prev.filter((_, i) => i !== index));
  }
  
  const performSave = (stopsToSave: Stop[]) => {
    const finalData = {
        name,
        driverId,
        monitorId: monitorId === 'none' ? '' : monitorId,
        studentIds: stopsToSave.map(s => `${s.type}-${s.id}`), // Prefixo para diferenciar
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

  const handleConfirmSaveAndAdd = () => {
    const studentStopsToAdd = missingIntegralStudents.map(s => ({
        id: s.id,
        type: 'student' as 'student',
        name: s.name,
        details: schoolsMap.get(s.schoolId)?.name
    }));
    performSave([...stops, ...studentStopsToAdd]); 
    setIsMissingStudentAlertOpen(false);
  }
  
  const handleConfirmSaveWithMissing = () => {
    performSave(stops);
    setIsMissingStudentAlertOpen(false);
  }

  const handleSubmit = () => {
    const newErrors: {name?: string, driverId?: string, schoolIds?: string, shift?: string} = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!driverId) newErrors.driverId = 'Selecione um motorista.';
    if (selectedSchoolIds.length === 0) newErrors.schoolIds = 'Selecione pelo menos uma escola.';
    if (!shift) newErrors.shift = 'Selecione um turno para a rota.';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    
    const oppositeShift = shift === 'Manhã' ? 'Tarde' : 'Manhã';
    const otherRoutes = allRoutes.filter(r => {
        if (r.id === route?.id || r.shift !== oppositeShift) return false;
        const firstStudentOnOtherRoute = students.find(s => r.studentIds && s.id === r.studentIds[0]?.substring(r.studentIds[0].indexOf('-') + 1));
        return firstStudentOnOtherRoute && selectedSchoolIds.includes(firstStudentOnOtherRoute.schoolId);
    });

    if (otherRoutes.length > 0) {
        const otherRouteIntegralStudents = new Set<string>();
        otherRoutes.forEach(r => {
            r.studentIds?.forEach(stopId => {
                const type = stopId.substring(0, stopId.indexOf('-'));
                const id = stopId.substring(stopId.indexOf('-') + 1);
                if (type === 'student') {
                    const student = studentsMap.get(id);
                    if (student?.shift === 'Integral') {
                        otherRouteIntegralStudents.add(id);
                    }
                }
            })
        });
        
        const thisRouteStudentIds = new Set(studentsOnRoute.map(s => s.id));
        const studentsToWarnAbout = Array.from(otherRouteIntegralStudents).filter(id => !thisRouteStudentIds.has(id)).map(id => studentsMap.get(id)).filter(Boolean) as Student[];

        if (studentsToWarnAbout.length > 0) {
            setMissingIntegralStudents(studentsToWarnAbout);
            setIsMissingStudentAlertOpen(true);
            return;
        }
    }

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
                 <div className="flex flex-wrap gap-2 pt-1">
                     {selectedSchoolIds.map(id => (
                        <Badge key={id} variant="secondary" className="flex items-center gap-1">
                            {schoolsMap.get(id)?.name}
                        </Badge>
                     ))}
                     {selectedSchoolIds.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma escola selecionada. Adicione escolas no itinerário.</p>}
                 </div>
            </div>
            
            <Card>
                <CardHeader className="p-2 border-b">
                    <Input placeholder="Buscar aluno por nome..." value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} className="h-8"/>
                </CardHeader>
                <CardContent className="p-0">
                    {!selectedSchoolIds.length || !shift ? (
                        <div className="h-56 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                            <School className="h-8 w-8 mb-2"/>
                            <p className="font-semibold">Selecione escolas e um turno</p>
                            <p className="text-sm">Escolha as escolas no itinerário e o turno da rota para ver os alunos disponíveis.</p>
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
                                        {students.map(s => (
                                            <div key={s.id} className="flex items-center justify-between rounded-md p-2 hover:bg-accent/50">
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate font-medium text-sm">{s.name}</p>
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {[s.serie, s.turma].filter(Boolean).join(' / ')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center">
                                                    <span className="text-xs text-muted-foreground mr-2">{s.shift}</span>
                                                    <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => addStop({id: s.id, type: 'student', name: s.name, details: schoolsMap.get(s.schoolId)?.name})}>
                                                        <PlusCircle className="h-4 w-4 text-green-500" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            ) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno disponível para as escolas/turno selecionados ou para a busca.</p>}
                        </ScrollArea>
                    )}
                </CardContent>
            </Card>
        </div>

        {/* Coluna da Direita: Itinerário */}
        <div className="space-y-4">
             <Label>Itinerário da Rota ({stops.length} paradas)</Label>
            <p className="text-sm text-muted-foreground">Arraste para reordenar as paradas, incluindo o desembarque nas escolas.</p>
            {isCapacityExceeded && (
                <div className="my-2 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    Capacidade de {vehicleCapacity} alunos excedida!
                </div>
            )}
             {missingRouteWarning && (
                <Alert className="my-2">
                    <Info className="h-4 w-4" />
                    <AlertDescription>{missingRouteWarning}</AlertDescription>
                </Alert>
            )}

            <Card>
                <CardContent className="p-2">
                    <ScrollArea className="h-[28rem]">
                        {stops.length > 0 ? stops.map((stop, index) => {
                            const student = stop.type === 'student' ? studentsMap.get(stop.id) : null;
                            const serieTurma = student ? [student.serie, student.turma].filter(Boolean).join(' / ') : null;

                            return (
                                <div key={`${stop.type}-${stop.id}-${index}`} className="flex items-center justify-between gap-2 rounded-md p-1 hover:bg-accent/50">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="w-6 flex-shrink-0 text-center text-xs font-mono text-muted-foreground">{index + 1}</span>
                                        {stop.type === 'student' ? <Users className="h-4 w-4 flex-shrink-0 text-muted-foreground"/> : <School className="h-4 w-4 flex-shrink-0 text-muted-foreground"/>}
                                        <div className="flex-1 min-w-0">
                                            <p className="truncate font-medium text-sm">{stop.name}</p>
                                            {(serieTurma || stop.details) && (
                                                <p className="truncate text-xs text-muted-foreground">
                                                    {serieTurma ? `${serieTurma} • ${stop.details}` : stop.details}
                                                </p>
                                            )}
                                        </div>
                                    </div>
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
                            )
                        }) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma parada no itinerário. Adicione alunos ou escolas.</p>}
                    </ScrollArea>
                    <div className="p-2 border-t">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm" className="w-full">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Parada (Escola)
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {schools.map(school => (
                                    <DropdownMenuItem key={school.id} onSelect={() => handleAddSchoolToRoute(school.id)}>
                                        {school.name}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      <DialogFooter className="pt-4 mt-4 border-t">
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
        <Button type="button" onClick={handleSubmit} disabled={isCapacityExceeded}>Salvar Rota</Button>
      </DialogFooter>

       <AlertDialog open={isMissingStudentAlertOpen} onOpenChange={setIsMissingStudentAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Alunos Integrais Faltando</AlertDialogTitle>
                    <AlertDialogDescription>
                        A rota correspondente de '{shift === 'Manhã' ? 'Tarde' : 'Manhã'}' possui o(s) seguinte(s) aluno(s) de período integral que não está(ão) nesta rota:
                        <ul className="list-disc list-inside my-2 font-semibold text-foreground">
                            {missingIntegralStudents.map(s => <li key={s.id}>{s.name}</li>)}
                        </ul>
                        Deseja adicioná-lo(s) automaticamente a esta rota antes de salvar?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <Button variant="outline" onClick={handleConfirmSaveWithMissing}>Salvar Sem Adicionar</Button>
                    <AlertDialogAction onClick={handleConfirmSaveAndAdd}>Adicionar e Salvar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </DialogContent>
  )
}
    
    

    











