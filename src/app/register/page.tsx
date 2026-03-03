'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, UserPlus, FileText, ArrowRight, ShieldCheck, User, MapPin, CalendarDays, Info, Users, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMockData, useMockCollection } from '@/hooks/use-mock-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

type Step = 'welcome' | 'form' | 'success';

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

const PAYMENT_DAYS = Array.from({ length: 31 }, (_, i) => (i + 1).toString());

export default function PublicRegistrationPage() {
  const [step, setStep] = useState<Step>('welcome');
  const [isFetchingCep, setIsFetchingCep] = useState(false);
  const { toast } = useToast();
  const { addDoc } = useMockData();
  const { data: schools } = useMockCollection('schools');

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
  const [preferredPaymentDay, setPreferredPaymentDay] = useState('10');
  
  // Address states
  const [zipCode, setZipCode] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]);

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
            toast({ title: "CEP localizado!", description: "Endereço atualizado automaticamente." });
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

  const handleFinalSubmit = () => {
    if (
        !parentName || 
        !parentCpf ||
        !email || 
        !phone || 
        !studentName || 
        !selectedSchoolId || 
        !zipCode || 
        !street || 
        !number || 
        !neighborhood || 
        !city || 
        !state
    ) {
        toast({ 
            title: "Campos obrigatórios", 
            description: "Por favor, preencha todos os campos do responsável, aluno e endereço completo.", 
            variant: "destructive" 
        });
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
        preferredPaymentDay: Number(preferredPaymentDay),
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
            cpf: parentCpf,
            rg: parentRg,
            birthDate: parentBirthDate
        }
    });

    setStep('success');
  };

  const handleRegisterSibling = () => {
      // Manten os dados do pai e endereço, limpa apenas do aluno
      setStudentName('');
      setSelectedSchoolId('');
      setStudentSerie('');
      setStudentTurma('');
      setStep('form');
      toast({ title: "Pronto para o próximo!", description: "Dados do responsável preservados para agilizar." });
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
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><FileText className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Dados do Responsável</p>
                            <p className="text-xs text-muted-foreground">Informações para o contrato e contato.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/20 p-2 rounded-lg mt-1"><User className="h-4 w-4 text-primary" /></div>
                        <div>
                            <p className="font-semibold text-sm">Dados do Aluno</p>
                            <p className="text-xs text-muted-foreground">Nome, escola e endereço de coleta.</p>
                        </div>
                    </div>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg border border-dashed flex items-center gap-3">
                    <ShieldCheck className="text-green-500 h-5 w-5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-tight">Seus dados estão protegidos por criptografia e serão usados exclusivamente para a formalização do contrato.</p>
                </div>
            </CardContent>
            <CardHeader>
              <Button className="w-full h-12 text-lg" onClick={() => setStep('form')}>
                Começar Cadastro
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </CardHeader>
          </Card>
        )}

        {step === 'form' && (
          <Card className="shadow-2xl border-primary/20 flex flex-col h-[90vh]">
            <CardHeader className="border-b bg-muted/30 shrink-0">
              <CardTitle className="text-lg">Formulário de Inscrição</CardTitle>
              <CardDescription>Preencha os campos abaixo com atenção.</CardDescription>
            </CardHeader>
            
            <ScrollArea className="flex-1">
                <CardContent className="space-y-6 pt-6 pb-10">
                    
                    <div className="space-y-4">
                        <p className="text-sm font-bold flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Dados do Responsável
                        </p>
                        <div className="space-y-2">
                            <Label>Seu Nome Completo</Label>
                            <Input value={parentName} onChange={e => setParentName(e.target.value)} placeholder="Como no documento" />
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>CPF</Label>
                                <Input value={parentCpf} onChange={e => setParentCpf(e.target.value)} placeholder="000.000.000-00" />
                            </div>
                            <div className="space-y-2">
                                <Label>RG</Label>
                                <Input value={parentRg} onChange={e => setParentRg(e.target.value)} placeholder="00.000.000-0" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>E-mail</Label>
                                <Input type="email" placeholder="exemplo@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>WhatsApp</Label>
                                <Input placeholder="(11) 90000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Data de Nascimento</Label>
                            <Input type="date" value={parentBirthDate} onChange={e => setParentBirthDate(e.target.value)} />
                        </div>
                    </div>

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
                                    <Input placeholder="Cidade" value={city} onChange={e => setCity(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Estado (UF)</Label>
                                <Input placeholder="UF" value={state} onChange={e => setState(e.target.value)} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="border-t pt-6">
                        <p className="text-sm font-bold mb-4 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-primary" /> Preferências Financeiras
                        </p>
                        <div className="space-y-2">
                            <Label>Dia de Vencimento (Desejado)</Label>
                            <Select onValueChange={setPreferredPaymentDay} value={preferredPaymentDay}>
                                <SelectTrigger><SelectValue placeholder="Selecione o dia..." /></SelectTrigger>
                                <SelectContent>
                                    {PAYMENT_DAYS.map(day => <SelectItem key={day} value={day}>Dia {day}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

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
                        Finalizar Inscrição
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground text-xs" onClick={() => setStep('welcome')}>
                        Voltar
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
                        <h2 className="text-2xl font-bold">Inscrição Enviada!</h2>
                        <p className="text-muted-foreground text-sm leading-relaxed">Recebemos seus dados. O gestor analisará a viabilidade da rota e entrará em contato.</p>
                    </div>
                    
                    <div className="flex flex-col gap-3 pt-4">
                        <Button className="w-full h-12" onClick={handleRegisterSibling}>
                            <Users className="mr-2 h-5 w-5" />
                            Cadastrar Outro Filho
                        </Button>
                        <Button asChild variant="outline" className="w-full h-12">
                            <Link href="/">Voltar para o Início</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}