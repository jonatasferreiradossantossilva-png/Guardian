
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
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Loader2, Search, Sparkles, MapPin, CheckCircle2, Globe, Building2, X } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { searchSchoolsInep } from '@/ai/flows/search-schools-inep';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const UF_LIST = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

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
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  state: z.string().min(1, { message: 'O estado é obrigatório.' }),
  active: z.boolean().default(true),
});

type SchoolFormValues = z.infer<typeof formSchema>;

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
  city: 'Carapicuíba',
  state: 'SP',
  active: true,
};

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const { data: knowledgeBase } = useMockCollection('school_knowledge_base');
  
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [isSearchingInternal, setIsSearchingInternal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { watch, setValue, setFocus } = form;
  const currentCity = watch('city');
  const currentState = watch('state');
  const zipCode = watch('zipCode');

  // Busca Automática na Base (Debounce)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 3) {
        handleInternalSearch();
      } else {
        setAiSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInternalSearch = async () => {
    if (!knowledgeBase) return;

    setIsSearchingInternal(true);
    try {
        // Filtra a base local pelo contexto do formulário (Cidade/Estado)
        const cityFilter = knowledgeBase.filter((s: any) => 
            s.city.toLowerCase() === currentCity.toLowerCase() && 
            s.state === currentState
        );

        const result = await searchSchoolsInep({
            query: searchQuery,
            city: currentCity,
            state: currentState,
            knowledgeBase: cityFilter.length > 0 ? cityFilter : knowledgeBase 
        });
        
        const enrichedMatches = result.matches.map(match => {
            const fullData = (knowledgeBase || []).find(kb => kb.id === match.id);
            return { ...fullData, score: match.score };
        }).filter(Boolean);

        setAiSuggestions(enrichedMatches);
    } catch (e) {
        console.error("Erro na busca interna:", e);
    } finally {
        setIsSearchingInternal(false);
    }
  };

  const selectFromSuggestions = (item: any) => {
    setValue('name', item.name, { shouldValidate: true, shouldDirty: true });
    setValue('street', item.street || '', { shouldValidate: true, shouldDirty: true });
    setValue('number', item.number || '', { shouldValidate: true, shouldDirty: true });
    setValue('neighborhood', item.neighborhood || '', { shouldValidate: true, shouldDirty: true });
    setValue('city', item.city, { shouldValidate: true, shouldDirty: true });
    setValue('state', item.state, { shouldValidate: true, shouldDirty: true });
    setValue('zipCode', item.zipCode || '', { shouldValidate: true, shouldDirty: true });
    setValue('latitude', item.latitude, { shouldValidate: true, shouldDirty: true });
    setValue('longitude', item.longitude, { shouldValidate: true, shouldDirty: true });
    
    setAiSuggestions([]);
    setSearchQuery('');
    toast({ title: "Dados importados!", description: "Endereço preenchido via base Guardian." });
  };

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) {
        toast({ title: "Digite o nome para buscar no Google", variant: "destructive" });
        return;
    }
    
    setIsSearchingGoogle(true);
    setAiSuggestions([]);
    try {
        const fullSearch = `${searchQuery}, ${currentCity}, ${currentState}`;
        const result = await geocodeAddress({ address: fullSearch });
        
        setValue('name', searchQuery.trim(), { shouldValidate: true, shouldDirty: true });
        setValue('street', result.street || '', { shouldValidate: true, shouldDirty: true });
        setValue('number', result.number || '', { shouldValidate: true, shouldDirty: true });
        setValue('zipCode', result.zipCode || '', { shouldValidate: true, shouldDirty: true });
        setValue('neighborhood', result.neighborhood || '', { shouldValidate: true, shouldDirty: true });
        setValue('city', result.city || currentCity, { shouldValidate: true, shouldDirty: true });
        setValue('state', result.state || currentState, { shouldValidate: true, shouldDirty: true });
        setValue('latitude', result.latitude, { shouldValidate: true, shouldDirty: true });
        setValue('longitude', result.longitude, { shouldValidate: true, shouldDirty: true });
        
        setSearchQuery('');
        toast({ title: "Localizado pelo Google!", description: "Dados de GPS e CEP capturados." });
    } catch (e) {
        toast({ title: "Não encontramos no Google Maps", variant: "destructive" });
    } finally {
        setIsSearchingGoogle(false);
    }
  };

  useEffect(() => {
    const cleanedCep = zipCode?.replace(/\D/g, '');
    if (cleanedCep && cleanedCep.length === 8) {
        const fetchAddress = async () => {
            setIsFetchingCep(true);
            try {
                const res = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
                const data = await res.json();
                if (!data.erro) {
                    setValue('street', data.logradouro || '', { shouldValidate: true, shouldDirty: true });
                    setValue('neighborhood', data.bairro || '', { shouldValidate: true, shouldDirty: true });
                    setValue('city', data.localidade || '', { shouldValidate: true, shouldDirty: true });
                    setValue('state', data.uf || '', { shouldValidate: true, shouldDirty: true });
                }
            } catch (e) {} finally { setIsFetchingCep(false); }
        };
        fetchAddress();
    }
  }, [zipCode, setValue]);

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
        city: school.city || 'Carapicuíba',
        state: school.state || 'SP',
        active: school.active ?? true,
      });
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
            addDoc('school_knowledge_base', {
                name: data.name,
                city: data.city,
                state: data.state,
                street: data.street,
                neighborhood: data.neighborhood,
                zipCode: data.zipCode,
                latitude: data.latitude,
                longitude: data.longitude
            });
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
        <DialogTitle>{school ? 'Editar Escola' : 'Nova Escola'}</DialogTitle>
        <DialogDescription>Digite o nome para buscar na base Guardian ou use o Google Maps.</DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          
          {/* BUSCA INTELIGENTE INTEGRADA */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2 text-primary font-bold">
                    <Sparkles className="h-4 w-4" />
                    Busca Rápida (Base Carapicuíba)
                </Label>
                <div className="flex gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase">{currentCity}</Badge>
                    <Badge variant="outline" className="text-[10px] uppercase">{currentState}</Badge>
                </div>
            </div>

            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Comece a digitar o nome da escola..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-primary/5 border-primary/20 pl-9 pr-9"
                        />
                        {isSearchingInternal && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />}
                        {searchQuery && !isSearchingInternal && (
                            <button 
                                onClick={() => {setSearchQuery(''); setAiSuggestions([]);}}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                    <Button 
                        variant="outline" 
                        size="icon"
                        onClick={handleGoogleSearch} 
                        disabled={isSearchingGoogle || !searchQuery.trim()}
                        title="Buscar no Google Maps"
                        className="border-primary/20 text-primary hover:bg-primary/10"
                    >
                        {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                    </Button>
                </div>

                {/* DROPDOWN DE SUGESTÕES DA IA */}
                {aiSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-2xl overflow-hidden border-primary/30 animate-in fade-in slide-in-from-top-2">
                        <div className="px-3 py-1.5 bg-primary/10 text-[10px] font-bold text-primary uppercase flex items-center justify-between">
                            <span className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3" /> Sugestões Encontradas</span>
                            <span className="text-[9px] opacity-70">Custo Zero</span>
                        </div>
                        <div className="divide-y max-h-60 overflow-y-auto">
                            {aiSuggestions.map((item) => (
                                <button 
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectFromSuggestions(item)}
                                    className="w-full text-left px-3 py-3 hover:bg-primary/5 transition-colors group flex items-center justify-between"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold group-hover:text-primary truncate">{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                            <MapPin className="h-2.5 w-2.5" />
                                            {item.neighborhood}, {item.city} - {item.state}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-[9px] h-5 bg-primary/10 text-primary border-primary/20 ml-2 shrink-0">Selecionar</Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>

          <Form {...form}>
            <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-10">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" />Nome Oficial</FormLabel>
                    <FormControl><Input placeholder="Ex: Colégio Marjore Paula" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Estado (UF)</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                <SelectContent>{UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                            </Select>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                            <FormLabel>Cidade</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                        </FormItem>
                    )}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-xs font-bold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-widest">Endereço Completo</p>
                
                <div className="grid grid-cols-3 gap-4">
                    <FormField
                        control={form.control} name="zipCode"
                        render={({ field }) => (
                            <FormItem className="col-span-1">
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <Input placeholder="00000-000" {...field} value={field.value ?? ''} />
                                {isFetchingCep && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
                            </div>
                            </FormControl>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="street"
                        render={({ field }) => (
                            <FormItem className="col-span-2">
                            <FormLabel>Rua / Avenida</FormLabel>
                            <FormControl><Input {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                        control={form.control} name="number"
                        render={({ field }) => (
                            <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="Ex: 500" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="neighborhood"
                        render={({ field }) => (
                            <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Ex: Centro" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                        )}
                    />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t opacity-40">
                 <FormField
                    control={form.control} name="latitude"
                    render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px]">LATITUDE (GPS)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs font-mono"/></FormControl></FormItem>
                    )}
                />
                <FormField
                    control={form.control} name="longitude"
                    render={({ field }) => (
                        <FormItem><FormLabel className="text-[10px]">LONGITUDE (GPS)</FormLabel><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs font-mono"/></FormControl></FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                    <div className="space-y-0.5"><FormLabel>Escola Ativa para Transportes</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background">
        <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
        <Button type="submit" form="school-form" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 animate-spin"/> : "Confirmar e Salvar"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
