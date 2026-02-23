'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useApp } from '@/components/providers';
import { t } from '@/lib/i18n';
import { exportUserData, importUserData, resetUserData } from '@/lib/db';

export default function SettingsPage() {
  const { userId, settings, saveSettings, apiKey, setApiKey, loadAll, logout } = useApp();
  const lang = settings.uiLanguage;
  const [keyInput, setKeyInput] = useState(apiKey || '');
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveKey = useCallback(() => {
    setApiKey(keyInput.trim() || null);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [keyInput, setApiKey]);

  const handleExport = useCallback(async () => {
    const json = await exportUserData(userId);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learn-arabic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [userId]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    await importUserData(userId, text);
    await loadAll();
  }, [userId, loadAll]);

  const handleReset = useCallback(async () => {
    await resetUserData(userId);
    localStorage.clear();
    window.location.reload();
  }, [userId]);

  return (
    <div className="p-4 page-enter">
      <header className="pt-4 pb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title', lang)}</h1>
      </header>

      <div className="space-y-4">
        {/* Language */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">{t('settings.language', lang)}</label>
          <div className="flex gap-2 mt-2">
            {(['en', 'nl'] as const).map(l => (
              <button
                key={l}
                onClick={() => saveSettings({ uiLanguage: l })}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors
                  ${settings.uiLanguage === l ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {l === 'en' ? 'English' : 'Nederlands'}
              </button>
            ))}
          </div>
        </div>

        {/* Daily targets */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">{t('settings.dailyNew', lang)}</label>
          <input
            type="number"
            min={1}
            max={50}
            value={settings.dailyNewTarget}
            onChange={e => saveSettings({ dailyNewTarget: Number(e.target.value) || 10 })}
            className="input mt-2"
          />
          <label className="text-sm font-medium text-gray-700 mt-3 block">{t('settings.dailyReview', lang)}</label>
          <input
            type="number"
            min={5}
            max={200}
            value={settings.dailyReviewTarget}
            onChange={e => saveSettings({ dailyReviewTarget: Number(e.target.value) || 40 })}
            className="input mt-2"
          />
        </div>

        {/* Display options */}
        <div className="card">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">{t('settings.vowelized', lang)}</label>
            <button
              onClick={() => saveSettings({ showVowelized: !settings.showVowelized })}
              className={`relative w-11 h-6 rounded-full transition-colors
                ${settings.showVowelized ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${settings.showVowelized ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Keyboard mode */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">{t('settings.keyboard', lang)}</label>
          <div className="flex gap-2 mt-2">
            {([
              { value: 'off' as const, label: t('settings.keyboardOff', lang) },
              { value: 'onscreen' as const, label: t('settings.keyboardOnscreen', lang) },
              { value: 'transliteration' as const, label: t('settings.keyboardTranslit', lang) },
            ]).map(opt => (
              <button
                key={opt.value}
                onClick={() => saveSettings({ arabicKeyboardMode: opt.value })}
                className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors
                  ${settings.arabicKeyboardMode === opt.value ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">{t('settings.apiKey', lang)}</label>
          <div className="flex gap-2 mt-2">
            <input
              type="password"
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              placeholder={t('settings.apiKeyPlaceholder', lang)}
              className="input flex-1 text-sm"
            />
            <button onClick={handleSaveKey} className="btn-primary text-sm">
              {t('settings.save', lang)}
            </button>
          </div>
          {saved && <p className="text-xs text-emerald-600 mt-1">{t('settings.apiKeySaved', lang)}</p>}
        </div>

        {/* AI model */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">{t('settings.model', lang)}</label>
          <select
            value={settings.openaiModel}
            onChange={e => saveSettings({ openaiModel: e.target.value })}
            className="input mt-2 text-sm"
          >
            <option value="gpt-4o-mini">GPT-4o Mini (fast, cheap)</option>
            <option value="gpt-4o">GPT-4o (best quality)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        {/* TTS */}
        <div className="card">
          <label className="text-sm font-medium text-gray-700">
            {lang === 'nl' ? 'Tekst-naar-spraak (TTS)' : 'Text-to-Speech (TTS)'}
          </label>
          <p className="text-xs text-gray-400 mt-1 mb-3">
            {lang === 'nl'
              ? 'Gebruik de luisterknop naast woorden om de uitspraak te horen.'
              : 'Use the speaker button next to words to hear pronunciation.'}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{lang === 'nl' ? 'TTS ingeschakeld' : 'TTS enabled'}</span>
            <button
              onClick={() => saveSettings({ ttsVoice: settings.ttsVoice === 'off' ? 'ar' : 'off' })}
              className={`relative w-11 h-6 rounded-full transition-colors
                ${settings.ttsVoice !== 'off' ? 'bg-brand-600' : 'bg-gray-300'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                ${settings.ttsVoice !== 'off' ? 'translate-x-5' : ''}`}
              />
            </button>
          </div>
        </div>

        {/* Data management */}
        <div className="card space-y-3">
          <button onClick={handleExport} className="btn-secondary w-full text-sm">
            {t('settings.exportData', lang)}
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="btn-secondary w-full text-sm">
            {t('settings.importData', lang)}
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => setShowResetConfirm(true)} className="btn-danger w-full text-sm">
            {t('settings.resetData', lang)}
          </button>
        </div>

        {/* Reset confirmation */}
        {showResetConfirm && (
          <div className="card border-red-200 bg-red-50">
            <p className="text-sm text-red-700 mb-3">{t('settings.resetConfirm', lang)}</p>
            <div className="flex gap-2">
              <button onClick={() => setShowResetConfirm(false)} className="btn-secondary flex-1 text-sm">
                {t('common.cancel', lang)}
              </button>
              <button onClick={handleReset} className="btn-danger flex-1 text-sm">
                {t('common.confirm', lang)}
              </button>
            </div>
          </div>
        )}

        {/* Logout */}
        <div className="card">
          <button onClick={logout} className="btn-secondary w-full text-sm">
            {lang === 'nl' ? 'Uitloggen' : 'Log out'}
          </button>
        </div>

        {/* Privacy note */}
        <div className="card bg-gray-50 border-gray-200">
          <p className="text-xs text-gray-500 leading-relaxed">{t('settings.privacy', lang)}</p>
        </div>
      </div>
    </div>
  );
}
