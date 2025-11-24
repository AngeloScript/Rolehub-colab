'use server';
/**
 * @fileOverview AI-powered flow to generate full event details from a simple idea.
 *
 * - generateEventDetails - A function that takes a simple event idea and returns a full event object.
 * - GenerateEventDetailsInput - The input type for the generateEventDetails function.
 * - GenerateEventDetailsOutput - The return type for the generateEventDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateEventDetailsInputSchema = z.object({
  idea: z.string().describe('A simple idea or title for the event.'),
});
export type GenerateEventDetailsInput = z.infer<typeof GenerateEventDetailsInputSchema>;

const GenerateEventDetailsOutputSchema = z.object({
  description: z.string().describe('A compelling and detailed description for the event.'),
  location: z.string().describe('A plausible, creative name for the event location.'),
  date: z.string().describe('A future date for the event, in "MMM DD" format (e.g., "NOV 25").'),
  time: z.string().describe('A suitable time for the event, in "HH:MM" format (e.g., "21:00").'),
  tags: z.array(z.string()).describe('A list of 3-4 relevant tags for the event.'),
});
export type GenerateEventDetailsOutput = z.infer<typeof GenerateEventDetailsOutputSchema>;

export async function generateEventDetails(input: GenerateEventDetailsInput): Promise<GenerateEventDetailsOutput> {
  return generateEventDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateEventDetailsPrompt',
  input: {schema: GenerateEventDetailsInputSchema},
  output: {schema: GenerateEventDetailsOutputSchema},
  prompt: `You are an expert event planner AI. Your task is to take a user's simple event idea and flesh it out into a more complete event.

Event Idea: "{{idea}}"

Based on this idea, generate the following details. Be creative and realistic. The event should be in the near future.

- **Description:** Write a fun and engaging description (2-3 sentences).
- **Location:** Invent a cool, thematic name for a venue (e.g., "The Neon Garage", "Pixel Arcade Bar", "Green Valley Park").
- **Date:** Pick a plausible future date (within the next 2-3 months). Format it as "MMM DD" (e.g., "OUT 28", "NOV 04").
- **Time:** Choose an appropriate start time. Format it as "HH:MM".
- **Tags:** Provide 3-4 relevant, lowercase tags.

Produce the output in the requested JSON format.`,
});

const generateEventDetailsFlow = ai.defineFlow(
  {
    name: 'generateEventDetailsFlow',
    inputSchema: GenerateEventDetailsInputSchema,
    outputSchema: GenerateEventDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
