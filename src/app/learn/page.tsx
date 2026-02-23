'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import { t, getTranslation } from '@/lib/i18n';
import { updateSRS as srsUpdate } from '@/lib/srs';
import { arabicMatch, gradeArabicAnswer } from '@/lib/arabic';
import { enrichWord, applyEnrichment, generateMoreExamples } from '@/lib/enrichment';
import { updateTodayStats, getTodayStats } from '@/lib/db';
import AudioButton from '@/components/audio-button';
import ArabicInput from '@/components/arabic-keyboard';
import { WordItem, SRSState, ExerciseType, ExampleSentence } from '@/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type StepKind = 'intro' | 'exercise';

interface QueueItem {
  word: WordItem;
  srs: SRSState;
  isNew: boolean;
  step: StepKind;
  exerciseType: ExerciseType;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickExerciseForNew(): ExerciseType {
  return 'recognition';
}

function pickReinforceExercise(): ExerciseType {
  const pool: ExerciseType[] = ['reverseRecognition', 'recall'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function pickExerciseForReview(srs: SRSState, hasExamples: boolean): ExerciseType {
  const isWeak = srs.easeFactor < 2.0 || srs.lapses > 2;
  const isStrong = srs.easeFactor >= 2.5 && srs.successStreak >= 3;

  if (isWeak) {
    const pool: ExerciseType[] = ['recognition', 'reverseRecognition'];
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (isStrong) {
    const pool: ExerciseType[] = ['recall', 'reverseRecognition'];
    if (hasExamples) pool.push('cloze', 'listening');
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const pool: ExerciseType[] = ['recognition', 'reverseRecognition', 'recall'];
  if (hasExamples) pool.push('cloze', 'listening');
  return pool[Math.floor(Math.random() * pool.length)];
}

function buildSessionQueue(
  newItems: Array<{ word: WordItem; srs: SRSState }>,
  reviewItems: Array<{ word: WordItem; srs: SRSState }>,
): QueueItem[] {
  const queue: QueueItem[] = [];

  const newPairs: QueueItem[][] = newItems.map(item => [
    { word: item.word, srs: item.srs, isNew: true, step: 'intro', exerciseType: 'recognition' },
    { word: item.word, srs: item.srs, isNew: true, step: 'exercise', exerciseType: pickExerciseForNew() },
  ]);

  const reviews: QueueItem[] = reviewItems.map(item => ({
    word: item.word, srs: item.srs, isNew: false, step: 'exercise' as StepKind,
    exerciseType: pickExerciseForReview(item.srs, item.word.examples?.length > 0),
  }));

  const shuffledReviews = shuffleArray(reviews);

  // Interleave: for every 2-3 reviews, insert a new-word pair (intro + exercise)
  let ri = 0;
  for (let ni = 0; ni < newPairs.length; ni++) {
    const gap = Math.min(3, Math.ceil(shuffledReviews.length / Math.max(1, newPairs.length)));
    for (let g = 0; g < gap && ri < shuffledReviews.length; g++) {
      queue.push(shuffledReviews[ri++]);
    }
    queue.push(newPairs[ni][0]); // intro
    queue.push(newPairs[ni][1]); // first exercise

    // Schedule reinforcement later
    const reinforceIdx = queue.length + 4 + Math.floor(Math.random() * 4);
    const reinforceItem: QueueItem = {
      word: newPairs[ni][0].word,
      srs: newPairs[ni][0].srs,
      isNew: false,
      step: 'exercise',
      exerciseType: pickReinforceExercise(),
    };
    queue.splice(Math.min(reinforceIdx, queue.length), 0, reinforceItem);
  }

  // Remaining reviews
  while (ri < shuffledReviews.length) {
    queue.push(shuffledReviews[ri++]);
  }

  return queue;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function LearnPage() {
  const router = useRouter();
  const { userId, settings, apiKey, words, srsMap, getDailyPlan, updateWord, updateSRS } = useApp();
  const lang = settings.uiLanguage;
  const sessionStart = useRef(Date.now());
  const queueBuilt = useRef(false);

  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'feedback' | 'done'>('ready');
  const [answer, setAnswer] = useState('');
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState<boolean | null>(null);
  const [correctIdx, setCorrectIdx] = useState<number>(-1);
  const [choices, setChoices] = useState<string[]>([]);
  const [arabicChoices, setArabicChoices] = useState<string[]>([]);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, newLearned: 0, correct: 0 });
  const [enriching, setEnriching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Build queue exactly once
  useEffect(() => {
    if (queueBuilt.current || words.length === 0) return;
    queueBuilt.current = true;

    const plan = getDailyPlan(settings.dailyNewTarget, settings.dailyReviewTarget);
    const q = buildSessionQueue(plan.newItems, plan.reviewItems);
    setQueue(q);
  }, [words, getDailyPlan, settings.dailyNewTarget, settings.dailyReviewTarget]);

  const cur = queue[idx] as QueueItem | undefined;

  // Enrich new words in background
  useEffect(() => {
    if (!cur || cur.step !== 'intro' || cur.word.aiGenerated || !apiKey || enriching) return;
    setEnriching(true);
    enrichWord(cur.word, apiKey, settings.openaiModel)
      .then(data => {
        const enriched = applyEnrichment(cur.word, data);
        updateWord(enriched);
        setQueue(prev => prev.map((q, i) =>
          q.word.id === enriched.id ? { ...q, word: enriched } : q
        ));
      })
      .catch(() => {})
      .finally(() => setEnriching(false));
  }, [cur?.word.id, cur?.step, apiKey, settings.openaiModel, updateWord, enriching]);

  // Build multiple-choice options when current exercise changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!cur || cur.step === 'intro') return;

    setAnswer('');
    setPicked(null);
    setCorrect(null);
    setCorrectIdx(-1);
    setPhase('ready');

    const curMeaning = getTranslation(cur.word, lang) || cur.word.transliteration || '—';
    const type = cur.exerciseType;

    if (type === 'recognition' || type === 'listening') {
      const pool = words
        .filter(w => w.id !== cur.word.id && getTranslation(w, lang))
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => getTranslation(w, lang));
      const all = shuffleArray([curMeaning, ...pool]);
      setChoices(all);
      setCorrectIdx(all.indexOf(curMeaning));
    }

    if (type === 'reverseRecognition') {
      const curAr = cur.word.arabic_vowelized || cur.word.arabic_raw;
      const pool = words
        .filter(w => w.id !== cur.word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.arabic_vowelized || w.arabic_raw);
      const all = shuffleArray([curAr, ...pool]);
      setArabicChoices(all);
      setCorrectIdx(all.indexOf(curAr));
    }
  }, [idx]);

  /* ---- Actions ---- */

  const advance = useCallback(async (wasCorrect: boolean) => {
    if (!cur) return;

    let addedExtra = 0;

    // Only update SRS for exercise steps, not intros
    if (cur.step === 'exercise') {
      const grade = wasCorrect ? 4 : 1;
      const newSRS = srsUpdate(cur.srs, grade as 0 | 1 | 2 | 3 | 4 | 5);
      await updateSRS(newSRS);

      const s = { ...sessionStats };
      s.reviewed++;
      if (wasCorrect) s.correct++;
      if (cur.isNew) s.newLearned++;
      setSessionStats(s);

      const today = await getTodayStats(userId);
      await updateTodayStats(userId, {
        reviewsDone: today.reviewsDone + 1,
        newLearned: today.newLearned + (cur.isNew ? 1 : 0),
        timeSpentSeconds: Math.round((Date.now() - sessionStart.current) / 1000),
      });

      // Wrong answer → re-queue this word a few items later with an easier exercise
      if (!wasCorrect) {
        addedExtra = 1;
        const reinsertAt = Math.min(idx + 3 + Math.floor(Math.random() * 3), queue.length);
        const retry: QueueItem = {
          word: cur.word,
          srs: { ...cur.srs },
          isNew: false,
          step: 'exercise',
          exerciseType: 'recognition',
        };
        setQueue(prev => {
          const next = [...prev];
          next.splice(reinsertAt, 0, retry);
          return next;
        });
      }
    }

    // Move to next item
    const nextIdx = idx + 1;
    if (nextIdx >= queue.length + addedExtra) {
      setPhase('done');
    } else {
      setIdx(nextIdx);
      setPhase('ready');
      setAnswer('');
      setPicked(null);
      setCorrect(null);
    }
  }, [cur, idx, queue, sessionStats, updateSRS]);

  const handleNext = useCallback(() => {
    if (cur?.step === 'intro') {
      // Intro done, move to next item (which is the first exercise for this word)
      const nextIdx = idx + 1;
      if (nextIdx >= queue.length) {
        setPhase('done');
      } else {
        setIdx(nextIdx);
        setPhase('ready');
      }
    } else {
      advance(correct ?? false);
    }
  }, [cur, idx, queue.length, advance, correct]);

  const handleChoice = useCallback((i: number) => {
    if (picked !== null) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    setCorrect(isCorrect);
    setPhase('feedback');
  }, [picked, correctIdx]);

  const handleTypedSubmit = useCallback(() => {
    if (!cur || !answer.trim()) return;
    const grade = gradeArabicAnswer(answer, cur.word.arabic_raw);
    setCorrect(grade >= 3);
    setPhase('feedback');
  }, [cur, answer]);

  const handleClozeSubmit = useCallback(() => {
    if (!cur || !answer.trim()) return;
    setCorrect(arabicMatch(answer, cur.word.arabic_raw));
    setPhase('feedback');
  }, [cur, answer]);

  const handleReveal = useCallback(() => {
    setCorrect(false);
    setPhase('feedback');
  }, []);

  const handleGenerateMore = useCallback(async () => {
    if (!cur || !apiKey || loadingMore) return;
    setLoadingMore(true);
    try {
      const newExamples = await generateMoreExamples(cur.word, apiKey, settings.openaiModel);
      const updated = { ...cur.word, examples: [...cur.word.examples, ...newExamples] };
      await updateWord(updated);
      setQueue(prev => prev.map(q =>
        q.word.id === updated.id ? { ...q, word: updated } : q
      ));
    } catch {}
    setLoadingMore(false);
  }, [cur, apiKey, settings.openaiModel, updateWord, loadingMore]);

  /* ---- Derived values ---- */

  const totalSteps = queue.length;
  const progress = totalSteps > 0 ? ((idx + 1) / totalSteps) * 100 : 0;

  /* ---- RENDER ---- */

  // Empty / loading
  if (queue.length === 0) {
    if (!queueBuilt.current) {
      return (
        <div className="p-4 flex items-center justify-center min-h-[60vh]">
          <div className="text-gray-400 animate-pulse">{t('common.loading', lang)}</div>
        </div>
      );
    }
    return (
      <div className="p-4 page-enter flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{t('home.noReviews', lang)}</h2>
        <p className="text-gray-500 text-sm mb-6">
          {lang === 'nl' ? 'Kom later terug of verhoog je dagelijkse doelen.' : 'Come back later or increase your daily targets.'}
        </p>
        <button onClick={() => router.push('/')} className="btn-primary">{t('common.back', lang)}</button>
      </div>
    );
  }

  // Session complete
  if (phase === 'done') {
    const pct = sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0;
    return (
      <div className="p-4 page-enter flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">{t('learn.done', lang)}</h2>
        <p className="text-gray-500 mb-6">{t('learn.doneDesc', lang)}</p>
        <div className="grid grid-cols-3 gap-4 mb-8 w-full max-w-xs">
          <div className="card text-center">
            <div className="text-xl font-bold">{sessionStats.reviewed}</div>
            <div className="text-xs text-gray-500">{t('stats.reviews', lang)}</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold">{sessionStats.newLearned}</div>
            <div className="text-xs text-gray-500">{t('stats.newLearned', lang)}</div>
          </div>
          <div className="card text-center">
            <div className="text-xl font-bold">{pct}%</div>
            <div className="text-xs text-gray-500">{t('stats.accuracy', lang)}</div>
          </div>
        </div>
        <button onClick={() => router.push('/')} className="btn-primary">{t('common.back', lang)}</button>
      </div>
    );
  }

  if (!cur) return null;

  const w = cur.word;
  const displayAr = settings.showVowelized && w.arabic_vowelized ? w.arabic_vowelized : w.arabic_raw;
  const tr = w.transliteration;
  const meaning = getTranslation(w, lang) || w.transliteration || '—';
  const examples = w.examples || [];

  /* ---- Progress bar ---- */
  const progressBar = (
    <div className="flex items-center gap-3 mb-5">
      <button onClick={() => router.push('/')} className="btn-ghost p-1">
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-brand-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{idx + 1}/{totalSteps}</span>
    </div>
  );

  /* ---- Feedback banner (shown inline in exercise) ---- */
  const feedbackBanner = phase === 'feedback' && (
    <div className={`rounded-xl p-4 mb-4 border-2 text-center ${
      correct ? 'border-emerald-400 bg-emerald-50' : 'border-red-300 bg-red-50'
    }`}>
      <div className={`text-sm font-semibold mb-2 ${correct ? 'text-emerald-700' : 'text-red-600'}`}>
        {correct ? t('learn.correct', lang) : t('learn.incorrect', lang)}
      </div>
      <div className="arabic-large">{displayAr}</div>
      {tr && <div className="text-gray-500 text-sm mt-1">{tr}</div>}
      <div className="text-gray-800 font-medium mt-1">{meaning}</div>
      <div className="flex justify-center mt-2">
        <AudioButton itemId={w.id} text={displayAr} type="word" size="sm" />
      </div>
    </div>
  );

  return (
    <div className="p-4 page-enter">
      {progressBar}

      {/* ================ INTRO (new word) ================ */}
      {cur.step === 'intro' && (
        <div className="text-center page-enter">
          <span className="badge badge-new mb-3">{t('learn.newWord', lang)}</span>
          <div className="card mt-3 py-8">
            <div className="arabic-large mb-1">{displayAr}</div>
            {tr && <div className="text-gray-500 text-sm mb-3">{tr}</div>}
            <div className="flex justify-center mb-3">
              <AudioButton itemId={w.id} text={displayAr} type="word" />
            </div>
            <div className="text-xl font-semibold text-gray-900 mb-1">{meaning}</div>
            {w.pos && <span className="badge bg-gray-100 text-gray-500 text-xs">{w.pos}</span>}

            {/* Examples */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-left">
              {examples.length > 0 ? (
                <div className="space-y-3">
                  {examples.map((ex: ExampleSentence, i: number) => (
                    <div key={i} className="px-2">
                      <div className="arabic-text text-xl text-gray-800 leading-relaxed">{ex.ar}</div>
                      <div className="text-sm text-gray-500">{lang === 'nl' ? ex.nl || ex.en : ex.en || ex.nl}</div>
                    </div>
                  ))}
                  {apiKey && (
                    <button onClick={handleGenerateMore} disabled={loadingMore} className="text-xs text-brand-600 ml-2">
                      {loadingMore ? '...' : (lang === 'nl' ? '+ Meer voorbeelden' : '+ More examples')}
                    </button>
                  )}
                </div>
              ) : enriching ? (
                <div className="text-sm text-gray-400 animate-pulse text-center py-3">
                  {lang === 'nl' ? 'Voorbeelden genereren...' : 'Generating examples...'}
                </div>
              ) : apiKey ? (
                <button onClick={handleGenerateMore} disabled={loadingMore} className="text-xs text-brand-600 ml-2">
                  {loadingMore ? '...' : (lang === 'nl' ? '+ Voorbeelden genereren' : '+ Generate examples')}
                </button>
              ) : null}
            </div>
            {w.notes && <div className="text-xs text-gray-400 mt-4 italic px-2">{w.notes}</div>}
          </div>
          <button onClick={handleNext} className="btn-primary mt-5 w-full py-3 text-base">
            {lang === 'nl' ? 'Begrepen, oefen nu' : 'Got it, practice now'}
          </button>
        </div>
      )}

      {/* ================ EXERCISES ================ */}
      {cur.step === 'exercise' && (
        <div className="page-enter">

          {/* --- Recognition: Arabic → pick meaning --- */}
          {cur.exerciseType === 'recognition' && phase === 'ready' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.selectMeaning', lang)}</p>
              <div className="card text-center py-7 mb-5">
                <div className="arabic-large">{displayAr}</div>
                {tr && <div className="text-gray-400 text-sm mt-2">{tr}</div>}
                <div className="flex justify-center mt-3">
                  <AudioButton itemId={w.id} text={displayAr} type="word" size="sm" />
                </div>
              </div>
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <button key={i} onClick={() => handleChoice(i)}
                    className="choice-btn w-full text-left px-4 py-3 text-sm">
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {cur.exerciseType === 'recognition' && phase === 'feedback' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.selectMeaning', lang)}</p>
              <div className="card text-center py-7 mb-5">
                <div className="arabic-large">{displayAr}</div>
                {tr && <div className="text-gray-400 text-sm mt-2">{tr}</div>}
                <div className="flex justify-center mt-3">
                  <AudioButton itemId={w.id} text={displayAr} type="word" size="sm" />
                </div>
              </div>
              <div className="space-y-2 mb-5">
                {choices.map((c, i) => (
                  <div key={i} className={`choice-btn w-full text-left px-4 py-3 text-sm pointer-events-none
                    ${i === correctIdx ? 'correct' : ''}
                    ${picked === i && i !== correctIdx ? 'incorrect' : ''}`}>
                    {c}
                  </div>
                ))}
              </div>
              {feedbackBanner}
              <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
                {t('learn.next', lang)}
              </button>
            </>
          )}

          {/* --- Reverse Recognition: meaning → pick Arabic --- */}
          {cur.exerciseType === 'reverseRecognition' && phase === 'ready' && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                {lang === 'nl' ? 'Selecteer het juiste Arabische woord' : 'Select the correct Arabic word'}
              </p>
              <div className="card text-center py-7 mb-5">
                <div className="text-xl font-semibold text-gray-900">{meaning}</div>
                {w.pos && <div className="text-xs text-gray-400 mt-1">{w.pos}</div>}
              </div>
              <div className="space-y-2">
                {arabicChoices.map((c, i) => (
                  <button key={i} onClick={() => handleChoice(i)}
                    className="choice-btn w-full text-center px-4 py-4 arabic-text text-2xl">
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {cur.exerciseType === 'reverseRecognition' && phase === 'feedback' && (
            <>
              <p className="text-sm text-gray-500 mb-3">
                {lang === 'nl' ? 'Selecteer het juiste Arabische woord' : 'Select the correct Arabic word'}
              </p>
              <div className="card text-center py-7 mb-5">
                <div className="text-xl font-semibold text-gray-900">{meaning}</div>
                {w.pos && <div className="text-xs text-gray-400 mt-1">{w.pos}</div>}
              </div>
              <div className="space-y-2 mb-5">
                {arabicChoices.map((c, i) => (
                  <div key={i} className={`choice-btn w-full text-center px-4 py-4 arabic-text text-2xl pointer-events-none
                    ${i === correctIdx ? 'correct' : ''}
                    ${picked === i && i !== correctIdx ? 'incorrect' : ''}`}>
                    {c}
                  </div>
                ))}
              </div>
              {feedbackBanner}
              <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
                {t('learn.next', lang)}
              </button>
            </>
          )}

          {/* --- Recall: meaning → type Arabic --- */}
          {cur.exerciseType === 'recall' && phase === 'ready' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.typeArabic', lang)}</p>
              <div className="card text-center py-6 mb-5">
                <div className="text-xl font-semibold text-gray-900">{meaning}</div>
                {w.pos && <div className="text-xs text-gray-400 mt-1">{w.pos}</div>}
              </div>
              <ArabicInput value={answer} onChange={setAnswer} onSubmit={handleTypedSubmit}
                placeholder={t('learn.typeArabic', lang)} autoFocus />
              <div className="flex gap-2 mt-4">
                <button onClick={handleTypedSubmit} className="btn-primary flex-1"
                  disabled={!answer.trim()}>{t('learn.submit', lang)}</button>
                <button onClick={handleReveal} className="btn-secondary text-sm">
                  {t('learn.showAnswer', lang)}
                </button>
              </div>
            </>
          )}

          {cur.exerciseType === 'recall' && phase === 'feedback' && (
            <>
              {feedbackBanner}
              <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
                {t('learn.next', lang)}
              </button>
            </>
          )}

          {/* --- Listening: audio → pick meaning --- */}
          {cur.exerciseType === 'listening' && phase === 'ready' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.listenSelect', lang)}</p>
              <div className="card text-center py-8 mb-5">
                <AudioButton itemId={w.id} text={displayAr} type="word" />
                <p className="text-xs text-gray-400 mt-3">
                  {lang === 'nl' ? 'Luister en kies' : 'Listen and choose'}
                </p>
              </div>
              <div className="space-y-2">
                {choices.map((c, i) => (
                  <button key={i} onClick={() => handleChoice(i)}
                    className="choice-btn w-full text-left px-4 py-3 text-sm">
                    {c}
                  </button>
                ))}
              </div>
            </>
          )}

          {cur.exerciseType === 'listening' && phase === 'feedback' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.listenSelect', lang)}</p>
              <div className="card text-center py-8 mb-5">
                <AudioButton itemId={w.id} text={displayAr} type="word" />
              </div>
              <div className="space-y-2 mb-5">
                {choices.map((c, i) => (
                  <div key={i} className={`choice-btn w-full text-left px-4 py-3 text-sm pointer-events-none
                    ${i === correctIdx ? 'correct' : ''}
                    ${picked === i && i !== correctIdx ? 'incorrect' : ''}`}>
                    {c}
                  </div>
                ))}
              </div>
              {feedbackBanner}
              <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
                {t('learn.next', lang)}
              </button>
            </>
          )}

          {/* --- Cloze: example with blank → type word --- */}
          {cur.exerciseType === 'cloze' && phase === 'ready' && (
            <>
              <p className="text-sm text-gray-500 mb-3">{t('learn.fillBlank', lang)}</p>
              <div className="card py-6 mb-5">
                {examples.length > 0 ? (
                  <>
                    <div className="arabic-medium text-center leading-relaxed">
                      {examples[0].ar.replace(w.arabic_raw, ' _____ ').replace(displayAr, ' _____ ')}
                    </div>
                    <div className="text-sm text-gray-500 mt-2 text-center">
                      {lang === 'nl' ? examples[0].nl || examples[0].en : examples[0].en || examples[0].nl}
                    </div>
                  </>
                ) : (
                  <div className="arabic-medium text-center">_____</div>
                )}
                <div className="text-xs text-gray-400 mt-3 text-center">{t('learn.hint', lang)}: {meaning}</div>
              </div>
              <ArabicInput value={answer} onChange={setAnswer} onSubmit={handleClozeSubmit}
                placeholder={t('learn.typeArabic', lang)} autoFocus />
              <div className="flex gap-2 mt-4">
                <button onClick={handleClozeSubmit} className="btn-primary flex-1"
                  disabled={!answer.trim()}>{t('learn.submit', lang)}</button>
                <button onClick={handleReveal} className="btn-secondary text-sm">
                  {t('learn.showAnswer', lang)}
                </button>
              </div>
            </>
          )}

          {cur.exerciseType === 'cloze' && phase === 'feedback' && (
            <>
              {feedbackBanner}
              <button onClick={handleNext} className="btn-primary w-full py-3 text-base">
                {t('learn.next', lang)}
              </button>
            </>
          )}

        </div>
      )}
    </div>
  );
}
