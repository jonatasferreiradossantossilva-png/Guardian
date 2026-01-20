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
