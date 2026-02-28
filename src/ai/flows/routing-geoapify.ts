'use server';
/**
 * @fileOverview Fluxo para obter rotas e polilinhas usando a API da Geoapify (OpenStreetMap).
 * Serve como motor de resiliência (Plano B) para o sistema Guardian.
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
  polyline: z.string().describe('A linha da rota no formato Encoded Polyline ou GeoJSON.'),
  distanceKm: z.number(),
  durationMinutes: z.number(),
});
export type RoutingGeoapifyOutput = z.infer<typeof RoutingGeoapifyOutputSchema>;

export const routingGeoapify = ai.defineFlow(
  {
    name: 'routingGeoapifyFlow',
    inputSchema: RoutingGeoapifyInputSchema,
    outputSchema: RoutingGeoapifyOutputSchema,
  },
  async ({ waypoints, mode }) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) throw new Error('GEOAPIFY_API_KEY não configurada.');

    const waypointsStr = waypoints.map(w => `${w.lat},${w.lng}`).join('|');
    const url = `https://api.geoapify.com/v1/routing?waypoints=${encodeURIComponent(waypointsStr)}&mode=${mode}&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify Routing falhou: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error('Nenhuma rota encontrada pela Geoapify.');
    }

    const route = data.features[0];
    const properties = route.properties;
    
    // Geoapify retorna geometria em GeoJSON. Para simplificar o armazenamento e compatibilidade com Google,
    // em uma implementação real converteríamos para Encoded Polyline. 
    // Aqui retornaremos a string JSON da geometria para renderização via Leaflet/Google.
    return {
      polyline: JSON.stringify(route.geometry),
      distanceKm: properties.distance / 1000,
      durationMinutes: Math.round(properties.time / 60),
    };
  }
);
