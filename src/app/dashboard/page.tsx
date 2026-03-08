
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { 
    LayoutGrid, 
    MessageSquare, 
    DollarSign, 
    Milestone, 
    Car, 
    HelpCircle, 
    ShieldCheck, 
    Loader2, 
    RefreshCw, 
    Wrench, 
    AlertTriangle, 
    BarChart3, 
    ChevronRight, 
    UserPlus, 
    Activity, 
    ExternalLink, 
    Play, 
    BookOpen,
    Sparkles,
    ClipboardCheck,
    History,
    Megaphone
} from 'lucide-react';
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
import { cn } from '@/lib/utils';
import { OperationalFeed } from '@/components/dashboard/operational-feed';

// --- Mobile Home Screen Component ---
function MobileHome({ onOpenGuide, onShareRegistration }: { onOpenGuide: () => void, onShareRegistration: () => void }) {
    const navLinks = [
        { href: '/dashboard/financial', label: 'Financeiro', icon: DollarSign },
        { href: '/dashboard/performance', label: 'Performance', icon: BarChart3 },
        { href: '/dashboard/messages', label: 'Mensagens', icon: MessageSquare },
        { href: '/dashboard/management/pending-registrations', label: 'Solicitações', icon: UserPlus },
        { href: '/dashboard/management/trip-requests', label: 'Viagens Extras', icon: Milestone },
        { href: '/dashboard/management/announcements', label: 'Mural', icon: Megaphone },
    ];

    return (
        <div className="p-4 space-y-6">
            {/* Header com Guia integrado no topo */}
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-primary uppercase italic">Guardian</h1>
                        <Button variant="ghost" size="icon" onClick={onOpenGuide} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <HelpCircle className="h-5 w-5" />
                        </Button>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                        Inteligência Operacional
                    </p>
                </div>
                <Badge variant="outline" className="border-primary/20 text-primary font-bold">ADMIN</Badge>
            </div>

            {/* Grade de 6 Atalhos Padronizada em Quadrados Perfeitos */}
            <div className="grid grid-cols-3 gap-3">
                {navLinks.map((link) => (
                    <Link href={link.href} key={link.href} passHref className="aspect-square">
                        <Card className="hover:bg-secondary transition-colors border-primary/10 active:scale-95 duration-200 h-full">
                            <CardHeader className="flex flex-col items-center justify-center text-center p-2 h-full">
                                <div className="p-2 rounded-lg bg-primary/10 mb-1.5 shrink-0">
                                    <link.icon className="h-5 w-5 text-primary" />
                                </div>
                                <CardTitle className="text-[9px] uppercase font-black leading-tight tracking-tighter flex items-center justify-center min-h-[24px]">
                                    {link.label}
                                </CardTitle>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Card de Aviso do Guia / Setup Status */}
            <Card className="border-dashed border-primary/40 bg-primary/5 flex items-center p-4 gap-4" onClick={onOpenGuide}>
                <div className="p-3 bg-primary/10 rounded-full">
                    <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-black uppercase text-primary tracking-tight">Status do Setup</p>
                    <p className="text-[10px] text-muted-foreground leading-tight">Siga os 5 passos para ativar a infra e receber os primeiros alunos.</p>
                </div>
                <ChevronRight className="h-4 w-4 text-primary opacity-50" />
            </Card>

            {/* Operational Feed Principal */}
            <OperationalFeed />

            <div className="space-y-2 pb-10">
                <Button variant="outline" className="w-full h-12 border-primary/30 text-primary font-bold shadow-sm" onClick={onShareRegistration}>
                    <UserPlus className="mr-2 h-5 w-5" />
                    CONVIDAR NOVOS PAIS
                </Button>
            </div>
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
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground italic uppercase">Guardian</h1>
          <Button variant="ghost" size="icon" onClick={onOpenGuide} className="text-muted-foreground hover:text-primary">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={onShareRegistration} className="border-primary/30 text-primary font-bold">
                <UserPlus className="mr-2 h-4 w-4" />
                Convidar Pais
            </Button>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="latest">Recente</SelectItem>
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
                    <SelectItem value="all">Todo o Ano</SelectItem>
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
          <div className="md:col-span-2">
            <OperationalFeed />
          </div>

          <Card className="h-full border-dashed border-primary/40 bg-secondary/20 flex flex-col shadow-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Status do Setup
                    </CardTitle>
                    <CardDescription className="text-xs">Visualize o guia para ativar a IA.</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-center items-center text-center p-6 space-y-4">
                    <div className="bg-primary/10 p-4 rounded-full border-2 border-primary/20">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase font-bold text-center">Configuração de Frota <br/> & Telemetria Ativa</p>
                </CardContent>
                <CardFooter className="p-4 border-t bg-background/50">
                    <Button size="sm" variant="outline" className="w-full font-bold" onClick={onOpenGuide}>
                        ABRIR GUIA RÁPIDO
                    </Button>
                </CardFooter>
          </Card>
      </div>

      <OverviewCards filters={filters} />

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2 pb-10">
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

    if (!isClient) return null; 

    const handleOpenGuide = () => setShowOnboarding(true);

    const handleShareRegistration = async () => {
        const registrationLink = `${window.location.origin}/register`;
        const shareText = `Olá! Para agilizar seu cadastro no Guardian, clique no link abaixo e use nossa ferramenta de leitura automática de documentos:\n\n${registrationLink}`;
        
        try {
            await navigator.clipboard.writeText(shareText);
            if (navigator.share) {
                try {
                    await navigator.share({ title: 'Convite Guardian', text: shareText, url: registrationLink });
                    return; 
                } catch (e) {}
            }
            window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
            toast({ title: "Link Copiado!", description: "A mensagem está na sua área de transferência." });
        } catch (err) {
            toast({ title: "Erro ao compartilhar", variant: "destructive" });
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
