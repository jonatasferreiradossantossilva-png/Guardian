
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
import { Loader2, Search, Sparkles, MapPin, CheckCircle2, Globe, Building2, Info, GraduationCap, School } from 'lucide-react';
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
  type: z.enum(['public', 'private']).default('public'),
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

interface SchoolFormProps {
  school?: { id: string } & Partial<SchoolFormValues>;
  onFormSubmit: () => void;
}

const defaultValues: SchoolFormValues = {
  name: '',
  cnpj: '',
  type: 'public',
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
  const [searchUF, setSearchUF] = useState('SP');
  const [searchCity, setSearchCity] = useState('Carapicuíba');
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const form = useForm<SchoolFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const zipCode = form.watch('zipCode');

  // Busca Semântica (Fuzzy Match) via IA em nossa base
  const handleFuzzySearch = async () => {
    if (!searchQuery.trim() || searchQuery.length < 3 || !knowledgeBase) {
        toast({ title: "Digite pelo menos 3 letras", variant: "destructive" });
        return;
    }

    setIsSearchingInternal(true);
    setAiSuggestions([]);
    
    try {
        const filteredKB = knowledgeBase.filter((s: any) => s.city === searchCity && s.state === searchUF);
        
        const result = await searchSchoolsInep({
            query: searchQuery,
            city: searchCity,
            state: searchUF,
            knowledgeBase: filteredKB
        });
        
        const enrichedMatches = result.matches.map(match => {
            const fullData = knowledgeBase.find(kb => kb.id === match.id);
            return { ...fullData, score: match.score };
        }).filter(m => m.score > 0.5);

        setAiSuggestions(enrichedMatches);
        
        if (enrichedMatches.length === 0) {
            toast({ title: "Nenhuma sugestão na base local", description: "Tente usar o botão do Google Maps." });
        }
    } catch (e) {
        console.error(e);
        toast({ title: "Erro na busca interna", variant: "destructive" });
    } finally {
        setIsSearchingInternal(false);
    }
  };

  const selectFromKnowledgeBase = (skbItem: any) => {
    form.setValue('name', skbItem.name, { shouldValidate: true, shouldDirty: true });
    form.setValue('type', skbItem.type || 'public', { shouldValidate: true, shouldDirty: true });
    form.setValue('street', skbItem.street || '', { shouldValidate: true, shouldDirty: true });
    form.setValue('number', skbItem.number || '', { shouldValidate: true, shouldDirty: true });
    form.setValue('neighborhood', skbItem.neighborhood || '', { shouldValidate: true, shouldDirty: true });
    form.setValue('city', skbItem.city, { shouldValidate: true, shouldDirty: true });
    form.setValue('state', skbItem.state, { shouldValidate: true, shouldDirty: true });
    form.setValue('zipCode', skbItem.zipCode || '', { shouldValidate: true, shouldDirty: true });
    form.setValue('latitude', skbItem.latitude, { shouldValidate: true, shouldDirty: true });
    form.setValue('longitude', skbItem.longitude, { shouldValidate: true, shouldDirty: true });
    
    setAiSuggestions([]);
    setSearchQuery(skbItem.name);
    toast({
        title: "Escola Selecionada!",
        description: "Dados importados da base Guardian.",
    });
  };

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearchingGoogle(true);
    setAiSuggestions([]);
    try {
        const fullSearchQuery = `${searchQuery}, ${searchCity}, ${searchUF}`;
        const result = await geocodeAddress({ address: fullSearchQuery });
        
        form.setValue('street', result.street || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('number', result.number || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('zipCode', result.zipCode || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('neighborhood', result.neighborhood || '', { shouldValidate: true, shouldDirty: true });
        form.setValue('city', result.city || searchCity, { shouldValidate: true, shouldDirty: true });
        form.setValue('state', result.state || searchUF, { shouldValidate: true, shouldDirty: true });
        form.setValue('latitude', result.latitude, { shouldValidate: true, shouldDirty: true });
        form.setValue('longitude', result.longitude, { shouldValidate: true, shouldDirty: true });
        
        if (!form.getValues('name')) {
            form.setValue('name', searchQuery.trim(), { shouldValidate: true, shouldDirty: true });
        }
        
        toast({
            title: "Localização Encontrada!",
            description: "Dados GPS capturados via Google Maps.",
        });
    } catch (e) {
        toast({
            title: "Google não encontrou este local",
            description: "Verifique o nome e tente novamente.",
            variant: "destructive"
        });
    } finally {
        setIsSearchingGoogle(false);
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
        toast({ title: "CEP localizado!" });
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
        type: school.type || 'public',
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
      setSearchCity(school.city || 'Carapicuíba');
      setSearchUF(school.state || 'SP');
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
            
            // Grava na Base de Conhecimento para ajudar outros gestores (Custo Zero futuro)
            const existsInKB = knowledgeBase?.some((s: any) => 
                s.name.toLowerCase() === data.name.toLowerCase() && s.city === data.city
            );
            
            if (!existsInKB) {
                addDoc('school_knowledge_base', {
                    name: data.name,
                    type: data.type,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    street: data.street,
                    number: data.number,
                    neighborhood: data.neighborhood,
                    city: data.city,
                    state: data.state,
                    zipCode: data.zipCode
                });
            }
            toast({ title: 'Escola salva e adicionada à base do Guardian!' });
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
        <DialogDescription>Use os filtros e a busca inteligente (IA) para preencher o endereço automaticamente.</DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          
          {/* Sessão de Busca Inteligente Híbrida */}
          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Sparkles className="h-4 w-4" />
                    <span>Ferramenta de Busca Guardian</span>
                </div>
                <Badge variant="outline" className="text-[10px] uppercase bg-background">IA + Google</Badge>
            </div>

            <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Estado</Label>
                    <Select value={searchUF} onValueChange={setSearchUF}>
                        <SelectTrigger className="h-8 text-xs bg-background">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="col-span-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Cidade</Label>
                    <Input 
                        value={searchCity} 
                        onChange={e => setSearchCity(e.target.value)}
                        placeholder="Ex: Carapicuíba"
                        className="h-8 text-xs bg-background"
                    />
                </div>
            </div>

            <div className="relative">
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Nome da Escola..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleFuzzySearch()}
                            className="bg-background pl-9"
                        />
                    </div>
                    <Button variant="secondary" onClick={handleFuzzySearch} disabled={isSearchingInternal || !searchQuery.trim()}>
                        {isSearchingInternal ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Pesquisar Base</span>
                    </Button>
                    <Button variant="outline" onClick={handleGoogleSearch} disabled={isSearchingGoogle || !searchQuery.trim()}>
                        {isSearchingGoogle ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                        <span className="ml-2 hidden sm:inline">Google</span>
                    </Button>
                </div>

                {aiSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border rounded-md shadow-xl overflow-hidden border-primary/30">
                        <p className="px-3 py-1.5 bg-secondary/50 text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-green-500" /> Sugestões Encontradas na Comunidade
                        </p>
                        <div className="divide-y max-h-48 overflow-y-auto">
                            {aiSuggestions.map((item) => (
                                <button 
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectFromKnowledgeBase(item)}
                                    className="w-full text-left px-3 py-2.5 hover:bg-primary/5 transition-colors group flex items-center justify-between"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-bold group-hover:text-primary truncate">{item.name}</p>
                                            <Badge variant="outline" className={cn(
                                                "text-[8px] h-3.5 px-1 uppercase",
                                                item.type === 'private' ? "text-amber-600 border-amber-200 bg-amber-50" : "text-blue-600 border-blue-200 bg-blue-50"
                                            )}>
                                                {item.type === 'private' ? 'Privada' : 'Pública'}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground truncate">{item.neighborhood}, {item.city} - {item.state}</p>
                                    </div>
                                    <Badge variant="secondary" className="text-[9px] h-4">Custo Zero</Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <p className="text-[10px] text-muted-foreground italic leading-tight flex items-start gap-1.5">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>Clique em <strong>Pesquisar Base</strong> para buscar no Guardian (Custo Zero). Use <strong>Google</strong> apenas se não encontrar resultados.</span>
            </p>
          </div>

          <Form {...form}>
            <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pb-10">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-2"><Building2 className="h-4 w-4" />Nome Oficial da Unidade</FormLabel>
                            <FormControl><Input placeholder="Ex: Escola Primária do Saber" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel className="flex items-center gap-2"><GraduationCap className="h-4 w-4" />Tipo de Escola</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="public">Pública</SelectItem>
                                <SelectItem value="private">Privada</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                <p className="text-sm font-bold mb-4 flex items-center gap-2 text-foreground/80"><MapPin className="h-4 w-4 text-primary" /> Endereço Confirmado</p>
                
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
                            <FormLabel>Rua / Avenida</FormLabel>
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
