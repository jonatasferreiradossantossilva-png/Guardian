'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
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
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  driverId: z.string().min(1, { message: 'Selecione um motorista.' }),
  assistantId: z.string().optional(),
  studentIds: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

type RouteFormValues = z.infer<typeof formSchema>;

type Driver = { id: string; name: string };
type Student = { id: string; name: string };

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
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<RouteFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      driverId: '',
      assistantId: '',
      studentIds: [],
      active: true,
    },
  });

  useEffect(() => {
    if (route) {
      form.reset({
        name: route.name || '',
        driverId: route.driverId || '',
        assistantId: route.assistantId || '',
        studentIds: route.studentIds || [],
        active: route.active ?? true,
      });
    } else {
      form.reset({
        name: '',
        driverId: '',
        assistantId: '',
        studentIds: [],
        active: true,
      });
    }
  }, [route, form]);

  const onSubmit = (data: RouteFormValues) => {
    if (!firestore) return;

    if (route) {
      const routeRef = doc(firestore, 'routes', route.id);
      updateDocumentNonBlocking(routeRef, data);
      toast({
        title: 'Rota atualizada!',
        description: `A rota ${data.name} foi atualizada.`,
      });
    } else {
      const routesCollection = collection(firestore, 'routes');
      addDocumentNonBlocking(routesCollection, data);
      toast({
        title: 'Rota adicionada!',
        description: `A rota ${data.name} foi adicionada ao sistema.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{route ? 'Editar Rota' : 'Adicionar Rota'}</DialogTitle>
        <DialogDescription>
          Preencha as informações da rota abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Rota</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Rota Matinal - Zona Sul" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="driverId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Motorista</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um motorista" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {drivers.map(driver => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="assistantId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Auxiliar (ID do Usuário)</FormLabel>
                <FormControl>
                  <Input placeholder="Cole o ID do usuário auxiliar (opcional)" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="studentIds"
            render={({ field }) => (
              <FormItem>
                <div className="mb-4">
                    <FormLabel>Alunos na Rota</FormLabel>
                    <FormDescription>
                        Selecione os alunos que fazem parte desta rota. A ordem ainda não é gerenciável aqui.
                    </FormDescription>
                </div>
                <ScrollArea className="h-40 w-full rounded-md border p-4">
                    {students.map((student) => (
                        <FormField
                            key={student.id}
                            control={form.control}
                            name="studentIds"
                            render={({ field }) => {
                                return (
                                <FormItem
                                    key={student.id}
                                    className="flex flex-row items-start space-x-3 space-y-0"
                                >
                                    <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(student.id)}
                                        onCheckedChange={(checked) => {
                                        return checked
                                            ? field.onChange([...(field.value || []), student.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                (value) => value !== student.id
                                                )
                                            )
                                        }}
                                    />
                                    </FormControl>
                                    <FormLabel className="font-normal">
                                        {student.name}
                                    </FormLabel>
                                </FormItem>
                                )
                            }}
                         />
                    ))}
                </ScrollArea>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Rota Ativa</FormLabel>
                  <FormDescription>
                    Marque se esta rota está atualmente em operação.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
