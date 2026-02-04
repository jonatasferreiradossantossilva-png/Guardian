"use client";

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { useMockData } from '@/hooks/use-mock-data';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  content: z.string().min(50, { message: 'O conteúdo do contrato é muito curto.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractTemplateFormProps {
  template?: { id: string } & Partial<FormValues>;
  onFormSubmit: () => void;
}

export function ContractTemplateForm({ template, onFormSubmit }: ContractTemplateFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      content: '',
    },
  });

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name || '',
        content: template.content || '',
      });
    } else {
      form.reset(form.defaultValues);
    }
  }, [template, form]);

  const onSubmit = (data: FormValues) => {
    if (template) {
      updateDoc('contract_templates', template.id, data);
      toast({
        title: 'Modelo de Contrato atualizado!',
        description: 'O modelo foi atualizado com sucesso.',
      });
    } else {
      addDoc('contract_templates', { ...data, createdAt: new Date().toISOString() });
      toast({
        title: 'Modelo de Contrato criado!',
        description: 'O novo modelo foi salvo no sistema.',
      });
    }
    onFormSubmit();
  };

  const placeholders = [
    '{{aluno_nome}}', '{{responsavel_nome}}', '{{responsavel_cpf}}',
    '{{aluno_endereco}}', '{{escola_nome}}', '{{valor_mensalidade}}', '{{data_geracao}}',
    '{{ano_letivo}}', '{{banco}}', '{{agencia}}', '{{conta}}'
  ];

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{template ? 'Editar Modelo' : 'Criar Novo Modelo de Contrato'}</DialogTitle>
        <DialogDescription>
          Crie o texto padrão do seu contrato. Use as variáveis abaixo para preencher os dados automaticamente.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Modelo</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: Contrato Padrão" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Conteúdo do Contrato</FormLabel>
                <FormControl>
                  <Textarea placeholder="Cole ou digite o texto do seu contrato aqui..." {...field} rows={15} />
                </FormControl>
                <FormDescription>
                    Variáveis disponíveis: {placeholders.map(p => <code key={p} className="mx-1 p-0.5 bg-muted rounded text-xs">{p}</code>)}
                </FormDescription>
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
            <Button type="submit">Salvar Modelo</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
