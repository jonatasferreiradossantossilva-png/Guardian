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
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMockData } from '@/hooks/use-mock-data';
import { ArrowLeft, ArrowRight, ChevronsLeft, ChevronsRight, ArrowUp, ArrowDown, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  driverId: z.string().min(1, { message: 'Selecione um motorista.' }),
  assistantId: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  shift: z.enum(['manha', 'tarde'], { required_error: 'Selecione um turno.' }),
});

type RouteFormValues = z.infer<typeof formSchema>;
type Driver = { id: string; name: string };
type Student = { id: string; name: string, routeId?: string, shift: string };

interface RouteFormProps {
  route?: { id: string } & Partial<RouteFormValues>;
  drivers: Driver[];
  students: Student[];
  onFormSubmit: () => void;
}

export function RouteForm({
  route,
  drivers,
  students,
  onFormSubmit,
}: RouteFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc, db } = useMockData();
  const [selectedAvailable, setSelectedAvailable] = useState<Set<string>>(new Set());
  const [selectedInRoute, setSelectedInRoute] = useState<Set<string>>(new Set());

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      driverId: '',
      assistantId: '',
      studentIds: [],
      active: true,
      shift: 'manha',
    },
  });

  const shift = form.watch('shift');
  const studentIdsInForm = form.watch('studentIds');
  
  const { availableStudents, studentsInCurrentRoute } = useMemo(() => {
    const shiftInForm = shift === 'manha' ? 'Manhã' : 'Tarde';
    const studentsInCurrentRoute = (studentIdsInForm || [])
        .map(id => db.students.find(s => s.id === id))
        .filter(Boolean);

    const availableStudents = db.students.filter(s => {
        const studentShift = s.shift === 'manha' ? 'Manhã' : 'Tarde';
        const isSameShift = studentShift === shiftInForm;
        const isInAnotherRoute = s.routeId && s.routeId !== route?.id;
        const isAlreadyInThisRoute = studentIdsInForm.includes(s.id);
        return isSameShift && !isInAnotherRoute && !isAlreadyInThisRoute;
    });

    return { availableStudents, studentsInCurrentRoute };
  }, [shift, studentIdsInForm, db.students, route]);

  useEffect(() => {
    if (route) {
      form.reset({
        name: route.name || '',
        driverId: route.driverId || '',
        assistantId: route.assistantId || '',
        studentIds: route.studentIds || [],
        active: route.active ?? true,
        shift: route.shift || 'manha',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [route, form.reset]);

  const moveStudents = (direction: 'toRoute' | 'fromRoute' | 'allToRoute' | 'allFromRoute') => {
    const currentStudentIds = form.getValues('studentIds');
    if (direction === 'toRoute') {
      form.setValue('studentIds', [...currentStudentIds, ...Array.from(selectedAvailable)]);
      setSelectedAvailable(new Set());
    } else if (direction === 'fromRoute') {
      form.setValue('studentIds', currentStudentIds.filter(id => !selectedInRoute.has(id)));
      setSelectedInRoute(new Set());
    } else if (direction === 'allToRoute') {
        form.setValue('studentIds', [...currentStudentIds, ...availableStudents.map(s => s.id)]);
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


  const onSubmit = (data: RouteFormValues) => {
    if (route) {
      updateDoc('routes', route.id, data);
      toast({ title: 'Rota atualizada!', description: `A rota ${data.name} foi atualizada.` });
    } else {
      addDoc('routes', data);
      toast({ title: 'Rota adicionada!', description: `A rota ${data.name} foi adicionada ao sistema.` });
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
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="name" render={({ field }) => (
              <FormItem><FormLabel>Nome da Rota</FormLabel><FormControl><Input placeholder="Ex: Rota Matinal - Zona Sul" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="driverId" render={({ field }) => (
              <FormItem><FormLabel>Motorista</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione um motorista" /></SelectTrigger></FormControl><SelectContent>{drivers.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
            )}/>
             <FormField control={form.control} name="shift" render={({ field }) => (
              <FormItem><FormLabel>Turno</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger></FormControl><SelectContent><SelectItem value="manha">Manhã</SelectItem><SelectItem value="tarde">Tarde</SelectItem></SelectContent></Select><FormMessage /></FormItem>
            )}/>
            <FormField control={form.control} name="assistantId" render={({ field }) => (
              <FormItem><FormLabel>Auxiliar (ID do Usuário)</FormLabel><FormControl><Input placeholder="Cole o ID do usuário auxiliar (opcional)" {...field} /></FormControl><FormMessage /></FormItem>
            )}/>
          </div>

          {/* Student Selector */}
          <div className="pt-4">
            <FormLabel>Alunos na Rota</FormLabel>
            <FormDescription className="mb-2">Mova os alunos para a lista da direita e ordene-os para definir as paradas.</FormDescription>
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                {/* Available Students */}
                <CardWithListHeader title="Alunos Disponíveis" count={availableStudents.length}>
                    <ScrollArea className="h-48">
                        {availableStudents.map(s => (
                            <div key={s.id} onClick={() => toggleSelection('available', s.id)} data-state={selectedAvailable.has(s.id) ? 'selected' : 'deselected'} className="p-2 text-sm rounded-md cursor-pointer data-[state=selected]:bg-primary data-[state=selected]:text-primary-foreground hover:bg-accent">
                                {s.name}
                            </div>
                        ))}
                    </ScrollArea>
                </CardWithListHeader>

                {/* Controls */}
                <div className="flex flex-col gap-2">
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('allToRoute')}><ChevronsRight/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('toRoute')}><ArrowRight/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('fromRoute')}><ArrowLeft/></Button>
                    <Button type="button" size="icon" variant="outline" onClick={() => moveStudents('allFromRoute')}><ChevronsLeft/></Button>
                </div>

                {/* Students in Route */}
                <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
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
                     <div className="flex flex-col gap-2">
                        <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('up')}><ArrowUp/></Button>
                        <Button type="button" size="icon" variant="outline" onClick={() => moveInRoute('down')}><ArrowDown/></Button>
                    </div>
                </div>
            </div>
          </div>
          
          <FormField control={form.control} name="active" render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4"><div className="space-y-0.5"><FormLabel>Rota Ativa</FormLabel><FormDescription>Marque se esta rota está atualmente em operação.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
          )}/>

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar</Button>
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
