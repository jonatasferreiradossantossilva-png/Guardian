
# Guardian - Inteligência para Transporte Escolar

O Guardian é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa e Telemetria de alta precisão para otimizar frotas, reduzir custos e aumentar a segurança.

## 🚀 Arquitetura de Custo Zero e Alta Escala (Até 100 Vans)

O Guardian foi desenhado para rodar com custo de software próximo a zero no início, utilizando uma abordagem híbrida:

1.  **Mapas & Visualização:** Google Maps JS API (usando o crédito gratuito de $200).
2.  **Roteirização Híbrida:** Geoapify (OpenStreetMap) com fatiamento de waypoints para contornar limites do plano gratuito.
3.  **Telemetria por Delta:** O sistema só registra a localização no Firebase se a van se mover mais de 30 metros ou após 30 segundos, economizando 70% das escritas de banco de dados.
4.  **Geocodificação:** ViaCEP para endereços e Base INEP Proprietária para evitar chamadas pagas de Geocoding.
5.  **Cálculo de Proximidade:** Fórmula de Haversine local (Matemática Pura) para alertas de 800m e ETAs, eliminando custos com Google Distance Matrix.

---

## 📈 Plano de Expansão (Modo Enterprise: 100+ Vans)

Para escalar além de 100 vans e 2.000 alunos, o plano de expansão foca em manter a lucratividade mesmo saindo do plano gratuito:

### 1. Transição de Visualização (Mapas)
*   **Problema:** 2.000 pais acessando o Google Maps 2x ao dia geram ~120.000 loads/mês (excede o gratuito).
*   **Solução:** Implementar **Leaflet.js com OpenStreetMap** no portal dos pais. O Google Maps fica restrito ao Painel do Gestor e App do Motorista, onde a precisão de satélite é crítica.

### 2. Infraestrutura de Telemetria (Realtime Database)
*   **Problema:** O custo por escrita do Firestore pode crescer com milhares de atualizações de GPS.
*   **Solução:** Migrar o fluxo de GPS para o **Firebase Realtime Database**, que é cobrado por GB de transferência e não por operação, sendo ideal para telemetria de alta frequência em larga escala.

### 3. Cache de Roteirização em Camada
*   **Solução:** Implementar um cache de 24h para rotas de "Ida" e "Volta". Se a lista de alunos não mudou, o sistema reutiliza o traçado do dia anterior, reduzindo em 95% as chamadas de API de roteirização.

### 4. IA em Lote (Token Optimization)
*   **Solução:** Processar a geração de faturas e sumarização de incidentes em "Batch Jobs" durante a madrugada, aproveitando modelos de custo reduzido para processamento em massa.

---

## 🛠️ Funcionalidades por Módulo

### 1. Camada de Inteligência Artificial (Genkit + Gemini)
*   **OCR de Documentos:** Extração automática de dados de RG e CNH para cadastro instantâneo.
*   **Busca Semântica de Escolas:** Base proprietária com 190.000 instituições (INEP).
*   **Otimização de Rota Híbrida:** Algoritmo que decide a sequência lógica de paradas.
*   **Sumarização de Incidentes:** IA que resume relatos de trânsito para o gestor.

### 2. Painel do Gestor
*   **Prova de ROI:** Comparativo KM Planejado (IA) vs. KM Real (GPS).
*   **Saúde da Frota:** Alertas de manutenção preventiva baseados no odômetro real.
*   **Gestão Financeira:** Faturamento automatizado e confirmação de Pix.

### 3. App do Motorista / Monitor
*   **Auto-Cura (Continuous Optimization):** Recálculo de rota a cada parada concluída.
*   **Check-in por QR Code:** Validação visual com foto do aluno.
*   **Alertas de Saúde Críticos:** Badges pulsantes no embarque.

### 4. App dos Pais
*   **Alerta de Proximidade (800m):** Notificação push inteligente (Zero Cost Math).
*   **Gestão Multi-filhos:** Herança de dados entre irmãos.
*   **Assinatura de Contrato:** Aceite jurídico digital integrado.

---
*Guardian - A jornada do seu filho, protegida em tempo real.*
