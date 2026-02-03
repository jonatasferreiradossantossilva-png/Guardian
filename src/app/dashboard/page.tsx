'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LayoutGrid,
  BarChart2,
  Sparkles,
  MessageSquare,
  DollarSign,
  Route,
  GraduationCap,
  Car,
  Users,
  School,
  Truck
} from 'lucide-react';

const menuItems = [
  {
    href: '/dashboard/overview',
    title: 'Visão Geral Financeira',
    description: 'Analise receitas, despesas e o balanço.',
    icon: BarChart2,
  },
  {
    href: '/dashboard/optimizer',
    title: 'Otimizador de Rotas (IA)',
    description: 'Crie rotas eficientes e economize tempo e custos.',
    icon: Sparkles,
  },
  {
    href: '/dashboard/messages',
    title: 'Central de Mensagens',
    description: 'Comunique-se com pais, motoristas e auxiliares.',
    icon: MessageSquare,
  },
  {
    href: '/dashboard/financial',
    title: 'Gestão Financeira',
    description: 'Gerencie faturas, pagamentos e despesas.',
    icon: DollarSign,
  },
  {
    href: '/dashboard/management/routes',
    title: 'Gerenciar Rotas',
    description: 'Crie e edite as rotas de transporte.',
    icon: Route,
  },
    {
    href: '/dashboard/management/students',
    title: 'Gerenciar Alunos',
    description: 'Cadastre e administre os dados dos alunos.',
    icon: GraduationCap,
  },
  {
    href: '/dashboard/management/drivers',
    title: 'Gerenciar Motoristas',
    description: 'Administre os motoristas e seus veículos.',
    icon: Car,
  },
  {
    href: '/dashboard/management/parents',
    title: 'Gerenciar Pais',
    description: 'Cadastre os responsáveis pelos alunos.',
    icon: Users,
  },
];

export default function DashboardMenuPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Principal</h1>
        <p className="text-muted-foreground">Navegue pelas principais áreas do sistema.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.href} className="flex">
            <Card className="flex flex-col w-full hover:bg-secondary/50 hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex-grow">
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
