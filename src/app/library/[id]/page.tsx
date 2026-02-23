'use client';

import React, { useCallback, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/providers';
import { t, getTranslation } from '@/lib/i18n';
import { getItemStatus } from '@/lib/srs';
import { createInitialSRS } from '@/lib/srs';
import { enrichWord, applyEnrichment } from '@/lib/enrichment';
import AudioButton from '@/components/audio-button';

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userId, settings, apiKey, words, srsMap, updateWord, updateSRS } = useApp();
  const lang = settings.uiLanguage;
  const [regenerating, setRegenerating] = useState(false);

  const word = words.find(w => w.id === params.id);
  const srs = word ? srsMap.get(word.id) : undefined;

  const handleRegenerate = useCallback(async () => {
    if (!word || !apiKey || regenerating) return;
    setRegenerating(true);
    try {
      const data = await enrichWord(word, apiKey, settings.openaiModel);
      const enriched = applyEnrichment(word, data);
      await updateWord(enriched);
    } catch {
      // Silent fail
    }
    setRegenerating(false);
  }, [word, apiKey, settings.openaiModel, updateWord, regenerating]);

  const handleResetProgress = useCallback(async () => {
    if (!word) return;
    const initial = createInitialSRS(userId, word.id);
    await updateSRS(initial);
  }, [userId, word, updateSRS]);

  if (!word) {
    return (
      <div className="p-4 text-center mt-20">
        <p className="text-gray-500">Word not found</p>
        <button onClick={() => router.back()} className="btn-primary mt-4">{t('common.back', lang)}</button>
      </div>
    );
  }

  const displayArabic = settings.showVowelized && word.arabic_vowelized ? word.arabic_vowelized : word.arabic_raw;
  const status = srs ? getItemStatus(srs) : 'new';
  const otherLang = lang === 'en' ? 'nl' : 'en';
  const otherTranslation = otherLang === 'nl' ? word.dutch : word.english;

  return (
    <div className="p-4 page-enter">
      <div className="flex items-center gap-3 pt-4 pb-6">
        <button onClick={() => router.back()} className="btn-ghost p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('library.detail', lang)}</h1>
      </div>

      {/* Main word card */}
      <div className="card text-center py-8 mb-4">
        <div className="arabic-large mb-1">{displayArabic}</div>
        <div className="text-gray-500 text-sm mb-1">{word.arabic_raw}</div>
        {word.transliteration && <div className="text-gray-400 text-sm mb-3">{word.transliteration}</div>}
        <div className="flex justify-center gap-2 mb-4">
          <AudioButton itemId={word.id} text={displayArabic} type="word" />
        </div>
        <div className="text-lg font-medium text-gray-900">{getTranslation(word, lang)}</div>
        {otherTranslation && (
          <div className="text-sm text-gray-500 mt-1">
            ({t(otherLang === 'nl' ? 'common.dutch' : 'common.english', lang)}: {otherTranslation})
          </div>
        )}
        {word.pos && (
          <div className="mt-2">
            <span className="badge bg-gray-100 text-gray-600">{word.pos}</span>
          </div>
        )}
      </div>

      {/* Details */}
      {word.aiGenerated ? (
        <div className="space-y-3">
          {/* Examples */}
          {word.examples && word.examples.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('library.example', lang)}</h3>
              <div className="space-y-3">
                {word.examples.map((ex, i) => (
                  <div key={i}>
                    <div className="arabic-medium text-gray-800">{ex.ar}</div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {lang === 'nl' ? ex.nl || ex.en : ex.en || ex.nl}
                    </div>
                    {i === 0 && (
                      <div className="flex mt-1">
                        <AudioButton itemId={word.id} text={ex.ar} type="example" size="sm" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Synonyms */}
          {word.synonyms_ar.length > 0 && (
            <div className="card">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('library.synonyms', lang)}</h3>
              <div className="space-y-1">
                {word.synonyms_ar.map((syn, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="arabic-text text-gray-800">{syn}</span>
                    <span className="text-sm text-gray-500">
                      {lang === 'nl' ? word.synonyms_nl[i] : word.synonyms_en[i]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {word.notes && (
            <div className="card">
              <h3 className="text-xs font-medium text-gray-500 uppercase mb-2">{t('library.notes', lang)}</h3>
              <p className="text-sm text-gray-700">{word.notes}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card text-center py-6 text-gray-400">
          <p>{t('library.noAI', lang)}</p>
          {apiKey && (
            <button onClick={handleRegenerate} className="btn-primary mt-3 text-sm" disabled={regenerating}>
              {regenerating ? t('library.generating', lang) : t('library.regenerate', lang)}
            </button>
          )}
        </div>
      )}

      {/* SRS info & actions */}
      {srs && (
        <div className="card mt-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Status:</span> <span className="font-medium">{status}</span></div>
            <div><span className="text-gray-500">Reviews:</span> <span className="font-medium">{srs.totalReviews}</span></div>
            <div><span className="text-gray-500">Streak:</span> <span className="font-medium">{srs.successStreak}</span></div>
            <div><span className="text-gray-500">Interval:</span> <span className="font-medium">{srs.intervalDays}d</span></div>
            <div><span className="text-gray-500">Ease:</span> <span className="font-medium">{srs.easeFactor.toFixed(2)}</span></div>
            <div><span className="text-gray-500">Lapses:</span> <span className="font-medium">{srs.lapses}</span></div>
          </div>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        {apiKey && word.aiGenerated && (
          <button onClick={handleRegenerate} className="btn-secondary flex-1 text-sm" disabled={regenerating}>
            {regenerating ? t('library.generating', lang) : t('library.regenerate', lang)}
          </button>
        )}
        <button onClick={handleResetProgress} className="btn-danger flex-1 text-sm">
          {t('library.resetProgress', lang)}
        </button>
      </div>
    </div>
  );
}
