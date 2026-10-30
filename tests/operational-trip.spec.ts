import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone 12'] });

test.describe('Guardian Operational Trip - High Fidelity (3 Contexts)', () => {

    test('Fluxo Operacional Sincronizado: Gestor, Motorista e Monitor', async ({ browser }) => {
        // IDs de teste fixos do sistema de mock (conforme src/lib/mock-data.ts)
        const gestorId = 'user-admin-1';
        const driverId = 'user-motorista-4';
        const monitorId = 'user-monitor-1';
        
        console.log('--- 1. INICIALIZANDO CONTEXTOS ---');
        
        // Contexto COMPARTILHADO para localStorage (MockDB sync), mas cada página
        // mantém seu próprio sessionStorage (que guarda o mockUserId e activeRouteId)
        const context = await browser.newContext({ ...devices['iPhone 12'] });

        // 0. BLINDAGEM DETERMINÍSTICA (Zero API Credits & Fast Loading)
        // Intercepta qualquer chamada de mapa, tile, fontes ou analytics para garantir:
        // 1. Custo zero garantido
        // 2. Velocidade de execução altíssima
        // 3. Estabilidade (não falha se o OpenStreetMap estiver fora do ar)
        await context.route('**/*', (route) => {
            const url = route.request().url();
            const excludeList = [
                'googlemaps', 'googleapis', 'gstatic', 'osm.org',
                'tile.openstreetmap', 'mapbox', 'facebook', 'analytics',
                'fonts.googleapis', 'fonts.gstatic', 'unpkg.com'
            ];
            if (excludeList.some(domain => url.includes(domain))) {
                return route.abort();
            }
            return route.continue();
        });

        const gestorPage = await context.newPage();
        const driverPage = await context.newPage();
        const monitorPage = await context.newPage();

        // TELEMETRIA DE ERROS NO CONSOLE (Driver)
        const driverErrors: string[] = [];
        driverPage.on('console', msg => {
            const text = msg.text();
            if (msg.type() === 'error') {
                if (text.includes('BillingNotEnabledMapError')) return;
                if (text.includes('net::ERR_ABORTED')) return;
                if (text.includes('net::ERR_FAILED')) return;
                if (text.includes('Failed to load resource')) return;
                driverErrors.push(text);
                console.error(`[Driver Telemetry Error]: ${text}`);
            }
        });
        driverPage.on('pageerror', err => {
            driverErrors.push(err.message);
            console.error(`[Driver Telemetry PageError]: ${err.message}`);
        });

        // Helper: Re-injetar sessão do motorista antes de qualquer reload
        const reinjectDriverSession = async () => {
            await driverPage.evaluate(({ id }) => {
                sessionStorage.setItem('mockUserId', id);
                sessionStorage.setItem('activeRouteId', 'route-1');
                sessionStorage.setItem('activeShift', 'Manhã');
                sessionStorage.setItem('activeDirection', 'ida');
                localStorage.setItem('hide-ios-prompt', 'true');
                (window as any).IS_TESTING = true;
            }, { id: driverId });
        };

        // 1. GESTOR: Verificação de Rota
        console.log('--- 2. GESTOR: VERIFICANDO ROTA ---');
        await gestorPage.bringToFront();
        // Usar parâmetro de URL para autenticação robusta no primeiro acesso
        await gestorPage.goto(`/dashboard/management/routes?mockUserId=${gestorId}&isTesting=true`, { waitUntil: 'domcontentloaded' });
        await expect(gestorPage.locator('h1')).toContainText('Rotas', { timeout: 30000 });
        
        // 2. MOTORISTA: Início da Viagem
        console.log('--- 3. MOTORISTA: INICIANDO VIAGEM ---');
        await driverPage.bringToFront();
        await driverPage.goto(`/driver/route-plan?mockUserId=${driverId}&mockRouteId=route-1&isTesting=true`, { waitUntil: 'domcontentloaded' });
        
        await driverPage.click('text=INICIAR OPERAÇÃO', { force: true });
        await expect(driverPage.getByText('Progresso da Rota')).toBeVisible({ timeout: 20000 });
        
        // 3. MONITOR: Sincronização e Embarque
        console.log('--- 4. MONITOR: EMBARQUE COLETIVO ---');
        await monitorPage.bringToFront();
        await monitorPage.goto(`/monitor?mockUserId=${monitorId}&isTesting=true`, { waitUntil: 'domcontentloaded' });
        
        // Aguardar o estado do motorista propagar (localStorage é compartilhado no context)
        await monitorPage.waitForTimeout(2000);
        await monitorPage.reload();
        
        // Verificar se está na tela de operação (monitor vê o botão de embarque coletivo)
        const embarqueBtn = monitorPage.getByRole('button', { name: /Embarque Coletivo/i });
        await expect(embarqueBtn).toBeVisible({ timeout: 20000 });
        
        // Realizar Embarque Coletivo
        await embarqueBtn.click();
        await expect(monitorPage.locator('body')).toContainText('Embarque Coletivo!');

        // 4. VERIFICAÇÃO DE SINCRONIZAÇÃO (No Motorista)
        console.log('--- 5. VERIFICANDO SINCRONIZAÇÃO EM TEMPO REAL ---');
        await driverPage.bringToFront();
        await driverPage.waitForTimeout(2000);
        
        // Re-injetar sessão completa antes de reload
        await reinjectDriverSession();
        await driverPage.reload();
        await driverPage.waitForTimeout(2000);
        
        // Verificar que a barra de progresso está lá (uso de regex flexível para evitar erros de render)
        await expect(driverPage.getByText(/paradas/i).first()).toBeVisible({ timeout: 20000 });

        // 5. MONITOR: Reportando Incidente
        console.log('--- 6. MONITOR: REPORTANDO INCIDENTE ---');
        await monitorPage.bringToFront();
        
        // Garantir que os estudantes estão renderizados antes de procurar o botão
        await expect(monitorPage.getByText(/Embarcados/i)).toBeVisible({ timeout: 10000 });
        
        // Clicar no botão 'Incidente' do primeiro card de aluno visível
        const incidentBtn = monitorPage.locator('button:has-text("Incidente")').first();
        await incidentBtn.scrollIntoViewIfNeeded();
        await incidentBtn.click({ force: true });
        
        // Aguardar o modal/textarea
        const textarea = monitorPage.locator('textarea');
        await textarea.waitFor({ state: 'visible', timeout: 10000 });
        await textarea.fill('Trânsito intenso na via principal');
        
        await monitorPage.click('button:has-text("Registrar Incidente")', { force: true });
        await expect(monitorPage.locator('body')).toContainText('Incidente Registrado');

        // 6. MOTORISTA: Verificando Alerta de Incidente
        console.log('--- 7. MOTORISTA: RECEBENDO ALERTA ---');
        await driverPage.bringToFront();
        await expect(driverPage.locator('body')).toContainText('SEGURANÇA', { timeout: 15000 });
        await expect(driverPage.locator('body')).toContainText('Trânsito intenso', { timeout: 10000 });

        // 7. FINALIZAÇÃO: Chegada na Escola e Desembarque
        // Na ida, o motorista deve clicar no botão DESEMBARQUE que aparece no card da escola
        // Ele só está visível quando a parada ativa é do tipo 'school'
        console.log('--- 8. FINALIZAÇÃO: DESEMBARQUE NA ESCOLA ---');
        
        // O botão DESEMBARQUE aparece no NextStopSchoolCard - precisa scrollar até ele
        const desembarqueBtn = driverPage.getByRole('button', { name: /DESEMBARQUE/i }).first();
        await desembarqueBtn.scrollIntoViewIfNeeded();
        await desembarqueBtn.click({ force: true });
        await expect(driverPage.locator('body')).toContainText('Desembarque Coletivo!');

        // 8. VERIFICAÇÃO DE STATUS FINAL (Monitor)
        console.log('--- 9. VERIFICANDO FINALIZAÇÃO NO MONITOR ---');
        await monitorPage.bringToFront();
        
        // Pequena espera extra para garantir que a atualização do motorista foi processada
        await monitorPage.waitForTimeout(3000); 
        await monitorPage.reload();
        
        // Garantir que estamos no dashboard do monitor
        await expect(monitorPage.getByText(/Monitor: Fernanda Lima/i)).toBeVisible({ timeout: 15000 });

        // Verificar o status da rota no monitor
        console.log('Validando box de finalizados...');
        const finalizadosBox = monitorPage.getByText(/Finalizados \(\d+\)/i);
        await expect(finalizadosBox).toBeVisible({ timeout: 10000 });

        console.log('--- 10. ENCERRANDO OPERAÇÃO ---');
        await driverPage.bringToFront();
        
        // Re-injetar sessão antes da ação final
        await reinjectDriverSession();
        await driverPage.waitForTimeout(500);
        
        await driverPage.click('text=FINALIZAR OPERAÇÃO');
        
        // Verificar se voltou estritamente para a tela inicial do motorista e NÃO para o login
        await expect(driverPage).not.toHaveURL(/\/login/);
        await expect(driverPage.getByText(/Central de Operações/i).or(driverPage.getByText(/INICIAR OPERAÇÃO/i)).first()).toBeVisible({ timeout: 10000 });

        // Cleanup
        await context.close();
        // VALIDAR TELEMETRIA NO FINAL
        console.log('--- 6. VALIDANDO TELEMETRIA (ERROS DE CONSOLE) ---');
        expect(driverErrors, `Erros encontrados no painel do motorista:\n${driverErrors.join('\n')}`).toHaveLength(0);
    });
});
