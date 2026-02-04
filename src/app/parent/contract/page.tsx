'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, FileText, CheckCircle, Clock } from 'lucide-react';
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
};

export default function ParentContractPage() {
    const { toast } = useToast();
    const [mockUserId, setMockUserId] = useState<string | null>(null);
    const { data: contracts, isLoading } = useMockCollection('contracts', mockUserId ? [{ field: 'parentUserId', op: '==', value: mockUserId }] : undefined);
    const contract = useMemo(() => contracts?.[0], [contracts]);
    const { updateDoc } = useMockData();

    const [hasAgreed, setHasAgreed] = useState(false);

    useEffect(() => {
        const storedUserId = sessionStorage.getItem('mockUserId');
        setMockUserId(storedUserId);
    }, []);

    const handleAcceptContract = () => {
        if (!contract) return;
        updateDoc('contracts', contract.id, {
            status: 'accepted',
            acceptedAt: new Date().toISOString(),
        });
        toast({
            title: 'Contrato Aceito!',
            description: 'Obrigado! Seu aceite foi registrado com sucesso.',
        });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin" /></div>
    }

    return (
        <div className="min-h-screen bg-background text-foreground p-4">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                    <Button asChild variant="outline" size="icon">
                        <Link href="/parent/tracking"><ArrowLeft /></Link>
                    </Button>
                </div>

                {!contract ? (
                    <Card className="text-center p-8">
                        <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <CardTitle>Nenhum contrato encontrado</CardTitle>
                        <CardDescription className="mt-2">
                            Ainda não há um contrato de prestação de serviços disponível para você.
                        </CardDescription>
                    </Card>
                ) : (
                    <Card>
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><FileText />Contrato de Transporte</CardTitle>
                                    <CardDescription className="mt-2">
                                        Gerado em: {format(new Date(contract.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                                    </CardDescription>
                                </div>
                                {contract.status === 'accepted' && (
                                     <div className="text-sm p-3 rounded-md bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                                        <p className="font-semibold flex items-center gap-2"><CheckCircle className="h-4 w-4"/>Contrato Aceito</p>
                                        <p>Em: {format(new Date(contract.acceptedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <ScrollArea className="h-[50vh] border rounded-md p-4 bg-secondary/30">
                                <pre className="whitespace-pre-wrap font-sans text-sm">{contract.generatedContent}</pre>
                            </ScrollArea>
                        </CardContent>
                        {contract.status === 'pending_acceptance' && (
                            <CardFooter className="flex-col items-start gap-4 border-t pt-6">
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="terms" checked={hasAgreed} onCheckedChange={(checked) => setHasAgreed(checked as boolean)} />
                                    <label
                                        htmlFor="terms"
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                    >
                                        Li e concordo com todos os termos do contrato.
                                    </label>
                                </div>
                                <Button className="w-full sm:w-auto" disabled={!hasAgreed} onClick={handleAcceptContract}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Aceitar Contrato Digitalmente
                                </Button>
                            </CardFooter>
                        )}
                    </Card>
                )}
            </div>
        </div>
    );
}
