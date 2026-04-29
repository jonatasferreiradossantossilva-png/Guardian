const fs = require('fs');

try {
  let code = fs.readFileSync('src/app/page.tsx', 'utf8');

  // Lógica 1: Inserir Background no iPhone dos Pais (Acompanhamento ao Vivo - Tab 1)
  const fakeMapSearch = `{/* Fake Map Light */}
                          <div className="absolute inset-0 bg-blue-50/50">`;
  const fakeMapReplace = `{/* Fake Map Light */}
                          <div className="absolute inset-0 bg-blue-50/50">
                             <Image src="/mockups/guardian_parent_app.png" alt="Map Base" fill className="object-cover opacity-60 mix-blend-multiply pointer-events-none" />`;
  code = code.replace(fakeMapSearch, fakeMapReplace);

  // Lógica 2: Inserir Background no iPhone dos Pais (Ausência - Tab 2)
  const ausenciaSearch = `{/* TAB 2: AUSENCIA */}
                  {activeTab === 2 && (
                      <div className="absolute inset-0 bg-zinc-50 p-6 pt-20 flex flex-col gap-6 animate-in slide-in-from-right duration-500">`;
  const ausenciaReplace = `{/* TAB 2: AUSENCIA */}
                  {activeTab === 2 && (
                      <div className="absolute inset-0 bg-zinc-50 p-6 pt-20 flex flex-col gap-6 animate-in slide-in-from-right duration-500 overflow-hidden">
                          <Image src="/mockups/guardian_parent_app.png" alt="Map Base" fill className="object-cover opacity-20 dark:opacity-5 blur-sm pointer-events-none" />`;
  code = code.replace(ausenciaSearch, ausenciaReplace);

  // Lógica 3: Inserir Background no Tablet de Administração (Ato 1, 2 e 3 do ProductTour)
  // Ato 1 - Setup
  const setupAto1Search = `{/* Tela do App - Estado 1: Setup */}
              {activeTab === 1 && (
                <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500">`;
  const setupAto1Replace = `{/* Tela do App - Estado 1: Setup */}
              {activeTab === 1 && (
                <div className="flex-1 p-6 flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-500 relative">
                  <Image src="/mockups/guardian_manager_dashboard.png" alt="Manager UI" fill className="object-cover opacity-10 blur-sm pointer-events-none" />`;
  code = code.replace(setupAto1Search, setupAto1Replace);

  // Ato 2 - IA Operacional (Motorista)
  const setupAto2Search = `{/* Tela do App - Estado 2: Rota */}
              {activeTab === 2 && (
                <div className="flex-1 bg-zinc-900 border-t border-zinc-800 p-6 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-500">`;
  const setupAto2Replace = `{/* Tela do App - Estado 2: Rota */}
              {activeTab === 2 && (
                <div className="flex-1 bg-zinc-900 border-t border-zinc-800 p-6 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-500">
                   <Image src="/mockups/guardian_driver_gps.png" alt="Driver Map" fill className="object-cover opacity-40 mix-blend-screen pointer-events-none" />`;
  code = code.replace(setupAto2Search, setupAto2Replace);

  // Ato 3 - Faturas
  const setupAto3Search = `{/* Tela do App - Estado 3: Faturas */}
              {activeTab === 3 && (
                <div className="flex-1 p-6 flex flex-col gap-6 bg-card animate-in fade-in slide-in-from-right duration-[600ms]">`;
  const setupAto3Replace = `{/* Tela do App - Estado 3: Faturas */}
              {activeTab === 3 && (
                <div className="flex-1 p-6 flex flex-col gap-6 bg-card animate-in fade-in slide-in-from-right duration-[600ms] relative overflow-hidden">
                  <Image src="/mockups/guardian_manager_dashboard.png" alt="Finance UI" fill className="object-cover opacity-10 blur-[1px] mix-blend-luminosity pointer-events-none" />`;
  code = code.replace(setupAto3Search, setupAto3Replace);

  fs.writeFileSync('src/app/page.tsx', code);
  console.log("Integração Visual completada.");

} catch(e) {
  console.error("Erro", e);
}
