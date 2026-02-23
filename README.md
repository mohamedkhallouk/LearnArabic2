# Learn Arabic

A responsive local-only web app to learn the 1000 most common Arabic (MSA) words using spaced repetition and AI-powered enrichment.

## Features

- **Spaced Repetition (SM-2)**: Smart scheduling to maximize retention
- **Multiple Exercise Types**: Recognition, recall, listening, and cloze fill-in
- **AI Enrichment**: Vowelized Arabic, transliteration, translations (EN/NL), examples, synonyms
- **AI Tutor**: Chat-based practice using your learned vocabulary
- **Text-to-Speech**: OpenAI TTS with browser fallback
- **Bilingual UI**: Full English and Dutch interface
- **Arabic Input**: On-screen keyboard and transliteration helper
- **100% Local**: All data stored in IndexedDB on your device

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Word List

The app includes the 1000 most common Arabic (MSA) words from `/mnt/data/Arabic-1000-common.txt`, parsed and loaded into IndexedDB on first launch.

## OpenAI API Key

AI features (translations, enrichment, tutor, audio) require an OpenAI API key:

1. **Via Settings UI** (recommended): Open Settings in the app and paste your key (`sk-...`)
2. **Via environment variable** (development): Create `.env.local` with `OPENAI_API_KEY=sk-...`

The app works without an API key, but AI features will be unavailable.

### Cost Note

OpenAI calls are made for:
- **Enrichment**: ~1 API call per word (generating translations, examples, etc.)
- **TTS Audio**: 1 call per word/example audio generation
- **Tutor Chat**: 1 call per message

All results are cached locally so repeat use costs nothing. With GPT-4o-mini, enriching all 1000 words costs approximately $0.50-1.00.

## Data Privacy

All user data is stored locally on your device using IndexedDB and localStorage. The only external calls are to OpenAI when:
- Generating AI enrichment data (translations, examples, etc.)
- Generating TTS audio
- Using the AI tutor chat

No data is sent anywhere else. No account or login required.

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- IndexedDB via `idb`
- OpenAI SDK with structured outputs (Zod)

## Testing

```bash
npm test
```

Unit tests cover the SRS algorithm and Arabic normalization/comparison logic.
