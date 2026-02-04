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
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { useState } from "react";
import { Loader2, Shield, Car, Users, ClipboardCheck } from "lucide-react";
import { useAuth, initiateAnonymousSignIn } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const formSchema = z.object({
  email: z.string().optional(),
  password: z.string().optional(),
  profile: z.enum(["gestor", "motorista", "pai", "auxiliar"], {
      required_error: "Você precisa selecionar um perfil para entrar."
  }),
});

// Map profiles to mock user IDs for this prototype
const profileToMockIdMap = {
    'gestor': 'user-admin-1',
    'motorista': 'user-motorista-2', // Default driver for demo
    'pai': 'user-pai-3', // Changed to Carla Dias for contract acceptance simulation
    'auxiliar': 'user-aux-1' // Default assistant for demo
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

    // For this prototype, we store the selected mock user ID in session storage
    // to simulate a real user login for each role.
    sessionStorage.setItem('mockUserId', mockUserId);

    if (auth) {
      // Non-blocking anonymous sign-in. The onAuthStateChanged listener will handle the rest.
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

    // Redirect immediately. The protected pages will handle the auth state.
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
      case "auxiliar":
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
                  <FormLabel>Selecione seu perfil para entrar:</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="gestor" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2"><Shield/> Gestor</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="motorista" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2"><Car/> Motorista</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="pai" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2"><Users/> Pais</FormLabel>
                      </FormItem>
                       <FormItem className="flex items-center space-x-3 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="auxiliar" />
                        </FormControl>
                        <FormLabel className="font-normal flex items-center gap-2"><ClipboardCheck/> Auxiliar</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
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
        <p className="text-xs text-center text-muted-foreground">
            O perfil selecionado determina o acesso para a demonstração.
        </p>
      </CardFooter>
    </Card>
  );
}
