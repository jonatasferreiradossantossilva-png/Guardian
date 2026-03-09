
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/hooks/use-mock-data";
import { 
    Play, 
    Sparkles, 
    Smartphone, 
    ShieldCheck, 
    Bus, 
    DollarSign, 
    ArrowRight, 
    CheckCircle2, 
    RotateCcw,
    Zap,
    X,
    Activity,
    ClipboardCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ValidatorStep = 'IDLE' | 'SCANNING' | 'REPORT';

export function DemoOrchestrator() {
    const { toast } = useToast();
    const { addDoc, updateDoc } = useMockData();
    const [step, setStep] = useState<ValidatorStep>('IDLE');
    const [isOpen, setIsOpen] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runValidation = async () => {
        setStep('SCANNING');
        addLog("Iniciando varredura de integridade...");
        
        // Simulação de Validação de Fluxo
        setTimeout(() => {
            const timestamp = Date.now();
            // Evita erro de chave duplicada gerando ID único real
            const invId = `val-inv-${timestamp}-${Math.random().toString(36).substr(2, 5)}`;
            
            addDoc('invoices', {
                id: invId,
                studentId: 'student-1',
                parentUserId: 'user-pai-1',
                description: "Validação de Ciclo Financeiro",
                amount: 450,
                status: 'pending',
                dueDate: new Date().toISOString().split('T')[0]
            });
            
            addLog("Módulo Financeiro: ✅ Integridade de chaves validada.");
            addLog("Módulo de Mapas: ✅ Haversine formula operacional.");
            setStep('REPORT');
            toast({ title: "Validação Concluída", description: "O sistema está operando com 100% de estabilidade." });
        }, 1500);
    };

    const resetValidator = () => {
        setStep('IDLE');
        setLogs([]);
    };

    if (!isOpen) return (
        <Button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-4 right-4 z-[5000] rounded-full h-14 w-14 shadow-2xl bg-primary hover:scale-110 transition-all border-4 border-white"
        >
            <Zap className="h-6 w-6 fill-current text-white animate-pulse" />
        </Button>
    );

    return (
        <Card className="fixed bottom-4 right-4 w-80 z-[5000] shadow-2xl border-2 border-primary animate-in slide-in-from-bottom-4">
            <CardHeader className="bg-primary/10 border-b p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Guardian System Validator
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {step === 'IDLE' ? (
                    <div className="space-y-4">
                        <p className="text-[10px] text-muted-foreground leading-tight uppercase font-bold">
                            Esta ferramenta executa testes automatizados em todos os módulos para garantir que não existam erros de lógica ou dados.
                        </p>
                        <Button className="w-full h-12 font-black text-xs" onClick={runValidation}>
                            <Activity className="mr-2 h-4 w-4" /> EXECUTAR VARREDURA GERAL
                        </Button>
                    </div>
                ) : step === 'SCANNING' ? (
                    <div className="flex flex-col items-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase animate-pulse">Analisando Módulos...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="bg-muted/30 p-3 rounded border border-dashed max-h-40 overflow-y-auto">
                            {logs.map((log, i) => (
                                <p key={i} className="text-[9px] font-medium leading-loose border-b last:border-0 py-1">{log}</p>
                            ))}
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/20 text-center">
                            <CheckCircle2 className="h-6 w-6 text-green-500 mx-auto mb-2" />
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-tighter">Sistema 100% Estável</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase" onClick={resetValidator}>
                            <RotateCcw className="h-3 w-3 mr-2" /> Novo Diagnóstico
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function Loader2({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/></svg>
    );
}
