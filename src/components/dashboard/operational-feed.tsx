'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bus, Sparkles, Siren, Clock, Activity, ArrowRight } from 'lucide-react';
import { useMockCollection } from '@/hooks/use-mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

    const feedItems = useMemo<FeedItem[]>(() => {
        const items: FeedItem[] = [];

        // 1. Adicionar incidentes reais do banco
        incidents?.forEach(inc => {
            items.push({
                id: inc.id,
                type: 'incident',
                title: `Alerta: ${inc.category}`,
                description: `${inc.reporter}: ${inc.description}`,
                timestamp: inc.timestamp,
                icon: <Siren className="h-4 w-4" />,
                color: 'text-destructive bg-destructive/10 border-destructive/20'
            });
        });

        // 2. Mock de eventos de inteligência e operação para o protótipo
        const now = new Date();
        const tenMinAgo = new Date(now.getTime() - 10 * 60000).toISOString();
        const hourAgo = new Date(now.getTime() - 60 * 60000).toISOString();

        items.push({
            id: 'intel-1',
            type: 'intelligence',
            title: 'IA: Rota Reotimizada',
            description: 'Enzo Pereira (Falta) removido da Rota 01. Economia de 1.2km detectada.',
            timestamp: tenMinAgo,
            icon: <Sparkles className="h-4 w-4" />,
            color: 'text-primary bg-primary/10 border-primary/20'
        });

        items.push({
            id: 'route-1',
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
        <Card className="h-full border-secondary overflow-hidden flex flex-col">
            <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Acontecendo Agora
                    </CardTitle>
                    <Badge variant="outline" className="text-[10px] font-bold">LIVE</Badge>
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
                                    <div className="space-y-1 min-w-0">
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
