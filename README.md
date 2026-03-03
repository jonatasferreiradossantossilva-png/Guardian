# Guardian - Inteligência para Transporte Escolar

O Guardian é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa e Roteirização Híbrida para otimizar frotas, reduzir custos e aumentar a segurança.

## 🚀 Funcionalidades por Módulo

### 1. Camada de Inteligência Artificial (Genkit + Gemini)
- **OCR de Documentos:** Extração automática de dados de RG e CNH para cadastro instantâneo de pais e responsáveis.
- **Busca Semântica de Escolas:** Base proprietária com mais de 190.000 instituições (INEP), permitindo o preenchimento de endereço e GPS em 1 clique.
- **Otimização de Rota:** Algoritmo que decide a sequência lógica de paradas baseando-se em regras de negócio (ex: coletar todos antes de descarregar).
- **Sumarização de Incidentes:** IA que resume relatos de trânsito ou problemas enviados pelos motoristas para o gestor.

### 2. Painel do Gestor (Dashboard Administrativo)
- **Prova de ROI:** Comparativo visual entre KM Planejado (IA) vs. KM Real (GPS), calculando economia de combustível e redução de emissão de CO2.
- **Saúde da Frota:** Alertas de manutenção preventiva baseados no odômetro real capturado via GPS.
- **Gestão Financeira:** Faturamento automatizado, controle de inadimplência, fluxo de caixa e simulação de pagamentos via Pix.
- **Triagem de Solicitações:** Área para revisar e aprovar cadastros feitos por pais via link público.
- **Central de Mensagens:** Chat centralizado com motoristas, monitores e pais com modelos de mensagens rápidas.
- **Contratos Digitais:** Criação de modelos e geração de contratos personalizados com variáveis inteligentes.

### 3. App do Motorista / Monitor (Operacional)
- **Início de Viagem Inteligente:** Captura posição GPS atual e re-otimiza a rota instantaneamente.
- **Auto-Cura (Continuous Optimization):** A cada parada concluída, a IA recalcula o melhor caminho para as paradas restantes.
- **Check-in por QR Code:** Validação de embarque/desembarque via scanner ou checklist visual com foto do aluno.
- **Modo Offline:** Funcionamento total sem internet, com sincronização automática de dados de telemetria ao recuperar conexão.
- **Relato de Incidentes:** Envio de alertas de trânsito ou perigo com localização exata.

### 4. App dos Pais (Segurança Contextual)
- **Rastreamento em Tempo Real:** Visualização da van em um mapa dinâmico com telemetria fluida.
- **Alerta de Proximidade (800m):** Notificação inteligente quando a van entra no raio crítico da residência, economizando bateria do celular.
- **Gestão Multi-filhos:** Controle de todos os filhos em uma única tela, com herança de dados para novos cadastros (mesmo endereço/responsável).
- **Assinatura de Contrato:** Visualização e aceite jurídico do contrato de serviço diretamente pelo app.
- **Hub de Pagamentos:** Histórico de faturas, geração de QR Code Pix e envio de comprovantes.
- **Pessoas Autorizadas:** Cadastro de fotos e documentos de terceiros autorizados a retirar o aluno.

### 5. Onboarding e Crescimento
- **Jornada de 17 Passos:** Guia visual interativo com prints reais que ensina o uso do sistema do convite ao contrato.
- **Página de Cadastro Público:** Link exclusivo para convidar pais, com fluxo de cadastro zero fricção via IA.

## 🛠️ Arquitetura Técnica
- **Frontend:** Next.js 15 (App Router), React 19, Tailwind CSS.
- **Componentes:** ShadCN UI (Radix UI).
- **Backend:** Firebase Firestore (Banco em tempo real) e Firebase Auth.
- **IA:** Google Genkit com Gemini 1.5 Flash.
- **Mapas:** Google Maps API (Visualização) e Geoapify/OpenStreetMap (Roteirização Custo Zero).

---
*Guardian - A jornada do seu filho, protegida em tempo real.*