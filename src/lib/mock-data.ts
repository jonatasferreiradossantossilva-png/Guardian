
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
        }
    ],
    school_knowledge_base: [
        // Escolas Carapicuíba - SP (Privadas)
        { id: "skb-c-1", name: "ADVENTISTA DE CARAPICUIBA COLEGIO", type: "private", zipCode: "06310-160", city: "Carapicuíba", state: "SP", latitude: -23.5225, longitude: -46.8355, neighborhood: "Centro" },
        { id: "skb-c-2", name: "AGOSTINHO COLEGIO", type: "private", zipCode: "06310-100", city: "Carapicuíba", state: "SP", latitude: -23.5235, longitude: -46.8345, neighborhood: "Centro" },
        { id: "skb-c-9", name: "CAMINHO DO SABER COLEGIO", type: "private", zipCode: "06321-110", city: "Carapicuíba", state: "SP", latitude: -23.5322, longitude: -46.8377, neighborhood: "Vila Cretti" },
        { id: "skb-c-12", name: "DIVINO MESTRE COLEGIO", type: "private", zipCode: "06315-000", city: "Carapicuíba", state: "SP", latitude: -23.5244, longitude: -46.8399, neighborhood: "Vila Caldas" },
        { id: "skb-c-13", name: "ESCOLA DA VILA COLEGIO", type: "private", zipCode: "06355-300", city: "Carapicuíba", state: "SP", latitude: -23.5611, longitude: -46.8288, neighborhood: "Aldeia de Carapicuiba" },
        { id: "skb-c-15", name: "IMACULADA CONCEICAO COLEGIO", type: "private", zipCode: "06310-010", city: "Carapicuíba", state: "SP", latitude: -23.5215, longitude: -46.8322, neighborhood: "Centro" },
        { id: "skb-c-16", name: "PIAGET COLEGIO", type: "private", zipCode: "06315-010", city: "Carapicuíba", state: "SP", latitude: -23.5255, longitude: -46.8388, neighborhood: "Vila Caldas" },
        { id: "skb-c-18", name: "SAO JORGE COLEGIO", type: "private", zipCode: "06310-040", city: "Carapicuíba", state: "SP", latitude: -23.5218, longitude: -46.8344, neighborhood: "Centro" },
        { id: "skb-c-19", name: "COLEGIO ALFA", type: "private", zipCode: "06310-200", city: "Carapicuíba", state: "SP", latitude: -23.5240, longitude: -46.8310, neighborhood: "Centro" },
        { id: "skb-c-20", name: "COLEGIO OBJETIVO CARAPICUIBA", type: "private", zipCode: "06310-250", city: "Carapicuíba", state: "SP", latitude: -23.5210, longitude: -46.8360, neighborhood: "Centro" },
        
        // Escolas Carapicuíba - SP (Públicas)
        { id: "skb-c-3", name: "AMALIA TIBIRICA DE CARVALHO PROFESSORA EE", type: "public", zipCode: "06386-430", city: "Carapicuíba", state: "SP", latitude: -23.5345, longitude: -46.8255, neighborhood: "Vila Dirce" },
        { id: "skb-c-4", name: "ANA MARIA DE SOUZA PROFESSORA EMEF", type: "public", zipCode: "06333-270", city: "Carapicuíba", state: "SP", latitude: -23.5412, longitude: -46.8123, neighborhood: "Ariston" },
        { id: "skb-c-5", name: "ANDREI SAKHAROV EE", type: "public", zipCode: "06327-270", city: "Carapicuíba", state: "SP", latitude: -23.5288, longitude: -46.8412, neighborhood: "Parque Jandaia" },
        { id: "skb-c-6", name: "ANNA LAURA EMEI", type: "public", zipCode: "06328-340", city: "Carapicuíba", state: "SP", latitude: -23.5299, longitude: -46.8455, neighborhood: "Cohab V" },
        { id: "skb-c-7", name: "ANTONIO DE OLIVEIRA PROFESSOR EE", type: "public", zipCode: "06321-610", city: "Carapicuíba", state: "SP", latitude: -23.5312, longitude: -46.8388, neighborhood: "Vila Cretti" },
        { id: "skb-c-8", name: "BASILIO BADI EE", type: "public", zipCode: "06325-000", city: "Carapicuíba", state: "SP", latitude: -23.5355, longitude: -46.8422, neighborhood: "Vila Menck" },
        { id: "skb-c-10", name: "CAROLINA MARIA DE JESUS PROFESSORA EMEF", type: "public", zipCode: "06341-000", city: "Carapicuíba", state: "SP", latitude: -23.5455, longitude: -46.8211, neighborhood: "Pq. Santa Teresa" },
        { id: "skb-c-11", name: "CHICO MENDES EMEF", type: "public", zipCode: "06390-400", city: "Carapicuíba", state: "SP", latitude: -23.5511, longitude: -46.8155, neighborhood: "Vila Marcondes" },
        { id: "skb-c-14", name: "EUCLIDES DA CUNHA EE", type: "public", zipCode: "06310-000", city: "Carapicuíba", state: "SP", latitude: -23.5211, longitude: -46.8333, neighborhood: "Centro" },
        { id: "skb-c-17", name: "TOBIAS DE AGUIAR EE", type: "public", zipCode: "06310-050", city: "Carapicuíba", state: "SP", latitude: -23.5205, longitude: -46.8311, neighborhood: "Centro" }
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
            street: "Rua das Academias",
            number: "10",
            neighborhood: "Vila Madalena",
            city: "São Paulo",
            state: "SP",
            zipCode: "05445-010",
            monthlyFee: 450.00,
            medicalNote: "Alérgico a lactose."
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
            medicalNote: "Asma."
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
            plannedDistanceKm: 12.5,
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
            description: "Congestionamento intenso na subida da Rua Augusta.",
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
        { id: "auth-1", studentId: "student-1", parentUserId: "user-pai-1", name: "Avó Maria", cpf: "999.888.777-66", phone: "11911112222", photoUrl: "https://picsum.photos/seed/avo-maria/200/200" }
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
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR\n\nCONTRATANTE: {{responsavel_nome}}, CPF: {{responsavel_cpf}}.\nALUNO: {{aluno_nome}}.\nESCOLA: {{escola_nome}}.\nVALOR: R$ {{valor_mensalidade}} mensais.",
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
    ],
    announcements: [
        {
            id: "ann-1",
            title: "Manutenção Preventiva - Van 01",
            content: "Prezados pais, informamos que a Van 01 passará por manutenção amanhã.",
            createdAt: new Date().toISOString(),
            priority: "high",
            target: "all"
        }
    ],
    trip_history: [
        {
            id: "hist-1",
            date: "2024-08-01",
            routeName: "Rota Centro - Manhã",
            plannedKm: 12.5,
            actualKm: 11.2,
            driverName: "Juliano Castro",
            savingsKm: 3.2,
            fuelSaved: 19.20
        }
    ]
};
