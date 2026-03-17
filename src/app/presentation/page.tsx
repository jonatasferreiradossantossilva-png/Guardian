
'use client';

import { 
    Rocket, 
    Bot, 
    Database, 
    TrendingDown, 
    Gauge, 
    Zap, 
    ArrowDownRight,
    CheckCircle2,
    Activity,
    ShieldCheck,
    Smartphone,
    ArrowLeft,
    CheckCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("min-h-screen w-full flex flex-col justify-center items-center p-6 lg:p-20 overflow-hidden relative border-b", className)}>
    <div className="container max-w-6xl mx-auto flex flex-col items-center">
        {children}
    </div>
  </section>
);

const ModuleSlideItem = ({ title, role, imageId, description }: { title: string, role: string, imageId: string, description: string }) => {
    const img = PlaceHolderImages.find(i => i.id === imageId);
    return (
        <div className="bg-background/40 backdrop-blur-xl rounded-2xl border border-primary/20 overflow-hidden flex flex-col h-full hover:border-primary/50 transition-all shadow-xl">
            <div className="relative aspect-video w-full">
                <Image src={img?.imageUrl || ""} alt={title} fill unoptimized className="object-cover" data-ai-hint={img?.imageHint} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <Badge className="absolute top-4 right-4 bg-primary font-black uppercase text-[9px]">{role}</Badge>
            </div>
            <div className="p-6 space-y-2">
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">{title}</h3>
                <p className="text-sm text-foreground/80 font-bold leading-relaxed">{description}</p>
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
            
            {/* Slide 1: Cover */}
            <Slide className="bg-secondary/10">
                <div className="absolute inset-0 bg-[grid-line] opacity-10" />
                <Badge className="mb-8 bg-primary text-primary-foreground font-black tracking-[0.4em] px-6 py-2 uppercase text-[10px]">
                    Pitch Deck 2024
                </Badge>
                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                    <Rocket className="w-20 h-20 md:w-32 md:h-32 text-primary relative z-10 drop-shadow-2xl" />
                </div>
                <h1 className="text-6xl md:text-[160px] font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center">
                    Guardian
                </h1>
                <p className="mt-12 text-xl md:text-5xl text-muted-foreground max-w-4xl text-center font-bold leading-tight px-4">
                    Inteligência para um mercado bilionário <br/> de <span className="text-primary italic">Ativos em Movimento</span>.
                </p>
                <div className="mt-20 flex flex-col items-center gap-2 animate-bounce opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scroll para os módulos</p>
                    <ArrowDownRight className="h-5 w-5 rotate-45" />
                </div>
            </Slide>

            {/* Slide 2: The Core Experience (Módulos Detalhados) */}
            <Slide className="bg-background">
                <div className="space-y-4 text-center mb-16">
                    <Badge variant="outline" className="border-primary/30 text-primary font-black px-4 py-1 uppercase text-[10px] tracking-widest">ECOSSISTEMA INTEGRADO</Badge>
                    <h2 className="text-4xl md:text-7xl font-black uppercase italic tracking-tighter">Uma Solução <span className="text-primary">Multi-Face</span></h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                    <ModuleSlideItem 
                        title="Gestão Central" 
                        role="GESTOR" 
                        imageId="ob-15-triage" 
                        description="Auditoria de ROI e faturamento automatizado via inteligência bancária." 
                    />
                    <ModuleSlideItem 
                        title="Navegação IA" 
                        role="MOTORISTA" 
                        imageId="ob-16-gps" 
                        description="Traçado otimizado em tempo real reduzindo desvios e gastos de diesel." 
                    />
                    <ModuleSlideItem 
                        title="Check-in Seguro" 
                        role="MONITOR" 
                        imageId="ob-12-health" 
                        description="Validação visual de alunos e alertas de saúde pulsantes no embarque." 
                    />
                    <ModuleSlideItem 
                        title="Live Tracking" 
                        role="PAIS" 
                        imageId="ob-3-welcome" 
                        description="Segurança máxima com alertas de proximidade e comunicação direta." 
                    />
                </div>
            </Slide>

            {/* Slide 3: Prova de ROI (The Business Case) */}
            <Slide className="bg-primary/[0.03]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                    <div className="space-y-8 text-center lg:text-left">
                        <Badge variant="destructive" className="font-black tracking-widest px-4 py-1">O RESULTADO</Badge>
                        <h2 className="text-4xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                            Margens <br/><span className="text-primary">Escaláveis</span>
                        </h2>
                        <p className="text-lg md:text-2xl text-muted-foreground font-medium leading-tight">
                            Transformamos o rastreio passivo em um dashboard de economia direta. O frotista sabe exatamente quanto lucrou em cada rota.
                        </p>
                        <div className="flex flex-col gap-4">
                            <BenefitItem text="Redução de 14.2% no custo de combustível." />
                            <BenefitItem text="Aumento de 30% na vida útil dos pneus via telemetria." />
                            <BenefitItem text="Redução de 95% na burocracia de cadastro (OCR)." />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        <StatItem label="Retorno sobre Investimento" value="4.2x" />
                        <StatItem label="Escolas Mapeadas (INEP)" value="190k" />
                        <StatItem label="Custo Infra (FinOps)" value="~R$ 0" />
                        <StatItem label="Segurança Jurídica" value="100%" />
                    </div>
                </div>
            </Slide>

            {/* Slide 4: The Ask */}
            <Slide className="bg-black text-white">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
                 <h2 className="text-5xl md:text-[120px] font-black text-center mb-12 uppercase italic tracking-tighter leading-[0.8] relative z-10">
                    The <span className="text-primary">Ask</span>
                 </h2>
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full relative z-10 px-4">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-10 rounded-[2rem] text-center space-y-4">
                        <p className="text-primary font-black uppercase tracking-[0.4em] text-xs">Busca de Capital</p>
                        <p className="text-7xl md:text-9xl font-black tracking-tighter italic text-white">R$ 150k</p>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Equity: 10%</p>
                    </div>
                    <div className="bg-primary p-10 rounded-[2rem] text-black flex flex-col justify-center space-y-6">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Uso do <br/>Capital</h3>
                        <div className="space-y-3 font-black uppercase text-xs tracking-tight">
                            <div className="flex justify-between border-b border-black/20 pb-2"><span>60% Produto & IA</span><span>Telemetria ROI</span></div>
                            <div className="flex justify-between border-b border-black/20 pb-2"><span>20% Marketing</span><span>Aquisição B2B</span></div>
                            <div className="flex justify-between"><span>20% Operação</span><span>Infra Escalonável</span></div>
                        </div>
                        <Button className="w-full h-14 bg-black text-white font-black uppercase italic hover:bg-black/80 shadow-2xl" asChild>
                            <Link href="/login">Investir no Futuro</Link>
                        </Button>
                    </div>
                 </div>
            </Slide>
        </main>
    );
}

function StatItem({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-secondary/20 p-6 rounded-2xl border border-dashed border-primary/20 text-center space-y-1">
            <p className="text-3xl md:text-5xl font-black text-foreground italic tracking-tighter">{value}</p>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        </div>
    );
}

function BenefitItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <CheckCircle className="text-green-500 h-6 w-6 shrink-0" />
            <span className="font-bold text-base uppercase tracking-tight italic">{text}</span>
        </div>
    );
}
