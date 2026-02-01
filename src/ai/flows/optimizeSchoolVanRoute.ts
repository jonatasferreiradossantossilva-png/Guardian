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
  startAddress: z.string().optional().describe("O endereço de partida da rota (ex: casa do motorista). Se não for fornecido, a rota começa no primeiro aluno."),
  students: z.array(StudentStopSchema).describe("Lista de alunos com seus endereços para serem incluídos na rota."),
  schoolAddress: z.string().describe("O endereço da escola, que é o destino final."),
  vehicleCapacity: z.number().optional().describe("A capacidade máxima de passageiros do veículo."),
  context: z.string().optional().describe("Contexto adicional para a IA considerar, como condições de trânsito, interdições de vias ou incidentes reportados."),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizeSchoolVanRouteOutputSchema = z.object({
  optimizedStudentIds: z.array(z.string()).describe('Uma lista ordenada de IDs de alunos representando a rota mais eficiente.'),
  summary: z.string().describe('Um resumo da otimização, explicando os benefícios (ex: tempo/distância economizados) e como o contexto (ex: incidentes) influenciou a decisão.'),
  estimatedTimeMinutes: z.number().describe('O tempo total estimado para a rota otimizada em minutos.'),
  estimatedDistanceKm: z.number().describe('A distância total estimada para a rota otimizada em quilômetros.'),
  turnByTurnDirections: z.array(z.string()).describe('Uma lista de instruções de direção passo a passo para a rota, como "Vire à direita na Rua X".')
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

export async function optimizeSchoolVanRoute(input: OptimizeSchoolVanRouteInput): Promise<OptimizeSchoolVanRouteOutput> {
  return optimizeSchoolVanRouteFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: OptimizeSchoolVanRouteInputSchema},
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `Você é um especialista em logística e um assistente de navegação GPS para transporte escolar. Sua tarefa é criar a rota mais eficiente possível e fornecer as direções detalhadas.

Você receberá uma lista de alunos com seus endereços residenciais e o endereço da escola. Seu objetivo é determinar a sequência ótima de embarque dos alunos para minimizar o tempo de viagem e a distância.

Considere as seguintes informações:
{{#if startAddress}}
- **Endereço de Partida (Obrigatório):** {{{startAddress}}} (Comece a rota a partir deste ponto)
{{/if}}
- Lista de Alunos e Endereços (Paradas): {{{json students}}}
- Endereço da Escola (Destino Final): {{{schoolAddress}}}
{{#if vehicleCapacity}}
- Capacidade do Veículo: {{{vehicleCapacity}}} passageiros. **A rota otimizada não deve, sob nenhuma hipótese, incluir mais alunos do que a capacidade do veículo.**
{{/if}}
{{#if context}}
- Contexto Adicional (condições de trânsito, interdições, incidentes reportados, etc.): {{{context}}}
**Leve os incidentes e condições de trânsito em consideração ao calcular a rota mais eficiente, evitando as áreas afetadas se possível.**
{{/if}}

Por favor, forneça a seguinte saída em formato JSON:
1.  **optimizedStudentIds**: Uma lista ordenada de IDs de alunos representando a rota mais eficiente, começando pelo primeiro aluno a ser pego.
2.  **estimatedTimeMinutes**: Uma estimativa realista do tempo total da rota em minutos.
3.  **estimatedDistanceKm**: Uma estimativa realista da distância total da rota em quilômetros.
4.  **summary**: Uma breve explicação dos benefícios da rota, mencionando como o contexto (ex: incidentes) influenciou a decisão. Exemplo: "Esta rota foi otimizada para desviar do congestionamento na Av. Principal, economizando cerca de 15 minutos."
5.  **turnByTurnDirections**: Uma lista de instruções de direção passo a passo (curtas e diretas), como um GPS, partindo do endereço de partida (se fornecido) ou do endereço do primeiro aluno da lista otimizada e seguindo por todas as paradas até chegar na escola. Por exemplo: ["Siga para a Rua Principal", "Vire à direita na Av. Central", "Na rotatória, pegue a segunda saída para a Rua das Flores", ...].

Calcule a melhor sequência possível e forneça TODAS as informações solicitadas no formato JSON especificado.`,
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
