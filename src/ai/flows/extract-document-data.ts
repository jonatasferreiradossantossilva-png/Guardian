'use server';
/**
 * @fileOverview Fluxo de IA especializado na extração de dados de identidade brasileira (RG/CNH).
 * Utiliza mapeamento de âncoras visuais e configurações de segurança relaxadas para permitir OCR de PII.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExtractDocumentDataInputSchema = z.object({
  photoDataUri: z.string().describe("A foto do documento como Data URI base64."),
});
export type ExtractDocumentDataInput = z.infer<typeof ExtractDocumentDataInputSchema>;

const ExtractDocumentDataOutputSchema = z.object({
  name: z.string().describe("Nome completo do portador."),
  cpf: z.string().describe("Apenas os 11 números do CPF."),
  rg: z.string().describe("O número do RG/Registro Geral completo."),
  birthDate: z.string().describe("Data de nascimento (DD/MM/AAAA)."),
});
export type ExtractDocumentDataOutput = z.infer<typeof ExtractDocumentDataOutputSchema>;

export async function extractDocumentData(input: ExtractDocumentDataInput): Promise<ExtractDocumentDataOutput> {
  return extractDocumentDataFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractDocumentDataPrompt',
  model: 'googleai/gemini-2.0-flash',
  input: { schema: ExtractDocumentDataInputSchema },
  output: { schema: ExtractDocumentDataOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
    temperature: 0.1,
  },
  prompt: `Você é um robô de OCR industrial especializado em documentos civis brasileiros (RG e CNH).
Sua tarefa é extrair os dados do TITULAR do documento.

INSTRUÇÕES TÉCNICAS PARA FOTOS DE CELULAR:
1. IDENTIFICAÇÃO: Se houver "Habilitação", é CNH. Se houver "Registro Geral", é RG.
2. NOME DO TITULAR: É o texto de maior destaque no topo. IGNORE nomes de PAI ou MÃE (filiação).
3. CPF: Localize o campo 'CPF'. Extraia apenas os 11 números. Se houver pontos ou traços, remova-os.
4. RG: Localize 'DOC. IDENTIDADE' ou 'REGISTRO GERAL'. Extraia o número completo.
5. DATA NASCIMENTO: Procure pelo campo 'NASCIMENTO'. Formato DD/MM/AAAA.

Se um campo estiver ilegível, retorne uma string vazia.
NÃO INVENTE DADOS.

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
        if (!output) {
            throw new Error("A IA não conseguiu processar a imagem.");
        }
        
        return {
            ...output,
            cpf: output.cpf.replace(/\D/g, ''),
            rg: output.rg.replace(/[^a-zA-Z0-9]/g, ''),
        };
    } catch (error: any) {
        console.error("Erro técnico no OCR do Guardian:", error);
        throw new Error("Falha na leitura automática.");
    }
  }
);
