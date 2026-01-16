"use client";

import type { Incident } from "@/lib/placeholder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Bot, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { AiSummaryModal } from "./ai-summary-modal";

const severityVariantMap: { [key in Incident['severity']]: "destructive" | "default" | "secondary" | "outline" } = {
    'Crítica': 'destructive',
    'Alta': 'default',
    'Média': 'secondary',
    'Baixa': 'outline'
};

const IncidentListItem = ({ incident, onSummarizeClick }: { incident: Incident, onSummarizeClick: (incident: Incident) => void }) => {
    const [clientTime, setClientTime] = useState("");

    useEffect(() => {
        setClientTime(
            new Date(incident.timestamp).toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            })
        );
    }, [incident.timestamp]);

    return (
        <div className="p-4 hover:bg-secondary/50 transition-colors">
            <div className="flex justify-between items-start">
                <div>
                    <Badge variant={severityVariantMap[incident.severity]}>{incident.severity}</Badge>
                    <p className="font-semibold text-foreground mt-2">{incident.category}</p>
                </div>
                <button
                    onClick={() => onSummarizeClick(incident)}
                    className="p-2 rounded-md hover:bg-primary/20 text-primary transition-colors"
                    title="Sumarizar com IA"
                >
                    <Bot className="h-5 w-5" />
                </button>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{incident.description}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground/80 mt-2">
                <Clock className="h-3 w-3" />
                {clientTime && <span>{clientTime} por {incident.reporter}</span>}
            </div>
        </div>
    );
};


export function IncidentList({ incidents }: { incidents: Incident[] }) {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

    const handleSummarizeClick = (incident: Incident) => {
        setSelectedIncident(incident);
    };

    return (
        <>
            <Card className="border-secondary overflow-hidden">
                <CardContent className="p-0">
                    <div className="divide-y divide-secondary">
                        {incidents.map((incident) => (
                            <IncidentListItem 
                                key={incident.id} 
                                incident={incident} 
                                onSummarizeClick={handleSummarizeClick} 
                            />
                        ))}
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
