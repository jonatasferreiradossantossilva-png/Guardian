
// @ts-nocheck
/**
 * @fileOverview Dados iniciais blindados para o protótipo do Guardian.
 * Configurado com turnos Manhã, Tarde e Integral para simulação de cenários complexos.
 * Inclui histórico de 6 meses de faturas e despesas para análise de BI.
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
        },
        {
            id: "school-marjore",
            name: "Colégio Marjore Paula",
            cnpj: "99.888.777/0001-66",
            active: true,
            latitude: -23.5600,
            longitude: -46.6500,
            street: "Av. Rebouças",
            number: "500",
            neighborhood: "Pinheiros",
            city: "São Paulo",
            state: "SP",
            zipCode: "05401-000"
        }
    ],
    school_knowledge_base: [
        { id: "kb-1", name: "Colégio Amos", city: "Carapicuíba", state: "SP", street: "Av. Inocêncio Seráfico", number: "2000", neighborhood: "Centro", zipCode: "06320-290", latitude: -23.5234, longitude: -46.8345 },
        { id: "kb-2", name: "Colégio Albert Einstein", city: "Carapicuíba", state: "SP", street: "Rua Rui Barbosa", number: "150", neighborhood: "Vila Dirce", zipCode: "06333-000", latitude: -23.5345, longitude: -46.8456 },
        { id: "kb-3", name: "E.E. Maria de Lourdes Teixeira", city: "Carapicuíba", state: "SP", street: "Av. Brasil", number: "500", neighborhood: "Cohab", zipCode: "06325-000", latitude: -23.5456, longitude: -46.8567 },
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", active: true },
        { id: "parent-2", userId: "user-gen-2", name: "Carlos Magno", email: "carlos@email.com", phone: "11911112222", active: true },
        { id: "parent-3", userId: "user-gen-3", name: "Carla Dias", email: "carla@email.com", phone: "11933334444", active: true },
    ],
    students: [
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 101", medicalConditions: ["Alergia"], medicalNote: "ALERGIA GRAVE A GLÚTEN E LACTOSE." },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5585, longitude: -46.6605, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 202", medicalConditions: ["Respiratório"], medicalNote: "Possui bronquite asmática. Bombinha na mochila." },
        { id: "student-3", name: "Beatriz Costa", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5650, longitude: -46.6520, street: "Av. Paulista", number: "1000", city: "São Paulo", state: "SP", monthlyFee: 420, preferredPaymentDay: 5, serie: "1º Ano", turma: "Sala 303" },
        { id: "student-4", name: "Lucas Melo", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5610, longitude: -46.6610, street: "Rua Haddock Lobo", number: "200", city: "São Paulo", state: "SP", monthlyFee: 420, preferredPaymentDay: 5, serie: "2º Ano", turma: "Sala 104" },
        { id: "student-5", name: "Mariana Lima", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5620, longitude: -46.6620, street: "Rua Bela Cintra", number: "300", city: "São Paulo", state: "SP", monthlyFee: 420, preferredPaymentDay: 5, serie: "4º Ano", turma: "Sala 205" },
        { id: "student-9", name: "Gustavo Alencar", schoolId: "school-1", parentId: "parent-2", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5655, longitude: -46.6655, street: "Rua Pamplona", number: "600", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "9º Ano", turma: "Sala 509" },
        { id: "student-13", name: "Felipe Azevedo", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5690, longitude: -46.6690, street: "Rua Chile", number: "100", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "Maternal", turma: "Sala 01" },
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
            studentIds: ["school-1", "student-1", "student-2", "student-3", "student-4", "student-5", "student-13"],
            lastOptimizedAt: new Date().toISOString()
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    invoices: [
        // MARÇO
        { id: "inv-mar-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Março", amount: 450, dueDate: getPastDate(5), status: 'paid' },
        { id: "inv-mar-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Março", amount: 420, dueDate: getPastDate(5, 5), status: 'paid' },
        // ABRIL
        { id: "inv-abr-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Abril", amount: 450, dueDate: getPastDate(4), status: 'paid' },
        { id: "inv-abr-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Abril", amount: 420, dueDate: getPastDate(4, 5), status: 'paid' },
        // MAIO
        { id: "inv-mai-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Maio", amount: 450, dueDate: getPastDate(3), status: 'paid' },
        { id: "inv-mai-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Maio", amount: 420, dueDate: getPastDate(3, 5), status: 'paid' },
        // JUNHO
        { id: "inv-jun-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Junho", amount: 450, dueDate: getPastDate(2), status: 'paid' },
        { id: "inv-jun-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Junho", amount: 420, dueDate: getPastDate(2, 5), status: 'paid' },
        // JULHO
        { id: "inv-jul-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Julho", amount: 450, dueDate: getPastDate(1), status: 'paid' },
        { id: "inv-jul-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Julho", amount: 420, dueDate: getPastDate(1, 5), status: 'paid' },
        // AGOSTO (ATUAL)
        { id: "inv-ago-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: getPastDate(0), status: 'paid' },
        { id: "inv-ago-2", studentId: "student-3", parentUserId: "user-gen-2", description: "Mensalidade Agosto", amount: 420, dueDate: getPastDate(0, 5), status: 'pending' },
        { id: "inv-ago-3", studentId: "student-13", parentUserId: "user-gen-3", description: "Mensalidade Agosto", amount: 650, dueDate: getPastDate(0), status: 'overdue' },
    ],
    expenses: [
        { id: "exp-1", description: "Combustível Semanal", amount: 850.00, date: getPastDate(0, 5), category: "Combustível" },
        { id: "exp-2", description: "Troca de Óleo Van 01", amount: 450.00, date: getPastDate(0, 12), category: "Manutenção" },
        { id: "exp-3", description: "Salário Monitora Fernanda", amount: 1800.00, date: getPastDate(0, 5), category: "Salários" },
        { id: "exp-4", description: "Combustível Julho", amount: 3200.00, date: getPastDate(1, 28), category: "Combustível" },
        { id: "exp-5", description: "Seguro Frota", amount: 1200.00, date: getPastDate(2, 10), category: "Outros" },
    ],
    trip_history: [
        { id: "trip-1", date: getPastDate(0, 1), driverName: "Juliano Castro", plannedKm: 45.2, actualKm: 38.5, savingsKm: 6.7, fuelSaved: 32.50 },
        { id: "trip-2", date: getPastDate(0, 2), driverName: "Juliano Castro", plannedKm: 42.0, actualKm: 36.8, savingsKm: 5.2, fuelSaved: 25.10 },
        { id: "trip-3", date: getPastDate(0, 3), driverName: "Juliano Castro", plannedKm: 48.5, actualKm: 41.2, savingsKm: 7.3, fuelSaved: 35.00 },
        { id: "trip-4", date: getPastDate(0, 4), driverName: "Juliano Castro", plannedKm: 40.1, actualKm: 35.5, savingsKm: 4.6, fuelSaved: 22.50 },
        { id: "trip-5", date: getPastDate(0, 5), driverName: "Juliano Castro", plannedKm: 44.8, actualKm: 37.9, savingsKm: 6.9, fuelSaved: 33.30 },
        { id: "trip-6", date: getPastDate(0, 6), driverName: "Juliano Castro", plannedKm: 46.0, actualKm: 39.0, savingsKm: 7.0, fuelSaved: 34.00 },
        { id: "trip-7", date: getPastDate(0, 7), driverName: "Juliano Castro", plannedKm: 43.5, actualKm: 37.2, savingsKm: 6.3, fuelSaved: 30.50 },
    ],
    messages: [
        { id: "m-1", senderId: "user-admin-1", recipientId: "user-pai-1", text: "Olá Ana! O contrato de transporte do Enzo e da Valentina já está disponível para sua assinatura digital no painel.", timestamp: new Date(Date.now() - 86400000).toISOString() },
        { id: "m-2", senderId: "user-pai-1", recipientId: "user-admin-1", text: "Olá! Vou verificar e assinar ainda hoje. Obrigada pelo aviso.", timestamp: new Date(Date.now() - 86000000).toISOString() },
        { id: "m-3", senderId: "user-motorista-4", recipientId: "user-pai-1", text: "Ana, bom dia! Estou a 5 minutos da sua residência para buscar as crianças.", timestamp: new Date().toISOString() },
    ],
    announcements: [
        { id: "ann-1", title: "Manutenção da Van BRA2E19", content: "Aviso: A Van 01 passará por revisão preventiva nesta quarta-feira. Uma van reserva fará a rota no mesmo horário.", priority: "high", target: "all", createdAt: new Date().toISOString() },
        { id: "ann-2", title: "Recesso Escolar Julho", content: "Lembramos que o transporte estará suspenso entre os dias 15 e 30 de julho conforme calendário escolar.", priority: "medium", target: "parents", createdAt: new Date(Date.now() - 86400000).toISOString() }
    ],
    incidents: [
        { id: "inc-init-1", category: "Início de Operação", description: "Frota matinal iniciou atividades. 1 veículo em rota.", severity: "Baixa", reporter: "Sistema", timestamp: new Date().toISOString() }
    ],
    contract_templates: [
        { 
            id: "template-1", 
            name: "Contrato Padrão - Guardian", 
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO {{ano_letivo}}\n\nPelo presente instrumento particular, de um lado:\nCONTRATADO: {{banco}}, Agência {{agencia}}, Conta {{conta}} ou através da Chave Pix: {{chave_pix}}.\nCONTRATANTE: {{responsavel_nome}}, portador(a) do CPF {{responsavel_cpf}}, responsável pelo aluno(a) {{aluno_nome}}.\n\nAs partes acima identificadas têm, entre si, justo e acertado o presente Contrato...", 
            createdAt: new Date().toISOString() 
        }
    ],
    contracts: [],
    authorized_pickups: [],
    trip_requests: [],
    pending_registrations: [],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-2", text: "A van está chegando na escola.", for: "driver" },
        { id: "pm-3", text: "O aluno já embarcou com segurança.", for: "monitor" },
        { id: "pm-4", text: "Por favor, sua fatura deste mês está disponível no painel.", for: "gestor" }
    ],
};
