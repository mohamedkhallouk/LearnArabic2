'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { useApp } from '@/components/providers';
import { t } from '@/lib/i18n';
import { isNew } from '@/lib/srs';
import { TutorMessage } from '@/types';

export default function TutorPage() {
  const { userId, settings, apiKey, words, srsMap } = useApp();
  const lang = settings.uiLanguage;
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const learnedWords = useMemo(() => {
    return words.filter(w => {
      const srs = srsMap.get(w.id);
      return srs && !isNew(srs) && w.aiGenerated;
    }).map(w => ({
      arabic_raw: w.arabic_raw,
      arabic_vowelized: w.arabic_vowelized,
      english: w.english,
      dutch: w.dutch,
    }));
  }, [words, srsMap]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Send intro message on mount
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'intro',
        role: 'assistant',
        content: t('tutor.intro', lang),
        timestamp: Date.now(),
      }]);
    }
  }, [lang, messages.length]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || !apiKey) return;

    const userMsg: TutorMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.filter(m => m.role !== 'system').map(m => ({
            role: m.role,
            content: m.content,
          })),
          learnedWords,
          uiLanguage: lang,
          apiKey,
          model: settings.openaiModel,
        }),
      });

      const data = await res.json();

      if (data.content) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
          timestamp: Date.now(),
        }]);
      }
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('common.error', lang),
        timestamp: Date.now(),
      }]);
    }

    setLoading(false);
  }, [input, loading, apiKey, messages, learnedWords, lang, settings.openaiModel]);

  const handleNewSession = useCallback(() => {
    setMessages([{
      id: 'intro',
      role: 'assistant',
      content: t('tutor.intro', lang),
      timestamp: Date.now(),
    }]);
  }, [lang]);

  if (!apiKey) {
    return (
      <div className="p-4 page-enter flex flex-col items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('tutor.title', lang)}</h2>
          <p className="text-gray-500 max-w-xs">{t('tutor.needKey', lang)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <header className="p-4 flex items-center justify-between border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900">{t('tutor.title', lang)}</h1>
        <button onClick={handleNewSession} className="btn-ghost text-sm">
          {t('tutor.newSession', lang)}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed
              ${msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-800 rounded-bl-md'}`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
            placeholder={t('tutor.placeholder', lang)}
            className="input flex-1"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="btn-primary px-4"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
