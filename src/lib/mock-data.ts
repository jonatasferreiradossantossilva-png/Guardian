
// @ts-nocheck
/**
 * @fileOverview Dados iniciais blindados para o protótipo do Guardian.
 * Base de conhecimento expandida para demonstrar o Big Data de escolas.
 */

const now = new Date();
const getPastDate = (monthsAgo, day = 10) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
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
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 101", medicalConditions: ["Alergia"], medicalNote: "ALERGIA GRAVE A GLÚTEN E LACTOSE." },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5585, longitude: -46.6605, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 202", medicalConditions: ["Respiratório"], medicalNote: "Possui bronquite asmática. Bombinha na mochila." },
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
        { id: "inv-init-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: getPastDate(0), status: 'paid' },
    ],
    expenses: [],
    trip_history: [],
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
    trip_requests: [],
    pending_registrations: [],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-2", text: "O aluno já embarcou com segurança.", for: "monitor" },
        { id: "pm-3", text: "Vou verificar o contrato e respondo em breve.", for: "parent" },
        { id: "pm-4", text: "Sua fatura do mês já está disponível.", for: "gestor" }
    ],
};
