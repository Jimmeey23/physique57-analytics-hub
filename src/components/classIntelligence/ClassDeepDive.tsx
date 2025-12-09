import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, TrendingUp, DollarSign, Users, BarChart3, Eye } from 'lucide-react';
import type { SessionData } from './types';
import RankingsAdvanced from './RankingsAdvanced';
import DataTable from './DataTable';
import { calculateMetrics, formatNumber, formatPercentage, formatCurrency } from './utils';
import EnhancedDrilldownModal from './EnhancedDrilldownModal';

type Props = { sessions: SessionData[] };

interface DrilldownData {
  title: string;
  sessions: SessionData[];
}

export default function ClassDeepDive({ sessions }: Props) {
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  
  // Helper to normalize class names similar to repo styling
  const normalizeClassName = (name?: string) => (name || '').toLowerCase().replace(/\s*express\s*/gi, '').replace(/\s+/g, ' ').trim();

  const classFormats = useMemo(() => {
    const map = new Map<string, string>();
    sessions.forEach(s => {
      const n = normalizeClassName(s.className);
      if (!map.has(n)) map.set(n, s.className || 'Unknown');
    });
    return Array.from(map.entries()).map(([normalized, original]) => ({ normalized, original })).sort((a,b) => a.original.localeCompare(b.original));
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (selectedClasses.length === 0) return sessions;
    return sessions.filter(s => selectedClasses.includes(normalizeClassName(s.className)));
  }, [sessions, selectedClasses]);

  const metrics = calculateMetrics(filteredSessions);
  const byTrainer = useMemo(() => {
    const map = new Map<string, SessionData[]>();
    filteredSessions.forEach(s => {
      const key = s.trainerName || 'Unknown';
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return Array.from(map.entries()).map(([name, rows]) => ({
      name,
      rows,
      m: calculateMetrics(rows)
    })).sort((a,b) => b.m.fillRate - a.m.fillRate);
  }, [filteredSessions]);

  const handleMetricClick = (title: string, data: SessionData[]) => {
    setDrilldownData({ title, sessions: data });
    setIsDrilldownOpen(true);
  };

  const closeDrilldown = () => {
    setIsDrilldownOpen(false);
    setDrilldownData(null);
  };

  const metricCards = [
    {
      title: 'Total Classes',
      value: formatNumber(metrics.sessionCount),
      icon: Calendar,
      gradient: 'from-blue-700 via-blue-800 to-blue-900',
      subValue: `${Math.round(metrics.totalCapacity - metrics.totalCheckIns)} unused capacity`,
      data: sessions
    },
    {
      title: 'Total Check-ins',
      value: formatNumber(metrics.totalCheckIns),
      icon: Users,
      gradient: 'from-green-600 via-green-700 to-green-800',
      subValue: `Avg: ${formatNumber(metrics.avgCheckIns, 1)}`,
      data: sessions.filter(s => (s.checkedInCount || 0) > 0)
    },
    {
      title: 'Fill Rate',
      value: formatPercentage(metrics.fillRate),
      icon: TrendingUp,
      gradient: 'from-purple-600 via-purple-700 to-purple-800',
      subValue: `${formatNumber(metrics.totalCapacity)} capacity`,
      data: sessions
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
      subValue: `Avg: ${formatCurrency(metrics.sessionCount > 0 ? metrics.totalRevenue / metrics.sessionCount : 0)}`,
      data: sessions.filter(s => (s.totalPaid || 0) > 0)
    },
    {
      title: 'Consistency Score',
      value: `${metrics.consistency}%`,
      icon: BarChart3,
      gradient: 'from-orange-600 via-orange-700 to-orange-800',
      subValue: 'Variance-based stability',
      data: sessions
    }
  ];
  return (
    <>
      <div className="space-y-6">
        {/* Header block to mirror GitHub styling */}
        <div className="bg-white/80 glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-8">
            <div className="flex items-center gap-4 mb-2">
              <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">Class Deep Dive</h2>
                <p className="text-blue-100 text-xs mt-1">Comprehensive format analysis & performance insights</p>
              </div>
            </div>
            {/* Multi-select class formats dropdown */}
            <div className="mt-6">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-white/80 mb-2">Select Class Formats (Multiple)</label>
              {/* selected pills */}
              {selectedClasses.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedClasses.map(n => {
                    const f = classFormats.find(x => x.normalized === n);
                    return (
                      <button key={n} onClick={() => setSelectedClasses(prev => prev.filter(v => v !== n))} className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-lg text-white text-xs font-semibold hover:bg-white/30 transition-all">
                        {f?.original || n}
                        <span className="text-white/70 hover:text-white">✕</span>
                      </button>
                    );
                  })}
                  <button onClick={() => setSelectedClasses([])} className="px-3 py-1.5 bg-red-500/20 backdrop-blur-sm rounded-lg text-red-200 text-xs font-semibold hover:bg-red-500/30 transition-all">Clear All</button>
                </div>
              )}
              <div className="relative">
                <select value="" onChange={(e) => { const v = e.target.value; if (v && !selectedClasses.includes(v)) setSelectedClasses(prev => [...prev, v]); }} className="w-full px-4 py-3 pr-10 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white font-semibold text-sm appearance-none cursor-pointer hover:bg-white/20 focus:bg-white/20 focus:border-white/50 focus:ring-2 focus:ring-white/30 transition-all">
                  <option value="" className="bg-slate-800">{selectedClasses.length === 0 ? '-- Select class format(s) --' : '-- Add another class --'}</option>
                  {classFormats.filter(f => !selectedClasses.includes(f.normalized)).map(f => (
                    <option key={f.normalized} value={f.normalized} className="bg-slate-800">{f.original}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {/* Metrics Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {metricCards.map((card, index) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -2 }}
                  className={`glass-card rounded-2xl p-6 cursor-pointer bg-gradient-to-br ${card.gradient} text-white shadow-xl hover:shadow-2xl transition-all duration-300 border border-white/20`}
                  onClick={() => handleMetricClick(card.title, card.data)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <Eye className="w-4 h-4 opacity-60" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium opacity-90">{card.title}</p>
                    <p className="text-2xl font-bold">{card.value}</p>
                    <p className="text-xs opacity-70">{card.subValue}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Blue metrics card already above; below display Trainer Rankings, Performance Rankings, and All Historical Data */}

        {/* Trainer Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Trainer Rankings
            </h3>
          </div>
          {/* Reuse RankingsAdvanced with trainer included toggle enabled */}
          <RankingsAdvanced sessions={filteredSessions} />
        </motion.div>

        {/* Performance Rankings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Performance Rankings
            </h3>
          </div>
          <RankingsAdvanced sessions={filteredSessions} />
        </motion.div>

        {/* All Historical Sessions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
              All Historical Sessions
            </h3>
          </div>
          <DataTable sessions={filteredSessions} />
        </motion.div>

        {/* Trainer Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl backdrop-blur-xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent">
              Trainer Breakdown
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {byTrainer.slice(0, 8).map((t) => (
              <div key={t.name} className="p-4 bg-white/80 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{t.name}</div>
                    <div className="text-xs text-gray-600">{t.m.sessionCount} sessions • {formatNumber(t.m.avgCheckIns,1)} avg • {formatPercentage(t.m.fillRate)}</div>
                  </div>
                  <button
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white"
                    onClick={() => handleMetricClick(`Trainer: ${t.name}`, t.rows)}
                  >
                    View
                  </button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Drilldown Modal */}
      <AnimatePresence>
        {isDrilldownOpen && drilldownData && (
          <EnhancedDrilldownModal
            isOpen={isDrilldownOpen}
            onClose={closeDrilldown}
            sessions={drilldownData.sessions}
            title={drilldownData.title}
          />
        )}
      </AnimatePresence>
    </>
  );
}
