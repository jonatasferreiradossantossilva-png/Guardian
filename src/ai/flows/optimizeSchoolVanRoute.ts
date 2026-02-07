
'use server';

/**
 * @fileOverview An AI assistant to optimize school van routes, capable of handling multiple school destinations.
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
  startAddress: z.string().optional().describe("O endereço de partida ou as coordenadas (lat,lng) da rota. Se não for fornecido, a rota começa na primeira parada."),
  students: z.array(StudentStopSchema).describe("Lista de alunos (paradas de embarque) com seus endereços para serem incluídos na rota."),
  schoolAddresses: z.array(z.string()).describe("Lista de endereços das escolas (paradas de desembarque). A IA deve decidir a ordem ótima para visitá-las."),
  vehicleCapacity: z.number().optional().describe("A capacidade máxima de passageiros do veículo."),
  context: z.string().optional().describe("Contexto adicional para a IA considerar, como condições de trânsito, interdições de vias ou incidentes reportados."),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizedStopSchema = z.object({
    id: z.string().describe("O ID único do item da parada. Deve ter o formato 'student-STUDENT_ID' para alunos ou 'school-SCHOOL_ID' para escolas."),
    type: z.enum(['student', 'school']).describe("O tipo de parada (aluno ou escola).")
});

const OptimizeSchoolVanRouteOutputSchema = z.object({
  optimizedStops: z.array(OptimizedStopSchema).describe('Uma lista ordenada de todas as paradas (alunos e escolas) representando a rota mais eficiente.'),
  summary: z.string().describe('Um resumo da otimização, explicando os benefícios (ex: tempo/distância economizados) e como o contexto (ex: incidentes) influenciou a decisão.'),
  estimatedTimeMinutes: z.number().describe('O tempo total estimado para a rota otimizada em minutos.'),
  estimatedDistanceKm: z.number().describe('A distância total estimada para a rota otimizada em quilômetros.'),
  turnByTurnDirections: z.array(z.string()).describe('Uma lista de instruções de direção passo a passo para a rota, como "Vire à direita na Rua X".')
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

export async function optimizeSchoolVanRoute(input: OptimizeSchoolVanRouteInput): Promise<OptimizeSchoolVanRouteOutput> {
  // We need to map school addresses to IDs for the AI to use in the output.
  const schoolsWithIds = input.schoolAddresses.map((address, index) => ({
      id: `school-${index + 1}`, // A temporary but consistent ID for the AI
      address: address,
  }));
  
  const modifiedInput = {
      ...input,
      schools: schoolsWithIds
  };

  return optimizeSchoolVanRouteFlow(modifiedInput);
}

const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: z.any()}, // Using any because we modify it before calling
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `Você é um especialista em logística e um assistente de navegação GPS para transporte escolar. Sua tarefa é criar a rota mais eficiente possível, incluindo múltiplos destinos (escolas), e fornecer as direções detalhadas.

Você receberá uma lista de alunos (paradas de embarque) e uma lista de escolas (paradas de desembarque). Seu objetivo é determinar a sequência ótima de todas as paradas para minimizar o tempo de viagem e a distância.

IMPORTANTE: As escolas podem ser visitadas em qualquer ordem que maximize a eficiência. A rota não precisa pegar todos os alunos antes de ir para a primeira escola. Você pode, por exemplo, pegar alunos para a Escola A, ir até a Escola A, e depois pegar alunos para a Escola B e ir para a Escola B.

Considere as seguintes informações:
{{#if startAddress}}
- **Ponto de Partida (Obrigatório se fornecido):** {{{startAddress}}} (Comece a rota a partir deste ponto, que pode ser um endereço ou coordenadas lat,lng)
{{/if}}
- **Lista de Alunos (Paradas de Embarque):** {{{json students}}} (Note que o ID de cada aluno é o que deve ser usado na saída, com o prefixo 'student-')
- **Lista de Escolas (Paradas de Desembarque):** {{{json schools}}} (Note que o ID de cada escola é o que deve ser usado na saída, com o prefixo 'school-')
{{#if vehicleCapacity}}
- **Capacidade do Veículo:** {{{vehicleCapacity}}} passageiros. A rota otimizada não deve, sob nenhuma hipótese, incluir mais alunos do que a capacidade do veículo.
{{/if}}
{{#if context}}
- **Contexto Adicional (condições de trânsito, interdições, etc.):** {{{context}}} (Leve isso em consideração ao calcular a rota mais eficiente).
{{/if}}

Por favor, forneça a seguinte saída em formato JSON:
1.  **optimizedStops**: Uma lista ordenada de TODAS as paradas (alunos e escolas), representando a rota mais eficiente. O ID de cada parada na saída DEVE ser prefixado com 'student-' ou 'school-'.
2.  **estimatedTimeMinutes**: Uma estimativa realista do tempo total da rota em minutos.
3.  **estimatedDistanceKm**: Uma estimativa realista da distância total da rota em quilômetros.
4.  **summary**: Uma breve explicação da lógica da rota, especialmente se múltiplas escolas estiverem envolvidas. Exemplo: "A rota foi otimizada para primeiro atender a Escola A, que estava mais próxima do ponto de partida, e depois seguir para a Escola B."
5.  **turnByTurnDirections**: Uma lista de instruções de direção passo a passo, como um GPS, partindo do início e seguindo por TODAS as paradas na ordem otimizada.

Calcule a melhor sequência possível e forneça TODAS as informações solicitadas no formato JSON especificado.`,
});

const optimizeSchoolVanRouteFlow = ai.defineFlow(
  {
    name: 'optimizeSchoolVanRouteFlow',
    inputSchema: z.any(),
    outputSchema: OptimizeSchoolVanRouteOutputSchema,
  },
  async input => {
    // This now makes a real call to the AI model using the defined prompt.
    const {output} = await prompt(input);

    // AI might return school-1, school-2. We need to map these back to the original school IDs from the database
    // which are passed in the `schoolAddresses` input, but the AI doesn't see them.
    // The form component will handle mapping based on the order for now.
    // This is a simplification. A more robust solution would pass a map of {tempId: realId}.
    // For this prototype, the client-side will reconstruct based on order.

    return output!;
  }
);
