"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Shield, Car, Users, ClipboardCheck } from "lucide-react";
import { useAuth, initiateAnonymousSignIn } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  profile: z.enum(["gestor", "motorista", "pai", "monitor"], {
      required_error: "Você precisa selecionar um perfil para entrar."
  }),
});

const profileToMockIdMap = {
    'gestor': 'user-admin-1',
    'motorista': 'user-motorista-4',
    'pai': 'user-pai-3',
    'monitor': 'user-monitor-1'
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      profile: "gestor",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const mockUserId = profileToMockIdMap[values.profile];
    sessionStorage.setItem('mockUserId', mockUserId);

    if (auth) {
      initiateAnonymousSignIn(auth);
    } else {
        console.error("Auth service not available");
        setIsLoading(false);
        return;
    }

    toast({
        title: `Bem-vindo(a)!`,
        description: `Redirecionando para o painel de ${values.profile}.`
    });

    switch (values.profile) {
      case "gestor":
        router.push("/dashboard");
        break;
      case "motorista":
        router.push("/driver/route-plan");
        break;
      case "pai":
        router.push("/parent/tracking");
        break;
      case "monitor":
        router.push("/assistant/route-plan");
        break;
      default:
        router.push("/dashboard");
    }
  }

  return (
    <Card className="w-full max-w-sm border-secondary shadow-lg shadow-primary/10">
      <CardHeader />
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
             <FormField
              control={form.control}
              name="profile"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel className="text-base font-semibold">Selecione seu perfil:</FormLabel>
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
      <CardFooter className="flex justify-center">
        <p className="text-xs text-center text-muted-foreground px-2">
            Selecione o perfil desejado para acessar a demonstração interativa.
        </p>
      </CardFooter>
    </Card>
  );
}