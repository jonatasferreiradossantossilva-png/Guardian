'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { LayoutGrid, Sparkles, DollarSign, MessageSquare, Users, Route } from 'lucide-react';

const menuItems = [
  {
    href: '/dashboard/overview',
    icon: LayoutGrid,
    title: 'Visão Geral',
    description: 'Acompanhe os principais indicadores financeiros e operacionais.',
  },
  {
    href: '/dashboard/optimizer',
    icon: Sparkles,
    title: 'Otimizador de Rotas (IA)',
    description: 'Crie e analise rotas otimizadas para economizar tempo e combustível.',
  },
  {
    href: '/dashboard/financial',
    icon: DollarSign,
    title: 'Financeiro',
    description: 'Gerencie receitas, despesas e o fluxo de caixa da sua operação.',
  },
  {
    href: '/dashboard/messages',
    icon: MessageSquare,
    title: 'Central de Mensagens',
    description: 'Comunique-se com pais, motoristas e auxiliares em um só lugar.',
  },
  {
    href: '/dashboard/management/routes',
    icon: Route,
    title: 'Gerenciar Rotas',
    description: 'Cadastre e edite as rotas, motoristas e alunos de cada trajeto.',
  },
  {
    href: '/dashboard/management/students',
    icon: Users,
    title: 'Gerenciar Cadastros',
    description: 'Acesse e edite os dados de alunos, pais, motoristas e veículos.',
  },
];

export default function DashboardMenuPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Menu Principal</h1>
        <p className="text-muted-foreground">Selecione uma opção para começar a gerenciar sua operação.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.href} legacyBehavior passHref>
            <a className="block h-full">
              <Card className="flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:border-primary/50 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{item.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <CardDescription>{item.description}</CardDescription>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>
    </div>
  );
}
