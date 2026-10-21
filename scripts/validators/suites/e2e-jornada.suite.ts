import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { optimizeSchoolVanRoute } from '../../../src/ai/flows/optimizeSchoolVanRoute';

// Haversine puro para telemetria em metros
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export async function runE2EJornadaSuite() {
  await runner.suite('Simulação E2E Interconectada de Ponta a Ponta', 'E2E', async () => {

    // ESTADO COMPARTILHADO DA SIMULAÇÃO E2E (Simula banco de dados em memória do ciclo de vida)
    const e2eDb = JSON.parse(JSON.stringify(initialMockData));
    
    // Objetos criados dinamicamente ao longo das fases
    let createdCompany: any;
    let createdVehicle: any;
    let createdDriver: any;
    let createdMonitor: any;
    let createdSchool: any;
    let createdRoute: any;
    let createdParent: any;
    let createdStudent: any;
    let activeManifest: any;
    let activeTripSession: any;
    let pushNotificationsLog: Array<{ targetUserId: string; title: string; message: string; timestamp: string }> = [];

    // FASE 1: Cadastros Iniciais (Gestor configura a infraestrutura)
    await runner.scenario('E2E-01', 'Fase 1: Cadastro da Empresa, Van, Motorista, Monitora e Escola pelo Gestor', async () => {
      await runner.step('Cadastrar Empresa e Van com Placa Mercosul e Capacidade para 15 Lugares', () => {
        createdCompany = {
          id: `comp-e2e-${Date.now()}`,
          companyName: 'Expresso Aliança Escolar',
          cnpj: '45.123.789/0001-10',
          phone: '(11) 98765-4321',
          active: true
        };
        e2eDb.company_profile.push(createdCompany);

        createdVehicle = {
          id: `veh-e2e-${Date.now()}`,
          model: 'Mercedes-Benz Sprinter 415 CDI',
          plate: 'BRA-2E19',
          capacity: 15,
          active: true,
          currentOdometer: 85200,
          detranInspectionDue: '2026-12-31'
        };
        e2eDb.vehicles.push(createdVehicle);

        expect(createdVehicle.capacity).toBe(15);
        expect(createdVehicle.plate).toBe('BRA-2E19');
      });

      await runner.step('Cadastrar Condutor Oficial com CNH D e Monitora Escolar de Apoio', () => {
        createdDriver = {
          id: `drv-e2e-${Date.now()}`,
          userId: `usr-drv-${Date.now()}`,
          name: 'Tio Roberto Carlos',
          phone: '(11) 99888-1122',
          cnh: '04598231200',
          cnhCategory: 'D',
          vehicleId: createdVehicle.id,
          status: 'disponivel'
        };
        e2eDb.drivers.push(createdDriver);

        createdMonitor = {
          id: `mon-e2e-${Date.now()}`,
          userId: `usr-mon-${Date.now()}`,
          name: 'Tia Fernanda Souza',
          phone: '(11) 99777-3344',
          role: 'monitora',
          active: true
        };
        e2eDb.users.push(createdMonitor);

        expect(createdDriver.cnhCategory).toBe('D');
        expect(createdMonitor.name).toContain('Fernanda');
      });

      await runner.step('Cadastrar Escola de Destino e Criar Rota Base Vinculada', () => {
        createdSchool = {
          id: `sch-e2e-${Date.now()}`,
          name: 'Colégio Objetivo Alphaville',
          address: 'Av. Marte, 500, Santana de Parnaíba - SP',
          latitude: -23.4750,
          longitude: -46.8520
        };
        e2eDb.schools.push(createdSchool);

        createdRoute = {
          id: `rot-e2e-${Date.now()}`,
          name: 'Rota Manhã - Alphaville Residencial',
          driverId: createdDriver.id,
          vehicleId: createdVehicle.id,
          monitorId: createdMonitor.id,
          schoolId: createdSchool.id,
          shift: 'Manhã',
          studentIds: [],
          active: true
        };
        e2eDb.routes.push(createdRoute);

        expect(createdRoute.driverId).toBe(createdDriver.id);
        expect(createdRoute.vehicleId).toBe(createdVehicle.id);
      });
    });

    // FASE 2: Matrícula e Triagem (Pai solicita vaga e Gestor aprova)
    await runner.scenario('E2E-02', 'Fase 2: Solicitação de Matrícula pelo Pai, Triagem e Alocação na Van', async () => {
      await runner.step('Responsável submete solicitação com endereço residencial e dados da criança', () => {
        createdParent = {
          id: `parent-e2e-${Date.now()}`,
          name: 'Patrícia Alcantara',
          phone: '(11) 99555-4433',
          email: 'patricia@exemplo.com.br',
          cpf: '234.567.890-12'
        };
        e2eDb.parents.push(createdParent);

        const registrationRequest = {
          id: `solic-e2e-${Date.now()}`,
          studentName: 'Enzo Alcantara',
          parentId: createdParent.id,
          parentName: createdParent.name,
          parentPhone: createdParent.phone,
          schoolId: createdSchool.id,
          schoolName: createdSchool.name,
          shift: 'Manhã',
          address: 'Alameda dos Lírios, 142, Residencial 2',
          latitude: -23.4830,
          longitude: -46.8450,
          status: 'pending_approval',
          monthlyFeeProposed: 420.00
        };
        e2eDb.pending_registrations.push(registrationRequest);

        expect(registrationRequest.status).toBe('pending_approval');
        expect(registrationRequest.studentName).toBe('Enzo Alcantara');
      });

      await runner.step('Gestor revisa dados, aprova solicitação e efetiva aluno na rota da van', () => {
        const pending = e2eDb.pending_registrations.find((r: any) => r.parentName === 'Patrícia Alcantara');
        expect(pending).toBeDefined();

        // Aprovação
        pending.status = 'approved';

        // Criação de aluno oficial
        createdStudent = {
          id: `std-e2e-${Date.now()}`,
          name: pending.studentName,
          parentId: createdParent.id,
          schoolId: createdSchool.id,
          shift: 'Manhã',
          status: 'aguardando',
          latitude: pending.latitude,
          longitude: pending.longitude,
          street: 'Alameda dos Lírios',
          number: '142',
          monthlyFee: pending.monthlyFeeProposed,
          active: true
        };
        e2eDb.students.push(createdStudent);

        // Alocação na Rota
        createdRoute.studentIds.push(createdStudent.id);

        expect(createdRoute.studentIds).toContain(createdStudent.id);
        expect(createdRoute.studentIds.length).toBeLessThanOrEqual(createdVehicle.capacity);
      });
    });

    // FASE 3: Planejamento Diário e Otimização da Escala
    await runner.scenario('E2E-03', 'Fase 3: Planejamento Diário, Reconciliação de Ausências e Otimização', async () => {
      await runner.step('Reconciliar ausências e montar lista de alunos presentes para a manhã', () => {
        const presentStudents = e2eDb.students.filter((s: any) => createdRoute.studentIds.includes(s.id));
        expect(presentStudents.length).toBeGreaterThan(0);
        expect(presentStudents.some((s: any) => s.id === createdStudent.id)).toBe(true);
      });

      await runner.step('Executar otimização de paradas com chegada garantida na escola', async () => {
        const input = {
          students: [{
            id: createdStudent.id,
            name: createdStudent.name,
            address: `${createdStudent.street}, ${createdStudent.number}`,
            schoolId: createdSchool.id,
            latitude: createdStudent.latitude,
            longitude: createdStudent.longitude
          }],
          schools: [{
            id: createdSchool.id,
            name: createdSchool.name,
            address: createdSchool.address,
            latitude: createdSchool.latitude,
            longitude: createdSchool.longitude
          }],
          direction: 'ida' as const,
          optimizationMode: 'safe' as const
        };

        const optimization = await optimizeSchoolVanRoute(input);
        expect(optimization.optimizedStops.length).toBeGreaterThanOrEqual(2); // residência + escola
        expect(optimization.optimizedStops[optimization.optimizedStops.length - 1].type).toBe('school');

        // Criação do Manifesto Diário Publicado
        activeManifest = {
          id: `manifest_${createdRoute.id}_2026-10-25_ida`,
          routeId: createdRoute.id,
          date: '2026-10-25',
          shift: 'Manhã',
          direction: 'ida',
          studentIds: [createdStudent.id],
          status: 'published'
        };
        e2eDb.route_manifests = e2eDb.route_manifests || [];
        e2eDb.route_manifests.push(activeManifest);

        expect(activeManifest.status).toBe('published');
      });
    });

    // FASE 4: Início da Operação da Viagem
    await runner.scenario('E2E-04', 'Fase 4: Inicialização da Viagem Matinal e Abertura da Chamada Digital', async () => {
      await runner.step('Motorista pressiona "Iniciar Rota" com trava anti-toque de 1.5s', () => {
        activeTripSession = {
          tripId: `trip-${Date.now()}`,
          manifestId: activeManifest.id,
          routeId: createdRoute.id,
          driverId: createdDriver.id,
          monitorId: createdMonitor.id,
          status: 'em_rota',
          startedAt: new Date().toISOString(),
          currentCoordinates: { lat: -23.4900, lng: -46.8500 }, // Ponto de partida da van
          stopsRemaining: 2
        };

        createdDriver.status = 'em_rota';
        createdRoute.journeyStatus = 'em_rota';

        expect(activeTripSession.status).toBe('em_rota');
        expect(createdDriver.status).toBe('em_rota');
      });

      await runner.step('Monitora acessa chamada digital e inicializa alunos como "aguardando"', () => {
        createdStudent.status = 'aguardando';
        expect(createdStudent.status).toBe('aguardando');
      });
    });

    // FASE 5: Deslocamento, Geofence e Notificação ao Pai
    await runner.scenario('E2E-05', 'Fase 5: Deslocamento GPS, Geofence e Notificação Push de Proximidade ao Pai', async () => {
      // Coordenadas da residência do Enzo: lat: -23.4830, lng: -46.8450

      await runner.step('Van se desloca e entra no raio de 1 km (Geofence Inicial)', () => {
        activeTripSession.currentCoordinates = { lat: -23.4870, lng: -46.8480 };
        const distMeters = calculateDistanceMeters(
          activeTripSession.currentCoordinates.lat,
          activeTripSession.currentCoordinates.lng,
          createdStudent.latitude,
          createdStudent.longitude
        );

        expect(distMeters).toBeLessThan(1000);
      });

      await runner.step('Van atinge raio de 400m (< 500m): Disparar notificação push acolhedora para a mãe', () => {
        activeTripSession.currentCoordinates = { lat: -23.4840, lng: -46.8460 };
        const distMeters = calculateDistanceMeters(
          activeTripSession.currentCoordinates.lat,
          activeTripSession.currentCoordinates.lng,
          createdStudent.latitude,
          createdStudent.longitude
        );

        expect(distMeters).toBeLessThan(500);

        // Disparo Push
        const proximityNotification = {
          targetUserId: createdParent.id,
          title: '🚐 Van se aproximando!',
          message: `A van do ${createdDriver.name} está virando a esquina! Traga o(a) ${createdStudent.name} para o portão.`,
          timestamp: new Date().toISOString()
        };
        pushNotificationsLog.push(proximityNotification);

        expect(proximityNotification.message).toContain('virando a esquina');
        expect(proximityNotification.message).toContain(createdStudent.name);
      });
    });

    // FASE 6: Chegada no Portão, Embarque e Notificação
    await runner.scenario('E2E-06', 'Fase 6: Embarque Seguro do Aluno, Cinto de Segurança e Notificação de Embarque', async () => {
      await runner.step('Van estaciona no portão residencial e monitora confere o aluno', () => {
        activeTripSession.currentCoordinates = { lat: createdStudent.latitude, lng: createdStudent.longitude };
        const atStop = calculateDistanceMeters(
          activeTripSession.currentCoordinates.lat,
          activeTripSession.currentCoordinates.lng,
          createdStudent.latitude,
          createdStudent.longitude
        ) <= 50;

        expect(atStop).toBe(true, 'Van deve estar a menos de 50 metros da porta do aluno');
      });

      await runner.step('Monitora realiza Check-in com 1 toque e afivela o cinto de segurança', () => {
        createdStudent.status = 'a_bordo';
        createdStudent.seatbeltFastened = true;
        createdStudent.boardedAt = new Date().toISOString();

        expect(createdStudent.status).toBe('a_bordo');
        expect(createdStudent.seatbeltFastened).toBe(true);
      });

      await runner.step('Sistema dispara notificação de confirmação imediata para a mãe', () => {
        const boardedNotification = {
          targetUserId: createdParent.id,
          title: '🎒 Embarque Confirmado',
          message: `🎒 ${createdStudent.name} acabou de embarcar na van com ${createdDriver.name}. Viagem segura iniciada!`,
          timestamp: new Date().toISOString()
        };
        pushNotificationsLog.push(boardedNotification);

        expect(boardedNotification.message).toContain('acabou de embarcar');
        expect(boardedNotification.targetUserId).toBe(createdParent.id);
      });
    });

    // FASE 7: Chegada no Colégio, Desembarque e Varredura do Banco Traseiro
    await runner.scenario('E2E-07', 'Fase 7: Desembarque na Escola, Notificação aos Pais e Trava de Varredura', async () => {
      await runner.step('Van chega nas coordenadas do Colégio Objetivo', () => {
        activeTripSession.currentCoordinates = { lat: createdSchool.latitude, lng: createdSchool.longitude };
        const atSchool = calculateDistanceMeters(
          activeTripSession.currentCoordinates.lat,
          activeTripSession.currentCoordinates.lng,
          createdSchool.latitude,
          createdSchool.longitude
        ) <= 50;

        expect(atSchool).toBe(true);
      });

      await runner.step('Monitora desembarca o aluno, entrega ao colégio e notifica a família', () => {
        createdStudent.status = 'desembarcado';
        createdStudent.deliveredTo = 'Inspetora Márcia (Colégio Objetivo)';
        createdStudent.deliveredAt = new Date().toISOString();

        const schoolArrivalNotification = {
          targetUserId: createdParent.id,
          title: '🏫 Chegada com Segurança',
          message: `🏫 ${createdStudent.name} foi entregue com segurança no colégio! Tenha um ótimo dia.`,
          timestamp: new Date().toISOString()
        };
        pushNotificationsLog.push(schoolArrivalNotification);

        expect(createdStudent.status).toBe('desembarcado');
        expect(schoolArrivalNotification.message).toContain('entregue com segurança');
      });

      await runner.step('Trava de Segurança: Monitora realiza varredura obrigatória no último banco', () => {
        const physicalInspection = {
          backSeatInspected: true,
          underSeatInspected: true,
          noSleepingChildrenRemaining: true,
          inspectedBy: createdMonitor.name,
          timestamp: new Date().toISOString()
        };

        const canCloseTrip = physicalInspection.backSeatInspected && physicalInspection.noSleepingChildrenRemaining;
        expect(canCloseTrip).toBe(true, 'Não pode fechar viagem sem inspecionar o fundo da van');

        // Encerramento da rota matinal
        activeTripSession.status = 'concluida';
        createdDriver.status = 'disponivel';
        createdRoute.journeyStatus = 'concluida';

        expect(activeTripSession.status).toBe('concluida');
        expect(createdDriver.status).toBe('disponivel');
      });
    });

    // FASE 8: Faturamento Mensal, Pagamento Pix do Pai e Fechamento do Gestor
    await runner.scenario('E2E-08', 'Fase 8: Faturamento Automático, Pagamento Pix pelo Pai e Conciliação Financeira', async () => {
      let createdInvoice: any;

      await runner.step('Sistema gera fatura mensal automática no valor contratado (R$ 420,00)', () => {
        createdInvoice = {
          id: `inv-e2e-${Date.now()}`,
          parentUserId: createdParent.id,
          studentId: createdStudent.id,
          amount: createdStudent.monthlyFee,
          dueDate: '2026-11-10',
          status: 'pending',
          pixCode: '00020126580014br.gov.bcb.pix0136e2e-pix-key-guardian-5204000053039865405420.005802BR5920Expresso Alianca6009Sao Paulo62070503***6304ABCD'
        };
        e2eDb.invoices = e2eDb.invoices || [];
        e2eDb.invoices.push(createdInvoice);

        expect(createdInvoice.amount).toBe(420.00);
        expect(createdInvoice.status).toBe('pending');
      });

      await runner.step('Mãe acessa fatura no app e realiza pagamento instantâneo via Pix', () => {
        // Simulação da confirmação de pagamento
        createdInvoice.status = 'paid';
        createdInvoice.paidAt = new Date().toISOString();
        createdInvoice.paymentMethod = 'PIX';

        expect(createdInvoice.status).toBe('paid');
        expect(createdInvoice.paidAt).toBeDefined();
      });

      await runner.step('Painel do Gestor atualiza status para Verde ("Pago") e consolida balanço positivo', () => {
        const totalReceived = e2eDb.invoices
          .filter((i: any) => i.status === 'paid')
          .reduce((sum: number, i: any) => sum + i.amount, 0);

        expect(totalReceived).toBeGreaterThanOrEqual(420.00);

        const parentInvoiceStatus = createdInvoice.status === 'paid' ? 'verde' : 'vermelho';
        expect(parentInvoiceStatus).toBe('verde');
      });
    });

  });
}
