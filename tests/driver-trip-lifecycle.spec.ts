import { test, expect } from '@playwright/test';

test.describe('Jornada Real do Motorista — Embarque Sequencial no Navegador', () => {
  test('deve iniciar viagem, clicar em EMBARCOU, avançar parada no DOM e listar Alunos a Bordo', async ({ page }) => {
    // 1. Acessar tela do motorista em modo teste
    await page.goto('/driver/route-plan?mockUserId=user-motorista-4&isTesting=true');
    await page.waitForLoadState('networkidle');

    // 2. Se a tela estiver na tela de prontidão (não iniciada), clicar em "INICIAR OPERAÇÃO"
    const startBtn = page.locator('button:has-text("INICIAR OPERAÇÃO"), button:has-text("INICIAR VIAGEM")');
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(1000);
    }

    // 3. Verificar que a parada atual está visível
    const embarcouBtn = page.locator('button:has-text("EMBARCOU")').first();
    await expect(embarcouBtn).toBeVisible({ timeout: 15000 });

    // Pegar o nome do primeiro aluno antes de embarcar
    const firstStudentNameEl = page.locator('[data-testid="ActiveStopCard"] h3, [data-testid="ActiveStopCard"] [class*="CardTitle"], [class*="CardHeader"] [class*="CardTitle"]').first();
    const firstStudentName = await firstStudentNameEl.textContent();
    expect(firstStudentName).toBeTruthy();

    // 4. Clicar no botão EMBARCOU
    await embarcouBtn.click();

    // 5. Verificar feedback visual do Toast
    const toastMsg = page.locator('[role="status"], [class*="toast"], text="Embarque Confirmado"').first();
    await expect(toastMsg).toBeVisible({ timeout: 5000 });

    // 6. Verificar que o aluno embarcado aparece na lista "Alunos a Bordo"
    const boardedHeading = page.locator('text="Alunos a Bordo"').first();
    await expect(boardedHeading).toBeVisible({ timeout: 5000 });

    // 7. Verificar que a parada avançou (novo botão EMBARCOU disponível para o próximo aluno)
    const nextEmbarcouBtn = page.locator('button:has-text("EMBARCOU")').first();
    await expect(nextEmbarcouBtn).toBeVisible({ timeout: 5000 });

    // O nome na parada ativa agora deve ser diferente do primeiro aluno
    const secondStudentNameEl = page.locator('[data-testid="ActiveStopCard"] h3, [data-testid="ActiveStopCard"] [class*="CardTitle"], [class*="CardHeader"] [class*="CardTitle"]').first();
    const secondStudentName = await secondStudentNameEl.textContent();
    expect(secondStudentName).not.toBe(firstStudentName);
  });
});
