
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
  FormDescription,
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
import { useEffect, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Copy, Loader2, HeartPulse, CalendarDays } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  zipCode: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  active: z.boolean().default(true),
  serie: z.string().optional(),
  turma: z.string().optional(),
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
  student?: { id: string; monthlyFee?: number; preferredPaymentDay?: number } & Partial<StudentFormValues>;
  schools: School[];
  parents: Parent[];
  onFormSubmit: () => void;
}

export function StudentForm({
  student,
  schools,
  parents,
  onFormSubmit,
}: StudentFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      latitude: undefined,
      longitude: undefined,
      schoolId: '',
      parentId: '',
      shift: 'Manhã',
      monthlyFee: undefined,
      preferredPaymentDay: 10,
      medicalNote: '',
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
    },
  });

  const { zipCode, parentId } = form.watch();

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
      });
    } else {
      form.reset(form.defaultValues);
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
                console.warn("Falha na geocodificação automática no salvamento:", e);
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
        toast({ title: "Erro ao salvar", description: "Ocorreu um problema inesperado.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{student ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
        <DialogDescription>Preencha as informações do aluno abaixo.</DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="student-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Aluno</FormLabel>
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
                    <FormLabel>Responsável</FormLabel>
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
                    <p className="text-sm font-medium">Endereço do Aluno</p>
                    <Button type="button" variant="outline" size="sm" onClick={handleCopyAddress} disabled={!parentId}>
                        <Copy className="mr-2 h-3 w-3"/> Usar endereço do responsável
                    </Button>
                </div>
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
              </div>

              <div className="border-t pt-4 mt-4 bg-destructive/5 p-4 rounded-lg">
                 <p className="text-sm font-bold flex items-center gap-2 mb-3 text-destructive">
                    <HeartPulse className="h-4 w-4" /> Alertas Médicos e Cuidados Especiais
                 </p>
                 <FormField
                    control={form.control}
                    name="medicalNote"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel className="text-xs">Informações de Saúde (Alergias, Remédios, etc.)</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="Ex: Alérgico a amendoim. Levar bombinha de asma em caso de falta de ar." 
                                    {...field} 
                                    value={field.value ?? ''}
                                    className="bg-background"
                                />
                            </FormControl>
                            <FormDescription className="text-[10px]">
                                Este alerta ficará visível para o motorista e monitor durante o embarque.
                            </FormDescription>
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
                    <FormLabel>Escola</FormLabel>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4 mt-4">
                <div className="md:col-span-2">
                    <p className="text-sm font-bold flex items-center gap-2 mb-3">
                        <CalendarDays className="h-4 w-4 text-primary" /> Configurações Financeiras do Aluno
                    </p>
                </div>
                <FormField
                  control={form.control}
                  name="shift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Turno</FormLabel>
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
                            <FormLabel>Dia Preferencial de Vencimento</FormLabel>
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
