'use server';

/**
 * @fileOverview An AI assistant to optimize routes for drivers based on traffic and incidents.
 *
 * - optimizeRoute - A function that optimizes a route using AI.
 * - OptimizeRouteInput - The input type for the optimizeRoute function.
 * - OptimizeRouteOutput - The return type for the optimizeRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimizeRouteInputSchema = z.object({
  currentRoute: z
    .string()
    .describe('The current route as a series of waypoints.'),
  trafficConditions: z
    .string()
    .describe('A description of the current traffic conditions.'),
  reportedIncidents: z
    .string()
    .describe('A list of any reported incidents along the route.'),
});
export type OptimizeRouteInput = z.infer<typeof OptimizeRouteInputSchema>;

const OptimizeRouteOutputSchema = z.object({
  optimizedRoute: z
    .string()
    .describe('The optimized route as a series of waypoints.'),
  summary: z
    .string()
    .describe('A summary of the changes made to the route and why.'),
});
export type OptimizeRouteOutput = z.infer<typeof OptimizeRouteOutputSchema>;

export async function optimizeRoute(input: OptimizeRouteInput): Promise<OptimizeRouteOutput> {
  return optimizeRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeRoutePrompt',
  input: {schema: OptimizeRouteInputSchema},
  output: {schema: OptimizeRouteOutputSchema},
  prompt: `You are a route optimization expert, skilled at finding the best routes for drivers based on traffic conditions and reported incidents.

  Given the current route, traffic conditions, and reported incidents, provide an optimized route and a summary of the changes you made.

Current Route: {{{currentRoute}}}
Traffic Conditions: {{{trafficConditions}}}
Reported Incidents: {{{reportedIncidents}}}

Optimize the route and provide a summary of the changes.`,
});

const optimizeRouteFlow = ai.defineFlow(
  {
    name: 'optimizeRouteFlow',
    inputSchema: OptimizeRouteInputSchema,
    outputSchema: OptimizeRouteOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
