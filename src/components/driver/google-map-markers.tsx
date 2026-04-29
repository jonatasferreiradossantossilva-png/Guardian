'use client';

import React from 'react';
import { AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { RoutePolyline } from '@/components/shared/route-polyline';

import { Student, SchoolData } from '@/types/mock-data';

type Stop = 
  | { id: string; type: 'student'; data: Student; status?: string }
  | { id: string; type: 'school'; data: SchoolData; status?: string };

interface GoogleMapMarkersProps {
  driverLocation: any;
  stops: Stop[];
  routePolyline?: string;
}

/**
 * Componente isolado para marcadores do Google Maps.
 * Extraído para resolver erros de inicialização (Temporal Dead Zone) em produção.
 */
export function GoogleMapMarkers({ driverLocation, stops, routePolyline }: GoogleMapMarkersProps) {
  return (
    <>
      {/* Marcador do Motorista */}
      {driverLocation && (
        <AdvancedMarker
          position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }}
          title="Sua Localização"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-blue-600 shadow-lg">
            <div className="h-4 w-4 animate-pulse rounded-full bg-white" />
          </div>
        </AdvancedMarker>
      )}

      {/* Marcadores das Paradas (Alunos e Escolas) */}
      {stops.map((stop) => {
        if (!stop.data?.latitude || !stop.data?.longitude) return null;
        
        const isSchool = stop.type === 'school';
        const isAboard = stop.status === 'a_bordo';
        const isDroppedOff = stop.status === 'desembarcado';

        return (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.data.latitude, lng: stop.data.longitude }}
          >
            <Pin 
              background={isSchool ? '#ef4444' : isAboard ? '#10b981' : isDroppedOff ? '#94a3b8' : '#fbbf24'} 
              glyphColor={'#000'} 
              borderColor={'#000'} 
            />
          </AdvancedMarker>
        );
      })}

      {/* Linha da Rota */}
      {routePolyline && <RoutePolyline geoJsonPath={routePolyline} />}
    </>
  );
}
