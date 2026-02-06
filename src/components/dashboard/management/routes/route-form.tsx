
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { useMemo, useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMockData } from '@/hooks/use-mock-data';
import { ArrowUp, ArrowDown, Users, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  driverId: z.string().min(1, { message: 'Selecione um motorista.' }),
  monitorId: z.string().optional(),
});

type RouteFormValues = z.infer<typeof formSchema>;
type Driver = { id: string; name: string; vehicleId?: string; };
type Student = { id: string; name: string, routeId?: string, shift: string, active?: boolean };
type Monitor = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };

interface RouteFormProps {
  route?: { id: string; studentIds?: string[] } & Partial<RouteFormValues>;
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

  const [currentStudentIds, setCurrentStudentIds] = useState<string[]>(route?.studentIds || []);
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');
  
  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: route?.name || '',
      driverId: route?.driverId || '',
      monitorId: route?.monitorId || '',
    },
  });

  const [driverId, setDriverId] = useState(form.getValues('driverId'));

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'driverId') {
        setDriverId(value.driverId);
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);


  const { vehicle, vehicleCapacity } = useMemo(() => {
    if (!driverId || !drivers || !vehicles) return { vehicle: null, vehicleCapacity: Infinity };
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.vehicleId) return { vehicle: null, vehicleCapacity: Infinity };
    const vehicle = vehicles.find(v => v.id === driver.vehicleId);
    if (!vehicle) return { vehicle: null, vehicleCapacity: Infinity };
    return { vehicle, vehicleCapacity: vehicle.capacity };
  }, [driverId, drivers, vehicles]);

  const isCapacityExceeded = useMemo(() => {
    return currentStudentIds.length > vehicleCapacity;
  }, [currentStudentIds, vehicleCapacity]);

  
  const { availableStudents, studentsInCurrentRoute } = useMemo(() => {
    const studentMap = new Map(students.map(s => [s.id, s]));
    const studentsInCurrentRoute = currentStudentIds
        .map(id => studentMap.get(id))
        .filter(Boolean) as Student[];

    const availableStudents = students.filter(s => {
        const isInAnotherRoute = s.routeId && s.routeId !== route?.id;
        const isAlreadyInThisRoute = currentStudentIds.includes(s.id);
        const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
        return s.active !== false && !isInAnotherRoute && !isAlreadyInThisRoute && matchesSearch;
    });

    return { availableStudents, studentsInCurrentRoute };
  }, [currentStudentIds, students, route, studentSearch]);

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

  const onSubmit = (data: RouteFormValues) => {
    // Combine form data with the managed student list state
    const finalData = { ...data, studentIds: currentStudentIds };
    if (!finalData.monitorId || finalData.monitorId === 'none') {
        delete (finalData as Partial<typeof finalData>).monitorId;
    }

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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <ScrollArea className="max-h-[65vh] space-y-4 overflow-y-auto py-1 pr-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem><FormLabel>Nome da Rota</FormLabel><FormControl><Input placeholder="Ex: Rota Matinal - Zona Sul" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="driverId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Motorista</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um motorista" /></SelectTrigger></FormControl><SelectContent>{drivers.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent></Select>
                  {vehicle && (
                      <FormDescription>
                      Veículo: {vehicle.model} (Capacidade: {vehicle.capacity} alunos)
                      </FormDescription>
                  )}
                  <FormMessage />
                  </FormItem>
              )}/>
              <FormField control={form.control} name="monitorId" render={({ field }) => (
                  <FormItem>
                      <FormLabel>Monitor</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || 'none'}>
                          <FormControl>
                              <SelectTrigger>
                                  <SelectValue placeholder="Selecione um monitor (opcional)" />
                              </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                              <SelectItem value="none">Nenhum</SelectItem>
                              {monitors.map(a => (
                                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                              ))}
                          </SelectContent>
                      </Select>
                      <FormMessage />
                  </FormItem>
              )}/>
            </div>

            <div className="pt-4">
              <FormLabel>Alunos na Rota</FormLabel>
              <FormDescription className="mb-2">Ordene os alunos para definir as paradas ou adicione novos alunos na aba ao lado.</FormDescription>
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
            <Button type="submit" disabled={isCapacityExceeded}>Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
