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
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";
import { DriverRouteInfoCard } from "./driver-route-info-card";
import { useMockCollection } from "@/hooks/use-mock-data";
import { useMemo } from "react";

const operationalLinks = [
  { href: "/dashboard/overview", label: "Painel Financeiro", icon: LayoutGrid },
  { href: "/dashboard/performance", label: "Performance & Eco", icon: BarChart3 },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/financial", label: "Controle Financeiro", icon: DollarSign },
  { href: "/dashboard/management/trip-requests", label: "Viagens Extras", icon: Milestone },
  { href: "/dashboard/management/contracts", label: "Contratos", icon: ClipboardCheck },
];

const registrationLinks = [
  { href: "/dashboard/management/schools", label: "Escolas", icon: School },
  { href: "/dashboard/management/drivers", label: "Motoristas", icon: Car },
  { href: "/dashboard/management/vehicles", label: "Veículos", icon: Truck },
  { href: "/dashboard/management/routes", label: "Rotas", icon: Route },
  { href: "/dashboard/management/parents", label: "Pais", icon: Users },
  {
    href: "/dashboard/management/students",
    label: "Alunos",
    icon: GraduationCap,
  },
  { href: "/dashboard/management/predefined-messages", label: "Mensagens Predefinidas", icon: MessageCircle },
  { href: "/dashboard/management/contract-templates", label: "Modelos de Contrato", icon: FileText },
];


export function MainSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;
  
  const { data: pendingRegs } = useMockCollection('pending_registrations', [{ field: 'status', op: '==', value: 'pending_approval' }]);
  const pendingCount = useMemo(() => pendingRegs?.length || 0, [pendingRegs]);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-xl font-bold">Guardian</h2>
            <p className="text-sm text-muted-foreground">Admin</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <p className="px-4 text-xs text-muted-foreground mt-3 mb-2 group-data-[collapsible=icon]:hidden">
          Operacional
        </p>
        <SidebarMenu>
          {operationalLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                variant="ghost"
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
          
          <SidebarMenuItem>
            <SidebarMenuButton
                asChild
                variant="ghost"
                isActive={isActive('/dashboard/management/pending-registrations')}
                tooltip="Novas Solicitações"
            >
                <Link href="/dashboard/management/pending-registrations" className="flex justify-between w-full">
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4" />
                        <span className="group-data-[collapsible=icon]:hidden">Solicitações</span>
                    </div>
                    {pendingCount > 0 && (
                        <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full group-data-[collapsible=icon]:hidden">
                            {pendingCount}
                        </span>
                    )}
                </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <p className="px-4 text-xs text-muted-foreground mt-3 mb-2 group-data-[collapsible=icon]:hidden">
          Cadastros
        </p>
        <SidebarMenu>
          {registrationLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                variant="ghost"
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
        
        <SidebarSeparator className="my-2 group-data-[collapsible=icon]:hidden" />
        
        <DriverRouteInfoCard />
        
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
