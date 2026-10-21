import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Financial Dashboards Health Check', () => {
  
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

    await page.addInitScript(() => {
      localStorage.setItem('hide-ios-prompt', 'true');
      (window as any).IS_TESTING = true;
    });
  });

    test('Saúde do Financeiro: Visão do Pai', async ({ page }) => {
    console.log('--- TESTANDO FINANCEIRO DO PAI ---');
    const urlPai = '/parent/financial?mockUserId=user-pai-1&isTesting=true';
    
    try {
        await page.goto(urlPai, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
        console.log('Timeout na navegação do pai, tentando com domcontentloaded...');
        await page.goto(urlPai, { waitUntil: 'domcontentloaded', timeout: 20000 });
    }

    await page.waitForLoadState('networkidle');
    console.log('URL Atual (Fin. Pai):', page.url());
    
    // Validar título da página
    await expect(page.getByRole('heading', { name: 'Financeiro' }).or(page.getByText('Histórico de Faturas')).first()).toBeVisible({ timeout: 15000 });
    
    // Verificar se a tabela/lista de faturas renderiza (SafeTable test)
    // Procuramos por "R$" que indica valores monetários na lista
    await expect(page.locator('body')).toContainText('R$', { timeout: 15000 });
    
    // Verificar se não há mensagem de erro crítica (fallback do SafeTable)
    await expect(page.getByText('Erro na linha')).not.toBeVisible();
  });

  test('Saúde do Financeiro: Visão do Gestor', async ({ page }) => {
    console.log('--- TESTANDO FINANCEIRO DO GESTOR ---');
    const urlGestor = '/dashboard/financial?mockUserId=user-admin-1&isTesting=true';
    
    try {
        await page.goto(urlGestor, { waitUntil: 'networkidle', timeout: 45000 });
    } catch (e) {
        console.log('Timeout na navegação do gestor, tentando com domcontentloaded...');
        await page.goto(urlGestor, { waitUntil: 'domcontentloaded', timeout: 20000 });
    }

    await page.waitForLoadState('networkidle');
    console.log('URL Atual (Fin. Gestor):', page.url());
    
    // Validar título da página
    await expect(page.getByRole('heading', { name: 'Financeiro' })).toBeVisible({ timeout: 15000 });
    
    // Verificar se as seções principais estão visíveis
    await expect(page.getByText('Filtros e Resumo de Receitas')).toBeVisible();
    await expect(page.getByText('Histórico de Faturas')).toBeVisible();
    
    // Verificar renderização de valores (SafeTable test)
    await expect(page.locator('body')).toContainText('R$', { timeout: 15000 });
    
    // Verificar se não há erros visíveis
    await expect(page.getByText('Erro ao carregar dados')).not.toBeVisible();
  });
});
