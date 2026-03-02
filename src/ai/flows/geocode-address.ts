'use server';
/**
 * @fileOverview Fluxo para geocodificar endereços ou buscar locais usando a API Geoapify.
 * Suporta busca semântica por nome de colégio ou endereço completo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('O endereço completo ou nome de um local para buscar coordenadas.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

const GeocodeAddressOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string(),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

export const geocodeAddress = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('GEOAPIFY_API_KEY não configurada no ambiente.');
    }

    // Usamos o endpoint de Search que é mais flexível para nomes de estabelecimentos + endereços
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address
    )}&lang=pt&limit=1&apiKey=${apiKey}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Geoapify API falhou com status ${response.status}`);
        }

        const data = await response.json();

        if (!data.features || data.features.length === 0) {
          throw new Error('Localização não encontrada para o termo informado.');
        }

        const feature = data.features[0];
        const { lon, lat } = feature.properties;
        const formattedAddress = feature.properties.formatted;

        return {
          latitude: lat,
          longitude: lon,
          formattedAddress,
        };
    } catch (error) {
        console.error("Erro no fluxo de geocodificação:", error);
        throw error;
    }
  }
);
