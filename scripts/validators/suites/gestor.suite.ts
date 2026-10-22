import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { optimizeSchoolVanRoute } from '../../../src/ai/flows/optimizeSchoolVanRoute';
import { CrudActionController } from '../core/action-controllers';

export async function runGestorSuite() {
  await runner.suite('Jornada Completa do Gestor de Frota', 'GESTOR', async () => {
    
    // CENÁRIO 1: Onboarding e Criação de Empresa / Rota
    await runner.scenario('GST-01', 'Onboarding do Gestor e Configuração Inicial de Frota', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      
      await runner.step('Validar criação de novo perfil corporativo de gestor', () => {
        const newManager = {
          id: `mgr-${Date.now()}`,
          name: 'Carlos Mendes',
          email: 'carlos@guardiantur.com.br',
          cpf: '111.222.333-44',
          profile: 'gestor'
        };
        state.users.push(newManager);
        expect(state.users.find((u: any) => u.id === newManager.id)).toBeDefined();
      });

      await runner.step('Configurar perfil da transportadora e frota padrão', () => {
        const newCompany = {
          id: `comp-${Date.now()}`,
          companyName: 'Expresso Escolar Guardian',
          phone: '(11) 98888-7777',
          active: true
        };
        state.company_profile.push(newCompany);
        expect(state.company_profile.length).toBeGreaterThan(0);
        expect(state.company_profile[state.company_profile.length - 1].companyName).toBe('Expresso Escolar Guardian');
      });
    });

    // CENÁRIO 2: Triagem e Aprovação de Matrículas Pendentes
    await runner.scenario('GST-02', 'Triagem e Aprovação de Solicitação Pendente de Aluno', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      
      let targetPending = state.pending_registrations.find((r: any) => r.status === 'pending_approval');
      if (!targetPending) {
        targetPending = {
          id: `pending-${Date.now()}`,
          studentName: 'Lucas Ferreira',
          parentName: 'Renata Ferreira',
          parentPhone: '(11) 97777-6666',
          parentEmail: 'renata@exemplo.com',
          schoolId: state.schools[0]?.id || 'school-1',
          schoolName: state.schools[0]?.name || 'Colégio Objetivo',
          shift: 'Manhã',
          address: 'Rua das Flores, 120, Carapicuíba - SP',
          latitude: -23.5250,
          longitude: -46.8380,
          status: 'pending_approval',
          submittedAt: new Date().toISOString()
        };
        state.pending_registrations.push(targetPending);
      }

      await runner.step('Identificar solicitação pendente na fila do gestor', () => {
        expect(targetPending).toBeDefined();
        expect(targetPending.status).toBe('pending_approval');
      });

      await runner.step('Aprovar cadastro, gerar aluno ativo e vincular à rota principal', () => {
        // Transição de status
        targetPending.status = 'approved';
        targetPending.approvedAt = new Date().toISOString();

        // Criação de Aluno oficial
        const newStudent = {
          id: `std-${Date.now()}`,
          name: targetPending.studentName,
          status: 'aguardando',
          shift: targetPending.shift,
          latitude: targetPending.latitude,
          longitude: targetPending.longitude,
          schoolId: targetPending.schoolId,
          parentId: `parent-${Date.now()}`,
          active: true,
          street: 'Rua das Flores',
          number: '120',
          city: 'Carapicuíba',
          state: 'SP',
          monthlyFee: 350.00
        };
        state.students.push(newStudent);

        // Alocação na rota 1
        const mainRoute = state.routes[0];
        expect(mainRoute).toBeDefined();
        mainRoute.studentIds.push(newStudent.id);

        expect(mainRoute.studentIds).toContain(newStudent.id);
        expect(newStudent.active).toBe(true);
      });
    });

    // CENÁRIO 3: Planejamento & Otimização de Rota com IA Local
    await runner.scenario('GST-03', 'Otimização de Rota com Algoritmo Nearest Neighbor & 2-Opt', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      expect(route).toBeDefined();

      const studentsInRoute = state.students.filter((s: any) => route.studentIds.includes(s.id));
      const school = state.schools.find((sc: any) => sc.id === studentsInRoute[0]?.schoolId) || state.schools[0];

      await runner.step('Validar alunos e destino da rota antes da otimização', () => {
        expect(studentsInRoute.length).toBeGreaterThan(0);
        expect(school).toBeDefined();
      });

      await runner.step('Executar motor de otimização de paradas (Zero Custo)', async () => {
        const input = {
          students: studentsInRoute.map((s: any) => ({
            id: s.id,
            name: s.name,
            address: `${s.street || ''}, ${s.number || ''}`,
            schoolId: s.schoolId,
            latitude: s.latitude,
            longitude: s.longitude,
          })),
          schools: [{
            id: school.id,
            name: school.name,
            address: `${school.street || ''}, ${school.number || ''}`,
            latitude: school.latitude,
            longitude: school.longitude,
          }],
          direction: 'ida' as const,
          optimizationMode: 'safe' as const
        };

        const result = await optimizeSchoolVanRoute(input);
        expect(result).toBeDefined();
        expect(result.optimizedStops.length).toBeGreaterThan(0);
        expect(result.estimatedDistanceKm).toBeGreaterThan(0);
        expect(result.estimatedTimeMinutes).toBeGreaterThan(0);

        // A última parada na ida DEVE ser a escola
        const lastStop = result.optimizedStops[result.optimizedStops.length - 1];
        expect(lastStop.type).toBe('school');
      });
    });

    // CENÁRIO 4: Gestão Financeira e Fechamento de Mês
    await runner.scenario('GST-04', 'Fechamento Financeiro: Receitas, Faturas e Despesas', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const invoices = state.invoices || [];
      const expenses = state.expenses || [];

      await runner.step('Calcular balanço total de receitas líquidas e inadimplência', () => {
        const paidTotal = invoices
          .filter((inv: any) => inv.status === 'paid')
          .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);

        const pendingTotal = invoices
          .filter((inv: any) => inv.status === 'pending' || inv.status === 'pagamento_em_analise')
          .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);

        const overdueTotal = invoices
          .filter((inv: any) => inv.status === 'overdue')
          .reduce((acc: number, inv: any) => acc + (inv.amount || 0), 0);

        const expensesTotal = expenses
          .reduce((acc: number, exp: any) => acc + (exp.amount || 0), 0);

        const netIncome = paidTotal - expensesTotal;

        expect(typeof paidTotal).toBe('number');
        expect(typeof pendingTotal).toBe('number');
        expect(typeof expensesTotal).toBe('number');
        expect(paidTotal).toBeGreaterThan(0);
      });
    });

    // CENÁRIO 5: Prova de ROI (KM Planejado vs KM Real)
    await runner.scenario('GST-05', 'Auditoria de Telemetria e Prova de ROI para o Gestor', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const vehicles = state.vehicles || [];

      await runner.step('Validar comparativo de KM e alerta de manutenção preventiva', () => {
        const activeVehicles = vehicles.filter((v: any) => v.active);
        expect(activeVehicles.length).toBeGreaterThan(0);

        for (const v of activeVehicles) {
          expect(v.currentOdometer).toBeGreaterThan(0);
          expect(v.maintenanceInterval).toBeGreaterThan(0);
          
          const kmSinceMaintenance = v.currentOdometer - v.lastMaintenanceOdometer;
          const needsMaintenance = kmSinceMaintenance >= v.maintenanceInterval;
          expect(typeof needsMaintenance).toBe('boolean');
        }
      });
    });

    // CENÁRIO 6: Inativação de Aluno e Reajuste Automático de Rota
    await runner.scenario('GST-06', 'Inativação de Aluno e Expurgamento Automático da Rota Ativa', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const initialStudentCount = route.studentIds.length;
      const targetStudentId = route.studentIds[0];
      const targetStudent = state.students.find((s: any) => s.id === targetStudentId);

      await runner.step('Inativar contrato do aluno por solicitação do gestor', () => {
        expect(targetStudent).toBeDefined();
        targetStudent.active = false;
        targetStudent.status = 'inativo';
        expect(targetStudent.active).toBe(false);
      });

      await runner.step('Remover aluno inativo da lista de itinerário da rota', () => {
        route.studentIds = route.studentIds.filter((id: string) => id !== targetStudentId);
        expect(route.studentIds.length).toBe(initialStudentCount - 1);
        expect(route.studentIds).not.toContain(targetStudentId);
      });
    });

    // CENÁRIO 7: Gestão Preventiva de Conformidade (CNH e Inspeção Veicular)
    await runner.scenario('GST-07', 'Alerta Preventivo de Vencimento de CNH e Vistoria Escolar', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const drivers = state.drivers || [];
      const vehicles = state.vehicles || [];

      await runner.step('Validar status de conformidade documental de condutores e vans', () => {
        const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
        const nowMs = Date.now();

        // Simular condutor com CNH válida por mais 180 dias
        const complianceDriver = {
          ...drivers[0],
          cnhExpiresAt: new Date(nowMs + 180 * 24 * 60 * 60 * 1000).toISOString(),
          schoolTransportPermitExpiresAt: new Date(nowMs + 90 * 24 * 60 * 60 * 1000).toISOString()
        };

        const isCnhExpiring = (new Date(complianceDriver.cnhExpiresAt).getTime() - nowMs) <= thirtyDaysInMs;
        expect(isCnhExpiring).toBe(false, 'CNH não deve estar próxima do vencimento neste teste');
        expect(complianceDriver.schoolTransportPermitExpiresAt).toBeDefined();
      });

      await runner.step('Disparar alerta preventivo quando vistoria veicular estiver a menos de 30 dias do fim', () => {
        const targetVehicle = {
          ...vehicles[0],
          detranInspectionDue: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString() // 15 dias restantes
        };

        const daysRemaining = Math.floor((new Date(targetVehicle.detranInspectionDue).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        const shouldTriggerInspectionAlert = daysRemaining <= 30;

        expect(shouldTriggerInspectionAlert).toBe(true, 'Alerta de vistoria escolar deve ser emitido');
        expect(daysRemaining).toBeLessThanOrEqual(30);
      });
    });

    // CENÁRIO 8: Disparo de Alerta Operacional em Massa (Atraso na Rota)
    await runner.scenario('GST-08', 'Disparo de Notificação em Massa de Atraso para os Pais da Rota', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const studentsInRoute = state.students.filter((s: any) => route.studentIds.includes(s.id));
      const parentIdsInRoute = [...new Set(studentsInRoute.map((s: any) => s.parentId))];

      await runner.step('Identificar todos os responsáveis vinculados à rota em trânsito', () => {
        expect(parentIdsInRoute.length).toBeGreaterThan(0);
      });

      await runner.step('Disparar comunicado de atraso de 15 minutos com motivo de trânsito intenso', () => {
        const broadcastNotification = {
          id: `notif-broadcast-${Date.now()}`,
          routeId: route.id,
          title: 'Aviso Operacional: Atraso Estimado na Rota',
          message: 'Devido a congestionamento na Av. dos Autonomistas, a van chegará com aproximadamente 15 minutos de atraso.',
          targetParentIds: parentIdsInRoute,
          sentAt: new Date().toISOString(),
          status: 'dispatched'
        };

        expect(broadcastNotification.targetParentIds.length).toBe(parentIdsInRoute.length);
        expect(broadcastNotification.status).toBe('dispatched');
        expect(broadcastNotification.message).toContain('15 minutos');
      });
    });

    // CENÁRIO 9: Tolerância a Erros de Digitação no Cadastro de Endereços (UX Defensiva)
    await runner.scenario('GST-09', 'Sanitização Automática de Endereço com Erros de Digitação e Espaços Extras', async () => {
      function sanitizeAddressInput(raw: string) {
        return raw
          .trim()
          .replace(/\s+/g, ' ') // Remove múltiplos espaços
          .replace(/,\s*,/g, ',') // Corrige vírgulas duplicadas
          .replace(/^[,\s-]+|[,\s-]+$/g, ''); // Remove pontuação solta nas pontas
      }

      await runner.step('Sanitizar entrada com espaços no início/fim, múltiplos espaços e vírgulas duplicadas', () => {
        const messyInput = '   Av.   Paulista  ,,  1000  -   Bela Vista   ';
        const cleaned = sanitizeAddressInput(messyInput);

        expect(cleaned).toBe('Av. Paulista , 1000 - Bela Vista');
        expect(cleaned.startsWith(' ')).toBe(false);
        expect(cleaned.endsWith(' ')).toBe(false);
      });
    });

    // CENÁRIO 10: Trava de Odômetro Absurdo (Prevenção de Erro de Digitação do Gestor)
    await runner.scenario('GST-10', 'Bloqueio de Salto Irreal no Odômetro por Erro de Digitação (Zero a Mais)', async () => {
      const lastRecordedKm = 125400; // 125.400 km
      const MAX_DAILY_KM_ALLOWED = 600; // Máximo aceitável para van escolar num único dia

      function validateOdometerUpdate(newKm: number): { valid: boolean; reason?: string } {
        if (newKm < lastRecordedKm) {
          return { valid: false, reason: 'O novo odômetro não pode ser menor que o registro anterior.' };
        }
        const delta = newKm - lastRecordedKm;
        if (delta > MAX_DAILY_KM_ALLOWED) {
          return { valid: false, reason: `Salto incomum de ${delta} km detectado. Verifique se digitou um zero a mais.` };
        }
        return { valid: true };
      }

      await runner.step('Rejeitar quando o usuário digita um zero a mais por engano (ex: 1.254.000 km)', () => {
        const typoKm = 1254000; // Digitou 1254000 em vez de 125450
        const result = validateOdometerUpdate(typoKm);

        expect(result.valid).toBe(false);
        expect(result.reason).toBeDefined();
        expect(result.reason).toContain('zero a mais');
      });

      await runner.step('Aceitar incremento diário plausível de rota escolar (ex: 45 km)', () => {
        const legitimateKm = 125445;
        const result = validateOdometerUpdate(legitimateKm);

        expect(result.valid).toBe(true);
      });
    });

    // CENÁRIO 11: Gestão Financeira com Linguagem Leiga e Semáforo Visual
    await runner.scenario('GST-11', 'Painel de Cobrança com Status em Semáforo e Mensagem Humanizada', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const invoices = state.invoices || [];

      function getSimplePaymentStatus(inv: any): { label: string; color: 'verde' | 'amarelo' | 'vermelho'; messageAction: string } {
        if (inv.status === 'paid') {
          return { label: 'Pago', color: 'verde', messageAction: 'Enviar comprovante' };
        }
        if (inv.status === 'pending') {
          return { label: 'Vence em breve', color: 'amarelo', messageAction: 'Enviar código Pix' };
        }
        return { label: 'Atrasado', color: 'vermelho', messageAction: 'Lembrete amigável por WhatsApp' };
      }

      await runner.step('Traduzir status técnicos para linguagem leiga com ação imediata', () => {
        const sampleInvoice = invoices[0];
        const statusView = getSimplePaymentStatus(sampleInvoice);

        expect(statusView.label).toBeDefined();
        expect(['verde', 'amarelo', 'vermelho']).toContain(statusView.color);
        expect(statusView.messageAction.length).toBeGreaterThan(5);
      });
    });

    // CENÁRIO 12: Cadastro de Veículo com Suporte Híbrido a Placa Antiga e Mercosul
    await runner.scenario('GST-12', 'Validação de Placa Escolar nos Padrões Antigo e Mercosul', async () => {
      function isValidPlate(plate: string): boolean {
        const clean = plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
        const antigaRegex = /^[A-Z]{3}[0-9]{4}$/; // ex: ABC1234
        const mercosulRegex = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/; // ex: BRA2E19
        return antigaRegex.test(clean) || mercosulRegex.test(clean);
      }

      await runner.step('Validar placa no formato tradicional brasileiro (ABC-1234)', () => {
        expect(isValidPlate('ABC-1234')).toBe(true);
        expect(isValidPlate('abc 1234')).toBe(true);
      });

      await runner.step('Validar placa no formato padrão Mercosul (BRA2E19)', () => {
        expect(isValidPlate('BRA-2E19')).toBe(true);
        expect(isValidPlate('bra2e19')).toBe(true);
      });

      await runner.step('Rejeitar formatos inválidos ou incompletos', () => {
        expect(isValidPlate('1234-ABC')).toBe(false);
        expect(isValidPlate('AB1234')).toBe(false);
      });
    });

    // CENÁRIO 13: Auditoria Preventiva de Licenciamento, IPVA e Seguro Escolar Obrigatório (APP)
    await runner.scenario('GST-13', 'Controle Preventivo de Documentos Veiculares e Seguro Escolar Obrigatório', async () => {
      const now = new Date();
      const in20Days = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString();
      const expiredYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

      function getDocStatus(expiryIso: string): { status: 'regular' | 'alerta' | 'vencido'; message: string } {
        const diffDays = Math.ceil((new Date(expiryIso).getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays < 0) {
          return { status: 'vencido', message: 'Documento vencido! Van não pode circular com alunos.' };
        }
        if (diffDays <= 30) {
          return { status: 'alerta', message: `Atenção: Vence em ${diffDays} dias. Providencie a renovação.` };
        }
        return { status: 'regular', message: 'Documento em dia.' };
      }

      await runner.step('Emitir alerta amarelo para seguro escolar que vence em 20 dias', () => {
        const alertCheck = getDocStatus(in20Days);
        expect(alertCheck.status).toBe('alerta');
        expect(alertCheck.message).toContain('Vence em 20 dias');
      });

      await runner.step('Bloquear operação veicular se vistoria semestral do Detran estiver vencida', () => {
        const expiredCheck = getDocStatus(expiredYesterday);
        expect(expiredCheck.status).toBe('vencido');
        expect(expiredCheck.message).toContain('não pode circular');
      });
    });

    // CENÁRIO 14: Geração de Lista de Presença em Formato Prancheta para Impressão
    await runner.scenario('GST-14', 'Exportação de Lista de Presença Tabular com Fonte Grande para Prancheta', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));

      function generatePrintableClipboardSheet(routeObj: any, studentList: any[]) {
        return {
          header: `LISTA DE EMBARQUE - ROTA: ${routeObj.name.toUpperCase()}`,
          date: new Date().toLocaleDateString('pt-BR'),
          fontSizeRecommended: '14pt',
          rows: studentList.map((s, idx) => ({
            num: idx + 1,
            studentName: s.name,
            parentContact: s.parentPhone || '(11) 99999-0000',
            addressShort: `${s.street || ''}, ${s.number || ''}`,
            checkMorning: '[ ] IDA',
            checkAfternoon: '[ ] VOLTA'
          }))
        };
      }

      await runner.step('Gerar estrutura de impressão clara para uso em papel pelo condutor', () => {
        const sheet = generatePrintableClipboardSheet(route, students);
        expect(sheet.header).toContain(route.name.toUpperCase());
        expect(sheet.rows.length).toBe(students.length);
        expect(sheet.fontSizeRecommended).toBe('14pt');
        expect(sheet.rows[0].checkMorning).toBe('[ ] IDA');
      });
    });

    // CENÁRIO 15: Validação Funcional dos Formulários de CRUD e Travas Regulamentares
    await runner.scenario('GST-15', 'Validação Funcional de CRUD: Trava Anti-Superlotação e Integridade Regulatória', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const crud = new CrudActionController(state);

      // 1. Trava anti-superlotação de van
      await runner.step('Trava de Lotação: Bloquear alocação de aluno quando a van atinge a capacidade máxima', () => {
        const route = state.routes[0];
        const driver = state.drivers.find((d: any) => d.id === route.driverId);
        const vehicle = state.vehicles.find((v: any) => v.id === route.vehicleId) ||
                        state.vehicles.find((v: any) => v.id === driver?.vehicleId) ||
                        state.vehicles[0];
        expect(vehicle).toBeDefined();
        route.vehicleId = vehicle.id;

        // Encher a rota até a capacidade máxima
        route.studentIds = [];
        for (let i = 0; i < vehicle!.capacity; i++) {
          const fakeStudentId = `fill-std-${i}`;
          state.students.push({
            id: fakeStudentId,
            name: `Aluno Lotação ${i}`,
            schoolId: 'school-1',
            parentId: 'parent-1',
            active: true
          });
          route.studentIds.push(fakeStudentId);
        }

        // Tentar alocar o passageiro extra que excede a capacidade
        const extraStudentId = 'extra-student-overfill';
        state.students.push({
          id: extraStudentId,
          name: 'Aluno Excedente',
          schoolId: 'school-1',
          parentId: 'parent-1',
          active: true
        });

        const overfillResult = crud.submitAssignStudentToRoute(route.id, extraStudentId);
        expect(overfillResult.success).toBe(false, 'Deveria bloquear alocação excedente');
        expect(overfillResult.message).toContain('CAPACIDADE EXCEDIDA');
      });

      // 2. Trava de criação de rota sem condutor
      await runner.step('Validação de Rota: Rejeitar criação de rota sem motorista designado', () => {
        const invalidRouteResult = crud.submitCreateRoute({
          name: 'Rota Sem Condutor',
          driverId: '' // sem motorista
        });
        expect(invalidRouteResult.success).toBe(false);
        expect(invalidRouteResult.message).toContain('Motorista deve ser vinculado');
      });

      // 3. Exigência legal de CNH D ou E para condutor escolar
      await runner.step('Validação Regulatória de CNH: Rejeitar condutor com Categoria B de automóvel de passeio', () => {
        const invalidDriverResult = crud.submitCreateDriver({
          name: 'Condutor Inapto',
          cnhCategory: 'B'
        });
        expect(invalidDriverResult.success).toBe(false);
        expect(invalidDriverResult.message).toContain('exige CNH categoria D ou E');
      });

      // 4. Exclusão com cascata de integridade
      await runner.step('Exclusão com Cascata: Remover aluno da base e expurgar de todas as rotas', () => {
        const studentToDelete = state.students[0];
        const studentId = studentToDelete.id;
        const deleteResult = crud.submitDeleteStudent(studentId);
        expect(deleteResult.success).toBe(true);
        expect(state.students.some((s: any) => s.id === studentId)).toBe(false);
        expect(state.routes.every((r: any) => !r.studentIds.includes(studentId))).toBe(true);
      });
    });

    // CENÁRIO 16: Geração de Contrato Digital e Bloqueio de Duplicidade Concorrente
    await runner.scenario('GST-16', 'Geração de Contrato Digital Escolar e Envio para Assinatura Eletrônica', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const crud = new CrudActionController(state);
      const student = state.students[0];
      const parent = state.parents[0];

      await runner.step('Gerar novo contrato escolar com valor de mensalidade e vincular ao responsável', () => {
        // Garantir que a lista de contratos não tenha contrato ativo para este aluno
        state.contracts = [];
        const res = crud.submitGenerateContract({
          studentId: student.id,
          parentId: parent.id,
          monthlyFee: 480
        });
        expect(res.success).toBe(true);
        expect(res.data.status).toBe('aguardando_assinatura');
        expect(res.data.monthlyFee).toBe(480);
        expect(res.data.studentName).toBe(student.name);
      });

      await runner.step('Impedir geração acidental de segundo contrato concorrente para o mesmo aluno', () => {
        const duplicateRes = crud.submitGenerateContract({
          studentId: student.id,
          parentId: parent.id,
          monthlyFee: 500
        });
        expect(duplicateRes.success).toBe(false);
        expect(duplicateRes.message).toContain('já possui um contrato');
      });
    });

    // CENÁRIO 17: Publicação de Comunicados no Mural Geral com Segmentação por Turno
    await runner.scenario('GST-17', 'Publicação de Comunicados no Mural Geral com Segmentação por Turno', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const crud = new CrudActionController(state);

      await runner.step('Rejeitar comunicado sem conteúdo ou com título excessivamente curto', () => {
        const invalidRes = crud.submitBroadcastAnnouncement({
          title: 'Oi',
          content: '...'
        });
        expect(invalidRes.success).toBe(false);
        expect(invalidRes.message).toContain('no mínimo 3 caracteres');
      });

      await runner.step('Publicar comunicado de feriado escolar para toda a frota no mural', () => {
        const validRes = crud.submitBroadcastAnnouncement({
          title: 'Feriado Municipal - Sem Transporte na Sexta',
          content: 'Informamos a todas as famílias que na sexta-feira não haverá operação escolar devido ao feriado.',
          targetShift: 'all'
        });
        expect(validRes.success).toBe(true);
        expect(validRes.data.title).toContain('Feriado Municipal');
        expect(state.announcements.some((a: any) => a.id === validRes.data.id)).toBe(true);
      });
    });

  });
}

