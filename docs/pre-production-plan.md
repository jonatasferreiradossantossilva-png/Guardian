
# Plano Técnico de Pré-Produção - Guardian Intelligence

Este documento detalha as especificações de engenharia e faturamento necessárias para a transição do protótipo para o ambiente de produção real.

## 1. Configuração de Faturamento (Google Cloud/Firebase)
- **Plano Blaze:** É mandatório ativar o plano Blaze no console do Firebase para permitir chamadas de rede externas (APIs de Mapas e IA).
- **Billing Account:** Vincular um cartão de crédito ou conta bancária ao Google Cloud Console.
- **Orçamento de Segurança:** Configurar alertas de faturamento para US$ 10, US$ 50 e US$ 100 para monitorar o consumo das APIs.

## 2. Migração de Persistência (Firebase Real-time)
- **Hooks de Dados:** Substituir `@/hooks/use-mock-data` pelos hooks nativos em `@/firebase/index.ts` (`useCollection` e `useDoc`).
- **Segurança (Security Rules):** 
    - Implementar RBAC (Role-Based Access Control) via coleções `/roles_admin`, `/roles_driver` e `/roles_monitor`.
    - Bloquear leituras transversais: `allow read: if resource.data.parentUserId == request.auth.uid`.
- **Persistência Offline:** Ativar `enableIndexedDbPersistence` para garantir que o motorista não perca o checklist em áreas de sombra de sinal.

## 3. Infraestrutura e Segredos (DevOps)
- **Gestão de Chaves:** Migrar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` e `GEOAPIFY_API_KEY` para o `apphosting.yaml` como segredos criptografados.
- **Blueprint de Dados:** Atualizar o `docs/backend.json` com as definições de `zod` para garantir que o Firestore receba apenas dados sanitizados.

## 4. Estratégia Mobile Native (Capacitor.js)
- **Build de Loja:** 
    - Instalação do `@capacitor/core` e `@capacitor/cli`.
    - Configuração de `webDir: 'out'` para suporte ao `next export`.
- **Acesso a Hardware:**
    - **GPS:** Uso do plugin `Geolocation` para rastreamento em background (essencial para o Alerta de 800m).
    - **Câmera:** Integração com `Capacitor Camera` para OCR de documentos com maior resolução que a API Web.

## 5. Otimização de Custos (FinOps)
- **Telemetria por Delta:** Implementar lógica de envio de posição apenas se `delta_distancia > 30m` ou `delta_tempo > 30s`. Isso reduzirá as escritas no Firestore em até 70%.
- **Cache de Roteirização:** Implementar `LocalStorage` para armazenar as polilinhas das rotas do dia, evitando chamadas repetitivas à API paga da Geoapify.

## 6. Gateway Financeiro Real
- **Integração Webhook:** Substituir o simulador por uma integração via `Server Actions` com APIs de Pix (Stark Bank, EFI ou Mercado Pago).
- **Conciliação:** Automação do status da `Invoice` de `pending` para `paid` via recebimento de notificação do banco (Webhook).

---
**Status Técnico:** Sistema Saneado (Build OK) e pronto para início da Fase de Publicação.
