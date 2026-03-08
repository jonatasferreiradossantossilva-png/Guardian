
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { FileText, Sparkles } from 'lucide-react';

const formSchema = z.object({
  studentId: z.string({ required_error: 'Selecione um aluno.' }).min(1, { message: 'Selecione um aluno.' }),
  templateId: z.string({ required_error: 'Selecione um modelo de contrato.' }).min(1, { message: 'Selecione um modelo de contrato.' }),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
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
    defaultValues: {
        studentId: '',
        templateId: '',
        banco: '',
        agencia: '',
        conta: '',
    }
  });

  const studentsWithoutContract = useMemo(() => {
    const contractedStudentIds = new Set(existingContracts.map(c => c.studentId));
    return students.filter(s => !contractedStudentIds.has(s.id) && s.active !== false);
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
    const studentAddress = `${student.street || ''}, ${student.number || ''} - ${student.neighborhood || ''}`;
    const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const schoolYear = new Date().getFullYear().toString();

    let generatedContent = template.content;
    
    // Substituição robusta de placeholders
    generatedContent = generatedContent.replace(/{{aluno_nome}}/g, student.name || 'N/A');
    generatedContent = generatedContent.replace(/{{responsavel_nome}}/g, parent.name || 'N/A');
    generatedContent = generatedContent.replace(/{{responsavel_cpf}}/g, parent.cpf || 'N/A');
    generatedContent = generatedContent.replace(/{{aluno_endereco}}/g, studentAddress);
    generatedContent = generatedContent.replace(/{{escola_nome}}/g, schoolName);
    generatedContent = generatedContent.replace(/{{valor_mensalidade}}/g, `R$ ${student.monthlyFee?.toFixed(2).replace('.', ',') || '0,00'}`);
    generatedContent = generatedContent.replace(/{{turno}}/g, student.shift || 'N/A');
    generatedContent = generatedContent.replace(/{{dia_vencimento}}/g, student.preferredPaymentDay?.toString() || '10');
    generatedContent = generatedContent.replace(/{{data_geracao}}/g, generationDate);
    generatedContent = generatedContent.replace(/{{ano_letivo}}/g, schoolYear);
    generatedContent = generatedContent.replace(/{{banco}}/g, data.banco || 'N/A');
    generatedContent = generatedContent.replace(/{{agencia}}/g, data.agencia || 'N/A');
    generatedContent = generatedContent.replace(/{{conta}}/g, data.conta || 'N/A');

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
      description: `O contrato para ${student.name} já está disponível para o pai.`,
    });
    onFormSubmit();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Novo Contrato
        </DialogTitle>
        <DialogDescription>
          A IA preencherá automaticamente os dados do aluno e responsável no modelo selecionado.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField
            control={form.control}
            name="studentId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selecionar Aluno</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Escolha um aluno sem contrato..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {studentsWithoutContract.length > 0 ? (
                        studentsWithoutContract.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)
                    ) : (
                        <div className="p-4 text-xs text-muted-foreground italic">Nenhum aluno pendente de contrato.</div>
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
                <FormLabel>Modelo Base</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione o modelo de texto..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-primary/10">
              <AccordionTrigger className="text-xs font-black uppercase text-muted-foreground hover:no-underline">Dados de Pagamento (Opcional)</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Banco para Recebimento</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Banco do Brasil ou Chave Pix" {...field} className="h-8" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="agencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Agência</FormLabel>
                          <FormControl><Input placeholder="0000-0" {...field} className="h-8" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="conta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs">Conta</FormLabel>
                          <FormControl><Input placeholder="00000-0" {...field} className="h-8" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="pt-4 gap-2">
            <DialogClose asChild><Button type="button" variant="ghost" className="flex-1">Cancelar</Button></DialogClose>
            <Button type="submit" className="flex-1 font-bold">GERAR E ENVIAR</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
