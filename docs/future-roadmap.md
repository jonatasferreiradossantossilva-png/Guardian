# 🚀 VanGuardian - Roadmap de Melhorias Futuras (V2 e V3)

> *Este documento é exclusivo para a equipe de desenvolvimento e gestão. Ele não faz parte do código do aplicativo final e serve como um "Cofre de Ideias" para funcionalidades estratégicas pós-lançamento.*

---

## 📅 Marco: 3 Meses Pós-Lançamento (Avaliação de Comportamento)

A missão dos primeiros 3 meses (V1) é garantir que os pais instalem o App e criem o hábito de acompanhar a van pelo mapa, entendendo o valor do serviço e a segurança que ele traz.

Quando a dependência do aplicativo estiver consolidada, usaremos o histórico real de telemetria acumulado para justificar a **V2**.

### 💼 Projeto: "Seguro Fatura" & Gestão Comportamental

**Problema que resolve:** Pais que deixam a van esperando na porta, não comunicam faltas e geram perda de tempo e combustível para os motoristas.

**Como vai funcionar (SLA e Multas):**
1.  **Contratos Digitais Integrados:** Os pais passarão a assinar renovações e Termos de Uso diretamente pelo App Guardian.
2.  **O Gatilho:** Ficará estipulado em contrato que o pai DEVE avisar ausências pelo botão "Meu filho não vai" no app, com até 1 hora de antecedência.
3.  **A Auditoria (Intocável):** Como o Guardian salva um log de localização ("Caixa Preta") toda vez que o botão "Ausente" é apertado pelo motorista, teremos provas geográficas e de horário de que o motorista de fato perdeu viagem.
4.  **A Multa Automática:** O sistema aceita, por exemplo, até 2 "deslocamentos inúteis" no mês. A partir do 3º, a plataforma joga via banco de dados uma **Taxa de Deslocamento Indevido (Ex: R$ 15,00)** diretamente na fatura mensal (módulo financeiro), eliminando o desgaste do gestor ter que brigar com o cliente.

### 🗺️ Projeto: "Guardian Heatmap" (Mapeamento de Restrições por Histórico)

**Problema que resolve:** Motoristas iniciantes ou otimizadores automáticos ignoram que determinada avenida sempre trava às 07:00, ou que o bairro "X" é perigoso após o pôr do sol.

**Como vai funcionar (IA de Roteamento Preditivo):**
1.  **A Mina de Ouro dos 3 Meses:** O motor de Telemetria que implementamos na V1 gravará silenciosamente o "tempo real" vs "tempo estimado" de todos os trajetos da frota dia após dia.
2.  **Identificação de Zonas Mortas:** A IA vai cruzar os dados de paradas com `delay` constante e criar um **Mapa de Calor (Heatmap) de Trânsito ou de Insegurança**.
3.  **Desvio Automático (Avoidance):** O nosso algoritmo de IA (Geoapify + Lógica Neural) vai receber um novo parâmetro: `avoidPolygons`.
4.  **Sugestão Inteligente:** Quando você for desenhar a rota para o próximo ano, o Guardian emitirá um alerta: *"Atenção: A Avenida X teve um atraso médio de 32 minutos nos últimos 3 meses. Deseja configurar este quadrante como 'Rota Evitada' (Blacklist) entre 06h e 08h?"* Isso preserva o tempo da viagem de 40 alunos por causa do longo engarrafamento de ruas isoladas.

---

## 📅 Marco: V2 / V3 - Expansão e Escala

### 🛰️ Projeto: "Gestão de Vagas 2.0" (Marketplace & Auto-Serviço)

**Problema que resolve:** O conflito entre a operação de dirigir (Driver) e a necessidade administrativa de gerenciar vagas, aprovações e novos contratos em tempo real.

**Como vai funcionar (Separação de Preocupações):**
1.  **Marketplace para Pais:** Uma área pública/semi-privada no App dos Pais onde eles podem ver rotas que atendem a escola de seus filhos e o status de "Vagas Disponíveis".
2.  **Solicitação de Vaga (Lead Generation):** O próprio pai inicia o processo, preenchendo os dados do aluno e endereço. Isso elimina erros de digitação manual pelo motorista.
3.  **Painel Administrativo (Desktop):** Um ambiente focado em "Business" (Gestão de Vagas) separado do "Operational" (GPS/Dashboard da Van). O motorista/gestor aprova novos alunos com calma, visualizando o impacto na rota antes de confirmar.
4.  **Assinatura Digital Integrada:** O processo de ocupação da vaga já gera o contrato digital para aceite do pai, automatizando o jurídico e o financeiro em um único fluxo.

---

---

## 🔄 Outras Ideias na Geladeira

### 1. Gamificação de Eco-Driving
*   Baseado no histórico do GPS (frenagens bruscas e excessos de velocidade simulados pelo tempo de percurso), gerar um "Score de Bom Motorista" onde motoristas prudentes ganham destaque no perfil da empresa.

### 3. Integração com Catracas de Escola (API Externa)
*   Sincronizar o aviso de "A criança entrou na escola" do Guardian com uma possível API de controle de acesso da própria escola (reduzindo passivo e dividindo responsabilidade escolar).

---

## 🏛️ Marco: Expansão B2G (Venda para Prefeituras e PNATE)

**Problema que resolve:** Prefeituras terceirizam o transporte rural/urbano e perdem milhões pagando quilometragens fraudadas, além de não terem controle real de quem embarcou no ônibus.

**Como vai funcionar (Auditoria e Controle Público):**
1. **Módulo "Gestor Público":** Um dashboard macro para o Secretário de Educação ver o mapa em tempo real de todas as vans licitadas da cidade.
2. **Auditoria de KM (Anti-Fraude):** Cruzamento automático do KM da Rota Planejada (Licitação) vs. KM Real executado (Telemetria do Guardian). A prefeitura paga apenas pelo que foi rodado, gerando economia suficiente para pagar o próprio software no primeiro mês.
3. **Censo Escolar em Tempo Real:** A lista de presença digital (feita pelo motorista no embarque) alimenta diretamente a secretaria de educação para garantir o repasse de verbas federais do PNATE, comprovando o uso do aluno.
4. **Desativação Financeira:** Como o transporte é gratuito, o módulo de cobrança via Pix e mensalidades é desativado neste modelo, tornando a interface focada 100% em rotas, manutenção de veículos e presença.
