import { Siren, Car, Users, Smile } from "lucide-react";

export type Incident = {
  id: string;
  category: 'Trânsito' | 'Acidente' | 'Perigo' | 'Outro';
  severity: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
  timestamp: string;
  location: { lat: number; lng: number };
  description: string;
  reporter: string;
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
        icon: Siren,
    },
    {
        title: "Motoristas Ativos",
        value: "8/10",
        change: "-1",
        changeType: "decrease",
        icon: Car,
    },
    {
        title: "Alunos Transportados",
        value: "128",
        change: "+12",
        changeType: "increase",
        icon: Users,
    },
    {
        title: "Satisfação dos Pais",
        value: "98%",
        change: "+0.5%",
        changeType: "increase",
        icon: Smile,
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
