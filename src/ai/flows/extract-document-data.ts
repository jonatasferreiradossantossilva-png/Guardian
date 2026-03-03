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
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ExtractDocumentDataInputSchema },
  output: { schema: ExtractDocumentDataOutputSchema },
  config: {
    // IMPORTANTE: Ajuste de segurança para permitir que a IA processe documentos de identificação
    // sem disparar o bloqueio de "Sensitive Content" (PII).
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
    temperature: 0.1, // Baixa temperatura para máxima precisão técnica
  },
  prompt: `Você é um robô de OCR industrial especializado em documentos civis brasileiros.
Sua única tarefa é extrair os dados solicitados ignorando qualquer ruído visual.

INSTRUÇÕES TÉCNICAS:
1. IDENTIFIQUE O DOCUMENTO: CNH (tem "Habilitação") ou RG (tem "Registro Geral").
2. NOME: Localize o campo "NOME" (topo). Extraia o texto em destaque. IGNORE campos como "FILIAÇÃO", "PAI" ou "MÃE".
3. CPF: Localize o rótulo "CPF". Extraia apenas os 11 dígitos numéricos.
4. RG: Localize "DOC. IDENTIDADE" ou "REGISTRO GERAL". Extraia o número completo.
5. DATA NASCIMENTO: Localize "NASCIMENTO" ou "DATA DE NASC.". Formato esperado: DD/MM/AAAA.

Se um campo estiver ilegível, retorne uma string vazia. Não invente dados.
O processamento é feito em ambiente seguro e privado.

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
            throw new Error("A IA não conseguiu processar a imagem ou o conteúdo foi bloqueado pelos filtros de segurança.");
        }
        
        // Limpeza final de caracteres não numéricos
        return {
            ...output,
            cpf: output.cpf.replace(/\D/g, ''),
            rg: output.rg.replace(/[^a-zA-Z0-9]/g, ''),
        };
    } catch (error: any) {
        console.error("Erro técnico no OCR do Guardian:", error);
        // Se o erro for de segurança, o log acima mostrará.
        throw new Error("Não foi possível ler o documento automaticamente. Verifique a iluminação ou preencha manualmente.");
    }
  }
);
