"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { summarizeIncidentReport } from "@/ai/flows/summarize-incident-reports";
import type { Incident } from "@/lib/placeholder-data";
import { Loader2, Bot, Sparkles } from "lucide-react";

interface AiSummaryModalProps {
  incident: Incident;
  isOpen: boolean;
  onClose: () => void;
}

export function AiSummaryModal({ incident, isOpen, onClose }: AiSummaryModalProps) {
  const [summary, setSummary] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSummary = async () => {
        setIsLoading(true);
        setError(null);
        setSummary("");
        try {
          const result = await summarizeIncidentReport({ report: incident.description });
          setSummary(result.summary);
        } catch (e) {
          setError("Falha ao gerar o resumo. Tente novamente.");
          console.error(e);
        } finally {
          setIsLoading(false);
        }
      };
      fetchSummary();
    }
  }, [isOpen, incident]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" />
            Resumo do Incidente (IA)
          </DialogTitle>
          <DialogDescription>
            Resumo gerado por IA para o incidente #{incident.id}.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 min-h-[150px] rounded-md border border-input bg-secondary/30 p-4">
          {isLoading && (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p>Gerando resumo...</p>
            </div>
          )}
          {error && <p className="text-destructive text-center">{error}</p>}
          {summary && (
            <div className="text-sm text-foreground space-y-3">
                 <p>{summary}</p>
                 <div className="flex items-center justify-end text-xs text-muted-foreground gap-1 pt-2 border-t border-secondary">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Gerado com Inteligência Artificial</span>
                 </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
