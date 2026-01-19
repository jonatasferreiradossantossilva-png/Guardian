"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  List,
  CheckCircle,
  XCircle,
  Bus,
  User,
  Loader2,
  AlertTriangle,
  MapPin,
  School as SchoolIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { APIProvider, Map as GoogleMap, AdvancedMarker } from "@vis.gl/react-google-maps";
import { useMockCollection, useMockData, useMockNestedDoc, useMockDoc } from "@/hooks/use-mock-data";


const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

// Types
type Shift = "Manhã" | "Tarde";
type StudentStatus = "aguardando" | "a_bordo" | "desembarcado" | "ausente";

interface Student {
  id: string;
  name: string;
  status: StudentStatus;
  shift: Shift;
  latitude?: number;
  longitude?: number;
  schoolId: string;
}
interface School {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
}
interface LocationUpdate {
    latitude: number;
    longitude: number;
}

// Status mappings
const statusText: Record<StudentStatus, string> = {
  aguardando: "Aguardando",
  a_bordo: "A Bordo",
  desembarcado: "Desembarcado",
  ausente: "Ausente",
};

const statusBadgeVariant: Record<
  StudentStatus,
  "default" | "secondary" | "outline" | "destructive"
> = {
  a_bordo: "default",
  aguardando: "secondary",
  desembarcado: "outline",
  ausente: "destructive",
};

const statusPinColor: Record<StudentStatus, string> = {
    aguardando: '#6c757d', // secondary
    a_bordo: '#28a745', // green
    desembarcado: '#17a2b8', // info/blue
    ausente: '#dc3545', // destructive
};


export default function RoutePlanPage() {
  const { user, isUserLoading } = useUser();
  const { updateDoc, setDoc } = useMockData();
  const [shift, setShift] = useState<Shift>("Manhã");
  const [mockUserId, setMockUserId] = useState<string | null>(null);

  useEffect(() => {
    // For this prototype, we get the logged-in user's ID from session storage.
    const storedUserId = sessionStorage.getItem('mockUserId');
    setMockUserId(storedUserId || "user-motorista-2"); // Default to a known driver for direct page access
  }, []);

  // 1. Fetch driver profile from the dynamic user ID
  const { data: drivers, isLoading: areDriversLoading } = useMockCollection('drivers', mockUserId ? [
      { field: 'userId', op: '==', value: mockUserId }
  ] : []);
  const driverProfile = useMemo(() => (drivers && drivers.length > 0 ? drivers[0] : null), [drivers]);
  const driverId = driverProfile?.id;

  // 2. Fetch current driver's active route using their profile ID
  const { data: routes, isLoading: isRouteLoading } = useMockCollection("routes", driverId ? [
    { field: "driverId", op: "==", value: driverId },
    { field: "active", op: "==", value: true },
  ] : []);
  const route = useMemo(() => (routes && routes.length > 0 ? routes[0] : null), [routes]);

  // 3. Fetch students for the current route
  const { data: students, isLoading: areStudentsLoading } = useMockCollection("students", route?.studentIds ? [
    { field: 'id', op: 'in', value: route.studentIds }
  ] : []);

  // 4. Order students according to the route plan
  const orderedStudents = useMemo(() => {
    if (!route?.studentIds || !students) return [];
    const studentMap = new Map(students.map((s) => [s.id, s]));
    return route.studentIds
      .map((id) => studentMap.get(id))
      .filter((s): s is Student => !!s);
  }, [route?.studentIds, students]);
  
  // 5. Fetch School data from the first student
  const schoolId = useMemo(() => orderedStudents.length > 0 ? orderedStudents[0].schoolId : null, [orderedStudents]);
  const { data: school, isLoading: isSchoolLoading } = useMockDoc('schools', schoolId);

  // 6. Fetch driver's live location by subscribing to the mock context with the dynamic driverId
  const { data: driverLocation } = useMockNestedDoc(driverId ? `locations/${driverId}` : null);

  const locationRef = useRef(driverLocation);
  useEffect(() => {
    locationRef.current = driverLocation;
  }, [driverLocation]);

  const handleStatusChange = (studentId: string, newStatus: StudentStatus) => {
    updateDoc("students", studentId, { status: newStatus });
  };
  
  // Effect to simulate GPS location updates while route is active
  useEffect(() => {
    if (!route || !driverId) return;

    const isRouteActive = students?.some(s => s.status === 'a_bordo');
    if (!isRouteActive) return;

    const intervalId = setInterval(() => {
      const currentLocation = locationRef.current || { latitude: -23.55052, longitude: -46.633308 };

      const newLat = currentLocation.latitude + (Math.random() - 0.5) * 0.001;
      const newLng = currentLocation.longitude + (Math.random() - 0.5) * 0.001;
      
      const newLocation = {
          latitude: newLat,
          longitude: newLng,
          timestamp: new Date().toISOString(),
      };
      
      // Update the location for the currently logged-in driver
      setDoc(`locations/${driverId}`, newLocation);

    }, 10000); // Update every 10 seconds

    return () => clearInterval(intervalId);
  }, [route, students, driverId, setDoc]);

  const isLoading = isUserLoading || areDriversLoading || isRouteLoading || areStudentsLoading || isSchoolLoading;
  const filteredStudents = orderedStudents.filter((student) => student.shift === shift);
  
  const mapCenter = useMemo(() => {
      if (driverLocation) return { lat: driverLocation.latitude, lng: driverLocation.longitude };
      if (school) return { lat: school.latitude, lng: school.longitude };
      return { lat: -23.55052, lng: -46.633308 }; // Default to São Paulo
  }, [driverLocation, school]);

  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Plano de Rota do Motorista</h1>
         <Link href="/" passHref>
             <Button variant="outline">Voltar ao Login</Button>
          </Link>
      </div>

       {isLoading && (
         <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Carregando dados da rota...</p>
         </div>
       )}

      {!isLoading && !route && (
         <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
            <p className="font-semibold text-xl">Nenhuma rota ativa encontrada para você.</p>
            <p className="text-muted-foreground">Verifique com o administrador se uma rota foi atribuída.</p>
         </div>
      )}

      {!isLoading && route && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2">
             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MapPin /> Mapa da Rota</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video w-full bg-secondary rounded-lg flex items-center justify-center overflow-hidden">
                        {!API_KEY ? (
                             <div className="text-center p-4">
                                <p className="font-semibold text-lg">Mapa Indisponível</p>
                                <p className="text-muted-foreground text-sm">A chave da API do Google Maps não foi configurada.</p>
                            </div>
                        ) : (
                            <APIProvider apiKey={API_KEY}>
                                <GoogleMap
                                    center={mapCenter}
                                    zoom={14}
                                    mapId="rota_segura_driver_map"
                                    disableDefaultUI={true}
                                    gestureHandling={'greedy'}
                                    className="w-full h-full"
                                >
                                    {/* School Marker */}
                                    {school && <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
                                        <div className="p-2 bg-primary rounded-full shadow-lg border-2 border-white">
                                            <SchoolIcon className="h-5 w-5 text-primary-foreground" />
                                        </div>
                                    </AdvancedMarker>}
                                    
                                    {/* Student Markers */}
                                    {filteredStudents.map(student => student.latitude && student.longitude && (
                                        <AdvancedMarker key={student.id} position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
                                            <div className="p-1 rounded-full border-2 border-white shadow" style={{ backgroundColor: statusPinColor[student.status] }}>
                                                <User className="h-4 w-4 text-white" />
                                            </div>
                                        </AdvancedMarker>
                                    ))}

                                    {/* Driver Marker */}
                                    {driverLocation && <AdvancedMarker position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }} title="Sua Posição">
                                         <div className="p-1 bg-blue-500 rounded-full shadow-lg animate-pulse">
                                            <Bus className="h-6 w-6 text-white" />
                                         </div>
                                    </AdvancedMarker>}
                                </GoogleMap>
                            </APIProvider>
                        )}
                    </div>
                </CardContent>
             </Card>
          </div>
          
          {/* Student List Column */}
          <div className="lg:col-span-1">
             <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <List />
                  Controle de Embarque
                </CardTitle>
                <p className="text-muted-foreground text-sm pt-2">
                  {route.name}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-6">
                    <Button onClick={() => setShift("Manhã")} variant={shift === 'Manhã' ? 'default' : 'outline'}>Manhã</Button>
                    <Button onClick={() => setShift("Tarde")} variant={shift === 'Tarde' ? 'default' : 'outline'}>Tarde</Button>
                </div>
                
                <div className="space-y-4">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-secondary"
                    >
                      <div className="flex items-center gap-3 mb-3 sm:mb-0">
                        <User className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{student.name}</span>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {student.status === "aguardando" && (
                          <>
                            <Button size="sm" className="bg-green-600 hover:bg-green-700 flex-1" onClick={() => handleStatusChange(student.id, "a_bordo")}>
                              <CheckCircle className="mr-2 h-4 w-4" /> Embarcar
                            </Button>
                            <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleStatusChange(student.id, "ausente")}>
                              <XCircle className="mr-2 h-4 w-4" /> Ausente
                            </Button>
                          </>
                        )}
                        {student.status === "a_bordo" && (
                          <Button size="sm" className="w-full" onClick={() => handleStatusChange(student.id, "desembarcado")}>
                            <Bus className="mr-2 h-4 w-4" /> Desembarcar
                          </Button>
                        )}
                        {(student.status === "desembarcado" || student.status === "ausente") && (
                          <Badge variant={statusBadgeVariant[student.status]} className="w-full justify-center py-1 text-xs">
                            {statusText[student.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                   {filteredStudents.length === 0 && (
                     <div className="text-center text-muted-foreground py-10">
                        <p>Nenhum aluno para o turno da {shift.toLowerCase()}.</p>
                    </div>
                   )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
