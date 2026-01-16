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
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  model: z.string().min(1, { message: 'O modelo é obrigatório.' }),
  licensePlate: z
    .string()
    .min(7, { message: 'A placa deve ter pelo menos 7 caracteres.' })
    .max(8, { message: 'A placa deve ter no máximo 8 caracteres.' }),
});

type VehicleFormValues = z.infer<typeof formSchema>;

interface VehicleFormProps {
  vehicle?: { id: string } & VehicleFormValues;
  onFormSubmit: () => void;
}

export function VehicleForm({ vehicle, onFormSubmit }: VehicleFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      model: '',
      licensePlate: '',
    },
  });

  useEffect(() => {
    if (vehicle) {
      form.reset(vehicle);
    } else {
      form.reset({
        model: '',
        licensePlate: '',
      });
    }
  }, [vehicle, form]);

  const onSubmit = (data: VehicleFormValues) => {
    if (!firestore) return;

    if (vehicle) {
      // Update existing vehicle
      const vehicleRef = doc(firestore, 'vehicles', vehicle.id);
      updateDocumentNonBlocking(vehicleRef, data);
      toast({
        title: 'Veículo atualizado!',
        description: `O veículo ${data.model} foi atualizado com sucesso.`,
      });
    } else {
      // Create new vehicle
      const vehiclesCollection = collection(firestore, 'vehicles');
      addDocumentNonBlocking(vehiclesCollection, data);
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
