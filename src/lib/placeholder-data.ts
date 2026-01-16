export type Incident = {
  id: string;
  category: 'Trânsito' | 'Acidente' | 'Perigo' | 'Outro';
  severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  timestamp: string;
  location: { lat: number; lng: number };
  description: string;
  reporter: string;
};

export type DriverStatus = {
  id: string;
  name: string;
  status: 'Online' | 'Offline' | 'Em Rota';
  vehicle: string;
  avatarUrl: string;
};

export type OverviewStat = {
  title: string;
  value: string;
  change: string;
  changeType: 'increase' | 'decrease';
  icon: React.ElementType;
}

export const overviewStats: OverviewStat[] = [
    {
        title: "Incidentes Hoje",
        value: "12",
        change: "+2",
        changeType: "increase",
        icon: require("lucide-react").Siren,
    },
    {
        title: "Motoristas Ativos",
        value: "8/10",
        change: "-1",
        changeType: "decrease",
        icon: require("lucide-react").SteeringWheel,
    },
    {
        title: "Alunos Transportados",
        value: "128",
        change: "+12",
        changeType: "increase",
        icon: require("lucide-react").Users,
    },
    {
        title: "Satisfação dos Pais",
        value: "98%",
        change: "+0.5%",
        changeType: "increase",
        icon: require("lucide-react").Smile,
    },
];

export const incidents: Incident[] = [
  {
    id: 'INC-001',
    category: 'Trânsito',
    severity: 'Média',
    timestamp: '2024-07-29T08:15:00Z',
    location: { lat: -23.55052, lng: -46.633308 },
    description: 'Congestionamento intenso na Av. Paulista devido a obras na via. Atraso estimado de 20 minutos.',
    reporter: 'Carlos Silva',
  },
  {
    id: 'INC-002',
    category: 'Acidente',
    severity: 'Alta',
    timestamp: '2024-07-29T08:05:00Z',
    location: { lat: -23.5613, lng: -46.6565 },
    description: 'Colisão entre dois carros no cruzamento da Rua Augusta com a Alameda Santos. Vias bloqueadas.',
    reporter: 'Ana Pereira',
  },
  {
    id: 'INC-003',
    category: 'Perigo',
    severity: 'Crítica',
    timestamp: '2024-07-29T07:50:00Z',
    location: { lat: -23.5475, lng: -46.6359 },
    description: 'Manifestação bloqueia totalmente a Praça da Sé. Risco de segurança. Evitar a área.',
    reporter: 'Central',
  },
  {
    id: 'INC-004',
    category: 'Trânsito',
    severity: 'Baixa',
    timestamp: '2024-07-29T08:30:00Z',
    location: { lat: -23.5869, lng: -46.6823 },
    description: 'Semáforo com defeito na Av. Brigadeiro Faria Lima. Trânsito lento mas fluindo.',
    reporter: 'Mariana Costa',
  },
];

export const driverStatuses: DriverStatus[] = [
  {
    id: 'DRV-01',
    name: 'João Almeida',
    status: 'Em Rota',
    vehicle: 'Van-01 (ABC-1234)',
    avatarUrl: 'https://picsum.photos/seed/user1/100/100',
  },
  {
    id: 'DRV-02',
    name: 'Fernanda Lima',
    status: 'Online',
    vehicle: 'Van-02 (DEF-5678)',
    avatarUrl: 'https://picsum.photos/seed/user2/100/100',
  },
  {
    id: 'DRV-03',
    name: 'Ricardo Souza',
    status: 'Offline',
    vehicle: 'Van-03 (GHI-9012)',
    avatarUrl: 'https://picsum.photos/seed/user3/100/100',
  },
];
