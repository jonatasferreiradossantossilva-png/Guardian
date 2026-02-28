'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Sparkles, TrendingDown, Clock, Leaf, Zap, ShieldCheck, ArrowDownRight, Gauge, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useMockCollection } from '@/hooks/use-mock-data';
import { cn } from '@/lib/utils';

const ecoData = [
  { day: 'Seg', planejado: 42, real: 38 },
  { day: 'Ter', planejado: 45, real: 40 },
  { day: 'Qua', planejado: 40, real: 42 }, // Desvio
  { day: 'Qui', planejado: 48, real: 39 },
  { day: 'Sex', planejado: 44, real: 37 },
];

const driverPerformance = [
  { name: 'Juliano C.', score: 98, savings: '12%', status: 'Excelente' },
  { name: 'Mariana C.', score: 92, savings: '8%', status: 'Bom' },
  { name: 'Roberto A.', score: 85, savings: '5%', status: 'Média' },
  { name: 'Beatriz S.', score: 78, savings: '-2%', status: 'Atenção' },
];

const chartConfig = {
  planejado: { label: "KM Teórico", color: "hsl(var(--muted))" },
  real: { label: "KM Percorrido", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function PerformancePage() {
  const { data: vehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles');
  
  const maintenanceAlerts = useMemo(() => {
    if (!vehicles) return [];
    
    return vehicles
      .filter(v => v.active)
      .map(v => {
        const kmSinceLast = (v.currentOdometer || 0) - (v.lastMaintenanceOdometer || 0);
        const remaining = (v.maintenanceInterval || 10000) - kmSinceLast;
        
        return {
            id: v.id,
            model: v.model,
            plate: v.licensePlate,
            remaining,
            isUrgent: remaining < 1000
        };
      })
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 3);
  }, [vehicles]);

  const totalSavings = useMemo(() => "R$ 1.240,00", []);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance & Inteligência</h1>
        <p className="text-muted-foreground">Compare a eficiência da IA com a operação real da frota.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Economia Estimada" 
          value={totalSavings} 
          subtitle="Redução de custos este mês" 
          icon={<TrendingDown className="text-green-500" />} 
          badge="ROI Positivo"
        />
        <MetricCard 
          title="Otimização de KM" 
          value="-14.2%" 
          subtitle="Percorrido vs. Manual" 
          icon={<Leaf className="text-primary" />} 
          badge="Eco-friendly"
        />
        <MetricCard 
          title="Tempo em Trânsito" 
          value="-8h / semana" 
          subtitle="Média por veículo" 
          icon={<Clock className="text-orange-500" />} 
          badge="Agilidade"
        />
        <MetricCard 
          title="Adesão à Rota" 
          value="94.5%" 
          subtitle="Conformidade dos motoristas" 
          icon={<ShieldCheck className="text-blue-500" />} 
          badge="Segurança"
        />
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
        {/* Gráfico de Comparação KM */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Eficiência de Roteirização</CardTitle>
                <CardDescription>Comparativo de KM Planejado (IA) vs. KM Real (GPS)</CardDescription>
              </div>
              <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ecoData}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="planejado" fill="var(--color-planejado)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="real" fill="var(--color-real)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Ranking de Motoristas */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Eficiência</CardTitle>
            <CardDescription>Motoristas que mais economizam</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {driverPerformance.map((d, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-xs font-bold">{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium">{d.name}</p>
                    <Badge variant="outline" className="text-[10px] py-0 h-4">{d.status}</Badge>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-primary">{d.savings}</p>
                  <p className="text-[10px] text-muted-foreground">Score: {d.score}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
         {/* Insight de Inteligência */}
         <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-primary" />
                    Insight da Inteligência Guardian
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm leading-relaxed">
                    Sua frota percorreu <strong>215km menos</strong> este mês graças à re-otimização em tempo real. 
                    O motorista <strong>Juliano Castro</strong> é o destaque em conformidade de rota. 
                    <br/><br/>
                    <span className="text-muted-foreground italic">Sugestão: As rotas de quarta-feira apresentam desvios frequentes. A IA recomenda revisar os pontos de parada da Zona Sul para evitar obras recorrentes.</span>
                </p>
            </CardContent>
         </Card>

         {/* Alertas de Manutenção Preventiva baseados em KM Real */}
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Gauge className="h-5 w-5 text-muted-foreground" />
                    Manutenção Predictiva (Baseada no KM Real)
                </CardTitle>
                <CardDescription>Alertas gerados automaticamente pelo uso dinâmico da frota.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {areVehiclesLoading ? (
                    <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin" /></div>
                ) : maintenanceAlerts.length > 0 ? (
                    maintenanceAlerts.map((alert) => (
                        <div key={alert.id} className={cn(
                            "flex items-center justify-between p-3 rounded-md border",
                            alert.isUrgent ? "border-destructive/20 bg-destructive/5" : "border-muted bg-muted/20"
                        )}>
                            <div className="flex items-center gap-3 text-sm">
                                <Badge variant={alert.isUrgent ? "destructive" : "secondary"}>
                                    {alert.isUrgent ? "Urgente" : "Em breve"}
                                </Badge>
                                <span>{alert.model} ({alert.plate}): Revisão em {alert.remaining}km</span>
                            </div>
                            {alert.isUrgent && <ArrowDownRight className="h-4 w-4 text-destructive" />}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">Nenhum veículo com manutenção próxima.</p>
                )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon, badge }: { title: string, value: string, subtitle: string, icon: React.ReactNode, badge: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        <Badge variant="secondary" className="mt-3 text-[10px] px-1.5 py-0">{badge}</Badge>
      </CardContent>
    </Card>
  );
}
