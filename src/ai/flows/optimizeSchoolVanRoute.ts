
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

const OptimizeSchoolVanRouteInputSchemaBase = z.object({
  startAddress: z.string().optional().describe("O endereço de partida ou as coordenadas (lat,lng) da rota. Se não for fornecido, a rota começa na primeira parada."),
  students: z.array(StudentStopSchema).describe("Lista de alunos (paradas de embarque/desembarque) com seus endereços e IDs de escola para serem incluídos na rota."),
  schools: z.array(SchoolInputSchema).describe("Lista de escolas (paradas de embarque/desembarque) com seus endereços, nomes e IDs reais."),
  vehicleCapacity: z.number().optional().describe("A capacidade máxima de passageiros do veículo."),
  context: z.string().optional().describe("Contexto adicional para a IA considerar, como condições de trânsito, interdições de vias ou incidentes reportados."),
  direction: z.enum(['ida', 'volta']).optional().default('ida').describe("A direção da viagem: 'ida' (para a escola) ou 'volta' (de volta para casa)."),
});

const OptimizeSchoolVanRouteInputSchema = OptimizeSchoolVanRouteInputSchemaBase.extend({
  optimizationMode: z.enum(['safe', 'flexible']).optional().default('safe').describe("'safe' para a regra do gestor (coletar todos primeiro), 'flexible' para a otimização em tempo real do motorista."),
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
  turnByTurnDirections: z.array(z.string()).describe('Uma lista de instruções de direção passo a passo para a rota, como um GPS, partindo do início e seguindo por TODAS as paradas na ordem otimizada.')
});
export type OptimizeSchoolVanRouteOutput = z.infer<typeof OptimizeSchoolVanRouteOutputSchema>;

// The prompt needs a schema with the boolean flags, not enums
const PromptInputSchema = OptimizeSchoolVanRouteInputSchemaBase.extend({
  isFlexibleMode: z.boolean(),
  isIda: z.boolean(),
});

const prompt = ai.definePrompt({
  name: 'optimizeSchoolVanRoutePrompt',
  input: {schema: PromptInputSchema},
  output: {schema: OptimizeSchoolVanRouteOutputSchema},
  prompt: `Você é um especialista em logística e um assistente de navegação GPS para transporte escolar. Sua tarefa é criar a rota mais eficiente possível, incluindo múltiplos destinos (escolas), e fornecer as direções detalhadas.

Você receberá uma lista de alunos e uma lista de escolas. Cada aluno possui um 'schoolId' que corresponde ao 'id' da sua escola de destino.

{{#if isFlexibleMode}}
  **REGRAS DA OTIMIZAÇÃO EM TEMPO REAL (PLANO DO MOTORISTA):**
  1.  **Flexibilidade:** A rota pode ser otimizada para ser a mais rápida possível, embarcando e desembarcando em fases.

  {{#if isIda}}
    **DIREÇÃO: IDA (Para a escola)**
    2.  **REGRA CRÍTICA DE DESEMBARQUE:** Uma parada de desembarque em uma escola (ex: Escola A) só é permitida se **TODOS** os alunos destinados à Escola A que estão na lista de entrada já tiverem sido embarcados. Você não pode fazer duas paradas de desembarque na mesma escola.
  {{else}}
    **DIREÇÃO: VOLTA (Para casa)**
    2.  **REGRA CRÍTICA DE EMBARQUE:** Ao visitar uma escola para embarcar alunos (ex: Escola A), você deve embarcar **TODOS** os alunos daquela escola que fazem parte da rota de uma só vez. A IA está proibida de planejar uma rota que volte para a mesma escola para pegar mais alunos.
  {{/if}}
{{else}}
  **REGRA DE OURO DA OPERAÇÃO (PLANO DO GESTOR):** A rota deve ser estruturada em duas fases:
  1.  **Fase 1: Embarque.** A rota deve primeiro embarcar TODOS os alunos. A sequência de embarque dos alunos deve ser otimizada para o menor tempo/distância.
  2.  **Fase 2: Desembarque.** Somente após o último aluno ter sido embarcado, a rota deve prosseguir para o desembarque nas escolas. A ordem de visita às escolas também deve ser otimizada.
{{/if}}

**REGRA ADICIONAL IMPORTANTE:** Na IDA, um aluno só pode ser desembarcado na sua escola correspondente. Na VOLTA, um aluno só pode ser desembarcado no seu endereço (que está associado ao ID do aluno). A parada de uma escola na rota representa o momento de embarque (na volta) ou desembarque (na ida) de TODOS os alunos que pertencem àquela escola e que já estão no veículo.

Considere as seguintes informações:
{{#if startAddress}}
- **Ponto de Partida (Obrigatório se fornecido):** {{{startAddress}}} (Comece a rota a partir deste ponto, que pode ser um endereço ou coordenadas lat,lng)
{{/if}}
- **Lista de Alunos (Paradas):** {{{json students}}} (Use o 'id' de cada aluno EXATAMENTE como está aqui. Note o campo 'schoolId' em cada aluno.)
- **Lista de Escolas (Paradas):** {{{json schools}}} (Use o 'id' de cada escola EXATAMENTE como está aqui.)
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
5.  **turnByTurnDirections**: Uma lista de instruções de direção passo a passo para a rota, como um GPS, partindo do início e seguindo por TODAS as paradas na ordem otimizada.

Calcule a melhor sequência possível e forneça TODAS as informações solicitadas no formato JSON especificado.`,
});

export const optimizeSchoolVanRoute = ai.defineFlow(
  {
    name: 'optimizeSchoolVanRouteFlow',
    inputSchema: OptimizeSchoolVanRouteInputSchema,
    outputSchema: OptimizeSchoolVanRouteOutputSchema,
  },
  async (input) => {
    const isFlexibleMode = input.optimizationMode === 'flexible';
    const isIda = input.direction === 'ida';
    const { optimizationMode, ...baseInput } = input;
    
    const promptInput = { 
        ...baseInput,
        isFlexibleMode,
        isIda 
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
