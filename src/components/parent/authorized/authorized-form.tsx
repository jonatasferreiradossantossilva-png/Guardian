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
import { useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  cpf: z.string().min(11, { message: 'O CPF é obrigatório.' }),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AuthorizedPersonFormProps {
  person?: { id: string } & Partial<FormValues>;
  studentId: string;
  parentUserId: string;
  onFormSubmit: () => void;
}

export function AuthorizedPersonForm({ person, studentId, parentUserId, onFormSubmit }: AuthorizedPersonFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cpf: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (person) {
      form.reset({
        name: person.name || '',
        cpf: person.cpf || '',
        phone: person.phone || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [person, form]);

  const onSubmit = (data: FormValues) => {
    if (person) {
      updateDoc('authorized_pickups', person.id, data);
      toast({
        title: 'Contato atualizado!',
        description: `Os dados de ${data.name} foram atualizados.`,
      });
    } else {
      addDoc('authorized_pickups', { ...data, studentId, parentUserId });
      toast({
        title: 'Contato adicionado!',
        description: `${data.name} agora pode retirar o aluno.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{person ? 'Editar Pessoa Autorizada' : 'Adicionar Pessoa Autorizada'}</DialogTitle>
        <DialogDescription>
          Preencha as informações da pessoa de confiança.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Maria da Silva" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="cpf"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CPF</FormLabel>
                <FormControl>
                  <Input placeholder="000.000.000-00" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Telefone (Opcional)</FormLabel>
                <FormControl>
                  <Input placeholder="(11) 98765-4321" {...field} />
                </FormControl>
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
