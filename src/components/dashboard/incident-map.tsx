"use client";

import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import type { Incident } from "@/lib/placeholder-data";
import { useState, useEffect } from "react";
import { Badge } from "../ui/badge";
import { useDataCollection } from '@/hooks/use-data';
import { Loader2 } from 'lucide-react';

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const severityColorMap: { [key in Incident["severity"]]: string } = {
  Crítica: "#ef4444", // red-500
  Alta: "#f97316", // orange-500
  Média: "#eab308", // yellow-500
  Baixa: "#84cc16", // lime-500
};

// This component will handle map panning and zooming when a target is set.
function MapController({ target }: { target: google.maps.LatLngLiteral | null }) {
    const map = useMap();

    useEffect(() => {
        if (map && target) {
            map.panTo(target);
            map.setZoom(15);
        }
    }, [map, target]);

    return null; // This component does not render anything.
}


export function IncidentMap({ target }: { target: google.maps.LatLngLiteral | null }) {
  const { data: incidents, isLoading } = useDataCollection<Incident>('incidents');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  if (isLoading) {
    return (
         <div className="flex h-full w-full items-center justify-center bg-secondary/30">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    );
  }

  if (!API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-secondary/30">
        <div className="text-center p-4">
            <p className="font-semibold text-lg">Mapa Indisponível</p>
            <p className="text-muted-foreground text-sm">
                A chave da API do Google Maps não foi configurada.
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
                Adicione `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ao seu ambiente.
            </p>
        </div>
      </div>
    );
  }

  const position = { lat: -23.55052, lng: -46.633308 }; // São Paulo center

  return (
    <APIProvider apiKey={API_KEY}>
      <GoogleMap
        defaultCenter={position}
        defaultZoom={12}
        mapId="rota_segura_map"
        disableDefaultUI={true}
        gestureHandling={'greedy'}
        className="w-full h-full"
      >
        <MapController target={target} />
        {incidents && incidents.map((incident) => (
          <AdvancedMarker
            key={incident.id}
            position={incident.location}
            onClick={() => setSelectedIncident(incident)}
          >
            <Pin
              background={severityColorMap[incident.severity]}
              borderColor={"#fff"}
              glyphColor={"#fff"}
            />
          </AdvancedMarker>
        ))}

        {selectedIncident && (
          <InfoWindow
            position={selectedIncident.location}
            onCloseClick={() => setSelectedIncident(null)}
          >
            <div className="p-2 max-w-xs">
                <Badge variant={selectedIncident.severity === 'Crítica' ? 'destructive' : 'default'}>{selectedIncident.severity}</Badge>
                <h3 className="font-bold my-1">{selectedIncident.category}</h3>
                <p className="text-sm text-muted-foreground">{selectedIncident.description}</p>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </APIProvider>
  );
}
