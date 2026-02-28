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
- **Inovação (Chunking):** Lógica de fatiamento que supera os limites de 5 waypoints das APIs gratuitas, permitindo rotas de qualquer tamanho através da "costura" de segmentos de rota.

### 3. Camada de Sincronização (Real-time DB)
- **Motor:** Firebase Firestore + Offline Persistence.
- **Estratégia Custo Zero:** A rota é calculada uma única vez. O traçado resultante (Polyline) é salvo no banco. Pais e gestores realizam apenas a leitura desse dado estático, eliminando milhares de chamadas redundantes a APIs de mapas pagas.

## 🔒 Política de Privacidade de Rotas
A segurança das crianças é nossa prioridade. O sistema aplica filtros de visualização granulares:
- **Gestor/Motorista:** Visão total de todos os pontos e dados sensíveis.
- **Pais:** Visualizam o traçado completo da rota (Polyline) para transparência de tempo, mas possuem acesso **apenas aos marcadores de seu próprio filho e da escola**. Marcadores de residência de outros alunos são estritamente ocultados.

## 🛠️ Processos Principais

### Criação de Rotas (Gestor)
1.  **Configuração:** O gestor vincula um motorista, um veículo e define o turno.
2.  **Triagem:** O sistema filtra alunos disponíveis com base nas escolas selecionadas e compatibilidade de horários.
3.  **Otimização:** O botão "Otimizar Ordem" aciona a IA para calcular a sequência e o motor Geoapify desenha o trajeto.

### Início de Viagem Inteligente (Motorista)
1.  **Localização Real:** Captura a posição GPS exata da van no momento da saída.
2.  **Re-otimização Real-time:** A IA recalcula a sequência partindo da posição atual da van (Modo Flexível).
3.  **Ativação de Rastreamento:** O sistema inicia a simulação de movimento (jittering) para visualização dos pais.

---
*Guardian - A jornada do seu filho, protegida em tempo real.*