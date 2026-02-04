'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, Sparkles, MessageSquare, DollarSign, Users, Route } from 'lucide-react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Data for the mobile home screen links
const navLinks = [
  { href: '/dashboard/overview', label: 'Visão Geral', icon: LayoutGrid },
  { href: '/dashboard/optimizer', label: 'Otimizador IA', icon: Sparkles },
  { href: '/dashboard/messages', label: 'Mensagens', icon: MessageSquare },
  { href: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
  { href: '/dashboard/management/students', label: 'Alunos', icon: Users },
  { href: '/dashboard/management/routes', label: 'Rotas', icon: Route },
];

// --- Mobile Home Screen Component ---
function MobileHome() {
    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold tracking-tight mb-6">Menu Principal</h1>
            <div className="grid grid-cols-2 gap-4">
                {navLinks.map((link) => (
                    <Link href={link.href} key={link.href} passHref>
                        <Card className="hover:bg-secondary transition-colors h-full flex flex-col justify-center">
                            <CardHeader className="flex flex-col items-center justify-center text-center p-4">
                                <link.icon className="h-8 w-8 text-primary mb-2" />
                                <CardTitle className="text-base">{link.label}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}

// --- Desktop Dashboard Component (Current content) ---
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function DesktopDashboard() {
  const { data: allInvoices } = useMockCollection('invoices', undefined);
  const { data: allExpenses } = useMockCollection('expenses', undefined);

  const [selectedYear, setSelectedYear] = useState<string>('latest');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const availableYears = useMemo(() => {
    const years = new Set<string>();
    (allInvoices || []).forEach(inv => years.add(inv.dueDate.substring(0, 4)));
    (allExpenses || []).forEach(exp => years.add(exp.date.substring(0, 4)));
    if (years.size === 0) {
      years.add(new Date().getFullYear().toString());
    }
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [allInvoices, allExpenses]);

  const effectiveYear = selectedYear === 'latest' ? (availableYears[0] || new Date().getFullYear().toString()) : selectedYear;

  const filters = { year: effectiveYear, month: selectedMonth };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da saúde financeira da sua operação.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="latest">Mais Recente</SelectItem>
                    {availableYears.map(year => (
                        <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
             <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[160px]">
                    <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todos os Meses</SelectItem>
                    {monthNames.map((month, index) => (
                        <SelectItem key={month} value={String(index + 1).padStart(2, '0')}>
                            {month}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>

      <OverviewCards filters={filters} />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
        <InvoicesStatusChart filters={filters}/>
        <ExpensesCategoryChart filters={filters} />
      </div>
    </div>
  );
}


// --- Main Page Component ---
export default function DashboardPage() {
    const isMobile = useIsMobile();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        // Render a placeholder or null on the server to avoid hydration mismatch
        return null; 
    }

    return isMobile ? <MobileHome /> : <DesktopDashboard />;
}
