
// @ts-nocheck
/**
 * @fileOverview Dados iniciais para o protótipo do Guardian.
 * Centraliza todas as coleções do banco de dados para simulação offline.
 */

export const initialMockData = {
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
        },
        {
            id: "school-2",
            name: "Colégio Vanguarda",
            cnpj: "98.765.432/0001-11",
            active: true,
            latitude: -23.5515,
            longitude: -46.6355,
            street: "Rua Augusta",
            number: "500",
            neighborhood: "Centro",
            city: "São Paulo",
            state: "SP",
            zipCode: "01305-000"
        }
    ],
    parents: [
        {
            id: "parent-1",
            userId: "user-pai-1",
            name: "Ana Pereira",
            email: "ana.pereira@email.com",
            phone: "11987654321",
            cpf: "111.222.333-44",
            active: true,
            street: "Rua das Acácias",
            number: "10",
            city: "São Paulo",
            state: "SP",
            zipCode: "05445-010"
        },
        {
            id: "parent-2",
            userId: "user-pai-2",
            name: "João Costa",
            email: "joao.costa@email.com",
            phone: "11977778888",
            cpf: "222.333.444-55",
            active: true,
            street: "Av. Paulista",
            number: "1000",
            city: "São Paulo",
            state: "SP",
            zipCode: "01310-100"
        },
        {
            id: "parent-3",
            userId: "user-pai-3",
            name: "Carla Dias",
            email: "carla.dias@email.com",
            phone: "11966665555",
            cpf: "333.444.555-66",
            active: true,
            street: "Rua Oscar Freire",
            number: "50",
            city: "São Paulo",
            state: "SP",
            zipCode: "01426-001"
        }
    ],
    students: [
        {
            id: "student-1",
            name: "Enzo Pereira",
            schoolId: "school-1",
            parentId: "parent-1",
            shift: "Manhã",
            status: "aguardando",
            active: true,
            latitude: -23.5580,
            longitude: -46.6600,
            street: "Rua das Acácias",
            number: "10",
            neighborhood: "Vila Madalena",
            city: "São Paulo",
            state: "SP",
            zipCode: "05445-010",
            monthlyFee: 450.00,
            medicalNote: "Alérgico a lactose. Não pode ingerir derivados de leite no lanche."
        },
        {
            id: "student-2",
            name: "Beatriz Costa",
            schoolId: "school-1",
            parentId: "parent-2",
            shift: "Manhã",
            status: "aguardando",
            active: true,
            latitude: -23.5650,
            longitude: -46.6520,
            street: "Av. Paulista",
            number: "1000",
            neighborhood: "Bela Vista",
            city: "São Paulo",
            state: "SP",
            zipCode: "01310-100",
            monthlyFee: 420.00
        },
        {
            id: "student-3",
            name: "Gabriel Dias",
            schoolId: "school-2",
            parentId: "parent-3",
            shift: "Manhã",
            status: "aguardando",
            active: true,
            latitude: -23.5600,
            longitude: -46.6650,
            street: "Rua Oscar Freire",
            number: "50",
            neighborhood: "Jardins",
            city: "São Paulo",
            state: "SP",
            zipCode: "01426-001",
            monthlyFee: 480.00,
            medicalNote: "Asma. Levar bombinha na mochila para emergências."
        }
    ],
    drivers: [
        {
            id: "driver-1",
            userId: "user-motorista-4",
            name: "Juliano Castro",
            status: "inativo",
            vehicleId: "vehicle-1",
            active: true,
            latitude: -23.5500,
            longitude: -46.6300
        },
        {
            id: "driver-2",
            userId: "user-motorista-2",
            name: "Mariana Costa",
            status: "inativo",
            vehicleId: "vehicle-2",
            active: true
        }
    ],
    vehicles: [
        {
            id: "vehicle-1",
            model: "Mercedes Sprinter",
            licensePlate: "BRA2E19",
            capacity: 15,
            active: true,
            currentOdometer: 45200,
            lastMaintenanceOdometer: 40000,
            maintenanceInterval: 10000
        },
        {
            id: "vehicle-2",
            model: "Renault Master",
            licensePlate: "KLU4J22",
            capacity: 18,
            active: true,
            currentOdometer: 12000,
            lastMaintenanceOdometer: 10000,
            maintenanceInterval: 10000
        }
    ],
    routes: [
        {
            id: "route-1",
            name: "Rota Centro - Manhã",
            driverId: "driver-1",
            monitorId: "user-monitor-1",
            shift: "Manhã",
            studentIds: ["student-1", "student-2", "school-1", "student-3", "school-2"],
            lastOptimizedAt: "2024-08-05T08:00:00Z",
            polyline: ""
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    incidents: [
        {
            id: "inc-1",
            category: "Trânsito",
            severity: "Média",
            timestamp: new Date().toISOString(),
            location: { lat: -23.555, lng: -46.645 },
            description: "Congestionamento intenso na subida da Rua Augusta sentido Centro.",
            reporter: "Juliano Castro"
        }
    ],
    invoices: [
        {
            id: "inv-1",
            studentId: "student-1",
            parentUserId: "user-pai-1",
            description: "Mensalidade Agosto",
            amount: 450.00,
            dueDate: "2024-08-10",
            status: "paid"
        },
        {
            id: "inv-2",
            studentId: "student-2",
            parentUserId: "user-pai-2",
            description: "Mensalidade Agosto",
            amount: 420.00,
            dueDate: "2024-08-10",
            status: "pending"
        },
        {
            id: "inv-3",
            studentId: "student-3",
            parentUserId: "user-pai-3",
            description: "Mensalidade Agosto",
            amount: 480.00,
            dueDate: "2024-08-05",
            status: "overdue"
        }
    ],
    expenses: [
        { id: "exp-1", description: "Abastecimento Sprinter", amount: 350.00, date: "2024-08-01", category: "Combustível" },
        { id: "exp-2", description: "Troca de Óleo Renault", amount: 450.00, date: "2024-08-02", category: "Manutenção" }
    ],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-2", text: "O aluno já foi entregue na escola.", for: "monitor" },
        { id: "pm-3", text: "Pagamento recebido, obrigado.", for: "gestor" }
    ],
    authorized_pickups: [
        { id: "auth-1", studentId: "student-1", parentUserId: "user-pai-1", name: "Avó Maria", cpf: "999.888.777-66", phone: "11911112222" }
    ],
    trip_requests: [
        {
            id: "tr-1",
            studentId: "student-1",
            schoolId: "school-1",
            parentUserId: "user-pai-1",
            date: "2024-08-15",
            type: "ida",
            shift: "manha",
            status: "pendente",
            createdAt: new Date().toISOString()
        }
    ],
    contract_templates: [
        {
            id: "tpl-1",
            name: "Contrato Padrão 2024",
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR\n\nCONTRATANTE: {{responsavel_nome}}, CPF: {{responsavel_cpf}}.\nALUNO: {{aluno_nome}}.\nESCOLA: {{escola_nome}}.\nVALOR: R$ {{valor_mensalidade}} mensais.\n\nData de geração: {{data_geracao}}.\nAno Letivo: {{ano_letivo}}.",
            createdAt: new Date().toISOString()
        }
    ],
    contracts: [
        {
            id: "ct-1",
            templateId: "tpl-1",
            studentId: "student-3",
            parentUserId: "user-pai-3",
            generatedContent: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR\n\nCONTRATANTE: Carla Dias, CPF: 333.444.555-66.\nALUNO: Gabriel Dias.\nESCOLA: Colégio Vanguarda.\nVALOR: R$ 480,00 mensais.",
            status: "pending_acceptance",
            createdAt: new Date().toISOString()
        }
    ],
    pending_registrations: [
        {
            id: "reg-1",
            parentName: "Roberto Silva",
            studentName: "Davi Silva",
            email: "roberto.silva@email.com",
            phone: "11955551111",
            schoolId: "school-1",
            status: "pending_approval",
            createdAt: new Date().toISOString(),
            documentData: {
                cpf: "123.456.789-01",
                rg: "12.345.678-0"
            }
        }
    ]
};
