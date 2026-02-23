'use client';

import React, { useCallback, useState } from 'react';
import { translitToArabic } from '@/lib/arabic';
import { useApp } from './providers';

interface ArabicInputProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

const KEYBOARD_ROWS = [
  ['ض', 'ص', 'ث', 'ق', 'ف', 'غ', 'ع', 'ه', 'خ', 'ح', 'ج'],
  ['ش', 'س', 'ي', 'ب', 'ل', 'ا', 'ت', 'ن', 'م', 'ك'],
  ['ئ', 'ء', 'ؤ', 'ر', 'لا', 'ى', 'ة', 'و', 'ز', 'ظ'],
  ['ذ', 'د', 'ط', 'إ', 'أ', 'آ'],
];

const DIACRITICS = ['َ', 'ُ', 'ِ', 'ّ', 'ْ', 'ً', 'ٌ', 'ٍ'];

export default function ArabicInput({
  value, onChange, onSubmit, placeholder, className = '', autoFocus,
}: ArabicInputProps) {
  const { settings } = useApp();
  const [translitBuffer, setTranslitBuffer] = useState('');

  const handleKeyboardKey = useCallback((key: string) => {
    onChange(value + key);
  }, [value, onChange]);

  const handleBackspace = useCallback(() => {
    if (value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }, [value, onChange]);

  const handleTranslitInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setTranslitBuffer(input);
    onChange(translitToArabic(input));
  }, [onChange]);

  const handleDirectInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }, [onSubmit]);

  if (settings.arabicKeyboardMode === 'onscreen') {
    return (
      <div className={className}>
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={handleDirectInput}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className="input-arabic"
            dir="rtl"
          />
        </div>
        <div className="mt-2 space-y-1">
          {KEYBOARD_ROWS.map((row, ri) => (
            <div key={ri} className="flex justify-center gap-0.5">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => handleKeyboardKey(key)}
                  className="keyboard-key"
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
          <div className="flex justify-center gap-0.5">
            {DIACRITICS.map((d) => (
              <button
                key={d}
                onClick={() => handleKeyboardKey(d)}
                className="keyboard-key text-brand-600 text-sm"
              >
                {'ـ' + d}
              </button>
            ))}
          </div>
          <div className="flex justify-center gap-1">
            <button onClick={() => handleKeyboardKey(' ')} className="keyboard-key flex-1 max-w-[12rem]">
              ⎵
            </button>
            <button onClick={handleBackspace} className="keyboard-key px-3 text-sm text-red-500">
              ⌫
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (settings.arabicKeyboardMode === 'transliteration') {
    return (
      <div className={className}>
        <div className="arabic-text text-right text-lg min-h-[2.5rem] px-4 py-2 bg-gray-50 rounded-xl mb-1 border border-gray-100">
          {value || <span className="text-gray-300">Arabic output</span>}
        </div>
        <input
          type="text"
          value={translitBuffer}
          onChange={handleTranslitInput}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Type transliteration...'}
          autoFocus={autoFocus}
          className="input text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">
          sh=ش kh=خ gh=غ 3=ع H=ح S=ص D=ض T=ط
        </p>
      </div>
    );
  }

  // Mode: off - just a regular input
  return (
    <input
      type="text"
      value={value}
      onChange={handleDirectInput}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`input-arabic ${className}`}
      dir="rtl"
    />
  );
}
