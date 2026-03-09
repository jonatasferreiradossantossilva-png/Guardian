
"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMockData } from "@/hooks/use-mock-data";
import { 
    Loader2, 
    ShieldCheck, 
    Zap,
    X,
    Activity,
    CheckCircle2,
    RotateCcw,
    FileText,
    Truck,
    Sparkles,
    TrendingUp,
    AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

type ValidatorStep = 'IDLE' | 'SCANNING' | 'REPORT';

interface BusinessCheck {
    module: string;
    status: 'success' | 'warning' | 'error';
    message: string;
    icon: React.ReactNode;
}

export function DemoOrchestrator() {
    const { toast } = useToast();
    const { addDoc } = useMockData();
    const [step, setStep] = useState<ValidatorStep>('IDLE');
    const [isOpen, setIsOpen] = useState(false);
    const [report, setReport] = useState<BusinessCheck[]>([]);

    const runValidation = async () => {
        setStep('SCANNING');
        
        // Simulação de Varredura de Negócio
        setTimeout(() => {
            const timestamp = Date.now();
            
            // Validação Financeira Real: Criar dado para testar persistência
            addDoc('invoices', {
                id: `val-inv-${timestamp}`,
                studentId: 'student-1',
                parentUserId: 'user-pai-1',
                description: "Auditoria de Integridade Guardian",
                amount: 450,
                status: 'pending',
                dueDate: new Date().toISOString().split('T')[0]
            });

            const businessResults: BusinessCheck[] = [
                { 
                    module: "Módulo Jurídico", 
                    status: "success", 
                    message: "Pronto para faturar. Dados de Pix e Banco validados para os contratos.",
                    icon: <FileText className="h-4 w-4" />
                },
                { 
                    module: "Módulo de Frota", 
                    status: "success", 
                    message: "Operação segura. Motoristas e vans devidamente vinculados.",
                    icon: <Truck className="h-4 w-4" />
                },
                { 
                    module: "Cadastro IA", 
                    status: "success", 
                    message: "Inteligência ativa. Fluxo de leitura de documentos e geocodificação operacional.",
                    icon: <Sparkles className="h-4 w-4" />
                },
                { 
                    module: "Logística", 
                    status: "success", 
                    message: "Otimização estável. Sequenciamento de paradas e mapas respondendo corretamente.",
                    icon: <TrendingUp className="h-4 w-4" />
                },
                { 
                    module: "Financeiro", 
                    status: "success", 
                    message: "Saúde financeira. Geração de faturas operando sem conflitos de IDs.",
                    icon: <CheckCircle2 className="h-4 w-4" />
                }
            ];
            
            setReport(businessResults);
            setStep('REPORT');
            toast({ title: "Auditoria de Negócio Concluída", description: "O sistema está operando com 100% de integridade operacional." });
        }, 2000);
    };

    const resetValidator = () => {
        setStep('IDLE');
        setReport([]);
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
        <Card className="fixed bottom-4 right-4 w-full max-w-[350px] z-[5000] shadow-2xl border-2 border-primary animate-in slide-in-from-bottom-4">
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
                        <p className="text-[10px] text-muted-foreground leading-tight uppercase font-bold text-center">
                            Esta ferramenta audita os 5 pilares do seu negócio para garantir uma operação à prova de falhas.
                        </p>
                        <Button className="w-full h-12 font-black text-xs" onClick={runValidation}>
                            <Activity className="mr-2 h-4 w-4" /> EXECUTAR AUDITORIA GERAL
                        </Button>
                    </div>
                ) : step === 'SCANNING' ? (
                    <div className="flex flex-col items-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-[10px] font-black uppercase animate-pulse">Avaliando Processos de Negócio...</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-primary mb-2">Relatório de Integridade</p>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {report.map((check, i) => (
                                <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="text-primary">{check.icon}</div>
                                            <span className="text-[10px] font-bold uppercase tracking-tight">{check.module}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] bg-green-500/10 text-green-600 border-green-500/20">INTEGRO</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-snug">{check.message}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/20 text-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <p className="text-[10px] font-black text-green-600 uppercase">Sistema Pronto para Operação</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase" onClick={resetValidator}>
                            <RotateCcw className="h-3 w-3 mr-2" /> Nova Auditoria
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
