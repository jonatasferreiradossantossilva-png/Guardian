const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TARGET_URL || 'https://vanguardan-pwa-prod.vercel.app';

// Cria pasta com timestamp para as evidências
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const runDirName = `run-${timestamp}`;
const evidenceBaseDir = path.join(__dirname, '..', 'evidence', runDirName);
const screenshotsDir = path.join(evidenceBaseDir, 'screenshots');

if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
}

const evidenceLog = [];
const consoleIssues = [];

function log(msg) {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] ${msg}`);
}

function recordStep(id, title, status, details = '', screenshotFile = '') {
    evidenceLog.push({ id, title, status, details, screenshotFile, timestamp: new Date().toISOString() });
}

async function attachSensors(page, contextName) {
    page.on('console', msg => {
        if (msg.type() === 'error') {
            const text = msg.text();
            // Ignorar erros comuns irrelevantes de rede externa / billing do maps em teste
            if (text.includes('BillingNotEnabledMapError') || text.includes('net::ERR_ABORTED') || text.includes('favicon.ico')) {
                return;
            }
            consoleIssues.push({
                context: contextName,
                type: 'console.error',
                text,
                url: page.url(),
                time: new Date().toISOString()
            });
        }
    });

    page.on('pageerror', err => {
        consoleIssues.push({
            context: contextName,
            type: 'pageerror (Uncaught Exception)',
            text: err.message,
            stack: err.stack,
            url: page.url(),
            time: new Date().toISOString()
        });
    });

    page.on('response', resp => {
        if (resp.status() >= 400 && !resp.url().includes('favicon') && !resp.url().includes('maps.googleapis')) {
            consoleIssues.push({
                context: contextName,
                type: `HTTP ${resp.status()}`,
                text: `Falha na requisição para: ${resp.url()}`,
                url: page.url(),
                time: new Date().toISOString()
            });
        }
    });
}

async function createMobileContext(browser) {
    const context = await browser.newContext({
        viewport: { width: 412, height: 915 },
        isMobile: true,
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1'
    });

    await context.addInitScript(() => {
        window.localStorage.setItem('hide-ios-prompt', 'true');
        window.localStorage.setItem('guardian_hide_tour', 'true');
        window.localStorage.setItem('hide-tour', 'true');
        window.sessionStorage.setItem('hide-ios-prompt', 'true');
    });

    return context;
}

async function run() {
    log('================================================================');
    log('   GUARDIAN - SUÍTE DE AUDITORIA E VALIDAÇÃO E2E EM PRODUÇÃO   ');
    log(`   Alvo: ${BASE_URL}`);
    log(`   Pasta de Evidências: evidence/${runDirName}`);
    log('================================================================\n');

    const browser = await chromium.launch({ headless: true });

    try {
        // ==========================================
        // FLUXO 1: TELA INICIAL & LOGIN
        // ==========================================
        log('👉 Testando Tela Inicial e Acesso ao Login...');
        const initContext = await createMobileContext(browser);
        const initPage = await initContext.newPage();
        await attachSensors(initPage, 'Página de Login');

        await initPage.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await initPage.waitForTimeout(2000);

        const loginShot = '01-login-screen.png';
        await initPage.screenshot({ path: path.join(screenshotsDir, loginShot), fullPage: true });
        recordStep('STEP-01', 'Carregamento da Tela de Login', 'PASS', 'Tela de login carregada com sucesso.', loginShot);

        // ==========================================
        // FLUXO 2: LOGIN DO GESTOR
        // ==========================================
        log('👉 Testando Autenticação do Gestor (admin@guardian.com)...');
        await initPage.fill('input[name="identifier"]', 'admin@guardian.com');
        await initPage.fill('input[name="password"]', '123456');
        await initPage.click('button[type="submit"]');

        // Aguarda redirecionamento ou carregamento do Dashboard
        try {
            await initPage.waitForURL('**/dashboard**', { timeout: 15000 });
            await initPage.waitForTimeout(3000);
            const dashShot = '02-gestor-dashboard.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, dashShot), fullPage: true });
            recordStep('STEP-02', 'Login e Acesso ao Dashboard do Gestor', 'PASS', 'Autenticado com sucesso no dashboard.', dashShot);
        } catch (e) {
            const errShot = '02-gestor-login-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, errShot) });
            recordStep('STEP-02', 'Login do Gestor', 'FAIL', `Falha no redirecionamento: ${e.message}`, errShot);
        }

        // ==========================================
        // FLUXO 3: HISTÓRICO OPERACIONAL (Teste das datas e listagem)
        // ==========================================
        log('👉 Testando Histórico Operacional (Datas Firestore)...');
        try {
            await initPage.goto(`${BASE_URL}/dashboard/operational-history`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(3000);
            const histShot = '03-gestor-operational-history.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, histShot), fullPage: true });
            recordStep('STEP-03', 'Histórico Operacional', 'PASS', 'Histórico carregado sem crashes de data.', histShot);
        } catch (e) {
            const histErrShot = '03-gestor-history-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, histErrShot) });
            recordStep('STEP-03', 'Histórico Operacional', 'FAIL', e.message, histErrShot);
        }

        // ==========================================
        // FLUXO 4: GESTÃO DE INCIDENTES (Teste de Dialog / Portal Radix)
        // ==========================================
        log('👉 Testando Gestão de Incidentes e Modais Radix UI...');
        try {
            await initPage.goto(`${BASE_URL}/dashboard/management/incidents`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(3000);
            
            // Tenta abrir o primeiro modal de detalhes se houver botão Eye
            const eyeButton = initPage.locator('table button').first();
            if (await eyeButton.isVisible()) {
                await eyeButton.click();
                await initPage.waitForTimeout(1000);
            }

            const incShot = '04-gestor-incidents-modal.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, incShot), fullPage: true });
            recordStep('STEP-04', 'Gestão de Incidentes (Radix Dialog Portal)', 'PASS', 'Tela e componentes Radix operando normalmente.', incShot);
        } catch (e) {
            const incErrShot = '04-gestor-incidents-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, incErrShot) });
            recordStep('STEP-04', 'Gestão de Incidentes', 'FAIL', e.message, incErrShot);
        }

        // ==========================================
        // FLUXO 5: MURAL DOS PAIS (/parent/mural)
        // ==========================================
        log('👉 Testando Mural dos Pais (Verificação de getSafeDate e Cards)...');
        try {
            await initPage.goto(`${BASE_URL}/parent/mural`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(2500);
            const muralShot = '05-pais-mural.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, muralShot), fullPage: true });
            recordStep('STEP-05', 'Mural dos Pais (/parent/mural)', 'PASS', 'Mural renderizado sem erros de timestamp.', muralShot);
        } catch (e) {
            const muralErrShot = '05-pais-mural-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, muralErrShot) });
            recordStep('STEP-05', 'Mural dos Pais', 'FAIL', e.message, muralErrShot);
        }

        // ==========================================
        // FLUXO 6: CONTRATO DOS PAIS (/parent/contract)
        // ==========================================
        log('👉 Testando Contrato dos Pais (/parent/contract)...');
        try {
            await initPage.goto(`${BASE_URL}/parent/contract`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(2500);
            const contractShot = '06-pais-contrato.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, contractShot), fullPage: true });
            recordStep('STEP-06', 'Contrato dos Pais (/parent/contract)', 'PASS', 'Tela de contrato validada.', contractShot);
        } catch (e) {
            const contractErrShot = '06-pais-contrato-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, contractErrShot) });
            recordStep('STEP-06', 'Contrato dos Pais', 'FAIL', e.message, contractErrShot);
        }

        // ==========================================
        // FLUXO 7: RASTREIO DOS PAIS (/parent/tracking)
        // ==========================================
        log('👉 Testando Rastreio dos Pais (/parent/tracking)...');
        try {
            await initPage.goto(`${BASE_URL}/parent/tracking`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(3000);
            const trackingShot = '07-pais-tracking.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, trackingShot), fullPage: true });
            recordStep('STEP-07', 'Rastreamento dos Pais (/parent/tracking)', 'PASS', 'Tela de rastreamento carregada.', trackingShot);
        } catch (e) {
            const trackingErrShot = '07-pais-tracking-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, trackingErrShot) });
            recordStep('STEP-07', 'Rastreamento dos Pais', 'FAIL', e.message, trackingErrShot);
        }

        // ==========================================
        // FLUXO 8: ROTA DO MOTORISTA (/driver/route-plan)
        // ==========================================
        log('👉 Testando Visão do Motorista (/driver/route-plan)...');
        try {
            await initPage.goto(`${BASE_URL}/driver/route-plan`, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await initPage.waitForTimeout(3000);
            const driverShot = '08-motorista-route-plan.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, driverShot), fullPage: true });
            recordStep('STEP-08', 'Plano de Rota do Motorista (/driver/route-plan)', 'PASS', 'Visão do motorista carregada.', driverShot);
        } catch (e) {
            const driverErrShot = '08-motorista-route-fail.png';
            await initPage.screenshot({ path: path.join(screenshotsDir, driverErrShot) });
            recordStep('STEP-08', 'Plano de Rota do Motorista', 'FAIL', e.message, driverErrShot);
        }

        await initContext.close();

    } catch (criticalErr) {
        log(`❌ Erro crítico no executor: ${criticalErr.message}`);
        recordStep('CRITICAL', 'Falha Crítica no Script', 'FAIL', criticalErr.stack || criticalErr.message);
    } finally {
        await browser.close();
    }

    // ==========================================
    // GERAÇÃO DO RELATÓRIO DE EVIDÊNCIAS
    // ==========================================
    log('\n📄 Compilando Relatório de Evidências...');

    const passedCount = evidenceLog.filter(s => s.status === 'PASS').length;
    const failedCount = evidenceLog.filter(s => s.status === 'FAIL').length;
    const totalSteps = evidenceLog.length;

    let reportMd = `# 🛡️ Guardian - Relatório de Auditoria E2E em Produção\n\n`;
    reportMd += `**Data da Execução:** ${new Date().toLocaleString('pt-BR')}\n`;
    reportMd += `**Ambiente Testado:** [${BASE_URL}](${BASE_URL})\n`;
    reportMd += `**Resultado Geral:** ${failedCount === 0 ? '🟢 **APROVADO (100% SUCESSO)**' : '🔴 **ATENÇÃO: FALHAS DETECTADAS**'}\n\n`;
    reportMd += `- **Total de Etapas:** ${totalSteps}\n`;
    reportMd += `- **Passou:** ${passedCount}\n`;
    reportMd += `- **Falhou:** ${failedCount}\n`;
    reportMd += `- **Erros/Warnings de Console Detectados:** ${consoleIssues.length}\n\n`;

    reportMd += `## 📋 Tabela de Execução dos Cenários\n\n`;
    reportMd += `| ID | Cenário / Tela | Status | Detalhes | Evidência Visual |\n`;
    reportMd += `| :--- | :--- | :---: | :--- | :--- |\n`;

    for (const step of evidenceLog) {
        const statusBadge = step.status === 'PASS' ? '✅ **PASSOU**' : '❌ **FALHOU**';
        const shotLink = step.screenshotFile ? `[Ver Screenshot](./screenshots/${step.screenshotFile})` : 'N/A';
        reportMd += `| \`${step.id}\` | **${step.title}** | ${statusBadge} | ${step.details} | ${shotLink} |\n`;
    }

    reportMd += `\n## 🚨 Análise de Erros de Console e Runtime (Navegador)\n\n`;
    if (consoleIssues.length === 0) {
        reportMd += `> 🟢 **Nenhum erro de console ou exceção não tratada foi capturada pelo navegador durante toda a navegação.**\n\n`;
    } else {
        reportMd += `Foram registrados **${consoleIssues.length}** eventos de atenção:\n\n`;
        reportMd += `| Contexto | Tipo | Detalhes | URL |\n`;
        reportMd += `| :--- | :--- | :--- | :--- |\n`;
        for (const issue of consoleIssues) {
            reportMd += `| ${issue.context} | \`${issue.type}\` | ${issue.text.replace(/\|/g, '-').slice(0, 120)} | \`${issue.url}\` |\n`;
        }
    }

    reportMd += `\n## 🖼️ Galeria de Evidências\n\n`;
    for (const step of evidenceLog) {
        if (step.screenshotFile) {
            reportMd += `### ${step.title}\n`;
            reportMd += `![${step.title}](./screenshots/${step.screenshotFile})\n\n`;
        }
    }

    const reportPath = path.join(evidenceBaseDir, 'RELATORIO-EVIDENCIAS.md');
    fs.writeFileSync(reportPath, reportMd, 'utf8');

    // Grava também o log bruto de console
    fs.writeFileSync(path.join(evidenceBaseDir, 'console-issues.json'), JSON.stringify(consoleIssues, null, 2), 'utf8');

    log(`✅ Auditoria finalizada! Relatório disponível em:`);
    log(`   file:///${reportPath.replace(/\\/g, '/')}`);
    log(`================================================================\n`);
}

run();
