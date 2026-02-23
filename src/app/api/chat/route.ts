import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: NextRequest) {
  try {
    const { messages, learnedWords, uiLanguage, apiKey, model } = await req.json();
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      return NextResponse.json({ error: 'No API key provided' }, { status: 400 });
    }

    const openai = new OpenAI({ apiKey: key });

    const langName = uiLanguage === 'nl' ? 'Dutch' : 'English';
    const wordList = (learnedWords || [])
      .map((w: { arabic_raw: string; arabic_vowelized: string; english: string; dutch: string }) =>
        `${w.arabic_vowelized || w.arabic_raw} (${uiLanguage === 'nl' ? w.dutch || w.english : w.english || w.dutch})`
      )
      .join(', ');

    const systemPrompt = `You are a friendly, patient Arabic (MSA) tutor helping a beginner learner. The student speaks ${langName}.

STRICT VOCABULARY RULES:
- You MUST primarily use ONLY these Arabic words that the student has learned: ${wordList || '(no words learned yet)'}
- When unavoidable grammar words (particles, prepositions) are needed, keep them minimal and always explain them in ${langName}.
- NEVER introduce complex Arabic words outside the list without warning.

BEHAVIOR:
- Explain in ${langName}, practice in Arabic.
- Ask short questions or give prompts using mostly the learned vocabulary.
- Correct mistakes gently with explanation.
- Keep responses concise (2-4 sentences typically).
- Use Arabic script with transliteration in parentheses when writing Arabic.
- If the student asks to learn a new word, introduce ONE new word at a time and confirm they're ready.
- Be encouraging but not overly enthusiastic. Keep tone warm and professional.`;

    const chatMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const response = await openai.chat.completions.create({
      model: model || 'gpt-4o-mini',
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content || '';

    return NextResponse.json({ content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
