import { test, expect } from '@playwright/test';

test.describe('Jornada Real do Motorista — Embarque Sequencial no Navegador', () => {
  test('deve iniciar viagem, clicar em EMBARCOU, avançar parada no DOM e listar Alunos a Bordo', async ({ page }) => {
    // 1. Acessar tela do motorista em modo teste
    await page.goto('/driver/route-plan?mockUserId=user-motorista-4&isTesting=true');
    await page.waitForLoadState('networkidle');

    // 2. Se a tela estiver na tela de prontidão (não iniciada), clicar em "INICIAR OPERAÇÃO"
    const startBtn = page.locator('button:has-text("INICIAR OPERAÇÃO"), button:has-text("INICIAR VIAGEM")').first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }

    // 3. Verificar que a parada atual está visível
    const embarcouBtn = page.locator('button:has-text("EMBARCOU")').first();
    await expect(embarcouBtn).toBeVisible({ timeout: 15000 });

    // Pegar o nome do primeiro aluno antes de embarcar
    const firstStudentNameEl = page.locator('[data-testid="active-student-name"]').first();
    const firstStudentName = await firstStudentNameEl.textContent();
    expect(firstStudentName).toBeTruthy();

    // 4. Clicar no botão EMBARCOU
    await embarcouBtn.click();

    // 5. Verificar feedback visual de confirmação
    const feedbackBanner = page.getByText(/embarcou com sucesso/i).first();
    await expect(feedbackBanner).toBeVisible({ timeout: 5000 });

    // 6. Verificar que o aluno embarcado aparece na lista "Alunos a Bordo"
    const boardedHeading = page.getByText(/Alunos a Bordo/i).first();
    await expect(boardedHeading).toBeVisible({ timeout: 5000 });

    // 7. Verificar que a parada avançou (novo botão EMBARCOU disponível para o próximo aluno)
    const nextEmbarcouBtn = page.locator('button:has-text("EMBARCOU")').first();
    await expect(nextEmbarcouBtn).toBeVisible({ timeout: 5000 });

    // O nome na parada ativa agora deve ser diferente do primeiro aluno (Pedro Santos)
    const secondStudentNameEl = page.locator('[data-testid="active-student-name"]').first();
    const secondStudentName = await secondStudentNameEl.textContent();
    expect(secondStudentName).not.toBe(firstStudentName);
    expect(secondStudentName).toContain('Pedro');

    // 8. Clicar no botão EMBARCOU para o segundo aluno (Pedro Santos)
    await nextEmbarcouBtn.click();
    await page.waitForTimeout(1000);

    // 9. Verificar que agora temos 2 alunos a bordo
    const boardedTwoHeading = page.getByText(/Alunos a Bordo \(2\)/i).first();
    await expect(boardedTwoHeading).toBeVisible({ timeout: 5000 });

    // 10. A parada ativa agora avançou para o terceiro aluno (Bernardo Silva)
    const thirdStudentNameEl = page.locator('[data-testid="active-student-name"]').first();
    const thirdStudentName = await thirdStudentNameEl.textContent();
    expect(thirdStudentName).toContain('Bernardo');

    // 11. Testar Encerramento Manual da Rota para garantir que a tela volta à prontidão
    const endRouteBtn = page.locator('button:has-text("Reiniciar/Encerrar Rota"), button:has-text("Encerrar Viagem Manualmente")').first();
    await expect(endRouteBtn).toBeVisible({ timeout: 5000 });
    await endRouteBtn.click();
    await page.waitForTimeout(2000);

    // 12. Confirmar que a tela retornou à prontidão (com botão INICIAR OPERAÇÃO disponível)
    const setupStartBtn = page.locator('button:has-text("INICIAR OPERAÇÃO"), button:has-text("INICIAR VIAGEM")').first();
    await expect(setupStartBtn).toBeVisible({ timeout: 10000 });
  });
});
