
'use server';
/**
 * @fileOverview AI-powered flow to generate a color theme from an event banner image.
 *
 * - generateEventTheme - A function that takes an image and returns a color palette.
 * - GenerateEventThemeInput - The input type for the generateEventTheme function.
 * - GenerateEventThemeOutput - The return type for the generateEventTheme function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventThemeInputSchema = z.object({
  imageDataUri: z
    .string()
    .describe(
      "The event banner image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type GenerateEventThemeInput = z.infer<typeof GenerateEventThemeInputSchema>;

const GenerateEventThemeOutputSchema = z.object({
  primaryColor: z.string().describe('A vibrant primary color from the image, in HSL format (e.g., "159 100% 50%").'),
  backgroundColor: z.string().describe('A dark, deep background color from the image, in HSL format (e.g., "260 20% 5%").'),
  secondaryColor: z.string().describe('A complementary secondary color from the image, in HSL format (e.g., "330 95% 65%").'),
});
export type GenerateEventThemeOutput = z.infer<typeof GenerateEventThemeOutputSchema>;

export async function generateEventTheme(input: GenerateEventThemeInput): Promise<GenerateEventThemeOutput> {
  return generateEventThemeFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventThemePrompt',
  input: {schema: GenerateEventThemeInputSchema},
  output: {schema: GenerateEventThemeOutputSchema},
  prompt: `You are a visual design expert AI. Your task is to analyze the provided event banner image and extract a visually appealing color palette suitable for a UI theme.

Image: {{media url=imageDataUri}}

From the image, generate three colors in HSL string format:
- **primaryColor**: A vibrant, eye-catching color suitable for buttons, icons, and highlights.
- **backgroundColor**: A dark, rich background color that complements the primary color and ensures good contrast.
- **secondaryColor**: A second complementary color that works well with the primary and background colors. It will be used for gradients and other accents.

Provide the output in the requested JSON format. Example: { "primaryColor": "340 90% 60%", "backgroundColor": "340 10% 8%", "secondaryColor": "220 85% 65%" }`,
});


const generateEventThemeFlow = ai.defineFlow(
  {
    name: 'generateEventThemeFlow',
    inputSchema: GenerateEventThemeInputSchema,
    outputSchema: GenerateEventThemeOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
