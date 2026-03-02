
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
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
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
          <div className="container mx-auto text-center px-4">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              A jornada do seu filho, <span className="text-primary">protegida e otimizada.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg text-muted-foreground md:text-xl">
              A primeira plataforma de inteligência operacional com Big Data de escolas. Reduza custos, aumente a segurança e tenha o controle total da sua frota com setup instantâneo.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/">Agendar uma Demonstração</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/presentation">Ver Pitch Deck</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* The Problem Section */}
        <section id="problema" className="w-full py-20 md:py-28">
            <div className="container mx-auto px-4">
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

        {/* Comparison Section (The Differentiator) */}
        <section className="w-full py-20 bg-primary/5">
            <div className="container mx-auto px-4">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <Badge className="mb-4">Diferencial de Mercado</Badge>
                        <h2 className="text-3xl font-bold mb-6">Por que o Guardian é único?</h2>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg h-fit"><Database className="text-primary"/></div>
                                <div>
                                    <h4 className="font-bold">Base Nacional de Escolas</h4>
                                    <p className="text-sm text-muted-foreground">Possuímos uma base proprietária de escolas ativas. Cadastre instituições instantaneamente sem depender apenas de APIs pagas.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg h-fit"><Zap className="text-primary"/></div>
                                <div>
                                    <h4 className="font-bold">Onboarding Expresso</h4>
                                    <p className="text-sm text-muted-foreground">Cadastre novos alunos em 2 minutos via OCR de documentos e busca regionalizada inteligente. Menos burocracia, mais lucro.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg h-fit"><ShieldCheck className="text-primary"/></div>
                                <div>
                                    <h4 className="font-bold">Soberania de Dados</h4>
                                    <p className="text-sm text-muted-foreground">Geocodificação validada e GPS de alta precisão. Garantimos que a van nunca se perca ou siga para o portão errado.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <Card className="border-primary/20 shadow-2xl overflow-hidden">
                        <CardHeader className="bg-secondary/50">
                            <CardTitle className="text-lg">Dashboard de Performance</CardTitle>
                            <CardDescription>Visualização real da frota</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <p className="text-2xl font-bold text-green-500">-14.2%</p>
                                    <p className="text-xs text-muted-foreground">Economia de Combustível</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-primary">94.5%</p>
                                    <p className="text-xs text-muted-foreground">Adesão à Rota</p>
                                </div>
                            </div>
                            <div className="bg-muted rounded-md h-32 flex items-center justify-center italic text-xs text-muted-foreground text-center px-8">
                                "A IA detectou desvio recorrente na Rua Augusta. Sugestão: Alterar ordem de coleta para evitar obras."
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container mx-auto px-4">
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
                     <Image src="https://picsum.photos/seed/analytics-ui/600/400" alt="Dashboard ROI" fill style={{ objectFit: 'cover' }} data-ai-hint="dashboard data" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Activity} title="Analytics Planejado vs. Real" description="Veja exatamente onde sua van economizou quilometragem em relação ao planejado pela IA." />
                    <FeatureItem icon={Database} title="Base Nacional de Escolas" description="Cadastro rápido de instituições através de nossa inteligência de dados regionalizada." />
                    <FeatureItem icon={DollarSign} title="Faturamento Automatizado" description="Geração de faturas e lembretes inteligentes via WhatsApp com base na presença confirmada." />
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
                     <Image src="https://picsum.photos/seed/crew-app/600/400" alt="App Equipe" fill style={{ objectFit: 'cover' }} data-ai-hint="mobile app interface" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={HeartPulse} title="Alertas Médicos no Embarque" description="Identificação visual imediata de alunos com alergias ou necessidades especiais durante o check-in." />
                    <FeatureItem icon={QrCode} title="Check-in por Telemetria" description="Registro de embarque que valida a posição GPS da van com o endereço do aluno, garantindo conformidade." />
                    <FeatureItem icon={ShieldCheck} title="Modo Offline Inteligente" description="Funcionamento total sem internet, com sincronização automática de dados de telemetria." />
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
                     <Image src="https://picsum.photos/seed/parent-app/600/400" alt="App Pais" fill style={{ objectFit: 'cover' }} data-ai-hint="tracking app" />
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

        {/* CTA Section */}
        <section id="cta" className="w-full py-20 md:py-28 bg-primary/5">
            <div className="container mx-auto text-center px-4">
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
      <footer className="w-full border-t px-4">
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
  <div className="flex items-start gap-4 text-left">
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
