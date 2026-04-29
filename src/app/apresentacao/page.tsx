"use client";
import { useState, useEffect } from "react";
import { Check, Share2, User, X, ArrowDownRight, ClipboardCheck, Activity, Bell, LocateFixed, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, ShieldCheck, MapPin, Zap, ChevronRight, Play } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMockData } from "@/hooks/use-mock-data";

// --- Componente Local do Tour Interativo que inseriremos na página:
function ProductTour() {
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev === 3 ? 1 : prev + 1));
    }, 8000); // Rotação a cada 8s
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="tecnologia" className="py-24 md:py-32 bg-background border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black">Excelência Operacional</Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">O fim das planilhas e rotas perdidas.</h2>
          <p className="text-xl text-muted-foreground">Experimente a gestão ponta a ponta com **Blindagem Anti-Falhas (Deep Shielding)**. Veja o ecossistema VanGuardian operando com estabilidade absoluta.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Lado Esquerdo: Navegador dos 3 Atos */}
          <div className="space-y-4">
            <button 
              onClick={() => setActiveTab(1)}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 1 ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-transparent hover:bg-muted/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 1 ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 1 ? "text-primary" : "text-foreground")}>Ato 1: Setup Mágico</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">Configuração completa em minutos. Cadastro do Motorista, Veículos e geração do "Link Vapt-Vupt" enviável direto para os pais via WhatsApp.</p>
            </button>

            <button 
              onClick={() => setActiveTab(2)}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 2 ? "border-blue-500 bg-blue-500/5 shadow-lg shadow-blue-500/10" : "border-transparent hover:bg-muted/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 2 ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground")}>
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 2 ? "text-blue-500" : "text-foreground")}>Ato 2: Mapas de Alta Precisão</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">Na van, o algoritmo de roteamento Leaflet calcula o trajeto ideal com visualização dinâmica de rotas. Check-ins de alunos com avatares personalizados garantem identificação instantânea.</p>
            </button>

            <button 
              onClick={() => setActiveTab(3)}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 3 ? "border-green-500 bg-green-500/5 shadow-lg shadow-green-500/10" : "border-transparent hover:bg-muted/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 3 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")}>
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 3 ? "text-green-500" : "text-foreground")}>Ato 3: ROI e Faturamento</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">No fim do mês, o sistema gera sozinho as cobranças baseadas na quilometragem e lista de contratos. 100% de previsão e inadimplência gerida.</p>
            </button>
          </div>

          {/* Lado Direito: A Janela de Simulação */}
          <div className="relative aspect-[4/3] w-full max-w-2xl mx-auto perspective-1000">
            <div className="absolute inset-x-8 -bottom-8 bg-foreground/10 h-16 blur-2xl rounded-full" />
            
            {/* O Dispositivo Fake (Monitor ou Tablet) */}
            <div className="relative w-full h-full bg-card rounded-2xl border border-border/50 shadow-2xl overflow-hidden flex flex-col transform transition-transform duration-700 hover:rotate-y-2 hover:rotate-x-2">
              
              {/* Header do Dispositivo */}
              <div className="h-10 bg-muted/60 border-b border-border/50 flex items-center px-4 gap-2 shrink-0">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <div className="mx-auto bg-background px-4 py-1 rounded-md text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3 text-primary" /> painel.guardian.app
                </div>
              </div>

              {/* Tela do App - Estado 1: Setup */}
              {activeTab === 1 && (
                <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 relative">
                  <Image src="/mockups/guardian_manager_dashboard.png" alt="Manager UI" fill className="object-cover opacity-10 blur-sm pointer-events-none" />
                  <div className="flex justify-between items-center border-b pb-4">
                    <h4 className="font-bold text-lg">Configurações Base</h4>
                    <Badge className="bg-green-500 animate-pulse">Setup Ativo</Badge>
                  </div>
                  <div className="space-y-4">
                     <div className="h-12 w-full bg-muted/50 rounded-lg flex items-center px-4 gap-4 animate-in slide-in-from-left duration-[500ms]">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><Check className="w-4 h-4 text-primary" /></div>
                        <span className="text-sm font-semibold flex-1">Cadastro de Frota & Motoristas</span>
                     </div>
                     <div className="h-12 w-full bg-muted/50 rounded-lg flex items-center px-4 gap-4 animate-in slide-in-from-left duration-[800ms]">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center"><Check className="w-4 h-4 text-primary" /></div>
                        <span className="text-sm font-semibold flex-1">Lista de Escolas Integrada</span>
                     </div>
                     <div className="h-12 w-full border-2 border-primary/40 bg-primary/5 rounded-lg flex items-center justify-center px-4 gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-transform animate-in slide-in-from-left duration-[1100ms]">
                        <Share2 className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-bold text-primary">Gerar Link p/ WhatsApp Pais</span>
                     </div>
                  </div>
                </div>
              )}

              {/* Tela do App - Estado 2: Mobile Motorista */}
              {activeTab === 2 && (
                <div className="flex-1 bg-zinc-950 p-2 relative animate-in fade-in slide-in-from-bottom-10 duration-[600ms]">
                   {/* Mapa Falso Escuro */}
                   <div className="absolute inset-0 bg-zinc-900 border-2 border-zinc-800 rounded-b-xl overflow-hidden p-6 flex items-center justify-center">
                      <div className="w-full h-full relative">
                         <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-500 rounded-full" />
                         <div className="absolute top-1/2 left-1/2 w-4 h-4 border-2 border-blue-400 bg-blue-500/20 rounded-full animate-ping" />
                         <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-blue-500 rounded-full" />
                         <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-green-500 rounded-full" />
                         {/* Linha falsa */}
                             <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <polyline points="25,25 50,50 75,75" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray="5,5" className="animate-[dash_20s_linear_infinite]" />
                             </svg>
                      </div>
                   </div>

                   {/* Pílula de Navegação Inferior */}
                   <div className="absolute bottom-6 inset-x-6">
                      <div className="bg-zinc-800/90 backdrop-blur-md rounded-2xl p-4 border border-zinc-700 shadow-2xl flex flex-col gap-3">
                         <div className="flex justify-between items-center px-2">
                             <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Próximo Aluno</span>
                             <Badge variant="outline" className="text-blue-400 border-blue-400/30">Logística Otimizada</Badge>
                         </div>
                         <div className="flex items-center justify-between bg-zinc-700/50 p-3 rounded-xl hover:bg-zinc-700 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-zinc-600 flex items-center justify-center"><User className="w-5 h-5 text-zinc-300" /></div>
                                <div><p className="font-bold text-white leading-tight">Lucas S.</p><p className="text-xs text-zinc-400">12 min restantes</p></div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-bounce shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                                <Check className="w-5 h-5 text-white" />
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {/* Tela do App - Estado 3: Faturas */}
              {activeTab === 3 && (
                <div className="flex-1 p-6 flex flex-col gap-6 bg-card animate-in fade-in slide-in-from-right duration-[600ms] relative overflow-hidden">
                  <Image src="/mockups/guardian_manager_dashboard.png" alt="Finance UI" fill className="object-cover opacity-10 blur-[1px] mix-blend-luminosity pointer-events-none" />
                  <div className="flex justify-between items-end border-b pb-4">
                    <div>
                        <h4 className="font-bold text-lg">Resumo Financeiro</h4>
                        <p className="text-xs text-muted-foreground">Ciclo fechado com sucesso</p>
                    </div>
                    <span className="text-2xl font-black text-green-500">R$ 14.850<span className="text-xs text-muted-foreground">,00</span></span>
                  </div>
                  
                  {/* Falso Gráfico */}
                  <div className="h-32 w-full flex items-end gap-2 px-4 border-b border-border/50 pb-2">
                     <div className="flex-1 bg-primary/20 rounded-t-md h-[40%] animate-[slide-up_1s_ease-out_forwards]" />
                     <div className="flex-1 bg-primary/30 rounded-t-md h-[60%] animate-[slide-up_1.2s_ease-out_forwards]" />
                     <div className="flex-1 bg-primary/50 rounded-t-md h-[50%] animate-[slide-up_1.4s_ease-out_forwards]" />
                     <div className="flex-1 bg-primary/70 rounded-t-md h-[80%] animate-[slide-up_1.6s_ease-out_forwards]" />
                     <div className="flex-1 bg-green-500 rounded-t-md h-[100%] shadow-[0_0_20px_rgba(34,197,94,0.3)] animate-[slide-up_1.8s_ease-out_forwards] flex items-start justify-center pt-2 text-[10px] text-white font-black">HOJE</div>
                  </div>

                  {/* Faturas Pagas */}
                  <div className="space-y-3 pt-2">
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">Contrato A</span>
                        <Badge className="bg-green-500/10 text-green-500 border-none">Pago Automático</Badge>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">Contrato B</span>
                        <Badge className="bg-green-500/10 text-green-500 border-none">Pago Automático</Badge>
                     </div>
                     <div className="flex justify-between items-center text-sm">
                        <span className="font-bold">Viagem Avulsa (Marina)</span>
                        <Badge className="bg-blue-500/10 text-blue-500 border-none">Pix Confirmado</Badge>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}



function ParentsTour() {
  const [activeTab, setActiveTab] = useState(1);
  const [isAbsent, setIsAbsent] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => {
        if(prev === 2) setIsAbsent(false); // reset state
        return prev === 3 ? 1 : prev + 1;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if(activeTab === 2) {
      setTimeout(() => setIsAbsent(true), 2500); // Trigger absence after 2.5s
    }
  }, [activeTab]);

  return (
    <section id="pais" className="py-24 md:py-32 bg-primary/5 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
          <Badge variant="outline" className="px-3 py-1 bg-white/50 text-foreground border-foreground/20 uppercase tracking-widest text-[10px] font-black">Portal da Família</Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">Acesso total. Ansiedade zero.</h2>
          <p className="text-xl text-muted-foreground">O VanGuardian elimina as mensagens no WhatsApp às 6 da manhã. Tudo é resolvido com um toque, e o motorista é notificado em tempo real.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Lado Esquerdo: O Mockup Virtual Mobile */}
          <div className="relative w-full max-w-[320px] mx-auto perspective-1000 h-[650px] order-2 lg:order-1">
            {/* Sombras base do celular */}
            <div className="absolute -inset-10 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
            
            {/* Carcaça iPhone */}
            <div className="relative w-full h-full bg-black rounded-[50px] border-[8px] border-zinc-900 shadow-2xl overflow-hidden flex flex-col">
               {/* Notch/Dynamic Island */}
               <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-full z-50 flex items-center px-3 justify-between">
                  <div className="w-2 h-2 rounded-full bg-blue-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500" />
               </div>

               {/* Tela do App */}
               <div className="flex-1 bg-zinc-50 flex flex-col relative w-full h-full overflow-hidden">
                   
                  {/* TAB 1: RASTREIO */}
                  {activeTab === 1 && (
                      <div className="absolute inset-0 bg-white animate-in slide-in-from-right duration-500">
                          {/* Fake Map Light */}
                          <div className="absolute inset-0 bg-blue-50/50">
                             <Image src="/mockups/guardian_parent_app.png" alt="Map Base" fill className="object-cover opacity-60 mix-blend-multiply pointer-events-none" />
                             <div className="w-full h-full relative p-6">
                                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-400 rounded-full" />
                                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-red-400 rounded-full" />
                                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                    <line x1="25%" y1="25%" x2="50%" y2="50%" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6,6" className="animate-[dash_10s_linear_infinite]" />
                                    <line x1="50%" y1="50%" x2="75%" y2="75%" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6,6" className="animate-[dash_10s_linear_infinite]" />
                                 </svg>
                                {/* Van Movendo */}
                                <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-yellow-400 rounded-lg border-2 border-white shadow-lg flex items-center justify-center animate-ping" />
                                <div className="absolute top-1/2 left-1/2 w-8 h-8 bg-yellow-400 rounded-lg border-2 border-white shadow-xl flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 z-10"><MapPin className="w-4 h-4 text-white" /></div>
                             </div>
                          </div>
                          {/* Status Overlay */}
                          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white via-white to-transparent p-6 flex flex-col justify-end">
                              <div className="bg-white rounded-2xl p-4 shadow-2xl border border-zinc-100 flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><Check className="text-blue-600 w-6 h-6" /></div>
                                  <div>
                                      <p className="font-bold text-sm">Lucas a bordo</p>
                                      <p className="text-xs text-muted-foreground">Chegada estimada: 07:14</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}

                  {/* TAB 2: AUSENCIA */}
                  {activeTab === 2 && (
                      <div className="absolute inset-0 bg-zinc-50 p-6 pt-20 flex flex-col gap-6 animate-in slide-in-from-right duration-500 overflow-hidden">
                          <Image src="/mockups/guardian_parent_app.png" alt="Map Base" fill className="object-cover opacity-20 dark:opacity-5 blur-sm pointer-events-none" />
                          <div className="space-y-2">
                             <h4 className="text-2xl font-black">Rotina Diária</h4>
                             <p className="text-sm text-zinc-500">Quarta-feira, 14 de Março</p>
                          </div>

                          <div className="bg-white rounded-2xl p-5 shadow-sm border border-zinc-100 mt-4 space-y-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-zinc-100" />
                                  <div className="font-bold">Colégio Objetivo <span className="block text-xs text-zinc-400 font-medium">Ida 06:30</span></div>
                              </div>

                              {!isAbsent ? (
                                <button className="w-full bg-red-50 text-red-600 font-bold py-3 rounded-xl border border-red-100 transition-colors animate-in fade-in duration-300 flex items-center justify-center gap-2">
                                    <X className="w-4 h-4" /> Comunicar Ausência
                                </button>
                              ) : (
                                <div className="w-full bg-green-500 text-white font-bold py-3 rounded-xl shadow-lg border-2 border-green-400 transition-all animate-in zoom-in-95 duration-500 flex items-center justify-center gap-2">
                                    <Check className="w-5 h-5" /> Ausência Confirmada
                                </div>
                              )}
                          </div>

                          {/* Pop-up Mágico do lado do motorista */}
                          {isAbsent && (
                             <div className="absolute top-1/2 -right-32 w-48 bg-zinc-900 border border-zinc-700 rounded-xl p-3 shadow-2xl animate-in slide-in-from-left-10 fade-in duration-500 hidden md:block z-50">
                                 <span className="text-[9px] font-black uppercase text-blue-400">Tablet do Motorista</span>
                                 <p className="text-white text-xs mt-1">Rota Recalculada! Parada "Lucas" removida. <span className="text-green-400 font-bold">1km Poupos.</span></p>
                             </div>
                          )}
                      </div>
                  )}

                  {/* TAB 3: RECEITA/AVULSO */}
                  {activeTab === 3 && (
                      <div className="absolute inset-0 bg-blue-600 p-6 pt-20 flex flex-col animate-in slide-in-from-right duration-500 text-white">
                          <div className="space-y-1 mb-8">
                             <h4 className="text-3xl font-black">Viagem Avulsa</h4>
                             <p className="text-blue-200 text-sm">Natação (15:00)</p>
                          </div>

                          <div className="flex-1 bg-white rounded-t-3xl text-zinc-900 p-6 mt-10 relative">
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 bg-green-500 rounded-full border-4 border-blue-600 flex items-center justify-center shadow-xl animate-bounce">
                                <Check className="w-8 h-8 text-white" />
                             </div>
                             
                             <div className="mt-10 text-center space-y-2 border-b border-dashed border-zinc-200 pb-6">
                                <p className="text-sm text-zinc-500 font-medium">Pagamento Aprovado</p>
                                <p className="text-4xl font-black text-green-600">R$ 25,00</p>
                             </div>

                             <div className="mt-6 space-y-4">
                                <div className="flex justify-between text-sm"><span className="text-zinc-500">Passageiro</span><span className="font-bold">Marina Sousa</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-500">Motorista</span><span className="font-bold">João (Van 2)</span></div>
                                <div className="flex justify-between text-sm"><span className="text-zinc-500">Autorização Pix</span><span className="font-bold">Há 2 min</span></div>
                             </div>

                             {/* Código de barras fake */}
                             <div className="mt-8 flex justify-center opacity-30">
                                <div className="w-full h-8 flex gap-1 justify-center">
                                   {[...Array(20)].map((_, i) => <div key={i} className="bg-black mix-blend-multiply" style={{ width: Math.random() * 4 + 1 + 'px' }} />)}
                                </div>
                             </div>
                          </div>
                      </div>
                  )}

               </div>
            </div>
          </div>

          {/* Lado Direito: Os Atos */}
          <div className="space-y-4 order-1 lg:order-2">
            <button 
              onClick={() => setActiveTab(1)}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 1 ? "border-blue-500 bg-white shadow-xl shadow-blue-500/10" : "border-transparent hover:bg-white/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 1 ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground")}>
                  <MapPin className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 1 ? "text-blue-500" : "text-foreground")}>1. Acompanhamento ao Vivo</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">O celular avisa (notificação verde) no exato instante de embarque e desembarque na escola. O mapa em tempo real substitui a agonia da espera.</p>
            </button>

            <button 
              onClick={() => { setActiveTab(2); setIsAbsent(false); }}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 2 ? "border-red-500 bg-white shadow-xl shadow-red-500/10" : "border-transparent hover:bg-white/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 2 ? "bg-red-500 text-white" : "bg-muted text-muted-foreground")}>
                  <X className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 2 ? "text-red-500" : "text-foreground")}>2. Comunicação de Ausência</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">Acordou doente? Um clique no app da mãe e a van não perde a viagem tentando ir à porta. O algoritmo reconstrói a rota do motorista na mesma fração de segundo.</p>
            </button>

            <button 
              onClick={() => setActiveTab(3)}
              className={cn("w-full text-left p-6 rounded-2xl border-2 transition-all duration-300", activeTab === 3 ? "border-green-500 bg-white shadow-xl shadow-green-500/10" : "border-transparent hover:bg-white/50")}
            >
              <div className="flex items-center gap-4 mb-2">
                <div className={cn("p-3 rounded-lg flex items-center justify-center shrink-0", activeTab === 3 ? "bg-green-500 text-white" : "bg-muted text-muted-foreground")}>
                  <Zap className="h-6 w-6" />
                </div>
                <h3 className={cn("text-xl font-black", activeTab === 3 ? "text-green-500" : "text-foreground")}>3. Viagens Extras Instantâneas</h3>
              </div>
              <p className="text-muted-foreground ml-16 font-medium">Mudança de planos? Os pais pedem uma viagem avulsa pelo app, pagam via Pix Integrado, e a van recebe uma ordem rentável sem intervenção humana.</p>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}


function ModuleFeatures() {
  const [activeModule, setActiveModule] = useState<"gestor" | "motorista" | "pais">("gestor");

  const modulesData = {
    gestor: {
      title: "Gestor Escolar",
      description: "Controle total da operação de trás da mesa. Faturamento previsível e zero dores de cabeça administrativas.",
      features: [
        { title: "Faturamento Automático PIX", desc: "Esqueça conciliação manual. O sistema gera faturas dinâmicas por km rodado e cobra inadimplentes via WhatsApp.", icon: <Zap className="w-6 h-6 text-primary"/> },
        { title: "Assinatura Online", desc: "Link de convite para os pais preencherem ficha de saúde, rota e assinatura do contrato em 2 minutos via celular.", icon: <Share2 className="w-6 h-6 text-primary"/> },
        { title: "Dashboards de Rentabilidade", desc: "Análise de DRE por veículo, custos de manutenção preditiva e projeção de caixa mensal da sua frota.", icon: <Check className="w-6 h-6 text-primary"/> }
      ]
    },
    motorista: {
      title: "Motorista & Monitor",
      description: "Logística dinâmica embarcada na van. Menos tempo no trânsito, menos estresse e foco total na direção defensiva.",
      features: [
        { title: "Roteirização Otimizada", desc: "Acabou a rota de cabeça. O roteiro inteligente lê a ausência dos alunos e redesenha a rota de menor tempo todo santo dia.", icon: <MapPin className="w-6 h-6 text-blue-500"/> },
        { title: "Telemetria Blindada", desc: "App não drena a bateria. Uso otimizado que envia o sinal do GPS sem superaquecer o celular do painel.", icon: <Rocket className="w-6 h-6 text-blue-500"/> },
        { title: "Check-in em 1 Clique", desc: "Interface gigante, modo noturno, com botões verdes e vermelhos à prova de erros enquanto dirige.", icon: <Check className="w-6 h-6 text-blue-500"/> }
      ]
    },
    pais: {
      title: "Pais & Responsáveis",
      description: "Paz de espírito na palma da mão. Acesso instantâneo e rastreio sem poluir o WhatsApp do Tio da Van.",
      features: [
        { title: "Acompanhamento Real-Time", desc: "Veja a van dobrando a esquina na tela do seu celular. Receba Push Notifications exatas de embarque e chegada.", icon: <MapPin className="w-6 h-6 text-green-500"/> },
        { title: "Botão Único de Ausência", desc: "Criança doente? Aperte o botão da Ausência e o roteiro remove a sua casa da rota da Van silenciosamente.", icon: <X className="w-6 h-6 text-green-500"/> },
        { title: "Carteira e Viagens Avulsas", desc: "A van leva para a natação hoje? Peça viagem avulsa pelo app, pague via Pix integrado e o motorista é avisado.", icon: <Zap className="w-6 h-6 text-green-500"/> }
      ]
    }
  };

  return (
    <section id="modulos" className="py-24 bg-background border-t border-border/50 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black">Uma Plataforma Modular</Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Todas as funcionalidades.</h2>
          <p className="text-xl text-muted-foreground">O ecossistema é dividido exatamente para as necessidades de cada ponta da operação.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20 max-w-4xl mx-auto">
          <button 
            onClick={() => setActiveModule("gestor")}
            className={cn("px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border-2", activeModule === "gestor" ? "bg-primary text-white border-primary shadow-lg shadow-primary/20 scale-105" : "border-border hover:border-primary/50 text-muted-foreground")}
          >
            Módulo Gestão
          </button>
          <button 
            onClick={() => setActiveModule("motorista")}
            className={cn("px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border-2", activeModule === "motorista" ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-600/20 scale-105" : "border-border hover:border-blue-500/50 text-muted-foreground")}
          >
            Módulo Operacional
          </button>
          <button 
            onClick={() => setActiveModule("pais")}
            className={cn("px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 border-2", activeModule === "pais" ? "bg-green-500 text-white border-green-500 shadow-lg shadow-green-500/20 scale-105" : "border-border hover:border-green-500/50 text-muted-foreground")}
          >
            Módulo Família
          </button>
        </div>

        {/* Tab Content */}
        <div className="max-w-6xl mx-auto" key={activeModule}>
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4 animate-in fade-in duration-500">
            <h3 className="text-3xl font-black text-foreground">{modulesData[activeModule].title}</h3>
            <p className="text-lg text-muted-foreground font-medium">{modulesData[activeModule].description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {modulesData[activeModule].features.map((feature, idx) => (
              <div key={idx} className="bg-card border-2 border-border/60 hover:border-primary/30 hover:shadow-xl transition-all p-8 rounded-3xl space-y-6 flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in duration-500" style={{ animationDelay: `${idx * 150}ms` }}>
                <div className="p-4 rounded-2xl bg-muted/50 ring-1 ring-border shadow-sm flex items-center justify-center">
                  {feature.icon}
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


function FeatureMatrix() {
  const features = [
    { name: "Painel Financeiro & Conciliação Pix", gestor: true, motorista: false, pais: false },
    { name: "Envio Automático de Faturas WhatsApp", gestor: true, motorista: false, pais: false },
    { name: "Despacho de Viagens Avulsas (Pix)", gestor: true, motorista: true, pais: true },
    { name: "Roteirização Inteligente Diária (Smart)", gestor: true, motorista: true, pais: false },
    { name: "Telemetria Blindada (Low Battery)", gestor: false, motorista: true, pais: false },
    { name: "Comunicação de Ausência Instantânea", gestor: false, motorista: true, pais: true },
    { name: "Rastreio em Tempo Real (Live Map)", gestor: true, motorista: false, pais: true },
    { name: "Alertas de Aproximação (800m)", gestor: false, motorista: false, pais: true },
    { name: "Check-in Inteligente (QR/Lista)", gestor: false, motorista: true, pais: false },
    { name: "Assinatura Digital de Contratos", gestor: true, motorista: false, pais: true },
  ];

  return (
    <section id="matriz" className="py-24 bg-muted/20 border-y border-border/50">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-16 space-y-4">
          <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black">Raio-X do Sistema</Badge>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Matriz de Funcionalidades.</h2>
          <p className="text-xl text-muted-foreground">O que cada parte envolvida no ecossistema tem o poder de fazer.</p>
        </div>

        <div className="overflow-x-auto rounded-3xl border-2 border-border/50 shadow-xl bg-card">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="p-6 text-sm font-black uppercase tracking-widest w-1/2">Funcionalidade / Solução</th>
                <th className="p-6 text-sm font-black uppercase tracking-widest text-center text-primary">Gestor</th>
                <th className="p-6 text-sm font-black uppercase tracking-widest text-center text-blue-500">Motorista</th>
                <th className="p-6 text-sm font-black uppercase tracking-widest text-center text-green-500">Pais</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {features.map((f, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors group">
                  <td className="p-6 text-sm font-bold text-foreground group-hover:text-primary transition-colors">{f.name}</td>
                  <td className="p-6 text-center">
                    {f.gestor ? <Check className="w-5 h-5 mx-auto text-primary" /> : <div className="w-2 h-2 rounded-full bg-muted mx-auto opacity-30"/>}
                  </td>
                  <td className="p-6 text-center">
                    {f.motorista ? <Check className="w-5 h-5 mx-auto text-blue-500" /> : <div className="w-2 h-2 rounded-full bg-muted mx-auto opacity-30"/>}
                  </td>
                  <td className="p-6 text-center">
                    {f.pais ? <Check className="w-5 h-5 mx-auto text-green-500" /> : <div className="w-2 h-2 rounded-full bg-muted mx-auto opacity-30"/>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}


function CostControlBento() {
  return (
    <section id="financas" className="py-24 md:py-32 bg-background relative overflow-hidden border-t border-border/50">
      <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" />
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-20 animate-in fade-in duration-500">
          <Badge variant="outline" className="px-3 py-1 bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase tracking-widest text-[10px] font-black">Inteligência Financeira</Badge>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight">Saiba exatamente o seu custo de operação.</h2>
          <p className="text-xl text-muted-foreground">O único sistema do mercado que expõe a margem de lucro por viagem cruzando Km Previsto vs Km Realizado.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          <div className="space-y-8 animate-in slide-in-from-left duration-700">
            <div className="flex gap-4 items-start">
               <div className="w-12 h-12 rounded-2xl bg-muted border flex items-center justify-center shrink-0">
                  <span className="font-black text-xl text-foreground">1</span>
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-2">Elimine a Inadimplência</h4>
                  <p className="text-muted-foreground leading-relaxed">Emissão de faturas PIX agendadas com disparos automáticos via WhatsApp. Saiba quem pagou antes mesmo da van dar a partida.</p>
               </div>
            </div>
            
            <div className="flex gap-4 items-start">
               <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-xl text-blue-500">2</span>
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-2">Auditoria de Quilometragem</h4>
                  <p className="text-muted-foreground leading-relaxed">Cruzamento em tempo real do percurso previsto pelo otimizador contra o trajeto que o motorista de fato fez (Km Real). Foco total em conter o desperdício de diesel.</p>
               </div>
            </div>

            <div className="flex gap-4 items-start">
               <div className="w-12 h-12 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0">
                  <span className="font-black text-xl text-green-500">3</span>
               </div>
               <div>
                  <h4 className="text-xl font-bold mb-2">DRE Instantânea</h4>
                  <p className="text-muted-foreground leading-relaxed">Visão gerencial de receita total, custo fixo por veículo e margem de lucro líquida diretamente na palma da mão.</p>
               </div>
            </div>
          </div>

          <div className="relative animate-in zoom-in-95 duration-700">
            {/* O Painel de Comparativo de Custos (Clone Sister) */}
            <div className="bg-card w-full rounded-3xl border-2 border-border/50 shadow-2xl p-6 lg:p-8 relative z-10">
               <div className="flex justify-between items-center mb-6">
                  <h5 className="font-black text-lg">Rota Manhã (Colégio Objetivo)</h5>
                  <Badge className="bg-green-500 text-white font-bold">Encerrada</Badge>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-2xl space-y-3">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Roteiro Previsto</p>
                     <div className="space-y-1">
                        <div className="flex justify-between"><span className="text-xs">Distância:</span> <span className="text-xs font-bold">59.8 km</span></div>
                        <div className="flex justify-between"><span className="text-xs">Duração:</span> <span className="text-xs font-bold">02:38</span></div>
                        <div className="flex justify-between"><span className="text-xs">Custo Aluno:</span> <span className="text-xs font-bold text-destructive">R$ 14,90</span></div>
                     </div>
                  </div>

                  <div className="bg-blue-500/5 border border-blue-500/20 p-4 rounded-2xl space-y-3 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-12 h-12 bg-blue-500/10 rounded-full blur-xl" />
                     <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest">Van Executou</p>
                     <div className="space-y-1 relative z-10">
                        <div className="flex justify-between"><span className="text-xs">Distância:</span> <span className="text-xs font-bold text-green-600">48.3 km (-19%)</span></div>
                        <div className="flex justify-between"><span className="text-xs">Duração:</span> <span className="text-xs font-bold text-green-600">02:12</span></div>
                        <div className="flex justify-between"><span className="text-xs">Custo Aluno:</span> <span className="text-xs font-black text-green-600">R$ 11,20</span></div>
                     </div>
                  </div>
               </div>

               <div className="mt-6 pt-6 border-t border-border flex justify-between items-end">
                  <div>
                      <p className="text-xs font-medium text-muted-foreground">Lucro Líquido da Rota</p>
                      <p className="text-3xl font-black text-foreground">R$ 184<span className="text-lg">,50</span></p>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white"><ArrowDownRight className="w-5 h-5" /></div>
               </div>
            </div>
            
            {/* Decorações do Mockup */}
            <div className="absolute -bottom-6 -right-6 w-3/4 h-32 bg-blue-600 rounded-3xl -z-10 rotate-3 opacity-20 blur-sm" />
          </div>

        </div>
      </div>
    </section>
  );
}

function CoreFeaturesGrid() {
  const coreFeats = [
    { title: "Roteamento Rápido", desc: "Avanço e recuo na fila de alunos com 1 toque.", icon: <Rocket /> },
    { title: "Função Waze / Maps", desc: "Abre o mapa externo guiando motoristas novatos.", icon: <MapPin /> },
    { title: "Ausências Simplificadas", desc: "Pais reportam não comparecimento no próprio celular.", icon: <X /> },
    { title: "Avisos de Aproximação", desc: "Reduz o tempo de espera do aluno na porta.", icon: <Bell /> },
    { title: "Rastreamento Master", desc: "Controle e posição de toda a sua frota em mapa único.", icon: <LocateFixed /> },
    { title: "Ficha de Matrícula OCR", desc: "Zero digitação para a equipe da van e pais.", icon: <ClipboardCheck /> },
    { title: "Contrato Eletrônico", desc: "Diga adeus ao papel. Assinatura jurídica via smartphone.", icon: <ShieldCheck /> },
    { title: "Emissão de Cobrança", desc: "Fecho mensal com pagamentos Pix auditados no app.", icon: <DollarSign /> },
    { title: "Histórico Vitalício", desc: "Guardo absoluto de trajeto, logs e horários.", icon: <Activity /> }
  ];

  return (
    <section className="py-24 bg-muted/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <Badge variant="outline" className="px-3 py-1 bg-background text-foreground uppercase tracking-widest text-[10px] font-black border-border shadow-sm">Recursos Essenciais</Badge>
          <h2 className="text-3xl md:text-5xl font-black tracking-tight">Tudo que o transporte escolar precisa.</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {coreFeats.map((feat, i) => (
            <div key={i} className="group flex gap-4 p-6 bg-card border-2 border-transparent hover:border-primary/20 rounded-2xl hover:shadow-xl transition-all duration-300">
               <div className="w-12 h-12 rounded-xl bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors flex items-center justify-center shrink-0">
                  {feat.icon}
               </div>
               <div>
                  <h4 className="font-bold text-foreground mb-1">{feat.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
               </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { setIsSimulating } = useMockData();

  const whatsappUrl = "https://wa.me/5511983680393?text=Olá! Estava navegando no site VanGuardian e gostaria de saber mais sobre a solução.";
  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/30">
      {/* HEADER NAVBAR */}
      <header className="fixed top-0 w-full z-50 bg-background/70 backdrop-blur-lg border-b border-border/50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="rounded-xl bg-primary/10 p-2.5 border border-primary/30 group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="h-6 w-6 text-primary" />
            </div>
            <span className="text-2xl font-black tracking-tight relative">
              VanGuardian
              <span className="absolute -bottom-1 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8 font-semibold text-sm text-foreground/80">
            <Link href="#solucoes" className="hover:text-primary transition-colors">Soluções</Link>
            <Link href="#tecnologia" className="hover:text-primary transition-colors">Tecnologia Smart</Link>
            <Link href="#pais" className="hover:text-primary transition-colors">Para Pais</Link>
            <Link href="/fundador" className="hover:text-primary transition-colors text-primary/80">O Fundador</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Button asChild variant="ghost" className="hidden sm:flex font-bold hover:bg-muted/50">
              <Link href="#solucoes">Conhecer Mais</Link>
            </Button>
            <Button asChild className="rounded-full shadow-lg shadow-primary/20 font-bold px-6">
              <Link href={whatsappUrl} target="_blank">Falar com Consultor <ChevronRight className="ml-2 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION PARALLAX */}
      <section className="relative h-[95vh] min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Layer */}
        <div className="absolute inset-0 w-full h-full z-0 bg-black">
          <Image 
            src="/hero_school_van.png" 
            alt="Van Escolar Moderna" 
            fill 
            className="object-cover opacity-60 mix-blend-screen scale-105 animate-in fade-in zoom-in-105 duration-1000" 
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 pt-20">
          <div className="max-w-3xl space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-md mb-4 animate-in slide-in-from-bottom-4 duration-500 fade-in">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
              <span className="text-xs font-black uppercase tracking-wider">Produção Pronta: Deep Shielding 2.0</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-foreground animate-in slide-in-from-bottom-8 duration-700 fade-in">
              A jornada escolar 
              <span className="block text-primary">que protege e conecta.</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground/90 font-medium max-w-2xl leading-relaxed animate-in slide-in-from-bottom-10 duration-1000 fade-in">
              O primeiro ecossistema duplo do mundo. Segurança milissegundo a milissegundo na palma da família e roteamento preditivo no painel do motorista.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-6 animate-in slide-in-from-bottom-12 duration-1000 fade-in">
              <Button asChild size="lg" className="h-16 px-10 rounded-full font-black text-lg bg-primary hover:bg-primary/90 shadow-xl shadow-primary/25 transition-transform hover:scale-105">
                <Link href="/signup">Cadastrar minha Frota</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-16 px-10 rounded-full font-black text-lg border-2 border-primary/20 hover:bg-primary/5 transition-transform hover:scale-105 bg-background/50 backdrop-blur-md text-primary">
                <Link href="/login">Já sou Cliente</Link>
              </Button>
              <Button 
                size="lg" 
                variant="ghost" 
                className="h-16 px-6 rounded-full font-bold text-muted-foreground transition-all hover:text-foreground"
                onClick={() => {
                  setIsSimulating(true);
                  document.getElementById('tecnologia')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Play className="mr-2 h-5 w-5" /> Ver Demonstração
              </Button>
            </div>
          </div>
        </div>
      </section>




      <ModuleFeatures />

      <ProductTour />

      <ParentsTour />

      <FeatureMatrix />

      <CostControlBento />

      <CoreFeaturesGrid />




      <section id="solucoes" className="py-24 md:py-32 relative bg-background">
        <div className="max-w-7xl mx-auto px-6 space-y-20">
          
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Um aplicativo. Duas realidades perfeitamente alinhadas.</h2>
            <p className="text-xl text-muted-foreground">O VanGuardian cria uma ponte de confiança invisível entre o volante e a sala de estar da sua casa.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Bento TIO DA VAN */}
            <div className="group relative overflow-hidden rounded-3xl border-2 bg-card p-2 hover:border-primary/50 transition-colors duration-500">
              <div className="relative h-[400px] w-full rounded-2xl overflow-hidden">
                <Image 
                  src="/driver_dashboard.png" 
                  alt="Painel do Motorista VanGuardian Otimizado" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <div className="bg-primary/20 backdrop-blur-xl p-4 rounded-2xl border border-primary/30 text-white shadow-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <Zap className="h-6 w-6 text-yellow-400" />
                        <h3 className="text-2xl font-black">Operação Otimizada</h3>
                     </div>
                     <p className="text-white/80 font-medium">Motoristas economizam até 15% de combustível por mês usando o roteamento inteligente e controlam as faltas dos alunos em 1 clique.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bento FAMILIA */}
            <div className="group relative overflow-hidden rounded-3xl border-2 bg-card p-2 hover:border-blue-500/50 transition-colors duration-500">
              <div className="relative h-[400px] w-full rounded-2xl overflow-hidden">
                <Image 
                  src="/parent_app_trust.png" 
                  alt="Mãe sorrindo olhando app na sala" 
                  fill 
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <div className="bg-blue-500/20 backdrop-blur-xl p-4 rounded-2xl border border-blue-400/30 text-white shadow-2xl">
                     <div className="flex items-center gap-3 mb-2">
                        <MapPin className="h-6 w-6 text-blue-400" />
                        <h3 className="text-2xl font-black">Mães Tranquilas</h3>
                     </div>
                     <p className="text-white/80 font-medium">As famílias não precisam mais ligar ou mandar WhatsApp. Notificações automáticas VIP quando a van chega ou entrega na porta.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* COMPARISON TIER */}
      <section id="comparativo" className="w-full py-24 bg-background border-t overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16 space-y-4">
                  <Badge variant="outline" className="px-3 py-1 bg-primary/10 text-primary border-primary/20 uppercase tracking-widest text-[10px] font-black">Liderança de Mercado</Badge>
                  <h2 className="text-4xl md:text-5xl font-black tracking-tight">Por que o VanGuardian é a evolução?</h2>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">O comparativo técnico definitivo de quem trocou a ansiedade pela Logística Inteligente.</p>
              </div>

              <div className="max-w-5xl mx-auto overflow-x-auto rounded-3xl border-2 border-primary/10 shadow-2xl bg-muted/5">
                  <table className="w-full text-left">
                      <thead>
                          <tr className="border-b-2 border-primary/10 bg-primary/5">
                              <th className="p-6 text-sm font-black uppercase tracking-widest whitespace-nowrap">Recurso Estratégico</th>
                              <th className="p-6 text-sm font-black uppercase tracking-widest text-muted-foreground/60 whitespace-nowrap">Mercado Tradicional</th>
                              <th className="p-6 text-sm font-black uppercase tracking-widest text-primary italic whitespace-nowrap">VanGuardian Smart System</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-primary/5">
                          <ComparisonRow 
                              feature="Cadastro Rápido" 
                              traditional="Manual (Erro Humano de Digitação)" 
                              guardian="Link de Convite no Zap c/ Assinatura Digital" 
                              isWin={true} 
                          />
                          <ComparisonRow 
                              feature="Telemetria GPS" 
                              traditional="Alto consumo de pacote de dados" 
                              guardian="Delta Telemetry (Uso ínfimo de Bateria e Rede)" 
                              isWin={true} 
                          />
                          <ComparisonRow 
                              feature="Roteirização Diária" 
                              traditional="Feito de cabeça pelo Motorista" 
                              guardian="Algoritmo Otimizador (Economia Diesel)" 
                              isWin={true} 
                          />
                          <ComparisonRow 
                              feature="Ausência de Aluno" 
                              traditional="WhatsApp bombando às 5h da manhã" 
                              guardian="Botão no app que deleta parada instantaneamente" 
                              isWin={true} 
                          />
                          <ComparisonRow 
                              feature="Faturamento Flexível" 
                              traditional="Planilhas perdidas e inadimplência" 
                              guardian="Fatura Ativa c/ Conciliação Pix Nativa" 
                              isWin={true} 
                          />
                      </tbody>
                  </table>
              </div>
          </div>
      </section>

      {/* STATISTICS & TRUST SECTION */}
      <section className="py-20 bg-muted/30 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-border">
                  <div className="space-y-2">
                      <p className="text-4xl md:text-5xl font-black text-primary">2.4<span className="text-2xl">M</span></p>
                      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Kilômetros Auditados</p>
                  </div>
                  <div className="space-y-2">
                      <p className="text-4xl md:text-5xl font-black text-foreground">+12<span className="text-2xl">k</span></p>
                      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Pais Conectados</p>
                  </div>
                  <div className="space-y-2">
                      <p className="text-4xl md:text-5xl font-black text-primary">0%</p>
                      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Crianças Esquecidas</p>
                  </div>
                  <div className="space-y-2">
                      <p className="text-4xl md:text-5xl font-black text-foreground">30<span className="text-2xl">d</span></p>
                      <p className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Cofre de Histórico Restrito</p>
                  </div>
              </div>
          </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5" />
        <div className="absolute -top-[500px] left-1/2 -translate-x-1/2 w-[1000px] h-[1000px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center space-y-8">
          <Rocket className="h-20 w-20 text-primary mx-auto animate-bounce duration-1000" />
          <h2 className="text-5xl md:text-6xl font-black tracking-tight">Sua frota já está preparada para o futuro?</h2>
          <p className="text-2xl text-muted-foreground max-w-2xl mx-auto">Junte-se ao novo padrão ouro do transporte escolar no país. Convide os pais via WhatsApp com apenas 1 clique.</p>
          <div className="pt-8">
            <Button size="lg" asChild className="h-16 px-12 rounded-full font-black text-xl shadow-2xl shadow-primary/30 hover:scale-105 transition-transform">
              <Link href={whatsappUrl} target="_blank">Quero orçar para minha frota</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-background py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-xl font-black tracking-tight">VanGuardian Technologies</span>
          </div>
          <p className="text-sm font-bold text-muted-foreground">© 2026 VanGuardian Technologies. Todos os direitos reservados. "Logística a favor da Família."</p>
        </div>
      </footer>
    </div>
  );
}

function ComparisonRow({ feature, traditional, guardian, isWin }: { feature: string, traditional: string, guardian: string, isWin: boolean }) {
    return (
        <tr className="group hover:bg-primary/5 transition-colors">
            <td className="p-6">
                <p className="text-xs font-black uppercase tracking-tight text-foreground">{feature}</p>
            </td>
            <td className="p-6">
                <div className="flex items-center gap-2 text-muted-foreground/60 text-xs font-medium">
                    <X className="h-3.5 w-3.5 shrink-0" />
                    <span>{traditional}</span>
                </div>
            </td>
            <td className="p-6">
                <div className={cn(
                    "flex items-center gap-2 text-xs font-bold",
                    isWin ? "text-primary" : "text-foreground"
                )}>
                    <Check className="h-4 w-4 shrink-0" />
                    <span>{guardian}</span>
                </div>
            </td>
        </tr>
    );
}
