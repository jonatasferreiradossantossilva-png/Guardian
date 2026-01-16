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
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  schoolId: z.string().min(1, { message: 'Selecione uma escola.' }),
  parentId: z.string().min(1, { message: 'Selecione um responsável.' }),
  shift: z.enum(['Manhã', 'Tarde'], { required_error: 'Selecione um turno.' }),
  status: z.enum(['aguardando', 'a_bordo', 'desembarcado', 'ausente'], {
    required_error: 'Selecione um status.',
  }),
  routeId: z.string().optional(),
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
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      schoolId: '',
      parentId: '',
      shift: 'Manhã',
      status: 'aguardando',
      routeId: '',
    },
  });

  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || '',
        schoolId: student.schoolId || '',
        parentId: student.parentId || '',
        shift: student.shift || 'Manhã',
        status: student.status || 'aguardando',
        routeId: student.routeId || '',
      });
    } else {
      form.reset({
        name: '',
        schoolId: '',
        parentId: '',
        shift: 'Manhã',
        status: 'aguardando',
        routeId: '',
      });
    }
  }, [student, form]);

  const onSubmit = (data: StudentFormValues) => {
    if (!firestore) return;

    const studentData = { ...data };
    if (!studentData.routeId) {
        delete (studentData as Partial<typeof studentData>).routeId; // Do not save empty string
    }

    if (student) {
      const studentRef = doc(firestore, 'students', student.id);
      updateDocumentNonBlocking(studentRef, studentData);
      toast({
        title: 'Aluno atualizado!',
        description: `Os dados de ${data.name} foram atualizados com sucesso.`,
      });
    } else {
      const studentsCollection = collection(firestore, 'students');
      addDocumentNonBlocking(studentsCollection, studentData);
      toast({
        title: 'Aluno adicionado!',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{student ? 'Editar Aluno' : 'Adicionar Aluno'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do aluno abaixo.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                 <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o turno" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Manhã">Manhã</SelectItem>
                    <SelectItem value="Tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
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
