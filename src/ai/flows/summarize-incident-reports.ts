'use server';

/**
 * @fileOverview Summarizes incident reports for quick review by dispatchers.
 *
 * - summarizeIncidentReport - A function that summarizes incident reports.
 * - SummarizeIncidentReportInput - The input type for the summarizeIncidentReport function.
 * - SummarizeIncidentReportOutput - The return type for the summarizeIncidentReport function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

const SummarizeIncidentReportInputSchema = z.object({
  report: z.string().describe('The full text of the incident report.'),
});

export type SummarizeIncidentReportInput = z.infer<
  typeof SummarizeIncidentReportInputSchema
>;

const SummarizeIncidentReportOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the incident report.'),
});

export type SummarizeIncidentReportOutput = z.infer<
  typeof SummarizeIncidentReportOutputSchema
>;

export async function summarizeIncidentReport(
  input: SummarizeIncidentReportInput
): Promise<SummarizeIncidentReportOutput> {
  return summarizeIncidentReportFlow(input);
}

const summarizeIncidentReportPrompt = ai.definePrompt({
  name: 'summarizeIncidentReportPrompt',
  model: googleAI.model('gemini-pro'),
  input: {schema: SummarizeIncidentReportInputSchema},
  output: {schema: SummarizeIncidentReportOutputSchema},
  prompt: `You are an AI assistant helping dispatchers quickly understand incident reports.  Summarize the following incident report in a concise and informative way.  Focus on the key details and provide a summary that allows the dispatcher to quickly assess the situation.\n\nIncident Report: {{{report}}}`,
});

const summarizeIncidentReportFlow = ai.defineFlow(
  {
    name: 'summarizeIncidentReportFlow',
    inputSchema: SummarizeIncidentReportInputSchema,
    outputSchema: SummarizeIncidentReportOutputSchema,
  },
  async input => {
    const {output} = await summarizeIncidentReportPrompt(input);
    return output!;
  }
);
