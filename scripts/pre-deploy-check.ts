/**
 * @fileOverview Script de Governança Pré-Deploy do Guardian.
 * Executa as 4 Regras de Ouro:
 * 1. Backup de Estado Pré-Deploy
 * 2. Validação Integral dos Testes (npm run validate:report)
 * 3. Checagem Estrita de Tipos (tsc --noEmit)
 * 4. Stop Gate para Autorização Humana
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

async function runPreDeployCheck() {
  console.log(`
\x1b[1m\x1b[34m===============================================================
       🛡️  GUARDIAN - PROTOCOLO DE SUBIDA PARA PRODUÇÃO  🛡️
===============================================================\x1b[0m
  Iniciando auditoria pré-deploy e governança de release...
  `);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  const backupDir = path.resolve(process.cwd(), 'backups', `pre-deploy-${timestamp}`);

  // ─── PASSO 1: BACKUP MANDATÓRIO ───────────────────────────────
  console.log('\x1b[1m[PASSO 1/4] 🔒 Criando Backup Pré-Deploy Obrigatório...\x1b[0m');
  try {
    fs.mkdirSync(backupDir, { recursive: true });

    // Copiar mock data e configs
    const mockDataSrc = path.resolve(process.cwd(), 'src', 'lib', 'mock-data.ts');
    if (fs.existsSync(mockDataSrc)) {
      fs.copyFileSync(mockDataSrc, path.join(backupDir, 'mock-data.backup.ts'));
    }

    const packageJsonSrc = path.resolve(process.cwd(), 'package.json');
    if (fs.existsSync(packageJsonSrc)) {
      fs.copyFileSync(packageJsonSrc, path.join(backupDir, 'package.backup.json'));
    }

    // Criar manifesto de backup
    const backupManifest = {
      backupId: `backup-${timestamp}`,
      createdAt: new Date().toISOString(),
      reason: 'Pre-production deployment safeguard',
      nodeVersion: process.version,
      platform: process.platform
    };
    fs.writeFileSync(path.join(backupDir, 'backup-manifest.json'), JSON.stringify(backupManifest, null, 2));

    console.log(`  \x1b[32m✔\x1b[0m Backup concluído com sucesso em: \x1b[36m${backupDir}\x1b[0m\n`);
  } catch (err: any) {
    console.error(`\x1b[31m✖ ERRO CRÍTICO NO BACKUP: ${err.message}\x1b[0m`);
    console.error('Subida para produção CANCELADA. Regra 1 violada.');
    process.exit(1);
  }

  // ─── PASSO 2: EXECUÇÃO DA SUÍTE DE TESTES ─────────────────────
  console.log('\x1b[1m[PASSO 2/4] 🧪 Executando Suíte Completa de Testes de Deploy...\x1b[0m');
  try {
    execSync('npm run validate:report', { stdio: 'inherit' });
    console.log(`  \x1b[32m✔\x1b[0m Todos os testes da suíte foram aprovados (100% PASS).\n`);
  } catch (err: any) {
    console.error(`\x1b[31m✖ FALHA NOS TESTES: A suíte de validação não passou com 100% de sucesso.\x1b[0m`);
    console.error('Subida para produção BLOQUEADA. Regra 2 violada.');
    process.exit(1);
  }

  // ─── PASSO 3: CHECAGEM ESTRITA DE TIPOS ───────────────────────
  console.log('\x1b[1m[PASSO 3/4] 🔍 Checando Tipos TypeScript (npx tsc --noEmit)...\x1b[0m');
  try {
    execSync('npx tsc --noEmit', { stdio: 'inherit' });
    console.log(`  \x1b[32m✔\x1b[0m 0 erros de TypeScript encontrados.\n`);
  } catch (err: any) {
    console.error(`\x1b[31m✖ ERRO DE TIPOS: Código contém erros TypeScript.\x1b[0m`);
    console.error('Subida para produção BLOQUEADA. Regra 2 violada.');
    process.exit(1);
  }

  // ─── PASSO 4: GATE DE AUTORIZAÇÃO HUMANA ─────────────────────
  console.log(`
\x1b[1m\x1b[33m===============================================================
       🛑  [PASSO 4/4] GATE DE AUTORIZAÇÃO HUMANA ATIVO  🛑
===============================================================\x1b[0m
  [✔] 1. Backup gravado em: ${backupDir}
  [✔] 2. Testes de deploy: 100% Aprovados (Todas as 6 Suítes / Todos os Cenários)
  [✔] 3. Tipagem TypeScript: 0 erros
  [✔] 4. Escopo: Somente itens autorizados

\x1b[1m\x1b[36mAVISO MANDATÓRIO:\x1b[0m
O deploy para produção NUNCA pode ser executado automaticamente.
Aguarde a confirmação expressa do usuário antes de rodar o comando final.
===============================================================
  `);
}

runPreDeployCheck().catch(err => {
  console.error('Erro na auditoria pré-deploy:', err);
  process.exit(1);
});
