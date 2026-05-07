'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo } from 'react';
import { APIProvider, Map as GoogleMap, useMap } from "@vis.gl/react-google-maps";
import { useDataCollection, useData } from '@/hooks/use-data';
import { Loader2, AlertCircle } from 'lucide-react';
import { ErrorBoundary } from './error-boundary';
import { useRef } from 'react';

// Dynamic import for Leaflet to avoid window is not defined errors
const LeafletMap = dynamic(() => import('./leaflet-map-inner'), { 
    ssr: false,
    loading: () => (
        <div className="flex h-full w-full items-center justify-center bg-secondary/20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
});

interface SmartMapProps {
    center: { lat: number, lng: number };
    zoom: number;
    stops: any[];
    driverLocation?: { latitude: number, longitude: number } | null;
    routePolyline?: string;
    recenterTrigger: number;
    forcedMode?: 'google' | 'osm';
    editableMarker?: { latitude: number, longitude: number } | null;
    onPositionChange?: (lat: number, lng: number) => void;
    children?: React.ReactNode; 
}

function GoogleMapController({ stops, driverLocation, trigger }: { stops: any[], driverLocation?: any, trigger: number }) {
    const map = useMap();
    
    useEffect(() => {
        if (!map || typeof google === 'undefined') return;
        
        const bounds = new google.maps.LatLngBounds();
        let hasPoints = false;

        if (driverLocation?.latitude && driverLocation?.longitude) {
            bounds.extend({ lat: driverLocation.latitude, lng: driverLocation.longitude });
            hasPoints = true;
        }

        stops.forEach(s => {
            if (s.data?.latitude && s.data?.longitude) {
                bounds.extend({ lat: s.data.latitude, lng: s.data.longitude });
                hasPoints = true;
            }
        });

        if (hasPoints) {
            map.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
        }
    }, [map, stops, driverLocation, trigger]);
    
    return null;
}

export function SmartMap({ center, zoom, stops, driverLocation, routePolyline, recenterTrigger, forcedMode, editableMarker, onPositionChange, children }: SmartMapProps) {
    const { updateDoc } = useData() as any;
    const { data: config } = useDataCollection('config', []);
    const { data: telemetryData } = useDataCollection('telemetry');
    
    const telemetry = telemetryData?.[0];
    const isManualScaling = config?.[0]?.scaling_mode ?? false;
    
    // Trava de Segurança: Se os carregamentos mensais da Google passarem de 25k, vira OSM
    const isOverLimit = (telemetry?.googleMapLoads || 0) >= (telemetry?.usageThreshold || 25000);
    
    // O Modo Escala (OSM) é ativado se: Forçado manual OU se atingiu o limite de custo
    const isScalingActive = isManualScaling || isOverLimit;
    
    // Regra de Negócio: O Motorista SEMPRE tenta Google se houver forcedMode, a menos que não tenha API Key
    // Forçamos OSM por padrão para garantir estabilidade total na demonstração
    // (Evita erros de Billing/Domínio do Google Maps que podem travar a apresentação)
    const activeMode = forcedMode || 'osm'; 
    
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    // EFEITO DE TELEMETRIA: Monitora o uso e gerencia o reset mensal
    useEffect(() => {
        if (activeMode === 'google' && googleApiKey && telemetry) {
            const now = new Date();
            const todayMonth = now.toISOString().substring(0, 7); // yyyy-mm
            
            if (telemetry?.currentMonth !== todayMonth) {
                // Novo mês ou primeira carga: Reseta o contador
                updateDoc('telemetry', 'global-usage', { 
                    googleMapLoads: 1, 
                    currentMonth: todayMonth 
                });
            } else {
                // Mesmo mês: Apenas incrementa
                updateDoc('telemetry', 'global-usage', { 
                    googleMapLoads: (telemetry?.googleMapLoads || 0) + 1 
                });
            }
        }
    }, [activeMode, googleApiKey, telemetry?.id]); // Executa apenas no mount do componente de mapa Google

    if (activeMode === 'osm' || !googleApiKey) {
        return (
            <ErrorBoundary name="LeafletMap">
                <LeafletMap 
                    center={center}
                    zoom={zoom}
                    stops={stops}
                    driverLocation={driverLocation}
                    routePolyline={routePolyline}
                    recenterTrigger={recenterTrigger}
                    editableMarker={editableMarker}
                    onPositionChange={onPositionChange}
                />
            </ErrorBoundary>
        );
    }

    return (
        <ErrorBoundary name="GoogleMapStack">
            <APIProvider apiKey={googleApiKey}>
                <div className="h-full w-full relative">
                    <GoogleMap
                        defaultCenter={center}
                        defaultZoom={zoom}
                        mapId="guardian_smart_map"
                        gestureHandling={'greedy'}
                        disableDefaultUI={true}
                        zoomControl={true}
                        className="h-full w-full"
                    >
                        <GoogleMapController stops={stops} driverLocation={driverLocation} trigger={recenterTrigger} />
                        {children}
                    </GoogleMap>
                </div>
            </APIProvider>
        </ErrorBoundary>
    );
}
