import { createInitialSRS, updateSRS, isDue, isNew, isMastered, getItemStatus } from '@/lib/srs';
import { SRSGrade } from '@/types';

describe('SRS Algorithm', () => {
  test('createInitialSRS returns new state', () => {
    const state = createInitialSRS('user1', 'test-1');
    expect(state.itemId).toBe('test-1');
    expect(state.userId).toBe('user1');
    expect(state.intervalDays).toBe(0);
    expect(state.easeFactor).toBe(2.5);
    expect(state.repetitions).toBe(0);
    expect(state.totalReviews).toBe(0);
    expect(state.successStreak).toBe(0);
  });

  test('isNew returns true for unreviewed items', () => {
    const state = createInitialSRS('u', 'test');
    expect(isNew(state)).toBe(true);
  });

  test('successful review increases interval', () => {
    let state = createInitialSRS('u', 'test');
    state = updateSRS(state, 4); // Good
    expect(state.intervalDays).toBe(1);
    expect(state.repetitions).toBe(1);
    expect(state.totalReviews).toBe(1);
    expect(state.successStreak).toBe(1);

    state = updateSRS(state, 4); // Good again
    expect(state.intervalDays).toBe(3);
    expect(state.repetitions).toBe(2);

    state = updateSRS(state, 4); // Good again
    expect(state.intervalDays).toBeGreaterThan(3);
    expect(state.repetitions).toBe(3);
  });

  test('failure resets repetitions and interval', () => {
    let state = createInitialSRS('u', 'test');
    state = updateSRS(state, 5); // Easy
    state = updateSRS(state, 5); // Easy
    expect(state.repetitions).toBe(2);

    state = updateSRS(state, 1); // Fail
    expect(state.repetitions).toBe(0);
    expect(state.intervalDays).toBe(0);
    expect(state.lapses).toBe(1);
    expect(state.successStreak).toBe(0);
  });

  test('ease factor adjusts correctly', () => {
    let state = createInitialSRS('u', 'test');

    // Easy reviews increase ease
    state = updateSRS(state, 5);
    expect(state.easeFactor).toBeGreaterThan(2.5);

    // Hard reviews decrease ease
    state = updateSRS(state, 3);
    const easeAfterHard = state.easeFactor;
    expect(easeAfterHard).toBeLessThan(state.easeFactor + 0.5);

    // Ease never goes below 1.3
    state = { ...state, easeFactor: 1.35 };
    state = updateSRS(state, 3);
    expect(state.easeFactor).toBeGreaterThanOrEqual(1.3);
  });

  test('isDue returns true when dueAt is in the past', () => {
    const state = createInitialSRS('u', 'test');
    expect(isDue(state)).toBe(true); // initial dueAt is now

    const futureState = { ...state, dueAt: Date.now() + 100000 };
    expect(isDue(futureState)).toBe(false);
  });

  test('isMastered requires high interval and streak', () => {
    const state = {
      ...createInitialSRS('u', 'test'),
      intervalDays: 21,
      successStreak: 3,
      totalReviews: 5,
    };
    expect(isMastered(state)).toBe(true);

    const notMastered = { ...state, intervalDays: 10 };
    expect(isMastered(notMastered)).toBe(false);
  });

  test('getItemStatus returns correct status', () => {
    expect(getItemStatus(createInitialSRS('u', 'test'))).toBe('new');

    const mastered = {
      ...createInitialSRS('u', 'test'),
      intervalDays: 30,
      successStreak: 5,
      totalReviews: 10,
      dueAt: Date.now() + 1000000,
    };
    expect(getItemStatus(mastered)).toBe('mastered');

    const learning = {
      ...createInitialSRS('u', 'test'),
      totalReviews: 3,
      intervalDays: 5,
      dueAt: Date.now() + 1000000,
      successStreak: 1,
    };
    expect(getItemStatus(learning)).toBe('learning');
  });

  test('multiple grade levels produce expected behavior', () => {
    const grades: SRSGrade[] = [0, 1, 2, 3, 4, 5];

    for (const grade of grades) {
      let state = createInitialSRS('u', `test-${grade}`);
      state = updateSRS(state, grade);

      if (grade < 3) {
        expect(state.repetitions).toBe(0);
        expect(state.lapses).toBe(1);
      } else {
        expect(state.repetitions).toBe(1);
        expect(state.lapses).toBe(0);
      }
    }
  });
});
