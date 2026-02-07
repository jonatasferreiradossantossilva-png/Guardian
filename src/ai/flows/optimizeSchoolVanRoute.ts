
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
  schoolId: z.string().describe("O ID da escola que este aluno frequenta. Essencial para garantir o desembarque no local correto."),
});

const SchoolInputSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
});

const OptimizeSchoolVanRouteInputSchema = z.object({
  startAddress: z.string().optional().describe("O endereço de partida ou as coordenadas (lat,lng) da rota. Se não for fornecido, a rota começa na primeira parada."),
  students: z.array(StudentStopSchema).describe("Lista de alunos (paradas de embarque) com seus endereços e IDs de escola para serem incluídos na rota."),
  schools: z.array(SchoolInputSchema).describe("Lista de escolas (paradas de desembarque) com seus endereços, nomes e IDs reais."),
  vehicleCapacity: z.number().optional().describe("A capacidade máxima de passageiros do veículo."),
  context: z.string().optional().describe("Contexto adicional para a IA considerar, como condições de trânsito, interdições de vias ou incidentes reportados."),
});
export type OptimizeSchoolVanRouteInput = z.infer<typeof OptimizeSchoolVanRouteInputSchema>;

const OptimizedStopSchema = z.object({
    id: z.string().describe("O ID único do item da parada. Deve ser o ID EXATO fornecido na entrada (ex: 'student-1' ou 'school-1')."),
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


const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: OptimizeSchoolVanRouteInputSchema},
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `Você é um especialista em logística e um assistente de navegação GPS para transporte escolar. Sua tarefa é criar a rota mais eficiente possível, incluindo múltiplos destinos (escolas), e fornecer as direções detalhadas.

Você receberá uma lista de alunos e uma lista de escolas. Cada aluno possui um 'schoolId' que corresponde ao 'id' da sua escola de destino.

**REGRA MAIS IMPORTANTE:** Um aluno SÓ PODE ser desembarcado na sua escola correspondente. A parada de uma escola na rota representa o momento de desembarque de TODOS os alunos que pertencem àquela escola e que já estão no veículo. É um erro grave sugerir que um aluno seja deixado em uma escola diferente da sua.

Seu objetivo é determinar a sequência ótima de todas as paradas (embarques de alunos e desembarques nas escolas) para minimizar o tempo de viagem e a distância, respeitando a regra acima.

As escolas podem ser visitadas em qualquer ordem que maximize a eficiência. A rota não precisa pegar todos os alunos antes de ir para a primeira escola. Você pode, por exemplo, pegar alunos para a Escola A, desembarcá-los na Escola A, e depois pegar alunos para a Escola B e desembarcá-los na Escola B.

Considere as seguintes informações:
{{#if startAddress}}
- **Ponto de Partida (Obrigatório se fornecido):** {{{startAddress}}} (Comece a rota a partir deste ponto, que pode ser um endereço ou coordenadas lat,lng)
{{/if}}
- **Lista de Alunos (Paradas de Embarque):** {{{json students}}} (Use o 'id' de cada aluno EXATAMENTE como está aqui. Note o campo 'schoolId' em cada aluno.)
- **Lista de Escolas (Paradas de Desembarque):** {{{json schools}}} (Use o 'id' de cada escola EXATAMENTE como está aqui.)
{{#if vehicleCapacity}}
- **Capacidade do Veículo:** {{{vehicleCapacity}}} passageiros. A rota otimizada não deve, sob nenhuma hipótese, incluir mais alunos do que a capacidade do veículo.
{{/if}}
{{#if context}}
- **Contexto Adicional (condições de trânsito, interdições, etc.):** {{{context}}} (Leve isso em consideração ao calcular a rota mais eficiente).
{{/if}}

Por favor, forneça a seguinte saída em formato JSON:
1.  **optimizedStops**: Uma lista ordenada de TODAS as paradas (alunos e escolas), representando a rota mais eficiente. Para cada parada, use o campo 'id' EXATO que foi fornecido nos dados de entrada.
2.  **estimatedTimeMinutes**: Uma estimativa realista do tempo total da rota em minutos.
3.  **estimatedDistanceKm**: Uma estimativa realista da distância total da rota em quilômetros.
4.  **summary**: Uma breve explicação da lógica da rota. Se a rota atender a mais de uma escola, explique a lógica da ordem das escolas. Exemplo: "A rota foi otimizada para primeiro atender a Escola A, que estava mais próxima do ponto de partida, e depois seguir para a Escola B."
5.  **turnByTurnDirections**: Uma lista de instruções de direção passo a passo, como um GPS, partindo do início e seguindo por TODAS as paradas na ordem otimizada.

Calcule a melhor sequência possível e forneça TODAS as informações solicitadas no formato JSON especificado.`,
});

export const optimizeSchoolVanRoute = ai.defineFlow(
  {
    name: 'optimizeSchoolVanRouteFlow',
    inputSchema: OptimizeSchoolVanRouteInputSchema,
    outputSchema: OptimizeSchoolVanRouteOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
