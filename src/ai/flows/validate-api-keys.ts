
'use server';
/**
 * @fileOverview Fluxo para validar se as APIs da Geoapify estão ativas e funcionais.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ValidateApiOutputSchema = z.object({
  geocoding: z.object({
    status: z.enum(['ok', 'error']),
    message: z.string(),
  }),
  routing: z.object({
    status: z.enum(['ok', 'error']),
    message: z.string(),
  }),
});

export type ValidateApiOutput = z.infer<typeof ValidateApiOutputSchema>;

export const validateGeoapifyApi = ai.defineFlow(
  {
    name: 'validateGeoapifyApi',
    inputSchema: z.void(),
    outputSchema: ValidateApiOutputSchema,
  },
  async () => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    const results = {
      geocoding: { status: 'error' as const, message: 'Não testado' },
      routing: { status: 'error' as const, message: 'Não testado' },
    };

    if (!apiKey) {
      const errorMsg = 'Chave GEOAPIFY_API_KEY não encontrada no ambiente.';
      return {
        geocoding: { status: 'error', message: errorMsg },
        routing: { status: 'error', message: errorMsg },
      };
    }

    // 1. Testar Geocoding (Busca por São Paulo)
    try {
      const geoUrl = `https://api.geoapify.com/v1/geocode/search?text=Sao%20Paulo&limit=1&apiKey=${apiKey}`;
      const geoRes = await fetch(geoUrl);
      if (geoRes.ok) {
        results.geocoding = { status: 'ok', message: 'API de Geocodificação ativa.' };
      } else {
        const data = await geoRes.json();
        results.geocoding = { status: 'error', message: data.message || `Erro ${geoRes.status}` };
      }
    } catch (e) {
      results.geocoding = { status: 'error', message: 'Falha na requisição de Geocoding.' };
    }

    // 2. Testar Routing (Rota curta em SP)
    try {
      const routeUrl = `https://api.geoapify.com/v1/routing?waypoints=-23.55,-46.63|-23.56,-46.64&mode=drive&apiKey=${apiKey}`;
      const routeRes = await fetch(routeUrl);
      if (routeRes.ok) {
        results.routing = { status: 'ok', message: 'API de Roteirização ativa.' };
      } else {
        const data = await routeRes.json();
        results.routing = { status: 'error', message: data.message || `Erro ${routeRes.status}` };
      }
    } catch (e) {
      results.routing = { status: 'error', message: 'Falha na requisição de Routing.' };
    }

    return results;
  }
);
