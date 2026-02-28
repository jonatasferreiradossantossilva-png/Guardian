
'use client';

import { BarChart, Briefcase, CheckCircle, DollarSign, Gem, Lightbulb, Milestone, Rocket, Target, User, Users, Wallet, XCircle, FileImage, ShieldCheck, HandHeart, Bus, Sparkles, Newspaper, Mail, Building, GitMerge, Gauge, HeartPulse, MapPinned, Activity } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper component for consistent slide styling
const Slide = ({ children, className = '', id = '' }: { children: React.ReactNode, className?: string, id?: string }) => (
  <section id={id} className={`min-h-screen w-full max-w-6xl mx-auto flex flex-col justify-center items-center p-8 md:p-16 ${className}`}>
    {children}
  </section>
);

const StatCard = ({ icon, title, value, description }: { icon: React.ReactNode, title: string, value: string, description: string }) => (
    <div className="bg-background/50 rounded-xl p-6 border border-primary/20 backdrop-blur-sm h-full">
        <div className="flex items-center gap-4 mb-2">
            <div className="text-primary">{icon}</div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-4xl font-bold text-primary">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
);

const CompetitorCard = ({ title, description }: { title: string, description: string }) => (
    <div className="bg-background/50 p-4 rounded-lg border border-border">
        <h4 className="font-semibold text-primary">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
    </div>
);


export default function PresentationPage() {
    return (
        <main className="bg-background text-foreground antialiased selection:bg-primary/20">
            <div className="fixed top-4 right-4 z-50">
                <Button asChild variant="outline">
                    <Link href="/">Voltar ao Login</Link>
                </Button>
            </div>
            
            {/* Slide 1: Vision */}
            <Slide className="text-center">
                <div className="bg-primary/10 p-4 rounded-full border-2 border-primary/30 mb-8">
                    <Rocket className="w-16 h-16 text-primary" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">Guardian</h1>
                <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl">
                    Inteligência Operacional e Prova de ROI para o Transporte Escolar.
                </p>
                <div className="mt-12 text-sm text-muted-foreground animate-pulse">
                    <p>Role para baixo para ver a apresentação</p>
                </div>
            </Slide>

            {/* Slide 2: The Problem */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Lightbulb className="inline-block text-primary h-12 w-12 mr-4" />O Problema: Dinheiro "Queimado" no Asfalto</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <StatCard 
                        icon={<TrendingDown size={32} className="text-red-500" />} 
                        title="Ineficiência Invisível" 
                        value="15-20%"
                        description="De desperdício médio em combustível por rotas mal planejadas ou desvios não monitorados."
                    />
                    <StatCard 
                        icon={<Gauge size={32} className="text-orange-500" />} 
                        title="Manutenção Reativa" 
                        value="+40% de custo"
                        description="Consertar quando quebra é 40% mais caro do que a manutenção preventiva baseada no uso real."
                    />
                    <StatCard 
                        icon={<Activity size={32} className="text-blue-500" />} 
                        title="Falta de Dados" 
                        value="Opacidade"
                        description="O gestor não sabe se a rota executada condiz com a planejada, perdendo o controle do custo/km."
                    />
                </div>
            </Slide>

            {/* Slide 3: Telemetry & Predictive Maintenance */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Activity className="inline-block text-primary h-12 w-12 mr-4" />Inteligência de Telemetria</h2>
                 <div className="w-full bg-background/50 border border-primary/20 rounded-xl p-8 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Gauge className="text-primary"/> Manutenção Preditiva</h3>
                                <p className="text-sm text-muted-foreground">O sistema monitora o odômetro via GPS em tempo real. Alertas de revisão são gerados pelo <strong>uso real</strong>, não por datas arbitrárias, reduzindo quebras em rota.</p>
                            </div>
                             <div className="bg-destructive/5 p-4 rounded-lg border-l-4 border-destructive">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><HeartPulse className="text-destructive"/> Alertas Médicos Críticos</h3>
                                <p className="text-sm text-muted-foreground">Segurança humanizada: Sinalização visual pulsante para alunos com necessidades especiais ou alergias graves durante o embarque.</p>
                            </div>
                            <div className="bg-blue-500/5 p-4 rounded-lg border-l-4 border-blue-500">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><MapPinned className="text-blue-500"/> Geocodificação Invisível</h3>
                                <p className="text-sm text-muted-foreground">Cadastro sem esforço: O sistema valida o GPS automaticamente ao salvar, garantindo dados perfeitos para a IA de roteirização.</p>
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 shadow-2xl">
                            <Image src="https://picsum.photos/seed/fleet-telemetry/800/800" layout="fill" objectFit="cover" alt="Telemetria Guardian" data-ai-hint="fleet monitoring" />
                        </div>
                    </div>
                 </div>
            </Slide>

            {/* Slide 4: Proof of ROI */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    <BarChart className="inline-block text-primary h-12 w-12 mr-4" />
                    A Prova de ROI: Planejado vs. Real
                </h2>
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    <Card className="p-6 bg-secondary/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Sparkles className="text-primary"/> O que a IA Planeja</h3>
                        <p className="text-sm text-muted-foreground mb-4">A sequência lógica perfeita baseada em endereços e regras de negócio para minimizar a distância.</p>
                        <div className="h-40 bg-background rounded border border-dashed flex items-center justify-center italic text-muted-foreground">
                            Visualização da Rota Otimizada
                        </div>
                    </Card>
                    <Card className="p-6 bg-primary/5 border-primary/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPinned className="text-primary"/> O que o GPS Captura</h3>
                        <p className="text-sm text-muted-foreground mb-4">O traçado real percorrido pela van, detectando desvios, paradas não planejadas e economia real de combustível.</p>
                        <div className="h-40 bg-background rounded border flex items-center justify-center font-bold text-primary">
                            Dashboard de Performance & Eficiência
                        </div>
                    </Card>
                </div>
                <p className="mt-8 text-center text-xl font-medium text-primary">"Não é apenas software de gestão, é uma ferramenta de redução de custos comprovada por dados."</p>
            </Slide>
            
            {/* Differentiators Section */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Gem className="inline-block text-primary h-12 w-12 mr-4" />Nossa Vantagem Competitiva</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                         <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                            <GitMerge className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Eficiência de Roteirização</h3>
                        <p className="mt-2 text-muted-foreground">Comparativo de KM Planejado vs. Real que permite ao gestor bonificar motoristas eficientes e corrigir rotas custosas.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                            <Gauge className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Manutenção Preditiva</h3>
                        <p className="mt-2 text-muted-foreground">Economia direta ao evitar quebras catastróficas e gerenciar a frota com base na telemetria real de cada veículo.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                            <HeartPulse className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Segurança Humanizada</h3>
                        <p className="mt-2 text-muted-foreground">Monitoramento de alertas médicos que traz uma camada de proteção infantil que o WhatsApp nunca terá.</p>
                    </div>
                    <div className="flex flex-col items-center text-center p-6 border-transparent rounded-lg">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary border-2 border-primary/20">
                            <ShieldCheck className="h-8 w-8" />
                        </div>
                        <h3 className="mt-4 text-xl font-semibold">Conformidade e Contratos</h3>
                        <p className="mt-2 text-muted-foreground">Gestão jurídica simplificada com contratos aceitos digitalmente e faturamento automatizado via WhatsApp.</p>
                    </div>
                </div>
            </Slide>

            {/* Slide: Logo Concepts */}
             <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    <FileImage className="inline-block text-primary h-12 w-12 mr-4" />
                    Identidade Visual: O Abraço Protetor
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <div className="border-2 border-primary/50 ring-4 ring-primary/10 rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4 text-primary">Confiança e Tecnologia</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-blue-600 relative">
                            <HandHeart className="w-48 h-48 text-red-500 absolute stroke-black stroke-[0.5]" fill="red"/>
                            <Bus className="w-20 h-20 text-yellow-400 relative" />
                        </div>
                        <p className="text-sm text-muted-foreground">Fundo azul royal para seriedade e van amarela destacada no centro do cuidado.</p>
                    </div>
                     <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Modernidade e Energia</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-slate-800 relative">
                           <HandHeart className="w-48 h-48 text-white absolute stroke-black stroke-[0.5]" fill="white"/>
                           <Bus className="w-20 h-20 text-orange-500 relative" />
                        </div>
                        <p className="text-sm text-muted-foreground">Contraste moderno com van laranja vibrante transmitindo atenção e energia.</p>
                    </div>
                    <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Natureza e Tranquilidade</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-green-800 relative">
                           <HandHeart className="w-48 h-48 text-white absolute stroke-black stroke-[0.5]" fill="white"/>
                            <Bus className="w-20 h-20 text-yellow-300 relative" />
                        </div>
                        <p className="text-sm text-muted-foreground">Verde escuro para segurança e calma, criando uma marca acolhedora.</p>
                    </div>
                </div>
            </Slide>

             {/* The Ask */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">A Proposta</h2>
                 <p className="text-xl text-muted-foreground mb-12 text-center">Buscamos um parceiro estratégico para escalar a primeira plataforma de telemetria inteligente para o setor escolar.</p>
                 <div className="grid md:grid-cols-2 gap-8 w-full items-center">
                    <div className="bg-background/50 border border-border p-8 rounded-lg text-center">
                        <p className="text-muted-foreground text-lg">Estamos buscando</p>
                        <p className="text-6xl font-bold text-primary my-2">R$ 80.000</p>
                        <p className="text-muted-foreground text-lg">em troca de</p>
                        <p className="text-4xl font-bold text-primary mt-2">10% de participação</p>
                    </div>
                     <div>
                        <h3 className="text-xl font-semibold mb-4 text-center">Uso dos Recursos</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary mr-2"></div><span className="font-semibold">60% - Produto (Finalização da Telemetria):</span></div>
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary/70 mr-2"></div><span className="font-semibold">20% - Marketing (Aquisição de Primeiras Frotas):</span></div>
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary/40 mr-2"></div><span className="font-semibold">20% - Custos Operacionais e Cloud:</span></div>
                        </div>
                     </div>
                 </div>
            </Slide>

        </main>
    );
}
