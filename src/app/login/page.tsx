
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Rocket,
  Shield,
  Car,
  Users,
  ClipboardCheck,
  ArrowRight,
  ArrowDownRight,
  Bot,
  TrendingDown,
  Zap,
  ExternalLink,
  MessageSquare,
  ChevronRight,
  Sparkles,
  FileText,
  DollarSign,
  Milestone,
  CheckCircle2,
  Activity,
  HeartPulse,
  QrCode,
  MapPin,
  X,
  Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { cn } from '@/lib/utils';

export default function LandingPage() {
  const getImg = (id: string) => PlaceHolderImages.find(img => img.id === id);

  const modules = [
    {
      id: 'gestor',
      icon: <Shield className="h-5 w-5" />,
      title: "Painel do Gestor",
      subtitle: "Inteligência & ROI",
      badge: "ADMIN",
      features: ["Faturamento Automático", "Triagem OCR (Gemini)", "Contratos Digitais", "Base INEP (190k Escolas)", "Mural de Avisos", "Auditoria de KM"],
      description: "Controle total da saúde financeira e administrativa da frota com automação de ponta.",
      images: [getImg('ob-15-triage'), getImg('ob-14-notification'), getImg('ob-10-finance'), getImg('ob-11-summary')]
    },
    {
      id: 'motorista',
      icon: <Car className="h-5 w-5" />,
      title: "App do Motorista",
      subtitle: "Logística Otimizada",
      badge: "DRIVER",
      features: ["GPS em Tempo Real", "Itinerário IA", "Relato de Incidentes", "Modo Pausa", "Navegação Assistida", "Histórico de Viagens"],
      description: "Redução de custos com rotas calculadas para menor consumo e máxima pontualidade.",
      images: [getImg('ob-16-gps'), getImg('ob-7-address'), getImg('ob-4-scan')]
    },
    {
      id: 'monitor',
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Módulo do Monitor",
      subtitle: "Segurança de Bordo",
      badge: "ASSISTANT",
      features: ["Alertas Médicos Críticos", "Checklist Visual", "Check-in por QR Code", "Contatos de Emergência", "Mensagens Rápidas"],
      description: "Zero papel no embarque com identificação por foto e controle de saúde em tempo real.",
      images: [getImg('ob-12-health'), getImg('ob-9-class'), getImg('ob-5-identity')]
    },
    {
      id: 'pais',
      icon: <Users className="h-5 w-5" />,
      title: "Portal dos Pais",
      subtitle: "Transparência Total",
      badge: "PARENT",
      features: ["Mapa ao Vivo", "Alerta 800m", "Viagens Avulsas", "Pagamento Pix", "Assinatura Digital", "Chat Direto"],
      description: "Tranquilidade absoluta para a família com acompanhamento em tempo real da jornada escolar.",
      images: [getImg('ob-3-welcome'), getImg('ob-17-sign'), getImg('ob-6-contact'), getImg('ob-13-done')]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground selection:bg-primary/20 antialiased">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
          <Link href="/login" className="flex items-center gap-2 font-bold group">
            <Rocket className="h-6 w-6 text-primary transition-transform group-hover:scale-110" />
            <span className="uppercase italic tracking-tighter text-xl text-foreground">Guardian</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#modulos" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Funcionalidades</Link>
            <Link href="#comparativo" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Comparativo</Link>
            <Button asChild size="sm" className="font-bold h-9">
              <Link href="/">Acessar Painel</Link>
            </Button>
          </nav>
          <Button variant="ghost" size="sm" className="md:hidden font-bold" asChild>
            <Link href="/">Entrar</Link>
          </Button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full py-20 lg:py-32 overflow-hidden border-b bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
              <Badge variant="outline" className="px-4 py-1.5 border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5">
                Inteligência de Ativos Escolares
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase italic">
                O Cérebro da sua <span className="text-primary">Operação.</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-2xl text-muted-foreground font-medium leading-relaxed">
                Maximize o lucro com <span className="text-foreground font-bold italic">Telemetria ROI</span> e garanta segurança total com IA Generativa.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic shadow-2xl shadow-primary/20" asChild>
                  <Link href="/">Acessar Plataforma <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic border-2" asChild>
                  <Link href="/presentation">Ver Pitch de Negócio <ArrowDownRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Modules Section */}
        <section id="modulos" className="w-full py-24 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-primary">Plataforma 360°</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-medium uppercase text-xs tracking-widest">Tecnologia especializada para cada agente do ecossistema</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
              {modules.map((m) => (
                <ModuleCard key={m.id} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* NEW: Comparativo de Mercado Section */}
        <section id="comparativo" className="w-full py-24 bg-background border-b overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-primary">Por que o Guardian?</h2>
                    <p className="text-muted-foreground max-w-2xl mx-auto font-medium uppercase text-xs tracking-widest">O comparativo técnico que define a liderança</p>
                </div>

                <div className="max-w-5xl mx-auto overflow-x-auto rounded-3xl border-2 border-primary/10 shadow-2xl bg-muted/5">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b-2 border-primary/10 bg-primary/5">
                                <th className="p-6 text-sm font-black uppercase tracking-widest">Recurso Estratégico</th>
                                <th className="p-6 text-sm font-black uppercase tracking-widest text-muted-foreground/60">Apps Tradicionais</th>
                                <th className="p-6 text-sm font-black uppercase tracking-widest text-primary italic">Guardian Intelligence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            <ComparisonRow 
                                feature="Cadastro de Alunos" 
                                traditional="Manual e demorado (Erro Humano)" 
                                guardian="Leitura via OCR Gemini (30 segundos)" 
                                isWin={true} 
                            />
                            <ComparisonRow 
                                feature="Base de Escolas" 
                                traditional="Cadastro manual repetitivo" 
                                guardian="190 mil escolas INEP integradas" 
                                isWin={true} 
                            />
                            <ComparisonRow 
                                feature="Consumo de Dados/Bateria" 
                                traditional="Alto (Transmissão contínua)" 
                                guardian="Delta de Telemetria (-70% de carga)" 
                                isWin={true} 
                            />
                            <ComparisonRow 
                                feature="Roteirização" 
                                traditional="Estática ou baseada em experiência" 
                                guardian="IA Otimizadora (Economia de Diesel)" 
                                isWin={true} 
                            />
                            <ComparisonRow 
                                feature="Faturamento" 
                                traditional="Controle em planilhas ou manual" 
                                guardian="Automático com Pix e Conciliação" 
                                isWin={true} 
                            />
                            <ComparisonRow 
                                feature="Segurança de Bordo" 
                                traditional="Nenhuma ou lista de papel" 
                                guardian="Alertas Médicos Críticos e Foto Aluno" 
                                isWin={true} 
                            />
                        </tbody>
                    </table>
                </div>
            </div>
        </section>

        {/* Prova de ROI */}
        <section className="w-full py-24 bg-primary/5 border-b">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <Badge className="bg-primary text-white font-black">PROVA DE VALOR</Badge>
                        <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                            Menos Diesel, <br/>Mais <span className="text-primary">Rentabilidade.</span>
                        </h2>
                        <p className="text-muted-foreground text-lg">
                            Nosso algoritmo de otimização de rota reduz em média 12% a quilometragem diária da frota, gerando economia imediata de combustível e manutenção.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-background rounded-xl border border-primary/20">
                                <p className="text-3xl font-black text-primary italic">-12%</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">KM Rodado/Mês</p>
                            </div>
                            <div className="p-4 bg-background rounded-xl border border-primary/20">
                                <p className="text-3xl font-black text-primary italic">Zero</p>
                                <p className="text-[10px] font-bold uppercase text-muted-foreground">Inadimplência Pix</p>
                            </div>
                        </div>
                    </div>
                    <div className="relative aspect-video rounded-3xl overflow-hidden border-4 border-primary/20 shadow-2xl">
                        <Image 
                            src="https://lh3.googleusercontent.com/d/1i2uAifpZptoHOGO7MRox0C-YklPCc37O" 
                            alt="ROI Map" 
                            fill 
                            unoptimized 
                            className="object-cover"
                            data-ai-hint="gps map"
                        />
                    </div>
                </div>
            </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-32 bg-background text-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none mb-10">
              Transforme sua <br/><span className="text-primary">Van em Empresa.</span>
            </h2>
            <Button asChild size="lg" className="h-20 px-16 text-xl font-black uppercase italic shadow-2xl hover:scale-105 transition-transform">
              <Link href="/">Começar Agora <ArrowRight className="ml-3 h-6 w-6" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-12 px-4 bg-muted/20">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-2 font-bold opacity-50">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="uppercase italic tracking-tighter">Guardian</span>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} - Inteligência para Transporte Escolar
          </p>
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({ icon, title, subtitle, description, images, badge, features }: { icon: React.ReactNode, title: string, subtitle: string, description: string, images: any[], badge: string, features: string[] }) {
  return (
    <Card className="border-2 border-border/50 bg-background hover:border-primary/40 transition-all group overflow-hidden flex flex-col shadow-xl">
      {/* 1. FOTO EM DESTAQUE (CARROSSEL) */}
      <div className="relative aspect-video w-full bg-black/5 overflow-hidden border-b">
        <Carousel 
          opts={{ loop: true, align: "start" }} 
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
          className="w-full h-full"
        >
          <CarouselContent className="-ml-0">
            {images.map((img, index) => (
              <CarouselItem key={index} className="pl-0 basis-full">
                <div className="relative aspect-video w-full h-full p-2">
                  <div className="relative w-full h-full rounded-lg overflow-hidden border shadow-2xl bg-background">
                    <Image 
                        src={img?.imageUrl || "https://picsum.photos/seed/placeholder/800/450"} 
                        alt={img?.description || title}
                        fill
                        unoptimized
                        className="object-contain"
                        data-ai-hint={img?.imageHint || "app screen"}
                    />
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-primary text-white font-black text-[9px] tracking-widest uppercase px-3 py-1 shadow-lg">{badge}</Badge>
        </div>
      </div>

      {/* 2. RESUMO E FUNCIONALIDADES */}
      <CardContent className="p-6 md:p-8 flex-1 flex flex-col bg-muted/5">
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">{icon}</div>
                <div>
                    <p className="text-xl font-black uppercase italic leading-none tracking-tighter">{title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{subtitle}</p>
                </div>
            </div>
            
            <p className="text-muted-foreground leading-relaxed font-medium text-sm">{description}</p>

            <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground border-b pb-1">Funcionalidades Chave</p>
                <div className="flex flex-wrap gap-1.5">
                    {features.map((f, i) => (
                        <Badge key={i} variant="secondary" className="text-[9px] font-bold py-0.5 px-2 bg-background border border-primary/10">
                            {f}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
        <Button variant="ghost" className="w-fit p-0 h-auto mt-8 text-xs font-black uppercase tracking-widest text-primary hover:bg-transparent hover:translate-x-2 transition-all" asChild>
          <Link href="/">
            Ver na prática <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ComparisonRow({ feature, traditional, guardian, isWin }: { feature: string, traditional: string, guardian: string, isWin: boolean }) {
    return (
        <tr className="group hover:bg-primary/5 transition-colors">
            <td className="p-6">
                <p className="text-xs font-black uppercase tracking-tight text-foreground">{feature}</p>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-medium">
                    <X className="h-3.5 w-3.5" />
                    <span>{traditional}</span>
                </div>
            </td>
            <td className="p-6">
                <div className={cn(
                    "flex items-center gap-2 text-xs font-bold",
                    isWin ? "text-primary" : "text-foreground"
                )}>
                    <Check className="h-4 w-4" />
                    <span>{guardian}</span>
                </div>
            </td>
        </tr>
    );
}
