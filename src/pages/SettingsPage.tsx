import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import {
  AlertCircle,
  Cloud,
  CloudOff,
  Download,
  LogOut,
  RefreshCw,
  Save,
  Upload,
  UserPlus,
} from 'lucide-react';

import { useMoodStore } from '../store/moodStore';
import CloudService from '../services/cloudService';

interface ToastState {
  type: 'success' | 'error' | 'info';
  text: string;
}

type ConnectionStatus = 'checking' | 'connected' | 'disconnected';

type CloudUser = {
  uid?: string;
};

const SettingsPage: React.FC = () => {
  const {
    entries,
    lastSyncTime,
    isLoading,
    syncToCloud,
    loadFromCloud,
    backupToCloud,
  } = useMoodStore();

  const [user, setUser] = useState<CloudUser | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking');
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    void checkUserAndConnection();
  }, []);

  const setToastWithTimeout = (value: ToastState | null, delay = 3000) => {
    setToast(value);
    if (value) {
      setTimeout(() => setToast(null), delay);
    }
  };

  const checkUserAndConnection = async () => {
    try {
      const currentUser = await CloudService.getCurrentUser();
      setUser(currentUser);

      const reachable = await CloudService.checkConnection();
      setConnectionStatus(reachable ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Cloud connectivity check failed', error);
      setConnectionStatus('disconnected');
    }
  };

  const handleLogin = async () => {
    try {
      const success = await CloudService.loginAnonymously();
      if (success) {
        const currentUser = await CloudService.getCurrentUser();
        setUser(currentUser);
        setToastWithTimeout({ type: 'success', text: 'Signed in to CloudBase anonymously.' });
        await checkUserAndConnection();
      } else {
        setToastWithTimeout({ type: 'error', text: 'Unable to sign in. Check your network and CloudBase config.' });
      }
    } catch (error) {
      console.error('Login failed', error);
      setToastWithTimeout({ type: 'error', text: 'Login failed. Please try again in a moment.' });
    }
  };

  const handleLogout = async () => {
    try {
      await CloudService.logout();
      setUser(null);
      setConnectionStatus('disconnected');
      setToastWithTimeout({ type: 'info', text: 'Signed out of CloudBase.' });
    } catch (error) {
      setToastWithTimeout({ type: 'error', text: 'Unable to sign out right now.' });
    }
  };

  const handleSyncToCloud = async () => {
    const success = await syncToCloud();
    setToastWithTimeout({
      type: success ? 'success' : 'error',
      text: success ? 'All entries synced to the cloud.' : 'Sync failed. Please retry shortly.',
    });
  };

  const handleLoadFromCloud = async () => {
    const success = await loadFromCloud();
    setToastWithTimeout({
      type: success ? 'success' : 'error',
      text: success ? 'Entries imported from the cloud.' : 'No data available in cloud or load failed.',
    });
  };

  const handleBackupSnapshot = async () => {
    const backupId = await backupToCloud();
    setToastWithTimeout({
      type: backupId ? 'success' : 'error',
      text: backupId
        ? `Backup created successfully. Reference: ${backupId.slice(0, 8)}��`
        : 'Backup failed. Please try again.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cloud size={24} className="text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Cloud & data</h2>
      </div>

      {toast && (
        <div
          className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${
            toast.type === 'success'
              ? 'bg-emerald-50 text-emerald-800'
              : toast.type === 'error'
              ? 'bg-rose-50 text-rose-800'
              : 'bg-blue-50 text-blue-800'
          }`}
        >
          <AlertCircle size={16} />
          <span>{toast.text}</span>
        </div>
      )}

      <section className="card">
        <h3 className="mb-4 text-lg font-medium text-gray-900">Connection</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' ? (
              <Cloud className="text-emerald-600" size={20} />
            ) : connectionStatus === 'disconnected' ? (
              <CloudOff className="text-rose-600" size={20} />
            ) : (
              <RefreshCw className="animate-spin text-gray-500" size={20} />
            )}
            <div>
              <p className="font-medium text-gray-900">
                {connectionStatus === 'connected'
                  ? 'Connected to CloudBase'
                  : connectionStatus === 'disconnected'
                  ? 'Not connected'
                  : 'Checking connectivity��'}
              </p>
              <p className="text-sm text-gray-600">
                {user ? `User ID: ${user.uid?.slice(0, 8)}��` : 'Not authenticated'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void checkUserAndConnection()}
            className="btn-secondary"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      </section>

      {!user && (
        <section className="card">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Sign in to the cloud</h3>
          <p className="mb-4 text-sm text-gray-600">
            Sync entries across devices or create manual backups by connecting to your CloudBase project.
          </p>
          <button type="button" onClick={() => void handleLogin()} className="btn-primary" disabled={isLoading}>
            <UserPlus size={18} />
            <span>Anonymous login</span>
          </button>
        </section>
      )}

      {user && (
        <section className="card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Local entries</p>
              <p className="text-2xl font-semibold text-gray-900">{entries.length}</p>
              {lastSyncTime && (
                <p className="text-xs text-gray-500">
                  Last sync: {format(new Date(lastSyncTime), 'MMM dd, yyyy HH:mm')}
                </p>
              )}
            </div>
            <button type="button" onClick={() => void handleLogout()} className="btn-secondary" disabled={isLoading}>
              <LogOut size={18} />
              <span>Sign out</span>
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => void handleSyncToCloud()}
              className="btn-primary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Upload size={18} />
              <span>Sync to cloud</span>
            </button>
            <button
              type="button"
              onClick={() => void handleLoadFromCloud()}
              className="btn-secondary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Download size={18} />
              <span>Restore from cloud</span>
            </button>
            <button
              type="button"
              onClick={() => void handleBackupSnapshot()}
              className="btn-secondary flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              <Save size={18} />
              <span>Create backup snapshot</span>
            </button>
            <div className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
              <AlertCircle size={16} className="text-gray-400" />
              Manual backups are stored as separate snapshots in CloudBase.
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
            <p>
              To enable cloud capabilities ensure the following environment variables are defined in your deployment:
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs">
              <li><code>VITE_CLOUDBASE_ENV</code> �C CloudBase environment ID</li>
              <li><code>VITE_CLOUDBASE_REGION</code> �C Region (defaults to <code>ap-shanghai</code>)</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
};

export default SettingsPage;


