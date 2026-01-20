'use client';

import { BarChart, Briefcase, CheckCircle, DollarSign, Gem, Lightbulb, Milestone, Rocket, Target, User, Users, Wallet, XCircle, FileImage, Shield, MapPin, Bus, HandHeart } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper component for consistent slide styling
const Slide = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
  <section className={`min-h-screen w-full max-w-6xl mx-auto flex flex-col justify-center items-center p-8 md:p-16 ${className}`}>
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
                <div className="bg-primary/10 p-6 rounded-full border-2 border-primary/30 mb-8">
                     <Gem className="h-16 w-16 text-primary" />
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-foreground">Guardian</h1>
                <p className="mt-6 text-xl md:text-2xl text-muted-foreground max-w-3xl">
                    A jornada do seu filho, protegida em tempo real.
                </p>
                <div className="mt-12 text-sm text-muted-foreground animate-pulse">
                    <p>Role para baixo para ver a apresentação</p>
                </div>
            </Slide>

            {/* Slide 2: The Problem */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Lightbulb className="inline-block text-primary h-12 w-12 mr-4" />O Problema: Um Mercado Bilionário, Operando no Passado</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <StatCard 
                        icon={<Wallet size={32} />} 
                        title="Ineficiência Operacional" 
                        value="-20%"
                        description="Custos de combustível e tempo perdidos com rotas manuais e comunicação caótica via WhatsApp."
                    />
                    <StatCard 
                        icon={<Briefcase size={32} />} 
                        title="Risco e Insegurança" 
                        value="Incalculável"
                        description="Ansiedade dos pais e exposição legal para empresas pela falta de visibilidade e registros."
                    />
                    <StatCard 
                        icon={<Users size={32} />} 
                        title="Comunicação Fragmentada" 
                        value="95% via WhatsApp"
                        description="Avisos, cobranças e emergências se perdem em dezenas de grupos, gerando atrito e falhas."
                    />
                </div>
                <p className="text-center mt-12 text-muted-foreground italic">
                    O mercado de transporte escolar no Brasil movimenta mais de R$ 4.5 Bilhões por ano, mas ainda depende de planilhas e comunicação informal.
                </p>
            </Slide>

            {/* Slide 3: The Solution */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><CheckCircle className="inline-block text-primary h-12 w-12 mr-4" />A Solução: Um Ecossistema Integrado</h2>
                 <div className="w-full bg-background/50 border border-primary/20 rounded-xl p-8 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                        <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-primary/20 shadow-2xl shadow-primary/10">
                            <Image src="https://picsum.photos/seed/dashboard/1280/720" layout="fill" objectFit="cover" alt="Dashboard do Guardian" data-ai-hint="dashboard analytics" />
                        </div>
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2"><Rocket className="text-primary"/>Para a Empresa (Eficiência)</h3>
                                <p className="text-muted-foreground">Otimização de rotas com IA, gestão financeira automatizada e um dashboard com visão 360° da operação.</p>
                            </div>
                             <div>
                                <h3 className="text-xl font-semibold flex items-center gap-2"><User className="text-primary"/>Para os Pais (Tranquilidade)</h3>
                                <p className="text-muted-foreground">Acompanhamento da van em tempo real, comunicação direta e autonomia para gerenciar autorizações e pagamentos.</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </Slide>
            
            {/* Slide 4: Logo Concepts */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    <FileImage className="inline-block text-primary h-12 w-12 mr-4" />
                    Identidade Visual: Conceitos de Logo
                </h2>
                <div className="grid md:grid-cols-3 gap-8 w-full">
                    <div className="border-2 border-primary/50 ring-4 ring-primary/10 rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4 text-primary">Conceito 1: O Escudo Localizador</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4">
                            <div className="relative h-32 w-32">
                                <Shield className="h-32 w-32 text-blue-900" fill="currentColor" />
                                <MapPin className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 text-teal-400" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            A fusão de um <strong>escudo</strong> (proteção) com um <strong>pino de mapa</strong> (localização). Profissional, direto e ideal para um ícone de app.
                        </p>
                    </div>
                    <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Conceito 2: A Rota "G"</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4">
                            <div className="h-32 w-32 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                                <span className="text-7xl font-bold text-white italic -rotate-12 transform" style={{fontFamily: 'serif'}}>G</span>
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Uma letra <strong>"G" estilizada</strong> que se transforma em uma linha de rota. Moderno, sutil e com uma forte identidade de marca de tecnologia.
                        </p>
                    </div>
                    <div className="border border-border rounded-xl p-6 text-center flex flex-col bg-background/50 backdrop-blur-sm">
                        <h3 className="font-bold text-lg mb-4">Conceito 3: O Abraço Protetor</h3>
                        <div className="flex-grow flex items-center justify-center rounded-lg p-8 my-4">
                            <div className="relative h-32 w-32 flex items-center justify-center bg-blue-600 rounded-lg">
                                <HandHeart className="h-24 w-24 text-white" fill="currentColor" />
                                <Bus className="absolute h-10 w-10 text-yellow-400" />
                            </div>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Duas mãos formando um <strong>círculo de proteção</strong> em volta da van. Apela ao emocional dos pais, transmitindo cuidado e comunidade.
                        </p>
                    </div>
                </div>
            </Slide>

            {/* Slide 5: Market Opportunity */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Target className="inline-block text-primary h-12 w-12 mr-4" />Oportunidade de Mercado</h2>
                 <div className="grid md:grid-cols-3 gap-6 text-center w-full">
                    <div className="bg-background/50 border border-border p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Total Disponível (TAM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 4.5 Bi</p>
                        <p className="text-sm text-muted-foreground mt-2">Mercado total de transporte escolar no Brasil (anual).</p>
                    </div>
                     <div className="bg-background/50 border-2 border-primary/50 p-6 rounded-lg ring-4 ring-primary/10">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Endereçável (SAM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 1.3 Bi</p>
                        <p className="text-sm text-muted-foreground mt-2">Empresas privadas em centros urbanos no Brasil.</p>
                    </div>
                     <div className="bg-background/50 border border-border p-6 rounded-lg">
                        <h3 className="text-lg font-semibold text-muted-foreground">Mercado Obtível (SOM)</h3>
                        <p className="text-5xl font-bold text-primary mt-2">R$ 13 Mi</p>
                        <p className="text-sm text-muted-foreground mt-2">Conquistar 1% do mercado alcançável, começando por SP e RJ.</p>
                    </div>
                 </div>
            </Slide>

            {/* Slide 6: Business Model */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><DollarSign className="inline-block text-primary h-12 w-12 mr-4" />Modelo de Negócio (SaaS B2B)</h2>
                <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl">
                    <div className="border-2 border-primary/50 rounded-xl p-8 text-center ring-4 ring-primary/10">
                        <h3 className="text-2xl font-bold">Plano PRO</h3>
                        <p className="text-5xl font-bold my-4">R$ 89</p>
                        <p className="text-muted-foreground font-medium">por veículo / mês</p>
                        <ul className="text-left space-y-2 mt-6">
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Gestão Completa</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Rastreamento em Tempo Real</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Comunicação Integrada</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Otimizador de Rotas (IA)</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Gestão Financeira</li>
                        </ul>
                    </div>
                     <div className="border border-border rounded-xl p-8 text-center opacity-70">
                        <h3 className="text-2xl font-bold">Plano Básico</h3>
                        <p className="text-5xl font-bold my-4">R$ 59</p>
                        <p className="text-muted-foreground font-medium">por veículo / mês</p>
                        <ul className="text-left space-y-2 mt-6">
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Gestão Completa</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Rastreamento em Tempo Real</li>
                            <li className="flex items-center gap-2"><CheckCircle className="text-primary h-5 w-5"/> Comunicação Integrada</li>
                            <li className="flex items-center gap-2 text-muted-foreground"><XCircle className="h-5 w-5"/> Otimizador de Rotas (IA)</li>
                            <li className="flex items-center gap-2 text-muted-foreground"><XCircle className="h-5 w-5"/> Gestão Financeira</li>
                        </ul>
                    </div>
                </div>
                 <p className="text-center mt-8 text-muted-foreground text-sm">Modelo de upsell com taxa de 5% sobre viagens avulsas pagas pelo app.</p>
            </Slide>

             {/* Slide 8: Competitive Analysis */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><BarChart className="inline-block text-primary h-12 w-12 mr-4" />Análise Competitiva</h2>
                <div className="w-full max-w-4xl p-4 bg-background/30 rounded-lg">
                    <div className="grid grid-cols-[1fr_2fr_2fr] grid-rows-[1fr_2fr_2fr] gap-2">
                        {/* Eixos */}
                        <div className="col-start-2 col-span-2 text-center text-sm font-semibold text-muted-foreground">Foco do Produto</div>
                        <div className="row-start-2 row-span-2 text-center text-sm font-semibold text-muted-foreground" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>Foco no Cliente</div>
                        
                        {/* Quadrantes */}
                        <div className="row-start-2 col-start-2 p-4 border-b border-r border-dashed border-border flex flex-col justify-start items-start">
                            <CompetitorCard title="Apps de Rastreamento" description="Focam apenas em localização. Sem inteligência de negócio."/>
                        </div>
                        <div className="row-start-2 col-start-3 p-4 border-b border-dashed border-border flex flex-col justify-start items-end">
                             <div className="p-4 rounded-lg bg-primary/20 border-2 border-primary text-right">
                                <h4 className="font-bold text-primary flex items-center justify-end gap-2"><Gem/> Guardian</h4>
                                <p className="text-sm text-foreground">Plataforma B2B completa com IA, Financeiro e Comunicação.</p>
                            </div>
                        </div>
                        <div className="row-start-3 col-start-2 p-4 border-r border-dashed border-border flex flex-col justify-end items-start">
                             <CompetitorCard title="WhatsApp e Planilhas" description="Status quo. Gratuito, mas ineficiente, inseguro e caótico."/>
                        </div>
                        <div className="row-start-3 col-start-3 p-4 flex flex-col justify-end items-end">
                            <CompetitorCard title="Sistemas ERP Escolares" description="Módulos de transporte básicos, sem especialização ou foco na operação da van."/>
                        </div>

                        {/* Labels dos eixos */}
                        <div className="row-start-1 col-start-2 text-center text-xs text-muted-foreground">Ferramenta Simples</div>
                        <div className="row-start-1 col-start-3 text-center text-xs text-muted-foreground">Plataforma Integrada</div>
                         <div className="row-start-2 col-start-1 text-right text-xs text-muted-foreground">Foco na Gestão B2B</div>
                        <div className="row-start-3 col-start-1 text-right text-xs text-muted-foreground">Foco nos Pais</div>
                    </div>
                </div>
            </Slide>

             {/* Slide 10: The Ask */}
            <Slide>
                 <h2 className="text-4xl md:text-5xl font-bold text-center mb-6">A Proposta</h2>
                 <p className="text-xl text-muted-foreground mb-12 text-center">Buscamos um parceiro estratégico para acelerar nosso crescimento e capturar este mercado.</p>
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
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary mr-2"></div><span className="font-semibold">60% - Produto (MVP de Produção):</span><span className="ml-1 text-muted-foreground">Desenvolvedor (freelancer/part-time) para finalizar o app.</span></div>
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary/70 mr-2"></div><span className="font-semibold">20% - Marketing (Aquisição Inicial):</span><span className="ml-1 text-muted-foreground">Campanhas focadas para conseguir os primeiros clientes.</span></div>
                            <div className="flex items-center"><div className="w-4 h-4 rounded-sm bg-primary/40 mr-2"></div><span className="font-semibold">20% - Custos Operacionais:</span><span className="ml-1 text-muted-foreground">Custos de nuvem e despesas para os primeiros meses.</span></div>
                        </div>
                     </div>
                 </div>
            </Slide>
            
            {/* Slide 11: Roadmap */}
            <Slide>
                <h2 className="text-4xl md:text-5xl font-bold text-center mb-12"><Milestone className="inline-block text-primary h-12 w-12 mr-4" />Roadmap para os Próximos 12 Meses</h2>
                <div className="w-full max-w-4xl space-y-4">
                    <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center font-bold">3M</div>
                        <div className="h-0.5 w-8 bg-primary"></div>
                        <div className="bg-background/50 border border-border rounded-lg p-4 w-full">
                            <h4 className="font-semibold">Lançamento do MVP</h4>
                            <p className="text-muted-foreground text-sm">5 empresas no programa piloto, validar pricing e coletar feedback.</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center font-bold">6M</div>
                        <div className="h-0.5 w-8 bg-primary"></div>
                        <div className="bg-background/50 border border-border rounded-lg p-4 w-full">
                            <h4 className="font-semibold">Tração Inicial</h4>
                            <p className="text-muted-foreground text-sm">Alcançar 20 clientes pagantes e MRR (Receita Recorrente Mensal) de R$ 15.000.</p>
                        </div>
                    </div>
                     <div className="flex items-center">
                        <div className="flex-shrink-0 bg-primary text-primary-foreground rounded-full h-12 w-12 flex items-center justify-center font-bold">12M</div>
                        <div className="h-0.5 w-8 bg-primary"></div>
                        <div className="bg-background/50 border border-border rounded-lg p-4 w-full">
                            <h4 className="font-semibold">Escala e Expansão</h4>
                            <p className="text-muted-foreground text-sm">Atingir 100 clientes, iniciar expansão para a segunda capital e alcançar o breakeven operacional.</p>
                        </div>
                    </div>
                </div>
            </Slide>

        </main>
    );
}
