'use server';

/**
 * @fileOverview An AI assistant to optimize school van routes.
 *
 * - optimizeSchoolVanRoute - A function that optimizes a route using AI.
 * - OptimizeSchoolVanRouteInput - The input type for the optimizeSchoolVanRoute function.
 * - OptimizeSchoolVanRouteOutput - The return type for the optimizeSchoolVanRoute function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StudentStopSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
});

const OptimizeSchoolVanRouteInputSchema = z.object({
  students: z.array(StudentStopSchema).describe("List of students with their addresses to be included in the route."),
  schoolAddress: z.string().describe("The address of the school, which is the final destination."),
  context: z.string().optional().describe("Additional context for the AI to consider, like traffic conditions or road closures."),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizeSchoolVanRouteOutputSchema = z.object({
  optimizedStudentIds: z.array(z.string()).describe('An ordered list of student IDs representing the most efficient route.'),
  summary: z.string().describe('A summary of the optimization, explaining the benefits (e.g., time/distance saved).'),
  estimatedTimeMinutes: z.number().describe('The estimated total time for the optimized route in minutes.'),
  estimatedDistanceKm: z.number().describe('The estimated total distance for the optimized route in kilometers.'),
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

export async function optimizeSchoolVanRoute(input: OptimizeSchoolVanRouteInput): Promise<OptimizeSchoolVanRouteOutput> {
  return optimizeSchoolVanRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: OptimizeSchoolVanRouteInputSchema},
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `You are a logistics expert specializing in school transportation. Your task is to create the most efficient route possible.

You will be given a list of students with their home addresses and the school's address. Your goal is to determine the optimal sequence of student pickups to minimize travel time and distance, ending at the school.

Consider the following information:
- List of Students and Addresses: {{{json students}}}
- School Address (Final Destination): {{{schoolAddress}}}
{{#if context}}
- Additional Context from the manager: {{{context}}}
{{/if}}

Please provide the following output:
1.  **optimizedStudentIds**: An array of student IDs in the precise, optimized pickup order.
2.  **estimatedTimeMinutes**: A realistic estimate of the total route time in minutes.
3.  **estimatedDistanceKm**: A realistic estimate of the total route distance in kilometers.
4.  **summary**: A brief explanation of the route's benefits. For example: "This route is optimized to avoid morning congestion around the city center, saving an estimated 15 minutes compared to a non-optimized route."

Calculate the best possible sequence and provide the requested information in the specified JSON format.`,
});

const optimizeSchoolVanRouteFlow = ai.defineFlow(
  {
    name: 'optimizeSchoolVanRouteFlow',
    inputSchema: OptimizeSchoolVanRouteInputSchema,
    outputSchema: OptimizeSchoolVanRouteOutputSchema,
  },
  async input => {
    // For the simulation, add a delay to mimic processing time
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Hardcoded simulation for presentation
    const originalIds = input.students.map(s => s.id);
    const optimizedIds = [...originalIds].reverse(); // Simple reversal for demonstration

    const simulatedOutput: OptimizeSchoolVanRouteOutput = {
        optimizedStudentIds: optimizedIds,
        summary: "Rota reordenada para evitar o trânsito da manhã na região central, resultando em um percurso mais rápido.",
        estimatedTimeMinutes: 28,
        estimatedDistanceKm: 7.5
    };
    
    return simulatedOutput;
  }
);
