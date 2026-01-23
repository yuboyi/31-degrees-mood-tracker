import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { MoodEntry, MoodLevel, MoodStats } from '../types';
import { format, subDays, isWithinInterval } from 'date-fns';
import CloudService from '../services/cloudService';

interface MoodStore {
  entries: MoodEntry[];
  isCloudSynced: boolean;
  lastSyncTime: string | null;
  isLoading: boolean;
  addEntry: (mood: MoodLevel, note?: string, tags?: string[]) => void;
  updateEntry: (id: string, updates: Partial<MoodEntry>) => void;
  deleteEntry: (id: string) => void;
  getTodayEntry: () => MoodEntry | undefined;
  getEntriesInRange: (start: string, end: string) => MoodEntry[];
  getRecentEntries: (days: number) => MoodEntry[];
  getStats: (days?: number) => MoodStats;
  syncToCloud: () => Promise<boolean>;
  loadFromCloud: () => Promise<boolean>;
  backupToCloud: () => Promise<string | null>;
  restoreFromCloud: (backupId: string) => Promise<boolean>;
}

export const useMoodStore = create<MoodStore>()(
  persist(
    (set, get) => ({
      entries: [],
      isCloudSynced: false,
      lastSyncTime: null,
      isLoading: false,
      
      addEntry: (mood, note, tags) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const now = new Date().toISOString();
        
        set((state) => {
          // Check if there's already an entry for today
          const existingIndex = state.entries.findIndex(entry => entry.date === today);
          
          if (existingIndex !== -1) {
            // Update existing entry
            const updatedEntries = [...state.entries];
            updatedEntries[existingIndex] = {
              ...updatedEntries[existingIndex],
              mood,
              note,
              tags,
              updatedAt: now,
            };
            return { entries: updatedEntries };
          } else {
            // Create new entry
            const newEntry: MoodEntry = {
              id: crypto.randomUUID(),
              date: today,
              mood,
              note,
              tags,
              createdAt: now,
            };
            return { entries: [...state.entries, newEntry] };
          }
        });
      },
      
      updateEntry: (id, updates) => {
        set((state) => ({
          entries: state.entries.map(entry =>
            entry.id === id 
              ? { ...entry, ...updates, updatedAt: new Date().toISOString() }
              : entry
          ),
        }));
      },
      
      deleteEntry: (id) => {
        set((state) => ({
          entries: state.entries.filter(entry => entry.id !== id),
        }));
      },
      
      getTodayEntry: () => {
        const today = format(new Date(), 'yyyy-MM-dd');
        return get().entries.find(entry => entry.date === today);
      },
      
      getEntriesInRange: (start, end) => {
        return get().entries.filter(entry => {
          const entryDate = new Date(entry.date);
          return isWithinInterval(entryDate, {
            start: new Date(start),
            end: new Date(end),
          });
        });
      },
      
      getRecentEntries: (days) => {
        const endDate = new Date();
        const startDate = subDays(endDate, days - 1);
        
        return get().entries
          .filter(entry => {
            const entryDate = new Date(entry.date);
            return isWithinInterval(entryDate, { start: startDate, end: endDate });
          })
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      },
      
      getStats: (days = 30) => {
        const recentEntries = get().getRecentEntries(days);
        
        if (recentEntries.length === 0) {
          return {
            average: 0,
            total: 0,
            distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            trend: 'stable' as const,
          };
        }
        
        const total = recentEntries.length;
        const sum = recentEntries.reduce((acc, entry) => acc + entry.mood, 0);
        const average = sum / total;
        
        // Calculate distribution
        const distribution = recentEntries.reduce(
          (acc, entry) => {
            acc[entry.mood] = (acc[entry.mood] || 0) + 1;
            return acc;
          },
          { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<MoodLevel, number>
        );
        
        // Calculate trend (compare first half vs second half)
        let trend: 'improving' | 'declining' | 'stable' = 'stable';
        if (recentEntries.length >= 6) {
          const midPoint = Math.floor(recentEntries.length / 2);
          const firstHalf = recentEntries.slice(midPoint);
          const secondHalf = recentEntries.slice(0, midPoint);
          
          const firstAvg = firstHalf.reduce((sum, entry) => sum + entry.mood, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum, entry) => sum + entry.mood, 0) / secondHalf.length;
          
          const difference = secondAvg - firstAvg;
          if (difference > 0.3) trend = 'improving';
          else if (difference < -0.3) trend = 'declining';
        }
        
        return {
          average,
          total,
          distribution,
          trend,
        };
      },
      
      syncToCloud: async () => {
        set({ isLoading: true });
        try {
          const success = await CloudService.syncMoodEntries(get().entries);
          if (success) {
            set({ 
              isCloudSynced: true, 
              lastSyncTime: new Date().toISOString(),
              isLoading: false 
            });
          } else {
            set({ isLoading: false });
          }
          return success;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      loadFromCloud: async () => {
        set({ isLoading: true });
        try {
          const cloudEntries = await CloudService.loadMoodEntries();
          if (cloudEntries.length > 0) {
            set({ 
              entries: cloudEntries,
              isCloudSynced: true,
              lastSyncTime: new Date().toISOString(),
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      backupToCloud: async () => {
        try {
          return await CloudService.backupData(get().entries);
        } catch (error) {
          return null;
        }
      },
      
      restoreFromCloud: async (backupId: string) => {
        set({ isLoading: true });
        try {
          const restoredEntries = await CloudService.restoreData(backupId);
          if (restoredEntries) {
            set({ 
              entries: restoredEntries,
              isCloudSynced: true,
              lastSyncTime: new Date().toISOString(),
              isLoading: false 
            });
            return true;
          }
          set({ isLoading: false });
          return false;
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
    }),
    {
      name: 'mood-tracker-storage',
      version: 2,
    }
  )
);