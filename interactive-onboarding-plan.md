# Plano de Implementação: Assistente de Onboarding Interativo (Trilho de Trem)

## Goal
Implementar um Assistente Virtual de Onboarding Interativo adaptativo para os perfis **Gestor de Frota** e **Motorista Autônomo**, que guia o usuário na configuração inicial do sistema passo a passo, utilizando balões flutuantes premium (Glassmorphism + Glow) e transições contínuas automáticas entre telas, finalizando com o descarte do checklist ao atingir 100% de progresso.

---

## Tasks

- [x] **Task 1: Instalação e Preparação da Dependência**
  - Instalar a biblioteca de tours interativos `react-joyride` no projeto para gerenciar o posicionamento automático dos tooltips nas telas.
  - → **Verify**: Executar `npm list react-joyride` e confirmar a instalação bem-sucedida.

- [x] **Task 2: Modelagem do Estado e Persistência do Progresso**
  - Adicionar as propriedades `onboardingCompleted` (boolean) e `onboardingStep` (number) no perfil do usuário no Firestore (coleção `users`) e sincronizar com o `localStorage` do navegador para controle local offline reativo.
  - → **Verify**: Alterar os valores no localStorage via console e confirmar que o app reconhece o estado do onboarding atualizado ao recarregar.

- [x] **Task 3: Configuração dos Roteiros de Passos (Steps Config)**
  - Criar o arquivo `src/components/dashboard/onboarding-steps.ts` definindo os arrays de passos exclusivos para cada perfil:
    - **Gestor**: Perfil da Empresa (`#menu-empresa`), Veículos (`#menu-veiculos`), Equipe (`#menu-equipe`), Rotas (`#menu-rotas`).
    - **Autônomo**: Minha Única Van (`#menu-minha-van`), Escolas Atendidas (`#menu-escolas`), Compartilhar Link (`#btn-share-link`).
  - → **Verify**: Executar `npm run typecheck` para atestar que os objetos de passos seguem rigorosamente a tipagem de tipos do Joyride.

- [x] **Task 4: Estilização do Balão Premium (Linear Glassmorphism + Glow)**
  - Configurar as propriedades de renderização e CSS personalizado em `src/styles/onboarding.css` para aplicar o estilo **Linear**: fundo translúcido (`backdrop-blur-md bg-background/80`), bordas brilhantes com gradientes pulsantes neon e tipografia moderna.
  - → **Verify**: Abrir o protótipo localmente e auditar visualmente a elegância e fluidez dos balões.

- [x] **Task 5: Implementação das Transições de Ida e Volta (Trilho de Trem - Gestor)**
  - Configurar o controller do Tour para capturar o clique em "Cadastrar" no balão do passo. O assistente realiza o redirecionamento automático via roteador Next.js (`router.push`), mantendo o foco do balão ativo no formulário de destino. Após salvar o cadastro, redireciona o usuário automaticamente de volta para a próxima etapa.
  - → **Verify**: Testar o fluxo do Gestor na simulação e atestar a navegação contínua perfeita de ida e volta sem ações manuais extras.

- [x] **Task 6: Implementação do Fluxo Simplificado do Autônomo**
  - Integrar os 3 passos simplificados e contínuos diretamente na interface mobile simplificada do motorista autônomo (`/driver`).
  - → **Verify**: Rodar a simulação como Autônomo e validar a fluidez dos balões no ambiente responsivo móvel.

- [x] **Task 7: Integração com o Card "Status do Setup" e Descarte de 100%**
  - Conectar o progresso das tarefas do assistente ao checklist do card `Status do Setup` existente. Assim que todas as tarefas forem validadas pelo banco (`schools.length > 0 && vehicles.length > 0`, etc.), acionar uma comemoração visual e **ocultar permanentemente** o card de setup do Dashboard do usuário.
  - → **Verify**: Completar o ciclo de tarefas em homologação e conferir se o card do setup desapareceu completamente, exibindo o Dashboard limpo.

- [x] **Task 8: Build e Validação de Produção**
  - Executar a compilação completa para verificar se não há regressões ou lentidões.
  - → **Verify**: Executar `npm run build` com sucesso.

---

## Done When
- [x] O assistente detecta dinamicamente se o usuário é Gestor ou Autônomo e carrega o roteiro de balões correspondente.
- [x] O usuário consegue concluir ou pular o tour a qualquer momento, salvando sua decisão de forma persistente.
- [x] As telas realizam transições de ida e volta automáticas integradas com o preenchimento de formulários (Trilho de Trem).
- [x] O card de progresso "Status do Setup" é atualizado de forma dinâmica e desaparece permanentemente do Dashboard após atingir 100% de conclusão.
- [x] A build de produção é gerada com sucesso sem erros de TypeScript ou Lint.

---

## Notes
- O uso de seletores CSS estáveis (`id="menu-empresa"`, etc.) nos links laterais da sidebar e nos botões é mandatório para que o Joyride encontre os alvos de forma confiável.
- As regras de privacidade do Firestore já foram configuradas para aceitar atualizações de progresso do usuário logado na coleção `users`.
