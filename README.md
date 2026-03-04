
# Guardian - Inteligência para Transporte Escolar

O Guardian é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa e Telemetria de alta precisão para otimizar frotas, reduzir custos e aumentar a segurança.

## 🚀 Arquitetura de Custo Zero e Alta Escala (100+ Vans)

O Guardian foi desenhado para escalar com custo operacional de software próximo a zero, mesmo em frotas de grande porte, utilizando uma abordagem híbrida e estratégica:

1. **Mapas & Visualização Inteligente:** Google Maps JS API (utilizando o crédito gratuito mensal de $200). Para frotas acima de 100 vans, o sistema prioriza o uso de mapas estáticos e Leaflet no portal dos pais para garantir que a cota gratuita nunca seja excedida.
2. **Roteirização Híbrida (Fatiamento):** Geoapify (OpenStreetMap) com lógica de fatiamento de waypoints para contornar limites do plano gratuito. Conseguimos traçar rotas complexas de 20+ alunos sem custos de API.
3. **Telemetria por Delta (Escala 100+):** O motorista não envia posição fixa. O Guardian só registra a localização no Firebase se a van se mover mais de 30 metros ou após 30 segundos. Isso permite gerenciar 100 vans simultâneas dentro da cota gratuita de banco de dados (20k escritas/dia).
4. **Geocodificação Híbrida:** ViaCEP para preenchimento de endereços e Base INEP Proprietária (190k registros) para evitar chamadas de API pagas do Google Geocoding.
5. **Cálculo de Proximidade Local:** Implementação local da Fórmula de Haversine para alertas de 800m e ETAs, eliminando custos com Google Distance Matrix. Matemática pura no navegador do usuário.

## 🛠️ Funcionalidades por Módulo

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

---
*Guardian - A jornada do seu filho, protegida em tempo real.*
