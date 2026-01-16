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
import { useFirestore } from '@/firebase';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { collection, doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';

const formSchema = z.object({
  name: z.string().min(1, { message: 'O nome é obrigatório.' }),
  email: z.string().email({ message: 'Insira um email válido.' }),
  phone: z.string().min(1, { message: 'O telefone é obrigatório.' }),
});

type ParentFormValues = z.infer<typeof formSchema>;

interface ParentFormProps {
  parent?: { id: string } & ParentFormValues;
  onFormSubmit: () => void;
}

export function ParentForm({ parent, onFormSubmit }: ParentFormProps) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  useEffect(() => {
    if (parent) {
      form.reset(parent);
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
      });
    }
  }, [parent, form]);

  const onSubmit = (data: ParentFormValues) => {
    if (!firestore) return;

    if (parent) {
      const parentRef = doc(firestore, 'parents', parent.id);
      updateDocumentNonBlocking(parentRef, data);
      toast({
        title: 'Responsável atualizado!',
        description: `Os dados de ${data.name} foram atualizados com sucesso.`,
      });
    } else {
      const parentsCollection = collection(firestore, 'parents');
      addDocumentNonBlocking(parentsCollection, data);
      toast({
        title: 'Responsável adicionado!',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{parent ? 'Editar Responsável' : 'Adicionar Responsável'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do responsável abaixo.
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
                  <Input placeholder="Ex: Maria Souza" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: maria.souza@email.com" {...field} />
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
                <FormLabel>Telefone</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: (11) 98765-4321" {...field} />
                </FormControl>
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
