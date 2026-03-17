
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Bot,
  Database,
  TrendingDown,
  Gauge,
  Zap,
  ArrowDownRight,
  CheckCircle,
  Activity,
  ShieldCheck,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20">
      {/* Header Responsivo */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
          <Link href="/login" className="flex items-center gap-2 font-bold group">
            <Rocket className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
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
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-secondary/10">
          <div className="container mx-auto px-4">
            <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
              <Badge variant="outline" className="px-4 py-1 border-primary/30 text-primary font-black uppercase tracking-widest text-[10px]">
                Inteligência para Transporte Escolar
              </Badge>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter leading-none uppercase italic">
                A era do rastreio passivo <span className="text-primary">acabou.</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-xl text-muted-foreground font-medium">
                Guardian é a plataforma de <span className="text-foreground font-bold">Telemetria ROI</span> que utiliza IA Generativa para provar sua eficiência operacional e financeira.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-lg font-bold uppercase italic" asChild>
                  <Link href="/">Acessar Sistema</Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg font-bold uppercase italic border-2" asChild>
                  <Link href="/presentation">Ver Pitch Deck <ArrowDownRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Diferenciais Técnicos */}
        <section id="diferenciais" className="w-full py-20 border-y">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-2">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Vantagem <span className="text-primary">Competitiva</span></h2>
                    <p className="text-muted-foreground max-w-xl mx-auto">Tecnologia desenhada para eliminar a burocracia e maximizar a margem de lucro.</p>
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

        {/* ROI Showdown */}
        <section className="w-full py-20 bg-primary/[0.02]">
            <div className="container mx-auto px-4">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Badge className="bg-primary text-primary-foreground font-bold">ARQUITETURA FINOPS</Badge>
                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-tight">Engenharia de <span className="text-primary">Escala</span></h2>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Reduzimos o custo de software a quase zero. Nossa abordagem híbrida de telemetria consome 70% menos recursos, garantindo lucratividade mesmo com frotas gigantes.
                        </p>
                        <div className="space-y-3">
                            <BenefitItem text="Cálculo de Proximidade (800m) local via Haversine (Custo Zero)." />
                            <BenefitItem text="Geração de contratos automáticos adaptados à modalidade." />
                            <BenefitItem text="Itinerário otimizado reduzindo distância em até 12%." />
                        </div>
                    </div>
                    <div className="relative">
                        <div className="bg-card rounded-2xl p-8 border shadow-2xl overflow-hidden">
                            <div className="flex items-center gap-4 border-b border-dashed pb-6 mb-6">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary"><Activity size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Live ROI Monitor</p>
                                    <p className="text-lg font-bold italic uppercase">Eficiência de Rota</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b pb-4">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">KM Planejado (IA)</p>
                                        <p className="text-2xl font-black tracking-tighter">42.4 km</p>
                                    </div>
                                    <ArrowDownRight className="text-muted-foreground opacity-20 mb-1" />
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">KM Real (GPS)</p>
                                        <p className="text-2xl font-black tracking-tighter text-green-500">38.1 km</p>
                                    </div>
                                </div>
                                <div className="pt-2 text-center">
                                    <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Economia Direta</p>
                                    <p className="text-4xl font-black tracking-tighter italic">R$ 24,94 <span className="text-lg text-muted-foreground not-italic">/viagem</span></p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-24 bg-secondary/5">
            <div className="container mx-auto text-center px-4">
                 <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter italic leading-none mb-8">O próximo passo é <span className="text-primary">seu.</span></h2>
                 <p className="max-w-xl mx-auto text-muted-foreground text-lg mb-10">
                    Junte-se à frota que está redefinindo a lucratividade no transporte escolar através de dados reais.
                </p>
                <Button asChild size="lg" className="h-16 px-12 text-xl font-bold uppercase italic shadow-2xl">
                    <Link href="/">Começar Agora</Link>
                </Button>
            </div>
        </section>
      </main>

      <footer className="w-full border-t py-12 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 font-bold opacity-50">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="uppercase italic tracking-tighter">Guardian</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">&copy; {new Date().getFullYear()} - Inteligência para Transporte Escolar</p>
          <div className="flex items-center gap-6">
            <Link href="/presentation" className="text-xs font-bold uppercase hover:text-primary transition-colors">Pitch Deck</Link>
            <Link href="/login" className="text-xs font-bold uppercase hover:text-primary transition-colors">Diferenciais</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border-2 bg-background hover:border-primary/40 transition-all group">
            <CardHeader>
                <div className="p-3 bg-secondary rounded-xl w-fit mb-2 group-hover:bg-primary/10 transition-colors">
                    {icon}
                </div>
                <CardTitle className="text-xl font-black uppercase tracking-tight italic">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500 h-5 w-5 shrink-0" />
            <span className="font-bold text-sm uppercase tracking-tight">{text}</span>
        </div>
    );
}
