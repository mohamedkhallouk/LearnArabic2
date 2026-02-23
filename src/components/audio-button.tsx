'use client';

import React, { useState, useCallback } from 'react';
import { playAudio } from '@/lib/audio';

interface AudioButtonProps {
  itemId: string;
  text: string;
  type: 'word' | 'example';
  size?: 'sm' | 'md' | 'lg';
}

export default function AudioButton({ itemId, text, type, size = 'md' }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);

  const handlePlay = useCallback(async () => {
    if (playing || !text) return;
    setPlaying(true);
    try {
      await playAudio(itemId, text, type);
    } catch {
      // Silent fail
    }
    setPlaying(false);
  }, [playing, text, itemId, type]);

  if (!text) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <button
      onClick={handlePlay}
      disabled={playing}
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-brand-50 text-brand-600 
                  hover:bg-brand-100 active:bg-brand-200 transition-colors disabled:opacity-50`}
      aria-label="Play audio"
    >
      {playing ? (
        <svg className={`${iconClasses[size]} animate-pulse`} fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className={iconClasses[size]} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.26 3.691A1.2 1.2 0 0112 4.8v14.4a1.199 1.199 0 01-1.92.96l-5.76-4.32H1.2A1.2 1.2 0 010 14.64V9.36a1.2 1.2 0 011.2-1.2h3.12l5.76-4.32a1.2 1.2 0 011.18-.149zM15.44 7.44a.9.9 0 011.28 0 6.6 6.6 0 010 9.12.9.9 0 11-1.28-1.28 4.8 4.8 0 000-6.56.9.9 0 010-1.28z" />
        </svg>
      )}
    </button>
  );
}
