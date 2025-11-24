'use server';
/**
 * @fileOverview AI-powered flow to suggest events to a user based on their saved events.
 *
 * - suggestEvents - A function that takes a user's saved events and a list of all available events, and returns a personalized list of suggestions.
 * - SuggestEventsInput - The input type for the suggestEvents function.
 * - SuggestEventsOutput - The return type for the suggestEvents function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';
import type { Event } from '@/lib/types';


// Define a simpler Event schema for AI processing
const AiEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  tags: z.array(z.string()),
});

const SuggestEventsInputSchema = z.object({
  savedEvents: z.array(AiEventSchema).describe("A list of events the user has saved."),
  allEvents: z.array(AiEventSchema).describe("A list of all available events to choose from."),
});
export type SuggestEventsInput = z.infer<typeof SuggestEventsInputSchema>;

const SuggestEventsOutputSchema = z.object({
  suggestions: z.array(z.string()).describe('A list of up to 5 event IDs that are the best match for the user, ordered by relevance.'),
});
export type SuggestEventsOutput = z.infer<typeof SuggestEventsOutputSchema>;


export async function suggestEvents(input: SuggestEventsInput): Promise<SuggestEventsOutput> {
  return suggestEventsFlow(input);
}


const prompt = ai.definePrompt({
  name: 'suggestEventsPrompt',
  input: {schema: SuggestEventsInputSchema},
  output: {schema: SuggestEventsOutputSchema},
  prompt: `You are a sophisticated event recommendation engine for an app called RoleHub. Your task is to analyze a user's saved events to understand their preferences and then suggest new events from a general list that they would likely enjoy.

Analyze the user's saved events based on their titles, descriptions, and tags to determine patterns (e.g., preference for "rock music", "art exhibitions", "tech meetups", "outdoor activities", etc.).

Here are the user's saved events:
{{#each savedEvents}}
- **{{title}}** (Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}): {{description}}
{{/each}}

Here is the list of all available events to recommend from:
{{#each allEvents}}
- **ID: {{id}}** - **{{title}}** (Tags: {{#each tags}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}): {{description}}
{{/each}}

Based on your analysis, identify up to 5 events from the "all available events" list that are the best match for the user's inferred preferences. The suggestions should be new and not from the user's saved list.

Return the IDs of the recommended events in an array, ordered from most to least relevant.`,
});


const suggestEventsFlow = ai.defineFlow(
  {
    name: 'suggestEventsFlow',
    inputSchema: SuggestEventsInputSchema,
    outputSchema: SuggestEventsOutputSchema,
  },
  async (input) => {
    // Filter out events that the user has already saved from the list of all events
    const savedEventIds = new Set(input.savedEvents.map(e => e.id));
    const potentialEventsToSuggest = input.allEvents.filter(e => !savedEventIds.has(e.id));

    if (potentialEventsToSuggest.length === 0) {
      return { suggestions: [] };
    }

    const { output } = await prompt({
      savedEvents: input.savedEvents,
      allEvents: potentialEventsToSuggest,
    });
    
    return output!;
  }
);
