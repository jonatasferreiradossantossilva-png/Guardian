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
import { useEffect, useState, useMemo, useRef } from 'react';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Copy, Loader2, HeartPulse, CalendarDays, Search, Sparkles, MapPin, Camera, User, Users, Apple, Activity, Wind, Accessibility, Brain, AlertTriangle } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const SERIE_OPTIONS = [
    "Berçário / Maternal",
    "Pré I / Pré II",
    "1º Ano Fundamental",
    "2º Ano Fundamental",
    "3º Ano Fundamental",
    "4º Ano Fundamental",
    "5º Ano Fundamental",
    "6º Ano Fundamental",
    "7º Ano Fundamental",
    "8º Ano Fundamental",
    "9º Ano Fundamental",
    "1º Ano Médio",
    "2º Ano Médio",
    "3º Ano Médio",
    "Outro"
];

const HEALTH_CATEGORIES = [
    { id: 'Alergia', label: 'Alergia (Alimentar/Med)', icon: <Apple className="h-3 w-3" /> },
    { id: 'Respiratório', label: 'Asma/Bronquite', icon: <Wind className="h-3 w-3" /> },
    { id: 'Diabetes', label: 'Diabetes', icon: <Activity className="h-3 w-3" /> },
    { id: 'Mobilidade', label: 'Dificuldade Locomoção', icon: <Accessibility className="h-3 w-3" /> },
    { id: 'Neuro', label: 'Neurodiversidade (TEA/TDAH)', icon: <Brain className="h-3 w-3" /> },
];

const PAYMENT_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  schoolId: z.string().min(1, { message: 'Selecione uma escola.' }),
  parentId: z.string().min(1, { message: 'Selecione um responsável.' }),
  shift: z.enum(['Manhã', 'Tarde', 'Integral'], { required_error: 'Selecione um turno.' }),
  monthlyFee: z.coerce.number().min(0, { message: 'O valor deve ser R$ 0 ou maior.' }).optional(),
  preferredPaymentDay: z.coerce.number().int().min(1).max(31).optional(),
  medicalNote: z.string().optional(),
  medicalConditions: z.array(z.string()).default([]),
  zipCode: z.string().min(8, { message: 'CEP obrigatório (8 dígitos).' }),
  street: z.string().min(1, { message: 'A rua é obrigatória.' }),
  number: z.string().min(1, { message: 'O número é obrigatório.' }),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().min(1, { message: 'A cidade é obrigatória.' }),
  state: z.string().min(1, { message: 'O estado é obrigatório.' }),
  active: z.boolean().default(true),
  serie: z.string().optional(),
  turma: z.string().optional(),
  photoUrl: z.string().optional(),
});

type StudentFormValues = z.infer<typeof formSchema>;

type School = { id: string; name: string };
type Parent = { 
  id: string; 
  name: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

interface StudentFormProps {
  student?: { id: string; monthlyFee?: number; preferredPaymentDay?: number; photoUrl?: string } & Partial<StudentFormValues>;
  schools: School[];
  parents: Parent[];
  onFormSubmit: () => void;
}

const defaultValues: StudentFormValues = {
  name: '',
  latitude: undefined,
  longitude: undefined,
  schoolId: '',
  parentId: '',
  shift: 'Manhã',
  monthlyFee: undefined,
  preferredPaymentDay: 10,
  medicalNote: '',
  medicalConditions: [],
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  active: true,
  serie: '',
  turma: '',
  photoUrl: '',
};

export function StudentForm({
  student,
  schools,
  parents,
  onFormSubmit,
}: StudentFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const { data: allStudents } = useMockCollection('students');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const zipCode = form.watch('zipCode');
  const parentId = form.watch('parentId');
  const currentPhoto = form.watch('photoUrl');

  // Herança de Irmãos Inteligente
  const siblings = useMemo(() => {
      if (!parentId || !allStudents) return [];
      return allStudents.filter(s => s.parentId === parentId && s.id !== student?.id);
  }, [parentId, allStudents, student?.id]);

  const handleCopyFromSibling = (sibling: any) => {
      form.setValue('zipCode', sibling.zipCode || '');
      form.setValue('street', sibling.street || '');
      form.setValue('number', sibling.number || '');
      form.setValue('complement', sibling.complement || '');
      form.setValue('neighborhood', sibling.neighborhood || '');
      form.setValue('city', sibling.city || '');
      form.setValue('state', sibling.state || '');
      form.setValue('latitude', sibling.latitude);
      form.setValue('longitude', sibling.longitude);
      toast({ title: `Dados copiados de ${sibling.name}!`, description: "Endereço e GPS preenchidos." });
  };

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
        const result = await geocodeAddress({ address: searchQuery });
        
        form.setValue('street', result.street || '');
        form.setValue('number', result.number || '');
        form.setValue('zipCode', result.zipCode || '');
        form.setValue('neighborhood', result.neighborhood || '');
        form.setValue('city', result.city || '');
        form.setValue('state', result.state || '');
        form.setValue('latitude', result.latitude);
        form.setValue('longitude', result.longitude);
        
        toast({
            title: "Endereço localizado!",
            description: "Campos de endereço preenchidos.",
        });
    } catch (e) {
        toast({
            title: "Busca falhou",
            description: "Não conseguimos localizar este local.",
            variant: "destructive"
        });
    } finally {
        setIsSearching(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
        form.setValue('photoUrl', reader.result as string);
        setIsUploading(false);
        toast({ title: "Identificação Visual Capturada!" });
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const cleanedCep = zipCode?.replace(/\D/g, '');
    if (cleanedCep && cleanedCep.length === 8) {
      const fetchAddress = async () => {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            form.setValue('street', data.logradouro || '');
            form.setValue('neighborhood', data.bairro || '');
            form.setValue('city', data.localidade || '');
            form.setValue('state', data.uf || '');
            toast({ title: "CEP localizado!", description: "Endereço atualizado." });
            form.setFocus('number');
          } else {
            toast({ title: "CEP não encontrado", variant: "destructive" });
          }
        } catch (error) {
          console.error("Erro ao buscar CEP:", error);
        } finally {
          setIsFetchingCep(false);
        }
      };
      fetchAddress();
    }
  }, [zipCode, form, toast]);


  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || '',
        latitude: student.latitude,
        longitude: student.longitude,
        schoolId: student.schoolId || '',
        parentId: student.parentId || '',
        shift: student.shift || 'Manhã',
        monthlyFee: student.monthlyFee,
        preferredPaymentDay: student.preferredPaymentDay,
        medicalNote: student.medicalNote || '',
        medicalConditions: student.medicalConditions || [],
        zipCode: student.zipCode || '',
        street: student.street || '',
        number: student.number || '',
        complement: student.complement || '',
        neighborhood: student.neighborhood || '',
        city: student.city || '',
        state: student.state || '',
        active: student.active ?? true,
        serie: student.serie || '',
        turma: student.turma || '',
        photoUrl: student.photoUrl || '',
      });
    } else {
      form.reset(defaultValues);
    }
  }, [student, form]);
  
  const handleCopyAddress = () => {
    if (!parentId) return;
    const selectedParent = parents.find((p) => p.id === parentId);
    if (selectedParent && selectedParent.street) {
      form.setValue('zipCode', selectedParent.zipCode || '');
      form.setValue('street', selectedParent.street || '');
      form.setValue('number', selectedParent.number || '');
      form.setValue('complement', selectedParent.complement || '');
      form.setValue('neighborhood', selectedParent.neighborhood || '');
      form.setValue('city', selectedParent.city || '');
      form.setValue('state', selectedParent.state || '');
      toast({ title: 'Endereço copiado!' });
    }
  };

  const onSubmit = async (data: StudentFormValues) => {
    setIsSaving(true);
    try {
        let finalLat = data.latitude;
        let finalLng = data.longitude;

        if (data.street && data.city && (!finalLat || !finalLng)) {
            const fullAddress = `${data.street}, ${data.number || ''}, ${data.complement || ''}, ${data.neighborhood || ''}, ${data.city} - ${data.state || ''}`;
            try {
                const geoResult = await geocodeAddress({ address: fullAddress });
                finalLat = geoResult.latitude;
                finalLng = geoResult.longitude;
            } catch (e) {
                console.warn("Falha na geocodificação ao salvar:", e);
            }
        }

        const studentData = { ...data, latitude: finalLat, longitude: finalLng };

        if (student) {
            updateDoc('students', student.id, studentData);
            toast({ title: 'Aluno atualizado!' });
        } else {
            addDoc('students', { ...studentData, status: 'aguardando' });
            toast({ title: 'Aluno adicionado!' });
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
        <DialogTitle>{student ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
        <DialogDescription>Preencha as informações do aluno abaixo. Escola e Endereço de Embarque são obrigatórios.</DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4 space-y-6">
          
          {/* Identificação Visual */}
          <div className="flex flex-col items-center gap-4 py-4 border rounded-lg bg-secondary/10">
            <div className="relative group">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                    <AvatarImage src={currentPhoto} style={{ objectFit: 'cover' }} />
                    <AvatarFallback className="bg-secondary text-primary"><User className="h-16 w-16" /></AvatarFallback>
                </Avatar>
                <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Camera className="text-white h-8 w-8" />
                </button>
            </div>
            <div className="text-center space-y-1">
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                    {isUploading ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Camera className="mr-2 h-4 w-4" />}
                    {currentPhoto ? 'Trocar Foto do Aluno' : 'Capturar Foto do Aluno'}
                </Button>
                <p className="text-[10px] text-muted-foreground italic">Exibida no checklist do motorista para segurança.</p>
            </div>
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} className="hidden" onChange={handleFileChange} />
          </div>

          <div className="bg-primary/5 p-4 rounded-lg border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-primary font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Busca Inteligente de Endereço</span>
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="Ex: Rua Oscar Freire, 50, Jardins, São Paulo" 
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
            <form id="student-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Aluno *</FormLabel>
                    <FormControl><Input placeholder="Ex: João da Silva" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione um responsável" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {parents.map(parent => (
                          <SelectItem key={parent.id} value={parent.id}>{parent.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Seletor de Herança de Irmãos */}
              {siblings.length > 0 && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-md space-y-2">
                      <p className="text-[10px] font-bold uppercase text-primary flex items-center gap-2">
                          <Users className="h-3 w-3" /> Irmão(s) detectado(s):
                      </p>
                      <div className="flex flex-wrap gap-2">
                          {siblings.map(sibling => (
                              <Button 
                                key={sibling.id} 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] bg-background"
                                onClick={() => handleCopyFromSibling(sibling)}
                              >
                                  Copiar dados de {sibling.name.split(' ')[0]}
                              </Button>
                          ))}
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="serie"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Série/Ano</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione a série..." /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {SERIE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="turma"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turma/Sala</FormLabel>
                      <FormControl><Input placeholder="Ex: Sala 102 - Turma B" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="border-t pt-4 mt-4">
                 <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-medium flex items-center gap-2"><MapPin className="h-4 w-4" /> Endereço de Embarque *</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyAddress} disabled={!parentId}>
                        <Copy className="mr-2 h-3 w-3"/> Usar do responsável
                    </Button>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <FormField
                        control={form.control} name="zipCode"
                        render={({ field }) => (
                            <FormItem className="md:col-span-1">
                            <FormLabel>CEP *</FormLabel>
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
                            <FormLabel>Rua *</FormLabel>
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
                            <FormItem><FormLabel>Número *</FormLabel><FormControl><Input placeholder="123" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                     <FormField
                        control={form.control} name="complement"
                        render={({ field }) => (
                            <FormItem><FormLabel>Complemento</FormLabel><FormControl><Input placeholder="Apto 4B" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
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
                            <FormItem><FormLabel>Cidade *</FormLabel><FormControl><Input placeholder="São Paulo" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="state"
                        render={({ field }) => (
                            <FormItem><FormLabel>Estado (UF) *</FormLabel><FormControl><Input placeholder="SP" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
                        )}
                    />
                </div>
              </div>

              <div className="border-t pt-4 mt-4 bg-destructive/5 p-4 rounded-lg">
                 <div className="mb-3">
                    <p className="text-sm font-bold flex items-center gap-2 text-destructive">
                        <HeartPulse className="h-4 w-4" /> Alertas de Saúde e Cuidados
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1 italic">Caso o aluno não possua condições especiais, não é necessário selecionar nenhuma opção.</p>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {HEALTH_CATEGORIES.map((cat) => (
                        <FormField
                            key={cat.id}
                            control={form.control}
                            name="medicalConditions"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-2 bg-background">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(cat.id)}
                                            onCheckedChange={(checked) => {
                                                const current = field.value || [];
                                                return checked
                                                    ? field.onChange([...current, cat.id])
                                                    : field.onChange(current.filter((value) => value !== cat.id));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-xs font-medium flex items-center gap-2 cursor-pointer">
                                        {cat.icon}
                                        {cat.label}
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                    ))}
                 </div>

                 <FormField
                    control={form.control}
                    name="medicalNote"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs text-muted-foreground">Observações Detalhadas</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Detalhes sobre alergias, dosagens de medicação ou cuidados específicos..." 
                                    {...field} 
                                    value={field.value ?? ''}
                                    className="bg-background text-sm"
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="schoolId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Escola de Destino *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Selecione uma escola" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {schools.map(school => (
                          <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4 pb-10">
                <div className="md:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2 mb-3">
                        <CalendarDays className="h-4 w-4 text-primary" /> Configurações Financeiras
                    </p>
                </div>
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecione o turno" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Manhã">Manhã</SelectItem>
                          <SelectItem value="Tarde">Tarde</SelectItem>
                          <SelectItem value="Integral">Integral</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                    control={form.control}
                    name="monthlyFee"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Mensalidade (R$)</FormLabel>
                            <FormControl><Input type="number" step="any" placeholder="Ex: 450.00" {...field} value={field.value ?? ''} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                   />
                <FormField
                    control={form.control}
                    name="preferredPaymentDay"
                    render={({ field }) => (
                        <FormItem className="md:col-span-2">
                            <FormLabel>Dia de Vencimento</FormLabel>
                            <Select onValueChange={(v) => field.onChange(Number(v))} value={field.value?.toString()}>
                                <FormControl>
                                    <SelectTrigger><SelectValue placeholder="Selecione o dia" /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>Dia {day}</SelectItem>)}
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
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                    <div className="space-y-0.5"><FormLabel>Aluno Ativo</FormLabel></div>
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
        <Button type="submit" form="student-form" disabled={isSaving}>
            {isSaving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin"/> Salvando...</> : "Salvar Aluno"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
