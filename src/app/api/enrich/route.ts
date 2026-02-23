import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { enrichmentSchema, enrichmentJsonSchema } from '@/lib/openai-schema';

export async function POST(req: NextRequest) {
  try {
    const { arabic_raw, apiKey, model, moreExamples } = await req.json();
    const key = apiKey || process.env.OPENAI_API_KEY;
    if (!key) return NextResponse.json({ error: 'No API key' }, { status: 400 });

    const openai = new OpenAI({ apiKey: key });
    const chosenModel = model || 'gpt-4o-mini';

    if (moreExamples) {
      const resp = await openai.chat.completions.create({
        model: chosenModel,
        messages: [
          { role: 'system', content: 'Generate 3 NEW short MSA example sentences using the given Arabic word. Return a JSON array of {ar, en, nl} objects. Each sentence should be 4-8 words, natural MSA. Return ONLY the JSON array.' },
          { role: 'user', content: arabic_raw },
        ],
        temperature: 0.7,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });
      const text = resp.choices[0]?.message?.content || '{"examples":[]}';
      const parsed = JSON.parse(text);
      return NextResponse.json(parsed.examples || parsed);
    }

    const systemPrompt = `You are an Arabic language teaching assistant. Given an Arabic word or phrase (MSA), produce detailed learning data.

Rules:
- Treat the input as Modern Standard Arabic. Pick the most common MSA meaning.
- arabic_vowelized: add full harakat for correct MSA pronunciation.
- transliteration: simplified consistent system (sh=ش, kh=خ, gh=غ, 3=ع, H=ح, S=ص, D=ض, T=ط, Z=ظ, th=ث, dh=ذ, q=ق).
- Keep translations short (1-4 words).
- Provide exactly 3 example sentences. Each must be short (4-8 words), natural MSA, clearly using the word.
- Synonyms: 0-3, only if confident.
- notes: brief usage note or empty string.
- Always provide BOTH English AND Dutch.`;

    const response = await openai.chat.completions.create({
      model: chosenModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Arabic word/phrase: ${arabic_raw}` },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'enrichment', strict: true, schema: enrichmentJsonSchema },
      },
      temperature: 0.3,
      max_tokens: 700,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return NextResponse.json({ error: 'Empty response' }, { status: 500 });

    const validated = enrichmentSchema.parse(JSON.parse(content));
    return NextResponse.json(validated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
