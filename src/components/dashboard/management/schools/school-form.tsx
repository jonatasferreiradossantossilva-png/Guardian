
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
import { useEffect, useState, useCallback, useRef } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Loader2, MapPin, CheckCircle2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { cn } from '@/lib/utils';

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
  const [isGeocoding, setIsGeocoding] = useState(false);
  const lastGeocodedAddress = useRef('');

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

  const { street, number, neighborhood, city, state, zipCode, latitude, longitude } = form.watch();
  const hasGps = !!(latitude && longitude);

  const handleGeocode = useCallback(async () => {
    const currentValues = form.getValues();
    const fullAddress = `${currentValues.street || ''}, ${currentValues.number || ''}, ${currentValues.neighborhood || ''}, ${currentValues.city || ''} - ${currentValues.state || ''}`;
    
    if (!currentValues.street || !currentValues.city || fullAddress === lastGeocodedAddress.current) return;

    setIsGeocoding(true);
    try {
      const result = await geocodeAddress({ address: fullAddress });
      form.setValue('latitude', result.latitude);
      form.setValue('longitude', result.longitude);
      lastGeocodedAddress.current = fullAddress;
      toast({
        title: "Localização da Escola atualizada!",
        description: "Coordenadas GPS sincronizadas automaticamente."
      });
    } catch (error) {
      console.error("Auto-geocode failed:", error);
    } finally {
      setIsGeocoding(false);
    }
  }, [form, toast]);

  // Auto-geocode effect
  useEffect(() => {
    if (!street || !city || !number) return;

    const timer = setTimeout(() => {
      handleGeocode();
    }, 1500);

    return () => clearTimeout(timer);
  }, [street, number, city, handleGeocode]);

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

  const onSubmit = (data: SchoolFormValues) => {
    if (school) {
      updateDoc('schools', school.id, data);
      toast({ title: 'Escola atualizada!' });
    } else {
      addDoc('schools', data);
      toast({ title: 'Escola adicionada!' });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{school ? 'Editar Escola' : 'Adicionar Escola'}</DialogTitle>
        <DialogDescription>Preencha as informações da escola abaixo.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Escola</FormLabel>
                <FormControl><Input placeholder="Ex: Colégio Saber" {...field} /></FormControl>
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
                        <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="123" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                 <div className="col-span-2 flex items-end">
                    <Button 
                      type="button" 
                      variant={hasGps ? "outline" : "secondary"} 
                      className={cn("w-full transition-all", hasGps && "border-green-500/50 text-green-600")} 
                      onClick={() => handleGeocode()} 
                      disabled={isGeocoding}
                    >
                        {isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : hasGps ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <MapPin className="mr-2 h-4 w-4" />}
                        {hasGps ? "Localização Validada" : "Validar GPS da Escola"}
                    </Button>
                </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                 <FormField
                    control={form.control} name="city"
                    render={({ field }) => (
                        <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="São Paulo" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="state"
                    render={({ field }) => (
                        <FormItem><FormLabel>Estado (UF)</FormLabel><FormControl><Input placeholder="SP" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="longitude"
              render={({ field }) => (
                <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''}/></FormControl><FormMessage /></FormItem>
              )}
            />
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
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
