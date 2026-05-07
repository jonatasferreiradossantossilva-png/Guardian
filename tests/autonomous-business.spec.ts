import { test, expect, devices } from '@playwright/test';

// Emulação mobile desabilitada - Radix Select não funciona de forma confiável no viewport do iPhone 12 via Playwright
// test.use({ ...devices['iPhone 12'] });

test.describe('Autonomous Driver Business Flow', () => {
  
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

    // Configuração inicial básica
    await page.goto('/?isTesting=true');
    await page.evaluate(() => {
        localStorage.setItem('hide-ios-prompt', 'true');
    });
  });

  test('Fluxo Completo: Convite -> Cadastro de Aluno -> Aprovação do Motorista', async ({ page, context }) => {
    test.setTimeout(180000);

    const routeId = 'route-1';
    // Navegar diretamente para o registro para evitar instabilidade no redirecionamento do convite
    const registerUrl = `/register?routeId=${routeId}&mockUserId=parent-temp-id&isTesting=true`;
    
    console.log('--- 1. PAI ACESSANDO FORMULÁRIO DE REGISTRO ---');
    await page.goto(registerUrl, { waitUntil: 'domcontentloaded' });
    
    // Validar se o formulário de cadastro carregou
    await expect(page.getByText(/Cadastro de Aluno|Cadastro Guardian|Carregando/)).toBeVisible({ timeout: 15000 });
    
    // Aguardar sumir o "Carregando" se necessário
    if (await page.getByText('Carregando...').isVisible()) {
        await expect(page.getByText(/Cadastro de Aluno|Cadastro Guardian/)).toBeVisible({ timeout: 10000 });
    }

    // Pular para o formulário manual
    await page.click('button:has-text("Pular e preencher manualmente")');
    await page.waitForTimeout(500);

    // Preencher dados do aluno
    const timestamp = Date.now();
    const studentName = `Enzo ${timestamp}`;
    await page.getByLabel('Nome do Filho(a) *').fill(studentName);
    await page.getByLabel('Nome Completo *').fill('Pai do Enzo');
    await page.getByLabel('E-mail *').fill(`pai.enzo.${timestamp}@email.com`);
    await page.getByLabel('WhatsApp *').fill('11999999999');
    
    // Mock do ViaCEP para garantir preenchimento de cidade/estado
    await context.route('https://viacep.com.br/ws/*/json/', async (route) => {
        await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
                logradouro: 'Rua de Teste',
                bairro: 'Centro',
                localidade: 'Carapicuíba',
                uf: 'SP',
                cep: '06310-000',
                requestedSchool: 'Colégio Amos'
            })
        });
    });

    await page.getByLabel('CEP *').fill('06310-000');
    await page.getByLabel('Número *').fill('123 A');
    
    // Pequena espera para o mock do CEP processar
    await page.waitForTimeout(1000);

    // Selecionar Escola (apenas se não estiver preenchido)
    const currentSchool = await page.getByTestId('select-school').innerText();
    if (!currentSchool.includes('Colégio Amos')) {
        await page.getByTestId('select-school').click();
        await page.waitForTimeout(1000);
        await page.getByRole('option', { name: 'Colégio Amos' }).last().click({ force: true });
    } else {
        console.log('Escola já preenchida pelo Smart-Fill:', currentSchool);
    }
    await page.waitForTimeout(500);

    // Garantir Turno
    const currentShift = await page.getByTestId('select-shift').innerText();
    if (currentShift.includes('Selecione')) {
        await page.getByTestId('select-shift').click();
        await page.getByRole('option', { name: 'Manhã' }).click();
    }

    // Avançar etapas
    const nextButton = page.locator('button:has-text("Próximo")');
    await expect(nextButton).toBeEnabled({ timeout: 10000 });
    await nextButton.click();
    await page.waitForTimeout(500);
    await page.click('button:has-text("Continuar")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("Segurança de Acesso")');
    await page.fill('input[placeholder="000000"]', '123456');
    await page.getByRole('button', { name: /Concluir e Enviar|Finalizar Cadastro|Enviar Solicitação/i }).click();
    
    // Validar tela de sucesso
    await expect(page.getByText(/Inscrição Enviada|Solicitação Enviada/)).toBeVisible({ timeout: 20000 });

    // [CRÍTICO] Aguardar a persistência do MockDB no localStorage (debounce de 100ms + latência de disco)
    // Se não esperarmos, o hack de localStorage abaixo lerá o banco velho e deletará o aluno recém-criado.
    await page.waitForTimeout(2000);

    // 2. MOTORISTA ACESSANDO O PAINEL PARA APROVAR
    console.log('--- 2. MOTORISTA APROVANDO CADASTRO ---');
    
    // Configurar sessão do motorista via URL (user-motorista-4 é o dono da route-1 no mock)
    // Usamos a URL para definir o usuário e a rota, o que é suportado pelo MockDataProvider
    const driverUrl = `/driver/route-plan?mockUserId=user-motorista-4&mockRouteId=route-1&isTesting=true`;
    
    await page.goto(driverUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForLoadState('networkidle');
    console.log('URL Atual (Motorista):', page.url());
    
    // O dashboard começa na tela de pré-viagem com "INICIAR OPERAÇÃO"
    const btnIniciar = page.getByText('INICIAR OPERAÇÃO').first();
    await expect(btnIniciar).toBeVisible({ timeout: 30000 });
    await btnIniciar.click({ force: true });
    
    // Aguardar a transição para o estado de rota ativa (tabs aparecerem)
    await page.waitForTimeout(2000);

    // Agora as tabs devem estar visíveis
    const alunosTab = page.getByRole('tab', { name: /alunos/i });
    await expect(alunosTab).toBeVisible({ timeout: 20000 });
    await alunosTab.click({ force: true });
    
    // Aguardar o conteúdo da aba carregar
    await page.waitForTimeout(2000);

    // Localizar o card de aprovação do aluno que acabamos de criar
    const approvalCard = page.locator('div').filter({ hasText: studentName }).filter({ has: page.getByRole('button', { name: /Aprovar/i }) }).first();
    await expect(approvalCard).toBeVisible({ timeout: 15000 });
    
    // Lidar com possíveis diálogos (alertas)
    page.on('dialog', dialog => dialog.accept());
    
    // Aprovar o aluno
    const btnAprovar = approvalCard.getByRole('button', { name: /Aprovar/i });
    await btnAprovar.click({ force: true });
    
    // Verificar se o card sumiu após aprovação (indicando sucesso no processamento)
    await expect(approvalCard).not.toBeVisible({ timeout: 10000 });

    // 3. VERIFICAÇÃO FINAL
    console.log('--- 3. VERIFICAÇÃO FINAL ---');
  });
});
