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
import { Loader2, Search, Sparkles, MapPin } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';

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

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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
      active: true,
    },
  });

  const { zipCode } = form.watch();

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
        const result = await geocodeAddress({ address: searchQuery });
        
        // Preenchimento automático dos campos baseados no resultado estruturado da API
        if (result.street) form.setValue('street', result.street);
        if (result.number) form.setValue('number', result.number);
        if (result.zipCode) form.setValue('zipCode', result.zipCode);
        if (result.neighborhood) form.setValue('neighborhood', result.neighborhood);
        if (result.city) form.setValue('city', result.city);
        if (result.state) form.setValue('state', result.state);
        
        form.setValue('latitude', result.latitude);
        form.setValue('longitude', result.longitude);
        
        // Tenta inferir o nome da escola se o campo estiver vazio
        if (!form.getValues('name')) {
            const firstPart = searchQuery.split(',')[0];
            if (firstPart && firstPart.length > 3) {
                form.setValue('name', firstPart.trim());
            }
        }
        
        toast({
            title: "Localização encontrada!",
            description: "Endereço completo, CEP e coordenadas preenchidos.",
        });
    } catch (e) {
        toast({
            title: "Busca não concluída",
            description: "Não conseguimos localizar esse local exato. Tente incluir o nome do colégio + cidade.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
    }
  };

  useEffect(() => {
    const cleanedCep = zipCode?.replace(/\D/g, '');
    if (cleanedCep && cleanedCep.length === 8) {
      const fetchAddress = async () => {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
          if (!response.ok) throw new Error('Falha ao buscar CEP');
          const data = await response.json();
          if (!data.erro) {
            form.setValue('street', data.logradouro || '');
            form.setValue('neighborhood', data.bairro || '');
            form.setValue('city', data.localidade || '');
            form.setValue('state', data.uf || '');
            form.setFocus('number');
          }
        } catch (error) {
          console.error(error);
        } finally {
          setIsFetchingCep(false);
        }
      };
      fetchAddress();
    }
  }, [zipCode, form]);

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
      form.reset(form.defaultValues);
    }
  }, [school, form]);

  const onSubmit = async (data: SchoolFormValues) => {
    setIsSaving(true);
    try {
        let finalLat = data.latitude;
        let finalLng = data.longitude;

        if (data.street && data.city && (!finalLat || !finalLng)) {
            const fullAddress = `${data.street}, ${data.number || ''}, ${data.neighborhood || ''}, ${data.city} - ${data.state || ''}`;
            try {
                const geoResult = await geocodeAddress({ address: fullAddress });
                finalLat = geoResult.latitude;
                finalLng = geoResult.longitude;
            } catch (e) {
                console.warn("Geocodificação automática falhou no salvamento:", e);
            }
        }

        const schoolData = { ...data, latitude: finalLat, longitude: finalLng };

        if (school) {
            updateDoc('schools', school.id, schoolData);
            toast({ title: 'Escola atualizada!' });
        } else {
            addDoc('schools', schoolData);
            toast({ title: 'Escola adicionada!' });
        }
        onFormSubmit();
    } catch (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader>
        <DialogTitle>{school ? 'Editar Escola' : 'Adicionar Escola'}</DialogTitle>
        <DialogDescription>Preencha as informações da escola ou use a busca combinada para agilizar.</DialogDescription>
      </DialogHeader>
      
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3 mb-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm">
            <Sparkles className="h-4 w-4" />
            <span>Busca Inteligente (IA + Mapas)</span>
        </div>
        <div className="flex gap-2">
            <Input 
                placeholder="Ex: Colégio Saber, Rua das Flores, São Paulo" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
                className="bg-background"
            />
            <Button variant="secondary" onClick={handleSmartSearch} disabled={isSearching || !searchQuery.trim()}>
                {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
        </div>
        <p className="text-[10px] text-muted-foreground italic leading-tight">
            Dica: Informe <strong>Escola + Cidade + Rua</strong> para preencher CEP e Número automaticamente.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Escola</FormLabel>
                <FormControl><Input placeholder="Ex: Colégio Saber" {...field} value={field.value ?? ''} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <div className="border-t pt-4 mt-4">
             <p className="text-sm font-medium mb-2 flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço</p>
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
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                        <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormField
                    control={form.control} name="city"
                    render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="state"
                    render={({ field }) => (
                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                    )}
                />
             </div>
          </div>
           <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                <div className="space-y-0.5"><FormLabel>Escola Ativa</FormLabel></div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )}
          />
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSaving}>Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isSaving}>
                {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : "Salvar Escola"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
