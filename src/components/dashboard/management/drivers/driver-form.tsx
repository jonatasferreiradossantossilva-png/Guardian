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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';


const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  userId: z.string().min(1, { message: 'O ID do usuário é obrigatório.' }),
  status: z.enum(['inativo', 'em_rota', 'pausa']),
  vehicleId: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  address: z.string().optional(),
});

type DriverFormValues = z.infer<typeof formSchema>;

type Vehicle = { id: string; model: string; licensePlate: string };

interface DriverFormProps {
  driver?: { id: string } & Partial<DriverFormValues>;
  vehicles: Vehicle[];
  onFormSubmit: () => void;
}

export function DriverForm({
  driver,
  vehicles,
  onFormSubmit,
}: DriverFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      userId: '',
      status: 'inativo',
      vehicleId: '',
      cpf: '',
      rg: '',
      address: '',
    },
  });

  useEffect(() => {
    if (driver) {
      form.reset({
        name: driver.name || '',
        userId: driver.userId || '',
        status: driver.status || 'inativo',
        vehicleId: driver.vehicleId || '',
        cpf: driver.cpf || '',
        rg: driver.rg || '',
        address: driver.address || '',
      });
    } else {
      form.reset({
        name: '',
        userId: '',
        status: 'inativo',
        vehicleId: '',
        cpf: '',
        rg: '',
        address: '',
      });
    }
  }, [driver, form]);

  const onSubmit = (data: DriverFormValues) => {
    const driverData = { ...data };
    if (!driverData.vehicleId) {
        delete (driverData as Partial<typeof driverData>).vehicleId; // Do not save empty string
    }

    if (driver) {
      updateDoc('drivers', driver.id, driverData);
      toast({
        title: 'Motorista atualizado!',
        description: `Os dados de ${data.name} foram atualizados.`,
      });
    } else {
      addDoc('drivers', driverData);
      toast({
        title: 'Motorista adicionado!',
        description: `${data.name} foi adicionado ao sistema.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{driver ? 'Editar Motorista' : 'Adicionar Motorista'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do motorista abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Motorista</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Carlos Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Usuário (Auth)</FormLabel>
                <FormControl>
                  <Input placeholder="Cole o UID do Firebase Auth" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <Input placeholder="000.000.000-00" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="rg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>RG</FormLabel>
                  <FormControl>
                    <Input placeholder="00.000.000-0" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="inativo">Inativo</SelectItem>
                    <SelectItem value="em_rota">Em Rota</SelectItem>
                    <SelectItem value="pausa">Em Pausa</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="vehicleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Veículo Associado</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Nenhum veículo associado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {vehicles.map(vehicle => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.model} ({vehicle.licensePlate})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
