'use server';
/**
 * @fileOverview Fluxo de IA especializado na extração de dados de identidade brasileira (RG/CNH).
 * Utiliza mapeamento de âncoras visuais para máxima precisão em layouts densos.
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
  prompt: `Você é um Especialista em Visão Computacional para Documentos Oficiais Brasileiros.
Sua tarefa é mapear e extrair dados de Identidade (RG ou CNH) com 100% de precisão.

### DIRETRIZES DE MAPEAMENTO (LAYOUT BRASIL):

1. **IDENTIFICAÇÃO DO TIPO**:
   - Se houver o texto "CARTEIRA NACIONAL DE HABILITAÇÃO", aplique o mapa de CNH.
   - Se houver "REGISTRO GERAL", aplique o mapa de RG.

2. **NOME COMPLETO (ÂNCORA: TOPO)**:
   - Na CNH: É o primeiro grande bloco de texto logo abaixo do cabeçalho "NOME".
   - No RG: É o texto de maior destaque no verso, geralmente acima da "FILIAÇÃO".
   - CRÍTICO: Ignore nomes de pai ou mãe (geralmente precedidos por "FILIAÇÃO", "PAI" ou "MÃE"). Pegue apenas o nome do titular.

3. **CPF (ÂNCORA: "CPF")**:
   - Localize o rótulo "CPF". Extraia apenas os 11 dígitos numéricos que o seguem.
   - Remova pontos e traços.

4. **DOC. IDENTIDADE / RG (ÂNCORA: "DOC. IDENTIDADE" ou "REGISTRO GERAL")**:
   - Na CNH: Procure pelo campo rotulado como "DOC. IDENTIDADE".
   - No RG: Procure pelo número associado ao rótulo "REGISTRO GERAL".
   - Extraia o código alfanumérico completo.

5. **DATA DE NASCIMENTO (ÂNCORA: "NASCIMENTO")**:
   - Localize o rótulo "DATA DE NASCIMENTO" ou "NASC.".
   - Retorne estritamente no formato DD/MM/AAAA.

### REGRAS DE SEGURANÇA E LIMPEZA:
- Se um campo estiver ilegível, retorne uma string vazia.
- Ignore assinaturas que cruzam sobre o texto.
- Não confunda a "Validade" ou "Data de Emissão" com a "Data de Nascimento".

Documento para Análise: {{media url=photoDataUri}}`,
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
        if (!output) throw new Error("A IA não conseguiu mapear os campos do documento.");
        
        // Limpeza final para garantir apenas números nos documentos
        return {
            ...output,
            cpf: output.cpf.replace(/\D/g, ''),
            rg: output.rg.replace(/\s/g, ''),
        };
    } catch (error) {
        console.error("Erro no OCR Especializado:", error);
        throw new Error("Falha na leitura técnica do documento. Por favor, preencha os dados manualmente.");
    }
  }
);
