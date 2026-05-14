# Planejamento da Tela de Manifesto Diário (Route Planning)

## Fase 1: Análise e Requisitos (Concluído)
**Objetivo:** Permitir que o gestor de frota planeje dinamicamente as viagens (corridas) de cada van para o dia atual, resolvendo exceções (alunos avulsos, trocas de van, ausências e quebras de veículos) sem corromper a rota padrão do autônomo.

**Descobertas do Socratic Gate:**
1. **Agrupamento por Turno:** A viagem não é fatiada em horários restritos de "bate-volta". O motorista aguarda a saída de todos os alunos do turno e faz uma única viagem otimizada. Os horários servem apenas como referência para o gestor agrupar os alunos.
2. **Exceções Diárias:** Modificações feitas no painel valem apenas para o "hoje". 
3. **Inteligência Sutil:** O sistema deve contar quantas vezes um aluno foi movido temporariamente. Ao atingir 5 vezes, sugere a troca definitiva de Rota/Van.
4. **Alunos Avulsos e Faltas:** Alunos com viagem avulsa aprovada para hoje caem numa lista de "Pendentes". Alunos com falta avisada via app (ausente_ida ou ausente_volta) aparecem riscados ou inativos no planejamento do turno correspondente.
5. **Ações em Lote:** O gestor precisa conseguir selecionar múltiplos alunos (checkbox) para transferi-los em massa (ex: no caso de quebra de uma Van).

---

## Fase 2: Arquitetura de Dados (Planejamento)

Para não criarmos uma complexidade gigantesca com novas coleções (`daily_trips`, `manifests`, etc.), a solução mais elegante para manter compatibilidade com o app do motorista atual é **Evoluir a entidade `Route`**:

**Mudanças no Modelo de Dados (`src/types/mock-data.ts`):**
1. **Entidade `Route`:**
   - Adicionar `baseStudentIds: string[]` (A rota original, fixa).
   - Manter `studentIds: string[]` (A rota "do dia". Todo dia à meia-noite ou ao resetar a rota, copiamos o `baseStudentIds` para o `studentIds`).
2. **Entidade `Student`:**
   - Adicionar `temporaryMovesCount: number` (Soma +1 toda vez que ele for inserido num `studentIds` diferente do seu `baseRoute`).

---

## Fase 3: Design da Solução e UX (Solutioning)

**Interface da Tela (Painel do Gestor):**
- **Filtros Globais:** Turno (Manhã / Tarde / Integral) e Direção (Ida / Volta).
- **Área Esquerda (Balde de Pendentes):**
  - Lista de alunos de "Viagens Avulsas" marcadas para a data atual.
  - Alunos que, por algum motivo, ficaram sem van alocada (orfãos).
- **Área Central/Direita (Cards das Vans/Rotas):**
  - Cada Rota/Van é um "Quadro" (Kanban/Lista).
  - Cada quadro lista os alunos do dia (`studentIds`).
  - Alunos cujo `status` seja `ausente_ida` ou `ausente_volta` (dependendo do filtro) aparecem com opacidade reduzida e ícone de 🚫 Falta.
- **Interações (Ações):**
  - Checkboxes em cada aluno.
  - Botão no cabeçalho do Quadro: "Mover Selecionados..." (Abre modal para escolher a Van de destino).
  - Drag & Drop (opcional para v2, focaremos no checkbox primeiro para garantir produtividade no mobile/tablet).
- **Notificação Inteligente (Toast):** Ao mover um aluno e o `temporaryMovesCount` atingir 5, exibir: *"Joãozinho foi movido de rota 5 vezes. Deseja definir a [Nome da Van Atual] como van padrão dele?"*.

---

## Fase 4: Plano de Implementação (Passo a Passo)

1. **Atualização de Tipos e Mock:** Atualizar `Route` e `Student` no `mock-data.ts`.
2. **Criação do Serviço/Hooks (`use-route-planner.tsx`):**
   - Função `moveStudents(studentIds, sourceRouteId, targetRouteId)`.
   - Função `assignPending(studentId, targetRouteId)`.
   - Lógica do contador `temporaryMovesCount`.
3. **Criação da Interface UI (`RoutePlannerScreen`):**
   - Layout responsivo com Tailwind e `radix-ui`.
   - Implementar os filtros de Turno e Direção.
   - Implementar o componente `PendingBucket`.
   - Implementar os `RouteCards` com a lista de alunos e checkboxes.
4. **Integração:** Conectar a tela ao roteamento do Next.js (ex: `/dashboard/planning`).
5. **Revisão Final:** Auditoria UX e garantia de que o app do motorista continua funcionando com a lista `studentIds` (agora manipulada pelo planner).
