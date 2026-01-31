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
import { useEffect, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Loader2 } from 'lucide-react';


const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  userId: z.string().min(1, { message: 'O ID do usuário é obrigatório.' }),
  status: z.enum(['inativo', 'em_rota', 'pausa']),
  vehicleId: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  cnhCategory: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
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
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      userId: '',
      status: 'inativo',
      vehicleId: '',
      cpf: '',
      rg: '',
      cnh: '',
      cnhCategory: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  const zipCode = form.watch('zipCode');

  useEffect(() => {
    if (zipCode && zipCode.replace(/\D/g, '').length === 8) {
      const fetchAddress = async () => {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${zipCode.replace(/\D/g, '')}/json/`);
          if (!response.ok) throw new Error('Falha ao buscar CEP');
          const data = await response.json();
          if (!data.erro) {
            form.setValue('street', data.logradouro);
            form.setValue('neighborhood', data.bairro);
            form.setValue('city', data.localidade);
            form.setValue('state', data.uf);
            toast({
              title: 'Endereço preenchido!',
              description: 'Os dados de endereço foram carregados automaticamente.',
            });
            form.setFocus('number');
          } else {
             toast({
              title: 'CEP não encontrado',
              description: 'Verifique o CEP e tente novamente.',
              variant: 'destructive',
            });
          }
        } catch (error) {
          console.error('Failed to fetch CEP:', error);
          toast({
            title: 'Erro de Rede',
            description: 'Não foi possível conectar ao serviço de CEP.',
            variant: 'destructive',
          });
        } finally {
          setIsFetchingCep(false);
        }
      };
      fetchAddress();
    }
  }, [zipCode, form, toast]);


  useEffect(() => {
    if (driver) {
      form.reset({
        name: driver.name || '',
        userId: driver.userId || '',
        status: driver.status || 'inativo',
        vehicleId: driver.vehicleId || '',
        cpf: driver.cpf || '',
        rg: driver.rg || '',
        cnh: driver.cnh || '',
        cnhCategory: driver.cnhCategory || '',
        zipCode: driver.zipCode || '',
        street: driver.street || '',
        number: driver.number || '',
        complement: driver.complement || '',
        neighborhood: driver.neighborhood || '',
        city: driver.city || '',
        state: driver.state || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [driver, form]);

  const onSubmit = (data: DriverFormValues) => {
    const driverData = { ...data };
    if (!driverData.vehicleId || driverData.vehicleId === 'none') {
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
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{driver ? 'Editar Motorista' : 'Adicionar Motorista'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do motorista abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cnh"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CNH</FormLabel>
                  <FormControl>
                    <Input placeholder="01234567890" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cnhCategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria CNH</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: D" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="border-t pt-4 mt-4">
             <p className="text-sm font-medium mb-2">Endereço</p>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <FormField
                    control={form.control} name="zipCode"
                    render={({ field }) => (
                        <FormItem className="md:col-span-1">
                        <FormLabel>CEP</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input placeholder="00000-000" {...field} />
                            {isFetchingCep && (
                              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="street"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                        <FormLabel>Rua</FormLabel>
                        <FormControl><Input placeholder="Rua das Flores" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                 <FormField
                    control={form.control} name="number"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl><Input placeholder="123" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="complement"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl><Input placeholder="Apto 4B" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormField
                    control={form.control} name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="state"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl><Input placeholder="SP" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
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
                  <Select onValueChange={field.onChange} value={field.value || ''}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Nenhum veículo associado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
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
          </div>

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
