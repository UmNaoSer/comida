'use server';
/**
 * @fileOverview This file implements a Genkit flow for the AI Financial Insight Tool.
 * It analyzes recent financial transactions to highlight simple spending patterns
 * and provide relevant, generic financial tips.
 *
 * - getFinancialAdvisorInsights - A function that fetches financial insights from the AI.
 * - FinancialAdvisorInsightsInput - The input type for the getFinancialAdvisorInsights function.
 * - FinancialAdvisorInsightsOutput - The return type for the getFinancialAdvisorInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  id: z.string().describe('Unique identifier for the transaction.'),
  description: z.string().describe('A brief description of the transaction.'),
  amount: z.number().describe('The amount of the transaction.'),
  type: z.enum(['income', 'expense']).describe('The type of the transaction: "income" or "expense".'),
  date: z.string().datetime().describe('The date of the transaction in ISO 8601 format.'),
});

const FinancialAdvisorInsightsInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('An array of recent financial transactions to analyze.'),
});
export type FinancialAdvisorInsightsInput = z.infer<typeof FinancialAdvisorInsightsInputSchema>;

const FinancialAdvisorInsightsOutputSchema = z.object({
  spendingPatterns: z.string().describe('A summary of simple spending patterns identified from the provided transactions.'),
  financialTips: z.string().describe('Relevant, generic financial tips based on the provided transactions.'),
});
export type FinancialAdvisorInsightsOutput = z.infer<typeof FinancialAdvisorInsightsOutputSchema>;

export async function getFinancialAdvisorInsights(
  input: FinancialAdvisorInsightsInput
): Promise<FinancialAdvisorInsightsOutput> {
  return financialAdvisorInsightsFlow(input);
}

const financialAdvisorInsightsPrompt = ai.definePrompt({
  name: 'financialAdvisorInsightsPrompt',
  input: {schema: FinancialAdvisorInsightsInputSchema},
  output: {schema: FinancialAdvisorInsightsOutputSchema},
  prompt: `You are a financial advisor. Your task is to analyze the provided recent financial transactions.
Based on this analysis, you need to identify simple spending patterns and provide relevant, generic financial tips to help the user better understand and manage their personal finances.

Here are the recent transactions:
{{#each transactions}}
- Date: {{date}}, Type: {{type}}, Amount: {{amount}}, Description: {{description}}
{{/each}}

Please provide:
1. A summary of simple spending patterns you observe.
2. Relevant, generic financial tips.

Format your response as a JSON object with 'spendingPatterns' and 'financialTips' fields, as described by the output schema.`,
});

const financialAdvisorInsightsFlow = ai.defineFlow(
  {
    name: 'financialAdvisorInsightsFlow',
    inputSchema: FinancialAdvisorInsightsInputSchema,
    outputSchema: FinancialAdvisorInsightsOutputSchema,
  },
  async (input) => {
    const {output} = await financialAdvisorInsightsPrompt(input);
    if (!output) {
      throw new Error('Failed to get financial insights from AI.');
    }
    return output;
  }
);
