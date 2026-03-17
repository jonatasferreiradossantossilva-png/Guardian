
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  Users,
  Car,
  Bot,
  Shield,
  DollarSign,
  Rocket,
  Map,
  ShieldCheck,
  Wallet,
  Briefcase,
  Target,
  MessageSquareX,
  Sparkles,
  Milestone,
  User,
  FileText,
  QrCode,
  BellRing,
  BarChart,
  Activity,
  Gauge,
  HeartPulse,
  MapPinned,
  TrendingDown,
  ExternalLink,
  Database,
  Zap,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4 mx-auto">
          <Link href="/login" className="flex items-center gap-2 font-bold">
            <Rocket className="h-6 w-6 text-primary" />
            <span className="uppercase italic tracking-tighter">Guardian</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Button variant="ghost" asChild>
              <Link href="#problema">O Problema</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#diferenciais">Diferenciais</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/presentation" className="text-primary font-bold">Pitch Deck (Investidores)</Link>
            </Button>
            <Button asChild>
              <Link href="/">Acessar Plataforma</Link>
            </Button>
          </nav>
           <Button variant="ghost" className="md:hidden font-bold" asChild>
              <Link href="/">Entrar</Link>
            </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Foco em Inteligência e ROI */}
        <section className="w-full py-24 md:py-32 lg:py-48 bg-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[grid-line] opacity-10" />
          <div className="container mx-auto text-center px-4 relative z-10">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-black tracking-[0.2em] px-4 py-1">A PRIMEIRA IA PARA TRANSPORTE ESCOLAR</Badge>
            <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl uppercase italic leading-none">
              A era do <span className="text-primary">rastreio passivo</span> acabou.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground md:text-2xl font-medium leading-relaxed">
              Bem-vindo ao Guardian. Inteligência operacional que prova seu ROI através de telemetria de alta precisão e automação total de back-office.
            </p>
            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Button size="lg" className="h-16 px-10 text-lg font-black uppercase italic shadow-xl shadow-primary/20" asChild>
                <Link href="/">Entrar no Sistema</Link>
              </Button>
              <Button size="lg" variant="outline" className="h-16 px-10 text-lg font-black uppercase italic border-2" asChild>
                <Link href="/presentation">Ver Pitch Deck <ArrowDownRight className="ml-2" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Diferenciais Únicos - Por que investir? */}
        <section id="diferenciais" className="w-full py-24 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <Badge className="mb-4 bg-primary text-primary-foreground font-bold">ÚNICO NO MERCADO</Badge>
                        <h2 className="text-4xl font-black mb-8 uppercase italic tracking-tighter leading-none">Por que o Guardian é um <span className="text-primary">investimento imbatível</span>?</h2>
                        <div className="space-y-8">
                            <div className="flex gap-5">
                                <div className="bg-primary/10 p-4 rounded-2xl h-fit border border-primary/20 shadow-sm"><Database className="text-primary h-6 w-6"/></div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-lg italic">Base Nacional de 190k Escolas</h4>
                                    <p className="text-muted-foreground leading-relaxed font-medium">Nossa maior barreira de entrada. Um banco de dados proprietário que elimina a digitação manual e garante rotas perfeitas desde o dia 1.</p>
                                </div>
                            </div>
                            <div className="flex gap-5">
                                <div className="bg-primary/10 p-4 rounded-2xl h-fit border border-primary/20 shadow-sm"><Zap className="text-primary h-6 w-6"/></div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-lg italic">Onboarding Automatizado via OCR</h4>
                                    <p className="text-muted-foreground leading-relaxed font-medium">O pai faz o cadastro via IA. Reduzimos o custo de aquisição de clientes e eliminamos erros de burocracia documental.</p>
                                </div>
                            </div>
                            <div className="flex gap-5">
                                <div className="bg-primary/10 p-4 rounded-2xl h-fit border border-primary/20 shadow-sm"><Activity className="text-primary h-6 w-6"/></div>
                                <div>
                                    <h4 className="font-black uppercase tracking-tight text-lg italic">Prova de ROI em Tempo Real</h4>
                                    <p className="text-muted-foreground leading-relaxed font-medium">Mostramos exatamente quanto combustível foi economizado comparando o planejado com o real capturado pelo GPS.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Card className="border-4 border-primary/30 shadow-2xl overflow-hidden bg-background rounded-[2.5rem]">
                        <CardHeader className="bg-secondary/50 border-b p-8">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-xl font-black uppercase italic tracking-tight flex items-center gap-2">
                                    <Activity className="h-6 w-6 text-primary" />
                                    Painel de Performance (Live)
                                </CardTitle>
                                <Badge variant="outline" className="animate-pulse border-primary text-primary font-black px-3">INVESTOR VIEW</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10 space-y-8">
                            <div className="flex items-center justify-between border-b-2 border-dashed pb-8">
                                <div>
                                    <p className="text-5xl font-black text-green-500 tracking-tighter">-14.2%</p>
                                    <p className="text-[11px] uppercase font-black text-muted-foreground tracking-[0.2em] mt-1">Custos Operacionais</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-5xl font-black text-primary tracking-tighter">96.5%</p>
                                    <p className="text-[11px] uppercase font-black text-muted-foreground tracking-[0.2em] mt-1">Conformidade GPS</p>
                                </div>
                            </div>
                            <div className="p-6 bg-primary/5 rounded-2xl border-2 border-primary/10 relative shadow-inner">
                                <Sparkles className="absolute right-4 top-4 h-6 w-6 text-primary/40" />
                                <p className="text-[11px] font-black uppercase text-primary mb-2 tracking-widest">Algoritmo Guardian</p>
                                <p className="text-sm text-foreground/80 italic leading-relaxed font-medium">
                                    "Identificada economia de 1.4km na Rota Sul através do redimensionamento dinâmico após aviso de falta via App. <span className="text-primary font-bold">ROI: R$ 8,12 economizados nesta viagem.</span>"
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Seção Problema - Curto e Direto */}
        <section id="problema" className="w-full py-24 border-t">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-4xl font-black mb-16 uppercase italic tracking-tighter">O Custo da <span className="text-destructive">Ineficiência</span></h2>
                <div className="grid md:grid-cols-3 gap-12">
                    <StatCardSmall icon={<TrendingDown className="h-10 w-10 text-red-500" />} title="Desvio de Rota" description="Vans rodando quilômetros extras desnecessários sem supervisão centralizada." />
                    <StatCardSmall icon={<Gauge className="h-10 w-10 text-orange-500" />} title="Manutenção Reativa" description="Consertos emergenciais custam 40% mais que a prevenção via telemetria." />
                    <StatCardSmall icon={<HeartPulse className="h-10 w-10 text-primary" />} title="Risco de Saúde" description="Monitoramento de alergias e condições críticas que previne incidentes graves." />
                </div>
            </div>
        </section>

        {/* CTA Section Final */}
        <section className="w-full py-32 bg-background relative overflow-hidden">
            <div className="absolute inset-0 bg-primary/5 -z-10" />
            <div className="container mx-auto text-center px-4">
                 <h2 className="text-5xl font-black sm:text-6xl uppercase tracking-tighter italic leading-none mb-8">Vamos liderar essa <span className="text-primary">transformação</span>?</h2>
                 <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-xl mb-12 font-medium">
                    A primeira plataforma de gestão que coloca o dinheiro de volta no bolso do frotista através de dados reais.
                </p>
                <div className="flex justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 text-xl font-black uppercase italic shadow-2xl shadow-primary/20">
                        <Link href="/">Entrar no Sistema</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t px-4 bg-muted/30">
        <div className="container mx-auto py-10 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-6">
          <p className="font-bold">&copy; {new Date().getFullYear()} Guardian. Direitos Reservados.</p>
          <div className="flex items-center gap-3">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="font-black uppercase italic text-[11px] tracking-widest text-primary">Inteligência Operacional p/ Transporte Escolar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const StatCardSmall = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="space-y-4">
        <div className="mx-auto bg-muted/50 p-5 rounded-full w-fit border-2 border-border/50">{icon}</div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter">{title}</h3>
        <p className="text-muted-foreground font-medium leading-relaxed max-w-xs mx-auto">{description}</p>
    </div>
);
