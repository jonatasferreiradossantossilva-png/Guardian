const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/page.tsx', 'utf8');

  // New Feature Matrix Component
  const featureMatrixCode = `
function FeatureMatrix() {
  const features = [
    { name: "Painel Financeiro & Conciliação Pix", gestor: true, motorista: false, pais: false },
    { name: "Envio Automático de Faturas WhatsApp", gestor: true, motorista: false, pais: false },
    { name: "Despacho de Viagens Avulsas (Pix)", gestor: true, motorista: true, pais: true },
    { name: "Roteirização Inteligente Diária (IA)", gestor: true, motorista: true, pais: false },
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
`;

  if (!code.includes('function FeatureMatrix()')) {
    // 1. Inject the component definition at the bottom of the file
    code = code.replace(/export default function LandingPage\(\) \{/, featureMatrixCode + '\nexport default function LandingPage() {');
    
    // 2. Inject the `<FeatureMatrix />` usage right after `<ParentsTour />` (between parents tour and Bento Grid)
    code = code.replace(/<ParentsTour \/>/, '<ParentsTour />\n\n      <FeatureMatrix />\n');
    
    fs.writeFileSync('src/app/page.tsx', code);
    console.log("FeatureMatrix Re-adicionada com Sucesso.");
  } else {
    console.log("FeatureMatrix já existe.");
  }

} catch (e) {
  console.error("Erro fatal: ", e);
}
