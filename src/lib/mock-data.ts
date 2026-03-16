
// @ts-nocheck
/**
 * @fileOverview Dados iniciais enriquecidos (Parte 3: Histórico e Comunicação).
 * Contém volume real de faturamento, telemetria, alunos, triagem, logs e mensagens.
 */

const now = new Date();

// Auxiliares para datas
const getPastDate = (monthsAgo, day = 10) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    return d.toISOString().split('T')[0];
};

const getRecentDay = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const getRecentTime = (hoursAgo) => {
    const d = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return d.toISOString();
};

// Gerador de Histórico de Faturamento (24 meses)
const generateInvoices = () => {
    const invoices = [];
    const studentList = [
        { id: "student-1", name: "Enzo Pereira", parentUserId: "user-pai-1" },
        { id: "student-2", name: "Valentina Pereira", parentUserId: "user-pai-1" },
        { id: "student-3", name: "Bernardo Silva", parentUserId: "user-pai-2" },
        { id: "student-4", name: "Alice Souza", parentUserId: "user-pai-3" }
    ];

    for (let i = 0; i < 24; i++) {
        studentList.forEach(s => {
            const date = getPastDate(i);
            const isPaid = i > 2; 
            invoices.push({
                id: `inv-hist-${s.id}-${i}`,
                studentId: s.id,
                parentUserId: s.parentUserId,
                description: `Mensalidade - ${date.substring(0, 7)}`,
                amount: 450,
                dueDate: date,
                status: isPaid ? 'paid' : (i === 0 ? 'pending' : 'overdue')
            });
        });
    }
    return invoices;
};

// Gerador de Histórico de Viagens (Telemetria ROI)
const generateTripHistory = () => {
    const history = [];
    const drivers = ["Juliano Castro", "Marcos Viana", "Sérgio Lima"];
    
    for (let i = 1; i <= 30; i++) {
        const driver = drivers[i % drivers.length];
        const planned = 40 + Math.random() * 10;
        const actual = planned - (1 + Math.random() * 5);
        const savings = planned - actual;
        
        history.push({
            id: `trip-gen-${i}`,
            date: getRecentDay(i),
            driverName: driver,
            plannedKm: Number(planned.toFixed(1)),
            actualKm: Number(actual.toFixed(1)),
            savingsKm: Number(savings.toFixed(1)),
            fuelSaved: Number((savings * 5.80).toFixed(2)) 
        });
    }
    return history;
};

export const initialMockData = {
    config: [
        { id: "global", scaling_mode: false } 
    ],
    company_profile: [
        { 
            id: "profile-1", 
            companyName: "Guardian Transporte Escolar Ltda", 
            cnpj: "12.345.678/0001-90", 
            email: "financeiro@guardian.com.br", 
            phone: "(11) 98888-7777", 
            address: "Av. Paulista, 1000 - Bela Vista, São Paulo, SP", 
            website: "https://guardian.app",
            bankName: "Banco Itaú",
            bankAgency: "0300",
            bankAccount: "45678-9",
            pixKey: "12.345.678/0001-90"
        }
    ],
    users: [
        { id: "user-admin-1", name: "Jonatas Gestor", email: "admin@guardian.com", profile: 'gestor', active: true },
        { id: "user-motorista-4", name: "Juliano Castro", email: "juliano.castro@rotasegura.com", profile: 'motorista', active: true },
        { id: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", profile: 'pai', active: true },
        { id: "user-pai-2", name: "Carlos Silva", email: "carlos.silva@email.com", profile: 'pai', active: true },
        { id: "user-pai-3", name: "Beatriz Souza", email: "beatriz.souza@email.com", profile: 'pai', active: true },
        { id: "user-monitor-1", name: "Fernanda Lima", email: "fernanda.lima@rotasegura.com", profile: 'monitor', active: true },
    ],
    schools: [
        {
            id: "school-1",
            name: "Escola Primária do Saber",
            cnpj: "12.345.678/0001-99",
            active: true,
            latitude: -23.5505,
            longitude: -46.6333,
            street: "Rua das Flores",
            number: "123",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01001-000"
        },
        {
            id: "school-2",
            name: "Colégio Albert Einstein",
            cnpj: "98.765.432/0001-11",
            active: true,
            latitude: -23.5345,
            longitude: -46.8456,
            street: "Rua Rui Barbosa",
            number: "150",
            neighborhood: "Vila Dirce",
            city: "Carapicuíba",
            state: "SP",
            zipCode: "06333-000"
        }
    ],
    school_knowledge_base: [
        { id: "kb-1", name: "Colégio Amos", city: "Carapicuíba", state: "SP", street: "Av. Inocêncio Seráfico", number: "2000", neighborhood: "Centro", zipCode: "06320-290", latitude: -23.5234, longitude: -46.8345 },
        { id: "kb-2", name: "Colégio Albert Einstein", city: "Carapicuíba", state: "SP", street: "Rua Rui Barbosa", number: "150", neighborhood: "Vila Dirce", zipCode: "06333-000", latitude: -23.5345, longitude: -46.8456 },
        { id: "kb-3", name: "E.E. Maria de Lourdes Teixeira", city: "Carapicuíba", state: "SP", street: "Av. Brasil", number: "500", neighborhood: "Cohab", zipCode: "06325-000", latitude: -23.5456, longitude: -46.8567 }
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", active: true },
        { id: "parent-2", userId: "user-pai-2", name: "Carlos Silva", email: "carlos.silva@email.com", phone: "11977778888", active: true },
        { id: "parent-3", userId: "user-pai-3", name: "Beatriz Souza", email: "beatriz.souza@email.com", phone: "11966665555", active: true },
    ],
    students: [
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 101", medicalConditions: ["Alergia"], medicalNote: "ALERGIA GRAVE A GLÚTEN E LACTOSE.", serviceModality: 'completo' },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5585, longitude: -46.6605, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 202", medicalConditions: ["Respiratório"], medicalNote: "Possui bronquite asmática. Bombinha na mochila.", serviceModality: 'completo' },
        { id: "student-3", name: "Bernardo Silva", schoolId: "school-2", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5234, longitude: -46.8345, street: "Av. Inocêncio Seráfico", number: "50", city: "Carapicuíba", state: "SP", monthlyFee: 300, preferredPaymentDay: 5, serie: "1º Ano Médio", serviceModality: 'so_ida' },
        { id: "student-4", name: "Alice Souza", schoolId: "school-2", parentId: "parent-3", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5345, longitude: -46.8456, street: "Rua Rui Barbosa", number: "200", city: "Carapicuíba", state: "SP", monthlyFee: 320, preferredPaymentDay: 15, serie: "7º Ano", medicalConditions: ["Diabetes"], medicalNote: "Uso de insulina após o almoço.", serviceModality: 'so_volta' },
        { id: "student-5", name: "Pedro Santos", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5500, longitude: -46.6400, street: "Rua Augusta", number: "500", city: "São Paulo", state: "SP", monthlyFee: 480, medicalConditions: ["Mobilidade"], medicalNote: "Cadeira de rodas. Necessita auxílio no embarque.", serviceModality: 'completo' }
    ],
    drivers: [
        { id: "driver-1", userId: "user-motorista-4", name: "Juliano Castro", status: "inativo", vehicleId: "vehicle-1", active: true, latitude: -23.5500, longitude: -46.6300 }
    ],
    vehicles: [
        { id: "vehicle-1", model: "Mercedes Sprinter", licensePlate: "BRA2E19", capacity: 20, active: true, currentOdometer: 45200, lastMaintenanceOdometer: 40000, maintenanceInterval: 10000 }
    ],
    routes: [
        {
            id: "route-1",
            name: "Rota 01 - Manhã",
            driverId: "driver-1",
            monitorId: "user-monitor-1",
            shift: "Manhã",
            studentIds: ["school-1", "student-1", "student-2", "student-5", "student-3"],
            lastOptimizedAt: new Date().toISOString()
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    invoices: generateInvoices(),
    expenses: [
        { id: "exp-fix-1", description: "Seguro Frota Anual", amount: 4800.00, date: getRecentDay(60), category: "Outros" },
        { id: "exp-fix-2", description: "IPVA Van BRA2E19", amount: 2450.00, date: getRecentDay(120), category: "Impostos" },
        { id: "exp-1", description: "Diesel - Posto Shell", amount: 1200.50, date: getRecentDay(2), category: "Combustível" },
        { id: "exp-2", description: "Troca de Óleo e Filtros", amount: 450.00, date: getRecentDay(15), category: "Manutenção" },
        { id: "exp-3", description: "Salário Motorista Juliano", amount: 3500.00, date: getRecentDay(5), category: "Salários" },
    ],
    trip_history: generateTripHistory(),
    trip_requests: [
        { id: "tr-1", studentId: "student-1", parentUserId: "user-pai-1", schoolId: "school-1", date: getRecentDay(-2), type: "ida_e_volta", shift: "manha", status: "pendente", reason: "Evento extra de robótica na escola.", createdAt: getRecentDay(1) },
        { id: "tr-2", studentId: "student-2", parentUserId: "user-pai-1", schoolId: "school-1", date: getRecentDay(-1), type: "ida", shift: "tarde", status: "aguardando_aprovacao_pai", amount: 45.00, reason: "Reposição de aula.", createdAt: getRecentDay(2) },
    ],
    pending_registrations: [
        { 
            id: "reg-1", 
            parentName: "Ricardo Oliveira", 
            studentName: "Felipe Oliveira", 
            email: "ricardo@email.com", 
            phone: "11977776666", 
            schoolId: "school-1", 
            status: "pending_approval", 
            createdAt: getRecentDay(1),
            serviceModality: 'completo',
            address: { zipCode: "06320-000", street: "Rua Sandra Maria", number: "50", neighborhood: "Centro", city: "Carapicuíba", state: "SP" },
            documentData: { cpf: "123.456.789-00", rg: "12.345.678-9" }
        },
        { 
            id: "reg-2", 
            parentName: "Camila Santos", 
            studentName: "Beatriz Santos", 
            email: "camila@email.com", 
            phone: "11955554444", 
            schoolId: "school-1", 
            status: "pending_approval", 
            createdAt: getRecentDay(0),
            serviceModality: 'so_volta',
            address: { zipCode: "06333-000", street: "Rua Rui Barbosa", number: "100", neighborhood: "Vila Dirce", city: "Carapicuíba", state: "SP" },
            documentData: { cpf: "987.654.321-11", rg: "98.765.432-1" }
        },
        { 
            id: "reg-3", 
            parentName: "Marcos Vinicius", 
            studentName: "Matheus Vinicius", 
            email: "marcos@email.com", 
            phone: "11944443333", 
            schoolId: "school-2", 
            status: "pending_approval", 
            createdAt: getRecentDay(2),
            serviceModality: 'so_ida',
            address: { zipCode: "06320-290", street: "Av. Inocêncio Seráfico", number: "200", city: "Carapicuíba", state: "SP" }
        }
    ],
    messages: [
        { id: "msg-1", senderId: "user-pai-1", recipientId: "user-admin-1", text: "Olá Jonatas! Gostaria de saber se a fatura de Março já está disponível.", timestamp: getRecentTime(48) },
        { id: "msg-2", senderId: "user-admin-1", recipientId: "user-pai-1", text: "Olá Ana! Sim, acabei de gerar. Você pode ver no seu painel financeiro.", timestamp: getRecentTime(47) },
        { id: "msg-3", senderId: "user-motorista-4", recipientId: "user-admin-1", text: "Van 01 pronta. Vou iniciar a rota 01 agora.", timestamp: getRecentTime(2) },
        { id: "msg-4", senderId: "user-admin-1", recipientId: "user-motorista-4", text: "Ok Juliano, boa viagem. Atenção ao trânsito na Av. Paulista.", timestamp: getRecentTime(1.5) },
    ],
    announcements: [
        { id: "ann-1", title: "Manutenção da Van BRA2E19", content: "Aviso: A Van 01 passará por revisão preventiva nesta quarta-feira.", priority: "high", target: "all", createdAt: new Date().toISOString() },
    ],
    incidents: [
        { id: "log-1", category: "Backup de Telemetria", description: "Sincronização de dados de GPS concluída com sucesso.", severity: "Baixa", reporter: "Guardian System", timestamp: getRecentTime(12), location: { lat: -23.55, lng: -46.63 } },
        { id: "log-2", category: "Manutenção Preditiva", description: "Veículo Mercedes Sprinter (BRA2E19) atingiu o limite de km. Agendamento sugerido.", severity: "Média", reporter: "Guardian Intelligence", timestamp: getRecentTime(5), location: { lat: -23.55, lng: -46.63 } },
        { id: "log-3", category: "Sincronização GPS", description: "Telemetria da Rota 01 ativa e transmitindo para os pais.", severity: "Baixa", reporter: "Guardian System", timestamp: getRecentTime(1), location: { lat: -23.55, lng: -46.63 } },
    ],
    contract_templates: [
        { 
            id: "template-1", 
            name: "Contrato Padrão Guardian", 
            content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO {{ano_letivo}}

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATADA: {{empresa_nome}}, CNPJ: {{empresa_cnpj}}, com dados de recebimento {{pagamento_info}}.

CONTRATANTE: {{responsavel_nome}}, portador(a) do CPF {{responsavel_cpf}}, residente em {{aluno_endereco}}, responsável legal pelo aluno(a) {{aluno_nome}}.

CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de transporte escolar diário do referido aluno no trajeto residência/escola/residência para a instituição {{escola_nome}}.

CLÁUSULA SEGUNDA - DO VALOR E PAGAMENTO: Pelos serviços prestados, o CONTRANTE pagará à CONTRATADA o valor mensal de {{valor_mensalidade}}, com vencimento impreterivelmente todo dia {{dia_vencimento}} de cada mês.

CLÁUSULA TERCEIRA - DOS HORÁRIOS: O transporte será realizado no turno da {{turno}}. O aluno deverá estar pronto no local de embarque no horário estipulado pela contratada, sob pena de seguir viagem para não atrasar os demais passageiros.

CLÁUSULA QUARTA - DAS RESPONSABILIDADES: É dever do contratante informar ausências com antecedência via aplicativo Guardian. A contratada compromete-se a manter o veículo em perfeitas condições de segurança e higiene.

CLÁUSULA QUINTA - VIGÊNCIA E RESCISÃO: Este contrato tem validade durante o ano letivo de {{ano_letivo}}. Em caso de rescisão antecipada, a parte interessada deverá comunicar por escrito com 30 dias de antecedência.

As partes aceitam os termos de forma digital através da plataforma Guardian em {{data_geracao}}.`, 
            createdAt: new Date().toISOString() 
        }
    ],
    contracts: [],
    authorized_pickups: [],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-2", text: "O aluno já embarcou com segurança.", for: "monitor" },
        { id: "pm-3", text: "Vou verificar o contrato e respondo em breve.", for: "parent" },
        { id: "pm-4", text: "Sua fatura do mês já está disponível.", for: "gestor" }
    ],
};
