'use server';
/**
 * @fileOverview Fluxo para obter rotas e polilinhas usando a API da Geoapify (OpenStreetMap).
 * Implementa lógica de fatiamento para suportar o limite de 5 waypoints do plano gratuito.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const WaypointSchema = z.object({
  lat: z.number(),
  lng: z.number(),
});

const RoutingGeoapifyInputSchema = z.object({
  waypoints: z.array(WaypointSchema).min(2).describe('Lista de coordenadas lat/lng para a rota.'),
  mode: z.enum(['drive', 'truck']).optional().default('drive'),
});
export type RoutingGeoapifyInput = z.infer<typeof RoutingGeoapifyInputSchema>;

const RoutingGeoapifyOutputSchema = z.object({
  polyline: z.string().describe('A linha da rota no formato GeoJSON.'),
  distanceKm: z.number(),
  durationMinutes: z.number(),
});
export type RoutingGeoapifyOutput = z.infer<typeof RoutingGeoapifyOutputSchema>;

/**
 * Função auxiliar para buscar um trecho da rota
 */
async function fetchRouteChunk(waypoints: {lat: number, lng: number}[], mode: string, apiKey: string) {
    const validWaypoints = waypoints.filter(w => 
        typeof w.lat === 'number' && Number.isFinite(w.lat) && 
        typeof w.lng === 'number' && Number.isFinite(w.lng)
    );

    if (validWaypoints.length < 2) {
        throw new Error('Número insuficiente de coordenadas válidas para traçar a rota.');
    }

    const activeMode = mode || 'drive';
    const waypointsStr = validWaypoints.map(w => `${w.lat.toFixed(6)},${w.lng.toFixed(6)}`).join('|');
    const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypointsStr)}&mode=${activeMode}&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ message: response.statusText }));
      const errorMessage = errorBody.message || response.statusText;
      console.error(`Erro detalhado Geoapify (${response.status}):`, errorBody);
      throw new Error(`Geoapify Routing falhou (${response.status}): ${errorMessage}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error('Nenhuma rota encontrada para este trecho.');
    }

    return data.features[0];
}

export const routingGeoapify = ai.defineFlow(
  {
    name: 'routingGeoapifyFlow',
    inputSchema: RoutingGeoapifyInputSchema,
    outputSchema: RoutingGeoapifyOutputSchema,
  },
  async ({ waypoints, mode }) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) throw new Error('GEOAPIFY_API_KEY não configurada.');

    const activeMode = mode || 'drive';
    const cleanedWaypoints = waypoints.filter(w => 
        Number.isFinite(w.lat) && Number.isFinite(w.lng)
    );

    if (cleanedWaypoints.length < 2) {
        throw new Error('Dados de GPS insuficientes para gerar a rota.');
    }

    const MAX_POINTS = 5;
    
    if (cleanedWaypoints.length <= MAX_POINTS) {
        const route = await fetchRouteChunk(cleanedWaypoints, activeMode, apiKey);
        return {
            polyline: JSON.stringify(route.geometry),
            distanceKm: route.properties.distance / 1000,
            durationMinutes: Math.round(route.properties.time / 60),
        };
    }

    let combinedCoordinates: number[][] = [];
    let totalDistance = 0;
    let totalTime = 0;

    for (let i = 0; i < cleanedWaypoints.length - 1; i += (MAX_POINTS - 1)) {
        const chunk = cleanedWaypoints.slice(i, i + MAX_POINTS);
        if (chunk.length < 2) break;

        try {
            const route = await fetchRouteChunk(chunk, activeMode, apiKey);
            const coords = route.geometry.coordinates;
            
            // Validar que os dados retornados são úteis antes de processar
            if (Array.isArray(coords) && coords.length > 0) {
                if (combinedCoordinates.length > 0) {
                    combinedCoordinates.push(...coords.slice(1));
                } else {
                    combinedCoordinates.push(...coords);
                }
                totalDistance += route.properties.distance || 0;
                totalTime += route.properties.time || 0;
            }
        } catch (e) {
            console.error("Falha ao processar chunk de rota:", e);
            if (combinedCoordinates.length > 0) break;
            throw e;
        }
    }

    return {
      polyline: JSON.stringify({ type: 'LineString', coordinates: combinedCoordinates }),
      distanceKm: totalDistance / 1000,
      durationMinutes: Math.round(totalTime / 60),
    };
  }
);
