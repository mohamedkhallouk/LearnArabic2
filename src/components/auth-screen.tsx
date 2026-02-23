'use client';

import React, { useState } from 'react';

interface AuthScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  onRegister: (username: string, password: string) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

export default function AuthScreen({ onLogin, onRegister, error, clearError }: AuthScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === 'login') {
      await onLogin(username, password);
    } else {
      await onRegister(username, password);
    }
    setBusy(false);
  };

  const switchMode = () => {
    setMode(m => m === 'login' ? 'register' : 'login');
    clearError();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white flex items-center justify-center mx-auto mb-4 text-2xl font-bold shadow-lg">
            عر
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Learn Arabic</h1>
          <p className="text-gray-500 text-sm mt-1">
            Master 5,000+ common Arabic words
          </p>
        </div>

        {/* Form card */}
        <div className="card shadow-md">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input"
                placeholder="Enter username"
                autoComplete="username"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input"
                placeholder="Enter password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !username.trim() || !password}
              className="btn-primary w-full py-3 text-base"
            >
              {busy ? '...' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button onClick={switchMode} className="text-sm text-brand-600 hover:text-brand-700 font-medium">
              {mode === 'login'
                ? "Don't have an account? Register"
                : 'Already have an account? Log in'}
            </button>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center mt-6">
          All data is stored locally in your browser.
        </p>
      </div>
    </div>
  );
}
