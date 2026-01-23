import React, { useMemo, useState } from 'react';
import { format } from 'date-fns';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  BarChart3,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

import { useMoodStore } from '../store/moodStore';
import { MOOD_COLORS, MOOD_EMOJIS, MOOD_LABELS, MoodLevel } from '../types';
import {
  calculateSentimentBreakdown,
  calculateStreaks,
  getMoodExtremes,
} from '../utils/statistics';

const PERIOD_OPTIONS = [7, 30, 90] as const;

type Period = (typeof PERIOD_OPTIONS)[number];

type ChartDatum = {
  dateLabel: string;
  mood: number;
  note?: string;
};

type DistributionDatum = {
  mood: number;
  label: string;
  count: number;
  percentage: number;
};

type MoodTooltipPayload = {
  payload: ChartDatum;
};

const MoodTrendTooltip: React.FC<{
  active?: boolean;
  payload?: MoodTooltipPayload[];
}> = ({ active, payload }) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const { payload: datum } = payload[0];
  const label = MOOD_LABELS[datum.mood as keyof typeof MOOD_LABELS];

  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
        <span className="text-base">{MOOD_EMOJIS[datum.mood as keyof typeof MOOD_EMOJIS]}</span>
        {label}
      </div>
      <div className="mt-1 text-xs text-gray-600">{datum.dateLabel}</div>
      {datum.note && (
        <div className="mt-2 line-clamp-2 text-xs text-gray-500">{datum.note}</div>
      )}
    </div>
  );
};

const StatsPage: React.FC = () => {
  const { getStats, getRecentEntries } = useMoodStore();
  const [period, setPeriod] = useState<Period>(30);

  const stats = useMemo(() => getStats(period), [getStats, period]);
  const recentEntries = useMemo(
    () => getRecentEntries(period),
    [getRecentEntries, period],
  );

  const chartData: ChartDatum[] = useMemo(() => {
    return [...recentEntries]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-14)
      .map((entry) => ({
        dateLabel: format(new Date(entry.date), 'MMM dd'),
        mood: entry.mood,
        note: entry.note,
      }));
  }, [recentEntries]);

  const distributionData: DistributionDatum[] = useMemo(() => {
    return Object.entries(stats.distribution)
      .map(([moodKey, count]) => {
        const mood = Number(moodKey) as MoodLevel;
        return {
          mood,
          label: MOOD_LABELS[mood],
          count,
          percentage: stats.total > 0 ? (count / stats.total) * 100 : 0,
        };
      })
      .sort((a, b) => a.mood - b.mood);
  }, [stats.distribution, stats.total]);

  const streaks = useMemo(() => calculateStreaks(recentEntries), [recentEntries]);
  const extremes = useMemo(() => getMoodExtremes(recentEntries), [recentEntries]);
  const sentiment = useMemo(
    () => calculateSentimentBreakdown(recentEntries),
    [recentEntries],
  );

  const completionRate = useMemo(() => {
    const safePeriod = Math.max(1, period);
    return Math.min(100, Math.round((stats.total / safePeriod) * 100));
  }, [stats.total, period]);

  const trendCopy = useMemo(() => {
    switch (stats.trend) {
      case 'improving':
        return {
          label: 'Trending up',
          icon: <TrendingUp className="text-emerald-600" size={18} />,
          tone: 'text-emerald-600',
        };
      case 'declining':
        return {
          label: 'Needs attention',
          icon: <TrendingDown className="text-rose-600" size={18} />,
          tone: 'text-rose-600',
        };
      default:
        return {
          label: 'Holding steady',
          icon: <Minus className="text-slate-500" size={18} />,
          tone: 'text-slate-500',
        };
    }
  }, [stats.trend]);

  const hasData = chartData.length > 0;

  return (
    <div className="space-y-6 pb-24">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <BarChart3 size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Mood insights</h2>
            <p className="text-sm text-slate-600">
              Understand trends and spot the moments that shaped the last {period} days.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-600">Time frame</span>
          <div className="flex gap-2 rounded-lg border border-slate-200 bg-white p-1">
            {PERIOD_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  period === option
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Last {option} days
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Entries logged</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">{stats.total}</p>
          <p className="mt-1 text-xs text-slate-500">Captured within the selected window</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Average mood</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">
            {stats.total > 0 ? stats.average.toFixed(1) : '--'}
          </p>
          <p className="mt-1 text-xs text-slate-500">Scale of 1 (very low) to 5 (excellent)</p>
        </div>
        <div className="card">
          <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-500">
            {trendCopy.icon}
            Trend insight
          </p>
          <p className={`mt-2 text-lg font-semibold ${trendCopy.tone}`}>{trendCopy.label}</p>
          <p className="mt-1 text-xs text-slate-500">Based on comparing the recent halves</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Logging consistency</p>
          <p className="mt-2 text-2xl font-semibold text-blue-600">{completionRate}%</p>
          <p className="mt-1 text-xs text-slate-500">Days recorded during this period</p>
        </div>
      </div>

      {!hasData && (
        <div className="card flex flex-col items-center justify-center gap-3 text-center">
          <Activity className="text-slate-400" size={32} />
          <p className="text-lg font-semibold text-slate-900">No entries yet</p>
          <p className="text-sm text-slate-500">
            Log your mood for a few days so we can surface meaningful insights.
          </p>
        </div>
      )}

      {hasData && (
        <>
          <div className="card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Mood trend</h3>
                <p className="text-xs text-slate-500">
                  Last {chartData.length} data points ({Math.min(chartData.length, 14)} most recent days)
                </p>
              </div>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer>
                <AreaChart data={chartData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="mood-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="dateLabel" stroke="#94a3b8" tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[1, 5]}
                    allowDecimals={false}
                    stroke="#94a3b8"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<MoodTrendTooltip />} cursor={{ stroke: '#cbd5f5', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="mood"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#mood-area)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="card">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Mood distribution</h3>
                <span className="text-xs text-slate-500">How often each mood level appeared</span>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <BarChart data={distributionData} margin={{ top: 16, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#94a3b8" tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(148, 163, 184, 0.12)' }}
                      formatter={(value: number) => [`${value} day(s)`, 'Logged']}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      {distributionData.map((entry) => (
                        <Cell
                          key={entry.mood}
                          fill={MOOD_COLORS[entry.mood as keyof typeof MOOD_COLORS]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="text-purple-500" size={18} />
                <h3 className="text-lg font-semibold text-slate-900">Highlights</h3>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Current streak</p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">{streaks.currentStreak} days</p>
                  <p className="mt-1 text-xs text-slate-500">Longest streak: {streaks.longestStreak} days</p>
                </div>

                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Positive ratio</p>
                  <p className="mt-2 text-xl font-semibold text-emerald-600">
                    {sentiment.total > 0 ? Math.round(sentiment.positiveRatio * 100) : 0}%
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {sentiment.positive} upbeat day(s) �� {sentiment.challenging} challenging day(s)
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs uppercase tracking-wide text-slate-500">Notable moments</p>
                <ul className="mt-2 space-y-2 text-sm text-slate-600">
                  {extremes.bestDay && (
                    <li>
                      <span className="font-medium text-slate-900">Best day:</span>{' '}
                      {format(new Date(extremes.bestDay.date), 'MMM dd')} ��{' '}
                      {MOOD_EMOJIS[extremes.bestDay.mood as keyof typeof MOOD_EMOJIS]}{' '}
                      {MOOD_LABELS[extremes.bestDay.mood as keyof typeof MOOD_LABELS]}
                    </li>
                  )}
                  {extremes.toughDay && (
                    <li>
                      <span className="font-medium text-slate-900">Tougher day:</span>{' '}
                      {format(new Date(extremes.toughDay.date), 'MMM dd')} ��{' '}
                      {MOOD_EMOJIS[extremes.toughDay.mood as keyof typeof MOOD_EMOJIS]}{' '}
                      {MOOD_LABELS[extremes.toughDay.mood as keyof typeof MOOD_LABELS]}
                    </li>
                  )}
                  {sentiment.positive === 0 && (
                    <li>No strongly positive days yet �� try scheduling something uplifting!</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default StatsPage;



