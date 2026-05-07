# 🎯 Estratégia de Onboarding e Captação (Pós-MVP)

> **Contexto:** Este documento armazena o planejamento estratégico de "User Onboarding" para a fase em que o Guardian for aberto para o mercado (Go-Live). O objetivo é garantir que motoristas leigos (autônomos) consigam configurar o sistema sozinhos com Fricção Zero.

---

## 1. O Problema a Ser Resolvido
O mercado de transporte escolar possui um baixo nível de letramento digital. Jogar o motorista direto em um *Dashboard* complexo causa frustração e abandono do app. Precisamos pegar na mão do usuário através de um **Assistente de Configuração (Wizard)** focado em etapas curtas.

## 2. A Solução: Onboarding Adaptativo

A primeira pergunta que o sistema deve fazer ao novo usuário é:
**"Você é Dono de Frota ou Motorista Autônomo?"**
*Isso definirá o comportamento de toda a plataforma.*

### 2.1 Fluxo do Motorista Autônomo (90% do Público)
O motorista autônomo dirige a própria van e cuida das próprias cobranças. O sistema se "encolhe" para não mostrar a complexidade de gestão de funcionários.

*   **Passo 1 (Financeiro):** Preenche a Chave Pix (para onde vai o dinheiro das mensalidades).
*   **Passo 2 (Veículo):** Insere a placa e o modelo da sua única Van.
*   **Passo 3 (Escolas):** Busca e seleciona as escolas que ele atende na região.
*   **Passo 4 (Rotas "Esqueleto"):** Cria apenas os turnos (Ex: Rota Manhã, Rota Tarde). O sistema automaticamente o vincula como motorista da sua própria Van.
*   **Passo 5 (Contrato):** Define o Valor Base da mensalidade e a Data de Vencimento padrão.
*   **Passo 6 (Magic Link):** A "Hora da Mágica". O sistema gera um Link/QR Code para o motorista enviar no WhatsApp dos pais.

### 2.2 A Mágica do Auto-Serviço e Contrato Automático
O motorista não digita dados de alunos. O processo se inverte:
1. O pai clica no **Magic Link** recebido no WhatsApp.
2. O pai preenche os dados do aluno, endereço e escolhe o turno ("Rota Manhã").
3. O Motorista Autônomo recebe um alerta: *"Novo aluno pendente na Rota Manhã"*.
4. O Motorista clica em **"Aprovar"**.
5. **Automação:** O sistema preenche o modelo de contrato padrão, joga o valor configurado no Passo 5, transforma num PDF virtual e avisa o pai para assinar digitalmente. 
6. O financeiro do pai é ativado automaticamente via Pix.

## 3. O Tour Operacional (A Primeira Viagem)
Enquanto o fluxo acima configura o "negócio", precisamos treinar a "direção". 
No primeiro acesso à tela de Mapa/Viagem, o sistema não deve deixar o motorista perdido.

Implementar uma biblioteca de *Guided Tour* (ex: `react-joyride`) que joga um holofote na tela:
1. 💡 *Holofote no botão Iniciar:* "Toque aqui para começar sua viagem."
2. 💡 *Holofote no Aluno:* "Joãozinho embarcou? Arraste para a direita."
3. 💡 *Holofote na Falta:* "Ele não apareceu? Arraste para a esquerda. O sistema avisa a mãe e recalcula a sua rota sozinho."

## 4. Próximos Passos (Para a Fase de Desenvolvimento)
Quando o MVP for validado comercialmente, os desenvolvedores devem priorizar:
- [ ] Construção do componente de Wizard (Telas de bloqueio inicial).
- [ ] Integração do Magic Link com o Firebase para salvar aprovações em tempo real.
- [ ] Geração do arquivo em PDF do contrato com marca d'água de aceite digital.
- [ ] Implementação de dicas visuais na interface do motorista.
