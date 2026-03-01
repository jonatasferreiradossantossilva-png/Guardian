
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Sparkles, TrendingDown, Clock, Leaf, Zap, ShieldCheck, ArrowDownRight, Gauge, Loader2, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMockCollection } from '@/hooks/use-mock-data';
import { cn } from '@/lib/utils';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { MaintenanceForm } from '@/components/dashboard/management/vehicles/maintenance-form';

const chartConfig = {
  planejado: { label: "KM Planejado", color: "hsl(var(--muted))" },
  real: { label: "KM Realizado", color: "hsl(var(--primary))" },
} satisfies ChartConfig;

export default function PerformancePage() {
  const { data: vehicles, isLoading: areVehiclesLoading } = useMockCollection('vehicles');
  const { data: history, isLoading: isHistoryLoading } = useMockCollection('trip_history');
  const [selectedVehicleForMaintenance, setSelectedVehicleForMaintenance] = useState<any>(null);
  
  // Agrega dados do histórico para o gráfico de barras (últimos 5 dias)
  const ecoData = useMemo(() => {
    if (!history) return [];
    
    // Agrupar por data
    const grouped = history.reduce((acc, trip) => {
        const date = trip.date;
        if (!acc[date]) acc[date] = { day: date.split('-').reverse().slice(0,2).reverse().join('/'), planejado: 0, real: 0 };
        acc[date].planejado += trip.plannedKm;
        acc[date].real += trip.actualKm;
        return acc;
    }, {} as Record<string, any>);

    return Object.values(grouped).sort((a,b) => a.day.localeCompare(b.day)).slice(-5);
  }, [history]);

  // Rankings de Motoristas baseados em economia real
  const driverPerformance = useMemo(() => {
    if (!history) return [];
    const drivers = history.reduce((acc, trip) => {
        if (!acc[trip.driverName]) acc[trip.driverName] = { name: trip.driverName, savings: 0, count: 0, score: 0 };
        acc[trip.driverName].savings += trip.savingsKm;
        acc[trip.driverName].count += 1;
        return acc;
    }, {} as Record<string, any>);

    return Object.values(drivers)
        .map(d => ({
            ...d,
            score: Math.min(100, 80 + (d.savings / d.count) * 5),
            savingsPct: ((d.savings / (d.savings + 50)) * 100).toFixed(0) + '%',
            status: d.score > 90 ? 'Excelente' : d.score > 80 ? 'Bom' : 'Média'
        }))
        .sort((a,b) => b.savings - a.savings);
  }, [history]);

  const stats = useMemo(() => {
      if (!history) return { totalFuelSaved: 0, totalKmSaved: 0, efficiency: 0 };
      const fuel = history.reduce((sum, t) => sum + t.fuelSaved, 0);
      const km = history.reduce((sum, t) => sum + t.savingsKm, 0);
      const totalReal = history.reduce((sum, t) => sum + t.actualKm, 0);
      const efficiency = totalReal > 0 ? (km / (totalReal + km)) * 100 : 0;
      return { totalFuelSaved: fuel, totalKmSaved: km, efficiency };
  }, [history]);

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
            currentOdometer: v.currentOdometer,
            isUrgent: remaining < 1000
        };
      })
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 3);
  }, [vehicles]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Performance & Inteligência</h1>
        <p className="text-muted-foreground">Compare a eficiência da IA com a operação real da frota.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Economia Estimada" 
          value={new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(stats.totalFuelSaved)} 
          subtitle="Redução de custos acumulada" 
          icon={<TrendingDown className="text-green-500" />} 
          badge="ROI Positivo"
        />
        <MetricCard 
          title="Otimização de KM" 
          value={stats.efficiency.toFixed(1) + "%"} 
          subtitle={`Economizados ${stats.totalKmSaved.toFixed(1)}km`} 
          icon={<Leaf className="text-primary" />} 
          badge="Eco-friendly"
        />
        <MetricCard 
          title="Tempo em Trânsito" 
          value="-12h / mês" 
          subtitle="Média por veículo" 
          icon={<Clock className="text-orange-500" />} 
          badge="Agilidade"
        />
        <MetricCard 
          title="Adesão à Rota" 
          value="96.2%" 
          subtitle="Conformidade via GPS" 
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
            {ecoData.length > 0 ? (
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
            ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
                    Aguardando dados das primeiras viagens finalizadas...
                </div>
            )}
          </CardContent>
        </Card>

        {/* Ranking de Motoristas */}
        <Card>
          <CardHeader>
            <CardTitle>Ranking de Eficiência</CardTitle>
            <CardDescription>Motoristas que mais economizam</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {driverPerformance.length > 0 ? (
                driverPerformance.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-xs font-bold">{i + 1}</div>
                    <div>
                        <p className="text-sm font-medium">{d.name}</p>
                        <Badge variant="outline" className="text-[10px] py-0 h-4">{d.status}</Badge>
                    </div>
                    </div>
                    <div className="text-right">
                    <p className="text-sm font-bold text-primary">{d.savingsPct}</p>
                    <p className="text-[10px] text-muted-foreground">Score: {d.score.toFixed(0)}</p>
                    </div>
                </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Sem histórico acumulado.</p>
            )}
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
                    Sua frota economizou <strong>{stats.totalKmSaved.toFixed(1)}km</strong> desde que começou a usar o Guardian. 
                    Isso evitou a emissão de aproximadamente <strong>{(stats.totalKmSaved * 0.15).toFixed(1)}kg de CO2</strong>.
                    <br/><br/>
                    <span className="text-muted-foreground italic">Dica: Os desvios diminuíram 8% esta semana. O monitoramento em tempo real está disciplinando a execução das rotas otimizadas pela IA.</span>
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
                                <div>
                                    <p className="font-medium">{alert.model} ({alert.plate})</p>
                                    <p className="text-xs text-muted-foreground">Revisão em {alert.remaining}km</p>
                                </div>
                            </div>
                            <Dialog open={selectedVehicleForMaintenance?.id === alert.id} onOpenChange={(open) => !open && setSelectedVehicleForMaintenance(null)}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedVehicleForMaintenance(alert)}>
                                        <Wrench className="mr-2 h-3 w-3" /> Registrar
                                    </Button>
                                </DialogTrigger>
                                {selectedVehicleForMaintenance && (
                                    <MaintenanceForm 
                                        vehicle={selectedVehicleForMaintenance} 
                                        onFormSubmit={() => setSelectedVehicleForMaintenance(null)}
                                    />
                                )}
                            </Dialog>
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
