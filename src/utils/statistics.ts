import { differenceInCalendarDays } from 'date-fns';
import { MoodEntry } from '../types';

export interface MoodStreaks {
  currentStreak: number;
  longestStreak: number;
}

export interface MoodExtremes {
  bestDay?: MoodEntry;
  toughDay?: MoodEntry;
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  challenging: number;
  total: number;
  positiveRatio: number;
}


export function calculateStreaks(entries: MoodEntry[], referenceDate: Date = new Date()): MoodStreaks {
  if (entries.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = [...entries].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let longest = 0;
  let streak = 0;
  let previousDate: Date | null = null;

  for (const entry of sorted) {
    const entryDate = new Date(entry.date);

    if (!previousDate) {
      streak = 1;
    } else {
      const gap = differenceInCalendarDays(entryDate, previousDate);
      if (gap === 1) {
        streak += 1;
      } else if (gap > 1) {
        streak = 1;
      }
      // gap === 0 means multiple entries in the same day; streak remains unchanged
    }

    longest = Math.max(longest, streak);
    previousDate = entryDate;
  }

  // Calculate current streak starting from the most recent entry
  const desc = [...sorted].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let currentStreak = 0;
  let pointer: Date | null = null;
  const today = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());

  for (const entry of desc) {
    const entryDate = new Date(entry.date);
    const normalized = new Date(entryDate.getFullYear(), entryDate.getMonth(), entryDate.getDate());

    if (pointer === null) {
      const startDiff = differenceInCalendarDays(today, normalized);
      if (startDiff === 0) {
        currentStreak = 1;
        pointer = normalized;
      } else if (startDiff === 1) {
        // yesterday counts if today is missing
        currentStreak = 1;
        pointer = normalized;
      } else {
        break;
      }
      continue;
    }

    const gap = differenceInCalendarDays(pointer, normalized);
    if (gap === 0) {
      // Same day entry, skip
      continue;
    }

    if (gap === 1) {
      currentStreak += 1;
      pointer = normalized;
      continue;
    }

    break;
  }

  return {
    currentStreak,
    longestStreak: longest,
  };
}

export function getMoodExtremes(entries: MoodEntry[]): MoodExtremes {
  if (entries.length === 0) {
    return {};
  }

  const sorted = [...entries].sort((a, b) => {
    if (b.mood !== a.mood) {
      return b.mood - a.mood;
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  const bestDay = sorted[0];

  const toughDay = [...entries]
    .sort((a, b) => {
      if (a.mood !== b.mood) {
        return a.mood - b.mood;
      }
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    })[0];

  return { bestDay, toughDay };
}

export function calculateSentimentBreakdown(entries: MoodEntry[]): SentimentBreakdown {
  const positive = entries.filter((entry) => entry.mood >= 4).length;
  const neutral = entries.filter((entry) => entry.mood === 3).length;
  const challenging = entries.filter((entry) => entry.mood <= 2).length;
  const total = entries.length;
  const positiveRatio = total > 0 ? positive / total : 0;

  return { positive, neutral, challenging, total, positiveRatio };
}
