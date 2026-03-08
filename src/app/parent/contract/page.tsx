
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, CheckCircle, Printer, MessageCircle } from 'lucide-react';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Contract = {
  id: string;
  generatedContent: string;
  status: 'pending_acceptance' | 'accepted';
  acceptedAt?: string;
  createdAt: string;
  parentUserId: string;
  studentId: string;
};

export default function ParentContractPage() {
    const { toast } = useToast();
    const [mockUserId, setMockUserId] = useState<string | null>(null);
    const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
    
    useEffect(() => {
        const storedUserId = sessionStorage.getItem('mockUserId');
        setMockUserId(storedUserId);
        
        const lastSelectedId = sessionStorage.getItem('selectedStudentId');
        setSelectedStudentId(lastSelectedId);
    }, []);

    const { data: contracts, isLoading: areContractsLoading } = useMockCollection('contracts', mockUserId ? [{ field: 'parentUserId', op: '==', value: mockUserId }] : undefined);
    
    const contract = useMemo(() => {
        if (!contracts || contracts.length === 0) return null;
        if (!selectedStudentId) return contracts[0];
        return contracts.find(c => c.studentId === selectedStudentId) || contracts[0];
    }, [contracts, selectedStudentId]);

    const { data: students, isLoading: areStudentsLoading } = useMockCollection('students', contract ? [{ field: 'id', op: '==', value: contract.studentId }] : undefined);
    const student = useMemo(() => students?.[0], [students]);

    const { updateDoc } = useMockData();
    const [hasAgreed, setHasAgreed] = useState(false);

    const handleAcceptContract = () => {
        if (!contract) return;
        updateDoc('contracts', contract.id, {
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
        });
        toast({
            title: 'Contrato Aceito!',
            description: `Obrigado! Seu aceite para o transporte de ${student?.name} foi registrado.`,
        });
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        if (!contract) return;
        
        const statusMsg = contract.status === 'accepted' ? 'assinado digitalmente' : 'para análise';
        const message = `Olá! Segue o meu contrato de transporte para o aluno ${student?.name} (${statusMsg}) via Plataforma Guardian:\n\n${window.location.origin}/parent/contract`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        
        window.open(whatsappUrl, '_blank');
        toast({
            title: 'Contrato Compartilhado',
            description: 'O link do documento foi enviado via WhatsApp.',
        });
    };

    const isLoading = areContractsLoading || areStudentsLoading;

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4 print:bg-white print:p-0">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-4 mb-6 print:hidden">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/parent/tracking"><ArrowLeft /></Link>
                    </Button>
                    {contract && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleShare} className="gap-2 border-primary/30 text-primary">
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">Compartilhar Assinado</span>
                                <span className="sm:hidden">Enviar</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                                <Printer className="h-4 w-4" />
                                <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
                                <span className="sm:hidden">PDF</span>
                            </Button>
                        </div>
                    )}
                </div>

                {!contract ? (
                    <Card className="text-center p-8 print:hidden">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle>Nenhum contrato encontrado</CardTitle>
                        <CardDescription className="mt-2">
                            Ainda não há um contrato de prestação de serviços disponível para {student?.name || 'este aluno'}.
                        </CardDescription>
                    </Card>
                ) : (
                    <Card className="print:border-none print:shadow-none shadow-xl border-2">
                        <CardHeader className="print:px-0 bg-muted/5 border-b mb-6">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><FileText className="text-primary"/>Contrato de Transporte</CardTitle>
                                    <CardDescription className="mt-2 text-primary font-bold uppercase text-xs print:text-black">
                                        Aluno(a): {student?.name}
                                    </CardDescription>
                                    <CardDescription className="print:text-black/60 text-[10px] uppercase font-bold">
                                        Gerado em: {format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </div>
                                {contract.status === 'accepted' && contract.acceptedAt && (
                                     <div className="text-sm p-3 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800 print:bg-white print:border-black print:text-black">
                                        <p className="font-bold flex items-center gap-2 uppercase text-[10px]"><CheckCircle className="h-4 w-4"/>Contrato Aceito</p>
                                        <p className="text-xs">Em: {format(new Date(contract.acceptedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="print:px-0">
                            <ScrollArea className="h-[50vh] border rounded-md p-6 bg-secondary/10 print:h-auto print:border-none print:bg-transparent print:p-0 print:overflow-visible">
                                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed print:text-black print:text-base italic text-foreground/90">{contract.generatedContent}</pre>
                            </ScrollArea>
                        </CardContent>
                        {contract.status === 'pending_acceptance' && (
                            <CardFooter className="flex-col items-start gap-4 border-t pt-6 print:hidden bg-muted/5">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                                    <label
                                        htmlFor="terms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Li e concordo com todos os termos do contrato de transporte do(a) {student?.name}.
                                    </label>
                                </div>
                                <Button className="w-full h-14 text-lg font-bold shadow-lg" disabled={!hasAgreed} onClick={handleAcceptContract}>
                                    <CheckCircle className="mr-2 h-5 w-5" />
                                    ACEITAR CONTRATO DIGITALMENTE
                                </Button>
                            </CardFooter>
                        )}
                        <CardFooter className="hidden print:flex justify-center border-t pt-8 mt-10">
                            <div className="text-center">
                                <p className="text-[10px] text-black/40 italic">
                                    Documento gerado pela plataforma Guardian em {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}.
                                </p>
                                <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest mt-1">A jornada do seu filho, protegida em tempo real.</p>
                            </div>
                        </CardFooter>
                    </Card>
                )}
            </div>
        </div>
    );
}
