'use server';
/**
 * @fileOverview Fluxo para geocodificar endereços ou buscar locais usando a API do Google Maps.
 * Suporta busca semântica por nome de colégio ou endereço completo.
 * Retorna dados estruturados para preenchimento automático de formulários brasileiros.
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
  street: z.string().optional(),
  number: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

export const geocodeAddress = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    // Utilizamos a chave do Google Maps disponível no ambiente
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Chave de API do Google Maps não configurada no ambiente.');
    }

    // Chamada à Geocoding API do Google com viés para o Brasil
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}&language=pt-BR&region=br`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Google Maps API falhou com status ${response.status}`);
        }

        const data = await response.json();

        if (data.status !== 'OK' || !data.results || data.results.length === 0) {
          throw new Error('Localização não encontrada pelo Google Maps.');
        }

        const result = data.results[0];
        const components = result.address_components;
        
        // Função auxiliar para extrair componentes específicos do endereço do Google
        const getComponent = (types: string[]) => 
            components.find((c: any) => types.some(t => c.types.includes(t)))?.long_name || '';
        
        const getShortComponent = (types: string[]) => 
            components.find((c: any) => types.some(t => c.types.includes(t)))?.short_name || '';

        // Mapeamento estruturado para o padrão brasileiro
        return {
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          formattedAddress: result.formatted_address,
          street: getComponent(['route']),
          number: getComponent(['street_number']),
          neighborhood: getComponent(['sublocality_level_1', 'sublocality', 'neighborhood', 'political']),
          city: getComponent(['administrative_area_level_2', 'locality']),
          state: getShortComponent(['administrative_area_level_1']),
          zipCode: getComponent(['postal_code']).replace(/\D/g, ''),
        };
    } catch (error) {
        console.error("Erro no fluxo de geocodificação Google:", error);
        throw error;
    }
  }
);
