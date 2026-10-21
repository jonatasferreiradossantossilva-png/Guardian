import fs from 'fs';
import path from 'path';

export type ProfileCategory = 'GESTOR' | 'MOTORISTA' | 'MONITOR' | 'PAI' | 'PLANEJAMENTO' | 'REGRESSAO' | 'E2E';

export interface TestStep {
  title: string;
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
  details?: Record<string, any>;
}

export interface TestScenario {
  id: string;
  title: string;
  category: ProfileCategory;
  steps: TestStep[];
  status: 'PASS' | 'FAIL';
  durationMs: number;
  error?: string;
}

export interface TestSuiteResult {
  suiteName: string;
  category: ProfileCategory;
  scenarios: TestScenario[];
  status: 'PASS' | 'FAIL';
  durationMs: number;
}

class TestRunner {
  private suites: TestSuiteResult[] = [];
  private currentSuite: TestSuiteResult | null = null;
  private currentScenario: TestScenario | null = null;

  async suite(suiteName: string, category: ProfileCategory, fn: () => Promise<void> | void) {
    const startTime = Date.now();
    this.currentSuite = {
      suiteName,
      category,
      scenarios: [],
      status: 'PASS',
      durationMs: 0
    };

    console.log(`\n\x1b[1m\x1b[36m=== SUÍTE: [${category}] ${suiteName} ===\x1b[0m`);

    try {
      await fn();
    } catch (err: any) {
      this.currentSuite.status = 'FAIL';
      console.error(`\x1b[31m[ERRO CRÍTICO NA SUÍTE]: ${err.message}\x1b[0m`);
    }

    this.currentSuite.durationMs = Date.now() - startTime;
    if (this.currentSuite.scenarios.some(s => s.status === 'FAIL')) {
      this.currentSuite.status = 'FAIL';
    }

    this.suites.push(this.currentSuite);
    this.currentSuite = null;
  }

  async scenario(id: string, title: string, fn: () => Promise<void> | void) {
    if (!this.currentSuite) throw new Error("Cenário deve ser executado dentro de uma suíte.");

    const startTime = Date.now();
    this.currentScenario = {
      id,
      title,
      category: this.currentSuite.category,
      steps: [],
      status: 'PASS',
      durationMs: 0
    };

    console.log(`\n  \x1b[33m▶ [${id}] ${title}\x1b[0m`);

    try {
      await fn();
    } catch (err: any) {
      this.currentScenario.status = 'FAIL';
      this.currentScenario.error = err.message;
      console.log(`    \x1b[31m✖ Falha no cenário: ${err.message}\x1b[0m`);
    }

    this.currentScenario.durationMs = Date.now() - startTime;
    if (this.currentScenario.steps.some(st => st.status === 'FAIL')) {
      this.currentScenario.status = 'FAIL';
    }

    const icon = this.currentScenario.status === 'PASS' ? '\x1b[32m✔ PASS\x1b[0m' : '\x1b[31m✖ FAIL\x1b[0m';
    console.log(`  ${icon} (${this.currentScenario.durationMs}ms)`);

    this.currentSuite.scenarios.push(this.currentScenario);
    this.currentScenario = null;
  }

  async step(title: string, fn: () => Promise<void> | void, details?: Record<string, any>) {
    if (!this.currentScenario) throw new Error("Step deve ser executado dentro de um cenário.");

    const startTime = Date.now();
    let status: 'PASS' | 'FAIL' = 'PASS';
    let error: string | undefined;

    try {
      await fn();
      console.log(`    \x1b[32m✔\x1b[0m ${title}`);
    } catch (err: any) {
      status = 'FAIL';
      error = err.message;
      console.log(`    \x1b[31m✖\x1b[0m ${title} -> \x1b[31m${err.message}\x1b[0m`);
    }

    const stepItem: TestStep = {
      title,
      status,
      durationMs: Date.now() - startTime,
      error,
      details
    };

    this.currentScenario.steps.push(stepItem);
    if (status === 'FAIL') {
      this.currentScenario.status = 'FAIL';
      throw new Error(`Falha no passo: ${title} (${error})`);
    }
  }

  getResults() {
    return this.suites;
  }

  generateHtmlReport(outputPath: string): string {
    const totalSuites = this.suites.length;
    const allScenarios = this.suites.flatMap(s => s.scenarios);
    const totalScenarios = allScenarios.length;
    const passedScenarios = allScenarios.filter(s => s.status === 'PASS').length;
    const failedScenarios = allScenarios.filter(s => s.status === 'FAIL').length;
    const allSteps = allScenarios.flatMap(s => s.steps);
    const totalSteps = allSteps.length;
    const totalDuration = this.suites.reduce((acc, s) => acc + s.durationMs, 0);
    const passRate = totalScenarios > 0 ? Math.round((passedScenarios / totalScenarios) * 100) : 100;
    const generatedAt = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Guardian QA - Relatório de Validação e Regressão</title>
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111827;
      --card-header: #151e32;
      --border: #1f2937;
      --border-focus: #38bdf8;
      --text: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #38bdf8;
      --green: #22c55e;
      --red: #ef4444;
      --yellow: #eab308;
      --font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: var(--font);
      padding: 2rem 1.5rem;
      line-height: 1.5;
    }
    .container {
      max-width: 1240px;
      margin: 0 auto;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 1rem;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .badge-icon {
      background: linear-gradient(135deg, #0284c7, #38bdf8);
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 26px;
      box-shadow: 0 0 25px rgba(56, 189, 248, 0.4);
    }
    .title h1 {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .title p {
      color: var(--text-muted);
      font-size: 0.875rem;
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .btn-action {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.5rem 0.9rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      transition: all 0.2s;
    }
    .btn-action:hover {
      border-color: var(--primary);
      color: var(--primary);
    }

    .progress-bar-wrap {
      width: 100%;
      height: 6px;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 999px;
      margin-bottom: 2rem;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #38bdf8);
      border-radius: 999px;
      transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .stat-label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      font-weight: 700;
    }
    .stat-value {
      font-size: 1.85rem;
      font-weight: 800;
    }
    .stat-value.green { color: var(--green); }
    .stat-value.red { color: var(--red); }
    .stat-value.blue { color: var(--primary); }

    .controls-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }

    .search-input {
      flex: 1;
      min-width: 280px;
      max-width: 480px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text);
      padding: 0.6rem 1rem;
      border-radius: 10px;
      font-size: 0.875rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .search-input:focus {
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
    }

    .filters {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }
    .filter-btn {
      background: var(--card-bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      padding: 0.45rem 0.85rem;
      border-radius: 8px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    .filter-btn:hover, .filter-btn.active {
      background: var(--primary);
      color: #000;
      border-color: var(--primary);
    }

    .suite-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      margin-bottom: 1.5rem;
      overflow: hidden;
      transition: opacity 0.2s;
    }
    .suite-header {
      padding: 1.1rem 1.5rem;
      background: var(--card-header);
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .suite-title-area {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    .cat-badge {
      font-size: 0.7rem;
      font-weight: 800;
      padding: 0.2rem 0.55rem;
      border-radius: 6px;
      letter-spacing: 0.05em;
      background: rgba(56, 189, 248, 0.15);
      color: var(--primary);
      border: 1px solid rgba(56, 189, 248, 0.3);
    }
    .suite-title {
      font-size: 1.05rem;
      font-weight: 700;
    }
    .scenarios-list {
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }
    .scenario-item {
      border: 1px solid var(--border);
      border-radius: 10px;
      background: rgba(0, 0, 0, 0.25);
      overflow: hidden;
    }
    .scenario-header {
      padding: 0.85rem 1.2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      user-select: none;
      background: rgba(255, 255, 255, 0.015);
      transition: background 0.15s;
    }
    .scenario-header:hover {
      background: rgba(255, 255, 255, 0.045);
    }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 0.25rem 0.6rem;
      border-radius: 6px;
    }
    .status-badge.pass {
      background: rgba(34, 197, 94, 0.15);
      color: var(--green);
      border: 1px solid rgba(34, 197, 94, 0.3);
    }
    .status-badge.fail {
      background: rgba(239, 68, 68, 0.15);
      color: var(--red);
      border: 1px solid rgba(239, 68, 68, 0.3);
    }
    .steps-container {
      padding: 1rem 1.25rem;
      border-top: 1px solid var(--border);
      background: rgba(0, 0, 0, 0.4);
      font-size: 0.875rem;
    }
    .step-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.45rem 0;
      border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
    }
    .step-row:last-child { border-bottom: none; }
    .step-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .step-icon {
      font-size: 0.9rem;
      font-weight: bold;
    }
    .step-icon.pass { color: var(--green); }
    .step-icon.fail { color: var(--red); }
    .step-time {
      color: var(--text-muted);
      font-size: 0.75rem;
      font-family: monospace;
    }
    .error-box {
      margin-top: 0.75rem;
      padding: 0.75rem;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
      font-family: monospace;
      font-size: 0.8rem;
    }
    footer {
      text-align: center;
      margin-top: 3rem;
      font-size: 0.825rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border);
      padding-top: 1.5rem;
    }

    @media print {
      body { background: #fff; color: #000; padding: 0; }
      .btn-action, .search-input, .filters { display: none !important; }
      .suite-card { border-color: #ccc; break-inside: avoid; }
      .scenario-item { border-color: #ddd; }
      .steps-container { display: block !important; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="brand">
        <div class="badge-icon">🛡️</div>
        <div class="title">
          <h1>Guardian Quality & Validation Report</h1>
          <p>Validação Integral das 4 Jornadas (Gestor, Motorista, Monitor, Pai) + Testes de Regressão & Segurança</p>
        </div>
      </div>
      <div class="header-actions">
        <button class="btn-action" onclick="toggleAllSteps(true)">📂 Expandir Todos</button>
        <button class="btn-action" onclick="toggleAllSteps(false)">📁 Recolher Todos</button>
        <button class="btn-action" onclick="window.print()">🖨️ Imprimir / PDF</button>
        <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">${generatedAt}</span>
      </div>
    </header>

    <div class="progress-bar-wrap">
      <div class="progress-bar-fill" style="width: ${passRate}%;"></div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <span class="stat-label">Taxa de Sucesso</span>
        <span class="stat-value ${passRate === 100 ? 'green' : 'red'}">${passRate}%</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Cenários Testados</span>
        <span class="stat-value blue">${totalScenarios}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Passos Verificados</span>
        <span class="stat-value">${totalSteps}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Sucesso / Falhas</span>
        <span class="stat-value"><span style="color:var(--green)">${passedScenarios}</span> / <span style="color:var(--red)">${failedScenarios}</span></span>
      </div>
      <div class="stat-card">
        <span class="stat-label">Tempo Total</span>
        <span class="stat-value" style="font-size:1.4rem">${(totalDuration / 1000).toFixed(2)}s</span>
      </div>
    </div>

    <div class="controls-row">
      <input 
        type="text" 
        class="search-input" 
        id="scenario-search" 
        placeholder="🔍 Filtrar por código (ex: GST-01, MOT-03, REG) ou texto..." 
        oninput="searchScenarios(this.value)" 
      />

      <div class="filters">
        <button class="filter-btn active" onclick="filterCategory('ALL', this)">Todos (${totalScenarios})</button>
        <button class="filter-btn" onclick="filterCategory('GESTOR', this)">👔 Gestor</button>
        <button class="filter-btn" onclick="filterCategory('MOTORISTA', this)">🚐 Motorista</button>
        <button class="filter-btn" onclick="filterCategory('MONITOR', this)">📋 Monitor</button>
        <button class="filter-btn" onclick="filterCategory('PAI', this)">👨‍👩‍👧 Pai & Família</button>
        <button class="filter-btn" onclick="filterCategory('PLANEJAMENTO', this)">🗺️ Planejamento</button>
        <button class="filter-btn" onclick="filterCategory('REGRESSAO', this)">🔒 Regressão & Segurança</button>
        <button class="filter-btn" onclick="filterCategory('E2E', this)">⚡ Jornada E2E Ponta a Ponta</button>
      </div>
    </div>

    <div id="suites-container">
      ${this.suites.map(suite => `
        <div class="suite-card" data-category="${suite.category}">
          <div class="suite-header">
            <div class="suite-title-area">
              <span class="cat-badge">${suite.category}</span>
              <h2 class="suite-title">${suite.suiteName}</h2>
            </div>
            <div>
              <span class="status-badge ${suite.status.toLowerCase()}">${suite.status === 'PASS' ? '✔ APROVADA' : '✖ FALHAS'}</span>
              <span style="font-size: 0.8rem; color: var(--text-muted); margin-left: 0.5rem;">${suite.durationMs}ms</span>
            </div>
          </div>
          <div class="scenarios-list">
            ${suite.scenarios.map(sc => `
              <div class="scenario-item" data-category="${sc.category}" data-search="${(sc.id + ' ' + sc.title).toLowerCase()}">
                <div class="scenario-header" onclick="toggleSteps('${sc.id}')">
                  <div style="display:flex; align-items:center; gap:0.6rem;">
                    <strong style="color:var(--primary); font-family:monospace;">${sc.id}</strong>
                    <span>${sc.title}</span>
                  </div>
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span style="font-size:0.75rem; color:var(--text-muted);">${sc.steps.length} passos</span>
                    <span class="status-badge ${sc.status.toLowerCase()}">${sc.status}</span>
                  </div>
                </div>
                <div class="steps-container" id="steps-${sc.id}">
                  ${sc.steps.map(st => `
                    <div class="step-row">
                      <div class="step-left">
                        <span class="step-icon ${st.status.toLowerCase()}">${st.status === 'PASS' ? '✔' : '✖'}</span>
                        <span>${st.title}</span>
                      </div>
                      <span class="step-time">${st.durationMs}ms</span>
                    </div>
                    ${st.error ? `<div class="error-box">Erro: ${st.error}</div>` : ''}
                  `).join('')}
                  ${sc.error ? `<div class="error-box">Falha no Cenário: ${sc.error}</div>` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

    <footer>
      Guardian Intelligence Platform — Validação Determinística & Suite de Regressão Contínua
    </footer>
  </div>

  <script>
    let currentCategory = 'ALL';

    function toggleSteps(id) {
      const el = document.getElementById('steps-' + id);
      if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
      }
    }

    function toggleAllSteps(expand) {
      document.querySelectorAll('.steps-container').forEach(el => {
        el.style.display = expand ? 'block' : 'none';
      });
    }

    function filterCategory(cat, btn) {
      currentCategory = cat;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');

      applyFilters();
    }

    function searchScenarios(query) {
      applyFilters();
    }

    function applyFilters() {
      const query = (document.getElementById('scenario-search')?.value || '').toLowerCase().trim();

      document.querySelectorAll('.suite-card').forEach(card => {
        const cat = card.getAttribute('data-category');
        const matchCategory = (currentCategory === 'ALL' || cat === currentCategory);

        let visibleScenarios = 0;
        const scenarios = card.querySelectorAll('.scenario-item');
        scenarios.forEach(sc => {
          const searchContent = sc.getAttribute('data-search') || '';
          const matchSearch = query === '' || searchContent.includes(query);

          if (matchSearch) {
            sc.style.display = 'block';
            visibleScenarios++;
          } else {
            sc.style.display = 'none';
          }
        });

        if (matchCategory && visibleScenarios > 0) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, html, 'utf-8');
    return outputPath;
  }
}

export function expect(actual: any) {
  const matchers = (isNot: boolean) => ({
    toBe(expected: any, msg?: string) {
      const pass = actual === expected;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava NÃO ser [${expected}]` : `Esperava [${expected}], mas obteve [${actual}]`));
      }
    },
    toEqual(expected: any, msg?: string) {
      const a = JSON.stringify(actual);
      const b = JSON.stringify(expected);
      const pass = a === b;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava NÃO ser igual a ${b}` : `Objetos não são iguais. Esperava ${b}, obteve ${a}`));
      }
    },
    toBeGreaterThan(expected: number, msg?: string) {
      const pass = typeof actual === 'number' && actual > expected;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que ${actual} NÃO fosse maior que ${expected}` : `Esperava que ${actual} fosse maior que ${expected}`));
      }
    },
    toBeGreaterThanOrEqual(expected: number, msg?: string) {
      const pass = typeof actual === 'number' && actual >= expected;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que ${actual} NÃO fosse maior ou igual a ${expected}` : `Esperava que ${actual} fosse maior ou igual a ${expected}`));
      }
    },
    toBeLessThan(expected: number, msg?: string) {
      const pass = typeof actual === 'number' && actual < expected;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que ${actual} NÃO fosse menor que ${expected}` : `Esperava que ${actual} fosse menor que ${expected}`));
      }
    },
    toBeLessThanOrEqual(expected: number, msg?: string) {
      const pass = typeof actual === 'number' && actual <= expected;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que ${actual} NÃO fosse menor ou igual a ${expected}` : `Esperava que ${actual} fosse menor ou igual a ${expected}`));
      }
    },
    toContain(expected: any, msg?: string) {
      const pass = actual && typeof actual.includes === 'function' && actual.includes(expected);
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que NÃO contivesse [${expected}]` : `Esperava que contivesse [${expected}]`));
      }
    },
    toBeTruthy(msg?: string) {
      const pass = !!actual;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava valor falsy, mas obteve [${actual}]` : `Esperava valor truthy, mas obteve [${actual}]`));
      }
    },
    toBeDefined(msg?: string) {
      const pass = actual !== undefined && actual !== null;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que o valor NÃO estivesse definido` : `Esperava que o valor estivesse definido, mas obteve [${actual}]`));
      }
    },
    toBeUndefined(msg?: string) {
      const pass = actual === undefined || actual === null;
      if (isNot ? pass : !pass) {
        throw new Error(msg || (isNot ? `Esperava que o valor estivesse definido` : `Esperava que o valor fosse undefined, mas obteve [${actual}]`));
      }
    }
  });

  return {
    ...matchers(false),
    not: matchers(true)
  };
}

export const runner = new TestRunner();
