
# Plano Técnico de Pré-Produção - Guardian Intelligence

> **Última Atualização:** 08/04/2026  
> **Status Geral:** ✅ MVP Funcional — Build TypeScript limpo (0 erros) — Pronto para Fase de Publicação

Este documento detalha as especificações de engenharia e faturamento necessárias para a transição do protótipo para o ambiente de produção real.

---

## 📊 Status Atual do Protótipo (Inventário Completo)

### Módulos Implementados (Funcionais no MVP)

| Módulo | Status | Observações |
|---|---|---|
| **Login Multi-Perfil** | ✅ Completo | Gestor, Motorista, Monitor, Pais |
| **Dashboard Gerencial** | ✅ Completo | Cards de KPI, status de frota, mapa de incidentes |
| **Centro de Notificações** | ✅ Completo | Sininho no header, mock de alertas por perfil |
| **Cadastro de Escolas (INEP)** | ✅ Completo | Busca em 190k instituições, formulário com geocode |
| **Cadastro de Motoristas** | ✅ Completo | Formulário completo + OCR de CNH via Gemini |
| **Cadastro de Veículos** | ✅ Completo | Manutenção preditiva, controle de vistoria |
| **Cadastro de Alunos** | ✅ Completo | Herança de dados de irmãos, condições médicas |
| **Cadastro de Pais** | ✅ Completo | Vinculação a alunos, OCR de RG |
| **Gestão de Rotas** | ✅ Completo | Montagem de rota, vinculação de alunos |
| **Otimização de Rota (IA)** | ✅ Completo | TSP via Geoapify + polyline no mapa |
| **Terminal do Motorista** | ✅ Completo | Itinerário visual, embarque/desembarque, QR Code |
| **Telemetria GPS** | ✅ Completo | Simulação por delta, watch de posição real |
| **App dos Pais (Tracking)** | ✅ Completo | Mapa ao vivo, alerta de 800m, status do aluno |
| **Mapas Híbridos** | ✅ Completo | Google Maps + OpenStreetMap/Leaflet |
| **Gestão Financeira** | ✅ Completo | Faturas mensais, despesas, lembretes |
| **Contratos Digitais** | ✅ Completo | Templates com variáveis, geração automática |
| **Mensagens (Chat)** | ✅ Completo | Canal bidirecional Gestor ↔ Pais/Motoristas |
| **Sistema de Anúncios** | ✅ Completo | Mural de comunicados segmentados |
| **Solicitação de Viagem Avulsa** | ✅ Completo | Fluxo Solicitação → Aprovação → Notificação |
| **Gestão de Incidentes** | ✅ Completo | Report categorizado com sugestão IA |
| **Error Boundary** | ✅ Completo | Fallback global de exceções não tratadas |
| **Tipagem TypeScript** | ✅ Saneado | `tsc --noEmit` retorna 0 erros (08/04/2026) |

### Fluxos de IA Implementados

| Flow | Arquivo | Função |
|---|---|---|
| OCR de Documentos | `extract-document-data.ts` | Leitura de RG/CNH via Gemini |
| Geocodificação | `geocode-address.ts` | Conversão endereço → coordenadas |
| Busca INEP | `search-schools-inep.ts` | Consulta à base de escolas MEC |
| Otimização de Rota | `optimizeSchoolVanRoute.ts` | TSP adaptado para van escolar |
| Roteamento Geoapify | `routing-geoapify.ts` | Polyline e roteamento real |
| Geração de Faturas | `generate-monthly-invoices.ts` | Lote mensal automático |
| Resumo de Incidentes | `summarize-incident-reports.ts` | Sumarização via IA |
| Assistente de Rota | `optimize-route-ai-assistant.ts` | Sugestões inteligentes |
| Validação de APIs | `validate-api-keys.ts` | Healthcheck de chaves |

---

## 1. Configuração de Faturamento (Google Cloud/Firebase)

- **Plano Blaze:** É mandatório ativar o plano Blaze no console do Firebase para permitir chamadas de rede externas (APIs de Mapas e IA).
- **Billing Account:** Vincular um cartão de crédito ou conta bancária ao Google Cloud Console.
- **Orçamento de Segurança:** Configurar alertas de faturamento para US$ 10, US$ 50 e US$ 100 para monitorar o consumo das APIs.
- **Estimativa de Custo Mensal (até 50 alunos):**
  - Firebase (Firestore + Auth + Hosting): ~US$ 0 (Free Tier cobre)
  - Geoapify (roteamento): ~US$ 0 (Free Tier: 3.000 req/dia)
  - Google Maps (widgets): ~US$ 0 (até US$ 200/mês de crédito gratuito)
  - Gemini IA (OCR + sugestões): ~US$ 2-5/mês (uso esporádico em cadastros)

## 2. Migração de Persistência (Firebase Real-time)

> ⚠️ **Esta é a tarefa de maior impacto.** Todo o protótipo usa `useMockData` + `useMockCollection` (dados em `localStorage`). A migração para Firebase deve ser cirúrgica.

### Estratégia de Migração (3 Etapas)

**Etapa 2.1 — Camada de Abstração:**
- Criar `@/firebase/hooks.ts` com `useCollection<T>` e `useDoc<T>` que espelhem a mesma interface de retorno (`{ data: T[], isLoading }`) do mock.
- Isso permite trocar o import de um arquivo para outro sem alterar os componentes.

**Etapa 2.2 — Feature Flag Gradual:**
- Implementar variável de ambiente `NEXT_PUBLIC_USE_FIREBASE=true/false`.
- Os hooks decidem em runtime se leem do mock ou do Firestore.
- Migrar coleção por coleção: `schools` → `students` → `parents` → `drivers` → `routes` → `invoices`.

**Etapa 2.3 — Segurança (Security Rules):**
- Implementar RBAC (Role-Based Access Control) via custom claims do Firebase Auth.
- Regras críticas:
  - `allow read: if resource.data.parentUserId == request.auth.uid` (Pais só veem seus dados)
  - `allow write: if request.auth.token.role == 'admin'` (Apenas gestor edita cadastros)
- **Persistência Offline:** Ativar `enableIndexedDbPersistence` para garantir que o motorista não perca o checklist em áreas de sombra de sinal.

### Coleções Firestore (Mapeamento Direto)

| Coleção Mock | Coleção Firestore | Campos Sensíveis |
|---|---|---|
| `schools` | `schools` | — |
| `students` | `students` | `cpf`, `medicalConditions` |
| `parents` | `parents` | `cpf`, `phone`, `email` |
| `drivers` | `drivers` | `cnh`, `cpf` |
| `vehicles` | `vehicles` | `placa`, `renavam` |
| `routes` | `routes` | `polyline` (dados de rota) |
| `invoices` | `invoices` | `amount`, `status` |
| `expenses` | `expenses` | `amount` |
| `incidents` | `incidents` | — |
| `announcements` | `announcements` | — |
| `messages` | `messages` | conteúdo das mensagens |
| `contracts` | `contracts` | dados contratuais |
| `notifications` | `notifications` | — |
| `locations/{driverId}` | `locations/{driverId}` | coordenadas GPS em tempo real |

## 3. Autenticação Real (Firebase Auth)

### Fluxo de Onboarding
1. **Gestor** cadastra o pai no sistema → gera um `inviteToken`.
2. **Pai** recebe link via WhatsApp → abre no celular → cria conta com email/senha ou telefone.
3. Firebase Auth cria o `uid` → Cloud Function associa o `uid` ao documento do pai no Firestore.
4. **Motoristas/Monitores** recebem credenciais diretas do gestor.

### Custom Claims (Perfis)
```json
{
  "role": "admin" | "driver" | "monitor" | "parent",
  "companyId": "empresa_xyz_123"
}
```

## 4. Infraestrutura e Segredos (DevOps)

- **Gestão de Chaves:** Migrar `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` e `GEOAPIFY_API_KEY` para o `apphosting.yaml` como segredos criptografados.
- **CI/CD:** Configurar GitHub Actions para:
  - `tsc --noEmit` em cada PR (já passa ✅)
  - Deploy automático para Firebase Hosting em push na `main`
- **Blueprint de Dados:** Atualizar o `docs/backend.json` com as definições de `zod` para garantir que o Firestore receba apenas dados sanitizados.

## 5. Estratégia Mobile Native (Capacitor.js)

> 💡 **Decisão Pendente:** PWA puro vs. Capacitor para loja de apps.

### Opção A: PWA Puro (Recomendado para V1)
- ✅ Já funcional (manifesto + service worker configurados)
- ✅ Instalável via Chrome no Android
- ✅ Menor custo de manutenção
- ⚠️ Limitação: GPS em background não é confiável no iOS

### Opção B: Capacitor (Recomendado para V2)
- **Build de Loja:**
  - Instalação do `@capacitor/core` e `@capacitor/cli`.
  - Configuração de `webDir: 'out'` para suporte ao `next export`.
- **Acesso a Hardware:**
  - **GPS:** Uso do plugin `Geolocation` para rastreamento em background (essencial para o Alerta de 800m no iOS).
  - **Câmera:** Integração com `Capacitor Camera` para OCR de documentos com maior resolução que a API Web.
  - **Push Notifications:** Plugin nativo para notificações reais (vs. polling/mock atual).

## 6. Otimização de Custos (FinOps)

- **Telemetria por Delta:** Implementar lógica de envio de posição apenas se `delta_distancia > 30m` ou `delta_tempo > 30s`. Isso reduzirá as escritas no Firestore em até 70%. *(Lógica de delta já implementada no hook `use-telemetry.ts`)*
- **Cache de Roteirização:** Implementar `LocalStorage` para armazenar as polilinhas das rotas do dia, evitando chamadas repetitivas à API paga da Geoapify.
- **Firestore Reads:** Usar listeners em tempo real (`onSnapshot`) ao invés de queries repetidas. O mock já simula esse padrão.

## 7. Gateway Financeiro Real

- **Integração Webhook:** Substituir o simulador por uma integração via `Server Actions` com APIs de Pix (Stark Bank, EFI ou Mercado Pago).
- **Conciliação:** Automação do status da `Invoice` de `pending` para `paid` via recebimento de notificação do banco (Webhook).
- **Boleto/Cartão:** Integração futura com gateway multi-meio (Stripe BR ou PagSeguro) para cobranças recorrentes.

## 8. Cloud Functions (Automações Serverless)

> Funções que hoje rodam no client-side e devem migrar para o servidor:

| Automação | Trigger | Prioridade |
|---|---|---|
| Geração mensal de faturas | `pubsub.schedule('0 6 1 * *')` | 🔴 Alta |
| Alerta de fatura vencida | `pubsub.schedule('0 8 * * *')` | 🔴 Alta |
| Reset diário de status dos alunos | `pubsub.schedule('0 5 * * *')` | 🟡 Média |
| Notificação de proximidade (800m) | `firestore.onWrite('locations/{id}')` | 🟡 Média |
| Envio de lembretes WhatsApp | `pubsub.schedule('0 9 5,15 * *')` | 🟢 Baixa (V2) |
| Backup automático do Firestore | `pubsub.schedule('0 3 * * 0')` | 🟢 Baixa |

---

## 🗓️ Cronograma Sugerido de Migração

```
Semana 1  ─── Firebase Auth + Security Rules + Estrutura Firestore
Semana 2  ─── Migração dos hooks (mock → firebase) por coleção
Semana 3  ─── Cloud Functions (faturamento + notificações)
Semana 4  ─── Gateway Pix + Testes E2E + Deploy staging
Semana 5  ─── Beta fechado com 3-5 famílias reais
Semana 6  ─── Ajustes de feedback + Deploy produção
```

---

## ✅ Checklist de Go-Live

- [ ] Firebase Auth configurado com custom claims
- [ ] Security Rules aplicadas e testadas
- [ ] Todas as coleções migradas de mock → Firestore
- [ ] Cloud Function de faturamento mensal ativa
- [ ] Gateway de Pix integrado e testando
- [ ] SSL/HTTPS ativo no domínio customizado
- [ ] PWA instalável e testado em Android + iOS Safari
- [ ] Backup automático do Firestore configurado
- [ ] Alertas de billing configurados no Google Cloud
- [ ] Onboarding de 1 gestor piloto concluído

---

**Status Técnico:** Sistema Saneado (Build OK, 0 erros TypeScript) e pronto para início da Fase de Publicação.
