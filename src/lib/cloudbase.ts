import cloudbase from '@cloudbase/js-sdk';

const config = {
  env: process.env.VITE_CLOUDBASE_ENV || 'your-env-id',
  region: process.env.VITE_CLOUDBASE_REGION || 'ap-shanghai',
};

const app = cloudbase.init(config);

export const auth = app.auth({
  persistence: 'local',
});

export const db = app.database();
export const functions = app.callFunction;
export const storage = app.uploadFile;

export const COLLECTIONS = {
  MOOD_ENTRIES: 'mood_entries',
  USERS: 'users',
  USER_PREFERENCES: 'user_preferences',
};

export default app;
