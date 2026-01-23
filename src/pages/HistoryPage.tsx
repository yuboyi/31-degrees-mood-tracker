import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { Calendar, Trash2 } from 'lucide-react';

import { useMoodStore } from '../store/moodStore';
import { MOOD_EMOJIS, MOOD_LABELS, MoodEntry } from '../types';

const HistoryPage: React.FC = () => {
  const { entries, deleteEntry } = useMoodStore();
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [selectedMood, setSelectedMood] = useState<number | null>(null);

  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const filteredEntries = entries
    .filter((entry) => {
      const entryDate = new Date(entry.date);
      const inMonth = entryDate >= monthStart && entryDate <= monthEnd;
      const matchesMood = selectedMood === null || entry.mood === selectedMood;
      return inMonth && matchesMood;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleDeleteEntry = (entry: MoodEntry) => {
    if (window.confirm('Delete this entry? The action cannot be undone.')) {
      deleteEntry(entry.id);
    }
  };

  const months = Array.from({ length: 6 }, (_, index) => subMonths(new Date(), index));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar size={24} className="text-gray-600" />
        <h2 className="text-xl font-semibold text-gray-900">Mood timeline</h2>
      </div>

      <section className="card space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Month</label>
            <select
              value={format(selectedMonth, 'yyyy-MM')}
              onChange={(event) => setSelectedMonth(new Date(`${event.target.value}-01`))}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              {months.map((month) => (
                <option key={format(month, 'yyyy-MM')} value={format(month, 'yyyy-MM')}>
                  {format(month, 'MMMM yyyy')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Mood filter</label>
            <select
              value={selectedMood ?? ''}
              onChange={(event) => setSelectedMood(event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-lg border border-gray-300 p-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All moods</option>
              {[1, 2, 3, 4, 5].map((mood) => (
                <option key={mood} value={mood}>
                  {MOOD_EMOJIS[mood as keyof typeof MOOD_EMOJIS]} {MOOD_LABELS[mood as keyof typeof MOOD_LABELS]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Showing {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'} for {format(selectedMonth, 'MMMM yyyy')}.
        </p>
      </section>

      {filteredEntries.length === 0 ? (
        <div className="card py-8 text-center">
          <div className="mb-4 text-4xl text-gray-300">??</div>
          <h3 className="mb-2 text-lg font-medium text-gray-900">No entries yet</h3>
          <p className="text-sm text-gray-600">
            {selectedMood !== null
              ? `No ${MOOD_LABELS[selectedMood as keyof typeof MOOD_LABELS].toLowerCase()} entries recorded in ${format(selectedMonth, 'MMMM yyyy')}.`
              : `No moods have been captured in ${format(selectedMonth, 'MMMM yyyy')}.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.map((entry) => (
            <div key={entry.id} className="card">
              <div className="flex items-start gap-4">
                <span className="text-3xl">{MOOD_EMOJIS[entry.mood]}</span>
                <div className="flex-1">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{MOOD_LABELS[entry.mood]}</p>
                      <p className="text-sm text-gray-600">
                        {format(new Date(entry.date), 'MMMM dd, yyyy (EEEE)')}
                      </p>
                    </div>
                    <span className="text-sm text-gray-500">{entry.mood}/5</span>
                  </div>

                  {entry.note && (
                    <div className="mb-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                      {entry.note}
                    </div>
                  )}

                  {entry.tags && entry.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1">
                      {entry.tags.map((tag, index) => (
                        <span key={`${entry.id}-tag-${index}`} className="rounded-full bg-blue-100 px-2 py-1 text-xs text-blue-800">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>
                      Logged at {format(new Date(entry.createdAt), 'HH:mm')}
                      {entry.updatedAt && ` ¡¤ updated ${format(new Date(entry.updatedAt), 'HH:mm')}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteEntry(entry)}
                      className="rounded p-1 text-red-600 transition-colors hover:bg-red-100"
                      title="Delete entry"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
