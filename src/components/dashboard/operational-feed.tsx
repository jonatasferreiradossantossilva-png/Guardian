'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Sparkles, Siren, Clock, Activity, ArrowRight, Zap } from 'lucide-react';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type FeedItem = {
    id: string;
    type: 'route' | 'intelligence' | 'incident' | 'system';
    title: string;
    description: string;
    timestamp: string;
    icon: React.ReactNode;
    color: string;
};

export function OperationalFeed() {
    const { data: incidents } = useMockCollection('incidents');
    const { addDoc } = useMockData();
    const { toast } = useToast();

    const handleSimulateEvent = () => {
        addDoc('incidents', {
            category: 'IA: Rota Reotimizada',
            description: 'Inteligência detectou ausência. Rota recalculada com economia de 1.4km.',
            severity: 'Baixa',
            reporter: 'Guardian Intelligence',
            timestamp: new Date().toISOString(),
            location: { lat: -23.55, lng: -46.63 }
        });
        toast({
            title: "Simulação Ativada",
            description: "Um novo evento de inteligência foi injetado no feed."
        });
    };

    const feedItems = useMemo<FeedItem[]>(() => {
        const items: FeedItem[] = [];

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
                    color: isAI ? 'text-primary bg-primary/10 border-primary/20' : 'text-destructive bg-destructive/10 border-destructive/20'
                });
            });
        }

        // Mock fixo para garantir que o feed nunca pareça vazio no início
        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60000).toISOString();

        items.push({
            id: 'route-static-1',
            type: 'route',
            title: 'Viagem Iniciada',
            description: 'Juliano Castro iniciou a Rota 01 - Manhã.',
            timestamp: hourAgo,
            icon: <Bus className="h-4 w-4" />,
            color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
        });

        return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [incidents]);

    return (
        <Card className="h-full border-secondary overflow-hidden flex flex-col min-h-[300px]">
            <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Acontecendo Agora
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary hover:bg-primary/10" 
                            title="Simular Inteligência" 
                            onClick={(e) => {
                                e.preventDefault();
                                handleSimulateEvent();
                            }}
                        >
                            <Zap className="h-4 w-4" />
                        </Button>
                        <Badge variant="outline" className="text-[10px] font-bold">LIVE</Badge>
                    </div>
                </div>
                <CardDescription className="text-xs">Eventos da frota e inteligência da IA.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                {feedItems.length > 0 ? (
                    <div className="divide-y divide-border">
                        {feedItems.map((item) => (
                            <div key={item.id} className="p-4 hover:bg-muted/30 transition-colors group">
                                <div className="flex gap-3">
                                    <div className={`mt-0.5 p-2 rounded-full border h-fit shrink-0 ${item.color}`}>
                                        {item.icon}
                                    </div>
                                    <div className="space-y-1 min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold truncate">{item.title}</p>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {format(new Date(item.timestamp), 'HH:mm', { locale: ptBR })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                            {item.description}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">Aguardando eventos...</p>
                    </div>
                )}
            </CardContent>
            <div className="p-3 border-t bg-muted/10 text-center">
                <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-primary h-7">
                    Ver Histórico Completo <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
            </div>
        </Card>
    );
}
