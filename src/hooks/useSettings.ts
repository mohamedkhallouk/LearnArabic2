'use client';

import { useState, useEffect, useCallback } from 'react';
import { UserSettings } from '@/types';
import * as db from '@/lib/db';

const API_KEY_PREFIX = 'la2-apikey-';

export function useSettings(userId: string | null) {
  const [settings, setSettings] = useState<UserSettings>(db.defaultSettings(userId || '_'));
  const [apiKey, setApiKeyState] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSettings(db.defaultSettings('_'));
      setApiKeyState(null);
      setLoaded(false);
      return;
    }

    db.getSettings(userId).then(s => {
      setSettings(s);
      setLoaded(true);
    });

    if (typeof window !== 'undefined') {
      setApiKeyState(localStorage.getItem(API_KEY_PREFIX + userId));
    }
  }, [userId]);

  const saveSettings = useCallback(async (updates: Partial<UserSettings>) => {
    if (!userId) return;
    const next = { ...settings, ...updates, id: userId };
    setSettings(next);
    await db.putSettings(next);
  }, [settings, userId]);

  const setApiKey = useCallback((key: string | null) => {
    if (!userId) return;
    setApiKeyState(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem(API_KEY_PREFIX + userId, key);
      } else {
        localStorage.removeItem(API_KEY_PREFIX + userId);
      }
    }
  }, [userId]);

  return { settings, saveSettings, apiKey, setApiKey, loaded };
}
