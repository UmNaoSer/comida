'use server';
/**
 * @fileOverview Este arquivo implementa um fluxo Genkit para a ferramenta de Insights Financeiros via IA.
 * Analisa transações financeiras recentes para destacar padrões simples de gastos
 * e fornecer dicas financeiras genéricas e relevantes.
 *
 * - getFinancialAdvisorInsights - Função que busca insights financeiros da IA.
 * - FinancialAdvisorInsightsInput - O tipo de entrada para a função getFinancialAdvisorInsights.
 * - FinancialAdvisorInsightsOutput - O tipo de retorno para a função getFinancialAdvisorInsights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TransactionSchema = z.object({
  id: z.string().describe('Identificador único da transação.'),
  description: z.string().describe('Uma breve descrição da transação.'),
  amount: z.number().describe('O valor da transação.'),
  type: z.enum(['income', 'expense']).describe('O tipo da transação: "income" (entrada) ou "expense" (saída).'),
  date: z.string().datetime().describe('A data da transação no formato ISO 8601.'),
});

const FinancialAdvisorInsightsInputSchema = z.object({
  transactions: z.array(TransactionSchema).describe('Um array de transações financeiras recentes para analisar.'),
});
export type FinancialAdvisorInsightsInput = z.infer<typeof FinancialAdvisorInsightsInputSchema>;

const FinancialAdvisorInsightsOutputSchema = z.object({
  spendingPatterns: z.string().describe('Um resumo de padrões simples de gastos identificados a partir das transações fornecidas.'),
  financialTips: z.string().describe('Dicas financeiras genéricas e relevantes baseadas nas transações fornecidas.'),
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
  prompt: `Você é um consultor financeiro especializado. Sua tarefa é analisar as transações financeiras recentes fornecidas.
Com base nesta análise, você deve identificar padrões simples de gastos e fornecer dicas financeiras genéricas e relevantes para ajudar o usuário a entender e gerenciar melhor suas finanças pessoais.

Aqui estão as transações recentes:
{{#each transactions}}
- Data: {{date}}, Tipo: {{type}}, Valor: {{amount}}, Descrição: {{description}}
{{/each}}

Por favor, forneça:
1. Um resumo dos padrões simples de gastos que você observa.
2. Dicas financeiras genéricas e relevantes.

O seu texto DEVE estar em Português do Brasil (pt-BR).
Formate sua resposta como um objeto JSON com os campos 'spendingPatterns' e 'financialTips', conforme descrito no esquema de saída.`,
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
      throw new Error('Falha ao obter insights financeiros da IA.');
    }
    return output;
  }
);
