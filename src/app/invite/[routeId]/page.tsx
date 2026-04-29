'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useMockCollection, useMockData } from '@/hooks/use-mock-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Bus, 
  MapPin, 
  ShieldCheck, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  Navigation,
  School,
  Sparkles,
  Info,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// Componente interno que lida com o Leaflet de forma segura no lado do cliente
const LeafletMap = dynamic(() => import('@/components/shared/leaflet-map-wrapper'), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-muted animate-pulse flex items-center justify-center text-[10px] font-bold">CARREGANDO MAPA...</div>
});

// Ícone customizado para o Leaflet (precisa de fix para Next.js)
let Icon: any;
if (typeof window !== 'undefined') {
  const L = require('leaflet');
  Icon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
  });
}

export default function ParentInvitePage() {
  const params = useParams();
  const routeId = params?.routeId as string;
  const { data: routes, isLoading: isRouteLoading } = useMockCollection('routes', [{ field: 'id', op: '==', value: routeId }]);
  const { addDoc } = useMockData() as any;
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isLoading, setIsLoading] = useState(false);
  const [studentName, setStudentName] = useState("");
  const [parentName, setParentName] = useState("");
  const [parentPhone, setParentPhone] = useState("");
  const [parentCpf, setParentCpf] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [serviceType, setServiceType] = useState("completo");
  const [mapPosition, setMapPosition] = useState<[number, number]>([-23.5505, -46.6333]);
  const [addressDesc, setAddressDesc] = useState("");
  const [cep, setCep] = useState("");

  const route = routes?.[0];
  const isWaitlist = useMemo(() => {
    if (!route) return false;
    return (route.studentIds?.length || 0) >= (route.capacity || 15);
  }, [route]);

  // Efeito para carregar a escola padrão da rota
  useEffect(() => {
    if (route?.schoolName && !selectedSchool) {
      setSelectedSchool(route.schoolName);
    }
  }, [route, selectedSchool]);

  const handleSubmit = async () => {
    if (!studentName || !parentName || !parentPhone || !selectedSchool || !cep) {
      toast({ title: "Ops!", description: "Preencha todos os campos obrigatórios (Responsável e Aluno).", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Criar o aluno com status pendente
      const studentId = `student-pending-${Date.now()}`;
      addDoc('students', {
        id: studentId,
        name: studentName,
        status: 'aguardando_aprovacao', // Status especial para a fila do autônomo
        pendingRouteId: routeId, // Marcamos para qual rota ele quer entrar
        active: false,
        latitude: mapPosition[0],
        longitude: mapPosition[1],
        addressDescription: addressDesc || `CEP: ${cep}`,
        shift: route?.shift || 'Manhã',
        schoolName: selectedSchool,
        parentName: parentName,
        parentPhone: parentPhone,
        parentCpf: parentCpf,
        serviceModality: serviceType,
        createdAt: new Date().toISOString(),
        parentId: `parent-temp-${Date.now()}`
      });

      setStep('success');
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível enviar sua solicitação.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (isRouteLoading) return <div className="min-h-screen flex items-center justify-center bg-secondary/30"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  if (!route) return <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-8 text-center"><Card className="p-8 font-bold">Rota não encontrada ou expirada.</Card></div>;

  return (
    <div className="min-h-screen bg-secondary/30 pb-10">
      {/* Header Visual */}
      <div className="bg-primary pt-12 pb-20 px-6 text-white text-center rounded-b-[40px] shadow-lg">
        <div className="mx-auto w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-4 backdrop-blur-sm animate-bounce">
          <Bus className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-black uppercase tracking-tight">Vaga na Van</h1>
        <p className="text-white/80 text-sm font-bold uppercase tracking-widest mt-1">Rota: {route.name}</p>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-12">
        {step === 'form' ? (
          <Card className="border-primary/20 shadow-2xl overflow-hidden rounded-3xl">
            <CardHeader className="bg-background">
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-black uppercase">Cadastro de Aluno</CardTitle>
                    <CardDescription className="text-xs font-medium">Preencha os dados do seu filho(a) abaixo.</CardDescription>
                  </div>
                  {isWaitlist && (
                    <Badge className="bg-amber-500 text-white border-0 font-black text-[9px] uppercase tracking-tighter animate-pulse">Lista de Espera</Badge>
                  )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div className="space-y-4">
                {/* Dados do Responsável */}
                <div className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <Label className="font-black text-[10px] uppercase text-primary tracking-widest flex items-center gap-2">
                    <Users className="h-3 w-3" /> Dados do Responsável
                  </Label>
                  <div className="space-y-3">
                    <Input placeholder="Nome Completo do Responsável" value={parentName} onChange={e => setParentName(e.target.value)} className="h-11 rounded-xl bg-background" />
                    <div className="grid grid-cols-2 gap-2">
                       <Input placeholder="WhatsApp" value={parentPhone} onChange={e => setParentPhone(e.target.value)} className="h-11 rounded-xl bg-background" />
                       <Input placeholder="CPF" value={parentCpf} onChange={e => setParentCpf(e.target.value)} className="h-11 rounded-xl bg-background" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sName" className="font-bold text-xs uppercase text-primary">Nome do Aluno(a)</Label>
                  <Input id="sName" placeholder="Ex: Enzo Silva" value={studentName} onChange={e => setStudentName(e.target.value)} className="h-12 rounded-xl" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="school" className="font-bold text-xs uppercase text-primary">Escola</Label>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={route.schoolName || "Colégio Amos"}>{route.schoolName || "Colégio Amos"}</SelectItem>
                      <SelectItem value="Outra Escola">Outra Escola (Apoio Logístico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="font-bold text-xs uppercase text-primary">Tipo de Serviço</Label>
                  <RadioGroup value={serviceType} onValueChange={setServiceType} className="grid grid-cols-1 gap-2">
                     {[
                       { id: 'completo', label: 'Ida e Volta', desc: 'Transporte nos dois períodos' },
                       { id: 'so_ida', label: 'Somente Ida', desc: 'Apenas levar para a escola' },
                       { id: 'so_volta', label: 'Somente Volta', desc: 'Apenas buscar na escola' }
                     ].map(t => (
                       <Label key={t.id} className={cn(
                         "flex items-center justify-between p-3 border-2 rounded-xl cursor-pointer transition-all",
                         serviceType === t.id ? "border-primary bg-primary/5" : "border-muted"
                       )}>
                         <div className="flex flex-col">
                           <span className="font-bold text-sm">{t.label}</span>
                           <span className="text-[10px] text-muted-foreground">{t.desc}</span>
                         </div>
                         <RadioGroupItem value={t.id} className="sr-only" />
                         {serviceType === t.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                       </Label>
                     ))}
                  </RadioGroup>
                </div>

                <div className="space-y-3 border-t pt-4">
                  <Label className="font-black text-xs uppercase text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Local de Embarque
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="CEP: 00000-000" value={cep} onChange={e => setCep(e.target.value)} className="h-10 text-xs" />
                    <Input placeholder="Nº / Complemento" value={addressDesc} onChange={e => setAddressDesc(e.target.value)} className="h-10 text-xs" />
                  </div>
                  
                  <div className="h-48 w-full rounded-2xl overflow-hidden border-2 border-primary/10 relative">
                     <LeafletMap center={mapPosition} onPositionChange={setMapPosition} />
                     <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 p-1 rounded-md shadow-md text-[8px] font-bold uppercase tracking-tighter">
                       Toque no mapa para ajustar o pino 📍
                     </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic leading-tight">
                    * O motorista utilizará este ponto para calcular sua rota otimizada.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col p-6 pt-2">
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className={cn(
                  "w-full h-14 text-base font-black uppercase tracking-widest shadow-xl",
                  isWaitlist ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90"
                )}
              >
                {isLoading ? <Loader2 className="animate-spin" /> : (
                  isWaitlist ? "Entrar para Lista de Espera" : "Confirmar Solicitação"
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="border-green-500/20 shadow-2xl text-center p-8 animate-in zoom-in-95 duration-500 rounded-3xl">
             <CardContent className="space-y-6">
                <div className="mx-auto w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20 mb-4">
                  <CheckCircle2 className="text-green-500 h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight">Solicitação Enviada!</h2>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 text-xs leading-relaxed">
                  <p className="font-bold flex items-center justify-center gap-2 text-primary mb-2">
                    <Sparkles className="h-4 w-4" /> Próximos Passos:
                  </p>
                  <p className="text-muted-foreground">
                    O motorista recebeu seus dados e o ponto de embarque. Assim que ele revisar e aprovar, você receberá uma confirmação.
                  </p>
                </div>
                
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-3 text-left">
                   <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-amber-800 leading-tight">
                     Dica: Mantenha seu WhatsApp ativo, o motorista poderá entrar em contato para validar os detalhes.
                   </p>
                </div>

                <Button variant="outline" className="w-full h-12 font-black uppercase tracking-widest" onClick={() => window.location.reload()}>
                   Novo Cadastro
                </Button>
             </CardContent>
          </Card>
        )}
        
        <div className="mt-8 text-center space-y-4">
           <div className="flex items-center justify-center gap-2 opacity-50">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <p className="text-[10px] font-black uppercase tracking-widest">Plataforma Guardian Segura</p>
           </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, className, variant }: any) {
    return <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold", className)}>{children}</span>
}
