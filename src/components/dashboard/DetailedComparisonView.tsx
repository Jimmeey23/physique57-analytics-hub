import React, { useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { getAllFormats, getClassFormat } from '@/utils/classTypeUtils';
import { BarChart3, TrendingUp, Users, DollarSign, Percent, Activity, User, Clock } from 'lucide-react';

interface DetailedComparisonViewProps {
  data: SessionData[];
}

type MetricType = 'revenue' | 'sessions' | 'fill' | 'class-avg' | 'rev-per-seat' | 'rev-per-session' | 'empty-classes';
type ViewMode = 'trainer' | 'time' | 'day';

const DetailedComparisonView: React.FC<DetailedComparisonViewProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [metric, setMetric] = useState<MetricType>('revenue');
  const [viewMode, setViewMode] = useState<ViewMode>('trainer');

  const formats = useMemo(() => {
    // Get unique categorized formats instead of raw class names
    const formatSet = new Set(sessions.map(s => getClassFormat(s.cleanedClass || s.classType)));
    return Array.from(formatSet);
  }, [sessions]);
  
  const [selectedFormat, setSelectedFormat] = React.useState<string>(() => formats[0] || '');

  const formatData = useMemo(() => {
    const selected = selectedFormat || formats[0];
    if (!selected || sessions.length === 0) return null;

    const rows = sessions.filter(s => getClassFormat(s.cleanedClass || s.classType) === selected);
    const byTrainer = new Map<string, { sessions: number; revenue: number; checkins: number; capacity: number }>();
    const byTime = new Map<string, { sessions: number; revenue: number; checkins: number; capacity: number }>();
    const byDay = new Map<string, { sessions: number; revenue: number; checkins: number; capacity: number }>();

    rows.forEach(s => {
      // By trainer
      let tk = s.trainerName || 'Unknown';
      if (!byTrainer.has(tk)) byTrainer.set(tk, { sessions: 0, revenue: 0, checkins: 0, capacity: 0 });
      const t = byTrainer.get(tk)!;
      t.sessions++;
      t.revenue += s.totalPaid || s.revenue || 0;
      t.checkins += s.checkedInCount || 0;
      t.capacity += s.capacity || 0;

      // By time
      let timk = s.time || 'Unknown';
      if (!byTime.has(timk)) byTime.set(timk, { sessions: 0, revenue: 0, checkins: 0, capacity: 0 });
      const tm = byTime.get(timk)!;
      tm.sessions++;
      tm.revenue += s.totalPaid || s.revenue || 0;
      tm.checkins += s.checkedInCount || 0;
      tm.capacity += s.capacity || 0;

      // By day
      let dk = s.dayOfWeek || 'Unknown';
      if (!byDay.has(dk)) byDay.set(dk, { sessions: 0, revenue: 0, checkins: 0, capacity: 0 });
      const d = byDay.get(dk)!;
      d.sessions++;
      d.revenue += s.totalPaid || s.revenue || 0;
      d.checkins += s.checkedInCount || 0;
      d.capacity += s.capacity || 0;
    });

    return { byTrainer, byTime, byDay };
  }, [sessions, selectedFormat, formats]);

  const getTableIcon = (type: string) => {
    if (type === 'trainer') return <User className="w-4 h-4" />;
    if (type === 'time') return <Clock className="w-4 h-4" />;
    return <BarChart3 className="w-4 h-4" />;
  };

  const renderTable = (data: Map<string, any>, title: string, type: string) => {
    if (!data || data.size === 0) return null;

    const sorted = Array.from(data.entries()).sort((a, b) => {
      if (metric === 'revenue') return b[1].revenue - a[1].revenue;
      if (metric === 'sessions') return b[1].sessions - a[1].sessions;
      return (b[1].capacity > 0 ? (b[1].checkins / b[1].capacity) * 100 : 0) - (a[1].capacity > 0 ? (a[1].checkins / a[1].capacity) * 100 : 0);
    });

    return (
      <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white hover:shadow-md transition-all duration-200">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
            {getTableIcon(type)}
            {title}
          </h3>
        </div>
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-slate-700">Name</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Sessions</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Revenue</th>
                <th className="px-6 py-3 text-right font-bold text-slate-700">Fill Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sorted.map(([name, stats], idx) => {
                const fillRate = stats.capacity > 0 ? (stats.checkins / stats.capacity) * 100 : 0;
                return (
                  <tr key={name} className="hover:bg-slate-50 transition-colors duration-150 group">
                    <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-600">{name}</td>
                    <td className="px-6 py-4 text-right text-slate-600 font-medium">{formatNumber(stats.sessions)}</td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900">{formatCurrency(stats.revenue)}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                        fillRate >= 80 ? 'bg-blue-800 text-white' : 
                        'bg-rose-600 text-white'
                      }`}>
                        {fillRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with Beautiful Typography */}
      <div className="bg-gradient-to-r from-slate-50 via-blue-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Detailed Performance Breakdown</h3>
            <p className="text-sm text-slate-600">Deep dive analysis of trainer, time slot, and day of week performance metrics</p>
          </div>
          <div className="text-3xl opacity-10">📊</div>
        </div>
      </div>

      {/* Format Selector & Metric Chooser */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Select Class Format
          </label>
          <div className="flex gap-2 flex-wrap">
            {formats.map(f => (
              <button 
                key={f} 
                onClick={() => setSelectedFormat(f)} 
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  selectedFormat === f 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105' 
                    : 'bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200">
          <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Sort by Metric
          </label>
          <div className="flex gap-2 flex-wrap">
            {(['revenue', 'sessions', 'fill'] as const).map(m => (
              <button 
                key={m} 
                onClick={() => setMetric(m)} 
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-1 ${
                  metric === m 
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-300 shadow-md' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                {m === 'revenue' ? <DollarSign className="w-4 h-4" /> : m === 'sessions' ? <BarChart3 className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
                {m === 'revenue' ? 'Revenue' : m === 'sessions' ? 'Sessions' : 'Fill Rate'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Tables */}
      {formatData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div>{renderTable(formatData.byTrainer, 'By Trainer', 'trainer')}</div>
            <div>{renderTable(formatData.byTime, 'By Time', 'time')}</div>
            <div>{renderTable(formatData.byDay, 'By Day of Week', 'day')}</div>
          </div>

          {/* Summary Stats */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Format Overview: {selectedFormat}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(() => {
                const all = Array.from(formatData.byTrainer.values());
                const totalSessions = all.reduce((s, r) => s + r.sessions, 0);
                const totalRevenue = all.reduce((s, r) => s + r.revenue, 0);
                const totalCheckins = all.reduce((s, r) => s + r.checkins, 0);
                const totalCapacity = all.reduce((s, r) => s + r.capacity, 0);
                const avgFill = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;

                return [
                  { label: 'Total Sessions', value: formatNumber(totalSessions), icon: BarChart3, color: 'from-blue-500 to-blue-600' },
                  { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'from-green-500 to-green-600' },
                  { label: 'Avg Fill Rate', value: `${avgFill.toFixed(1)}%`, icon: Percent, color: 'from-purple-500 to-purple-600' },
                  { label: 'Avg Rev/Session', value: formatCurrency(totalSessions > 0 ? totalRevenue / totalSessions : 0), icon: TrendingUp, color: 'from-orange-500 to-orange-600' }
                ];
              })().map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-md transition-all duration-200 group">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${s.color} flex items-center justify-center text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs text-slate-600 font-semibold">{s.label}</div>
                    </div>
                    <div className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{s.value}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetailedComparisonView;
