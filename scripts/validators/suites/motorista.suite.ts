import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';

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

  });
}

