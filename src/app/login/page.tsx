
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
  HelpCircle,
  ExternalLink,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Sparkles
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
      title: "O Painel do Gestor",
      subtitle: "Gestão Financeira & ROI",
      badge: "ADMIN",
      description: "Controle de faturas, auditoria de KM e manutenção preditiva em um só lugar.",
      images: [getImg('ob-15-triage'), getImg('ob-14-notification'), getImg('ob-10-finance'), getImg('ob-11-summary')]
    },
    {
      id: 'motorista',
      icon: <Car className="h-5 w-5" />,
      title: "App do Motorista",
      subtitle: "GPS e Itinerário Otimizado",
      badge: "DRIVER",
      description: "Rotas calculadas por IA para menor consumo e máxima pontualidade.",
      images: [getImg('ob-16-gps'), getImg('ob-7-address'), getImg('ob-4-scan')]
    },
    {
      id: 'monitor',
      icon: <ClipboardCheck className="h-5 w-5" />,
      title: "Terminal do Monitor",
      subtitle: "Segurança e Check-in",
      badge: "ASSISTANT",
      description: "Checklist com foto e alertas médicos críticos em tempo real.",
      images: [getImg('ob-12-health'), getImg('ob-9-class'), getImg('ob-5-identity')]
    },
    {
      id: 'pais',
      icon: <Users className="h-5 w-5" />,
      title: "Portal dos Pais",
      subtitle: "Tranquilidade Realtime",
      badge: "PARENT",
      description: "Mapa ao vivo, alerta 800m e pagamento Pix instantâneo.",
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
            <Link href="#modulos" className="text-xs font-black uppercase tracking-widest hover:text-primary transition-colors">Módulos</Link>
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
                Inteligência para Transporte Escolar
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-none uppercase italic">
                O Cérebro da sua <span className="text-primary">Operação.</span>
              </h1>
              <p className="max-w-2xl text-lg md:text-2xl text-muted-foreground font-medium leading-relaxed">
                Reduza custos com <span className="text-foreground font-bold italic">Telemetria ROI</span> e blinde sua segurança jurídica com IA Generativa.
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
        </section>

        {/* Modules Section */}
        <section id="modulos" className="w-full py-24 bg-background border-b">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-primary">Plataforma Unificada</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto font-medium uppercase text-xs tracking-widest">Interface Especializada para Cada Agente</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {modules.map((m) => (
                <ModuleCard key={m.id} {...m} />
              ))}
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="w-full py-32 bg-secondary/5 text-center relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic leading-none mb-10">
              Pronto para a <br/><span className="text-primary">Nova Geração?</span>
            </h2>
            <Button asChild size="lg" className="h-20 px-16 text-xl font-black uppercase italic shadow-2xl hover:scale-105 transition-transform">
              <Link href="/">Entrar no Sistema <ArrowRight className="ml-3 h-6 w-6" /></Link>
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
        </div>
      </footer>
    </div>
  );
}

function ModuleCard({ icon, title, subtitle, description, images, badge }: { icon: React.ReactNode, title: string, subtitle: string, description: string, images: any[], badge: string }) {
  return (
    <Card className="border-2 border-border/50 bg-background hover:border-primary/40 transition-all group overflow-hidden flex flex-col shadow-xl">
      {/* Visual First - Interface Showcase */}
      <div className="relative aspect-video w-full bg-black/5 overflow-hidden">
        <Carousel 
          opts={{ loop: true, align: "start" }} 
          plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
          className="w-full h-full"
        >
          <CarouselContent className="-ml-0">
            {images.map((img, index) => (
              <CarouselItem key={index} className="pl-0 basis-full">
                <div className="relative aspect-video w-full h-full p-4">
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

      <CardContent className="p-8 flex-1 flex flex-col justify-between bg-muted/5">
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl text-primary border border-primary/20">{icon}</div>
                <div>
                    <p className="text-xl font-black uppercase italic leading-none tracking-tighter">{title}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mt-1">{subtitle}</p>
                </div>
            </div>
            <p className="text-muted-foreground leading-relaxed font-medium text-sm">{description}</p>
        </div>
        <Button variant="ghost" className="w-fit p-0 h-auto mt-6 text-xs font-black uppercase tracking-widest text-primary hover:bg-transparent hover:translate-x-2 transition-all">
          Ver funcionalidades <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
