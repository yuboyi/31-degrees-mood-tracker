export interface MoodEntry {
  id: string;
  date: string;
  mood: MoodLevel;
  note?: string;
  tags?: string[];
  createdAt: string;
  updatedAt?: string;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface MoodStats {
  average: number;
  total: number;
  distribution: Record<MoodLevel, number>;
  trend: 'improving' | 'declining' | 'stable';
}

export interface User {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  reminderTime?: string;
  reminderEnabled: boolean;
  weekStart: 'sunday' | 'monday';
}

export interface DateRange {
  start: string;
  end: string;
}

export const MOOD_LABELS: Record<MoodLevel, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Neutral',
  4: 'Positive',
  5: 'Excellent',
};

export const MOOD_COLORS: Record<MoodLevel, string> = {
  1: '#EF4444', // red
  2: '#F97316', // orange
  3: '#F59E0B', // amber
  4: '#06B6D4', // cyan
  5: '#10B981', // emerald
};

export const MOOD_EMOJIS: Record<MoodLevel, string> = {
  1: '??',
  2: '??',
  3: '??',
  4: '??',
  5: '??',
};
