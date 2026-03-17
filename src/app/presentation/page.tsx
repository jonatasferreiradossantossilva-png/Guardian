
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
            
            {/* Slide 1: Visão Geral */}
            <Slide className="text-center relative">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent -z-10" />
                <Badge className="mb-6 bg-primary text-primary-foreground font-black tracking-[0.3em] px-4 py-1">O FUTURO DO TRANSPORTE ESCOLAR</Badge>
                <div className="bg-primary/10 p-6 rounded-full border-2 border-primary/30 mb-8 shadow-2xl">
                    <Rocket className="w-20 h-20 text-primary" />
                </div>
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-foreground uppercase italic leading-none">Guardian</h1>
                <p className="mt-8 text-xl md:text-3xl text-muted-foreground max-w-4xl font-bold leading-tight">
                    Inteligência operacional e telemetria de alta precisão para frotas que buscam <span className="text-primary">lucratividade e escala</span>.
                </p>
                <div className="mt-16 flex items-center gap-4 text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
                    <div className="h-[1px] w-12 bg-muted-foreground" />
                    Role para conhecer os diferenciais
                    <div className="h-[1px] w-12 bg-muted-foreground" />
                </div>
            </Slide>

            {/* Slide 2: Problemas do Mercado */}
            <Slide>
                <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase italic tracking-tighter leading-none">
                    Desafios de <span className="text-primary">Escala e Custo</span>
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <StatCard 
                        icon={<TrendingDown size={40} className="text-red-500" />} 
                        title="Desvio de Rota" 
                        value="15%"
                        description="Média de desperdício em combustível por falta de roteirização dinâmica e auditoria de GPS."
                    />
                    <StatCard 
                        icon={<Gauge size={40} className="text-orange-500" />} 
                        title="Manutenção" 
                        value="40%"
                        description="Aumento no custo de oficina quando a manutenção é reativa em vez de preditiva via KM real."
                    />
                    <StatCard 
                        icon={<Smartphone size={40} className="text-blue-500" />} 
                        title="Burocracia" 
                        value="Zero"
                        description="O tempo perdido com digitação manual de cadastros e contratos é o maior gargalo do gestor."
                    />
                </div>
            </Slide>

            {/* Slide 3: Nossa Solução Técnica */}
            <Slide className="bg-primary/[0.02]">
                 <h2 className="text-4xl md:text-6xl font-black text-center mb-16 uppercase italic tracking-tighter">
                    Por que o Guardian é <span className="text-primary">Único</span>?
                 </h2>
                 <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <div className="bg-primary/5 p-6 rounded-xl border-l-8 border-primary shadow-xl">
                            <h3 className="text-2xl font-black flex items-center gap-2 mb-3 uppercase italic tracking-tighter"><Bot className="text-primary h-6 w-6"/> OCR e IA Generativa</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-medium">Extraímos dados de documentos oficiais (RG/CNH) automaticamente. O pai faz o cadastro em segundos via celular.</p>
                        </div>
                        <div className="bg-blue-500/5 p-6 rounded-xl border-l-8 border-blue-500 shadow-xl">
                            <h3 className="text-2xl font-black flex items-center gap-2 mb-3 uppercase italic tracking-tighter"><Database className="text-blue-500 h-6 w-6"/> Base de 190k Escolas</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-medium">Base de dados proprietária do INEP integrada. Localização precisa da porta da escola sem digitação manual.</p>
                        </div>
                        <div className="bg-green-500/5 p-6 rounded-xl border-l-8 border-green-500 shadow-xl">
                            <h3 className="text-2xl font-black flex items-center gap-2 mb-3 uppercase italic tracking-tighter"><ShieldCheck className="text-green-500 h-6 w-6"/> Contratos Automáticos</h3>
                            <p className="text-base text-muted-foreground leading-relaxed font-medium">Geração instantânea de contratos adaptados à modalidade (Só Ida, Só Volta ou Completo) com aceite digital.</p>
                        </div>
                    </div>
                    <div className="bg-background border-4 border-primary/20 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-primary"><Activity size={200}/></div>
                        <h4 className="text-[10px] font-black uppercase text-primary tracking-widest mb-4">Módulo de Telemetria ROI</h4>
                        <p className="text-2xl font-black italic uppercase leading-none mb-6">Auditoria de <span className="text-primary">Economia Real</span></p>
                        <div className="space-y-4 text-sm font-medium">
                            <div className="flex justify-between border-b pb-2"><span>KM Planejado (IA)</span><span className="font-bold">42.4 km</span></div>
                            <div className="flex justify-between border-b pb-2"><span>KM Realizado (GPS)</span><span className="font-bold text-green-500">38.1 km</span></div>
                            <div className="flex justify-between pt-2"><span>Eficiência Detectada</span><Badge className="bg-green-500 text-white font-black">+11.2%</Badge></div>
                        </div>
                    </div>
                 </div>
            </Slide>

            {/* Slide 4: Roadmap e Escala */}
            <Slide>
                 <Badge className="mb-4 bg-primary text-primary-foreground font-black tracking-widest px-4 py-1">ESCALABILIDADE</Badge>
                 <h2 className="text-4xl md:text-6xl font-black text-center mb-12 uppercase italic tracking-tighter">Pronto para o Crescimento</h2>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full">
                    <ProcessStep icon={<Smartphone />} label="Mobile-First" description="UX otimizada para campo" />
                    <ProcessStep icon={<Zap className="text-amber-500" />} label="FinOps" description="Custo zero de infra" />
                    <ProcessStep icon={<MapPinned />} label="Multi-Escola" description="Rotas complexas otimizadas" />
                    <ProcessStep icon={<School />} label="Só Ida/Volta" description="Flexibilidade comercial" />
                    <ProcessStep icon={<Users />} label="Multi-filhos" description="Herança de dados" />
                    <ProcessStep icon={<FileText />} label="Contratos" description="Segurança Jurídica" />
                 </div>
                 <p className="mt-16 text-center text-2xl text-muted-foreground max-w-4xl font-bold leading-tight">
                    O Guardian não é apenas um app. É o <span className="text-primary">sistema operacional</span> definitivo para o transporte escolar brasileiro.
                 </p>
            </Slide>

             {/* Slide 5: The Ask */}
            <Slide>
                 <Badge className="mb-6 bg-primary text-primary-foreground font-black tracking-widest px-4 py-1">INVESTIMENTO</Badge>
                 <h2 className="text-5xl md:text-7xl font-black text-center mb-8 uppercase italic tracking-tighter leading-none">O Futuro é <span className="text-primary">Data-Driven</span></h2>
                 <div className="grid md:grid-cols-2 gap-12 w-full items-center">
                    <div className="bg-background border-4 border-primary p-12 rounded-[2rem] text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
                        <p className="text-muted-foreground text-sm font-black uppercase tracking-[0.3em]">Busca de Capital</p>
                        <p className="text-8xl font-black text-primary my-6 tracking-tighter">R$ 150k</p>
                        <p className="text-muted-foreground text-lg font-bold uppercase tracking-widest">em troca de</p>
                        <p className="text-5xl font-black text-foreground mt-6 italic tracking-tighter">10% Equity</p>
                    </div>
                     <div className="space-y-8">
                        <h3 className="text-2xl font-black uppercase italic border-b-2 border-primary/20 pb-3 tracking-tighter">Plano de Expansão</h3>
                        <div className="space-y-5">
                            <ResourceItem color="bg-primary" label="60% Produto & IA (Telemetria)" />
                            <ResourceItem color="bg-primary/70" label="20% Marketing (Aquisição)" />
                            <ResourceItem color="bg-primary/40" label="20% Infraestrutura" />
                        </div>
                        <div className="pt-8">
                            <Button className="w-full h-16 text-xl font-black uppercase italic shadow-2xl shadow-primary/30" asChild>
                                <Link href="/login">Iniciar Transformação</Link>
                            </Button>
                        </div>
                     </div>
                 </div>
            </Slide>

        </main>
    );
}

const ProcessStep = ({ icon, label, description }: { icon: React.ReactNode, label: string, description: string }) => (
    <div className="flex flex-col items-center text-center gap-3 p-6 rounded-2xl bg-background border-2 border-border/50 hover:border-primary/40 transition-all group shadow-sm">
        <div className="p-5 rounded-full bg-secondary/50 text-primary shadow-inner group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <div className="space-y-1">
            <p className="text-[11px] font-black uppercase tracking-tight text-foreground">{label}</p>
            <p className="text-[9px] text-muted-foreground font-medium leading-none">{description}</p>
        </div>
    </div>
);

const ResourceItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-4 p-3 hover:bg-secondary/50 rounded-xl transition-all border border-transparent">
        <div className={`w-6 h-6 rounded-lg ${color} shrink-0`}></div>
        <span className="text-base font-bold uppercase tracking-tight text-foreground/80">{label}</span>
    </div>
);
