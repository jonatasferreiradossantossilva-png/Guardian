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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formSchema = z.object({
  studentId: z.string({ required_error: 'Selecione um aluno.' }),
  templateId: z.string({ required_error: 'Selecione um modelo de contrato.' }),
});

type FormValues = z.infer<typeof formSchema>;

interface ContractGenerateFormProps {
  students: any[];
  parents: any[];
  templates: any[];
  existingContracts: any[];
  onFormSubmit: () => void;
}

export function ContractGenerateForm({ students, parents, templates, existingContracts, onFormSubmit }: ContractGenerateFormProps) {
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const { data: schools } = useMockCollection('schools');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const studentsWithoutContract = useMemo(() => {
    const contractedStudentIds = new Set(existingContracts.map(c => c.studentId));
    return students.filter(s => !contractedStudentIds.has(s.id));
  }, [students, existingContracts]);

  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const parentsMap = useMemo(() => new Map(parents.map(p => [p.id, p])), [parents]);
  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);
  const templatesMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);

  const onSubmit = (data: FormValues) => {
    const student = studentsMap.get(data.studentId);
    const parent = parentsMap.get(student?.parentId);
    const template = templatesMap.get(data.templateId);

    if (!student || !parent || !template) {
      toast({ title: "Erro de dados", description: "Aluno, responsável ou modelo não encontrado.", variant: "destructive" });
      return;
    }
    
    const schoolName = schoolsMap.get(student.schoolId) || "Escola não informada";
    const studentAddress = `${student.street || ''}, ${student.number || ''}`;
    const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    let generatedContent = template.content;
    generatedContent = generatedContent.replace(/{{aluno_nome}}/g, student.name || '');
    generatedContent = generatedContent.replace(/{{responsavel_nome}}/g, parent.name || '');
    generatedContent = generatedContent.replace(/{{responsavel_cpf}}/g, parent.cpf || '');
    generatedContent = generatedContent.replace(/{{aluno_endereco}}/g, studentAddress);
    generatedContent = generatedContent.replace(/{{escola_nome}}/g, schoolName);
    generatedContent = generatedContent.replace(/{{valor_mensalidade}}/g, student.monthlyFee?.toFixed(2).replace('.', ',') || '0,00');
    generatedContent = generatedContent.replace(/{{data_geracao}}/g, generationDate);

    addDoc('contracts', {
        templateId: data.templateId,
        studentId: data.studentId,
        parentUserId: parent.userId,
        generatedContent,
        status: 'pending_acceptance',
        createdAt: new Date().toISOString(),
    });

    toast({
      title: 'Contrato Gerado!',
      description: `O contrato para ${student.name} foi gerado e enviado para o responsável.`,
    });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Gerar Novo Contrato</DialogTitle>
        <DialogDescription>
          Selecione o aluno e o modelo para gerar um novo contrato.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Aluno</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um aluno..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {studentsWithoutContract.length > 0 ? (
                        studentsWithoutContract.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                    ) : (
                        <div className="p-4 text-sm text-muted-foreground">Todos os alunos já possuem contrato.</div>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo de Contrato</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione um modelo..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter className="pt-4">
            <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
            <Button type="submit">Gerar e Enviar para Aceite</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
