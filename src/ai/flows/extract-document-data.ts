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

DIRETRIZES TÉCNICAS DE EXTRAÇÃO:
1. NOME COMPLETO: É o primeiro e maior bloco de texto no topo do documento. Ignore prefixos como "NOME". Pegue o nome completo do titular.
2. CPF: Procure explicitamente pelo rótulo "CPF". Extraia apenas os 11 dígitos numéricos.
3. RG / DOC. IDENTIDADE: No RG, procure por "REGISTRO GERAL". Na CNH, procure por "DOC. IDENTIDADE". Extraia apenas os números e letras do código, ignorando órgãos emissores (ex: SSP/SP).
4. DATA DE NASCIMENTO: Localize o rótulo "DATA DE NASCIMENTO" ou "NASCIMENTO". Formate estritamente como DD/MM/AAAA.

REGRAS DE FILTRAGEM (CRÍTICO):
- FILIAÇÃO: Ignore completamente os nomes de pai e mãe. Eles costumam estar abaixo do nome do titular ou no verso. Não os confunda com o nome principal.
- RUÍDOS: Ignore brasões, marcas d'água, assinaturas e textos miúdos de leis.
- SEGREGAÇÃO: Se detectar que é uma CNH, foque nos campos delimitados por linhas. Se for RG, foque no campo "REGISTRO GERAL".

Se um campo não estiver legível ou não existir (como CPF em RGs muito antigos), retorne uma string vazia.

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
