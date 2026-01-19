"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  FolderKanban,
  ChevronDown,
  MessageSquare,
  DollarSign,
  UserCheck,
  Car,
  ShieldCheck,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Sparkles,
  MessageCircle,
} from "lucide-react";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const managementLinks = [
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
  { href: "/dashboard/management/trip-requests", label: "Viagens Avulsas", icon: Route },
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
  const isManagementActive = managementLinks.some((link) =>
    pathname.startsWith(link.href)
  );

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20 text-primary">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="text-xl font-bold">Rota Segura</h2>
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
                <span>Dashboard</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Collapsible defaultOpen={isManagementActive}>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton
                  className="w-full justify-start"
                  isActive={isManagementActive}
                >
                  <FolderKanban />
                  <span>Gerenciamento</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenu className="pl-6 pt-1">
                  {managementLinks.map((link) => (
                    <SidebarMenuItem key={link.href}>
                      <Link href={link.href} passHref>
                        <SidebarMenuButton
                          variant="ghost"
                          size="sm"
                          isActive={isActive(link.href)}
                        >
                          <link.icon />
                          <span>{link.label}</span>
                        </SidebarMenuButton>
                      </Link>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </Collapsible>
          </SidebarMenuItem>

           <SidebarMenuItem>
            <Link href="/dashboard/optimizer" passHref>
              <SidebarMenuButton
                isActive={isActive("/dashboard/optimizer")}
                tooltip="Otimizador de Rotas (IA)"
              >
                <Sparkles />
                <span>Otimizador (IA)</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/dashboard/messages" passHref>
              <SidebarMenuButton
                isActive={isActive("/dashboard/messages")}
                tooltip="Mensagens"
              >
                <MessageSquare />
                <span>Mensagens</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <Link href="/dashboard/financial" passHref>
              <SidebarMenuButton
                isActive={isActive("/dashboard/financial")}
                tooltip="Financeiro"
              >
                <DollarSign />
                <span>Financeiro</span>
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
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
                  <span>{link.label}</span>
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
            <p className="text-xs text-muted-foreground">admin@rotasegura.com</p>
          </div>
          <Link href="/" className="ml-auto group-data-[collapsible=icon]:hidden">
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

    