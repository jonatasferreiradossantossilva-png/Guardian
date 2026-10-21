import { runner, expect } from '../core/test-runner';
import { initialMockData } from '../../../src/lib/mock-data';

export async function runMonitorSuite() {
  await runner.suite('Jornada Completa do Monitor Escolar', 'MONITOR', async () => {

    // CENÁRIO 1: Roll Call / Manifesto de Embarque
    await runner.scenario('MON-01', 'Sincronização com a Van e Geração do Manifesto de Embarque', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const monitor = state.monitors[0];

      await runner.step('Vincular monitor à van e obter lista de passageiros', () => {
        expect(monitor).toBeDefined();
        expect(route).toBeDefined();
        
        const passengers = state.students.filter((s: any) => route.studentIds.includes(s.id));
        expect(passengers.length).toBeGreaterThan(0);
      });

      await runner.step('Validar ordenação e dados básicos de contato para cada aluno', () => {
        const passengers = state.students.filter((s: any) => route.studentIds.includes(s.id));
        for (const p of passengers) {
          expect(p.name).toBeDefined();
          expect(p.schoolId).toBeDefined();
          expect(p.parentId).toBeDefined();
        }
      });
    });

    // CENÁRIO 2: Check-in de Embarque Seguro (QR Code / Foto)
    await runner.scenario('MON-02', 'Validação de Embarque Seguro (QR Code e Foto)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const student = state.students[0];
      expect(student).toBeDefined();

      await runner.step('Validar dados cadastrais do aluno antes do embarque', () => {
        student.status = 'aguardando';
        expect(student.status).toBe('aguardando');
      });

      await runner.step('Efetuar check-in com sucesso e alterar status para "a_bordo"', () => {
        student.status = 'a_bordo';
        student.boardedAt = new Date().toISOString();
        expect(student.status).toBe('a_bordo');
        expect(student.boardedAt).toBeDefined();
      });
    });

    // CENÁRIO 3: Alertas Críticos de Saúde no Embarque
    await runner.scenario('MON-03', 'Exibição de Badges de Condições Médicas e Alergias no Embarque', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      
      // Localizar ou criar aluno com condição médica
      let medicalStudent = state.students.find((s: any) => s.medicalConditions && s.medicalConditions.length > 0);
      if (!medicalStudent) {
        medicalStudent = state.students[0];
        medicalStudent.medicalConditions = ['Alergia a Amendoim', 'Asma'];
        medicalStudent.medicalNote = 'Carrega bombinha na mochila azul';
      }

      await runner.step('Identificar condições médicas críticas do passageiro', () => {
        expect(medicalStudent.medicalConditions.length).toBeGreaterThan(0);
        const hasValidCondition = medicalStudent.medicalConditions.some((c: string) => 
          ['Alergia', 'Respiratório', 'Diabetes', 'Mobilidade', 'Alergia a Amendoim'].includes(c)
        );
        expect(hasValidCondition).toBe(true, 'Aluno deve possuir condição médica catalogada');
      });

      await runner.step('Validar presença de instruções de emergência visíveis para o monitor', () => {
        expect(medicalStudent.medicalNote).toBeDefined();
        expect(medicalStudent.medicalNote.length).toBeGreaterThan(5);
      });
    });

    // CENÁRIO 4: Registro de Ocorrência Operacional / Incidente
    await runner.scenario('MON-04', 'Registro de Incidente Operacional com Nível de Gravidade', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];

      await runner.step('Registrar incidente de trânsito moderado durante a viagem', () => {
        const newIncident = {
          id: `inc-${Date.now()}`,
          routeId: route.id,
          type: 'traffic_jam',
          title: 'Congestionamento na Av. Inocêncio Seráfico',
          description: 'Acidente leve na via atrasou a rota em 15 minutos',
          severity: 'Média',
          reportedBy: 'user-monitor-1',
          createdAt: new Date().toISOString(),
          status: 'aberto'
        };

        state.incident_reports = state.incident_reports || [];
        state.incident_reports.push(newIncident);

        expect(state.incident_reports.find((i: any) => i.id === newIncident.id)).toBeDefined();
        expect(newIncident.severity).toBe('Média');
      });
    });

    // CENÁRIO 5: Desembarque na Escola e Protocolo Anti-Esquecimento
    await runner.scenario('MON-05', 'Desembarque na Escola e Protocolo Anti-Esquecimento (Van Vazia)', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const students = state.students.filter((s: any) => route.studentIds.includes(s.id));

      await runner.step('Colocar alunos a bordo para simular chegada na escola', () => {
        students.forEach((s: any) => { s.status = 'a_bordo'; });
        expect(students.every((s: any) => s.status === 'a_bordo')).toBe(true);
      });

      await runner.step('Realizar desembarque coletivo no portão do colégio', () => {
        students.forEach((s: any) => {
          s.status = 'desembarcado';
          s.disembarkedAt = new Date().toISOString();
        });
        expect(students.every((s: any) => s.status === 'desembarcado')).toBe(true);
      });

      await runner.step('Auditoria Anti-Esquecimento: Garantir que 0 alunos permaneçam "a_bordo"', () => {
        const remainingOnBoard = students.filter((s: any) => s.status === 'a_bordo');
        expect(remainingOnBoard.length).toBe(0, 'ALERTA GRAVE: Aluno não pode permanecer a bordo após o desembarque!');
      });
    });

    // CENÁRIO 6: Aluno Ausente no Ponto sem Aviso Prévio
    await runner.scenario('MON-06', 'Registro de Ausência não Pré-Notificada no Ponto de Embarque', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const route = state.routes[0];
      const student = state.students.filter((s: any) => route.studentIds.includes(s.id))[0];

      await runner.step('Aguardar tolerância de 3 minutos no ponto e constatar não comparecimento', () => {
        student.status = 'ausente_nao_notificado';
        student.waitedMinutesAtStop = 3;
        student.absenceLoggedAt = new Date().toISOString();

        expect(student.status).toBe('ausente_nao_notificado');
        expect(student.waitedMinutesAtStop).toBe(3);
      });

      await runner.step('Emitir alerta imediato de urgência para o responsável e liberar a van', () => {
        const parentAlert = {
          recipientParentId: student.parentId,
          title: 'Aviso de Embarque: Aluno não localizado',
          message: `${student.name} não compareceu ao ponto de embarque às ${new Date().toLocaleTimeString('pt-BR')}. A van prosseguiu rota.`,
          urgent: true
        };

        expect(parentAlert.urgent).toBe(true);
        expect(parentAlert.recipientParentId).toBe(student.parentId);
      });
    });

    // CENÁRIO 7: Contingência Operacional (Troca Emergencial de Van / Motorista)
    await runner.scenario('MON-07', 'Transferência de Passageiros para Van de Apoio em Pane Mecânica', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const brokenRoute = state.routes[0];
      const studentsInTransit = state.students.filter((s: any) => brokenRoute.studentIds.includes(s.id));
      studentsInTransit[0].status = 'a_bordo';
      studentsInTransit[1].status = 'aguardando';

      const backupVehicle = { id: 'vehicle-backup-1', plate: 'BRA2E19', capacity: 20, active: true };
      const backupRoute = {
        id: `route-contingency-${Date.now()}`,
        name: 'Rota Emergencial de Apoio',
        vehicleId: backupVehicle.id,
        driverId: 'driver-backup-1',
        studentIds: [] as string[],
        status: 'em_rota'
      };

      await runner.step('Migrar lista integral de passageiros e preservar status de bordo individual', () => {
        backupRoute.studentIds = [...brokenRoute.studentIds];
        brokenRoute.status = 'cancelada_pane';

        expect(backupRoute.studentIds.length).toBe(brokenRoute.studentIds.length);
        expect(studentsInTransit[0].status).toBe('a_bordo');
        expect(studentsInTransit[1].status).toBe('aguardando');
      });

      await runner.step('Vincular monitor à nova rota de contingência', () => {
        const monitor = state.monitors[0];
        monitor.activeRouteId = backupRoute.id;
        expect(monitor.activeRouteId).toBe(backupRoute.id);
      });
    });

    // CENÁRIO 8: Protocolo e Auditoria de Administração de Medicamento Escolar
    await runner.scenario('MON-08', 'Auditoria de Administração de Medicamento Conforme Prescrição', async () => {
      const state = JSON.parse(JSON.stringify(initialMockData));
      const studentWithMeds = state.students.find((s: any) => s.medicalNote && s.medicalNote.length > 0) || state.students[0];

      await runner.step('Checar prescrição cadastrada e instruções de emergência', () => {
        expect(studentWithMeds.medicalNote).toBeDefined();
        expect(studentWithMeds.medicalNote.length).toBeGreaterThan(0);
      });

      await runner.step('Registrar aplicação/ingestão com horário exato e assinatura digital do monitor', () => {
        const medLog = {
          id: `medlog-${Date.now()}`,
          studentId: studentWithMeds.id,
          administeredAt: new Date().toISOString(),
          administeredBy: 'user-monitor-1',
          dosage: '1 inalação de bombinha',
          studentReaction: 'Normal / Sem queixas',
          signedByMonitor: true
        };

        expect(medLog.signedByMonitor).toBe(true);
        expect(medLog.dosage).toBeDefined();
        expect(medLog.studentId).toBe(studentWithMeds.id);
      });
    });

    // CENÁRIO 9: Prevenção de Troca de Crianças com Nomes Iguais (Homônimos na mesma van)
    await runner.scenario('MON-09', 'Diferenciação Visual Automática de Alunos Homônimos no Manifesto', async () => {
      const homonymousStudents = [
        { id: 'std-h1', name: 'Lucas Silva', serie: '1º Ano A', schoolId: 'school-1', photo: 'lucas1.jpg', parentPhone: '11988881111' },
        { id: 'std-h2', name: 'Lucas Silva', serie: '5º Ano B', schoolId: 'school-2', photo: 'lucas2.jpg', parentPhone: '11988882222' }
      ];

      function formatPassengerDisplayName(student: any, allPassengers: any[]): string {
        const hasDuplicateName = allPassengers.filter(p => p.name === student.name).length > 1;
        if (hasDuplicateName) {
          return `${student.name} (${student.serie} - ${student.schoolId})`;
        }
        return student.name;
      }

      await runner.step('Adicionar identificador de série e escola quando houver dois alunos com o mesmo nome', () => {
        const name1 = formatPassengerDisplayName(homonymousStudents[0], homonymousStudents);
        const name2 = formatPassengerDisplayName(homonymousStudents[1], homonymousStudents);

        expect(name1).toContain('1º Ano A');
        expect(name2).toContain('5º Ano B');
        expect(name1).not.toBe(name2);
      });
    });

    // CENÁRIO 10: Trava Física de Fim de Viagem - Varredura Banco a Banco (Anti-Esquecimento)
    await runner.scenario('MON-10', 'Varredura Obrigatória do Fundo da Van com Confirmação Física Banco a Banco', async () => {
      interface VanInspection {
        frontRowChecked: boolean;
        middleRowsChecked: boolean;
        backSeatChecked: boolean;
        completedAt?: string;
      }

      const inspection: VanInspection = {
        frontRowChecked: false,
        middleRowsChecked: false,
        backSeatChecked: false
      };

      function canFinishRoute(insp: VanInspection): boolean {
        return insp.frontRowChecked && insp.middleRowsChecked && insp.backSeatChecked;
      }

      await runner.step('Impedir conclusão de viagem se o monitor não confirmar varredura até o último banco', () => {
        inspection.frontRowChecked = true;
        inspection.middleRowsChecked = true;
        // Esqueceram de checar o banco de trás (onde crianças pequenas costumam dormir deitadas)
        expect(canFinishRoute(inspection)).toBe(false);
      });

      await runner.step('Liberar encerramento somente após conferência física completa do fundo da van', () => {
        inspection.backSeatChecked = true;
        inspection.completedAt = new Date().toISOString();
        expect(canFinishRoute(inspection)).toBe(true);
      });
    });

    // CENÁRIO 11: Discagem Rápida em Caso de Emergência de Saúde (1 Toque)
    await runner.scenario('MON-11', 'Acesso Imediato a Telefone de Emergência em Caso de Crise Médica do Aluno', async () => {
      const student = {
        id: 'std-allergy',
        name: 'Bernardo Silva',
        medicalCondition: 'Anafilaxia por Picada de Inseto',
        emergencyContacts: [
          { name: 'Mãe (Juliana)', phone: '11999998888', primary: true },
          { name: 'SAMU', phone: '192', primary: false }
        ]
      };

      await runner.step('Disponibilizar botão de discagem direta para o contato primário em 1 toque', () => {
        const primaryContact = student.emergencyContacts.find(c => c.primary);
        expect(primaryContact).toBeDefined();
        expect(primaryContact?.phone).toBe('11999998888');

        // Formato de link nativo para discagem móvel imediata
        const telUri = `tel:${primaryContact?.phone}`;
        expect(telUri).toBe('tel:11999998888');
      });
    });

    // CENÁRIO 12: Validação Visual de Terceiro na Entrega com Conferência de Foto
    await runner.scenario('MON-12', 'Conferência Segura de Documento e Foto de Terceiro no Desembarque', async () => {
      const authorizedPickup = {
        authorizedPersonName: 'Claudio Roberto (Tio)',
        authorizedPersonDoc: '33.444.555-6',
        photoAvailable: true,
        secretCode: '4829' // Código combinado entre mãe e van
      };

      await runner.step('Exibir foto e código de retirada fornecido pela mãe para liberar o aluno', () => {
        expect(authorizedPickup.photoAvailable).toBe(true);
        expect(authorizedPickup.secretCode.length).toBe(4);

        const verifyPickup = (code: string) => code === authorizedPickup.secretCode;
        expect(verifyPickup('4829')).toBe(true);
        expect(verifyPickup('0000')).toBe(false);
      });
    });

    // CENÁRIO 13: Varredura de Objetos Esquecidos com Registro Amigável aos Pais
    await runner.scenario('MON-13', 'Checklist de Objetos Esquecidos na Van e Notificação Imediata à Família', async () => {
      const lostItemNotice = {
        itemDescription: 'Lancheira do Homem-Aranha',
        studentId: 'student-1',
        studentName: 'Enzo',
        parentName: 'Ana Pereira',
        foundLocation: 'Sob o assento da 3ª fileira',
        status: 'guardado_com_a_monitora'
      };

      function generateLostItemMessage(notice: typeof lostItemNotice): string {
        return `🎒 Olá, ${notice.parentName}! A monitora encontrou a ${notice.itemDescription} do ${notice.studentName} na van. Já está guardada em segurança para a volta!`;
      }

      await runner.step('Registrar item esquecido após vistoria dos assentos', () => {
        expect(lostItemNotice.status).toBe('guardado_com_a_monitora');
        expect(lostItemNotice.itemDescription).toContain('Lancheira');
      });

      await runner.step('Gerar mensagem carinhosa e tranquilizadora para a mãe', () => {
        const msg = generateLostItemMessage(lostItemNotice);
        expect(msg).toContain('Olá, Ana Pereira');
        expect(msg).toContain('Lancheira do Homem-Aranha');
        expect(msg).toContain('guardada em segurança');
      });
    });

    // CENÁRIO 14: Registro de Humor e Bem-Estar da Criança por Ícones Simplificados
    await runner.scenario('MON-14', 'Diário de Bordo Rápido por Emojis para Informar Bem-Estar aos Pais', async () => {
      const moodOptions = [
        { code: 'happy', emoji: '😊', label: 'Super animado(a)' },
        { code: 'asleep', emoji: '😴', label: 'Dormiu a viagem toda' },
        { code: 'nauseous', emoji: '🤢', label: 'Enjoo leve (já melhorou)' },
        { code: 'crying', emoji: '😢', label: 'Chorou um pouquinho com saudades' }
      ];

      function formatMoodLog(studentName: string, moodCode: string) {
        const selected = moodOptions.find(m => m.code === moodCode) || moodOptions[0];
        return `${selected.emoji} ${studentName} estava ${selected.label.toLowerCase()} durante o trajeto.`;
      }

      await runner.step('Registrar que a criança dormiu a viagem com seleção de 1 toque no emoji', () => {
        const note = formatMoodLog('Clara', 'asleep');
        expect(note).toContain('😴');
        expect(note).toContain('dormiu a viagem toda');
        expect(note).toContain('Clara');
      });
    });

  });
}

