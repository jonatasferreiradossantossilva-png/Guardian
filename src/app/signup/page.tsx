"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { 
  Shield, 
  Car, 
  Loader2, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  UserCircle,
  Smartphone,
  Check
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/hooks/use-mock-data";
import { maskCPF, maskPhone, unmask } from "@/lib/masks";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  name: z.string().min(3, "Nome muito curto"),
  email: z.string().email("E-mail inválido"),
  phone: z.string().min(10, "Telefone inválido"),
  cpf: z.string().min(11, "CPF inválido"),
  pin: z.string().min(4, "O PIN deve ter entre 4 e 6 dígitos").max(6),
  type: z.enum(["empresa", "autonomo"]),
});

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"choice" | "data" | "activation" | "success">("choice");
  const [routeName, setRouteName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [vanCapacity, setVanCapacity] = useState("15");
  const [mainSchool, setMainSchool] = useState("");
  const { addDoc } = useMockData();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "empresa",
      name: "",
      email: "",
      phone: "",
      cpf: "",
      pin: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    
    try {
      const userId = `user-gestor-${Date.now()}`;
      
      // 1. Criar o Usuário Gestor
      (addDoc as any)('users', {
        id: userId,
        name: values.name,
        email: values.email,
        cpf: values.cpf,
        pin: values.pin,
        profile: 'gestor',
        active: true
      });
      
      const firstName = values.name.split(' ')[0];
      setCompanyName(`Transportes ${firstName}`);
      setRouteName(`Rota Colégio - ${firstName}`);

      if (values.type === 'autonomo') {
        setStep("activation");
      } else {
        setStep("success");
        sessionStorage.setItem('mockUserId', userId);
      }
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: "Ocorreu um problema, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {step === "choice" && (
          <Card className="border-primary/20 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-2 border-primary/20">
                <Shield className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Seja bem-vindo ao Guardian</CardTitle>
              <CardDescription>
                Como você pretende utilizar a nossa plataforma?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup 
                defaultValue="empresa" 
                onValueChange={(val) => form.setValue("type", val as any)}
                className="grid grid-cols-1 gap-4"
              >
                <Label
                  htmlFor="empresa"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 p-6 cursor-pointer transition-all hover:bg-primary/5",
                    form.watch("type") === "empresa" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <RadioGroupItem value="empresa" id="empresa" className="sr-only" />
                  <Building2 className={cn("h-8 w-8 mb-2", form.watch("type") === "empresa" ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="font-bold text-lg">Gestor de Frota</p>
                    <p className="text-xs text-muted-foreground">Tenho uma empresa com vários motoristas e vans.</p>
                  </div>
                  {form.watch("type") === "empresa" && <CheckCircle2 className="h-5 w-5 text-primary absolute top-2 right-2" />}
                </Label>

                <Label
                  htmlFor="autonomo"
                  className={cn(
                    "flex flex-col items-center justify-between rounded-xl border-2 p-6 cursor-pointer transition-all hover:bg-primary/5 relative",
                    form.watch("type") === "autonomo" ? "border-primary bg-primary/5" : "border-muted"
                  )}
                >
                  <RadioGroupItem value="autonomo" id="autonomo" className="sr-only" />
                  <Car className={cn("h-8 w-8 mb-2", form.watch("type") === "autonomo" ? "text-primary" : "text-muted-foreground")} />
                  <div className="text-center">
                    <p className="font-bold text-lg">Autônomo</p>
                    <p className="text-xs text-muted-foreground">Sou o dono e também o motorista da minha van.</p>
                  </div>
                  {form.watch("type") === "autonomo" && <CheckCircle2 className="h-5 w-5 text-primary absolute top-2 right-2" />}
                </Label>
              </RadioGroup>
            </CardContent>
            <CardFooter>
              <Button className="w-full h-12 text-lg font-bold" onClick={() => setStep("data")}>
                Próximo Passo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === "data" && (
          <Card className="border-primary/20 shadow-2xl animate-in slide-in-from-right duration-500">
            <CardHeader>
              <CardTitle>Dados do Gestor</CardTitle>
              <CardDescription>Quase lá! Precisamos de alguns dados para criar seu acesso.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
                        <FormControl>
                          <Input placeholder="Seu nome" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="000.000.000-00" 
                              {...field} 
                              onChange={(e) => field.onChange(maskCPF(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN (6 dígitos)</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="000000" 
                              maxLength={6}
                              {...field} 
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail Corporativo</FormLabel>
                        <FormControl>
                          <Input placeholder="email@exemplo.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
                            {...field} 
                            onChange={(e) => field.onChange(maskPhone(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="pt-4 flex gap-2">
                    <Button type="button" variant="ghost" onClick={() => setStep("choice")}>Voltar</Button>
                    <Button type="submit" className="flex-1 h-12 font-bold" disabled={isLoading}>
                      {isLoading ? <Loader2 className="animate-spin" /> : "Criar minha Conta"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        )}

        {step === "activation" && (
           <Card className="border-primary/20 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
             <CardHeader className="text-center">
               <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                 <Shield className="text-primary h-6 w-6" />
               </div>
               <CardTitle>Ativação do Negócio</CardTitle>
               <CardDescription>Vamos configurar sua primeira rota e seu perfil profissional.</CardDescription>
             </CardHeader>
             <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nome da sua Transportadora</Label>
                    <Input 
                      id="companyName" 
                      value={companyName} 
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Van do Tio Carlão"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="routeName">Nome da sua Rota Principal</Label>
                    <Input 
                      id="routeName" 
                      value={routeName} 
                      onChange={(e) => setRouteName(e.target.value)}
                      placeholder="Ex: Rota Colégio Amos - Manhã"
                    />
                    <p className="text-[10px] text-muted-foreground italic">Dica: Os pais verão este nome ao acompanhar a van.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vanCapacity">Capacidade (Lugares)</Label>
                      <Input 
                        id="vanCapacity" 
                        type="number"
                        value={vanCapacity} 
                        onChange={(e) => setVanCapacity(e.target.value)}
                        placeholder="15"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mainSchool">Escola Principal</Label>
                      <Input 
                        id="mainSchool" 
                        value={mainSchool} 
                        onChange={(e) => setMainSchool(e.target.value)}
                        placeholder="Ex: Colégio Amos"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-primary/5 rounded-xl border border-dashed text-[11px] leading-snug flex items-center gap-2">
                   <Shield className="h-4 w-4 text-primary shrink-0" />
                   <p>Seus contratos serão gerados automaticamente como <strong>{companyName}</strong>.</p>
                </div>
             </CardContent>
             <CardFooter>
               <Button className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700" onClick={() => {
                  const values = form.getValues();
                  const userIdArr = (JSON.parse(localStorage.getItem('mockDB_users') || '[]'));
                  const userId = userIdArr[userIdArr.length - 1]?.id;

                  // 1. Criar Empresa
                  const compId = `comp-${Date.now()}`;
                  (addDoc as any)('company_profile', {
                      id: compId,
                      companyName: companyName,
                      email: values.email,
                      phone: values.phone,
                      active: true
                  });

                  // 2. Criar Motorista
                  const driverId = `driver-${Date.now()}`;
                  (addDoc as any)('drivers', {
                      id: driverId,
                      userId: userId,
                      name: values.name,
                      status: 'inativo',
                      active: true,
                      latitude: -23.5505,
                      longitude: -46.6333
                  });

                  // 3. Criar Rota Nomeada
                  (addDoc as any)('routes', {
                      id: `route-${Date.now()}`,
                      name: routeName,
                      driverId: driverId,
                      schoolName: mainSchool,
                      capacity: parseInt(vanCapacity) || 15,
                      studentIds: [],
                      active: false,
                      shift: 'Manhã'
                  });

                  setStep("success");
                  sessionStorage.setItem('mockUserId', userId);
                  toast({
                    title: "Ativação concluída!",
                    description: "Sua rota e empresa foram configuradas com sucesso.",
                  });
               }}>
                 Concluir e Começar
                 <ArrowRight className="ml-2 h-5 w-5" />
               </Button>
             </CardFooter>
           </Card>
        )}

        {step === "success" && (
          <Card className="border-green-500/20 shadow-2xl text-center p-8 animate-in zoom-in-95 duration-500">
            <CardContent className="space-y-6">
              <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20 mb-4">
                <CheckCircle2 className="text-green-500 h-10 w-10" />
              </div>
              <h2 className="text-3xl font-bold">Pronto, {form.watch("name").split(' ')[0]}!</h2>
              <p className="text-muted-foreground">
                Sua conta foi criada com sucesso. {form.watch("type") === "autonomo" ? "Já configuramos sua van e seu perfil de motorista." : "Agora você pode começar a cadastrar sua frota."}
              </p>
              
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 text-left space-y-2">
                 <p className="text-sm font-bold flex items-center gap-2"><Smartphone className="h-4 w-4" /> Seus dados de acesso:</p>
                 <div className="text-xs space-y-1">
                    <p><strong>CPF:</strong> {form.watch("cpf")}</p>
                    <p><strong>PIN:</strong> •••••• (o que você definiu)</p>
                 </div>
              </div>

              <Button asChild className="w-full h-14 text-lg font-bold" onClick={() => router.push("/dashboard")}>
                <div className="flex items-center gap-2">
                  Acessar Painel Agora
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
