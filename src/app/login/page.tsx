
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
  Database,
  TrendingDown,
  Gauge,
  Zap,
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

export default function LandingPage() {
  const getImg = (id: string) => PlaceHolderImages.find(img => img.id === id);

  const modules = [
    {
      id: 'gestor',
      icon: <Shield className="h-6 w-6" />,
      title: "O Painel do Gestor",
      subtitle: "Visão 360º da Frota",
      badge: "ADMIN",
      description: "Controle financeiro automatizado, auditoria de ROI (KM IA vs KM Real), gestão de contratos digitais e manutenção preditiva da frota.",
      images: [getImg('ob-15-triage'), getImg('ob-14-notification'), getImg('ob-10-finance'), getImg('ob-11-summary')]
    },
    {
      id: 'motorista',
      icon: <Car className="h-6 w-6" />,
      title: "App do Motorista",
      subtitle: "Navegação e Telemetria",
      badge: "DRIVER",
      description: "Itinerário otimizado por IA, telemetria inteligente que economiza dados e GPS integrado que atualiza os pais automaticamente.",
      images: [getImg('ob-16-gps'), getImg('ob-7-address'), getImg('ob-4-scan')]
    },
    {
      id: 'monitor',
      icon: <ClipboardCheck className="h-6 w-6" />,
      title: "Terminal do Monitor",
      subtitle: "Segurança no Embarque",
      badge: "ASSISTANT",
      description: "Checklist visual com fotos dos alunos, alertas de saúde críticos (alergias/medicação) e validação de responsáveis via foto.",
      images: [getImg('ob-12-health'), getImg('ob-9-class'), getImg('ob-5-identity')]
    },
    {
      id: 'pais',
      icon: <Users className="h-6 w-6" />,
      title: "Portal dos Pais",
      subtitle: "Tranquilidade em Tempo Real",
      badge: "PARENT",
      description: "Acompanhamento no mapa, alerta de proximidade (800m), pagamento via Pix Copia-e-Cola e comunicação direta com a van.",
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
            <span className="uppercase italic tracking-tighter text-xl">Guardian</span>
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="#modulos" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Módulos</Link>
            <Link href="#tecnologia" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Engenharia</Link>
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
        <section className="relative w-full py-20 lg:py-32 overflow-hidden bg-secondary/5 border-b">
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="flex flex-col items-center space-y-8 max-w-4xl mx-auto">
              <Badge variant="outline" className="px-4 py-1.5 border-primary/30 text-primary font-black uppercase tracking-[0.3em] text-[10px] bg-primary/5">
                Inteligência para Transporte Escolar
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase italic">
                O Cérebro da sua <span className="text-primary">Operação.</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-2xl text-muted-foreground font-medium leading-relaxed">
                Mais que rastreio. Uma plataforma de <span className="text-foreground font-bold italic">Telemetria ROI</span> que utiliza IA para reduzir custos e blindar sua segurança jurídica.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
                <Button size="lg" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic shadow-2xl shadow-primary/20" asChild>
                  <Link href="/">Acessar Plataforma <ArrowRight className="ml-2 h-5 w-5" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-black uppercase italic border-2" asChild>
                  <Link href="/presentation">Ver Pitch Deck <ArrowDownRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        </section>

        {/* Modules Section */}
        <section id="modulos" className="w-full py-24 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter">Uma Plataforma, <span className="text-primary">Quatro Experiências</span></h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-medium">Ecossistema completo que integra todos os agentes do transporte escolar em tempo real.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {modules.map((m) => (
                <ModuleCard key={m.id} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* Tecnologia / Engenharia Section */}
        <section id="tecnologia" className="w-full py-24 bg-secondary/10 border-y">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <Badge className="bg-primary text-primary-foreground font-black px-4 py-1 uppercase text-[10px] tracking-widest">ENGENHARIA GUARDIAN</Badge>
                <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter leading-[0.9]">Diferencial <br/><span className="text-primary">Incontestável</span></h2>
                <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                  Não somos apenas um app de mapas. Construímos uma infraestrutura de dados que elimina a fricção do negócio.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <TechMiniCard icon={<Bot />} title="OCR Gemini IA" description="Extração automática de dados de RG/CNH. Cadastro em segundos." />
                  <TechMiniCard icon={<Database />} title="Big Data INEP" description="Base de 190k escolas para busca semântica e precisão de GPS." />
                  <TechMiniCard icon={<TrendingDown />} title="FinOps" description="Arquitetura híbrida de mapas que reduz o custo de escala a zero." />
                  <TechMiniCard icon={<Gauge />} title="Preditiva" description="Manutenção baseada no odômetro real via telemetria delta." />
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
                <Card className="border-2 border-primary/20 bg-background/80 backdrop-blur shadow-2xl relative overflow-hidden">
                  <div className="p-8 border-b border-dashed border-primary/20 bg-primary/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-primary rounded-xl text-white shadow-lg"><TrendingDown size={24} /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">Live ROI Monitor</p>
                        <p className="text-xl font-black italic uppercase">Economia Real</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="border-primary/30 text-primary animate-pulse font-black">AUDITORIA ATIVA</Badge>
                  </div>
                  <CardContent className="p-8 space-y-8">
                    <div className="flex justify-between items-end border-b pb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">KM Planejado (IA)</p>
                        <p className="text-3xl font-black tracking-tighter">42.4 km</p>
                      </div>
                      <div className="h-12 w-12 flex items-center justify-center text-primary/20"><ArrowRight size={32} /></div>
                      <div className="space-y-1 text-right">
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">KM Real (GPS)</p>
                        <p className="text-3xl font-black tracking-tighter text-green-500">38.1 km</p>
                      </div>
                    </div>
                    <div className="text-center py-4 bg-green-500/10 rounded-xl border border-green-500/20">
                      <p className="text-[10px] font-black text-green-600 uppercase tracking-[0.2em] mb-1">Lucro Adicional por Viagem</p>
                      <p className="text-5xl font-black tracking-tighter italic text-green-600">R$ 24,94</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-32 bg-background text-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter italic leading-none mb-10">
              O futuro da sua <br/><span className="text-primary">Frota começa agora.</span>
            </h2>
            <p className="max-w-xl mx-auto text-muted-foreground text-xl mb-12 font-medium">
              Junte-se à nova geração de transporte escolar baseada em dados reais e inteligência artificial.
            </p>
            <Button asChild size="lg" className="h-20 px-16 text-xl font-black uppercase italic shadow-2xl hover:scale-105 transition-transform">
              <Link href="/">Acessar Plataforma <ArrowRight className="ml-3 h-6 w-6" /></Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="w-full border-t py-12 px-4 bg-background">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
          <div className="flex items-center gap-2 font-bold opacity-50">
            <Rocket className="h-5 w-5 text-primary" />
            <span className="uppercase italic tracking-tighter">Guardian</span>
          </div>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em]">
            &copy; {new Date().getFullYear()} - Inteligência para Transporte Escolar
          </p>
          <div className="flex items-center gap-8">
            <Link href="/presentation" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Pitch Deck</Link>
            <Link href="/login" className="text-[10px] font-black uppercase tracking-widest hover:text-primary transition-colors">Diferenciais</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({ icon, title, subtitle, description, images, badge }: { icon: React.ReactNode, title: string, subtitle: string, description: string, images: any[], badge: string }) {
  return (
    <Card className="border-2 border-border/50 bg-background hover:border-primary/40 transition-all group overflow-hidden flex flex-col">
      {/* Visual First - Carousel of screens */}
      <div className="relative aspect-video w-full bg-muted overflow-hidden">
        <Carousel 
          opts={{ loop: true, align: "start" }} 
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
          className="w-full h-full"
        >
          <CarouselContent>
            {images.map((img, index) => (
              <CarouselItem key={index}>
                <div className="relative aspect-video w-full">
                  <Image 
                    src={img?.imageUrl || "https://picsum.photos/seed/placeholder/800/450"} 
                    alt={img?.description || title}
                    fill
                    unoptimized
                    className="object-cover"
                    data-ai-hint={img?.imageHint || "app screen"}
                  />
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
        <div className="absolute top-4 left-4 z-10">
          <Badge className="bg-primary text-white font-black text-[9px] tracking-widest uppercase">{badge}</Badge>
        </div>
        <div className="absolute bottom-4 left-6 flex items-center gap-3 text-white z-10">
          <div className="p-2 bg-primary/20 backdrop-blur-md rounded-lg border border-white/20">{icon}</div>
          <div className="min-w-0">
            <p className="text-xl font-black uppercase italic leading-none">{title}</p>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70 mt-1">{subtitle}</p>
          </div>
        </div>
      </div>

      <CardContent className="p-8 flex-1 flex flex-col justify-between">
        <p className="text-muted-foreground leading-relaxed font-medium">{description}</p>
        <Button variant="ghost" className="w-fit p-0 h-auto mt-6 text-xs font-black uppercase tracking-widest text-primary hover:bg-transparent hover:translate-x-2 transition-all">
          Conhecer Módulo <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function TechMiniCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-primary">
        {icon}
        <h4 className="text-xs font-black uppercase tracking-widest">{title}</h4>
      </div>
      <p className="text-xs text-muted-foreground font-medium leading-relaxed">{description}</p>
    </div>
  );
}
