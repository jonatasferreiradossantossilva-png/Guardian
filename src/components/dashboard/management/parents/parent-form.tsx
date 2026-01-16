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
  email: z.string().email({ message: 'Insira um email válido.' }),
  phone: z.string().min(1, { message: 'O telefone é obrigatório.' }),
  userId: z.string().min(1, { message: 'O ID de usuário do Firebase é obrigatório.' }),
  cpf: z.string().optional(),
  rg: z.string().optional(),
  address: z.string().optional(),
});

type ParentFormValues = z.infer<typeof formSchema>;

interface ParentFormProps {
  parent?: { id: string } & Partial<ParentFormValues>;
  onFormSubmit: () => void;
}

export function ParentForm({ parent, onFormSubmit }: ParentFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<ParentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      userId: '',
      cpf: '',
      rg: '',
      address: '',
    },
  });

  useEffect(() => {
    if (parent) {
      form.reset({
        name: parent.name || '',
        email: parent.email || '',
        phone: parent.phone || '',
        userId: parent.userId || '',
        cpf: parent.cpf || '',
        rg: parent.rg || '',
        address: parent.address || '',
      });
    } else {
      form.reset({
        name: '',
        email: '',
        phone: '',
        userId: '',
        cpf: '',
        rg: '',
        address: '',
      });
    }
  }, [parent, form]);

  const onSubmit = (data: ParentFormValues) => {
    if (parent) {
      updateDoc('parents', parent.id, data);
      toast({
        title: 'Responsável atualizado!',
        description: `Os dados de ${data.name} foram atualizados com sucesso.`,
      });
    } else {
      addDoc('parents', data);
      toast({
        title: 'Responsável adicionado!',
        description: `${data.name} foi adicionado com sucesso.`,
      });
    }
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{parent ? 'Editar Responsável' : 'Adicionar Responsável'}</DialogTitle>
        <DialogDescription>
          Preencha as informações do responsável abaixo. O ID do usuário é necessário para que ele possa acessar o painel.
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
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div className="grid grid-cols-2 gap-4">
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
                name="rg"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>RG</FormLabel>
                    <FormControl>
                        <Input placeholder="00.000.000-0" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
          </div>
           <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço</FormLabel>
                <FormControl>
                  <Input placeholder="Rua, Número, Bairro, Cidade - Estado" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="userId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>ID do Usuário (Firebase Auth)</FormLabel>
                <FormControl>
                  <Input placeholder="Cole o UID do usuário" {...field} />
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
