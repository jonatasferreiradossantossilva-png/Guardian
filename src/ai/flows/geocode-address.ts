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

export async function geocodeAddress({ address }: GeocodeAddressInput): Promise<GeocodeAddressOutput> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    
    const fallbackResult = {
        latitude: -23.5236, // Carapicuíba Center
        longitude: -46.8407,
        formattedAddress: 'Endereço Simulado (Fallback de Segurança), Carapicuíba - SP',
        street: 'Avenida Inocêncio Seráfico',
        number: '123',
        neighborhood: 'Centro',
        city: 'Carapicuíba',
        state: 'SP',
        zipCode: '06310000'
    };

    if (!apiKey || apiKey === 'mock-key' || apiKey === '') {
      console.warn('⚠️ Google Maps API Key ausente. Usando coordenadas de fallback para simulação.');
      return fallbackResult;
    }

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
            console.warn(`⚠️ Endereço não encontrado geocoder (${address}). Usando fallback.`);
            return fallbackResult;
        }

        const result = data.results[0];
        const components = result.address_components;
        
        const getComponent = (types: string[]) => 
            components.find((c: any) => types.some(t => c.types.includes(t)))?.long_name || '';
        
        const getShortComponent = (types: string[]) => 
            components.find((c: any) => types.some(t => c.types.includes(t)))?.short_name || '';

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
        console.warn("⚠️ Usando fallback em caso de erro da rede.");
        return fallbackResult;
    }
}
