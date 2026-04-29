import { test, expect } from '@playwright/test';

test.describe('Guardian Full Lifecycle Matrix', () => {
    test.describe.configure({ mode: 'serial' });

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

        // Desabilitar o prompt de instalação iOS e ocultar Next.js dev overlay
        await page.addInitScript(() => {
            window.localStorage.setItem('hide-ios-prompt', 'true');
            (window as any).IS_TESTING = true;
            
            // Força a remoção de overlays do Next.js que bloqueiam cliques
            const style = document.createElement('style');
            style.innerHTML = `
                nextjs-portal, [data-nextjs-dev-overlay] { 
                    display: none !important; 
                    visibility: hidden !important; 
                    pointer-events: none !important; 
                }
            `;
            document.head.appendChild(style);
        });
    });

    const modalidades = [
        { name: 'Ida e Volta', value: '450', optionName: 'Ida e Volta (Completo)' },
        { name: 'Somente Ida', value: '250', optionName: 'Somente Ida (Casa > Escola)' },
        { name: 'Somente Volta', value: '250', optionName: 'Somente Volta (Escola > Casa)' }
    ];

    for (const mod of modalidades) {
        test(`Fluxo Completo: ${mod.name}`, async ({ page }) => {
            page.on('console', msg => console.log(`[BROWSER] ${msg.text()}`));
            test.setTimeout(240000);
            page.setDefaultNavigationTimeout(60000);
            const timestamp = Date.now();
            const gestorEmail = `gestor.${timestamp}.${mod.value}@example.com`;
            const parentCpf = `987${Math.floor(Math.random() * 100000000)}`.padEnd(11, '0');
            const parentEmail = `parent.${timestamp}@example.com`;

            console.log(`[${mod.name}] 1. Cadastro do Pai (Inscrição)`);
            await page.goto('/register');
            await page.waitForSelector('text=Cadastro', { timeout: 30000 });
            
            await page.evaluate(() => { (window as any).__guardian_debug = true; });
            
            await expect(page.locator('h3, h2, h1, div').filter({ hasText: 'Cadastro' }).first()).toBeVisible();
            await page.click('button:has-text("Pular e preencher manualmente")');

            // Preenchimento do Responsável
            await page.getByLabel('Nome Completo *').fill(`Pai ${mod.name}`);
            await page.getByLabel('CPF *').fill(parentCpf);
            await page.getByLabel('E-mail *').fill(parentEmail);
            await page.getByLabel('WhatsApp *').fill('11988887777');
            await page.getByLabel('CEP *').fill('06310000');
            
            await page.waitForSelector('.animate-spin', { state: 'detached', timeout: 5000 }).catch(() => {});
            
            await page.getByLabel('Rua *').fill('Rua das Amoreiras');
            await page.getByLabel('Bairro').fill('Centro');
            await page.getByLabel('Cidade *').fill('Carapicuíba');
            await page.getByLabel('Estado *').fill('SP');
            await page.getByLabel('Número *').fill('123');
            
            await page.getByLabel('Nome do Filho(a) *').fill(`Aluno ${mod.name}`);
            
            await page.locator('button').filter({ hasText: 'Selecione a escola...' }).click();
            await page.waitForTimeout(500); // Aguarda a animação do Drawer mobile
            await page.getByText('Escola Primária do Saber').last().click({ force: true });
            
            await page.locator('button').filter({ hasText: 'Selecione...' }).first().click();
            await page.waitForTimeout(500);
            await page.getByText('Manhã').last().click({ force: true });

            await page.locator('p').filter({ hasText: 'Modalidade do Serviço' }).locator('..').locator('button').click();
            await page.waitForTimeout(500);
            await page.getByText(mod.optionName).last().click({ force: true });
            
            const btnProximo = page.locator('button:has-text("Próximo: Identificação do Aluno")');
            await expect(btnProximo).toBeEnabled({ timeout: 20000 });
            await btnProximo.scrollIntoViewIfNeeded();
            await btnProximo.click({ force: true });
            
            await page.click('button:has-text("Continuar")');
            await page.click('button:has-text("Segurança de Acesso")');

            await page.fill('input[placeholder="000000"]', '123456');
            await page.getByRole('button', { name: /Concluir e Enviar|Finalizar Cadastro|Enviar Solicitação/i }).click();
            
            // Aguardar mensagem de sucesso e dar tempo para o MockDB persistir no LocalStorage (delay de 150ms no hook)
            await expect(page.locator('body')).toContainText('Inscrição Enviada', { timeout: 20000 });
            await page.waitForTimeout(2000); 

            console.log(`[${mod.name}] 2. Cadastro e Aprovação pelo Gestor`);
            // REMOVIDO: localStorage.clear(); - Não podemos limpar aqui pois apaga o cadastro do Passo 1!
            // Apenas limpamos o sessionStorage para simular um novo login
            await page.evaluate(() => { 
                sessionStorage.clear();
            });
            await page.goto('/signup');
            await page.waitForSelector('text=Seja bem-vindo', { timeout: 30000 });
            
            // Aguardar o botão renderizar antes de clicar
            const btnProximoPasso = page.locator('button:has-text("Próximo Passo")');
            await expect(btnProximoPasso).toBeVisible({ timeout: 15000 });
            await btnProximoPasso.click({ force: true });
            
            // Aguardar a transição de step (choice → data) confirmar
            const inputNome = page.locator('input[placeholder="Seu nome"]');
            try {
                await expect(inputNome).toBeVisible({ timeout: 5000 });
            } catch {
                // Retry: se a transição não ocorreu, clicar novamente
                await btnProximoPasso.click({ force: true }).catch(() => {});
                await expect(inputNome).toBeVisible({ timeout: 15000 });
            }
            
            await inputNome.fill(`Gestor ${mod.name}`);
            await page.fill('input[placeholder="000.000.000-00"]', '12345678901');
            await page.fill('input[placeholder="000000"]', '123456');
            await page.fill('input[placeholder="email@exemplo.com"]', gestorEmail);
            await page.fill('input[placeholder="(00) 00000-0000"]', '11999999999');
            await page.click('button:has-text("Criar minha Conta")');

            // Clica em "Acessar Painel Agora" via JS e navega direto para pending-registrations
            // O click normal causa navegação que conflita com o goto subsequente.
            // Navega direto para pending-registrations para triagem
            await page.goto('/dashboard/management/pending-registrations');
            await page.waitForSelector('text=Área de Triagem', { timeout: 30000 });
            
            // Localizar a linha (tabela desktop) ou card (mobile) exato do pai e clicar
            await expect(page.getByText('Área de Triagem').first()).toBeVisible({ timeout: 30000 });
            
            // Aguardar o registro específico aparecer na lista. 
            // Se não aparecer em 5s, dar um refresh (força leitura do localStorage pelo hook)
            try {
                await expect(page.getByText(`Pai ${mod.name}`).first()).toBeVisible({ timeout: 5000 });
            } catch (e) {
                console.log(`[DEBUG] Registro não encontrado de primeira. Dando reload na listagem...`);
                await page.reload();
                await expect(page.getByText(`Pai ${mod.name}`).first()).toBeVisible({ timeout: 20000 });
            }
            
            const parentRow = page.locator('tr').filter({ hasText: `Pai ${mod.name}` }).first();
            await parentRow.getByRole('button', { name: /Revisar/i }).click({ force: true });
            
            await page.getByRole('spinbutton').fill(mod.value);
            
            // Selecionar uma rota real para garantir a geração do contrato
            await page.getByRole('combobox').nth(1).click({ force: true });
            await page.waitForTimeout(500);
            await page.getByRole('option').filter({ hasText: /Rota/i }).first().click({ force: true });
            await page.waitForTimeout(1000);

            // Clique no botão final de Aprovação via JS para bypass de viewport
            await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button'));
                const btn = buttons.find(b => b.textContent?.includes('Aprovar'));
                if (btn) btn.click();
            });
            
            // Aguardar feedback visual claro da aprovação
            await expect(page.locator('body')).toContainText('Aprovada', { timeout: 20000 });
            await page.waitForTimeout(2000); // Tempo para o "banco" persistir o usuário e o contrato

            console.log(`[${mod.name}] 3. Assinatura do Contrato pelo Pai`);
            await page.evaluate(() => { 
                localStorage.removeItem('currentUser'); 
                sessionStorage.clear(); 
            });
            await page.goto('/login');
            await page.waitForSelector('text=Selecione seu perfil', { timeout: 30000 });
            
            // Aguardar o form renderizar (Next.js isMounted effect delay fix)
            await page.waitForSelector('text="Selecione seu perfil:"', { state: 'visible', timeout: 15000 });
            
            // Usar getByText para maior resiliência ao invés de label[for=]
            await page.locator('div').filter({ hasText: /^Pais$/ }).first().click();
            await page.fill('input[placeholder*="000.000.000-00"]', parentCpf);
            await page.fill('input[placeholder="••••••"]', '123456');
            await page.getByRole('button', { name: /Entrar no Sistema/i }).click();
            
            await page.goto('/parent/contract');
            await page.waitForSelector('text=Contrato', { timeout: 30000 });
            
            // Aguardar o contrato renderizar completamente
            await expect(page.getByRole('checkbox')).toBeVisible({ timeout: 15000 });
            
            // Verificar se o contrato já foi aceito (caso de renderização ultra-rápida ou estado persistido)
            const isSigned = await page.getByText('Compartilhar Assinado').isVisible();
            
            if (!isSigned) {
                console.log(`[${mod.name}] Assinando contrato...`);
                // Marcar o checkbox de aceite (agora nativo para estabilidade)
                await page.evaluate(() => {
                    const cb = document.getElementById('terms') as HTMLInputElement;
                    if (cb) {
                        cb.checked = true;
                        cb.dispatchEvent(new Event('change', { bubbles: true }));
                        cb.dispatchEvent(new Event('click', { bubbles: true }));
                    }
                });
                await page.waitForTimeout(500);

                // Clique no botão de Aceite
                const btnAceitar = page.getByRole('button', { name: /ACEITAR CONTRATO/i });
                await btnAceitar.click({ force: true });
            } else {
                console.log(`[${mod.name}] Contrato já consta como assinado.`);
            }

            await page.waitForTimeout(1000);
            
            // Verificação flexível de sucesso
            await expect(page.locator('body')).toContainText(/Contrato Aceito|Assinado/i);

            console.log(`[${mod.name}] 4. Validação Financeira Final`);
            await page.evaluate(() => { 
                localStorage.removeItem('currentUser'); 
                sessionStorage.clear(); 
            });
            await page.goto('/login');
            await page.waitForSelector('text=Selecione seu perfil', { timeout: 30000 });
            
            // Aguardar o form renderizar (Next.js isMounted effect delay fix)
            await page.waitForSelector('text="Selecione seu perfil:"', { state: 'visible', timeout: 15000 });
            
            await page.locator('div').filter({ hasText: /^Gestor$/ }).first().click();
            await page.locator('input[placeholder*="email@exemplo.com"]').fill(gestorEmail);
            await page.locator('input[type="password"]').fill('123456'); 
            await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
            
            // Aguarda o login redirecionar para o dashboard primeiro
            try {
                await page.waitForURL(/\/dashboard/, { timeout: 15000 });
            } catch (e) {
                console.log("[DEBUG] Login redirect timed out, forcing navigation...");
                await page.evaluate(() => { window.location.href = '/dashboard'; });
            }

            // Navegar direto para o financeiro para validação final
            await page.goto('/dashboard/management/financial-control');
            await page.waitForSelector('text=Saúde Financeira', { timeout: 30000 });
            
            // Navegar para o financeiro via clique no menu lateral (Isso usará o Router do Next.js e evitará hard reloads)
            const btnFinanceiro = page.locator('nav').getByText('Controle Financeiro').first();
            await btnFinanceiro.click({ force: true });
            
            // Confirma rendering da página destino (aguarda o heading aparecer)
            await expect(page.getByRole('heading', { name: 'Financeiro' }).first()).toBeVisible({ timeout: 30000 });
            
            // Verifica o box do Total Geral ou Fatura
            await expect(page.locator('body')).toContainText(`R$ ${mod.value},00`, { timeout: 15000 });

            console.log(`[${mod.name}] SUCESSO TOTAL.`);
        });
    }
});
