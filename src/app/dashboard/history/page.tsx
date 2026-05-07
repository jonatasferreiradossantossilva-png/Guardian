'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useDataCollection } from '@/hooks/use-data';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    CalendarDays, Clock, MapPin, Map as MapIcon, ChevronRight, Bus, Fuel, UserCircle, School
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SmartMap } from '@/components/shared/smart-map';

const safeFormat = (dateStr: string | undefined | null, fmt: string) => {
    try {
        if (!dateStr) return '--:--';
        const parsed = parseISO(dateStr);
        if (isNaN(parsed.getTime())) return 'Inválido';
        return format(parsed, fmt, { locale: ptBR });
    } catch {
        return 'Erro';
    }
};

export default function DashboardHistoryPage() {
    const { data: rawTrips, isLoading: loadingTrips } = useDataCollection('trip_history', []);
    const { data: drivers } = useDataCollection('drivers', []);
    const { data: users } = useDataCollection('users', []);
    const { data: students } = useDataCollection('students', []);
    const { data: schools } = useDataCollection('schools', []);

    const [selectedDriverId, setSelectedDriverId] = useState<string>('all');
    const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

    const trips = useMemo(() => {
        if (!rawTrips) return [];
        let filtered = [...rawTrips].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        if (selectedDriverId !== 'all') {
            filtered = filtered.filter(t => t.driverId === selectedDriverId);
        }
        return filtered;
    }, [rawTrips, selectedDriverId]);

    const activeDrivers = useMemo(() => {
        if (!drivers || !users) return [];
        return drivers.map(d => {
            const u = users.find(u => u.id === d.userId);
            return { id: d.id, name: u?.name || d.id };
        });
    }, [drivers, users]);

    // Reconstructor of Route
    const reconstructedRoute = useMemo(() => {
        if (!selectedTrip || !selectedTrip.eventsLog || !students || !schools) return { stops: [], center: { lat: -23.55, lng: -46.63 } };
        
        const stops: any[] = [];
        let firstLat = -23.55, firstLng = -46.63;

        selectedTrip.eventsLog.forEach((log: string, idx: number) => {
            const [stopId, status, timeStr] = log.split('|');
            let itemData = null;
            let type = '';

            if (stopId.startsWith('school')) {
                itemData = schools.find(s => s.id === stopId);
                type = 'school';
            } else {
                itemData = students.find(s => s.id === stopId);
                type = 'student';
            }

            if (itemData && itemData.latitude && itemData.longitude) {
                if (idx === 0) { firstLat = itemData.latitude; firstLng = itemData.longitude; }
                stops.push({
                    id: stopId + '-' + idx,
                    type,
                    data: itemData,
                    statusHist: status,
                    timeHist: timeStr
                });
            }
        });

        return { stops, center: { lat: firstLat, lng: firstLng } };
    }, [selectedTrip, students, schools]);

    return (
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black uppercase tracking-tight text-primary">Auditoria de Rotas</h1>
                    <p className="text-muted-foreground font-medium">Histórico retido dos últimos 30 dias com reconstituição de trajeto.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                        <SelectTrigger className="w-[200px] h-12 font-bold border-2">
                            <SelectValue placeholder="Filtrar Motores" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="font-bold">Todos os Motoristas</SelectItem>
                            {activeDrivers.map(d => (
                                <SelectItem key={d.id} value={d.id} className="font-bold">{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border-2 shadow-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5 text-primary"/> Registro Diário Mestre</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="w-full max-w-full overflow-x-auto block">
                        <Table className="min-w-[700px]">
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="font-black uppercase text-xs">Data / Turno</TableHead>
                                    <TableHead className="font-black uppercase text-xs">Motorista</TableHead>
                                    <TableHead className="font-black uppercase text-xs">Horários</TableHead>
                                    <TableHead className="font-black uppercase text-xs">Performance Km</TableHead>
                                    <TableHead className="font-black uppercase text-xs text-right">Ação</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loadingTrips ? (
                                    <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground font-bold">Carregando histórico retido...</TableCell></TableRow>
                                ) : trips.map(trip => (
                                    <TableRow key={trip.id} className="hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <CalendarDays className="h-4 w-4 text-primary" />
                                                <span className="font-bold">{safeFormat(trip.date, "dd 'de' MMM, yyyy")}</span>
                                                <Badge variant="outline" className="text-[10px] uppercase font-black tracking-wider ml-2">{trip.shift}</Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm flex items-center gap-1.5"><UserCircle className="h-4 w-4 text-muted-foreground"/> {trip.driverName}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                                                {safeFormat(trip.startTime, "HH:mm")} <ChevronRight className="h-3 w-3" /> {safeFormat(trip.endTime, "HH:mm")}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-muted-foreground">Planejado</span>
                                                    <span className="text-sm font-bold">{trip.plannedKm} km</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] uppercase font-black text-primary">Executado</span>
                                                    <span className="text-sm font-black text-primary">{trip.actualKm} km</span>
                                                </div>
                                                {trip.savingsKm > 0 && (
                                                    <Badge className="bg-green-500/10 text-green-700 hover:bg-green-500/20 shadow-none border-0 text-[10px] px-1 py-0">-{trip.savingsKm}km</Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button size="sm" variant="secondary" className="font-bold uppercase text-[10px]" onClick={() => setSelectedTrip(trip)}>
                                                <MapIcon className="h-4 w-4 mr-1.5" /> Reconstituir
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {trips.length === 0 && !loadingTrips && (
                                    <TableRow><TableCell colSpan={5} className="text-center py-10 font-bold text-muted-foreground">Não há histórico de viagens no cofre de 30 dias.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={!!selectedTrip} onOpenChange={open => !open && setSelectedTrip(null)}>
                <DialogContent className="w-[95vw] sm:max-w-2xl md:max-w-4xl lg:max-w-5xl h-[90vh] md:h-[85vh] p-0 overflow-hidden flex flex-col border-2 border-primary/20 rounded-xl">
                    <DialogHeader className="p-4 md:p-6 border-b bg-muted/20 shrink-0">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pr-6 md:pr-8">
                            <div className="w-full">
                                <DialogTitle className="text-xl md:text-2xl font-black uppercase tracking-tight text-primary flex items-center gap-2">
                                    <MapIcon className="h-5 w-5 md:h-6 md:w-6 shrink-0" /> Reconstituição de Rota
                                </DialogTitle>
                                {selectedTrip && (
                                    <p className="text-xs md:text-sm font-bold text-muted-foreground mt-2 md:mt-1 break-words">
                                        Data: {safeFormat(selectedTrip.date, "dd/MM/yyyy")} • Turno: {selectedTrip.shift} <br className="md:hidden" /> Motorista: {selectedTrip.driverName}
                                    </p>
                                )}
                            </div>
                            <Badge variant="outline" className="border-primary/30 text-primary font-black px-3 py-1 shrink-0 self-start md:self-auto">
                                <Clock className="h-3 w-3 mr-1.5 inline" /> TTL: D-{30 - Math.floor((new Date().getTime() - new Date(selectedTrip?.date || new Date()).getTime()) / (1000 * 3600 * 24))} dias
                            </Badge>
                        </div>
                    </DialogHeader>

                    {selectedTrip && (
                        <div className="flex flex-1 h-full overflow-hidden">
                            <div className="w-full h-full overflow-y-auto bg-card">
                                <div className="p-4 md:p-8 space-y-4 md:space-y-6 max-w-3xl mx-auto">
                                    <h3 className="font-black uppercase text-xs text-muted-foreground tracking-wider mb-8 text-center bg-muted/30 py-2 rounded-md mx-4 md:mx-0">Log de Auditoria: Embarques e Desembarques</h3>
                                    <div className="relative border-l-2 border-muted ml-6 md:ml-8 space-y-8 pb-10 pr-4 md:pr-0">
                                        {reconstructedRoute.stops.map((stop, idx) => {
                                            const isSchool = stop.type === 'school';
                                            const isAbsent = stop.statusHist.startsWith('ausente');
                                            return (
                                                <div key={stop.id} className="relative pl-8">
                                                    <div className={`absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-background flex items-center justify-center ${isSchool ? 'bg-destructive' : (isAbsent ? 'bg-amber-500' : 'bg-primary')}`}>
                                                    </div>
                                                    <div className="flex flex-col md:flex-row md:items-start justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
                                                        <div className="min-w-0 pr-2">
                                                            <p className={`text-base font-black uppercase truncate ${isAbsent ? 'line-through opacity-50' : ''}`}>{stop.data?.name}</p>
                                                            <p className="text-xs font-bold text-muted-foreground uppercase">{isSchool ? 'Ponto Base (Escola)' : 'Aluno'}</p>
                                                        </div>
                                                        <div className="mt-3 md:mt-0 text-left md:text-right shrink-0">
                                                            <p className="text-sm font-bold font-mono">{safeFormat(stop.timeHist, "HH:mm")}</p>
                                                            <Badge variant={isSchool ? 'secondary' : (isAbsent ? 'outline' : 'default')} className="text-[10px] uppercase font-black px-2 py-0.5 mt-1">
                                                                {isAbsent ? 'Falta Informada' : stop.statusHist.replace('_', ' ')}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
