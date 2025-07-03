'use server';

/**
 * @fileOverview An AI-powered product information search agent.
 *
 * - searchProductInfo - A function that searches for product information online.
 * - SearchProductInfoInput - The input type for the searchProductInfo function.
 * - SearchProductInfoOutput - The return type for the searchProductInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductInfoSchema = z.object({
  name: z.string().describe('The common name of the product.'),
  type: z.string().describe('The type or category of the product (e.g., ATX Motherboard, Printed Circuit Assembly).'),
  manufacturer: z.string().describe('The name of the company that manufactured the product.'),
  description: z.string().describe('A brief description of the product and its features.'),
});

const SearchProductInfoInputSchema = z.object({
  serialNumber: z.string().describe('The serial number of the product to search for.'),
  fileDataUri: z.string().optional().describe(
      "An optional image or document of the product, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'. This can provide additional context for the search."
    ),
});
export type SearchProductInfoInput = z.infer<typeof SearchProductInfoInputSchema>;

const SearchProductInfoOutputSchema = z.object({
    found: z.boolean().describe('Whether or not product information was found.'),
    product: ProductInfoSchema.optional().describe('The product information if found.'),
    reasoning: z.string().describe('A brief explanation of the search result. For example, if not found, explain why. If found, explain how the conclusion was reached.'),
});
export type SearchProductInfoOutput = z.infer<typeof SearchProductInfoOutputSchema>;

export async function searchProductInfo(input: SearchProductInfoInput): Promise<SearchProductInfoOutput> {
  return searchProductInfoFlow(input);
}

const prompt = ai.definePrompt({
    name: 'searchProductInfoPrompt',
    input: {schema: SearchProductInfoInputSchema},
    output: {schema: SearchProductInfoOutputSchema},
    prompt: `You are an expert at identifying electronic components and parts from serial numbers and images. Your task is to find information about a product based on the provided serial number and an optional image.

Search the web for product details. Be thorough.

If you find credible information, populate the 'product' object with the name, type, manufacturer, and a description. Set 'found' to true.

If you cannot find any information or are not confident in the result, set 'found' to false and explain why in the 'reasoning' field. Do not invent information.

Serial Number: {{{serialNumber}}}

{{#if fileDataUri}}
You have also been provided with an image of the product. Use it as additional context for your search.
Image: {{media url=fileDataUri}}
{{/if}}
`,
});

const searchProductInfoFlow = ai.defineFlow(
  {
    name: 'searchProductInfoFlow',
    inputSchema: SearchProductInfoInputSchema,
    outputSchema: SearchProductInfoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
