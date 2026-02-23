/* ------------------------------------------------------------------ */
/*  Account                                                            */
/* ------------------------------------------------------------------ */

export interface Account {
  username: string;
  passwordHash: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Word data (shared, not user-specific)                              */
/* ------------------------------------------------------------------ */

export interface WordEntry {
  ar: string;
  en: string;
  nl: string;
}

export interface WordItem {
  id: string;
  arabic_raw: string;
  arabic_vowelized: string;
  transliteration: string;
  pos: string;
  english: string;
  dutch: string;
  synonyms_ar: string[];
  synonyms_en: string[];
  synonyms_nl: string[];
  examples: ExampleSentence[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  aiGenerated: boolean;
  aiError: boolean;
}

export interface ExampleSentence {
  ar: string;
  en: string;
  nl: string;
}

/* ------------------------------------------------------------------ */
/*  SRS (per-user per-word)                                            */
/* ------------------------------------------------------------------ */

export interface SRSState {
  id: string;          // `${userId}_${itemId}`
  userId: string;
  itemId: string;
  dueAt: number;
  intervalDays: number;
  easeFactor: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: number;
  lastGrade: number;
  totalReviews: number;
  successStreak: number;
}

/* ------------------------------------------------------------------ */
/*  Settings (per-user)                                                */
/* ------------------------------------------------------------------ */

export interface UserSettings {
  id: string;          // userId
  uiLanguage: 'en' | 'nl';
  dailyNewTarget: number;
  dailyReviewTarget: number;
  preferredExerciseMix: ExerciseMix;
  showVowelized: boolean;
  showTransliteration: boolean;
  arabicKeyboardMode: 'off' | 'onscreen' | 'transliteration';
  openaiModel: string;
  ttsModel: string;
  ttsVoice: string;
}

export interface ExerciseMix {
  recognition: number;
  recall: number;
  listening: number;
  cloze: number;
  reverseRecognition: number;
  matchPairs: number;
}

/* ------------------------------------------------------------------ */
/*  Stats (per-user per-day)                                           */
/* ------------------------------------------------------------------ */

export interface SessionStats {
  id: string;          // `${userId}_${date}`
  userId: string;
  date: string;
  reviewsDone: number;
  newLearned: number;
  accuracyByMode: Record<string, { correct: number; total: number }>;
  timeSpentSeconds: number;
  streak: number;
}

/* ------------------------------------------------------------------ */
/*  Audio cache (global)                                               */
/* ------------------------------------------------------------------ */

export interface AudioCacheEntry {
  itemId: string;
  type: 'word' | 'example';
  blob: Blob;
  model: string;
  voice: string;
  createdAt: number;
}

/* ------------------------------------------------------------------ */
/*  Tutor (per-user)                                                   */
/* ------------------------------------------------------------------ */

export interface TutorMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface TutorSession {
  id: string;
  userId: string;
  messages: TutorMessage[];
  createdAt: number;
  updatedAt: number;
}

/* ------------------------------------------------------------------ */
/*  Exercise types                                                     */
/* ------------------------------------------------------------------ */

export type ExerciseType = 'recognition' | 'recall' | 'listening' | 'cloze' | 'reverseRecognition' | 'matchPairs';

export interface ExerciseItem {
  type: ExerciseType;
  word: WordItem;
  srs: SRSState;
  isNew: boolean;
}

export type SRSGrade = 0 | 1 | 2 | 3 | 4 | 5;

export interface DailyPlan {
  newItems: Array<{ word: WordItem; srs: SRSState }>;
  reviewItems: Array<{ word: WordItem; srs: SRSState }>;
  extraItems: Array<{ word: WordItem; srs: SRSState }>;
}
