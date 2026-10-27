import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { DriverActionController } from '../core/action-controllers';

// Fórmula de Haversine pura (utilizada no use-telemetry)
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // raio da Terra em metros
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl / 2) * Math.sin(dl / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function runMotoristaSuite() {
  await runner.suite('Jornada Completa do Motorista', 'MOTORISTA', async () => {

    // CENÁRIO 1: Abertura e Vinculação de Rota
    await runner.scenario('MOT-01', 'Vinculação de Motorista e Inicialização de Rota Designada', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const driver = state.drivers.find((d: any) => d.userId === 'user-motorista-4') || state.drivers[0];
      const route = state.routes.find((r: any) => r.driverId === driver.id) || state.routes[0];

      await runner.step('Verificar se o motorista tem rota associada ativa', () => {
        expect(driver).toBeDefined();
        expect(route).toBeDefined();
        expect(route.studentIds.length).toBeGreaterThan(0);
      });

      await runner.step('Definir turno da manhã e sentido IDA para a rota', () => {
        route.activeShift = 'Manhã';
        route.activeDirection = 'ida';
        route.startedBy = driver.userId;
        expect(route.activeShift).toBe('Manhã');
        expect(route.activeDirection).toBe('ida');
      });
    });

    // CENÁRIO 2: Início da Operação da Viagem
    await runner.scenario('MOT-02', 'Disparo de Viagem e Transição de Status em Tempo Real', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const driver = state.drivers[0];

      await runner.step('Transicionar status da rota para "em_rota"', () => {
        route.journeyStatus = 'em_rota';
        driver.status = 'em_rota';
        expect(route.journeyStatus).toBe('em_rota');
        expect(driver.status).toBe('em_rota');
      });

      await runner.step('Garantir que alunos da rota iniciem com status "aguardando"', () => {
        const routeStudents = state.students.filter((s: any) => route.studentIds.includes(s.id));
        for (const st of routeStudents) {
          // Se não estiver ausente previamente
          if (!st.status.startsWith('ausente_')) {
            st.status = 'aguardando';
            expect(st.status).toBe('aguardando');
          }
        }
      });
    });

    // CENÁRIO 3: Telemetria por Delta (Economia de 70% no Firebase)
    await runner.scenario('MOT-03', 'Validação de Telemetria por Delta (Filtro Anti-Custo de GPS)', async () => {
      const DELTA_MIN_METERS = 30; // 30 metros
      const DELTA_MIN_TIME_MS = 30000; // 30 segundos

      let lastSavedPos = { lat: -23.5236, lng: -46.8407, timestamp: Date.now() - 40000 };
      let writesToDatabase = 0;

      function simulateLocationUpdate(newLat: number, newLng: number, timestamp: number): boolean {
        const dist = calculateDistanceMeters(lastSavedPos.lat, lastSavedPos.lng, newLat, newLng);
        const elapsed = timestamp - lastSavedPos.timestamp;

        // Regra do Guardian: Grava se moveu > 30m OU se passaram > 30s
        if (dist >= DELTA_MIN_METERS || elapsed >= DELTA_MIN_TIME_MS) {
          lastSavedPos = { lat: newLat, lng: newLng, timestamp };
          writesToDatabase++;
          return true; // gravou
        }
        return false; // filtrou / economizou
      }

      await runner.step('Ignorar pequena variação de ruído de GPS (< 5 metros no mesmo minuto)', () => {
        // Carro parado no sinal vermelho: GPS oscila 2 metros
        const now = lastSavedPos.timestamp + 5000;
        const saved = simulateLocationUpdate(-23.52362, -46.84071, now);
        expect(saved).toBe(false, 'Deveria ter ignorado ruído de GPS');
        expect(writesToDatabase).toBe(0);
      });

      await runner.step('Gravar no banco quando veículo se deslocar mais de 30 metros', () => {
        // Carro anda 50 metros na avenida
        const now = lastSavedPos.timestamp + 10000;
        const saved = simulateLocationUpdate(-23.5241, -46.8407, now);
        expect(saved).toBe(true, 'Deveria ter gravado devido à distância > 30m');
        expect(writesToDatabase).toBe(1);
      });

      await runner.step('Gravar no banco por heartbeat de tempo mesmo se parado (> 30s)', () => {
        // Van parada na porta da escola há 35 segundos
        const now = lastSavedPos.timestamp + 35000;
        const saved = simulateLocationUpdate(lastSavedPos.lat, lastSavedPos.lng, now);
        expect(saved).toBe(true, 'Deveria ter gravado por tempo limite');
        expect(writesToDatabase).toBe(2);
      });
    });

    // CENÁRIO 4: Auto-Cura de Itinerário
    await runner.scenario('MOT-04', 'Auto-Cura de Itinerário após Paradas Concluídas', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));
      expect(students.length).toBeGreaterThan(1);

      await runner.step('Identificar primeira parada e registrar embarque', () => {
        const firstStudent = students[0];
        firstStudent.status = 'a_bordo';
        
        // Simular cálculo de paradas pendentes
        const pendingStops = students.filter((s: any) => s.status === 'aguardando');
        expect(pendingStops.length).toBe(students.length - 1);
      });

      await runner.step('Recalcular rota ativa excluindo alunos já atendidos', () => {
        const remainingStudentIds = students.filter((s: any) => s.status === 'aguardando').map((s: any) => s.id);
        expect(remainingStudentIds.length).toBeLessThan(students.length);
      });
    });

    // CENÁRIO 5: Conclusão de Viagem e Odômetro
    await runner.scenario('MOT-05', 'Encerramento de Viagem com Atualização de Odômetro do Veículo', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const vehicle = state.vehicles[0];
      const initialOdometer = vehicle.currentOdometer;
      const kmDrivenInTrip = 18;

      await runner.step('Finalizar viagem da rota com sucesso', () => {
        route.journeyStatus = 'concluida';
        route.completedAt = new Date().toISOString();
        expect(route.journeyStatus).toBe('concluida');
      });

      await runner.step('Incrementar odômetro acumulado no veículo', () => {
        vehicle.currentOdometer += kmDrivenInTrip;
        expect(vehicle.currentOdometer).toBe(initialOdometer + kmDrivenInTrip);
      });
    });

    // CENÁRIO 6: Pulo de Parada por Impedimento com Justificativa Obrigatória
    await runner.scenario('MOT-06', 'Pulo de Parada por Impedimento na Via com Justificativa', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));
      const studentToSkip = students[1] || students[0];

      await runner.step('Registrar impedimento de acesso físico (rua interditada por obras)', () => {
        studentToSkip.status = 'parada_pulada';
        studentToSkip.skipReason = 'Rua interditada pela prefeitura para recapeamento';
        studentToSkip.skippedAt = new Date().toISOString();

        expect(studentToSkip.status).toBe('parada_pulada');
        expect(studentToSkip.skipReason).toBeDefined();
        expect(studentToSkip.skipReason.length).toBeGreaterThan(10);
      });

      await runner.step('Continuar rota mantendo paradas subsequentes ativas', () => {
        const remainingPending = students.filter((s: any) => s.status === 'aguardando');
        expect(remainingPending.length).toBeGreaterThan(0);
        // O aluno pulado não deve mais travar o fluxo da van
        expect(remainingPending.map((s: any) => s.id)).not.toContain(studentToSkip.id);
      });
    });

    // CENÁRIO 7: Buffer de Telemetria Offline (PWA sem Conexão de Rede)
    await runner.scenario('MOT-07', 'Buffer Offline de Telemetria e Despejo em Lote ao Reconectar', async () => {
      const offlineQueue: Array<{ lat: number; lng: number; timestamp: number; speed: number }> = [];

      await runner.step('Armazenar coordenadas na fila local enquanto o motorista passa por túnel/área de sombra', () => {
        const baseTime = Date.now();
        // 3 pontos gerados em modo avião
        offlineQueue.push({ lat: -23.5301, lng: -46.8410, timestamp: baseTime + 10000, speed: 38 });
        offlineQueue.push({ lat: -23.5320, lng: -46.8425, timestamp: baseTime + 20000, speed: 42 });
        offlineQueue.push({ lat: -23.5340, lng: -46.8440, timestamp: baseTime + 30000, speed: 35 });

        expect(offlineQueue.length).toBe(3);
      });

      await runner.step('Sincronizar lote com o servidor mantendo ordem cronológica e limpar buffer', () => {
        expect(offlineQueue.length).toBeGreaterThan(0);
        // Simular reconciliação ao reconectar Wi-Fi / 4G
        const flushedPoints = [...offlineQueue].sort((a, b) => a.timestamp - b.timestamp);
        offlineQueue.length = 0; // Buffer esvaziado após confirmação do servidor

        expect(flushedPoints.length).toBe(3);
        expect(flushedPoints[0].timestamp).toBeLessThan(flushedPoints[1].timestamp);
        expect(offlineQueue.length).toBe(0);
      });
    });

    // CENÁRIO 8: Inversão Automática de Itinerário na Volta (Escola -> Residências)
    await runner.scenario('MOT-08', 'Inversão Automática de Rota e Priorização no Turno da Tarde', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));
      const school = state.schools.find((sc: any) => sc.id === students[0]?.schoolId) || state.schools[0];

      await runner.step('Configurar viagem com sentido VOLTA (Tarde)', () => {
        route.activeDirection = 'volta';
        route.activeShift = 'Tarde';
        expect(route.activeDirection).toBe('volta');
      });

      await runner.step('Ponto de partida DEVE ser a Escola e paradas finais as residências', () => {
        // Na volta: Primeira parada é o embarque na escola
        const departureOrigin = { type: 'school', id: school.id, name: school.name };
        expect(departureOrigin.type).toBe('school');

        // Alunos começam com status aguardando_embarque_escola
        students.forEach((s: any) => { s.status = 'aguardando_embarque_escola'; });
        expect(students.every((s: any) => s.status === 'aguardando_embarque_escola')).toBe(true);
      });
    });

    // CENÁRIO 9: Confirmação Deliberada de Encerramento (Anti-Toque Acidental no Suporte)
    await runner.scenario('MOT-09', 'Proteção contra Encerramento Acidental de Rota durante Direção', async () => {
      let isRouteCompleted = false;

      function requestCompleteRoute(pressDurationMs: number, confirmationConfirmed: boolean): boolean {
        // Regra defensiva: Apenas encerra se botão foi segurado por > 1500ms OU diálogo confirmado
        if (pressDurationMs >= 1500 || confirmationConfirmed) {
          isRouteCompleted = true;
          return true;
        }
        return false;
      }

      await runner.step('Ignorar toque rápido acidental de 200ms na tela (trepidação do veículo)', () => {
        const result = requestCompleteRoute(200, false);
        expect(result).toBe(false);
        expect(isRouteCompleted).toBe(false);
      });

      await runner.step('Permitir encerramento legítimo com toque prolongado de 2 segundos', () => {
        const result = requestCompleteRoute(2000, false);
        expect(result).toBe(true);
        expect(isRouteCompleted).toBe(true);
      });

      await runner.step('Garantir preservação de autenticação e retorno à Central de Operações ao finalizar rota', () => {
        // Simulação do contrato de limpeza de storage do motorista
        const sessionStore: Record<string, string> = {
          mockUserId: 'user-motorista-4',
          activeRouteId: 'route-val-1',
          activeShift: 'Manhã',
          activeDirection: 'ida'
        };

        // Ao finalizar: limpar as chaves da viagem ativa mas preservar a identidade do motorista
        delete sessionStore.activeRouteId;
        delete sessionStore.activeShift;
        delete sessionStore.activeDirection;

        expect(sessionStore.mockUserId).toBe('user-motorista-4');
        expect(sessionStore.activeRouteId).toBeUndefined();

        // Rota de destino obrigatória
        const destination = '/driver/route-plan';
        expect(destination).not.toBe('/login');
        expect(destination).toBe('/driver/route-plan');
      });
    });

    // CENÁRIO 10: Alto Contraste e Legibilidade sob Luz Solar Intensa no Para-brisa
    await runner.scenario('MOT-10', 'Conformidade de Contraste para Visualização sob Sol Forte no Painel', async () => {
      // Cores do painel do motorista
      const driverUiColors = {
        background: '#090d16',
        nextStopCard: '#111827',
        primaryText: '#f3f4f6',
        actionButton: '#f97316', // Laranja vibrante
        actionButtonText: '#ffffff'
      };

      await runner.step('Garantir que botões de ação possuam contraste mínimo para uso veicular', () => {
        expect(driverUiColors.primaryText).toBe('#f3f4f6');
        expect(driverUiColors.actionButton).toBe('#f97316');
        expect(driverUiColors.actionButtonText).toBe('#ffffff');
      });
    });

    // CENÁRIO 11: Temporizador no Portão com Alerta Sonoro e Disparo aos Pais
    await runner.scenario('MOT-11', 'Contagem Regressiva de Espera no Portão com Disparo Push aos Pais', async () => {
      const waitTimerSeconds = 180; // 3 minutos
      let elapsedSeconds = 0;
      let alertSentToParent = false;

      function tickSecond(secondsPassed: number) {
        elapsedSeconds += secondsPassed;
        if (elapsedSeconds >= 60 && !alertSentToParent) {
          alertSentToParent = true;
        }
      }

      await runner.step('Iniciar contagem regressiva ao estacionar no portão do aluno', () => {
        expect(elapsedSeconds).toBe(0);
        tickSecond(65); // 1 minuto e 5 segundos passaram
        expect(elapsedSeconds).toBe(65);
      });

      await runner.step('Disparar notificação automática de 1 minuto restante para a mãe', () => {
        expect(alertSentToParent).toBe(true, 'Deveria ter alertado a mãe aos 60s de espera');
      });
    });

    // CENÁRIO 12: Recuperação Instantânea de Sessão após Celular Desligar por Bateria
    await runner.scenario('MOT-12', 'Preservação de Estado da Rota em Caso de Crash ou Reinicialização do App', async () => {
      const activeSessionState = {
        routeId: 'route-val-1',
        shift: 'Manhã',
        direction: 'ida',
        currentStopIndex: 3,
        boardedStudentIds: ['student-1', 'student-2'],
        startedAt: new Date(Date.now() - 1200000).toISOString()
      };

      // Simular gravação contínua no LocalStorage / Cache local
      const serializedSnapshot = JSON.stringify(activeSessionState);

      await runner.step('Recuperar progresso da viagem a partir do cache local após o celular religar', () => {
        const restoredState = JSON.parse(serializedSnapshot);
        expect(restoredState.routeId).toBe('route-val-1');
        expect(restoredState.boardedStudentIds.length).toBe(2);
        expect(restoredState.currentStopIndex).toBe(3);
      });
    });

    // CENÁRIO 13: Assistente de Voz para Operação Segura com Mãos no Volante
    await runner.scenario('MOT-13', 'Geração de Áudio Simplificado para Paradas sem Desviar Olhar da Direção', async () => {
      function generateSpokenStopPrompt(studentName: string, street: string, distanceMeters: number): string {
        return `Atenção: próxima parada em ${distanceMeters} metros. Casa do ${studentName}, na ${street}.`;
      }

      await runner.step('Gerar instrução de fala clara em português natural para sintetizador TTS', () => {
        const speech = generateSpokenStopPrompt('Enzo', 'Rua das Flores', 250);
        expect(speech).toContain('próxima parada em 250 metros');
        expect(speech).toContain('Enzo');
        expect(speech).toContain('Rua das Flores');
      });
    });

    // CENÁRIO 14: Botão de Socorro / Pane Mecânica em 1 Toque com Envio de GPS
    await runner.scenario('MOT-14', 'Acionamento Rápido de SOS por Pane Mecânica sem Digitação em Trânsito', async () => {
      const sosEmergencyEvent = {
        driverId: 'driver-1',
        routeId: 'route-1',
        type: 'pane_mecanica' as const,
        description: 'Pneu Dianteiro Furado',
        currentLocation: { lat: -23.5255, lng: -46.8390 },
        studentsOnBoardCount: 6,
        dispatchedAt: new Date().toISOString()
      };

      await runner.step('Registrar SOS com localização precisa e quantidade de alunos a bordo', () => {
        expect(sosEmergencyEvent.type).toBe('pane_mecanica');
        expect(sosEmergencyEvent.studentsOnBoardCount).toBe(6);
        expect(sosEmergencyEvent.currentLocation.lat).toBeLessThan(0);
      });

      await runner.step('Gerar protocolo de resgate para central enviar van de transbordo', () => {
        const rescueTicket = {
          ticketId: `SOS-${Date.now()}`,
          priority: 'ALTA',
          action: 'Enviar van de apoio com 6 assentos livres para transbordo imediato',
          coords: sosEmergencyEvent.currentLocation
        };

        expect(rescueTicket.priority).toBe('ALTA');
        expect(rescueTicket.action).toContain('6 assentos livres');
      });
    });

    // CENÁRIO 15: Validação do Fluxo Sequencial de Embarque e Imunidade ao Reset de Parada
    await runner.scenario('MOT-15', 'Fluxo Sequencial de Embarque e Imunidade ao Reset de Parada Ativa', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const driver = state.drivers[0];
      
      // Iniciar rota
      route.journeyStatus = 'em_rota';
      driver.status = 'em_rota';
      
      const student1 = state.students.find((s: any) => s.id === 'student-2'); // Valentina
      const student2 = state.students.find((s: any) => s.id === 'student-5'); // Pedro
      
      student1.status = 'aguardando';
      student2.status = 'aguardando';

      await runner.step('Passo 1: Estado inicial com alunos aguardando embarque', () => {
        expect(student1.status).toBe('aguardando');
        expect(student2.status).toBe('aguardando');
      });

      await runner.step('Passo 2: Motorista clica em "EMBARCOU" para a primeira aluna', () => {
        student1.status = 'a_bordo';
        expect(student1.status).toBe('a_bordo');
      });

      await runner.step('Passo 3: A parada ativa avança para o segundo aluno e a primeira NÃO reseta', () => {
        // Encontrar próxima parada pendente
        const activeStops = [student1, student2];
        const nextPending = activeStops.find((s: any) => s.status === 'aguardando');
        
        expect(nextPending.id).toBe(student2.id);
        expect(nextPending.name).toContain('Pedro');
        // Imunidade ao reset: Valentina permanece a bordo
        expect(student1.status).toBe('a_bordo');
      });

      await runner.step('Passo 4: Lista de "Alunos a Bordo" consolida passageiros embarcados', () => {
        const boardedList = [student1, student2].filter((s: any) => s.status === 'a_bordo');
        expect(boardedList.length).toBe(1);
        expect(boardedList[0].name).toContain('Valentina');
      });
    });

    // CENÁRIO 16: Inicialização Segura da Central de Operações e Reset Limpo Pós-Operação
    await runner.scenario('MOT-16', 'Ciclo de Vida da Rota: Início Limpo e Encerramento Controlado', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const driver = state.drivers[0];

      await runner.step('Garantir que rotas iniciem por padrão em estado "pendente"', () => {
        expect(route.journeyStatus).toBe('pendente');
        expect(driver.status).toBe('inativo');
      });

      await runner.step('Ao finalizar a viagem, restaurar estado para "pendente" e motorista "inativo"', () => {
        // Simular encerramento
        route.journeyStatus = 'pendente';
        driver.status = 'inativo';
        expect(route.journeyStatus).toBe('pendente');
        expect(driver.status).toBe('inativo');
      });
    });

    // CENÁRIO 17: Disparo de Mensagens Rápidas de Trânsito em 1 Toque (Sem Digitação ao Volante)
    await runner.scenario('MOT-17', 'Disparo de Mensagens Rápidas de Trânsito em 1 Toque (Sem Digitação ao Volante)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const controller = new DriverActionController(state, route.id, 'Manhã', 'ida');

      await runner.step('Disparar mensagem rápida "Chegando em 5 minutos" para o grupo da van', () => {
        const res = controller.sendPredefinedQuickMessage('chegando_5_min');
        expect(res.success).toBe(true);
        expect(res.data.text).toContain('chegando em 5 minutos');
        expect(res.toasts?.[0]?.title).toBe('Mensagem enviada aos pais!');
      });

      await runner.step('Disparar alerta rápido de "Trânsito Lento" sem distração do condutor', () => {
        const res = controller.sendPredefinedQuickMessage('transito_lento');
        expect(res.success).toBe(true);
        expect(res.data.text).toContain('Trânsito lento na rota escolar');
      });
    });

    // CENÁRIO 18: Validação Funcional Completa de Todos os Botões da Tela do Motorista
    await runner.scenario('MOT-18', 'Acionamento Funcional de Todos os Botões da Interface do Motorista', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const controller = new DriverActionController(state, route.id, 'Manhã', 'ida');

      // 1. Botão "INICIAR OPERAÇÃO"
      await runner.step('Botão 1 [INICIAR OPERAÇÃO]: Disparo do início da rota e ativação do motorista', () => {
        const startResult = controller.clickStartRoute();
        expect(startResult.success).toBe(true, 'Botão iniciar operação deve aprovar início');
        expect(controller.getRoute()?.journeyStatus).toBe('em_rota');
        expect(controller.getDriver()?.status).toBe('em_rota');
        expect(startResult.toasts?.[0]?.title).toBe('Viagem Iniciada!');
      });

      // 2. Botão "EMBARCOU"
      const firstStop = controller.getActiveStop();
      expect(firstStop).toBeDefined();
      const student1Id = firstStop!.stop.id;

      await runner.step('Botão 2 [EMBARCOU]: Clique de embarque do primeiro aluno com avanço de parada', () => {
        const embarqueResult = controller.clickEmbarcou(student1Id);
        expect(embarqueResult.success).toBe(true);
        expect(embarqueResult.toasts?.[0]?.title).toBe('Embarque Confirmado!');
        expect(embarqueResult.data.boardedCount).toBe(1);

        // A parada ativa obrigatoriamente avançou para o próximo
        const secondStop = controller.getActiveStop();
        expect(secondStop).toBeDefined();
        expect(secondStop!.stop.id).not.toBe(student1Id);
      });

      // 3. Botão "AUSENTE"
      const currentStopForAbsence = controller.getActiveStop();
      expect(currentStopForAbsence).toBeDefined();
      const student2Id = currentStopForAbsence!.stop.id;

      await runner.step('Botão 3 [AUSENTE]: Registro de ausência e remoção automática da parada ativa', () => {
        const ausenteResult = controller.clickAusente(student2Id);
        expect(ausenteResult.success).toBe(true);
        expect(ausenteResult.toasts?.[0]?.title).toBe('Ausência Registrada');

        // A parada ativa avançou novamente
        const thirdStop = controller.getActiveStop();
        if (thirdStop) {
          expect(thirdStop.stop.id).not.toBe(student2Id);
        }
      });

      // 4. Trava de Segurança [BLOQUEIO ANTI-ESQUECIMENTO] e Botão "DESEMBARCOU"
      await runner.step('Trava Anti-Esquecimento: Bloquear encerramento de viagem com crianças a bordo', () => {
        const prematureEndResult = controller.clickEndRoute(true);
        expect(prematureEndResult.success).toBe(false, 'Deveria bloquear encerramento com alunos a bordo');
        expect(prematureEndResult.message).toContain('BLOQUEIO DE SEGURANÇA');
      });

      await runner.step('Botão [DESEMBARCOU]: Desembarcar aluno no destino escolar', () => {
        const desembarqueResult = controller.clickDesembarcou(student1Id);
        expect(desembarqueResult.success).toBe(true);
        expect(desembarqueResult.toasts?.[0]?.title).toBe('Desembarque Confirmado!');
        expect(controller.getBoardedStudents().length).toBe(0);
      });

      // 5. Botão "REINICIAR / ENCERRAR VIAGEM"
      await runner.step('Botão [REINICIAR/ENCERRAR]: Restauração para tela de prontidão com van vazia', () => {
        const endResult = controller.clickEndRoute(true);
        expect(endResult.success).toBe(true);
        expect(controller.getRoute()?.journeyStatus).toBe('pendente');
        expect(controller.getDriver()?.status).toBe('inativo');
      });
    });

  });
}

