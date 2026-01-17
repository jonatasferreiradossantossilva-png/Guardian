"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@/firebase";
import {
  useMockCollection,
  useMockDoc,
} from "@/hooks/use-mock-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { APIProvider, Map, AdvancedMarker } from "@vis.gl/react-google-maps";
import { MapPin, Bus, User, MessageCircle, AlertTriangle, Loader2, Siren, Users, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

// Types matching mock data
interface Student {
  id: string;
  name: string;
  status: "aguardando" | "a_bordo" | "desembarcado" | "ausente";
  routeId?: string;
}
interface Parent {
    id: string;
    userId: string;
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

// A simple hook to simulate onSnapshot for a single nested doc
const useMockNestedDocSnapshot = (path) => {
    const { getNestedDoc, db } = useMockDoc(); // Assuming useMockDoc provides access to the whole db
    const [data, setData] = useState(() => path ? getNestedDoc(path) : null);

    useEffect(() => {
        // This effect simulates the real-time update. 
        // In a real app, onSnapshot would handle this.
        // Here, we just rely on the fact that db state changes will trigger re-renders in components using this hook.
        if (path) {
            setData(getNestedDoc(path));
        }
    }, [db, path, getNestedDoc]);

    return { data, isLoading: false, error: null };
}


export default function ParentTrackingPage() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const { toast } = useToast();

  const mockUserId = "user-pai-1";

  // Step 1: Find the parent document linked to the logged-in user
  const { data: parents, isLoading: areParentsLoading } = useMockCollection("parents", [
    { field: "userId", op: "==", value: mockUserId },
  ]);
  const parent = useMemo(() => (parents && parents.length > 0 ? parents[0] : null), [parents]);

  // Step 2: Find the student(s) linked to that parent
  const { data: students, isLoading: areStudentsLoading } = useMockCollection("students", parent ? [
    { field: "parentId", op: "==", value: parent.id },
  ] : []);
  const student = useMemo(() => (students && students.length > 0 ? students[0] : null), [students]);
  
  // Step 3: Get the student's route
  const { data: route, isLoading: isRouteLoading } = useMockDoc("routes", student?.routeId);

  // Step 4: Listen to the driver's location from that route
  const { data: location, isLoading: isLocationLoading } = useMockNestedDocSnapshot(route?.driverId ? `locations/${route.driverId}`: null);
  
  const handleCommunicateAbsence = () => {
    toast({
      title: "Ausência comunicada",
      description: `O motorista foi notificado que ${student?.name || 'o aluno'} não precisará de transporte hoje.`,
    });
  };

  const isLoading = isAuthLoading || areParentsLoading || areStudentsLoading || isRouteLoading || isLocationLoading;
  
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
                           <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-secondary">
                              Localização da van indisponível no momento.
                           </div>
                        )}
                      </Map>
                    </APIProvider>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="grid grid-cols-2 md:flex md:flex-row gap-2">
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" /> Enviar Mensagem
              </Button>
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleCommunicateAbsence}
                disabled={student.status === 'ausente'}
              >
                <Siren className="mr-2 h-4 w-4" /> Comunicar Ausência
              </Button>
               <Button variant="outline" className="w-full">
                <Users className="mr-2 h-4 w-4" /> Gerenciar Autorizados
              </Button>
              <Button variant="outline" className="w-full">
                <DollarSign className="mr-2 h-4 w-4" /> Visualizar Financeiro
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
}
