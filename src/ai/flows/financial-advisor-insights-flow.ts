'use server';
/**
 * @fileOverview Fluxo Genkit para Insights Financeiros via IA.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  id: z.string(),
  description: z.string(),
  amount: z.number(),
  type: z.enum(['income', 'expense']),
  date: z.string(),
});

const FinancialAdvisorInsightsInputSchema = z.object({
  transactions: z.array(TransactionSchema),
});

const FinancialAdvisorInsightsOutputSchema = z.object({
  spendingPatterns: z.string(),
  financialTips: z.string(),
});

export type FinancialAdvisorInsightsInput = z.infer<typeof FinancialAdvisorInsightsInputSchema>;
export type FinancialAdvisorInsightsOutput = z.infer<typeof FinancialAdvisorInsightsOutputSchema>;

const financialAdvisorInsightsPrompt = ai.definePrompt({
  name: 'financialAdvisorInsightsPrompt',
  input: {schema: FinancialAdvisorInsightsInputSchema},
  output: {schema: FinancialAdvisorInsightsOutputSchema},
  prompt: `Analise as transações financeiras e forneça padrões de gastos e dicas.
Transações:
{{#each transactions}}
- Data: {{date}}, Tipo: {{type}}, Valor: {{amount}}, Descrição: {{description}}
{{/each}}
Idioma: Português do Brasil.`,
});

export async function getFinancialAdvisorInsights(
  input: FinancialAdvisorInsightsInput
): Promise<FinancialAdvisorInsightsOutput> {
  try {
    const {output} = await financialAdvisorInsightsPrompt(input);
    if (!output) {
      throw new Error('Falha ao obter insights financeiros da IA.');
    }
    return output;
  } catch (error: any) {
    console.error("Erro no fluxo financialAdvisorInsights:", error);
    throw new Error(error.message || 'Erro ao gerar insights financeiros.');
  }
}
