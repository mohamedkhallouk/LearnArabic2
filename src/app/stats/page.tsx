'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/components/providers';
import { t, getTranslation } from '@/lib/i18n';
import { getAllStatsForUser } from '@/lib/db';
import { getItemStatus } from '@/lib/srs';
import { SessionStats } from '@/types';

export default function StatsPage() {
  const { userId, settings, words, srsMap, getStatusCounts } = useApp();
  const lang = settings.uiLanguage;
  const [allStats, setAllStats] = useState<SessionStats[]>([]);

  useEffect(() => {
    getAllStatsForUser(userId).then(setAllStats);
  }, [userId]);

  const counts = useMemo(() => getStatusCounts(), [getStatusCounts]);

  const weakItems = useMemo(() => {
    return words
      .map(w => ({ word: w, srs: srsMap.get(w.id) }))
      .filter(({ srs }) => srs && srs.lapses >= 2)
      .sort((a, b) => (b.srs?.lapses ?? 0) - (a.srs?.lapses ?? 0))
      .slice(0, 20);
  }, [words, srsMap]);

  const totalReviews = allStats.reduce((sum, s) => sum + s.reviewsDone, 0);
  const totalNew = allStats.reduce((sum, s) => sum + s.newLearned, 0);
  const totalTime = allStats.reduce((sum, s) => sum + s.timeSpentSeconds, 0);
  const activeDays = allStats.filter(s => s.reviewsDone > 0).length;

  // Calculate current streak
  const sortedDates = allStats
    .filter(s => s.reviewsDone > 0)
    .map(s => s.date)
    .sort()
    .reverse();

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  if (sortedDates.length > 0) {
    const checkDate = new Date(today);
    for (let i = 0; i < 365; i++) {
      const key = checkDate.toISOString().slice(0, 10);
      if (sortedDates.includes(key)) {
        streak++;
      } else if (i > 0) {
        break;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
  }

  // Recent 7 days chart data
  const last7 = useMemo(() => {
    const days: { date: string; reviews: number; newCount: number }[] = [];
    const d = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(d);
      date.setDate(date.getDate() - i);
      const key = date.toISOString().slice(0, 10);
      const stat = allStats.find(s => s.date === key);
      days.push({
        date: date.toLocaleDateString(lang === 'nl' ? 'nl-NL' : 'en-US', { weekday: 'short' }),
        reviews: stat?.reviewsDone ?? 0,
        newCount: stat?.newLearned ?? 0,
      });
    }
    return days;
  }, [allStats, lang]);

  const maxReviews = Math.max(...last7.map(d => d.reviews), 1);

  return (
    <div className="p-4 page-enter">
      <header className="pt-4 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('stats.title', lang)}</h1>
      </header>

      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-brand-600">{totalReviews}</div>
          <div className="text-xs text-gray-500">{t('stats.reviews', lang)}</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-emerald-600">{totalNew}</div>
          <div className="text-xs text-gray-500">{t('stats.newLearned', lang)}</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-600">{streak}</div>
          <div className="text-xs text-gray-500">{t('home.streak', lang)}</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-gray-700">{Math.round(totalTime / 60)}</div>
          <div className="text-xs text-gray-500">{t('stats.time', lang)} ({t('stats.minutes', lang)})</div>
        </div>
      </div>

      {/* Distribution bar */}
      <div className="card mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">{t('stats.distribution', lang)}</h3>
        <div className="space-y-2">
          {([
            { label: t('library.mastered', lang), count: counts.masteredCount, color: 'bg-emerald-400' },
            { label: t('library.learning', lang), count: counts.learningCount, color: 'bg-amber-400' },
            { label: t('library.due', lang), count: counts.dueCount, color: 'bg-orange-400' },
            { label: t('library.new', lang), count: counts.newCount, color: 'bg-gray-300' },
          ] as const).map(({ label, count, color }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="w-16 text-xs text-gray-500 text-right">{label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                <div
                  className={`${color} h-full rounded-full transition-all`}
                  style={{ width: counts.total > 0 ? `${(count / counts.total) * 100}%` : '0%' }}
                />
              </div>
              <div className="w-10 text-xs text-gray-600 font-medium">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7-day chart */}
      <div className="card mb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          {lang === 'nl' ? 'Afgelopen 7 dagen' : 'Last 7 days'}
        </h3>
        <div className="flex items-end gap-2 h-32">
          {last7.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="text-[10px] text-gray-500 font-medium">{day.reviews}</div>
              <div className="w-full flex flex-col justify-end flex-1">
                <div
                  className="bg-brand-400 rounded-t-md w-full transition-all min-h-[2px]"
                  style={{ height: `${(day.reviews / maxReviews) * 100}%` }}
                />
              </div>
              <div className="text-[10px] text-gray-400">{day.date}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Weak items */}
      {weakItems.length > 0 && (
        <div className="card">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{t('stats.weakItems', lang)}</h3>
          <div className="space-y-2">
            {weakItems.map(({ word, srs }) => (
              <div key={word.id} className="flex items-center justify-between py-1">
                <div>
                  <span className="arabic-text text-sm">{word.arabic_raw}</span>
                  <span className="text-xs text-gray-500 ml-2">{getTranslation(word, lang)}</span>
                </div>
                <span className="text-xs text-red-500 font-medium">{srs?.lapses} lapses</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
