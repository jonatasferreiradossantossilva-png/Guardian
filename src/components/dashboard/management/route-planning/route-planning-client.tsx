'use client';

import { useState, useMemo } from 'react';
import { Route, Student, RouteManifest, TripRequest } from '@/types/mock-data';
import { format, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Bus, User as UserIcon, ArrowRightLeft, UserX, UserPlus, Info } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';

interface Props {
  initialRoutes: Route[];
  initialStudents: Student[];
  initialManifests: RouteManifest[];
  initialTripRequests: TripRequest[];
}

export function RoutePlanningClient({ initialRoutes, initialStudents, initialManifests, initialTripRequests }: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedShift, setSelectedShift] = useState<'Manhã' | 'Tarde' | 'Integral'>('Tarde');
  const [selectedDirection, setSelectedDirection] = useState<'ida' | 'volta'>('ida');
  
  // State for daily manifests (acting as a local DB for the UI)
  const [manifests, setManifests] = useState<RouteManifest[]>(initialManifests);
  
  // State for selected students (for bulk moving)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Find or generate manifests for the selected date, shift, and direction
  const currentRoutesManifests = useMemo(() => {
    const shiftRoutes = initialRoutes.filter(r => r.shift === selectedShift);
    
    return shiftRoutes.map(route => {
      // Find an existing manifest
      const existing = manifests.find(m => 
        m.routeId === route.id && 
        m.date === dateStr && 
        m.shift === selectedShift && 
        m.direction === selectedDirection
      );
      
      if (existing) return { route, manifest: existing };
      
      // If no manifest exists, we simulate one using the base route
      const mockManifest: RouteManifest = {
        id: `draft_${route.id}_${dateStr}_${selectedDirection}`,
        routeId: route.id,
        date: dateStr,
        shift: selectedShift,
        direction: selectedDirection,
        studentIds: route.baseStudentIds || route.studentIds || [],
        updatedAt: new Date().toISOString()
      };
      
      return { route, manifest: mockManifest };
    });
  }, [initialRoutes, manifests, selectedDate, selectedShift, selectedDirection, dateStr]);

  // Identify students that are available but not assigned to any van for this specific query
  const allAssignedIds = new Set(currentRoutesManifests.flatMap(rm => rm.manifest.studentIds));
  
  // Pending students logic:
  // 1. Approved one-off trips for this date/shift
  // 2. Or regular students for this shift who aren't in any manifest (orphaned)
  const pendingStudents = useMemo(() => {
    const pending: Student[] = [];
    
    // Find one-off trips (avulsos)
    const avulsos = initialTripRequests.filter(tr => 
      tr.status === 'aprovada' && 
      tr.date === dateStr && 
      (tr.type === selectedDirection || tr.type === 'ida_e_volta')
    );
    
    avulsos.forEach(tr => {
      if (!allAssignedIds.has(tr.studentId)) {
        const s = initialStudents.find(st => st.id === tr.studentId);
        if (s) pending.push(s);
      }
    });

    return pending;
  }, [initialStudents, initialTripRequests, dateStr, selectedDirection, allAssignedIds]);

  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  const moveSelectedToRoute = (targetRouteId: string) => {
    if (selectedStudentIds.length === 0) return;
    
    let updatedManifests = [...manifests];
    
    // Process each student
    for (const studentId of selectedStudentIds) {
      // Remove from any existing manifest for this date/shift/direction
      updatedManifests = updatedManifests.map(m => {
        if (m.date === dateStr && m.shift === selectedShift && m.direction === selectedDirection) {
          return { ...m, studentIds: m.studentIds.filter(id => id !== studentId) };
        }
        return m;
      });
      
      // Add to target manifest
      let targetManifest = updatedManifests.find(m => 
        m.routeId === targetRouteId && m.date === dateStr && m.shift === selectedShift && m.direction === selectedDirection
      );
      
      if (!targetManifest) {
        // Create if it doesn't exist
        const targetRoute = initialRoutes.find(r => r.id === targetRouteId);
        targetManifest = {
          id: `manifest_${targetRouteId}_${dateStr}_${selectedDirection}`,
          routeId: targetRouteId,
          date: dateStr,
          shift: selectedShift,
          direction: selectedDirection,
          studentIds: [...(targetRoute?.baseStudentIds || targetRoute?.studentIds || []), studentId],
          updatedAt: new Date().toISOString()
        };
        updatedManifests.push(targetManifest);
      } else {
        // Append if not already there
        if (!targetManifest.studentIds.includes(studentId)) {
          targetManifest.studentIds.push(studentId);
        }
      }
    }
    
    setManifests(updatedManifests);
    setSelectedStudentIds([]); // Clear selection
    // Here we would typically also show a toast, and maybe call an API to increment temporaryMovesCount if necessary
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Planejamento Diário</h2>
          <p className="text-slate-500 dark:text-slate-400">Monte as viagens do dia com facilidade. Tudo o que você mudar aqui reflete no app do motorista para o dia selecionado.</p>
        </div>
        
        <div className="flex items-center space-x-2">
           <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal border-slate-200">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'PPP', { locale: ptBR }) : <span>Selecione a data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => d && setSelectedDate(d)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white/50 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Turno da Rota</label>
            <Select value={selectedShift} onValueChange={(v: any) => setSelectedShift(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o turno" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Manhã">Manhã (ex: 06:30 - 12:00)</SelectItem>
                <SelectItem value="Tarde">Tarde (ex: 12:00 - 18:00)</SelectItem>
                <SelectItem value="Integral">Integral</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 flex-1">
            <label className="text-sm font-medium">Direção (Sentido)</label>
            <Select value={selectedDirection} onValueChange={(v: any) => setSelectedDirection(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a direção" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ida">Ida (Buscar em Casa ➔ Escola)</SelectItem>
                <SelectItem value="volta">Volta (Sair da Escola ➔ Casa)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 flex justify-end">
             {selectedStudentIds.length > 0 ? (
               <Popover>
                <PopoverTrigger asChild>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm h-10">
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Mover {selectedStudentIds.length} Alunos para...
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="end">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm px-2 text-slate-500">Escolha a Van de Destino</h4>
                    {currentRoutesManifests.map(rm => (
                      <Button 
                        key={rm.route.id} 
                        variant="ghost" 
                        className="w-full justify-start font-normal"
                        onClick={() => moveSelectedToRoute(rm.route.id)}
                      >
                        <Bus className="mr-2 h-4 w-4 text-slate-400" />
                        {rm.route.name}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
             ) : (
               <Button disabled variant="outline" className="w-full border-dashed">
                 Selecione alunos para mover
               </Button>
             )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* PENDING BUCKET */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-semibold text-lg flex items-center text-amber-600">
            <UserPlus className="mr-2 h-5 w-5" />
            Pendentes / Avulsos
            <Badge variant="secondary" className="ml-2 bg-amber-100 text-amber-800">{pendingStudents.length}</Badge>
          </h3>
          <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 min-h-[400px]">
            {pendingStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 text-amber-600/60">
                <Info className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">Nenhum aluno avulso ou sem rota para este turno.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingStudents.map(student => (
                  <div key={student.id} className="flex items-center space-x-3 bg-white p-3 rounded-lg shadow-sm border border-slate-100 transition-colors hover:border-amber-300">
                    <Checkbox 
                      id={`chk-${student.id}`} 
                      checked={selectedStudentIds.includes(student.id)}
                      onCheckedChange={() => toggleStudentSelection(student.id)}
                    />
                    <label htmlFor={`chk-${student.id}`} className="flex-1 cursor-pointer">
                      <p className="text-sm font-medium">{student.name}</p>
                      <p className="text-xs text-slate-500 line-clamp-1">{student.schoolId}</p>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* VANS / ROUTES */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {currentRoutesManifests.map(rm => (
              <Card key={rm.route.id} className="border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="p-4 bg-slate-50/80 border-b border-slate-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bus className="h-5 w-5 text-blue-500" />
                      <CardTitle className="text-base">{rm.route.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white">{rm.manifest.studentIds.length} alunos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-3 flex-1 bg-white">
                  {rm.manifest.studentIds.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
                      Van vazia
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {rm.manifest.studentIds.map(studentId => {
                        const student = initialStudents.find(s => s.id === studentId);
                        if (!student) return null;
                        
                        // Fake absence detection for UI purposes
                        const isAbsent = student.status === 'ausente_dia_todo' || 
                                         (selectedDirection === 'ida' && student.status === 'ausente_ida') ||
                                         (selectedDirection === 'volta' && student.status === 'ausente_volta');

                        return (
                          <div 
                            key={student.id} 
                            className={`flex items-center space-x-3 p-2 rounded-md hover:bg-slate-50 transition-colors ${isAbsent ? 'opacity-50 grayscale' : ''}`}
                          >
                            <Checkbox 
                              id={`chk-${student.id}`} 
                              checked={selectedStudentIds.includes(student.id)}
                              onCheckedChange={() => toggleStudentSelection(student.id)}
                            />
                            <label htmlFor={`chk-${student.id}`} className="flex-1 flex items-center cursor-pointer overflow-hidden">
                              <UserIcon className="h-4 w-4 text-slate-400 mr-2 shrink-0" />
                              <span className={`text-sm font-medium truncate ${isAbsent ? 'line-through text-slate-500' : 'text-slate-700'}`}>
                                {student.name}
                              </span>
                              {isAbsent && <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1 py-0 bg-red-100 text-red-700">Falta</Badge>}
                              {student.temporaryMovesCount && student.temporaryMovesCount >= 5 && !isAbsent && (
                                <Badge variant="secondary" className="ml-auto text-[10px] h-4 px-1 py-0 bg-purple-100 text-purple-700" title="Movido 5+ vezes">Sugestão</Badge>
                              )}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
