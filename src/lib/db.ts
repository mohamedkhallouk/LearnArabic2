import { openDB, DBSchema, IDBPDatabase } from 'idb';
import {
  Account, WordItem, SRSState, SessionStats,
  TutorSession, AudioCacheEntry, UserSettings,
} from '@/types';

/* ------------------------------------------------------------------ */
/*  Schema                                                             */
/* ------------------------------------------------------------------ */

interface LearnArabicDB extends DBSchema {
  accounts: {
    key: string;
    value: Account;
  };
  words: {
    key: string;
    value: WordItem;
    indexes: { 'by-arabic': string };
  };
  srs: {
    key: string;
    value: SRSState;
    indexes: { 'by-user': string; 'by-due': number };
  };
  settings: {
    key: string;
    value: UserSettings;
  };
  stats: {
    key: string;
    value: SessionStats;
    indexes: { 'by-user': string };
  };
  tutorSessions: {
    key: string;
    value: TutorSession;
    indexes: { 'by-user': string };
  };
  audioCache: {
    key: string;
    value: AudioCacheEntry & { cacheKey: string };
  };
}

const DB_NAME = 'learn-arabic-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<LearnArabicDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<LearnArabicDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LearnArabicDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // Clean slate for v2 — drop old stores if upgrading from v1
        if (oldVersion < 2) {
          for (const name of db.objectStoreNames) {
            db.deleteObjectStore(name);
          }
        }

        if (!db.objectStoreNames.contains('accounts')) {
          db.createObjectStore('accounts', { keyPath: 'username' });
        }
        if (!db.objectStoreNames.contains('words')) {
          const ws = db.createObjectStore('words', { keyPath: 'id' });
          ws.createIndex('by-arabic', 'arabic_raw');
        }
        if (!db.objectStoreNames.contains('srs')) {
          const ss = db.createObjectStore('srs', { keyPath: 'id' });
          ss.createIndex('by-user', 'userId');
          ss.createIndex('by-due', 'dueAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('stats')) {
          const st = db.createObjectStore('stats', { keyPath: 'id' });
          st.createIndex('by-user', 'userId');
        }
        if (!db.objectStoreNames.contains('tutorSessions')) {
          const ts = db.createObjectStore('tutorSessions', { keyPath: 'id' });
          ts.createIndex('by-user', 'userId');
        }
        if (!db.objectStoreNames.contains('audioCache')) {
          db.createObjectStore('audioCache', { keyPath: 'cacheKey' });
        }
      },
    });
  }
  return dbPromise;
}

/* ------------------------------------------------------------------ */
/*  Accounts                                                           */
/* ------------------------------------------------------------------ */

export async function getAccount(username: string): Promise<Account | undefined> {
  const db = await getDB();
  return db.get('accounts', username);
}

export async function createAccount(account: Account): Promise<void> {
  const db = await getDB();
  await db.add('accounts', account);
}

/* ------------------------------------------------------------------ */
/*  Words (global, shared across users)                                */
/* ------------------------------------------------------------------ */

export async function getAllWords(): Promise<WordItem[]> {
  const db = await getDB();
  return db.getAll('words');
}

export async function getWord(id: string): Promise<WordItem | undefined> {
  const db = await getDB();
  return db.get('words', id);
}

export async function putWord(word: WordItem): Promise<void> {
  const db = await getDB();
  await db.put('words', word);
}

export async function putWords(words: WordItem[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('words', 'readwrite');
  for (const w of words) await tx.store.put(w);
  await tx.done;
}

export async function getWordsCount(): Promise<number> {
  const db = await getDB();
  return db.count('words');
}

/* ------------------------------------------------------------------ */
/*  SRS (per-user)                                                     */
/* ------------------------------------------------------------------ */

function srsKey(userId: string, itemId: string): string {
  return `${userId}_${itemId}`;
}

export async function getSRS(userId: string, itemId: string): Promise<SRSState | undefined> {
  const db = await getDB();
  return db.get('srs', srsKey(userId, itemId));
}

export async function getAllSRSForUser(userId: string): Promise<SRSState[]> {
  const db = await getDB();
  return db.getAllFromIndex('srs', 'by-user', userId);
}

export async function putSRS(state: SRSState): Promise<void> {
  const db = await getDB();
  await db.put('srs', state);
}

export async function putManySRS(states: SRSState[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('srs', 'readwrite');
  for (const s of states) await tx.store.put(s);
  await tx.done;
}

/* ------------------------------------------------------------------ */
/*  Settings (per-user, keyed by userId)                               */
/* ------------------------------------------------------------------ */

export async function getSettings(userId: string): Promise<UserSettings> {
  const db = await getDB();
  const s = await db.get('settings', userId);
  return s || defaultSettings(userId);
}

export async function putSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', settings);
}

export function defaultSettings(userId: string): UserSettings {
  return {
    id: userId,
    uiLanguage: 'en',
    dailyNewTarget: 10,
    dailyReviewTarget: 40,
    preferredExerciseMix: {
      recognition: 30, recall: 25, listening: 10,
      cloze: 10, reverseRecognition: 20, matchPairs: 5,
    },
    showVowelized: true,
    showTransliteration: true,
    arabicKeyboardMode: 'transliteration',
    openaiModel: 'gpt-4o-mini',
    ttsModel: 'google-tts',
    ttsVoice: 'ar-XA-Standard-A',
  };
}

/* ------------------------------------------------------------------ */
/*  Stats (per-user per-day)                                           */
/* ------------------------------------------------------------------ */

function statsKey(userId: string, date: string): string {
  return `${userId}_${date}`;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getStats(userId: string, date: string): Promise<SessionStats | undefined> {
  const db = await getDB();
  return db.get('stats', statsKey(userId, date));
}

export async function getAllStatsForUser(userId: string): Promise<SessionStats[]> {
  const db = await getDB();
  return db.getAllFromIndex('stats', 'by-user', userId);
}

export async function putStats(stats: SessionStats): Promise<void> {
  const db = await getDB();
  await db.put('stats', stats);
}

export async function getTodayStats(userId: string): Promise<SessionStats> {
  const date = todayKey();
  const existing = await getStats(userId, date);
  return existing || {
    id: statsKey(userId, date),
    userId,
    date,
    reviewsDone: 0,
    newLearned: 0,
    accuracyByMode: {},
    timeSpentSeconds: 0,
    streak: 0,
  };
}

export async function updateTodayStats(userId: string, update: Partial<SessionStats>): Promise<void> {
  const current = await getTodayStats(userId);
  await putStats({ ...current, ...update });
}

/* ------------------------------------------------------------------ */
/*  Tutor sessions (per-user)                                          */
/* ------------------------------------------------------------------ */

export async function getTutorSession(id: string): Promise<TutorSession | undefined> {
  const db = await getDB();
  return db.get('tutorSessions', id);
}

export async function getAllTutorSessionsForUser(userId: string): Promise<TutorSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('tutorSessions', 'by-user', userId);
}

export async function putTutorSession(session: TutorSession): Promise<void> {
  const db = await getDB();
  await db.put('tutorSessions', session);
}

/* ------------------------------------------------------------------ */
/*  Audio cache (global)                                               */
/* ------------------------------------------------------------------ */

export async function getCachedAudio(itemId: string, type: 'word' | 'example'): Promise<AudioCacheEntry | undefined> {
  const db = await getDB();
  return db.get('audioCache', `${itemId}:${type}`);
}

export async function putCachedAudio(entry: AudioCacheEntry): Promise<void> {
  const db = await getDB();
  const key = `${entry.itemId}:${entry.type}`;
  await db.put('audioCache', { ...entry, cacheKey: key });
}

/* ------------------------------------------------------------------ */
/*  Data export / import (per-user)                                    */
/* ------------------------------------------------------------------ */

export async function exportUserData(userId: string): Promise<string> {
  const [words, srs, stats, settings] = await Promise.all([
    getAllWords(),
    getAllSRSForUser(userId),
    getAllStatsForUser(userId),
    getSettings(userId),
  ]);
  return JSON.stringify({ words, srs, stats, settings }, null, 2);
}

export async function importUserData(userId: string, json: string): Promise<void> {
  const data = JSON.parse(json);
  const db = await getDB();

  if (data.words) {
    const tx = db.transaction('words', 'readwrite');
    for (const w of data.words) await tx.store.put(w);
    await tx.done;
  }
  if (data.srs) {
    const tx = db.transaction('srs', 'readwrite');
    for (const s of data.srs) {
      await tx.store.put({ ...s, userId, id: srsKey(userId, s.itemId) });
    }
    await tx.done;
  }
  if (data.stats) {
    const tx = db.transaction('stats', 'readwrite');
    for (const s of data.stats) {
      await tx.store.put({ ...s, userId, id: statsKey(userId, s.date) });
    }
    await tx.done;
  }
  if (data.settings) {
    await db.put('settings', { ...data.settings, id: userId });
  }
}

/* ------------------------------------------------------------------ */
/*  Reset (per-user)                                                   */
/* ------------------------------------------------------------------ */

export async function resetUserData(userId: string): Promise<void> {
  const db = await getDB();

  const srsItems = await getAllSRSForUser(userId);
  const srsTx = db.transaction('srs', 'readwrite');
  for (const s of srsItems) await srsTx.store.delete(s.id);
  await srsTx.done;

  const statsItems = await getAllStatsForUser(userId);
  const statsTx = db.transaction('stats', 'readwrite');
  for (const s of statsItems) await statsTx.store.delete(s.id);
  await statsTx.done;

  await db.delete('settings', userId);
}
