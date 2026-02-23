import { getCachedAudio, putCachedAudio } from './db';

export async function playAudio(
  itemId: string,
  text: string,
  type: 'word' | 'example',
): Promise<void> {
  if (!text) return;

  // Check cache first
  const cached = await getCachedAudio(itemId, type);
  if (cached) {
    return playBlob(cached.blob);
  }

  // Call server-side TTS (proxies Google Translate TTS)
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    throw new Error('TTS request failed');
  }

  const blob = await res.blob();

  // Cache for future use
  await putCachedAudio({
    itemId,
    type,
    blob,
    model: 'google-translate',
    voice: 'ar',
    createdAt: Date.now(),
  });

  return playBlob(blob);
}

function playBlob(blob: Blob): Promise<void> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Audio playback failed'));
    };
    audio.play().catch(reject);
  });
}
