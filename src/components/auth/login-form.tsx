"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Loader2, Shield, Car, Users, ClipboardCheck } from "lucide-react";
import { useAuth, initiateAnonymousSignIn } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { maskCPF, unmask } from "@/lib/masks";
import { useAuthProvider } from "@/hooks/use-auth-provider";
import { useData, useDataCollection, isFirestoreMode } from '@/hooks/use-data';

const formSchema = z.object({
  identifier: z.string().min(1, { message: "Digite seu CPF ou E-mail." }),
  password: z.string().min(4, { message: "A senha/PIN deve ter pelo menos 4 caracteres." }),
  profile: z.enum(["gestor", "motorista", "pai", "monitor"], {
      required_error: "Você precisa selecionar um perfil para entrar."
  }),
});

const profileToMockIdMap = {
    'gestor': 'user-admin-1',
    'motorista': 'user-motorista-4',
    'pai': 'user-pai-1', 
    'monitor': 'user-monitor-1'
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth();
  const { forceScenario } = useData();
  const { login, isLoading } = useAuthProvider();
  const { data: users } = useDataCollection('users');

  useEffect(() => {
    setIsMounted(true);

    // Auto-limpeza silenciosa se houver o parâmetro na URL
    if (typeof window !== 'undefined' && window.location.search.includes('clear-cache')) {
      const performSilentClear = async () => {
        try {
          localStorage.clear();
          sessionStorage.clear();
          if ('caches' in window) {
            const keys = await caches.keys();
            await Promise.all(keys.map(key => caches.delete(key)));
          }
          if ('serviceWorker' in navigator) {
            const regs = await navigator.serviceWorker.getRegistrations();
            await Promise.all(regs.map(reg => reg.unregister()));
          }
        } catch (e) {
          console.error("Erro na auto-limpeza:", e);
        }
        window.location.href = '/login';
      };
      performSilentClear();
      return;
    }

    // Auto-redirecionamento se já houver sessão ativa
    const isExplicitLogout = typeof window !== 'undefined' && (
      window.location.search.includes('logout') || 
      window.location.search.includes('clear-cache')
    );
    if (!isExplicitLogout && typeof window !== 'undefined') {
      const storedUserId = sessionStorage.getItem('mockUserId') || localStorage.getItem('mockUserId');
      const currentUid = auth?.currentUser?.uid || storedUserId;
      if (currentUid && Array.isArray(users)) {
        const matchedUser = users.find((u: any) => u.id === currentUid || u.userId === currentUid);
        if (matchedUser?.profile) {
          switch (matchedUser.profile) {
            case 'motorista': {
              const activeRouteId = sessionStorage.getItem('activeRouteId') || localStorage.getItem('activeRouteId');
              router.replace(activeRouteId ? '/driver/active' : '/driver/route-plan');
              break;
            }
            case 'gestor':
              router.replace('/dashboard');
              break;
            case 'pai':
              router.replace('/parent/tracking');
              break;
            case 'monitor':
              router.replace('/monitor');
              break;
          }
        }
      }
    }
  }, [auth?.currentUser?.uid, users, router]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profile: "gestor",
      identifier: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const res = await login(values.identifier, values.password, values.profile);

    if (res && res.success) {
      const displayName = isFirestoreMode() 
        ? "Usuário" 
        : (res.user?.name || "Usuário");
      
      const activeProfile = res.profile || res.user?.profile || values.profile;
      
      toast({
        title: `Bem-vindo(a), ${displayName}!`,
        description: `Redirecionando para o painel de ${activeProfile}.`
      });

      switch (activeProfile) {
        case "gestor":
          router.push("/dashboard");
          break;
        case "motorista":
          sessionStorage.removeItem('activeRouteId');
          sessionStorage.removeItem('activeShift');
          sessionStorage.removeItem('activeDirection');
          localStorage.removeItem('activeRouteId');
          localStorage.removeItem('activeShift');
          localStorage.removeItem('activeDirection');
          router.push("/driver/route-plan");
          break;
        case "pai":
          router.push("/parent/tracking");
          break;
        case "monitor":
          router.push("/monitor");
          break;
        default:
          router.push("/dashboard");
      }
    }
  }

  const handleQuickLogin = (role: string, userId: string, targetPath: string) => {
    // 1. Aplicar cenário direto no banco
    forceScenario(role === 'monitor' ? 'monitor_em_rota' : 'motorista_inicio');
    
    // 2. Setar o usuário e LIMPAR MEMÓRIA TEMPORÁRIA
    sessionStorage.setItem('mockUserId', userId);
    localStorage.setItem('mockUserId', userId);
    sessionStorage.removeItem('activeRouteId');
    sessionStorage.removeItem('activeShift');
    sessionStorage.removeItem('activeDirection');
    localStorage.removeItem('activeRouteId');
    localStorage.removeItem('activeShift');
    localStorage.removeItem('activeDirection');
    
    toast({
        title: "Acesso Rápido Ativado",
        description: `Entrando como ${role} (Cenário Simulado).`
    });

    // 3. FORÇAR RECARREGAMENTO TOTAL
    window.location.href = targetPath;
  };



  if (!isMounted) {
    return (
      <Card className="w-full max-w-sm border-secondary shadow-lg shadow-primary/10">
        <CardHeader className="h-8" />
        <CardContent className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin h-8 w-8 text-primary/20" />
        </CardContent>
        <CardFooter className="h-8" />
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-sm border-secondary shadow-lg shadow-primary/10">
      <CardHeader />
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             {!isFirestoreMode() && (
               <FormField
                control={form.control}
                name="profile"
                render={({ field }) => (
                  <FormItem className="space-y-3 mb-4">
                    <FormLabel className="text-base font-semibold">Selecione seu perfil (Modo Simulação):</FormLabel>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                     >
                      <div 
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-2 transition-colors",
                          field.value === "gestor" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="gestor" id="gestor" />
                        <Label htmlFor="gestor" className="font-medium flex items-center gap-2 cursor-pointer flex-1 text-sm py-1">
                          <Shield className="h-4 w-4 shrink-0 text-primary"/> 
                          <span>Gestor</span>
                        </Label>
                      </div>

                      <div 
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-2 transition-colors",
                          field.value === "motorista" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="motorista" id="motorista" />
                        <Label htmlFor="motorista" className="font-medium flex items-center gap-2 cursor-pointer flex-1 text-sm py-1">
                          <Car className="h-4 w-4 shrink-0 text-primary"/> 
                          <span className="truncate">Motorista</span>
                        </Label>
                      </div>

                      <div 
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-2 transition-colors",
                          field.value === "pai" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="pai" id="pai" />
                        <Label htmlFor="pai" className="font-medium flex items-center gap-2 cursor-pointer flex-1 text-sm py-1">
                          <Users className="h-4 w-4 shrink-0 text-primary"/> 
                          <span>Pais</span>
                        </Label>
                      </div>

                      <div 
                        className={cn(
                          "flex items-center space-x-2 rounded-md border p-2 transition-colors",
                          field.value === "monitor" ? "border-primary bg-primary/5 shadow-sm" : "border-border"
                        )}
                      >
                        <RadioGroupItem value="monitor" id="monitor" />
                        <Label htmlFor="monitor" className="font-medium flex items-center gap-2 cursor-pointer flex-1 text-sm py-1">
                           <ClipboardCheck className="h-4 w-4 shrink-0 text-primary"/> 
                           <span className="truncate">Monitor</span>
                        </Label>
                      </div>
                    </RadioGroup>
                    <FormMessage />
                  </FormItem>
                )}
              />
             )}

            <div className="space-y-4 pt-2">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF ou E-mail</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="000.000.000-00 ou email@exemplo.com" 
                        {...field} 
                        onChange={(e) => {
                          const val = e.target.value;
                          const hasLettersOrAt = /[a-zA-Z]/.test(val) || val.includes('@');
                          if (hasLettersOrAt) {
                            field.onChange(val);
                          } else {
                            field.onChange(maskCPF(val));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {form.watch("identifier").includes('@') ? "Senha" : "PIN (4-6 dígitos)"}
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="••••••" 
                        {...field} 
                        maxLength={form.watch("identifier").includes('@') ? 32 : 6}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Entrar no Sistema"
              )}
            </Button>
          </form>
        </Form>


      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center space-y-3">
        {isFirestoreMode() && (
          <div className="w-full text-center pb-2 border-b border-secondary/40">
            <button
              type="button"
              onClick={async () => {
                if (confirm("Deseja forçar a atualização total do aplicativo? Isso limpará caches e arquivos temporários antigos do seu celular.")) {
                  localStorage.clear();
                  sessionStorage.clear();
                  if ('caches' in window) {
                    try {
                      const keys = await caches.keys();
                      await Promise.all(keys.map(key => caches.delete(key)));
                    } catch (e) {}
                  }
                  if ('serviceWorker' in navigator) {
                    try {
                      const regs = await navigator.serviceWorker.getRegistrations();
                      await Promise.all(regs.map(reg => reg.unregister()));
                    } catch (e) {}
                  }
                  window.location.reload();
                }
              }}
              className="text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors underline decoration-dotted uppercase tracking-wider"
            >
              Problemas no celular? Limpar cache e atualizar
            </button>
          </div>
        )}
        {!isFirestoreMode() ? (
          <p className="text-xs text-center text-muted-foreground px-2">
            Selecione o perfil desejado para acessar a demonstração interativa.
          </p>
        ) : (
          <>
            <p className="text-sm text-center text-muted-foreground px-2">
              Ainda não tem conta no Guardian?
            </p>
            <Button variant="link" className="h-auto p-0 text-primary font-semibold" onClick={() => router.push('/signup')}>
              Cadastre-se agora
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
