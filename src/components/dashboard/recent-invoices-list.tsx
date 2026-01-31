'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

const statusVariantMap = {
  pending: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  pagamento_em_analise: 'outline',
};

const statusTextMap = {
  pending: 'Pendente',
  paid: 'Paga',
  overdue: 'Vencida',
  pagamento_em_analise: 'Em Análise',
};


export function RecentInvoicesList() {
    const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
    const { data: students, isLoading: areStudentsLoading } = useMockCollection('students');

    const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s])), [students]);
    
    const recentInvoices = useMemo(() => {
        if (!invoices) return [];

        const statusOrder = {
            overdue: 1,
            pagamento_em_analise: 2,
            pending: 3,
            paid: 4,
        };

        return [...invoices]
            .sort((a, b) => {
                const statusComparison = statusOrder[a.status] - statusOrder[b.status];
                if (statusComparison !== 0) return statusComparison;
                return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
            })
            .slice(0, 4); // Take top 4 for better spacing
    }, [invoices]);

    const isLoading = areInvoicesLoading || areStudentsLoading;
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Atividade Recente de Faturas</CardTitle>
                <CardDescription>
                    As últimas faturas que requerem sua atenção.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="h-[230px] flex items-center justify-center text-muted-foreground">
                        Carregando faturas...
                    </div>
                ) : recentInvoices.length === 0 ? (
                    <div className="h-[230px] flex items-center justify-center text-muted-foreground">
                        Nenhuma fatura recente.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {recentInvoices.map(invoice => {
                            const student = studentsMap.get(invoice.studentId);
                            return (
                                <div key={invoice.id} className="flex items-center gap-4">
                                    <Avatar className="h-9 w-9">
                                        <AvatarImage src={`https://picsum.photos/seed/student-${invoice.studentId}/100/100`} />
                                        <AvatarFallback>{student?.name?.[0] || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium leading-none">{student?.name || 'Aluno não encontrado'}</p>
                                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="font-bold text-sm">R$ {invoice.amount.toFixed(2)}</span>
                                        <Badge variant={statusVariantMap[invoice.status]} className="mt-1">{statusTextMap[invoice.status]}</Badge>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
              <CardFooter>
                <Button asChild variant="secondary" className="w-full">
                    <Link href="/dashboard/financial">
                        Ver Todas as Faturas
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}
