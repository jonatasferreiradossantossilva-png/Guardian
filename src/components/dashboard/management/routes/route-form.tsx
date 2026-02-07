
'use client';

import { useState, useMemo } from 'react';
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
import { ArrowUp, ArrowDown, Users, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';

type Driver = { id: string; name: string; vehicleId?: string; };
type Student = { id: string; name: string, routeId?: string, shift: string, active?: boolean };
type Monitor = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };

interface RouteFormProps {
  route?: { id: string; studentIds?: string[]; name?: string; driverId?: string; monitorId?: string; };
  drivers: Driver[];
  students: Student[];
  monitors: Monitor[];
  vehicles: Vehicle[];
  onFormSubmit: () => void;
}

export function RouteForm({
  route,
  drivers,
  students,
  monitors,
  vehicles,
  onFormSubmit,
}: RouteFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  
  const [name, setName] = useState(route?.name || '');
  const [driverId, setDriverId] = useState(route?.driverId || '');
  const [monitorId, setMonitorId] = useState(route?.monitorId || '');
  const [currentStudentIds, setCurrentStudentIds] = useState<string[]>(route?.studentIds || []);
  
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  const [errors, setErrors] = useState<{name?: string, driverId?: string}>({});

  const { vehicle, vehicleCapacity } = useMemo(() => {
     if (!driverId || !drivers || !vehicles) return { vehicle: null, vehicleCapacity: Infinity };
     const driver = drivers.find(d => d.id === driverId);
     if (!driver?.vehicleId) return { vehicle: null, vehicleCapacity: Infinity };
     const vehicle = vehicles.find(v => v.id === driver.vehicleId);
     if (!vehicle) return { vehicle: null, vehicleCapacity: Infinity };
     return { vehicle, vehicleCapacity: vehicle.capacity };
  }, [driverId, drivers, vehicles]);

  const { isCapacityExceeded, availableStudents, studentsInCurrentRoute } = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    const studentsInCurrentRoute = currentStudentIds
        .map(id => studentMap.get(id))
        .filter(Boolean) as Student[];

    const isExceeded = studentsInCurrentRoute.length > vehicleCapacity;

    const availableStudents = students.filter(s => {
        const isInAnotherRoute = s.routeId && s.routeId !== route?.id;
        const isAlreadyInThisRoute = currentStudentIds.includes(s.id);
        const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
        return s.active !== false && !isInAnotherRoute && !isAlreadyInThisRoute && matchesSearch;
    });

    return { isCapacityExceeded: isExceeded, availableStudents, studentsInCurrentRoute };
  }, [currentStudentIds, students, route, studentSearch, vehicleCapacity]);

  const addSelectedStudents = () => {
    const studentsToAdd = [...Array.from(selectedAvailable)];
    
    if (currentStudentIds.length + studentsToAdd.length > vehicleCapacity) {
      toast({
        title: "Capacidade do veículo excedida!",
        description: `A rota não pode ter mais de ${vehicleCapacity} alunos para este veículo.`,
        variant: "destructive",
      });
      return;
    }
    setCurrentStudentIds(prev => [...prev, ...studentsToAdd]);
    setSelectedAvailable(new Set());
    toast({
        title: `${studentsToAdd.length} aluno(s) adicionado(s)!`,
        description: 'Eles foram adicionados ao final da rota.',
    });
  };

  const moveInRoute = (studentId: string, direction: 'up' | 'down') => {
    const index = currentStudentIds.indexOf(studentId);
    if (index === -1) return;

    const newList = [...currentStudentIds];
    if (direction === 'up' && index > 0) {
        [newList[index - 1], newList[index]] = [newList[index], newList[index-1]];
        setCurrentStudentIds(newList);
    } else if (direction === 'down' && index < newList.length - 1) {
        [newList[index + 1], newList[index]] = [newList[index], newList[index+1]];
        setCurrentStudentIds(newList);
    }
  };
  
  const toggleSelection = (id: string) => {
    setSelectedAvailable(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const removeStudentFromRoute = (studentId: string) => {
    setCurrentStudentIds(prev => prev.filter(id => id !== studentId));
  }

  const handleSubmit = () => {
    const newErrors: {name?: string, driverId?: string} = {};
    if (!name.trim()) newErrors.name = 'O nome é obrigatório.';
    if (!driverId) newErrors.driverId = 'Selecione um motorista.';
    
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const finalData = {
        name,
        driverId,
        monitorId: monitorId === 'none' ? '' : monitorId,
        studentIds: currentStudentIds
    };
    
    if (route) {
      updateDoc('routes', route.id, finalData);
      toast({ title: 'Rota atualizada!', description: `A rota ${finalData.name} foi atualizada.` });
    } else {
      addDoc('routes', finalData);
      toast({ title: 'Rota adicionada!', description: `A rota ${finalData.name} foi adicionada ao sistema.` });
    }
    onFormSubmit();
  };
  
  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>{route ? 'Editar Rota' : 'Adicionar Rota'}</DialogTitle>
        <DialogDescription>
          Preencha as informações da rota, defina o motorista e organize os alunos que farão parte dela.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
          <ScrollArea className="max-h-[65vh] space-y-4 overflow-y-auto py-1 pr-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="routeName">Nome da Rota</Label>
                <Input id="routeName" placeholder="Ex: Rota Matinal - Zona Sul" value={name} onChange={(e) => setName(e.target.value)} />
                {errors.name && <p className="text-sm font-medium text-destructive">{errors.name}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverId">Motorista</Label>
                <Select onValueChange={setDriverId} value={driverId}>
                    <SelectTrigger id="driverId"><SelectValue placeholder="Selecione um motorista" /></SelectTrigger>
                    <SelectContent>{drivers.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                </Select>
                {vehicle && (
                    <p className="text-xs text-muted-foreground">
                    Veículo: {vehicle.model} (Capacidade: {vehicle.capacity} alunos)
                    </p>
                )}
                {errors.driverId && <p className="text-sm font-medium text-destructive">{errors.driverId}</p>}
              </div>
              <div className="space-y-2">
                  <Label htmlFor="monitorId">Monitor</Label>
                  <Select onValueChange={setMonitorId} value={monitorId || 'none'}>
                    <SelectTrigger id="monitorId"><SelectValue placeholder="Selecione um monitor (opcional)" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">Nenhum</SelectItem>
                        {monitors.map(a => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
              </div>
            </div>

            <div className="pt-4">
              <Label>Alunos na Rota</Label>
              <p className="text-sm text-muted-foreground mb-2">Ordene os alunos para definir as paradas ou adicione novos alunos na aba ao lado.</p>
              {isCapacityExceeded && (
                  <div className="my-2 flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-sm font-medium text-destructive">
                      <AlertCircle className="h-4 w-4" />
                      Capacidade de {vehicleCapacity} alunos excedida! Salve ou remova alunos.
                  </div>
              )}
              
              <div className="flex flex-col gap-4">
                  <Tabs defaultValue="inRoute">
                      <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="inRoute">Na Rota ({studentsInCurrentRoute.length})</TabsTrigger>
                          <TabsTrigger value="available">Adicionar Alunos ({availableStudents.length})</TabsTrigger>
                      </TabsList>
                      <TabsContent value="inRoute">
                          <Card>
                              <CardContent className="p-2">
                                  <ScrollArea className="h-56">
                                      {studentsInCurrentRoute.length > 0 ? studentsInCurrentRoute.map((s, index) => (
                                          <div key={s.id} className="flex items-center justify-between rounded-md p-1 hover:bg-accent/50">
                                              <div className="flex min-w-0 flex-1 items-center gap-2">
                                                  <span className="w-6 flex-shrink-0 text-center text-xs font-mono text-muted-foreground">{index + 1}</span>
                                                  <span className="truncate font-medium text-sm">{s.name}</span>
                                              </div>
                                              <div className="flex items-center">
                                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveInRoute(s.id, 'up')} disabled={index === 0}>
                                                      <ArrowUp className="h-4 w-4" />
                                                  </Button>
                                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveInRoute(s.id, 'down')} disabled={index === studentsInCurrentRoute.length - 1}>
                                                      <ArrowDown className="h-4 w-4" />
                                                  </Button>
                                                  <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => removeStudentFromRoute(s.id)}>
                                                      <X className="h-4 w-4 text-destructive" />
                                                  </Button>
                                              </div>
                                          </div>
                                      )) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno na rota.</p>}
                                  </ScrollArea>
                              </CardContent>
                          </Card>
                      </TabsContent>
                      <TabsContent value="available">
                          <Card>
                              <div className="border-b p-2">
                                  <Input
                                  placeholder="Buscar aluno..."
                                  value={studentSearch}
                                  onChange={(e) => setStudentSearch(e.target.value)}
                                  className="h-8"
                                  />
                              </div>
                              <CardContent className="p-2">
                                  <ScrollArea className="h-48">
                                      {availableStudents.length > 0 ? availableStudents.map(s => (
                                          <div key={s.id} onClick={() => toggleSelection(s.id)} className="flex cursor-pointer items-center space-x-3 rounded-md p-2 hover:bg-accent/50">
                                              <Checkbox
                                                  id={`add-${s.id}`}
                                                  checked={selectedAvailable.has(s.id)}
                                                  onCheckedChange={() => toggleSelection(s.id)}
                                              />
                                              <label htmlFor={`add-${s.id}`} className="flex-1 cursor-pointer truncate text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {s.name}
                                              </label>
                                              <span className="text-xs text-muted-foreground">{s.shift}</span>
                                          </div>
                                      )) : <p className="p-8 text-center text-sm text-muted-foreground">Nenhum aluno disponível.</p>}
                                  </ScrollArea>
                              </CardContent>
                          </Card>
                          <Button type="button" className="mt-2 w-full" onClick={addSelectedStudents} disabled={selectedAvailable.size === 0}>Adicionar Selecionados ({selectedAvailable.size})</Button>
                      </TabsContent>
                  </Tabs>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="button" onClick={handleSubmit} disabled={isCapacityExceeded}>Salvar</Button>
          </DialogFooter>
      </div>
    </DialogContent>
  )
}
