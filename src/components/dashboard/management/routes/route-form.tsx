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
import { useEffect, useMemo, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMockData } from '@/hooks/use-mock-data';
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Users, AlertCircle, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  driverId: z.string().min(1, { message: 'Selecione um motorista.' }),
  assistantId: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
});

type RouteFormValues = z.infer<typeof formSchema>;
type Driver = { id: string; name: string; vehicleId?: string; };
type Student = { id: string; name: string, routeId?: string, shift: string };
type Assistant = { id: string; name: string };
type Vehicle = { id: string; model: string; capacity: number; };

interface RouteFormProps {
  route?: { id: string } & Partial<RouteFormValues>;
  drivers: Driver[];
  students: Student[];
  assistants: Assistant[];
  vehicles: Vehicle[];
  onFormSubmit: () => void;
}

export function RouteForm({
  route,
  drivers,
  students,
  assistants,
  vehicles,
  onFormSubmit,
}: RouteFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc, db } = useMockData();
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [selectedInRoute, setSelectedInRoute] = useState<Set<string>>(new Set());
  const [studentSearch, setStudentSearch] = useState('');

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      driverId: '',
      assistantId: '',
      studentIds: [],
    },
  });

  const studentIdsInForm = form.watch('studentIds');
  const driverId = form.watch('driverId');

  const { vehicle, vehicleCapacity } = useMemo(() => {
    if (!driverId || !drivers || !vehicles) return { vehicle: null, vehicleCapacity: Infinity };
    const driver = drivers.find(d => d.id === driverId);
    if (!driver?.vehicleId) return { vehicle: null, vehicleCapacity: Infinity };
    const vehicle = vehicles.find(v => v.id === driver.vehicleId);
    if (!vehicle) return { vehicle: null, vehicleCapacity: Infinity };
    return { vehicle, vehicleCapacity: vehicle.capacity };
  }, [driverId, drivers, vehicles]);

  const isCapacityExceeded = useMemo(() => {
    return studentIdsInForm.length > vehicleCapacity;
  }, [studentIdsInForm, vehicleCapacity]);

  
  const { availableStudents, studentsInCurrentRoute } = useMemo(() => {
    const studentsInCurrentRoute = (studentIdsInForm || [])
        .map(id => db.students.find(s => s.id === id))
        .filter(Boolean);

    const availableStudents = db.students.filter(s => {
        const isInAnotherRoute = s.routeId && s.routeId !== route?.id;
        const isAlreadyInThisRoute = studentIdsInForm.includes(s.id);
        const matchesSearch = s.name.toLowerCase().includes(studentSearch.toLowerCase());
        return !isInAnotherRoute && !isAlreadyInThisRoute && matchesSearch;
    });

    return { availableStudents, studentsInCurrentRoute };
  }, [studentIdsInForm, db.students, route, studentSearch]);

  useEffect(() => {
    if (route) {
      form.reset({
        name: route.name || '',
        driverId: route.driverId || '',
        assistantId: route.assistantId || '',
        studentIds: route.studentIds || [],
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [route, form]);

  const moveStudents = (direction: 'toRoute' | 'fromRoute' | 'allToRoute' | 'allFromRoute') => {
    const currentStudentIds = form.getValues('studentIds');
    let studentsToAdd: string[] = [];

    if (direction === 'toRoute') {
      studentsToAdd = [...Array.from(selectedAvailable)];
    } else if (direction === 'allToRoute') {
      studentsToAdd = availableStudents.map(s => s.id);
    }
    
    if (direction === 'toRoute' || direction === 'allToRoute') {
      if (currentStudentIds.length + studentsToAdd.length > vehicleCapacity) {
        toast({
          title: "Capacidade do veículo excedida!",
          description: `A rota não pode ter mais de ${vehicleCapacity} alunos para este veículo.`,
          variant: "destructive",
        });
        return;
      }
      form.setValue('studentIds', [...currentStudentIds, ...studentsToAdd]);
      setSelectedAvailable(new Set());
    } 
    else if (direction === 'fromRoute') {
      form.setValue('studentIds', currentStudentIds.filter(id => !selectedInRoute.has(id)));
      setSelectedInRoute(new Set());
    } else if (direction === 'allFromRoute') {
        form.setValue('studentIds', []);
    }
  };

  const moveInRoute = (direction: 'up' | 'down') => {
    const ids = Array.from(selectedInRoute);
    if (ids.length !== 1) return;
    const studentId = ids[0];
    const currentList = form.getValues('studentIds');
    const index = currentList.indexOf(studentId);

    if (direction === 'up' && index > 0) {
        const newList = [...currentList];
        [newList[index - 1], newList[index]] = [newList[index], newList[index-1]];
        form.setValue('studentIds', newList);
    } else if (direction === 'down' && index < currentList.length - 1) {
        const newList = [...currentList];
        [newList[index + 1], newList[index]] = [newList[index], newList[index+1]];
        form.setValue('studentIds', newList);
    }
  };
  
  const toggleSelection = (list: 'available' | 'inRoute', id: string) => {
    const setter = list === 'available' ? setSelectedAvailable : setSelectedInRoute;
    const currentSet = list === 'available' ? selectedAvailable : selectedInRoute;
    const newSet = new Set(currentSet);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setter(newSet);
  };

  const removeStudentFromRoute = (studentId: string) => {
    const currentStudentIds = form.getValues('studentIds');
    form.setValue('studentIds', currentStudentIds.filter(id => id !== studentId));
  }


  const onSubmit = (data: RouteFormValues) => {
    const finalData = { ...data };
    if (!finalData.assistantId || finalData.assistantId === 'none') {
        delete (finalData as Partial<typeof finalData>).assistantId;
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
    <DialogContent className="sm:max-w-4xl">
      <DialogHeader>
        <DialogTitle>{route ? 'Editar Rota' : 'Adicionar Rota'}</DialogTitle>
        <DialogDescription>
          Preencha as informações da rota, defina o motorista e organize os alunos que farão parte dela.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <FormField control={form.control} name="assistantId" render={({ field }) => (
                <FormItem>
                    <FormLabel>Auxiliar</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || ''}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione um auxiliar (opcional)" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {assistants.map(a => (
                                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}/>
          </div>

          {/* Student Selector */}
          <div className="pt-4">
            <FormLabel>Alunos na Rota</FormLabel>
            <FormDescription className="mb-2">Mova os alunos para a lista da direita e ordene-os para definir as paradas.</FormDescription>
             {isCapacityExceeded && (
                <div className="text-destructive text-sm font-medium flex items-center gap-2 p-2 bg-destructive/10 rounded-md my-2">
                    <AlertCircle className="h-4 w-4" />
                    Capacidade de {vehicleCapacity} alunos excedida! Salve ou remova alunos.
                </div>
            )}

            {/* DESKTOP VIEW */}
            <div className="hidden md:grid md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-2 items-center">
                {/* Available Students */}
                 <Card>
                    <div className="p-2 border-b">
                        <h4 className="text-sm font-semibold flex items-center justify-between">
                            <span>Alunos Disponíveis</span>
                            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1"><Users size={14}/> {availableStudents.length}</span>
                        </h4>
                        <Input
                          placeholder="Buscar aluno..."
                          value={studentSearch}
                          onChange={(e) => setStudentSearch(e.target.value)}
                          className="h-8 mt-2"
                        />
                    </div>
                    <div className="p-2">
                        <ScrollArea className="h-48">
                            {availableStudents.map(s => (
                                <div key={s.id} onClick={() => toggleSelection('available', s.id)} data-state={selectedAvailable.has(s.id) ? 'selected' : 'deselected'} className="p-2 text-sm rounded-md cursor-pointer data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground hover:bg-accent flex justify-between">
                                  <span>{s.name}</span>
                                  <span className="text-muted-foreground text-xs">{s.shift}</span>
                                </div>
                            ))}
                        </ScrollArea>
                    </div>
                </Card>

                {/* Controls */}
                <div className="flex flex-row md:flex-col gap-2 justify-center">
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('allToRoute')}><ChevronsRight/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('toRoute')}><ArrowRight/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('fromRoute')}><ArrowLeft/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('allFromRoute')}><ChevronsLeft/></Button>
                </div>

                {/* Students in Route */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 md:gap-2 items-center">
                    <CardWithListHeader title="Alunos na Rota (Paradas)" count={studentsInCurrentRoute.length}>
                        <ScrollArea className="h-48">
                            {studentsInCurrentRoute.map((s, index) => (
                                <div key={s.id} onClick={() => toggleSelection('inRoute', s.id)} data-state={selectedInRoute.has(s.id) ? 'selected' : 'deselected'} className="p-2 text-sm rounded-md cursor-pointer data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground hover:bg-accent flex items-center gap-2">
                                    <span className="text-muted-foreground w-4">{index + 1}.</span>
                                    <span>{s.name}</span>
                                </div>
                            ))}
                        </ScrollArea>
                    </CardWithListHeader>
                     <div className="flex flex-row md:flex-col gap-2 justify-center">
                        <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('up')}><ArrowUp/></Button>
                        <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('down')}><ArrowDown/></Button>
                    </div>
                </div>
            </div>

            {/* MOBILE VIEW */}
             <div className="md:hidden flex flex-col gap-4">
                <Tabs defaultValue="inRoute">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="inRoute">Na Rota ({studentsInCurrentRoute.length})</TabsTrigger>
                        <TabsTrigger value="available">Disponíveis ({availableStudents.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="inRoute">
                        <Card>
                            <CardContent className="p-2">
                                <ScrollArea className="h-56">
                                    {studentsInCurrentRoute.length > 0 ? studentsInCurrentRoute.map((s, index) => (
                                        <div key={s.id} onClick={() => toggleSelection('inRoute', s.id)} data-state={selectedInRoute.has(s.id) ? 'selected' : 'deselected'} className="p-2 text-sm rounded-md cursor-pointer data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground hover:bg-accent flex items-center justify-between gap-2">
                                             <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <span className="text-muted-foreground w-4">{index + 1}.</span>
                                                <span className="truncate font-medium">{s.name}</span>
                                            </div>
                                             <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => { e.stopPropagation(); removeStudentFromRoute(s.id); }}>
                                                <X className="h-4 w-4 text-destructive"/>
                                            </Button>
                                        </div>
                                    )) : <p className="text-center text-sm text-muted-foreground p-8">Nenhum aluno na rota.</p>}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <div className="flex gap-2 mt-2 justify-center">
                            <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('up')} disabled={selectedInRoute.size !== 1}><ArrowUp/></Button>
                            <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('down')} disabled={selectedInRoute.size !== 1}><ArrowDown/></Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="available">
                        <Card>
                             <div className="p-2 border-b">
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
                                        <div key={s.id} onClick={() => toggleSelection('available', s.id)} data-state={selectedAvailable.has(s.id) ? 'selected' : 'deselected'} className="p-2 text-sm rounded-md cursor-pointer data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground hover:bg-accent flex justify-between items-center gap-2">
                                            <span className="truncate font-medium">{s.name}</span>
                                            <span className="text-muted-foreground text-xs shrink-0">{s.shift}</span>
                                        </div>
                                    )) : <p className="text-center text-sm text-muted-foreground p-8">Nenhum aluno disponível.</p>}
                                </ScrollArea>
                            </CardContent>
                        </Card>
                        <Button type="button" className="w-full mt-2" onClick={() => moveStudents('toRoute')} disabled={selectedAvailable.size === 0}>Adicionar selecionados</Button>
                    </TabsContent>
                </Tabs>
            </div>
          </div>
          
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isCapacityExceeded}>Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

const CardWithListHeader = ({ title, count, children }) => (
    <Card>
        <div className="p-2 border-b">
            <h4 className="text-sm font-semibold flex items-center justify-between">
                <span>{title}</span>
                <span className="text-xs font-normal text-muted-foreground flex items-center gap-1"><Users size={14}/> {count}</span>
            </h4>
        </div>
        <div className="p-2">{children}</div>
    </Card>
);

    