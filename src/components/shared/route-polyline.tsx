'use client';

import { useEffect, useMemo } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

interface RoutePolylineProps {
  encodedPath?: string;
  geoJsonPath?: string;
  strokeColor?: string;
  strokeWeight?: number;
}

/**
 * Componente para renderizar uma Polyline em um Google Map.
 * Suporta tanto o formato GeoJSON (vindo do Geoapify) quanto o formato nativo.
 */
export function RoutePolyline({ 
  encodedPath, 
  geoJsonPath, 
  strokeColor = '#3b82f6', 
  strokeWeight = 5 
}: RoutePolylineProps) {
  const map = useMap();

  const path = useMemo(() => {
    if (encodedPath) {
        // Placeholder para futura implementação de decode de polylines comprimidas
        return null;
    }

    if (geoJsonPath) {
      try {
        const geometry = JSON.parse(geoJsonPath);
        if (geometry.type === 'LineString' && Array.isArray(geometry.coordinates)) {
          // GeoJSON usa [lng, lat], Google usa {lat, lng}
          // Filtramos rigorosamente para garantir que apenas números finitos sejam passados ao Google Maps
          return geometry.coordinates
            .filter((coord: any) => 
                Array.isArray(coord) && 
                coord.length >= 2 && 
                typeof coord[0] === 'number' && Number.isFinite(coord[0]) &&
                typeof coord[1] === 'number' && Number.isFinite(coord[1])
            )
            .map((coord: number[]) => ({
              lat: coord[1],
              lng: coord[0],
            }));
        }
      } catch (e) {
        console.error("Erro ao processar GeoJSON da rota", e);
      }
    }
    return null;
  }, [encodedPath, geoJsonPath]);

  useEffect(() => {
    // Só criamos a polyline se o mapa estiver pronto e o path tiver pelo menos 2 pontos válidos
    if (!map || !path || path.length < 2) return;

    try {
        const polyline = new google.maps.Polyline({
          path: path,
          geodesic: true,
          strokeColor: strokeColor,
          strokeOpacity: 0.8,
          strokeWeight: strokeWeight,
          map: map,
        });

        return () => {
          polyline.setMap(null);
        };
    } catch (err) {
        console.error("Erro ao renderizar Polyline no Google Maps:", err);
    }
  }, [map, path, strokeColor, strokeWeight]);

  return null;
}
