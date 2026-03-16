
// @ts-nocheck
/**
 * @fileOverview Dados iniciais blindados e enriquecidos para o protótipo do Guardian.
 * Contém dados massivos de simulação para Financeiro, Performance, Solicitações e Viagens Extras.
 */

const now = new Date();
const getPastDate = (monthsAgo, day = 10) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    return d.toISOString().split('T')[0];
};

const getRecentDay = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
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
        }
    ],
    school_knowledge_base: [
        { id: "kb-1", name: "Colégio Amos", city: "Carapicuíba", state: "SP", street: "Av. Inocêncio Seráfico", number: "2000", neighborhood: "Centro", zipCode: "06320-290", latitude: -23.5234, longitude: -46.8345 },
        { id: "kb-2", name: "Colégio Albert Einstein", city: "Carapicuíba", state: "SP", street: "Rua Rui Barbosa", number: "150", neighborhood: "Vila Dirce", zipCode: "06333-000", latitude: -23.5345, longitude: -46.8456 },
        { id: "kb-3", name: "E.E. Maria de Lourdes Teixeira", city: "Carapicuíba", state: "SP", street: "Av. Brasil", number: "500", neighborhood: "Cohab", zipCode: "06325-000", latitude: -23.5456, longitude: -46.8567 },
        { id: "kb-4", name: "Colégio Adventista de Carapicuíba", city: "Carapicuíba", state: "SP", street: "Rua Coração de Maria", number: "45", neighborhood: "Vila Cretti", zipCode: "06317-120", latitude: -23.5255, longitude: -46.8310 },
        { id: "kb-5", name: "Escola Estadual Toufic Joulian", city: "Carapicuíba", state: "SP", street: "Rua Sandra Maria", number: "100", neighborhood: "Centro", zipCode: "06320-000", latitude: -23.5210, longitude: -46.8380 },
        { id: "kb-6", name: "Colégio Objetivo Carapicuíba", city: "Carapicuíba", state: "SP", street: "Av. Deputado Emílio Carlos", number: "1200", neighborhood: "Vila Terezinha", zipCode: "06310-160", latitude: -23.5180, longitude: -46.8290 }
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", active: true },
    ],
    students: [
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 101", medicalConditions: ["Alergia"], medicalNote: "ALERGIA GRAVE A GLÚTEN E LACTOSE.", serviceModality: 'completo' },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5585, longitude: -46.6605, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 202", medicalConditions: ["Respiratório"], medicalNote: "Possui bronquite asmática. Bombinha na mochila.", serviceModality: 'completo' },
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
            studentIds: ["school-1", "student-1", "student-2"],
            lastOptimizedAt: new Date().toISOString()
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    invoices: [
        { id: "inv-init-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Novembro", amount: 450, dueDate: getPastDate(0), status: 'paid' },
        { id: "inv-init-2", studentId: "student-2", parentUserId: "user-pai-1", description: "Mensalidade Novembro", amount: 450, dueDate: getPastDate(0), status: 'paid' },
        { id: "inv-init-3", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Outubro", amount: 450, dueDate: getPastDate(1), status: 'paid' },
        { id: "inv-init-4", studentId: "student-2", parentUserId: "user-pai-1", description: "Mensalidade Outubro", amount: 450, dueDate: getPastDate(1), status: 'paid' },
        { id: "inv-init-5", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Setembro", amount: 450, dueDate: getPastDate(2), status: 'paid' },
        { id: "inv-init-6", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: getPastDate(3), status: 'overdue' },
        { id: "inv-init-7", studentId: "student-2", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: getPastDate(3), status: 'pending' },
    ],
    expenses: [
        { id: "exp-1", description: "Diesel - Posto Shell", amount: 1200.50, date: getRecentDay(2), category: "Combustível" },
        { id: "exp-2", description: "Troca de Óleo e Filtros", amount: 450.00, date: getRecentDay(15), category: "Manutenção" },
        { id: "exp-3", description: "Salário Motorista Juliano", amount: 3500.00, date: getRecentDay(5), category: "Salários" },
        { id: "exp-4", description: "Seguro Frota Anual", amount: 2800.00, date: getRecentDay(20), category: "Outros" },
        { id: "exp-5", description: "Diesel - Posto Ipiranga", amount: 850.30, date: getRecentDay(10), category: "Combustível" },
    ],
    trip_history: [
        { id: "trip-1", date: getRecentDay(1), driverName: "Juliano Castro", plannedKm: 42.5, actualKm: 38.2, savingsKm: 4.3, fuelSaved: 32.50 },
        { id: "trip-2", date: getRecentDay(2), driverName: "Juliano Castro", plannedKm: 42.5, actualKm: 39.1, savingsKm: 3.4, fuelSaved: 25.80 },
        { id: "trip-3", date: getRecentDay(3), driverName: "Juliano Castro", plannedKm: 42.5, actualKm: 37.8, savingsKm: 4.7, fuelSaved: 35.25 },
        { id: "trip-4", date: getRecentDay(4), driverName: "Juliano Castro", plannedKm: 42.5, actualKm: 40.5, savingsKm: 2.0, fuelSaved: 15.00 },
        { id: "trip-5", date: getRecentDay(5), driverName: "Juliano Castro", plannedKm: 42.5, actualKm: 38.9, savingsKm: 3.6, fuelSaved: 27.00 },
    ],
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
            serviceModality: 'completo',
            address: { zipCode: "06333-000", street: "Rua Rui Barbosa", number: "100", neighborhood: "Vila Dirce", city: "Carapicuíba", state: "SP" },
            documentData: { cpf: "987.654.321-11", rg: "98.765.432-1" }
        }
    ],
    messages: [],
    announcements: [
        { id: "ann-1", title: "Manutenção da Van BRA2E19", content: "Aviso: A Van 01 passará por revisão preventiva nesta quarta-feira.", priority: "high", target: "all", createdAt: new Date().toISOString() },
    ],
    incidents: [],
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
