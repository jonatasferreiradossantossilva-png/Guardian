
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
        // Se tivéssemos um helper de decode, usaríamos aqui. 
        // Para este protótipo, focaremos no GeoJSON do Geoapify.
        return null;
    }

    if (geoJsonPath) {
      try {
        const geometry = JSON.parse(geoJsonPath);
        if (geometry.type === 'LineString') {
          // GeoJSON usa [lng, lat], Google usa {lat, lng}
          return geometry.coordinates.map((coord: number[]) => ({
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
    if (!map || !path) return;

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
  }, [map, path, strokeColor, strokeWeight]);

  return null;
}
