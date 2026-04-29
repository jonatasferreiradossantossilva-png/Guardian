
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Siren, Clock, ArrowLeft, Wrench, ShieldCheck, Loader2 } from 'lucide-react';
import { useMockCollection } from '@/hooks/use-mock-data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type FeedItem = {
    id: string;
    type: 'intelligence' | 'incident' | 'route' | 'maintenance' | 'system';
    title: string;
    description: string;
    timestamp: string;
    icon: React.ReactNode;
    color: string;
    severity?: 'Baixa' | 'Média' | 'Alta' | 'Crítica';
};

export default function OperationalHistoryPage() {
    const { data: incidents, isLoading } = useMockCollection('incidents');

    const feedItems = useMemo<FeedItem[]>(() => {
        const items: FeedItem[] = [];

        if (incidents) {
            incidents.forEach((inc: any) => {
                const isSmart = inc.reporter === 'Guardian System';
                items.push({
                    id: inc.id,
                    type: isSmart ? 'intelligence' : 'incident',
                    title: inc.category,
                    description: inc.description,
                    timestamp: inc.timestamp,
                    icon: isSmart ? <Sparkles className="h-4 w-4" /> : <Siren className="h-4 w-4" />,
                    color: isSmart ? 'text-primary bg-primary/10 border-primary/20' : 'text-destructive bg-destructive/10 border-destructive/20',
                    severity: inc.severity as any
                });
            });
        }

        const now = new Date();
        
        items.push({
            id: 'h-1',
            type: 'maintenance',
            title: 'Manutenção Preditiva',
            description: 'Veículo Mercedes Sprinter (BRA2E19) atingiu o limite de km. Agendamento sugerido.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 5).toISOString(),
            icon: <Wrench className="h-4 w-4" />,
            color: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
            severity: 'Média'
        });

        items.push({
            id: 'h-2',
            type: 'system',
            title: 'Backup de Telemetria',
            description: 'Sincronização de dados de GPS concluída.',
            timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 12).toISOString(),
            icon: <ShieldCheck className="h-4 w-4" />,
            color: 'text-green-500 bg-green-500/10 border-green-500/20'
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase italic">Histórico Operacional</h1>
                    <p className="text-muted-foreground text-sm">Auditoria completa de eventos e logística da frota.</p>
                </div>
            </div>

            <Card className="border-secondary shadow-lg">
                <CardHeader className="bg-muted/10 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Log em Tempo Real
                            </CardTitle>
                            <CardDescription>Eventos registrados nas últimas 24 horas.</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-background">Total: {feedItems.length} registros</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-20 text-center">
                            <Loader2 className="animate-spin h-8 w-8 mx-auto text-primary" />
                        </div>
                    ) : feedItems.length > 0 ? (
                        <div className="divide-y divide-border">
                            {feedItems.map((item) => (
                                <div key={item.id} className="p-6 hover:bg-muted/30 transition-colors">
                                    <div className="flex gap-4">
                                        <div className={`p-3 rounded-full border h-fit shrink-0 ${item.color}`}>
                                            {item.icon}
                                        </div>
                                        <div className="space-y-1 flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <p className="font-bold text-base truncate uppercase tracking-tighter italic">{item.title}</p>
                                                    {item.severity && (
                                                        <Badge 
                                                            variant={item.severity === 'Crítica' ? 'destructive' : 'secondary'} 
                                                            className={cn(
                                                                "text-[9px] h-4 font-black uppercase",
                                                                item.severity === 'Alta' && "bg-orange-500 text-white border-none",
                                                                item.severity === 'Baixa' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                                                            )}
                                                        >
                                                            {item.severity}
                                                        </Badge>
                                                    )}
                                                    {item.type === 'intelligence' && (
                                                        <Badge variant="outline" className="text-[9px] h-4 border-primary text-primary font-black uppercase italic">
                                                            GUARDIAN SYSTEM
                                                        </Badge>
                                                    )}
                                                </div>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase whitespace-nowrap">
                                                    {format(new Date(item.timestamp), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                                </span>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed max-w-3xl">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-20 text-center text-muted-foreground">Nenhum evento registrado.</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
