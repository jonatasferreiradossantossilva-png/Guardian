import { test, expect } from '@playwright/test';

test.describe('Otimização de Itinerários Inteligentes (E2E)', () => {

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
                return route.fulfill({ status: 200, body: '' });
            }
            return route.continue();
        });

        // Setup direto via URL para bypass de login
        await page.goto('/dashboard/management/routes?mockUserId=user-admin-1&isTesting=true');
        await page.waitForLoadState('networkidle');
        
        // Esconde prompts de sistema
        await page.evaluate(() => {
            localStorage.setItem('hide-ios-prompt', 'true');
        });
    });

    test('Fluxo de Otimização de Ordem de Alunos', async ({ page }) => {
        const uniqueRouteName = `Rota E2E ${Date.now()}`;
        console.log(`--- TESTANDO ENGINE DE OTIMIZAÇÃO: ${uniqueRouteName} ---`);

        // 1. Abrir Modal de Adicionar Rota (Aguardamos a hidratação completa - NEXT JS DEV MODE COMPILATION)
        const addRouteBtn = page.locator('#add-route-btn');
        await addRouteBtn.waitFor({ state: 'attached', timeout: 180000 });
        
        // Clique via JS direto para segurança total (ignora overlays de hidratação)
        await page.evaluate(() => {
            const btn = document.getElementById('add-route-btn');
            if (btn) btn.click();
        });
        
        // 2. Preencher dados básicos
        await page.getByPlaceholder('Nome da Rota').fill(uniqueRouteName);
        
        // Seleciona Turno Tarde (Onde temos alunos livres por padrão)
        await page.getByRole('combobox').first().click();
        await page.getByRole('option', { name: 'Tarde' }).click();

        // Seleciona Motorista (obrigatório para salvar)
        await page.getByRole('combobox').nth(1).click();
        await page.getByRole('option').first().click();

        // 3. Selecionar Escola (Gatilho para Alunos aparecerem)
        // A escola é um checkbox com label. Usamos getByLabel para garantir que o checkbox marca.
        await page.getByLabel('Escola Primária do Saber').check({ force: true });
        
        // Aguardar os alunos disponíveis serem computados pelo React
        await page.waitForTimeout(1000);

        // 4. Adicionar Alunos Disponíveis (Inclusão em Massa)
        // O botão só aparece se availableStudents.length > 0
        const massAddBtn = page.locator('button').filter({ hasText: /Inclusão em Massa/i });
        await expect(massAddBtn).toBeVisible({ timeout: 20000 });
        await massAddBtn.click();

        // 5. Acionar Otimização de Itinerário (Sparkles)
        const optimizeBtn = page.getByRole('button', { name: /OTIMIZAR ROTA/i });
        await expect(optimizeBtn).toBeEnabled();
        await optimizeBtn.click();

        // 6. Verificar sucesso (o botão fica desabilitado após otimizar)
        await expect(optimizeBtn).toBeDisabled({ timeout: 25000 });
        console.log('--- OTIMIZAÇÃO CONCLUÍDA COM SUCESSO ---');

        // 7. Salvar e confirmar se a rota aparece na lista
        await page.getByRole('button', { name: /SALVAR ROTA DEFINITIVA/i }).click();
        
        await expect(page.locator('body')).toContainText('Rota adicionada!', { timeout: 15000 });
        await expect(page.locator('body')).toContainText(uniqueRouteName, { timeout: 15000 });
    });
});
