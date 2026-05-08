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
import { useData } from '@/hooks/use-data';
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { maskCPF, maskPhone, maskCEP, maskRG, unmask } from '@/lib/masks';


const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  pin: z.string().min(4, { message: 'O PIN deve ter pelo menos 4 dígitos.' }).max(6, { message: 'O PIN deve ter no máximo 6 dígitos.' }),
  status: z.enum(['inativo', 'em_rota', 'pausa']),
  vehicleId: z.string().optional(),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  cnh: z.string().optional(),
  cnhCategory: z.string().optional(),
  zipCode: z.string().min(8, { message: 'O CEP é obrigatório e deve ter pelo menos 8 dígitos.' }),
  street: z.string().min(1, { message: 'A rua é obrigatória.' }),
  number: z.string().min(1, { message: 'O número é obrigatório.' }),
  complement: z.string().optional(),
  neighborhood: z.string().min(1, { message: 'O bairro é obrigatório.' }),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  state: z.string().min(1, { message: 'O estado é obrigatório.' }),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  active: z.boolean().default(true),
});

type DriverFormValues = z.infer<typeof formSchema>;

type Vehicle = { id: string; model: string; licensePlate: string };

interface DriverFormProps {
  driver?: { id: string; userId?: string } & Partial<DriverFormValues>;
  vehicles: Vehicle[];
  onFormSubmit: () => void;
}

export function DriverForm({
  driver,
  vehicles,
  onFormSubmit,
}: DriverFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<DriverFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      pin: '',
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
      latitude: undefined,
      longitude: undefined,
      active: true,
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
            form.setValue('street', data.logradouro || '');
            form.setValue('neighborhood', data.bairro || '');
            form.setValue('city', data.localidade || '');
            form.setValue('state', data.uf || '');
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
        pin: (driver as any).pin || '',
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
        latitude: driver.latitude,
        longitude: driver.longitude,
        active: driver.active ?? true,
      });
    } else {
      form.reset();
    }
  }, [driver, form]);

  const onSubmit = (data: DriverFormValues) => {
    const driverData = { 
      ...data,
      status: data.status || 'inativo',
      latitude: data.latitude ?? 0,
      longitude: data.longitude ?? 0,
      userId: driver?.userId || `user-dri-${unmask(data.cpf || '') || Date.now()}`
    };
    if (!driverData.vehicleId || driverData.vehicleId === 'none') {
        delete (driverData as Partial<typeof driverData>).vehicleId;
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
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{driver ? 'Editar Motorista' : 'Adicionar Motorista'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do motorista abaixo.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="driver-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Motorista</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Carlos Silva" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN de Acesso (4-6 dígitos)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: 123456" 
                        type="password"
                        maxLength={6}
                        {...field} 
                        value={field.value ?? ''} 
                        onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                      />
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
                      <FormLabel>CPF (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="000.000.000-00" 
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(maskCPF(e.target.value))}
                        />
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
                      <FormLabel>RG (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="00.000.000-0" 
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(maskRG(e.target.value))}
                        />
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
                      <FormLabel>CNH (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="01234567890" {...field} value={field.value ?? ''} />
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
                      <FormLabel>Categoria CNH (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: D" {...field} value={field.value ?? ''} />
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
                                <Input 
                                  placeholder="00000-000" 
                                  {...field} 
                                  value={field.value ?? ''} 
                                  onChange={(e) => field.onChange(maskCEP(e.target.value))}
                                />
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
                            <FormControl><Input placeholder="Rua das Flores" {...field} value={field.value ?? ''} /></FormControl>
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
                            <FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="complement"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Complemento</FormLabel>
                            <FormControl><Input placeholder="Apto 4B" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="neighborhood"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl><Input placeholder="Centro" {...field} value={field.value ?? ''} /></FormControl>
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
                            <FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="state"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                            <FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
              </div>
              
              <div className="pt-4 pb-6">
                <FormField
                  control={form.control}
                  name="vehicleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Veículo Associado (Opcional)</FormLabel>
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
              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mb-6">
                    <div className="space-y-0.5">
                      <FormLabel>Motorista Ativo</FormLabel>
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
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" form="driver-form">Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
