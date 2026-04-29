const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/page.tsx', 'utf8');

  // Componente de Funcionalidades por Módulo
  const moduleFeaturesCode = `
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
      description: "IA embarcada na van. Menos tempo no trânsito, menos estresse e foco total na direção defensiva.",
      features: [
        { title: "Roteirização IA Ativa", desc: "Acabou a rota de cabeça. A IA lê a ausência dos alunos e redesenha a rota de menor tempo todo santo dia.", icon: <MapPin className="w-6 h-6 text-blue-500"/> },
        { title: "Telemetria Blindada", desc: "App não drena a bateria. Uso otimizado que envia o sinal do GPS sem superaquecer o celular do painel.", icon: <Rocket className="w-6 h-6 text-blue-500"/> },
        { title: "Check-in em 1 Clique", desc: "Interface gigante, modo noturno, com botões verdes e vermelhos à prova de erros enquanto dirige.", icon: <Check className="w-6 h-6 text-blue-500"/> }
      ]
    },
    pais: {
      title: "Pais & Responsáveis",
      description: "Paz de espírito na palma da mão. Acesso instantâneo e rastreio sem poluir o WhatsApp do Tio da Van.",
      features: [
        { title: "Acompanhamento Real-Time", desc: "Veja a van dobrando a esquina na tela do seu celular. Receba Push Notifications exatas de embarque e chegada.", icon: <MapPin className="w-6 h-6 text-green-500"/> },
        { title: "Botão Único de Ausência", desc: "Criança doente? Aperte o botão da Ausência e a IA remove a sua casa da rota da Van silenciosamente.", icon: <X className="w-6 h-6 text-green-500"/> },
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
              <div key={idx} className="bg-card border-2 border-border/60 hover:border-primary/30 hover:shadow-xl transition-all p-8 rounded-3xl space-y-6 flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in duration-500" style={{ animationDelay: \`\${idx * 150}ms\` }}>
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
`;

  if (!code.includes('function ModuleFeatures()')) {
    // Inject the component just before export default function LandingPage
    code = code.replace(/export default function LandingPage\(\) \{/, moduleFeaturesCode + '\nexport default function LandingPage() {');
    
    // Replace the exact tag where I want it (Right above <ProductTour />)
    code = code.replace(/<ProductTour \/>/, '<ModuleFeatures />\n\n      <ProductTour />');
    
    fs.writeFileSync('src/app/page.tsx', code);
    console.log("ModuleFeatures Injetado com SUCESSO antes do ProductTour!");
  } else {
    console.log("ModuleFeatures ja existe no arquivo.");
  }
} catch (e) {
  console.error("Erro ao injetar ModuleFeatures:", e);
}
