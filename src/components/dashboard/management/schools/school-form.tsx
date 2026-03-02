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
import { useEffect, useState, useCallback } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Loader2, Search, Sparkles, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  active: z.boolean().default(true),
});

type SchoolFormValues = z.infer<typeof formSchema>;

interface SchoolFormProps {
  school?: { id: string } & Partial<SchoolFormValues>;
  onFormSubmit: () => void;
}

const defaultValues: SchoolFormValues = {
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
  active: true,
};

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const zipCode = form.watch('zipCode');

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
        const result = await geocodeAddress({ address: searchQuery });
        
        // Atualização atômica de todos os campos de endereço
        form.setValue('street', result.street || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('number', result.number || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('zipCode', result.zipCode || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('neighborhood', result.neighborhood || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('city', result.city || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('state', result.state || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('latitude', result.latitude, { shouldValidate: true, shouldDirty: true });
        form.setValue('longitude', result.longitude, { shouldValidate: true, shouldDirty: true });
        
        if (!form.getValues('name')) {
            const suggestedName = searchQuery.split(',')[0];
            form.setValue('name', suggestedName.trim());
        }
        
        toast({
            title: "Localização encontrada!",
            description: "Endereço e coordenadas GPS atualizados.",
        });
    } catch (e) {
        toast({
            title: "Busca sem resultados",
            description: "Tente digitar o nome da escola seguido da cidade.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
    }
  };

  const fetchAddressByCep = useCallback(async (cep: string) => {
    const cleanedCep = cep.replace(/\D/g, '');
    if (cleanedCep.length !== 8) return;

    setIsFetchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();
      if (!data.erro) {
        form.setValue('street', data.logradouro || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('neighborhood', data.bairro || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('city', data.localidade || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('state', data.uf || '', { shouldValidate: true, shouldDirty: true });
        toast({ title: "Endereço localizado via CEP!" });
      } else {
        toast({ title: "CEP não encontrado", variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsFetchingCep(false);
    }
  }, [form, toast]);

  useEffect(() => {
    if (zipCode && zipCode.replace(/\D/g, '').length === 8) {
        fetchAddressByCep(zipCode);
    }
  }, [zipCode, fetchAddressByCep]);

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
        active: school.active ?? true,
      });
    } else {
      form.reset(defaultValues);
    }
  }, [school, form]);

  const onSubmit = async (data: SchoolFormValues) => {
    setIsSaving(true);
    try {
        if (school) {
            updateDoc('schools', school.id, data);
            toast({ title: 'Escola atualizada!' });
        } else {
            addDoc('schools', data);
            toast({ title: 'Escola cadastrada!' });
        }
        onFormSubmit();
    } catch (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{school ? 'Editar Escola' : 'Adicionar Escola'}</DialogTitle>
        <DialogDescription>Use a busca inteligente para acelerar o preenchimento.</DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          {/* Barra de Busca Inteligente */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Busca Inteligente (Nome da Escola, Rua e Cidade)</span>
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="Ex: Colégio Anglo, Rua São José, Campinas" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
                    className="bg-background"
                />
                <Button variant="secondary" onClick={handleSmartSearch} disabled={isSearching || !searchQuery.trim()}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
            </div>
          </div>

          <Form {...form}>
            <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Escola</FormLabel>
                    <FormControl><Input placeholder="Ex: Colégio Vanguarda" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-bold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Endereço e Localização</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                        control={form.control} name="zipCode"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <Input placeholder="00000-000" {...field} value={field.value ?? ''} />
                                {isFetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
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
                            <FormLabel>Rua/Avenida</FormLabel>
                            <FormControl><Input placeholder="Logradouro" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <FormField
                        control={form.control} name="number"
                        render={({ field }) => (
                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="Ex: 123" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="complement"
                        render={({ field }) => (
                            <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Ex: Bloco A" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="neighborhood"
                        render={({ field }) => (
                            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <FormField
                        control={form.control} name="city"
                        render={({ field }) => (
                            <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="state"
                        render={({ field }) => (
                            <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="UF" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t opacity-60">
                 <FormField
                    control={form.control} name="latitude"
                    render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px]">LATITUDE (GPS)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs"/></FormControl></FormItem>
                    )}
                />
                <FormField
                    control={form.control} name="longitude"
                    render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px]">LONGITUDE (GPS)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs"/></FormControl></FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                    <div className="space-y-0.5"><FormLabel>Escola Ativa para Rotas</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background">
        <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
        <Button type="submit" form="school-form" disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : "Salvar Escola"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
