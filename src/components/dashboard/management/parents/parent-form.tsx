
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
import { Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'Insira um email válido.' }),
  phone: z.string().min(1, { message: 'O telefone é obrigatório.' }),
  userId: z.string().min(1, { message: 'O ID de usuário do Firebase é obrigatório.' }),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  active: z.boolean().default(true),
});

type ParentFormValues = z.infer<typeof formSchema>;

interface ParentFormProps {
  parent?: { id: string } & Partial<ParentFormValues>;
  onFormSubmit: () => void;
}

export function ParentForm({ parent, onFormSubmit }: ParentFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      userId: '',
      cpf: '',
      rg: '',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
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
    if (parent) {
      form.reset({
        name: parent.name || '',
        email: parent.email || '',
        phone: parent.phone || '',
        userId: parent.userId || '',
        cpf: parent.cpf || '',
        rg: parent.rg || '',
        zipCode: parent.zipCode || '',
        street: parent.street || '',
        number: parent.number || '',
        complement: parent.complement || '',
        neighborhood: parent.neighborhood || '',
        city: parent.city || '',
        state: parent.state || '',
        active: parent.active ?? true,
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [parent, form]);

  const onSubmit = (data: ParentFormValues) => {
    if (parent) {
      updateDoc('parents', parent.id, data);
      toast({
        title: 'Responsável atualizado!',
        description: `Os dados de ${data.name} foram atualizados com sucesso.`,
      });
    } else {
      addDoc('parents', data);
      toast({
        title: 'Responsável adicionado!',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{parent ? 'Editar Responsável' : 'Adicionar Responsável'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do responsável abaixo. O ID do usuário é necessário para que ele possa acessar o painel.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="parent-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Maria Souza" {...field} value={field.value ?? ''} />
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
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: maria.souza@email.com" {...field} value={field.value ?? ''} />
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
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: (11) 98765-4321" {...field} value={field.value ?? ''} />
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
                            <Input placeholder="000.000.000-00" {...field} value={field.value ?? ''} />
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
                            <Input placeholder="00.000.000-0" {...field} value={field.value ?? ''} />
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
                                <Input placeholder="00000-000" {...field} value={field.value ?? ''} />
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
                <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                    <div className="space-y-0.5">
                      <FormLabel>Responsável Ativo</FormLabel>
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
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem className="pt-4">
                    <FormLabel>ID do Usuário (Firebase Auth)</FormLabel>
                    <FormControl>
                      <Input placeholder="Cole o UID do usuário" {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
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
        <Button type="submit" form="parent-form">Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
