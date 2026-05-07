
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Users,
  Route,
  Truck,
  School,
  MessageSquare,
  DollarSign,
  UserCheck,
  Car,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  MessageCircle,
  Rocket,
  LayoutGrid,
  FileText,
  Milestone,
  BarChart3,
  UserPlus,
  Megaphone,
  Building2,
  Map as MapIcon,
  Activity,
  RotateCcw,
  RefreshCw,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { DriverRouteInfoCard } from "./driver-route-info-card";
import { useDataCollection } from '@/hooks/use-data';
import { useMemo } from "react";

const operationalLinks = [
  { href: "/dashboard/overview", label: "Painel Financeiro", icon: LayoutGrid },
  { href: "/dashboard/performance", label: "Performance & Eco", icon: BarChart3 },
  { href: "/dashboard/history", label: "Histórico (30d)", icon: MapIcon },
  { href: "/dashboard/management/incidents", label: "Telemetria & Incidentes", icon: Activity },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/financial", label: "Controle Financeiro", icon: DollarSign },
  { href: "/dashboard/management/trip-requests", label: "Viagens Extras", icon: Milestone },
  { href: "/dashboard/management/contracts", label: "Contratos", icon: ClipboardCheck },
];

const registrationLinks = [
  { href: "/dashboard/management/company", label: "Perfil da Empresa", icon: Building2 },
  { href: "/dashboard/management/schools", label: "Escolas", icon: School },
  { href: "/dashboard/management/drivers", label: "Motoristas", icon: Car },
  { href: "/dashboard/management/monitors", label: "Monitores", icon: ClipboardCheck },
  { href: "/dashboard/management/vehicles", label: "Frota", icon: Truck },
  { href: "/dashboard/management/routes", label: "Rotas", icon: Route },
  { href: "/dashboard/management/parents", label: "Pais", icon: Users },
  {
    href: "/dashboard/management/students",
    label: "Alunos",
    icon: GraduationCap,
  },
  { href: "/dashboard/management/predefined-messages", label: "Mensagens Predefinidas", icon: MessageCircle },
  { href: "/dashboard/management/contract-templates", label: "Modelos de Contrato", icon: FileText },
  { href: "/dashboard/management/announcements", label: "Mural de Avisos", icon: Megaphone },
];

const demoLinks = [
  { href: "/presentation/simulator", label: "Simulador (Apresentação)", icon: Sparkles },
];


export function MainSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  
  const isParent = pathname.includes('/parent');

  const { data: pendingRegs } = useDataCollection('pending_registrations', [{ field: 'status', op: '==', value: 'pending_approval' }]);
  const pendingCount = useMemo(() => pendingRegs?.length || 0, [pendingRegs]);

  // Filtro de links para Pais
  const finalOperationalLinks = isParent 
    ? [
        { href: "/parent/tracking", label: "Mapa em Tempo Real", icon: MapIcon },
        { href: "/parent/messages", label: "Mensagens", icon: MessageSquare },
        { href: "/parent/financial", label: "Minhas Faturas", icon: DollarSign },
      ]
    : operationalLinks;

  const finalRegistrationLinks = isParent
    ? [
        { href: "/parent/authorized", label: "Pessoas Autorizadas", icon: UserCheck },
        { href: "/parent/qrcode", label: "Meu QR Code", icon: LayoutGrid },
      ]
    : registrationLinks;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-xl font-bold">Guardian</h2>
            <p className="text-sm text-muted-foreground">{isParent ? 'Responsável' : 'Gestor de Frota'}</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-6 mb-2 group-data-[collapsible=icon]:hidden">
          Navegação
        </p>
        <SidebarMenu>
          {finalOperationalLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                variant="default"
                isActive={isActive(link.href)}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          
          {!isParent && (
            <SidebarMenuItem>
              <SidebarMenuButton
                  asChild
                  variant="default"
                  isActive={isActive('/dashboard/management/pending-registrations')}
                  tooltip="Novas Solicitações"
              >
                  <Link href="/dashboard/management/pending-registrations" className="flex justify-between w-full">
                      <div className="flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          <span className="group-data-[collapsible=icon]:hidden">Solicitações</span>
                      </div>
                      {pendingCount > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full group-data-[collapsible=icon]:hidden ml-2 shadow-sm">
                              {pendingCount}
                          </span>
                      )}
                  </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
        
        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-8 mb-2 group-data-[collapsible=icon]:hidden">
          {isParent ? 'Sua Conta' : 'Gestão Crítica'}
        </p>
        <SidebarMenu>
          {finalRegistrationLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                variant="default"
                isActive={isActive(link.href)}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        

        
        <SidebarSeparator className="my-6 group-data-[collapsible=icon]:hidden" />
        
        {!isParent && <DriverRouteInfoCard />}

        <div className="mt-auto p-4 group-data-[collapsible=icon]:hidden">
            <Button 
                variant="outline" 
                size="sm" 
                className="w-full text-[10px] font-black uppercase text-muted-foreground hover:text-destructive hover:border-destructive transition-all gap-2"
                onClick={() => {
                  if (confirm("Deseja resetar todos os dados do protótipo? Isso limpará o cache local.")) {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = '/';
                  }
                }}
            >
                <RotateCcw className="h-3 w-3" />
                Resetar Protótipo (Cache)
            </Button>
        </div>
        
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage
              src="https://picsum.photos/seed/admin/100/100"
              alt="Admin"
              data-ai-hint="person portrait"
            />
            <AvatarFallback>AD</AvatarFallback>
          </Avatar>
          <div className="group-data-[collapsible=icon]:hidden">
            <p className="font-semibold">Admin</p>
            <p className="text-muted-foreground">admin@guardian.com</p>
          </div>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Link href="/" className="ml-auto">
                        <Button variant="ghost" size="icon">
                        <LogOut className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </Link>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                    Sair
                </TooltipContent>
            </Tooltip>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
