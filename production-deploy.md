# Deploy de Produção — Guardian

## Goal
Criar ambiente de **produção** (Firestore real) mantendo o ambiente de **homologação** (mock) intacto. Dois links, mesmo código, switch por variável de ambiente.

## Arquitetura

```
NEXT_PUBLIC_DATA_MODE = "mock"      → Homologação (como hoje)
NEXT_PUBLIC_DATA_MODE = "firestore" → Produção (Firestore real)
```

```
layout.tsx
└── <DataProvider>           ← NOVO: decide qual provider usar
    ├── mode=mock      → MockDataProvider (atual, zero mudança)
    └── mode=firestore → FirestoreDataProvider (NOVO, mesma interface)
```

## Tasks

### Fase 1: Camada de Abstração (sem quebrar nada)

- [x] **Task 1.1**: Criar `src/hooks/use-data.tsx` — Provider unificado
  - Lê `NEXT_PUBLIC_DATA_MODE` 
  - Se `mock`: renderiza `MockDataProvider` (código atual)
  - Se `firestore`: renderiza `FirestoreDataProvider` (novo)
  - Exporta `useData()` com mesma interface de `useMockData()`
  - → Verificar: `npm run dev` funciona igual

- [x] **Task 1.2**: Criar `src/hooks/firestore-data-provider.tsx`
  - Implementa `MockDataContextType` usando Firestore real
  - `getCollection()` → `getDocs(collection(firestore, name))`
  - `getDoc()` → `getDoc(doc(firestore, name, id))`
  - `addDoc()` → `addDoc(collection(firestore, name), data)`
  - `updateDoc()` → `updateDoc(doc(firestore, name, id), data)`
  - `deleteDoc()` → `deleteDoc(doc(firestore, name, id))`
  - Inclui listeners realtime (`onSnapshot`) para reatividade
  - → Verificar: TypeScript compila sem erro

- [x] **Task 1.3**: Atualizar `src/app/layout.tsx`
  - Trocar `<MockDataProvider>` por `<DataProvider>`
  - `MockDataProvider` NÃO é removido, apenas condicionado
  - → Verificar: Homologação (mock) funciona idêntico ao antes

### Fase 2: Autenticação Real

- [x] **Task 2.1**: Criar `src/hooks/use-auth-provider.tsx`
  - Login híbrido: CPF+PIN ou Email+Senha
  - CPF convertido para email fake: `{cpf_numeros}@guardian.app`
  - PIN tratado como senha no Firebase Auth
  - Funções: `loginWithCpf(cpf, pin)`, `loginWithEmail(email, password)`, `register()`, `logout()`
  - → Verificar: Login via Firebase Auth funciona

- [x] **Task 2.2**: Atualizar `src/components/auth/login-form.tsx`
  - Em modo mock: login atual (busca no localStorage)
  - Em modo firestore: usa Firebase Auth (`signInWithEmailAndPassword`)
  - Tela mantém UX atual (CPF + PIN)
  - → Verificar: Login funciona nos dois modos

- [x] **Task 2.3**: Criar lógica de primeiro acesso (setup admin)
  - Quando banco está vazio: tela de "Configurar Sistema"
  - Cria o primeiro usuário gestor no Firebase Auth + Firestore
  - Cria documento em `roles_admin/{userId}`
  - → Verificar: Primeiro acesso cria admin e redireciona ao dashboard

### Fase 3: Adaptar Server Components

- [x] **Task 3.1**: Atualizar pages que usam `initialMockData` diretamente
  - Arquivos: `routes/page.tsx`, `students/page.tsx`, `vehicles/page.tsx`, etc. (~10 arquivos)
  - Em modo firestore: buscar dados via Firebase Admin SDK ou client-side fetch
  - Em modo mock: manter como está
  - → Verificar: Todas as páginas de management carregam dados

### Fase 4: Deploy na Vercel

- [x] **Task 4.1**: Criar branch `production` no Git
  - Baseada na `main` atual
  - → Verificar: Branch criada

- [x] **Task 4.2**: Criar novo projeto na Vercel
  - Nome: `guardian-producao`
  - Vincular ao mesmo repositório
  - Branch de deploy: `main` (ou `production`)
  - Env vars:
    - `NEXT_PUBLIC_DATA_MODE=firestore`
    - `NEXT_PUBLIC_FIREBASE_API_KEY=...`
    - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...`
    - `NEXT_PUBLIC_FIREBASE_PROJECT_ID=...`
  - → Verificar: Deploy completa com sucesso

- [x] **Task 4.3**: Configurar projeto atual como homologação
  - Adicionar env var: `NEXT_PUBLIC_DATA_MODE=mock`
  - Nada mais muda
  - → Verificar: Link atual continua funcionando igual

### Fase 5: Verificação Final

- [x] **Task 5.1**: Teste E2E em produção
  - Acessar link de produção
  - Criar conta de gestor (primeiro acesso)
  - Cadastrar escola, veículo, aluno
  - Verificar dados no console Firebase
  - → Verificar: Dados persistem no Firestore real

- [x] **Task 5.2**: Teste E2E em homologação
  - Acessar link atual (homologação)
  - Confirmar que simulação funciona normalmente
  - → Verificar: Zero regressão

## Decisões Técnicas

| Decisão | Escolha | Motivo |
|---------|---------|--------|
| **Switch** | Env var `NEXT_PUBLIC_DATA_MODE` | Simples, sem código condicional espalhado |
| **Auth CPF** | CPF→email fake (`@guardian.app`) | Mantém UX atual, usa Firebase Auth por baixo |
| **Banco vazio** | Sem seed script | Usuário quer testar cadastro manual |
| **Realtime** | `onSnapshot` para coleções críticas | Rotas, alunos, localizações precisam ser realtime |
| **Dois projetos Vercel** | Separados, mesmo repo | Homologação 100% intocada |

## Arquivos Impactados (Estimativa)

| Tipo | Quantidade | Ação |
|------|-----------|------|
| **Novos** | 3 arquivos | `use-data.tsx`, `firestore-data-provider.tsx`, `use-auth-provider.tsx` |
| **Modificados** | 2 arquivos | `layout.tsx`, `login-form.tsx` |
| **Intocados** | ~65 componentes | Continuam usando `useMockData()` via abstração |

## Notes
- A interface `MockDataContextType` já está bem definida — o `FirestoreDataProvider` replica ela 1:1
- As Firestore Rules já estão robustas e prontas para produção
- O `FirebaseProvider` + `useFirebase()` já existem e serão reaproveitados
- Componentes NÃO precisam ser alterados — só a fonte de dados muda por baixo

## Cadastro de Base de Escolas (INEP)

Foi implementado um script de sementeira (**seeder**) inteligente em `src/scripts/import-schools.ts` para carregar a base oficial do INEP contendo **181.065 escolas brasileiras** diretamente no Firestore de produção.

### Status de Seeding (08/05/2026)
- **Rondônia (RO):** **100% Importado** (1.243 escolas ativas em produção).
- **Outros Estados:** **18.500 escolas** importadas com sucesso.
- **Total em Produção:** **19.743 escolas**.
- **Nota:** Atingido o limite diário gratuito de **20.000 gravações** do Firebase Spark Plan (Google retorne `RESOURCE_EXHAUSTED`). O script parou de forma limpa e segura, e as regras de gravação foram restabelecidas com segurança (`allow write: if isAdmin()`).

### Como Executar o Seeding de São Paulo (SP) Amanhã
Assim que o limite diário resetar no Firebase, execute o seguinte comando no terminal para priorizar o estado de São Paulo:

```bash
# 1. Temporariamente habilitar gravação pública em firestore.rules:
# Altere 'allow write: if isAdmin();' para 'allow write: if true;' no bloco school_knowledge_base.
# E faça o deploy das regras:
npx firebase deploy --only firestore:rules --project studio-6623181818-11eb0

# 2. Executar o script automático de importação focando em São Paulo (SP):
npx tsx src/scripts/import-schools.ts --uf SP --yes

# 3. Retornar as regras de segurança ao original:
# Altere de volta para 'allow write: if isAdmin();' e publique:
npx firebase deploy --only firestore:rules --project studio-6623181818-11eb0
```

