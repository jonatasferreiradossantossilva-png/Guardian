'use client';

import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import { useMockDoc, useMockCollection } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Printer, MessageCircle, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export default function ReceiptPage() {
    const params = useParams();
    const { toast } = useToast();
    const invoiceId = params.invoiceId as string;

    const { data: invoice, isLoading: isInvoiceLoading } = useMockDoc('invoices', invoiceId);
    
    // We need to fetch all students and parents to find the correct ones based on invoice data
    const { data: allStudents, isLoading: areStudentsLoading } = useMockCollection('students');
    const { data: allParents, isLoading: areParentsLoading } = useMockCollection('parents');

    const student = useMemo(() => {
        if (!invoice || !allStudents) return null;
        return allStudents.find(s => s.id === invoice.studentId);
    }, [invoice, allStudents]);

    const parent = useMemo(() => {
        if (!student || !allParents) return null;
        return allParents.find(p => p.id === student.parentId);
    }, [student, allParents]);

    const isLoading = isInvoiceLoading || areStudentsLoading || areParentsLoading;

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        if (!parent?.phone) {
            toast({
                title: "Telefone não encontrado",
                description: "O responsável não possui um número de telefone cadastrado.",
                variant: "destructive"
            });
            return;
        }

        const receiptLink = window.location.href;
        const message = `Olá, ${parent.name}! Segue o recibo de pagamento da mensalidade de ${student?.name}:\n\n${receiptLink}`;
        // Basic phone number cleaning - this might need to be more robust in a real app
        const phoneNumber = parent.phone.replace(/\D/g, '');
        
        // Basic validation for Brazilian numbers (DDD + 9 digits)
        if (phoneNumber.length < 10 || phoneNumber.length > 11) {
             toast({
                title: "Número de telefone inválido",
                description: "O número de telefone cadastrado para este responsável não parece ser válido.",
                variant: "destructive"
            });
            return;
        }
        
        const whatsappUrl = `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    if (!invoice) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                <Card className="p-8">
                    <CardTitle>Recibo não encontrado</CardTitle>
                    <CardDescription className="mt-2">O ID do recibo é inválido ou ele foi removido.</CardDescription>
                    <Button asChild variant="link" className="mt-4"><Link href="/dashboard/financial">Voltar para o Financeiro</Link></Button>
                </Card>
            </div>
        );
    }
    
    if (invoice.status !== 'paid') {
         return (
            <div className="flex flex-col items-center justify-center h-screen text-center p-4">
                 <Card className="p-8">
                    <CardTitle>Fatura não está paga</CardTitle>
                    <CardDescription className="mt-2">Recibos só podem ser gerados para faturas com status "Pago".</CardDescription>
                    <Button asChild variant="link" className="mt-4"><Link href="/dashboard/financial">Voltar para o Financeiro</Link></Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="bg-secondary min-h-screen p-4 sm:p-8 print:bg-white print:p-0">
             <div className="max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 print:hidden">
                    <Button asChild variant="outline" size="icon" className="self-start sm:self-center">
                        <Link href="/dashboard/financial"><ArrowLeft /></Link>
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button variant="outline" onClick={handleShare} className="w-full sm:w-auto justify-center"><MessageCircle className="mr-2" />Compartilhar</Button>
                        <Button onClick={handlePrint} className="w-full sm:w-auto justify-center"><Printer className="mr-2" />Imprimir / Salvar PDF</Button>
                    </div>
                </div>

                <Card className="shadow-lg print:shadow-none print:border-none">
                    <CardHeader className="bg-muted/30 p-4 md:p-6 lg:p-8 rounded-t-lg">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex items-center gap-4">
                                <Rocket className="h-10 w-10 text-primary" />
                                <div>
                                    <h1 className="text-2xl font-bold">Guardian Transporte</h1>
                                    <p className="text-sm text-muted-foreground">CNPJ: 00.000.000/0001-00</p>
                                </div>
                            </div>
                            <div className="text-left sm:text-right">
                                <h2 className="text-xl font-semibold">RECIBO DE PAGAMENTO</h2>
                                <p className="text-sm text-muted-foreground">Fatura #{invoice.id.split('-')[0]}</p>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-4 md:p-6 lg:p-8 space-y-6">
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">PAGO POR</h3>
                                <p className="font-medium">{parent?.name || 'Responsável não encontrado'}</p>
                                <p className="text-sm text-muted-foreground">{parent?.cpf ? `CPF: ${parent.cpf}` : ''}</p>
                            </div>
                             <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-2">REFERENTE A</h3>
                                <p className="font-medium">Aluno(a): {student?.name || 'Aluno não encontrado'}</p>
                                <p className="text-sm text-muted-foreground">{invoice.description}</p>
                            </div>
                        </div>
                        
                        <div className="border-t border-b py-4">
                            <div className="flex justify-between items-center text-lg">
                                <span className="font-medium">Valor Pago</span>
                                <span className="font-bold text-primary">R$ {invoice.amount.toFixed(2).replace('.', ',')}</span>
                            </div>
                        </div>

                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                             <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">Data do Vencimento</h3>
                                <p>{format(new Date(invoice.dueDate), "dd/MM/yyyy", { locale: ptBR })}</p>
                            </div>
                             <div>
                                <h3 className="font-semibold text-muted-foreground mb-2">Data do Pagamento</h3>
                                {/* In a real app, this would be stored in the invoice itself */}
                                <p>{format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 p-4 text-center text-xs text-muted-foreground rounded-b-lg">
                       <p>Este é um recibo gerado por computador e é válido sem assinatura. Guardian - A jornada do seu filho, protegida em tempo real.</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
