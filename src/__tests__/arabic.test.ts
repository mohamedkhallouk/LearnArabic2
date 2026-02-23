import {
  removeHarakat,
  normalizeArabic,
  arabicMatch,
  gradeArabicAnswer,
  translitToArabic,
  stableHash,
} from '@/lib/arabic';

describe('Arabic Normalization', () => {
  test('removeHarakat strips diacritics', () => {
    expect(removeHarakat('كِتَابٌ')).toBe('كتاب');
    expect(removeHarakat('مَدْرَسَة')).toBe('مدرسة');
    expect(removeHarakat('hello')).toBe('hello');
  });

  test('normalizeArabic normalizes variants', () => {
    // Hamza normalization
    expect(normalizeArabic('أحمد')).toBe(normalizeArabic('احمد'));
    expect(normalizeArabic('إسلام')).toBe(normalizeArabic('اسلام'));
    expect(normalizeArabic('آمن')).toBe(normalizeArabic('امن'));

    // Ta marbuta -> ha
    expect(normalizeArabic('مدرسة')).toBe(normalizeArabic('مدرسه'));

    // Alif maqsura -> ya
    expect(normalizeArabic('على')).toBe(normalizeArabic('علي'));
  });

  test('normalizeArabic removes punctuation and spaces', () => {
    expect(normalizeArabic('  كتاب!  ')).toBe(normalizeArabic('كتاب'));
    expect(normalizeArabic('مرحبا،')).toBe(normalizeArabic('مرحبا'));
  });

  test('arabicMatch handles lenient comparison', () => {
    expect(arabicMatch('كتاب', 'كِتَابٌ')).toBe(true);
    expect(arabicMatch('مدرسة', 'مدرسه')).toBe(true);
    expect(arabicMatch('أحمد', 'احمد')).toBe(true);
    expect(arabicMatch('على', 'علي')).toBe(true);
    expect(arabicMatch('بيت', 'كتاب')).toBe(false);
  });

  test('arabicMatch strict mode requires exact match', () => {
    expect(arabicMatch('كتاب', 'كتاب', true)).toBe(true);
    expect(arabicMatch('كتاب', 'كِتَابٌ', true)).toBe(false);
  });

  test('gradeArabicAnswer returns correct grades', () => {
    // Exact match -> 5
    expect(gradeArabicAnswer('كتاب', 'كتاب')).toBe(5);

    // Matching after normalization -> 4
    expect(gradeArabicAnswer('كِتَابٌ', 'كتاب')).toBeGreaterThanOrEqual(4);

    // Close but not exact -> 2-3
    const grade = gradeArabicAnswer('كتب', 'كتاب');
    expect(grade).toBeGreaterThanOrEqual(2);
    expect(grade).toBeLessThanOrEqual(4);

    // Completely wrong -> 0-1
    expect(gradeArabicAnswer('سيارة', 'كتاب')).toBeLessThanOrEqual(1);
  });

  test('gradeArabicAnswer handles empty input', () => {
    expect(gradeArabicAnswer('', 'كتاب')).toBe(0);
  });
});

describe('Transliteration to Arabic', () => {
  test('basic letter mapping', () => {
    expect(translitToArabic('k')).toBe('ك');
    expect(translitToArabic('b')).toBe('ب');
    expect(translitToArabic('t')).toBe('ت');
  });

  test('multi-character mappings', () => {
    expect(translitToArabic('sh')).toBe('ش');
    expect(translitToArabic('kh')).toBe('خ');
    expect(translitToArabic('th')).toBe('ث');
    expect(translitToArabic('gh')).toBe('غ');
  });

  test('special characters', () => {
    expect(translitToArabic('3')).toBe('ع');
    expect(translitToArabic('H')).toBe('ح');
    expect(translitToArabic('S')).toBe('ص');
  });

  test('word-level transliteration', () => {
    const result = translitToArabic('ktab');
    expect(result).toContain('ك');
    expect(result).toContain('ب');
  });
});

describe('stableHash', () => {
  test('produces consistent hashes', () => {
    expect(stableHash('كتاب')).toBe(stableHash('كتاب'));
    expect(stableHash('hello')).toBe(stableHash('hello'));
  });

  test('produces different hashes for different inputs', () => {
    expect(stableHash('كتاب')).not.toBe(stableHash('مدرسة'));
  });

  test('hash starts with w', () => {
    expect(stableHash('test')).toMatch(/^w/);
  });
});
