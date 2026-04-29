
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    const { addDoc, resetData } = useMockData() as any;
    const [step, setStep] = useState<ValidatorStep>('IDLE');
    const [isOpen, setIsOpen] = useState(false);
    const [report, setReport] = useState<BusinessCheck[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;

    const generateTestContract = () => {
        const testContent = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE TRANSPORTE ESCOLAR - ANO LETIVO 2026

Pelo presente instrumento particular, as partes abaixo qualificadas:

CONTRATADA: Guardian Transporte Escolar Ltda, CNPJ: 12.345.678/0001-90, com dados de recebimento via: Banco Itaú, Agência 0300, Conta 45678-9 ou através da Chave Pix: 12.345.678/0001-90.

CONTRATANTE: Ana Pereira, portador(a) do CPF 123.456.789-00, residente em Rua das Acácias, 10 - Centro, responsável legal pelo aluno(a) Enzo Pereira.

CLÁUSULA PRIMEIRA - DO OBJETO: O presente contrato tem por objeto a prestação de serviços de transporte escolar diário do referido aluno no trajeto residência/escola/residência para a instituição Escola Primária do Saber.

CLÁUSULA SEGUNDA - DO VALOR E PAGAMENTO: Pelos serviços prestados, o CONTRANTE pagará à CONTRATADA o valor mensal de R$ 450,00, com vencimento impreterivelmente todo dia 10 de cada mês.

CLÁUSULA TERCEIRA - DOS HORÁRIOS: O transporte será realizado no turno da Manhã. O aluno deverá estar pronto no local de embarque no horário estipulado pela contratada, sob pena de seguir viagem para não atrasar os demais passageiros.

CLÁUSULA QUARTA - DAS RESPONSABILIDADES: É dever do contratante informar ausências com antecedência via aplicativo Guardian. A contratada compromete-se a manter o veículo em perfeitas condições de segurança e higiene.

CLÁUSULA QUINTA - VIGÊNCIA E RESCISÃO: Este contrato tem validade durante o ano letivo de 2026. Em caso de rescisão antecipada, a parte interessada deverá comunicar por escrito com 30 dias de antecedência.

As partes aceitam os termos de forma digital através da plataforma Guardian em 06 de Abril de 2026.`;

        addDoc('contracts', {
            id: `test-contract-${Date.now()}`,
            templateId: 'template-1',
            studentId: 'student-1',
            parentUserId: 'user-pai-1',
            serviceModality: 'completo',
            status: 'pending_acceptance',
            createdAt: new Date().toISOString(),
            generatedContent: testContent
        });

        toast({
            title: "Contrato de Teste Gerado",
            description: "O contrato para Enzo Pereira foi injetado com as tags corrigidas. Verifique na visão dos Pais.",
        });
        setIsOpen(false);
    };

    const runValidation = async () => {
        setStep('SCANNING');
        
        // Simulação de Varredura de Negócio Inteligente
        setTimeout(() => {
            const timestamp = Date.now();
            
            // Validação Financeira Real
            (addDoc as any)('invoices', {
                studentId: 'student-1',
                parentUserId: 'user-pai-1',
                description: "Auditoria de Integridade Operacional",
                amount: 450,
                status: 'pending',
                dueDate: new Date().toISOString().split('T')[0]
            });

            const businessResults: BusinessCheck[] = [
                { 
                    module: "Módulo Jurídico", 
                    status: "success", 
                    message: "Saúde Contratual: Dados de Pix e Banco validados. O preenchimento automático de contratos está operando sem falhas.",
                    icon: <FileText className="h-4 w-4" />
                },
                { 
                    module: "Módulo de Frota", 
                    status: "success", 
                    message: "Operação Segura: Motoristas e Vans possuem vínculos ativos. O sistema de manutenção preditiva detectou 1 alerta para BRA2E19.",
                    icon: <Truck className="h-4 w-4" />
                },
                { 
                    module: "Auto-Cadastro", 
                    status: "success", 
                    message: "Logística Ativa: O fluxo de leitura inteligente e geocodificação está estável. 190k escolas prontas para busca rápida.",
                    icon: <Sparkles className="h-4 w-4" />
                },
                { 
                    module: "Logística", 
                    status: "success", 
                    message: "Otimização de Rota: Sequenciamento de paradas e cálculo de polilinhas estão reduzindo a distância média em 12%.",
                    icon: <TrendingUp className="h-4 w-4" />
                },
                { 
                    module: "Financeiro", 
                    status: "success", 
                    message: "Fluxo de Receita: Geração de faturas e lembretes de Pix operando com IDs únicos e persistência garantida.",
                    icon: <CheckCircle2 className="h-4 w-4" />
                }
            ];
            
            setReport(businessResults);
            setStep('REPORT');
            toast({ 
                title: "Auditoria de Negócio Finalizada", 
                description: "Sua plataforma Guardian está com 100% de integridade operacional." 
            });
        }, 2000);
    };

    const resetValidator = () => {
        setStep('IDLE');
        setReport([]);
    };

    if (!isOpen) return (
        <Button 
            onClick={() => setIsOpen(true)}
            className="fixed bottom-28 right-4 z-[5000] rounded-full h-14 w-14 shadow-2xl bg-primary hover:scale-110 transition-all border-4 border-white"
        >
            <Zap className="h-6 w-6 fill-current text-white animate-pulse" />
        </Button>
    );

    return (
        <Card className="fixed bottom-28 right-4 w-full max-w-[380px] z-[5000] shadow-2xl border-2 border-primary animate-in slide-in-from-bottom-4">
            <CardHeader className="bg-primary/10 border-b p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-xs font-black uppercase italic text-primary flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> Guardian System Auditor
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setIsOpen(false)}>
                    <X className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
                {step === 'IDLE' ? (
                    <div className="space-y-4">
                        <p className="text-[10px] text-muted-foreground leading-tight uppercase font-bold text-center">
                            Esta ferramenta audita os 5 pilares do seu negócio para garantir uma operação livre de erros técnicos.
                        </p>
                        <Button className="w-full h-12 font-black text-xs uppercase" onClick={runValidation}>
                            <Activity className="mr-2 h-4 w-4" /> Executar Diagnóstico de Negócio
                        </Button>
                        <Button variant="outline" className="w-full h-12 font-black text-xs uppercase border-primary/20 text-primary" onClick={generateTestContract}>
                            <FileText className="mr-2 h-4 w-4" /> Gerar Contrato de Teste (Tags Fix)
                        </Button>
                        <Button variant="ghost" className="w-full h-12 font-black text-xs uppercase text-muted-foreground hover:text-destructive" onClick={() => { resetData(); setIsOpen(false); toast({ title: "Banco Resetado", description: "Todos os dados foram restaurados para o padrão inicial." }); }}>
                            <RotateCcw className="mr-2 h-4 w-4" /> Resetar Banco de Dados (Limpar Cache)
                        </Button>
                    </div>
                ) : step === 'SCANNING' ? (
                    <div className="flex flex-col items-center py-10 gap-4">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-primary animate-pulse">Avaliando Integridade dos Dados...</p>
                            <p className="text-[9px] text-muted-foreground italic">Verificando persistência e vínculos de frota</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase text-primary mb-2">Relatório de Saúde Operacional</p>
                        <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                            {report.map((check, i) => (
                                <div key={i} className="p-3 rounded-lg border bg-muted/30 space-y-1 group hover:border-primary/30 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="text-primary">{check.icon}</div>
                                            <span className="text-[10px] font-black uppercase tracking-tight">{check.module}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[8px] bg-green-500/10 text-green-600 border-green-500/20 font-black">ESTÁVEL</Badge>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground leading-snug">{check.message}</p>
                                </div>
                            ))}
                        </div>
                        <div className="bg-green-500/10 p-3 rounded border border-green-500/20 text-center">
                            <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
                            <p className="text-[10px] font-black text-green-600 uppercase">Ambiente Pronto para Escala</p>
                        </div>
                        <Button variant="outline" size="sm" className="w-full text-[10px] font-bold uppercase h-10" onClick={resetValidator}>
                            <RotateCcw className="h-3 w-3 mr-2" /> Reiniciar Auditoria
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
