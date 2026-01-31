'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
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
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  date: z.date({ required_error: 'A data é obrigatória.' }),
  type: z.enum(['ida', 'volta', 'ida_e_volta'], { required_error: 'O tipo é obrigatório.' }),
  shift: z.enum(['manha', 'tarde'], { required_error: 'O turno é obrigatório.' }),
  reason: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TripRequestFormProps {
  request?: { id: string; date?: string | Date } & Partial<FormValues>;
  studentId: string;
  schoolId: string;
  parentUserId: string;
  onFormSubmit: () => void;
}

export function TripRequestForm({ request, studentId, schoolId, parentUserId, onFormSubmit }: TripRequestFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: undefined,
      type: 'ida_e_volta',
      shift: 'manha',
      reason: '',
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        date: request.date ? new Date(request.date) : undefined,
        type: request.type || 'ida_e_volta',
        shift: request.shift || 'manha',
        reason: request.reason || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [request, form]);

  const onSubmit = (data: FormValues) => {

    if (request) {
       const updateData = {
        ...data,
        date: format(data.date, 'yyyy-MM-dd'),
      };
      updateDoc('trip_requests', request.id, updateData);
      toast({
        title: 'Solicitação atualizada!',
        description: 'Sua solicitação de viagem avulsa foi atualizada.',
      });
    } else {
        const createData = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
            studentId,
            parentUserId,
            schoolId,
            createdAt: new Date().toISOString(),
            status: 'pendente',
        };
      addDoc('trip_requests', createData);
      toast({
        title: 'Solicitação enviada!',
        description: 'Sua solicitação de viagem avulsa foi enviada para análise.',
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{request ? 'Editar Solicitação' : 'Nova Solicitação de Viagem'}</DialogTitle>
        <DialogDescription>
          Preencha os detalhes da viagem que você precisa.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data da Viagem</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Viagem</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ida_e_volta">Ida e Volta</SelectItem>
                    <SelectItem value="ida">Apenas Ida</SelectItem>
                    <SelectItem value="volta">Apenas Volta</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ex: Consulta médica, evento escolar, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="pt-4">
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
