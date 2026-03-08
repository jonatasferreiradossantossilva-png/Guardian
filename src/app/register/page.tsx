'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Loader2, 
  UserPlus, 
  FileText, 
  ArrowRight, 
  ShieldCheck, 
  User, 
  MapPin, 
  Smartphone, 
  Camera, 
  Sparkles, 
  RefreshCw, 
  AlertTriangle, 
  Apple, 
  Wind, 
  Activity, 
  Accessibility, 
  Brain, 
  HeartPulse, 
  DollarSign, 
  Users 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { extractDocumentData } from '@/ai/flows/extract-document-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Step = 'welcome' | 'scan' | 'review' | 'form' | 'photo' | 'health' | 'success';

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

const HEALTH_CATEGORIES = [
    { id: 'Alergia', label: 'Alergia (Alimentar ou Med)', icon: <Apple className="h-4 w-4" /> },
    { id: 'Respiratório', label: 'Asma ou Bronquite', icon: <Wind className="h-4 w-4" /> },
    { id: 'Diabetes', label: 'Diabetes / Insulina', icon: <Activity className="h-4 w-4" /> },
    { id: 'Mobilidade', label: 'Dificuldade de Locomoção', icon: <Accessibility className="h-4 w-4" /> },
    { id: 'Neuro', label: 'TEA / TDAH / Neurodiversidade', icon: <Brain className="h-4 w-4" /> },
];

const PAYMENT_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function PublicRegistrationPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const { data: schools } = useMockCollection('schools');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states - Responsible
  const [parentName, setParentName] = useState('');
  const [parentCpf, setParentCpf] = useState('');
  const [parentRg, setParentRg] = useState('');
  const [parentBirthDate, setParentBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  // Form states - Student
  const [studentName, setStudentName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [studentSerie, setStudentSerie] = useState('');
  const [studentTurma, setStudentTurma] = useState('');
  const [shift, setShift] = useState<string>(''); 
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Finance states
  const [preferredPaymentDay, setPreferredPaymentDay] = useState('10');
  
  // Health states
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [medicalNote, setMedicalNote] = useState('');
  
  // Address states
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step]);

  const isFormValid = () => {
      return (
          parentName.trim() !== '' &&
          email.trim() !== '' &&
          phone.trim() !== '' &&
          studentName.trim() !== '' &&
          selectedSchoolId !== '' &&
          shift !== '' && 
          zipCode.replace(/\D/g, '').length === 8 &&
          street.trim() !== '' &&
          number.trim() !== '' &&
          city.trim() !== '' &&
          state.trim() !== ''
      );
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
        try {
            const base64 = reader.result as string;
            const result = await extractDocumentData({ photoDataUri: base64 });
            
            setParentName(result.name);
            setParentCpf(result.cpf);
            setParentRg(result.rg);
            setParentBirthDate(result.birthDate.split('/').reverse().join('-')); 
            
            setStep('review');
            toast({ title: "Leitura concluída!", description: "Por favor, revise se os dados estão corretos." });
        } catch (error: any) {
            toast({ 
                title: "Falha na leitura automática", 
                description: "Não conseguimos ler os dados. Por favor, preencha manualmente.", 
                variant: "destructive" 
            });
            setStep('form');
        } finally {
            setIsProcessing(false);
        }
    };
    reader.readAsDataURL(file);
  };

  const handleStudentPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
        toast({ title: "Foto capturada!", description: "Identificação do aluno salva com sucesso." });
    };
    reader.readAsDataURL(file);
  };

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
            toast({ title: "CEP localizado!", description: "Endereço de embarque atualizado." });
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

  const handleFinalSubmit = () => {
    if (!isFormValid()) {
        toast({ title: "Dados incompletos", description: "Por favor, preencha todos os campos obrigatórios marcados com *", variant: "destructive" });
        return;
    }

    addDoc('pending_registrations', {
        parentName,
        email,
        phone,
        studentName,
        schoolId: selectedSchoolId,
        studentSerie,
        studentTurma,
        shift,
        photoUrl,
        preferredPaymentDay: Number(preferredPaymentDay),
        medicalConditions,
        medicalNote,
        status: 'pending_approval',
        createdAt: new Date().toISOString(),
        address: { zipCode, street, number, complement, neighborhood, city, state },
        documentData: { cpf: parentCpf, rg: parentRg, birthDate: parentBirthDate }
    });

    setStep('success');
  };

  const toggleCondition = (id: string) => {
      setMedicalConditions(prev => 
          prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
      );
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
              <CardTitle className="text-2xl font-bold">Cadastro Guardian</CardTitle>
              <CardDescription>Inicie seu cadastro para formalizar o transporte escolar do seu filho.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><Smartphone className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Leitura via IA</p>
                            <p className="text-xs text-muted-foreground">Tire uma foto do seu documento para preenchimento automático.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><MapPin className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Endereço de Embarque</p>
                            <p className="text-xs text-muted-foreground">O local exato onde a van deve buscar a criança diariamente.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex items-center gap-3">
                    <ShieldCheck className="text-green-500 h-5 w-5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-tight">Seus dados estão protegidos por criptografia e serão usados exclusivamente para a formalização do contrato.</p>
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-2">
              <Button className="w-full h-12 text-lg font-bold" onClick={() => setStep('scan')}>
                Usar Leitura Automática
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setStep('form')}>
                Pular e preencher manualmente
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'scan' && (
            <Card className="shadow-2xl border-primary/20">
                <CardHeader className="text-center">
                    <CardTitle>Capturar Documento</CardTitle>
                    <CardDescription>Utilize seu RG ou CNH original para agilizar o processo.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="aspect-[3/2] bg-muted/50 rounded-xl border-2 border-dashed border-primary/20 flex flex-col items-center justify-center text-center p-6 relative overflow-hidden">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <div className="space-y-1">
                                    <p className="font-bold text-primary flex items-center justify-center gap-2">
                                        <Sparkles className="h-4 w-4" /> Analisando Dados...
                                    </p>
                                    <p className="text-xs text-muted-foreground">Mapeando campos oficiais do documento</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="absolute inset-4 border-2 border-primary/10 rounded-lg pointer-events-none" />
                                <Camera className="h-12 w-12 text-primary/40 mb-4" />
                                <p className="text-sm font-medium text-muted-foreground">Posicione o documento no centro e evite reflexos.</p>
                            </>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button className="w-full h-12 font-bold" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                        <Camera className="mr-2 h-5 w-5" />
                        Tirar Foto Agora
                    </Button>
                    <div className="grid grid-cols-2 gap-2 w-full">
                        <Button variant="outline" onClick={() => setStep('welcome')} disabled={isProcessing}>Voltar</Button>
                        <Button variant="secondary" onClick={() => setStep('form')} disabled={isProcessing}>Pular para Manual</Button>
                    </div>
                </CardFooter>
            </Card>
        )}

        {step === 'review' && (
            <Card className="shadow-2xl border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="bg-primary/5 border-b">
                    <div className="flex items-center gap-2 text-primary">
                        <Sparkles className="h-5 w-5" />
                        <CardTitle className="text-lg">Revisar Dados Extraídos</CardTitle>
                    </div>
                    <CardDescription>A IA capturou estes campos. Ajuste se necessário.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input value={parentName} onChange={e => setParentName(e.target.value)} className="font-bold border-primary/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>CPF</Label>
                            <Input value={parentCpf} onChange={e => setParentCpf(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>RG</Label>
                            <Input value={parentRg} onChange={e => setParentRg(e.target.value)} />
                        </div>
                    </div>
                    <Alert className="bg-amber-500/10 text-amber-600 border-amber-500/20 py-2">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-[10px]">Confirme se os números do CPF e RG estão 100% corretos para o contrato.</AlertDescription>
                    </Alert>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t pt-6 bg-muted/20 rounded-b-xl">
                    <Button className="w-full h-12 font-bold" onClick={() => setStep('form')}>
                        Dados Confirmados
                        <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="text-xs" onClick={() => setStep('scan')}>
                        <RefreshCw className="mr-2 h-3 w-3" /> Tentar foto novamente
                    </Button>
                </CardFooter>
            </Card>
        )}

        {step === 'form' && (
          <Card className="shadow-2xl border-primary/20 flex flex-col h-[90vh]">
            <CardHeader className="border-b bg-muted/30 shrink-0">
              <CardTitle className="text-lg">Finalizar Inscrição</CardTitle>
              <CardDescription>Complete com seus contatos e endereço.</CardDescription>
            </CardHeader>
            
            <ScrollArea className="flex-1">
                <CardContent className="space-y-6 pt-6 pb-10">
                    <div className="space-y-4">
                        <p className="text-sm font-bold flex items-center gap-2 text-primary">
                            <User className="h-4 w-4" /> Identificação do Responsável
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome Completo *</Label>
                                <Input value={parentName} onChange={e => setParentName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>CPF *</Label>
                                    <Input value={parentCpf} onChange={e => setParentCpf(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>RG</Label>
                                    <Input value={parentRg} onChange={e => setParentRg(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                        <p className="text-sm font-bold flex items-center gap-2 text-primary">
                            <Smartphone className="h-4 w-4" /> Contato
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>E-mail *</Label>
                                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp *</Label>
                                <Input value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                            <MapPin className="h-4 w-4" /> Endereço de Embarque
                        </p>
                        <div className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>CEP *</Label>
                                    <div className="relative">
                                        <Input value={zipCode} onChange={e => setZipCode(e.target.value)} />
                                        {isFetchingCep && <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label>Rua *</Label>
                                    <Input value={street} onChange={e => setStreet(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Número *</Label>
                                    <Input value={number} onChange={e => setNumber(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Bairro</Label>
                                    <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                            <Users className="h-4 w-4" /> Dados do Aluno
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Filho(a) *</Label>
                                <Input value={studentName} onChange={e => setStudentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola de Destino *</Label>
                                <Select onValueChange={setSelectedSchoolId} value={selectedSchoolId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione a escola..." /></SelectTrigger>
                                    <SelectContent>
                                        {schools?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Série/Ano</Label>
                                    <Select onValueChange={setStudentSerie} value={studentSerie}>
                                        <SelectTrigger><SelectValue placeholder="Série..." /></SelectTrigger>
                                        <SelectContent>
                                            {SERIE_OPTIONS.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Turno Operacional *</Label>
                                    <Select onValueChange={setShift} value={shift}>
                                        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Manhã">Manhã</SelectItem>
                                            <SelectItem value="Tarde">Tarde</SelectItem>
                                            <SelectItem value="Integral">Integral</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                            <DollarSign className="h-4 w-4" /> Preferências Financeiras
                        </p>
                        <div className="space-y-2">
                            <Label>Dia de Vencimento Sugerido</Label>
                            <Select onValueChange={setPreferredPaymentDay} value={preferredPaymentDay}>
                                <SelectTrigger><SelectValue placeholder="Escolha um dia..." /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>Dia {day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </ScrollArea>

            <CardFooter className="border-t p-6 shrink-0 bg-background">
                <Button className="w-full h-14 text-base font-bold" onClick={() => setStep('photo')} disabled={!isFormValid()}>
                    Próximo: Identificação do Aluno
                    <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </CardFooter>
          </Card>
        )}

        {step === 'photo' && (
            <Card className="shadow-2xl border-primary/20 animate-in slide-in-from-bottom-4 duration-500">
                <CardHeader className="bg-primary/5 border-b text-center">
                    <CardTitle>Identificação do Aluno</CardTitle>
                    <CardDescription>Esta foto ajuda o motorista no embarque.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-8 flex flex-col items-center">
                    <div className="relative">
                        <Avatar className="h-48 w-48 border-4 border-background shadow-2xl">
                            <AvatarImage src={photoUrl} style={{ objectFit: 'cover' }} />
                            <AvatarFallback className="bg-secondary text-primary"><User className="h-20 w-20" /></AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-2 -right-2 bg-primary p-3 rounded-full text-white shadow-lg"><Camera className="h-6 w-6" /></div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t pt-6 bg-muted/20">
                    <input type="file" accept="image/*" capture="user" className="hidden" id="student-photo-input" onChange={handleStudentPhotoChange} />
                    <Button className="w-full h-14 text-base font-bold" onClick={() => document.getElementById('student-photo-input')?.click()}>
                        {photoUrl ? "Tirar outra foto" : "Capturar Foto do Filho(a)"}
                    </Button>
                    <Button variant="secondary" className="w-full" onClick={() => setStep('health')}>Continuar</Button>
                </CardFooter>
            </Card>
        )}

        {step === 'health' && (
            <Card className="shadow-2xl border-destructive/20 animate-in slide-in-from-right-4 duration-500">
                <CardHeader className="bg-destructive/5 border-b">
                    <div className="flex items-center gap-2 text-destructive">
                        <HeartPulse className="h-5 w-5" />
                        <CardTitle>Saúde e Cuidados</CardTitle>
                    </div>
                    <CardDescription>Alertas para o motorista.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                    <div className="grid grid-cols-1 gap-3">
                        {HEALTH_CATEGORIES.map(cat => (
                            <div key={cat.id} onClick={() => toggleCondition(cat.id)} className={cn("flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all", medicalConditions.includes(cat.id) ? "border-destructive bg-destructive/5" : "border-muted")}>
                                <div className={cn("p-2 rounded-full", medicalConditions.includes(cat.id) ? "bg-destructive text-white" : "bg-muted")}>{cat.icon}</div>
                                <span className="text-sm font-medium flex-1">{cat.label}</span>
                                <Checkbox checked={medicalConditions.includes(cat.id)} onCheckedChange={() => {}} />
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 pt-4 border-t">
                        <Label className="text-xs">Observações Adicionais</Label>
                        <Textarea placeholder="Detalhes importantes..." value={medicalNote} onChange={e => setMedicalNote(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t pt-6 bg-muted/20">
                    <Button className="w-full h-14 text-base font-bold bg-green-600" onClick={handleFinalSubmit}>Finalizar e Enviar</Button>
                </CardFooter>
            </Card>
        )}

        {step === 'success' && (
            <Card className="shadow-2xl border-green-500/20 text-center p-8">
                <CardContent className="space-y-6 pt-6 text-center">
                    <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20 mb-4">
                        <CheckCircle className="text-green-500 h-10 w-10" />
                    </div>
                    <h2 className="text-2xl font-bold">Inscrição Enviada!</h2>
                    <p className="text-muted-foreground text-sm">Recebemos seus dados. O gestor analisará a viabilidade e entrará em contato.</p>
                    <Button asChild className="w-full h-12 font-bold"><Link href="/">Voltar para o Início</Link></Button>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
