
'use client';

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle, 
  Loader2, 
  UserPlus, 
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
  Users,
  ArrowRightLeft,
  KeyRound
} from 'lucide-react';
import { maskCPF, maskPhone, maskCEP, unmask } from '@/lib/masks';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useData, useDataCollection } from '@/hooks/use-data';
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
import { SmartMap } from '@/components/shared/smart-map';
import { geocodeAddress } from '@/ai/flows/geocode-address';

type Step = 'welcome' | 'scan' | 'review' | 'form' | 'photo' | 'health' | 'access' | 'success';

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

import { useSearchParams } from 'next/navigation';

// ... dentro do componente principal ...
function RegisterContent() {
  const searchParams = useSearchParams();
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const registrationType = searchParams.get('type') || 'mensalista';
  const routeId = searchParams.get('routeId');

  // Corrigido: Só busca se houver routeId, evitando preenchimento acidental no teste de ciclo de vida
  const { data: routes } = useDataCollection('routes', routeId ? [{ field: 'id', op: '==', value: routeId }] : [{ field: 'id', op: '==', value: 'force-none' }]);
  const routeData = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  const [step, setStep] = useState<Step>('welcome');
  // ... resto do estado ...
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const { toast } = useToast();
  const { addDoc } = useData();
  const { data: schools } = useDataCollection('schools');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parent Data
  const [parentName, setParentName] = useState('');
  const [parentCpf, setParentCpf] = useState('');
  const [parentRg, setParentRg] = useState('');
  const [parentBirthDate, setParentBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  
  // Student Data
  const [studentName, setStudentName] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [studentSerie, setStudentSerie] = useState('');
  const [studentTurma, setStudentTurma] = useState('');
  const [shift, setShift] = useState<string>(''); 
  const [serviceModality, setServiceModality] = useState<string>('completo');
  const [photoUrl, setPhotoUrl] = useState('');
  
  // Financial
  const [preferredPaymentDay, setPreferredPaymentDay] = useState('10');
  
  // Health
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [medicalNote, setMedicalNote] = useState('');
  
  // Address
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapTrigger, setMapTrigger] = useState(0);

  useEffect(() => {
    if (isMounted) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [step, isMounted]);

  // Efeito para pré-preencher dados da rota se houver routeId
  useEffect(() => {
    if (routeData) {
        setShift(routeData.shift || 'Manhã');
        setStudentSerie(routeData.serie || '');
        // Tenta encontrar o ID da escola pelo nome se não tiver o schoolId na rota
        if (routeData.schoolId) {
            setSelectedSchoolId(routeData.schoolId);
        } else if (routeData.schoolName && schools) {
            const school = schools.find((s: any) => s.name === routeData.schoolName);
            if (school) setSelectedSchoolId(school.id);
        }
    }
  }, [routeData, schools]);

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

  // AUTO-GEOCODING: Quando rua e número mudam, busca coordenadas sugeridas
  useEffect(() => {
    if (street.length > 5 && number.length >= 1 && city.length > 3) {
        const timer = setTimeout(async () => {
            setIsGeocoding(true);
            try {
                const fullAddress = `${street}, ${number} - ${neighborhood}, ${city} - ${state}`;
                const result = await geocodeAddress({ address: fullAddress });
                if (result) {
                    setLatitude(result.latitude);
                    setLongitude(result.longitude);
                    setMapTrigger(prev => prev + 1);
                }
            } catch (e) {
                console.warn("Geocodificação automática silenciosa falhou");
            } finally {
                setIsGeocoding(false);
            }
        }, 1500); // Debounce para não gastar API enquanto digita o número
        return () => clearTimeout(timer);
    }
  }, [street, number, city, neighborhood, state]);

  const handleFinalSubmit = () => {
    if (!isFormValid()) {
        toast({ title: "Dados incompletos", description: "Por favor, preencha todos os campos obrigatórios marcados com *", variant: "destructive" });
        return;
    }

    const registrationData = {
        parentName,
        email,
        phone,
        name: studentName,
        schoolId: selectedSchoolId,
        requestedSchool: routes?.find(r => r.id === routeId)?.name || "Escola Solicitada",
        studentSerie,
        studentTurma,
        shift,
        serviceModality,
        photoUrl,
        preferredPaymentDay: Number(preferredPaymentDay),
        medicalConditions,
        medicalNote,
        status: routeId ? 'aguardando_aprovacao' : 'pending_approval',
        createdAt: new Date().toISOString(),
        address: { zipCode, street, number, complement, neighborhood, city, state, latitude, longitude },
        documentData: { cpf: parentCpf, rg: parentRg, birthDate: parentBirthDate },
        pin, 
        registrationType: routeId ? 'autonomous' : registrationType,
        pendingRouteId: routeId
    };

    // Se for convite de motorista (autônomo), salvamos direto na fila do motorista
    if (routeId) {
        (addDoc as any)('students', {
            ...registrationData,
            id: `student-pending-${Date.now()}`,
            active: false
        });
    } else {
        (addDoc as any)('pending_registrations', registrationData);
    }

    setStep('success');
  };

  const handleRegisterAnother = useCallback(() => {
      // Limpa dados do aluno mas preserva responsável e endereço
      setStudentName('');
      setSelectedSchoolId('');
      setStudentSerie('');
      setStudentTurma('');
      setShift('');
      setPhotoUrl('');
      setMedicalConditions([]);
      setMedicalNote('');
      setStep('form');
      toast({ title: "Novo cadastro iniciado", description: "Seus dados de responsável foram preservados." });
  }, [toast]);

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
              <CardTitle className="text-2xl font-bold">
                {!isMounted ? 'Carregando...' : (routeId ? 'Cadastro de Aluno' : (registrationType === 'avulso' ? 'Cadastro de Viagem Avulsa' : 'Cadastro Guardian'))}
              </CardTitle>
              <CardDescription>
                {!isMounted ? 'Preparando formulário seguro...' : (registrationType === 'avulso' 
                  ? 'Solicite transporte extra para seu filho de forma rápida e segura.' 
                  : 'Inicie seu cadastro para formalizar o transporte escolar do seu filho.')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><Smartphone className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Leitura Inteligente</p>
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
                            <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500 relative w-full h-full justify-center overflow-hidden">
                                {/* Laser Line (Framer Motion for guaranteed visibility) */}
                                <motion.div 
                                    className="absolute inset-x-0 h-1 bg-primary shadow-[0_0_20px_#2ab0c1] z-30"
                                    initial={{ top: "-10%" }}
                                    animate={{ top: "110%" }}
                                    transition={{ 
                                        duration: 2, 
                                        repeat: Infinity, 
                                        ease: "linear" 
                                    }}
                                />

                                {/* Scanning Overlay */}
                                <div className="absolute inset-0 bg-primary/5 backdrop-blur-[1px] z-10" />
                                
                                {/* Scanning Frame Corners */}
                                <div className="absolute top-4 left-4 w-10 h-10 border-t-4 border-l-4 border-primary rounded-tl-xl z-20 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                                <div className="absolute top-4 right-4 w-10 h-10 border-t-4 border-r-4 border-primary rounded-tr-xl z-20 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                                <div className="absolute bottom-4 left-4 w-10 h-10 border-b-4 border-l-4 border-primary rounded-bl-xl z-20 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />
                                <div className="absolute bottom-4 right-4 w-10 h-10 border-b-4 border-r-4 border-primary rounded-br-xl z-20 shadow-[0_0_10px_rgba(var(--primary),0.3)]" />

                                <div className="relative z-30 flex flex-col items-center gap-4 bg-background/40 p-6 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                                    <div className="space-y-1 text-center">
                                        <p className="font-bold text-primary flex items-center justify-center gap-2 text-lg">
                                            <Sparkles className="h-5 w-5 animate-pulse" /> Analisando Dados...
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Escaneando Documento</p>
                                    </div>
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
                <CardFooter className="flex flex-col gap-3 pt-4">
                    <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    <Button className="w-full h-14 text-base font-bold shadow-lg" onClick={() => fileInputRef.current?.click()} disabled={isProcessing}>
                        <Camera className="mr-2 h-5 w-5" />
                        Tirar Foto Agora
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                        <Button variant="outline" className="flex-1 h-12" onClick={() => setStep('welcome')} disabled={isProcessing}>Voltar</Button>
                        <Button variant="secondary" className="flex-1 h-12" onClick={() => setStep('form')} disabled={isProcessing}>Pular p/ Manual</Button>
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
                    <CardDescription>O sistema capturou estes campos. Ajuste se necessário.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                    <div className="space-y-2 animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between">
                            <Label>Nome Completo</Label>
                            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20 gap-1">
                                <Sparkles className="h-2 w-2" /> Extraído por IA
                            </Badge>
                        </div>
                        <Input value={parentName} onChange={e => setParentName(e.target.value)} className="font-bold border-primary/30" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2 animate-in slide-in-from-left delay-75 duration-300">
                            <div className="flex items-center justify-between">
                                <Label>CPF</Label>
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">IA</Badge>
                            </div>
                            <Input value={parentCpf} onChange={e => setParentCpf(e.target.value)} />
                        </div>
                        <div className="space-y-2 animate-in slide-in-from-left delay-150 duration-300">
                            <div className="flex items-center justify-between">
                                <Label>RG</Label>
                                <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">IA</Badge>
                            </div>
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
              <CardTitle className="text-base md:text-lg">Finalizar Inscrição</CardTitle>
              <CardDescription className="text-xs">Complete com seus contatos e endereço.</CardDescription>
            </CardHeader>
            
            <ScrollArea className="flex-1">
                <CardContent className="space-y-6 pt-6 pb-10">
                    <div className="space-y-4">
                        <div className="text-sm font-bold flex items-center gap-2 text-primary">
                            <User className="h-4 w-4" /> Identificação do Responsável
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="parentName">Nome Completo *</Label>
                                <Input id="parentName" value={parentName} onChange={e => setParentName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="parentCpf">CPF *</Label>
                                    <Input id="parentCpf" value={parentCpf} onChange={e => setParentCpf(maskCPF(e.target.value))} maxLength={14} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="parentRg">RG</Label>
                                    <Input id="parentRg" value={parentRg} onChange={e => setParentRg(e.target.value)} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-6">
                        <div className="text-sm font-bold flex items-center gap-2 text-primary">
                            <Smartphone className="h-4 w-4" /> Contato
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail *</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">WhatsApp *</Label>
                                <Input id="phone" value={phone} onChange={e => setPhone(maskPhone(e.target.value))} />
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
                                    <Label htmlFor="zipCode">CEP *</Label>
                                    <div className="relative">
                                        <Input id="zipCode" value={zipCode} onChange={e => setZipCode(maskCEP(e.target.value))} maxLength={9} />
                                        {isFetchingCep && <Loader2 className="absolute right-2 top-3 h-4 w-4 animate-spin text-muted-foreground" />}
                                    </div>
                                </div>
                                <div className="space-y-2 col-span-2">
                                    <Label htmlFor="street">Rua *</Label>
                                    <Input id="street" value={street} onChange={e => setStreet(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="number">Número *</Label>
                                    <Input id="number" value={number} onChange={e => setNumber(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Complemento</Label>
                                    <Input value={complement} onChange={e => setComplement(e.target.value)} placeholder="Ex: Apto 42" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="neighborhood">Bairro</Label>
                                    <Input id="neighborhood" value={neighborhood} onChange={e => setNeighborhood(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city">Cidade *</Label>
                                    <Input id="city" value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">Estado *</Label>
                                    <Input id="state" value={state} onChange={e => setState(e.target.value)} maxLength={2} placeholder="SP" />
                                </div>
                            </div>

                            {/* MAPA DE AJUSTE DE PINO */}
                            {latitude && longitude && (
                                <div className="space-y-2 pt-2 animate-in zoom-in-95 duration-500">
                                    <Label className="text-xs text-primary font-bold flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> Confirme seu local de embarque
                                    </Label>
                                    <div className="h-[200px] rounded-lg border overflow-hidden relative shadow-inner">
                                        <SmartMap 
                                            center={{ lat: latitude, lng: longitude }}
                                            zoom={16}
                                            stops={[]}
                                            forcedMode="osm"
                                            editableMarker={{ latitude, longitude }}
                                            onPositionChange={(lat, lng) => {
                                                setLatitude(lat);
                                                setLongitude(lng);
                                            }}
                                            recenterTrigger={mapTrigger}
                                        />
                                        {isGeocoding && (
                                            <div className="absolute inset-0 bg-background/40 flex items-center justify-center z-[1000]">
                                                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-muted-foreground text-center">
                                        Arraste o pino vermelho se o endereço sugerido estiver impreciso.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                            <Users className="h-4 w-4" /> Dados do Aluno
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="studentName">Nome do Filho(a) *</Label>
                                <Input id="studentName" value={studentName} onChange={e => setStudentName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Escola de Destino *</Label>
                                <Select onValueChange={setSelectedSchoolId} value={selectedSchoolId}>
                                    <SelectTrigger data-testid="select-school"><SelectValue placeholder="Selecione a escola..." /></SelectTrigger>
                                    <SelectContent>
                                        {schools?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
                                        <SelectTrigger data-testid="select-shift"><SelectValue placeholder="Selecione..." /></SelectTrigger>
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
                            <ArrowRightLeft className="h-4 w-4" /> Modalidade do Serviço
                        </p>
                        <div className="space-y-4">
                            <Label>O que você deseja contratar? *</Label>
                            <Select onValueChange={setServiceModality} value={serviceModality}>
                                <SelectTrigger data-testid="select-modality" className="h-12 border-primary/20">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="completo">Ida e Volta (Completo)</SelectItem>
                                    <SelectItem value="so_ida">Somente Ida (Casa {">"} Escola)</SelectItem>
                                    <SelectItem value="so_volta">Somente Volta (Escola {">"} Casa)</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-[10px] text-muted-foreground italic">Nota: O valor da mensalidade será ajustado pelo gestor conforme a modalidade escolhida.</p>
                        </div>
                    </div>

                    {isMounted && registrationType !== 'avulso' && (
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
                    )}
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
                    <CardDescription>Alertas importantes para o monitor/motorista.</CardDescription>
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
                        <Textarea placeholder="Detalhes sobre medicação ou alergias..." value={medicalNote} onChange={e => setMedicalNote(e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 border-t pt-6 bg-muted/20">
                    <Button 
                      className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 whitespace-normal text-center" 
                      onClick={() => setStep('access')}
                    >
                      Segurança de Acesso
                      <ArrowRight className="ml-2 h-5 w-5 shrink-0" />
                    </Button>
                </CardFooter>
            </Card>
        )}

        {step === 'access' && (
            <Card className="shadow-2xl border-primary/20 animate-in zoom-in-95 duration-500">
                <CardHeader className="bg-primary/5 border-b text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <KeyRound className="text-primary h-6 w-6" />
                    </div>
                    <CardTitle>Segurança de Acesso</CardTitle>
                    <CardDescription>Crie um PIN de 6 dígitos para acessar o app.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-8">
                    <div className="space-y-4">
                        <p className="text-sm text-center text-muted-foreground">
                            Você usará seu **CPF** e este **PIN** para acompanhar a van em tempo real assim que o cadastro for aprovado.
                        </p>
                        <div className="space-y-2">
                            <Label>Defina seu PIN de 6 dígitos *</Label>
                            <Input 
                                type="password" 
                                inputMode="numeric"
                                pattern="\d*"
                                maxLength={6}
                                placeholder="000000"
                                className="text-center text-2xl tracking-[1em] font-mono h-16"
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                            />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 border-t pt-6 bg-muted/20">
                    <Button 
                        className="w-full h-14 text-base font-bold bg-green-600 hover:bg-green-700 whitespace-normal leading-tight" 
                        onClick={handleFinalSubmit}
                        disabled={pin.length < 4}
                    >
                        Concluir e Enviar p/ Aprovação
                    </Button>
                    <Button variant="ghost" onClick={() => setStep('health')}>Voltar</Button>
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
                    <p className="text-muted-foreground text-sm">Recebemos seus dados. O gestor analisará a viabilidade e entrará em contato via WhatsApp para o aceite do contrato.</p>
                    <div className="flex flex-col gap-3 pt-4">
                        <Button asChild className="w-full h-12 font-bold"><Link href="/">Voltar para o Início</Link></Button>
                        <Button variant="outline" className="w-full h-12 font-bold border-primary text-primary" onClick={handleRegisterAnother}>
                            <Users className="mr-2 h-5 w-5" /> Cadastrar mais um filho
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}

export default function PublicRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen bg-background"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <RegisterContent />
    </Suspense>
  );
}
