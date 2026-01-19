"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useUser } from "@/firebase";
import {
  useMockCollection,
  useMockDoc,
  useMockData,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren, Users, DollarSign, School, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

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

export default function ParentTrackingPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();
  const { updateDoc } = useMockData();
  const simulationTimer = useRef(null);
  const [simulatedLocation, setSimulatedLocation] = useState(null);
  const [mockUserId, setMockUserId] = useState<string | null>(null);

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

  const isLoading = isAuthLoading || areParentsLoading || areStudentsLoading || isRouteLoading || isLocationLoading;
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
            <CardHeader>
              <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                        <User />
                        Status de {student.name}
                    </CardTitle>
                     {studentStatus === 'aguardando' && (
                        <p className="text-primary text-sm pt-2">
                            A presença está confirmada. Use o botão abaixo apenas se o aluno for faltar.
                        </p>
                     )}
                     {studentStatus === 'ausente' && (
                         <p className="text-destructive text-sm pt-2">
                            A ausência foi comunicada. O motorista não passará para o embarque.
                         </p>
                     )}
                     {(studentStatus === 'a_bordo' || studentStatus === 'desembarcou') && (
                        <p className="text-muted-foreground text-sm pt-2">Acompanhe em tempo real o transporte escolar.</p>
                     )}
                  </div>
                   <Badge variant={statusBadgeVariant[studentStatus]}>{statusText[studentStatus]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <MapPin /> Localização da Van {simulatedLocation && <Badge variant="outline">Simulação</Badge>}
                </h3>
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
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
                        center={displayLocation ? { lat: displayLocation.latitude, lng: displayLocation.longitude } : { lat: -23.55052, lng: -46.633308 }}
                        zoom={displayLocation ? 15 : 12}
                        mapId="rota_segura_parent_map"
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        className="w-full h-full"
                      >
                        {displayLocation ? (
                          <AdvancedMarker
                            position={{ lat: displayLocation.latitude, lng: displayLocation.longitude }}
                          >
                             <div className="p-1 bg-primary rounded-full shadow-lg">
                                <Bus className="h-6 w-6 text-primary-foreground" />
                             </div>
                          </AdvancedMarker>
                        ) : (
                           !isLocationLoading && 
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                              Aguardando localização da van...
                           </div>
                        )}
                        {student && <AdvancedMarker position={{lat: student.latitude, lng: student.longitude}} title={student.name}>
                             <div className="p-1 rounded-full shadow border-2 border-white bg-blue-500">
                                <User className="h-4 w-4 text-white" />
                             </div>
                        </AdvancedMarker>}
                         {school && <AdvancedMarker position={{lat: school.latitude, lng: school.longitude}} title={school.name}>
                             <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
                                <School className="h-5 w-5 text-white" />
                             </div>
                        </AdvancedMarker>}
                      </GoogleMap>
                    </APIProvider>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 gap-2">
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
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
