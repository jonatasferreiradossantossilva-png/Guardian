/**
 * @fileOverview Dados iniciais enriquecidos (Parte 3: Histórico e Comunicação).
 * Contém volume real de faturamento, telemetria, alunos, triagem, logs e mensagens.
 */
import { MockDB } from '@/types/mock-data'

const now = new Date();

// Auxiliares para datas
const getPastDate = (monthsAgo: number, day = 10) => {
    const d = new Date(now.getFullYear(), now.getMonth() - monthsAgo, day);
    return d.toISOString().split('T')[0];
};

const getRecentDay = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
};

const getRecentTime = (hoursAgo: number) => {
    const d = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
    return d.toISOString();
};

// Gerador de Histórico de Faturamento (24 meses)
const generateInvoices = () => {
    const invoices: any[] = [];
    const studentList = [
        { id: "student-1", name: "Enzo Pereira", parentUserId: "val-pai" },
        { id: "student-2", name: "Valentina Pereira", parentUserId: "val-pai" },
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

// Gerador de Histórico de Viagens (Avançado - Auditoria Nível Uber)
const generateTripHistory = () => {
    const history = [];
    const drivers = [
        { id: "driver-1", name: "Juliano Castro" }, 
        { id: "driver-2", name: "Marcos Viana" }
    ];
    
    // Alunos fixos para simular a carga da van em dias ados
    const routeStops = [
        "school-1", "student-1", "student-2", "student-5", "school-2", "student-4"
    ];
    
    for (let i = 1; i <= 30; i++) {
        const d = drivers[i % drivers.length];
        const plannedKm = 10 + Math.random() * 5;
        const actualKm = plannedKm - (0.5 + Math.random() * 2);
        
        // Simular o timestamp do dia
        const dateStr = getRecentDay(i);
        const startTime = new Date(`${dateStr}T06:30:00Z`).toISOString();
        const endTime = new Date(`${dateStr}T07:45:00Z`).toISOString();

        // Gerar log desidratado (apenas strings compactadas para não onerar banco)
        // Formato: "id|status|timestamp"
        const compactLog = routeStops.map((stopId, idx) => {
            const totalMinutes = 30 + (idx * 10);
            const h = 6 + Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            const time = new Date(`${dateStr}T0${h}:${m.toString().padStart(2, '0')}:00Z`).toISOString();
            const status = stopId.includes('school') ? 'desembarcado' : 'a_bordo';
            return `${stopId}|${status}|${time}`;
        });

        // Simular 10% de chance de alguém ter faltado no dia ado
        if (Math.random() > 0.9) {
            compactLog[1] = `student-1|ausente_ida|${new Date(`${dateStr}T06:40:00Z`).toISOString()}`;
        }

        history.push({
            id: `trip-hist-${i}`,
            date: dateStr,
            driverId: d.id,
            driverName: d.name,
            shift: i % 2 === 0 ? 'Manhã' : 'Tarde',
            plannedKm: Number(plannedKm.toFixed(1)),
            actualKm: Number(actualKm.toFixed(1)),
            savingsKm: Number((plannedKm - actualKm).toFixed(1)),
            startTime,
            endTime,
            eventsLog: compactLog, // O Log Arquivado 
            status: "completed"
        });
    }
    return history;
};

export const initialMockData: MockDB = {
    config: [
        { id: "global", scaling_mode: true } 
    ],
    telemetry: [
        { 
            id: "global-usage", 
            googleMapLoads: 0, 
            currentMonth: new Date().toISOString().substring(0, 7), 
            usageThreshold: 25000 
        }
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
        { id: "user-admin-1", name: "Jonatas Gestor", email: "admin@guardian.com", cpf: "111.111.111-11", pin: "123456", profile: 'gestor' as const, active: true },
        { id: "user-motorista-4", name: "Juliano Castro", email: "juliano.castro@rotasegura.com", cpf: "222.222.222-22", pin: "111111", profile: 'motorista' as const, active: true },
        { id: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", cpf: "333.333.333-33", pin: "000000", profile: 'pai' as const, active: true },
        { id: "user-pai-2", name: "Carlos Silva", email: "carlos.silva@email.com", cpf: "444.444.444-44", pin: "000000", profile: 'pai' as const, active: true },
        { id: "user-pai-3", name: "Beatriz Souza", email: "beatriz.souza@email.com", cpf: "555.555.555-55", pin: "000000", profile: 'pai' as const, active: true },
        { id: "user-monitor-1", name: "Fernanda Lima", email: "fernanda.lima@rotasegura.com", cpf: "123.456.789-00", pin: "123123", profile: 'monitor' as const, active: true },
        // --- CONTAS DE VALIDAÇÃO (CPF/PIN SIMPLIFICADO) ---
        { id: "val-gestor", name: "Validador Gestor", email: "val.gestor@guardian.com", cpf: "000.000.000-01", pin: "1234", profile: 'gestor' as const, active: true },
        { id: "val-motorista", name: "Validador Motorista", email: "val.motorista@guardian.com", cpf: "000.000.000-02", pin: "1234", profile: 'motorista' as const, active: true },
        { id: "val-pai", name: "Validador Responsável", email: "val.pai@guardian.com", cpf: "000.000.000-03", pin: "1234", profile: 'pai' as const, active: true },
        { id: "val-monitor", name: "Validador Monitor", email: "val.monitor@guardian.com", cpf: "000.000.000-04", pin: "1234", profile: 'monitor' as const, active: true },
        { id: "val-autonomo", name: "Guardian Autônomo", email: "autonomo@guardian.com", cpf: "000.000.000-05", pin: "1234", profile: 'gestor' as const, active: true },
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
        },
        {
            id: "school-3",
            name: "Colégio Amos",
            cnpj: "11.222.333/0001-44",
            active: true,
            latitude: -23.5234,
            longitude: -46.8345,
            street: "Av. Inocêncio Seráfico",
            number: "2000",
            neighborhood: "Centro",
            city: "Carapicuíba",
            state: "SP",
            zipCode: "06320-290"
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
        { id: "parent-val", userId: "val-pai", name: "Validador Responsável", email: "val.pai@guardian.com", phone: "11999998888", active: true },
    ],
    students: [
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-val", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 101", medicalConditions: ["Alergia"], medicalNote: "ALERGIA GRAVE A GLÚTEN E LACTOSE.", serviceModality: 'completo' as const },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-val", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5585, longitude: -46.6605, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 202", medicalConditions: ["Respiratório"], medicalNote: "Possui bronquite asmática. Bombinha na mochila.", serviceModality: 'completo' as const },
        { id: "student-3", name: "Bernardo Silva", schoolId: "school-2", parentId: "parent-2", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5234, longitude: -46.8345, street: "Av. Inocêncio Seráfico", number: "50", city: "Carapicuíba", state: "SP", monthlyFee: 300, preferredPaymentDay: 5, serie: "1º Ano Médio", serviceModality: 'so_ida' as const },
        { id: "student-4", name: "Alice Souza", schoolId: "school-2", parentId: "parent-3", shift: "Tarde" as const, status: "aguardando" as const, active: true, latitude: -23.5345, longitude: -46.8456, street: "Rua Rui Barbosa", number: "200", city: "Carapicuíba", state: "SP", monthlyFee: 320, preferredPaymentDay: 15, serie: "7º Ano", medicalConditions: ["Diabetes"], medicalNote: "Uso de insulina após o almoço.", serviceModality: 'so_volta' as const },
        { id: "student-5", name: "Pedro Santos", schoolId: "school-1", parentId: "parent-2", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5500, longitude: -46.6400, street: "Rua Augusta", number: "500", city: "São Paulo", state: "SP", monthlyFee: 480, medicalConditions: ["Mobilidade"], medicalNote: "Cadeira de rodas. Necessita auxílio no embarque.", serviceModality: 'completo' as const },
        { id: "student-6", name: "Lucas Fernandes", schoolId: "school-1", parentId: "parent-1", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5600, longitude: -46.6500, street: "Av. Paulista", number: "1500", city: "São Paulo", state: "SP", monthlyFee: 450, serviceModality: 'completo' as const, serie: "4º Ano" },
        { id: "student-7", name: "Sofia Almeida", schoolId: "school-2", parentId: "parent-2", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5400, longitude: -46.8500, street: "Av. Brasil", number: "100", city: "Carapicuíba", state: "SP", monthlyFee: 300, serviceModality: 'completo' as const, serie: "8º Ano" },
        { id: "student-8", name: "Miguel Costa", schoolId: "school-1", parentId: "parent-3", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5550, longitude: -46.6550, street: "Rua Haddock Lobo", number: "300", city: "São Paulo", state: "SP", monthlyFee: 450, serviceModality: 'completo' as const, serie: "1º Ano" },
        { id: "student-9", name: "Arthur Rodrigues", schoolId: "school-2", parentId: "parent-1", shift: "Integral" as const, status: "aguardando" as const, active: true, latitude: -23.5300, longitude: -46.8400, street: "Rua do Bosque", number: "50", city: "Carapicuíba", state: "SP", monthlyFee: 500, serviceModality: 'completo' as const, serie: "9º Ano" },
        { id: "student-10", name: "Laura Martins", schoolId: "school-1", parentId: "parent-3", shift: "Manhã" as const, status: "aguardando" as const, active: true, latitude: -23.5650, longitude: -46.6650, street: "Rua Frei Caneca", number: "800", city: "São Paulo", state: "SP", monthlyFee: 450, serviceModality: 'avulso' as const, serie: "2º Ano" },
        { id: "student-11", name: "Helena Oliveira", schoolId: "school-1", parentId: "parent-1", shift: "Tarde" as const, status: "aguardando" as const, active: true, latitude: -23.5590, longitude: -46.6610, street: "Rua Oscar Freire", number: "200", city: "São Paulo", state: "SP", monthlyFee: 400, serviceModality: 'completo' as const, serie: "6º Ano" },
        { id: "student-12", name: "Theo Barbosa", schoolId: "school-1", parentId: "parent-2", shift: "Tarde" as const, status: "aguardando" as const, active: true, latitude: -23.5520, longitude: -46.6530, street: "Rua da Consolação", number: "350", city: "São Paulo", state: "SP", monthlyFee: 420, serviceModality: 'completo' as const, serie: "4º Ano" },
        { id: "student-13", name: "Marina Santos", schoolId: "school-1", parentId: "parent-3", shift: "Tarde" as const, status: "aguardando" as const, active: true, latitude: -23.5610, longitude: -46.6580, street: "Alameda Santos", number: "700", city: "São Paulo", state: "SP", monthlyFee: 380, serviceModality: 'completo' as const, serie: "3º Ano" },
        { 
            id: "student-pending-demo", 
            name: "Calebe Silva (Novo)", 
            schoolId: "school-1", 
            parentId: "parent-temp-demo", 
            shift: "Manhã" as const, 
            status: "aguardando_aprovacao" as const, 
            active: false, 
            latitude: -23.5500, 
            longitude: -46.6333, 
            addressDescription: "Rua das Flores, 450 - Centro", 
            pendingRouteId: "route-val-1", 
            parentName: "Marcos Silva", 
            parentPhone: "11988887777", 
            serviceModality: 'completo' as const, 
            createdAt: new Date().toISOString(),
            requestedSchool: "Escola Primária do Saber"
        }
    ],
    drivers: [
        { id: "driver-1", userId: "user-motorista-4", name: "Juliano Castro", status: "inativo" as const, vehicleId: "vehicle-1", active: true, latitude: -23.5500, longitude: -46.6300 },
        { id: "val-driver", userId: "val-motorista", name: "Validador Motorista", status: "inativo" as const, vehicleId: "vehicle-1", active: true, latitude: -23.5500, longitude: -46.6300 },
        { id: "driver-autonomo", userId: "val-autonomo", name: "Guardian Autônomo", status: "inativo" as const, vehicleId: "vehicle-1", active: true, latitude: -23.5500, longitude: -46.6300 }
    ],
    monitors: [
        { id: "monitor-1", userId: "user-monitor-1", name: "Fernanda Lima", email: "fernanda.lima@rotasegura.com", phone: "11988887777", cpf: "123.456.789-00", rg: "12.345.678-9", active: true },
        { id: "val-monitor-profile", userId: "val-monitor", name: "Validador Monitor", active: true }
    ],
    vehicles: [
        { id: "vehicle-1", model: "Mercedes Sprinter", licensePlate: "BRA2E19", capacity: 20, active: true, currentOdometer: 45200, lastMaintenanceOdometer: 40000, maintenanceInterval: 10000 }
    ],
    routes: [
        {
            id: "route-1",
            name: "Rota 01 - Manhã",
            driverId: "driver-1",
            monitorId: "monitor-1",
            shift: "Manhã" as const,
            studentIds: ["student-1", "student-2", "student-5", "student-3", "student-6", "student-7", "student-8", "student-9", "student-10"],
            lastOptimizedAt: new Date().toISOString(),
            lastResetDate: new Date().toISOString().split('T')[0],
            journeyStatus: 'em_rota' as const,
            polyline: JSON.stringify({
                type: "LineString",
                coordinates: [
                    [-46.6600, -23.5580], // Enzo
                    [-46.6605, -23.5585], // Valentina
                    [-46.6500, -23.5550],
                    [-46.6400, -23.5520],
                    [-46.6333, -23.5505]  // Escola 1
                ]
            })
        },
        {
            id: "route-2",
            name: "Rota Expresso (Modo Solo)",
            driverId: "driver-1",
            monitorId: "",
            shift: "Tarde" as const,
            studentIds: ["school-2", "student-4"],
            lastOptimizedAt: new Date().toISOString(),
            lastResetDate: new Date().toISOString().split('T')[0],
            journeyStatus: 'pendente' as const
        },
        {
            id: "route-piloto-multiescolas",
            name: "Rota 03 - Multiescolas (Piloto)",
            driverId: "driver-1",
            monitorId: "monitor-1",
            shift: "Manhã" as const,
            studentIds: ["student-1", "student-2", "student-3", "student-7", "student-9"],
            lastOptimizedAt: new Date().toISOString(),
            lastResetDate: new Date().toISOString().split('T')[0],
            journeyStatus: 'unregistered' as any // Just to trigger a different state or testing
        },
        {
            id: "route-sim-concluida",
            name: "Simulação: Retorno Escolar",
            driverId: "driver-1",
            monitorId: "monitor-1",
            shift: "Manhã" as const,
            studentIds: ["student-1", "student-2", "student-3"],
            lastOptimizedAt: new Date().toISOString(),
            lastResetDate: new Date().toISOString().split('T')[0],
            journeyStatus: 'concluida' as const
        },
        {
            id: "route-val-1",
            name: "Rota de Validação (Múltiplas Escolas)",
            driverId: "val-driver",
            monitorId: "val-monitor-profile",
            shift: "Manhã" as const,
            studentIds: ["student-1", "student-2", "student-5", "student-9"],
            lastOptimizedAt: new Date().toISOString(),
            lastResetDate: new Date().toISOString().split('T')[0],
            journeyStatus: 'em_rota' as const,
            polyline: JSON.stringify({
                type: "LineString",
                coordinates: [
                    [-46.6600, -23.5580], // Enzo
                    [-46.6605, -23.5585], // Valentina
                    [-46.6500, -23.5550],
                    [-46.6400, -23.5520],
                    [-46.6333, -23.5505]  // Escola 1
                ]
            })
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    } as Record<string, any>,
    notifications: [
        { 
            id: "notif-1", 
            userId: "user-monitor-1", 
            title: "Sistema Ativo", 
            message: "O Guardian está monitorando suas rotas.", 
            type: "success", 
            read: false, 
            createdAt: new Date().toISOString() 
        }
    ],
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
        { id: "tr-1", studentId: "student-1", parentUserId: "user-pai-1", schoolId: "school-1", startDate: getRecentDay(-2), endDate: getRecentDay(-2), type: "ida_e_volta", shift: "manha", status: "pendente", reason: "Evento extra de robótica na escola.", createdAt: getRecentDay(1) },
        { id: "tr-2", studentId: "student-2", parentUserId: "user-pai-1", schoolId: "school-1", startDate: getRecentDay(-1), endDate: getRecentDay(-1), type: "ida", shift: "tarde", status: "aguardando_aprovacao_pai", amount: 45.00, reason: "Reposição de aula.", createdAt: getRecentDay(2) },
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
        { id: "msg-2.1", senderId: "user-pai-1", recipientId: "user-admin-1", text: "Obrigada! Vou efetuar o pagamento via Pix agora mesmo.", timestamp: getRecentTime(46.5) },
        { id: "msg-2.2", senderId: "user-admin-1", recipientId: "user-pai-1", text: "Perfeito, qualquer dúvida estou à disposição.", timestamp: getRecentTime(46) },
        { id: "msg-3", senderId: "user-motorista-4", recipientId: "user-admin-1", text: "Van 01 pronta. Vou iniciar a rota 01 agora.", timestamp: getRecentTime(2) },
        { id: "msg-4", senderId: "user-admin-1", recipientId: "user-motorista-4", text: "Ok Juliano, boa viagem. Atenção ao trânsito na Av. Paulista.", timestamp: getRecentTime(1.5) },
        { id: "msg-5", senderId: "user-monitor-1", recipientId: "user-motorista-4", text: "Juliano, estou chegando no ponto da Valentina. Ela já está aguardando?", timestamp: getRecentTime(0.5) },
        { id: "msg-6", senderId: "user-motorista-4", recipientId: "user-monitor-1", text: "Sim, acabei de avistar ela. Pode preparar o embarque.", timestamp: getRecentTime(0.4) },
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
    contracts: [
        {
            id: "contract-test-1",
            templateId: "template-1",
            studentId: "student-1",
            parentUserId: "val-pai",
            serviceModality: "completo",
            status: "pending_acceptance",
            createdAt: new Date().toISOString(),
            generatedContent: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO 2026

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATADA: Guardian Transporte Escolar Ltda, CNPJ: 12.345.678/0001-90, com dados de recebimento via: Banco Itaú, Agência 0300, Conta 45678-9 ou através da Chave Pix: 12.345.678/0001-90.

CONTRATANTE: Ana Pereira, portador(a) do CPF 123.456.789-00, residente em Rua das Acácias, 10 - Centro, responsável legal pelo aluno(a) Enzo Pereira.

CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de transporte escolar diário do referido aluno no trajeto residência/escola/residência para a instituição Escola Primária do Saber.

CLÁUSULA SEGUNDA - DO VALOR E PAGAMENTO: Pelos serviços prestados, o CONTRANTE pagará à CONTRATADA o valor mensal de R$ 450,00, com vencimento impreterivelmente todo dia 10 de cada mês.

CLÁUSULA TERCEIRA - DOS HORÁRIOS: O transporte será realizado no turno da Manhã. O aluno deverá estar pronto no local de embarque no horário estipulado pela contratada, sob pena de seguir viagem para não atrasar os demais passageiros.

CLÁUSULA QUARTA - DAS RESPONSABILIDADES: É dever do contratante informar ausências com antecedência via aplicativo Guardian. A contratada compromete-se a manter o veículo em perfeitas condições de segurança e higiene.

CLÁUSULA QUINTA - VIGÊNCIA E RESCISÃO: Este contrato tem validade durante o ano letivo de 2026. Em caso de rescisão antecipada, a parte interessada deverá comunicar por escrito com 30 dias de antecedência.

As partes aceitam os termos de forma digital através da plataforma Guardian em 06 de Abril de 2026.`
        },
        {
            id: "contract-test-2",
            templateId: "template-1",
            studentId: "student-2",
            parentUserId: "val-pai",
            serviceModality: "completo",
            status: "accepted",
            createdAt: new Date().toISOString(),
            generatedContent: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO 2026

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATADA: Guardian Transporte Escolar Ltda, CNPJ: 12.345.678/0001-90, com dados de recebimento via: Banco Itaú, Agência 0300, Conta 45678-9 ou através da Chave Pix: 12.345.678/0001-90.

CONTRATANTE: Validador Responsável, portador(a) do CPF 000.000.000-03, residente em Rua das Acácias, 10 - Centro, responsável legal pelo aluno(a) Valentina Pereira.

CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de transporte escolar diário do referido aluno no trajeto residência/escola/residência para a instituição Escola Primária do Saber.

CLÁUSULA SEGUNDA - DO VALOR E PAGAMENTO: Pelos serviços prestados, o CONTRANTE pagará à CONTRATADA o valor mensal de R$ 450,00, com vencimento impreterivelmente todo dia 10 de cada mês.

As partes aceitam os termos de forma digital através da plataforma Guardian em 10 de Fevereiro de 2026.`
        }
    ],
    authorized_pickups: [
        {
            id: "ap-1",
            studentId: "student-1",
            parentUserId: "user-pai-1",
            name: "Maria Helena Pereira",
            cpf: "987.654.321-00",
            phone: "(11) 99876-5432",
            relationship: "Avó materna",
            photoUrl: "https://picsum.photos/seed/avo-maria/200/200"
        },
        {
            id: "ap-2",
            studentId: "student-1",
            parentUserId: "user-pai-1",
            name: "Roberto Pereira",
            cpf: "123.789.456-00",
            phone: "(11) 98765-1234",
            relationship: "Tio",
            photoUrl: "https://picsum.photos/seed/tio-roberto/200/200"
        },
        {
            id: "ap-3",
            studentId: "student-2",
            parentUserId: "user-pai-1",
            name: "Maria Helena Pereira",
            cpf: "987.654.321-00",
            phone: "(11) 99876-5432",
            relationship: "Avó materna",
            photoUrl: "https://picsum.photos/seed/avo-maria/200/200"
        },
        {
            id: "ap-4",
            studentId: "student-5",
            parentUserId: "user-pai-2",
            name: "Fernanda Santos Silva",
            cpf: "456.123.789-00",
            phone: "(11) 97654-3210",
            relationship: "Madrinha",
            photoUrl: "https://picsum.photos/seed/madrinha-fer/200/200"
        },
        {
            id: "ap-5",
            studentId: "student-4",
            parentUserId: "user-pai-3",
            name: "João Carlos Souza",
            cpf: "321.654.987-00",
            phone: "(11) 96543-2109",
            relationship: "Avô paterno",
            photoUrl: "https://picsum.photos/seed/avo-joao/200/200"
        },
    ],
    predefined_messages: [
        // PARA MOTORISTAS
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-d2", text: "Estou parado no trânsito (Atraso 10m).", for: "driver" },
        { id: "pm-d3", text: "Rota finalizada com sucesso.", for: "driver" },
        { id: "pm-d4", text: "Problema com o pneu, aguardando suporte.", for: "driver" },
        { id: "pm-d5", text: "Já cheguei na escola.", for: "driver" },
        { id: "pm-d6", text: "Pode descer, já estou na porta.", for: "driver" },
        
        // PARA MONITORES
        { id: "pm-2", text: "O aluno já embarcou com segurança.", for: "monitor" },
        { id: "pm-m2", text: "Aluno ausente no local de embarque.", for: "monitor" },
        { id: "pm-m3", text: "Aguardando responsável para entrega.", for: "monitor" },
        { id: "pm-m4", text: "Aluno entregue na escola/residência.", for: "monitor" },
        { id: "pm-m5", text: "Esqueceu o material/mochila no carro.", for: "monitor" },
        
        // PARA PAIS
        { id: "pm-3", text: "Vou verificar o contrato e respondo em breve.", for: "parent" },
        { id: "pm-p2", text: "Anexei o comprovante de pagamento.", for: "parent" },
        { id: "pm-p3", text: "O aluno não irá hoje (Aviso de falta).", for: "parent" },
        { id: "pm-p4", text: "Pode deixar ele na casa da avó hoje?", for: "parent" },
        { id: "pm-p5", text: "Estou descendo com ele agora.", for: "parent" },
        { id: "pm-p6", text: "Obrigado(a) pelo cuidado!", for: "parent" },
        
        // PARA GESTORES
        { id: "pm-4", text: "Sua fatura do mês já está disponível.", for: "gestor" },
        { id: "pm-g2", text: "Seu cadastro foi aprovado com sucesso!", for: "gestor" },
        { id: "pm-g3", text: "Favor atualizar seu endereço no perfil.", for: "gestor" },
        { id: "pm-g4", text: "A manutenção da van foi concluída.", for: "gestor" },
        { id: "pm-g5", text: "Entendido, nossa equipe já está ciente.", for: "gestor" },
        { id: "pm-g6", text: "Vou verificar com o motorista agora mesmo.", for: "gestor" }
    ]
};
