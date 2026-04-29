
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
import Link from 'next/link';
import { SafeComponent } from '@/components/shared/safe-component';
import { safeString, safeArray } from '@/lib/safe-render';
import { SafeRow } from '@/components/shared/safe-table';


type FeedItem = {
    id: string;
    type: 'route' | 'intelligence' | 'incident' | 'system';
    title: string;
    description: string;
    timestamp: string;
    icon: React.ReactNode;
    color: string;
    severity?: string;
};

export function OperationalFeed() {
    return (
        <SafeComponent name="OperationalFeed">
            <OperationalFeedContent />
        </SafeComponent>
    );
}

function OperationalFeedContent() {
    const { data: incidents } = useMockCollection('incidents');
    const { addDoc } = useMockData();
    const { toast } = useToast();

    const handleSimulateEvent = () => {
        const now = new Date().toISOString();
        
        // 1. Simulação de Logística (Falta de Aluno)
        (addDoc as any)('incidents', {
            category: 'Smart: Aluno Ausente',
            description: 'Aluno Enzo Pereira (Falta) removido da Rota 01. Itinerário recalculado com economia de 1.2km.',
            severity: 'Baixa',
            reporter: 'Guardian System',
            timestamp: now,
        });

        // 2. Simulação de Relato do Motorista (Incidente)
        setTimeout(() => {
            (addDoc as any)('incidents', {
                category: 'Relato: Trânsito Intenso',
                description: 'Motorista Juliano Castro reportou lentidão na Av. Paulista. Atraso estimado de 5 minutos.',
                severity: 'Média',
                reporter: 'Juliano Castro',
                timestamp: now,
                location: { lat: -23.5650, lng: -46.6520 }
            });
        }, 300);

        toast({
            title: "Simulação Ativada",
            description: "Eventos de Logística e Motorista injetados no feed."
        });
    };

    const feedItems = useMemo<FeedItem[]>(() => {
        const items: FeedItem[] = [];

        const list = safeArray(incidents);
        if (list.length > 0) {
            list.forEach((inc: any) => {
                const isSmart = safeString(inc.reporter) === 'Guardian System';
                items.push({
                    id: safeString(inc.id, Math.random().toString()),
                    type: isSmart ? 'intelligence' : 'incident',
                    title: safeString(inc.category, 'Evento'),
                    description: safeString(inc.description),
                    timestamp: safeString(inc.timestamp, new Date().toISOString()),
                    icon: isSmart ? <Sparkles className="h-4 w-4" /> : <Siren className="h-4 w-4" />,
                    color: isSmart ? 'text-primary bg-primary/10 border-primary/20' : 'text-destructive bg-destructive/10 border-destructive/20',
                    severity: inc.severity as any
                });
            });
        }


        const now = new Date();
        const hourAgo = new Date(now.getTime() - 60 * 60000).toISOString();

        if (items.length === 0) {
            items.push({
                id: 'route-static-1',
                type: 'route',
                title: 'Viagem Iniciada',
                description: 'Juliano Castro iniciou a Rota 01 - Manhã.',
                timestamp: hourAgo,
                icon: <Bus className="h-4 w-4" />,
                color: 'text-blue-500 bg-blue-500/10 border-blue-500/20'
            });
        }

        return [...items].sort((a, b) => new Date(safeString(b.timestamp)).getTime() - new Date(safeString(a.timestamp)).getTime());

    }, [incidents]);

    return (
        <Card className="h-full border-secondary overflow-hidden flex flex-col min-h-[300px] shadow-lg">
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
                            title="Simular Logística" 
                            onClick={(e) => {
                                e.preventDefault();
                                handleSimulateEvent();
                            }}
                        >
                            <Zap className="h-4 w-4 fill-current" />
                        </Button>
                        <Badge variant="outline" className="text-[10px] font-black border-primary text-primary animate-pulse bg-primary/5">LIVE</Badge>
                    </div>
                </div>
                <CardDescription className="text-xs uppercase font-bold tracking-tight opacity-70">Monitoramento da Frota</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                {safeArray(feedItems).length > 0 ? (
                    <div className="divide-y divide-border">
                        {safeArray(feedItems).slice(0, 10).map((item: any) => (
                            <SafeRow key={item.id} name={`FeedItem-${item.id}`}>
                                <div className="p-4 hover:bg-muted/30 transition-colors group animate-in fade-in slide-in-from-top-2 duration-500">
                                    <div className="flex gap-3">
                                        <div className={`mt-0.5 p-2 rounded-full border h-fit shrink-0 ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="space-y-1 min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-sm font-bold truncate uppercase tracking-tight">{safeString(item.title)}</p>
                                                <span className="text-[9px] text-muted-foreground whitespace-nowrap font-black uppercase">
                                                    {(() => {
                                                        try {
                                                            const date = new Date(item.timestamp);
                                                            if (isNaN(date.getTime())) return 'H/N';
                                                            return format(date, 'HH:mm', { locale: ptBR });
                                                        } catch (e) {
                                                            return 'H/N';
                                                        }
                                                    })()}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                                                {safeString(item.description)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SafeRow>
                        ))}
                    </div>

                ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest text-[10px]">Aguardando eventos...</p>
                    </div>
                )}
            </CardContent>
            <div className="p-3 border-t bg-muted/10 text-center">
                <Button asChild variant="ghost" size="sm" className="text-[10px] uppercase font-black tracking-[0.2em] text-primary h-8 w-full">
                    <Link href="/dashboard/operational-history">
                        Histórico Completo <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
