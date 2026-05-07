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
  FormDescription,
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useData } from '@/hooks/use-data';
import { Wrench, DollarSign } from 'lucide-react';

const formSchema = z.object({
  odometer: z.coerce.number().min(1, { message: 'Informe a quilometragem atual.' }),
  cost: z.coerce.number().min(0, { message: 'O custo não pode ser negativo.' }),
  createExpense: z.boolean().default(true),
  description: z.string().min(3, { message: 'Descreva brevemente o serviço.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface MaintenanceFormProps {
  vehicle: { id: string; model: string; licensePlate: string; currentOdometer: number };
  onFormSubmit: () => void;
}

export function MaintenanceForm({ vehicle, onFormSubmit }: MaintenanceFormProps) {
  const { toast } = useToast();
  const { updateDoc, addDoc } = useData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      odometer: vehicle.currentOdometer,
      cost: 0,
      createExpense: true,
      description: `Revisão Preventiva - ${vehicle.model}`,
    },
  });

  const onSubmit = (data: FormValues) => {
    // 1. Atualiza o veículo (reseta o ciclo de manutenção)
    updateDoc('vehicles', vehicle.id, {
      lastMaintenanceOdometer: data.odometer,
      currentOdometer: data.odometer, // Sincroniza o odômetro atual
    });

    // 2. Opcionalmente cria uma despesa
    if (data.createExpense && data.cost > 0) {
      addDoc('expenses', {
        description: data.description,
        amount: data.cost,
        date: new Date().toISOString().split('T')[0],
        category: 'Manutenção',
      });
    }

    toast({
      title: 'Manutenção Registrada!',
      description: `O ciclo de revisão para ${vehicle.licensePlate} foi reiniciado.`,
    });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-primary" />
          Registrar Manutenção
        </DialogTitle>
        <DialogDescription>
          Confirme a realização do serviço para {vehicle.model} ({vehicle.licensePlate}).
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="odometer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quilometragem no Ato do Serviço</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormDescription>Isso resetará o contador de próxima revisão.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 border rounded-md p-4 bg-muted/20">
            <FormField
                control={form.control}
                name="createExpense"
                render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                    <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                    />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                    <FormLabel>Lançar custo no Financeiro</FormLabel>
                    </div>
                </FormItem>
                )}
            />

            {form.watch('createExpense') && (
                <>
                    <FormField
                        control={form.control}
                        name="cost"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Valor do Serviço (R$)</FormLabel>
                            <FormControl>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input type="number" step="0.01" className="pl-9" {...field} />
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição para o Financeiro</FormLabel>
                            <FormControl>
                                <Input {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </>
            )}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="submit">Confirmar e Resetar Ciclo</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
