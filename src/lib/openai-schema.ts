import { z } from 'zod';

export const exampleSchema = z.object({
  ar: z.string(),
  en: z.string(),
  nl: z.string(),
});

export const enrichmentSchema = z.object({
  arabic_vowelized: z.string(),
  transliteration: z.string(),
  pos: z.string(),
  english: z.string(),
  dutch: z.string(),
  synonyms_ar: z.array(z.string()).max(3),
  synonyms_en: z.array(z.string()).max(3),
  synonyms_nl: z.array(z.string()).max(3),
  examples: z.array(exampleSchema).min(3).max(3),
  notes: z.string(),
});

export type EnrichmentResult = z.infer<typeof enrichmentSchema>;

export const enrichmentJsonSchema = {
  type: 'object' as const,
  properties: {
    arabic_vowelized: { type: 'string' as const },
    transliteration: { type: 'string' as const },
    pos: { type: 'string' as const },
    english: { type: 'string' as const },
    dutch: { type: 'string' as const },
    synonyms_ar: { type: 'array' as const, items: { type: 'string' as const } },
    synonyms_en: { type: 'array' as const, items: { type: 'string' as const } },
    synonyms_nl: { type: 'array' as const, items: { type: 'string' as const } },
    examples: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          ar: { type: 'string' as const },
          en: { type: 'string' as const },
          nl: { type: 'string' as const },
        },
        required: ['ar', 'en', 'nl'],
        additionalProperties: false,
      },
    },
    notes: { type: 'string' as const },
  },
  required: [
    'arabic_vowelized', 'transliteration', 'pos', 'english', 'dutch',
    'synonyms_ar', 'synonyms_en', 'synonyms_nl', 'examples', 'notes',
  ],
  additionalProperties: false,
};
