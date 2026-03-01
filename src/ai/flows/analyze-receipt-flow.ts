
'use server';
/**
 * @fileOverview Fluxo para análise de notas fiscais de supermercado via IA.
 * Extrai estabelecimento, produtos e preços a partir de uma imagem.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const maxDuration = 60;

const ReceiptItemSchema = z.object({
  name: z.string().describe('Nome do produto conforme aparece na nota.'),
  price: z.number().describe('Preço unitário ou total do item.'),
  category: z.enum(['Açougue', 'Hortifruti', 'Padaria', 'Laticínios', 'Mercearia', 'Temperos', 'Bebidas', 'Limpeza', 'Higiene', 'Pets', 'Lazer', 'Transporte', 'Alimentação', 'Compras']).describe('Categoria do produto.'),
  matchedProductName: z.string().optional().describe('Nome do produto correspondente na lista de produtos existentes do usuário.'),
});

const AnalyzeReceiptInputSchema = z.object({
  photoDataUri: z.string().describe("Foto da nota fiscal como data URI Base64."),
  existingProducts: z.array(z.string()).optional().describe("Lista de nomes de produtos cadastrados."),
  existingEstablishments: z.array(z.string()).optional().describe("Lista de nomes de estabelecimentos cadastrados."),
});
export type AnalyzeReceiptInput = z.infer<typeof AnalyzeReceiptInputSchema>;

const AnalyzeReceiptOutputSchema = z.object({
  establishmentName: z.string().describe('Nome do estabelecimento extraído da nota.'),
  matchedEstablishmentName: z.string().optional().describe('Nome do estabelecimento correspondente na lista do usuário.'),
  items: z.array(ReceiptItemSchema).describe('Lista de produtos e preços encontrados.'),
});
export type AnalyzeReceiptOutput = z.infer<typeof AnalyzeReceiptOutputSchema>;

const analyzeReceiptPrompt = ai.definePrompt({
  name: 'analyzeReceiptPrompt',
  input: { schema: AnalyzeReceiptInputSchema },
  output: { schema: AnalyzeReceiptOutputSchema },
  prompt: `Você é um assistente financeiro especializado em leitura de notas fiscais brasileiras.
Analise a imagem da nota fiscal fornecida e extraia o estabelecimento e os itens.

{{#if existingEstablishments}}
Verifique se o estabelecimento corresponde a um destes:
{{#each existingEstablishments}}
- {{this}}
{{/each}}
Identifique correspondências próximas no campo 'matchedEstablishmentName'.
{{/if}}

{{#if existingProducts}}
Para cada item, verifique correspondência com:
{{#each existingProducts}}
- {{this}}
{{/each}}
Identifique correspondências próximas no campo 'matchedProductName'.
{{/if}}

Imagem da Nota: {{media url=photoDataUri}}`,
});

export async function analyzeReceipt(input: AnalyzeReceiptInput): Promise<AnalyzeReceiptOutput> {
  try {
    const { output } = await analyzeReceiptPrompt(input);
    if (!output) {
      throw new Error('A IA não retornou dados para a nota fiscal.');
    }
    return output;
  } catch (error: any) {
    console.error("Erro no fluxo analyzeReceipt:", error);
    throw new Error(error.message || 'Erro ao processar a nota fiscal.');
  }
}
