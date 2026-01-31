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
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  model: z.string().min(1, { message: 'O modelo é obrigatório.' }),
  licensePlate: z
    .string()
    .min(7, { message: 'A placa deve ter pelo menos 7 caracteres.' })
    .max(8, { message: 'A placa deve ter no máximo 8 caracteres.' }),
  capacity: z.coerce.number().min(1, { message: 'A capacidade deve ser maior que zero.' }),
  active: z.boolean().default(true),
});

type VehicleFormValues = z.infer<typeof formSchema>;

interface VehicleFormProps {
  vehicle?: { id: string } & Partial<VehicleFormValues>;
  onFormSubmit: () => void;
}

export function VehicleForm({ vehicle, onFormSubmit }: VehicleFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: '',
      licensePlate: '',
      capacity: 1,
      active: true,
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset({
        model: vehicle.model || '',
        licensePlate: vehicle.licensePlate || '',
        capacity: vehicle.capacity || 1,
        active: vehicle.active ?? true,
      });
    } else {
      form.reset({
        model: '',
        licensePlate: '',
        capacity: 1,
        active: true,
      });
    }
  }, [vehicle, form]);

  const onSubmit = (data: VehicleFormValues) => {
    if (vehicle) {
      updateDoc('vehicles', vehicle.id, data);
      toast({
        title: 'Veículo atualizado!',
        description: `O veículo ${data.model} foi atualizado com sucesso.`,
      });
    } else {
      addDoc('vehicles', data);
      toast({
        title: 'Veículo adicionado!',
        description: `O veículo ${data.model} foi adicionado à frota.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{vehicle ? 'Editar Veículo' : 'Adicionar Veículo'}</DialogTitle>
        <DialogDescription>
          {vehicle
            ? 'Altere as informações do veículo abaixo.'
            : 'Preencha as informações do novo veículo para adicioná-lo à frota.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="model"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Mercedes-Benz Sprinter" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="licensePlate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Placa</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: BRA2E19" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacidade</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="15" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Veículo Ativo</FormLabel>
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
