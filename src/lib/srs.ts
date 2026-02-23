import { SRSState, SRSGrade } from '@/types';

export function createInitialSRS(userId: string, itemId: string): SRSState {
  return {
    id: `${userId}_${itemId}`,
    userId,
    itemId,
    dueAt: Date.now(),
    intervalDays: 0,
    easeFactor: 2.5,
    repetitions: 0,
    lapses: 0,
    lastReviewedAt: 0,
    lastGrade: 0,
    totalReviews: 0,
    successStreak: 0,
  };
}

/**
 * SM-2 algorithm implementation.
 * Grade 0-2 = failure (reset), Grade 3-5 = success.
 */
export function updateSRS(state: SRSState, grade: SRSGrade): SRSState {
  const now = Date.now();
  const newState = { ...state };

  newState.lastGrade = grade;
  newState.lastReviewedAt = now;
  newState.totalReviews += 1;

  if (grade < 3) {
    newState.repetitions = 0;
    newState.intervalDays = 0;
    newState.lapses += 1;
    newState.successStreak = 0;
    newState.dueAt = now + 10 * 60 * 1000;
  } else {
    newState.successStreak += 1;

    if (newState.repetitions === 0) {
      newState.intervalDays = 1;
    } else if (newState.repetitions === 1) {
      newState.intervalDays = 3;
    } else {
      newState.intervalDays = Math.round(newState.intervalDays * newState.easeFactor);
    }

    newState.repetitions += 1;

    const ef = newState.easeFactor + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02));
    newState.easeFactor = Math.max(1.3, ef);

    newState.dueAt = now + newState.intervalDays * 24 * 60 * 60 * 1000;
  }

  return newState;
}

export function isDue(state: SRSState): boolean {
  return state.dueAt <= Date.now();
}

export function isNew(state: SRSState): boolean {
  return state.totalReviews === 0;
}

export function isMastered(state: SRSState): boolean {
  return state.intervalDays >= 21 && state.successStreak >= 3;
}

export function isLearning(state: SRSState): boolean {
  return state.totalReviews > 0 && !isMastered(state);
}

export type ItemStatus = 'new' | 'learning' | 'due' | 'mastered';

export function getItemStatus(state: SRSState): ItemStatus {
  if (isNew(state)) return 'new';
  if (isMastered(state)) return 'mastered';
  if (isDue(state)) return 'due';
  return 'learning';
}
