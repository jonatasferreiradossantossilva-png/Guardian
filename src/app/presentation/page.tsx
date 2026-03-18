
'use client';

import { 
    Rocket, 
    AlertTriangle, 
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
    ArrowLeft, 
    ChevronRight, 
    Sparkles,
    Check,
    BarChart3,
    QrCode,
    Activity,
    HeartPulse,
    FileText,
    Milestone,
    X,
    ArrowDownRight
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
  <section id={id} className={cn("min-h-screen w-full flex flex-col justify-center items-center p-6 lg:p-20 overflow-hidden relative border-b last:border-0", className)}>
    <div className="container max-w-6xl mx-auto flex flex-col items-center w-full">
        {children}
    </div>
  </section>
);

const ModulePreview = ({ title, role, imageIds, features }: { title: string, role: string, imageIds: string[], features: string[] }) => {
    const images = imageIds.map(id => PlaceHolderImages.find(i => i.id === id)).filter(Boolean);
    return (
        <div className="bg-background rounded-3xl border border-primary/20 overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all shadow-2xl group">
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
                          <div className="relative w-full h-full rounded-2xl overflow-hidden border bg-background shadow-inner">
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
                <Badge className="absolute top-3 right-3 bg-primary font-black uppercase text-[8px] z-10 shadow-lg">{role}</Badge>
            </div>
            <div className="p-6 bg-muted/10 border-t flex-1">
                <p className="text-sm font-black uppercase italic tracking-tighter text-primary mb-4">{title}</p>
                <div className="flex flex-wrap gap-1.5">
                    {features.map((f, i) => (
                        <Badge key={i} variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-muted-foreground bg-background">
                            {f}
                        </Badge>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased selection:bg-primary/20">
            <div className="fixed top-4 left-4 z-50">
                <Button asChild variant="outline" size="sm" className="shadow-lg bg-background/80 backdrop-blur font-bold uppercase text-[10px]">
                    <Link href="/login"><ArrowLeft className="mr-2 h-3 w-3" /> Voltar</Link>
                </Button>
            </div>
            
            <Slide className="bg-destructive/[0.03]">
                <Badge className="mb-8 bg-destructive text-white font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    01. O Desafio Atual
                </Badge>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-12">
                    Operação <br/> Sem <span className="text-destructive">Visibilidade.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
                    <ProblemCard icon={<AlertTriangle className="text-destructive" />} title="Incerteza dos Pais" description="Onde está meu filho? A falta de rastro gera ansiedade e centenas de mensagens de WhatsApp que o motorista não pode ler." />
                    <ProblemCard icon={<MessageSquare className="text-destructive" />} title="Caos Logístico" description="Avisos de faltas tardios resultam em rotas ineficientes e desperdício de combustível todos os dias." />
                    <ProblemCard icon={<ShieldCheck className="text-destructive" />} title="Insegurança Jurídica" description="Sem registros digitais de embarque e desembarque, o transportador fica vulnerável a contestações e incidentes." />
                </div>
                <div className="mt-16 animate-bounce opacity-40">
                    <ChevronRight className="h-8 w-8 rotate-90" />
                </div>
            </Slide>

            <Slide className="bg-background">
                <Badge className="mb-8 bg-primary text-primary-foreground font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    02. A Revolução Guardian
                </Badge>
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full animate-pulse" />
                    <Rocket className="w-20 h-20 text-primary relative z-10" />
                </div>
                <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center mb-8">
                    Guardian: <br/><span className="text-primary">O Cérebro da Frota.</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                    <SolutionBadge icon={<LocateFixed />} text="Mapa em Tempo Real" />
                    <SolutionBadge icon={<Bell />} text="Alerta Automático (800m)" />
                    <SolutionBadge icon={<UserCheck />} text="Check-in por QR/Foto" />
                    <SolutionBadge icon={<DollarSign />} text="Pagamento Pix Instantâneo" />
                </div>
            </Slide>

            <Slide className="bg-secondary/5">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    03. Fluxo de Valor
                </Badge>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 w-full relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-primary/20 -translate-y-1/2 z-0" />
                    <StepItem step="1" icon={<Play />} title="Start Inteligente" desc="Motorista inicia rota otimizada por IA para menor consumo." />
                    <StepItem step="2" icon={<MapIcon />} title="Acompanhamento" desc="Pais visualizam a van em movimento no mapa vivo." />
                    <StepItem step="3" icon={<Bell />} title="Smart Notification" desc="App avisa a chegada automaticamente ao entrar no raio de 800m." />
                    <StepItem step="4" icon={<CheckCircle2 />} title="Log Digital" desc="Embarque validado gera comprovante digital e segurança jurídica." />
                </div>
            </Slide>

            <Slide className="bg-background">
                <Badge variant="outline" className="mb-12 border-primary/30 text-primary font-black px-4 py-1 uppercase text-[10px] tracking-widest">04. O Ecossistema Guardian</Badge>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <ModulePreview title="Gestão & Performance" role="GESTOR" imageIds={['ob-15-triage', 'ob-10-finance', 'ob-14-notification']} features={["ROI de KM", "Triagem OCR", "Faturas Aut.", "Mural Avisos"]} />
                    <ModulePreview title="Navegação Assistida" role="DRIVER" imageIds={['ob-16-gps', 'ob-7-address', 'ob-4-scan']} features={["GPS Realtime", "Itinerário IA", "Relato Transito", "Status Rota"]} />
                    <ModulePreview title="Controle de Bordo" role="ASSISTANT" imageIds={['ob-12-health', 'ob-9-class', 'ob-5-identity']} features={["Alertas Saúde", "Check-in QR", "Foto Aluno", "Mensagens Rápidas"]} />
                    <ModulePreview title="Painel da Família" role="PARENT" imageIds={['ob-3-welcome', 'ob-17-sign', 'ob-6-contact', 'ob-13-done']} features={["Mapa Vivo", "Viagens Avulsas", "Pix Instantâneo", "Contratos"]} />
                </div>
            </Slide>

            <Slide className="bg-primary/[0.03]">
                <Badge className="mb-12 bg-primary/10 text-primary font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px] border border-primary/20">
                    05. Superioridade Guardian
                </Badge>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full">
                    <div className="space-y-8">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter">O Fim das <span className="text-primary">Soluções Genéricas.</span></h3>
                        <div className="space-y-4">
                            <ComparisonPoint 
                                title="Engenharia de Custo Zero" 
                                desc="Enquanto concorrentes pagam fortunas ao Google Maps, usamos Mapas Híbridos e Haversine local para escalar com margem de lucro recorde."
                            />
                            <ComparisonPoint 
                                title="Triagem via OCR Gemini" 
                                desc="Eliminamos a digitação. Pais cadastram filhos em 30s. Líderes de mercado ainda dependem de formulários manuais extensos."
                            />
                            <ComparisonPoint 
                                title="Telemetria por Delta" 
                                desc="Nossa lógica economiza 70% de bateria e tráfego de dados no celular do motorista comparado aos apps convencionais."
                            />
                        </div>
                    </div>
                    <div className="bg-background rounded-3xl border-2 border-primary/20 shadow-2xl p-8 space-y-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Comparativo Direto</p>
                        <div className="space-y-4">
                            <ComparisonLine label="Cadastro" traditional="Manual" guardian="OCR Instantâneo" />
                            <ComparisonLine label="Mapa" traditional="Google Only (Caro)" guardian="Híbrido (Inteligente)" />
                            <ComparisonLine label="Roteirização" traditional="Estática" guardian="IA Otimizadora (ROI)" />
                            <ComparisonLine label="Faturamento" traditional="Papel/WhatsApp" guardian="Pix Automático" />
                        </div>
                        <div className="pt-4 border-t border-primary/10">
                            <div className="flex items-center gap-2 text-primary font-black italic">
                                <TrendingUp className="h-5 w-5" />
                                <span>+12% de Lucro Real por Van</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Slide>

            <Slide className="bg-black text-white">
                 <Badge className="mb-12 bg-primary text-black font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    06. Rentabilidade & Escala
                 </Badge>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full max-w-4xl">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl space-y-6">
                        <h3 className="text-2xl font-black uppercase italic text-primary">Receita Recorrente</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Assinatura p/ Van</span>
                                <span className="text-primary font-black">R$ 149/mês</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Taxa p/ Aluno</span>
                                <span className="text-primary font-black">R$ 2/aluno</span>
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2">
                                <span className="text-sm font-bold uppercase">Enterprise</span>
                                <span className="text-primary font-black">Sob consulta</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-primary p-8 rounded-3xl text-black flex flex-col justify-center text-center space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Pronto para escalar?</p>
                        <p className="text-5xl font-black tracking-tighter italic">BUSINESS DECK</p>
                        <Button className="w-full h-14 bg-black text-white font-black uppercase italic hover:bg-black/80" asChild>
                            <Link href="/">Falar com um Consultor</Link>
                        </Button>
                    </div>
                 </div>
            </Slide>
        </main>
    );
}

function ProblemCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <Card className="border-2 border-destructive/10 bg-background/50 backdrop-blur text-center p-6">
            <div className="mb-4 flex justify-center">{icon}</div>
            <CardTitle className="text-lg uppercase italic font-black mb-2">{title}</CardTitle>
            <p className="text-muted-foreground text-xs font-medium leading-relaxed">{description}</p>
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

function ComparisonPoint({ title, desc }: { title: string, desc: string }) {
    return (
        <div className="flex gap-4">
            <div className="mt-1 p-1 bg-primary/20 rounded text-primary h-fit"><Check className="h-4 w-4" /></div>
            <div>
                <p className="text-sm font-black uppercase italic tracking-tight">{title}</p>
                <p className="text-xs text-muted-foreground font-medium leading-relaxed">{desc}</p>
            </div>
        </div>
    );
}

function ComparisonLine({ label, traditional, guardian }: { label: string, traditional: string, guardian: string }) {
    return (
        <div className="space-y-1.5">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</p>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/50 line-through"><X className="h-3 w-3" /> {traditional}</div>
                <div className="flex items-center gap-2 text-[10px] text-primary font-bold"><CheckCircle2 className="h-3 w-3" /> {guardian}</div>
            </div>
        </div>
    );
}
