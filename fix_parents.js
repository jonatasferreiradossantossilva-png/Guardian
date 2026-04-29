const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/page.tsx', 'utf8');

  // The new component to be added
  const parentsTourCode = `
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
          <p className="text-xl text-muted-foreground">O Guardian elimina as mensagens no WhatsApp às 6 da manhã. Tudo é resolvido com um toque, e o motorista é notificado em tempo real.</p>
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
                             <div className="w-full h-full relative p-6">
                                <div className="absolute top-1/4 left-1/4 w-3 h-3 bg-red-400 rounded-full" />
                                <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-red-400 rounded-full" />
                                   <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                                      <polyline points="25,25 50,50 75,75" fill="none" stroke="#3b82f6" strokeWidth="4" strokeDasharray="6,6" className="animate-[dash_10s_linear_infinite]" />
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
                      <div className="absolute inset-0 bg-zinc-50 p-6 pt-20 flex flex-col gap-6 animate-in slide-in-from-right duration-500">
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
              <p className="text-muted-foreground ml-16 font-medium">Acordou doente? Um clique no app da mãe e a van não perde a viagem tentando ir à porta. A IA reconstrói a rota do motorista na mesma fração de segundo.</p>
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
`;

  // Only inject if it's not already there
  if (!code.includes('function ParentsTour()')) {
    // Inject the component just before export default function LandingPage
    code = code.replace(/export default function LandingPage\(\) \{/, parentsTourCode + '\nexport default function LandingPage() {');

    // Inject the tag `<ParentsTour />` right below `<ProductTour />`
    code = code.replace(/<ProductTour \/>/, '<ProductTour />\n\n      <ParentsTour />\n');

    fs.writeFileSync('src/app/page.tsx', code);
    console.log("ParentsTour Injetado com SUCESSO.");
  } else {
    console.log("ParentsTour ja existe no arquivo.");
  }
} catch (e) {
  console.error("Erro ao injetar ParentsTour: ", e);
}
