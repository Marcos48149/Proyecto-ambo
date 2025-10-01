'use server';
/**
 * @fileOverview An AI agent that suggests a reorder quantity for a product when its stock is low.
 *
 * - suggestReorderQuantity - A function that suggests the reorder quantity for a product.
 * - SuggestReorderQuantityInput - The input type for the suggestReorderQuantity function.
 * - SuggestReorderQuantityOutput - The return type for the suggestReorderQuantity function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestReorderQuantityInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  currentStock: z.number().describe('The current stock level of the product.'),
  stockMinimum: z.number().describe('The minimum stock level of the product.'),
  averageSalesPerDay: z.number().describe('The average daily sales of the product.'),
  daysToRestock: z
    .number()
    .describe(
      'The number of days it takes to restock the product from the supplier.'
    ),
});
export type SuggestReorderQuantityInput = z.infer<
  typeof SuggestReorderQuantityInputSchema
>;

const SuggestReorderQuantityOutputSchema = z.object({
  reorderQuantity: z
    .number()
    .describe(
      'The suggested reorder quantity to avoid stockouts, calculated based on average sales and restock time.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the suggested reorder quantity, explaining the factors considered.'
    ),
});
export type SuggestReorderQuantityOutput = z.infer<
  typeof SuggestReorderQuantityOutputSchema
>;

export async function suggestReorderQuantity(
  input: SuggestReorderQuantityInput
): Promise<SuggestReorderQuantityOutput> {
  return suggestReorderQuantityFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReorderQuantityPrompt',
  input: {schema: SuggestReorderQuantityInputSchema},
  output: {schema: SuggestReorderQuantityOutputSchema},
  prompt: `You are a stock management expert. Your goal is to suggest a reorder quantity for a product to avoid stockouts.

  Consider the following factors:
  - Product Name: {{productName}}
  - Current Stock: {{currentStock}}
  - Minimum Stock: {{stockMinimum}}
  - Average Sales per Day: {{averageSalesPerDay}}
  - Days to Restock: {{daysToRestock}}

  Calculate the reorder quantity based on the average sales per day and the time it takes to restock the product. Ensure that the reorder quantity will cover the sales during the restock period and bring the stock level above the minimum stock.

  Your output should include the suggested reorder quantity and a brief explanation of your reasoning.

  Reorder Quantity: {{reorderQuantity}}
  Reasoning: {{reasoning}}`,
});

const suggestReorderQuantityFlow = ai.defineFlow(
  {
    name: 'suggestReorderQuantityFlow',
    inputSchema: SuggestReorderQuantityInputSchema,
    outputSchema: SuggestReorderQuantityOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
