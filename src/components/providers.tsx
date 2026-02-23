'use client';

import React, { createContext, useContext, ReactNode, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSettings } from '@/hooks/useSettings';
import { useDatabase } from '@/hooks/useDB';
import { UserSettings, WordItem, SRSState, DailyPlan } from '@/types';
import AuthScreen from '@/components/auth-screen';

interface AppContextType {
  userId: string;
  settings: UserSettings;
  saveSettings: (updates: Partial<UserSettings>) => Promise<void>;
  apiKey: string | null;
  setApiKey: (key: string | null) => void;
  words: WordItem[];
  srsMap: Map<string, SRSState>;
  loading: boolean;
  initialized: boolean;
  initializeWordList: () => Promise<void>;
  getDailyPlan: (newTarget: number, reviewTarget: number) => DailyPlan;
  updateWord: (word: WordItem) => Promise<void>;
  updateSRS: (state: SRSState) => Promise<void>;
  getStatusCounts: () => { newCount: number; learningCount: number; dueCount: number; masteredCount: number; total: number };
  loadAll: () => Promise<void>;
  settingsLoaded: boolean;
  logout: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { currentUser, loading: authLoading, error, login, register, logout, clearError } = useAuth();
  const { settings, saveSettings, apiKey, setApiKey, loaded: settingsLoaded } = useSettings(currentUser);
  const {
    words, srsMap, loading, initialized,
    initializeWordList, getDailyPlan, updateWord, updateSRS,
    getStatusCounts, loadAll,
  } = useDatabase(currentUser);

  // Initialize word list when user is logged in but data not yet loaded
  useEffect(() => {
    if (currentUser && !loading && !initialized && settingsLoaded) {
      initializeWordList();
    }
  }, [currentUser, loading, initialized, settingsLoaded, initializeWordList]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-400 animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!currentUser) {
    return <AuthScreen onLogin={login} onRegister={register} error={error} clearError={clearError} />;
  }

  return (
    <AppContext.Provider value={{
      userId: currentUser,
      settings, saveSettings, apiKey, setApiKey,
      words, srsMap, loading, initialized,
      initializeWordList, getDailyPlan, updateWord, updateSRS,
      getStatusCounts, loadAll, settingsLoaded, logout,
    }}>
      {children}
    </AppContext.Provider>
  );
}
