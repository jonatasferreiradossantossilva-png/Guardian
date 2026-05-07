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
import { Textarea } from '@/components/ui/textarea';
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
import { useData } from '@/hooks/use-data';

const formSchema = z.object({
  text: z.string().min(3, { message: 'A mensagem deve ter pelo menos 3 caracteres.' }),
  for: z.enum(['parent', 'driver', 'monitor', 'gestor', 'all'], { required_error: 'Selecione para quem a mensagem se destina.' }),
});

type PredefinedMessageFormValues = z.infer<typeof formSchema>;

interface PredefinedMessageFormProps {
  message?: { id: string } & Partial<PredefinedMessageFormValues>;
  onFormSubmit: () => void;
}

export function PredefinedMessageForm({ message, onFormSubmit }: PredefinedMessageFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();

  const form = useForm<PredefinedMessageFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      text: '',
      for: 'all',
    },
  });

  useEffect(() => {
    if (message) {
      form.reset({
        text: message.text || '',
        for: message.for || 'all',
      });
    } else {
      form.reset();
    }
  }, [message, form]);

  const onSubmit = (data: PredefinedMessageFormValues) => {
    if (message) {
      updateDoc('predefined_messages', message.id, data);
      toast({
        title: 'Mensagem atualizada!',
        description: 'A mensagem predefinida foi atualizada.',
      });
    } else {
      addDoc('predefined_messages', data);
      toast({
        title: 'Mensagem adicionada!',
        description: 'A nova mensagem predefinida foi salva.',
      });
    }
    onFormSubmit();
  };

  const profileMap = {
    'all': 'Todos',
    'parent': 'Pais',
    'driver': 'Motorista',
    'monitor': 'Monitor',
    'gestor': 'Gestor',
  };


  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{message ? 'Editar Mensagem Predefinida' : 'Adicionar Mensagem Predefinida'}</DialogTitle>
        <DialogDescription>
          Crie ou edite uma mensagem para uso rápido nos chats.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Texto da Mensagem</FormLabel>
                <FormControl>
                  <Textarea placeholder="Ex: Estou a 5 minutos do local." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="for"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disponível para</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um perfil" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(profileMap).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
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

    