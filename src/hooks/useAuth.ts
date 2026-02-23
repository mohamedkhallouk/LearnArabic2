'use client';

import { useState, useEffect, useCallback } from 'react';
import { Account } from '@/types';
import * as db from '@/lib/db';
import { hashPassword, getStoredUser, setStoredUser } from '@/lib/auth';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      db.getAccount(stored).then(account => {
        if (account) {
          setCurrentUser(stored);
        } else {
          setStoredUser(null);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setError(null);
    const normalizedUser = username.trim().toLowerCase();
    if (!normalizedUser || !password) {
      setError('Please enter username and password');
      return false;
    }

    const account = await db.getAccount(normalizedUser);
    if (!account) {
      setError('Account not found');
      return false;
    }

    const hash = await hashPassword(normalizedUser, password);
    if (hash !== account.passwordHash) {
      setError('Incorrect password');
      return false;
    }

    setStoredUser(normalizedUser);
    setCurrentUser(normalizedUser);
    return true;
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    setError(null);
    const normalizedUser = username.trim().toLowerCase();
    if (!normalizedUser || normalizedUser.length < 2) {
      setError('Username must be at least 2 characters');
      return false;
    }
    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters');
      return false;
    }

    const existing = await db.getAccount(normalizedUser);
    if (existing) {
      setError('Username already taken');
      return false;
    }

    const hash = await hashPassword(normalizedUser, password);
    const account: Account = {
      username: normalizedUser,
      passwordHash: hash,
      createdAt: Date.now(),
    };

    await db.createAccount(account);
    setStoredUser(normalizedUser);
    setCurrentUser(normalizedUser);
    return true;
  }, []);

  const logout = useCallback(() => {
    setStoredUser(null);
    setCurrentUser(null);
  }, []);

  return { currentUser, loading, error, login, register, logout, clearError: () => setError(null) };
}
