'use server';

/**
 * @fileOverview A serial number extraction AI agent.
 *
 * - extractSerialNumber - A function that handles the serial number extraction process.
 * - ExtractSerialNumberInput - The input type for the extractSerialNumber function.
 * - ExtractSerialNumberOutput - The return type for the extractSerialNumber function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractSerialNumberInputSchema = z.object({
  fileDataUri: z
    .string()
    .describe(
      "A file (image or document), as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type ExtractSerialNumberInput = z.infer<typeof ExtractSerialNumberInputSchema>;

const ExtractSerialNumberOutputSchema = z.object({
  serialNumbers: z
    .array(z.string())
    .describe('The list of possible serial numbers extracted from the image or document.'),
});
export type ExtractSerialNumberOutput = z.infer<typeof ExtractSerialNumberOutputSchema>;

export async function extractSerialNumber(input: ExtractSerialNumberInput): Promise<ExtractSerialNumberOutput> {
  return extractSerialNumberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractSerialNumberPrompt',
  input: {schema: ExtractSerialNumberInputSchema},
  output: {schema: ExtractSerialNumberOutputSchema},
  prompt: `You are an expert OCR reader specializing in extracting serial numbers from images or documents.

You will use this information to extract the serial number from the image or document.
If you detect multiple possible serial numbers, return all of them in the serialNumbers array.

File: {{media url=fileDataUri}}`,
});

const extractSerialNumberFlow = ai.defineFlow(
  {
    name: 'extractSerialNumberFlow',
    inputSchema: ExtractSerialNumberInputSchema,
    outputSchema: ExtractSerialNumberOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
