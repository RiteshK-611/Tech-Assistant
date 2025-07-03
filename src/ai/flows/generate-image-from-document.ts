'use server';

/**
 * @fileOverview An AI agent to generate a product image from a document.
 *
 * - generateImageFromDocument - A function that generates a product image using a document as a reference.
 * - GenerateImageFromDocumentInput - The input type for the generateImageFromDocument function.
 * - GenerateImageFromDocumentOutput - The return type for the generateImageFromDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageFromDocumentInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A document (e.g., PDF, DOCX) containing product information and potentially images, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  productName: z.string().describe('The name of the product to generate an image for.'),
});
export type GenerateImageFromDocumentInput = z.infer<typeof GenerateImageFromDocumentInputSchema>;

const GenerateImageFromDocumentOutputSchema = z.object({
  imageDataUri: z.string().optional().describe(
    "The generated image of the product, as a data URI. Format: 'data:<mimetype>;base64,<encoded_data>'."
  ),
});
export type GenerateImageFromDocumentOutput = z.infer<typeof GenerateImageFromDocumentOutputSchema>;

export async function generateImageFromDocument(input: GenerateImageFromDocumentInput): Promise<GenerateImageFromDocumentOutput> {
  return generateImageFromDocumentFlow(input);
}

const generateImageFromDocumentFlow = ai.defineFlow(
  {
    name: 'generateImageFromDocumentFlow',
    inputSchema: GenerateImageFromDocumentInputSchema,
    outputSchema: GenerateImageFromDocumentOutputSchema,
  },
  async ({ fileDataUri, productName }) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.0-flash-preview-image-generation',
      prompt: [
        { media: { url: fileDataUri } },
        { text: `Analyze the provided document. Find the primary image of the product named "${productName}". Generate a new, clean, photorealistic image of just that product on a white background. This image will be used for a product information card.` },
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    if (media?.url) {
        return { imageDataUri: media.url };
    }
    return { imageDataUri: undefined };
  }
);
