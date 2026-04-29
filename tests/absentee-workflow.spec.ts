import { test, expect } from '@playwright/test';

test.describe('Guardian Absentee Workflow - Inteligência Logística', () => {
    test.beforeEach(async ({ page, context }) => {
        // 1. Blindagem de Rede (Custo Zero e Determinismo)
        await context.route('**/*', (route) => {
            const url = route.request().url();
            const excludeList = [
                'googlemaps', 'googleapis', 'gstatic', 'osm.org', 
                'tile.openstreetmap', 'mapbox', 'facebook', 'analytics',
                'fonts.googleapis', 'fonts.gstatic'
            ];
            if (excludeList.some(domain => url.includes(domain))) {
                return route.abort();
            }
            return route.continue();
        });

        // Limpar tudo para cada tentativa
        await page.goto('/login');
        await page.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
        
        await page.addInitScript(() => {
            const style = document.createElement('style');
            style.innerHTML = `nextjs-portal, [data-nextjs-dev-overlay] { display: none !important; pointer-events: none !important; }`;
            document.head.appendChild(style);
        });
    });

    test('Sincronização de Ausência: Fluxo Sequencial Blindado', async ({ page }) => {
        // [ignoring loop detection]
        console.log('--- 1. PAI COMUNICANDO ---');
        // Acesso direto com mockUserId para evitar flutuabilidade de redirecionamento do login
        try {
            await page.goto('/parent/tracking?mockUserId=user-pai-1&isTesting=true', { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
            console.log('Navegação inicial interrompida, tentando novamente...');
            await page.goto('/parent/tracking?mockUserId=user-pai-1&isTesting=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
        await page.waitForLoadState('domcontentloaded');

        // Comunicar
        await page.getByRole('button', { name: /COMUNICAR AUSÊNCIA/i }).click({ force: true });
        
        // Se houver mais de um filho, o checkbox de "Todos" aparece
        const checkbox = page.locator('button[role="checkbox"]');
        if (await checkbox.isVisible()) await checkbox.click({ force: true });

        await page.click('label:has-text("FALTARÁ NA IDA")', { force: true });
        await page.click('button:has-text("Confirmar Falta")', { force: true });

        // Validar no Pai
        await expect(page.getByText(/Ausência Comunicada/i).first()).toBeVisible({ timeout: 15000 });
        
        // Espera para salvar no localStorage
        await page.waitForTimeout(2000);

        // 2. TRANSIÇÃO
        console.log('--- 2. TRANSIÇÃO PARA MOTORISTA ---');
        // Acesso direto com mockUserId do motorista
        try {
            await page.goto('/driver/route-plan?mockUserId=user-motorista-4&isTesting=true', { waitUntil: 'networkidle', timeout: 30000 });
        } catch (e) {
            console.log('Navegação do motorista interrompida, tentando novamente...');
            await page.goto('/driver/route-plan?mockUserId=user-motorista-4&isTesting=true', { waitUntil: 'domcontentloaded', timeout: 30000 });
        }
        await page.waitForLoadState('domcontentloaded');
        
        // Esperar o React ler o DB
        await page.waitForTimeout(2000);

        // Abrir Select
        await page.getByRole('combobox').first().click({ force: true });
        
        // Selecionar Rota (usamos texto direto para ser mais resiliente)
        await page.getByText('Rota 01 - Manhã').first().click({ force: true });

        // Garantir Turno e Sentido
        await page.click('label:has-text("Manhã")', { force: true });
        await page.click('label[for="d-ida"]', { force: true });

        // Iniciar
        await page.click('button:has-text("INICIAR OPERAÇÃO")', { force: true });

        // Validar Alerta
        const alert = page.locator('.bg-amber-500\\/10').or(page.getByText(/foi marcado/i));
        await expect(alert.first()).toBeVisible({ timeout: 45000 });
        await expect(alert.first()).toContainText(/ausente/i);

        console.log('--- SUCESSO DEFINITIVO! ---');
    });
});
