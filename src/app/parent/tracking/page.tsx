
"use client";

import { useMemo, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  useMockCollection,
  useMockDoc,
  useMockData,
  useMockNestedDoc,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap, Pin } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, School, CheckCircle, Activity, Share2, FileText, LocateFixed, QrCode, XCircle, DollarSign, Users, Route as RouteIcon, ShieldCheck, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RoutePolyline } from "@/components/shared/route-polyline";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";


// Types matching mock data
interface Student {
  id: string;
  name: string;
  status: "aguardando" | "a_bordo" | "desembarcado" | "ausente_ida" | "ausente_volta" | "ausente_dia_todo";
  routeId?: string;
  schoolId: string;
  latitude: number;
  longitude: number;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  active?: boolean;
}
interface Parent {
    id: string;
    userId: string;
}
interface Route {
  id: string;
  driverId: string;
  studentIds: string[];
  polyline?: string;
}
interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
}
interface School {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}

const statusText: Record<Student["status"], string> = {
  aguardando: "Confirmado / Aguardando",
  a_bordo: "A bordo da van",
  desembarcado: "Desembarcou em segurança",
  ausente_ida: "Ausente na Ida (Manhã)",
  ausente_volta: "Ausente na Volta (Tarde)",
  ausente_dia_todo: "Ausente o Dia Todo",
};

const statusBadgeVariant: Record<
  Student["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  a_bordo: "default",
  aguardando: "secondary",
  desembarcado: "outline",
  ausente_ida: "destructive",
  ausente_volta: "destructive",
  ausente_dia_todo: "destructive",
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Haversine formula to calculate distance between two lat/lng points in KM
function haversineDistance(coords1: {lat: number, lng: number}, coords2: {lat: number, lng: number}) {
  if (!coords1 || !coords2) return Infinity;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords1.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


function ParentRouteMap({ busLocation, student, school, routePolyline, recenterTrigger }: { busLocation: LocationUpdate | null, student: Student | null, school: School | null, routePolyline?: string, recenterTrigger: number }) {
  const map = useMap();

  useEffect(() => {
      if (!map) return;
      
      const bounds = new google.maps.LatLngBounds();
      if (busLocation?.latitude && busLocation?.longitude) {
          bounds.extend({ lat: busLocation.latitude, lng: busLocation.longitude });
      }
      if (student?.latitude && student?.longitude) {
          bounds.extend({ lat: student.latitude, lng: student.longitude });
      }
       if (school?.latitude && school?.longitude) {
          bounds.extend({ lat: school.latitude, lng: school.longitude });
      }

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 100); // 100px padding
      }
  }, [map, busLocation, student, school, recenterTrigger]);

  return (
    <>
      {routePolyline && <RoutePolyline geoJsonPath={routePolyline} />}
      {busLocation && (
        <AdvancedMarker position={{ lat: busLocation.latitude, lng: busLocation.longitude }} title="Posição da Van">
          <Pin background={'#2ab0c1'} borderColor={'#fff'} glyphColor="#fff">
            <Bus />
          </Pin>
        </AdvancedMarker>
      )}
      {student && (
        <AdvancedMarker position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
             <Pin background={'#3b82f6'} borderColor={'#fff'}>
                <Avatar className="h-6 w-6">
                    <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/40/40`} alt={student.name} />
                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                </Avatar>
            </Pin>
        </AdvancedMarker>
      )}
      {school && (
        <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
          <Pin background={'#dc2626'} borderColor={'#fff'} glyphColor="#fff">
            <School />
          </Pin>
        </AdvancedMarker>
      )}
    </>
  );
}


export default function ParentTrackingPage() {
  const { toast } = useToast();
  const { updateDoc } = useMockData();
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  
  // Absence State
  const [isAbsenceDialogOpen, setIsAbsenceDialogOpen] = useState(false);
  const [selectedAbsenceType, setSelectedAbsenceType] = useState<"ausente_ida" | "ausente_volta" | "ausente_dia_todo">("ausente_dia_todo");

  useEffect(() => {
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || "user-pai-1");
  }, []);

  const { data: parents, isLoading: areParentsLoading } = useMockCollection("parents", mockUserId ? [
    { field: "userId", op: "==", value: mockUserId },
  ] : undefined);
  const parent = useMemo(() => (parents && parents.length > 0 ? parents[0] : null), [parents]);

  const { data: students, isLoading: areStudentsLoading } = useMockCollection("students", parent ? [
    { field: "parentId", op: "==", value: parent.id },
  ] : undefined);
  const student = useMemo(() => (students && students.length > 0 ? students[0] : null), [students]);
  
  const { data: route, isLoading: isRouteLoading } = useMockDoc("routes", student?.routeId);
  const { data: driver, isLoading: isDriverLoading } = useMockDoc("drivers", route?.driverId);

  const { data: displayLocation, isLoading: isLocationLoading } = useMockNestedDoc(route?.driverId ? `locations/${route.driverId}`: null);
  
  const { data: school } = useMockDoc('schools', student?.schoolId);
  
  const handleCommunicateAbsence = useCallback(async () => {
    if (!student) return;
    updateDoc('students', student.id, { status: selectedAbsenceType });
    setIsAbsenceDialogOpen(false);
    toast({
      title: "Ausência comunicada",
      description: `O motorista foi notificado: ${statusText[selectedAbsenceType]}.`,
    });
  }, [student, selectedAbsenceType, updateDoc, toast]);

  const handleConfirmPresence = () => {
    if (!student) return;
    updateDoc('students', student.id, { status: 'aguardando' });
    toast({
        title: "Presença Confirmada!",
        description: `O motorista foi notificado que ${student.name} aguardará o transporte.`,
    });
  };

  const handleShareTrip = useCallback(() => {
    if (!student || !displayLocation) {
      toast({
        title: "Informações incompletas",
        description: "Aguarde a localização da van e do aluno para compartilhar.",
        variant: "destructive",
      });
      return;
    }

    const studentCoords = { lat: student.latitude, lng: student.longitude };
    const busCoords = { lat: displayLocation.latitude, lng: displayLocation.longitude };

    const distance = haversineDistance(busCoords, studentCoords);
    const avgSpeedKmH = 25;
    const timeHours = distance / avgSpeedKmH;
    const timeMinutes = Math.round(timeHours * 60);

    const arrivalTime = new Date();
    arrivalTime.setMinutes(arrivalTime.getMinutes() + timeMinutes);
    const etaString = arrivalTime.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const studentName = student.name;
    const mapLink = `https://www.google.com/maps/dir/?api=1&origin=${busCoords.lat},${busCoords.lng}&destination=${studentCoords.lat},${studentCoords.lng}`;

    let message;
    if (timeMinutes < 2) {
        message = `Olá! A van do(a) ${studentName} está quase chegando. Acompanhe em tempo real aqui: ${mapLink}`;
    } else {
        message = `Olá! A van do(a) ${studentName} está a caminho. A previsão de chegada é por volta das ${etaString} (aprox. ${timeMinutes} min). Acompanhe em tempo real aqui: ${mapLink}`;
    }
    
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    toast({
      title: "Pronto para compartilhar!",
      description: "Sua mensagem foi gerada para ser enviada no WhatsApp.",
    });
  }, [student, displayLocation, toast]);

  const isLoading = areParentsLoading || areStudentsLoading || isRouteLoading || isLocationLoading || isDriverLoading;
  const studentStatus = student?.status || 'aguardando';
  const isAbsent = studentStatus.startsWith('ausente');

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end items-center mb-6">
          <div className="flex items-center gap-2">
            <Link href="/" passHref>
              <Button variant="outline">Sair</Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !parent ? (
          <Card className="text-center p-8">
             <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
             <CardTitle>Conta de Responsável não encontrada</CardTitle>
             <CardContent className="mt-2 text-muted-foreground">
                <p>Não foi possível encontrar uma conta de responsável associada a este login.</p>
             </CardContent>
          </Card>
        ) : !student ? (
           <Card className="text-center p-8">
             <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
             <CardTitle>Nenhum aluno encontrado</CardTitle>
             <CardContent className="mt-2 text-muted-foreground">
                <p>Não foi possível encontrar nenhum aluno associado a esta conta de responsável.</p>
             </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="status" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status"><Activity className="mr-2 h-4 w-4"/>Status & Ações</TabsTrigger>
              <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="mt-4">
              <div className="flex flex-col gap-6">
                 <Card>
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://picsum.photos/seed/student-${student.id}/100/100`} alt={student.name} />
                                    <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <CardTitle>Status de {student.name}</CardTitle>
                                    <CardDescription className="mt-1">Acompanhe a viagem em tempo real.</CardDescription>
                                </div>
                            </div>
                            <Badge variant={statusBadgeVariant[studentStatus]} className="mt-1 h-fit text-center max-w-[120px]">{statusText[studentStatus]}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isAbsent ? (
                            <div className="space-y-3 text-center">
                                <p className="text-sm text-muted-foreground">Você comunicou a ausência: <b>{statusText[studentStatus]}</b>.</p>
                                <Button
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleConfirmPresence}
                                >
                                    <CheckCircle className="mr-2 h-4 w-4" /> Cancelar Ausência e Confirmar Presença
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-center text-sm text-muted-foreground">
                                    Presença confirmada. Avise-nos apenas se houver ausência.
                                </p>
                                <Button
                                    variant="destructive"
                                    className="w-full"
                                    onClick={() => setIsAbsenceDialogOpen(true)}
                                    disabled={student.active === false || studentStatus !== 'aguardando'}
                                >
                                    <XCircle className="mr-2 h-4 w-4" /> Comunicar Ausência
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                     <CardContent className="flex flex-col gap-2">
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/qrcode">
                                <QrCode className="mr-2 h-4 w-4" /> Meu QR Code
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start" onClick={handleShareTrip}>
                            <Share2 className="mr-2 h-4 w-4" /> Compartilhar Viagem
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/messages">
                                <MessageCircle className="mr-2 h-4 w-4" /> Mensagens
                            </Link>
                        </Button>
                         <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/contract">
                                <FileText className="mr-2 h-4 w-4" /> Contrato
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/authorized">
                                <Users className="mr-2 h-4 w-4" /> Autorizados
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/financial">
                                <DollarSign className="mr-2 h-4 w-4" /> Financeiro
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full justify-start">
                            <Link href="/parent/requests">
                                <RouteIcon className="mr-2 h-4 w-4" /> Viagens Avulsas
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="map" className="mt-4">
               <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary" /><span>Van</span></div>
                    <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-blue-500" /><span>Meu Filho</span></div>
                    <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600" /><span>Escola</span></div>
                </div>
              <Card className="h-[70vh]">
                <CardContent className="p-0 h-full relative">
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden rounded-lg">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setRecenterTrigger(c => c + 1)}
                        className="absolute top-3 left-3 z-10 bg-background/80 hover:bg-background"
                        title="Centralizar Rota"
                    >
                        <LocateFixed />
                    </Button>
                    {!API_KEY ? (
                        <div className="text-center p-4">
                            <p className="font-semibold text-lg">Mapa Indisponível</p>
                            <p className="text-muted-foreground text-sm">
                                A chave da API do Google Maps não foi configurada.
                            </p>
                        </div>
                    ) : (
                        <APIProvider apiKey={API_KEY}>
                        <GoogleMap
                            defaultCenter={{ lat: -23.55052, lng: -46.633308 }}
                            defaultZoom={12}
                            mapId="rota_segura_parent_map"
                            disableDefaultUI={true}
                            zoomControl={true}
                            zoomControlOptions={{
                                position: 3,
                            }}
                            gestureHandling={'greedy'}
                            className="w-full h-full"
                        >
                           <ParentRouteMap 
                                busLocation={displayLocation}
                                student={student}
                                school={school}
                                routePolyline={route?.polyline}
                                recenterTrigger={recenterTrigger}
                           />
                           {!displayLocation && !isLocationLoading && (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                                    Aguardando localização da van...
                                </div>
                            )}
                        </GoogleMap>
                        </APIProvider>
                    )}
                  </div>
                </CardContent>
              </Card>
              <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground justify-center">
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                  <span>Por segurança, você vê apenas o trajeto da van e a localização do seu filho.</span>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Absence Selection Dialog */}
      <AlertDialog open={isAbsenceDialogOpen} onOpenChange={setIsAbsenceDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Comunicar Ausência</AlertDialogTitle>
            <AlertDialogDescription>
              Selecione o período em que {student?.name} não utilizará o transporte hoje. Esta informação otimizará a rota do motorista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <RadioGroup value={selectedAbsenceType} onValueChange={(v) => setSelectedAbsenceType(v as any)} className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="ausente_ida" id="r-ida" />
                <Label htmlFor="r-ida" className="flex-1 cursor-pointer font-medium">Faltará apenas na IDA (Escola)</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="ausente_volta" id="r-volta" />
                <Label htmlFor="r-volta" className="flex-1 cursor-pointer font-medium">Faltará apenas na VOLTA (Casa)</Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-md border cursor-pointer hover:bg-secondary/50 has-[[data-state=checked]]:border-primary has-[[data-state=checked]]:bg-primary/5">
                <RadioGroupItem value="ausente_dia_todo" id="r-dia" />
                <Label htmlFor="r-dia" className="flex-1 cursor-pointer font-medium">Faltará o DIA TODO</Label>
              </div>
            </RadioGroup>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCommunicateAbsence} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Confirmar Ausência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
