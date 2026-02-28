# Guardian - Inteligência para Transporte Escolar

O Guardian é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa e Roteirização Híbrida para otimizar frotas com custo zero de API em larga escala.

## 🚀 Arquitetura de Inteligência

O sistema opera em três camadas integradas:

### 1. Camada de Decisão (IA Generativa)
- **Motor:** Google Gemini 1.5 Flash via Genkit.
- **Função:** Atua como um especialista em logística. Recebe os pontos de embarque/desembarque e decide a **ordem lógica** das paradas baseando-se em regras de negócio (ex: coletar todos os alunos antes de descarregar nas escolas).
- **Resiliência:** Possui mecanismos de fallback que retornam a rota padrão do gestor caso a IA esteja temporariamente indisponível.

### 2. Camada de Geometria (Roteirização Híbrida)
- **Motor:** Geoapify (OpenStreetMap).
- **Função:** Transforma a sequência lógica da IA em um **traçado visual (Polyline)**.
- **Inovação (Chunking):** Implementamos uma lógica de fatiamento que supera os limites de 5 waypoints das APIs gratuitas, permitindo rotas de qualquer tamanho através da "costura" de segmentos de rota.

### 3. Camada de Sincronização (Real-time DB)
- **Motor:** Firebase Firestore + Offline Persistence.
- **Estratégia Custo Zero:** A rota é calculada uma única vez pelo motorista ao iniciar a viagem. O traçado resultante é salvo no banco. Pais e gestores realizam apenas a leitura desse dado estático, eliminando milhares de chamadas redundantes a APIs de mapas pagas.

## 🛠️ Tecnologias Utilizadas
- **Frontend:** NextJS 15, React 19, Tailwind CSS.
- **UI Components:** ShadCN UI, Lucide Icons.
- **AI:** Genkit, Gemini 1.5 Flash.
- **Maps:** Google Maps (Visualização) e Geoapify (Cálculo de Rota).
- **Backend:** Firebase Auth, Firestore.

## 📱 Funcionalidades Principais
- **Gestor:** Dashboard financeiro, controle de contratos, gestão de frota e planejamento de rotas por IA.
- **Motorista:** App de navegação com checklist de embarque, scanner de QR Code e relato de incidentes.
- **Pais:** Rastreamento em tempo real, gestão de autorizações, aceite de contratos e controle financeiro.

---
*Guardian - A jornada do seu filho, protegida em tempo real.*