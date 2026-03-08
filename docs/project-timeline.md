
# Log de Evolução do Projeto - Guardian

Este documento registra os marcos de desenvolvimento alcançados através da colaboração entre o Gestor (Jonatas) e o Prototipador IA.

## Cronograma de Desenvolvimento (Estimado)

### Fase 1: Fundação & Arquitetura (~4 horas)
- Definição do Tech Stack (Next.js, Shadcn, Tailwind).
- Implementação do sistema de `useMockData` para persistência em sessão.
- Criação dos perfis de acesso: Gestor, Motorista, Monitor e Pais.

### Fase 2: Gestão de Ativos (~6 horas)
- Desenvolvimento dos CRUDs de Escolas (com busca INEP).
- Cadastro de Motoristas e Veículos com controle de manutenção preditiva.
- Sistema de Alunos com herança inteligente de dados de irmãos.

### Fase 3: Camada de Inteligência (IA) (~6 horas)
- Implementação do OCR via Gemini para leitura automática de RG/CNH.
- Fluxo de Aprovação de Solicitações externas.
- Algoritmo de Otimização de Rota (Traveling Salesman Problem adaptado para escolas).

### Fase 4: Experiência de Bordo & Rastreamento (~8 horas)
- Terminal do Motorista com navegação e checklist visual.
- App dos Pais com mapa em tempo real e Alerta de Proximidade (800m).
- Implementação de mapas híbridos (Google Maps e OpenStreetMap/Leaflet).

### Fase 5: Gestão Financeira & Contratos (~4 horas)
- Geração de faturas mensais em lote.
- Gateway de pagamento via Pix simulado.
- Motor de geração de contratos com preenchimento automático de variáveis.

### Fase 6: Refinamento de UX & Comunicação (~4 horas)
- Itinerário final em 3 camadas (Nome, Escola, Metadados).
- Integração de exportação para WhatsApp.
- Blindagem de build e correções de sintaxe.

**Status Atual:** MVP Funcional pronto para transição para ambiente de produção Firebase.
