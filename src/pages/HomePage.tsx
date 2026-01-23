import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

import { useMoodStore } from '../store/moodStore';
import { MOOD_EMOJIS, MOOD_LABELS } from '../types';

const HomePage: React.FC = () => {
  const { entries, getTodayEntry, getRecentEntries } = useMoodStore();
  const todayEntry = getTodayEntry();
  const recentEntries = getRecentEntries(7);

  const averageMood =
    recentEntries.length > 0
      ? recentEntries.reduce((sum, entry) => sum + entry.mood, 0) / recentEntries.length
      : 0;

  const renderTodayCard = () => {
    if (!todayEntry) {
      return (
        <div className="flex flex-col items-center space-y-4">
          <div className="text-6xl text-gray-300">??</div>
          <p className="text-sm text-gray-500">Take a moment to notice how you feel right now.</p>
          <Link to="/add" className="btn-primary inline-flex items-center space-x-2">
            <Plus size={20} />
            <span>Log today¡¯s mood</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="text-6xl">{MOOD_EMOJIS[todayEntry.mood]}</div>
        <div className="text-lg font-medium text-gray-700">
          {MOOD_LABELS[todayEntry.mood]}
        </div>
        {todayEntry.note && (
          <p className="max-w-md rounded-lg bg-blue-50 px-4 py-2 text-sm text-blue-800">
            ¡°{todayEntry.note}¡±
          </p>
        )}
        <Link to="/add" className="text-sm font-medium text-blue-600 hover:text-blue-700">
          Update today¡¯s entry
        </Link>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="card text-center">
        <h2 className="mb-2 text-xl font-semibold text-gray-900">
          {todayEntry ? 'Today¡¯s mood is captured' : 'How are you feeling today?'}
        </h2>
        {renderTodayCard()}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
          <div className="text-sm text-gray-600">Days logged</div>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {averageMood > 0 ? averageMood.toFixed(1) : '--'}
          </div>
          <div className="text-sm text-gray-600">7 day average</div>
        </div>
      </div>

      {recentEntries.length > 0 && (
        <div className="card">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent entries</h3>
            <Link to="/history" className="text-sm font-medium text-blue-600 hover:text-blue-700">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {recentEntries.slice(0, 3).map((entry) => (
              <div key={entry.id} className="flex items-center space-x-3 rounded-lg bg-gray-50 p-3">
                <div className="text-2xl">{MOOD_EMOJIS[entry.mood]}</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{MOOD_LABELS[entry.mood]}</div>
                  <div className="text-sm text-gray-600">
                    {format(new Date(entry.date), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Link to="/stats" className="card transition-shadow hover:shadow-md">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-blue-100 p-2">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <div>
              <div className="font-medium text-gray-900">Insights</div>
              <div className="text-sm text-gray-600">Explore trends and patterns</div>
            </div>
          </div>
        </Link>

        <Link to="/history" className="card transition-shadow hover:shadow-md">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-green-100 p-2">
              <Calendar className="text-green-600" size={20} />
            </div>
            <div>
              <div className="font-medium text-gray-900">Timeline</div>
              <div className="text-sm text-gray-600">Revisit previous entries</div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
