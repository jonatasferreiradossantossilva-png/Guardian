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
import { useEffect, useState, useMemo } from 'react';
import { useDataCollection, useData } from '@/hooks/use-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, School, Search } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, isSameDay, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from "react-day-picker";
import { getSafeDate } from '@/lib/safe-render';

const formSchema = z.object({
  startDate: z.date({ required_error: 'A data de início é obrigatória.' }),
  endDate: z.date({ required_error: 'A data de término é obrigatória.' }),
  schoolId: z.string({ required_error: 'A escola de destino é obrigatória.' }),
  type: z.enum(['ida', 'volta', 'ida_e_volta'], { required_error: 'O tipo é obrigatório.' }),
  shift: z.enum(['manha', 'tarde'], { required_error: 'O turno é obrigatório.' }),
  reason: z.string().optional(),
}).refine((data) => data.endDate >= data.startDate, {
  message: "A data final não pode ser anterior à data inicial.",
  path: ["endDate"],
});

type FormValues = z.infer<typeof formSchema>;

interface TripRequestFormProps {
  request?: { 
    id: string; 
    date?: string; 
    startDate?: string; 
    endDate?: string;
    schoolId?: string;
    type?: any;
    shift?: any;
    reason?: string;
  };
  studentId: string;
  schoolId: string; // Default school ID
  parentUserId: string;
  onFormSubmit: () => void;
}

export function TripRequestForm({ request, studentId, schoolId: defaultSchoolId, parentUserId, onFormSubmit }: TripRequestFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();
  const { data: schools } = useDataCollection('schools');

  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      startDate: undefined,
      endDate: undefined,
      schoolId: defaultSchoolId,
      type: 'ida_e_volta',
      shift: 'manha',
      reason: '',
    },
  });

  useEffect(() => {
    if (request) {
      const start = request.startDate ? getSafeDate(request.startDate) : (request.date ? getSafeDate(request.date) : undefined);
      const end = request.endDate ? getSafeDate(request.endDate) : (request.date ? getSafeDate(request.date) : undefined);
      
      form.reset({
        startDate: start,
        endDate: end,
        schoolId: request.schoolId || defaultSchoolId,
        type: request.type || 'ida_e_volta',
        shift: request.shift || 'manha',
        reason: request.reason || '',
      });
    } else {
      form.reset({
        startDate: undefined,
        endDate: undefined,
        type: 'ida_e_volta',
        shift: 'manha',
        reason: '',
        schoolId: defaultSchoolId
      });
    }
  }, [request, form, defaultSchoolId]);

  const onSubmit = (data: FormValues) => {
    const startDate = format(data.startDate, 'yyyy-MM-dd');
    const endDate = format(data.endDate, 'yyyy-MM-dd');

    const baseData = {
      startDate,
      endDate,
      schoolId: data.schoolId,
      type: data.type,
      shift: data.shift,
      reason: data.reason,
    };

    if (request) {
      updateDoc('trip_requests', request.id, baseData);
      toast({
        title: 'Solicitação atualizada!',
        description: 'Sua solicitação de viagem avulsa foi atualizada.',
      });
    } else {
      const createData = {
        ...baseData,
        studentId,
        parentUserId,
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
          
          <FormField
            control={form.control}
            name="schoolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Escola de Destino</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="pl-10 relative">
                      <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools?.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Inicial</FormLabel>
                  <Popover open={isStartPickerOpen} onOpenChange={setIsStartPickerOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Início</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsStartPickerOpen(false);
                        }}
                        disabled={(date) =>
                          startOfDay(date) < startOfDay(new Date())
                        }
                        autoFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data Final</FormLabel>
                  <Popover open={isEndPickerOpen} onOpenChange={setIsEndPickerOpen} modal={true}>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          type="button"
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "dd/MM/yyyy")
                          ) : (
                            <span>Fim</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 pointer-events-auto" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date);
                          setIsEndPickerOpen(false);
                        }}
                        disabled={(date) =>
                          startOfDay(date) < startOfDay(new Date()) || 
                          (form.watch('startDate') && startOfDay(date) < startOfDay(form.watch('startDate')))
                        }
                        autoFocus
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tipo" />
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
                        <SelectValue placeholder="Turno" />
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
          </div>

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Observação (Opcional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ex: Consulta médica, evento escolar, etc." {...field} className="resize-none h-20" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Solicitar Viagem</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
