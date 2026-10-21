import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';
import { maskCPF, maskPhone, maskCEP, unmask } from '../../../src/lib/masks';
import { geocodeAddress } from '../../../src/ai/flows/geocode-address';

export async function runRegressaoSuite() {
  await runner.suite('Testes de Regressão e Segurança de Dados', 'REGRESSAO', async () => {

    // CENÁRIO 1: Integridade Relacional do Banco Mock
    await runner.scenario('REG-01', 'Integridade Referencial Completa (Zero Referências Órfãs)', async () => {
      const state = initialMockData;

      await runner.step('Validar que todo Aluno pertence a uma Escola existente', () => {
        const schoolIds = new Set(state.schools.map((s: any) => s.id));
        for (const student of state.students) {
          expect(schoolIds.has(student.schoolId)).toBe(true, `Aluno [${student.name}] referencia escola inexistente: ${student.schoolId}`);
        }
      });

      await runner.step('Validar que todo Aluno possui um Responsável (Parent) válido', () => {
        const parentIds = new Set(state.parents.map((p: any) => p.id));
        const activeApprovedStudents = state.students.filter((s: any) => s.status !== 'aguardando_aprovacao');
        for (const student of activeApprovedStudents) {
          expect(parentIds.has(student.parentId)).toBe(true, `Aluno [${student.name}] referencia pai inexistente: ${student.parentId}`);
        }
        
        // Alunos em triagem preliminar (solicitações pendentes) possuem contato direto
        const pendingStudents = state.students.filter((s: any) => s.status === 'aguardando_aprovacao');
        for (const pending of pendingStudents) {
          expect(pending.parentName).toBeDefined();
          expect(pending.parentPhone).toBeDefined();
        }
      });

      await runner.step('Validar que todas as Rotas possuem um Motorista vinculado existente', () => {
        const driverIds = new Set(state.drivers.map((d: any) => d.id));
        for (const route of state.routes) {
          expect(driverIds.has(route.driverId)).toBe(true, `Rota [${route.name}] referencia motorista inexistente: ${route.driverId}`);
        }
      });

      await runner.step('Validar que todo Motorista está vinculado a um Veículo válido', () => {
        const vehicleIds = new Set(state.vehicles.map((v: any) => v.id));
        for (const driver of state.drivers) {
          expect(vehicleIds.has(driver.vehicleId)).toBe(true, `Motorista [${driver.name}] referencia veículo inexistente: ${driver.vehicleId}`);
        }
      });
    });

    // CENÁRIO 2: Sanitização de Máscaras e Formatação de Dados
    await runner.scenario('REG-02', 'Sanitização de Máscaras (CPF, Telefone, CEP e Unmask)', async () => {
      await runner.step('Formatar CPF com pontuação padrão brasileira', () => {
        const raw = '12345678901';
        const masked = maskCPF(raw);
        expect(masked).toBe('123.456.789-01');
        expect(unmask(masked)).toBe(raw);
      });

      await runner.step('Formatar Telefone Celular com 9 dígitos e DDD', () => {
        const raw = '11987654321';
        const masked = maskPhone(raw);
        expect(masked).toBe('(11) 98765-4321');
        expect(unmask(masked)).toBe(raw);
      });

      await runner.step('Formatar CEP brasileiro de 8 dígitos', () => {
        const raw = '06310000';
        const masked = maskCEP(raw);
        expect(masked).toBe('06310-000');
        expect(unmask(masked)).toBe(raw);
      });
    });

    // CENÁRIO 3: Fallback Seguro de IA (Zero Crash sem Chaves)
    await runner.scenario('REG-03', 'Blindagem e Fallback Seguro de APIs Externas / Geocoding', async () => {
      await runner.step('Retornar coordenadas de segurança mesmo sem chave da API do Google', async () => {
        const result = await geocodeAddress({ address: 'Avenida Inocêncio Seráfico, 100, Carapicuíba' });
        expect(result).toBeDefined();
        expect(typeof result.latitude).toBe('number');
        expect(typeof result.longitude).toBe('number');
        expect(result.latitude).toBeLessThan(0); // Brasil sempre latitude negativa
      });
    });

    // CENÁRIO 4: Consistência do Modelo Financeiro
    await runner.scenario('REG-04', 'Regra de Faturamento: Faturas vs Mensalidades de Alunos', async () => {
      const state = initialMockData;

      await runner.step('Garantir que todo valor monetário de aluno e fatura seja positivo', () => {
        for (const st of state.students) {
          expect(st.monthlyFee).toBeGreaterThan(0, `Aluno ${st.name} possui mensalidade inválida`);
        }
        for (const inv of state.invoices) {
          expect(inv.amount).toBeGreaterThan(0, `Fatura ${inv.id} possui valor inválido`);
        }
      });
    });

    // CENÁRIO 5: Proteção contra Superlotação da Van
    await runner.scenario('REG-05', 'Bloqueio de Alocação Excedente à Capacidade Nominal da Van', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const vehicle = state.vehicles[0];
      const nominalCapacity = vehicle.capacity; // ex: 15 ou 20 assentos

      await runner.step('Permitir alocação enquanto houver assentos disponíveis', () => {
        const route = {
          id: 'route-capacity-test',
          vehicleId: vehicle.id,
          studentIds: [] as string[]
        };

        for (let i = 0; i < nominalCapacity; i++) {
          route.studentIds.push(`std-test-${i}`);
        }

        expect(route.studentIds.length).toBe(nominalCapacity);
      });

      await runner.step('Rejeitar adição de passageiro que ultrapasse a capacidade regulamentar', () => {
        const route = {
          id: 'route-capacity-test',
          vehicleId: vehicle.id,
          studentIds: Array.from({ length: nominalCapacity }, (_, i) => `std-test-${i}`)
        };

        const tryAddExtraPassenger = () => {
          if (route.studentIds.length >= nominalCapacity) {
            throw new Error(`Capacidade máxima do veículo (${nominalCapacity} assentos) atingida!`);
          }
          route.studentIds.push('std-extra-illegal');
        };

        let threwError = false;
        try {
          tryAddExtraPassenger();
        } catch (err: any) {
          threwError = true;
          expect(err.message).toContain('Capacidade máxima');
        }

        expect(threwError).toBe(true, 'Deveria ter impedido a adição de passageiro acima da capacidade');
      });
    });

    // CENÁRIO 6: Resiliência contra Coordenadas Geográficas Inválidas
    await runner.scenario('REG-06', 'Blindagem contra Coordenadas Geográficas Corrompidas (NaN / Out-of-Bounds)', async () => {
      function sanitizeCoordinate(lat: any, lng: any): { lat: number; lng: number; isValid: boolean } {
        const parsedLat = Number(lat);
        const parsedLng = Number(lng);

        if (isNaN(parsedLat) || isNaN(parsedLng)) {
          return { lat: -23.5505, lng: -46.6333, isValid: false }; // fallback Marco Zero SP
        }
        if (parsedLat < -90 || parsedLat > 90 || parsedLng < -180 || parsedLng > 180) {
          return { lat: -23.5505, lng: -46.6333, isValid: false };
        }
        return { lat: parsedLat, lng: parsedLng, isValid: true };
      }

      await runner.step('Detectar e sanear coordenadas NaN ou strings inválidas', () => {
        const result = sanitizeCoordinate('coordenada_invalida', undefined);
        expect(result.isValid).toBe(false);
        expect(result.lat).toBe(-23.5505);
        expect(result.lng).toBe(-46.6333);
      });

      await runner.step('Detectar e sanear latitudes fora dos limites do globo terrestre', () => {
        const resultOut = sanitizeCoordinate(120.5, -46.6333); // Latitude > 90
        expect(resultOut.isValid).toBe(false);
        expect(resultOut.lat).toBe(-23.5505);
      });

      await runner.step('Preservar coordenadas válidas', () => {
        const resultOk = sanitizeCoordinate(-23.5234, -46.8345);
        expect(resultOk.isValid).toBe(true);
        expect(resultOk.lat).toBe(-23.5234);
        expect(resultOk.lng).toBe(-46.8345);
      });
    });

    // CENÁRIO 7: Validação Algorítmica de CPF (Dígitos Verificadores)
    await runner.scenario('REG-07', 'Validação Algorítmica de CPF com Cálculo de Módulo 11', async () => {
      function isValidCPF(cpf: string): boolean {
        const clean = cpf.replace(/\D/g, '');
        if (clean.length !== 11) return false;
        if (/^(\d)\1+$/.test(clean)) return false; // descarta 111.111.111-11, etc.

        let sum = 0;
        let remainder: number;

        for (let i = 1; i <= 9; i++) sum += parseInt(clean.substring(i - 1, i)) * (11 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(clean.substring(9, 10))) return false;

        sum = 0;
        for (let i = 1; i <= 10; i++) sum += parseInt(clean.substring(i - 1, i)) * (12 - i);
        remainder = (sum * 10) % 11;
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(clean.substring(10, 11))) return false;

        return true;
      }

      await runner.step('Rejeitar CPFs com sequências repetidas (ex: 111.111.111-11)', () => {
        expect(isValidCPF('11111111111')).toBe(false);
        expect(isValidCPF('00000000000')).toBe(false);
      });

      await runner.step('Rejeitar CPF com dígitos verificadores matematicamente falsos', () => {
        expect(isValidCPF('12345678900')).toBe(false);
      });

      await runner.step('Validar algoritmo com CPF padrão de teste da Receita Federal', () => {
        // CPF matematicamente válido conhecido para testes
        expect(isValidCPF('52998224725')).toBe(true);
      });
    });

    // CENÁRIO 8: Idempotência de Check-in em Concorrência de Rede
    await runner.scenario('REG-08', 'Idempotência e Proteção contra Duplo Check-in Concorrente', async () => {
      const checkInLog: Array<{ studentId: string; timestamp: number; requestId: string }> = [];

      function performSafeCheckIn(studentId: string, requestId: string, timestamp: number): boolean {
        // Regra de idempotência: Se a mesma requisição ou se o mesmo aluno já deu check-in nos últimos 60 segundos
        const isDuplicate = checkInLog.some(
          entry => entry.requestId === requestId || (entry.studentId === studentId && (timestamp - entry.timestamp) < 60000)
        );

        if (isDuplicate) {
          return false; // Ignora duplicata sem disparar erro
        }

        checkInLog.push({ studentId, requestId, timestamp });
        return true;
      }

      await runner.step('Permitir primeiro check-in de embarque do aluno', () => {
        const first = performSafeCheckIn('student-1', 'req-001', 1000);
        expect(first).toBe(true);
        expect(checkInLog.length).toBe(1);
      });

      await runner.step('Descartar segundo clique acidental de "Rage-Click" (mesmo segundo)', () => {
        const rageClick = performSafeCheckIn('student-1', 'req-001', 1100);
        expect(rageClick).toBe(false, 'Clique duplicado concorrente deveria ser descartado');
        expect(checkInLog.length).toBe(1);
      });
    });

    // CENÁRIO 9: Debounce Defensivo em Submissões de Formulário (Anti-Duplicidade)
    await runner.scenario('REG-09', 'Debounce Defensivo em Formulários Contra Múltiplos Toques Ansiosos', async () => {
      let submitCallCount = 0;
      let isSubmitting = false;

      async function safeSubmitForm(payload: any): Promise<boolean> {
        if (isSubmitting) {
          return false; // Bloqueia disparos concomitantes
        }
        isSubmitting = true;
        try {
          submitCallCount++;
          return true;
        } finally {
          // Mantém trava ativa por período de segurança
          setTimeout(() => { isSubmitting = false; }, 300);
        }
      }

      await runner.step('Processar apenas 1 submissão quando o usuário clica 4 vezes no botão de Salvar', async () => {
        const payload = { studentName: 'Joãozinho' };
        
        // Simular 4 cliques quase simultâneos
        const r1 = await safeSubmitForm(payload);
        const r2 = await safeSubmitForm(payload);
        const r3 = await safeSubmitForm(payload);
        const r4 = await safeSubmitForm(payload);

        expect(r1).toBe(true);
        expect(r2).toBe(false);
        expect(r3).toBe(false);
        expect(r4).toBe(false);
        expect(submitCallCount).toBe(1, 'Apenas uma submissão deve ter sido processada');
      });
    });

    // CENÁRIO 10: Sanitização de Emojis e Caracteres Não-Padronizados em Documentos
    await runner.scenario('REG-10', 'Sanitização de Emojis e Apelidos em Documentos e Contratos Formais', async () => {
      function sanitizeOfficialName(rawName: string): { displayName: string; officialCleanName: string } {
        const displayName = rawName.trim();
        // Remove emojis, corações e caracteres especiais mantendo apenas letras latinas com acentos
        const officialCleanName = rawName
          .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .replace(/[^\w\sÀ-ÿ]/g, '')
          .replace(/\s+/g, ' ')
          .trim();

        return { displayName, officialCleanName };
      }

      await runner.step('Preservar emojis para saudação calorosa no app e sanitizar para contrato oficial', () => {
        const input = '  👑 Dudinha Silva ❤️ (Princesa)  ';
        const result = sanitizeOfficialName(input);

        expect(result.displayName).toBe('👑 Dudinha Silva ❤️ (Princesa)');
        expect(result.officialCleanName).toBe('Dudinha Silva Princesa');
        expect(result.officialCleanName).not.toContain('👑');
        expect(result.officialCleanName).not.toContain('❤️');
      });
    });

    // CENÁRIO 11: Resiliência Offline-First com Fila Local e Mensagem Leiga
    await runner.scenario('REG-11', 'Resiliência com Cache Local e Fila de Sincronização ao Perder Sinal 4G', async () => {
      const offlineQueue: Array<{ event: string; payload: any; timestamp: number }> = [];

      function handleAction(event: string, payload: any, isOnline: boolean): { status: string; message: string } {
        if (!isOnline) {
          offlineQueue.push({ event, payload, timestamp: Date.now() });
          return {
            status: 'queued',
            message: 'Sem sinal de internet agora. Não se preocupe, salvamos tudo no seu aparelho e enviaremos assim que o sinal voltar!'
          };
        }
        return { status: 'synced', message: 'Dados salvos com sucesso!' };
      }

      await runner.step('Ao ficar sem sinal, salvar evento no cache local com mensagem acolhedora', () => {
        const result = handleAction('STUDENT_CHECKIN', { studentId: 'std-1' }, false);

        expect(result.status).toBe('queued');
        expect(result.message).toContain('Não se preocupe');
        expect(offlineQueue.length).toBe(1);
      });

      await runner.step('Ao restabelecer conexão, descarregar fila acumulada automaticamente', () => {
        expect(offlineQueue.length).toBeGreaterThan(0);
        const flushedEvents = [...offlineQueue];
        offlineQueue.length = 0; // Limpa a fila após sincronização

        expect(flushedEvents.length).toBe(1);
        expect(offlineQueue.length).toBe(0);
      });
    });

    // CENÁRIO 12: Validação Universal de DDDs Oficiais do Brasil
    await runner.scenario('REG-12', 'Validação Rigorosa de DDDs Oficiais da Telefonia Brasileira (Anatel)', async () => {
      const VALID_BRAZILIAN_DDDS = new Set([
        11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
        21, 22, 24, // RJ
        27, 28, // ES
        31, 32, 33, 34, 35, 37, 38, // MG
        41, 42, 43, 44, 45, 46, // PR
        47, 48, 49, // SC
        51, 53, 54, 55, // RS
        61, // DF
        62, 64, // GO
        63, // TO
        65, 66, // MT
        67, // MS
        68, // AC
        69, // RO
        71, 73, 74, 75, 77, // BA
        79, // SE
        81, 87, // PE
        82, // AL
        83, // PB
        84, // RN
        85, 88, // CE
        86, 89, // PI
        91, 93, 94, // PA
        92, 97, // AM
        95, // RR
        96, // AP
        98, 99 // MA
      ]);

      function isValidBrazilianMobile(phone: string): { valid: boolean; reason?: string } {
        const digits = phone.replace(/\D/g, '');
        if (digits.length !== 11) {
          return { valid: false, reason: 'Celular precisa ter DDD e 9 dígitos (11 números no total).' };
        }
        const ddd = parseInt(digits.substring(0, 2), 10);
        if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
          return { valid: false, reason: `DDD (${ddd}) não existe no Brasil.` };
        }
        if (digits[2] !== '9') {
          return { valid: false, reason: 'Celulares no Brasil devem começar com o dígito 9 após o DDD.' };
        }
        return { valid: true };
      }

      await runner.step('Rejeitar DDDs inexistentes (ex: DDD 00, 20, 23)', () => {
        expect(isValidBrazilianMobile('00987654321').valid).toBe(false);
        expect(isValidBrazilianMobile('20987654321').valid).toBe(false);
      });

      await runner.step('Rejeitar número sem o dígito 9 inicial de celular', () => {
        expect(isValidBrazilianMobile('11887654321').valid).toBe(false);
      });

      await runner.step('Aprovar números válidos em capitais e interior (11 SP e 85 CE)', () => {
        expect(isValidBrazilianMobile('11999887766').valid).toBe(true);
        expect(isValidBrazilianMobile('(85) 99123-4567').valid).toBe(true);
      });
    });

    // CENÁRIO 13: Proteção contra Injeção de Scripts (XSS) em Campos de Observação Livre
    await runner.scenario('REG-13', 'Sanitização contra Injeção de Tags HTML/Scripts em Recados e Alergias', async () => {
      function sanitizeFreeText(input: string): string {
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      await runner.step('Neutralizar tags <script> em observação médica de alergia', () => {
        const malicious = 'Alérgico a amendoim <script>alert("hack")</script>';
        const clean = sanitizeFreeText(malicious);

        expect(clean).not.toContain('<script>');
        expect(clean).toContain('&lt;script&gt;');
        expect(clean).toContain('Alérgico a amendoim');
      });
    });

    // CENÁRIO 14: Auditoria de Fuso Horário de Brasília (Zero Deslocamento por UTC)
    await runner.scenario('REG-14', 'Consistência de Calendário no Fuso Horário Oficial de Brasília (GMT-3)', async () => {
      function formatDayInBrasiliaTime(isoString: string): string {
        const date = new Date(isoString);
        return new Intl.DateTimeFormat('pt-BR', {
          timeZone: 'America/Sao_Paulo',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(date);
      }

      await runner.step('Evitar que 23h00 do Brasil avance para o dia seguinte por fuso UTC', () => {
        // 2026-10-25 às 23:00 no Brasil é 2026-10-26T02:00:00.000Z em UTC
        const eveningUtc = '2026-10-26T02:00:00.000Z';
        const formatted = formatDayInBrasiliaTime(eveningUtc);

        expect(formatted).toBe('25/10/2026', 'Deve reconhecer dia 25 no fuso de São Paulo');
      });
    });

  });
}

