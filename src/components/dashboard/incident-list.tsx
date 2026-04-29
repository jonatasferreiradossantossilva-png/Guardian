"use client";

import type { Incident } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, Clock, Loader2, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { AiSummaryModal } from "./ai-summary-modal";
import { useMockCollection } from '@/hooks/use-mock-data';
import { useToast } from "@/hooks/use-toast";
import { safeString, safeArray } from '@/lib/safe-render';
import { SafeRow } from '@/components/shared/safe-table';


const severityVariantMap: { [key in Incident['severity']]: "destructive" | "default" | "secondary" | "outline" } = {
    'Crítica': 'destructive',
    'Alta': 'default',
    'Média': 'secondary',
    'Baixa': 'outline'
};

const IncidentListItem = ({ incident, onSummarizeClick, onLocateClick }: { incident: Incident, onSummarizeClick: (incident: Incident) => void, onLocateClick: (incident: Incident) => void }) => {
    const [clientTime, setClientTime] = useState("");

    useEffect(() => {
        try {
            const date = new Date(safeString(incident.timestamp));
            if (isNaN(date.getTime())) {
                setClientTime("--:--");
            } else {
                setClientTime(
                    date.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })
                );
            }
        } catch (e) {
            setClientTime("--:--");
        }
    }, [incident.timestamp]);


    return (
        <div className="p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant={severityVariantMap[safeString(incident.severity) as Incident['severity']] || 'default'}>
                        {safeString(incident.severity, 'Média')}
                    </Badge>
                    <p className="font-semibold text-foreground mt-2">{safeString(incident.category, 'Incidente')}</p>
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onSummarizeClick(incident)}
                        className="p-2 rounded-md hover:bg-primary/20 text-primary transition-colors"
                        title="Resumo Inteligente"
                    >
                        <Bot className="h-5 w-5" />
                    </button>
                     <button
                        onClick={() => onLocateClick(incident)}
                        className="p-2 rounded-md hover:bg-blue-500/20 text-blue-500 transition-colors"
                        title="Localizar no Mapa"
                    >
                        <MapPin className="h-5 w-5" />
                    </button>
                </div>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{safeString(incident.description)}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mt-2">
                <Clock className="h-3 w-3" />
                {clientTime && <span>{clientTime} por {safeString(incident.reporter, 'Sistema')}</span>}
            </div>

        </div>
    );
};


export function IncidentList({ onLocateIncident }: { onLocateIncident: (coords: google.maps.LatLngLiteral) => void }) {
    const { data: incidents, isLoading } = useMockCollection('incidents');
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
    const { toast } = useToast();

    const handleSummarizeClick = (incident: Incident) => {
        setSelectedIncident(incident);
    };
    
    const handleLocateClick = (incident: Incident) => {
        if (incident.location) {
            onLocateIncident(incident.location as google.maps.LatLngLiteral);
            toast({
                title: "Localizando incidente",
                description: "O mapa foi centralizado no local do incidente."
            });
        } else {
             toast({
                title: "Localização não encontrada",
                description: "Não há dados de localização para este incidente.",
                variant: 'destructive',
            });
        }
    };


    if (isLoading) {
        return (
            <Card className="border-secondary overflow-hidden flex items-center justify-center p-8">
                 <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </Card>
        );
    }

    return (
        <>
            <Card className="border-secondary overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y divide-secondary">
                        {safeArray<Incident>(incidents).length > 0 ? (
                            safeArray<Incident>(incidents).map((incident: Incident) => (
                                <SafeRow key={incident.id} name={`Incident-${incident.id}`}>
                                    <IncidentListItem 
                                        key={incident.id} 
                                        incident={incident} 
                                        onSummarizeClick={handleSummarizeClick} 
                                        onLocateClick={handleLocateClick}
                                    />
                                </SafeRow>
                            ))
                        ) : (
                           <p className="text-center text-muted-foreground p-8 text-sm">Nenhum incidente recente.</p>
                        )}
                    </div>

                </CardContent>
            </Card>
            {selectedIncident && (
                <AiSummaryModal
                    incident={selectedIncident}
                    isOpen={!!selectedIncident}
                    onClose={() => setSelectedIncident(null)}
                />
            )}
        </>
    );
}
