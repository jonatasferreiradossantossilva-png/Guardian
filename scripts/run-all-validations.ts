import path from 'path';
import { runner } from './validators/core/test-runner';
import { runGestorSuite } from './validators/suites/gestor.suite';
import { runMotoristaSuite } from './validators/suites/motorista.suite';
import { runMonitorSuite } from './validators/suites/monitor.suite';
import { runPaiSuite } from './validators/suites/pai.suite';
import { runPlanejamentoSuite } from './validators/suites/planejamento.suite';
import { runRegressaoSuite } from './validators/suites/regressao.suite';
import { runE2EJornadaSuite } from './validators/suites/e2e-jornada.suite';

async function main() {
  console.log(`
\x1b[1m\x1b[34m===============================================================
       🛡️  GUARDIAN - VALIDATION & REGRESSION SUITE  🛡️
===============================================================\x1b[0m
  Executando validação integral das jornadas + planejamento + regressão + E2E...
  `);

  const globalStart = Date.now();

  // Executar todas as suítes
  await runGestorSuite();
  await runMotoristaSuite();
  await runMonitorSuite();
  await runPaiSuite();
  await runPlanejamentoSuite();
  await runRegressaoSuite();
  await runE2EJornadaSuite();

  const totalTime = ((Date.now() - globalStart) / 1000).toFixed(2);
  const results = runner.getResults();

  const allScenarios = results.flatMap(s => s.scenarios);
  const totalScenarios = allScenarios.length;
  const passedScenarios = allScenarios.filter(s => s.status === 'PASS').length;
  const failedScenarios = allScenarios.filter(s => s.status === 'FAIL').length;
  const allSteps = allScenarios.flatMap(s => s.steps);

  console.log(`
\x1b[1m\x1b[32m===============================================================
       📊  RESULTADO GERAL DA VALIDAÇÃO GUARDIAN  📊
===============================================================\x1b[0m
  Tempo Total:         ${totalTime}s
  Total de Suítes:     ${results.length}
  Total de Cenários:   ${totalScenarios}
  Total de Passos:     ${allSteps.length}
  Aprovados:           \x1b[32m${passedScenarios}\x1b[0m
  Falhas:              ${failedScenarios > 0 ? `\x1b[31m${failedScenarios}\x1b[0m` : '\x1b[32m0\x1b[0m'}
  Taxa de Sucesso:     \x1b[1m${passedScenarios === totalScenarios ? '\x1b[32m100%' : `\x1b[31m${Math.round((passedScenarios/totalScenarios)*100)}%`}\x1b[0m
===============================================================
  `);

  // Gerar Relatório HTML
  const reportPath = path.resolve(process.cwd(), 'reports', 'guardian-test-report.html');
  const publicReportPath = path.resolve(process.cwd(), 'public', 'reports', 'index.html');
  
  runner.generateHtmlReport(reportPath);
  runner.generateHtmlReport(publicReportPath);

  console.log(`\x1b[1m\x1b[36m📄 Dashboard HTML gerado com sucesso em:\x1b[0m`);
  console.log(`   👉 file:///${reportPath.replace(/\\/g, '/')}`);
  console.log(`   👉 Servido via web em: /reports/index.html\n`);

  if (failedScenarios > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Erro fatal durante a execução:', err);
  process.exit(1);
});
