import {
  Users,
  Route,
  MessageSquare,
  DollarSign,
  Sparkles,
  BarChart,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Link from "next/link";

const menuItems = [
    {
        title: "Visão Geral",
        description: "Painel com métricas e gráficos.",
        href: "/dashboard/overview",
        icon: BarChart,
        color: "text-sky-500"
    },
    {
        title: "Otimizador de Rotas (IA)",
        description: "Planeje e otimize as rotas existentes.",
        href: "/dashboard/optimizer",
        icon: Sparkles,
        color: "text-amber-500"
    },
    {
        title: "Financeiro",
        description: "Gerencie receitas e despesas.",
        href: "/dashboard/financial",
        icon: DollarSign,
        color: "text-emerald-500"
    },
    {
        title: "Mensagens",
        description: "Comunicação com pais e motoristas.",
        href: "/dashboard/messages",
        icon: MessageSquare,
        color: "text-blue-500"
    },
    {
        title: "Gerenciar Cadastros",
        description: "Administre escolas, alunos e mais.",
        href: "/dashboard/management/schools",
        icon: Users,
        color: "text-violet-500"
    },
     {
        title: "Viagens Avulsas",
        description: "Aprove ou rejeite viagens extras.",
        href: "/dashboard/management/trip-requests",
        icon: Route,
        color: "text-orange-500"
    },
];


export default function DashboardMenuPage() {
  return (
    <div className="flex flex-col gap-8">
       <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Principal</h1>
          <p className="text-muted-foreground">Selecione uma área para gerenciar.</p>
        </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {menuItems.map((item) => (
          <Link href={item.href} key={item.href}>
            <Card className="h-full hover:border-primary/50 hover:bg-secondary/50 transition-all duration-200 hover:shadow-lg">
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                  <div className={`p-3 rounded-lg bg-primary/10 ${item.color}`}>
                     <item.icon className="h-6 w-6" />
                  </div>
                 <div>
                    <CardTitle>{item.title}</CardTitle>
                 </div>
              </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
