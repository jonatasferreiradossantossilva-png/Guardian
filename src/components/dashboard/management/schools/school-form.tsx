
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
import { useEffect, useState, useMemo } from 'react';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Loader2, Search, Sparkles, MapPin, Globe, School } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
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

interface SchoolFormProps {
  school?: { id: string } & Partial<SchoolFormValues>;
  onFormSubmit: () => void;
}

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const { data: knowledgeBase } = useMockCollection('school_knowledge_base');
  
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
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

  const { watch, setValue } = form;
  const selectedCity = watch('city');
  const selectedUF = watch('state');

  const filteredSuggestions = useMemo(() => {
    if (!knowledgeBase || searchQuery.length < 1 || !selectedCity || !selectedUF) return [];
    
    return knowledgeBase.filter((s: any) => 
        s.city.toLowerCase().trim() === selectedCity.toLowerCase().trim() &&
        s.state.toUpperCase() === selectedUF.toUpperCase() &&
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 5);
  }, [knowledgeBase, searchQuery, selectedCity, selectedUF]);

  const selectSchool = (item: any) => {
    setValue('name', item.name);
    setValue('street', item.street || '');
    setValue('neighborhood', item.neighborhood || '');
    setValue('city', item.city);
    setValue('state', item.state);
    setValue('zipCode', item.zipCode || '');
    setValue('number', item.number || '');
    setValue('latitude', item.latitude);
    setValue('longitude', item.longitude);
    
    setSearchQuery('');
    toast({ 
        title: "Escola Selecionada!", 
        description: `Dados de ${item.name} preenchidos via Base Guardian.` 
    });
  };

  const handleGoogleSearch = async () => {
    if (!searchQuery.trim() || !selectedCity || !selectedUF) return;
    setIsSearchingGoogle(true);
    try {
        const result = await geocodeAddress({ address: `${searchQuery}, ${selectedCity}, ${selectedUF}` });
        setValue('name', searchQuery);
        setValue('street', result.street || '');
        setValue('zipCode', result.zipCode || '');
        setValue('neighborhood', result.neighborhood || '');
        setValue('city', result.city || selectedCity);
        setValue('state', result.state || selectedUF);
        setValue('latitude', result.latitude);
        setValue('longitude', result.longitude);
        setSearchQuery('');
        toast({ title: "Localizado no Google!" });
    } catch (e) {
        toast({ title: "Não encontrado no Google Maps", variant: "destructive" });
    } finally {
        setIsSearchingGoogle(false);
    }
  };

  useEffect(() => {
    if (school) {
      form.reset({
        ...school,
        city: school.city || '',
        state: school.state || '',
      });
    }
  }, [school, form]);

  const onSubmit = async (data: SchoolFormValues) => {
    setIsSaving(true);
    try {
        if (school) {
            updateDoc('schools', school.id, data);
        } else {
            addDoc('schools', data);
            // Alimenta a base global com o novo cadastro
            addDoc('school_knowledge_base', {
                name: data.name,
                city: data.city,
                state: data.state,
                street: data.street,
                neighborhood: data.neighborhood,
                zipCode: data.zipCode,
                number: data.number,
                latitude: data.latitude,
                longitude: data.longitude
            });
        }
        toast({ title: 'Salvo com sucesso!' });
        onFormSubmit();
    } catch (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{school ? 'Editar Escola' : 'Cadastrar Escola'}</DialogTitle>
        <DialogDescription>Inicie selecionando a Cidade e o Estado para ativar a busca inteligente.</DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="px-6 py-4 space-y-6">
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                        <FormItem>
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Estado (UF)</Label>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
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
                            <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Cidade</Label>
                            <FormControl><Input placeholder="Ex: Carapicuíba" {...field} value={field.value ?? ''} /></FormControl>
                        </FormItem>
                    )}
                />
              </div>

              <div className="space-y-2 relative">
                <Label className={cn(
                    "flex items-center gap-2 font-bold transition-all",
                    (!selectedCity || !selectedUF) ? "opacity-30" : "text-primary opacity-100"
                )}>
                    <Sparkles className="h-4 w-4" />
                    Buscar Escola na Base Guardian (Custo Zero)
                </Label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder={(!selectedCity || !selectedUF) ? "Selecione UF e Cidade acima" : "Digite o nome da escola..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            disabled={!selectedCity || !selectedUF}
                            className="bg-primary/5 border-primary/20 pl-9 focus:ring-primary h-11"
                        />
                    </div>
                    <Button 
                        type="button"
                        variant="outline" 
                        size="icon"
                        onClick={handleGoogleSearch} 
                        disabled={isSearchingGoogle || !searchQuery.trim() || !selectedCity || !selectedUF}
                        className="border-primary/20 text-primary h-11 w-11"
                        title="Não encontrou? Buscar no Google Maps"
                    >
                        {isSearchingGoogle ? <Loader2 className="h-5 w-5 animate-spin" /> : <Globe className="h-5 w-5" />}
                    </Button>
                </div>

                {filteredSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-background border-2 rounded-md shadow-2xl overflow-hidden border-primary">
                        <div className="px-3 py-1.5 bg-primary/10 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> Sugestões da Base de Carapicuíba
                        </div>
                        <div className="divide-y max-h-60 overflow-y-auto">
                            {filteredSuggestions.map((item: any) => (
                                <button 
                                    key={item.id}
                                    type="button"
                                    onClick={() => selectSchool(item)}
                                    className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-center justify-between group"
                                >
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold truncate group-hover:text-primary">{item.name}</p>
                                        <p className="text-[10px] text-muted-foreground truncate">{item.street}, {item.number} - {item.neighborhood}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] h-5 bg-background">Selecionar</Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Oficial da Escola</FormLabel>
                      <FormControl><Input placeholder="Nome da instituição" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                      control={form.control} name="zipCode"
                      render={({ field }) => (
                          <FormItem><FormLabel>CEP</FormLabel><FormControl><Input placeholder="00000-000" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                      )}
                  />
                  <FormField
                      control={form.control} name="street"
                      render={({ field }) => (
                          <FormItem className="col-span-2"><FormLabel>Logradouro</FormLabel><FormControl><Input placeholder="Rua, Avenida, etc." {...field} value={field.value ?? ''} /></FormControl></FormItem>
                      )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                      control={form.control} name="number"
                      render={({ field }) => (
                          <FormItem><FormLabel>Número</FormLabel><FormControl><Input placeholder="S/N" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                      )}
                  />
                  <FormField
                      control={form.control} name="neighborhood"
                      render={({ field }) => (
                          <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Bairro" {...field} value={field.value ?? ''} /></FormControl></FormItem>
                      )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2 opacity-60">
                   <FormField
                      control={form.control} name="latitude"
                      render={({ field }) => (
                          <FormItem><Label className="text-[10px]">LATITUDE (GPS)</Label><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs font-mono"/></FormControl></FormItem>
                      )}
                  />
                  <FormField
                      control={form.control} name="longitude"
                      render={({ field }) => (
                          <FormItem><Label className="text-[10px]">LONGITUDE (GPS)</Label><FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} className="h-8 text-xs font-mono"/></FormControl></FormItem>
                      )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-secondary/20">
                      <div className="space-y-0.5"><FormLabel className="text-xs">Escola Ativa para Transportes</FormLabel></div>
                      <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 border-t shrink-0 bg-background">
            <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
            <Button type="submit" disabled={isSaving} className="min-w-[120px]">
                {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : "Salvar Escola"}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
