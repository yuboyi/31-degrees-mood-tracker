import { auth, db, COLLECTIONS } from '../lib/cloudbase';
import { MoodEntry } from '../types';

export class CloudService {
  static async loginAnonymously(): Promise<boolean> {
    try {
      await auth.signInAnonymously();
      return true;
    } catch (error) {
      console.error('Anonymous sign-in failed:', error);
      return false;
    }
  }

  static async getCurrentUser(): Promise<any> {
    try {
      return auth.currentUser;
    } catch (error) {
      console.error('Unable to read current user:', error);
      return null;
    }
  }

  static async logout(): Promise<void> {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Cloud logout failed:', error);
    }
  }

  static async syncMoodEntries(entries: MoodEntry[]): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        const loginSuccess = await this.loginAnonymously();
        if (!loginSuccess) {
          return false;
        }
      }

      const currentUser = auth.currentUser;
      if (!currentUser) {
        return false;
      }

      const collection = db.collection(COLLECTIONS.MOOD_ENTRIES);

      await collection.where({ userId: currentUser.uid }).remove();

      const addPromises = entries.map((entry) =>
        collection.add({
          ...entry,
          userId: currentUser.uid,
          syncedAt: new Date().toISOString(),
        }),
      );

      await Promise.all(addPromises);
      return true;
    } catch (error) {
      console.error('Failed to sync mood entries:', error);
      return false;
    }
  }

  static async loadMoodEntries(): Promise<MoodEntry[]> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return [];
      }

      const collection = db.collection(COLLECTIONS.MOOD_ENTRIES);
      const result = await collection
        .where({ userId: user.uid })
        .orderBy('date', 'desc')
        .get();

      return result.data.map((item: any) => ({
        id: item.id,
        date: item.date,
        mood: item.mood,
        note: item.note,
        tags: item.tags,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }));
    } catch (error) {
      console.error('Failed to load cloud entries:', error);
      return [];
    }
  }

  static async backupData(entries: MoodEntry[]): Promise<string | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }

      const payload = {
        entries,
        userId: user.uid,
        backupTime: new Date().toISOString(),
        version: '1.0',
      };

      const collection = db.collection('backups');
      const response = await collection.add(payload);
      return (response as any)._id || (response as any).id || null;
    } catch (error) {
      console.error('Backup failed:', error);
      return null;
    }
  }

  static async restoreData(backupId: string): Promise<MoodEntry[] | null> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        return null;
      }

      const collection = db.collection('backups');
      const response = await collection.doc(backupId).get();

      if (response.data && (response.data as any).userId === user.uid) {
        return (response.data as any).entries;
      }

      return null;
    } catch (error) {
      console.error('Restore failed:', error);
      return null;
    }
  }

  static async checkConnection(): Promise<boolean> {
    try {
      await db.collection(COLLECTIONS.MOOD_ENTRIES).limit(1).get();
      return true;
    } catch (error) {
      console.warn('CloudBase connection test failed:', error);
      return false;
    }
  }
}

export default CloudService;
