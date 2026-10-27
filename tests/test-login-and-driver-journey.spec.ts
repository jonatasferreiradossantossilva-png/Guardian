import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test('Jornada do Motorista: Login -> Iniciar Operação -> Finalizar Operação -> Central de Operações', async ({ page }) => {
    const consoleLogs: string[] = [];
    const pageErrors: string[] = [];

    page.on('console', msg => {
        const text = msg.text();
        consoleLogs.push(`[${msg.type()}] ${text}`);
        if (msg.type() === 'error') {
            console.error(`[Console Error]: ${text}`);
        }
    });

    page.on('pageerror', err => {
        pageErrors.push(err.message);
        console.error(`[Page Error]: ${err.message}`);
    });

    await page.addInitScript(() => {
        localStorage.setItem('hide-ios-prompt', 'true');
        sessionStorage.setItem('hide-ios-prompt', 'true');
    });

    console.log('--- 1. ACESSANDO /login ---');
    await page.goto('/login');
    await expect(page.locator('input[name="identifier"]')).toBeVisible({ timeout: 15000 });

    console.log('--- 2. PREENCHENDO CREDENCIAIS DO MOTORISTA ---');
    // Se o radio de perfil estiver visível, selecionar Motorista
    const motoristaRadio = page.getByLabel(/Motorista/i);
    if (await motoristaRadio.isVisible()) {
        await motoristaRadio.click();
    }
    await page.fill('input[name="identifier"]', 'juliano.castro@rotasegura.com');
    await page.fill('input[name="password"]', '111111');
    await page.click('button[type="submit"]');

    console.log('--- 3. AGUARDANDO REDIRECIONAMENTO PARA /driver/route-plan ---');
    await expect(page).toHaveURL(/\/driver\/route-plan/, { timeout: 20000 });
    await expect(page.getByText(/Central de Operações/i)).toBeVisible({ timeout: 15000 });

    console.log('--- 4. CLICANDO EM INICIAR OPERAÇÃO ---');
    const startBtn = page.getByRole('button', { name: /INICIAR OPERAÇÃO/i });
    await expect(startBtn).toBeVisible({ timeout: 10000 });
    await startBtn.click();

    console.log('--- 5. AGUARDANDO TELA DE VIAGEM ATIVA (/driver/active) ---');
    await expect(page).toHaveURL(/\/driver\/active/, { timeout: 20000 });

    console.log('--- 6. VERIFICANDO BOTÃO DE FINALIZAR OPERAÇÃO ---');
    // Pode ser o botão no cabeçalho ou o botão de encerramento antecipado
    const endEarlyBtn = page.getByRole('button', { name: /Finalizar Operação Agora/i });
    const endHeaderBtn = page.locator('button[title="Reiniciar/Encerrar Rota"]');

    if (await endEarlyBtn.isVisible()) {
        await endEarlyBtn.click();
    } else if (await endHeaderBtn.isVisible()) {
        await endHeaderBtn.click();
    } else {
        // Tentar encontrar qualquer botão de finalizar
        await page.click('text=Finalizar Operação Agora');
    }

    console.log('--- 7. VERIFICANDO DESTINO APÓS FINALIZAR OPERAÇÃO ---');
    // Aguardar 2 segundos para navegação assíncrona
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log('URL atual após finalizar operação:', currentUrl);

    // CRITÉRIOS DE SUCESSO:
    // 1. NÃO pode estar em /login
    expect(currentUrl).not.toContain('/login');
    // 2. DEVE estar em /driver/route-plan
    expect(currentUrl).toContain('/driver/route-plan');
    // 3. Central de Operações ou Iniciar Operação deve estar visível
    await expect(page.getByText(/Central de Operações|INICIAR OPERAÇÃO/i).first()).toBeVisible({ timeout: 10000 });

    console.log('--- TESTE CONCLUÍDO COM SUCESSO ---');
});
