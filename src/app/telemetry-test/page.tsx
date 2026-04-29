'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTelemetry, useDriverLocation } from '@/hooks/use-telemetry';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { MapPin, Send, Loader2, Navigation, Activity, ShieldCheck, Wifi } from 'lucide-react';
import { SmartMap } from '@/components/shared/smart-map';
import { AdvancedMarker, Pin } from "@vis.gl/react-google-maps";
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function TelemetryTestPage() {
  const { updateLocation } = useTelemetry();
  const [driverId, setDriverId] = useState('driver-test-premium');
  const [isSending, setIsSending] = useState(false);
  const [recenterTrigger, setRecenterTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Monitora a localização atual do motorista de teste via Realtime Database
  const { location, loading } = useDriverLocation(driverId);

  // Centro inicial (ex: São Paulo - Av. Paulista)
  const defaultCenter = { lat: -23.5617, lng: -46.6560 };

  const driverPos = useMemo(() => {
    if (!location) return defaultCenter;
    return { lat: location.latitude, lng: location.longitude };
  }, [location]);

  const simulateMovement = async () => {
    setIsSending(true);
    // Simula um movimento ao longo da Av. Paulista
    const baseLat = -23.5617;
    const baseLng = -46.6560;
    const variation = 0.005;
    
    const lat = baseLat + (Math.random() - 0.5) * variation;
    const lng = baseLng + (Math.random() - 0.5) * variation;
    
    await updateLocation(driverId, lat, lng);
    setRecenterTrigger(prev => prev + 1);
    setIsSending(false);
  };

  return (
    <div className="relative w-full h-screen bg-slate-950 overflow-hidden font-sans">
      {/* Background Map - Full Screen */}
      <div className="absolute inset-0 z-0">
        <SmartMap 
          center={driverPos} 
          zoom={15} 
          stops={[]} 
          recenterTrigger={recenterTrigger}
        >
          {location && (
            <AdvancedMarker position={driverPos} title="Van Guardian">
              <div className="relative">
                <div className="absolute -inset-4 bg-primary/20 rounded-full animate-ping opacity-75" />
                <Pin background={'#22c55e'} borderColor={'#fff'} glyphColor="#fff">
                    <Navigation className="h-4 w-4 fill-current rotate-45" />
                </Pin>
              </div>
            </AdvancedMarker>
          )}
        </SmartMap>
      </div>

      {/* Header Overlay */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-4">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3 rounded-2xl shadow-2xl flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white shadow-lg">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight uppercase tracking-tighter">Guardian <span className="text-primary-foreground/60 font-medium">Live</span></h1>
            <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] h-5">
              <Wifi className="h-3 w-3 mr-1" /> CONEXÃO ESTÁVEL
            </Badge>
          </div>
        </div>
      </div>

      {/* Floating Status Card */}
      <div className="absolute bottom-10 left-6 right-6 md:right-auto md:w-96 z-10">
        <Card className="bg-slate-900/80 backdrop-blur-xl border-white/10 shadow-2xl overflow-hidden rounded-3xl">
          <div className="h-1 bg-gradient-to-r from-primary via-green-500 to-primary animate-pulse" />
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <CardTitle className="text-white flex items-center gap-2 text-sm">
                <Activity className="h-4 w-4 text-primary" /> 
                Status da Telemetria (Realtime)
              </CardTitle>
              {loading && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Latitude</p>
                  <p className="text-white font-mono text-sm">{location?.latitude?.toFixed(6) || '---'}</p>
               </div>
               <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[10px] text-white/40 uppercase font-black mb-1">Longitude</p>
                  <p className="text-white font-mono text-sm">{location?.longitude?.toFixed(6) || '---'}</p>
               </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button 
                onClick={simulateMovement} 
                className="w-full h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                disabled={isSending}
              >
                {isSending ? (
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                ) : (
                  <Navigation className="h-5 w-5 mr-2" />
                )}
                ATUALIZAR POSIÇÃO AGORA
              </Button>
              
              <p className="text-center text-[10px] text-white/30 uppercase tracking-widest font-bold">
                {mounted && location?.timestamp ? `Visto pela última vez às ${new Date(location.timestamp).toLocaleTimeString()}` : 'Aguardando sinal...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Decorative Overlay */}
      <div className="absolute inset-0 pointer-events-none border-[16px] border-white/5 rounded-[40px] z-20" />
    </div>
  );
}
