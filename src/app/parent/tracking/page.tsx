
"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  useMockCollection,
  useMockDoc,
  useMockData,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren, Users, DollarSign, School, CheckCircle, IdCard, Route, Bell, Circle, XCircle, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types matching mock data
interface Student {
  id: string;
  name: string;
  status: "aguardando" | "a_bordo" | "desembarcado" | "ausente";
  routeId?: string;
  schoolId: string;
  latitude: number;
  longitude: number;
}
interface Parent {
    id: string;
    userId: string;
}
interface Route {
  id: string;
  driverId: string;
  studentIds: string[];
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
  desembarcou: "Desembarcou em segurança",
  ausente: "Ausente hoje",
};

const statusBadgeVariant: Record<
  Student["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  a_bordo: "default",
  aguardando: "secondary",
  desembarcou: "outline",
  ausente: "destructive",
};

const statusIconMap: Record<Student['status'], React.ReactNode> = {
  aguardando: <Circle className="h-5 w-5 text-muted-foreground/30" />,
  a_bordo: <CheckCircle className="h-5 w-5 text-primary" />,
  desembarcou: <CheckCircle className="h-5 w-5 text-green-500" />,
  ausente: <XCircle className="h-5 w-5 text-destructive/80" />,
};


const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// A simple hook to simulate onSnapshot for a single nested doc
const useMockNestedDocSnapshot = (path) => {
    const { getNestedDoc, db } = useMockData();
    const [data, setData] = useState(() => path ? getNestedDoc(path) : null);

    useEffect(() => {
        if (path) {
            setData(getNestedDoc(path));
        } else {
            setData(null);
        }
    }, [db, path, getNestedDoc]);

    return { data, isLoading: false, error: null };
}

// Function to interpolate points on a straight line
const interpolate = (start, end, factor) => {
    return start + (end - start) * factor;
};

// Haversine formula to calculate distance between two lat/lng points in KM
function haversineDistance(coords1, coords2) {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371; // Earth radius in km

  const dLat = toRad(coords2.lat - coords1.lat);
  const dLon = toRad(coords2.lng - coords1.lng);
  const lat1 = toRad(coords1.lat);
  const lat2 = toRad(coords2.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}


function ParentRouteMap({ busLocation, student, school }: { busLocation: LocationUpdate | null, student: Student | null, school: School | null }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    
    if (!busLocation && !student && !school) {
        map.setCenter({ lat: -23.55052, lng: -46.633308 });
        map.setZoom(12);
        return;
    }

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

    if (bounds.isEmpty()) {
       if (busLocation) {
         map.setCenter({ lat: busLocation.latitude, lng: busLocation.longitude });
         map.setZoom(15);
       }
    } else {
        map.fitBounds(bounds, 100);
    }
    

  }, [map, busLocation, student, school]);

  return (
    <>
      {busLocation && (
        <AdvancedMarker position={{ lat: busLocation.latitude, lng: busLocation.longitude }} title="Posição da Van">
          <div className="p-1 bg-primary rounded-full shadow-lg">
            <Bus className="h-6 w-6 text-primary-foreground" />
          </div>
        </AdvancedMarker>
      )}
      {student && (
        <AdvancedMarker position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
          <div className="p-1 rounded-full shadow border-2 border-white bg-blue-500">
            <User className="h-4 w-4 text-white" />
          </div>
        </AdvancedMarker>
      )}
      {school && (
        <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
          <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
            <School className="h-5 w-5 text-white" />
          </div>
        </AdvancedMarker>
      )}
    </>
  );
}


export default function ParentTrackingPage() {
  const { toast } = useToast();
  const { updateDoc } = useMockData();
  const simulationTimer = useRef(null);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isNearby, setIsNearby] = useState(false);

  useEffect(() => {
    // For this prototype, we get the logged-in user's ID from session storage.
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || "user-pai-1"); // Default to a known parent for direct page access
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

  // Real location from DB
  const { data: realLocation, isLoading: isLocationLoading } = useMockNestedDocSnapshot(route?.driverId ? `locations/${route.driverId}`: null);

  const { data: school } = useMockDoc('schools', student?.schoolId);
  const { data: allStudents } = useMockCollection('students');
  const allStudentsMap = useMemo(() => new Map(allStudents?.map(s => [s.id, s])), [allStudents]);

  const orderedStudentsOnRoute = useMemo(() => {
    if (!route?.studentIds || !allStudentsMap.size) return [];
    return route.studentIds
        .map(id => allStudentsMap.get(id))
        .filter((s): s is Student => !!s);
}, [route, allStudentsMap]);


  // Simulation Logic Effect
  useEffect(() => {
    const startSimulation = () => {
        if (!route || !allStudentsMap.size || !school || !student) return;

        let lastKnownPosition = realLocation ? { lat: realLocation.latitude, lng: realLocation.longitude } : null;

        // Find next stop
        const currentStopIndex = route.studentIds.findIndex(id => id === student.id);
        const nextStopId = route.studentIds[currentStopIndex + 1] || school.id;
        const nextStop = nextStopId === school.id ? school : allStudentsMap.get(nextStopId);
        
        if (!nextStop) return;

        const endPoint = { lat: nextStop.latitude, lng: nextStop.longitude };
        
        // If there's no driver location, start simulation from student's home
        if(!lastKnownPosition) {
            lastKnownPosition = { lat: student.latitude, lng: student.longitude };
        }
        
        const startPoint = lastKnownPosition;
        let step = 0;
        const totalSteps = 20; // 5s * 20 = 100s to reach next stop

        simulationTimer.current = setInterval(() => {
            step++;
            if (step > totalSteps) {
                clearInterval(simulationTimer.current);
                return;
            }
            const factor = step / totalSteps;
            const newLat = interpolate(startPoint.lat, endPoint.lat, factor);
            const newLng = interpolate(startPoint.lng, endPoint.lng, factor);
            setSimulatedLocation({ latitude: newLat, longitude: newLng });
        }, 5000);
    };

    const fallbackTimeout = setTimeout(() => {
        // If after 3 seconds we have no real location, but we have a route, start simulation
        if (!realLocation && route) {
            startSimulation();
        }
    }, 3000);

    // If real location appears, stop simulation
    if (realLocation && simulationTimer.current) {
        clearInterval(simulationTimer.current);
        setSimulatedLocation(null);
    }
    
    // Cleanup
    return () => {
        clearTimeout(fallbackTimeout);
        if (simulationTimer.current) {
            clearInterval(simulationTimer.current);
        }
    };

  }, [realLocation, route, allStudentsMap, school, student]);

  const displayLocation = realLocation || simulatedLocation;

  // Effect for proximity check
  useEffect(() => {
      if (displayLocation && student) {
        const distance = haversineDistance(
          { lat: displayLocation.latitude, lng: displayLocation.longitude },
          { lat: student.latitude, lng: student.longitude }
        );

        // Threshold in kilometers (1km)
        const NEARBY_THRESHOLD_KM = 1;

        if (distance < NEARBY_THRESHOLD_KM) {
          setIsNearby(true);
        } else {
          setIsNearby(false);
        }
      }
    }, [displayLocation, student]);
  
  const handleCommunicateAbsence = () => {
    if (!student) return;
    updateDoc('students', student.id, { status: 'ausente' });
    toast({
      title: "Ausência comunicada",
      description: `O motorista foi notificado que ${student?.name || 'o aluno'} não precisará de transporte hoje.`,
    });
  };

  const handleConfirmPresence = () => {
    if (!student) return;
    updateDoc('students', student.id, { status: 'aguardando' });
    toast({
        title: "Presença Confirmada!",
        description: `O motorista foi notificado que ${student.name} aguardará o transporte.`,
    });
  };

  const isLoading = areParentsLoading || areStudentsLoading || isRouteLoading || isLocationLoading;
  const studentStatus = student?.status || 'aguardando';

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/parent/messages">
                <MessageCircle className="mr-2 h-4 w-4" /> Mensagens
              </Link>
            </Button>
            <Link href="/" passHref>
              <Button variant="outline">Voltar ao Login</Button>
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
                <p className="text-xs mt-2">(Modo de apresentação: usando ID de pai "user-pai-1".)</p>
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
          <Card>
            <Tabs defaultValue="status" className="w-full">
              <CardHeader>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="status"><Activity className="mr-2 h-4 w-4"/>Status e Ações</TabsTrigger>
                  <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa em Tempo Real</TabsTrigger>
                </TabsList>
              </CardHeader>
              
              <TabsContent value="status" className="m-0">
                  <div className="p-6 pt-0">
                    {isNearby && (
                        <div className="p-4 mb-4 border-b-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                            <div className="flex items-center gap-3">
                                <Siren className="h-6 w-6 text-amber-500 animate-pulse" />
                                <div>
                                    <h3 className="font-bold text-amber-700 dark:text-amber-300">A Van está Próxima!</h3>
                                    <p className="text-sm text-amber-600 dark:text-amber-400">Prepare-se para o embarque de {student.name}.</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <CardHeader className="p-0">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User />
                                    Status de {student.name}
                                </CardTitle>
                                <CardDescription className={cn('pt-2', studentStatus === 'ausente' && 'text-destructive')}>
                                    {studentStatus === 'aguardando' && 'A presença está confirmada. Use o botão abaixo apenas se o aluno for faltar.'}
                                    {studentStatus === 'ausente' && 'A ausência foi comunicada. O motorista não passará para o embarque.'}
                                    {(studentStatus === 'a_bordo' || studentStatus === 'desembarcou') && 'Acompanhe em tempo real o transporte escolar.'}
                                </CardDescription>
                            </div>
                            <Badge variant={statusBadgeVariant[studentStatus]}>{statusText[studentStatus]}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCommunicateAbsence}
                            >
                                <Siren className="mr-2 h-4 w-4" /> Comunicar Ausência
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleConfirmPresence}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Presença
                            </Button>
                        </div>
                    </CardContent>
                  </div>
                   <CardFooter className="flex flex-col gap-2 pt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/parent/authorized">
                                    <Users className="mr-2 h-4 w-4" /> Gerenciar Autorizados
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="w-full">
                                <Link href="/parent/financial">
                                    <DollarSign className="mr-2 h-4 w-4" /> Visualizar Financeiro
                                </Link>
                            </Button>
                        </div>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/parent/requests">
                                <Route className="mr-2 h-4 w-4" /> Solicitar Viagem Avulsa
                            </Link>
                        </Button>
                        <Button variant="ghost" className="w-full border-dashed border" onClick={() => setIsNearby(v => !v)}>
                            <Bell className="mr-2 h-4 w-4" />
                            Testar Notificação de Proximidade
                        </Button>
                    </CardFooter>
              </TabsContent>

              <TabsContent value="map" className="m-0">
                <CardContent className="p-0">
                    <div className="h-[70vh] bg-secondary flex items-center justify-center overflow-hidden">
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
                            gestureHandling={'greedy'}
                            className="w-full h-full"
                        >
                           <ParentRouteMap 
                                busLocation={displayLocation}
                                student={student}
                                school={school}
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
              </TabsContent>
            </Tabs>
          </Card>
        )}
      </div>
    </div>
  );
}
