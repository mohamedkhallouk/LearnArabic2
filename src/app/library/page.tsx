'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/providers';
import { t, getTranslation } from '@/lib/i18n';
import { getItemStatus, ItemStatus } from '@/lib/srs';
import { normalizeArabic } from '@/lib/arabic';
import { enrichWord, applyEnrichment } from '@/lib/enrichment';
import AudioButton from '@/components/audio-button';

const STATUS_BADGES: Record<ItemStatus, string> = {
  new: 'badge-new',
  learning: 'badge-learning',
  due: 'badge-due',
  mastered: 'badge-mastered',
};

export default function LibraryPage() {
  const { settings, apiKey, words, srsMap, updateWord } = useApp();
  const lang = settings.uiLanguage;
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | ItemStatus>('all');
  const [batchGenerating, setBatchGenerating] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  const filteredWords = useMemo(() => {
    let list = words;

    if (filter !== 'all') {
      list = list.filter(w => {
        const srs = srsMap.get(w.id);
        return srs && getItemStatus(srs) === filter;
      });
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const qAr = normalizeArabic(q);
      list = list.filter(w => {
        if (normalizeArabic(w.arabic_raw).includes(qAr)) return true;
        if (w.transliteration.toLowerCase().includes(q)) return true;
        if (w.english.toLowerCase().includes(q)) return true;
        if (w.dutch.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    return list;
  }, [words, srsMap, filter, search]);

  const handleBatchGenerate = useCallback(async () => {
    if (!apiKey || batchGenerating) return;
    const missing = words.filter(w => !w.aiGenerated && !w.aiError);
    if (missing.length === 0) return;

    setBatchGenerating(true);
    setBatchProgress({ done: 0, total: missing.length });
    abortRef.current = false;

    for (let i = 0; i < missing.length; i++) {
      if (abortRef.current) break;
      try {
        const data = await enrichWord(missing[i], apiKey, settings.openaiModel);
        const enriched = applyEnrichment(missing[i], data);
        await updateWord(enriched);
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      } catch {
        await updateWord({ ...missing[i], aiError: true, updatedAt: Date.now() });
        setBatchProgress(prev => ({ ...prev, done: prev.done + 1 }));
      }
      // Rate limit: ~2 requests per second
      await new Promise(r => setTimeout(r, 500));
    }

    setBatchGenerating(false);
  }, [apiKey, words, settings.openaiModel, updateWord, batchGenerating]);

  const filters: Array<{ value: 'all' | ItemStatus; label: string }> = [
    { value: 'all', label: t('library.all', lang) },
    { value: 'new', label: t('library.new', lang) },
    { value: 'learning', label: t('library.learning', lang) },
    { value: 'due', label: t('library.due', lang) },
    { value: 'mastered', label: t('library.mastered', lang) },
  ];

  return (
    <div className="p-4 page-enter">
      <header className="pt-4 pb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('library.title', lang)}</h1>
        {apiKey && (
          <button
            onClick={batchGenerating ? () => { abortRef.current = true; } : handleBatchGenerate}
            className={batchGenerating ? 'btn-danger text-xs' : 'btn-secondary text-xs'}
          >
            {batchGenerating
              ? `${batchProgress.done}/${batchProgress.total} — Cancel`
              : t('library.generateAll', lang)}
          </button>
        )}
      </header>

      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder={t('library.search', lang)}
        className="input mb-4"
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap
              ${filter === f.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-400 mb-2">
        {filteredWords.length} {lang === 'nl' ? 'woorden' : 'words'}
      </div>

      <div className="space-y-2">
        {filteredWords.map(word => {
          const srs = srsMap.get(word.id);
          const status = srs ? getItemStatus(srs) : 'new';
          const displayArabic = settings.showVowelized && word.arabic_vowelized ? word.arabic_vowelized : word.arabic_raw;
          const meaning = getTranslation(word, lang);

          return (
            <Link
              key={word.id}
              href={`/library/${word.id}`}
              className="card flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="arabic-text text-2xl font-medium truncate">{displayArabic}</span>
                  {word.transliteration && (
                    <span className="text-xs text-gray-400 truncate">{word.transliteration}</span>
                  )}
                </div>
                {meaning ? (
                  <div className="text-sm text-gray-600 truncate">{meaning}</div>
                ) : (
                  <div className="text-sm text-gray-400 italic truncate">{word.transliteration || '—'}</div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.preventDefault()}>
                <AudioButton itemId={word.id} text={displayArabic} type="word" size="sm" />
                <span className={`badge ${STATUS_BADGES[status]}`}>{status}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
