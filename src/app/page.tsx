'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/providers';
import { t } from '@/lib/i18n';
import { getTodayStats } from '@/lib/db';
import { SessionStats } from '@/types';

export default function HomePage() {
  const { userId, settings, loading, initialized, words, getDailyPlan, getStatusCounts, apiKey, logout } = useApp();
  const lang = settings.uiLanguage;
  const [todayStats, setTodayStats] = useState<SessionStats | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (userId) getTodayStats(userId).then(setTodayStats);
  }, [userId]);

  useEffect(() => {
    if (!loading && !apiKey) {
      const dismissed = localStorage.getItem('learn-arabic-onboarding-done');
      if (!dismissed) setShowOnboarding(true);
    }
  }, [loading, apiKey]);

  const plan = useMemo(() => {
    if (!initialized) return null;
    return getDailyPlan(settings.dailyNewTarget, settings.dailyReviewTarget);
  }, [initialized, getDailyPlan, settings.dailyNewTarget, settings.dailyReviewTarget]);

  const counts = useMemo(() => getStatusCounts(), [getStatusCounts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">{t('common.loading', lang)}</div>
      </div>
    );
  }

  if (showOnboarding) {
    return (
      <div className="p-6 page-enter">
        <div className="text-center mt-12 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 arabic-text">تعلم العربية</h1>
          <h2 className="text-2xl font-bold text-gray-900">{t('onboarding.title', lang)}</h2>
          <p className="text-gray-500 mt-3 leading-relaxed">{t('onboarding.subtitle', lang)}</p>
        </div>

        <div className="space-y-4 mt-8">
          <div className="card">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">{t('onboarding.local', lang)}</p>
            </div>
          </div>

          <div className="card">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <p className="text-sm text-gray-600">{t('onboarding.aiFeatures', lang)}</p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <button
            onClick={() => { setShowOnboarding(false); localStorage.setItem('learn-arabic-onboarding-done', 'true'); }}
            className="btn-primary w-full"
          >
            {t('onboarding.startWithoutAI', lang)}
          </button>
          <Link
            href="/settings"
            onClick={() => { setShowOnboarding(false); localStorage.setItem('learn-arabic-onboarding-done', 'true'); }}
            className="btn-secondary w-full block text-center"
          >
            {t('onboarding.addKey', lang)}
          </Link>
        </div>
      </div>
    );
  }

  const reviewsDue = plan?.reviewItems.length ?? 0;
  const newReady = plan?.newItems.length ?? 0;
  const streak = todayStats?.streak ?? 0;

  return (
    <div className="p-4 page-enter">
      <header className="pt-4 pb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('home.title', lang)}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {words.length} {lang === 'nl' ? 'woorden' : 'words'} &middot; {counts.masteredCount} {t('home.mastered', lang).toLowerCase()}
          </p>
        </div>
        <button onClick={logout} className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded" title="Log out">
          {userId}
          <svg className="w-3.5 h-3.5 inline ml-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </button>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="card text-center">
          <div className="text-2xl font-bold text-brand-600">{reviewsDue}</div>
          <div className="text-xs text-gray-500">{t('home.reviewsDue', lang)}</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-emerald-600">{newReady}</div>
          <div className="text-xs text-gray-500">{t('home.newItems', lang)}</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-amber-600">{streak}</div>
          <div className="text-xs text-gray-500">{t('home.streak', lang)}</div>
        </div>
      </div>

      {/* Distribution */}
      <div className="card mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h3 className="text-sm font-medium text-gray-700">{t('stats.distribution', lang)}</h3>
        </div>
        <div className="flex rounded-full overflow-hidden h-3 bg-gray-100">
          {counts.total > 0 && (
            <>
              <div className="bg-emerald-400 transition-all" style={{ width: `${(counts.masteredCount / counts.total) * 100}%` }} />
              <div className="bg-amber-400 transition-all" style={{ width: `${(counts.learningCount / counts.total) * 100}%` }} />
              <div className="bg-orange-400 transition-all" style={{ width: `${(counts.dueCount / counts.total) * 100}%` }} />
              <div className="bg-gray-300 transition-all" style={{ width: `${(counts.newCount / counts.total) * 100}%` }} />
            </>
          )}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400" />{counts.masteredCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />{counts.learningCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400" />{counts.dueCount}</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />{counts.newCount}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {(reviewsDue > 0 || newReady > 0) ? (
          <Link href="/learn" className="btn-primary w-full block text-center text-lg py-3">
            {t('home.startSession', lang)}
          </Link>
        ) : (
          <div className="card text-center py-8">
            <p className="text-gray-500">{t('home.noReviews', lang)}</p>
          </div>
        )}
      </div>

      {/* Today stats */}
      {todayStats && todayStats.reviewsDone > 0 && (
        <div className="card mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('stats.today', lang)}</h3>
          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div>
              <div className="font-semibold text-gray-900">{todayStats.reviewsDone}</div>
              <div className="text-gray-500 text-xs">{t('stats.reviews', lang)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{todayStats.newLearned}</div>
              <div className="text-gray-500 text-xs">{t('stats.newLearned', lang)}</div>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{Math.round(todayStats.timeSpentSeconds / 60)}</div>
              <div className="text-gray-500 text-xs">{t('stats.minutes', lang)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
