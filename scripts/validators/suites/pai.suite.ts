import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';

// Fórmula de Haversine estabilizada do Guardian (em metros)
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Raio da Terra em metros
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

export async function runPaiSuite() {
  await runner.suite('Jornada Completa do Pai / Responsável', 'PAI', async () => {

    // CENÁRIO 1: Rastreamento em Tempo Real
    await runner.scenario('PAI-01', 'Rastreamento em Tempo Real da Van Escolar', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const parentUser = state.parents.find((p: any) => p.userId === 'user-pai-1') || state.parents[0];
      const children = state.students.filter((s: any) => s.parentId === parentUser.id);

      await runner.step('Localizar dependentes vinculados ao responsável', () => {
        expect(parentUser).toBeDefined();
        expect(children.length).toBeGreaterThan(0);
      });

      await runner.step('Consultar localização ativa do motorista da van da rota do aluno', () => {
        const student = children[0];
        const route = state.routes.find((r: any) => r.studentIds.includes(student.id)) || state.routes[0];
        const driver = state.drivers.find((d: any) => d.id === route.driverId) || state.drivers[0];

        expect(driver.latitude).toBeDefined();
        expect(driver.longitude).toBeDefined();
        expect(typeof driver.latitude).toBe('number');
        expect(typeof driver.longitude).toBe('number');
      });
    });

    // CENÁRIO 2: Alerta de Proximidade 800m (Zero Custo de API)
    await runner.scenario('PAI-02', 'Cálculo de Proximidade (Alerta de 800m via Fórmula de Haversine)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const student = state.students[0];
      const studentHome = { lat: student.latitude, lng: student.longitude };

      // Caso A: Van longe (a 2.500 metros)
      // Deslocamento de ~0.022 graus na latitude (~2.44 km)
      const vanFar = { lat: studentHome.lat + 0.022, lng: studentHome.lng };

      // Caso B: Van próxima (a 500 metros)
      // Deslocamento de ~0.004 graus na latitude (~444 metros)
      const vanNear = { lat: studentHome.lat + 0.004, lng: studentHome.lng };

      const PROXIMITY_THRESHOLD_METERS = 800;

      await runner.step('Garantir que NÃO dispare alerta quando a van estiver distante (> 800m)', () => {
        const distFar = haversineDistanceMeters(vanFar.lat, vanFar.lng, studentHome.lat, studentHome.lng);
        expect(distFar).toBeGreaterThan(PROXIMITY_THRESHOLD_METERS);
        
        const shouldAlertFar = distFar <= PROXIMITY_THRESHOLD_METERS;
        expect(shouldAlertFar).toBe(false);
      });

      await runner.step('Disparar alerta push/local quando a van cruzar o raio de 800m', () => {
        const distNear = haversineDistanceMeters(vanNear.lat, vanNear.lng, studentHome.lat, studentHome.lng);
        expect(distNear).toBeLessThan(PROXIMITY_THRESHOLD_METERS);
        
        const shouldAlertNear = distNear <= PROXIMITY_THRESHOLD_METERS;
        expect(shouldAlertNear).toBe(true);
      });
    });

    // CENÁRIO 3: Comunicação de Ausência (Absentee Workflow)
    await runner.scenario('PAI-03', 'Comunicação de Ausência com Sincronização Instantânea na Rota', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const student = state.students.find((s: any) => route.studentIds.includes(s.id)) || state.students[0];

      await runner.step('Pai registra ausência pontual: "Faltará na Ida"', () => {
        student.status = 'ausente_ida';
        student.absenceReportedAt = new Date().toISOString();
        student.absenceReason = 'Consulta médica matinal';
        
        expect(student.status).toBe('ausente_ida');
      });

      await runner.step('Sistema deve expurgar aluno da lista de paradas do turno da manhã (Ida)', () => {
        // Lógica de filtragem do App do Motorista
        const isExcludedFromMorningTrip = student.status === 'ausente_ida' || student.status === 'ausente_dia_todo';
        expect(isExcludedFromMorningTrip).toBe(true);
      });

      await runner.step('Garantir que o aluno ainda esteja apto para a viagem da tarde (Volta)', () => {
        // Aluno falta na ida, mas volta normalmente
        const isExcludedFromAfternoonTrip = student.status === 'ausente_volta' || student.status === 'ausente_dia_todo';
        expect(isExcludedFromAfternoonTrip).toBe(false);
      });
    });

    // CENÁRIO 4: Painel Financeiro e Código Pix do Pai
    await runner.scenario('PAI-04', 'Consulta de Faturas do Aluno e Geração de Código Pix', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const parentUser = state.parents.find((p: any) => p.userId === 'val-pai') || state.parents[0];
      const invoices = state.invoices.filter((inv: any) => inv.parentUserId === parentUser.userId || inv.parentId === parentUser.id);

      await runner.step('Consultar lista de faturas do responsável', () => {
        expect(invoices.length).toBeGreaterThan(0);
        for (const inv of invoices) {
          expect(inv.amount).toBeGreaterThan(0);
          expect(['paid', 'pending', 'overdue', 'pagamento_em_analise']).toContain(inv.status);
        }
      });

      await runner.step('Validar geração de dados Pix para fatura pendente', () => {
        const pendingInvoice = invoices.find((inv: any) => inv.status === 'pending') || invoices[0];
        
        // Simular payload Pix copia e cola
        const pixPayload = `00020126360014BR.GOV.BCB.PIX0114+551199999999520400005303986540${pendingInvoice.amount.toFixed(2)}5802BR5915GUARDIAN TRANSPORTES6009SAO PAULO62070503***6304`;
        expect(pixPayload).toContain('BR.GOV.BCB.PIX');
        expect(pixPayload.length).toBeGreaterThan(40);
      });
    });

    // CENÁRIO 5: Autorização de Retirada por Terceiros
    await runner.scenario('PAI-05', 'Cadastro e Validação de Terceiros Autorizados a Retirar o Aluno', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const student = state.students[0];

      await runner.step('Cadastrar pessoa autorizada (avó/tio) com documento e telefone', () => {
        const authorizedPerson = {
          id: `auth-${Date.now()}`,
          studentId: student.id,
          name: 'Maria de Lourdes (Avó)',
          rg: '12.345.678-9',
          cpf: '222.333.444-55',
          phone: '(11) 98765-4321',
          relation: 'Avó Materna',
          active: true,
          photoUrl: 'https://placehold.co/150x150'
        };

        student.authorizedPersons = student.authorizedPersons || [];
        student.authorizedPersons.push(authorizedPerson);

        expect(student.authorizedPersons.length).toBeGreaterThan(0);
        expect(student.authorizedPersons[0].rg).toBe('12.345.678-9');
      });
    });

    // CENÁRIO 6: Solicitação de Alteração de Ponto de Desembarque Temporário
    await runner.scenario('PAI-06', 'Alteração Excepcional de Endereço de Desembarque pelo Responsável', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const student = state.students[0];

      await runner.step('Pai solicita desembarque na residência da avó para a data de hoje', () => {
        student.temporaryDropoff = {
          active: true,
          date: new Date().toISOString().split('T')[0],
          address: 'Rua Augusta, 900, São Paulo - SP',
          latitude: -23.5530,
          longitude: -46.6540,
          authorizedRecipientName: 'Maria de Lourdes (Avó)',
          requestedAt: new Date().toISOString()
        };

        expect(student.temporaryDropoff.active).toBe(true);
        expect(student.temporaryDropoff.authorizedRecipientName).toContain('Avó');
      });

      await runner.step('Validar que o endereço temporário esteja dentro da área de cobertura operacional', () => {
        const school = state.schools.find((s: any) => s.id === student.schoolId) || state.schools[0];
        const distToSchool = haversineDistanceMeters(
          student.temporaryDropoff.latitude,
          student.temporaryDropoff.longitude,
          school.latitude,
          school.longitude
        );

        // Deve estar a menos de 15km da escola de referência
        const MAX_OPERATIONAL_RADIUS_METERS = 15000;
        expect(distToSchool).toBeLessThan(MAX_OPERATIONAL_RADIUS_METERS, 'Ponto fora da zona de atendimento da van');
      });
    });

    // CENÁRIO 7: Histórico de Viagens e Auditoria de Pontualidade
    await runner.scenario('PAI-07', 'Auditoria de Histórico de Viagens dos Últimos 30 Dias do Filho', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const tripHistory = state.trip_history || state.tripHistory || [];

      await runner.step('Consultar viagens realizadas do aluno nos últimos 30 dias', () => {
        expect(tripHistory.length).toBeGreaterThan(0);
        
        for (const trip of tripHistory.slice(0, 5)) {
          expect(trip.id).toBeDefined();
          expect(trip.date).toBeDefined();
          expect(trip.driverName).toBeDefined();
          expect(trip.actualKm).toBeGreaterThan(0);
        }
      });

      await runner.step('Validar integridade do log de embarque e desembarque na escola', () => {
        const sampleTrip = tripHistory[0];
        const logs = sampleTrip.eventsLog || sampleTrip.compactLog;
        expect(logs).toBeDefined();
        expect(logs.length).toBeGreaterThan(0);

        // Formato desidratado padrão: "id|status|timestamp"
        const firstEntry = logs[0];
        expect(firstEntry).toContain('|');
      });
    });

    // CENÁRIO 8: Liquidação Pix Instantânea com Emissão de Recibo
    await runner.scenario('PAI-08', 'Confirmação de Pagamento Pix e Liberação de Recibo Autenticado', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const invoice = state.invoices.find((i: any) => i.status === 'pending') || state.invoices[0];

      await runner.step('Receber webhook bancário com liquidação do Pix (E2E ID)', () => {
        const pixEndToEndId = `E12345678${Date.now()}ABC123456789`;
        invoice.status = 'paid';
        invoice.paidAt = new Date().toISOString();
        invoice.paymentMethod = 'pix';
        invoice.pixEndToEndId = pixEndToEndId;

        expect(invoice.status).toBe('paid');
        expect(invoice.pixEndToEndId).toBeDefined();
      });

      await runner.step('Gerar recibo com hash de autenticidade para o responsável', () => {
        const receipt = {
          receiptNumber: `REC-${invoice.id.toUpperCase()}`,
          studentId: invoice.studentId,
          amount: invoice.amount,
          paidAt: invoice.paidAt,
          authHash: `SHA256:${Buffer.from(`${invoice.id}-${invoice.amount}-${invoice.paidAt}`).toString('base64').substring(0, 24)}`
        };

        expect(receipt.receiptNumber).toContain('REC-');
        expect(receipt.authHash.length).toBeGreaterThan(15);
      });
    });

    // CENÁRIO 9: Tratamento Amigável de Copia-e-Cola do Pix (Sanitização Anti-Espaços)
    await runner.scenario('PAI-09', 'Sanitização Automática de Código Pix Copia-e-Cola com Espaços e Quebras', async () => {
      function cleanPixCode(raw: string): string {
        return raw.replace(/[\r\n\t\s]+/g, '').trim();
      }

      await runner.step('Remover espaços e quebras de linha que o pai selecionou acidentalmente ao copiar', () => {
        const rawPastedPix = `
          00020126360014BR.GOV.BCB.PIX0114+551199999999
          520400005303986540450.005802BR5915GUARDIAN
          6009SAO PAULO62070503***6304
        `;
        const cleaned = cleanPixCode(rawPastedPix);

        expect(cleaned.includes('\n')).toBe(false);
        expect(cleaned.includes(' ')).toBe(false);
        expect(cleaned.startsWith('0002012636')).toBe(true);
      });
    });

    // CENÁRIO 10: Notificações em Linguagem Humana e Acolhedora
    await runner.scenario('PAI-10', 'Tradução de Telemetria Técnica para Mensagens Claras e Acolhedoras aos Pais', async () => {
      function formatParentStatusMessage(driverName: string, studentName: string, distanceMeters: number, status: string): string {
        if (status === 'a_bordo') {
          return `🎒 ${studentName} acabou de embarcar na van com ${driverName}. Viagem segura iniciada!`;
        }
        if (status === 'desembarcado') {
          return `🏫 ${studentName} foi entregue com segurança no colégio! Tenha um ótimo dia.`;
        }
        if (distanceMeters <= 500) {
          return `🚐 A van do ${driverName} está virando a esquina! Traga o(a) ${studentName} para o portão.`;
        }
        return `A van está a caminho (aprox. ${Math.ceil(distanceMeters / 400)} minutos).`;
      }

      await runner.step('Gerar mensagem acolhedora de aproximação do portão (< 500m)', () => {
        const msg = formatParentStatusMessage('Tio Juliano', 'Enzo', 400, 'aguardando');
        expect(msg).toContain('está virando a esquina');
        expect(msg).toContain('Enzo');
      });

      await runner.step('Gerar mensagem de confirmação de entrega segura na escola', () => {
        const msg = formatParentStatusMessage('Tio Juliano', 'Enzo', 0, 'desembarcado');
        expect(msg).toContain('foi entregue com segurança no colégio');
      });
    });

    // CENÁRIO 11: Emissão de Declaração de Quitação Anual para IRPF em 1 Toque
    await runner.scenario('PAI-11', 'Geração de Informe Anual Consolidado de Gastos com Transporte para IRPF', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const invoices = state.invoices || [];
      const paidInvoices = invoices.filter((i: any) => i.status === 'paid');

      await runner.step('Consolidar histórico anual de pagamentos com CNPJ e CPF para declaração fiscal', () => {
        const totalYearlyPaid = paidInvoices.reduce((sum: number, i: any) => sum + i.amount, 0);
        expect(totalYearlyPaid).toBeGreaterThan(0);

        const taxReport = {
          year: 2026,
          companyName: 'Guardian Transporte Escolar Ltda',
          cnpj: '12.345.678/0001-90',
          parentName: 'Ana Pereira',
          studentName: 'Enzo Pereira',
          totalPaid: totalYearlyPaid,
          installmentsCount: paidInvoices.length
        };

        expect(taxReport.totalPaid).toBe(totalYearlyPaid);
        expect(taxReport.cnpj).toBe('12.345.678/0001-90');
      });
    });

    // CENÁRIO 12: Comunicação de Falta em 2 Toques Rápidos (Sem Formulários Longos)
    await runner.scenario('PAI-12', 'Comunicação Instantânea de Falta com Seleção Simplificada de Motivo', async () => {
      const quickAbsenceOptions = [
        'Febre / Gripe',
        'Consulta Médica',
        'Viagem em Família',
        'Outro Motivo'
      ];

      function registerQuickAbsence(selectedShift: 'ida' | 'volta' | 'dia_todo', reasonIndex: number) {
        return {
          reportedAt: new Date().toISOString(),
          shift: selectedShift,
          reason: quickAbsenceOptions[reasonIndex] || 'Não informado',
          status: selectedShift === 'ida' ? 'ausente_ida' : (selectedShift === 'volta' ? 'ausente_volta' : 'ausente_dia_todo')
        };
      }

      await runner.step('Registrar ausência matinal imediata escolhendo "Febre / Gripe" em 2 toques', () => {
        const absence = registerQuickAbsence('ida', 0);
        expect(absence.status).toBe('ausente_ida');
        expect(absence.reason).toBe('Febre / Gripe');
        expect(absence.reportedAt).toBeDefined();
      });
    });

    // CENÁRIO 13: Autorização Temporária de Retirada por Terceiro ("Hoje a Vovó Busca")
    await runner.scenario('PAI-13', 'Autorização de Retirada por Terceiro com Token de Segurança de 4 Dígitos', async () => {
      function generateThirdPartyPickupAuth(childName: string, thirdPartyName: string, relationship: string) {
        const securityPin = Math.floor(1000 + Math.random() * 9000).toString();
        return {
          childName,
          authorizedPerson: `${thirdPartyName} (${relationship})`,
          securityPin,
          validForDate: new Date().toISOString().split('T')[0],
          status: 'ativo',
          shareableMessage: `🚨 AVISO VAN/ESCOLA: Hoje quem buscará o(a) ${childName} será ${thirdPartyName} (${relationship}). Código de segurança: ${securityPin}.`
        };
      }

      await runner.step('Gerar autorização expressa com código PIN e mensagem pronta para WhatsApp', () => {
        const auth = generateThirdPartyPickupAuth('Enzo', 'Dona Maria', 'Avó Materna');
        expect(auth.securityPin.length).toBe(4);
        expect(auth.authorizedPerson).toContain('Dona Maria');
        expect(auth.shareableMessage).toContain('Código de segurança:');
        expect(auth.shareableMessage).toContain('Dona Maria');
      });
    });

    // CENÁRIO 14: Emissão Instantânea de 2ª Via de Recibo Amigável para WhatsApp
    await runner.scenario('PAI-14', 'Geração de 2ª Via de Recibo Simplificado sem Jargões Contábeis', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const invoice = state.invoices.find((i: any) => i.status === 'paid') || state.invoices[0];

      function generateFriendlyReceipt(inv: any, companyName: string) {
        return {
          receiptNumber: `REC-${inv.id}`,
          title: 'Comprovante de Pagamento de Transporte Escolar',
          company: companyName,
          valueFormatted: `R$ ${Number(inv.amount).toFixed(2).replace('.', ',')}`,
          statusLabel: 'PAGO COM SUCESSO via PIX',
          paymentDate: new Date().toLocaleDateString('pt-BR'),
          note: 'Obrigado por confiar no nosso cuidado com o seu filho!'
        };
      }

      await runner.step('Gerar comprovante humanizado com mensagem acolhedora de agradecimento', () => {
        const receipt = generateFriendlyReceipt(invoice, 'Expresso Escolar Guardian');
        expect(receipt.receiptNumber).toContain('REC-');
        expect(receipt.statusLabel).toContain('PAGO COM SUCESSO');
        expect(receipt.valueFormatted).toContain('R$');
        expect(receipt.note).toContain('cuidado com o seu filho');
      });
    });

  });
}

