---
trigger: always_on
---

# 🛡️ PRODUCTION DEPLOYMENT & SCOPE GOVERNANCE RULES

> **MANDATÓRIO / P0 (NÃO NEGOCIÁVEL)**: Estas regras regem qualquer atividade de desenvolvimento, alteração de código e procedimentos de subida para produção no ecossistema Guardian.

---

## 🔒 REGRA 1: BACKUP OBRIGATÓRIO PRÉ-DEPLOY
> **Nenhuma versão sobe para produção sem backup prévio e validado.**

1. **Backup de Estado e Banco de Dados**: Antes de qualquer deploy, executar snapshot dos dados operacionais e arquivar em pasta versionada (`backups/pre-deploy-[timestamp]/`).
2. **Snapshot de Configurações**: Preservar cópia de segurança de arquivos de configuração de ambiente (`.env.production`, regras de segurança, índices de banco).
3. **Ponto de Restauração no Git**: Criar tag ou commit de referência pré-release para possibilitar reversão imediata (`git tag rollback-[timestamp]`).
4. **Verificação de Integridade**: Confirmar que o backup foi gerado com sucesso antes de prosseguir com qualquer ordem de deploy.

---

## 🧪 REGRA 2: VALIDAÇÃO INTEGRAL E TESTES OBRIGATÓRIOS
> **Nenhum deploy é autorizado com testes pendentes ou relatórios com falhas.**

Antes de qualquer subida para produção, o pipeline de verificação obrigatório deve ser executado com **100% de aprovação**:

1. **Suíte de Validação Completa**: Executar `npm run validate:report` garantindo que **todos os 48 cenários (100 passos)** passem com código 0.
2. **Checagem Estrita de Tipos**: Executar `npx tsc --noEmit` garantindo **zero erros de TypeScript** no projeto todo.
3. **Compilação de Produção**: Executar `npm run build` garantindo que o build Next.js finalize com sucesso sem erros de rota.
4. **Relatório HTML**: Gerar e validar o relatório `reports/guardian-test-report.html` com status 100% verde em todas as 6 suítes (Gestor, Motorista, Monitor, Pai, Planejamento, Regressão & Segurança).

---

## 🚫 REGRA 3: ESCOPO BLINDADO (PROIBIÇÃO DE FUNCIONALIDADES NÃO AUTORIZADAS)
> **NUNCA criar ou alterar funcionalidades sem autorização expressa do usuário.**

1. **Proibição Total de Scope Creep**: Não adicionar botões, telas, campos, fluxos ou lógicas adicionais que não tenham sido explicitamente solicitadas pelo usuário.
2. **Protocolo de Sugestão**: Se a IA identificar uma melhoria, oportunidade técnica ou necessidade de refatoração, deve **apenas propor e perguntar** ("Podemos implementar X para resolver Y?"), **NUNCA** implementar por iniciativa própria.
3. **Aderência Estrita ao Requisito**: Executar com precisão cirúrgica exatamente o que foi solicitado.

---

## 🛑 REGRA 4: GATE DE APROVAÇÃO HUMANA PARA DEPLOY (ZERO AUTO-DEPLOY)
> **O deploy em produção NUNCA pode ser executado de forma automática ou autônoma pela IA.**

1. **Stop Gate Obrigatório**: Ao concluir testes e backups, a IA DEVE parar a execução e apresentar o checklist consolidado:
   - Confirmação do Backup realizado;
   - Resultado dos Testes (`100% PASS`);
   - Resumo das alterações incluídas no release.
2. **Pergunta Explícita de Autorização**: A IA deve formular a pergunta direta:
   > *"Todos os testes passaram e o backup foi realizado. Você autoriza a subida para produção agora?"*
3. **Aguardar Confirmação**: É expressamente proibido disparar comandos de deploy (ex: Vercel deploy, Firebase deploy, Docker push, scripts de servidor) sem o comando afirmativo e nominal do usuário (ex: "sim", "autorizado", "pode subir").
