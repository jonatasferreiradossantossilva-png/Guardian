
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
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header Responsivo */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
          <Link href="/login" className="flex items-center gap-2 font-bold group">
            <Rocket className="h-6 w-6 text-primary transition-transform group-hover:scale-110 group-hover:-rotate-12" />
            <span className="uppercase italic tracking-tighter text-xl">Guardian</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#diferenciais" className="text-sm font-bold uppercase tracking-tight hover:text-primary transition-colors">Diferenciais</Link>
            <Link href="/presentation" className="text-sm font-bold uppercase tracking-tight text-primary hover:opacity-80 transition-opacity">Pitch Deck</Link>
            <Button asChild size="sm" className="font-bold">
              <Link href="/">Acessar Plataforma</Link>
            </Button>
          </nav>
           <Button variant="ghost" size="sm" className="md:hidden font-bold" asChild>
              <Link href="/">Entrar</Link>
            </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section - Ultra Impacto e Responsivo */}
        <section className="w-full py-20 md:py-32 lg:py-48 relative overflow-hidden bg-secondary/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
              <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/5 text-primary font-black tracking-[0.25em] uppercase text-[10px] sm:text-xs">
                Inteligência Operacional p/ Frotas
              </Badge>
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] uppercase italic">
                A era do <span className="text-primary drop-shadow-[0_0_15px_rgba(42,176,193,0.3)]">rastreio passivo</span> acabou.
              </h1>
              <p className="max-w-2xl text-lg sm:text-xl md:text-2xl text-muted-foreground font-medium leading-tight">
                Guardian é a plataforma de <span className="text-foreground font-bold">Telemetria ROI</span> que utiliza IA Generativa para provar sua eficiência financeira.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic shadow-2xl shadow-primary/20 hover:scale-105 transition-transform" asChild>
                  <Link href="/">Entrar no Sistema</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic border-2 hover:bg-secondary/50 transition-colors" asChild>
                  <Link href="/presentation">Ver Pitch Deck <ArrowDownRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Pilares Técnicos - Cards Responsivos */}
        <section id="diferenciais" className="w-full py-24 border-y">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Vantagem <span className="text-primary">Competitiva</span></h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto font-medium">Tecnologia proprietária desenhada para eliminar a burocracia e maximizar a margem de lucro.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <FeatureCard 
                        icon={<Bot className="text-primary" />} 
                        title="OCR de Documentos" 
                        description="Extração automática de dados via Gemini IA. Pais fazem o cadastro em segundos via foto do documento."
                    />
                    <FeatureCard 
                        icon={<Database className="text-primary" />} 
                        title="Base INEP 190k" 
                        description="Busca semântica em 190.000 escolas mapeadas. Zero erro de GPS no cadastro de destinos."
                    />
                    <FeatureCard 
                        icon={<TrendingDown className="text-primary" />} 
                        title="Prova de ROI" 
                        description="Auditoria real de economia: KM Planejado (IA) vs. KM Realizado (GPS) com dashboard de lucro."
                    />
                    <FeatureCard 
                        icon={<Gauge className="text-primary" />} 
                        title="Saúde da Frota" 
                        description="Alertas preditivos de manutenção baseados no odômetro real capturado via telemetria delta."
                    />
                </div>
            </div>
        </section>

        {/* ROI Showdown - Visualização de impacto */}
        <section className="w-full py-24 bg-primary/[0.02]">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <Badge className="bg-primary text-primary-foreground font-black px-3 py-1">ARQUITETURA FINOPS</Badge>
                            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">Engenharia de <br/><span className="text-primary">Escala</span></h2>
                            <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                                Reduzimos o custo de software a quase zero. Nossa abordagem híbrida de telemetria consome 70% menos recursos de banco de dados, garantindo soberania de custos mesmo com 100+ vans.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <BenefitItem text="Cálculo de Proximidade (800m) local via Haversine (Custo Zero)." />
                            <BenefitItem text="Geração de contratos automáticos adaptados à modalidade." />
                            <BenefitItem text="Itinerário otimizado reduzindo distância percorrida em até 12%." />
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-blue-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative bg-background rounded-[2rem] p-8 md:p-12 border shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 border-b border-dashed pb-6 mb-6">
                                <div className="p-4 bg-primary/10 rounded-2xl text-primary"><Activity size={32} /></div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live ROI Monitor</p>
                                    <p className="text-lg font-black italic uppercase">Eficiência de Rota Sul</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b pb-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">KM Planejado (IA)</p>
                                        <p className="text-3xl font-black tabular-nums tracking-tighter">42.4 km</p>
                                    </div>
                                    <ArrowDownRight className="text-muted-foreground opacity-20 mb-1" />
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">KM Real (GPS)</p>
                                        <p className="text-3xl font-black tabular-nums tracking-tighter text-green-500">38.1 km</p>
                                    </div>
                                </div>
                                <div className="pt-4 text-center">
                                    <p className="text-xs font-black text-green-600 uppercase tracking-widest mb-2">Impacto Financeiro Direto</p>
                                    <p className="text-5xl font-black tracking-tighter italic">R$ 24,94 <span className="text-xl text-muted-foreground not-italic">/viagem</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-32 bg-secondary/5 relative overflow-hidden">
            <div className="container mx-auto text-center px-4">
                 <h2 className="text-5xl sm:text-7xl font-black uppercase tracking-tighter italic leading-none mb-8">O próximo passo é <span className="text-primary">seu</span>.</h2>
                 <p className="mt-4 max-w-2xl mx-auto text-muted-foreground text-xl mb-12 font-medium">
                    Junte-se à frota que está redefinindo a lucratividade no transporte escolar brasileiro através de dados reais.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Button asChild size="lg" className="h-16 px-12 text-xl font-black uppercase italic shadow-2xl shadow-primary/30">
                        <Link href="/">Começar Agora</Link>
                    </Button>
                </div>
            </div>
        </section>
      </main>

      <footer className="w-full border-t py-12 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold opacity-50">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="uppercase italic tracking-tighter">Guardian</span>
          </div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">&copy; {new Date().getFullYear()} - Inteligência p/ Transporte Escolar</p>
          <div className="flex items-center gap-6">
            <Link href="/presentation" className="text-xs font-black uppercase hover:text-primary transition-colors">Pitch Deck</Link>
            <Link href="/login" className="text-xs font-black uppercase hover:text-primary transition-colors">Sobre</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border-2 bg-background hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {icon}
            </div>
            <CardHeader className="relative z-10">
                <div className="p-3 bg-secondary rounded-xl w-fit mb-2 group-hover:bg-primary/10 transition-colors">
                    {icon}
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight italic">{title}</CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            </CardContent>
        </Card>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-background border hover:border-primary/30 transition-colors">
            <CheckCircle className="text-green-500 h-5 w-5 shrink-0" />
            <span className="font-bold text-sm uppercase tracking-tight">{text}</span>
        </div>
    );
}
