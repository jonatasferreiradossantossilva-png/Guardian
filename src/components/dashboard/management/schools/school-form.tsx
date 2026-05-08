
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
import { useState, useEffect, useMemo } from 'react';
import { useData, isFirestoreMode } from '@/hooks/use-data';
import { firestore } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Loader2, Search, Sparkles, MapPin, Globe, School, Clock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
  startTime: z.string().optional(),
  endTime: z.string().optional(),
});

type SchoolFormValues = z.infer<typeof formSchema>;

interface SchoolFormProps {
  school?: { id: string } & Partial<SchoolFormValues>;
  onFormSubmit: () => void;
}

const normalize = (str: string) => 
    str?.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() || "";

export function SchoolForm({ school, onFormSubmit }: SchoolFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();
  
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isSearchingBase, setIsSearchingBase] = useState(false);

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
      startTime: '',
      endTime: '',
    },
  });

  const { watch, setValue } = form;
  const selectedCity = watch('city');
  const selectedUF = watch('state');

  useEffect(() => {
    if (!selectedCity || !selectedCity.trim() || !selectedUF) {
      setSuggestions([]);
      return;
    }

    const loadSuggestions = async () => {
      setIsSearchingBase(true);
      try {
        if (isFirestoreMode()) {
          // Converte dinamicamente para Title Case para compatibilidade com buscas case-sensitive (ex: "porto velho" -> "Porto Velho")
          const formattedCity = selectedCity
            .trim()
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const q = query(
            collection(firestore, 'school_knowledge_base'),
            where('state', '==', selectedUF),
            where('city', '==', formattedCity)
          );
          const snapshot = await getDocs(q);
          const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSuggestions(list);
        } else {
          // Em modo mock, podemos usar dados estáticos se existirem
          setSuggestions([
            { id: "kb-1", name: "Colégio Amos", city: "Carapicuíba", state: "SP", street: "Av. Inocêncio Seráfico", number: "2000", neighborhood: "Centro", zipCode: "06320-290", latitude: -23.5234, longitude: -46.8345 },
            { id: "kb-2", name: "Colégio Albert Einstein", city: "Carapicuíba", state: "SP", street: "Rua Rui Barbosa", number: "150", neighborhood: "Vila Dirce", zipCode: "06333-000", latitude: -23.5345, longitude: -46.8456 },
            { id: "kb-3", name: "E.E. Maria de Lourdes Teixeira", city: "Carapicuíba", state: "SP", street: "Av. Brasil", number: "500", neighborhood: "Cohab", zipCode: "06325-000", latitude: -23.5456, longitude: -46.8567 }
          ]);
        }
      } catch (err) {
        console.error('Erro ao buscar escolas da base:', err);
      } finally {
        setIsSearchingBase(false);
      }
    };

    const timer = setTimeout(() => {
      loadSuggestions();
    }, 400);

    return () => clearTimeout(timer);
  }, [selectedCity, selectedUF]);

  const filteredSuggestions = useMemo(() => {
    // Se o usuário selecionou Cidade/UF, mas ainda não digitou nada no campo de busca da escola,
    // mostramos as primeiras 5 escolas encontradas naquela cidade imediatamente! Isso facilita a seleção.
    if (searchQuery.length < 1) {
      return suggestions.slice(0, 5);
    }
    
    const normQuery = normalize(searchQuery);

    return suggestions.filter((s: any) => 
        normalize(s.name).includes(normQuery)
    ).slice(0, 5);
  }, [suggestions, searchQuery]);

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
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Estado (UF) <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => setValue('state', v)} value={selectedUF}>
                    <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                    <SelectContent>{UF_LIST.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                </Select>
            </div>
            <div className="col-span-2 space-y-1">
                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Cidade <span className="text-destructive">*</span></Label>
                <Input placeholder="Ex: Carapicuíba" value={selectedCity} onChange={(e) => setValue('city', e.target.value)} />
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label className={cn(
                "flex items-center gap-2 font-bold transition-all",
                (!selectedCity || !selectedUF) ? "opacity-30" : "text-primary opacity-100"
            )}>
                <Sparkles className="h-4 w-4" />
                Buscar Escola na Base Guardian
            </Label>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder={(!selectedCity || !selectedUF) ? "Selecione UF e Cidade acima" : "Digite o nome da escola..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={!selectedCity || !selectedUF || isSearchingBase}
                        className="bg-primary/5 border-primary/20 pl-9 focus:ring-primary h-11"
                    />
                    {isSearchingBase && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                    )}
                </div>
            </div>

            {filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[100] mt-1 bg-background border-2 rounded-md shadow-2xl overflow-hidden border-primary">
                    <div className="px-3 py-1.5 bg-primary/10 text-[10px] font-bold text-primary uppercase flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> Sugestões da Base
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
                                    <p className="text-[10px] text-muted-foreground truncate">{item.street}, {item.number}</p>
                                </div>
                                <Badge variant="outline" className="text-[9px] h-5 bg-background">Selecionar</Badge>
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t">
            <Form {...form}>
                <form id="school-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

                    <div className="grid grid-cols-2 gap-4 border-t pt-4">
                        <FormField
                            control={form.control} name="startTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Entrada (Início)</FormLabel>
                                    <FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="endTime"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Saída (Fim)</FormLabel>
                                    <FormControl><Input type="time" {...field} value={field.value ?? ''} /></FormControl>
                                    <FormMessage />
                                </FormItem>
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
                </form>
            </Form>
          </div>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background">
        <DialogClose asChild><Button type="button" variant="ghost">Cancelar</Button></DialogClose>
        <Button type="submit" form="school-form" disabled={isSaving} className="min-w-[120px]">
            {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : "Salvar Escola"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
