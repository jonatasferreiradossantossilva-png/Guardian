'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Check, X, Eye, Loader2, UserPlus, Clock, Sparkles, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function PendingRegistrationsPage() {
  const { data: registrations, isLoading } = useMockCollection('pending_registrations', [{ field: 'status', op: '==', value: 'pending_approval' }]);
  const { data: schools } = useMockCollection('schools');
  const { updateDoc, addDoc } = useMockData();
  const { toast } = useToast();

  const [selectedReg, setSelectedReg] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s.name])), [schools]);

  const handleApprove = async (reg: any) => {
    setIsProcessing(true);
    try {
        // 1. Criar o Pai
        const newParentId = `parent-${Date.now()}`;
        addDoc('parents', {
            id: newParentId,
            userId: `user-gen-${Date.now()}`, // No mundo real seria gerado convite de login
            name: reg.parentName,
            email: reg.email,
            phone: reg.phone,
            cpf: reg.documentData?.cpf,
            rg: reg.documentData?.rg,
            active: true
        });

        // 2. Criar o Aluno
        addDoc('students', {
            name: reg.studentName,
            schoolId: reg.schoolId,
            parentId: newParentId,
            shift: 'Manhã', // Padrão
            status: 'aguardando',
            active: true
        });

        // 3. Marcar solicitação como aprovada
        updateDoc('pending_registrations', reg.id, { status: 'approved' });

        toast({ title: "Solicitação Aprovada!", description: "Pai e Aluno foram adicionados aos cadastros oficiais." });
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Novas Solicitações</h1>
          <p className="text-muted-foreground">Cadastros realizados pelos pais via link público, aguardando sua revisão.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Área de Triagem
            </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : registrations && registrations.length > 0 ? (
            <div className="rounded-md border">
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
                        <Button variant="outline" size="sm" onClick={() => setSelectedReg(reg)}>
                          <Eye className="mr-2 h-4 w-4" /> Revisar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/20">
                <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                <p className="font-semibold text-muted-foreground">Tudo limpo por aqui!</p>
                <p className="text-sm text-muted-foreground">Nenhuma nova solicitação aguardando aprovação.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes da Solicitação */}
      <Dialog open={!!selectedReg} onOpenChange={() => setSelectedReg(null)}>
        {selectedReg && (
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Revisar Solicitação de Cadastro</DialogTitle>
                    <DialogDescription>Confira os dados extraídos pela IA antes de aprovar para a frota.</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                    <div className="space-y-4">
                        <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-3">Dados do Responsável</p>
                            <div className="space-y-2">
                                <Detail label="Nome" value={selectedReg.parentName} />
                                <Detail label="CPF" value={selectedReg.documentData?.cpf} />
                                <Detail label="RG" value={selectedReg.documentData?.rg} />
                                <Detail label="E-mail" value={selectedReg.email} />
                                <Detail label="Telefone" value={selectedReg.phone} />
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 bg-muted/50 rounded-lg border">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Dados do Aluno</p>
                            <div className="space-y-2">
                                <Detail label="Nome" value={selectedReg.studentName} />
                                <Detail label="Escola" value={schoolsMap.get(selectedReg.schoolId)} />
                            </div>
                        </div>
                        <Alert variant="destructive" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-[10px]">Verifique se os dados de CPF/RG conferem antes de gerar o contrato.</AlertDescription>
                        </Alert>
                    </div>
                </div>
                <DialogFooter className="gap-2">
                    <Button variant="destructive" onClick={() => handleReject(selectedReg)} disabled={isProcessing}>Recusar Cadastro</Button>
                    <div className="flex-1" />
                    <DialogClose asChild><Button variant="outline">Fechar</Button></DialogClose>
                    <Button onClick={() => handleApprove(selectedReg)} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
                        {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <Check className="mr-2" />}
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
            <p className="text-[10px] text-muted-foreground">{label}</p>
            <p className="text-sm font-medium">{value || 'N/A'}</p>
        </div>
    )
}
