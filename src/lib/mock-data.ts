// @ts-nocheck
/**
 * @fileOverview Dados iniciais para o protótipo do Guardian.
 * Centraliza todas as coleções do banco de dados para simulação offline.
 */

export const initialMockData = {
    config: [
        { id: "global", scaling_mode: false } // False: Usa Google Maps para todos. True: Usa OSM para os pais.
    ],
    users: [
        { id: "user-admin-1", name: "Admin Guardian", email: "admin@guardian.com", profile: 'gestor', active: true },
        { id: "user-motorista-2", name: "Mariana Costa", email: "mariana.costa@rotasegura.com", profile: 'motorista', active: true },
        { id: "user-motorista-3", name: "Roberto Almeida", email: "roberto.almeida@rotasegura.com", profile: 'motorista', active: true },
        { id: "user-motorista-4", name: "Juliano Castro", email: "juliano.castro@rotasegura.com", profile: 'motorista', active: true },
        { id: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", profile: 'pai', active: true },
        { id: "user-pai-2", name: "João Costa", email: "joao.costa@email.com", profile: 'pai', active: true },
        { id: "user-pai-3", name: "Carla Dias", email: "carla.dias@email.com", profile: 'pai', active: true },
        { id: "user-monitor-1", name: "Fernanda Lima", email: "fernanda.lima@rotasegura.com", profile: 'monitor', active: true },
    ],
    schools: [
        {
            id: "school-1",
            name: "Escola Primária do Saber",
            cnpj: "12.345.678/0001-99",
            type: "public",
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
            name: "Colégio Vanguarda",
            cnpj: "98.765.432/0001-11",
            type: "private",
            active: true,
            latitude: -23.5515,
            longitude: -46.6355,
            street: "Rua Augusta",
            number: "500",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01305-000"
        },
        {
            id: "school-3",
            name: "COLEGIO MARJORE PAULA",
            cnpj: "11.222.333/0001-44",
            type: "private",
            active: true,
            latitude: -23.5285,
            longitude: -46.8321,
            street: "Rua Padre Áureliano",
            number: "93",
            neighborhood: "Vila Silviania",
            city: "Carapicuíba",
            state: "SP",
            zipCode: "06321-470"
        }
    ],
    school_knowledge_base: [
        { 
            id: "skb-marjore-paula", 
            name: "COLEGIO MARJORE PAULA", 
            zipCode: "06321-470", 
            city: "Carapicuíba", 
            state: "SP", 
            latitude: -23.5285, 
            longitude: -46.8321, 
            neighborhood: "Vila Silviania", 
            street: "Rua Padre Áureliano", 
            number: "93" 
        },
        { id: "skb-c-1", name: "ADVENTISTA DE CARAPICUIBA COLEGIO", type: "private", zipCode: "06310-160", city: "Carapicuíba", state: "SP", latitude: -23.5225, longitude: -46.8355, neighborhood: "Centro" }
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", active: true },
        { id: "parent-2", userId: "user-pai-2", name: "João Costa", email: "joao.costa@email.com", phone: "11977778888", active: true },
        { id: "parent-3", userId: "user-pai-3", name: "Carla Dias", email: "carla.dias@email.com", phone: "11966665555", active: true },
        { id: "parent-4", userId: "user-pai-4", name: "Marcos Silva", email: "marcos.silva@email.com", phone: "11955554444", active: true }
    ],
    students: [
        // Rota 1 - Manhã (Centro SP)
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Academias", number: "10", city: "São Paulo", state: "SP", zipCode: "05445-010", monthlyFee: 450, preferredPaymentDay: 10 },
        { id: "student-4", name: "Valentina Pereira", schoolId: "school-2", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Academias", number: "10", city: "São Paulo", state: "SP", zipCode: "05445-010", monthlyFee: 420, preferredPaymentDay: 10 },
        { id: "student-2", name: "Beatriz Costa", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5650, longitude: -46.6520, street: "Av. Paulista", number: "1000", city: "São Paulo", state: "SP", zipCode: "01310-100", monthlyFee: 480, preferredPaymentDay: 5 },
        { id: "student-3", name: "Gabriel Dias", schoolId: "school-2", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5600, longitude: -46.6650, street: "Rua Oscar Freire", number: "50", city: "São Paulo", state: "SP", zipCode: "01426-001", monthlyFee: 500, preferredPaymentDay: 15 },
        
        // Rota 2 - Tarde (Carapicuíba) - SIMULAÇÃO CARGA ALTA
        { id: "student-5", name: "Lucas Silva", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5300, longitude: -46.8300, street: "Rua do Bosque", number: "100", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-8", name: "Felipe Mendes", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5305, longitude: -46.8305, street: "Rua das Flores", number: "12", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-9", name: "Giulia Ramos", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5315, longitude: -46.8310, street: "Rua Alvorada", number: "45", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-10", name: "Henrique Oliveira", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5320, longitude: -46.8320, street: "Rua da Paz", number: "101", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-11", name: "Isabela Martins", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5325, longitude: -46.8325, street: "Rua do Porto", number: "20", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-12", name: "João Pedro", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5330, longitude: -46.8330, street: "Rua São Jorge", number: "55", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-13", name: "Larissa Manoela", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5335, longitude: -46.8335, street: "Rua Vitória", number: "9", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-14", name: "Matheus Solano", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5340, longitude: -46.8340, street: "Rua Principal", number: "200", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-15", name: "Nicole Bahls", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5345, longitude: -46.8345, street: "Av Inocêncio", number: "500", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
        { id: "student-16", name: "Otávio Mesquita", schoolId: "school-3", parentId: "parent-4", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5350, longitude: -46.8350, street: "Rua do Sol", number: "33", neighborhood: "Vila Silviania", city: "Carapicuíba", state: "SP", zipCode: "06321-000", monthlyFee: 380, preferredPaymentDay: 10 },
    ],
    drivers: [
        { id: "driver-1", userId: "user-motorista-4", name: "Juliano Castro", status: "inativo", vehicleId: "vehicle-1", active: true, latitude: -23.5500, longitude: -46.6300 },
        { id: "driver-2", userId: "user-motorista-2", name: "Mariana Costa", status: "inativo", vehicleId: "vehicle-2", active: true }
    ],
    vehicles: [
        { id: "vehicle-1", model: "Mercedes Sprinter", licensePlate: "BRA2E19", capacity: 15, active: true, currentOdometer: 45200, lastMaintenanceOdometer: 40000, maintenanceInterval: 10000 },
        { id: "vehicle-2", model: "Renault Master", licensePlate: "KLU4J22", capacity: 20, active: true, currentOdometer: 12000, lastMaintenanceOdometer: 10000, maintenanceInterval: 10000 }
    ],
    routes: [
        {
            id: "route-1",
            name: "Rota Centro - Manhã",
            driverId: "driver-1",
            monitorId: "user-monitor-1",
            shift: "Manhã",
            studentIds: ["student-1", "student-4", "student-2", "school-1", "student-3", "school-2"],
            lastOptimizedAt: "2024-08-05T08:00:00Z",
            plannedDistanceKm: 12.5,
            polyline: ""
        },
        {
            id: "route-2",
            name: "Expresso Carapicuíba - Tarde",
            driverId: "driver-2",
            monitorId: "",
            shift: "Tarde",
            studentIds: [
                "student-5", "student-8", "student-9", "student-10", "student-11", 
                "student-12", "student-13", "student-14", "student-15", "student-16", 
                "school-3"
            ],
            lastOptimizedAt: "",
            plannedDistanceKm: 8.2,
            polyline: ""
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() },
        "driver-2": { latitude: -23.5200, longitude: -46.8300, timestamp: new Date().toISOString() }
    },
    incidents: [
        { id: "inc-1", category: "Trânsito", severity: "Média", timestamp: new Date().toISOString(), location: { lat: -23.555, lng: -46.645 }, description: "Congestionamento intenso na subida da Rua Augusta.", reporter: "Juliano Castro" }
    ],
    invoices: [
        { id: "inv-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450.00, dueDate: "2024-08-10", status: "paid" },
        { id: "inv-4", studentId: "student-4", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 420.00, dueDate: "2024-08-10", status: "pending" }
    ],
    expenses: [
        { id: "exp-1", description: "Abastecimento Sprinter", amount: 350.00, date: "2024-08-01", category: "Combustível" }
    ],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" }
    ],
    authorized_pickups: [],
    trip_requests: [],
    contract_templates: [
        { id: "tpl-1", name: "Contrato Padrão 2024", content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR\n\nCONTRATANTE: {{responsavel_nome}}.\nALUNO: {{aluno_nome}}.\nVALOR: R$ {{valor_mensalidade}}.", createdAt: new Date().toISOString() }
    ],
    contracts: [],
    pending_registrations: [],
    announcements: [],
    trip_history: [
        { date: "2024-08-01", routeName: "Rota Centro", plannedKm: 15, actualKm: 12.8, driverName: "Juliano Castro", savingsKm: 2.2, fuelSaved: 13.20 },
        { date: "2024-08-02", routeName: "Rota Centro", plannedKm: 15, actualKm: 13.1, driverName: "Juliano Castro", savingsKm: 1.9, fuelSaved: 11.40 },
        { date: "2024-08-03", routeName: "Rota Centro", plannedKm: 15, actualKm: 12.5, driverName: "Juliano Castro", savingsKm: 2.5, fuelSaved: 15.00 },
        { date: "2024-08-04", routeName: "Rota Centro", plannedKm: 15, actualKm: 12.9, driverName: "Juliano Castro", savingsKm: 2.1, fuelSaved: 12.60 },
        { date: "2024-08-05", routeName: "Rota Centro", plannedKm: 15, actualKm: 12.2, driverName: "Juliano Castro", savingsKm: 2.8, fuelSaved: 16.80 }
    ]
};
