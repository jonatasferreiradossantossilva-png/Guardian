// @ts-nocheck
/**
 * @fileOverview Dados iniciais blindados para o protótipo do Guardian.
 * Configurado com turnos Manhã, Tarde e Integral para simulação de 4 cenários.
 */

export const initialMockData = {
    config: [
        { id: "global", scaling_mode: false } 
    ],
    company_profile: [
        { 
            id: "profile-1", 
            companyName: "Guardian Transporte Escolar", 
            cnpj: "00.000.000/0001-00", 
            email: "contato@guardian.com.br", 
            phone: "(11) 99999-9999", 
            address: "Av. Paulista, 1000 - São Paulo, SP", 
            website: "https://guardian.app",
            bankName: "NuBank",
            bankAgency: "0001",
            bankAccount: "1234567-8",
            pixKey: "financeiro@guardian.app"
        }
    ],
    users: [
        { id: "user-admin-1", name: "Admin Guardian", email: "admin@guardian.com", profile: 'gestor', active: true },
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
        { id: "student-6", name: "Pedro Rocha", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5630, longitude: -46.6630, street: "Rua Consolação", number: "400", city: "São Paulo", state: "SP", monthlyFee: 480, preferredPaymentDay: 15, serie: "6º Ano", turma: "Sala 106" },
        { id: "student-7", name: "Julia Santos", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5640, longitude: -46.6640, street: "Rua Peixoto Gomide", number: "500", city: "São Paulo", state: "SP", monthlyFee: 480, preferredPaymentDay: 15, serie: "7º Ano", turma: "Sala 307" },
        { id: "student-8", name: "Gabriel Dias", schoolId: "school-1", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5600, longitude: -46.6650, street: "Rua Oscar Freire", number: "50", city: "São Paulo", state: "SP", monthlyFee: 480, preferredPaymentDay: 15, serie: "8º Ano", turma: "Sala 408" },
        { id: "student-9", name: "Gustavo Alencar", schoolId: "school-1", parentId: "parent-2", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5655, longitude: -46.6655, street: "Rua Pamplona", number: "600", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "9º Ano", turma: "Sala 509" },
        { id: "student-10", name: "Sofia Braga", schoolId: "school-1", parentId: "parent-2", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5660, longitude: -46.6660, street: "Alameda Santos", number: "700", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "1º Ano", turma: "Sala 110" },
        { id: "student-11", name: "Thiago Mendes", schoolId: "school-1", parentId: "parent-2", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5670, longitude: -46.6670, street: "Rua Estados Unidos", number: "800", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "2º Ano", turma: "Sala 211", medicalConditions: ["Diabetes"], medicalNote: "Monitorar ingestão de açúcar no lanche." },
        { id: "student-12", name: "Larissa Faria", schoolId: "school-1", parentId: "parent-2", shift: "Tarde", status: "aguardando", active: true, latitude: -23.5680, longitude: -46.6680, street: "Rua Colômbia", number: "900", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 312" },
        { id: "student-13", name: "Felipe Azevedo", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5690, longitude: -46.6690, street: "Rua Chile", number: "100", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "Maternal", turma: "Sala 01" },
        { id: "student-14", name: "Bianca Viana", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5700, longitude: -46.6700, street: "Rua Peru", number: "200", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "Pré I", turma: "Sala 02" },
        { id: "student-15", name: "Rafael Guimarães", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5710, longitude: -46.6710, street: "Rua Argentina", number: "300", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "1º Ano", turma: "Sala 03" },
        { id: "student-16", name: "Tiago Silva", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5800, longitude: -46.6800, street: "Rua Tabapuã", number: "500", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "2º Ano", turma: "Sala 04", medicalConditions: ["Neuro"], medicalNote: "TEA. Prefere sentar nas primeiras fileiras." },
        { id: "student-17", name: "Manuela Ferro", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5810, longitude: -46.6810, street: "Rua Joaquim Floriano", number: "600", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "3º Ano", turma: "Sala 05" },
        { id: "student-18", name: "Ricardo Dias", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5820, longitude: -46.6820, street: "Av. Brigadeiro Faria Lima", number: "1200", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "4º Ano", turma: "Sala 06" },
        { id: "student-19", name: "Heloísa Santos", schoolId: "school-1", parentId: "parent-3", shift: "Integral", status: "aguardando", active: true, latitude: -23.5830, longitude: -46.6830, street: "Rua Iguatemi", number: "300", city: "São Paulo", state: "SP", monthlyFee: 650, preferredPaymentDay: 10, serie: "5º Ano", turma: "Sala 07" },
        // NOVOS ALUNOS DO COLÉGIO MARJORE PAULA PARA TESTE DE FILTRO
        { id: "student-mj-1", name: "Pedro Oliveira", schoolId: "school-marjore", parentId: "parent-1", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5590, longitude: -46.6610, street: "Rua Oscar Freire", number: "1500", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "4º Ano", turma: "Sala 10" },
        { id: "student-mj-2", name: "Sofia Almeida", schoolId: "school-marjore", parentId: "parent-2", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5600, longitude: -46.6620, street: "Av. Brasil", number: "2000", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "2º Ano", turma: "Sala 05" },
        { id: "student-mj-3", name: "Lucca Mendes", schoolId: "school-marjore", parentId: "parent-3", shift: "Manhã", status: "aguardando", active: true, latitude: -23.5610, longitude: -46.6630, street: "Rua Augusta", number: "2500", city: "São Paulo", state: "SP", monthlyFee: 450, preferredPaymentDay: 10, serie: "1º Ano", turma: "Sala 01" },
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
            studentIds: [
                "school-1",
                "student-1", "student-2", "student-3", "student-4", "student-5",
                "student-6", "student-7", "student-8", "student-13", "student-14",
                "student-15", "student-16", "student-17", "student-18", "student-19"
            ],
            lastOptimizedAt: "2024-08-05T08:00:00Z"
        },
        {
            id: "route-2",
            name: "Rota 02 - Tarde",
            driverId: "driver-1",
            monitorId: "user-monitor-1",
            shift: "Tarde",
            studentIds: [
                "school-1",
                "student-9", "student-10", "student-11", "student-12",
                "student-13", "student-14", "student-15", "student-16", "student-17", "student-18", "student-19"
            ],
            lastOptimizedAt: ""
        }
    ],
    locations: {
        "driver-1": { latitude: -23.5500, longitude: -46.6300, timestamp: new Date().toISOString() }
    },
    contract_templates: [
        { 
            id: "template-1", 
            name: "Contrato Padrão - Guardian", 
            content: "CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO {{ano_letivo}}\n\nPelo presente instrumento particular, de um lado:\nCONTRATADO: Guardian Transporte Escolar, com sede profissional cadastrada no sistema.\nCONTRATANTE: {{responsavel_nome}}, portador(a) do CPF {{responsavel_cpf}}, responsável pelo aluno(a) {{aluno_nome}}.\n\nAs partes acima identificadas têm, entre si, justo e acertado o presente Contrato, que se regerá pelas cláusulas seguintes:\n\nCLÁUSULA 1ª - DO OBJETO\nO presente contrato tem como objeto a prestação de serviços de transporte escolar do ALUNO(A) {{aluno_nome}}, no trajeto compreendido entre o endereço {{aluno_endereco}} e a instituição de ensino {{escola_nome}}, no turno {{turno}}.\n\nCLÁUSULA 2ª - DOS VALORES E PAGAMENTO\nPela prestação dos serviços, o CONTRATANTE pagará ao CONTRATADO o valor mensal de {{valor_mensalidade}}, com vencimento todo dia {{dia_vencimento}} de cada mês.\nO pagamento deverá ser efetuado via: {{banco}}, Agência {{agencia}}, Conta {{conta}} ou através da Chave Pix: {{chave_pix}}.\nParágrafo Único: O não pagamento na data aprazada implicará em multa de 2% e juros de 1% ao mês.\n\nCLÁUSULA 3ª - DAS OBRIGAÇÕES DO CONTRATADO\nO CONTRATADO compromete-se a:\na) Manter o veículo em perfeitas condições de higiene, segurança e funcionamento;\nb) Cumprir rigorosamente os horários estabelecidos, salvo por motivo de força maior (trânsito, acidentes ou quebras);\nc) Tratar o passageiro com urbanidade e zelar pela sua segurança durante todo o trajeto.\n\nCLÁUSULA 4ª - DAS OBRIGAÇÕES DO CONTRANTE\nO CONTRATANTE compromete-se a:\na) Garantir a presença do aluno no ponto de embarque no horário combinado, com tolerância máxima de 2 (dois) minutos;\nb) Instruir o aluno quanto ao comportamento adequado e seguro dentro do veículo;\nc) Comunicar eventuais faltas com antecedência mínima de 1 hora através do aplicativo Guardian.\n\nCLÁUSULA 5ª - DAS FALTAS E AUSÊNCIAS\nA ausência do aluno por qualquer motivo (doença, viagens, passeios) não desobriga o CONTRATANTE do pagamento integral da mensalidade, visto que a vaga permanece reservada e os custos fixos de manutenção da rota são mantidos.\n\nCLÁUSULA 6ª - DA RESCISÃO\nO presente contrato poderá ser rescindido por qualquer das partes mediante aviso prévio por escrito com 30 (trinta) dias de antecedência.\n\nGerado eletronicamente pela Plataforma Guardian em {{data_geracao}}.", 
            createdAt: new Date().toISOString() 
        }
    ],
    contracts: [],
    invoices: [],
    expenses: [],
    predefined_messages: [
        { id: "pm-1", text: "Estou a 5 minutos do local.", for: "driver" },
        { id: "pm-2", text: "A van está chegando na escola.", for: "driver" }
    ],
    authorized_pickups: [],
    trip_requests: [],
    pending_registrations: [],
    announcements: [],
    incidents: [
        { id: "inc-init-1", category: "Início de Operação", description: "Frota matinal iniciou atividades. 1 veículo em rota.", severity: "Baixa", reporter: "Sistema", timestamp: new Date().toISOString() }
    ],
    trip_history: []
};