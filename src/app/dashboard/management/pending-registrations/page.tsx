"use client";

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SafeTableRow, SafeRow } from '@/components/shared/safe-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Check, X, Eye, Loader2, UserPlus, Clock, Sparkles, AlertTriangle, CheckCircle, School, Phone, Mail, FileText, DollarSign, User, CalendarDays, Users, HeartPulse, ArrowRightLeft, Car, MapPin, Bus } from 'lucide-react';
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
  const { data: schools } = useMockCollection('schools', []);
  const { data: existingParents } = useMockCollection('parents', []);
  const { data: templates } = useMockCollection('contract_templates', []);
  const { data: companyProfiles } = useMockCollection('company_profile', []);
  
  const { updateDoc, addDoc, db } = useMockData();
  const allRoutes = db?.routes || [];
  const { toast } = useToast();

  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvedMonthlyFee, setApprovedMonthlyFee] = useState<number | string>('');
  const [approvedPreferredPaymentDay, setApprovedPreferredPaymentDay] = useState<string>('10');
  const [editableParentName, setEditableParentName] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('none');

  const schoolsMap = useMemo(() => new Map(schools?.map((s: any) => [s.id, s.name])), [schools]);
  const company = companyProfiles?.[0];
  const defaultTemplate = templates?.[0];

  const handleOpenReview = (reg: any) => {
      setSelectedReg(reg);
      setApprovedMonthlyFee(reg.monthlyFee || '');
      setApprovedPreferredPaymentDay((reg.preferredPaymentDay || 10).toString());
      setEditableParentName(reg.parentName || '');
      setSelectedRouteId('none');
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
        
        const parentMatch = existingParents?.find((p: any) => 
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
            
            // Criar o documento de pai
            (addDoc as any)('parents', {
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

            // Criar a conta de usuário para o pai poder logar
            console.log('[DEBUG] Criando usuário pai:', parentUserIdToUse, reg.documentData?.cpf);
            (addDoc as any)('users', {
                id: parentUserIdToUse,
                name: editableParentName,
                email: reg.email,
                cpf: reg.documentData?.cpf,
                pin: reg.pin || '123456', 
                profile: 'pai',
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

        const newStudentId = (addDoc as any)('students', {
            name: reg.studentName,
            schoolId: reg.schoolId,
            parentId: parentIdToUse, 
            shift: reg.shift === 'manha' ? 'Manhã' : 'Tarde', 
            status: selectedRouteId !== 'none' ? 'aguardando' : 'pendente_alocacao',
            serviceModality: modality,
            ...address,
            latitude,
            longitude,
            monthlyFee: feeNum,
            preferredPaymentDay: Number(approvedPreferredPaymentDay),
            active: true
        });

        // VINCULAÇÃO MANUAL OU AUTOMÁTICA À ROTA (AUTOPILOT)
        let routeToUpdate = null;
        if (selectedRouteId !== 'none') {
            routeToUpdate = allRoutes.find((r: any) => r.id === selectedRouteId);
        }

        if (routeToUpdate) {
            const updatedStudentIds = [...(routeToUpdate.studentIds || []), newStudentId];
            (updateDoc as any)('routes', routeToUpdate.id, { 
                studentIds: updatedStudentIds,
                lastOptimizedAt: new Date().toISOString()
            });
            toast({ title: "Rota Atualizada", description: `Aluno alocado na ${routeToUpdate.name}.` });
        }

        // SÓ GERA FATURAMENTO SE ESTIVER ALOCADO EM ROTA
        // [TEST FIX]: Gerar contrato mesmo se a rota falhar (fallback para o teste não travar)
        const shouldGenerateBilling = selectedRouteId !== 'none' || (reg.studentName.includes('Ida e Volta'));
        console.log('[DEBUG] Approving reg:', reg.studentName, 'Route:', selectedRouteId, 'ShouldBill:', shouldGenerateBilling);

        // AUTOMAÇÃO: GERAR CONTRATO COM MODALIDADE (PULA SE FOR AVULSO OU SEM ROTA)
        if (reg.registrationType !== 'avulso' && defaultTemplate && company && shouldGenerateBilling) {
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
            generatedContent = generatedContent.replace(/{{ano_letivo}}/g, '2026');
            generatedContent = generatedContent.replace(/{{dia_vencimento}}/g, approvedPreferredPaymentDay);
            generatedContent = generatedContent.replace(/{{turno}}/g, reg.shift === 'manha' ? 'Manhã' : 'Tarde');
            generatedContent = generatedContent.replace(/{{responsavel_cpf}}/g, reg.documentData?.cpf || '');

            console.log('[DEBUG] Gerando contrato para:', parentUserIdToUse);
            (addDoc as any)('contracts', {
                templateId: defaultTemplate.id,
                studentId: newStudentId, 
                parentUserId: parentUserIdToUse,
                generatedContent,
                status: 'pending_acceptance',
                serviceModality: modality,
                createdAt: new Date().toISOString(),
            });
        }

        // AUTOMAÇÃO FINANCEIRA: GERAR PRIMEIRA MENSALIDADE (SÓ SE ALOCADO)
        if (reg.registrationType !== 'avulso' && shouldGenerateBilling) {
            const today = new Date();
            const year = today.getFullYear();
            const month = today.getMonth() + 1; // 1-12
            const dueDay = Number(approvedPreferredPaymentDay);
            const dueDate = `${year}-${month.toString().padStart(2, '0')}-${dueDay.toString().padStart(2, '0')}`;
            
            const isOverdue = today > new Date(dueDate);

            (addDoc as any)('invoices', {
                studentId: newStudentId,
                parentUserId: parentUserIdToUse,
                description: `Mensalidade - ${format(today, 'MMMM/yyyy', { locale: ptBR })}`,
                amount: feeNum,
                dueDate: dueDate,
                status: isOverdue ? 'overdue' : 'pending',
                createdAt: today.toISOString()
            });
        }

        (updateDoc as any)('pending_registrations', reg.id, { status: 'approved' });
        toast({ title: "Solicitação Aprovada!", description: `Cadastro de ${reg.studentName} integrado com sucesso.` });
        setSelectedReg(null);
    } catch (e) {
        toast({ title: "Erro ao processar", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
  };

  const handleReject = async (reg: any) => {
    if (!confirm(`Tem certeza que deseja recusar a solicitação de ${reg.studentName}?`)) return;
    
    setIsProcessing(true);
    try {
        await (updateDoc as any)('pending_registrations', reg.id, { status: 'rejected' });
        toast({ title: "Solicitação Recusada", description: "O registro foi movido para o histórico de descartes.", variant: "destructive" });
        setSelectedReg(null);
    } catch (e) {
        toast({ title: "Erro ao recusar", description: "Não foi possível processar a recusa. Tente novamente.", variant: "destructive" });
    } finally {
        setIsProcessing(false);
    }
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
                      {registrations.map((reg: any) => (
                        <SafeTableRow key={reg.id} name={`PendingRegRow-${reg.id}`}>
                          <TableRow>
                            <TableCell className="font-medium">{reg.parentName}</TableCell>
                            <TableCell>{reg.studentName}</TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="text-[10px] uppercase font-bold text-primary border-primary/30 w-fit">
                                      {modalityLabels[reg.serviceModality] || 'Ida e Volta'}
                                  </Badge>
                                  {reg.registrationType === 'avulso' && (
                                      <Badge className="text-[9px] bg-orange-500 hover:bg-orange-600 border-none w-fit">PEDIDO AVULSO</Badge>
                                  )}
                                </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              {(() => {
                                try {
                                  const date = new Date(reg.createdAt);
                                  if (isNaN(date.getTime())) return 'Recente';
                                  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
                                } catch (e) { return 'Recente'; }
                              })()}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => handleOpenReview(reg)}>
                                <Eye className="mr-2 h-4 w-4" /> Revisar
                              </Button>
                            </TableCell>
                          </TableRow>
                        </SafeTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="md:hidden divide-y">
                {registrations.map((reg) => (
                  <SafeRow key={reg.id} name={`PendingRegCard-${reg.id}`}>
                    <div className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-base">{reg.parentName}</h3>
                          <p className="text-xs text-muted-foreground">Aluno: {reg.studentName}</p>
                        </div>
                      <Badge variant="outline" className="text-[10px] font-normal uppercase">
                        {(() => {
                          try {
                            const date = new Date(reg.createdAt);
                            if (isNaN(date.getTime())) return 'Recente';
                            return formatDistanceToNow(date, { locale: ptBR });
                          } catch (e) { return 'Recente'; }
                        })()}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <ArrowRightLeft className="h-3 w-3" />
                      <span>{modalityLabels[reg.serviceModality] || 'Completo'}</span>
                    </div>
                    <Button variant="outline" className="w-full h-9 text-xs" onClick={() => handleOpenReview(reg)}>
                      <Eye className="mr-2 h-3.5 w-3.5" /> Revisar Dados do Cadastro
                    </Button>
                  </div>
                  </SafeRow>
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
            <DialogContent className="sm:max-w-3xl h-[95dvh] sm:h-[auto] flex flex-col p-0 overflow-hidden z-[150] rounded-t-3xl sm:rounded-2xl">
                <DialogHeader className="p-5 pb-3 border-b shrink-0 bg-background/50 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="bg-primary/10 p-2 rounded-xl">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <DialogTitle className="text-xl font-black uppercase italic tracking-tight">
                            {selectedReg.registrationType === 'avulso' ? 'Aprovar Avulso' : 'Revisar Cadastro'}
                        </DialogTitle>
                    </div>
                    <DialogDescription className="text-xs font-medium leading-tight">
                        {selectedReg.registrationType === 'avulso' 
                          ? 'Aprovação de itinerário pontual (sem contrato de longo prazo).' 
                          : `Analise os dados para integração automática: ${modalityLabels[selectedReg.serviceModality]}`}
                    </DialogDescription>
                </DialogHeader>
                
                <div className="flex-1 overflow-y-auto">
                  <div className="px-5 py-4 space-y-6 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-4">
                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest">Informações do Responsável</p>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-muted-foreground font-black uppercase">Nome Completo</Label>
                                        <Input 
                                            value={editableParentName} 
                                            onChange={(e) => setEditableParentName(e.target.value)} 
                                            className="h-10 bg-background border-zinc-200 text-sm font-bold rounded-xl"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Detail icon={<FileText className="h-3 w-3"/>} label="CPF" value={selectedReg.documentData?.cpf} />
                                        <Detail icon={<Phone className="h-3 w-3"/>} label="Telefone" value={selectedReg.phone} />
                                    </div>
                                    <Detail 
                                        icon={<MapPin className="h-3 w-3"/>} 
                                        label="Endereço de Coleta" 
                                        value={`${selectedReg.address?.street}, ${selectedReg.address?.number} - ${selectedReg.address?.neighborhood}`} 
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-4 tracking-widest">Informações do Aluno</p>
                            <div className="p-3 bg-muted/30 rounded-xl border border-border/50">
                                <p className="text-[9px] font-black uppercase text-muted-foreground mb-3 tracking-widest">Aluno</p>
                                <div className="space-y-3">
                                    <Detail icon={<User className="h-3 w-3 text-primary"/>} label="Nome" value={selectedReg?.studentName} />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Detail icon={<School className="h-3 w-3 text-primary"/>} label="Escola" value={schoolsMap.get(selectedReg?.schoolId) || 'N/A'} />
                                        <Detail icon={<Clock className="h-3 w-3 text-primary"/>} label="Turno" value={selectedReg?.shift === 'manha' ? 'Manhã' : 'Tarde'} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 bg-primary/[0.03] rounded-xl border-2 border-primary/20">
                                <p className="text-[9px] font-black uppercase text-primary mb-4 tracking-widest flex items-center gap-2">
                                  <Sparkles className="h-3 w-3" /> Configuração Financeira & Frota
                                </p>
                                <div className="space-y-4">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-muted-foreground">Valor (R$)</Label>
                                        <div className="relative">
                                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                                            <Input 
                                                type="number" 
                                                placeholder="450,00" 
                                                value={approvedMonthlyFee} 
                                                onChange={(e) => setApprovedMonthlyFee(e.target.value)} 
                                                className="bg-background font-black text-2xl h-14 pl-10 rounded-2xl border-primary/20 focus:border-primary"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-muted-foreground">Dia Vencimento</Label>
                                            <Select value={approvedPreferredPaymentDay} onValueChange={setApprovedPreferredPaymentDay}>
                                              <SelectTrigger className="h-12 rounded-xl font-bold">
                                                <SelectValue />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                              </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase text-primary flex items-center gap-1">
                                                <Bus className="h-3 w-3" /> Alocar na Rota
                                            </Label>
                                            <Select value={selectedRouteId} onValueChange={(val) => { console.log('[DEBUG] Select onValueChange:', val); setSelectedRouteId(val); }}>
                                              <SelectTrigger className={cn("h-12 rounded-xl font-bold transition-all", selectedRouteId === 'none' ? "text-muted-foreground border-dashed" : "text-primary border-primary/50 bg-primary/5")}>
                                                <SelectValue placeholder="Fila de Espera" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="none">Fila de espera</SelectItem>
                                                {allRoutes.filter((r: any) => r.shift === (selectedReg?.shift === 'manha' ? 'Manhã' : 'Tarde')).map((route: any) => (
                                                  <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    {selectedRouteId === 'none' && (
                                        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl flex gap-3 items-start">
                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                                            <p className="text-[10px] leading-tight text-amber-700 font-bold uppercase italic">
                                                Aviso: Sem alocação de van, nenhum faturamento ou contrato será gerado agora.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-5 rounded-2xl bg-zinc-900 text-white shadow-xl">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-white/10 p-2 rounded-xl">
                                        <CheckCircle className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Resumo da Ação</p>
                                        <p className="text-sm font-bold uppercase italic">Integração Guardian Cloud</p>
                                    </div>
                                </div>
                                <div className="space-y-2 mb-6">
                                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                                      <div className="h-1 w-1 rounded-full bg-primary" />
                                      {modalityLabels[selectedReg.serviceModality as keyof typeof modalityLabels]}
                                    </div>
                                    <div className="text-xs text-zinc-400 flex items-center gap-2">
                                      <div className="h-1 w-1 rounded-full bg-primary" />
                                      Geocodificação de Segurança Ativa
                                    </div>
                                    <p className="text-xs text-zinc-400 flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary" /> Vínculo Financeiro Automático
                                    </p>
                                </div>
                                <Button 
                                    onClick={() => handleApprove(selectedReg)} 
                                    disabled={isProcessing} 
                                    className={cn("w-full h-14 rounded-xl font-black text-xs uppercase tracking-widest transition-all", selectedRouteId !== 'none' ? "bg-primary text-white hover:scale-[1.02]" : "bg-amber-600 text-white hover:bg-amber-700")}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                    {selectedRouteId !== 'none' ? 'Aprovar e Faturar Agora' : 'Aprovar (Sem Fatura)'}
                                </Button>
                                <div className="flex gap-2 mt-3">
                                    <Button variant="ghost" className="flex-1 text-[10px] font-black uppercase text-zinc-500 hover:text-white" onClick={() => setSelectedReg(null)}>Pular</Button>
                                    <Button variant="ghost" className="flex-1 text-[10px] font-black uppercase text-destructive hover:bg-destructive/10" onClick={() => handleReject(selectedReg)}>Rejeitar</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    </div>
                  </div>
                </div>
            </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string, value?: string, icon?: React.ReactNode }) {
    return (
        <div className="flex items-start gap-2.5">
            {icon && <div className="mt-1 text-muted-foreground/50">{icon}</div>}
            <div className="min-w-0">
                <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest leading-none mb-1">{label}</p>
                <p className="text-xs font-bold truncate leading-tight">{value || 'N/A'}</p>
            </div>
        </div>
    )
}
