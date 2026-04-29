"use client";

import { useEffect, useState } from "react";
import { Check, Heart, Settings, MapPin, Zap, User, AlertTriangle, Monitor, Smartphone, Bus } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function StoryPage() {
  const [scrollY, setScrollY] = useState(0);
  const [chaosPoints, setChaosPoints] = useState<{left: string, top: string}[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = window.scrollY / totalScroll;
      setScrollY(progress);
    };

    // Gera posições aleatórias estáveis apenas no cliente
    const points = [...Array(20)].map(() => ({
      left: (Math.random() * 80 + 10) + "%",
      top: (Math.random() * 60 + 20) + "%"
    }));
    setChaosPoints(points);

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger initial check
    handleScroll();
    
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Helpers para calcular opacidade/movimento baseado no progresso da página (0 a 1)
  const getActProgress = (start: number, end: number) => {
    if (scrollY < start) return 0;
    if (scrollY > end) return 1;
    return (scrollY - start) / (end - start);
  };

  const act1 = getActProgress(0, 0.25);
  const act2 = getActProgress(0.25, 0.50);
  const act3 = getActProgress(0.50, 0.75);
  const act4 = getActProgress(0.75, 1);

  return (
    <main className="bg-zinc-950 text-white min-h-[400vh] relative selection:bg-primary/30">
      
      {/* Botão Voltar */}
      <div className="fixed top-6 left-6 z-50">
        <Button variant="outline" className="bg-black/50 border-white/20 text-white hover:bg-white/10 backdrop-blur" asChild>
          <Link href="/">Voltar para o Site</Link>
        </Button>
      </div>

      <div className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center">
        
        {/* ========================================================= */}
        {/* ATO 1: O SETUP VAPT-VUPT (Manager no PC) */}
        {/* ========================================================= */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500"
          style={{ 
            opacity: act1 > 0 && act2 < 0.2 ? 1 : 0, 
            transform: "translateY(" + ((1 - act1) * 50) + "px) scale(" + (0.9 + (act1 * 0.1)) + ")",
            pointerEvents: act1 > 0 && act2 < 0.2 ? "auto" : "none"
          }}
        >
           <h1 className="text-4xl md:text-6xl font-black mb-16 tracking-tight text-center">
             Ato 1: O Setup <span className="text-primary italic">Mágico.</span>
           </h1>
           
           <div className="relative w-full max-w-4xl flex justify-center items-end h-[400px]">
              {/* O Computador do Gestor */}
              <div className="absolute bottom-0 w-[400px] h-[300px] bg-zinc-900 border-t-4 border-x-4 border-zinc-700 rounded-t-3xl p-4 shadow-[0_0_100px_rgba(59,130,246,0.2)] flex flex-col z-10">
                 <div className="w-full h-full bg-zinc-950 rounded-xl overflow-hidden relative">
                    {/* Barras de Setup Confirmando */}
                    <div className="absolute inset-0 p-8 flex flex-col justify-center gap-4">
                       <SetupRow text="Escolas e Rotas" active={act1 > 0.2} />
                       <SetupRow text="Motoristas e Vans" active={act1 > 0.4} />
                       <SetupRow text="Links de WhatsApp Pais" active={act1 > 0.6} delay="delay-100" />
                    </div>
                 </div>
              </div>
              
              {/* Bonequinho do Gestor */}
              <div className={cn("absolute -bottom-10 z-20 transition-all duration-1000", act1 > 0.1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-20")}>
                <div className="w-24 h-24 bg-blue-500 rounded-full border-4 border-zinc-950 flex items-center justify-center shadow-xl">
                    <User className="h-12 w-12 text-white" />
                </div>
                <div className="w-32 h-20 bg-blue-600 rounded-t-3xl -mt-4 mx-auto -z-10" />
              </div>

              {/* Balões de Alunos Voando (Efeito do envio do Link) */}
              {act1 > 0.8 && (
                <>
                  <FloatingAvatar left="20%" color="bg-pink-500" delay="0s" />
                  <FloatingAvatar left="80%" color="bg-green-500" delay="0.2s" />
                  <FloatingAvatar left="30%" color="bg-yellow-500" delay="0.4s" />
                  <FloatingAvatar left="70%" color="bg-purple-500" delay="0.1s" />
                  <FloatingAvatar left="50%" color="bg-orange-500" delay="0.6s" />
                </>
              )}
           </div>
           
           <p className="mt-20 text-xl text-zinc-400 font-medium max-w-lg text-center opacity-80">Rode o site para baixo para continuar a história...</p>
        </div>


        {/* ========================================================= */}
        {/* ATO 2: A LOGÍSTICA (A Engrenagem) */}
        {/* ========================================================= */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 bg-zinc-950"
          style={{ 
            opacity: act2 > 0 && act3 < 0.2 ? 1 : 0, 
            pointerEvents: act2 > 0 && act3 < 0.2 ? "auto" : "none"
          }}
        >
           <h1 className="text-4xl md:text-6xl font-black mb-12 tracking-tight text-center z-50 absolute top-20">
             Ato 2: A <span className="text-blue-500 italic">Logística Inteligente.</span>
           </h1>

           <div className="relative w-full h-full max-w-5xl mx-auto flex items-center justify-center">
              
              {/* Mapa Aleatório / Caótico */}
              <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-1000", act2 < 0.5 ? "opacity-100 scale-100" : "opacity-0 scale-90 blur-xl")}>
                 {/* Pontos bagunçados simulando casas */}
                 {chaosPoints.map((point, i) => (
                   <div key={i} className="absolute w-4 h-4 rounded-full bg-red-500/50 animate-pulse" style={{ left: point.left, top: point.top }} />
                 ))}
                 <div className="text-center space-y-4">
                     <AlertTriangle className="w-20 h-20 text-red-500 mx-auto opacity-50" />
                     <p className="text-red-400 font-bold text-2xl uppercase tracking-widest">Rotas Caóticas</p>
                 </div>
              </div>

              {/* Engrenagem engolindo tudo */}
              <div className={cn("absolute transition-all duration-1000 z-20 flex items-center justify-center", act2 > 0.3 && act2 < 0.7 ? "scale-150 opacity-100" : "scale-0 opacity-0")}>
                 <Settings className="w-40 h-40 text-blue-500 animate-[spin_3s_linear_infinite] drop-shadow-[0_0_50px_rgba(59,130,246,0.8)]" />
                 <Zap className="w-16 h-16 text-white absolute animate-pulse" />
              </div>

              {/* Rota Suprema (A Linha Neon) desenhada */}
              <div className={cn("absolute inset-0 flex items-center justify-center transition-all duration-1000", act2 > 0.6 ? "opacity-100 scale-100" : "opacity-0 scale-110")}>
                  {/* Falsas Ruas Escuras */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_70%)]" />
                  
                  {/* Linha Verde Rota Otimizada SVG */}
                  <svg className="absolute w-[80%] h-[60%] overflow-visible" viewBox="0 0 800 250">
                    <path 
                      d="M 10 100 Q 150 -50 300 150 T 600 50 L 800 200" 
                      fill="none" 
                      stroke="#22c55e" 
                      strokeWidth="8" 
                      strokeLinecap="round" 
                      className="drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]"
                      style={{ strokeDasharray: 1200, strokeDashoffset: act2 > 0.7 ? 0 : 1200, transition: 'stroke-dashoffset 2s ease-out' }}
                    />
                    {/* Pontos de parada Otmiziados */}
                    {act2 > 0.8 && (
                      <>
                        <circle cx="10" cy="100" r="12" fill="#22c55e" className="animate-ping" />
                        <circle cx="300" cy="150" r="12" fill="#22c55e" className="animate-ping" style={{ animationDelay: '0.5s'}} />
                        <circle cx="600" cy="50" r="12" fill="#22c55e" className="animate-ping" style={{ animationDelay: '1s'}} />
                        <circle cx="800" cy="200" r="16" fill="white" className="shadow-[0_0_30px_white]" />
                      </>
                    )}
                  </svg>
                  <div className="absolute bottom-20 bg-green-500/20 border border-green-500/50 text-green-400 px-6 py-2 rounded-full font-bold uppercase tracking-widest text-sm backdrop-blur">Smart: Rota Otimizada em 0.3s</div>
              </div>
           </div>
        </div>


        {/* ========================================================= */}
        {/* ATO 3: A PISTA (A Van Amarela) */}
        {/* ========================================================= */}
        <div 
          className="absolute inset-0 flex flex-col md:flex-row items-center justify-center transition-opacity duration-500 bg-zinc-950 p-8 gap-12"
          style={{ 
            opacity: act3 > 0 && act4 < 0.2 ? 1 : 0, 
            pointerEvents: act3 > 0 && act4 < 0.2 ? "auto" : "none"
          }}
        >
           <div className="flex-1 max-w-lg space-y-8 animate-in slide-in-from-left duration-1000">
               <h1 className="text-4xl md:text-6xl font-black tracking-tight">
                 Ato 3: A <span className="text-yellow-500 italic">Pista.</span>
               </h1>
               <p className="text-xl text-zinc-400 leading-relaxed">
                 O motorista foca apenas em dirigir. O roteiro inteligente guia o caminho enquanto o App faz o Check-in passivo. Sem planilhas no volante.
               </p>
               <div className="relative h-2 bg-zinc-800 rounded-full w-full overflow-hidden mt-12">
                   <div 
                     className="absolute top-0 left-0 h-full bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]" 
                     style={{ width: (act3 * 100) + "%" }}
                   />
                   {/* Van */}
                   <div 
                     className="absolute top-1/2 -translate-y-1/2 -ml-6 w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center text-black border-2 border-white/20 shadow-xl"
                     style={{ left: (act3 * 100) + "%" }}
                   >
                     <Bus />
                   </div>
               </div>
           </div>

           {/* Celular do Motorista */}
           <div className="w-[300px] h-[600px] bg-zinc-900 rounded-[40px] border-[8px] border-zinc-800 shadow-2xl relative overflow-hidden flex flex-col transform perspective-1000 rotate-y-[-10deg] animate-in zoom-in duration-1000">
              <div className="p-6 bg-zinc-800/50 border-b border-zinc-700">
                  <h4 className="font-bold text-center text-zinc-300">Modo Condução</h4>
              </div>
              <div className="flex-1 p-4 space-y-4">
                 <StudentCheck name="João Lucas" checked={act3 > 0.2} />
                 <StudentCheck name="Marina S."  checked={act3 > 0.5} />
                 <StudentCheck name="Pedro Gui"  checked={act3 > 0.8} />
              </div>
           </div>
        </div>


        {/* ========================================================= */}
        {/* ATO 4: A MÃE E O GRAN FINALE */}
        {/* ========================================================= */}
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-1000 bg-black p-8"
          style={{ 
            opacity: act4 > 0 ? 1 : 0, 
            pointerEvents: act4 > 0 ? "auto" : "none"
          }}
        >
           
           <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center justify-center h-full">
              
              {/* Celular da Mãe brilha no escuro */}
              <div className={cn("w-[280px] h-[550px] bg-white rounded-[40px] border-[10px] border-zinc-200 shadow-[0_0_100px_rgba(255,255,255,0.2)] flex flex-col relative transition-all duration-1000", act4 > 0.3 ? "translate-y-0 opacity-100" : "translate-y-32 opacity-0")}>
                  <div className="p-6 pt-20 flex-1 bg-white text-zinc-900 text-center flex flex-col items-center gap-6">
                      <div className="w-24 h-24 bg-zinc-100 rounded-full border mb-4 overflow-hidden relative" />
                      
                      <div className={cn("bg-green-50 w-full p-4 rounded-2xl border border-green-200 transition-all duration-700", act4 > 0.5 ? "scale-100 opacity-100" : "scale-50 opacity-0")}>
                         <div className="flex items-center gap-3 justify-center text-green-600 font-bold mb-1">
                            <Check className="w-5 h-5 bg-green-500 rounded-full text-white p-0.5" />
                            Lucas chegou na escola
                         </div>
                         <p className="text-xs text-green-600/70">Há 1 minuto</p>
                      </div>

                      {act4 > 0.6 && (
                         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none">
                            <Heart className="absolute w-12 h-12 text-red-500 animate-[ping_2s_ease-out_infinite] left-0 top-1/4" />
                            <Heart className="absolute w-8 h-8 text-pink-500 animate-[ping_2.5s_ease-out_infinite] right-0 bottom-1/3" />
                         </div>
                      )}
                  </div>
              </div>

              {/* Título Final e CTA */}
              <div className={cn("absolute inset-x-0 bottom-12 flex flex-col items-center text-center transition-all duration-1000 delay-300", act4 > 0.8 ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0")}>
                  <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white drop-shadow-2xl">
                    O fim da ansiedade.
                  </h1>
                  <p className="text-xl text-zinc-400 mb-8 font-medium">Você foca no volante, a Guardian foca no negócio.</p>
                  <Button size="lg" className="h-16 px-12 text-lg font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-[0_0_40px_rgba(59,130,246,0.5)] rounded-full transition-transform hover:scale-105" asChild>
                     <Link href="/">Trazer o Guardian pra Minha Van</Link>
                  </Button>
              </div>

           </div>
        </div>

        {/* Progress Navigation Tracker */}
        <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
           <div className={cn("w-2 h-2 rounded-full transition-all", act1 > 0 && act2 === 0 ? "bg-primary h-6" : "bg-white/20")} />
           <div className={cn("w-2 h-2 rounded-full transition-all", act2 > 0 && act3 === 0 ? "bg-blue-500 h-6" : "bg-white/20")} />
           <div className={cn("w-2 h-2 rounded-full transition-all", act3 > 0 && act4 === 0 ? "bg-yellow-500 h-6" : "bg-white/20")} />
           <div className={cn("w-2 h-2 rounded-full transition-all", act4 > 0 ? "bg-green-500 h-6" : "bg-white/20")} />
        </div>

      </div>
    </main>
  );
}

// Helpers
function SetupRow({ text, active, delay = "" }: { text: string, active: boolean, delay?: string }) {
  return (
    <div className={cn("bg-zinc-800/80 p-4 rounded-xl flex items-center justify-between transition-all duration-[600ms] border border-zinc-700/50", active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10", delay)}>
       <span className="font-bold text-sm text-zinc-300">{text}</span>
       <div className={cn("w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500", active ? "bg-green-500" : "bg-zinc-700")}>
         {active && <Check className="w-4 h-4 text-white" />}
       </div>
    </div>
  );
}

function FloatingAvatar({ left, color, delay }: { left: string, color: string, delay: string }) {
  return (
    <div 
       className={cn("absolute bottom-20 w-16 h-16 rounded-full border-4 border-zinc-950 shadow-xl flex items-center justify-center animate-[slide-up_2s_ease-out_forwards]", color)}
       style={{ left, animationDelay: delay }}
    >
       <User className="w-8 h-8 text-white/80" />
    </div>
  );
}

function StudentCheck({ name, checked }: { name: string, checked: boolean }) {
  return (
    <div className={cn("p-4 rounded-2xl flex justify-between items-center transition-all duration-700 border", checked ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400")}>
       <span className="font-bold text-lg">{name}</span>
       {checked ? <Check className="w-6 h-6 border-2 border-green-400 rounded-full p-0.5" /> : <div className="w-6 h-6 rounded-full border-2 border-zinc-600" />}
    </div>
  );
}
