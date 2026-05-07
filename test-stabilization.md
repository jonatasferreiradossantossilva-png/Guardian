# Estabilização Final da Suite de Testes E2E

## Objetivo
Levar **todos os 9 testes Playwright** para 100% verde no Chromium, com custo zero de API, execução determinística e pronta para CI/CD.

## Diagnóstico Atual

| # | Teste | Blindagem | Status | Problema |
|---|-------|-----------|--------|----------|
| 1 | `operational-trip.spec.ts` | ✅ | ✅ Verde | — |
| 2 | `absentee-workflow.spec.ts` | ✅ | ⚠️ Não validado | URLs corrigidas, falta rodar |
| 3 | `route-optimization.spec.ts` | ✅ | ⚠️ Não validado | Blindagem adicionada, falta rodar |
| 4 | `full-lifecycle.spec.ts` | ✅ | ⚠️ Não validado | Blindagem adicionada, falta rodar |
| 5 | `financial-health.spec.ts` | ✅ | ❌ Falhando | Seletores de UI desatualizados (strict mode) |
| 6 | `autonomous-business.spec.ts` | ✅ | ❌ Falhando | Aba "Alunos" não encontrada no driver dashboard |
| 7 | `onboarding.spec.ts` | ❌ | ⚠️ Sem blindagem | Falta interceptação de rede |
| 8 | `fleet-manager-dashboard.spec.ts` | ❌ | ⚠️ Sem blindagem | Falta interceptação de rede |
| 9 | `console-audit.spec.ts` | ❌ | ⚠️ Sem blindagem | Falta interceptação de rede + rota `/telemetry-test` pode não existir |

## Tasks

### Fase 1: Corrigir os 2 testes quebrados (críticos)

- [ ] **Task 1**: Corrigir `autonomous-business.spec.ts` → Verificar: o que o driver dashboard renderiza quando `mockRouteId=route-1` está ativo (inspecionar se existe `role=tablist` e `role=tab{Alunos}`). Se não existir aba "Alunos", usar o seletor correto (ex: `getByText`, `locator('button')`, etc.)
  - Subir o dev server → Navegar no browser → Capturar DOM real → Ajustar seletor
  - Verificação: `npx playwright test tests/autonomous-business.spec.ts --project=Chromium` → verde

- [ ] **Task 2**: Corrigir `financial-health.spec.ts` → Verificar: textos reais das seções do dashboard financeiro do gestor (linhas 73-75 procuram "Filtros e Resumo de Receitas" e "Histórico de Faturas" — confirmar se existem na UI atual)
  - Navegar no browser como gestor → Capturar textos reais → Atualizar expects
  - Verificação: `npx playwright test tests/financial-health.spec.ts --project=Chromium` → verde

### Fase 2: Blindar os 3 testes sem interceptação de rede

- [ ] **Task 3**: Adicionar `context.route('**/*')` ao `onboarding.spec.ts` → Mudar `beforeEach(async ({ page })` para `beforeEach(async ({ page, context })` + inserir bloco de interceptação padrão
  - Verificação: `npx playwright test tests/onboarding.spec.ts --project=Chromium` → verde

- [ ] **Task 4**: Adicionar `context.route('**/*')` ao `fleet-manager-dashboard.spec.ts` → Mesmo padrão
  - Verificação: `npx playwright test tests/fleet-manager-dashboard.spec.ts --project=Chromium` → verde

- [ ] **Task 5**: Adicionar interceptação ao `console-audit.spec.ts` + validar se a rota `/telemetry-test` existe. Se não existir, ajustar para uma rota válida (ex: `/login` ou `/dashboard`)
  - Verificação: `npx playwright test tests/console-audit.spec.ts --project=Chromium` → verde

### Fase 3: Validar os 3 testes já blindados mas não testados

- [ ] **Task 6**: Rodar `absentee-workflow.spec.ts` no Chromium → Se falhar, corrigir seletores cirurgicamente
  - Verificação: `npx playwright test tests/absentee-workflow.spec.ts --project=Chromium` → verde

- [ ] **Task 7**: Rodar `route-optimization.spec.ts` no Chromium → Se falhar, corrigir seletores
  - Verificação: `npx playwright test tests/route-optimization.spec.ts --project=Chromium` → verde

- [ ] **Task 8**: Rodar `full-lifecycle.spec.ts` no Chromium → Se falhar, corrigir seletores
  - Verificação: `npx playwright test tests/full-lifecycle.spec.ts --project=Chromium` → verde

### Fase 4: Verificação final

- [ ] **Task 9**: Rodar suite completa → `npx playwright test --project=Chromium` → **9/9 testes verdes**
- [ ] **Task 10**: Rodar typecheck → `npm run typecheck` → **0 erros**

## Done When
- [ ] `npx playwright test --project=Chromium` → 9 passed, 0 failed
- [ ] `npm run typecheck` → exit code 0
- [ ] Nenhum teste consome API externa (blindagem em todos)

## Notas
- **Execução sequencial**: Começamos pelos testes quebrados (Tasks 1-2) porque são os mais complexos e desbloqueiam confiança
- **Economia de tokens**: Cada teste é validado isoladamente antes da bateria final
- **Projeto Chromium only**: Usamos `--project=Chromium` para velocidade máxima (evitamos 3x de execução desnecessária)
- **Padrão de blindagem** já implementado em 6/9 testes — basta replicar o mesmo bloco nos 3 restantes
