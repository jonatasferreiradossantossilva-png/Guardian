"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { optimizeRoute } from "@/ai/flows/optimize-route-ai-assistant";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Loader2, Sparkles } from "lucide-react";

const routeSchema = z.object({
  currentRoute: z.string().min(10, "Descreva a rota atual."),
  trafficConditions: z.string().min(10, "Descreva as condições de trânsito."),
  reportedIncidents: z.string().optional(),
});

export default function RoutesPage() {
  const [optimizationResult, setOptimizationResult] = useState<{ optimizedRoute: string; summary: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof routeSchema>>({
    resolver: zodResolver(routeSchema),
    defaultValues: {
      currentRoute: "Escola A -> Rua das Flores, 123 -> Av. Brasil, 456 -> Rua da Paz, 789 -> Escola B",
      trafficConditions: "Trânsito moderado na Av. Brasil, restante fluindo bem.",
      reportedIncidents: "Acidente na Rua da Paz, via parcialmente bloqueada.",
    },
  });

  async function onSubmit(values: z.infer<typeof routeSchema>) {
    setIsLoading(true);
    setOptimizationResult(null);
    try {
      const result = await optimizeRoute({ ...values, reportedIncidents: values.reportedIncidents || "Nenhum" });
      setOptimizationResult(result);
    } catch (error) {
      console.error("Failed to optimize route:", error);
      // Handle error display in UI
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Otimização de Rota com IA</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Otimizar Rota</CardTitle>
            <CardDescription>
              Use IA para encontrar a rota mais eficiente com base nas condições atuais.
            </CardDescription>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="currentRoute"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rota Atual</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Ponto A -> Ponto B -> Ponto C" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="trafficConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Condições de Trânsito</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Trânsito intenso na Av. Principal" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="reportedIncidents"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incidentes Reportados</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ex: Acidente na Rua X" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                  Otimizar com IA
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rota Otimizada</CardTitle>
            <CardDescription>
              Sugestão da IA para uma viagem mais rápida e segura.
            </CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {isLoading && (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {optimizationResult ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-2">Novo Trajeto</h3>
                  <p className="text-sm p-4 bg-secondary rounded-md whitespace-pre-wrap">{optimizationResult.optimizedRoute}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Resumo das Alterações</h3>
                  <p className="text-sm p-4 bg-secondary rounded-md whitespace-pre-wrap">{optimizationResult.summary}</p>
                </div>
                <div className="flex items-center justify-end text-xs text-muted-foreground gap-1 pt-2 border-t border-secondary">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Gerado com Inteligência Artificial</span>
                 </div>
              </div>
            ) : (
                !isLoading && <p className="text-muted-foreground text-center pt-16">O resultado da otimização aparecerá aqui.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
