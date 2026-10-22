import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { AuthController } from '../core/action-controllers';

export async function runAuthSuite() {
  await runner.suite('Autenticação & Controle de Acesso', 'AUT', async () => {

    // CENÁRIO 1: Login com CPF com Máscara e PIN Válido de Motorista
    await runner.scenario('AUT-01', 'Login Real com CPF Formatado e PIN Válido (Perfil Motorista)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      await runner.step('Submeter formulário com CPF "222.222.222-22" e PIN "111111" para Motorista', () => {
        const result = auth.submitLogin('222.222.222-22', '111111', 'motorista');
        expect(result.success).toBe(true, 'Login deveria ter sido aprovado');
        expect(result.data.profile).toBe('motorista');
        expect(result.redirectUrl).toBe('/driver/route-plan', 'Deveria redirecionar para a tela da rota');
      });

      await runner.step('Verificar persistência de sessão do usuário autenticado', () => {
        const sessionUserId = auth.getSessionItem('mockUserId');
        expect(sessionUserId).toBeDefined();
        expect(sessionUserId).toContain('user-motorista');
      });
    });

    // CENÁRIO 2: Login com CPF Sem Máscara e Normalização Automática
    await runner.scenario('AUT-02', 'Login com CPF Desmascarado e Auto-Sanitização (Perfil Gestor)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      await runner.step('Submeter formulário com apenas números "11111111111" e senha válida', () => {
        const result = auth.submitLogin('11111111111', '123456', 'gestor');
        expect(result.success).toBe(true, 'CPF sem máscara deve ser aceito');
        expect(result.data.profile).toBe('gestor');
        expect(result.redirectUrl).toBe('/dashboard', 'Gestor deve ser direcionado ao painel geral');
      });
    });

    // CENÁRIO 3: Rejeição com Feedback Amigável para Senha Incorreta
    await runner.scenario('AUT-03', 'Bloqueio Imediato com Feedback Amigável para Senha/PIN Incorreto', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      await runner.step('Submeter CPF válido com senha errada "000000"', () => {
        const result = auth.submitLogin('222.222.222-22', '000000', 'motorista');
        expect(result.success).toBe(false, 'Login com senha errada deve ser rejeitado');
        expect(result.message).toContain('Credenciais inválidas');
        expect(result.toasts?.[0]?.variant).toBe('destructive');
      });

      await runner.step('Garantir que nenhuma sessão foi gravada após falha de senha', () => {
        expect(auth.getSessionItem('mockUserId')).toBeNull();
      });
    });

    // CENÁRIO 4: Rejeição para CPF Inexistente ou Não Cadastrado
    await runner.scenario('AUT-04', 'Bloqueio de Acesso para Usuário Não Cadastrado', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      await runner.step('Submeter CPF inexistente "999.999.999-99"', () => {
        const result = auth.submitLogin('999.999.999-99', '123456', 'gestor');
        expect(result.success).toBe(false, 'CPF não cadastrado deve ser bloqueado');
      });
    });

    // CENÁRIO 5: Roteamento Estrito para os 4 Perfis do Sistema
    await runner.scenario('AUT-05', 'Garantia de Roteamento Estrito para os 4 Perfis Oficiais', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      await runner.step('Gestor é direcionado ao Painel Geral (/dashboard)', () => {
        const res = auth.submitLogin('111.111.111-11', '123456', 'gestor');
        expect(res.redirectUrl).toBe('/dashboard');
      });

      await runner.step('Motorista é direcionado ao Itinerário Operacional (/driver/route-plan)', () => {
        const res = auth.submitLogin('222.222.222-22', '111111', 'motorista');
        expect(res.redirectUrl).toBe('/driver/route-plan');
      });

      await runner.step('Pai/Família é direcionado ao Rastreamento do Filho (/parent/tracking)', () => {
        const res = auth.submitLogin('333.333.333-33', '000000', 'pai');
        expect(res.success).toBe(true, 'Login do pai deveria ser aprovado');
        expect(res.redirectUrl).toBe('/parent/tracking');
      });

      await runner.step('Monitor é direcionado à Chamada Digital da Van (/monitor)', () => {
        const res = auth.submitLogin('123.456.789-00', '123123', 'monitor');
        expect(res.success).toBe(true, 'Login do monitor deveria ser aprovado');
        expect(res.redirectUrl).toBe('/monitor');
      });
    });

    // CENÁRIO 6: Logout e Limpeza Segura de Sessão
    await runner.scenario('AUT-06', 'Encerramento de Sessão e Limpeza de Credenciais em 1 Toque', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const auth = new AuthController(state);

      // Login prévio
      auth.submitLogin('222.222.222-22', '111111', 'motorista');
      expect(auth.getSessionItem('mockUserId')).toBeDefined();

      await runner.step('Executar ação de Logout', () => {
        auth.logout();
        expect(auth.getSessionItem('mockUserId')).toBeNull();
      });
    });

  });
}
