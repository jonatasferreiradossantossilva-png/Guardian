
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { LayoutGrid, MessageSquare, DollarSign, Milestone, ClipboardCheck, Car, HelpCircle, ShieldCheck, ShieldAlert, Loader2, RefreshCw, Wrench, AlertTriangle, BarChart3, TrendingDown, Sparkles, ChevronRight, UserPlus, Share2, Activity } from 'lucide-react';
import { OverviewCards } from "@/components/dashboard/overview-cards";
import { InvoicesStatusChart } from "@/components/dashboard/invoices-status-chart";
import { ExpensesCategoryChart } from "@/components/dashboard/expenses-category-chart";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { OnboardingGuide } from '@/components/dashboard/onboarding-guide';
import { validateGeoapifyApi, type ValidateApiOutput } from '@/ai/flows/validate-api-keys';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

// --- Mobile Home Screen Component ---
function MobileHome({ onOpenGuide, onShareRegistration }: { onOpenGuide: () => void, onShareRegistration: () => void }) {
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
            { href: '/dashboard/performance', label: 'Performance & Eco', icon: BarChart3 },
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
        <div className="p-4 space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">Menu Principal</h1>
                <p className="text-muted-foreground text-sm">
                    Atalhos rápidos para sua operação.
                </p>
            </div>

            <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        Novos Clientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <p className="text-xs text-muted-foreground mb-3">Envie o link de cadastro para novos pais via WhatsApp.</p>
                    <Button size="sm" className="w-full" onClick={onShareRegistration}>
                        <Share2 className="mr-2 h-4 w-4" /> Convidar Pais
                    </Button>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                {navLinks.map((link) => (
                    <Link href={link.href} key={link.href} passHref>
                        <Card className="hover:bg-secondary transition-colors h-full flex flex-col justify-center">
                            <CardHeader className="flex flex-col items-center justify-center text-center p-4">
                                <link.icon className="h-8 w-8 text-primary mb-2" />
                                <CardTitle className="text-sm">{link.label}</CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            <Button variant="outline" className="w-full" onClick={onOpenGuide}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Guia de Configuração
            </Button>
        </div>
    );
}


// --- Desktop Dashboard Component ---
const monthNames = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

function DesktopDashboard({ onOpenGuide, onShareRegistration }: { onOpenGuide: () => void, onShareRegistration: () => void }) {
  const { data: allInvoices } = useMockCollection('invoices', undefined);
  const { data: allExpenses } = useMockCollection('expenses', undefined);
  const { data: vehicles } = useMockCollection('vehicles');
  const { toast } = useToast();

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

  // Fleet Health Proactive Alarms
  const urgentMaintenance = useMemo(() => {
    if (!vehicles) return [];
    return vehicles.filter(v => {
        const kmSinceLast = (v.currentOdometer || 0) - (v.lastMaintenanceOdometer || 0);
        const remaining = (v.maintenanceInterval || 10000) - kmSinceLast;
        return remaining < 1000 && v.active;
    });
  }, [vehicles]);

  useEffect(() => {
    if (urgentMaintenance.length > 0) {
        toast({
            title: "🚨 Alerta de Frota",
            description: `${urgentMaintenance.length} veículo(s) precisam de manutenção urgente baseada no uso real.`,
            variant: "destructive"
        });
    }
  }, [urgentMaintenance.length, toast]);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Performance Shortcut Card */}
          <Link href="/dashboard/performance" className="md:col-span-2 group">
            <Card className="h-full border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <BarChart3 className="h-24 w-24" />
                </div>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-primary" />
                            <CardTitle className="text-xl">Performance & Inteligência</CardTitle>
                        </div>
                        <Badge variant="secondary" className="bg-primary/20 text-primary hover:bg-primary/20">Alpha v1.0</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center gap-8">
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-primary">94.5%</p>
                            <p className="text-sm text-muted-foreground">Eficiência de Roteirização</p>
                        </div>
                        <div className="h-12 w-px bg-border hidden md:block" />
                        <div className="space-y-1">
                            <p className="text-3xl font-bold text-green-500">-14.2%</p>
                            <p className="text-sm text-muted-foreground">Economia de KM (vs. Manual)</p>
                        </div>
                        <div className="flex-1" />
                        <Button variant="ghost" className="group-hover:translate-x-1 transition-transform">
                            Análise Completa <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </Link>

          {/* Onboarding / Sales Tool Card */}
          <Card className="h-full border-dashed border-primary/40 bg-secondary/20 relative overflow-hidden flex flex-col">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        Vendas & Onboarding
                    </CardTitle>
                    <CardDescription className="text-xs">Envie o link de cadastro automático para novos pais.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
                    <div className="bg-primary/10 p-4 rounded-full border-2 border-primary/20">
                        <Share2 className="h-8 w-8 text-primary" />
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm font-semibold">Onboarding Híbrido</p>
                        <p className="text-[10px] text-muted-foreground">O pai tira foto do documento e a IA faz o cadastro.</p>
                    </div>
                </CardContent>
                <CardFooter className="p-4 border-t bg-background/50">
                    <Button size="sm" className="w-full" onClick={onShareRegistration}>
                        <Share2 className="mr-2 h-4 w-4" /> Compartilhar Convite
                    </Button>
                </CardFooter>
          </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Fleet Health Quick Look */}
          <Link href="/dashboard/performance" className="md:col-span-1">
            <Card className={cn(
                "h-full transition-all cursor-pointer",
                urgentMaintenance.length > 0 ? "border-destructive/50 bg-destructive/5 hover:bg-destructive/10" : "border-border hover:bg-secondary/50"
            )}>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Saúde da Frota
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {urgentMaintenance.length > 0 ? (
                        <div className="flex items-center gap-3">
                            <div className="bg-destructive text-destructive-foreground p-2 rounded-full animate-pulse">
                                <AlertTriangle className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">{urgentMaintenance.length} Alerta(s)</p>
                                <p className="text-xs text-muted-foreground">Manutenção Urgente</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 text-green-500">
                            <div className="bg-green-500/20 p-2 rounded-full">
                                <ShieldCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-lg font-bold">Tudo em Dia</p>
                                <p className="text-xs text-muted-foreground">Frota monitorada via GPS</p>
                            </div>
                        </div>
                    )}
                    <p className="text-[10px] text-muted-foreground italic">Baseado no KM real percorrido hoje.</p>
                </CardContent>
            </Card>
          </Link>

          {/* API Diagnostics */}
          <Card className="border-border/50 bg-muted/20 md:col-span-2">
            <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-medium flex items-center justify-between text-muted-foreground">
                    <span className="flex items-center gap-2">
                        <Activity className="h-3 w-3" />
                        Status da Rede de Dados (Geoapify)
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleValidateApis} disabled={isValidating} className="h-6 text-[10px]">
                        {isValidating ? <Loader2 className="h-2 w-2 animate-spin mr-1" /> : <RefreshCw className="h-2 w-2 mr-1" />}
                        Verificar
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="py-2 px-4 flex flex-wrap gap-4 text-[10px]">
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Geocoding:</span>
                    {apiStatus?.geocoding.status === 'ok' ? 
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 h-4 px-1.5 text-[9px]">ONLINE</Badge> : 
                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">OFFLINE</Badge>
                    }
                </div>
                <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">Routing:</span>
                    {apiStatus?.routing.status === 'ok' ? 
                        <Badge className="bg-green-500/10 text-green-500 border-green-500/20 h-4 px-1.5 text-[9px]">ONLINE</Badge> : 
                        <Badge variant="destructive" className="h-4 px-1.5 text-[9px]">OFFLINE</Badge>
                    }
                </div>
            </CardContent>
          </Card>
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
    const [showOnboarding, setShowOnboarding] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; 
    }

    const handleOpenGuide = () => setShowOnboarding(true);

    const handleShareRegistration = () => {
        const registrationLink = `${window.location.origin}/register`;
        const shareText = `Olá! Para agilizar seu cadastro no Guardian, clique no link abaixo e use nossa ferramenta de leitura automática de documentos:\n\n${registrationLink}`;
        
        // Use standard Web Share API if available, otherwise fallback to WhatsApp and Copy
        if (navigator.share) {
            navigator.share({
                title: 'Convite Guardian',
                text: shareText,
                url: registrationLink
            }).catch(() => {
                // Fallback handled by toast/ui
            });
        } else {
            const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
            window.open(whatsappUrl, '_blank');
            
            // Also copy to clipboard for convenience
            navigator.clipboard.writeText(shareText);
            toast({
                title: "Link Copiado!",
                description: "A mensagem de convite foi copiada e o WhatsApp aberto."
            });
        }
    };

    return (
        <>
            {isMobile ? 
                <MobileHome onOpenGuide={handleOpenGuide} onShareRegistration={handleShareRegistration} /> : 
                <DesktopDashboard onOpenGuide={handleOpenGuide} onShareRegistration={handleShareRegistration} />
            }
            <OnboardingGuide isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />
        </>
    );
}
