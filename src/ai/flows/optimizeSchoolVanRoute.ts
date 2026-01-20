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
  students: z.array(StudentStopSchema).describe("Lista de alunos com seus endereços para serem incluídos na rota."),
  schoolAddress: z.string().describe("O endereço da escola, que é o destino final."),
  context: z.string().optional().describe("Contexto adicional para a IA considerar, como condições de trânsito ou interdições de vias."),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizeSchoolVanRouteOutputSchema = z.object({
  optimizedStudentIds: z.array(z.string()).describe('Uma lista ordenada de IDs de alunos representando a rota mais eficiente.'),
  summary: z.string().describe('Um resumo da otimização, explicando os benefícios (ex: tempo/distância economizados).'),
  estimatedTimeMinutes: z.number().describe('O tempo total estimado para a rota otimizada em minutos.'),
  estimatedDistanceKm: z.number().describe('A distância total estimada para a rota otimizada em quilômetros.'),
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

export async function optimizeSchoolVanRoute(input: OptimizeSchoolVanRouteInput): Promise<OptimizeSchoolVanRouteOutput> {
  return optimizeSchoolVanRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: OptimizeSchoolVanRouteInputSchema},
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `Você é um especialista em logística especializado em transporte escolar. Sua tarefa é criar a rota mais eficiente possível.

Você receberá uma lista de alunos com seus endereços residenciais e o endereço da escola. Seu objetivo é determinar a sequência ótima de embarque dos alunos para minimizar o tempo de viagem e a distância, terminando na escola.

Considere as seguintes informações:
- Lista de Alunos e Endereços: {{{json students}}}
- Endereço da Escola (Destino Final): {{{schoolAddress}}}
{{#if context}}
- Contexto Adicional do gestor: {{{context}}}
{{/if}}

Por favor, forneça a seguinte saída:
1.  **optimizedStudentIds**: Uma lista ordenada de IDs de alunos representando a rota mais eficiente.
2.  **estimatedTimeMinutes**: Uma estimativa realista do tempo total da rota em minutos.
3.  **estimatedDistanceKm**: Uma estimativa realista da distância total da rota em quilômetros.
4.  **summary**: Uma breve explicação dos benefícios da rota. Por exemplo: "Esta rota foi otimizada para evitar o congestionamento matinal no centro da cidade, economizando cerca de 15 minutos em comparação com uma rota não otimizada."

Calcule a melhor sequência possível e forneça as informações solicitadas no formato JSON especificado.`,
});

const optimizeSchoolVanRouteFlow = ai.defineFlow(
  {
    name: 'optimizeSchoolVanRouteFlow',
    inputSchema: OptimizeSchoolVanRouteInputSchema,
    outputSchema: OptimizeSchoolVanRouteOutputSchema,
  },
  async input => {
    // This now makes a real call to the AI model using the defined prompt.
    const {output} = await prompt(input);
    return output!;
  }
);
