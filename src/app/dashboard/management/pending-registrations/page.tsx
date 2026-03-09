
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Check, X, Eye, Loader2, UserPlus, Clock, Sparkles, AlertTriangle, CheckCircle, School, Phone, Mail, FileText, DollarSign, User, CalendarDays, Users, HeartPulse } from 'lucide-react';
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

    if (!editableParentName.trim()) {
        toast({ title: "Nome ausente", description: "O nome do responsável é obrigatório.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
        const address = reg.address || {};
        
        const parentMatch = existingParents?.find(p => 
            (p.cpf && reg.documentData?.cpf && p.cpf.replace(/\D/g, '') === reg.documentData.cpf.replace(/\D/g, '')) ||
            (p.email.toLowerCase() === reg.email.toLowerCase())
        );

        let parentIdToUse;
        let parentUserIdToUse;

        if (parentMatch) {
            parentIdToUse = parentMatch.id;
            parentUserIdToUse = parentMatch.userId;
            toast({ title: "Responsável reconhecido", description: `Vinculando novo aluno ao cadastro de ${parentMatch.name}.` });
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
                const fullAddress = `${address.street}, ${address.number || ''}, ${address.complement || ''}, ${address.neighborhood || ''}, ${address.city} - ${address.state || ''}`;
                const geoResult = await geocodeAddress({ address: fullAddress });
                latitude = geoResult.latitude;
                longitude = geoResult.longitude;
            } catch (e) {
                console.warn("Geocodificação automática falhou na aprovação:", e);
            }
        }

        const newStudentId = addDoc('students', {
            name: reg.studentName,
            schoolId: reg.schoolId,
            parentId: parentIdToUse, 
            shift: 'Manhã', 
            status: 'aguardando',
            ...address,
            latitude,
            longitude,
            monthlyFee: feeNum,
            preferredPaymentDay: Number(approvedPreferredPaymentDay),
            serie: reg.studentSerie,
            turma: reg.studentTurma,
            medicalConditions: reg.medicalConditions || [],
            medicalNote: reg.medicalNote || '',
            active: true
        });

        // AUTOMAÇÃO: GERAR CONTRATO IMEDIATO COM INTELIGÊNCIA DE PAGAMENTO
        if (defaultTemplate && company) {
            const studentAddress = `${address.street || ''}, ${address.number || ''} - ${address.neighborhood || ''}`;
            const generationDate = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
            const schoolYear = new Date().getFullYear().toString();
            
            // INTELIGÊNCIA DE FRASEADO RECUPERADA
            let paymentPhrase = "";
            const hasBank = !!company.bankName && !!company.bankAgency && !!company.bankAccount;
            const hasPix = !!company.pixKey;

            if (hasBank && hasPix) {
                paymentPhrase = `via: ${company.bankName}, Ag. ${company.bankAgency} / CC ${company.bankAccount} ou Chave Pix: ${company.pixKey}`;
            } else if (hasBank) {
                paymentPhrase = `via: ${company.bankName}, Ag. ${company.bankAgency} / CC ${company.bankAccount}`;
            } else if (hasPix) {
                paymentPhrase = `através da Chave Pix: ${company.pixKey}`;
            } else {
                paymentPhrase = "conforme definido pela contratada";
            }

            let generatedContent = defaultTemplate.content;
            
            // Substituições Inteligentes
            generatedContent = generatedContent.replace(/{{pagamento_info}}/g, paymentPhrase);
            generatedContent = generatedContent.replace(/{{empresa_nome}}/g, company.companyName || 'Guardian Transporte');
            generatedContent = generatedContent.replace(/{{empresa_cnpj}}/g, company.cnpj || 'N/A');
            generatedContent = generatedContent.replace(/{{aluno_nome}}/g, reg.studentName || 'N/A');
            generatedContent = generatedContent.replace(/{{responsavel_nome}}/g, editableParentName || 'N/A');
            generatedContent = generatedContent.replace(/{{responsavel_cpf}}/g, reg.documentData?.cpf || 'N/A');
            generatedContent = generatedContent.replace(/{{aluno_endereco}}/g, studentAddress);
            generatedContent = generatedContent.replace(/{{escola_nome}}/g, schoolsMap.get(reg.schoolId) || 'N/A');
            generatedContent = generatedContent.replace(/{{valor_mensalidade}}/g, `R$ ${feeNum.toFixed(2).replace('.', ',')}`);
            generatedContent = generatedContent.replace(/{{turno}}/g, 'Manhã');
            generatedContent = generatedContent.replace(/{{dia_vencimento}}/g, approvedPreferredPaymentDay);
            generatedContent = generatedContent.replace(/{{data_geracao}}/g, generationDate);
            generatedContent = generatedContent.replace(/{{ano_letivo}}/g, schoolYear);

            addDoc('contracts', {
                templateId: defaultTemplate.id,
                studentId: newStudentId, 
                parentUserId: parentUserIdToUse,
                generatedContent,
                status: 'pending_acceptance',
                createdAt: new Date().toISOString(),
            });
            
            toast({ title: "Contrato Gerado!", description: "O contrato automático já está pronto para o pai." });
        }

        updateDoc('pending_registrations', reg.id, { status: 'approved' });

        toast({ 
            title: "Solicitação Aprovada!", 
            description: `Cadastro de ${reg.studentName} integrado com sucesso.` 
        });
        setSelectedReg(null);
    } catch (e) {
        console.error(e);
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
                        <TableHead>Escola</TableHead>
                        <TableHead>Realizada há</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map((reg) => {
                        const isExisting = existingParents?.some(p => 
                            (p.cpf && reg.documentData?.cpf && p.cpf.replace(/\D/g, '') === reg.documentData.cpf.replace(/\D/g, '')) ||
                            (p.email.toLowerCase() === reg.email.toLowerCase())
                        );
                        const hasAlert = reg.medicalConditions?.length > 0 || reg.medicalNote;

                        return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                {reg.parentName}
                                {isExisting && <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-primary/20"><Users className="h-3 w-3 mr-1"/> Irmão</Badge>}
                              </div>
                          </TableCell>
                          <TableCell>
                              <div className="flex items-center gap-2">
                                {reg.studentName}
                                {hasAlert && <HeartPulse className="h-3 w-3 text-destructive animate-pulse" title="Alerta Médico" />}
                              </div>
                          </TableCell>
                          <TableCell>{schoolsMap.get(reg.schoolId) || 'N/A'}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(reg.createdAt), { addSuffix: true, locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => handleOpenReview(reg)}>
                              <Eye className="mr-2 h-4 w-4" /> Revisar
                            </Button>
                          </TableCell>
                        </TableRow>
                      )})}
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
                      <School className="h-3 w-3" />
                      <span>{schoolsMap.get(reg.schoolId) || 'N/A'}</span>
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
                <p className="font-semibold text-muted-foreground">Tudo limpo por aqui!</p>
                <p className="text-sm text-muted-foreground">Nenhuma nova solicitação aguardando aprovação.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        {selectedReg && (
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden" onOpenAutoFocus={(e) => e.preventDefault()}>
                <DialogHeader className="p-6 pb-2 border-b shrink-0">
                    <DialogTitle>Revisar Cadastro</DialogTitle>
                    <DialogDescription>Confira e ajuste os dados extraídos pela IA antes de aprovar.</DialogDescription>
                </DialogHeader>
                
                <ScrollArea className="flex-1">
                  <div className="px-6 py-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                  <FileText className="h-3 w-3" /> Dados do Responsável
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-muted-foreground uppercase">Nome Completo</Label>
                                        <input 
                                            value={editableParentName} 
                                            onChange={(e) => setEditableParentName(e.target.value)}
                                            className="w-full h-8 bg-background border rounded px-2 text-sm focus:ring-1 focus:ring-primary outline-none"
                                        />
                                    </div>
                                    <Detail label="CPF" value={selectedReg.documentData?.cpf} />
                                    <Detail label="RG" value={selectedReg.documentData?.rg} />
                                    <Detail label="E-mail" value={selectedReg.email} />
                                    <Detail label="Telefone" value={selectedReg.phone} />
                                </div>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                  <MapPinIcon className="h-3 w-3" /> Endereço de Embarque
                                </p>
                                <div className="space-y-3">
                                    <Detail label="Rua" value={`${selectedReg.address?.street}, ${selectedReg.address?.number}`} />
                                    {selectedReg.address?.complement && <Detail label="Complemento" value={selectedReg.address.complement} />}
                                    <Detail label="Bairro/Cidade" value={`${selectedReg.address?.neighborhood} - ${selectedReg.address?.city}`} />
                                    <Detail label="CEP" value={selectedReg.address?.zipCode} />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/50 rounded-lg border">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Dados do Aluno</p>
                                <div className="space-y-3">
                                    <Detail label="Nome" value={selectedReg.studentName} />
                                    <Detail label="Escola" value={schoolsMap.get(selectedReg.schoolId)} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Detail label="Série" value={selectedReg.studentSerie} />
                                        <Detail label="Turma" value={selectedReg.studentTurma} />
                                    </div>
                                </div>
                            </div>

                            {(selectedReg.medicalConditions?.length > 0 || selectedReg.medicalNote) && (
                                <div className="p-4 bg-destructive/5 rounded-lg border border-destructive/20">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-destructive mb-3 flex items-center gap-2">
                                        <HeartPulse className="h-3 w-3" /> Alertas de Saúde (Pai Informou)
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {selectedReg.medicalConditions?.map((c: string) => (
                                                <Badge key={c} variant="outline" className="text-[9px] border-destructive/30 text-destructive">{c}</Badge>
                                            ))}
                                        </div>
                                        {selectedReg.medicalNote && (
                                            <p className="text-xs italic text-muted-foreground bg-background p-2 rounded border border-dashed">
                                                "{selectedReg.medicalNote}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="text-[10px] font-black uppercase text-primary mb-3 flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" /> Configuração Financeira (Contrato)
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="rev-fee" className="text-xs">Valor da Mensalidade (R$)</Label>
                                        <Input 
                                            id="rev-fee"
                                            type="number" 
                                            placeholder="Ex: 450,00"
                                            value={approvedMonthlyFee} 
                                            onChange={(e) => setApprovedMonthlyFee(e.target.value)}
                                            className={cn(
                                                "bg-background font-bold text-lg",
                                                (!approvedMonthlyFee || Number(approvedMonthlyFee) <= 0) && "border-destructive ring-destructive/20"
                                            )}
                                        />
                                        {(!approvedMonthlyFee || Number(approvedMonthlyFee) <= 0) && (
                                            <p className="text-[9px] text-destructive font-bold uppercase">Preenchimento Obrigatório</p>
                                        )}
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rev-day" className="text-xs">Dia Preferencial de Vencimento</Label>
                                        <Select onValueChange={setApprovedPreferredPaymentDay} value={approvedPreferredPaymentDay}>
                                            <SelectTrigger id="rev-day" className="bg-background"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>Dia {day}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <p className="text-[10px] text-muted-foreground italic">O pai sugeriu o dia {selectedReg.preferredPaymentDay || '10'}.</p>
                                    </div>
                                </div>
                            </div>

                            <Alert variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20 py-2">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-[10px]">A aprovação irá sincronizar endereços, buscar localização GPS e GERAR O CONTRATO AUTOMATICAMENTE.</AlertDescription>
                            </Alert>
                        </div>
                    </div>
                  </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t gap-2 flex-col sm:flex-row shrink-0 bg-background">
                    <Button variant="destructive" onClick={() => handleReject(selectedReg)} disabled={isProcessing} className="w-full sm:flex-none">Recusar</Button>
                    <div className="flex-1" />
                    <DialogClose asChild><Button variant="outline" className="w-full sm:flex-none">Fechar</Button></DialogClose>
                    <Button onClick={() => handleApprove(selectedReg)} disabled={isProcessing} className="bg-green-600 hover:bg-green-700 w-full sm:flex-none">
                        {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Check className="mr-2 h-4 w-4" />}
                        Aprovar e Integrar
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

function MapPinIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
      </svg>
    )
  }
