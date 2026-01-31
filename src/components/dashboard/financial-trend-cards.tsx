'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export function FinancialTrendCards() {
    const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices');
    const { data: expenses, isLoading: areExpensesLoading } = useMockCollection('expenses');
    const [trends, setTrends] = useState<{
        revenue: { value: string; change: string; changeType: 'increase' | 'decrease' };
        expenses: { value: string; change: string; changeType: 'increase' | 'decrease' };
        lastMonthName: string;
    } | null>(null);

    useEffect(() => {
        if (!invoices || !expenses) {
            setTrends(null);
            return;
        }

        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthStr = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
        const lastMonthName = lastMonthDate.toLocaleString('pt-BR', { month: 'long' });

        let currentMonthRevenue = 0;
        let lastMonthRevenue = 0;
        invoices.filter(inv => inv.status === 'paid').forEach(inv => {
        if (inv.dueDate.startsWith(currentMonthStr)) {
            currentMonthRevenue += inv.amount;
        } else if (inv.dueDate.startsWith(lastMonthStr)) {
            lastMonthRevenue += inv.amount;
        }
        });

        let currentMonthExpenses = 0;
        let lastMonthExpenses = 0;
        expenses.forEach(exp => {
        if (exp.date.startsWith(currentMonthStr)) {
            currentMonthExpenses += exp.amount;
        } else if (exp.date.startsWith(lastMonthStr)) {
            lastMonthExpenses += exp.amount;
        }
        });
        
        const revenueDiff = currentMonthRevenue - lastMonthRevenue;
        const revenueChange = lastMonthRevenue > 0 ? (revenueDiff / lastMonthRevenue) * 100 : (currentMonthRevenue > 0 ? 100 : 0);

        const expensesDiff = currentMonthExpenses - lastMonthExpenses;
        const expenseChange = lastMonthExpenses > 0 ? (expensesDiff / lastMonthExpenses) * 100 : (currentMonthExpenses > 0 ? 100 : 0);

        setTrends({
            revenue: {
                value: `R$ ${currentMonthRevenue.toFixed(2)}`,
                change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
                changeType: revenueDiff >= 0 ? 'increase' : 'decrease'
            },
            expenses: {
                value: `R$ ${currentMonthExpenses.toFixed(2)}`,
                change: `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`,
                // For expenses, an increase is a "bad" trend (red), decrease is "good" (green)
                changeType: expensesDiff >= 0 ? 'decrease' : 'increase'
            },
            lastMonthName
        });
    }, [invoices, expenses]);


    if (areInvoicesLoading || areExpensesLoading || !trends) {
        return (
            <Card>
                <CardHeader><CardTitle>Tendências Mensais</CardTitle></CardHeader>
                <CardContent className="h-[230px] flex items-center justify-center text-muted-foreground">Calculando...</CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tendências Mensais</CardTitle>
                <CardDescription>Receita e despesas do mês atual comparadas com o mês anterior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                       <TrendingUp className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Receita (vs. {trends.lastMonthName})</p>
                        <p className="text-2xl font-bold">{trends.revenue.value}</p>
                    </div>
                    <div className={cn(
                        "ml-auto text-sm font-medium flex items-center",
                        trends.revenue.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                    )}>
                       {trends.revenue.changeType === 'increase' ? '▲' : '▼'} {trends.revenue.change}
                    </div>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-destructive/10">
                       <TrendingDown className="h-6 w-6 text-destructive"/>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Despesas (vs. {trends.lastMonthName})</p>
                        <p className="text-2xl font-bold">{trends.expenses.value}</p>
                    </div>
                     <div className={cn(
                        "ml-auto text-sm font-medium flex items-center",
                        // For expenses, an increase is bad (red), a decrease is good (green)
                        trends.expenses.changeType === 'increase' ? 'text-green-500' : 'text-red-500'
                    )}>
                       {trends.expenses.changeType === 'increase' ? '▼' : '▲'} {trends.expenses.change}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
