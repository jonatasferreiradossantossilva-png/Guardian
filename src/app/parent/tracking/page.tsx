
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
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren, Users, DollarSign, School, CheckCircle, IdCard, Route, Bell, Circle, XCircle, Activity, LocateFixed, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


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


// --- New component to render directions on the map ---
function Directions({ directions }: { directions: google.maps.DirectionsResult | null }) {
  const map = useMap();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!map) return;
    
    // Initialize renderer if it doesn't exist
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        suppressMarkers: true, // We use our own custom markers
        polylineOptions: {
          strokeColor: "#1c64f2", // A nice blue color for the route
          strokeOpacity: 0.8,
          strokeWeight: 6,
        },
      });
      directionsRendererRef.current.setMap(map);
    }
    
    // Update directions when they change
    if (directions) {
      directionsRendererRef.current.setDirections(directions);
    } else {
      // Clear directions if they are null
      directionsRendererRef.current.setDirections({ routes: [] });
    }

    // Cleanup on unmount
    return () => {
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
        // We don't nullify the ref here to avoid re-creating it on every render
      }
    };
  }, [map, directions]);

  return null; // This component does not render anything directly
}


function ParentRouteMap({ busLocation, student, school, userLocation, recenterRequest }: { busLocation: LocationUpdate | null, student: Student | null, school: School | null, userLocation: any, recenterRequest: any }) {
  const map = useMap();
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const lastDestinationRef = useRef<string | null>(null);

  // Effect to fetch directions from Google Maps API
  useEffect(() => {
    if (!map || !busLocation || !student || !school) {
      setDirections(null); // Clear route if essential data is missing
      return;
    }

    const directionsService = new google.maps.DirectionsService();

    const origin = { lat: busLocation.latitude, lng: busLocation.longitude };
    const destinationPoint = student.status === 'a_bordo' ? school : student;
    const destination = { lat: destinationPoint.latitude, lng: destinationPoint.longitude };
    const destinationKey = destinationPoint.id; // Use ID to check if destination changed

    // COST-SAVING: Only request new directions if the final destination changes.
    // The van icon's movement along the polyline doesn't require new API calls.
    if (lastDestinationRef.current === destinationKey) {
      return;
    }
    
    directionsService.route(
      {
        origin: origin,
        destination: destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
          lastDestinationRef.current = destinationKey; // Store the destination we just routed to
        } else {
          console.error(`Directions request failed due to ${status}`);
          setDirections(null);
        }
      }
    );
  }, [map, busLocation, student, school, student?.status]); // student.status change will trigger this effect


  useEffect(() => {
    if (!map || !recenterRequest) return;
    map.panTo(recenterRequest);
    map.setZoom(16);
  }, [map, recenterRequest]);

  return (
    <>
      <Directions directions={directions} />
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
       {userLocation && (
        <AdvancedMarker position={userLocation} title="Sua Posição">
          <div className="p-1.5 bg-indigo-600 rounded-full border-2 border-white shadow-md">
            <Crosshair className="h-4 w-4 text-white" />
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
  const [userLocation, setUserLocation] = useState(null);
  const [recenterRequest, setRecenterRequest] = useState(null);

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

  // The location to display is ONLY the real location from the database
  const displayLocation = realLocation;

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
  
  const handleSetUserLocation = () => {
    setRecenterRequest(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          setRecenterRequest(loc);
          toast({ title: "Mapa centralizado na sua localização." });
        },
        (error) => {
          // Check the error code to provide a more specific message
          if (error.code === error.PERMISSION_DENIED) {
            toast({
              title: "Permissão de localização negada.",
              description: "Para usar este recurso, você precisa permitir o acesso à sua localização nas configurações do seu navegador ou dispositivo.",
              variant: "destructive",
            });
          } else {
             toast({
              title: "Não foi possível obter a localização.",
              description: "Ocorreu um erro ao tentar buscar sua localização. Tente novamente.",
              variant: "destructive",
            });
          }
        }
      );
    } else {
      toast({
        title: "Geolocalização não suportada",
        description: "Seu navegador não suporta este recurso.",
        variant: "destructive"
      });
    }
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
          <Tabs defaultValue="actions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="actions"><Activity className="mr-2 h-4 w-4"/>Status & Ações</TabsTrigger>
              <TabsTrigger value="map"><MapPin className="mr-2 h-4 w-4"/>Mapa</TabsTrigger>
            </TabsList>
            <TabsContent value="actions" className="mt-4">
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
                        {isNearby && (
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
                    <div className="flex items-center gap-1.5"><User className="h-4 w-4 text-blue-500" /><span>Aluno</span></div>
                    <div className="flex items-center gap-1.5"><School className="h-4 w-4 text-red-600" /><span>Escola</span></div>
                    <div className="flex items-center gap-1.5"><Crosshair className="h-4 w-4 text-indigo-600" /><span>Sua Posição</span></div>
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
                                userLocation={userLocation}
                                recenterRequest={recenterRequest}
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
                  <Button size="icon" variant="secondary" onClick={handleSetUserLocation} className="absolute bottom-4 right-4 z-10 shadow-lg">
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
