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
import { Button } from '@/components/ui/button';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMockData } from '@/hooks/use-mock-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Sparkles } from 'lucide-react';

const formSchema = z.object({
  generatedContent: z.string().min(50, { message: 'O conteúdo do contrato é muito curto.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractEditFormProps {
  contract: { id: string; generatedContent: string };
  studentName: string;
  onFormSubmit: () => void;
}

export function ContractEditForm({ contract, studentName, onFormSubmit }: ContractEditFormProps) {
  const { toast } = useToast();
  const { updateDoc } = useMockData();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      generatedContent: contract.generatedContent,
    },
  });

  const onSubmit = (data: FormValues) => {
    updateDoc('contracts', contract.id, {
        generatedContent: data.generatedContent,
    });

    toast({
      title: 'Contrato Atualizado!',
      description: `As alterações manuais no contrato de ${studentName} foram salvas.`,
    });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-3xl h-[90vh] flex flex-col p-0 overflow-hidden">
      <DialogHeader className="p-6 pb-2 border-b shrink-0">
        <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-primary" />
            Editar Texto do Contrato
        </DialogTitle>
        <DialogDescription>
          Ajuste manualmente as cláusulas para o aluno <strong>{studentName}</strong> antes do aceite.
        </DialogDescription>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div className="px-6 py-4">
          <Form {...form}>
            <form id="contract-edit-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="generatedContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo Final</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={20} 
                        className="font-serif text-sm leading-relaxed bg-secondary/10"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="p-4 bg-primary/5 rounded-lg border border-dashed text-[10px] text-muted-foreground flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <p>As edições feitas aqui são permanentes para este documento específico. Use para adicionar observações particulares ou cláusulas de exceção.</p>
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>

      <DialogFooter className="p-6 border-t shrink-0 bg-background gap-2">
        <DialogClose asChild>
          <Button type="button" variant="ghost" className="flex-1">
            Cancelar
          </Button>
        </DialogClose>
        <Button type="submit" form="contract-edit-form" className="flex-1 font-bold h-12">
            SALVAR ALTERAÇÕES
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
