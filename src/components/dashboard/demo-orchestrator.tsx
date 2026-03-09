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
    X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type DemoStep = 'IDLE' | 'ONBOARDING' | 'APPROVAL' | 'LOGISTICS' | 'FINANCE' | 'DONE';

export function DemoOrchestrator() {
    const { toast } = useToast();
    const { addDoc, updateDoc } = useMockData();
    const [step, setStep] = useState<DemoStep>('IDLE');
    const [isOpen, setIsOpen] = useState(false);

    const runOnboarding = async () => {
        setStep('ONBOARDING');
        const uniqueId = `demo-reg-${Date.now()}`;
        toast({ 
            title: "Passo 1: Onboarding Realizado", 
            description: "Um novo aluno (Lucas Mendes) apareceu na aba 'Solicitações'.",
            duration: 5000
        });
        
        addDoc('pending_registrations', {
            id: uniqueId,
            parentName: "Ana Pereira",
            email: "ana.pereira@email.com",
            studentName: "Lucas Mendes (DEMO)",
            schoolId: "school-1",
            status: "pending_approval",
            userId: "user-pai-1",
            createdAt: new Date().toISOString(),
            address: { zipCode: "01310-100", street: "Av. Paulista", number: "1500", neighborhood: "Bela Vista", city: "São Paulo", state: "SP" },
            documentData: { cpf: "111.222.333-44", rg: "12.345.678-9", birthDate: "1985-05-20" }
        });
    };

    const runApproval = () => {
        setStep('APPROVAL');
        const timestamp = Date.now();
        const studentId = `demo-stud-${timestamp}`;
        toast({ 
            title: "Passo 2: Aluno Integrado", 
            description: "O contrato foi gerado. Vá em 'Contratos' ou 'Alunos' para ver o resultado.",
            duration: 5000
        });
        
        addDoc('students', {
            id: studentId,
            name: "Lucas Mendes (DEMO)",
            parentId: "parent-1",
            schoolId: "school-1",
            status: "aguardando",
            shift: "Manhã",
            active: true,
            latitude: -23.5580,
            longitude: -46.6600
        });

        addDoc('contracts', {
            id: `demo-cont-${timestamp}`,
            studentId: studentId,
            parentUserId: 'user-pai-1',
            status: 'pending_acceptance',
            createdAt: new Date().toISOString(),
            generatedContent: "CONTRATO DE TRANSPORTE DEMO: Lucas Mendes está agora sob proteção do Guardian..."
        });
    };

    const runLogistics = () => {
        setStep('LOGISTICS');
        toast({ 
            title: "Passo 3: Van em Movimento", 
            description: "Abra o 'Mapa' (no Pai ou Motorista) para ver a van chegando.",
            duration: 5000
        });
        
        updateDoc('locations', 'driver-1', { 
            latitude: -23.5580, 
            longitude: -46.6600,
            timestamp: new Date().toISOString() 
        });
    };

    const runFinance = () => {
        setStep('FINANCE');
        const timestamp = Date.now();
        const invId = `demo-inv-${timestamp}`;
        toast({ 
            title: "Passo 4: Ciclo Financeiro", 
            description: "Viagem concluída. A fatura de R$ 450,00 foi gerada em 'Financeiro'.",
            duration: 5000
        });
        
        addDoc('invoices', {
            id: invId,
            studentId: 'student-1',
            parentUserId: 'user-pai-1',
            description: "Mensalidade Demo - Lucas Mendes",
            amount: 450,
            status: 'pending',
            dueDate: new Date().toISOString().split('T')[0]
        });
        setStep('DONE');
    };

    const resetDemo = () => {
        setStep('IDLE');
        toast({ title: "Simulação Resetada" });
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
                    <Sparkles className="h-4 w-4" /> Guardian LIVE Simulator
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                    <DemoStepItem 
                        icon={<Smartphone />} 
                        label="1. Simular Onboarding" 
                        isActive={step === 'IDLE'} 
                        isDone={step !== 'IDLE'}
                        onClick={runOnboarding}
                    />
                    <DemoStepItem 
                        icon={<ShieldCheck />} 
                        label="2. Aprovar & Contrato" 
                        isActive={step === 'ONBOARDING'} 
                        isDone={['APPROVAL', 'LOGISTICS', 'FINANCE', 'DONE'].includes(step)}
                        onClick={runApproval}
                    />
                    <DemoStepItem 
                        icon={<Bus />} 
                        label="3. Simular GPS (800m)" 
                        isActive={step === 'APPROVAL'} 
                        isDone={['LOGISTICS', 'FINANCE', 'DONE'].includes(step)}
                        onClick={runLogistics}
                    />
                    <DemoStepItem 
                        icon={<DollarSign />} 
                        label="4. Gerar Fatura & ROI" 
                        isActive={step === 'LOGISTICS'} 
                        isDone={['FINANCE', 'DONE'].includes(step)}
                        onClick={runFinance}
                    />
                </div>

                {step === 'DONE' && (
                    <div className="bg-green-500/10 p-3 rounded border border-green-500/20 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                        <p className="text-[10px] font-bold text-green-600 uppercase">Jornada Demo Validada!</p>
                    </div>
                )}

                <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase tracking-widest" onClick={resetDemo}>
                    <RotateCcw className="h-3 w-3 mr-2" /> Resetar Cenário
                </Button>
            </CardContent>
        </Card>
    );
}

function DemoStepItem({ icon, label, isActive, isDone, onClick }: { icon: any, label: string, isActive: boolean, isDone: boolean, onClick: () => void }) {
    return (
        <button 
            onClick={onClick}
            disabled={!isActive}
            className={cn(
                "w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                isActive ? "border-primary bg-primary/5 shadow-sm scale-105" : "opacity-50",
                isDone && "bg-green-50 border-green-200 opacity-100"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-md", isDone ? "text-green-600" : "text-primary")}>{icon}</div>
                <span className="text-[10px] font-black uppercase tracking-tight">{label}</span>
            </div>
            {isDone ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : isActive && <ArrowRight className="h-4 w-4 text-primary animate-pulse" />}
        </button>
    );
}
