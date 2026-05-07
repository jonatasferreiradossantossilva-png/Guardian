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
  email: z.string().email({ message: 'Email inválido.' }).optional().or(z.literal('')),
  phone: z.string()
    .optional()
    .refine((val) => !val || unmask(val).length >= 10, {
      message: 'Telefone deve ter ao menos 10 dígitos',
    }),
  cpf: z.string()
    .optional()
    .refine((val) => !val || unmask(val).length === 11, {
      message: 'CPF deve ter 11 dígitos',
    }),
  rg: z.string().optional(),
  zipCode: z.string()
    .optional()
    .refine((val) => !val || unmask(val).length === 8, {
      message: 'CEP deve ter 8 dígitos',
    }),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  status: z.enum(['inativo', 'em_rota', 'pausa']),
  vehicleId: z.string().optional(),
  active: z.boolean().default(true),
});

type MonitorFormValues = z.infer<typeof formSchema>;

type Vehicle = { id: string; model: string; licensePlate: string };

interface MonitorFormProps {
  monitor?: { id: string; userId?: string } & Partial<MonitorFormValues>;
  vehicles: Vehicle[];
  onFormSubmit: () => void;
}

export function MonitorForm({
  monitor,
  vehicles,
  onFormSubmit,
}: MonitorFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<MonitorFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      pin: '',
      email: '',
      phone: '',
      cpf: '',
      rg: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      status: 'inativo',
      vehicleId: '',
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
    if (monitor) {
      form.reset({
        name: monitor.name || '',
        pin: (monitor as any).pin || '',
        email: monitor.email || '',
        phone: monitor.phone || '',
        cpf: monitor.cpf || '',
        rg: monitor.rg || '',
        zipCode: monitor.zipCode || '',
        street: monitor.street || '',
        number: monitor.number || '',
        complement: monitor.complement || '',
        neighborhood: monitor.neighborhood || '',
        city: monitor.city || '',
        state: monitor.state || '',
        status: (monitor as any).status || 'inativo',
        vehicleId: (monitor as any).vehicleId || '',
        active: monitor.active ?? true,
      });
    } else {
      form.reset();
    }
  }, [monitor, form]);

  const onSubmit = (data: MonitorFormValues) => {
    const monitorData = { 
      ...data,
      userId: monitor?.userId || `user-mon-${unmask(data.cpf || '') || Date.now()}`
    };
    if (!monitorData.vehicleId || monitorData.vehicleId === 'none') {
        delete (monitorData as Partial<typeof monitorData>).vehicleId;
    }
    
    if (monitor) {
      updateDoc('monitors', monitor.id, monitorData);
      toast({
        title: 'Monitor atualizado!',
        description: `Os dados de ${data.name} foram atualizados.`,
      });
    } else {
      addDoc('monitors', monitorData);
      toast({
        title: 'Monitor adicionado!',
        description: `${data.name} foi adicionado ao sistema.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{monitor ? 'Editar Monitor' : 'Adicionar Monitor'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do monitor abaixo.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="monitor-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Monitor</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fernanda Lima" {...field} value={field.value ?? ''} />
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
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Opcional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="fernanda@email.com" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone (Opcional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="(11) 99999-9999" 
                          {...field} 
                          value={field.value ?? ''} 
                          onChange={(e) => field.onChange(maskPhone(e.target.value))}
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

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-medium mb-2">Endereço (Opcional)</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status (Rota)</FormLabel>
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-6">
                    <div className="space-y-0.5">
                      <FormLabel>Monitor Ativo</FormLabel>
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
        <Button type="submit" form="monitor-form">Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
