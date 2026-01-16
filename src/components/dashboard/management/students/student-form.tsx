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
import { useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  schoolId: z.string().min(1, { message: 'Selecione uma escola.' }),
  parentId: z.string().min(1, { message: 'Selecione um responsável.' }),
  shift: z.enum(['manha', 'tarde', 'Manhã', 'Tarde'], { required_error: 'Selecione um turno.' }),
  zipCode: z.string().optional(),
  street: z.string().min(1, { message: 'A rua é obrigatória.' }),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

type StudentFormValues = z.infer<typeof formSchema>;

type School = { id: string; name: string };
type Parent = { id: string; name: string };

interface StudentFormProps {
  student?: { id: string } & Partial<StudentFormValues>;
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

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      latitude: undefined,
      longitude: undefined,
      schoolId: '',
      parentId: '',
      shift: 'manha',
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || '',
        latitude: student.latitude,
        longitude: student.longitude,
        schoolId: student.schoolId || '',
        parentId: student.parentId || '',
        shift: student.shift?.toLowerCase() === 'manhã' ? 'manha' : student.shift?.toLowerCase() === 'tarde' ? 'tarde' : 'manha',
        zipCode: student.zipCode || '',
        street: student.street || '',
        number: student.number || '',
        complement: student.complement || '',
        neighborhood: student.neighborhood || '',
        city: student.city || '',
        state: student.state || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [student, form]);

  const onSubmit = (data: StudentFormValues) => {
    const finalData = {
        ...data,
        shift: data.shift.toLowerCase().startsWith('manh') ? 'Manhã' : 'Tarde'
    }

    if (student) {
      updateDoc('students', student.id, finalData);
      toast({
        title: 'Aluno atualizado!',
        description: `Os dados de ${data.name} foram atualizados com sucesso.`,
      });
    } else {
      const studentData = { ...finalData, status: 'aguardando' };
      addDoc('students', studentData);
      toast({
        title: 'Aluno adicionado!',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{student ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do aluno abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Aluno</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: João da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="border-t pt-4 mt-4">
             <p className="text-sm font-medium mb-2">Endereço</p>
             <div className="grid grid-cols-3 gap-4">
                 <FormField
                    control={form.control} name="zipCode"
                    render={({ field }) => (
                        <FormItem className="col-span-1">
                        <FormLabel>CEP</FormLabel>
                        <FormControl><Input placeholder="00000-000" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="street"
                    render={({ field }) => (
                        <FormItem className="col-span-2">
                        <FormLabel>Rua</FormLabel>
                        <FormControl><Input placeholder="Rua das Flores" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-3 gap-4 mt-4">
                 <FormField
                    control={form.control} name="number"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl><Input placeholder="123" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="complement"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Complemento</FormLabel>
                        <FormControl><Input placeholder="Apto 4B" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="neighborhood"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl><Input placeholder="Centro" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
             <div className="grid grid-cols-2 gap-4 mt-4">
                 <FormField
                    control={form.control} name="city"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl><Input placeholder="São Paulo" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="state"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado (UF)</FormLabel>
                        <FormControl><Input placeholder="SP" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
             </div>
          </div>

           <div className="grid grid-cols-2 gap-4 pt-4">
            <FormField
              control={form.control}
              name="latitude"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Latitude</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" placeholder="-23.55052" {...field} />
                  </FormControl>
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
                  <FormControl>
                    <Input type="number" step="any" placeholder="-46.633308" {...field} />
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
                <FormLabel>Escola</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma escola" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools.map(school => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um responsável" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {parents.map(parent => (
                      <SelectItem key={parent.id} value={parent.id}>
                        {parent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="shift"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Turno</FormLabel>
                 <Select onValueChange={field.onChange} value={field.value?.toLowerCase().startsWith('manh') ? 'manha' : 'tarde'}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manha">Manhã</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit">Salvar</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}

    