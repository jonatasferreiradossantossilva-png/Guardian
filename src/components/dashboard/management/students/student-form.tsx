
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
import { useEffect, useState } from 'react';
import { useMockData } from '@/hooks/use-mock-data';
import { Copy, Info, Loader2, MapPin, HeartPulse } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Textarea } from '@/components/ui/textarea';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  schoolId: z.string().min(1, { message: 'Selecione uma escola.' }),
  parentId: z.string().min(1, { message: 'Selecione um responsável.' }),
  shift: z.enum(['Manhã', 'Tarde', 'Integral'], { required_error: 'Selecione um turno.' }),
  monthlyFee: z.coerce.number().min(0, { message: 'O valor deve ser R$ 0 ou maior.' }).optional(),
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
  student?: { id: string; monthlyFee?: number } & Partial<StudentFormValues>;
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
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const zipCode = form.watch('zipCode');
  const parentId = form.watch('parentId');

  const handleGeocode = async () => {
    const { street, number, neighborhood, city, state } = form.getValues();
    if (!street || !city) {
      toast({
        title: "Endereço incompleto",
        description: "Preencha pelo menos a rua e a cidade para localizar no mapa.",
        variant: "destructive"
      });
      return;
    }

    setIsGeocoding(true);
    try {
      const fullAddress = `${street}, ${number || ''}, ${neighborhood || ''}, ${city} - ${state || ''}`;
      const result = await geocodeAddress({ address: fullAddress });
      form.setValue('latitude', result.latitude);
      form.setValue('longitude', result.longitude);
      toast({
        title: "Localização encontrada!",
        description: "As coordenadas de GPS foram atualizadas automaticamente."
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao localizar",
        description: "Não conseguimos obter as coordenadas. Verifique o endereço.",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  };

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
          }
        } catch (error) {
          console.error(error);
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
        ...student,
        shift: student.shift || 'Manhã',
        active: student.active ?? true,
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

  const onSubmit = (data: StudentFormValues) => {
    if (student) {
      updateDoc('students', student.id, data);
      toast({ title: 'Aluno atualizado!' });
    } else {
      addDoc('students', { ...data, status: 'aguardando' });
      toast({ title: 'Aluno adicionado!' });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{student ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
        <DialogDescription>Preencha as informações do aluno abaixo.</DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Aluno</FormLabel>
                <FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl>
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
                 <FormField
                    control={form.control} name="neighborhood"
                    render={({ field }) => (
                        <FormItem><FormLabel>Bairro</FormLabel><FormControl><Input placeholder="Centro" {...field} /></FormControl><FormMessage /></FormItem>
                    )}
                />
                <div className="flex items-end">
                    <Button type="button" variant="secondary" className="w-full" onClick={handleGeocode} disabled={isGeocoding}>
                        {isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                        Validar GPS
                    </Button>
                </div>
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
          
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ''} /></FormControl>
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
                  <FormControl><Input type="number" step="any" {...field} value={field.value ?? ''}/></FormControl>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <FormControl><Input type="number" step="any" placeholder="Ex: 450.00" {...field} /></FormControl>
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

          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
