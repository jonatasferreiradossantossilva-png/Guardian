'use server';
/**
 * @fileOverview Fluxo de IA para extração de dados de documentos (OCR Inteligente).
 * 
 * - extractDocumentData - Analisa foto de RG/CNH e extrai dados cadastrais.
 * - ExtractDocumentDataInput - URI da imagem em base64.
 * - ExtractDocumentDataOutput - JSON estruturado com os dados do documento.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractDocumentDataInputSchema = z.object({
  photoDataUri: z.string().describe("A foto do documento como Data URI base64."),
});
export type ExtractDocumentDataInput = z.infer<typeof ExtractDocumentDataInputSchema>;

const ExtractDocumentDataOutputSchema = z.object({
  name: z.string().describe("Nome completo encontrado no documento."),
  cpf: z.string().describe("Número do CPF."),
  rg: z.string().describe("Número do RG."),
  birthDate: z.string().describe("Data de nascimento (formato DD/MM/AAAA)."),
  address: z.string().optional().describe("Endereço completo (se disponível na CNH)."),
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
  prompt: `Você é um assistente especializado em extração de dados de documentos de identificação brasileiros (RG e CNH).
Analise a imagem fornecida e extraia as informações solicitadas com o máximo de precisão. 
Se algum campo não for legível ou não existir no documento, deixe a string vazia.

IMPORTANTE: Se for uma CNH, tente extrair o endereço que costuma constar no verso ou observações.

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
        if (!output) throw new Error("A IA não conseguiu ler o documento.");
        return output;
    } catch (error) {
        console.error("Erro no OCR de documento:", error);
        throw new Error("Falha ao processar imagem do documento.");
    }
  }
);
