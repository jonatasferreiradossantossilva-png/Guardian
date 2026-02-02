"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

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
import { Loader2 } from "lucide-react";
import { useAuth, initiateAnonymousSignIn } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { useMockData } from "@/hooks/use-mock-data";


const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  password: z.string().min(1, {
    message: "A senha é obrigatória.",
  }),
});

// Map specific emails to user profiles for this prototype
const emailToProfileMap = {
    'admin@guardian.com': { profile: 'gestor', name: 'Admin User' },
    'mariana.costa@rotasegura.com': { profile: 'motorista', name: 'Mariana Costa' },
    'ana.pereira@email.com': { profile: 'pai', name: 'Ana Pereira' },
    'fernanda.lima@rotasegura.com': { profile: 'auxiliar', name: 'Fernanda Lima' }
};

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const auth = useAuth();
  const { db } = useMockData();

  const allUsersMap = useMemo(() => {
      if (!db?.users) return new Map();
      return new Map(db.users.map(u => [u.email, u]));
  }, [db]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@guardian.com",
      password: "senha",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    const userProfile = allUsersMap.get(values.email);

    if (!userProfile) {
        toast({
            title: "Usuário não encontrado",
            description: "O e-mail inserido não corresponde a nenhum usuário de teste.",
            variant: "destructive"
        });
        setIsLoading(false);
        return;
    }
    
    // For this prototype, we store the selected mock user ID in session storage
    // to simulate a real user login for each role.
    sessionStorage.setItem('mockUserId', userProfile.id);

    if (auth) {
      // Non-blocking anonymous sign-in. The onAuthStateChanged listener will handle the rest.
      initiateAnonymousSignIn(auth);
    } else {
        console.error("Auth service not available");
        setIsLoading(false);
        return;
    }

    toast({
        title: `Bem-vindo(a), ${userProfile.name}!`,
        description: `Redirecionando para o painel de ${userProfile.profile}.`
    });

    // Redirect immediately. The protected pages will handle the auth state.
    switch (userProfile.profile) {
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
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="seu@email.com"
                      {...field}
                      type="email"
                      disabled={isLoading}
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
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      {...field}
                      type="password"
                      disabled={isLoading}
                    />
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
        <Button variant="link" size="sm" className="text-muted-foreground">
          Esqueceu sua senha?
        </Button>
      </CardFooter>
    </Card>
  );
}
