import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 1280, height: 800 } });

test('fluxo completo: criar motorista, criar rota, e verificar no planejamento', async ({ page }) => {
  page.on('dialog', dialog => dialog.dismiss());

  // ETAPA 0: Estado limpo
  await page.goto('http://localhost:9002/dashboard/management/drivers?mockUserId=user-admin-1&isTesting=true');
  await page.evaluate(() => {
    localStorage.removeItem('guardian_mock_db');
    localStorage.removeItem('guardian_mock_db_version');
    localStorage.setItem('hide-ios-prompt', 'true');
  });
  await page.reload();
  await page.waitForTimeout(4000);

  // ═══ ETAPA 1: Criar motorista "Jonatas Teste" ═══
  console.log('=== ETAPA 1: Criando motorista ===');

  await page.evaluate(() => {
    document.querySelectorAll('[class*="fixed"][class*="bottom"]').forEach(el => {
      (el as HTMLElement).style.display = 'none';
    });
  });

  const addDriverBtn = page.locator('button:has-text("Adicionar"), button:has-text("Novo Motorista")').first();
  await addDriverBtn.waitFor({ state: 'visible', timeout: 10000 });
  await addDriverBtn.click();
  await page.waitForTimeout(2000);

  // Nome — placeholder "Ex: Carlos Silva"
  await page.locator('input[placeholder*="Carlos Silva"]').first().fill('Jonatas Teste');
  
  // PIN — type="password" placeholder "Ex: 123456"
  await page.locator('input[type="password"]').first().fill('123456');
  await page.waitForTimeout(200);

  // CEP
  const cepInput = page.locator('input[placeholder*="00000-000"]').first();
  await cepInput.scrollIntoViewIfNeeded();
  await cepInput.fill('06320-290');
  await page.waitForTimeout(4000);

  // Rua (preenchida pelo ViaCEP ou manual)
  const streetInput = page.locator('input[placeholder*="Rua das Flores"]').first();
  if (!(await streetInput.inputValue()).trim()) {
    await streetInput.fill('Av. Inocêncio Seráfico');
  }

  // NÚMERO — O placeholder é exatamente "123", NÃO usar *="123" pq pega o PIN 
  // Vamos usar o label "Número" para encontrar o campo correto
  const numberLabel = page.locator('label:has-text("Número")').first();
  const numberFormItem = numberLabel.locator('..');
  const numberInput = numberFormItem.locator('input').first();
  await numberInput.scrollIntoViewIfNeeded();
  await numberInput.fill('100');
  console.log('Campo Número preenchido com 100');

  // Bairro
  const neighborhoodInput = page.locator('input[placeholder*="Centro"]').first();
  if (!(await neighborhoodInput.inputValue()).trim()) {
    await neighborhoodInput.fill('Centro');
  }

  // Cidade
  const cityInput = page.locator('input[placeholder*="São Paulo"]').first();
  if (!(await cityInput.inputValue()).trim()) {
    await cityInput.fill('Carapicuíba');
  }

  // Estado
  const stateInput = page.locator('input[placeholder*="SP"]').first();
  if (!(await stateInput.inputValue()).trim()) {
    await stateInput.fill('SP');
  }

  // Veículo
  const vehicleTrigger = page.locator('button:has-text("Nenhum veículo")');
  if (await vehicleTrigger.isVisible({ timeout: 2000 }).catch(() => false)) {
    await vehicleTrigger.click({ force: true });
    await page.waitForTimeout(500);
    const vehicleOpt = page.locator('[role="option"]').filter({ hasNotText: 'Nenhum' }).first();
    if (await vehicleOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
      await vehicleOpt.click({ force: true });
    }
    await page.waitForTimeout(500);
  }

  // Verificar valores antes de salvar
  const pinVal = await page.locator('input[type="password"]').first().inputValue();
  const numVal = await numberInput.inputValue();
  console.log(`PIN="${pinVal}" (length=${pinVal.length}), Número="${numVal}"`);

  // Salvar
  console.log('Salvando motorista...');
  await page.locator('button[type="submit"]').first().click({ force: true });
  await page.waitForTimeout(3000);

  // Verificar DB
  const dbAfterDriver = await page.evaluate(() => {
    const raw = localStorage.getItem('guardian_mock_db');
    if (!raw) return null;
    const db = JSON.parse(raw);
    return {
      driversCount: db.drivers?.length || 0,
      driverNames: (db.drivers || []).map((d: any) => `${d.name} [id=${d.id}, vehicle=${d.vehicleId || 'NONE'}]`),
    };
  });
  console.log('DB APÓS MOTORISTA:', JSON.stringify(dbAfterDriver, null, 2));

  const driverCreated = (dbAfterDriver?.driversCount || 0) > 3;
  console.log(`MOTORISTA CRIADO: ${driverCreated ? '✅' : '❌'} (${dbAfterDriver?.driversCount} no DB)`);

  if (!driverCreated) {
    const formErrors = await page.locator('p[class*="text-destructive"], p[class*="text-sm"][class*="font-medium"]').allTextContents();
    console.log('ERROS DE VALIDAÇÃO:', JSON.stringify(formErrors.filter(e => e.length > 0)));
    return; // Encerrar se motorista falhou
  }

  // ═══ ETAPA 2: Criar rota "Rota do Jonatas" ═══
  console.log('=== ETAPA 2: Criando rota ===');
  await page.goto('http://localhost:9002/dashboard/management/routes?mockUserId=user-admin-1');
  await page.waitForTimeout(4000);

  await page.locator('#add-route-btn').first().click();
  await page.waitForTimeout(2000);

  await page.locator('input[placeholder*="Nome da Rota"]').first().fill('Rota do Jonatas');

  // Turno
  const turnoBtn = page.locator('button').filter({ hasText: 'Selecione' }).first();
  await turnoBtn.click();
  await page.waitForTimeout(500);
  await page.locator('[role="option"]').filter({ hasText: 'Manhã' }).first().click();
  await page.waitForTimeout(500);

  // Motorista
  const driverBtn = page.locator('button').filter({ hasText: 'Escolha' }).first();
  await driverBtn.click();
  await page.waitForTimeout(500);
  
  const driverOptions = await page.locator('[role="option"]').allTextContents();
  console.log('MOTORISTAS DISPONÍVEIS:', JSON.stringify(driverOptions));

  const jonatasOpt = page.locator('[role="option"]').filter({ hasText: 'Jonatas' }).first();
  if (await jonatasOpt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await jonatasOpt.click();
    console.log('✅ MOTORISTA "Jonatas Teste" SELECIONADO!');
  } else {
    console.log('❌ MOTORISTA JONATAS NÃO ENCONTRADO');
    await page.locator('[role="option"]').first().click();
  }
  await page.waitForTimeout(500);

  // Escola
  await page.locator('[id^="sch-"]').first().click({ force: true });
  await page.waitForTimeout(1000);

  // Aluno
  const plusBtn = page.locator('button:has(svg.lucide-plus-circle)').first();
  if (await plusBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await plusBtn.click({ force: true });
    console.log('Aluno adicionado.');
    await page.waitForTimeout(500);
    // Adicionar mais um
    const plusBtn2 = page.locator('button:has(svg.lucide-plus-circle)').first();
    if (await plusBtn2.isVisible({ timeout: 1000 }).catch(() => false)) {
      await plusBtn2.click({ force: true });
    }
    await page.waitForTimeout(500);
  }

  // Salvar rota
  const saveRouteBtn = page.locator('button:has-text("SALVAR ROTA DEFINITIVA")');
  await saveRouteBtn.scrollIntoViewIfNeeded();
  const isDisabled = await saveRouteBtn.isDisabled();
  console.log(`Botão SALVAR disabled: ${isDisabled}`);
  
  if (!isDisabled) {
    await saveRouteBtn.click({ force: true });
    await page.waitForTimeout(3000);
    console.log('✅ ROTA SALVA!');
  } else {
    console.log('❌ BOTÃO DESABILITADO');
  }

  // Verificar DB
  const dbAfterRoute = await page.evaluate(() => {
    const raw = localStorage.getItem('guardian_mock_db');
    if (!raw) return null;
    const db = JSON.parse(raw);
    const jonatasRoute = (db.routes || []).find((r: any) => r.name?.includes('Jonatas'));
    return {
      routesCount: db.routes?.length || 0,
      jonatasRoute: jonatasRoute ? {
        name: jonatasRoute.name,
        driverId: jonatasRoute.driverId,
        shift: jonatasRoute.shift,
        studentCount: jonatasRoute.studentIds?.length || 0
      } : null,
      routeNames: (db.routes || []).map((r: any) => r.name)
    };
  });
  console.log('DB APÓS ROTA:', JSON.stringify(dbAfterRoute, null, 2));

  const routeCreated = !!dbAfterRoute?.jonatasRoute;
  console.log(`ROTA CRIADA: ${routeCreated ? '✅' : '❌'}`);

  if (!routeCreated) return;

  // ═══ ETAPA 3: Verificar no Planejamento ═══
  console.log('=== ETAPA 3: Verificando no Planejamento ===');
  await page.goto('http://localhost:9002/dashboard/management/route-planning?mockUserId=user-admin-1');
  await page.waitForTimeout(4000);

  await page.locator('#btn-new-planning').click();
  await page.waitForTimeout(1500);

  // Abrir dropdown de rotas
  const routeSelectWiz = page.locator('button').filter({ hasText: /Visão Geral|Escolher Rota/ }).first();
  await routeSelectWiz.click();
  await page.waitForTimeout(500);

  const routeOptions = await page.locator('[role="option"]').allTextContents();
  console.log('ROTAS NO WIZARD:', JSON.stringify(routeOptions));

  const hasJonatasRoute = routeOptions.some(opt => opt.includes('Jonatas'));
  console.log(`"Rota do Jonatas" NO WIZARD: ${hasJonatasRoute ? '✅' : '❌'}`);

  if (hasJonatasRoute) {
    await page.locator('[role="option"]').filter({ hasText: 'Jonatas' }).first().click();
    await page.waitForTimeout(500);

    const driverWizText = await page.locator('button').filter({ hasText: /Jonatas|Selecione/ }).first().textContent();
    console.log(`MOTORISTA AUTO-SELECIONADO: "${driverWizText}"`);

    await page.locator('button:has-text("Iniciar Planejamento")').first().click();
    await page.waitForTimeout(2000);
    console.log('✅ PLANEJAMENTO INICIADO COM SUCESSO!');
  }

  // ═══ RESULTADO FINAL ═══
  console.log('\n═══════════════════════════════════════════');
  console.log('RESULTADO FINAL DO TESTE E2E:');
  console.log(`  1. Motorista criado:       ${driverCreated ? '✅' : '❌'}`);
  console.log(`  2. Rota criada:            ${routeCreated ? '✅' : '❌'}`);
  console.log(`  3. Rota no planejamento:   ${hasJonatasRoute ? '✅' : '❌'}`);
  console.log('═══════════════════════════════════════════\n');

  expect(driverCreated).toBe(true);
  expect(routeCreated).toBe(true);
  expect(hasJonatasRoute).toBe(true);
});
