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

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  cnpj: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  zipCode: z.string().optional(),
  street: z.string().min(1, { message: 'A rua é obrigatória.' }),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type SchoolFormValues = z.infer<typeof formSchema>;

interface SchoolFormProps {
  school?: { id: string } & Partial<SchoolFormValues>;
  onFormSubmit: () => void;
}

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cnpj: '',
      latitude: undefined,
      longitude: undefined,
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
    if (school) {
      form.reset({
        name: school.name || '',
        cnpj: school.cnpj || '',
        latitude: school.latitude,
        longitude: school.longitude,
        zipCode: school.zipCode || '',
        street: school.street || '',
        number: school.number || '',
        complement: school.complement || '',
        neighborhood: school.neighborhood || '',
        city: school.city || '',
        state: school.state || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [school, form]);

  const onSubmit = (data: SchoolFormValues) => {
    if (school) {
      updateDoc('schools', school.id, data);
      toast({
        title: 'Escola atualizada!',
        description: `Os dados da escola ${data.name} foram atualizados.`,
      });
    } else {
      addDoc('schools', data);
      toast({
        title: 'Escola adicionada!',
        description: `A escola ${data.name} foi adicionada ao sistema.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{school ? 'Editar Escola' : 'Adicionar Escola'}</DialogTitle>
        <DialogDescription>
          {school
            ? 'Altere as informações da escola abaixo.'
            : 'Preencha as informações da nova escola.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Escola</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Colégio Saber" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="cnpj"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CNPJ</FormLabel>
                <FormControl>
                  <Input placeholder="00.000.000/0001-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
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
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="-23.55052" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Longitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="-46.633308" {...field} />
                  </FormControl>
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
