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
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const formSchema = z.object({
  email: z.string().email({
    message: "Por favor, insira um email válido.",
  }),
  password: z.string().min(6, {
    message: "A senha deve ter pelo menos 6 caracteres.",
  }),
});

type UserRole = "admin" | "driver" | "parent";

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<UserRole>("admin");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "usuario@exemplo.com",
      password: "senha123",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    // Simulate API call
    setIsLoading(true);
    console.log("Login values:", values, "Role:", role);
    setTimeout(() => {
      setIsLoading(false);
      // On successful login, redirect based on role
      switch (role) {
        case "admin":
          router.push("/dashboard");
          break;
        case "driver":
          router.push("/driver/route-plan");
          break;
        case "parent":
          router.push("/parent/tracking");
          break;
        default:
          router.push("/dashboard");
      }
    }, 1500);
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
            <div className="space-y-3">
              <FormLabel>Entrar como</FormLabel>
              <RadioGroup
                defaultValue="admin"
                className="flex pt-2 space-x-4"
                onValueChange={(value) => setRole(value as UserRole)}
                disabled={isLoading}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Admin</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="driver" id="driver" />
                  <Label htmlFor="driver">Motorista</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent">Pais</Label>
                </div>
              </RadioGroup>
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
      <CardFooter className="flex justify-center">
        <Button variant="link" size="sm" className="text-muted-foreground">
          Esqueceu sua senha?
        </Button>
      </CardFooter>
    </Card>
  );
}
