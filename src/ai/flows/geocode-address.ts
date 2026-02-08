'use server';
/**
 * @fileOverview A flow to geocode an address using the Geoapify service.
 *
 * - geocodeAddress - A function that takes an address and returns its latitude and longitude.
 * - GeocodeAddressInput - The input type for the geocodeAddress function.
 * - GeocodeAddressOutput - The return type for the geocodeAddress function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GeocodeAddressInputSchema = z.object({
  address: z.string().describe('The full address to be geocoded.'),
});
export type GeocodeAddressInput = z.infer<typeof GeocodeAddressInputSchema>;

const GeocodeAddressOutputSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  formattedAddress: z.string(),
});
export type GeocodeAddressOutput = z.infer<typeof GeocodeAddressOutputSchema>;

// This is not an AI flow, but a server-side function defined within the Genkit structure.
export const geocodeAddress = ai.defineFlow(
  {
    name: 'geocodeAddressFlow',
    inputSchema: GeocodeAddressInputSchema,
    outputSchema: GeocodeAddressOutputSchema,
  },
  async ({ address }) => {
    const apiKey = process.env.GEOAPIFY_API_KEY;
    if (!apiKey) {
      throw new Error('GEOAPIFY_API_KEY environment variable not set.');
    }

    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(
      address
    )}&apiKey=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Geoapify API request failed with status ${response.status}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No results found for the given address.');
    }

    const { lon, lat } = data.features[0].properties;
    const formattedAddress = data.features[0].properties.formatted;

    return {
      latitude: lat,
      longitude: lon,
      formattedAddress,
    };
  }
);
