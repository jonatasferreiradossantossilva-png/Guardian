
// @ts-nocheck
/**
 * @fileOverview Dados iniciais para o protótipo do Guardian.
 * Centraliza todas as coleções do banco de dados para simulação operacional e administrativa.
 */

export const initialMockData = {
    config: [
        { id: "global", scaling_mode: false } 
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
        { id: "kb-4", name: "Colégio Adventista de Carapicuíba", city: "Carapicuíba", state: "SP", street: "Rua Haiti", number: "88", neighborhood: "Vila Silviânia", zipCode: "06321-510", latitude: -23.5212, longitude: -46.8312 },
        { id: "kb-5", name: "E.E. Deputado Salomão Jorge", city: "Carapicuíba", state: "SP", street: "Rua Diadema", number: "10", neighborhood: "Jardim Planalto", zipCode: "06361-100", latitude: -23.5512, longitude: -46.8612 }
    ],
    parents: [
        { id: "parent-1", userId: "user-pai-1", name: "Ana Pereira", email: "ana.pereira@email.com", phone: "11987654321", active: true },
        { id: "parent-2", userId: "user-pai-2", name: "João Costa", email: "joao.costa@email.com", phone: "11912345678", active: true },
        { id: "parent-3", userId: "user-pai-3", name: "Carla Dias", email: "carla.dias@email.com", phone: "11999998888", active: true },
    ],
    students: [
        // Filhos da Ana Pereira (Cenário de Apresentação: 2 filhos)
        { id: "student-1", name: "Enzo Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10 },
        { id: "student-2", name: "Valentina Pereira", schoolId: "school-1", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5580, longitude: -46.6600, street: "Rua das Acácias", number: "10", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10 },
        
        // Outros 13 alunos para completar a carga de 15 da rota
        { id: "student-3", name: "Beatriz Costa", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5650, longitude: -46.6520, street: "Av. Paulista", number: "1000", city: "São Paulo", state: "SP", monthlyFee: 450 },
        { id: "student-4", name: "Lucas Melo", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5610, longitude: -46.6610, street: "Rua Haddock Lobo", number: "200", city: "São Paulo", state: "SP" },
        { id: "student-5", name: "Mariana Lima", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5620, longitude: -46.6620, street: "Rua Bela Cintra", number: "300", city: "São Paulo", state: "SP" },
        { id: "student-6", name: "Pedro Rocha", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5630, longitude: -46.6630, street: "Rua Consolação", number: "400", city: "São Paulo", state: "SP" },
        { id: "student-7", name: "Julia Santos", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5640, longitude: -46.6640, street: "Rua Peixoto Gomide", number: "500", city: "São Paulo", state: "SP" },
        { id: "student-8", name: "Gabriel Dias", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5600, longitude: -46.6650, street: "Rua Oscar Freire", number: "50", city: "São Paulo", state: "SP" },
        { id: "student-9", name: "Gustavo Alencar", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5650, longitude: -46.6650, street: "Rua Pamplona", number: "600", city: "São Paulo", state: "SP" },
        { id: "student-10", name: "Sofia Braga", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5660, longitude: -46.6660, street: "Alameda Santos", number: "700", city: "São Paulo", state: "SP" },
        { id: "student-11", name: "Thiago Mendes", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5670, longitude: -46.6670, street: "Rua Estados Unidos", number: "800", city: "São Paulo", state: "SP" },
        { id: "student-12", name: "Larissa Faria", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5680, longitude: -46.6680, street: "Rua Colômbia", number: "900", city: "São Paulo", state: "SP" },
        { id: "student-13", name: "Felipe Azevedo", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5690, longitude: -46.6690, street: "Rua Chile", number: "100", city: "São Paulo", state: "SP" },
        { id: "student-14", name: "Bianca Viana", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5700, longitude: -46.6700, street: "Rua Peru", number: "200", city: "São Paulo", state: "SP" },
        { id: "student-15", name: "Rafael Guimarães", schoolId: "school-1", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5710, longitude: -46.6710, street: "Rua Argentina", number: "300", city: "São Paulo", state: "SP" },
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
            name: "Rota Centro - Manhã",
            driverId: "driver-1",
            monitorId: "user-monitor-1",
            shift: "Manhã",
            studentIds: [
                "school-1",
                "student-1", "student-2", "student-3", "student-4", "student-5",
                "student-6", "student-7", "student-8", "student-9", "student-10",
                "student-11", "student-12", "student-13", "student-14", "student-15"
            ],
            lastOptimizedAt: "2024-08-05T08:00:00Z",
            polyline: ""
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    contract_templates: [
        { 
            id: "template-1", 
            name: "Contrato de Transporte Escolar 2024", 
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE\n\nCONTRATANTE: {{responsavel_nome}}, portador do CPF {{responsavel_cpf}}.\nALUNO(A): {{aluno_nome}}.\nESCOLA: {{escola_nome}}.\n\nVALOR MENSAL: R$ {{valor_mensalidade}}\n\nAs partes concordam com os termos de segurança e horários estabelecidos pela plataforma Guardian.\n\nGerado em: {{data_geracao}}",
            createdAt: new Date().toISOString()
        }
    ],
    contracts: [],
    invoices: [
        { id: "inv-1", studentId: "student-1", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: "2024-08-10", status: "paid" },
        { id: "inv-2", studentId: "student-2", parentUserId: "user-pai-1", description: "Mensalidade Agosto", amount: 450, dueDate: "2024-08-10", status: "pending" }
    ],
    expenses: [
        { id: "exp-1", description: "Diesel S10 - Posto Shell", amount: 350.50, date: "2024-08-01", category: "Combustível" },
        { id: "exp-2", description: "Troca de Óleo", amount: 890.00, date: "2024-08-03", category: "Manutenção" }
    ],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" }
    ],
    authorized_pickups: [],
    trip_requests: [],
    pending_registrations: [],
    announcements: [],
    trip_history: [
        { id: "th-1", date: "2024-08-04", routeName: "Rota Centro", plannedKm: 18.5, actualKm: 15.2, savingsKm: 3.3, fuelSaved: 24.75, driverName: "Juliano Castro" },
        { id: "th-2", date: "2024-08-05", routeName: "Rota Centro", plannedKm: 18.5, actualKm: 14.8, savingsKm: 3.7, fuelSaved: 27.75, driverName: "Juliano Castro" }
    ]
};
