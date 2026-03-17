
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
    Truck
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={cn("min-h-screen w-full flex flex-col justify-center items-center p-6 md:p-20 overflow-hidden relative border-b", className)}>
    <div className="container max-w-6xl mx-auto flex flex-col items-center">
        {children}
    </div>
  </section>
);

const TechCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description: string }) => (
    <div className="bg-background/40 backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-primary/20 h-full hover:border-primary/50 transition-all shadow-2xl relative group">
        <div className="absolute -top-4 -right-4 p-3 bg-primary/10 rounded-full text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            {icon}
        </div>
        <div className="flex items-center gap-3 mb-4">
            <div className="text-primary bg-primary/10 p-2 rounded-lg">{icon}</div>
            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">{title}</h3>
        </div>
        <p className="text-4xl md:text-6xl font-black text-primary tracking-tighter italic mb-4">{value}</p>
        <p className="text-sm md:text-base text-foreground/80 leading-relaxed font-bold">{description}</p>
    </div>
);

export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased">
            {/* Nav Fixa */}
            <div className="fixed top-4 right-4 z-[100] flex gap-2">
                <Button asChild variant="outline" size="sm" className="shadow-2xl bg-background/80 backdrop-blur font-bold uppercase text-[10px]">
                    <Link href="/login">Voltar p/ Site</Link>
                </Button>
                <Button asChild size="sm" className="shadow-2xl font-bold uppercase text-[10px]">
                    <Link href="/">Demonstração</Link>
                </Button>
            </div>
            
            {/* Slide 1: O Impacto */}
            <Slide className="bg-secondary/10">
                <div className="absolute inset-0 bg-[grid-line] opacity-10" />
                <Badge className="mb-8 bg-primary text-primary-foreground font-black tracking-[0.4em] px-6 py-2 uppercase text-xs">
                    Investidor: Pitch Deck 2024
                </Badge>
                <div className="relative mb-12">
                    <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
                    <Rocket className="w-24 h-24 md:w-32 md:h-32 text-primary relative z-10 drop-shadow-2xl" />
                </div>
                <h1 className="text-5xl md:text-[140px] font-black tracking-tighter text-foreground uppercase italic leading-[0.8] text-center">
                    Guardian
                </h1>
                <p className="mt-12 text-xl md:text-4xl text-muted-foreground max-w-4xl text-center font-bold leading-tight">
                    Inteligência de ativos para um mercado que movimenta <span className="text-primary italic">R$ 18 Bilhões</span> no Brasil.
                </p>
                <div className="mt-20 flex flex-col items-center gap-2 animate-bounce opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scrol para navegar</p>
                    <ArrowDownRight className="h-5 w-5 rotate-45" />
                </div>
            </Slide>

            {/* Slide 2: O Problema (Visceral) */}
            <Slide className="bg-background">
                <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
                    <div className="space-y-8 text-center lg:text-left">
                        <Badge variant="destructive" className="font-black tracking-widest px-4 py-1">O GARGALO</Badge>
                        <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
                            Margens <br/><span className="text-primary">Esmagadas</span>
                        </h2>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-tight">
                            O frotista escolar hoje opera no escuro, perdendo dinheiro com desvios de rota, manutenção tardia e burocracia manual.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                        <StatItem label="Desperdício Combustível" value="15%" />
                        <StatItem label="Custo Manutenção Reativa" value="+40%" />
                        <StatItem label="Tempo de Cadastro (Dias)" value="2-3" />
                        <StatItem label="Risco Jurídico" value="Alto" />
                    </div>
                </div>
            </Slide>

            {/* Slide 3: Diferenciais Técnicos */}
            <Slide className="bg-primary/[0.03]">
                 <h2 className="text-4xl md:text-7xl font-black text-center mb-16 uppercase italic tracking-tighter leading-none">
                    Unicidade <span className="text-primary">Técnica</span>
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                    <TechCard 
                        icon={<Bot />} 
                        title="OCR Intelligence" 
                        value="Fast"
                        description="Leitura automática de RG/CNH via Gemini. Redução de 95% no tempo de onboarding de novos alunos."
                    />
                    <TechCard 
                        icon={<Database />} 
                        title="Proprietary Big Data" 
                        value="190k"
                        description="Base INEP integrada para geolocalização instantânea de escolas. Zero erro de GPS no itinerário."
                    />
                    <TechCard 
                        icon={<TrendingDown />} 
                        title="ROI Telemetry" 
                        value="Live"
                        description="Comparativo real: KM Planejado vs. KM Real. Prova de economia de combustível em cada viagem."
                    />
                 </div>
            </Slide>

            {/* Slide 4: FinOps e Escala */}
            <Slide>
                <div className="max-w-4xl w-full space-y-12">
                    <div className="text-center space-y-4">
                        <Badge className="bg-primary/10 text-primary border-primary/20 font-black px-4 py-1">SOBERANIA DE CUSTOS</Badge>
                        <h2 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">Feito para <span className="text-primary">Crescer</span></h2>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div className="space-y-6">
                            <CheckItem title="Arquitetura Híbrida" description="Uso inteligente de Google Maps + OSM para manter custo de software próximo a zero." />
                            <CheckItem title="Telemetria por Delta" description="Otimização de escritas em banco de dados para suportar frotas de 500+ vans sem lag." />
                            <CheckItem title="Zero-Digit Contract" description="Contratos gerados e aceitos digitalmente via celular do pai. Zero papel." />
                        </div>
                        <div className="bg-primary/5 rounded-[2.5rem] p-1 border-2 border-primary/20">
                            <div className="bg-background rounded-[2.4rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 text-primary"><Zap size={120}/></div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Roadmap 2024</p>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <p className="text-xs md:text-sm font-bold uppercase italic">Faturamento Automático (Pix/Webhook)</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-primary" />
                                        <p className="text-xs md:text-sm font-bold uppercase italic">Mural de Avisos em Push</p>
                                    </div>
                                    <div className="flex items-center gap-3 opacity-40">
                                        <div className="h-2 w-2 rounded-full bg-muted-foreground" />
                                        <p className="text-xs md:text-sm font-bold uppercase italic">Seguro por Viagem (Marketplace)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Slide>

            {/* Slide 5: The Ask */}
            <Slide className="bg-black text-white">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50" />
                 <h2 className="text-5xl md:text-9xl font-black text-center mb-12 uppercase italic tracking-tighter leading-[0.8] relative z-10">
                    The <span className="text-primary">Ask</span>
                 </h2>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full relative z-10">
                    <div className="bg-white/5 backdrop-blur-md border border-white/10 p-6 md:p-10 rounded-[2rem] text-center space-y-4">
                        <p className="text-primary font-black uppercase tracking-[0.3em] text-xs">Busca de Capital</p>
                        <p className="text-6xl md:text-9xl font-black tracking-tighter italic">R$ 150k</p>
                        <p className="text-muted-foreground font-bold uppercase tracking-widest text-sm">Equity: 10%</p>
                    </div>
                    <div className="bg-primary p-6 md:p-10 rounded-[2rem] text-black flex flex-col justify-center space-y-6">
                        <h3 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter leading-none">Uso do <br/>Capital</h3>
                        <div className="space-y-3 font-black uppercase text-[10px] md:text-xs tracking-tight">
                            <div className="flex justify-between border-b border-black/20 pb-2"><span>60% Produto & IA</span><span>Telemetria ROI</span></div>
                            <div className="flex justify-between border-b border-black/20 pb-2"><span>20% Marketing</span><span>Aquisição B2B</span></div>
                            <div className="flex justify-between"><span>20% Operação</span><span>Infra Escalonável</span></div>
                        </div>
                        <Button className="w-full h-14 bg-black text-white font-black uppercase italic hover:bg-black/80 shadow-2xl" asChild>
                            <Link href="/login">Investir na Transformação</Link>
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
            <p className="text-2xl md:text-3xl font-black text-foreground italic">{value}</p>
            <p className="text-[9px] md:text-[10px] font-black uppercase text-muted-foreground tracking-widest">{label}</p>
        </div>
    );
}

function CheckItem({ title, description }: { title: string, description: string }) {
    return (
        <div className="flex gap-4 group">
            <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all shrink-0">
                <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="space-y-1">
                <p className="font-black text-sm uppercase italic tracking-tight">{title}</p>
                <p className="text-xs text-muted-foreground leading-tight font-medium">{description}</p>
            </div>
        </div>
    );
}
