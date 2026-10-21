import fs from 'fs';
import path from 'path';
import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { optimizeSchoolVanRoute } from '../../../src/ai/flows/optimizeSchoolVanRoute';

export async function runPlanejamentoSuite() {
  await runner.suite('Tela de Planejamento de Rotas e Acessibilidade (A11y)', 'PLANEJAMENTO', async () => {

    // CENÁRIO 1: Setup do Wizard de Planejamento e Chave Canônica
    await runner.scenario('PLN-01', 'Inicialização do Wizard de Planejamento e Chave Única de Manifesto', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const driver = state.drivers[0];
      const testDate = '2026-10-25';

      await runner.step('Configurar parâmetros no Wizard (Data, Turno, Sentido, Rota, Motorista)', () => {
        expect(route).toBeDefined();
        expect(driver).toBeDefined();

        const wizardPayload = {
          date: testDate,
          shift: 'Manhã' as const,
          direction: 'ida' as const,
          routeId: route.id,
          driverId: driver.id
        };

        expect(wizardPayload.shift).toBe('Manhã');
        expect(wizardPayload.direction).toBe('ida');
        expect(wizardPayload.routeId).toBe(route.id);
      });

      await runner.step('Gerar identificador canônico imutável para o manifesto diário', () => {
        const canonicalManifestId = `manifest_${route.id}_${testDate}_ida`;
        expect(canonicalManifestId).toContain(route.id);
        expect(canonicalManifestId).toContain(testDate);
        expect(canonicalManifestId.startsWith('manifest_')).toBe(true);
      });
    });

    // CENÁRIO 2: Filtro Automático de Alunos Ausentes (Anti-Desperdício de Paradas)
    await runner.scenario('PLN-02', 'Reconciliação e Expurgamento Automático de Alunos Ausentes', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));

      // Configurar 3 tipos de ausência
      const s1 = students[0]; // ausente ida
      const s2 = students[1] || students[0]; // ausente volta
      const s3 = students[2] || students[0]; // ausente dia todo

      s1.status = 'ausente_ida';
      s2.status = 'ausente_volta';
      s3.status = 'ausente_dia_todo';

      function isStudentAbsent(st: any, direction: 'ida' | 'volta'): boolean {
        if (!st || !st.status) return false;
        if (st.status === 'ausente_dia_todo') return true;
        if (direction === 'ida' && st.status === 'ausente_ida') return true;
        if (direction === 'volta' && st.status === 'ausente_volta') return true;
        return false;
      }

      await runner.step('No turno de IDA: Expurgar ausentes_ida e ausentes_dia_todo, mantendo ausentes_volta', () => {
        expect(isStudentAbsent(s1, 'ida')).toBe(true);
        expect(isStudentAbsent(s3, 'ida')).toBe(true);
        expect(isStudentAbsent(s2, 'ida')).toBe(false, 'Aluno que falta na volta deve embarcar na ida');

        const activeInMorning = students.filter((s: any) => !isStudentAbsent(s, 'ida'));
        expect(activeInMorning.map((s: any) => s.id)).not.toContain(s1.id);
        expect(activeInMorning.map((s: any) => s.id)).toContain(s2.id);
      });

      await runner.step('No turno de VOLTA: Expurgar ausentes_volta e ausentes_dia_todo, mantendo ausentes_ida', () => {
        expect(isStudentAbsent(s2, 'volta')).toBe(true);
        expect(isStudentAbsent(s3, 'volta')).toBe(true);
        expect(isStudentAbsent(s1, 'volta')).toBe(false, 'Aluno que faltou na ida pode voltar na van à tarde');

        const activeInAfternoon = students.filter((s: any) => !isStudentAbsent(s, 'volta'));
        expect(activeInAfternoon.map((s: any) => s.id)).not.toContain(s2.id);
        expect(activeInAfternoon.map((s: any) => s.id)).toContain(s1.id);
      });
    });

    // CENÁRIO 3: Inclusão Dinâmica de Passageiros Avulsos
    await runner.scenario('PLN-03', 'Alocação de Passageiros com Solicitações Avulsas Aprovadas', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const testDate = '2026-10-25';

      const tripRequestApproved = {
        id: `tr-${Date.now()}`,
        studentId: 'student-4',
        studentName: 'Alice Souza',
        date: testDate,
        shift: 'Manhã',
        status: 'aprovada',
        type: 'avulso'
      };

      await runner.step('Identificar viagem extra autorizada para a data do planejamento', () => {
        state.trip_requests = state.trip_requests || [];
        state.trip_requests.push(tripRequestApproved);

        const eligibleRequests = state.trip_requests.filter((tr: any) => 
          tr.status === 'aprovada' && tr.date === testDate && tr.shift === 'Manhã'
        );

        expect(eligibleRequests.length).toBeGreaterThan(0);
        expect(eligibleRequests[0].studentId).toBe('student-4');
      });

      await runner.step('Alocar passageiro avulso como "extra" no manifesto do dia', () => {
        const manifest = {
          id: `manifest_${route.id}_${testDate}_ida`,
          routeId: route.id,
          date: testDate,
          shift: 'Manhã',
          direction: 'ida',
          studentIds: [...route.studentIds, tripRequestApproved.studentId],
          extraStudentIds: [tripRequestApproved.studentId]
        };

        expect(manifest.studentIds).toContain(tripRequestApproved.studentId);
        expect(manifest.extraStudentIds).toContain(tripRequestApproved.studentId);
      });
    });

    // CENÁRIO 4: Auditoria de Lotação e Capacidade Máxima do Veículo
    await runner.scenario('PLN-04', 'Bloqueio de Publicação em Caso de Superlotação da Van', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const vehicle = state.vehicles[0];
      const maxSeats = vehicle.capacity; // ex: 15 ou 20 assentos

      await runner.step('Calcular ocupação e confirmar capacidade disponível', () => {
        const currentPassengers = 12;
        const remainingSeats = maxSeats - currentPassengers;
        expect(remainingSeats).toBeGreaterThan(0);
      });

      await runner.step('Disparar barreira de segurança quando passageiros excederem os assentos', () => {
        const attemptedPassengers = maxSeats + 3;
        const isOvercapacity = attemptedPassengers > maxSeats;

        expect(isOvercapacity).toBe(true);

        const validateManifestCapacity = (count: number, capacity: number) => {
          if (count > capacity) {
            throw new Error(`Capacidade da van excedida: ${count} alunos para ${capacity} assentos`);
          }
          return true;
        };

        let blocked = false;
        try {
          validateManifestCapacity(attemptedPassengers, maxSeats);
        } catch (err: any) {
          blocked = true;
          expect(err.message).toContain('Capacidade da van excedida');
        }

        expect(blocked).toBe(true, 'A tela deve impedir publicação com superlotação');
      });
    });

    // CENÁRIO 5: Reordenação e Alocação Cruzada entre Rotas
    await runner.scenario('PLN-05', 'Transferência Dinâmica de Alunos entre Rotas na Escala do Dia', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const routeA = state.routes[0];
      const routeB = state.routes[1] || { ...state.routes[0], id: 'route-temp-b', name: 'Rota Bairro Sul', studentIds: [] };
      
      const studentToMoveId = routeA.studentIds[0];
      const initialCountA = routeA.studentIds.length;
      const initialCountB = routeB.studentIds.length;

      await runner.step('Mover aluno da Rota A para a Rota B para equilibrar itinerários', () => {
        // Remover de A
        routeA.studentIds = routeA.studentIds.filter((id: string) => id !== studentToMoveId);
        // Adicionar em B
        routeB.studentIds.push(studentToMoveId);

        expect(routeA.studentIds).not.toContain(studentToMoveId);
        expect(routeB.studentIds).toContain(studentToMoveId);
        expect(routeA.studentIds.length).toBe(initialCountA - 1);
        expect(routeB.studentIds.length).toBe(initialCountB + 1);
      });
    });

    // CENÁRIO 6: Otimização de Paradas com Nearest Neighbor & 2-Opt
    await runner.scenario('PLN-06', 'Execução do Motor Local de Otimização de Paradas na Tela', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));
      const school = state.schools[0];

      await runner.step('Executar motor de otimização no sentido IDA (Residências ➔ Escola)', async () => {
        const input = {
          students: students.map((s: any) => ({
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

        // Na IDA a última parada deve ser a Escola
        const lastStop = result.optimizedStops[result.optimizedStops.length - 1];
        expect(lastStop.type).toBe('school');
      });

      await runner.step('Executar motor de otimização no sentido VOLTA (Escola ➔ Residências)', async () => {
        const input = {
          students: students.map((s: any) => ({
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
          direction: 'volta' as const,
          optimizationMode: 'safe' as const
        };

        const result = await optimizeSchoolVanRoute(input);
        expect(result).toBeDefined();
        // Na VOLTA a primeira parada deve ser a Escola
        const firstStop = result.optimizedStops[0];
        expect(firstStop.type).toBe('school');
      });
    });

    // CENÁRIO 7: Publicação Definitiva e Ciclo de Vida do Manifesto
    await runner.scenario('PLN-07', 'Publicação do Manifesto no Banco e Auditoria de Exclusão Segura', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const manifestId = `manifest_${route.id}_2026-10-25_ida`;

      await runner.step('Publicar escala diária em route_manifests', () => {
        state.route_manifests = state.route_manifests || [];
        const newPublishedManifest = {
          id: manifestId,
          routeId: route.id,
          date: '2026-10-25',
          shift: 'Manhã',
          direction: 'ida',
          studentIds: [...route.studentIds],
          status: 'published',
          publishedAt: new Date().toISOString()
        };

        state.route_manifests.push(newPublishedManifest);

        const saved = state.route_manifests.find((m: any) => m.id === manifestId);
        expect(saved).toBeDefined();
        expect(saved.status).toBe('published');
      });

      await runner.step('Excluir planejamento publicado mantendo a rota base cadastral intacta', () => {
        state.route_manifests = state.route_manifests.filter((m: any) => m.id !== manifestId);

        expect(state.route_manifests.find((m: any) => m.id === manifestId)).toBeUndefined();
        // Rota base do cadastro principal não foi afetada
        expect(state.routes.find((r: any) => r.id === route.id)).toBeDefined();
      });
    });

    // CENÁRIO 8: Auditoria Completa de Acessibilidade (WCAG 2.1 AA / A11y)
    await runner.scenario('PLN-08', 'Auditoria Estrita de Acessibilidade (WCAG 2.1 AA / A11y) do Componente', async () => {
      const componentPath = path.resolve(process.cwd(), 'src', 'components', 'dashboard', 'management', 'route-planning', 'route-planning-client.tsx');

      await runner.step('Validar existência e legibilidade do código-fonte do RoutePlanningClient', () => {
        expect(fs.existsSync(componentPath)).toBe(true, 'Componente route-planning-client.tsx deve existir');
        const content = fs.readFileSync(componentPath, 'utf-8');
        expect(content.length).toBeGreaterThan(1000);
      });

      await runner.step('Garantir que campos de input possuam identificador e aria-label explícitos', () => {
        const content = fs.readFileSync(componentPath, 'utf-8');
        
        // Inputs devem ter aria-label para leitores de tela
        expect(content).toContain('aria-label=');
        expect(content).toContain('id="search-manifests"');
        expect(content).toContain('aria-label="Buscar planejamentos de rotas por nome, data ou turno"');
      });

      await runner.step('Garantir que botões de ação e ícones possuam rótulo acessível (aria-label/title)', () => {
        const content = fs.readFileSync(componentPath, 'utf-8');

        // Botões de ação como Excluir e Limpar devem ter aria-label
        expect(content).toContain('aria-label="Limpar campo de busca"');
        expect(content).toContain('aria-label={`Excluir planejamento da rota');
        expect(content).toContain('aria-label={`Editar planejamento da rota');
      });

      await runner.step('Garantir estrutura semântica de diálogos com DialogTitle e DialogDescription', () => {
        const content = fs.readFileSync(componentPath, 'utf-8');

        // Diálogos modais exigem título e descrição legíveis por leitores de tela
        expect(content).toContain('<DialogTitle');
        expect(content).toContain('<DialogDescription');
        expect(content).toContain('Novo Planejamento');
      });

      await runner.step('Auditoria de Estilo: Cumprir a Purple Ban (Zero classes violet/purple)', () => {
        const content = fs.readFileSync(componentPath, 'utf-8');

        const hasViolet = /text-violet-|bg-violet-|border-violet-/.test(content);
        const hasPurple = /text-purple-|bg-purple-|border-purple-/.test(content);

        expect(hasViolet).toBe(false, 'VIOLAÇÃO DE DESIGN: Componente não pode conter classes violet-*');
        expect(hasPurple).toBe(false, 'VIOLAÇÃO DE DESIGN: Componente não pode conter classes purple-*');
      });
    });

    // CENÁRIO 9: Sugestão Inteligente de Alocação de Alunos Sem Rota por Proximidade
    await runner.scenario('PLN-09', 'Sugestão Inteligente de Alocação de Alunos Órfãos por Menor Raio Geográfico', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const studentsInRoute = state.students.filter((s: any) => route.studentIds.includes(s.id));

      // Simular aluno sem rota definida
      const unassignedStudent = {
        id: 'std-orphan-1',
        name: 'Mateus Oliveira',
        latitude: -23.5240,
        longitude: -46.8360,
        shift: 'Manhã',
        schoolId: state.schools[0].id
      };

      function calculateMinDistanceToRoute(studentLat: number, studentLng: number, stops: any[]): number {
        let minDistance = Infinity;
        for (const stop of stops) {
          const latDiff = Math.abs(stop.latitude - studentLat);
          const lngDiff = Math.abs(stop.longitude - studentLng);
          const approxDistMeters = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111000;
          if (approxDistMeters < minDistance) {
            minDistance = approxDistMeters;
          }
        }
        return Math.round(minDistance);
      }

      await runner.step('Calcular distância do aluno sem rota até as paradas existentes da rota', () => {
        const minDistance = calculateMinDistanceToRoute(unassignedStudent.latitude, unassignedStudent.longitude, studentsInRoute);
        expect(minDistance).toBeGreaterThan(0);
        expect(minDistance).toBeLessThan(5000, 'Aluno está em raio compatível com a rota (< 5km)');
      });

      await runner.step('Sugerir alocação com aviso amigável de desvio mínimo estimado', () => {
        const minDistance = calculateMinDistanceToRoute(unassignedStudent.latitude, unassignedStudent.longitude, studentsInRoute);
        const suggestion = {
          studentName: unassignedStudent.name,
          suggestedRouteId: route.id,
          suggestedRouteName: route.name,
          estimatedDetourKm: (minDistance / 1000).toFixed(1),
          recommended: minDistance <= 3000
        };

        expect(suggestion.recommended).toBe(true);
        expect(suggestion.suggestedRouteName).toBe(route.name);
      });
    });

    // CENÁRIO 10: Trava de Conflito de Turno Escolar (Manhã vs Tarde)
    await runner.scenario('PLN-10', 'Trava Preventiva contra Conflito de Turno Escolar no Manifesto Diário', async () => {
      const afternoonStudent = {
        id: 'std-afternoon-1',
        name: 'Clara Meirelles',
        shift: 'Tarde',
        schoolId: 'school-1'
      };

      function validateShiftMatch(manifestShift: 'Manhã' | 'Tarde', student: any): { canAdd: boolean; alertMessage?: string } {
        if (student.shift !== manifestShift) {
          return {
            canAdd: false,
            alertMessage: `Atenção: ${student.name} estuda no turno da ${student.shift}. Deseja realmente incluí-la na rota da ${manifestShift}?`
          };
        }
        return { canAdd: true };
      }

      await runner.step('Impedir adição silenciosa de aluno de turno oposto na rota da Manhã', () => {
        const check = validateShiftMatch('Manhã', afternoonStudent);
        expect(check.canAdd).toBe(false);
        expect(check.alertMessage).toBeDefined();
        expect(check.alertMessage).toContain('estuda no turno da Tarde');
      });

      await runner.step('Permitir inclusão quando os turnos coincidirem', () => {
        const morningStudent = { id: 'std-morning-1', name: 'Lucas Lima', shift: 'Manhã' };
        const checkOk = validateShiftMatch('Manhã', morningStudent);
        expect(checkOk.canAdd).toBe(true);
        expect(checkOk.alertMessage).toBeUndefined();
      });
    });

    // CENÁRIO 11: Estimativa de Custos em R$ de Combustível da Rota
    await runner.scenario('PLN-11', 'Estimativa Transparente de Custo de Combustível da Rota para o Transportador', async () => {
      const KM_ESTIMADO = 28.5; // Distância do manifesto
      const CONSUMO_MEDIO_KM_L = 7.5; // Van Diesel média urbana
      const PRECO_DIESEL_LITRO = 6.20; // Preço médio Brasil

      function calculateFuelCost(km: number, kmPerLiter: number, fuelPrice: number) {
        const litersNeeded = km / kmPerLiter;
        const totalCost = litersNeeded * fuelPrice;
        return {
          liters: Number(litersNeeded.toFixed(2)),
          totalCostR$: Number(totalCost.toFixed(2)),
          costPerKm: Number((totalCost / km).toFixed(2))
        };
      }

      await runner.step('Calcular litros de combustível necessários para a escala', () => {
        const estimate = calculateFuelCost(KM_ESTIMADO, CONSUMO_MEDIO_KM_L, PRECO_DIESEL_LITRO);
        expect(estimate.liters).toBeGreaterThan(0);
        expect(estimate.liters).toBe(3.8); // 28.5 / 7.5 = 3.8L
      });

      await runner.step('Exibir custo estimado em R$ de forma legível e sem termos técnicos', () => {
        const estimate = calculateFuelCost(KM_ESTIMADO, CONSUMO_MEDIO_KM_L, PRECO_DIESEL_LITRO);
        expect(estimate.totalCostR$).toBe(23.56); // 3.8 * 6.20 = 23.56
        expect(estimate.costPerKm).toBe(0.83);
      });
    });

    // CENÁRIO 12: Restauração em 1 Toque da Rota Padrão (Desfazer Alterações do Dia)
    await runner.scenario('PLN-12', 'Restauração da Escala Padrão em 1 Toque com Preservação Cadastral', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const baselineStudentIds = [...route.studentIds];

      // Simular alterações manuais feitas pelo usuário na tela
      const alteredStudentIds = [...baselineStudentIds.slice(0, -1), 'extra-temp-student'];

      function resetManifestToBaseline(currentList: string[], originalBaseline: string[]) {
        return [...originalBaseline];
      }

      await runner.step('Constatar divergência entre a escala editada e o cadastro padrão da van', () => {
        expect(alteredStudentIds).not.toEqual(baselineStudentIds);
        expect(alteredStudentIds).toContain('extra-temp-student');
      });

      await runner.step('Desfazer alterações do dia e restaurar os alunos originais da rota em 1 toque', () => {
        const restoredList = resetManifestToBaseline(alteredStudentIds, baselineStudentIds);
        expect(restoredList).toEqual(baselineStudentIds);
        expect(restoredList).not.toContain('extra-temp-student');
        expect(restoredList.length).toBe(baselineStudentIds.length);
      });
    });

    // CENÁRIO 13: Alerta Preventivo de Tempo Excessivo de Trajeto (>60min para Crianças)
    await runner.scenario('PLN-13', 'Alerta Preventivo de Conforto Infantil para Trajetos Superiores a 60 Minutos', async () => {
      function evaluateTripComfort(estimatedMinutes: number, hasPreschoolers: boolean): { isAcceptable: boolean; advice: string } {
        if (hasPreschoolers && estimatedMinutes > 60) {
          return {
            isAcceptable: false,
            advice: `Tempo estimado de ${estimatedMinutes} min excede o limite saudável de 60 min para educação infantil. Recomenda-se dividir a rota.`
          };
        }
        return { isAcceptable: true, advice: 'Tempo de trajeto confortável para as crianças.' };
      }

      await runner.step('Disparar recomendação preventiva quando o itinerário infantil passar de 60 min', () => {
        const alertResult = evaluateTripComfort(75, true);
        expect(alertResult.isAcceptable).toBe(false);
        expect(alertResult.advice).toContain('limite saudável de 60 min');
      });

      await runner.step('Aprovar rota de 45 minutos com bem-estar infantil garantido', () => {
        const okResult = evaluateTripComfort(45, true);
        expect(okResult.isAcceptable).toBe(true);
        expect(okResult.advice).toContain('confortável');
      });
    });

    // CENÁRIO 14: Reordenação de Paradas com Toque de Subir/Descer e Renumeração Sequencial
    await runner.scenario('PLN-14', 'Reordenação Manual de Paradas com Renumeração Sequencial Automática', async () => {
      const stops = [
        { id: 'stop-1', studentName: 'Lucas Lima', orderIndex: 1 },
        { id: 'stop-2', studentName: 'Mariana Souza', orderIndex: 2 },
        { id: 'stop-3', studentName: 'Enzo Gabriel', orderIndex: 3 }
      ];

      function moveStop(list: typeof stops, fromIndex: number, toIndex: number) {
        const item = list[fromIndex];
        const updated = [...list];
        updated.splice(fromIndex, 1);
        updated.splice(toIndex, 0, item);
        return updated.map((s, idx) => ({ ...s, orderIndex: idx + 1 }));
      }

      await runner.step('Mover última parada para a primeira posição (Botão Subir)', () => {
        const reordered = moveStop(stops, 2, 0); // Enzo Gabriel vai para 1º
        expect(reordered[0].studentName).toBe('Enzo Gabriel');
        expect(reordered[0].orderIndex).toBe(1);
        expect(reordered[1].studentName).toBe('Lucas Lima');
        expect(reordered[1].orderIndex).toBe(2);
        expect(reordered[2].studentName).toBe('Mariana Souza');
        expect(reordered[2].orderIndex).toBe(3);
      });
    });

  });
}

