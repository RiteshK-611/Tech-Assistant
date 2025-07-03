'use server';

/**
 * @fileOverview An AI-powered help text generator for shop floor technicians.
 *
 * - generateHelpText - A function that generates help text for a given step.
 * - GenerateHelpTextInput - The input type for the generateHelpText function.
 * - GenerateHelpTextOutput - The return type for the generateHelpText function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHelpTextInputSchema = z.object({
  stepDescription: z
    .string()
    .describe('The description of the step for which help is needed.'),
});
export type GenerateHelpTextInput = z.infer<typeof GenerateHelpTextInputSchema>;

const GenerateHelpTextOutputSchema = z.object({
  helpText: z.string().describe('The generated help text for the step.'),
});
export type GenerateHelpTextOutput = z.infer<typeof GenerateHelpTextOutputSchema>;

export async function generateHelpText(input: GenerateHelpTextInput): Promise<GenerateHelpTextOutput> {
  return generateHelpTextFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHelpTextPrompt',
  input: {schema: GenerateHelpTextInputSchema},
  output: {schema: GenerateHelpTextOutputSchema},
  prompt: `You are an AI assistant specializing in creating simple, user-friendly help text for shop floor technicians.

  Generate a concise and easy-to-understand help text for the following step:

  Step Description: {{{stepDescription}}}

  The help text should be no more than two sentences and use simple language suitable for non-technical users.
  Focus on explaining the purpose of the step and how to complete it successfully.
  Avoid jargon and technical terms.
`,
});

const generateHelpTextFlow = ai.defineFlow(
  {
    name: 'generateHelpTextFlow',
    inputSchema: GenerateHelpTextInputSchema,
    outputSchema: GenerateHelpTextOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
