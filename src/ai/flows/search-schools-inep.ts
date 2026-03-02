'use server';
/**
 * @fileOverview Fluxo de IA para busca semântica (Fuzzy Match) de escolas na base de conhecimento.
 * Resolve nomes próximos (ex: "Colégio Marjore" -> "MARJORE PAULA").
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SearchSchoolsInputSchema = z.object({
  query: z.string().describe('O nome da escola digitado pelo usuário.'),
  city: z.string().describe('A cidade para filtrar.'),
  state: z.string().describe('O estado (UF) para filtrar.'),
  knowledgeBase: z.array(z.any()).describe('A lista de escolas disponíveis na nossa base para esta região.'),
});
export type SearchSchoolsInput = z.infer<typeof SearchSchoolsInputSchema>;

const SearchResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  score: z.number().describe('Nível de confiança da similaridade (0-1).'),
});

const SearchSchoolsOutputSchema = z.object({
  matches: z.array(SearchResultSchema).describe('Lista de escolas que correspondem semanticamente à busca.'),
});
export type SearchSchoolsOutput = z.infer<typeof SearchSchoolsOutputSchema>;

export async function searchSchoolsInep(input: SearchSchoolsInput): Promise<SearchSchoolsOutput> {
  return searchSchoolsInepFlow(input);
}

const prompt = ai.definePrompt({
  name: 'searchSchoolsInepPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: SearchSchoolsInputSchema },
  output: { schema: SearchSchoolsOutputSchema },
  prompt: `Você é um especialista em dados educacionais brasileiros. 
Sua tarefa é encontrar correspondências entre a busca do usuário e a nossa base de conhecimento de escolas.

REGRAS:
1. Ignore prefixos como "Colégio", "Escola", "E.E.", "E.M." se eles estiverem atrapalhando o núcleo do nome.
2. Identifique nomes grafados de forma diferente mas que se referem à mesma instituição (ex: "Bandeirantes" e "Col. Bandeirantes").
3. Retorne apenas escolas que pertençam à cidade de {{{city}}} - {{{state}}}.
4. Atribua um score de 0 a 1 para a similaridade.

Busca do Usuário: "{{{query}}}"
Cidade/UF: {{{city}}} - {{{state}}}

Base de Conhecimento (JSON):
{{{json knowledgeBase}}}

Retorne um JSON com o campo 'matches' contendo os IDs e nomes das escolas encontradas e seus respectivos scores de confiança.`,
});

const searchSchoolsInepFlow = ai.defineFlow(
  {
    name: 'searchSchoolsInepFlow',
    inputSchema: SearchSchoolsInputSchema,
    outputSchema: SearchSchoolsOutputSchema,
  },
  async input => {
    if (!input.query || input.query.length < 3 || input.knowledgeBase.length === 0) {
        return { matches: [] };
    }
    try {
        const { output } = await prompt(input);
        return output || { matches: [] };
    } catch (error) {
        console.error("Erro na busca semântica de escolas:", error);
        return { matches: [] };
    }
  }
);
