'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, CheckCircle, Loader2, UserPlus, FileText, ArrowRight, ShieldCheck, Sparkles, X, User, MapPin } from 'lucide-react';
import { extractDocumentData, type ExtractDocumentDataOutput } from '@/ai/flows/extract-document-data';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import Image from 'next/image';

type Step = 'welcome' | 'scan' | 'confirm' | 'success';

const SERIE_OPTIONS = [
    "Berçário / Maternal",
    "Pré I / Pré II",
    "1º Ano Fundamental",
    "2º Ano Fundamental",
    "3º Ano Fundamental",
    "4º Ano Fundamental",
    "5º Ano Fundamental",
    "6º Ano Fundamental",
    "7º Ano Fundamental",
    "8º Ano Fundamental",
    "9º Ano Fundamental",
    "1º Ano Médio",
    "2º Ano Médio",
    "3º Ano Médio",
    "Outro"
];

export default function PublicRegistrationPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractDocumentDataOutput | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const { data: schools } = useMockCollection('schools');

  // Form states
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [studentName, setStudentName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [studentSerie, setStudentSerie] = useState('');
  const [studentTurma, setStudentTurma] = useState('');
  
  // Address states
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-fetch address from ViaCEP
  useEffect(() => {
    const cleanedCep = zipCode.replace(/\D/g, '');
    if (cleanedCep.length === 8) {
      const fetchAddress = async () => {
        setIsFetchingCep(true);
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
          const data = await response.json();
          if (!data.erro) {
            setStreet(data.logradouro || '');
            setNeighborhood(data.bairro || '');
            setCity(data.localidade || '');
            setState(data.uf || '');
            toast({ title: "Endereço localizado!", description: "Preenchemos os campos para você." });
          } else {
            toast({ title: "CEP não encontrado", variant: "destructive" });
          }
        } catch (e) {
          console.error("Erro ao buscar CEP:", e);
        } finally {
          setIsFetchingCep(false);
        }
      };
      fetchAddress();
    }
  }, [zipCode, toast]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreviewUrl(base64);
      try {
        const result = await extractDocumentData({ photoDataUri: base64 });
        setExtractedData(result);
        setStep('confirm');
        toast({ title: "Documento Lido!", description: "Confira os dados abaixo." });
      } catch (e) {
        toast({ title: "Falha na leitura", description: "Por favor, preencha manualmente.", variant: "destructive" });
        setExtractedData({ name: '', cpf: '', rg: '', birthDate: '', address: '' });
        setStep('confirm');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFinalSubmit = () => {
    if (!extractedData?.name || !email || !phone || !studentName || !selectedSchoolId || !zipCode || !street || !number) {
        toast({ title: "Campos obrigatórios", description: "Por favor, preencha seu nome, contato, endereço completo e dados do aluno.", variant: "destructive" });
        return;
    }

    addDoc('pending_registrations', {
        parentName: extractedData.name,
        email,
        phone,
        studentName,
        schoolId: selectedSchoolId,
        studentSerie,
        studentTurma,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        address: {
            zipCode,
            street,
            number,
            complement,
            neighborhood,
            city,
            state
        },
        documentData: {
            cpf: extractedData.cpf,
            rg: extractedData.rg,
            birthDate: extractedData.birthDate
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
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                >
                    {isProcessing ? (
                        <div className="text-center space-y-4 animate-pulse">
                            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto" />
                            <div className="space-y-1">
                                <p className="font-bold text-primary flex items-center justify-center gap-2">
                                    <Sparkles className="h-4 w-4" /> Inteligência Analisando...
                                </p>
                                <p className="text-xs text-muted-foreground px-4 text-center">Extraindo dados do seu documento.</p>
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
                <Button variant="ghost" className="w-full" onClick={() => setStep('welcome')} disabled={isProcessing}>Voltar</Button>
            </CardFooter>
          </Card>
        )}

        {step === 'confirm' && extractedData && (
          <Card className="shadow-2xl border-primary/20 flex flex-col h-[90vh]">
            <CardHeader className="border-b bg-muted/30 shrink-0">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="text-green-500 h-5 w-5" />
                Confirme seus Dados
              </CardTitle>
              <CardDescription>A IA detectou estes dados. Ajuste se necessário.</CardDescription>
            </CardHeader>
            
            <ScrollArea className="flex-1">
                <CardContent className="space-y-6 pt-6 pb-10">
                    {/* Visual Preview */}
                    {previewUrl && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-bold uppercase text-muted-foreground">Imagem Analisada</Label>
                            <div className="relative aspect-video rounded-lg overflow-hidden border-2 border-muted shadow-sm">
                                <Image src={previewUrl} alt="Scan" fill className="object-cover" />
                            </div>
                        </div>
                    )}

                    {/* Dados Pessoais */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Seu Nome Completo</Label>
                            <Input value={extractedData.name || ''} onChange={e => setExtractedData({...extractedData, name: e.target.value})} placeholder="Como no documento" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CPF</Label>
                                <Input value={extractedData.cpf || ''} onChange={e => setExtractedData({...extractedData, cpf: e.target.value})} placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-2">
                                <Label>RG</Label>
                                <Input value={extractedData.rg || ''} onChange={e => setExtractedData({...extractedData, rg: e.target.value})} placeholder="00.000.000-0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Seu E-mail</Label>
                                <Input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp (Telefone)</Label>
                                <Input placeholder="(11) 90000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" /> Endereço de Coleta
                        </p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2 sm:col-span-1">
                                    <Label>CEP</Label>
                                    <div className="relative">
                                        <Input placeholder="00000-000" value={zipCode} onChange={e => setZipCode(e.target.value)} />
                                        {isFetchingCep && <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                </div>
                                <div className="space-y-2 sm:col-span-2">
                                    <Label>Rua/Avenida</Label>
                                    <Input placeholder="Logradouro" value={street} onChange={e => setStreet(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Número</Label>
                                    <Input placeholder="Ex: 123" value={number} onChange={e => setNumber(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Complemento</Label>
                                    <Input placeholder="Ex: Apto 42" value={complement} onChange={e => setComplement(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Bairro</Label>
                                    <Input placeholder="Bairro" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cidade</Label>
                                    <Input placeholder="Cidade" value={city} readOnly className="bg-muted/50" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado (UF)</Label>
                                <Input placeholder="UF" value={state} readOnly className="bg-muted/50" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Dados do Aluno */}
                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2">
                            <User className="h-4 w-4 text-primary" /> Dados do Aluno
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Filho(a)</Label>
                                <Input placeholder="Nome completo do aluno" value={studentName} onChange={e => setStudentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola de Destino</Label>
                                <Select onValueChange={setSelectedSchoolId} value={selectedSchoolId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a escola..." /></SelectTrigger>
                                    <SelectContent>
                                        {schools?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Série/Ano</Label>
                                    <Select onValueChange={setStudentSerie} value={studentSerie}>
                                        <SelectTrigger><SelectValue placeholder="Selecione a série..." /></SelectTrigger>
                                        <SelectContent>
                                            {SERIE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Turma/Sala (Opcional)</Label>
                                    <Input placeholder="Ex: Sala 102" value={studentTurma} onChange={e => setStudentTurma(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </ScrollArea>

            <CardFooter className="border-t p-6 shrink-0 bg-background">
                <div className="flex flex-col w-full gap-2">
                    <Button className="w-full h-12 text-base font-bold" onClick={handleFinalSubmit}>
                        Finalizar Solicitação
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => setStep('scan')}>
                        Refazer foto do documento
                    </Button>
                </div>
            </CardFooter>
          </Card>
        )}

        {step === 'success' && (
            <Card className="shadow-2xl border-green-500/20 text-center p-8">
                <CardContent className="space-y-6 pt-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20 mb-4 animate-bounce">
                        <CheckCircle className="text-green-500 h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-2xl font-bold">Solicitação Enviada!</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">Recebemos seus dados e endereço. O gestor da frota analisará a viabilidade da rota e entrará em contato via WhatsApp para formalizar o contrato digital.</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg text-left text-xs space-y-3 border border-dashed">
                        <p className="font-bold text-foreground">Próximos Passos:</p>
                        <ul className="space-y-2">
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Cálculo de tempo e distância da rota</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Geração do contrato com seus dados</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span>Acesso ao rastreamento em tempo real</span>
                            </li>
                        </ul>
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/">Voltar para o Início</Link>
                    </Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
