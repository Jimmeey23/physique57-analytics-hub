import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { getAllFormats, getClassFormat } from '@/utils/classTypeUtils';
import {
  Activity,
  BarChart3,
  CalendarDays,
  Clock,
  DollarSign,
  Percent,
  TrendingUp,
  User,
  Users,
} from 'lucide-react';

interface DetailedComparisonViewProps {
  data: SessionData[];
}

type MetricType =
  | 'revenue'
  | 'sessions'
  | 'attendance'
  | 'booked'
  | 'fill'
  | 'booking-rate'
  | 'show-up'
  | 'no-show'
  | 'late-cancel'
  | 'rev-per-session'
  | 'rev-per-attendee';

interface AggregateStats {
  sessions: number;
  revenue: number;
  checkins: number;
  capacity: number;
  booked: number;
  lateCancelled: number;
  emptyClasses: number;
}

interface MetricRow extends AggregateStats {
  name: string;
  fillRate: number;
  bookingRate: number;
  showUpRate: number;
  noShowRate: number;
  lateCancelRate: number;
  avgAttendance: number;
  revPerSession: number;
  revPerAttendee: number;
}

const EMPTY_STATS: AggregateStats = {
  sessions: 0,
  revenue: 0,
  checkins: 0,
  capacity: 0,
  booked: 0,
  lateCancelled: 0,
  emptyClasses: 0,
};

const createEmptyStats = (): AggregateStats => ({ ...EMPTY_STATS });

const toMetricRow = (name: string, stats: AggregateStats): MetricRow => {
  const safeBooked = Math.max(stats.booked, 0);
  const noShowCount = Math.max(safeBooked - stats.checkins - stats.lateCancelled, 0);

  return {
    ...stats,
    name,
    fillRate: stats.capacity > 0 ? (stats.checkins / stats.capacity) * 100 : 0,
    bookingRate: stats.capacity > 0 ? (safeBooked / stats.capacity) * 100 : 0,
    showUpRate: safeBooked > 0 ? (stats.checkins / safeBooked) * 100 : 0,
    noShowRate: safeBooked > 0 ? (noShowCount / safeBooked) * 100 : 0,
    lateCancelRate: safeBooked > 0 ? (stats.lateCancelled / safeBooked) * 100 : 0,
    avgAttendance: stats.sessions > 0 ? stats.checkins / stats.sessions : 0,
    revPerSession: stats.sessions > 0 ? stats.revenue / stats.sessions : 0,
    revPerAttendee: stats.checkins > 0 ? stats.revenue / stats.checkins : 0,
  };
};

const getMetricSortValue = (row: MetricRow, metric: MetricType) => {
  switch (metric) {
    case 'revenue':
      return row.revenue;
    case 'sessions':
      return row.sessions;
    case 'attendance':
      return row.checkins;
    case 'booked':
      return row.booked;
    case 'fill':
      return row.fillRate;
    case 'booking-rate':
      return row.bookingRate;
    case 'show-up':
      return row.showUpRate;
    case 'no-show':
      return row.noShowRate;
    case 'late-cancel':
      return row.lateCancelRate;
    case 'rev-per-session':
      return row.revPerSession;
    case 'rev-per-attendee':
      return row.revPerAttendee;
  }
};

const sortRows = (rows: MetricRow[], metric: MetricType) => {
  return [...rows].sort((a, b) => getMetricSortValue(b, metric) - getMetricSortValue(a, metric));
};

const DetailedComparisonView: React.FC<DetailedComparisonViewProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [selectedFormat, setSelectedFormat] = useState<string>('');

  const formats = useMemo(() => {
    const presentFormats = new Set(sessions.map((s) => getClassFormat(s.cleanedClass || s.classType)));
    return getAllFormats().filter((format) => presentFormats.has(format));
  }, [sessions]);

  useEffect(() => {
    if (!selectedFormat || !formats.includes(selectedFormat as any)) {
      setSelectedFormat(formats[0] || '');
    }
  }, [formats, selectedFormat]);

  const formatSessions = useMemo(() => {
    if (!selectedFormat) return [] as SessionData[];
    return sessions.filter((s) => getClassFormat(s.cleanedClass || s.classType) === selectedFormat);
  }, [sessions, selectedFormat]);

  const formatOverview = useMemo(() => {
    const stats = formatSessions.reduce<AggregateStats>((acc, session) => {
      acc.sessions += 1;
      acc.revenue += session.totalPaid || session.revenue || 0;
      acc.checkins += session.checkedInCount || 0;
      acc.capacity += session.capacity || 0;
      acc.booked += session.bookedCount || 0;
      acc.lateCancelled += session.lateCancelledCount || 0;
      acc.emptyClasses += (session.checkedInCount || 0) === 0 ? 1 : 0;
      return acc;
    }, createEmptyStats());

    return toMetricRow(selectedFormat || 'Selected Format', stats);
  }, [formatSessions, selectedFormat]);

  const formatData = useMemo(() => {
    const trainerMap = new Map<string, AggregateStats>();
    const timeMap = new Map<string, AggregateStats>();
    const dayMap = new Map<string, AggregateStats>();

    const collect = (map: Map<string, AggregateStats>, key: string, session: SessionData) => {
      const current = map.get(key) || createEmptyStats();
      current.sessions += 1;
      current.revenue += session.totalPaid || session.revenue || 0;
      current.checkins += session.checkedInCount || 0;
      current.capacity += session.capacity || 0;
      current.booked += session.bookedCount || 0;
      current.lateCancelled += session.lateCancelledCount || 0;
      current.emptyClasses += (session.checkedInCount || 0) === 0 ? 1 : 0;
      map.set(key, current);
    };

    formatSessions.forEach((session) => {
      collect(trainerMap, session.trainerName || 'Unknown Trainer', session);
      collect(timeMap, session.time || 'Unknown Time', session);
      collect(dayMap, session.dayOfWeek || 'Unknown Day', session);
    });

    return {
      byTrainer: sortRows(Array.from(trainerMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
      byTime: sortRows(Array.from(timeMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
      byDay: sortRows(Array.from(dayMap.entries()).map(([name, stats]) => toMetricRow(name, stats)), metric),
    };
  }, [formatSessions, metric]);

  const bestPerformers = useMemo(() => {
    const trainerLeader = formatData.byTrainer[0];
    const timeLeader = formatData.byTime[0];
    const dayLeader = formatData.byDay[0];

    return [
      {
        label: 'Top Trainer',
        value: trainerLeader?.name || '—',
        subvalue: trainerLeader ? `${formatNumber(trainerLeader.checkins)} attendance` : '—',
        icon: User,
      },
      {
        label: 'Best Time Slot',
        value: timeLeader?.name || '—',
        subvalue: timeLeader ? formatPercentage(timeLeader.fillRate) : '—',
        icon: Clock,
      },
      {
        label: 'Strongest Day',
        value: dayLeader?.name || '—',
        subvalue: dayLeader ? formatCurrency(dayLeader.revenue) : '—',
        icon: CalendarDays,
      },
    ];
  }, [formatData]);

  const summaryCards = useMemo(() => {
    const noShows = Math.max(formatOverview.booked - formatOverview.checkins - formatOverview.lateCancelled, 0);

    return [
      { label: 'Total Sessions', value: formatNumber(formatOverview.sessions), accent: 'from-blue-500 to-blue-600', icon: BarChart3 },
      { label: 'Attendance', value: formatNumber(formatOverview.checkins), accent: 'from-sky-500 to-cyan-600', icon: Users },
      { label: 'Booked', value: formatNumber(formatOverview.booked), accent: 'from-indigo-500 to-indigo-600', icon: Activity },
      { label: 'Fill Rate', value: formatPercentage(formatOverview.fillRate), accent: 'from-purple-500 to-purple-600', icon: Percent },
      { label: 'Booking Rate', value: formatPercentage(formatOverview.bookingRate), accent: 'from-violet-500 to-fuchsia-600', icon: TrendingUp },
      { label: 'Show-up Rate', value: formatPercentage(formatOverview.showUpRate), accent: 'from-emerald-500 to-emerald-600', icon: Users },
      { label: 'No-shows', value: formatNumber(noShows), accent: 'from-amber-500 to-orange-600', icon: Activity },
      { label: 'Late Cancels', value: formatNumber(formatOverview.lateCancelled), accent: 'from-rose-500 to-rose-600', icon: Activity },
      { label: 'Revenue', value: formatCurrency(formatOverview.revenue), accent: 'from-green-500 to-green-600', icon: DollarSign },
      { label: 'Rev / Session', value: formatCurrency(formatOverview.revPerSession), accent: 'from-teal-500 to-teal-600', icon: DollarSign },
      { label: 'Rev / Attendee', value: formatCurrency(formatOverview.revPerAttendee), accent: 'from-cyan-500 to-blue-600', icon: DollarSign },
      { label: 'Empty Classes', value: formatNumber(formatOverview.emptyClasses), accent: 'from-slate-500 to-slate-600', icon: BarChart3 },
    ];
  }, [formatOverview]);

  const getTableIcon = (type: 'trainer' | 'time' | 'day') => {
    if (type === 'trainer') return <User className="w-4 h-4" />;
    if (type === 'time') return <Clock className="w-4 h-4" />;
    return <CalendarDays className="w-4 h-4" />;
  };

  const renderTable = (rows: MetricRow[], title: string, type: 'trainer' | 'time' | 'day') => {
    if (rows.length === 0) return null;

    return (
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white hover:shadow-md transition-all duration-200">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            {getTableIcon(type)}
            {title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">Sorted by {metric.replace(/-/g, ' ')} for {selectedFormat}</p>
        </div>
        <div className="overflow-auto">
          <table data-table="class-formats-detailed-comparison" data-table-name="Class Formats Detailed Comparison" className="w-full text-sm min-w-[1180px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-slate-700 sticky left-0 bg-slate-50">Name</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Sessions</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Attendance</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Booked</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Fill %</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Booking %</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Show-up %</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">No-show %</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Late Cancel %</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Avg/Class</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Revenue</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Rev/Class</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Rev/Attendee</th>
                <th className="px-4 py-3 text-right font-bold text-slate-700">Empty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row) => (
                <tr key={row.name} className="hover:bg-slate-50 transition-colors duration-150 group">
                  <td className="px-4 py-3 font-semibold text-slate-900 group-hover:text-blue-600 sticky left-0 bg-white group-hover:bg-slate-50">{row.name}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.sessions)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.checkins)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.booked)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatPercentage(row.fillRate)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatPercentage(row.bookingRate)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatPercentage(row.showUpRate)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatPercentage(row.noShowRate)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatPercentage(row.lateCancelRate)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.avgAttendance)}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">{formatCurrency(row.revenue)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.revPerSession)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.revPerAttendee)}</td>
                  <td className="px-4 py-3 text-right text-slate-700">{formatNumber(row.emptyClasses)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Detailed Performance Breakdown</h3>
            <p className="text-sm text-slate-600 max-w-3xl">
              Format-specific breakdown across trainers, time slots, and weekdays with booking funnel,
              attendance, cancellations, and revenue-efficiency metrics.
            </p>
          </div>
          <div className="text-3xl opacity-10">📊</div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Select Class Format
          </label>
          <div className="flex gap-2 flex-wrap">
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => setSelectedFormat(format)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  selectedFormat === format
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Rank rows by metric
          </label>
          <div className="flex gap-2 flex-wrap">
            {([
              ['revenue', 'Revenue', DollarSign],
              ['attendance', 'Attendance', Users],
              ['sessions', 'Sessions', BarChart3],
              ['booked', 'Booked', Users],
              ['fill', 'Fill Rate', Percent],
              ['booking-rate', 'Booking Rate', TrendingUp],
              ['show-up', 'Show-up Rate', Users],
              ['no-show', 'No-show Rate', Activity],
              ['late-cancel', 'Late Cancel Rate', Activity],
              ['rev-per-session', 'Rev / Session', DollarSign],
              ['rev-per-attendee', 'Rev / Attendee', DollarSign],
            ] as Array<[MetricType, string, React.ComponentType<{ className?: string }>]>).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => setMetric(value)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                  metric === value
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-300 shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {selectedFormat && formatSessions.length > 0 && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {summaryCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.label} className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${card.accent} flex items-center justify-center text-white`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-xs text-slate-600 font-semibold leading-tight">{card.label}</div>
                  </div>
                  <div className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{card.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {bestPerformers.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500 mb-3">
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </div>
                  <div className="text-lg font-bold text-slate-900">{item.value}</div>
                  <div className="text-sm text-slate-600 mt-1">{item.subvalue}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 gap-5">
            {renderTable(formatData.byTrainer, 'Trainer Breakdown', 'trainer')}
            {renderTable(formatData.byTime, 'Time Slot Breakdown', 'time')}
            {renderTable(formatData.byDay, 'Day of Week Breakdown', 'day')}
          </div>
        </>
      )}

      {selectedFormat && formatSessions.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
          No data is available for the selected format.
        </div>
      )}
    </div>
  );
};

export default DetailedComparisonView;
