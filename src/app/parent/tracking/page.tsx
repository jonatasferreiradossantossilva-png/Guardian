"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  useMockCollection,
  useMockDoc,
  useMockData,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren, Users, DollarSign, School, CheckCircle, IdCard, Route, Bell, Circle, XCircle, Activity, LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";


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

// Haversine formula to calculate distance between two lat/lng points in KM
function haversineDistance(coords1, coords2) {
  if (!coords1 || !coords2) return Infinity;
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


function ParentRouteMap({ busLocation, student, school, recenterRequest, toast }: { busLocation: LocationUpdate | null, student: Student | null, school: School | null, recenterRequest: any, toast: (options: any) => void }) {
  const map = useMap();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const lastDestinationRef = useRef<string | null>(null);
  const directionsApiCalledRef = useRef(false);

  // Effect to manage the DirectionsRenderer instance
  useEffect(() => {
    if (!map) return;

    if (!directionsRendererRef.current) {
        directionsRendererRef.current = new google.maps.DirectionsRenderer({
            suppressMarkers: true, // We use our own custom markers
            polylineOptions: {
                strokeColor: "#2ab0c1", // Theme's primary color
                strokeOpacity: 0.8,
                strokeWeight: 6,
            },
        });
        directionsRendererRef.current.setMap(map);
    }
    
    // Cleanup on unmount
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, [map]);


  // Effect to fetch and render directions
  useEffect(() => {
    if (!map || !busLocation || !student || !school || !directionsRendererRef.current) {
      directionsRendererRef.current?.setDirections({ routes: [] }); // Clear route if data is missing
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    const origin = { lat: busLocation.latitude, lng: busLocation.longitude };
    const destinationPoint = student.status === 'a_bordo' ? school : student;
    const destination = { lat: destinationPoint.latitude, lng: destinationPoint.longitude };
    const destinationKey = destinationPoint.id;

    // COST-SAVING: Only request new directions if the final destination changes.
    if (lastDestinationRef.current === destinationKey) {
      return;
    }
    
    directionsApiCalledRef.current = false;
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          directionsRendererRef.current?.setDirections(result);
          lastDestinationRef.current = destinationKey;
        } else {
          if (!directionsApiCalledRef.current) {
              toast({
                variant: "destructive",
                title: "Erro ao Traçar Rota no Mapa",
                description: "Não foi possível obter a rota. Verifique se a 'Directions API' está ativada no seu projeto Google Cloud.",
              });
              directionsApiCalledRef.current = true;
          }
          console.error(`Directions request failed due to ${status}`);
          directionsRendererRef.current?.setDirections({ routes: [] });
        }
      }
    );
  }, [map, busLocation, student, school, student?.status, toast]);


  useEffect(() => {
      if (!map || !recenterRequest) return;
      
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
  }, [map, recenterRequest, busLocation, student, school]);

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
             <Avatar className="h-10 w-10 border-2 border-blue-500 shadow-lg">
                <AvatarImage src="https://images.unsplash.com/photo-1503944186934-a1e6704b2a86?q=80&w=200&h=200&auto=format&fit=crop" data-ai-hint="child portrait" />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
            </Avatar>
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
  const [mockUserId, setMockUserId] = useState<string | null>(null);
  const [isNearby, setIsNearby] = useState(false);
  const [recenterRequest, setRecenterRequest] = useState<number | null>(null);

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

  // State for simulated location
  const [simulatedLocation, setSimulatedLocation] = useState<LocationUpdate | null>(null);

  // This effect will run the simulation
  useEffect(() => {
    if (!realLocation || !student || !school) {
        setSimulatedLocation(null);
        return;
    }
    
    // Set initial position only once
    if (!simulatedLocation) {
        setSimulatedLocation(realLocation);
    }
    
    const destination = student.status === 'a_bordo' ? school : student;
    
    const interval = setInterval(() => {
      setSimulatedLocation(prevLocation => {
        if (!prevLocation) return realLocation;

        const start = { lat: prevLocation.latitude, lng: prevLocation.longitude };
        const end = { lat: destination.latitude, lng: destination.longitude };
        
        // Simple linear interpolation
        const step = 0.05; // Move 5% of the remaining distance each step
        const newLat = start.lat + (end.lat - start.lat) * step;
        const newLng = start.lng + (end.lng - start.lng) * step;
        
        // Stop simulation when very close to the destination
        const distance = haversineDistance({lat: newLat, lng: newLng}, end);
        if (distance < 0.1) { // less than 100 meters
          clearInterval(interval);
          return { latitude: end.lat, longitude: end.lng, timestamp: new Date().toISOString() };
        }

        return { latitude: newLat, longitude: newLng, timestamp: new Date().toISOString() };
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);

  }, [realLocation, student, school, student?.status, simulatedLocation]); // Rerun simulation if destination changes

  // The location to display is the simulated location
  const displayLocation = simulatedLocation;

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
      } else {
        setIsNearby(false);
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
  
  const handleRecenterMap = () => {
    setRecenterRequest(Date.now());
    toast({ title: "Mapa centralizado na rota." });
  };


  const isLoading = areParentsLoading || areStudentsLoading || isRouteLoading || isLocationLoading;
  const studentStatus = student?.status || 'aguardando';

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento da Rota</h1>
          <div className="flex items-center gap-2">
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
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <User />
                                    Status de {student.name}
                                </CardTitle>
                            </div>
                            <Badge variant={statusBadgeVariant[studentStatus]}>{statusText[studentStatus]}</Badge>
                        </div>
                        {isNearby && student.status === 'aguardando' && (
                            <div className="!mt-4 p-3 border-b-2 border-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Siren className="h-6 w-6 text-amber-500 animate-pulse" />
                                    <div>
                                        <h3 className="font-bold text-amber-700 dark:text-amber-300">A Van está Próxima!</h3>
                                        <p className="text-sm text-amber-600 dark:text-amber-400">Prepare-se para o embarque.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardHeader>
                    <CardContent>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <Button
                                variant="destructive"
                                className="w-full"
                                onClick={handleCommunicateAbsence}
                                disabled={student.status === 'ausente'}
                            >
                                <Siren className="mr-2 h-4 w-4" /> Comunicar Ausência
                            </Button>
                            <Button
                                variant="secondary"
                                className="w-full"
                                onClick={handleConfirmPresence}
                                disabled={student.status === 'aguardando'}
                            >
                                <CheckCircle className="mr-2 h-4 w-4" /> Confirmar Presença
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Ações Rápidas</CardTitle>
                    </CardHeader>
                     <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/parent/messages">
                                <MessageCircle className="mr-2 h-4 w-4" /> Mensagens
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/parent/authorized">
                                <Users className="mr-2 h-4 w-4" /> Autorizados
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/parent/financial">
                                <DollarSign className="mr-2 h-4 w-4" /> Financeiro
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="w-full">
                            <Link href="/parent/requests">
                                <Route className="mr-2 h-4 w-4" /> Viagens Avulsas
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="map" className="mt-4">
               <div className="flex justify-center flex-wrap gap-x-4 gap-y-1 mb-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5"><Bus className="h-4 w-4 text-primary" /><span>Van</span></div>
                    <div className="flex items-center gap-1.5"><Avatar className="h-4 w-4 border-blue-500"><AvatarImage src="https://images.unsplash.com/photo-1503944186934-a1e6704b2a86?q=80&w=100&h=100&auto=format&fit=crop" data-ai-hint="child portrait"/><AvatarFallback>A</AvatarFallback></Avatar><span>Aluno</span></div>
                    <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600" /><span>Escola</span></div>
                </div>
              <Card className="h-[75vh]">
                <CardContent className="p-0 h-full relative">
                  <div className="absolute inset-0 bg-secondary flex items-center justify-center overflow-hidden rounded-lg">
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
                                recenterRequest={recenterRequest}
                                toast={toast}
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
                  <Button size="icon" variant="secondary" onClick={handleRecenterMap} className="absolute bottom-4 right-4 z-10 shadow-lg">
                      <LocateFixed className="h-5 w-5" />
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
