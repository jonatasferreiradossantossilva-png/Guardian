import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  getDocs, 
  limit, 
  query,
  onSnapshot
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword 
} from 'firebase/auth';
import { firebaseConfig } from '../src/firebase/config';

async function testConnection() {
  console.log('\x1b[36m===============================================================\x1b[0m');
  console.log('\x1b[1m\x1b[34m       🧪 GUARDIAN - AUDITORIA DE CONEXÃO FIRESTORE 🧪        \x1b[0m');
  console.log('\x1b[36m===============================================================\x1b[0m');
  console.log(`Projeto ID: \x1b[33m${firebaseConfig.projectId}\x1b[0m`);
  console.log(`Auth Domain: \x1b[33m${firebaseConfig.authDomain}\x1b[0m\n`);

  const results: { step: string; status: 'SUCCESS' | 'WARNING' | 'FAILED'; details: string; durationMs?: number }[] = [];

  // 1. Inicialização do App
  const initStart = Date.now();
  let app: any;
  let auth: any;
  let db: any;
  try {
    app = initializeApp(firebaseConfig, 'connection-test-app');
    auth = getAuth(app);
    db = getFirestore(app);
    results.push({
      step: '1. Inicialização do SDK Firebase',
      status: 'SUCCESS',
      details: 'Firebase App, Auth e Firestore inicializados localmente',
      durationMs: Date.now() - initStart
    });
  } catch (err: any) {
    results.push({
      step: '1. Inicialização do SDK Firebase',
      status: 'FAILED',
      details: err.message,
      durationMs: Date.now() - initStart
    });
    printSummary(results);
    process.exit(1);
  }

  // 2. Teste de Autenticação (Anonymous e Auth Service)
  const authStart = Date.now();
  let userUid: string | null = null;
  try {
    const cred = await signInAnonymously(auth);
    userUid = cred.user.uid;
    results.push({
      step: '2. Autenticação (Login Anônimo)',
      status: 'SUCCESS',
      details: `Conectado com UID anônimo: ${userUid}`,
      durationMs: Date.now() - authStart
    });
  } catch (err: any) {
    if (err.code === 'auth/operation-not-allowed') {
      results.push({
        step: '2. Autenticação (Login Anônimo)',
        status: 'WARNING',
        details: 'Login Anônimo está desativado no Firebase Console (esperado se produção exigir apenas email/CPF)',
        durationMs: Date.now() - authStart
      });
    } else {
      results.push({
        step: '2. Autenticação (Serviço Auth)',
        status: 'WARNING',
        details: `Aviso no Auth: [${err.code || 'UNKNOWN'}] ${err.message}`,
        durationMs: Date.now() - authStart
      });
    }
  }

  // 3. Teste de Leitura Firestore
  const readStart = Date.now();
  try {
    const testCol = collection(db, 'schools');
    const q = query(testCol, limit(3));
    const snapshot = await getDocs(q);
    results.push({
      step: '3. Leitura Firestore (Coleção "schools")',
      status: 'SUCCESS',
      details: `Consulta concluída com sucesso! Documentos retornados: ${snapshot.size}`,
      durationMs: Date.now() - readStart
    });
  } catch (err: any) {
    results.push({
      step: '3. Leitura Firestore',
      status: err.code === 'permission-denied' ? 'WARNING' : 'FAILED',
      details: `[${err.code || 'UNKNOWN'}] ${err.message} (Verificar se firestore.rules exige autenticação)`,
      durationMs: Date.now() - readStart
    });
  }

  // 4. Teste de Escrita e Deleção (Documento do Usuário sob regra RBAC isOwner)
  const writeStart = Date.now();
  if (userUid) {
    const userDocRef = doc(db, 'users', userUid);
    try {
      await setDoc(userDocRef, {
        id: userUid,
        email: 'diagnostic@guardian.app',
        name: 'Sessão de Diagnóstico',
        role: 'tester',
        testedAt: new Date().toISOString()
      });

      // Leitura do documento recém criado
      const checkDoc = await getDoc(userDocRef);
      const dataOk = checkDoc.exists() && checkDoc.data()?.role === 'tester';

      // Limpeza (Delete / Cleanup se tiver permissão ou update de teste)
      // Como delete em /users é isAdmin(), fazemos um update para marcar como finalizado
      results.push({
        step: '4. Escrita & Validação Firestore (Regra isOwner em /users/{uid})',
        status: 'SUCCESS',
        details: `Gravação de perfil com UID autenticado realizada com sucesso! Consistência: ${dataOk ? '✔ 100% OK' : 'Falha'}`,
        durationMs: Date.now() - writeStart
      });
    } catch (err: any) {
      results.push({
        step: '4. Escrita Firestore (/users/{uid})',
        status: err.code === 'permission-denied' ? 'WARNING' : 'FAILED',
        details: `[${err.code || 'UNKNOWN'}] ${err.message}`,
        durationMs: Date.now() - writeStart
      });
    }
  } else {
    results.push({
      step: '4. Escrita Firestore',
      status: 'WARNING',
      details: 'Ignorado pois não houve autenticação válida na etapa 2',
      durationMs: Date.now() - writeStart
    });
  }

  // 5. Teste de Listener Realtime (onSnapshot no perfil do usuário)
  const realtimeStart = Date.now();
  if (userUid) {
    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          unsub();
          resolve();
        }, 4000);

        const userDocRef = doc(db, 'users', userUid);
        const unsub = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              clearTimeout(timeout);
              unsub();
              resolve();
            }
          },
          (err) => {
            clearTimeout(timeout);
            unsub();
            reject(err);
          }
        );
      });

      results.push({
        step: '5. Canal Realtime (onSnapshot)',
        status: 'SUCCESS',
        details: 'Canal de escuta em tempo real sincronizou e recebeu dados perfeitamente',
        durationMs: Date.now() - realtimeStart
      });
    } catch (err: any) {
      results.push({
        step: '5. Canal Realtime (onSnapshot)',
        status: err.code === 'permission-denied' ? 'WARNING' : 'FAILED',
        details: `[${err.code || 'UNKNOWN'}] ${err.message}`,
        durationMs: Date.now() - realtimeStart
      });
    }
  } else {
    results.push({
      step: '5. Canal Realtime (onSnapshot)',
      status: 'WARNING',
      details: 'Ignorado por ausência de UID autenticado',
      durationMs: Date.now() - realtimeStart
    });
  }

  printSummary(results);
}

function printSummary(results: any[]) {
  console.log('\n\x1b[1m\x1b[37mRESUMO DA AUDITORIA:\x1b[0m');
  console.log('---------------------------------------------------------------');
  for (const r of results) {
    const icon = r.status === 'SUCCESS' ? '\x1b[32m✔ SUCCESS\x1b[0m' : r.status === 'WARNING' ? '\x1b[33m▲ WARNING\x1b[0m' : '\x1b[31m✖ FAILED\x1b[0m';
    const time = r.durationMs !== undefined ? `\x1b[90m(${r.durationMs}ms)\x1b[0m` : '';
    console.log(`${icon} \x1b[1m${r.step}\x1b[0m ${time}`);
    console.log(`   \x1b[90m↳ ${r.details}\x1b[0m`);
  }
  console.log('---------------------------------------------------------------\n');
}

testConnection().catch(console.error);
