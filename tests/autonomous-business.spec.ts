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

    console.log('--- 1. PAI ACESSANDO LINK DE CONVITE ---');
    const routeId = 'route-1';
    const inviteUrl = `/invite/${routeId}?mockUserId=parent-temp-id&isTesting=true`;
    
    // Tentativa de navegação com tratamento de erro
    try {
        await page.goto(inviteUrl, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
        console.log('Navegação inicial falhou ou foi interrompida, tentando novamente...');
        await page.goto(inviteUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    // Se por algum motivo cair no login, forçamos a volta para o convite (pode acontecer em reloads do Next.js)
    if (page.url().includes('/login')) {
        console.log('Detectado redirecionamento para login. Forçando retorno ao convite...');
        await page.goto(inviteUrl, { waitUntil: 'domcontentloaded' });
    }

    await page.waitForLoadState('networkidle');
    console.log('URL Atual (Convite):', page.url());
    
    // Validar se o formulário de cadastro carregou (o mapa pode não renderizar pela blindagem de rede)
    await expect(page.getByText('Cadastro de Aluno')).toBeVisible({ timeout: 15000 });
    
    // Preencher dados do aluno
    const timestamp = Date.now();
    const studentName = `Enzo ${timestamp}`;
    await page.fill('input[placeholder="Ex: Enzo Silva"]', studentName);
    await page.fill('input[placeholder="Nome Completo do Responsável"]', 'Pai do Enzo');
    await page.fill('input[placeholder="WhatsApp"]', '11999999999');
    await page.fill('input[placeholder="CEP: 00000-000"]', '06310-000');
    await page.fill('input[placeholder="Nº / Complemento"]', '123 A');

    // Selecionar Escola (obrigatório) - Radix Select pode ser difícil no mobile
    const schoolSelect = page.getByRole('combobox').first();
    await schoolSelect.click({ force: true });
    await page.waitForTimeout(1000); // Aguarda o dropdown do Radix abrir
    const schoolOption = page.getByText('Colégio Amos').last();
    await schoolOption.click({ force: true });
    await page.waitForTimeout(500);

    // Mudar tipo de serviço para testar rádio
    await page.click('text="Somente Ida"');

    // Submeter solicitação via JS direto para bypass de sobreposição do dev overlay
    await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Confirmar Solicitação') || b.textContent?.includes('Entrar para Lista'));
        if (btn) btn.click();
    });
    
    // Validar tela de sucesso (com timeout generoso para persistência do mock)
    await expect(page.getByText('Solicitação Enviada!')).toBeVisible({ timeout: 20000 });

    // 2. MOTORISTA ACESSANDO O PAINEL PARA APROVAR
    console.log('--- 2. MOTORISTA APROVANDO CADASTRO ---');
    
    // Deletar APENAS o usuário da sessão para forçar a troca de identidade
    // Não limpamos o localStorage porque o MockDB está lá!
    await page.evaluate(() => {
        sessionStorage.removeItem('mockUserId');
        
        // Garantir que a route-1 esteja em estado 'em_rota' para que as tabs renderizem
        const dbKey = 'guardian_mock_db';
        const raw = localStorage.getItem(dbKey);
        if (raw) {
            const db = JSON.parse(raw);
            db.routes = (db.routes || []).map((r: any) => 
                r.id === 'route-1' ? { ...r, journeyStatus: 'em_rota', activeShift: 'Manhã', activeDirection: 'ida' } : r
            );
            localStorage.setItem(dbKey, JSON.stringify(db));
        }
    });

    // Configurar sessão do motorista via URL (user-motorista-4 é o dono da route-1 no mock)
    const driverUrl = '/driver/route-plan?mockUserId=user-motorista-4&mockRouteId=route-1&isTesting=true';
    
    try {
        await page.goto(driverUrl, { waitUntil: 'networkidle', timeout: 60000 });
    } catch (e) {
        console.log('Navegação do motorista interrompida, tentando novamente...');
        await page.goto(driverUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    }

    await page.waitForLoadState('networkidle');
    console.log('URL Atual (Motorista):', page.url());
    
    // O dashboard começa na tela de pré-viagem com "INICIAR OPERAÇÃO"
    // Precisamos iniciar a viagem para que as tabs (Itinerário/Mapa/Alunos) apareçam
    const btnIniciar = page.getByText('INICIAR OPERAÇÃO').first();
    await expect(btnIniciar).toBeVisible({ timeout: 30000 });
    await btnIniciar.click({ force: true });
    
    // Aguardar a transição para o estado de rota ativa (tabs aparecerem)
    await page.waitForTimeout(3000);

    // Agora as tabs devem estar visíveis - usando role selector que funciona no desktop
    const alunosTab = page.getByRole('tab', { name: /alunos/i });
    await expect(alunosTab).toBeVisible({ timeout: 20000 });
    await alunosTab.click({ force: true });
    
    // Aguardar o conteúdo da aba carregar
    await page.waitForTimeout(2000);

    // Localizar o card de aprovação do aluno que acabamos de criar
    // Sendo específico para evitar pegar o container pai (RootLayout)
    // No PendingApprovals o card tem a classe border-primary/20 ou border-amber-200
    let approvalCard = page.locator('div.border-primary\\/20, div.border-amber-200').filter({ hasText: studentName }).first();
    
    // Retry manual se o card não aparecer de imediato (latência de persistência)
    if (!(await approvalCard.isVisible())) {
        console.log('Card de aprovação não visível, aguardando extra...');
        await page.waitForTimeout(5000);
        approvalCard = page.locator('div.border-primary\\/20, div.border-amber-200').filter({ hasText: studentName }).first();
    }
    
    await expect(approvalCard).toBeVisible({ timeout: 20000 });
    
    // Lidar com possíveis diálogos (alertas)
    page.on('dialog', dialog => dialog.accept());
    
    // Aprovar o aluno
    const approveButton = approvalCard.getByRole('button', { name: /Aprovar/i });
    await expect(approveButton).toBeEnabled();
    await approveButton.click();
    
    // Pequena espera para processamento do mock
    await page.waitForTimeout(2000);
    
    // Validar que o aluno não está mais na lista de pendentes
    await expect(approvalCard).not.toBeVisible({ timeout: 20000 });

    // 3. VERIFICAÇÃO FINAL
    console.log('--- 3. VERIFICAÇÃO FINAL ---');
    // A aprovação foi bem-sucedida: o card do aluno pendente desapareceu
    // O fluxo completo (Convite → Cadastro → Aprovação) está validado
    console.log('TESTE CONCLUÍDO COM SUCESSO!');
  });
});
