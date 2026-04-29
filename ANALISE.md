# Guardian - Análise Completa do Projeto

## Resumo Executivo

O **Guardian** é uma plataforma de inteligência operacional para transporte escolar que utiliza IA Generativa (Gemini) e Telemetria de alta precisão. posiciona-se como uma solução premium com diferenciais tecnológicos significativos no mercado brasileiro.

---

## 1. PANORAMA DO MERCADO

### Contexto Brasileiro
- **64.845 empresas** de transporte escolar no Brasil
- **Crescimento de 77,7%** em 2025 (dados DataSebrae)
- **11 mil novas empresas** formalizadas em 2025
- Setor em plena professionalização

### Mercado Global
- Software de transporte escolar é mercado em **forte expansão**
- Projeção de crescimento global até 2034
- Tendência de consolidação (ex: Transit Technologies aquisição ByteCurve)

---

## 2. CONCORRENTES BRASILEIROS

### 2.1 Principais Concorrentes

| Concorrente | Diferencial Principal | Foco |
|-------------|------------------------|------|
| **Van Inteligente** | Gestão completa para motoristas | Praticidade |
| **RotaSegura** | Rastreamento em tempo real | Segurança |
| **Via Escolar** | Plataforma multi-usuário | Esperar o ônibus |
| **Via Van** | App para condutores | Tranquilidade |
| **VanEscola** | Solução simples | Modernização básica |
| **Smartvan** | Gestão completa | 10 mil+ downloads |

### 2.2 Análise Detalhada: RotaSegura

**Site:** rotasegura.app  
**Localização:** São Paulo, SP  
**Contato:** contato@rotasegura.com.br

#### Modelo de Preços
| Plano | Preço | Funcionalidades |
|-------|-------|-----------------|
| Básico | R$ 10/aluno | Rastreamento, app pais/motoristas, notificações |
| Profissional | R$ 12/aluno | + Gestão financeira, aviso de faltas, otimização de rotas |
| Enterprise | Sob consulta | + API, contratos digitais, suporte 24/7 |

#### Funcionalidades
- Rastreamento GPS 24h
- Alertas de proximidade
- Gestão financeira (boletos)
- Aviso de faltas
- Otimização de rotas
- Manutenção preventiva
- Contratos digitais
- Chat integrado (sem expor números)

#### Presença nas Lojas de Apps
| Loja | Status | Observação |
|------|--------|------------|
| Google Play | **NÃO DISPONÍVEL** | Links no site não funcionam |
| App Store | **NÃO DISPONÍVEL** | App não encontrado |
| Web PWA | Parcial | Apenas portal admin |

**⚠️ VANTAGEM GUARDIAN:** RotaSegura não tem app nativo, enquanto Guardian já tem PWA configurado.

### 2.3 Apps de Transporte Escolar nas Lojas

| App | Desenvolvedor | Downloads | Plataforma |
|-----|---------------|-----------|-------------|
| **Smartvan** | Smartvan Tecnologia | 10 mil+ | Android |
| **Loqqat** | Qaptive Technologies | 1 mil+ | Android |
| **RotaSeg** | Semente Digital | 100+ | Android |
| **Rota Transportes** | RJ Consultores | 100K+ | Android |
| **RodeRotas** | Antonio Baena | 10K+ | Android |

### Lacunas dos Concorrentes
- **Sem IA avançada** - Nenhum usa OCR de documentos ou Gemini
- **Roteirização simples** - Sem otimização dinâmica
- **Custo fixo** - Sem arquitetura de custo zero
- **Escalabilidade limitada** - Não suportam frotas 100+ vans
- **Sem presença mobile** - Muitos sem app nativo

---

## 3. DIFERENCIAIS COMPETITIVOS DO GUARDIAN

### Vantagens Tecnológicas

#### 3.1 Arquitetura de Custo Zero
```
| Solução              | Custo Mensal Estimado |
|---------------------|----------------------|
| Guardian            | ~$0-50 (escalável)   |
| Concorrentes típicos | R$200-500/van        |
| Enterprise solutions | R$1000+/mês          |
```

#### 3.2 IA Generativa (Gemini + Genkit)
- **OCR de documentos**: Extração automática de RG/CNH
- **Busca semântica**: Base INEP com 190.000 escolas
- **Sumarização de incidentes**: Relatórios automáticos
- **Otimização de rotas**: Algoritmo híbrido inteligente

#### 3.3 Telemetria Inteligente
- Registro por delta (>30m ou >30s)
- **Economia de 70%** em escritas Firebase
- Fórmula Haversine local para alertas
- Zero custo em Google Distance Matrix

#### 3.4 Prova de ROI
- KM Planejado (IA) vs KM Real (GPS)
- Alertas de manutenção preventiva
- Faturamento automatizado com Pix

#### 3.5 Presença Mobile
- PWA offline-first já configurado
- Sem custo de loja de apps
- Instalação com 1 clique

### Comparativo Técnico

| Funcionalidade | Guardian | RotaSegura | Van Inteligente | ViaVan | Smartvan |
|---------------|----------|------------|-----------------|--------|----------|
| OCR de docs | ✅ Gemini | ❌ | ❌ | ❌ | ❌ |
| Base INEP | ✅ 190k | ❌ | ❌ | ❌ | ❌ |
| Cache rotas 24h | ✅ | ❌ | ❌ | ❌ | ❌ |
| Telemetria delta | ✅ | ❌ | ❌ | ❌ | ❌ |
| Haversine local | ✅ | ❌ | ❌ | ❌ | ❌ |
| Auto-otimização | ✅ | ❌ | ❌ | ❌ | ❌ |
| Check-in QR | ✅ | ❌ | ✅ | ✅ | ✅ |
| Multi-filho | ✅ | ❌ | ❌ | ❌ | ❌ |
| PWA offline | ✅ | ❌ | Parcial | Parcial | ✅ |
| App nativo | ✅ PWA | ❌ | ✅ | ✅ | ✅ |
| Gestão financeira | ✅ | ✅ | ✅ | ❌ | ✅ |

---

## 4. POSICIONAMENTO ESTRATÉGICO

### Público-Alvo
1. **Frotas médias (10-50 vans)** - Primary target
2. **Frotas grandes (100+ vans)** - Com plano Enterprise
3. **Escolas particulares** - Gestão própria de transporte

### Modelo de Monetização Sugerido
```
| Plano     | Vans   | Preço Estimado |
|-----------|--------|----------------|
| Starter   | 1-5    | R$ 99/mês      |
| Pro       | 6-25   | R$ 79/van/mês  |
| Business  | 26-100 | R$ 59/van/mês  |
| Enterprise| 100+   | Sob consulta   |
```

### Diferença de Preço vs RotaSegura
- **RotaSegura:** R$ 10-12/aluno (ex: 30 alunos = R$ 300-360/mês)
- **Guardian Pro:** R$ 79/van/mês (ex: 5 vans = R$ 395/mês)
- **Guardian Business:** R$ 59/van/mês (ex: 20 vans = R$ 1.180/mês)

⚠️ **Atenção:** RotaSegura cobra por aluno, Guardian por van. Calcular conforme média de alunos/van (~15-20).

---

## 5. OPORTUNIDADES IDENTIFICADAS

### 5.1 Tendências 2026
- GPS + vídeo em tempo real (Goias)
- Apps governamentais rastrear rotas
- Professionalização do setor

### 5.2 Gaps de Mercado
- Nenhum concorrente tem **IA conversacional** para gestores
- **Faturas automatizadas** são raridade
- **Contratos digitais** com assinatura jurídica
- **PWA offline** ainda é diferencial

### 5.3 Expansão
- Integração com **SPTrans/embarcadero**
- **Lockers escolares** para entregas
- **Pagamento mensal** via carnê digital

---

## 6. RISCOS E DESAFIOS

### Riscos
1. **Adoção tecnológica** - Motoristas com baixa digitalização
2. **Concorrência de grandes** - Uber/99 entraram no transporte escolar?
3. **Regulamentação** - Mudanças em normas do DETRAN
4. **Preço** - Guardian mais caro que RotaSegura por van

### Desafios Técnicos
1. Manter **custo zero** ao escalar
2. Garantir **offline-first** para áreas rurais
3. Latência em **alertas de proximidade**

---

## 7. RECOMENDAÇÕES PRIORITÁRIAS

### Curto Prazo (MVP)
1. ✅ Focar em **check-in QR** como feature inicial
2. ✅ Dashboard com **prova de ROI** para gestor
3. ✅ Notificações **800m proximity** para pais
4. ✅ Publicar PWA instalável

### Médio Prazo
1. Integrar **pagamento Pix automático**
2. Lançar **app PWA** para motoristas offline
3. Implementar **cache de rotas** inteligente
4. Publicar no **Google Play** (teste beta)

### Longo Prazo
1. Desenvolver **API aberta** para escolas
2. Lançar **marketplace** de peças/mutenção
3. Expandir para **caronas corporativas**
4. Publicar no **App Store**

---

## 8. STATUS ATUAL DO PROJETO

### Tecnologias
- **Frontend:** Next.js 15 + React 19 + TypeScript
- **IA:** Genkit + Google Gemini
- **Maps:** Google Maps API + Leaflet/OpenStreetMap
- **Backend:** Firebase (Firestore + Realtime Database)
- **UI:** TailwindCSS + Radix UI + Framer Motion
- **PWA:** @ducanh2912/next-pwa ✅

### Arquitetura
- Telemetria por delta (registra apenas se mover >30m ou >30s)
- Fórmula Haversine local para cálculos de proximidade
- Cache de rotas 24h
- ViaCEP + Base INEP para geocodificação

### Módulos Implementados
1. **Camada IA:** OCR de documentos, busca semântica, otimização de rotas
2. **Painel Gestor:** ROI comparativo, saúde da frota, gestão financeira
3. **App Motorista:** Auto-otimização, check-in QR Code
4. **App Pais:** Alertas 800m, gestão multi-filhos

### Estrutura de Pastas
```
src/
├── ai/        # Fluxos Genkit
├── app/       # Rotas Next.js (App Router)
├── components/ # Componentes UI
├── firebase/  # Configuração
├── hooks/     # Custom hooks
└── lib/       # Utilitários
```

### Scripts
```bash
npm run dev        # http://localhost:9002
npm run genkit:dev # Genkit
npm run build      # Produção
npm run lint       # Linting
npm run typecheck  # Tipagem
```

---

## 9. GAPS IDENTIFICADOS NO PROJETO

### 9.1 Problemas de Tipagem TypeScript

**CRÍTICO - Build Interrompido**

```
npm run typecheck
```

| Severidade | Quantidade | Impacto |
|------------|------------|---------|
| 🔴 Erros TS7006 (implicit any) | ~50+ | Build falha |
| 🔴 Erros TS2349 (not callable) | ~5 | Funções quebradas |
| 🟡 Erros TS2322 (type assign) | ~4 | UI pode quebrar |
| 🟡 Erros TS7053 (index type) | ~6 | Lógica inconsistente |

**Arquivos com problemas:**
- `src/app/apresentacao/page.tsx` - Erro TS2349
- `src/app/assistant/messages/page.tsx` - ~18 erros TS
- `src/app/dashboard/financial/page.tsx` - ~30 erros TS

**⚠️ PRIORIDADE: Corrigir typecheck ANTES de qualquer feature novo.**

---

### 9.2 Gaps Funcionais

| Gap | Severidade | Descrição | Impacto |
|-----|------------|-----------|---------|
| **Sem testes unitários** | 🔴 Crítico | 0 arquivos `.test.ts` ou `.spec.ts` | Risco de regression |
| **Mock data hardcoded** | 🟡 Médio | Todos os dados em `mock-data.ts` | Não conecta em produção |
| **Auth via mock** | 🟡 Médio | `useMockData` hook | Login real não implementado |
| **Sem push notifications** | 🟡 Médio | FCM não configurado | Alertas 800m não funcionam |
| **Sem offline sync** | 🟡 Médio | Motoristas sem net perdem dados | Rastreamento falha |
| **Sem gestão de pagamentos real** | 🟡 Médio | Pix/boleto não integrado | Financeiro é demo |

---

### 9.3 Gaps Técnicos

| Gap | Severidade | Descrição |
|-----|------------|-----------|
| **Sem CI/CD** | 🟡 Médio | Deploy manual ou sem automação |
| **Sem coverage de testes** | 🟡 Médio | 0% coverage |
| **Sem migrations de DB** | 🟢 Baixo | Firestore sem versionamento |
| **Sem rate limiting** | 🟢 Baixo | API exposta a abusos |
| **Sem logging centralizado** | 🟢 Baixo | Console.log espalhado |

---

### 9.4 Gaps de UX/UI

| Gap | Severidade | Descrição |
|-----|------------|-----------|
| **Sem loading states** | 🟡 Médio | Skeletons não implementados |
| **Sem error boundaries** | 🟡 Médio | App crasha em erros |
| **Sem onboarding flow** | 🟡 Médio | Usuário perdido ao logar |
| **Sem empty states** | 🟢 Baixo | Telas vazias confusas |

---

### 9.5 Gaps de Segurança

| Gap | Severidade | Descrição |
|-----|------------|-----------|
| **API keys expostas** | 🔴 Crítico | `.env` no repo (mesmo no .gitignore) |
| **Sem RBAC** | 🟡 Médio | Permissões não implementadas |
| **Sem 2FA** | 🟡 Médio | Autenticação simples |
| **Sem audit log** | 🟢 Baixo | Ações não rastreáveis |

---

### 9.6 Checklist de Correções

#### 🔴 CRÍTICO (Bloqueia produção)
- [ ] Corrigir erros TypeScript (50+ errors)
- [ ] Configurar Auth real (Firebase Auth)
- [ ] Implementar Push Notifications (FCM)
- [ ] Adicionar testes unitários (vitest/jest)

#### 🟡 MÉDIO (Importante para MVP)
- [ ] Implementar offline sync (Service Worker)
- [ ] Adicionar error boundaries
- [ ] Configurar CI/CD (GitHub Actions)
- [ ] Adicionar loading states
- [ ] Adicionar empty states
- [ ] Integrar Pix real (ASAAS/MercadoPago)

#### 🟢 BAIXO (Nice to have)
- [ ] Onboarding flow
- [ ] Audit log
- [ ] Migrations de Firestore
- [ ] Rate limiting
- [ ] RBAC (permissões por role)

---

O **Guardian** tem potencial para se tornar líder no segmento premium de transporte escolar brasileiro, desde que:

1. **Mantenha o foco em IA** como diferencial principal
2. **Aborde primeiro frotas médias** (10-50 vans)
3. **Prove ROI claro** no pitch de vendas
4. **Invista em UX** para adoção por motoristas
5. **Lance PWA primeiro** antes de apps nativos
6. **Corrige erros TypeScript** antes de novas features

### Análise SWOT Resumida

| | |
|---|---|
| **Forças** | IA com Gemini, Custo zero escalável, PWA offline |
| **Fraquezas** | 50+ erros TS, Sem testes, Mock data |
| **Oportunidades** | Mercado crescendo 77%, Concorrentes sem IA |
| **Ameaças** | RotaSegura/Smartvan estabelecidos, Preço por van |

O mercado está em **forte crescimento** (77,7%) e carente de soluções inteligentes. Guardian está bem posicionado para capturar essa oportunidade, MAS precisa resolver os **gaps críticos** primeiro.

---

*Análise atualizada em: 06/04/2026*
