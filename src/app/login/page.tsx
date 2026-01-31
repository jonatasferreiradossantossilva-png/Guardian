import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, Car, Bot, Shield, DollarSign, BarChart, Rocket } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Rocket className="h-6 w-6 text-primary" />
            <span>Guardian</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="#features">Funcionalidades</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="#pricing">Preços</Link>
            </Button>
            <Button asChild>
              <Link href="/">Entrar</Link>
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40 bg-secondary/50">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-extrabold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
              A jornada do seu filho, <span className="text-primary">protegida em tempo real.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground md:text-xl">
              Transforme a gestão do transporte escolar com otimização de rotas por IA, comunicação integrada e tranquilidade para os pais.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/">Começar Agora</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/presentation">Ver Apresentação</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-20 md:py-28">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center sm:text-4xl md:text-5xl">
              Uma Plataforma Completa para Todos
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-center text-muted-foreground md:text-lg">
              Soluções dedicadas para cada perfil, centralizando a operação em um único lugar.
            </p>
            <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature Card: Gestor */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><BarChart className="text-primary"/> Para o Gestor</CardTitle>
                  <CardDescription>Visão 360° e eficiência máxima.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden">
                     <Image src="https://picsum.photos/seed/gestor-dashboard/600/400" alt="Painel do Gestor" layout="fill" objectFit="cover" data-ai-hint="dashboard analytics" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Bot} text="Otimizador de Rotas com IA" />
                    <FeatureItem icon={DollarSign} text="Gestão Financeira Simplificada" />
                    <FeatureItem icon={Users} text="Cadastro Centralizado" />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Motorista & Auxiliar */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Car className="text-primary"/> Para Motorista e Auxiliar</CardTitle>
                  <CardDescription>Rotas claras e comunicação direta.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                  <div className="relative aspect-video rounded-md overflow-hidden">
                     <Image src="https://picsum.photos/seed/driver-app/600/400" alt="Painel do Motorista" layout="fill" objectFit="cover" data-ai-hint="mobile app" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={CheckCircle} text="Plano de Rota Interativo" />
                    <FeatureItem icon={Users} text="Controle de Embarque e Desembarque" />
                    <FeatureItem icon={Shield} text="Comunicação Direta com Pais e Gestão" />
                  </div>
                </CardContent>
              </Card>

              {/* Feature Card: Pais */}
              <Card className="flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3"><Users className="text-primary"/> Para os Pais</CardTitle>
                  <CardDescription>Tranquilidade e controle na palma da mão.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 justify-between space-y-4">
                   <div className="relative aspect-video rounded-md overflow-hidden">
                     <Image src="https://picsum.photos/seed/parent-app/600/400" alt="Painel dos Pais" layout="fill" objectFit="cover" data-ai-hint="map tracking" />
                  </div>
                  <div className="space-y-4 pt-4">
                    <FeatureItem icon={Shield} text="Acompanhamento em Tempo Real" />
                    <FeatureItem icon={CheckCircle} text="Status do Aluno (Embarque/Desembarque)" />
                    <FeatureItem icon={DollarSign} text="Gestão de Pagamentos e Viagens Avulsas" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Pricing Section */}
        <section id="pricing" className="w-full py-20 md:py-28 bg-secondary/50">
            <div className="container mx-auto text-center">
                 <h2 className="text-3xl font-bold sm:text-4xl md:text-5xl">Preço simples e escalável</h2>
                 <p className="mt-4 max-w-xl mx-auto text-muted-foreground md:text-lg">
                    Comece hoje e escale conforme sua frota cresce. Sem surpresas.
                </p>
                <div className="mt-12 flex justify-center">
                    <Card className="max-w-md border-2 border-primary shadow-2xl shadow-primary/10">
                        <CardHeader>
                            <CardTitle className="text-xl">Plano PRO</CardTitle>
                            <CardDescription>Tudo que você precisa para uma operação de ponta.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-5xl font-bold">R$ 89</p>
                            <p className="text-muted-foreground font-medium">por veículo / mês</p>
                            <ul className="text-left space-y-3 mt-8">
                                <FeatureItem icon={CheckCircle} text="Gestão Completa de Cadastros" />
                                <FeatureItem icon={CheckCircle} text="Rastreamento em Tempo Real" />
                                <FeatureItem icon={CheckCircle} text="Comunicação Integrada" />
                                <FeatureItem icon={CheckCircle} text="Otimizador de Rotas com IA" />
                                <FeatureItem icon={CheckCircle} text="Gestão Financeira Completa" />
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="w-full border-t">
        <div className="container mx-auto py-6 flex justify-between items-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Guardian. Todos os direitos reservados.</p>
          <div className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            <span>Powered by Innovation</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const FeatureItem = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-3">
    <Icon className="h-5 w-5 text-primary" />
    <span className="font-medium text-foreground">{text}</span>
  </div>
);