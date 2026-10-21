---
description: Deployment command for production releases. Pre-flight checks and deployment execution.
---

# /deploy - Production Deployment

$ARGUMENTS

---

## Purpose

This command handles production deployment with pre-flight checks, deployment execution, and verification.

---

## Sub-commands

```
/deploy            - Interactive deployment wizard
/deploy check      - Run pre-deployment checks only
/deploy preview    - Deploy to preview/staging
/deploy production - Deploy to production
/deploy rollback   - Rollback to previous version
```

---

## Pre-Deployment Checklist (MANDATÓRIO)

Before any production deployment:

```markdown
## 🚀 Pre-Deploy Checklist (P0)

### 1. 🔒 Backup Mandatório
- [ ] Snapshot de dados gerado e arquivado em `backups/pre-deploy-[timestamp]/`
- [ ] Configurações e variáveis de ambiente preservadas
- [ ] Ponto de restauração / rollback criado no Git

### 2. 🧪 Validação dos Testes de Deploy
- [ ] Suíte de validação 100% verde (`npm run validate:report` - 48 cenários / 100 passos aprovados)
- [ ] Relatório HTML inspecionado (`reports/guardian-test-report.html`)
- [ ] Checagem estrita de tipos sem erros (`npx tsc --noEmit`)
- [ ] Build de produção compilado com sucesso (`npm run build`)

### 3. 🚫 Escopo Blindado
- [ ] Verificado que nenhuma funcionalidade adicional não autorizada foi criada
- [ ] Apenas o escopo solicitado pelo usuário foi alterado

### 4. 🛑 Gate de Autorização Humana (OBRIGATÓRIO)
- [ ] Apresentar resumo completo de validações e backup ao usuário
- [ ] Pergunta obrigatória: "Você autoriza a subida para produção agora?"
- [ ] AGUARDAR confirmação expressa do usuário (NUNCA disparar deploy automático)
```

---

## Deployment Flow

```
┌─────────────────┐
│  /deploy        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Pre-flight     │
│  checks         │
└────────┬────────┘
         │
    Pass? ──No──► Fix issues
         │
        Yes
         │
         ▼
┌─────────────────┐
│  Build          │
│  application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Deploy to      │
│  platform       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Health check   │
│  & verify       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ✅ Complete    │
└─────────────────┘
```

---

## Output Format

### Successful Deploy

```markdown
## 🚀 Deployment Complete

### Summary
- **Version:** v1.2.3
- **Environment:** production
- **Duration:** 47 seconds
- **Platform:** Vercel

### URLs
- 🌐 Production: https://app.example.com
- 📊 Dashboard: https://vercel.com/project

### What Changed
- Added user profile feature
- Fixed login bug
- Updated dependencies

### Health Check
✅ API responding (200 OK)
✅ Database connected
✅ All services healthy
```

### Failed Deploy

```markdown
## ❌ Deployment Failed

### Error
Build failed at step: TypeScript compilation

### Details
```
error TS2345: Argument of type 'string' is not assignable...
```

### Resolution
1. Fix TypeScript error in `src/services/user.ts:45`
2. Run `npm run build` locally to verify
3. Try `/deploy` again

### Rollback Available
Previous version (v1.2.2) is still active.
Run `/deploy rollback` if needed.
```

---

## Platform Support

| Platform | Command | Notes |
|----------|---------|-------|
| Vercel | `vercel --prod` | Auto-detected for Next.js |
| Railway | `railway up` | Needs Railway CLI |
| Fly.io | `fly deploy` | Needs flyctl |
| Docker | `docker compose up -d` | For self-hosted |

---

## Examples

```
/deploy
/deploy check
/deploy preview
/deploy production --skip-tests
/deploy rollback
```
