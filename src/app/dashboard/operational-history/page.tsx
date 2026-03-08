'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Sparkles, Siren, Clock, Activity, ArrowLeft, Zap } from 'lucide-react';
import { useMockCollection } from '@/hooks/use-mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function OperationalHistoryPage() {
    const { data: incidents, isLoading } = useMockCollection('incidents');

    const feedItems = useMemo(() => {
        const items: any[] = [];

        if (incidents) {
            incidents.forEach(inc => {
                const isAI = inc.reporter === 'Guardian Intelligence';
                items.push({
                    id: inc.id,
                    type: isAI ? 'intelligence' : 'incident',
                    title: inc.category,
                    description: inc.description,
                    timestamp: inc.timestamp,
                    icon: isAI ? <Sparkles className="h-4 w-4" /> : <Siren className="h-4 w-4" />,
                    color: isAI ? 'text-primary bg-primary/10 border-primary/20' : 'text-destructive bg-destructive/10 border-destructive/20',
                    severity: inc.severity
                });
            });
        }

        // Mock base
        items.push({
            id: 'route-static-1',
            type: 'route',
            title: 'Viagem Iniciada',
            description: 'Juliano Castro iniciou a Rota 01 - Manhã.',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            icon: <Bus className="h-4 w-4" />,
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        });

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [incidents]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon">
                    <Link href="/dashboard"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Histórico Operacional</h1>
                    <p className="text-muted-foreground text-sm">Registro cronológico de todos os eventos da frota.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        Log Completo de Eventos
                    </CardTitle>
                    <CardDescription>Acompanhe incidentes, alertas médicos e decisões da IA.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-10 text-center text-muted-foreground">Carregando logs...</div>
                    ) : feedItems.length > 0 ? (
                        <div className="divide-y divide-border">
                            {feedItems.map((item) => (
                                <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-full border h-fit shrink-0 ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-base">{item.title}</p>
                                                    {item.severity && <Badge variant={item.severity === 'Crítica' ? 'destructive' : 'secondary'} className="text-[9px] h-4">{item.severity}</Badge>}
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium">
                                                    {format(new Date(item.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center text-muted-foreground">Nenhum evento registrado hoje.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
