
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
    User, 
    Users, 
    Wallet, 
    XCircle, 
    FileImage, 
    ShieldCheck, 
    Bus, 
    Sparkles, 
    Newspaper, 
    Mail, 
    Building, 
    GitMerge, 
    Gauge, 
    HeartPulse, 
    MapPinned, 
    Activity, 
    TrendingDown,
    ArrowDownRight,
    Zap,
    Database,
    Search,
    Smartphone,
    ClipboardCheck,
    Navigation,
    FileText,
    BellRing,
    School
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
    <div className="bg-background/50 rounded-xl p-6 border border-primary/20 backdrop-blur-sm h-full">
        <div className="flex items-center gap-4 mb-2">
            <div className="text-primary">{icon}</div>
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-4xl font-bold text-primary">{value}</p>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
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
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground uppercase italic">Guardian</h1>
                <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl font-medium">
                    Inteligência Operacional, Big Data de Escolas e Prova de ROI para o Transporte Escolar.
                </p>
                <div className="mt-12 text-sm text-muted-foreground animate-bounce">
                    <p className="uppercase tracking-[0.2em] font-black">Role para baixo</p>
                </div>
            </Slide>

            {/* Slide 2: The Problem */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">
                    <Lightbulb className="inline-block text-primary h-12 w-12 mr-4" />
                    Dinheiro "Queimado" no Asfalto
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <StatCard 
                        icon={<TrendingDown size={32} className="text-red-500" />} 
                        title="Ineficiência Invisível" 
                        value="15-20%"
                        description="De desperdício médio em combustível por rotas mal planejadas ou desvios não monitorados pelo gestor."
                    />
                    <StatCard 
                        icon={<Gauge size={32} className="text-orange-500" />} 
                        title="Manutenção Reativa" 
                        value="+40% de custo"
                        description="Consertar quando quebra é 40% mais caro do que a manutenção preventiva baseada no KM real via GPS."
                    />
                    <StatCard 
                        icon={<Activity size={32} className="text-blue-500" />} 
                        title="Falta de Dados (Opacidade)" 
                        value="Incerteza"
                        description="O gestor não sabe se a rota executada condiz com a planejada, perdendo o controle do custo/km e da segurança."
                    />
                </div>
            </Slide>

            {/* Slide 3: Smart Alerts & Multi-Child */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">
                    <Sparkles className="inline-block text-primary h-12 w-12 mr-4" />
                    Segurança Contextual Ativa
                </h2>
                <div className="grid md:grid-cols-2 gap-12 items-center w-full">
                    <div className="space-y-8">
                        <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-10"><BellRing size={120} /></div>
                            <h3 className="text-xl font-bold text-primary mb-2 flex items-center gap-2">
                                <BellRing className="h-5 w-5" /> Alerta de Proximidade (800m)
                            </h3>
                            <p className="text-sm text-muted-foreground">Diferente de apps que rastreiam o tempo todo e gastam bateria, o Guardian dispara um alerta push apenas quando a van entra no <strong>raio crítico de 800m</strong>. Foco total no embarque.</p>
                        </div>
                        <div className="bg-blue-500/5 p-6 rounded-xl border border-blue-500/20 relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 opacity-10"><Users size={120} /></div>
                            <h3 className="text-xl font-bold text-blue-500 mb-2 flex items-center gap-2">
                                <Users className="h-5 w-5" /> Gestão Multi-filhos Unificada
                            </h3>
                            <p className="text-sm text-muted-foreground">Consolidamos a jornada de todos os filhos em uma única tela inteligente. O pai cadastra o primeiro, e o Guardian <strong>herda automaticamente</strong> endereços e preferências para os irmãos.</p>
                        </div>
                    </div>
                    <Card className="p-10 border-dashed border-primary/40 bg-secondary/10 text-center flex flex-col justify-center gap-6 shadow-xl">
                        <div className="mx-auto bg-primary/20 p-5 rounded-full"><Smartphone className="text-primary h-14 w-14" /></div>
                        <h4 className="font-black uppercase italic text-lg tracking-tighter">Interface de Alta Performance</h4>
                        <p className="text-xs text-muted-foreground font-medium leading-relaxed italic">
                            "Eliminamos a redigitação. O pai vê a Van do Enzo chegando na escola e a Van da Valentina saindo de casa simultaneamente, sem trocar de login."
                        </p>
                    </Card>
                </div>
            </Slide>

            {/* Slide 4: Comparison with Market */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">Guardian vs. Legado</h2>
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-muted-foreground uppercase tracking-widest border-b pb-2">Apps de Rastreamento</h3>
                        <div className="space-y-3">
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Apenas rastreio passivo (Dots on Map)." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Dependência total de APIs caras (Google)." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Cadastro manual lento e propenso a erro." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Nenhum dado preditivo de manutenção ou ROI." />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-primary uppercase tracking-widest border-b border-primary/30 pb-2">Guardian Intelligence</h3>
                        <div className="space-y-3">
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Provamos a economia real de combustível (ROI)." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Base Proprietária de 190k escolas (Custo Zero)." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Onboarding Inteligente (Link Público + OCR)." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Alertas médicos pulsantes no terminal de bordo." />
                        </div>
                    </div>
                </div>
            </Slide>

            {/* Slide 5: Onboarding Express */}
            <Slide>
                 <Badge className="mb-4 bg-primary text-primary-foreground font-black tracking-widest">O GRANDE DIFERENCIAL COMERCIAL</Badge>
                 <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">Onboarding Inteligente: Do Convite ao Contrato</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
                    <ProcessStep icon={<Smartphone />} label="Convite WhatsApp" />
                    <ProcessStep icon={<Sparkles />} label="Leitura via IA" />
                    <ProcessStep icon={<MapPinned />} label="GPS Validado" />
                    <ProcessStep icon={<School />} label="Base de Escolas" />
                    <ProcessStep icon={<Users />} label="Multi-filhos" />
                    <ProcessStep icon={<FileText />} label="Contrato Digital" />
                 </div>
                 <p className="mt-12 text-center text-xl text-muted-foreground max-w-4xl font-medium">
                    O pai faz o trabalho pesado via Inteligência Artificial (OCR), validando endereços e aceitando contratos em segundos. O gestor apenas valida e inicia a operação.
                 </p>
            </Slide>

            {/* Slide 6: Big Data & Knowledge Base */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">
                    <Database className="inline-block text-primary h-12 w-12 mr-4" />
                    Big Data: Nossa Barreira de Entrada
                 </h2>
                 <div className="w-full bg-background/50 border border-primary/20 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 uppercase italic tracking-tighter"><Search className="text-primary h-5 w-5"/> Busca Regionalizada</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">O gestor seleciona Cidade/Estado e o Guardian apresenta as escolas da nossa base. <strong>Endereço e portões de GPS preenchidos em 1 clique.</strong></p>
                            </div>
                             <div className="bg-blue-500/5 p-4 rounded-lg border-l-4 border-blue-500">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 uppercase italic tracking-tighter"><MapPinned className="text-blue-500 h-5 w-5"/> Precisão Operacional</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Nossa base contém os locais de desembarque validados (INEP). Menos chamadas para o suporte e rotas 100% confiáveis desde o primeiro dia.</p>
                            </div>
                            <div className="bg-purple-500/5 p-4 rounded-lg border-l-4 border-purple-500">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2 uppercase italic tracking-tighter"><Zap className="text-purple-500 h-5 w-5"/> OCR de Documentos</h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">Cadastros de pais e alunos finalizados em segundos via Visão Computacional. <strong>Escalabilidade comercial sem burocracia.</strong></p>
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/20 flex items-center justify-center p-8 group">
                            <div className="text-center space-y-4">
                                <div className="p-6 bg-primary/10 rounded-full inline-block group-hover:scale-110 transition-transform duration-500">
                                    <Sparkles className="h-20 w-20 text-primary animate-pulse" />
                                </div>
                                <p className="text-xl font-black uppercase italic tracking-tighter">Base Guardian Nacional</p>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em]">190.000+ Instituições Ativas</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </Slide>

            {/* Slide 7: Proof of ROI */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-black text-center mb-12 uppercase italic tracking-tighter">
                    <BarChart className="inline-block text-primary h-12 w-12 mr-4" />
                    A Prova de ROI: Planejado vs. Real
                </h2>
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    <Card className="p-8 bg-secondary/20 border-dashed relative group overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-5"><Sparkles size={150}/></div>
                        <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-muted-foreground tracking-tighter">
                            <Sparkles className="h-5 w-5"/> Otimização IA
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">A sequência lógica perfeita baseada em endereços, turnos e regras de negócio para minimizar a distância percorrida.</p>
                        <div className="h-48 bg-background/50 rounded-lg border border-dashed flex items-center justify-center italic text-xs text-muted-foreground p-6 text-center">
                            Visualização da Rota Otimizada (Redução de até 18% em KM)
                        </div>
                    </Card>
                    <Card className="p-8 bg-primary/5 border-primary/30 relative shadow-xl overflow-hidden">
                        <div className="absolute -right-4 -bottom-4 opacity-10 text-primary"><Activity size={150}/></div>
                        <h3 className="text-lg font-black uppercase italic mb-4 flex items-center gap-2 text-primary tracking-tighter">
                            <MapPinned className="h-5 w-5"/> Telemetria Real
                        </h3>
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">O traçado real capturado pelo GPS do motorista, detectando desvios, paradas indevidas e economia real de combustível.</p>
                        <div className="h-48 bg-background rounded-lg border-2 border-primary/20 flex flex-col items-center justify-center gap-2 p-6">
                            <p className="text-4xl font-black text-primary">14.2%</p>
                            <p className="text-[10px] font-black uppercase tracking-widest">Economia Real Detectada</p>
                        </div>
                    </Card>
                </div>
                <p className="mt-8 text-center text-xl font-bold text-primary italic">"Não é apenas gestão, é uma ferramenta de redução de custos comprovada em tempo real."</p>
            </Slide>

             {/* The Ask */}
            <Slide>
                 <Badge className="mb-4 bg-primary text-primary-foreground font-black tracking-widest">PITCH FINAL</Badge>
                 <h2 className="text-4xl md:text-5xl font-black text-center mb-6 uppercase italic tracking-tighter">A Proposta</h2>
                 <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl font-medium">Buscamos um parceiro estratégico para escalar a primeira plataforma de telemetria inteligente e Big Data focada no setor escolar brasileiro.</p>
                 <div className="grid md:grid-cols-2 gap-8 w-full items-center">
                    <div className="bg-background border-2 border-primary/30 p-10 rounded-2xl text-center shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">Estamos buscando</p>
                        <p className="text-7xl font-black text-primary my-4 tracking-tighter">R$ 150k</p>
                        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest">em troca de</p>
                        <p className="text-4xl font-black text-foreground mt-4 italic">10% Equity</p>
                    </div>
                     <div className="space-y-6">
                        <h3 className="text-xl font-black uppercase italic border-b border-primary/20 pb-2 tracking-tighter">Uso dos Recursos</h3>
                        <div className="space-y-4">
                            <ResourceItem color="bg-primary" label="60% Produto & IA (Telemetria Real-time)" />
                            <ResourceItem color="bg-primary/70" label="20% Marketing & Sales (Aquisição de Frotas)" />
                            <ResourceItem color="bg-primary/40" label="20% Operacional & Cloud Infrastructure" />
                        </div>
                        <div className="pt-6">
                            <Button className="w-full h-14 text-lg font-black uppercase italic shadow-lg shadow-primary/20" asChild>
                                <Link href="/login">Vamos proteger essa jornada?</Link>
                            </Button>
                        </div>
                     </div>
                 </div>
            </Slide>

        </main>
    );
}

const MarketComparisonItem = ({ icon, text, isNegative }: { icon: React.Node, text: string, isNegative?: boolean }) => (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${isNegative ? 'bg-secondary/30 border-muted' : 'bg-primary/5 border-primary/20 shadow-sm'}`}>
        <div className="shrink-0">{icon}</div>
        <span className="text-sm font-bold text-foreground/80">{text}</span>
    </div>
);

const ProcessStep = ({ icon, label }: { icon: React.Node, label: string }) => (
    <div className="flex flex-col items-center text-center gap-3 p-5 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors group">
        <div className="p-4 rounded-full bg-background text-primary shadow-sm group-hover:scale-110 transition-transform">
            {icon}
        </div>
        <span className="text-[10px] font-black uppercase leading-tight tracking-tight">{label}</span>
    </div>
);

const ResourceItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-3 p-2 hover:bg-secondary/50 rounded-lg transition-colors">
        <div className={`w-5 h-5 rounded-md ${color} shrink-0 shadow-sm`}></div>
        <span className="text-sm font-bold uppercase tracking-tight text-foreground/70">{label}</span>
    </div>
);
