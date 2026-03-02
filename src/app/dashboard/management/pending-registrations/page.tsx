'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Check, X, Eye, Loader2, UserPlus, Clock, Sparkles, AlertTriangle, CheckCircle, School, Phone, Mail, FileText, DollarSign, User, CalendarDays } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { geocodeAddress } from '@/ai/flows/geocode-address';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PendingRegistrationsPage() {
  const { data: registrations, isLoading } = useMockCollection('pending_registrations', [{ field: 'status', op: '==', value: 'pending_approval' }]);
  const { data: schools } = useMockCollection('schools');
  const { updateDoc, addDoc } = useMockData();
  const { toast } = useToast();

  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvedMonthlyFee, setApprovedMonthlyFee] = useState<number>(450);
  const [editableParentName, setEditableParentName] = useState('');

  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);

  const handleOpenReview = (reg: any) => {
      setSelectedReg(reg);
      setApprovedMonthlyFee(reg.monthlyFee || 450);
      setEditableParentName(reg.parentName || '');
  };

  const handleApprove = async (reg: any) => {
    if (!approvedMonthlyFee || approvedMonthlyFee <= 0) {
        toast({ title: "Valor inválido", description: "Por favor, defina o valor da mensalidade.", variant: "destructive" });
        return;
    }

    if (!editableParentName.trim()) {
        toast({ title: "Nome ausente", description: "O nome do responsável é obrigatório.", variant: "destructive" });
        return;
    }

    setIsProcessing(true);
    try {
        const address = reg.address || {};
        
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

        // Criamos um ID fixo para garantir o vínculo correto entre Pai e Aluno no banco mockado
        const newParentId = `parent-${Date.now()}`;
        
        addDoc('parents', {
            id: newParentId,
            userId: reg.userId || `user-gen-${Date.now()}`, 
            name: editableParentName,
            email: reg.email,
            phone: reg.phone,
            cpf: reg.documentData?.cpf,
            rg: reg.documentData?.rg,
            preferredPaymentDay: reg.preferredPaymentDay || 10, // Integração Automática do Dia Preferencial
            ...address,
            active: true
        });

        addDoc('students', {
            name: reg.studentName,
            schoolId: reg.schoolId,
            parentId: newParentId, 
            shift: 'Manhã', 
            status: 'aguardando',
            ...address,
            latitude,
            longitude,
            monthlyFee: Number(approvedMonthlyFee),
            serie: reg.studentSerie,
            turma: reg.studentTurma,
            active: true
        });

        updateDoc('pending_registrations', reg.id, { status: 'approved' });

        toast({ 
            title: "Solicitação Aprovada!", 
            description: `Responsável (${editableParentName}) e Aluno integrados com sucesso.` 
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
                      {registrations.map((reg) => (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{reg.parentName}</TableCell>
                          <TableCell>{reg.studentName}</TableCell>
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
            <DialogContent className="sm:max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden">
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
                                    <div className="flex items-center gap-2 pt-1">
                                        <CalendarDays className="h-3 w-3 text-primary" />
                                        <Detail label="Dia Preferencial" value={`Dia ${selectedReg.preferredPaymentDay || '10'}`} />
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 bg-muted/20 rounded-lg border border-dashed">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                                  <MapPinIcon className="h-3 w-3" /> Endereço de Coleta
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

                            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3 flex items-center gap-2">
                                  <DollarSign className="h-3 w-3" /> Configuração Financeira
                                </p>
                                <div className="space-y-2">
                                    <Label htmlFor="rev-fee" className="text-xs">Valor da Mensalidade (R$)</Label>
                                    <Input 
                                        id="rev-fee"
                                        type="number" 
                                        value={approvedMonthlyFee} 
                                        onChange={(e) => setApprovedMonthlyFee(Number(e.target.value))}
                                        className="bg-background font-bold text-lg"
                                    />
                                    <p className="text-[10px] text-muted-foreground italic">Este valor será usado para gerar as faturas automáticas.</p>
                                </div>
                            </div>

                            <Alert variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="text-[10px]">A aprovação irá sincronizar endereços e buscar a localização GPS automaticamente.</AlertDescription>
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
