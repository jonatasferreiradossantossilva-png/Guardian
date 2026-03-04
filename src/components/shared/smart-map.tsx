'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { APIProvider, Map as GoogleMap } from "@vis.gl/react-google-maps";
import { useMockCollection } from '@/hooks/use-mock-data';
import { Loader2 } from 'lucide-react';

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
    children?: React.ReactNode; // For Google-specific markers if needed
}

export function SmartMap({ center, zoom, stops, driverLocation, routePolyline, recenterTrigger, forcedMode, children }: SmartMapProps) {
    const { data: config } = useMockCollection('config');
    const isScalingMode = config?.[0]?.scaling_mode ?? false;
    
    const activeMode = forcedMode || (isScalingMode ? 'osm' : 'google');
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (activeMode === 'osm' || !googleApiKey) {
        return (
            <LeafletMap 
                center={center}
                zoom={zoom}
                stops={stops}
                driverLocation={driverLocation}
                routePolyline={routePolyline}
                recenterTrigger={recenterTrigger}
            />
        );
    }

    return (
        <APIProvider apiKey={googleApiKey}>
            <GoogleMap
                defaultCenter={center}
                defaultZoom={zoom}
                mapId="guardian_smart_map"
                gestureHandling={'greedy'}
                disableDefaultUI={true}
                zoomControl={true}
                className="h-full w-full"
            >
                {children}
            </GoogleMap>
        </APIProvider>
    );
}
