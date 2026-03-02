'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, CheckCircle, Loader2, UserPlus, FileText, ArrowRight, ShieldCheck, Sparkles, X } from 'lucide-react';
import { extractDocumentData, type ExtractDocumentDataOutput } from '@/ai/flows/extract-document-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

type Step = 'welcome' | 'scan' | 'confirm' | 'success';

export default function PublicRegistrationPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractDocumentDataOutput | null>(null);
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const { data: schools } = useMockCollection('schools');

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        try {
          const result = await extractDocumentData({ photoDataUri: base64 });
          setExtractedData(result);
          setStep('confirm');
          toast({ title: "Documento Lido!", description: "A IA preencheu os campos para você." });
        } catch (e) {
          toast({ title: "Falha na leitura", description: "Não conseguimos ler o documento. Por favor, preencha manualmente.", variant: "destructive" });
          setExtractedData({ name: '', cpf: '', rg: '', birthDate: '' });
          setStep('confirm');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsProcessing(false);
    }
  };

  const handleFinalSubmit = () => {
    if (!extractedData || !email || !phone || !studentName || !selectedSchoolId) {
        toast({ title: "Campos incompletos", description: "Por favor, preencha todos os dados.", variant: "destructive" });
        return;
    }

    addDoc('pending_registrations', {
        parentName: extractedData.name,
        email,
        phone,
        studentName,
        schoolId: selectedSchoolId,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        documentData: {
            cpf: extractedData.cpf,
            rg: extractedData.rg,
            birthDate: extractedData.birthDate,
            address: extractedData.address
        }
    });

    setStep('success');
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {step === 'welcome' && (
          <Card className="shadow-2xl border-primary/20">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 border-2 border-primary/20">
                <UserPlus className="text-primary h-8 w-8" />
              </div>
              <CardTitle className="text-2xl font-bold">Seja bem-vindo ao Guardian</CardTitle>
              <CardDescription>Vamos agilizar seu cadastro em menos de 2 minutos usando Inteligência Artificial.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><Camera className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Passo 1: Foto do Documento</p>
                            <p className="text-xs text-muted-foreground">Nossa IA lê seus dados automaticamente (CNH ou RG).</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><FileText className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Passo 2: Dados do Aluno</p>
                            <p className="text-xs text-muted-foreground">Informe o nome do seu filho e a escola.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex items-center gap-3">
                    <ShieldCheck className="text-green-500 h-5 w-5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-tight">Seus dados estão protegidos por criptografia e serão usados exclusivamente para a formalização do contrato de transporte.</p>
                </div>
            </CardContent>
            <CardHeader>
              <Button className="w-full h-12 text-lg" onClick={() => setStep('scan')}>
                Começar Cadastro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardHeader>
          </Card>
        )}

        {step === 'scan' && (
          <Card className="shadow-2xl border-primary/20 overflow-hidden">
            <CardHeader className="text-center pb-2">
              <CardTitle>Identificação</CardTitle>
              <CardDescription>Tire uma foto nítida do seu documento (CNH ou RG) para preenchimento automático.</CardDescription>
            </CardHeader>
            <CardContent className="p-8">
                <div 
                    className="aspect-[3/2] border-2 border-dashed border-primary/30 rounded-xl bg-primary/5 flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-primary/10 transition-colors relative"
                    onClick={() => fileInputRef.current?.click()}
                >
                    {isProcessing ? (
                        <div className="text-center space-y-4 animate-pulse">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                            <div className="space-y-1">
                                <p className="font-bold text-primary flex items-center justify-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Inteligência Analisando...
                                </p>
                                <p className="text-xs text-muted-foreground">Extraindo dados do seu documento.</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="bg-primary/20 p-4 rounded-full">
                                <Camera className="h-10 w-10 text-primary" />
                            </div>
                            <p className="font-semibold">Tirar Foto ou Enviar Arquivo</p>
                            <p className="text-xs text-muted-foreground">Frente e verso (ou apenas frente da CNH)</p>
                        </>
                    )}
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        className="hidden" 
                    />
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="ghost" className="w-full" onClick={() => setStep('welcome')}>Voltar</Button>
            </CardFooter>
          </Card>
        )}

        {step === 'confirm' && extractedData && (
          <Card className="shadow-2xl border-primary/20">
            <CardHeader className="border-b bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="text-green-500 h-5 w-5" />
                Confirme seus Dados
              </CardTitle>
              <CardDescription>A IA detectou estes dados. Ajuste se necessário.</CardDescription>
            </CardHeader>
            <ScrollArea className="max-h-[60vh]">
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label>Seu Nome Completo</Label>
                        <Input value={extractedData.name} onChange={e => setExtractedData({...extractedData, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>CPF</Label>
                            <Input value={extractedData.cpf} onChange={e => setExtractedData({...extractedData, cpf: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <Label>RG</Label>
                            <Input value={extractedData.rg} onChange={e => setExtractedData({...extractedData, rg: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>E-mail</Label>
                            <Input type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>WhatsApp</Label>
                            <Input placeholder="(11) 9..." value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>
                    </div>
                    
                    <div className="border-t pt-4 mt-2">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Dados do Aluno
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Filho(a)</Label>
                                <Input placeholder="Nome completo do aluno" value={studentName} onChange={e => setStudentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola de Destino</Label>
                                <Select onValueChange={setSelectedSchoolId} value={selectedSchoolId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a escola..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {schools?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </ScrollArea>
            <CardFooter className="border-t pt-6">
                <Button className="w-full h-12" onClick={handleFinalSubmit}>
                    Finalizar Solicitação
                </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'success' && (
            <Card className="shadow-2xl border-green-500/20 text-center p-8">
                <CardContent className="space-y-6 pt-6">
                    <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20 mb-4 animate-bounce">
                        <CheckCircle className="text-green-500 h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">Solicitação Enviada!</h2>
                        <p className="text-muted-foreground text-sm">Recebemos seus dados. O gestor da frota analisará seu cadastro e entrará em contato via WhatsApp para formalizar o contrato.</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-left text-xs space-y-2">
                        <p className="font-semibold">Próximos Passos:</p>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                            <li>Análise de vaga na rota</li>
                            <li>Geração do contrato digital</li>
                            <li>Envio do link de rastreamento</li>
                        </ul>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Voltar para Início</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
