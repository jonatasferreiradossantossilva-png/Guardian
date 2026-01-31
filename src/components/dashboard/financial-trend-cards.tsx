'use client';

import { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useMockCollection } from '@/hooks/use-mock-data';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { subMonths, subYears, format } from 'date-fns';

interface FinancialTrendCardsProps {
    filters: {
        year: string;
        month: string;
    }
}

export function FinancialTrendCards({ filters }: FinancialTrendCardsProps) {
    const { data: invoices, isLoading: areInvoicesLoading } = useMockCollection('invoices', undefined);
    const { data: expenses, isLoading: areExpensesLoading } = useMockCollection('expenses', undefined);
    const [trends, setTrends] = useState<{
        revenue: { value: string; change: string; changeType: 'increase' | 'decrease' };
        expenses: { value: string; change: string; changeType: 'increase' | 'decrease' };
        comparisonPeriod: string;
    } | null>(null);

    useEffect(() => {
        if (!invoices || !expenses) {
            setTrends(null);
            return;
        }

        const { year, month } = filters;
        const isYearlyView = month === 'all';
        const currentPeriodDate = new Date(parseInt(year), isYearlyView ? 0 : parseInt(month) - 1, 1);
        
        let previousPeriodDate: Date;
        let comparisonPeriod: string;
        
        const monthNames: Record<number, string> = {
            0: 'Jan', 1: 'Fev', 2: 'Mar', 3: 'Abr', 4: 'Mai', 5: 'Jun',
            6: 'Jul', 7: 'Ago', 8: 'Set', 9: 'Out', 10: 'Nov', 11: 'Dez'
        };

        if (isYearlyView) {
            previousPeriodDate = subYears(currentPeriodDate, 1);
            comparisonPeriod = `vs. ${previousPeriodDate.getFullYear()}`;
        } else {
            previousPeriodDate = subMonths(currentPeriodDate, 1);
            comparisonPeriod = `vs. ${monthNames[previousPeriodDate.getMonth()]}`;
        }
        
        const currentPeriodYearStr = String(currentPeriodDate.getFullYear());
        const currentPeriodMonthStr = String(currentPeriodDate.getMonth() + 1).padStart(2, '0');

        const prevPeriodYearStr = String(previousPeriodDate.getFullYear());
        const prevPeriodMonthStr = String(previousPeriodDate.getMonth() + 1).padStart(2, '0');

        let currentPeriodRevenue = 0, prevPeriodRevenue = 0;
        let currentPeriodExpenses = 0, prevPeriodExpenses = 0;

        invoices.filter(inv => inv.status === 'paid').forEach(inv => {
            if (isYearlyView) {
                if (inv.dueDate.startsWith(currentPeriodYearStr)) currentPeriodRevenue += inv.amount;
                else if (inv.dueDate.startsWith(prevPeriodYearStr)) prevPeriodRevenue += inv.amount;
            } else {
                if (inv.dueDate.startsWith(`${currentPeriodYearStr}-${currentPeriodMonthStr}`)) currentPeriodRevenue += inv.amount;
                else if (inv.dueDate.startsWith(`${prevPeriodYearStr}-${prevPeriodMonthStr}`)) prevPeriodRevenue += inv.amount;
            }
        });

        expenses.forEach(exp => {
            if (isYearlyView) {
                if (exp.date.startsWith(currentPeriodYearStr)) currentPeriodExpenses += exp.amount;
                else if (exp.date.startsWith(prevPeriodYearStr)) prevPeriodExpenses += exp.amount;
            } else {
                if (exp.date.startsWith(`${currentPeriodYearStr}-${currentPeriodMonthStr}`)) currentPeriodExpenses += exp.amount;
                else if (exp.date.startsWith(`${prevPeriodYearStr}-${prevPeriodMonthStr}`)) prevPeriodExpenses += exp.amount;
            }
        });

        const revenueDiff = currentPeriodRevenue - prevPeriodRevenue;
        const revenueChange = prevPeriodRevenue > 0 ? (revenueDiff / prevPeriodRevenue) * 100 : (currentPeriodRevenue > 0 ? 100 : 0);

        const expensesDiff = currentPeriodExpenses - prevPeriodExpenses;
        const expenseChange = prevPeriodExpenses > 0 ? (expensesDiff / prevPeriodExpenses) * 100 : (currentPeriodExpenses > 0 ? 100 : 0);
        
        setTrends({
            revenue: {
                value: `R$ ${currentPeriodRevenue.toFixed(2)}`,
                change: `${revenueChange >= 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
                changeType: revenueDiff >= 0 ? 'increase' : 'decrease'
            },
            expenses: {
                value: `R$ ${currentPeriodExpenses.toFixed(2)}`,
                change: `${expenseChange >= 0 ? '+' : ''}${expenseChange.toFixed(1)}%`,
                changeType: expensesDiff >= 0 ? 'decrease' : 'increase'
            },
            comparisonPeriod
        });

    }, [invoices, expenses, filters]);


    if (areInvoicesLoading || areExpensesLoading || !trends) {
        return (
            <Card>
                <CardHeader><CardTitle>Tendências</CardTitle></CardHeader>
                <CardContent className="h-[230px] flex items-center justify-center text-muted-foreground">Calculando...</CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Tendências</CardTitle>
                <CardDescription>Receita e despesas do período selecionado comparadas com o período anterior.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                       <TrendingUp className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Receita ({trends.comparisonPeriod})</p>
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
                        <p className="text-sm text-muted-foreground">Despesas ({trends.comparisonPeriod})</p>
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
