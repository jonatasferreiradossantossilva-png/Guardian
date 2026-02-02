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
} from "@/components/ui/sidebar";
import {
  Home,
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
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "../ui/tooltip";

const operationalLinks = [
  { href: "/dashboard/optimizer", label: "Otimizador de Rotas (IA)", icon: Sparkles },
  { href: "/dashboard/messages", label: "Mensagens", icon: MessageSquare },
  { href: "/dashboard/financial", label: "Financeiro", icon: DollarSign },
  { href: "/dashboard/management/trip-requests", label: "Viagens Avulsas", icon: Route },
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
];


const profileLinks = [
  {
    href: "/driver/route-plan",
    label: "Visão do Motorista",
    icon: Car,
  },
  { href: "/parent/tracking", label: "Visão dos Pais", icon: UserCheck },
  { href: "/assistant/route-plan", label: "Visão do Auxiliar", icon: ClipboardCheck },
];

export function MainSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

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
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" passHref>
              <SidebarMenuButton
                isActive={isActive("/dashboard")}
                tooltip="Dashboard"
              >
                <Home />
                <span className="group-data-[collapsible=icon]:hidden">Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        
        <p className="px-4 text-xs text-muted-foreground mt-3 mb-2 group-data-[collapsible=icon]:hidden">
          Operacional
        </p>
        <SidebarMenu>
          {operationalLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} passHref>
                <SidebarMenuButton
                  variant="ghost"
                  isActive={isActive(link.href)}
                  tooltip={link.label}
                >
                  <link.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <p className="px-4 text-xs text-muted-foreground mt-3 mb-2 group-data-[collapsible=icon]:hidden">
          Cadastros
        </p>
        <SidebarMenu>
          {registrationLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} passHref>
                <SidebarMenuButton
                  variant="ghost"
                  isActive={isActive(link.href)}
                  tooltip={link.label}
                >
                  <link.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <SidebarMenu className="mt-4">
          <p className="px-4 text-xs text-muted-foreground mb-2 group-data-[collapsible=icon]:hidden">
            Outras Visões
          </p>
          {profileLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <Link href={link.href} passHref>
                <SidebarMenuButton
                  isActive={isActive(link.href)}
                  tooltip={link.label}
                  variant="ghost"
                >
                  <link.icon />
                  <span className="group-data-[collapsible=icon]:hidden">{link.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
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
            <p className="text-xs text-muted-foreground">admin@guardian.com</p>
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
