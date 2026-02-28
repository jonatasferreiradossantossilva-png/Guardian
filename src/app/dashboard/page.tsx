
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LayoutGrid, MessageSquare, DollarSign, Milestone, ClipboardCheck, Car, HelpCircle, ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OnboardingGuide } from '@/components/dashboard/onboarding-guide';
import { validateGeoapifyApi, type ValidateApiOutput } from '@/ai/flows/validate-api-keys';

// --- Mobile Home Screen Component ---
function MobileHome({ onOpenGuide }: { onOpenGuide: () => void }) {
    const [mockUserId, setMockUserId] = useState<string | null>(null);

    useEffect(() => {
        setMockUserId(sessionStorage.getItem('mockUserId'));
    }, []);

    const driverFilter = useMemo(() => (
        mockUserId ? [{ field: 'userId', op: '==', value: mockUserId }] : undefined
    ), [mockUserId]);
    const { data: drivers } = useMockCollection('drivers', driverFilter);
    const isDriver = useMemo(() => drivers && drivers.length > 0, [drivers]);

    const navLinks = useMemo(() => {
        const baseLinks = [
            { href: '/dashboard/overview', label: 'Painel Financeiro', icon: LayoutGrid },
            { href: '/dashboard/messages', label: 'Mensagens', icon: MessageSquare },
            { href: '/dashboard/financial', label: 'Controle Financeiro', icon: DollarSign },
            { href: '/dashboard/management/trip-requests', label: 'Viagens Extras', icon: Milestone },
        ];

        if (isDriver) {
            return [
                ...baseLinks,
                { href: '/driver/route-plan', label: 'Modo Motorista', icon: Car },
            ];
        }

        return [
            ...baseLinks,
            { href: '/dashboard/management/contracts', label: 'Contratos', icon: ClipboardCheck },
        ];
    }, [isDriver]);

    return (
        <div className="p-4">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Menu Principal</h1>
            <p className="text-muted-foreground mb-6 text-sm">
                Atalhos rápidos para sua operação.
            </p>
            <Button variant="outline" className="w-full mb-6" onClick={onOpenGuide}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Guia de Configuração
            </Button>
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


// --- Desktop Dashboard Component ---
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function DesktopDashboard({ onOpenGuide }: { onOpenGuide: () => void }) {
  const { data: allInvoices } = useMockCollection('invoices', undefined);
  const { data: allExpenses } = useMockCollection('expenses', undefined);

  const [selectedYear, setSelectedYear] = useState<string>('latest');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  
  // API Validation State
  const [apiStatus, setApiStatus] = useState<ValidateApiOutput | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidateApis = async () => {
    setIsValidating(true);
    try {
      const result = await validateGeoapifyApi();
      setApiStatus(result);
    } catch (error) {
      console.error("Erro ao validar APIs:", error);
    } finally {
      setIsValidating(false);
    }
  };

  useEffect(() => {
    handleValidateApis();
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
          <p className="text-muted-foreground">Visão geral da sua operação.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onOpenGuide}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Guia de Configuração
            </Button>
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

      {/* API Diagnostics - VISÍVEL PARA VOCÊ AGORA */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Status da Integração Geoapify (Resiliência)</span>
                <Button variant="outline" size="sm" onClick={handleValidateApis} disabled={isValidating} className="h-8">
                    {isValidating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                    Re-testar Conexão
                </Button>
            </CardTitle>
        </CardHeader>
        <CardContent className="py-3 flex flex-wrap gap-6 text-xs">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Geocoding (Endereços):</span>
                {isValidating ? (
                    <span className="animate-pulse">Verificando...</span>
                ) : apiStatus ? (
                    apiStatus.geocoding.status === 'ok' ? 
                    <span className="text-green-500 flex items-center gap-1 font-bold"><ShieldCheck className="h-3 w-3"/> ATIVO</span> : 
                    <span className="text-red-500 flex items-center gap-1 font-bold"><ShieldAlert className="h-3 w-3"/> ERRO</span>
                ) : <span>Aguardando...</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Routing (Rotas):</span>
                {isValidating ? (
                    <span className="animate-pulse">Verificando...</span>
                ) : apiStatus ? (
                    apiStatus.routing.status === 'ok' ? 
                    <span className="text-green-500 flex items-center gap-1 font-bold"><ShieldCheck className="h-3 w-3"/> ATIVO</span> : 
                    <span className="text-red-500 flex items-center gap-1 font-bold"><ShieldAlert className="h-3 w-3"/> ERRO</span>
                ) : <span>Aguardando...</span>}
            </div>
            {apiStatus && (apiStatus.geocoding.status === 'error' || apiStatus.routing.status === 'error') && (
                <p className="text-red-400 italic w-full">Nota: Se aparecer erro, verifique se essas APIs estão ativas no painel da Geoapify.</p>
            )}
        </CardContent>
      </Card>

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
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; 
    }

    const handleOpenGuide = () => setShowOnboarding(true);

    return (
        <>
            {isMobile ? <MobileHome onOpenGuide={handleOpenGuide} /> : <DesktopDashboard onOpenGuide={handleOpenGuide} />}
            <OnboardingGuide isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </>
    );
}
