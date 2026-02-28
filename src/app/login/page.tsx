
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
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
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/login" className="flex items-center gap-2 font-bold">
            <Rocket className="h-6 w-6 text-primary" />
            <span>Guardian</span>
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            <Button variant="ghost" asChild>
              <Link href="#problema">O Problema</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#features">Funcionalidades</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#diferenciais">Diferenciais</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#analise">Análise</Link>
            </Button>
             <Button variant="ghost" asChild>
              <Link href="#mercado">Mercado</Link>
            </Button>
            <Button asChild>
              <Link href="/">Entrar</Link>
            </Button>
          </nav>
           <Button variant="ghost" className="md:hidden" asChild>
              <Link href="/">Entrar</Link>
            </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              A jornada do seu filho, <span className="text-primary">protegida e otimizada.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              Somos a primeira plataforma de inteligência operacional para transporte escolar que prova o ROI através de telemetria e IA. Reduza custos, aumente a segurança e tenha o controle total da sua frota.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="#cta">Agendar uma Demonstração</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/presentation">Ver Pitch Deck</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section id="problema" className="w-full py-20 md:py-28">
            <div className="container mx-auto">
                <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">Sua Operação Está Vazando Dinheiro e Segurança</h2>
                <p className="mt-4 max-w-3xl mx-auto text-center text-muted-foreground md:text-lg">
                    Troque o "achismo" por dados reais. Nós monitoramos cada quilômetro e cada alerta de saúde para garantir uma operação lucrativa e segura.
                </p>
                <div className="mt-12 grid md:grid-cols-3 gap-8">
                    <StatCard 
                        icon={<Activity size={32} />} 
                        title="Fuga de Rota" 
                        value="Redução de 14%"
                        description="Identificamos desvios e rotas ineficientes comparando o planejado com o real via telemetria GPS."
                    />
                    <StatCard 
                        icon={<Gauge size={32} />} 
                        title="Custo de Manutenção" 
                        value="-25% em oficina"
                        description="Nossa manutenção preditiva baseada no KM real evita quebras catastróficas e paradas não planejadas."
                    />
                    <StatCard 
                        icon={<HeartPulse size={32} />} 
                        title="Risco de Saúde" 
                        value="Prevenção Ativa"
                        description="Alertas médicos pulsantes no embarque garantem que condições críticas nunca sejam esquecidas pela equipe."
                    />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">
              Inteligência Completa em Todas as Pontas
            </h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature Card: Gestor */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><BarChart className="text-primary"/>Painel do Gestor (ROI)</CardTitle>
                  <CardDescription>Dados estratégicos para quem decide o futuro da empresa.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/analytics-ui/600/400" alt="Dashboard ROI" fill objectFit="cover" data-ai-hint="dashboard data" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Activity} title="Analytics Planejado vs. Real" description="Veja exatamente onde sua van economizou (ou desperdiçou) quilometragem em relação ao planejado pela IA." />
                    <FeatureItem icon={Gauge} title="Telemetria de Manutenção" description="Monitoramento automático do odômetro para revisões preventivas baseadas no uso real, não em datas fixas." />
                    <FeatureItem icon={DollarSign} title="Faturamento Automatizado" description="Geração de faturas e lembretes inteligentes via WhatsApp com base na presença confirmada no app." />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Motorista & Monitor */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Car className="text-primary"/>App da Equipe de Bordo</CardTitle>
                  <CardDescription>Segurança total e facilidade operacional no dia a dia.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/crew-app/600/400" alt="App Equipe" fill objectFit="cover" data-ai-hint="mobile app interface" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={HeartPulse} title="Alertas Médicos no Embarque" description="Identificação visual imediata de alunos com alergias ou necessidades especiais durante o check-in." />
                    <FeatureItem icon={QrCode} title="Check-in por Telemetria" description="Registro de embarque que valida a posição GPS da van com o endereço do aluno, garantindo conformidade." />
                    <FeatureItem icon={ShieldCheck} title="Modo Offline Inteligente" description="Funcionamento total sem internet, com sincronização automática de dados de telemetria assim que houver sinal." />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Pais */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Users className="text-primary"/>App dos Pais</CardTitle>
                  <CardDescription>Tranquilidade total com a jornada do filho.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                   <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/parent-app/600/400" alt="App Pais" fill objectFit="cover" data-ai-hint="tracking app" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Map} title="Tracking de Alta Precisão" description="Acompanhe a van no mapa com atualizações fluidas e previsão de chegada inteligente." />
                    <FeatureItem icon={BellRing} title="Alerta de Proximidade" description="Notificação automática quando a van entrar no raio de 800m da sua residência." />
                    <FeatureItem icon={FileText} title="Contratos Digitais" description="Visualize e dê o aceite jurídico em contratos de serviço diretamente pela tela do celular." />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Differentiators Section */}
        <section id="diferenciais" className="w-full py-20 md:py-28">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">Por que somos diferentes?</h2>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-lg border">
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Activity className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Foco no Custo/KM</h3>
                    <p className="mt-2 text-muted-foreground">Única plataforma que confronta o planejado com o real, gerando insights diretos de economia de combustível para o dono da frota.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-lg border">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Gauge className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Telemetria de Frota</h3>
                    <p className="mt-2 text-muted-foreground">Manutenção preditiva integrada. O sistema avisa quando a van precisa parar, protegendo seu maior patrimônio.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 bg-secondary/30 rounded-lg border">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <MapPinned className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Cadastro Inteligente</h3>
                    <p className="mt-2 text-muted-foreground">Geocodificação invisível e automática. Sem erros de endereço, sem rotas quebradas. A IA cuida dos dados para você.</p>
                </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="w-full py-20 md:py-28 bg-primary/5">
            <div className="container mx-auto text-center">
                 <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Leve sua frota para a era dos dados</h2>
                 <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg mb-8">
                    Agende uma demonstração e veja como a nossa inteligência operacional pode transformar seus custos em lucro.
                </p>
                <div className="flex justify-center">
                    <Button asChild size="lg" className="h-14 px-12 text-lg">
                        <Link href="/">Agendar Demonstração Gratuita</Link>
                    </Button>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t">
        <div className="container mx-auto py-6 flex flex-col sm:flex-row justify-between items-center text-sm text-muted-foreground gap-4">
          <p>&copy; {new Date().getFullYear()} Guardian. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span>Inteligência para Transporte Escolar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureItem = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
  <div className="flex items-start gap-4">
    <Icon className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
    <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description: string }) => (
    <div className="bg-background/50 rounded-xl p-6 border border-primary/20 backdrop-blur-sm h-full flex flex-col items-center text-center hover:bg-secondary/50 transition-colors">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-4xl font-bold text-primary my-2">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);
