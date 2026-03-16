"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Check, X, Eye, Loader2, UserPlus, Clock, Sparkles, AlertTriangle, CheckCircle, School, Phone, Mail, FileText, DollarSign, User, CalendarDays, Users, HeartPulse, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PAYMENT_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

const modalityLabels: Record<string, string> = {
    'completo': 'Ida e Volta',
    'so_ida': 'Somente Ida',
    'so_volta': 'Somente Volta'
};

const modalityContractPhrase: Record<string, string> = {
    'completo': 'residência/escola/residência',
    'so_ida': 'exclusivamente da residência para a escola',
    'so_volta': 'exclusivamente da escola para a residência'
};

export default function PendingRegistrationsPage() {
  const { data: registrations, isLoading } = useMockCollection('pending_registrations', [{ field: 'status', op: '==', value: 'pending_approval' }]);
  const { data: schools } = useMockCollection('schools');
  const { data: existingParents } = useMockCollection('parents');
  const { data: templates } = useMockCollection('contract_templates');
  const { data: companyProfiles } = useMockCollection('company_profile');
  
  const { updateDoc, addDoc } = useMockData();
  const { toast } = useToast();

  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvedMonthlyFee, setApprovedMonthlyFee] = useState<number | string>('');
  const [approvedPreferredPaymentDay, setApprovedPreferredPaymentDay] = useState<string>('10');
  const [editableParentName, setEditableParentName] = useState('');

  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);
  const company = companyProfiles?.[0];
  const defaultTemplate = templates?.[0];

  const handleOpenReview = (reg: any) => {
      setSelectedReg(reg);
      setApprovedMonthlyFee(reg.monthlyFee || '');
      setApprovedPreferredPaymentDay((reg.preferredPaymentDay || 10).toString());
      setEditableParentName(reg.parentName || '');
  };

  const handleApprove = async (reg: any) => {
    const feeNum = Number(approvedMonthlyFee);
    
    if (!approvedMonthlyFee || feeNum <= 0) {
        toast({ 
            title: "Valor Obrigatório", 
            description: "Por favor, defina o valor da mensalidade para prosseguir com a aprovação.", 
            variant: "destructive" 
        });
        return;
    }

    setIsProcessing(true);
    try {
        const address = reg.address || {};
        const modality = reg.serviceModality || 'completo';
        
        const parentMatch = existingParents?.find(p => 
            (p.cpf && reg.documentData?.cpf && p.cpf.replace(/\D/g, '') === reg.documentData.cpf.replace(/\D/g, '')) ||
            (p.email.toLowerCase() === reg.email.toLowerCase())
        );

        let parentIdToUse;
        let parentUserIdToUse;

        if (parentMatch) {
            parentIdToUse = parentMatch.id;
            parentUserIdToUse = parentMatch.userId;
        } else {
            const newParentId = `parent-${Date.now()}`;
            parentUserIdToUse = reg.userId || `user-gen-${Date.now()}`;
            addDoc('parents', {
                id: newParentId,
                userId: parentUserIdToUse, 
                name: editableParentName,
                email: reg.email,
                phone: reg.phone,
                cpf: reg.documentData?.cpf,
                rg: reg.documentData?.rg,
                ...address,
                active: true
            });
            parentIdToUse = newParentId;
        }

        let latitude = 0;
        let longitude = 0;
        if (address.street && address.city) {
            try {
                const fullAddress = `${address.street}, ${address.number || ''}, ${address.neighborhood || ''}, ${address.city} - ${address.state || ''}`;
                const geoResult = await geocodeAddress({ address: fullAddress });
                latitude = geoResult.latitude;
                longitude = geoResult.longitude;
            } catch (e) { console.warn(e); }
        }

        const newStudentId = addDoc('students', {
            name: reg.studentName,
            schoolId: reg.schoolId,
            parentId: parentIdToUse, 
            shift: 'Manhã', 
            status: 'aguardando',
            serviceModality: modality,
            ...address,
            latitude,
            longitude,
            monthlyFee: feeNum,
            preferredPaymentDay: Number(approvedPreferredPaymentDay),
            active: true
        });

        // AUTOMAÇÃO: GERAR CONTRATO COM MODALIDADE
        if (defaultTemplate && company) {
            const studentAddress = `${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}`;
            const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            
            let paymentPhrase = company.pixKey ? `através da Chave Pix: ${company.pixKey}` : "conforme definido pela contratada";
            let generatedContent = defaultTemplate.content;
            
            generatedContent = generatedContent.replace(/{{modalidade_servico}}/g, modalityLabels[modality]);
            generatedContent = generatedContent.replace(/residência\/escola\/residência/g, modalityContractPhrase[modality]);
            generatedContent = generatedContent.replace(/{{pagamento_info}}/g, paymentPhrase);
            generatedContent = generatedContent.replace(/{{empresa_nome}}/g, company.companyName);
            generatedContent = generatedContent.replace(/{{empresa_cnpj}}/g, company.cnpj);
            generatedContent = generatedContent.replace(/{{aluno_nome}}/g, reg.studentName);
            generatedContent = generatedContent.replace(/{{responsavel_nome}}/g, editableParentName);
            generatedContent = generatedContent.replace(/{{aluno_endereco}}/g, studentAddress);
            generatedContent = generatedContent.replace(/{{escola_nome}}/g, schoolsMap.get(reg.schoolId) || 'N/A');
            generatedContent = generatedContent.replace(/{{valor_mensalidade}}/g, `R$ ${feeNum.toFixed(2).replace('.', ',')}`);
            generatedContent = generatedContent.replace(/{{data_geracao}}/g, generationDate);

            addDoc('contracts', {
                templateId: defaultTemplate.id,
                studentId: newStudentId, 
                parentUserId: parentUserIdToUse,
                generatedContent,
                status: 'pending_acceptance',
                serviceModality: modality,
                createdAt: new Date().toISOString(),
            });
        }

        updateDoc('pending_registrations', reg.id, { status: 'approved' });
        toast({ title: "Solicitação Aprovada!", description: `Cadastro de ${reg.studentName} integrado com sucesso.` });
        setSelectedReg(null);
    } catch (e) {
        toast({ title: "Erro ao processar", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReject = (reg: any) => {
    updateDoc('pending_registrations', reg.id, { status: 'rejected' });
    toast({ title: "Solicitação Recusada", variant: "destructive" });
    setSelectedReg(null);
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novas Solicitações</h1>
          <p className="text-muted-foreground">Cadastros realizados pelos pais via link público.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Área de Triagem
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : registrations && registrations.length > 0 ? (
            <>
              <div className="hidden md:block">
                <div className="rounded-md border mx-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Responsável</TableHead>
                        <TableHead>Aluno</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Realizada há</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.parentName}</TableCell>
                          <TableCell>{reg.studentName}</TableCell>
                          <TableCell>
                              <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30">
                                {modalityLabels[reg.serviceModality] || 'Ida e Volta'}
                              </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true, locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenReview(reg)}>
                              <Eye className="mr-2 h-4 w-4" /> Revisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="md:hidden divide-y">
                {registrations.map((reg) => (
                  <div key={reg.id} className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-base">{reg.parentName}</h3>
                        <p className="text-xs text-muted-foreground">Aluno: {reg.studentName}</p>
                      </div>
                      <Badge variant="outline" className="text-[10px] font-normal uppercase">
                        {formatDistanceToNow(new Date(reg.createdAt), { locale: ptBR })}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>{modalityLabels[reg.serviceModality] || 'Completo'}</span>
                    </div>
                    <Button variant="outline" className="w-full h-9 text-xs" onClick={() => handleOpenReview(reg)}>
                      <Eye className="mr-2 h-3.5 w-3.5" /> Revisar Dados da IA
                    </Button>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/20 m-4 sm:m-0">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="font-semibold text-muted-foreground">Tudo limpo!</p>
                <p className="text-sm text-muted-foreground">Sem solicitações aguardando.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        {selectedReg && (
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2 border-b shrink-0">
                    <DialogTitle>Revisar Cadastro</DialogTitle>
                    <DialogDescription>Dados da modalidade contratada: <strong>{modalityLabels[selectedReg.serviceModality]}</strong></DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1">
                  <div className="px-6 py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[10px] font-bold uppercase text-primary mb-3">Dados do Responsável</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-muted-foreground">Nome Completo</Label>
                                        <input value={editableParentName} onChange={(e) => setEditableParentName(e.target.value)} className="w-full h-8 bg-background border rounded px-2 text-sm"/>
                                    </div>
                                    <Detail label="CPF" value={selectedReg.documentData?.cpf} />
                                    <Detail label="Telefone" value={selectedReg.phone} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" /> Configuração do Contrato
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs">Valor da Mensalidade (R$)</Label>
                                        <Input type="number" placeholder="450,00" value={approvedMonthlyFee} onChange={(e) => setApprovedMonthlyFee(e.target.value)} className="bg-background font-bold text-lg"/>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs">Dia de Vencimento</Label>
                                        <Select onValueChange={setApprovedPreferredPaymentDay} value={approvedPreferredPaymentDay}>
                                            <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>{PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>Dia {day}</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t gap-2 bg-background">
                    <Button variant="destructive" onClick={() => handleReject(selectedReg)} disabled={isProcessing}>Recusar</Button>
                    <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                    <Button onClick={() => handleApprove(selectedReg)} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                        {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                        Aprovar e Gerar Contrato
                    </Button>
                </DialogFooter>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Detail({ label, value }: { label: string, value?: string }) {
    return (
        <div>
            <p className="text-[10px] text-muted-foreground font-bold uppercase">{label}</p>
            <p className="text-sm font-medium">{value || 'N/A'}</p>
        </div>
    )
}
