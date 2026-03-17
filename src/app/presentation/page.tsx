
'use client';

import { 
    BarChart, 
    Briefcase, 
    CheckCircle, 
    DollarSign, 
    Gem, 
    Lightbulb, 
    Milestone, 
    Rocket, 
    Target, 
    Users, 
    Wallet, 
    XCircle, 
    ShieldCheck, 
    Bus, 
    Sparkles, 
    Gauge, 
    HeartPulse, 
    MapPinned, 
    Activity, 
    TrendingDown,
    Zap,
    Database,
    Search,
    Smartphone,
    FileText,
    BellRing,
    School,
    ArrowDownRight,
    Lock
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Helper component for consistent slide styling
const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={`min-h-screen w-full max-w-6xl mx-auto flex flex-col justify-center items-center p-8 md:p-16 ${className}`}>
    {children}
  </section>
);

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description: string }) => (
    <div className="bg-background/50 rounded-xl p-6 border border-primary/20 backdrop-blur-sm h-full hover:border-primary/50 transition-all shadow-lg">
        <div className="flex items-center gap-4 mb-2">
            <div className="text-primary">{icon}</div>
            <h3 className="text-lg font-bold text-foreground uppercase tracking-tighter">{title}</h3>
        </div>
        <p className="text-5xl font-black text-primary tracking-tighter">{value}</p>
        <p className="text-sm text-muted-foreground mt-2 leading-snug font-medium">{description}</p>
    </div>
);

export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased selection:bg-primary/20 overflow-x-hidden">
            <div className="fixed top-4 right-4 z-50">
                <Button asChild variant="outline" className="shadow-lg">
                    <Link href="/">Voltar ao Login</Link>
                </Button>
            </div>
            
            {/* Slide 1: Vision - A Próxima Geração */}
            <Slide className="text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10" />
                <Badge className="mb-6 bg-primary text-primary-foreground font-black tracking-[0.3em] px-4 py-1">DISRUPÇÃO OPERACIONAL</Badge>
                <div className="bg-primary/10 p-6 rounded-full border-2 border-primary/30 mb-8 shadow-2xl">
                    <Rocket className="w-20 h-20 text-primary" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-none">Guardian</h1>
                <p className="mt-8 text-xl md:text-3xl text-muted-foreground max-w-4xl font-bold leading-tight">
                    Não somos apenas um rastreador. Somos o <span className="text-primary">sistema de inteligência</span> que prova a lucratividade do transporte escolar.
                </p>
                <div className="mt-16 flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    <div className="h-[1px] w-12 bg-muted-foreground" />
                    Role para ver como economizamos dinheiro real
                    <div className="h-[1px] w-12 bg-muted-foreground" />
                </div>
            </Slide>

            {/* Slide 2: The Problem - Dinheiro Perdido */}
            <Slide>
                <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase italic tracking-tighter leading-none">
                    Onde o <span className="text-primary">Lucro</span> Está Escapando?
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <StatCard 
                        icon={<TrendingDown size={40} className="text-red-500" />} 
                        title="Fuga de Receita" 
                        value="18%"
                        description="Média de desperdício em combustível e desgaste por rotas ineficientes e falta de auditoria de desvios."
                    />
                    <StatCard 
                        icon={<Gauge size={40} className="text-orange-500" />} 
                        title="Manutenção Cega" 
                        value="R$ 4k"
                        description="Custo médio de quebras emergenciais que poderiam ser evitadas com acompanhamento do KM real via telemetria."
                    />
                    <StatCard 
                        icon={<Activity size={40} className="text-blue-500" />} 
                        title="Opacidade de Dados" 
                        value="Zero"
                        description="A maioria dos gestores não sabe o custo/km real de sua frota hoje. Eles operam no escuro."
                    />
                </div>
            </Slide>

            {/* Slide 3: Big Data & Barrier to Entry */}
            <Slide className="bg-primary/[0.02]">
                 <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase italic tracking-tighter">
                    <Database className="inline-block text-primary h-12 w-12 mr-4" />
                    Barreira de Entrada: <span className="text-primary">Big Data</span>
                 </h2>
                 <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="bg-primary/5 p-6 rounded-xl border-l-8 border-primary shadow-xl">
                            <h3 className="text-2xl font-black flex items-center gap-2 mb-3 uppercase italic tracking-tighter"><Search className="text-primary h-6 w-6"/> Base Nacional de Escolas</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-medium">Possuímos o mapeamento de <strong>190.000+ instituições</strong>. O gestor cadastra uma escola em 1 clique, sem digitar endereços ou coordenadas manuais. <span className="text-primary font-bold">Vantagem competitiva absoluta.</span></p>
                        </div>
                        <div className="bg-blue-500/5 p-6 rounded-xl border-l-8 border-blue-500 shadow-xl">
                            <h3 className="text-2xl font-black flex items-center gap-2 mb-3 uppercase italic tracking-tighter"><Lock className="text-blue-500 h-6 w-6"/> Soberania de Custos (FinOps)</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-medium">Nossa arquitetura híbrida (Google + OpenStreetMap) reduz o custo de software em até <strong>90% em escala</strong>. Somos lucrativos onde os concorrentes morrem pagando taxas de APIs.</p>
                        </div>
                    </div>
                    <div className="relative aspect-square rounded-3xl overflow-hidden border-4 border-primary/20 bg-background shadow-2xl flex items-center justify-center p-12 group">
                        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors duration-500" />
                        <div className="text-center space-y-6 relative z-10">
                            <div className="p-8 bg-primary/10 rounded-full inline-block group-hover:scale-110 transition-transform duration-500 shadow-inner">
                                <Sparkles className="h-24 w-24 text-primary animate-pulse" />
                            </div>
                            <p className="text-3xl font-black uppercase italic tracking-tighter text-foreground">Inteligência Territorial</p>
                            <p className="text-sm text-muted-foreground font-black uppercase tracking-[0.3em]">O Google fornece o mapa. <br/> Nós fornecemos a estratégia.</p>
                        </div>
                    </div>
                 </div>
            </Slide>

            {/* Slide 4: Onboarding via IA - Zero Digitação */}
            <Slide>
                 <Badge className="mb-4 bg-primary text-primary-foreground font-black tracking-widest px-4 py-1">ESCALABILIDADE COMERCIAL</Badge>
                 <h2 className="text-4xl md:text-6xl font-black text-center mb-12 uppercase italic tracking-tighter">Onboarding Inteligente</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                    <ProcessStep icon={<Smartphone />} label="Convite WhatsApp" description="Link público instantâneo" />
                    <ProcessStep icon={<Zap className="text-amber-500" />} label="Leitura via IA" description="OCR de RG e CNH" />
                    <ProcessStep icon={<MapPinned />} label="GPS Validado" description="Embarque sem erro" />
                    <ProcessStep icon={<School />} label="Modo Flexível" description="Só Ida ou Só Volta" />
                    <ProcessStep icon={<Users />} label="Multi-filhos" description="Herança de dados" />
                    <ProcessStep icon={<FileText />} label="Contrato Digital" description="Aceite em segundos" />
                 </div>
                 <p className="mt-16 text-center text-2xl text-muted-foreground max-w-4xl font-bold leading-tight">
                    Eliminamos o back-office. O pai faz o trabalho de cadastro via IA, e o gestor apenas <span className="text-primary">confirma e fatura</span>.
                 </p>
            </Slide>

            {/* Slide 5: The ROI Proof - Real vs Planned */}
            <Slide className="bg-secondary/20">
                <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase italic tracking-tighter leading-none">
                    <Activity className="inline-block text-primary h-12 w-12 mr-4" />
                    A Prova do <span className="text-primary">ROI</span>
                </h2>
                <div className="grid md:grid-cols-2 gap-12 w-full">
                    <Card className="p-10 bg-background border-2 border-dashed border-muted relative group overflow-hidden shadow-xl">
                        <div className="absolute -right-4 -bottom-4 opacity-5"><Sparkles size={200}/></div>
                        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3 text-muted-foreground tracking-tighter">
                            <Sparkles className="h-6 w-6"/> Planejamento IA
                        </h3>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">A sequência lógica perfeita para minimizar a distância percorrida baseada em endereços reais e portões escolares.</p>
                        <div className="h-48 bg-secondary/30 rounded-xl border border-dashed flex flex-col items-center justify-center p-6 text-center">
                            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2">Simulação de Rota</p>
                            <p className="text-sm font-bold italic text-muted-foreground/60">Redução projetada de 12% a 18% em KM rodado.</p>
                        </div>
                    </Card>
                    <Card className="p-10 bg-background border-4 border-primary/30 relative shadow-2xl overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-primary"><Activity size={200}/></div>
                        <h3 className="text-xl font-black uppercase italic mb-6 flex items-center gap-3 text-primary tracking-tighter">
                            <MapPinned className="h-6 w-6"/> Telemetria Real
                        </h3>
                        <p className="text-lg text-muted-foreground mb-8 leading-relaxed font-medium">O traçado real capturado pelo GPS, detectando desvios, tempo em trânsito e provando a economia de combustível.</p>
                        <div className="h-48 bg-primary/10 rounded-xl border-2 border-primary/20 flex flex-col items-center justify-center gap-3 p-6 shadow-inner">
                            <p className="text-6xl font-black text-primary tracking-tighter">14.2%</p>
                            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-primary">Economia Real Detectada</p>
                        </div>
                    </Card>
                </div>
            </Slide>

             {/* Slide 6: The Investment - Final Ask */}
            <Slide>
                 <Badge className="mb-6 bg-primary text-primary-foreground font-black tracking-widest px-4 py-1">PITCH DE INVESTIMENTO</Badge>
                 <h2 className="text-5xl md:text-7xl font-black text-center mb-8 uppercase italic tracking-tighter leading-none">O Futuro é <span className="text-primary">Data-Driven</span></h2>
                 <p className="text-2xl text-muted-foreground mb-16 text-center max-w-3xl font-bold leading-tight">Estamos escalando a primeira camada de inteligência e telemetria focada no setor escolar brasileiro.</p>
                 <div className="grid md:grid-cols-2 gap-12 w-full items-center">
                    <div className="bg-background border-4 border-primary p-12 rounded-[2rem] text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                        <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.3em]">Busca de Capital</p>
                        <p className="text-8xl font-black text-primary my-6 tracking-tighter">R$ 150k</p>
                        <p className="text-muted-foreground text-lg font-bold uppercase tracking-widest">em troca de</p>
                        <p className="text-5xl font-black text-foreground mt-6 italic tracking-tighter">10% Equity</p>
                    </div>
                     <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary/20 pb-3 tracking-tighter">Roadmap de Expansão</h3>
                        <div className="space-y-5">
                            <ResourceItem color="bg-primary shadow-[0_0_15px_rgba(42,176,193,0.5)]" label="60% Produto & IA (Telemetria Real-time)" />
                            <ResourceItem color="bg-primary/70" label="20% Marketing (Aquisição de Frotas)" />
                            <ResourceItem color="bg-primary/40" label="20% Infraestrutura & Segurança" />
                        </div>
                        <div className="pt-8">
                            <Button className="w-full h-16 text-xl font-black uppercase italic shadow-2xl shadow-primary/30 active:scale-95 transition-all" asChild>
                                <Link href="/login">Vamos proteger essa jornada?</Link>
                            </Button>
                        </div>
                     </div>
                 </div>
            </Slide>

        </main>
    );
}

const ProcessStep = ({ icon, label, description }: { icon: React.ReactNode, label: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-background border-2 border-border/50 hover:border-primary/40 transition-all group shadow-sm hover:shadow-md">
        <div className="p-5 rounded-full bg-secondary/50 text-primary shadow-inner group-hover:scale-110 transition-transform group-hover:bg-primary/10">
            {icon}
        </div>
        <div className="space-y-1">
            <p className="text-[11px] font-black uppercase leading-tight tracking-tight text-foreground">{label}</p>
            <p className="text-[9px] text-muted-foreground font-medium leading-none">{description}</p>
        </div>
    </div>
);

const ResourceItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-secondary/50 rounded-xl transition-all border border-transparent hover:border-border">
        <div className={`w-6 h-6 rounded-lg ${color} shrink-0`}></div>
        <span className="text-base font-bold uppercase tracking-tight text-foreground/80">{label}</span>
    </div>
);
