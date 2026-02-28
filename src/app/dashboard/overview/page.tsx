
'use client';

import { useState, useMemo, useEffect } from 'react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ShieldAlert, Loader2, RefreshCw } from 'lucide-react';
import { validateGeoapifyApi, type ValidateApiOutput } from '@/ai/flows/validate-api-keys';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function DashboardOverviewPage() {
  const { data: allInvoices } = useMockCollection('invoices', undefined);
  const { data: allExpenses } = useMockCollection('expenses', undefined);

  const [selectedYear, setSelectedYear] = useState<string>('latest');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [isClient, setIsClient] = useState(false);
  
  // API Validation State
  const [apiStatus, setApiStatus] = useState<ValidateApiOutput | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Auto-validate on mount
  useEffect(() => {
    setIsClient(true);
    handleValidateApis();
  }, []);

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
          <h1 className="text-3xl font-bold tracking-tight">Visão Geral</h1>
          <p className="text-muted-foreground">Saúde financeira e operacional da sua frota.</p>
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

      {/* API Diagnostics (Visible only during development/validation) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="py-3">
            <CardTitle className="text-sm font-medium flex items-center justify-between">
                <span>Diagnóstico de Integração (Geoapify)</span>
                <Button variant="ghost" size="sm" onClick={handleValidateApis} disabled={isValidating} className="h-8">
                    {isValidating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <RefreshCw className="h-3 w-3 mr-2" />}
                    Re-testar
                </Button>
            </CardTitle>
        </CardHeader>
        <CardContent className="py-3 flex gap-6 text-xs">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Geocoding:</span>
                {isValidating ? (
                    <span className="text-muted-foreground italic flex items-center gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin"/> Verificando...</span>
                ) : apiStatus ? (
                    apiStatus.geocoding.status === 'ok' ? 
                    <span className="text-green-500 flex items-center gap-1 font-semibold"><ShieldCheck className="h-3 w-3"/> Ativo</span> : 
                    <span className="text-red-500 flex items-center gap-1 font-semibold" title={apiStatus.geocoding.message}><ShieldAlert className="h-3 w-3"/> Erro</span>
                ) : <span className="text-muted-foreground italic">Aguardando...</span>}
            </div>
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Routing:</span>
                {isValidating ? (
                    <span className="text-muted-foreground italic flex items-center gap-1 animate-pulse"><Loader2 className="h-3 w-3 animate-spin"/> Verificando...</span>
                ) : apiStatus ? (
                    apiStatus.routing.status === 'ok' ? 
                    <span className="text-green-500 flex items-center gap-1 font-semibold"><ShieldCheck className="h-3 w-3"/> Ativo</span> : 
                    <span className="text-red-500 flex items-center gap-1 font-semibold" title={apiStatus.routing.message}><ShieldAlert className="h-3 w-3"/> Erro</span>
                ) : <span className="text-muted-foreground italic">Aguardando...</span>}
            </div>
            {apiStatus && (apiStatus.geocoding.status === 'error' || apiStatus.routing.status === 'error') && (
                <p className="text-red-400 italic">Verifique se os serviços Geocoding e Routing estão habilitados para sua chave no painel da Geoapify.</p>
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
