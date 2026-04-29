# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: full-lifecycle.spec.ts >> Guardian Full Lifecycle Matrix >> Fluxo Completo: Ida e Volta
- Location: tests\full-lifecycle.spec.ts:32:13

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Controle Financeiro' }).first()

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e7]:
      - img [ref=e11]
      - generic [ref=e16]:
        - list [ref=e17]:
          - listitem [ref=e18]:
            - link [ref=e19] [cursor=pointer]:
              - /url: /dashboard/overview
              - img [ref=e20]
          - listitem [ref=e25]:
            - link [ref=e26] [cursor=pointer]:
              - /url: /dashboard/performance
              - img [ref=e27]
          - listitem [ref=e29]:
            - link [ref=e30] [cursor=pointer]:
              - /url: /dashboard/history
              - img [ref=e31]
          - listitem [ref=e33]:
            - link [ref=e34] [cursor=pointer]:
              - /url: /dashboard/management/incidents
              - img [ref=e35]
          - listitem [ref=e37]:
            - link [ref=e38] [cursor=pointer]:
              - /url: /dashboard/messages
              - img [ref=e39]
          - listitem [ref=e41]:
            - link [ref=e42] [cursor=pointer]:
              - /url: /dashboard/financial
              - img [ref=e43]
          - listitem [ref=e45]:
            - link [ref=e46] [cursor=pointer]:
              - /url: /dashboard/management/trip-requests
              - img [ref=e47]
          - listitem [ref=e49]:
            - link [ref=e50] [cursor=pointer]:
              - /url: /dashboard/management/contracts
              - img [ref=e51]
          - listitem [ref=e55]:
            - link [ref=e56] [cursor=pointer]:
              - /url: /dashboard/management/pending-registrations
              - img [ref=e58]
        - list [ref=e61]:
          - listitem [ref=e62]:
            - link [ref=e63] [cursor=pointer]:
              - /url: /dashboard/management/company
              - img [ref=e64]
          - listitem [ref=e68]:
            - link [ref=e69] [cursor=pointer]:
              - /url: /dashboard/management/schools
              - img [ref=e70]
          - listitem [ref=e75]:
            - link [ref=e76] [cursor=pointer]:
              - /url: /dashboard/management/drivers
              - img [ref=e77]
          - listitem [ref=e81]:
            - link [ref=e82] [cursor=pointer]:
              - /url: /dashboard/management/monitors
              - img [ref=e83]
          - listitem [ref=e87]:
            - link [ref=e88] [cursor=pointer]:
              - /url: /dashboard/management/vehicles
              - img [ref=e89]
          - listitem [ref=e94]:
            - link [ref=e95] [cursor=pointer]:
              - /url: /dashboard/management/routes
              - img [ref=e96]
          - listitem [ref=e100]:
            - link [ref=e101] [cursor=pointer]:
              - /url: /dashboard/management/parents
              - img [ref=e102]
          - listitem [ref=e107]:
            - link [ref=e108] [cursor=pointer]:
              - /url: /dashboard/management/students
              - img [ref=e109]
          - listitem [ref=e112]:
            - link [ref=e113] [cursor=pointer]:
              - /url: /dashboard/management/predefined-messages
              - img [ref=e114]
          - listitem [ref=e116]:
            - link [ref=e117] [cursor=pointer]:
              - /url: /dashboard/management/contract-templates
              - img [ref=e118]
          - listitem [ref=e121]:
            - link [ref=e122] [cursor=pointer]:
              - /url: /dashboard/management/announcements
              - img [ref=e123]
        - list [ref=e126]:
          - listitem [ref=e127]:
            - link [ref=e128] [cursor=pointer]:
              - /url: /presentation/simulator
              - img [ref=e129]
      - generic [ref=e132]:
        - img "Admin" [ref=e134]
        - link [ref=e135] [cursor=pointer]:
          - /url: /
          - button [ref=e136]:
            - img
    - generic [ref=e137]:
      - banner [ref=e138]:
        - generic [ref=e141]: MÓDULO GESTÃO
        - generic [ref=e142]:
          - generic [ref=e143]:
            - paragraph [ref=e144]: Ambiente de Operação
            - paragraph [ref=e145]: Guardian Cloud v2.5
          - button [ref=e146] [cursor=pointer]:
            - img
      - main [ref=e147]:
        - generic [ref=e149]:
          - generic [ref=e150]:
            - generic [ref=e151]:
              - heading "Guardian" [level=1] [ref=e152]
              - button [ref=e153] [cursor=pointer]:
                - img
            - generic [ref=e154]:
              - generic [ref=e155]:
                - button "Convidar Pais" [ref=e156] [cursor=pointer]:
                  - img
                  - text: Convidar Pais
                - link "Simular Link" [ref=e157] [cursor=pointer]:
                  - /url: /register
                  - img
                  - text: Simular Link
              - combobox [ref=e158] [cursor=pointer]:
                - generic: Recente
                - img [ref=e159]
              - combobox [ref=e161] [cursor=pointer]:
                - generic: Todo o Ano
                - img [ref=e162]
          - generic [ref=e164]:
            - generic [ref=e166]:
              - generic [ref=e167]:
                - generic [ref=e168]:
                  - generic [ref=e169]:
                    - img [ref=e170]
                    - text: Acontecendo Agora
                  - generic [ref=e172]:
                    - button "Simular Logística" [ref=e173] [cursor=pointer]:
                      - img
                    - generic [ref=e174]: LIVE
                - generic [ref=e175]: Monitoramento da Frota
              - generic [ref=e177]:
                - generic [ref=e179]:
                  - img [ref=e181]
                  - generic [ref=e183]:
                    - generic [ref=e184]:
                      - paragraph [ref=e185]: Sincronização GPS
                      - generic [ref=e186]: 17:16
                    - paragraph [ref=e187]: Telemetria da Rota 01 ativa e transmitindo para os pais.
                - generic [ref=e189]:
                  - img [ref=e191]
                  - generic [ref=e196]:
                    - generic [ref=e197]:
                      - paragraph [ref=e198]: Manutenção Preditiva
                      - generic [ref=e199]: 13:16
                    - paragraph [ref=e200]: Veículo Mercedes Sprinter (BRA2E19) atingiu o limite de km. Agendamento sugerido.
                - generic [ref=e202]:
                  - img [ref=e204]
                  - generic [ref=e206]:
                    - generic [ref=e207]:
                      - paragraph [ref=e208]: Backup de Telemetria
                      - generic [ref=e209]: 06:16
                    - paragraph [ref=e210]: Sincronização de dados de GPS concluída com sucesso.
              - link "Histórico Completo" [ref=e212] [cursor=pointer]:
                - /url: /dashboard/operational-history
                - text: Histórico Completo
                - img
            - generic [ref=e213]:
              - generic [ref=e214]:
                - generic [ref=e215]:
                  - img [ref=e216]
                  - text: Status do Setup
                - generic [ref=e218]: Visualize o guia para ativar o roteamento.
              - generic [ref=e219]:
                - img [ref=e221]
                - paragraph [ref=e224]:
                  - text: Configuração de Frota
                  - text: "& Telemetria Ativa"
              - button "ABRIR GUIA RÁPIDO" [ref=e226] [cursor=pointer]
          - generic [ref=e227]:
            - link "Receita R$ 1.800,00 Total recebido em Ano de 2026" [ref=e228] [cursor=pointer]:
              - /url: /dashboard/financial
              - generic [ref=e229]:
                - generic [ref=e230]:
                  - generic [ref=e231]: Receita
                  - img [ref=e232]
                - generic [ref=e234]:
                  - generic [ref=e235]: R$ 1.800,00
                  - paragraph [ref=e236]: Total recebido em Ano de 2026
            - link "Despesas R$ 9.950,50 Total gasto em Ano de 2026" [ref=e237] [cursor=pointer]:
              - /url: /dashboard/financial
              - generic [ref=e238]:
                - generic [ref=e239]:
                  - generic [ref=e240]: Despesas
                  - img [ref=e241]
                - generic [ref=e244]:
                  - generic [ref=e245]: R$ 9.950,50
                  - paragraph [ref=e246]: Total gasto em Ano de 2026
            - link "Balanço -R$ 8.150,50 Receitas - Despesas em Ano de 2026" [ref=e247] [cursor=pointer]:
              - /url: /dashboard/financial
              - generic [ref=e248]:
                - generic [ref=e249]:
                  - generic [ref=e250]: Balanço
                  - img [ref=e251]
                - generic [ref=e254]:
                  - generic [ref=e255]: "-R$ 8.150,50"
                  - paragraph [ref=e256]: Receitas - Despesas em Ano de 2026
            - link "Contas a Receber R$ 5.850,00 Pendente ou em análise para Ano de 2026" [ref=e257] [cursor=pointer]:
              - /url: /dashboard/financial
              - generic [ref=e258]:
                - generic [ref=e259]:
                  - generic [ref=e260]: Contas a Receber
                  - img [ref=e261]
                - generic [ref=e264]:
                  - generic [ref=e265]: R$ 5.850,00
                  - paragraph [ref=e266]: Pendente ou em análise para Ano de 2026
          - generic [ref=e267]:
            - generic [ref=e268]:
              - generic [ref=e269]:
                - generic [ref=e270]: Status das Faturas
                - generic [ref=e271]: Distribuição de faturas no período selecionado.
              - generic [ref=e276]:
                - img [ref=e277]:
                  - generic [ref=e278]:
                    - generic [ref=e279]:
                      - img [ref=e281]
                      - img [ref=e283]
                      - img [ref=e285]
                    - generic [ref=e286]:
                      - generic [ref=e289]: 24%
                      - generic [ref=e291]: 53%
                      - generic [ref=e294]: 24%
                - generic [ref=e296]:
                  - generic [ref=e297]: Pendentes
                  - generic [ref=e299]: Vencidas
                  - generic [ref=e301]: Pagas
            - generic [ref=e303]:
              - generic [ref=e304]:
                - generic [ref=e305]: Composição das Despesas
                - generic [ref=e306]: Distribuição de custos do período selecionado.
              - generic [ref=e311]:
                - img [ref=e312]:
                  - generic [ref=e313]:
                    - generic [ref=e314]:
                      - img [ref=e316]
                      - img [ref=e318]
                      - img [ref=e320]
                      - img [ref=e322]
                    - generic [ref=e323]:
                      - generic [ref=e326]: 48%
                      - generic [ref=e329]: 12%
                      - generic [ref=e332]: 5%
                      - generic [ref=e335]: 35%
                - generic [ref=e337]:
                  - generic [ref=e338]: Outros
                  - generic [ref=e340]: Combustível
                  - generic [ref=e342]: Manutenção
                  - generic [ref=e344]: Salários
  - button [ref=e346] [cursor=pointer]:
    - img
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e352] [cursor=pointer]:
    - img [ref=e353]
  - alert [ref=e356]
```

# Test source

```ts
  144 |             const parentRow = page.locator('tr').filter({ hasText: `Pai ${mod.name}` }).first();
  145 |             await parentRow.getByRole('button', { name: /Revisar/i }).click({ force: true });
  146 |             
  147 |             await page.getByRole('spinbutton').fill(mod.value);
  148 |             
  149 |             // Selecionar uma rota real para garantir a geração do contrato
  150 |             await page.getByRole('combobox').nth(1).click({ force: true });
  151 |             await page.waitForTimeout(500);
  152 |             await page.getByRole('option').filter({ hasText: /Rota/i }).first().click({ force: true });
  153 |             await page.waitForTimeout(1000);
  154 | 
  155 |             // Clique no botão final de Aprovação via JS para bypass de viewport
  156 |             await page.evaluate(() => {
  157 |                 const buttons = Array.from(document.querySelectorAll('button'));
  158 |                 const btn = buttons.find(b => b.textContent?.includes('Aprovar'));
  159 |                 if (btn) btn.click();
  160 |             });
  161 |             
  162 |             // Aguardar feedback visual claro da aprovação
  163 |             await expect(page.locator('body')).toContainText('Aprovada', { timeout: 20000 });
  164 |             await page.waitForTimeout(2000); // Tempo para o "banco" persistir o usuário e o contrato
  165 | 
  166 |             console.log(`[${mod.name}] 3. Assinatura do Contrato pelo Pai`);
  167 |             await page.evaluate(() => { 
  168 |                 localStorage.removeItem('currentUser'); 
  169 |                 sessionStorage.clear(); 
  170 |             });
  171 |             await page.goto('/login', { waitUntil: 'domcontentloaded' });
  172 |             
  173 |             // Aguardar o form renderizar (Next.js isMounted effect delay fix)
  174 |             await page.waitForSelector('text="Selecione seu perfil:"', { state: 'visible', timeout: 15000 });
  175 |             
  176 |             // Usar getByText para maior resiliência ao invés de label[for=]
  177 |             await page.locator('div').filter({ hasText: /^Pais$/ }).first().click();
  178 |             await page.fill('input[placeholder*="000.000.000-00"]', parentCpf);
  179 |             await page.fill('input[placeholder="••••••"]', '123456');
  180 |             await page.getByRole('button', { name: /Entrar no Sistema/i }).click();
  181 |             
  182 |             await page.goto('/parent/contract', { waitUntil: 'domcontentloaded' });
  183 |             
  184 |             // Aguardar o contrato renderizar completamente
  185 |             await expect(page.getByRole('checkbox')).toBeVisible({ timeout: 15000 });
  186 |             
  187 |             // Verificar se o contrato já foi aceito (caso de renderização ultra-rápida ou estado persistido)
  188 |             const isSigned = await page.getByText('Compartilhar Assinado').isVisible();
  189 |             
  190 |             if (!isSigned) {
  191 |                 console.log(`[${mod.name}] Assinando contrato...`);
  192 |                 // Marcar o checkbox de aceite (agora nativo para estabilidade)
  193 |                 await page.evaluate(() => {
  194 |                     const cb = document.getElementById('terms') as HTMLInputElement;
  195 |                     if (cb) {
  196 |                         cb.checked = true;
  197 |                         cb.dispatchEvent(new Event('change', { bubbles: true }));
  198 |                         cb.dispatchEvent(new Event('click', { bubbles: true }));
  199 |                     }
  200 |                 });
  201 |                 await page.waitForTimeout(500);
  202 | 
  203 |                 // Clique no botão de Aceite
  204 |                 const btnAceitar = page.getByRole('button', { name: /ACEITAR CONTRATO/i });
  205 |                 await btnAceitar.click({ force: true });
  206 |             } else {
  207 |                 console.log(`[${mod.name}] Contrato já consta como assinado.`);
  208 |             }
  209 | 
  210 |             await page.waitForTimeout(1000);
  211 |             
  212 |             // Verificação flexível de sucesso
  213 |             await expect(page.locator('body')).toContainText(/Contrato Aceito|Assinado/i);
  214 | 
  215 |             console.log(`[${mod.name}] 4. Validação Financeira Final`);
  216 |             await page.evaluate(() => { 
  217 |                 localStorage.removeItem('currentUser'); 
  218 |                 sessionStorage.clear(); 
  219 |             });
  220 |             await page.goto('/login', { waitUntil: 'domcontentloaded' });
  221 |             
  222 |             // Aguardar o form renderizar (Next.js isMounted effect delay fix)
  223 |             await page.waitForSelector('text="Selecione seu perfil:"', { state: 'visible', timeout: 15000 });
  224 |             
  225 |             await page.locator('div').filter({ hasText: /^Gestor$/ }).first().click();
  226 |             await page.locator('input[placeholder*="email@exemplo.com"]').fill(gestorEmail);
  227 |             await page.locator('input[type="password"]').fill('123456'); 
  228 |             await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  229 |             
  230 |             // Aguarda o login redirecionar para o dashboard primeiro
  231 |             try {
  232 |                 await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  233 |             } catch (e) {
  234 |                 console.log("[DEBUG] Login redirect timed out, forcing navigation...");
  235 |                 await page.evaluate(() => { window.location.href = '/dashboard'; });
  236 |             }
  237 | 
  238 |             // Aguarda o dashboard principal carregar antes de pular para o financeiro
  239 |             await expect(page.getByRole('button', { name: /Convidar Pais/i }).first()).toBeVisible({ timeout: 15000 });
  240 |             await page.waitForTimeout(2000);
  241 |             
  242 |             // Navegar para o financeiro via clique no menu lateral (Isso usará o Router do Next.js e evitará hard reloads)
  243 |             const btnFinanceiro = page.getByRole('link', { name: 'Controle Financeiro' }).first();
> 244 |             await btnFinanceiro.click({ force: true });
      |                                 ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  245 |             
  246 |             // Confirma rendering da página destino (aguarda o heading aparecer)
  247 |             await expect(page.getByRole('heading', { name: 'Financeiro' }).first()).toBeVisible({ timeout: 30000 });
  248 |             
  249 |             // Verifica o box do Total Geral ou Fatura
  250 |             await expect(page.locator('body')).toContainText(`R$ ${mod.value},00`, { timeout: 15000 });
  251 | 
  252 |             console.log(`[${mod.name}] SUCESSO TOTAL.`);
  253 |         });
  254 |     }
  255 | });
  256 | 
```