
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
    Shield,
    Check
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("min-h-screen w-full flex flex-col justify-center items-center p-6 lg:p-20 overflow-hidden relative border-b last:border-0", className)}>
    <div className="container max-w-6xl mx-auto flex flex-col items-center w-full">
        {children}
    </div>
  </section>
);

const ModulePreview = ({ title, role, imageIds }: { title: string, role: string, imageIds: string[] }) => {
    const images = imageIds.map(id => PlaceHolderImages.find(i => i.id === id)).filter(Boolean);
    return (
        <div className="bg-background rounded-2xl border border-primary/20 overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all shadow-2xl group">
            <div className="relative aspect-video w-full bg-black/5 overflow-hidden">
                <Carousel 
                  opts={{ loop: true, align: "start" }} 
                  plugins={[Autoplay({ delay: 3000, stopOnInteraction: false })]}
                  className="w-full h-full"
                >
                  <CarouselContent className="-ml-0">
                    {images.map((img, index) => (
                      <CarouselItem key={index} className="pl-0 basis-full">
                        <div className="relative aspect-video w-full h-full p-2">
                          <div className="relative w-full h-full rounded-lg overflow-hidden border bg-background">
                            <Image 
                                src={img?.imageUrl || ""} 
                                alt={title} 
                                fill 
                                unoptimized 
                                className="object-contain" 
                                data-ai-hint={img?.imageHint} 
                            />
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
                <Badge className="absolute top-3 right-3 bg-primary font-black uppercase text-[8px] z-10">{role}</Badge>
            </div>
            <div className="p-4 bg-muted/10">
                <p className="text-xs font-black uppercase italic tracking-tighter text-primary">{title}</p>
            </div>
        </div>
    );
};

export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased selection:bg-primary/20">
            {/* Navigation Overlay */}
            <div className="fixed top-4 left-4 z-50">
                <Button asChild variant="outline" size="sm" className="shadow-lg bg-background/80 backdrop-blur font-bold uppercase text-[10px]">
                    <Link href="/login"><ArrowLeft className="mr-2 h-3 w-3" /> Voltar</Link>
                </Button>
            </div>
            
            {/* 1. O PROBLEMA */}
            <Slide className="bg-destructive/5">
                <Badge className="mb-8 bg-destructive text-white font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    01. O Problema Atual
                </Badge>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-12">
                    Operação <br/> no <span className="text-destructive">Escuro.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <ProblemCard icon={<AlertTriangle className="text-destructive" />} title="Cadê a van?" desc="Pais ansiosos e sem visibilidade geram centenas de mensagens de WhatsApp que o motorista não pode ler." />
                    <ProblemCard icon={<MessageSquare className="text-destructive" />} title="Fricção de Contato" description="Avisos de falta e atrasos se perdem no caos das mensagens, resultando em quilometragem desperdiçada." />
                    <ProblemCard icon={<Shield className="text-destructive" />} title="Risco Jurídico" description="Falta de registros digitais de quem embarcou ou foi entregue gera insegurança total para o transportador." />
                </div>
                <div className="mt-16 animate-bounce opacity-40">
                    <ChevronRight className="h-8 w-8 rotate-90" />
                </div>
            </Slide>

            {/* 2. A SOLUÇÃO */}
            <Slide className="bg-background">
                <Badge className="mb-8 bg-primary text-primary-foreground font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    02. A Nossa Solução
                </Badge>
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    <Rocket className="w-20 h-20 text-primary relative z-10" />
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-8">
                    Guardian: <br/><span className="text-primary">O Cérebro da Frota.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <SolutionBadge icon={<LocateFixed />} text="Rastreamento Realtime" />
                    <SolutionBadge icon={<Bell />} text="Alerta de Chegada (800m)" />
                    <SolutionBadge icon={<UserCheck />} text="Check-in por QR/Foto" />
                    <SolutionBadge icon={<MessageSquare />} text="Chat Operacional" />
                </div>
            </Slide>

            {/* 3. COMO FUNCIONA */}
            <Slide className="bg-secondary/5">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    03. O Fluxo de Valor
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 -translate-y-1/2 z-0" />
                    <StepItem step="1" icon={<Play />} title="Start" desc="Motorista inicia a rota otimizada pela IA" />
                    <StepItem step="2" icon={<MapIcon />} title="Live" desc="Pais acompanham o trajeto no mapa vivo" />
                    <StepItem step="3" icon={<Bell />} title="Smart Alert" desc="App notifica a chegada automaticamente" />
                    <StepItem step="4" icon={<CheckCircle2 />} title="Log" desc="Confirmação de embarque gera log jurídico" />
                </div>
            </Slide>

            {/* 4. TELAS DO APLICATIVO */}
            <Slide className="bg-background">
                <Badge variant="outline" className="mb-12 border-primary/30 text-primary font-black px-4 py-1 uppercase text-[10px] tracking-widest">04. O Produto em Ação</Badge>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <ModulePreview title="Painel de Gestão" role="GESTOR" imageIds={['ob-15-triage', 'ob-10-finance']} />
                    <ModulePreview title="Navegação GPS" role="DRIVER" imageIds={['ob-16-gps', 'ob-7-address']} />
                    <ModulePreview title="Checklist de Bordo" role="ASSISTANT" imageIds={['ob-12-health', 'ob-9-class']} />
                    <ModulePreview title="Tracking Parental" role="PARENT" imageIds={['ob-3-welcome', 'ob-17-sign']} />
                </div>
            </Slide>

            {/* 5. BENEFÍCIOS */}
            <Slide className="bg-primary/[0.03]">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    05. Benefícios Reais
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <BenefitSection title="Para os Pais" icon={<Users className="text-primary" />} items={["Segurança jurídica", "Zero ansiedade (Mapa)", "Previsão de chegada"]} />
                    <BenefitSection title="Para o Motorista" icon={<Car className="text-primary" />} items={["Menor gasto de Diesel", "Check-in sem papel", "Faturamento automático"]} />
                    <BenefitSection title="Para a Escola" icon={<School className="text-primary" />} items={["Controle do pátio", "Auditoria da frota", "Diferencial de ensino"]} />
                </div>
            </Slide>

            {/* 6. MODELO DE NEGÓCIO */}
            <Slide className="bg-black text-white">
                 <Badge className="mb-12 bg-primary text-black font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    06. Rentabilidade & Escala
                 </Badge>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl space-y-6">
                        <h3 className="text-2xl font-black uppercase italic text-primary">Revenue Streams</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Assinatura por Van</span>
                                <span className="text-primary font-black">R$ 149/mês</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Taxa de Telemetria</span>
                                <span className="text-primary font-black">R$ 2/aluno</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Guardian Enterprise</span>
                                <span className="text-primary font-black">Sob consulta</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-primary p-8 rounded-3xl text-black flex flex-col justify-center text-center space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready to Scale?</p>
                        <p className="text-5xl font-black tracking-tighter italic">INVESTOR DECK</p>
                        <Button className="w-full h-14 bg-black text-white font-black uppercase italic hover:bg-black/80" asChild>
                            <Link href="/">Iniciar Parceria</Link>
                        </Button>
                    </div>
                 </div>
            </Slide>
        </main>
    );
}

function ProblemCard({ icon, title, description }: { icon: React.ReactNode, title: string, description?: string, desc?: string }) {
    return (
        <Card className="border-2 border-destructive/10 bg-background/50 backdrop-blur text-center p-6">
            <div className="mb-4 flex justify-center">{icon}</div>
            <CardTitle className="text-lg uppercase italic font-black mb-2">{title}</CardTitle>
            <p className="text-muted-foreground text-xs font-medium leading-relaxed">{description || desc}</p>
        </Card>
    );
}

function SolutionBadge({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-primary/5 border border-primary/20 text-primary hover:bg-primary/10 transition-colors">
            <div className="p-3 bg-primary rounded-xl text-white shadow-lg">{icon}</div>
            <span className="text-[10px] font-black uppercase tracking-widest text-center">{text}</span>
        </div>
    );
}

function StepItem({ step, icon, title, desc }: { step: string, icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
            <div className="w-14 h-14 rounded-full bg-background border-4 border-primary flex items-center justify-center text-primary shadow-xl">
                {icon}
            </div>
            <div className="space-y-1">
                <p className="text-[9px] font-black text-primary uppercase tracking-widest">Fase {step}</p>
                <h4 className="font-black uppercase italic text-sm">{title}</h4>
                <p className="text-[10px] text-muted-foreground px-4">{desc}</p>
            </div>
        </div>
    );
}

function BenefitSection({ title, icon, items }: { title: string, icon: React.ReactNode, items: string[] }) {
    return (
        <Card className="p-6 bg-background rounded-3xl border-2 border-primary/10 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">{icon}</div>
                <h3 className="text-lg font-black uppercase italic tracking-tighter">{title}</h3>
            </div>
            <ul className="space-y-3">
                {items.map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-[11px] font-bold text-muted-foreground">
                        <Check className="h-3 w-3 text-primary shrink-0" />
                        {item}
                    </li>
                ))}
            </ul>
        </Card>
    );
}
