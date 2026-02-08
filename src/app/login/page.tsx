
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
              Somos a plataforma de inteligência operacional para transporte escolar. Reduza custos, aumente a segurança e centralize sua comunicação. Chega de caos no WhatsApp.
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
                    O mercado de transporte escolar ainda opera com ferramentas que geram mais trabalho, custos e incerteza. Nós atacamos os principais pontos de perda.
                </p>
                <div className="mt-12 grid md:grid-cols-3 gap-8">
                    <StatCard 
                        icon={<Wallet size={32} />} 
                        title="Ineficiência de Rotas" 
                        value="-20% em custos"
                        description="Potencial de redução em combustível e manutenção ao trocar rotas manuais por trajetos otimizados por IA."
                    />
                    <StatCard 
                        icon={<Briefcase size={32} />} 
                        title="Risco Operacional e Legal" 
                        value="Incalculável"
                        description="A falta de um registro formal e a comunicação desorganizada elevam o risco de incidentes e a desconfiança dos pais."
                    />
                    <StatCard 
                        icon={<MessageSquareX size={32} />} 
                        title="Comunicação Fragmentada" 
                        value="5+ horas/semana"
                        description="Tempo médio que um gestor perde em múltiplos grupos de WhatsApp, lidando com cobranças, avisos e conflitos."
                    />
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28 bg-secondary/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">
              Uma Plataforma Completa para Cada Elo da Jornada
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-muted-foreground md:text-lg">
              Oferecemos painéis e aplicativos dedicados para gestores, motoristas e pais, centralizando toda a operação em um único lugar seguro e eficiente.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature Card: Gestor */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Bot className="text-primary"/>Painel do Gestor</CardTitle>
                  <CardDescription>O centro de comando para máxima eficiência e controle total.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/dashboard-ui/600/400" alt="Painel do Gestor" fill objectFit="cover" data-ai-hint="dashboard analytics" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Sparkles} title="Planejador de Rota Otimizado" description="Crie rotas eficientes em segundos para reduzir custos de combustível e tempo no trânsito." />
                    <FeatureItem icon={DollarSign} title="Gestão Financeira Inteligente" description="Gere faturas mensais, envie lembretes de pagamento e recibos automáticos via WhatsApp, e defina dias de vencimento personalizados por cliente." />
                    <FeatureItem icon={Users} title="Comunicação e Gestão Centralizada" description="Tenha uma visão 360° da sua frota, motoristas, monitores e alunos, com canais de comunicação diretos." />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Motorista & Monitor */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Car className="text-primary"/>App do Motorista e Monitor</CardTitle>
                  <CardDescription>O copiloto digital para uma rotina mais segura e tranquila.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/driver-panel-ui/600/400" alt="Painel do Motorista" fill objectFit="cover" data-ai-hint="mobile interface" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={CheckCircle} title="Plano de Rota Interativo" description="Receba a rota otimizada no app com a sequência de paradas e informações de cada aluno em um toque." />
                    <FeatureItem icon={QrCode} title="Controle de Embarque com 1 Clique ou QR Code" description="Registre a entrada e saída de cada aluno de forma rápida e segura, com um toque ou escaneando o QR Code, notificando pais e gestores instantaneamente." />
                    <FeatureItem icon={ShieldCheck} title="Operação Ininterrupta (Modo Offline)" description="O aplicativo continua funcionando mesmo sem internet. As informações são salvas e sincronizadas automaticamente quando a conexão retorna." />
                    <FeatureItem icon={Shield} title="Comunicação Direta e Focada" description="Converse com pais e gestores dentro do app com mensagens predefinidas para agilizar o dia a dia." />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Pais */}
              <Card className="flex flex-col border-primary/20 shadow-lg hover:shadow-primary/20 hover:scale-[1.02] transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Users className="text-primary"/>App dos Pais</CardTitle>
                  <CardDescription>A tranquilidade e o controle que você sempre quis.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                   <div className="relative aspect-video rounded-md overflow-hidden border">
                     <Image src="https://picsum.photos/seed/parent-tracking/600/400" alt="Painel dos Pais" fill objectFit="cover" data-ai-hint="map view mobile" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Map} title="Acompanhamento em Tempo Real" description="Saiba exatamente onde a van está no mapa e receba alertas inteligentes quando ela estiver se aproximando." />
                    <FeatureItem icon={BellRing} title="Notificações e Lembretes de Pagamento" description="Receba lembretes automáticos de faturas para não perder o vencimento." />
                    <FeatureItem icon={FileText} title="Documentos e Autorizações" description="Visualize e aceite contratos, e gerencie pessoas autorizadas para a retirada do seu filho." />
                    <FeatureItem icon={DollarSign} title="Financeiro Transparente e Simples" description="Pague mensalidades, receba recibos automáticos no WhatsApp e solicite viagens avulsas, tudo de forma segura no app." />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Differentiators Section */}
        <section id="diferenciais" className="w-full py-20 md:py-28">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">Nossos Diferenciais: Uma Vantagem Competitiva Real</h2>
             <p className="mt-4 max-w-3xl mx-auto text-center text-muted-foreground md:text-lg">
                Não somos apenas um mapa. Somos uma plataforma de inteligência operacional que gera economia e segurança.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Sparkles className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Planejamento de Rota Inteligente</h3>
                    <p className="mt-2 text-muted-foreground">Nossa ferramenta de planejamento analisa suas paradas para criar a rota mais econômica em tempo e dinheiro, dando ao gestor controle total sobre o percurso mais eficiente.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <ShieldCheck className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Confiabilidade e Segurança</h3>
                    <p className="mt-2 text-muted-foreground">Com funcionalidades como check-in por QR Code e operação offline, garantimos que o sistema funcione de forma confiável e segura em todas as situações, aumentando a tranquilidade de todos.</p>
                </div>
                <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                        <Users className="h-8 w-8" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold">Ecossistema 360° Integrado</h3>
                    <p className="mt-2 text-muted-foreground">Conectamos gestores, motoristas, monitores e pais em uma única plataforma, eliminando a necessidade de apps fragmentados e criando uma fonte única de verdade para toda a operação.</p>
                </div>
            </div>
          </div>
        </section>

        {/* Competitive Analysis Section */}
        <section id="analise" className="w-full py-20 md:py-28">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl mb-12">
              <BarChart className="inline-block text-primary h-12 w-12 mr-4" />
              Análise Competitiva
            </h2>
            <div className="w-full max-w-4xl mx-auto p-4 bg-background/30 rounded-lg">
              <div className="grid grid-cols-[1fr_2fr_2fr] grid-rows-[1fr_2fr_2fr] gap-2">
                <div className="col-start-2 col-span-2 text-center text-sm font-semibold text-muted-foreground">Foco do Produto</div>
                <div className="row-start-2 row-span-2 flex items-center justify-center text-sm font-semibold text-muted-foreground" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Foco no Cliente</div>
                
                <div className="row-start-2 col-start-2 p-4 border-b border-r border-dashed border-border flex flex-col justify-end items-start">
                  <CompetitorCard title="Apps de Rastreamento (B2C)" description="Focam nos pais, resolvendo apenas a ansiedade da localização. Pouco ou nenhum valor para a gestão da empresa."/>
                </div>
                <div className="row-start-2 col-start-3 p-4 border-b border-dashed border-border flex flex-col justify-end items-end text-right">
                  <div className="p-4 rounded-lg bg-primary/20 border-2 border-primary">
                      <h4 className="font-bold text-primary flex items-center justify-end gap-2"><ShieldCheck/> Guardian</h4>
                      <p className="text-sm text-foreground">Plataforma B2B que integra operações, finanças e comunicação. Valor para a empresa e para os pais.</p>
                  </div>
                </div>
                <div className="row-start-3 col-start-2 p-4 border-r border-dashed border-border flex flex-col justify-start items-start">
                  <CompetitorCard title="WhatsApp e Planilhas" description="Status quo. Gratuito, mas ineficiente, inseguro e caótico. Nosso principal alvo a ser substituído."/>
                </div>
                <div className="row-start-3 col-start-3 p-4 flex flex-col justify-start items-end text-right">
                  <CompetitorCard title="Sistemas de Frota Genéricos" description="Complexos, caros e não especializados no fluxo escolar (pais, alunos, check-in)."/>
                </div>

                <div className="row-start-1 col-start-2 text-center text-xs text-muted-foreground">Ferramenta Simples</div>
                <div className="row-start-1 col-start-3 text-center text-xs text-muted-foreground">Plataforma Integrada</div>
                <div className="row-start-2 col-start-1 text-right text-xs text-muted-foreground">Foco na Gestão (B2B)</div>
                <div className="row-start-3 col-start-1 text-right text-xs text-muted-foreground">Foco nos Pais (B2C)</div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Market Opportunity Section */}
        <section id="mercado" className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container mx-auto">
                 <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">
                    <Target className="inline-block text-primary h-12 w-12 mr-4" />
                    Uma Oportunidade Bilionária e Mal Atendida
                 </h2>
                 <p className="mt-4 max-w-3xl mx-auto text-center text-muted-foreground md:text-lg">
                    Estamos posicionados para capturar uma fatia de um mercado gigante e carente de tecnologia, oferecendo uma solução muito superior ao status quo (WhatsApp e planilhas).
                </p>
                 <div className="mt-12 grid md:grid-cols-3 gap-6 text-center w-full">
                    <div className="bg-background border border-border p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Total (TAM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 4.5 Bi</p>
                        <p className="text-sm text-muted-foreground mt-2">Mercado total de transporte escolar no Brasil (anual).</p>
                    </div>
                     <div className="bg-background border-2 border-primary/50 p-6 rounded-lg ring-4 ring-primary/10">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Endereçável (SAM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 1.3 Bi</p>
                        <p className="text-sm text-muted-foreground mt-2">Empresas privadas em centros urbanos no Brasil, nosso foco inicial.</p>
                    </div>
                     <div className="bg-background border border-border p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Obtível (SOM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 13 Mi</p>
                        <p className="text-sm text-muted-foreground mt-2">Nossa meta inicial: Conquistar 1% do mercado endereçável nos próximos 24 meses.</p>
                    </div>
                 </div>
            </div>
        </section>

        {/* CTA Section */}
        <section id="cta" className="w-full py-20 md:py-28">
            <div className="container mx-auto text-center">
                 <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Pronto para transformar sua operação?</h2>
                 <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                    Agende uma demonstração gratuita e veja na prática como o Guardian pode reduzir seus custos e aumentar sua segurança.
                </p>
                <div className="mt-8 flex justify-center">
                    <Card className="w-full max-w-md border-2 border-primary shadow-2xl shadow-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Plano PRO Completo</CardTitle>
                            <CardDescription>A partir de R$ 9,90 por aluno/mês. Preço justo que escala com seu negócio.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-left space-y-3">
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /><span className="font-medium">Gestão Completa de Cadastros</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /><span className="font-medium">Rastreamento em Tempo Real</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /><span className="font-medium">Comunicação Integrada</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /><span className="font-medium">Planejador de Rotas Inteligente</span></li>
                                <li className="flex items-center gap-3"><CheckCircle className="h-5 w-5 text-primary" /><span className="font-medium">Gestão Financeira Completa</span></li>
                            </ul>
                        </CardContent>
                        <CardFooter>
                           <Button asChild size="lg" className="w-full">
                                <Link href="/">Agendar Demonstração</Link>
                           </Button>
                        </CardFooter>
                    </Card>
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
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive border-2 border-destructive/20 mb-4">
            {icon}
        </div>
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-4xl font-bold text-primary my-2">{value}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);

const CompetitorCard = ({ title, description }: { title: string, description: string }) => (
    <div className="bg-background/50 p-4 rounded-lg border border-border">
        <h4 className="font-semibold text-primary">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);
