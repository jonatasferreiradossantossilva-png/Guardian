
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
    FileText
} from 'lucide-react';
import Image from 'next/image';
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
                <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl">
                    Inteligência Operacional, Big Data e Prova de ROI para o Transporte Escolar.
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

            {/* Slide 3: Comparison with Market */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Guardian vs. Mercado Tradicional</h2>
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-muted-foreground uppercase tracking-widest border-b pb-2">Apps de Rastreamento</h3>
                        <div className="space-y-3">
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Apenas rastreio passivo." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Dependência total de APIs caras (Google)." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Cadastro manual lento e propenso a erro." />
                            <MarketComparisonItem isNegative icon={<XCircle className="text-red-500" />} text="Nenhum dado preditivo de manutenção." />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-primary uppercase tracking-widest border-b border-primary/30 pb-2">Guardian Intelligence</h3>
                        <div className="space-y-3">
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Provamos a economia real de combustível (ROI)." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Base Proprietária de 190k escolas (Custo Zero)." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Cadastro instantâneo via Busca Regionalizada." />
                            <MarketComparisonItem icon={<CheckCircle className="text-primary" />} text="Manutenção baseada em telemetria GPS real." />
                        </div>
                    </div>
                </div>
            </Slide>

            {/* Slide 4: 17-Step Zero Friction Journey (THE BIG NEW ADDITION) */}
            <Slide>
                 <Badge className="mb-4 bg-primary text-primary-foreground">O GRANDE DIFERENCIAL</Badge>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">Onboarding em 17 Passos: Do Convite ao Contrato</h2>
                 <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 w-full">
                    <ProcessStep icon={<Smartphone />} label="Convite WhatsApp" />
                    <ProcessStep icon={<Sparkles />} label="Leitura via IA" />
                    <ProcessStep icon={<MapPinned />} label="GPS Validado" />
                    <ProcessStep icon={<School />} label="Base de Escolas" />
                    <ProcessStep icon={<Search />} label="Triagem Automática" />
                    <ProcessStep icon={<FileText />} label="Contrato Digital" />
                 </div>
                 <p className="mt-12 text-center text-xl text-muted-foreground max-w-4xl">
                    Reduzimos o tempo de cadastro de <strong>45 minutos para 2 minutos</strong>. 
                    O pai faz o trabalho pesado via IA, e o gestor apenas valida a rota sugerida.
                 </p>
            </Slide>

            {/* Slide 5: Big Data & Knowledge Base */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Database className="inline-block text-primary h-12 w-12 mr-4" />Big Data & Cadastro Zero Fricção</h2>
                 <div className="w-full bg-background/50 border border-primary/20 rounded-xl p-8 backdrop-blur-sm shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                        <div className="space-y-6">
                            <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-primary">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Search className="text-primary"/> Busca Regionalizada</h3>
                                <p className="text-sm text-muted-foreground">O gestor seleciona Cidade/Estado e o Guardian apresenta instantaneamente as escolas da nossa base. <strong>Endereço e GPS preenchidos em 1 clique.</strong></p>
                            </div>
                             <div className="bg-blue-500/5 p-4 rounded-lg border-l-4 border-blue-500">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><MapPinned className="text-blue-500"/> Precisão Operacional</h3>
                                <p className="text-sm text-muted-foreground">Nossa base contém os portões de embarque validados. Menos chamadas para o suporte e rotas 100% confiáveis desde o primeiro dia.</p>
                            </div>
                            <div className="bg-purple-500/5 p-4 rounded-lg border-l-4 border-purple-500">
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-2"><Zap className="text-purple-500"/> OCR de Documentos</h3>
                                <p className="text-sm text-muted-foreground">Cadastros de pais e alunos finalizados em segundos via Inteligência Artificial. <strong>Menos burocracia, mais escala comercial.</strong></p>
                            </div>
                        </div>
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-primary/20 bg-muted/20 flex items-center justify-center p-8">
                            <div className="text-center space-y-4">
                                <Sparkles className="h-20 w-20 text-primary mx-auto animate-pulse" />
                                <p className="text-lg font-bold">Base Guardian Nacional</p>
                                <p className="text-sm text-muted-foreground">Infraestrutura preparada para suportar 190.000+ instituições com custo de processamento otimizado.</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </Slide>

            {/* Slide 6: Proof of ROI */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    <BarChart className="inline-block text-primary h-12 w-12 mr-4" />
                    A Prova de ROI: Planejado vs. Real
                </h2>
                <div className="grid md:grid-cols-2 gap-8 w-full">
                    <Card className="p-6 bg-secondary/20 border-dashed">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-muted-foreground"><Sparkles className="h-5 w-5"/> O que a IA Planeja</h3>
                        <p className="text-sm text-muted-foreground mb-4">A sequência lógica perfeita baseada em endereços e regras de negócio para minimizar a distância.</p>
                        <div className="h-40 bg-background rounded border border-dashed flex items-center justify-center italic text-muted-foreground">
                            Visualização da Rota Otimizada
                        </div>
                    </Card>
                    <Card className="p-6 bg-primary/5 border-primary/20">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-primary"><MapPinned className="h-5 w-5"/> O que o GPS Captura</h3>
                        <p className="text-sm text-muted-foreground mb-4">O traçado real percorrido pela van, detectando desvios, paradas não planejadas e economia real de combustível.</p>
                        <div className="h-40 bg-background rounded border flex items-center justify-center font-bold text-primary text-center px-4">
                            Economia real de 14.2% em KM detectada hoje.
                        </div>
                    </Card>
                </div>
                <p className="mt-8 text-center text-xl font-medium text-primary">"Não é apenas gestão, é uma ferramenta de redução de custos comprovada por telemetria."</p>
            </Slide>
            
             {/* Slide: Identity */}
             <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    <FileImage className="inline-block text-primary h-12 w-12 mr-4" />
                    Identidade Visual: O Abraço Protetor
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <div className="border-2 border-primary/50 ring-4 ring-primary/10 rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4 text-primary">Confiança e Tecnologia</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-blue-600 relative overflow-hidden">
                            <HandHeart className="w-48 h-48 text-red-500 absolute opacity-20" fill="red"/>
                            <Bus className="w-20 h-20 text-yellow-400 relative z-10" />
                        </div>
                        <p className="text-sm text-muted-foreground">Azul royal para seriedade e a van clássica no centro do cuidado.</p>
                    </div>
                     <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Modernidade e Energia</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-slate-800 relative overflow-hidden">
                           <HandHeart className="w-48 h-48 text-white absolute opacity-10" fill="white"/>
                           <Bus className="w-20 h-20 text-orange-500 relative z-10" />
                        </div>
                        <p className="text-sm text-muted-foreground">Van laranja vibrante transmitindo atenção e energia urbana.</p>
                    </div>
                    <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Natureza e Tranquilidade</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4 bg-green-800 relative overflow-hidden">
                           <HandHeart className="w-48 h-48 text-white absolute opacity-10" fill="white"/>
                            <Bus className="w-20 h-20 text-yellow-300 relative z-10" />
                        </div>
                        <p className="text-sm text-muted-foreground">Verde escuro para segurança e calma, criando uma marca acolhedora.</p>
                    </div>
                </div>
            </Slide>

             {/* The Ask */}
            <Slide>
                 <Badge className="mb-4">Pitch Final</Badge>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">A Proposta</h2>
                 <p className="text-xl text-muted-foreground mb-12 text-center max-w-2xl">Buscamos um parceiro estratégico para escalar a primeira plataforma de telemetria inteligente focada no setor escolar brasileiro.</p>
                 <div className="grid md:grid-cols-2 gap-8 w-full items-center">
                    <div className="bg-background/50 border border-primary/20 p-8 rounded-lg text-center shadow-2xl">
                        <p className="text-muted-foreground text-lg">Estamos buscando</p>
                        <p className="text-6xl font-bold text-primary my-2">R$ 80.000</p>
                        <p className="text-muted-foreground text-lg">em troca de</p>
                        <p className="text-4xl font-bold text-primary mt-2">10% Equity</p>
                    </div>
                     <div className="space-y-6">
                        <h3 className="text-xl font-semibold border-b pb-2">Uso dos Recursos</h3>
                        <div className="space-y-4">
                            <ResourceItem color="bg-primary" label="60% Produto & IA (Telemetria Real-time)" />
                            <ResourceItem color="bg-primary/70" label="20% Marketing & Sales (Aquisição de Frotas)" />
                            <ResourceItem color="bg-primary/40" label="20% Operacional & Cloud Infrastructure" />
                        </div>
                        <div className="pt-4">
                            <Button className="w-full h-12 text-lg font-bold" asChild>
                                <Link href="/login">Vamos proteger essa jornada?</Link>
                            </Button>
                        </div>
                     </div>
                 </div>
            </Slide>

        </main>
    );
}

const MarketComparisonItem = ({ icon, text, isNegative }: { icon: React.ReactNode, text: string, isNegative?: boolean }) => (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${isNegative ? 'bg-secondary/30' : 'bg-primary/5 border-primary/20'}`}>
        {icon}
        <span className="text-sm font-medium">{text}</span>
    </div>
);

const ProcessStep = ({ icon, label }: { icon: React.ReactNode, label: string }) => (
    <div className="flex flex-col items-center text-center gap-2 p-4 rounded-lg bg-secondary/30 border border-border/50">
        <div className="p-3 rounded-full bg-primary/10 text-primary">{icon}</div>
        <span className="text-[10px] font-bold uppercase leading-tight">{label}</span>
    </div>
);

const ResourceItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-sm ${color} shrink-0`}></div>
        <span className="text-sm font-semibold">{label}</span>
    </div>
);

const HandHeart = ({ className, fill }: { className?: string, fill?: string }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill={fill || "none"} 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
        <path d="M12 5 9.04 7.96a2.17 2.17 0 0 0 0 3.08v0c.82.82 2.13.82 2.96 0l.01-.01" />
        <path d="m12 5 2.96 2.96a2.17 2.17 0 0 1 0 3.08v0c-.82.82-2.13.82-2.96 0l-.01-.01" />
    </svg>
);
