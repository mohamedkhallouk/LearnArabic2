import { WordItem } from '@/types';
import { EnrichmentResult } from './openai-schema';

export async function enrichWord(
  word: WordItem,
  apiKey: string,
  model?: string,
): Promise<EnrichmentResult> {
  const res = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arabic_raw: word.arabic_raw, apiKey, model }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Enrichment failed');
  }
  return res.json();
}

export async function generateMoreExamples(
  word: WordItem,
  apiKey: string,
  model?: string,
): Promise<Array<{ ar: string; en: string; nl: string }>> {
  const res = await fetch('/api/enrich', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ arabic_raw: word.arabic_raw, apiKey, model, moreExamples: true }),
  });
  if (!res.ok) throw new Error('Failed to generate examples');
  return res.json();
}

export function applyEnrichment(word: WordItem, data: EnrichmentResult): WordItem {
  return {
    ...word,
    arabic_vowelized: data.arabic_vowelized || word.arabic_vowelized,
    transliteration: data.transliteration || word.transliteration,
    pos: data.pos || word.pos,
    // Never overwrite CSV-provided definitions
    english: word.english,
    dutch: word.dutch,
    synonyms_ar: data.synonyms_ar,
    synonyms_en: data.synonyms_en,
    synonyms_nl: data.synonyms_nl,
    examples: data.examples,
    notes: data.notes,
    updatedAt: Date.now(),
    aiGenerated: true,
    aiError: false,
  };
}
