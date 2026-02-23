const HARAKAT = /[\u064B-\u065F\u0670]/g;
const TATWEEL = /\u0640/g;

export function removeHarakat(text: string): string {
  return text.replace(HARAKAT, '').replace(TATWEEL, '');
}

export function normalizeArabic(text: string): string {
  let s = text.trim();
  s = removeHarakat(s);
  // Normalize hamza variants on alif
  s = s.replace(/[أإآٱ]/g, 'ا');
  // Normalize ta marbuta to ha
  s = s.replace(/ة/g, 'ه');
  // Normalize alif maqsura to ya
  s = s.replace(/ى/g, 'ي');
  // Remove common punctuation
  s = s.replace(/[؟،؛\s.,:;!?'"()\-]/g, '');
  return s;
}

function splitForms(text: string): string[] {
  return text.split(/[،,;\/]+/).map(s => s.trim()).filter(Boolean);
}

export function arabicMatch(input: string, target: string, strict: boolean = false): boolean {
  if (strict) {
    return input.trim() === target.trim();
  }
  const inputNorm = normalizeArabic(input);
  const forms = splitForms(target);
  return forms.some(form => normalizeArabic(form) === inputNorm);
}

export function gradeArabicAnswer(input: string, target: string): number {
  const inputNorm = normalizeArabic(input);
  const forms = splitForms(target);

  let bestGrade = 0;
  for (const form of forms) {
    const formNorm = normalizeArabic(form);

    if (inputNorm === formNorm) {
      if (removeHarakat(input.trim()) === removeHarakat(form.trim())) return 5;
      bestGrade = Math.max(bestGrade, 4);
      continue;
    }

    const dist = levenshtein(inputNorm, formNorm);
    const maxLen = Math.max(inputNorm.length, formNorm.length);
    if (maxLen === 0) continue;
    const similarity = 1 - dist / maxLen;

    if (similarity >= 0.85) bestGrade = Math.max(bestGrade, 3);
    else if (similarity >= 0.6) bestGrade = Math.max(bestGrade, 2);
    else if (similarity >= 0.4) bestGrade = Math.max(bestGrade, 1);
  }
  return bestGrade;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Simple transliteration-to-Arabic mapping for typing helper
const TRANSLIT_MAP: Record<string, string> = {
  'a': 'ا', 'b': 'ب', 't': 'ت', 'th': 'ث', 'j': 'ج', 'H': 'ح', 'kh': 'خ',
  'd': 'د', 'dh': 'ذ', 'r': 'ر', 'z': 'ز', 's': 'س', 'sh': 'ش', 'S': 'ص',
  'D': 'ض', 'T': 'ط', 'Z': 'ظ', '3': 'ع', 'gh': 'غ', 'f': 'ف', 'q': 'ق',
  'k': 'ك', 'l': 'ل', 'm': 'م', 'n': 'ن', 'h': 'ه', 'w': 'و', 'y': 'ي',
  'aa': 'ا', 'ii': 'ي', 'uu': 'و', '2': 'ء', "'": 'ء',
  'la': 'لا', 'al': 'ال',
};

export function translitToArabic(input: string): string {
  let result = '';
  let i = 0;
  const lower = input;

  while (i < lower.length) {
    let matched = false;
    // Try 3-char, then 2-char, then 1-char
    for (const len of [3, 2, 1]) {
      const chunk = lower.slice(i, i + len);
      if (TRANSLIT_MAP[chunk]) {
        result += TRANSLIT_MAP[chunk];
        i += len;
        matched = true;
        break;
      }
    }
    if (!matched) {
      result += lower[i];
      i++;
    }
  }
  return result;
}

export function stableHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 'w' + Math.abs(hash).toString(36);
}
