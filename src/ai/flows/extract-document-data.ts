'use server';
/**
 * @fileOverview Fluxo de IA especializado na extração de dados de identidade brasileira (RG/CNH).
 * Foco exclusivo em Nome, CPF, RG e Data de Nascimento para máxima precisão.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractDocumentDataInputSchema = z.object({
  photoDataUri: z.string().describe("A foto do documento como Data URI base64."),
});
export type ExtractDocumentDataInput = z.infer<typeof ExtractDocumentDataInputSchema>;

const ExtractDocumentDataOutputSchema = z.object({
  name: z.string().describe("Nome completo exatamente como consta no documento."),
  cpf: z.string().describe("Apenas os dígitos do CPF."),
  rg: z.string().describe("Apenas os dígitos do RG (incluindo o dígito verificador se houver)."),
  birthDate: z.string().describe("Data de nascimento no formato DD/MM/AAAA."),
});
export type ExtractDocumentDataOutput = z.infer<typeof ExtractDocumentDataOutputSchema>;

export async function extractDocumentData(input: ExtractDocumentDataInput): Promise<ExtractDocumentDataOutput> {
  return extractDocumentDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDocumentDataPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ExtractDocumentDataInputSchema },
  output: { schema: ExtractDocumentDataOutputSchema },
  prompt: `Você é um assistente de visão computacional especialista em documentos de identidade brasileiros (RG e CNH).
Analise a imagem fornecida e extraia APENAS as informações de identificação civil solicitadas.

DIRETRIZES TÉCNICAS:
1. FOCO TOTAL: Ignore marcas d'água, brasões da república, assinaturas e nomes de pais (filiação).
2. NOME: Extraia o nome completo. Se houver abreviações óbvias e você conseguir ler o nome completo em outro campo, prefira a versão completa.
3. CPF: Retorne apenas os 11 dígitos numéricos.
4. RG: Retorne o número do registro geral sem pontos ou traços.
5. DATA DE NASCIMENTO: Formate estritamente como DD/MM/AAAA.

IMPORTANTE: Não tente extrair endereços, observações ou categorias de habilitação. Se um campo não estiver legível, retorne uma string vazia.

Documento: {{media url=photoDataUri}}`,
});

const extractDocumentDataFlow = ai.defineFlow(
  {
    name: 'extractDocumentDataFlow',
    inputSchema: ExtractDocumentDataInputSchema,
    outputSchema: ExtractDocumentDataOutputSchema,
  },
  async input => {
    try {
        const { output } = await prompt(input);
        if (!output) throw new Error("A IA não conseguiu identificar os campos básicos do documento.");
        return output;
    } catch (error) {
        console.error("Erro no OCR especializado:", error);
        throw new Error("Falha na leitura automática. Por favor, preencha os dados manualmente.");
    }
  }
);
