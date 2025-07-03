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
  prompt: `You are an expert OCR reader specializing in extracting serial numbers from various file types including images, PDFs, and documents.

Your task is to analyze the provided file and extract any potential serial numbers you find. The file could be an image of a component, or it could be a document (like a PDF or Word file) that contains images or text describing a component.

Look for alphanumeric strings that are labeled as or appear to be serial numbers (often prefixed with S/N, SN, Serial No., etc.).
If the file is a document, scan both the text and any embedded images for serial numbers.

If you detect multiple possible serial numbers, return all of them. If you find none, return an empty array.

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
