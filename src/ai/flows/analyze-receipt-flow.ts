'use server';
/**
 * @fileOverview Fluxo para análise de notas fiscais de supermercado via IA.
 * Extrai estabelecimento, produtos e preços a partir de uma imagem, realizando correspondência inteligente com produtos existentes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ReceiptItemSchema = z.object({
  name: z.string().describe('Nome do produto conforme aparece na nota.'),
  price: z.number().describe('Preço unitário ou total do item.'),
  category: z.enum(['Açougue', 'Hortifruti', 'Padaria', 'Laticínios', 'Mercearia', 'Temperos', 'Bebidas', 'Limpeza', 'Higiene', 'Pets', 'Lazer', 'Transporte', 'Alimentação', 'Compras']).describe('Categoria do produto.'),
  matchedProductName: z.string().optional().describe('Nome do produto correspondente na lista de produtos existentes do usuário, se houver uma correspondência próxima.'),
});

const AnalyzeReceiptInputSchema = z.object({
  photoDataUri: z.string().describe("Foto da nota fiscal como data URI Base64."),
  existingProducts: z.array(z.string()).optional().describe("Lista de nomes de produtos que o usuário já possui cadastrados para tentativa de correspondência inteligente."),
});
export type AnalyzeReceiptInput = z.infer<typeof AnalyzeReceiptInputSchema>;

const AnalyzeReceiptOutputSchema = z.object({
  establishmentName: z.string().describe('Nome do estabelecimento extraído da nota.'),
  items: z.array(ReceiptItemSchema).describe('Lista de produtos e preços encontrados.'),
});
export type AnalyzeReceiptOutput = z.infer<typeof AnalyzeReceiptOutputSchema>;

const analyzeReceiptPrompt = ai.definePrompt({
  name: 'analyzeReceiptPrompt',
  input: { schema: AnalyzeReceiptInputSchema },
  output: { schema: AnalyzeReceiptOutputSchema },
  prompt: `Você é um assistente financeiro especializado em leitura de notas fiscais brasileiras.
Analise a imagem da nota fiscal fornecida e extraia:
1. O nome do estabelecimento (Supermercado, Loja, etc).
2. Uma lista de todos os itens comprados, contendo o nome do item e o valor pago.

{{#if existingProducts}}
Para cada item extraído, verifique se ele corresponde a algum dos seguintes produtos que o usuário já cadastrou:
{{#each existingProducts}}
- {{this}}
{{/each}}
Se houver uma correspondência próxima (mesmo que o nome na nota esteja abreviado, com erros de digitação ou ligeiramente diferente), identifique o nome exato do produto da lista fornecida no campo 'matchedProductName'. Priorize sempre os nomes desta lista se forem semanticamente o mesmo produto.
{{/if}}

3. Classifique cada item em uma das categorias permitidas: Açougue, Hortifruti, Padaria, Laticínios, Mercearia, Temperos, Bebidas, Limpeza, Higiene, Pets, Lazer, Transporte, Alimentação, Compras.

Imagem da Nota: {{media url=photoDataUri}}

Retorne os dados estruturados em JSON conforme o esquema definido.`,
});

export async function analyzeReceipt(input: AnalyzeReceiptInput): Promise<AnalyzeReceiptOutput> {
  const { output } = await analyzeReceiptPrompt(input);
  if (!output) {
    throw new Error('Não foi possível analisar a nota fiscal.');
  }
  return output;
}
