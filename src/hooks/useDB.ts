'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WordItem, SRSState, DailyPlan } from '@/types';
import * as db from '@/lib/db';
import { createInitialSRS, isDue, isNew, isMastered } from '@/lib/srs';
import { buildWordList } from '@/data/words';

function seededShuffle<T>(arr: T[], seed: string): T[] {
  const out = [...arr];
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
  }
  for (let i = out.length - 1; i > 0; i--) {
    h = ((h << 5) - h + i) | 0;
    const j = Math.abs(h) % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function useDatabase(userId: string | null) {
  const [words, setWords] = useState<WordItem[]>([]);
  const [srsMap, setSrsMap] = useState<Map<string, SRSState>>(new Map());
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const loadAll = useCallback(async () => {
    if (!userId) {
      setWords([]);
      setSrsMap(new Map());
      setLoading(false);
      setInitialized(false);
      return;
    }

    try {
      const allWords = await db.getAllWords();
      const allSRS = await db.getAllSRSForUser(userId);
      setWords(allWords);
      const map = new Map<string, SRSState>();
      for (const s of allSRS) map.set(s.itemId, s);
      setSrsMap(map);
      setLoading(false);
      setInitialized(allWords.length > 0);
    } catch {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    setLoading(true);
    loadAll();
  }, [loadAll]);

  const initializeWordList = useCallback(async () => {
    if (!userId) return;
    const items = buildWordList();
    const srsStates = items.map(w => createInitialSRS(userId, w.id));

    await db.putWords(items);
    await db.putManySRS(srsStates);
    await loadAll();
  }, [userId, loadAll]);

  const shuffledWords = useMemo(
    () => (userId ? seededShuffle(words, userId) : words),
    [words, userId],
  );

  const getDailyPlan = useCallback((dailyNewTarget: number, dailyReviewTarget: number): DailyPlan => {
    const newItems: Array<{ word: WordItem; srs: SRSState }> = [];
    const reviewItems: Array<{ word: WordItem; srs: SRSState }> = [];
    const extraItems: Array<{ word: WordItem; srs: SRSState }> = [];

    for (const word of shuffledWords) {
      const srs = srsMap.get(word.id);
      if (!srs) continue;

      if (isNew(srs)) {
        if (newItems.length < dailyNewTarget) {
          newItems.push({ word, srs });
        } else {
          extraItems.push({ word, srs });
        }
      } else if (isDue(srs)) {
        if (reviewItems.length < dailyReviewTarget) {
          reviewItems.push({ word, srs });
        } else {
          extraItems.push({ word, srs });
        }
      } else if (!isNew(srs) && !isMastered(srs)) {
        extraItems.push({ word, srs });
      }
    }

    reviewItems.sort((a, b) => a.srs.dueAt - b.srs.dueAt);
    return { newItems, reviewItems, extraItems };
  }, [shuffledWords, srsMap]);

  const updateWord = useCallback(async (word: WordItem) => {
    await db.putWord(word);
    setWords(prev => prev.map(w => w.id === word.id ? word : w));
  }, []);

  const updateSRS = useCallback(async (state: SRSState) => {
    await db.putSRS(state);
    setSrsMap(prev => {
      const next = new Map(prev);
      next.set(state.itemId, state);
      return next;
    });
  }, []);

  const getStatusCounts = useCallback(() => {
    let newCount = 0, learningCount = 0, dueCount = 0, masteredCount = 0;
    for (const srs of srsMap.values()) {
      if (isNew(srs)) newCount++;
      else if (isMastered(srs)) masteredCount++;
      else if (isDue(srs)) dueCount++;
      else learningCount++;
    }
    return { newCount, learningCount, dueCount, masteredCount, total: words.length };
  }, [words, srsMap]);

  return {
    words, srsMap, loading, initialized,
    initializeWordList, getDailyPlan, updateWord, updateSRS,
    getStatusCounts, loadAll,
  };
}
