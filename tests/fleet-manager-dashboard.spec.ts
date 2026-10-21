import { test, expect } from '@playwright/test';

test.describe('Dashboard do Gestor de Frota (Fleet Manager E2E)', () => {
    
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

    test('Validação de Solicitações Pendentes (Fast-Track)', async ({ page }) => {
        console.log('--- TESTANDO GESTÃO DE PENDÊNCIAS ---');
        
        // Pula o fluxo nativo de Login usando o URL Session Injector E2E
        await page.goto('/dashboard/management/pending-registrations?mockUserId=user-admin-1&isTesting=true', { waitUntil: 'domcontentloaded' });
        
        // Valida o carregamento da lista de requisições com SafeRow ativo e sem falha do App
        await expect(page.getByRole('heading', { name: /Novas Solicitações/i })).toBeVisible({ timeout: 20000 });
        
        // Garante que a tabela/card Mobile esteja visível e o SafeRow não mostre exceção grave ("Erro na linha")
        await expect(page.locator('body')).not.toContainText('Erro na linha');
        
        // Valida se o botão 'Revisar' aparece (mesmo que haja reticências no nome, o botão é garantido)
        await expect(page.locator('body')).toContainText('Revisar', { timeout: 20000 });
    });

    test('Validação de Micro-UX e Layout Base (Dashboard Overview)', async ({ page }) => {
        console.log('--- TESTANDO OVERVIEW DO GESTOR ---');
        
        await page.goto('/dashboard?mockUserId=user-admin-1&isTesting=true', { waitUntil: 'domcontentloaded' });

        // Confirma se o menu principal mobile ou grid carrega sem falhas z-index / undefined components
        await expect(page.locator('body')).toContainText(/Guardian/i, { timeout: 20000 });
        await expect(page.locator('body')).not.toContainText('Application error');
    });
});
