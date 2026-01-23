import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

import { useMoodStore } from '../store/moodStore';
import { MoodLevel, MOOD_EMOJIS, MOOD_LABELS } from '../types';

const MOOD_OPTIONS: MoodLevel[] = [1, 2, 3, 4, 5];

const AddMoodPage: React.FC = () => {
  const navigate = useNavigate();
  const { addEntry, getTodayEntry } = useMoodStore();
  const todayEntry = getTodayEntry();

  const [selectedMood, setSelectedMood] = useState<MoodLevel>(todayEntry?.mood ?? 3);
  const [note, setNote] = useState(todayEntry?.note ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      addEntry(selectedMood, note.trim() ? note.trim() : undefined);
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Failed to save mood entry', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-lg p-2 transition-colors hover:bg-gray-100"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h2 className="text-xl font-semibold text-gray-900">
          {todayEntry ? 'Update today¡¯s mood' : 'Log today¡¯s mood'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="card">
          <h3 className="mb-4 text-lg font-medium text-gray-900">How do you feel right now?</h3>
          <div className="space-y-3">
            {MOOD_OPTIONS.map((mood) => {
              const isActive = selectedMood === mood;
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`flex w-full items-center space-x-4 rounded-xl border-2 bg-white p-4 transition-all ${
                    isActive ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-3xl">{MOOD_EMOJIS[mood]}</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900">{MOOD_LABELS[mood]}</p>
                    <p className="text-sm text-gray-600">{mood} / 5</p>
                  </div>
                  {isActive && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                      <span className="h-2 w-2 rounded-full bg-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="card">
          <h3 className="mb-4 text-lg font-medium text-gray-900">What influenced your mood? (optional)</h3>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Share the highlight, challenge, or a quick reflection from today¡­"
            className="h-32 w-full resize-none rounded-lg border border-gray-300 p-4 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
            maxLength={500}
          />
          <div className="mt-2 flex justify-end text-xs text-gray-500">{note.length}/500</div>
        </section>

        <section className="card">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex w-full items-center justify-center space-x-2 py-3"
          >
            <Save size={20} />
            <span>{isSubmitting ? 'Saving¡­' : todayEntry ? 'Update entry' : 'Save entry'}</span>
          </button>
        </section>

        {todayEntry && (
          <p className="text-center text-xs text-gray-500">
            Last updated: {new Date(todayEntry.createdAt).toLocaleString()}
          </p>
        )}
      </form>
    </div>
  );
};

export default AddMoodPage;
