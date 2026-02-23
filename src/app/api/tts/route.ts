import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'No text provided' }, { status: 400 });
    }

    // Split long text into chunks of ~200 chars (Google Translate TTS limit)
    const chunks = splitText(text, 200);
    const audioChunks: Buffer[] = [];

    for (const chunk of chunks) {
      const encoded = encodeURIComponent(chunk);
      const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encoded}`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': 'https://translate.google.com/',
        },
      });

      if (!res.ok) {
        console.error('Google Translate TTS error:', res.status, res.statusText);
        return NextResponse.json({ error: 'TTS request failed' }, { status: 502 });
      }

      const buffer = Buffer.from(await res.arrayBuffer());
      audioChunks.push(buffer);
    }

    const combined = Buffer.concat(audioChunks);

    return new NextResponse(combined, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('TTS error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf(' ', maxLen);
    if (splitAt <= 0) splitAt = maxLen;
    chunks.push(remaining.slice(0, splitAt));
    remaining = remaining.slice(splitAt).trim();
  }
  return chunks;
}
