import { WordItem, WordEntry } from '@/types';
import { stableHash } from '@/lib/arabic';
import wordsData from './words-data.json';

const entries = wordsData as WordEntry[];

const entryMap = new Map<string, WordEntry>();
for (const e of entries) {
  if (!entryMap.has(e.ar)) entryMap.set(e.ar, e);
}

export function buildWordList(): WordItem[] {
  const seen = new Set<string>();
  const items: WordItem[] = [];

  for (const entry of entries) {
    if (seen.has(entry.ar)) continue;
    seen.add(entry.ar);

    items.push({
      id: stableHash(entry.ar),
      arabic_raw: entry.ar,
      arabic_vowelized: '',
      transliteration: '',
      pos: '',
      english: entry.en,
      dutch: entry.nl,
      synonyms_ar: [],
      synonyms_en: [],
      synonyms_nl: [],
      examples: [],
      notes: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      aiGenerated: false,
      aiError: false,
    });
  }

  return items;
}

export function getWordEntry(arabic: string): WordEntry | undefined {
  return entryMap.get(arabic);
}

export function getTotalWordCount(): number {
  return entries.length;
}
