
'use client';

import { 
    Rocket, 
    AlertTriangle, 
    Clock, 
    MessageSquare, 
    ShieldCheck, 
    LocateFixed, 
    Bell, 
    Play, 
    Map as MapIcon, 
    UserCheck, 
    CheckCircle2, 
    TrendingUp, 
    DollarSign, 
    School, 
    Car, 
    Users, 
    Smartphone,
    ArrowDownRight,
    ArrowLeft,
    ChevronRight,
    Sparkles,
    Activity,
    Shield
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("min-h-screen w-full flex flex-col justify-center items-center p-6 lg:p-20 overflow-hidden relative border-b", className)}>
    <div className="container max-w-6xl mx-auto flex flex-col items-center w-full">
        {children}
    </div>
  </section>
);

const ModulePreview = ({ title, role, imageIds }: { title: string, role: string, imageIds: string[] }) => {
    const images = imageIds.map(id => PlaceHolderImages.find(i => i.id === id)).filter(Boolean);
    return (
        <div className="bg-background/40 backdrop-blur-xl rounded-2xl border border-primary/20 overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all shadow-xl group">
            <div className="relative aspect-video w-full bg-muted overflow-hidden">
                <Carousel 
                  opts={{ loop: true, align: "start" }} 
                  plugins={[Autoplay({ delay: 2500, stopOnInteraction: false })]}
                  className="w-full h-full"
                >
                  <CarouselContent className="-ml-0">
                    {images.map((img, index) => (
                      <CarouselItem key={index} className="pl-0 basis-full">
                        <div className="relative aspect-video w-full h-full">
                          <Image 
                            src={img?.imageUrl || ""} 
                            alt={title} 
                            fill 
                            unoptimized 
                            className="object-cover" 
                            data-ai-hint={img?.imageHint} 
                          />
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                <Badge className="absolute top-4 right-4 bg-primary font-black uppercase text-[9px] z-10">{role}</Badge>
                <div className="absolute bottom-4 left-4 z-10">
                    <p className="text-sm font-black uppercase italic text-white tracking-tighter">{title}</p>
                </div>
            </div>
        </div>
    );
};

export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased selection:bg-primary/20">
            {/* Fixed Navigation */}
            <div className="fixed top-4 right-4 z-50 flex gap-2">
                <Button asChild variant="outline" size="sm" className="shadow-lg bg-background/80 backdrop-blur font-bold uppercase text-[10px]">
                    <Link href="/login"><ArrowLeft className="mr-2 h-3 w-3" /> Voltar ao Site</Link>
                </Button>
                <Button asChild size="sm" className="shadow-lg font-bold uppercase text-[10px]">
                    <Link href="/">Abrir Sistema</Link>
                </Button>
            </div>
            
            {/* 1. O PROBLEMA */}
            <Slide className="bg-secondary/10">
                <Badge className="mb-8 bg-destructive text-white font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    01. O Cenário Atual
                </Badge>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-12">
                    A Incerteza <br/> que <span className="text-destructive">Gera Caos</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <ProblemCard icon={<Clock className="text-destructive" />} title="Onde está a van?" description="Pais no escuro, sem saber se o filho já embarcou ou a que distância o veículo está." />
                    <ProblemCard icon={<MessageSquare className="text-destructive" />} title="Fricção de Contato" description="Mensagens no WhatsApp que o motorista não pode ler enquanto dirige. Falta de comunicação segura." />
                    <ProblemCard icon={<AlertTriangle className="text-destructive" />} title="Risco de Presença" description="Falta de controle rigoroso de quem embarcou e quem foi entregue. Insegurança jurídica total." />
                </div>
                <div className="mt-16 animate-bounce opacity-40">
                    <ChevronRight className="h-8 w-8 rotate-90" />
                </div>
            </Slide>

            {/* 2. A SOLUÇÃO */}
            <Slide className="bg-background">
                <Badge className="mb-8 bg-primary text-primary-foreground font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    02. A Nossa Resposta
                </Badge>
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                    <Rocket className="w-20 h-20 text-primary relative z-10 drop-shadow-2xl" />
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-8">
                    Guardian: <br/><span className="text-primary">O Cérebro da Frota</span>
                </h2>
                <p className="max-w-2xl text-center text-lg md:text-2xl text-muted-foreground font-medium mb-12">
                    Uma plataforma inteligente que transforma o transporte escolar em uma experiência de alta precisão e total transparência.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                    <SolutionBadge icon={<LocateFixed />} text="Rastreio Realtime" />
                    <SolutionBadge icon={<Bell />} text="Aviso de Chegada" />
                    <SolutionBadge icon={<UserCheck />} text="Check-in Visual" />
                    <SolutionBadge icon={<MessageSquare />} text="Chat Centralizado" />
                </div>
            </Slide>

            {/* 3. COMO FUNCIONA */}
            <Slide className="bg-secondary/5">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    03. Fluxo Operacional
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 -translate-y-1/2 z-0" />
                    <StepItem step="1" icon={<Play />} title="Início" desc="Motorista inicia a rota no app" />
                    <StepItem step="2" icon={<MapIcon />} title="Acompanhamento" desc="Pais seguem a van no mapa" />
                    <StepItem step="3" icon={<Bell />} title="Alerta 800m" desc="App notifica a proximidade" />
                    <StepItem step="4" icon={<CheckCircle2 />} title="Confirmação" desc="Check-in por foto ou QR Code" />
                </div>
            </Slide>

            {/* 4. TELAS DO APLICATIVO */}
            <Slide className="bg-background">
                <div className="text-center mb-16 space-y-4">
                    <Badge variant="outline" className="border-primary/30 text-primary font-black px-4 py-1 uppercase text-[10px] tracking-widest">04. O PRODUTO</Badge>
                    <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">O Guardian em <span className="text-primary">Ação</span></h2>
                    <p className="text-muted-foreground text-sm uppercase font-bold tracking-widest italic">Visão Real da Interface por Módulos</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <ModulePreview title="Gestão Financeira" role="GESTOR" imageIds={['ob-15-triage', 'ob-10-finance']} />
                    <ModulePreview title="Navegação e GPS" role="MOTORISTA" imageIds={['ob-16-gps', 'ob-7-address']} />
                    <ModulePreview title="Alertas de Saúde" role="MONITOR" imageIds={['ob-12-health', 'ob-9-class']} />
                    <ModulePreview title="Live Tracking" role="PAIS" imageIds={['ob-3-welcome', 'ob-17-sign']} />
                </div>
            </Slide>

            {/* 5. BENEFÍCIOS */}
            <Slide className="bg-primary/[0.03]">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    05. Ganha-Ganha-Ganha
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <BenefitSection title="Para os Pais" icon={<Users className="text-primary" />} items={["Segurança jurídica e física", "Previsibilidade no mapa", "Alerta de chegada automático"]} />
                    <BenefitSection title="Para o Motorista" icon={<Car className="text-primary" />} items={["Itinerário otimizado por IA", "Controle de embarque ágil", "Faturamento sem boletos"]} />
                    <BenefitSection title="Para a Escola" icon={<School className="text-primary" />} items={["Controle do fluxo de pátio", "Auditoria de transportadores", "Diferencial de segurança"]} />
                </div>
            </Slide>

            {/* 6. MODELO DE NEGÓCIO */}
            <Slide className="bg-black text-white">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
                 <Badge className="mb-12 bg-primary text-black font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] relative z-10">
                    06. Rentabilidade & Escala
                 </Badge>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full relative z-10 px-4">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2rem] space-y-6">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter text-primary">Nossas Fontes de Receita</h3>
                        <div className="space-y-4">
                            <PricingItem title="Licença Motorista" price="R$ 149/mês" desc="Por veículo cadastrado na plataforma." />
                            <PricingItem title="Taxa Transacional Aluno" price="R$ 2/mês" desc="Por aluno ativo na base de telemetria." />
                            <PricingItem title="Guardian Enterprise" price="Sob Consulta" desc="Plano para escolas e prefeituras." />
                        </div>
                    </div>
                    <div className="bg-primary p-10 rounded-[2rem] text-black flex flex-col justify-center space-y-6">
                        <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Investment Ask</p>
                            <p className="text-7xl font-black tracking-tighter italic">R$ 150k</p>
                            <p className="text-sm font-bold uppercase">Equity: 10%</p>
                        </div>
                        <Button className="w-full h-14 bg-black text-white font-black uppercase italic hover:bg-black/80 shadow-2xl" asChild>
                            <Link href="/">Iniciar Parceria Agora</Link>
                        </Button>
                    </div>
                 </div>
            </Slide>
        </main>
    );
}

function ProblemCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border-2 border-destructive/10 bg-background/50 backdrop-blur">
            <CardHeader>
                <div className="mb-2">{icon}</div>
                <CardTitle className="text-xl uppercase italic font-black">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-sm font-medium leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );
}

function SolutionBadge({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-primary">
            <div className="p-3 bg-primary rounded-xl text-white shadow-lg">{icon}</div>
            <span className="text-xs font-black uppercase tracking-widest text-center">{text}</span>
        </div>
    );
}

function StepItem({ step, icon, title, desc }: { step: string, icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center text-primary shadow-xl">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">Passo {step}</p>
                <h4 className="font-black uppercase italic">{title}</h4>
                <p className="text-xs text-muted-foreground px-4 font-medium">{desc}</p>
            </div>
        </div>
    );
}

function BenefitSection({ title, icon, items }: { title: string, icon: React.ReactNode, items: string[] }) {
    return (
        <div className="p-8 bg-background rounded-3xl border-2 border-primary/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                {icon}
                <h3 className="text-xl font-black uppercase italic tracking-tighter">{title}</h3>
            </div>
            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm font-bold text-muted-foreground">
                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </div>
    );
}

function PricingItem({ title, price, desc }: { title: string, price: string, desc: string }) {
    return (
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
                <p className="font-black uppercase italic text-sm">{title}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{desc}</p>
            </div>
            <p className="text-xl font-black text-primary italic">{price}</p>
        </div>
    );
}
    