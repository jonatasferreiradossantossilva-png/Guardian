
"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Clock, Route as RouteIcon, Users, Bot, School, Navigation, Siren, Home, MapPin, ListTree } from "lucide-react";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { optimizeSchoolVanRoute, OptimizeSchoolVanRouteOutput } from "@/ai/flows/optimizeSchoolVanRoute";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { APIProvider, Map as GoogleMap, AdvancedMarker, useMap } from "@vis.gl/react-google-maps";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const Polyline = (props: google.maps.PolylineOptions) => {
  const map = useMap();
  const polylineRef = useRef<google.maps.Polyline>();

  useEffect(() => {
    if (!map) {
      return;
    }
    polylineRef.current = new google.maps.Polyline();
    polylineRef.current.setMap(map);

    return () => {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [map]);

  useEffect(() => {
    if (polylineRef.current) {
      polylineRef.current.setOptions(props);
    }
  }, [props]);

  return null;
};


const formatAddress = (entity) => {
    if (!entity?.street) return 'Endereço indisponível';
    return `${entity.street}, ${entity.number}, ${entity.neighborhood}, ${entity.city} - ${entity.state}`;
};

export default function OptimizerPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { toast } = useToast();
    const { db, updateDoc } = useMockData();
    const { data: routes } = useMockCollection('routes');
    const { data: students } = useMockCollection('students');
    const { data: schools } = useMockCollection('schools');
    const { data: incidents } = useMockCollection('incidents');
    const { data: drivers } = useMockCollection('drivers');
    const { data: vehicles } = useMockCollection('vehicles');

    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [context, setContext] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [startFromDriverHome, setStartFromDriverHome] = useState(true);
    const [optimizationResult, setOptimizationResult] = useState<OptimizeSchoolVanRouteOutput | null>(null);
    const [autoOptimizeTriggered, setAutoOptimizeTriggered] = useState(false);
    const isInitialMount = useRef(true);


    useEffect(() => {
        const routeIdFromUrl = searchParams.get('routeId');
        if (routeIdFromUrl && routes?.find(r => r.id === routeIdFromUrl)) {
            setSelectedRouteId(routeIdFromUrl);
        }
    }, [searchParams, routes]);

    const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s])), [students]);
    const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s])), [schools]);

    const selectedRoute = useMemo(() => {
        if (!selectedRouteId || !routes) return null;
        return routes.find(r => r.id === selectedRouteId);
    }, [selectedRouteId, routes]);

    const driverForRoute = useMemo(() => {
        if (!selectedRoute || !drivers) return null;
        return drivers.find(d => d.id === selectedRoute.driverId);
    }, [selectedRoute, drivers]);

    const vehicleForRoute = useMemo(() => {
        if (!driverForRoute || !driverForRoute.vehicleId || !vehicles) return null;
        return vehicles.find(v => v.id === driverForRoute.vehicleId);
    }, [driverForRoute, vehicles]);

    const studentsInRoute = useMemo(() => {
        if (!selectedRoute) return [];
        return selectedRoute.studentIds.map(id => studentsMap.get(id)).filter(Boolean);
    }, [selectedRoute, studentsMap]);

    const schoolForRoute = useMemo(() => {
        if (!studentsInRoute.length || !schoolsMap.size) return null;
        const studentWithSchool = studentsInRoute.find(s => s.schoolId);
        if (!studentWithSchool) return null;
        return schoolsMap.get(studentWithSchool.schoolId);
    }, [studentsInRoute, schoolsMap]);
    
    const optimizedStudentsResult = useMemo(() => {
        if (!optimizationResult) return [];
        return optimizationResult.optimizedStudentIds.map(id => studentsMap.get(id)).filter(Boolean);
    }, [optimizationResult, studentsMap]);


    const handleOptimize = useCallback(async () => {
        if (!selectedRoute || studentsInRoute.length === 0 || !schoolForRoute) {
            return;
        }
        
        setIsLoading(true);
        setOptimizationResult(null);

        try {
            const incidentsContext = incidents && incidents.length > 0
                ? "Incidentes reportados: " + incidents.map(inc => `${inc.category} (${inc.severity}): ${inc.description}`).join('; ')
                : "";
            
            const combinedContext = [context, incidentsContext].filter(Boolean).join('\n\n');

            const driverAddress = driverForRoute ? formatAddress(driverForRoute) : undefined;
            const startAddress = (startFromDriverHome && driverAddress !== 'Endereço indisponível') ? driverAddress : undefined;

            const input = {
                startAddress,
                students: studentsInRoute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) })),
                schoolAddress: formatAddress(schoolForRoute),
                vehicleCapacity: vehicleForRoute?.capacity,
                context: combinedContext,
            };
            const result = await optimizeSchoolVanRoute(input);
            setOptimizationResult(result);
            if (!isInitialMount.current) {
                toast({
                    title: "Rota Otimizada com Sucesso!",
                    description: "A IA gerou uma nova sugestão de rota.",
                });
            }
        } catch (error) {
            console.error("Error optimizing route:", error);
            toast({
                title: "Erro na Otimização",
                description: "Não foi possível otimizar a rota. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [selectedRoute, studentsInRoute, schoolForRoute, context, toast, incidents, vehicleForRoute, driverForRoute, startFromDriverHome]);
    
    // This effect is specifically for the 'autoOptimize=true' parameter from the routes page
    useEffect(() => {
        const autoOptimize = searchParams.get('autoOptimize') === 'true';

        if (autoOptimize && !autoOptimizeTriggered && selectedRoute && schoolForRoute) {
            setAutoOptimizeTriggered(true);
            handleOptimize();
            
            const current = new URL(window.location.href);
            const newSearchParams = new URLSearchParams(current.search);
            newSearchParams.delete('autoOptimize');
            router.replace(`${current.pathname}?${newSearchParams.toString()}`);
        }
    }, [searchParams, autoOptimizeTriggered, selectedRoute, schoolForRoute, handleOptimize, router]);

    // This effect triggers optimization whenever the selected route, context or switch changes, except for the very first render
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            // Let the auto-optimize effect handle the very first optimization if needed
            if (searchParams.get('autoOptimize') === 'true') {
                return;
            }
        }

        if (selectedRouteId) {
            handleOptimize();
        }
    }, [selectedRouteId, context, startFromDriverHome]); 


    const handleSaveChanges = () => {
        if (!selectedRouteId || !optimizationResult) return;
        updateDoc('routes', selectedRouteId, { 
            studentIds: optimizationResult.optimizedStudentIds,
            turnByTurnDirections: optimizationResult.turnByTurnDirections,
            lastOptimizedAt: new Date().toISOString()
        });
        toast({
            title: "Rota Atualizada!",
            description: "A rota foi salva com a nova ordem otimizada e as instruções de direção.",
        });
        setOptimizationResult(null);
    }

    const getStudentName = (id: string) => studentsMap.get(id)?.name || 'Aluno desconhecido';

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="text-primary"/> Otimizador de Rotas (IA)
                </h1>
            </div>

            <Tabs defaultValue="analysis" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="analysis">
                        <ListTree className="mr-2 h-4 w-4"/>
                        Análise e Configuração
                    </TabsTrigger>
                    <TabsTrigger value="map">
                        <MapPin className="mr-2 h-4 w-4"/>
                        Mapa Comparativo
                    </TabsTrigger>
                </TabsList>
                
                <TabsContent value="analysis">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Configuration Panel */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Configurar Otimização</CardTitle>
                                    <CardDescription>Selecione a rota para otimizar automaticamente. Adicione um contexto se necessário.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <label htmlFor="route-select" className="text-sm font-medium mb-2 block">Selecione a Rota</label>
                                        <Select onValueChange={setSelectedRouteId} value={selectedRouteId || ''}>
                                            <SelectTrigger id="route-select">
                                                <SelectValue placeholder="Escolha uma rota..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {routes?.map(route => (
                                                    <SelectItem key={route.id} value={route.id}>{route.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center space-x-2 pt-2">
                                        <Switch id="start-from-home" checked={startFromDriverHome} onCheckedChange={setStartFromDriverHome} disabled={!driverForRoute} />
                                        <Label htmlFor="start-from-home" className="text-sm font-normal text-muted-foreground">Incluir ponto de partida do motorista</Label>
                                    </div>
                                    <div>
                                        <label htmlFor="context-textarea" className="text-sm font-medium mb-2 block">Contexto Adicional (Opcional)</label>
                                        <Textarea 
                                            id="context-textarea"
                                            placeholder="Ex: Evitar a Av. Principal entre 8h e 9h. A Rua B está em obras. Os incidentes recentes já são considerados automaticamente."
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            rows={3}
                                        />
                                        {incidents && incidents.length > 0 && (
                                            <div className="mt-3 text-xs text-muted-foreground p-2 bg-secondary rounded-md border">
                                                <p className="font-bold flex items-center gap-1.5"><Siren size={14} className="text-destructive"/> {incidents.length} incidente(s) recente(s) será(ão) considerado(s) pela IA.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        {/* Results Panel */}
                        <div className="lg:col-span-2">
                            <Card className="min-h-full">
                                <CardHeader>
                                    <CardTitle>Analisar Resultado</CardTitle>
                                    <CardDescription>Veja a rota original e a sugestão da IA lado a lado.</CardDescription>
                                </CardHeader>
                                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Original Route */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2 text-muted-foreground"><RouteIcon /> Rota Original</h3>
                                        {selectedRoute ? (
                                            <Card className="p-4 bg-secondary/50">
                                                <div className="flex items-center gap-2 mb-3 text-sm text-muted-foreground">
                                                <Users /> {studentsInRoute.length} alunos
                                                </div>
                                                <ol className="space-y-2 text-sm list-decimal list-inside">
                                                    {studentsInRoute.map((student) => (
                                                        <li key={student.id}>{student.name}</li>
                                                    ))}
                                                </ol>
                                            </Card>
                                        ) : (
                                            <div className="text-center p-8 border rounded-lg text-muted-foreground">
                                                <p>Selecione uma rota para começar.</p>
                                            </div>
                                        )}
                                    </div>
                                    {/* Optimized Route */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2 text-primary"><Bot /> Rota Otimizada</h3>
                                        {isLoading && (
                                            <div className="flex items-center justify-center h-full p-8 border rounded-lg flex-col text-muted-foreground">
                                                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4"/>
                                                <p>Analisando e otimizando...</p>
                                            </div>
                                        )}
                                        {optimizationResult && (
                                            <Card className="p-4 border-primary/50 shadow-lg">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                        <Users /> {optimizationResult.optimizedStudentIds.length} alunos
                                                    </div>
                                                    <div className="flex gap-4">
                                                        <Badge variant="outline" className="flex gap-1.5"><Clock size={14}/> {optimizationResult.estimatedTimeMinutes} min</Badge>
                                                        <Badge variant="outline" className="flex gap-1.5"><RouteIcon size={14}/> {optimizationResult.estimatedDistanceKm} km</Badge>
                                                    </div>
                                                </div>
                                                
                                                <ol className="space-y-2 text-sm list-decimal list-inside font-medium mb-4">
                                                    {optimizationResult.optimizedStudentIds.map((studentId) => (
                                                        <li key={studentId}>{getStudentName(studentId)}</li>
                                                    ))}
                                                </ol>
                                                
                                                <Accordion type="single" collapsible className="w-full">
                                                    <AccordionItem value="summary" className="border-b-0">
                                                        <AccordionTrigger className="text-xs text-muted-foreground hover:no-underline justify-start p-0 flex-nowrap gap-1">
                                                            <Sparkles className="h-3 w-3" />
                                                            Ver justificativa da IA
                                                        </AccordionTrigger>
                                                        <AccordionContent>
                                                            <p className="text-sm text-muted-foreground italic mt-2 bg-secondary p-3 rounded-md border">
                                                                "{optimizationResult.summary}"
                                                            </p>
                                                        </AccordionContent>
                                                    </AccordionItem>
                                                </Accordion>

                                                {optimizationResult.turnByTurnDirections && optimizationResult.turnByTurnDirections.length > 0 && (
                                                    <div className="mt-4 pt-4 border-t">
                                                        <h4 className="font-semibold flex items-center gap-2 text-sm mb-2">
                                                            <Navigation size={16} className="text-primary"/>
                                                            Instruções de Rota (Sugestão)
                                                        </h4>
                                                        <ScrollArea className="h-32">
                                                            <ol className="space-y-1.5 text-xs text-muted-foreground list-decimal list-inside">
                                                                {optimizationResult.turnByTurnDirections.map((direction, index) => (
                                                                    <li key={index}>{direction}</li>
                                                                ))}
                                                            </ol>
                                                        </ScrollArea>
                                                        <p className="text-xs text-muted-foreground/80 mt-2 italic">
                                                            Atenção: Estas são instruções geradas por IA para planejamento e podem não refletir as condições de trânsito em tempo real.
                                                        </p>
                                                    </div>
                                                )}

                                                <Button className="w-full mt-4" onClick={handleSaveChanges}>Salvar Rota Otimizada</Button>
                                            </Card>
                                        )}
                                        {!isLoading && !optimizationResult && (
                                            <div className="text-center p-8 border-dashed border-2 rounded-lg text-muted-foreground">
                                                <p>O resultado da otimização aparecerá aqui.</p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="map">
                     <div>
                        <div className="flex justify-center flex-wrap gap-x-6 gap-y-2 mb-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-blue-400"></div>
                                <span>Rota Original</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-1 bg-green-500"></div>
                                <span>Rota Otimizada</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Home className="text-purple-600" size={16} />
                                <span>Partida Motorista</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <School className="text-red-600" size={16} />
                                <span>Escola</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Users className="text-blue-500" size={16} />
                                <span>Aluno</span>
                            </div>
                        </div>

                        <div className="relative h-[70vh] w-full rounded-lg overflow-hidden border">
                            {!API_KEY ? (
                                <div className="flex h-full w-full items-center justify-center bg-secondary/30">
                                    <div className="text-center p-4">
                                        <p className="font-semibold text-lg">Mapa Indisponível</p>
                                        <p className="text-muted-foreground text-sm">
                                            A chave da API do Google Maps não foi configurada.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <APIProvider apiKey={API_KEY}>
                                    <GoogleMap
                                        defaultCenter={{ lat: -23.55, lng: -46.63 }}
                                        defaultZoom={12}
                                        mapId="optimizer-map"
                                        gestureHandling={'greedy'}
                                        disableDefaultUI={false}
                                        zoomControl={true}
                                        zoomControlOptions={{
                                            position: 5,
                                        }}
                                        streetViewControl={false}
                                        mapTypeControl={false}
                                        fullscreenControl={false}
                                    >
                                        <RouteMap 
                                            originalRoute={studentsInRoute} 
                                            optimizedRoute={optimizedStudentsResult} 
                                            school={schoolForRoute}
                                            driver={startFromDriverHome ? driverForRoute : null}
                                        />
                                    </GoogleMap>
                                </APIProvider>
                            )}
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}

function RouteMap({ originalRoute, optimizedRoute, school, driver }) {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const allStops = Array.from(new Set([...originalRoute, ...optimizedRoute]));
        if (allStops.length === 0 && !school) return;

        const bounds = new google.maps.LatLngBounds();
        if (driver?.latitude && driver?.longitude) {
            bounds.extend({ lat: driver.latitude, lng: driver.longitude });
        }
        allStops.forEach(stop => {
            if (stop.latitude && stop.longitude) {
                bounds.extend({ lat: stop.latitude, lng: stop.longitude });
            }
        });
         if (school?.latitude && school?.longitude) {
            bounds.extend({ lat: school.latitude, lng: school.longitude });
        }
        if (bounds.isEmpty()) return;
        map.fitBounds(bounds, 100);

    }, [map, originalRoute, optimizedRoute, school, driver]);
    
    if (!school) return null;

    const driverStartPoint = (driver?.latitude && driver?.longitude) ? [{ lat: driver.latitude, lng: driver.longitude }] : [];

    const originalPath = [
        ...driverStartPoint,
        ...originalRoute.map(s => ({ lat: s.latitude, lng: s.longitude })),
        { lat: school.latitude, lng: school.longitude }
    ].filter(p => p.lat && p.lng);

    const optimizedPath = [
        ...driverStartPoint,
        ...optimizedRoute.map(s => ({ lat: s.latitude, lng: s.longitude })),
        { lat: school.latitude, lng: school.longitude }
    ].filter(p => p.lat && p.lng);

    const allStudents = Array.from(new Map([...originalRoute, ...optimizedRoute].map(s => [s.id, s])).values());


    return (
        <>
            {/* Markers */}
            {driver && (
                 <AdvancedMarker position={{ lat: driver.latitude, lng: driver.longitude }} title={`Partida: ${driver.name}`}>
                     <div className="p-2 rounded-full shadow border-2 border-white bg-purple-600">
                        <Home className="h-5 w-5 text-white" />
                     </div>
                </AdvancedMarker>
            )}
            {allStudents.map(student => (
                <AdvancedMarker key={`marker-${student.id}`} position={{ lat: student.latitude, lng: student.longitude }} title={student.name}>
                    <div className="p-1 rounded-full shadow border-2 border-white bg-blue-500">
                        <Users className="h-4 w-4 text-white" />
                    </div>
                </AdvancedMarker>
            ))}
            <AdvancedMarker position={{ lat: school.latitude, lng: school.longitude }} title={school.name}>
                 <div className="p-2 rounded-full shadow border-2 border-white bg-red-600">
                    <School className="h-5 w-5 text-white" />
                 </div>
            </AdvancedMarker>

            {/* Polylines */}
            {originalPath.length > 1 && (
                <Polyline path={originalPath} strokeColor="#60a5fa" strokeOpacity={0.7} strokeWeight={5} />
            )}
            {optimizedPath.length > 1 && (
                <Polyline path={optimizedPath} strokeColor="#4ade80" strokeOpacity={1.0} strokeWeight={5} />
            )}
        </>
    );
}

    

    

    

