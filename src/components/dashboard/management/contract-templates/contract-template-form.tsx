
"use client";

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
import { useData } from '@/hooks/use-data';
import { ScrollArea } from '@/components/ui/scroll-area';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  content: z.string().min(50, { message: 'O conteúdo do contrato é muito curto.' }),
});

type FormValues = z.infer<typeof formSchema>;
type Template = { id: string; name: string; content: string; };

interface ContractTemplateFormProps {
  template?: Partial<Template>;
  templates: Template[];
  onFormSubmit: () => void;
}

export function ContractTemplateForm({ template, templates, onFormSubmit }: ContractTemplateFormProps) {
  const { toast } = useToast();
  const { addDoc, updateDoc } = useData();

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
      form.reset();
    }
  }, [template, form]);

  const onSubmit = (data: FormValues) => {
    const nameExists = templates.some(
      (t) => t.name.toLowerCase() === data.name.toLowerCase() && t.id !== template?.id
    );

    if (nameExists) {
      toast({
        title: 'Nome duplicado',
        description: 'Já existe um modelo de contrato com este nome. Por favor, escolha outro.',
        variant: 'destructive',
      });
      return;
    }

    if (template && template.id) {
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
    '{{aluno_endereco}}', '{{escola_nome}}', '{{valor_mensalidade}}', '{{turno}}', 
    '{{dia_vencimento}}', '{{data_geracao}}', '{{ano_letivo}}', '{{banco}}', 
    '{{agencia}}', '{{conta}}', '{{chave_pix}}'
  ];

  return (
    <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle>{template && template.id ? 'Editar Modelo' : 'Criar Novo Modelo de Contrato'}</DialogTitle>
        <DialogDescription>
          Crie o texto padrão do seu contrato. Use as variáveis abaixo para preencher os dados automaticamente.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="contract-template-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Modelo</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Contrato Padrão 2024" {...field} />
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
                    <div className="mt-2 p-3 bg-muted rounded-md border border-dashed">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Variáveis Inteligentes</p>
                      <div className="flex flex-wrap gap-1">
                        {placeholders.map(p => <code key={p} className="p-1 bg-background rounded text-[10px] text-primary">{p}</code>)}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background">
        <DialogClose asChild>
          <Button type="button" variant="outline">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" form="contract-template-form">Salvar Modelo</Button>
      </DialogFooter>
    </DialogContent>
  );
}
