
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
import { useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { FileText, Sparkles, DollarSign, CalendarDays, School, User, QrCode } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const formSchema = z.object({
  studentId: z.string({ required_error: 'Selecione um aluno.' }).min(1, { message: 'Selecione um aluno.' }),
  templateId: z.string({ required_error: 'Selecione um modelo de contrato.' }).min(1, { message: 'Selecione um modelo de contrato.' }),
  banco: z.string().optional(),
  agencia: z.string().optional(),
  conta: z.string().optional(),
  chavePix: z.string().optional(),
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
        chavePix: '',
    }
  });

  const watchStudentId = form.watch('studentId');

  const studentsWithoutContract = useMemo(() => {
    const contractedStudentIds = new Set(existingContracts.map(c => c.studentId));
    return students.filter(s => !contractedStudentIds.has(s.id) && s.active !== false);
  }, [students, existingContracts]);

  const studentsMap = useMemo(() => new Map(students.map(s => [s.id, s])), [students]);
  const parentsMap = useMemo(() => new Map(parents.map(p => [p.id, p])), [parents]);
  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);
  const templatesMap = useMemo(() => new Map(templates.map(t => [t.id, t])), [templates]);

  const selectedStudentData = useMemo(() => {
      if (!watchStudentId) return null;
      const student = studentsMap.get(watchStudentId);
      if (!student) return null;
      const parent = parentsMap.get(student.parentId);
      const schoolName = schoolsMap.get(student.schoolId);
      return { student, parent, schoolName };
  }, [watchStudentId, studentsMap, parentsMap, schoolsMap]);

  const onSubmit = (data: FormValues) => {
    const { student, parent, schoolName } = selectedStudentData || {};
    const template = templatesMap.get(data.templateId);

    if (!student || !parent || !template) {
      toast({ title: "Erro de dados", description: "Aluno, responsável ou modelo não encontrado.", variant: "destructive" });
      return;
    }
    
    const studentAddress = `${student.street || ''}, ${student.number || ''} - ${student.neighborhood || ''}`;
    const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    const schoolYear = new Date().getFullYear().toString();

    let generatedContent = template.content;
    
    // Substituição robusta de placeholders
    generatedContent = generatedContent.replace(/{{aluno_nome}}/g, student.name || 'N/A');
    generatedContent = generatedContent.replace(/{{responsavel_nome}}/g, parent.name || 'N/A');
    generatedContent = generatedContent.replace(/{{responsavel_cpf}}/g, parent.cpf || 'N/A');
    generatedContent = generatedContent.replace(/{{aluno_endereco}}/g, studentAddress);
    generatedContent = generatedContent.replace(/{{escola_nome}}/g, schoolName || 'N/A');
    generatedContent = generatedContent.replace(/{{valor_mensalidade}}/g, `R$ ${student.monthlyFee?.toFixed(2).replace('.', ',') || '0,00'}`);
    generatedContent = generatedContent.replace(/{{turno}}/g, student.shift || 'N/A');
    generatedContent = generatedContent.replace(/{{dia_vencimento}}/g, student.preferredPaymentDay?.toString() || '10');
    generatedContent = generatedContent.replace(/{{data_geracao}}/g, generationDate);
    generatedContent = generatedContent.replace(/{{ano_letivo}}/g, schoolYear);
    generatedContent = generatedContent.replace(/{{banco}}/g, data.banco || 'N/A');
    generatedContent = generatedContent.replace(/{{agencia}}/g, data.agencia || 'N/A');
    generatedContent = generatedContent.replace(/{{conta}}/g, data.conta || 'N/A');
    generatedContent = generatedContent.replace(/{{chave_pix}}/g, data.chavePix || 'N/A');

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
            Gerar Contrato Inteligente
        </DialogTitle>
        <DialogDescription>
          A IA preencherá automaticamente os dados capturados durante o cadastro dos pais.
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
                  <FormControl><SelectTrigger><SelectValue placeholder="Escolha um aluno pendente..." /></SelectTrigger></FormControl>
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

          {selectedStudentData && (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/10 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                      <Sparkles className="h-3 w-3" /> Dados Recuperados do Cadastro
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Mensalidade</p>
                          <p className="text-sm font-black text-foreground">R$ {selectedStudentData.student.monthlyFee?.toFixed(2).replace('.', ',') || '0,00'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Dia Vencimento</p>
                          <p className="text-sm font-black text-foreground">Dia {selectedStudentData.student.preferredPaymentDay || '10'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Escola</p>
                          <p className="text-[10px] font-bold truncate text-foreground">{selectedStudentData.schoolName || 'N/A'}</p>
                      </div>
                      <div className="space-y-1">
                          <p className="text-[9px] text-muted-foreground font-bold uppercase">Turno</p>
                          <p className="text-[10px] font-bold text-foreground">{selectedStudentData.student.shift}</p>
                      </div>
                  </div>
              </div>
          )}

          <FormField
            control={form.control}
            name="templateId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo de Cláusulas</FormLabel>
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
              <AccordionTrigger className="text-xs font-black uppercase text-muted-foreground hover:no-underline py-2">
                  Dados de Recebimento (Opcional)
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 pt-2">
                  <FormField
                    control={form.control}
                    name="banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-muted-foreground">Instituição Bancária</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: NuBank ou Banco do Brasil" {...field} className="h-8 text-xs" />
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
                          <FormLabel className="text-xs text-muted-foreground">Agência</FormLabel>
                          <FormControl><Input placeholder="0001" {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="conta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-xs text-muted-foreground">Conta</FormLabel>
                          <FormControl><Input placeholder="12345-6" {...field} className="h-8 text-xs" /></FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="chavePix"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs text-primary font-bold flex items-center gap-1">
                            <QrCode className="h-3 w-3" /> Chave Pix
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="E-mail, CPF ou Aleatória" {...field} className="h-8 text-xs border-primary/20 bg-primary/5" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <DialogFooter className="pt-4 gap-2">
            <DialogClose asChild><Button type="button" variant="ghost" className="flex-1 text-xs">Cancelar</Button></DialogClose>
            <Button type="submit" className="flex-1 font-bold h-12">GERAR CONTRATO</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
