"use client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  ChevronLeft, 
  Linkedin, 
  Mail, 
  ExternalLink, 
  Rocket, 
  ShieldCheck, 
  Zap, 
  Award,
  Globe,
  Briefcase,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/apresentacao" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors font-bold text-sm group">
            <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Voltar ao Site
          </Link>
          <div className="flex items-center gap-3">
             <div className="rounded-lg bg-primary/10 p-2 border border-primary/20">
               <ShieldCheck className="h-5 w-5 text-primary" />
             </div>
             <span className="text-xl font-black tracking-tight">Guardian</span>
          </div>
        </div>
      </header>

      <main className="pt-32 pb-24 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Lado Esquerdo: Perfil & Contato */}
            <div className="lg:col-span-4 space-y-8 sticky top-32">
              <div className="relative aspect-square w-full max-w-[320px] mx-auto lg:mx-0 rounded-3xl overflow-hidden border-4 border-card shadow-2xl bg-zinc-900 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
                <User className="h-32 w-32 text-primary/20 relative z-10" />
                <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-md p-3 rounded-xl border border-white/10 text-center">
                  <p className="text-white font-black text-xs uppercase tracking-tighter">19 Anos de Experiência</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight leading-none">JONATAS FERREIRA</h1>
                  <p className="text-primary font-bold text-lg uppercase tracking-widest mt-1">Founder & Visionary</p>
                </div>
                
                <p className="text-muted-foreground leading-relaxed font-medium">
                  Especialista em Projetos Logísticos e Analista de Negócios com quase duas décadas transformando operações complexas em fluxos digitais eficientes.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button size="icon" variant="outline" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                    <Link href="https://www.linkedin.com/in/jonatas-ferreira-dos-santos-silva-037b5940" target="_blank"><Linkedin className="h-5 w-5" /></Link>
                  </Button>
                  <Button size="icon" variant="outline" className="rounded-xl hover:bg-primary/10 hover:text-primary transition-colors" asChild>
                    <Link href="mailto:jonatasferreiradossantossilva@gmail.com"><Mail className="h-5 w-5" /></Link>
                  </Button>
                  <Button variant="outline" className="rounded-xl font-bold gap-2 px-6" asChild>
                    <Link href="https://wa.me/5511983680393" target="_blank"><Zap className="h-4 w-4" /> WhatsApp</Link>
                  </Button>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-card border border-border/50 shadow-sm space-y-6">
                 <h3 className="font-black text-sm uppercase tracking-widest text-primary flex items-center gap-2">
                   <Award className="h-4 w-4" /> Core Business
                 </h3>
                 <div className="flex flex-wrap gap-2">
                   {["Logística", "TMS/ERP", "Análise de Requisitos", "Gestão de Projetos", "Metodologia Ágil", "Estratégia"].map((tag) => (
                     <Badge key={tag} variant="secondary" className="bg-muted font-bold px-3 py-1 text-[10px] uppercase">{tag}</Badge>
                   ))}
                 </div>
              </div>
            </div>

            {/* Lado Direito: Trajetória & Visão */}
            <div className="lg:col-span-8 space-y-12">
              
              {/* Seção Sobre */}
              <section className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-widest">
                  A Mente por trás do Guardian
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tight">Onde a Experiência Logística encontra a Inovação Digital.</h2>
                <div className="prose prose-invert max-w-none text-muted-foreground text-lg leading-relaxed space-y-4">
                  <p>
                    Com uma trajetória sólida de 19 anos, Jonatas Ferreira consolidou sua expertise na <strong>Senior Sistemas</strong> como <strong>Especialista em TMS</strong>, onde liderou projetos críticos de malha logística e tecnologia.
                  </p>
                  <p>
                    Como arquiteto de soluções, ele traduziu a complexidade das grandes operações logísticas para o transporte escolar, garantindo que o Guardian tenha o mesmo rigor de controle e eficiência das maiores malhas do país.
                  </p>
                </div>
              </section>

              {/* Grid de Marcos/Experiência */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-8 rounded-3xl bg-card border-border/50 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Briefcase className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Expertise TMS & ERP</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Domínio em ferramentas como GKO FRETE e Confirma Fácil, com histórico de integrações em SAP, Totvs e sistemas legados para otimização de faturamento e auditoria de fretes.
                  </p>
                </Card>

                <Card className="p-8 rounded-3xl bg-card border-border/50 hover:border-primary/30 transition-all group">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <GraduationCap className="h-6 w-6" />
                  </div>
                  <h4 className="text-xl font-bold mb-2">Formação de Elite</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    MBA em Gestão de Projetos pela <strong>USP/Esalq</strong> e Graduação em Gestão de Logística pela <strong>UNIP</strong>, unindo teoria acadêmica à prática de mercado.
                  </p>
                </Card>
              </div>

              {/* Seção Visão Guardian */}
              <Card className="p-10 rounded-[2.5rem] bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                <div className="relative z-10 space-y-6">
                  <Badge className="bg-white/20 text-white border-none font-black text-[10px] uppercase tracking-widest px-3">Minha Missão</Badge>
                  <h3 className="text-3xl font-black tracking-tight leading-tight">"Minha missão com o Guardian é aplicar toda a inteligência de supply chain que desenvolvi em décadas para algo sagrado: a segurança das nossas crianças e a paz de espírito das famílias."</h3>
                  <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                     <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                       <Award className="h-6 w-6" />
                     </div>
                     <p className="font-bold text-white/90">Guardian: Engenharia Logística aplicada à Vida.</p>
                  </div>
                </div>
              </Card>

              {/* CTA Final */}
              <div className="flex flex-col items-center text-center py-12 space-y-6">
                <h4 className="text-2xl font-black">Vamos conectar e construir o futuro juntos?</h4>
                <Button asChild size="lg" className="rounded-full h-16 px-12 font-black text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
                  <Link href="https://wa.me/5511983680393">Entrar em Contato <ChevronRight className="ml-2 h-5 w-5" /></Link>
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function User({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronRight({ ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
