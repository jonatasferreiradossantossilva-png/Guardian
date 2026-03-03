# Guardian - Inteligência para Transporte Escolar

O Guardian é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa e Telemetria de alta precisão para otimizar frotas, reduzir custos e aumentar a segurança.

## 🚀 Funcionalidades por Módulo

### 1. Camada de Inteligência Artificial (Genkit + Gemini)
- **OCR de Documentos:** Extração automática de dados de RG e CNH para cadastro instantâneo de pais e responsáveis.
- **Busca Semântica de Escolas:** Base proprietária com mais de 190.000 instituições (INEP), permitindo o preenchimento de endereço e GPS em 1 clique.
- **Otimização de Rota Híbrida:** Algoritmo que decide a sequência lógica de paradas baseando-se em regras de negócio e posição atual do GPS.
- **Sumarização de Incidentes:** IA que resume relatos de trânsito ou perigos enviados pelos motoristas para o gestor.

### 2. Painel do Gestor (Dashboard Administrativo)
- **Prova de ROI:** Comparativo visual entre KM Planejado (IA) vs. KM Real (GPS), calculando economia real de combustível e redução de CO2.
- **Saúde da Frota:** Alertas de manutenção preventiva baseados no odômetro real capturado via telemetria.
- **Gestão Financeira:** Faturamento automatizado, controle de inadimplência e simulação de pagamentos via Pix com confirmação inteligente.
- **Triagem de Solicitações:** Área para revisar e aprovar cadastros feitos por pais via link público com busca automática de coordenadas.
- **Contratos Digitais:** Geração automática de contratos personalizados com variáveis dinâmicas e assinatura digital.

### 3. App do Motorista / Monitor (Operacional)
- **Início de Viagem Inteligente:** Captura posição GPS atual e re-otimiza a rota instantaneamente para o motorista.
- **Auto-Cura (Continuous Optimization):** A cada parada concluída, a IA recalcula o melhor caminho para as paradas restantes com base no trânsito.
- **Check-in por QR Code:** Validação de embarque/desembarque via scanner visual com foto do aluno para identificação segura.
- **Alertas de Saúde Críticos:** Badges pulsantes no momento do embarque para alunos com condições médicas especiais.
- **Modo Offline:** Funcionamento total sem internet, com sincronização automática de telemetria ao recuperar sinal.

### 4. App dos Pais (Segurança Contextual)
- **Rastreamento em Tempo Real:** Visualização da van em um mapa dinâmico com previsão de chegada (ETA).
- **Alerta de Proximidade (800m):** Notificação push inteligente apenas quando a van entra no raio crítico da residência, economizando bateria.
- **Gestão Multi-filhos:** Controle de todos os filhos em uma única tela, com herança de dados para novos cadastros (mesmo endereço/responsável).
- **Comunicado de Ausência:** Aviso imediato ao motorista em caso de falta do aluno, permitindo a re-otimização da rota.
- **Assinatura de Contrato:** Visualização e aceite jurídico do contrato de serviço diretamente pelo app.

### 5. Onboarding e Crescimento
- **Jornada de 17 Passos:** Guia visual interativo com prints reais que ensina o uso do sistema do convite ao contrato.
- **Página de Cadastro Público:** Link exclusivo (/register) para convidar pais, com fluxo de cadastro zero fricção via IA.

## 🛠️ Arquitetura Técnica
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
- **Componentes:** ShadCN UI (Radix UI).
- **Backend:** Firebase Firestore (Tempo real) e Firebase Auth.
- **IA:** Google Genkit com Gemini 1.5 Flash.
- **Mapas:** Google Maps API (Visualização) e Geoapify (Roteirização Custo Zero).

---
*Guardian - A jornada do seu filho, protegida em tempo real.*