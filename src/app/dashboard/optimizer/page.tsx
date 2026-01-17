
"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, ListOrdered, Clock, Route as RouteIcon, Users, Bot } from "lucide-react";
import { useMockCollection, useMockData } from "@/hooks/use-mock-data";
import { optimizeSchoolVanRoute, OptimizeSchoolVanRouteOutput } from "@/ai/flows/optimizeSchoolVanRoute";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const formatAddress = (student) => {
    if (!student.street) return 'Endereço indisponível';
    return `${student.street}, ${student.number}, ${student.neighborhood}, ${student.city} - ${student.state}`;
};

export default function OptimizerPage() {
    const { toast } = useToast();
    const { db, updateDoc } = useMockData();
    const { data: routes } = useMockCollection('routes');
    const { data: students } = useMockCollection('students');
    const { data: schools } = useMockCollection('schools');

    const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
    const [context, setContext] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [optimizationResult, setOptimizationResult] = useState<OptimizeSchoolVanRouteOutput | null>(null);

    const studentsMap = useMemo(() => new Map(students?.map(s => [s.id, s])), [students]);
    const schoolsMap = useMemo(() => new Map(schools?.map(s => [s.id, s])), [schools]);

    const selectedRoute = useMemo(() => {
        if (!selectedRouteId || !routes) return null;
        return routes.find(r => r.id === selectedRouteId);
    }, [selectedRouteId, routes]);

    const studentsInRoute = useMemo(() => {
        if (!selectedRoute) return [];
        return selectedRoute.studentIds.map(id => studentsMap.get(id)).filter(Boolean);
    }, [selectedRoute, studentsMap]);

    const handleOptimize = async () => {
        if (!selectedRoute || studentsInRoute.length === 0) {
            toast({
                title: "Seleção Incompleta",
                description: "Por favor, selecione uma rota com alunos para otimizar.",
                variant: "destructive"
            });
            return;
        }

        const school = schoolsMap.get(studentsInRoute[0].schoolId);
        if (!school) {
            toast({
                title: "Dados Incompletos",
                description: "Não foi possível encontrar a escola associada aos alunos da rota.",
                variant: "destructive"
            });
            return;
        }
        
        setIsLoading(true);
        setOptimizationResult(null);

        try {
            const input = {
                students: studentsInRoute.map(s => ({ id: s.id, name: s.name, address: formatAddress(s) })),
                schoolAddress: formatAddress(school),
                context: context,
            };
            const result = await optimizeSchoolVanRoute(input);
            setOptimizationResult(result);
            toast({
                title: "Rota Otimizada com Sucesso!",
                description: "A IA gerou uma nova sugestão de rota.",
            });
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
    };
    
    const handleSaveChanges = () => {
        if (!selectedRouteId || !optimizationResult) return;
        updateDoc('routes', selectedRouteId, { studentIds: optimizationResult.optimizedStudentIds });
        toast({
            title: "Rota Atualizada!",
            description: "A rota foi salva com a nova ordem otimizada.",
        });
        setOptimizationResult(null);
    }

    const getStudentName = (id: string) => studentsMap.get(id)?.name || 'Aluno desconhecido';

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Sparkles className="text-primary"/> Otimizador de Rota (IA)
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>1. Configurar Otimização</CardTitle>
                            <CardDescription>Selecione a rota e forneça um contexto para a IA.</CardDescription>
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
                            <div>
                                <label htmlFor="context-textarea" className="text-sm font-medium mb-2 block">Contexto Adicional (Opcional)</label>
                                <Textarea 
                                    id="context-textarea"
                                    placeholder="Ex: Evitar a Av. Principal entre 8h e 9h. A Rua B está em obras."
                                    value={context}
                                    onChange={(e) => setContext(e.target.value)}
                                    rows={4}
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button className="w-full" onClick={handleOptimize} disabled={isLoading || !selectedRouteId}>
                                {isLoading ? <Loader2 className="animate-spin" /> : <><Sparkles className="mr-2"/> Otimizar com IA</>}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
                
                {/* Results Panel */}
                <div className="lg:col-span-2">
                    <Card className="min-h-full">
                         <CardHeader>
                            <CardTitle>2. Analisar Resultado</CardTitle>
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
                                        <p className="text-sm text-muted-foreground italic mb-3">"{optimizationResult.summary}"</p>
                                        <ol className="space-y-2 text-sm list-decimal list-inside font-medium">
                                            {optimizationResult.optimizedStudentIds.map((studentId) => (
                                                <li key={studentId}>{getStudentName(studentId)}</li>
                                            ))}
                                        </ol>
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
        </div>
    );
}
