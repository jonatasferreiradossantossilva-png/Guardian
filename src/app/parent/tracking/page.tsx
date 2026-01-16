"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useUser,
  useFirestore,
  useCollection,
  useDoc,
  useMemoFirebase,
} from "@/firebase";
import {
  collection,
  query,
  limit,
  doc,
} from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Types matching Firestore data
interface Student {
  id: string;
  name: string;
  status: "aguardando" | "a_bordo" | "desembarcado" | "ausente";
  routeId?: string;
}
interface Route {
  id: string;
  driverId: string;
}
interface LocationUpdate {
  latitude: number;
  longitude: number;
  timestamp: string;
}

const statusText: Record<Student["status"], string> = {
  aguardando: "Aguardando embarque",
  a_bordo: "A bordo da van",
  desembarcado: "Desembarcou em segurança",
  ausente: "Ausente hoje",
};

const statusBadgeVariant: Record<
  Student["status"],
  "default" | "secondary" | "outline" | "destructive"
> = {
  a_bordo: "default",
  aguardando: "secondary",
  desembarcado: "outline",
  ausente: "destructive",
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export default function ParentTrackingPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // For simulation, we find the first student. In a real app, you'd query by parentId linked to the user's UID.
  const studentQuery = useMemoFirebase(
    () => (user && firestore ? query(collection(firestore, "students"), limit(1)) : null),
    [user, firestore]
  );
  const { data: students, isLoading: areStudentsLoading } = useCollection<Student>(studentQuery);
  const student = useMemo(() => (students && students.length > 0 ? students[0] : null), [students]);

  const routeRef = useMemoFirebase(
    () => (firestore && student?.routeId ? doc(firestore, "routes", student.routeId) : null),
    [firestore, student]
  );
  const { data: route, isLoading: isRouteLoading } = useDoc<Route>(routeRef);

  const locationRef = useMemoFirebase(
    () => (firestore && route?.driverId ? doc(firestore, "locations", route.driverId) : null),
    [firestore, route]
  );
  const { data: location, isLoading: isLocationLoading } = useDoc<LocationUpdate>(locationRef);

  const handleCommunicateAbsence = () => {
    // In a real app, this would write to the 'messages' collection.
    // For now, we just show a toast notification.
    toast({
      title: "Ausência comunicada",
      description: `O motorista foi notificado que ${student?.name || 'o aluno'} não precisará de transporte hoje.`,
    });
  };

  const isLoading = isUserLoading || areStudentsLoading || isRouteLoading;
  
  const studentStatus = student?.status || 'aguardando';

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Acompanhamento</h1>
          <Link href="/" passHref>
            <Button variant="outline">Voltar ao Login</Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : !student ? (
          <Card className="text-center p-8">
             <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
             <CardTitle>Nenhum aluno encontrado</CardTitle>
             <CardContent className="mt-2 text-muted-foreground">
                <p>Não foi possível encontrar dados do aluno para acompanhamento.</p>
                <p className="text-xs mt-2">(Para fins de simulação, certifique-se de que há pelo menos um aluno na coleção 'students').</p>
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
                     <p className="text-muted-foreground text-sm pt-2">Acompanhe em tempo real o transporte escolar.</p>
                  </div>
                   <Badge variant={statusBadgeVariant[studentStatus]}>{statusText[studentStatus]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold flex items-center gap-2 mb-2">
                  <MapPin /> Localização da Van
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
                      <Map
                        center={location ? { lat: location.latitude, lng: location.longitude } : { lat: -23.55052, lng: -46.633308 }}
                        zoom={location ? 15 : 12}
                        mapId="rota_segura_parent_map"
                        disableDefaultUI={true}
                        gestureHandling={'greedy'}
                        className="w-full h-full"
                      >
                        {location ? (
                          <AdvancedMarker
                            position={{ lat: location.latitude, lng: location.longitude }}
                          >
                             <div className="p-1 bg-primary rounded-full shadow-lg">
                                <Bus className="h-6 w-6 text-primary-foreground" />
                             </div>
                          </AdvancedMarker>
                        ) : (
                           !isLocationLoading && 
                           <div className="text-muted-foreground text-sm">Localização da van indisponível no momento.</div>
                        )}
                      </Map>
                    </APIProvider>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex-col sm:flex-row gap-2">
              <Button className="w-full sm:w-auto">
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem
              </Button>
              <Button
                variant="destructive"
                className="w-full sm:w-auto"
                onClick={handleCommunicateAbsence}
                disabled={student.status === 'ausente'}
              >
                <Siren className="mr-2 h-4 w-4" /> Comunicar Ausência
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
