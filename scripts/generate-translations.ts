/**
 * One-time script: generates pre-translations for all Arabic words.
 * Run with: npx ts-node --esm scripts/generate-translations.ts
 * 
 * Reads Arabic-1000-common.txt, deduplicates, calls OpenAI for
 * English + Dutch translations + transliteration, saves to
 * src/data/pretranslated.json
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

const OPENAI_KEY = process.env.OPENAI_API_KEY || '';
const INPUT = path.join(__dirname, '..', 'Arabic-1000-common.txt');
const OUTPUT = path.join(__dirname, '..', 'src', 'data', 'pretranslated.json');
const BATCH_SIZE = 40;

interface WordEntry {
  ar: string;
  en: string;
  nl: string;
  tr: string;
}

async function main() {
  if (!OPENAI_KEY) {
    console.error('Set OPENAI_API_KEY env var');
    process.exit(1);
  }

  const raw = fs.readFileSync(INPUT, 'utf-8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);

  // Deduplicate
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of lines) {
    if (!seen.has(line)) {
      seen.add(line);
      unique.push(line);
    }
  }

  console.log(`Total lines: ${lines.length}, Unique: ${unique.length}`);

  // Load existing progress if any
  let results: WordEntry[] = [];
  if (fs.existsSync(OUTPUT)) {
    try {
      results = JSON.parse(fs.readFileSync(OUTPUT, 'utf-8'));
      console.log(`Resuming from ${results.length} existing entries`);
    } catch { /* start fresh */ }
  }

  const done = new Set(results.map(r => r.ar));
  const remaining = unique.filter(w => !done.has(w));
  console.log(`Remaining to translate: ${remaining.length}`);

  const openai = new OpenAI({ apiKey: OPENAI_KEY });

  for (let i = 0; i < remaining.length; i += BATCH_SIZE) {
    const batch = remaining.slice(i, i + BATCH_SIZE);
    const numbered = batch.map((w, idx) => `${idx + 1}. ${w}`).join('\n');

    console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: words ${i + 1}-${i + batch.length}`);

    try {
      const resp = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You translate Arabic words/phrases. For each numbered Arabic word, return a JSON array with objects having exactly these fields:
- "ar": the Arabic word (unchanged)
- "en": short English translation (1-4 words, most common meaning)
- "nl": short Dutch translation (1-4 words)
- "tr": simplified transliteration for English speakers (use: sh=ش, kh=خ, gh=غ, 3=ع, H=ح, S=ص, D=ض, T=ط, Z=ظ, th=ث, dh=ذ, q=ق, '=ء)

Return ONLY the JSON array, no markdown.`
          },
          { role: 'user', content: numbered }
        ],
        temperature: 0.2,
        max_tokens: 3000,
      });

      const text = resp.choices[0]?.message?.content || '[]';
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed: WordEntry[] = JSON.parse(cleaned);

      for (const entry of parsed) {
        if (entry.ar && entry.en && entry.nl && entry.tr) {
          results.push(entry);
        }
      }

      // Save progress after each batch
      fs.writeFileSync(OUTPUT, JSON.stringify(results, null, 2), 'utf-8');
      console.log(`  -> Saved ${results.length} total entries`);

      // Rate limit
      await new Promise(r => setTimeout(r, 1000));
    } catch (err: any) {
      console.error(`  -> Error: ${err.message}. Retrying in 5s...`);
      await new Promise(r => setTimeout(r, 5000));
      i -= BATCH_SIZE; // retry this batch
    }
  }

  console.log(`\nDone! ${results.length} words saved to ${OUTPUT}`);
}

main();
