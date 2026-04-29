import { test, expect } from '@playwright/test';

test.describe('Onboarding de Gestor', () => {
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

    // Desabilitar o prompt de instalação iOS para não interferir nos testes
    await page.addInitScript(() => {
      window.localStorage.setItem('hide-ios-prompt', 'true');
      (window as any).IS_TESTING = true;
    });
  });

  test('Deve realizar o cadastro completo como Gestor de Frota e acessar o dashboard', async ({ page }) => {
    // 1. Acessar a página de Signup
    await page.goto('/signup');

    // 2. Escolher perfil "Gestor de Frota" (já vem por padrão, mas vamos garantir)
    await page.click('label[for="empresa"]');
    await page.click('button:has-text("Próximo Passo")');

    // 3. Preencher formulário de dados
    const timestamp = Date.now();
    const testName = `Gestor Teste ${timestamp}`;
    const testEmail = `gestor.${timestamp}@example.com`;
    const testCPF = '12345678901'; // Mock masks handle this
    const testPIN = '123456';

    await page.fill('input[placeholder="Seu nome"]', testName);
    await page.fill('input[placeholder="000.000.000-00"]', testCPF);
    await page.fill('input[placeholder="000000"]', testPIN);
    await page.fill('input[placeholder="email@exemplo.com"]', testEmail);
    await page.fill('input[placeholder="(00) 00000-0000"]', '11999999999');

    // 4. Submeter
    await page.click('button:has-text("Criar minha Conta")');

    // 5. Validar tela de sucesso
    await expect(page.locator('h2')).toContainText(`Pronto, Gestor!`);
    await expect(page.getByText('Sua conta foi criada com sucesso')).toBeVisible();

    // 6. Acessar Dashboard
    await page.getByText('Acessar Painel Agora').click({ force: true });
    
    // 7. Verificar se chegou no dashboard (redirect pode levar alguns segundos no Next.js)
    await page.waitForURL(/.*dashboard/, { timeout: 30000 });
    await expect(page.getByText('Monitoramento da Frota')).toBeVisible({ timeout: 15000 });
  });

  test('Deve realizar o cadastro como Autônomo e validar configuração automática', async ({ page }) => {
    await page.goto('/signup');

    // Escolher "Autônomo"
    await page.click('label[for="autonomo"]');
    await page.click('button:has-text("Próximo Passo")');

    const timestamp = Date.now();
    const formatedName = `Auto${timestamp}`;
    const testName = `Auto${timestamp} Silva`;
    
    await page.fill('input[placeholder="Seu nome"]', testName);
    await page.fill('input[placeholder="000.000.000-00"]', '98765432109');
    await page.fill('input[placeholder="000000"]', '654321');
    await page.fill('input[placeholder="email@exemplo.com"]', `auto.${timestamp}@example.com`);
    await page.fill('input[placeholder="(00) 00000-0000"]', '11888888888');

    await page.click('button:has-text("Criar minha Conta")');
    
    // 5. NOVA ETAPA: Ativação do Negócio
    await expect(page.getByText('Ativação do Negócio')).toBeVisible({ timeout: 15000 });
    
    // Verificar se o nome da empresa foi auto-preenchido
    const companyInput = page.locator('input#companyName');
    await expect(companyInput).toHaveValue(`Transportes ${formatedName}`, { timeout: 10000 });
    
    // Definir nome da rota
    await page.fill('input#routeName', 'Rota Colégio Amos - Manhã');
    
    // Concluir
    await page.click('button:has-text("Concluir e Começar")');

    // 6. Validar sucesso específico para autônomo
    await expect(page.locator('h2')).toContainText(`Pronto, ${formatedName}!`);
  });
});
