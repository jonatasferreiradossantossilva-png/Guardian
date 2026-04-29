const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/page.tsx', 'utf8');

  const vampingCode = `
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
                  <p className="text-muted-foreground leading-relaxed">Cruzamento em tempo real do percurso gerado pela IA (Km Previsto) contra o trajeto que o motorista de fato fez (Km Real). Foco total em conter o desperdício de diesel.</p>
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
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">IA Previu</p>
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
`;

  if (!code.includes('function CostControlBento()')) {
    // Inject components at bottom
    code = code.replace(/export default function LandingPage\(\) \{/, vampingCode + '\nexport default function LandingPage() {');

    // Missing icon imports: ArrowDownRight, ClipboardCheck, Activity, Bell, LocateFixed, DollarSign
    // Let's add them to the lucide-react import
    code = code.replace(/import \{ Check, Share2, User, X \} from "lucide-react";/, 'import { Check, Share2, User, X, ArrowDownRight, ClipboardCheck, Activity, Bell, LocateFixed, DollarSign } from "lucide-react";');

    // Place them below FeatureMatrix, before Comparativo Section
    code = code.replace(/<FeatureMatrix \/>/, '<FeatureMatrix />\n\n      <CostControlBento />\n\n      <CoreFeaturesGrid />\n');

    fs.writeFileSync('src/app/page.tsx', code);
    console.log("Vamping B2B Injetado com SUCESSO.");
  } else {
    console.log("Componente já existe.");
  }

} catch (e) {
  console.error("Erro fatal:", e);
}
