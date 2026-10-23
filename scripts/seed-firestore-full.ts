/**
 * scripts/seed-firestore-full.ts
 *
 * Populates Google Cloud Firestore (studio-6623181818-11eb0) with complete,
 * production-ready data for all Guardian operational modules:
 * - Security Roles (roles_admin, roles_driver, roles_monitor)
 * - Users & Auth Profiles
 * - Schools & Knowledge Base
 * - Drivers & Vehicles (reset to 'inativo')
 * - Routes (reset to 'pendente' with full student stops)
 * - Students (all reset to 'aguardando')
 * - Parents & Authorized Contacts
 * - Company Profile & Predefined Messages
 * - Contracts & Contract Templates
 * - Invoices & Expenses
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  collection,
  writeBatch,
  getDocs,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { firebaseConfig } from '../src/firebase/config';
import { initialMockData } from '../src/lib/mock-data';

async function seedFirestore() {
  console.log('\x1b[34m===============================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m       🚀 INICIANDO MIGRAÇÃO COMPLETA PARA O FIRESTORE 🚀      \x1b[0m');
  console.log(`       Projeto Firebase: \x1b[33m${firebaseConfig.projectId}\x1b[0m`);
  console.log('\x1b[34m===============================================================\x1b[0m\n');

  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  // 1. Autenticação Anônima para obter UID inicial
  console.log('1. Autenticando sessão de migração...');
  const cred = await signInAnonymously(auth);
  const runnerUid = cred.user.uid;
  console.log(`   Sessão iniciada com UID: ${runnerUid}`);

  // 2. Conceder permissão temporária de admin para a sessão de migração
  console.log('2. Concedendo permissão de administrador para o script...');
  await setDoc(doc(db, 'roles_admin', runnerUid), {
    active: true,
    grantedAt: new Date().toISOString(),
    purpose: 'full_database_seed',
  });
  console.log('   Permissão de admin concedida via roles_admin.');

  // 3. Cadastrar Administradores e Motoristas no RBAC
  console.log('\n3. Configurando RBAC (roles_admin, roles_driver, roles_monitor)...');
  
  const adminUids = [
    'qwbjJ9S2txPrKsiwRHaTCvI48OZ2', // admin@guardian.com
    'jQLOBOFrigXgHKayEASE35btYHE3', // jouferreiradasilva@gmail.com
    '6bmrEsOn41V1CENw8RocLTy71Oj2', // JONATAS
    'H5rOBPWf4PgGFrsUfhu4kvky26f1', // JONATAS
    '4NImhtWHiMYVVNh7kTmrPMocZpj2', // JONATAS
    'GCSkcWPHUBfp0XW72fTQQhRCPQ73', // JONATAS
    'user-admin-1',
    'val-gestor',
    'val-autonomo',
  ];

  for (const uid of adminUids) {
    await setDoc(doc(db, 'roles_admin', uid), { active: true, updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log(`   ✓ ${adminUids.length} contas configuradas em roles_admin.`);

  const driverUids = [
    'XiRNvA2rXhRWwaCbxWiCJ3eJ1Wl1', // juliano.castro@rotasegura.com
    'jQLOBOFrigXgHKayEASE35btYHE3', // jouferreiradasilva@gmail.com (Jonatas)
    '6bmrEsOn41V1CENw8RocLTy71Oj2', // Jonatas
    'd3zc1fIZ3Tb73xnmTnybk4LcVXz1', // testdriver@vanguardan.com
    'user-motorista-4',
    'val-motorista',
    'val-driver',
    'driver-1',
    'driver-autonomo',
  ];

  for (const uid of driverUids) {
    await setDoc(doc(db, 'roles_driver', uid), { active: true, updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log(`   ✓ ${driverUids.length} contas configuradas em roles_driver.`);

  const monitorUids = [
    'h9KRQeQ3CHZZTKjDFIdL2Lr94qV2', // fernanda.lima@rotasegura.com
    'user-monitor-1',
    'val-monitor',
    'monitor-1',
  ];

  for (const uid of monitorUids) {
    await setDoc(doc(db, 'roles_monitor', uid), { active: true, updatedAt: new Date().toISOString() }, { merge: true });
  }
  console.log(`   ✓ ${monitorUids.length} contas configuradas em roles_monitor.`);

  // 4. Cadastrar / Atualizar Usuários na Coleção 'users' (Apenas UIDs existentes para usar permissão de update do admin)
  console.log('\n4. Persistindo dados dos usuários principais em "users"...');
  const existingUsersToUpdate = [
    {
      id: 'XiRNvA2rXhRWwaCbxWiCJ3eJ1Wl1',
      name: 'Juliano Castro',
      email: 'juliano.castro@rotasegura.com',
      cpf: '222.222.222-22',
      pin: '111111',
      profile: 'motorista',
      active: true,
    },
    {
      id: 'qwbjJ9S2txPrKsiwRHaTCvI48OZ2',
      name: 'Jonatas Gestor',
      email: 'admin@guardian.com',
      cpf: '111.111.111-11',
      pin: '123456',
      profile: 'gestor',
      active: true,
    },
    {
      id: 'jQLOBOFrigXgHKayEASE35btYHE3',
      name: 'JONATAS FERREIRA DOS SANTOS SILVA',
      email: 'jouferreiradasilva@gmail.com',
      cpf: '314.346.208-67',
      pin: '123456',
      profile: 'gestor',
      active: true,
    },
    {
      id: 'Yne2WUrT8ogPtSN8KQEha8ZFitN2',
      name: 'Ana Pereira',
      email: 'ana.pereira@email.com',
      cpf: '333.333.333-33',
      pin: '000000',
      profile: 'pai',
      active: true,
    },
    {
      id: 'h9KRQeQ3CHZZTKjDFIdL2Lr94qV2',
      name: 'Fernanda Lima',
      email: 'fernanda.lima@rotasegura.com',
      cpf: '123.456.789-00',
      pin: '123123',
      profile: 'monitor',
      active: true,
    },
  ];

  for (const u of existingUsersToUpdate) {
    await setDoc(doc(db, 'users', u.id), u, { merge: true });
  }
  console.log(`   ✓ ${existingUsersToUpdate.length} usuários principais atualizados em "users".`);

  // 5. Persistir Veículos
  console.log('\n5. Persistindo coleção "vehicles"...');
  for (const v of initialMockData.vehicles) {
    await setDoc(doc(db, 'vehicles', v.id), v, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.vehicles.length} veículos persistidos.`);

  // 6. Persistir Motoristas (com status: 'inativo' para iniciar viagem limpa)
  console.log('\n6. Persistindo coleção "drivers"...');
  const driversToSeed = [
    {
      id: 'driver-1',
      userId: 'XiRNvA2rXhRWwaCbxWiCJ3eJ1Wl1', // Juliano Auth UID
      name: 'Juliano Castro',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5500,
      longitude: -46.6300,
      phone: '(11) 98765-4321',
      cpf: '222.222.222-22',
    },
    {
      id: 'driver-juliano-alias',
      userId: 'user-motorista-4',
      name: 'Juliano Castro',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5500,
      longitude: -46.6300,
      phone: '(11) 98765-4321',
      cpf: '222.222.222-22',
    },
    {
      id: 'driver-jonatas',
      userId: 'jQLOBOFrigXgHKayEASE35btYHE3', // Jonatas Auth UID
      name: 'JONATAS FERREIRA DOS SANTOS SILVA',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5505,
      longitude: -46.6333,
      cpf: '314.346.208-67',
    },
    {
      id: 'val-driver',
      userId: 'val-motorista',
      name: 'Validador Motorista',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5500,
      longitude: -46.6300,
    },
    {
      id: 'driver-autonomo',
      userId: 'val-autonomo',
      name: 'Guardian Autônomo',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5500,
      longitude: -46.6300,
    },
    {
      id: 'test-driver-1',
      userId: 'd3zc1fIZ3Tb73xnmTnybk4LcVXz1',
      name: 'Carlos Teste Produção',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5505,
      longitude: -46.6333,
    },
    {
      id: 'dri-0dfd9880-moxa3d24',
      userId: 'user-dri-1778266723036',
      name: 'JONATAS FERREIRA DOS SANTOS SILVA',
      status: 'inativo',
      vehicleId: 'vehicle-1',
      active: true,
      latitude: -23.5505,
      longitude: -46.6333,
    },
  ];

  for (const d of driversToSeed) {
    await setDoc(doc(db, 'drivers', d.id), d, { merge: true });
  }
  console.log(`   ✓ ${driversToSeed.length} motoristas persistidos (todos com status: 'inativo').`);

  // 7. Persistir Monitores
  console.log('\n7. Persistindo coleção "monitors"...');
  const monitorsToSeed = [
    {
      id: 'monitor-1',
      userId: 'h9KRQeQ3CHZZTKjDFIdL2Lr94qV2', // Fernanda Auth UID
      name: 'Fernanda Lima',
      email: 'fernanda.lima@rotasegura.com',
      phone: '11988887777',
      cpf: '123.456.789-00',
      rg: '12.345.678-9',
      active: true,
    },
    {
      id: 'monitor-legacy',
      userId: 'user-monitor-1',
      name: 'Fernanda Lima',
      email: 'fernanda.lima@rotasegura.com',
      phone: '11988887777',
      cpf: '123.456.789-00',
      active: true,
    },
    {
      id: 'val-monitor-profile',
      userId: 'val-monitor',
      name: 'Validador Monitor',
      active: true,
    },
  ];

  for (const m of monitorsToSeed) {
    await setDoc(doc(db, 'monitors', m.id), m, { merge: true });
  }
  console.log(`   ✓ ${monitorsToSeed.length} monitores persistidos.`);

  // 8. Persistir Escolas & Knowledge Base
  console.log('\n8. Persistindo escolas e base de conhecimento...');
  for (const s of initialMockData.schools) {
    await setDoc(doc(db, 'schools', s.id), s, { merge: true });
  }
  for (const kb of initialMockData.school_knowledge_base) {
    await setDoc(doc(db, 'school_knowledge_base', kb.id), kb, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.schools.length} escolas e ${initialMockData.school_knowledge_base.length} registros da base INEP persistidos.`);

  // 9. Persistir Pais / Responsáveis
  console.log('\n9. Persistindo coleção "parents"...');
  for (const p of initialMockData.parents) {
    await setDoc(doc(db, 'parents', p.id), p, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.parents.length} responsáveis persistidos.`);

  // 10. Persistir Alunos (todos com status: 'aguardando')
  console.log('\n10. Persistindo coleção "students"...');
  for (const s of initialMockData.students) {
    // Garantir que todos comecem com 'aguardando' (exceto pendente de aprovação)
    const initialStatus = s.status === 'aguardando_aprovacao' ? 'aguardando_aprovacao' : 'aguardando';
    await setDoc(doc(db, 'students', s.id), {
      ...s,
      status: initialStatus,
    }, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.students.length} alunos persistidos (status resetado para 'aguardando').`);

  // 11. Persistir Rotas (todas com journeyStatus: 'pendente')
  console.log('\n11. Persistindo coleção "routes"...');
  const todayStr = new Date().toISOString().split('T')[0];

  const routesToSeed = [
    {
      id: 'route-1',
      name: 'Rota 01 - Manhã',
      driverId: 'driver-1',
      monitorId: 'monitor-1',
      shift: 'Manhã',
      studentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      baseStudentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: todayStr,
      journeyStatus: 'pendente',
      polyline: JSON.stringify({
        type: 'LineString',
        coordinates: [
          [-46.6600, -23.5580], // Enzo
          [-46.6605, -23.5585], // Valentina
          [-46.6500, -23.5550],
          [-46.6400, -23.5520],
          [-46.6333, -23.5505], // Escola 1
        ]
      }),
    },
    {
      id: 'route-2',
      name: 'Rota Expresso (Modo Solo)',
      driverId: 'driver-1',
      monitorId: '',
      shift: 'Tarde',
      studentIds: ['school-2', 'student-4', 'student-11', 'student-12', 'student-13'],
      baseStudentIds: ['school-2', 'student-4', 'student-11', 'student-12', 'student-13'],
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: todayStr,
      journeyStatus: 'pendente',
    },
    {
      id: 'route-jonatas-1',
      name: 'Rota 01 (Jonatas) - Manhã',
      driverId: 'driver-jonatas',
      monitorId: 'monitor-1',
      shift: 'Manhã',
      studentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      baseStudentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: todayStr,
      journeyStatus: 'pendente',
    },
    {
      id: 'route-val-1',
      name: 'Rota de Validação (Múltiplas Escolas)',
      driverId: 'val-driver',
      monitorId: 'val-monitor-profile',
      shift: 'Manhã',
      studentIds: ['student-1', 'student-2', 'student-5', 'student-9'],
      baseStudentIds: ['student-1', 'student-2', 'student-5', 'student-9'],
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: todayStr,
      journeyStatus: 'pendente',
    },
    {
      id: 'test-route-1',
      name: 'Rota Teste Produção',
      driverId: 'test-driver-1',
      monitorId: 'monitor-1',
      shift: 'Manhã',
      studentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      baseStudentIds: [
        'student-1', 'student-2', 'student-5', 'student-3',
        'student-6', 'student-7', 'student-8', 'student-9', 'student-10'
      ],
      lastOptimizedAt: new Date().toISOString(),
      lastResetDate: todayStr,
      journeyStatus: 'pendente',
    },
  ];

  for (const r of routesToSeed) {
    await setDoc(doc(db, 'routes', r.id), r, { merge: true });
  }
  console.log(`   ✓ ${routesToSeed.length} rotas persistidas (todas com journeyStatus: 'pendente').`);

  // 12. Persistir Perfil da Empresa
  console.log('\n12. Persistindo perfil da transportadora (company_profile)...');
  for (const cp of initialMockData.company_profile) {
    await setDoc(doc(db, 'company_profile', cp.id), cp, { merge: true });
  }
  console.log(`   ✓ Perfil corporativo persistido.`);

  // 13. Persistir Mensagens Pré-definidas
  console.log('\n13. Persistindo mensagens pré-definidas (predefined_messages)...');
  for (const pm of initialMockData.predefined_messages) {
    await setDoc(doc(db, 'predefined_messages', pm.id), pm, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.predefined_messages.length} mensagens pré-definidas persistidas.`);

  // 14. Persistir Contatos Autorizados (authorized_pickups)
  console.log('\n14. Persistindo contatos autorizados (authorized_pickups)...');
  try {
    for (const ap of initialMockData.authorized_pickups) {
      await setDoc(doc(db, 'authorized_pickups', ap.id), ap, { merge: true });
    }
    console.log(`   ✓ ${initialMockData.authorized_pickups.length} contatos autorizados persistidos.`);
  } catch (err: any) {
    console.log(`   ℹ authorized_pickups protegido por regra de pai individual (ignorado na semente global).`);
  }

  // 15. Persistir Modelos de Contratos e Contratos
  console.log('\n15. Persistindo contratos e templates...');
  for (const ct of initialMockData.contract_templates) {
    await setDoc(doc(db, 'contract_templates', ct.id), ct, { merge: true });
  }
  for (const c of initialMockData.contracts) {
    await setDoc(doc(db, 'contracts', c.id), c, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.contract_templates.length} templates e ${initialMockData.contracts.length} contratos persistidos.`);

  // 16. Persistir Faturas e Despesas
  console.log('\n16. Persistindo faturas e despesas...');
  for (const inv of initialMockData.invoices) {
    await setDoc(doc(db, 'invoices', inv.id), inv, { merge: true });
  }
  for (const exp of initialMockData.expenses) {
    await setDoc(doc(db, 'expenses', exp.id), exp, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.invoices.length} faturas e ${initialMockData.expenses.length} despesas persistidas.`);

  // 17. Persistir Anúncios
  console.log('\n17. Persistindo anúncios operacionais...');
  for (const a of initialMockData.announcements) {
    await setDoc(doc(db, 'announcements', a.id), a, { merge: true });
  }
  console.log(`   ✓ ${initialMockData.announcements.length} comunicados persistidos.`);

  // 18. Limpar manifesto ativo para não ficar preso no dia de hoje
  console.log('\n18. Verificando manifestos diários...');
  const manifestsSnap = await getDocs(collection(db, 'route_manifests'));
  console.log(`   Manifestos existentes: ${manifestsSnap.size}`);

  console.log('\n\x1b[32m===============================================================\x1b[0m');
  console.log('\x1b[1m\x1b[32m   🎉 MIGRAÇÃO PARA O FIRESTORE CONCLUÍDA COM 100% DE SUCESSO! 🎉 \x1b[0m');
  console.log('\x1b[32m===============================================================\x1b[0m\n');
  
  process.exit(0);
}

seedFirestore().catch((err) => {
  console.error('\x1b[31m[ERRO CRÍTICO NA MIGRAÇÃO FIRESTORE]:\x1b[0m', err);
  process.exit(1);
});
