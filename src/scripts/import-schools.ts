import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { firebaseConfig } from '../firebase/config';

// Initialize Firebase Client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const CSV_FILE_PATH = path.join(process.cwd(), 'Análise - Tabela da lista das escolas - Detalhado.csv');

// Regex/String parser for concatenated address fields
function parseAddress(addressStr: string) {
  const cepMatch = addressStr.match(/(\d{5}-\d{3})/);
  const cep = cepMatch ? cepMatch[1] : '';

  let streetPart = addressStr;
  if (cepMatch && cepMatch.index !== undefined) {
    streetPart = addressStr.substring(0, cepMatch.index).trim();
  }

  // Clean trailing punctuation
  streetPart = streetPart.replace(/[\s.,;-]+$/, '').trim();

  let street = streetPart;
  let number = 'S/N';
  let neighborhood = '';

  const commaIndex = streetPart.indexOf(',');
  if (commaIndex !== -1) {
    street = streetPart.substring(0, commaIndex).trim();
    const rest = streetPart.substring(commaIndex + 1).trim();

    const numMatch = rest.match(/^(\d+|S\/N|SN|s\/n|sn|S\/Nº|s\/nº|KM\s*\d+|KM\s*-\s*\d+)\b/i);
    if (numMatch) {
      number = numMatch[1].trim();
      neighborhood = rest.substring(number.length).trim();
    } else {
      number = 'S/N';
      neighborhood = rest;
    }
  } else {
    const numMatch = streetPart.match(/\s(\d+|S\/N|SN|s\/n|sn|S\/Nº|s\/nº)\s*$/i);
    if (numMatch && numMatch.index !== undefined) {
      number = numMatch[1].trim();
      street = streetPart.substring(0, numMatch.index).trim();
      neighborhood = '';
    }
  }

  neighborhood = neighborhood.replace(/^[\s.,;-]+|[\s.,;-]+$/g, '').trim();
  if (!neighborhood) {
    neighborhood = 'Centro';
  }

  return { street, number, neighborhood, cep };
}

// Convert coordinates formatted with multiple dots (e.g., -8.758.459) to correct floats
function parseCoordinate(coordStr: string, isLongitude: boolean): number | null {
  const clean = coordStr.replace(/\s+/g, '').replace(/,/g, '.');
  if (!clean || clean === '0' || clean.includes(';')) return null;

  const isNegative = clean.startsWith('-');
  const digits = clean.replace(/[^\d]/g, '');
  if (!digits) return null;

  let valStr = '';
  if (isLongitude) {
    // Brazil longitudes are always in the range -34 to -74 (2 digits before dot)
    valStr = (isNegative ? '-' : '') + digits.substring(0, 2) + '.' + digits.substring(2);
  } else {
    // Brazil latitudes are usually between 5 and -35
    const firstTwo = parseInt(digits.substring(0, 2), 10);
    if (firstTwo >= 10 && firstTwo <= 35) {
      valStr = (isNegative ? '-' : '') + digits.substring(0, 2) + '.' + digits.substring(2);
    } else {
      valStr = (isNegative ? '-' : '') + digits.substring(0, 1) + '.' + digits.substring(1);
    }
  }

  const val = parseFloat(valStr);
  return isNaN(val) ? null : val;
}

// Interactive command line interface or CLI Arguments
const args = process.argv.slice(2);
const argUfIndex = args.indexOf('--uf');
const cliUF = argUfIndex !== -1 ? args[argUfIndex + 1].trim().toUpperCase() : null;
const skipConfirm = args.includes('--yes');

const rl = (cliUF && skipConfirm) ? null : readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function executeUpload(schoolsToImport: any[], totalToUpload: number) {
  console.log('\n🚀 Iniciando upload de dados em lotes (Batches de 500)...');
  
  const batchSize = 500;
  let batchCount = 0;
  let successCount = 0;
  let currentBatch = writeBatch(db);

  const startTime = Date.now();

  for (let i = 0; i < totalToUpload; i++) {
    const school = schoolsToImport[i];
    const docRef = doc(db, 'school_knowledge_base', school.id);
    
    currentBatch.set(docRef, school);
    batchCount++;

    if (batchCount === batchSize || i === totalToUpload - 1) {
      const batchIndex = Math.ceil((i + 1) / batchSize);
      const totalBatches = Math.ceil(totalToUpload / batchSize);
      
      try {
        await currentBatch.commit();
        successCount += batchCount;
        
        const elapsedTime = (Date.now() - startTime) / 1000;
        const progress = (successCount / totalToUpload) * 100;
        const estTotalTime = (elapsedTime / successCount) * totalToUpload;
        const remainingTime = estTotalTime - elapsedTime;

        console.log(`📦 Lote ${batchIndex}/${totalBatches} enviado! Progresso: ${progress.toFixed(1)}% (${successCount}/${totalToUpload}) - Tempo Restante Estimado: ${remainingTime.toFixed(0)}s`);
      } catch (err: any) {
        console.error(`\n❌ Erro ao enviar lote ${batchIndex}:`, err.message || err);
      }

      currentBatch = writeBatch(db);
      batchCount = 0;
    }
  }

  const totalElapsedTime = (Date.now() - startTime) / 1000;
  console.log('\n==================================================');
  console.log('🎉 SEEDING CONCLUÍDO COM SUCESSO! 🎉');
  console.log(`🟢 Importadas: ${successCount}/${totalToUpload} escolas.`);
  console.log(`⏱️ Tempo total gasto: ${totalElapsedTime.toFixed(1)} segundos.`);
  console.log('==================================================\n');

  if (rl) rl.close();
  process.exit(0);
}

async function runImport(selectedUF: string, confirmUpload: boolean) {
  console.log(`\n🔍 Analisando arquivo CSV para o estado: "${selectedUF}"...`);

  const fileStream = fs.createReadStream(CSV_FILE_PATH, { encoding: 'utf8' });
  const lineReader = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let rowCount = 0;
  let schoolsToImport: any[] = [];

  for await (const line of lineReader) {
    rowCount++;
    if (rowCount === 1) continue; // Skip header

    const parts = line.split(';');
    if (parts.length < 5) continue;

    const [name, inepCode, uf, city, addressRaw, phone, latRaw, lngRaw] = parts;

    if (selectedUF !== 'TODOS' && uf.trim().toUpperCase() !== selectedUF) {
      continue;
    }

    const parsedAddr = parseAddress(addressRaw || '');
    const lat = parseCoordinate(latRaw || '', false);
    const lng = parseCoordinate(lngRaw || '', true);

    schoolsToImport.push({
      id: `kb-${inepCode.trim()}`,
      inepCode: inepCode.trim(),
      name: name.trim(),
      state: uf.trim().toUpperCase(),
      city: city.trim(),
      street: parsedAddr.street,
      number: parsedAddr.number,
      neighborhood: parsedAddr.neighborhood,
      zipCode: parsedAddr.cep,
      phone: (phone || '').trim(),
      latitude: lat,
      longitude: lng,
      createdAt: new Date().toISOString()
    });
  }

  const totalToUpload = schoolsToImport.length;
  console.log(`\n✅ Encontradas ${totalToUpload} escolas correspondentes ao filtro!`);

  if (totalToUpload === 0) {
    console.log('ℹ️ Nenhuma escola encontrada para importar.');
    if (rl) rl.close();
    process.exit(0);
  }

  if (!confirmUpload && rl) {
    rl.question(`⚠️ Deseja prosseguir com o upload de ${totalToUpload} escolas para o Firestore? (S/N): `, async (confirm) => {
      if (confirm.trim().toUpperCase() !== 'S') {
        console.log('❌ Importação cancelada pelo usuário.');
        rl.close();
        process.exit(0);
      }
      await executeUpload(schoolsToImport, totalToUpload);
    });
  } else {
    await executeUpload(schoolsToImport, totalToUpload);
  }
}

async function main() {
  console.log('\n==================================================');
  console.log('⚡ SEEDER INTELIGENTE DE ESCOLAS (INEP -> FIRESTORE) ⚡');
  console.log('==================================================\n');

  if (!fs.existsSync(CSV_FILE_PATH)) {
    console.error(`❌ Erro: O arquivo CSV de escolas não foi encontrado no caminho:\n${CSV_FILE_PATH}\n`);
    if (rl) rl.close();
    process.exit(1);
  }

  if (cliUF) {
    console.log(`🤖 Modo automático ativado para o estado: "${cliUF}"`);
    await runImport(cliUF, skipConfirm);
  } else if (rl) {
    rl.question('Qual estado deseja importar? (Digite a sigla, ex: SP, RO, RJ, ou digite "TODOS"): ', async (ufInput) => {
      const selectedUF = ufInput.trim().toUpperCase();
      if (!selectedUF) {
        console.log('❌ Estado inválido. Encerrando.');
        rl.close();
        process.exit(1);
      }

      await runImport(selectedUF, false);
    });
  }
}

main().catch(err => {
  console.error('❌ Erro fatal no seeder:', err);
  process.exit(1);
});
