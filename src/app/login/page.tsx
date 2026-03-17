
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
        {/* Hero Section */}
        <section className="w-full py-24 md:py-32 lg:py-48 bg-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[grid-line] opacity-10" />
          <div className="container mx-auto text-center px-4 relative z-10">
            <Badge className="mb-6 bg-primary/10 text-primary border-primary/20 font-black tracking-[0.2em] px-4 py-1">INTELIGÊNCIA PARA TRANSPORTE ESCOLAR</Badge>
            <h1 className="text-5xl font-black tracking-tighter sm:text-6xl md:text-7xl lg:text-8xl uppercase italic leading-none">
              A era do <span className="text-primary">rastreio passivo</span> acabou.
            </h1>
            <p className="mx-auto mt-8 max-w-3xl text-xl text-muted-foreground md:text-2xl font-medium leading-relaxed">
              Guardian é a primeira plataforma de inteligência que utiliza IA Generativa e Telemetria de alta precisão para provar o seu ROI.
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

        {/* Detalhes Técnicos e Diferenciais */}
        <section id="diferenciais" className="w-full py-24 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-4">Nossos <span className="text-primary">Diferenciais Únicos</span></h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto">Tecnologia proprietária desenhada para custo zero de software e alta escala operacional.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard 
                        icon={<Bot className="text-primary" />} 
                        title="OCR de Documentos" 
                        description="Extração automática de dados de RG e CNH via Gemini IA para cadastro instantâneo de pais e alunos."
                    />
                    <FeatureCard 
                        icon={<Database className="text-primary" />} 
                        title="Base INEP 190k" 
                        description="Acesso a 190.000 instituições de ensino mapeadas. Cadastro de escolas em um clique sem erro de GPS."
                    />
                    <FeatureCard 
                        icon={<TrendingDown className="text-primary" />} 
                        title="Prova de ROI" 
                        description="Comparativo real entre KM Planejado (IA) e KM Realizado (GPS) para auditoria de economia de combustível."
                    />
                    <FeatureCard 
                        icon={<Gauge className="text-primary" />} 
                        title="Saúde da Frota" 
                        description="Alertas de manutenção preventiva baseados no odômetro real capturado via telemetria delta."
                    />
                </div>
            </div>
        </section>

        {/* Pilares Estratégicos */}
        <section className="w-full py-24 border-t">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div className="space-y-8">
                        <div>
                            <Badge className="mb-4 bg-primary text-primary-foreground font-bold">SOBERANIA DE CUSTO</Badge>
                            <h2 className="text-4xl font-black uppercase italic tracking-tighter leading-none mb-6">Arquitetura <span className="text-primary">FinOps</span></h2>
                            <p className="text-lg text-muted-foreground leading-relaxed">
                                Desenvolvemos uma abordagem híbrida de mapas (Google + OpenStreetMap) e telemetria por delta para garantir que seu custo de software seja próximo a zero no início e mantenha margens altas na escala de 100+ vans.
                            </p>
                        </div>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-foreground/80">Redução de 70% nas escritas de banco de dados via Telemetria Delta.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-foreground/80">Cálculo de Proximidade (800m) local via Haversine, sem custos de API.</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <CheckCircle className="text-green-500 h-6 w-6 shrink-0" />
                                <span className="font-medium text-foreground/80">Geração de faturas e contratos 100% automatizada.</span>
                            </li>
                        </ul>
                    </div>
                    <div className="bg-primary/10 rounded-[2.5rem] p-8 border-2 border-primary/20 shadow-2xl">
                        <div className="bg-background rounded-2xl p-8 space-y-6 shadow-inner">
                            <div className="flex items-center gap-4 border-b pb-4">
                                <div className="p-3 bg-primary/10 rounded-lg text-primary"><Activity /></div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary">Algoritmo Guardian</p>
                                    <p className="text-sm font-bold truncate italic">Otimização de Rota Sul (Manhã)</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">KM Planejado:</span>
                                    <span className="font-mono font-bold">42.4 km</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">KM Realizado:</span>
                                    <span className="font-mono font-bold text-green-500">38.1 km</span>
                                </div>
                                <div className="pt-2 border-t border-dashed">
                                    <p className="text-[10px] uppercase font-black text-green-600 mb-1">ROI Detectado nesta Viagem</p>
                                    <p className="text-2xl font-black tracking-tighter">R$ 24,94 Economizados</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Section */}
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

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border-2 border-border/50 hover:border-primary/30 transition-all group">
            <CardHeader>
                <div className="p-3 bg-secondary rounded-lg w-fit mb-2 group-hover:scale-110 transition-transform">
                    {icon}
                </div>
                <CardTitle className="text-lg font-black uppercase tracking-tight italic">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{description}</p>
            </CardContent>
        </Card>
    );
}
