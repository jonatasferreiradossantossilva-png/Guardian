'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    Play, 
    Square, 
    ChevronRight, 
    Bus, 
    User, 
    MapPin, 
    Activity, 
    Smartphone, 
    Monitor as MonitorIcon, 
    CheckCircle2, 
    Zap,
    RotateCcw,
    Bell,
    Navigation,
    Clock,
    Shield,
    Coffee,
    Moon
} from 'lucide-react';
import { useMockData } from '@/hooks/use-mock-data';
import { generateCarapicuibaSeed, CARAPICUIBA_STUDENTS_DATA } from '@/lib/seeds/carapicuiba-seed';
import { cn } from '@/lib/utils';
import { TRACK_MORNING_IDA, TRACK_AFTERNOON_VOLTA, getPointFromTrack } from '@/lib/simulation-engine';

export default function PresentationSimulator() {
    const { addDoc, updateDoc, resetData, db } = useMockData() as any;
    const [currentStep, setCurrentStep] = useState(0);
    const [isAutoPilot, setIsAutoPilot] = useState(false);
    const [isStarted, setIsStarted] = useState(false);
    const [scenario, setScenario] = useState<'morning' | 'afternoon'>('morning');
    const [lastNotification, setLastNotification] = useState<string | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 1. Setup Data
    const handleResetAndSeed = () => {
        resetData();
        const seed = generateCarapicuibaSeed('sim-gestor-123');
        sessionStorage.setItem('mockUserId', 'sim-gestor-123');
        
        // Injetar dados básicos
        seed.schools.forEach(s => addDoc('schools', s));
        seed.students.forEach(s => addDoc('students', s));
        addDoc('parents', seed.parent);
        addDoc('drivers', seed.driver);
        addDoc('vehicles', seed.vehicle);
        addDoc('routes', seed.route);
        
        setIsStarted(true);
        setCurrentStep(0);
        setScenario('morning');
        setLastNotification("Simulação Inicializada: Case Carapicuíba.");
    };

    const formatSimTime = (idx: number, scenario: 'morning' | 'afternoon') => {
        const baseHour = scenario === 'morning' ? 7 : 12;
        const totalMinutes = (idx * 15); // Intervalos de 15 min entre alunos
        const hour = baseHour + Math.floor(totalMinutes / 60);
        const mins = totalMinutes % 60;
        const period = hour >= 12 && hour < 24 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour;
        return `${displayHour}:${mins === 0 ? '00' : mins} ${period}`;
    };

    const currentTrack = scenario === 'morning' ? TRACK_MORNING_IDA : TRACK_AFTERNOON_VOLTA;
    
    // Passos da Simulação baseados no Engine
    const steps = useMemo(() => {
        const s = currentTrack.filter(p => p.eventType);
        return s.map((point, idx) => ({
            id: `step-${idx}-${scenario}`,
            title: point.label || "Evento",
            description: point.eventType === 'pickup' ? `Realizando embarque de aluno.` : 
                         point.eventType === 'dropoff' ? `Realizando desembarque e registro de segurança.` :
                         `Ponto de controle atingido.`,
            action: () => {
                // Atualizar GPS
                updateDoc('locations', 'driver-carapicuiba', { 
                    latitude: point.lat, 
                    longitude: point.lng, 
                    timestamp: new Date().toISOString() 
                });

                // Atualizar Status do Aluno se houver ID
                if (point.studentId) {
                    const newStatus = point.eventType === 'pickup' ? 'a_bordo' : 'desembarcado';
                    updateDoc('students', point.studentId, { status: newStatus });
                    setLastNotification(point.eventType === 'pickup' ? `Van chegando para coletar ${CARAPICUIBA_STUDENTS_DATA.find(st => st.name.includes(point.studentId!))?.name || 'aluno'}` : `Aluno entregue com sucesso.`);
                }

                if (point.eventType === 'arrival') {
                    setLastNotification("Chegada na instituição de ensino confirmada.");
                }
            }
        }));
    }, [scenario, currentTrack]);

    const nextStep = () => {
        if (currentStep < steps.length - 1) {
            steps[currentStep].action();
            setCurrentStep(prev => prev + 1);
        } else {
            // Fim do Cenário -> Troca ou Loop
            if (scenario === 'morning') {
                setScenario('afternoon');
                setCurrentStep(0);
                setLastNotification("Iniciando Ciclo da Tarde: Retorno às residências.");
            } else {
                setScenario('morning');
                setCurrentStep(0);
                setLastNotification("Ciclo Reiniciado: Rota da Manhã.");
            }
        }
    };

    useEffect(() => {
        let interval: any;
        if (isAutoPilot) {
            interval = setInterval(() => {
                nextStep();
            }, 3500);
        }
        return () => clearInterval(interval);
    }, [isAutoPilot, currentStep, scenario]);

    // Visão Dinâmica de Alunos
    const studentsByScenario = useMemo(() => {
        return db.students.filter((s: any) => s.shift === (scenario === 'morning' ? 'Manhã' : 'Tarde'));
    }, [db.students, scenario]);

    return (
        <div className="min-h-screen bg-[#09090b] text-zinc-100 font-sans selection:bg-primary/30 overflow-x-hidden">
            {/* Background Effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-500/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
                {/* Master Header */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-[2rem] shadow-2xl">
                    <div className="flex items-center gap-5">
                        <div className="bg-gradient-to-br from-primary to-blue-600 p-4 rounded-2xl shadow-lg shadow-primary/20">
                            <Zap className="h-7 w-7 text-white animate-pulse" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-3xl font-black tracking-tighter uppercase italic bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                                    Guardian Simulator
                                </h1>
                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] font-black uppercase tracking-widest">v2.0 PRE-RELEASE</Badge>
                            </div>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-[0.3em] flex items-center gap-2">
                                <MapPin className="h-3 w-3 text-red-500" /> Case: Carapicuíba - Itinerário 10 Alunos
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {!isStarted ? (
                            <Button 
                                onClick={handleResetAndSeed} 
                                className="bg-white text-black hover:bg-zinc-200 h-14 px-8 text-sm font-black rounded-2xl gap-3 shadow-2xl shadow-white/5 transition-all hover:scale-105 active:scale-95"
                            >
                                <Play className="h-5 w-5 fill-current" /> CONFIGURAR E INICIAR
                            </Button>
                        ) : (
                            <>
                                <div className="flex items-center bg-black/40 border border-white/5 rounded-2xl p-1 gap-1">
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsAutoPilot(false)}
                                        className={cn("h-12 px-5 rounded-xl font-bold transition-all", !isAutoPilot ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
                                    >
                                        MANUAL
                                    </Button>
                                    <Button 
                                        variant="ghost" 
                                        onClick={() => setIsAutoPilot(true)}
                                        className={cn("h-12 px-5 rounded-xl font-bold transition-all gap-2", isAutoPilot ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "text-zinc-500 hover:text-white")}
                                    >
                                        AUTO-PILOT
                                    </Button>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => window.location.reload()} 
                                    className="h-14 w-14 border-white/5 bg-zinc-900/50 rounded-2xl hover:bg-white/5 transition-all text-zinc-400 hover:text-white"
                                >
                                    <RotateCcw className="h-6 w-6" />
                                </Button>
                            </>
                        )}
                    </div>
                </header>

                {/* Simulation Matrix */}
                {isStarted && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        
                        {/* LEFT: DRIVER OPS */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Bus className="h-5 w-5 text-primary" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Operation Control (Van)</h3>
                                </div>
                                <Badge variant="outline" className="bg-zinc-900 border-white/5 text-[10px] font-bold text-zinc-400">
                                    {scenario === 'morning' ? 'PERÍODO: MANHÃ (IDA)' : 'PERÍODO: TARDE (VOLTA)'}
                                </Badge>
                            </div>

                            <Card className="bg-zinc-900/60 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl h-[700px] flex flex-col group">
                                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-row justify-between items-center">
                                    <div>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight italic">Chamada Digital</CardTitle>
                                        <CardDescription className="text-xs font-bold text-zinc-500">LISTA DE ALUNOS ATRIBUÍDOS AO TURNO</CardDescription>
                                    </div>
                                    <div className="bg-primary/20 p-3 rounded-2xl border border-primary/20">
                                        <MonitorIcon className="h-6 w-6 text-primary" />
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-1 p-6 overflow-y-auto space-y-4 custom-scrollbar">
                                    {(studentsByScenario || []).filter((s: any) => !!s && !!s.id).map((student: any, idx: number) => (
                                        <motion.div 
                                            key={`sim-student-${student.id || idx}`}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                            className={cn(
                                                "p-5 rounded-3xl border transition-all duration-500 flex items-center justify-between",
                                                student.status === 'a_bordo' ? "bg-emerald-500/10 border-emerald-500/30" : 
                                                student.status === 'desembarcado' ? "bg-zinc-800/80 border-white/5 opacity-50" :
                                                "bg-zinc-800/40 border-white/5 hover:border-white/10"
                                            )}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={cn(
                                                    "h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner transition-colors",
                                                    student.status === 'a_bordo' ? "bg-emerald-500 text-white" : "bg-zinc-700 text-zinc-400"
                                                )}>
                                                    {String(student?.name || '?')[0]}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight">{String(student?.name || 'Aluno Simulado')}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Clock className="h-3 w-3 text-zinc-500" />
                                                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Previsão: {formatSimTime(idx, scenario)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {student.status === 'a_bordo' ? (
                                                    <Badge className="bg-emerald-500 text-white text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase italic">A BORDO</Badge>
                                                ) : student.status === 'desembarcado' ? (
                                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                                ) : (
                                                    <Badge variant="outline" className="border-zinc-700 text-zinc-500 text-[9px] font-bold">AGUARDANDO</Badge>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {/* RIGHT: PARENT / PWA */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <Smartphone className="h-5 w-5 text-amber-500" />
                                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Live Tracking (PWA)</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className="bg-red-500 text-[9px] font-black tracking-widest uppercase italic border-none shadow-lg shadow-red-500/20 px-2 py-0.5 animate-pulse">LIVE GPS</Badge>
                                </div>
                            </div>

                            <Card className="bg-zinc-900/60 border-white/5 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl h-[700px] flex flex-col relative group">
                                {/* Smartphone Shell Header */}
                                <div className="h-7 w-24 bg-zinc-800 rounded-full absolute top-4 left-1/2 -translate-x-1/2 z-50 border border-white/5 opacity-50" />
                                
                                <CardHeader className="p-8 pt-12 border-b border-white/5 flex flex-row justify-between items-center bg-zinc-800/20">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-amber-500 p-2 rounded-xl">
                                            <User className="h-5 w-5 text-white" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg font-black uppercase text-amber-500 tracking-tight">Guardian Parent</CardTitle>
                                            <p className="text-[10px] font-bold text-zinc-500">BENVINDO, RESPONSÁVEL</p>
                                        </div>
                                    </div>
                                    <Bell className="h-6 w-6 text-zinc-500" />
                                </CardHeader>

                                <CardContent className="flex-1 p-6 space-y-6 flex flex-col overflow-hidden">
                                    {/* MOCK MAP VIEW */}
                                    <div className="h-72 bg-zinc-800 rounded-[2rem] border border-white/5 relative overflow-hidden group/map shadow-inner shrink-0">
                                        {/* Mock Google Maps Grayscale */}
                                        <div className="absolute inset-0 grayscale invert contrast-125 opacity-20 bg-[url('https://maps.googleapis.com/maps/api/staticmap?center=-23.5250,-46.8450&zoom=15&size=640x400&key=MOCK')] bg-center bg-cover" />
                                        
                                        {/* Pulse Origin */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                                                <div className="relative bg-primary p-4 rounded-3xl shadow-2xl shadow-primary/40 border border-white/20">
                                                    <Bus className="h-6 w-6 text-white" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Overlay Info */}
                                        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                                            <div className="bg-zinc-900/90 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-xl">
                                                <div className="flex items-center gap-2">
                                                    <Navigation className="h-3 w-3 text-primary animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Rua General Marcondes Salgado</span>
                                                </div>
                                                <p className="text-[9px] text-zinc-500 font-bold mt-1 uppercase">Aproximadamente 4 min do destino</p>
                                            </div>
                                            <div className="bg-white text-black p-3 rounded-2xl font-black text-[10px] uppercase tracking-tighter shadow-xl">
                                                KM 52.4
                                            </div>
                                        </div>
                                    </div>

                                    {/* NOTIFICATION STACK */}
                                    <AnimatePresence mode="popLayout">
                                            {lastNotification && (
                                            <motion.div 
                                                key={lastNotification}
                                                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.9 }}
                                                className="bg-zinc-100 text-black p-5 rounded-3xl shadow-2xl flex items-center gap-4 border-2 border-primary/20"
                                            >
                                                <div className="bg-primary p-3 rounded-2xl">
                                                    <Bell className="h-5 w-5 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 leading-none mb-1">Notificação em Tempo Real</p>
                                                    <p className="text-sm font-black uppercase tracking-tight leading-tight">{lastNotification}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    {/* JOURNEY STATUS */}
                                    <div className="bg-zinc-800/30 border border-white/5 rounded-3xl p-6 space-y-6 flex-1 flex flex-col justify-center">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-4 w-4 text-emerald-500" />
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Status de Segurança</h4>
                                        </div>
                                        <div className="flex justify-between relative px-2">
                                            <div className="absolute top-5 left-0 w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className="h-full bg-primary" 
                                                    initial={{ width: '0%' }}
                                                    animate={{ width: `${(currentStep + 1) / steps.length * 100}%` }}
                                                    transition={{ duration: 1 }}
                                                />
                                            </div>
                                            {[
                                                { icon: MapPin, label: "SAÍDA", time: "07:15" },
                                                { icon: Bus, label: "EM ROTA", time: "07:30" },
                                                { icon: Shield, label: "DESTINO", time: "07:55" }
                                            ].map((st, i) => (
                                                <div key={i} className="relative z-10 flex flex-col items-center gap-3">
                                                    <div className={cn(
                                                        "h-10 w-10 rounded-2xl border-2 flex items-center justify-center transition-all duration-500 shadow-xl",
                                                        i <= (currentStep / 2) ? "bg-primary border-primary text-white scale-110 shadow-primary/20" : "bg-zinc-900 border-zinc-700 text-zinc-600"
                                                    )}>
                                                        <st.icon className="h-5 w-5" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className={cn("text-[9px] font-black uppercase tracking-tighter", i <= (currentStep / 2) ? "text-white" : "text-zinc-600")}>{st.label}</p>
                                                        <p className="text-[8px] font-bold text-zinc-500">{st.time}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                )}

                {/* Initial View */}
                {!isStarted && (
                    <div className="max-w-4xl mx-auto py-24 text-center space-y-10">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-block p-6 bg-primary/10 rounded-[2.5rem] border border-primary/20 mb-4"
                        >
                            <User className="h-16 w-16 text-primary" />
                        </motion.div>
                        <div className="space-y-4">
                            <h2 className="text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-[0.9] text-white">
                                <span className="block opacity-20">PRONTO PARA O</span>
                                NEXT <span className="text-primary tracking-[-0.08em]">STAGE</span>
                            </h2>
                            <p className="text-zinc-500 text-xl md:text-2xl max-w-2xl mx-auto font-medium leading-relaxed tracking-tight">
                                Demonstração interativa do ecossistema Guardian em <span className="text-zinc-200">Carapicuíba/SP</span>. Experiência unificada para motoristas e famílias.
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-4">
                            {["10 Alunos Validados", "Dupla Escola (Ida/Volta)", "Telemetria GPS Real", "Sincronia Monitor-Responsável"].map((feat, i) => (
                                <Badge key={i} variant="outline" className="px-6 py-3 rounded-2xl bg-zinc-900/50 border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                    {feat}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* THE FLOATING COMMANDER - O Botão de Controle Épico */}
                <AnimatePresence>
                    {isStarted && !isAutoPilot && (
                        <motion.div 
                            initial={{ y: 100, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 100, opacity: 0 }}
                            className="fixed bottom-12 left-1/2 -translate-x-1/2 z-[100]"
                        >
                            <Button 
                                onClick={nextStep}
                                disabled={isAutoPilot}
                                className="h-20 px-12 bg-white text-black hover:bg-zinc-200 shadow-[0_0_50px_rgba(255,255,255,0.15)] rounded-[2.5rem] border-4 border-black group/master transition-all active:scale-95"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="flex flex-col items-start">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover/master:text-zinc-800 transition-colors">Avançar Demonstração</span>
                                        <span className="text-xl font-black uppercase italic leading-none tracking-tighter">{steps[currentStep].title}</span>
                                    </div>
                                    <div className="bg-black p-3 rounded-2xl group-hover/master:translate-x-1 transition-transform">
                                        <ChevronRight className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                            </Button>
                            
                            {/* Visual Hint for Mobile/Talk */}
                            <motion.div 
                                className="absolute -top-4 -right-4 bg-amber-500 h-8 w-8 rounded-full border-4 border-[#09090b] shadow-xl flex items-center justify-center"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            >
                                <Zap className="h-4 w-4 text-white fill-current" />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Insight Panel */}
                {isStarted && (
                    <div className="max-w-[1600px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                            <div className="bg-zinc-800 p-4 rounded-2xl"><MapPin className="h-6 w-6 text-zinc-500" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500">Município Base</p>
                                <p className="text-sm font-black text-white uppercase italic">Carapicuíba, SP</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                            <div className="bg-zinc-800 p-4 rounded-2xl"><Shield className="h-6 w-6 text-emerald-500" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500">Security Check</p>
                                <p className="text-sm font-black text-white uppercase italic">Critérios 100% OK</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 flex items-center gap-4">
                            <div className="bg-zinc-800 p-4 rounded-2xl"><Clock className="h-6 w-6 text-zinc-500" /></div>
                            <div>
                                <p className="text-[10px] font-black uppercase text-zinc-500">Horário Local</p>
                                <p className="text-sm font-black text-white uppercase italic">{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                        </div>
                        <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-primary/20 flex items-center gap-4 shadow-xl shadow-primary/5">
                            <div className="bg-primary/20 p-4 rounded-2xl"><Activity className="h-6 w-6 text-primary animate-pulse" /></div>
                            <div className="flex-1">
                                <p className="text-[10px] font-black uppercase text-zinc-500">Status Operacional</p>
                                <p className="text-sm font-black text-zinc-300 italic truncate tracking-tight">"{steps[currentStep].description}"</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Custom Styles */}
            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
            `}</style>
        </div>
    );
}
