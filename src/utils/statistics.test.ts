import { describe, expect, it } from 'vitest';
import { formatISO, subDays } from 'date-fns';

import {
  calculateSentimentBreakdown,
  calculateStreaks,
  getMoodExtremes,
} from './statistics';
import { MoodEntry } from '../types';

const createEntry = (offset: number, mood: number, overrides: Partial<MoodEntry> = {}): MoodEntry => {
  const date = formatISO(subDays(new Date('2024-01-15T12:00:00Z'), offset), { representation: 'date' });
  return {
    id: `entry-${offset}`,
    date,
    mood: mood as MoodEntry['mood'],
    createdAt: `${date}T08:00:00.000Z`,
    ...overrides,
  };
};

describe('statistics utilities', () => {
  const dataset: MoodEntry[] = [
    createEntry(0, 5),
    createEntry(1, 4),
    createEntry(2, 4),
    createEntry(3, 2),
    createEntry(5, 5),
    createEntry(6, 1),
  ];

  it('calculates streaks with consecutive days', () => {
    const streaks = calculateStreaks(dataset, new Date('2024-01-15T12:00:00Z'));
    expect(streaks.currentStreak).toBe(3);
    expect(streaks.longestStreak).toBeGreaterThanOrEqual(3);
  });

  it('identifies best and toughest days', () => {
    const { bestDay, toughDay } = getMoodExtremes(dataset);
    expect(bestDay?.mood).toBe(5);
    expect(toughDay?.mood).toBe(1);
  });

  it('computes sentiment breakdown', () => {
    const summary = calculateSentimentBreakdown(dataset);
    expect(summary.total).toBe(dataset.length);
    expect(summary.positive).toBe(3);
    expect(summary.challenging).toBe(2);
    expect(summary.neutral).toBe(1);
    expect(summary.positiveRatio).toBeCloseTo(3 / dataset.length);
  });

  it('handles empty datasets gracefully', () => {
    expect(calculateStreaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
    expect(getMoodExtremes([])).toEqual({});
    expect(calculateSentimentBreakdown([])).toEqual({
      positive: 0,
      neutral: 0,
      challenging: 0,
      total: 0,
      positiveRatio: 0,
    });
  });
});
