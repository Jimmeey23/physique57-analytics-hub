import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Users, 
  BarChart3,
  Filter,
  Eye,
  Award,
  Target,
  Activity
} from 'lucide-react';
import type { SessionData } from './types';
import { calculateMetrics, formatNumber, formatPercentage, formatCurrency } from './utils';
import Rankings from './RankingsAdvanced';
import DataTable from './DataTable';
import EnhancedDrilldownModal from './EnhancedDrilldownModal';

type Props = { 
  sessions: SessionData[] 
};

interface DrilldownData {
  title: string;
  sessions: SessionData[];
}

export default function MainDashboard({ sessions }: Props) {
  const [drilldownData, setDrilldownData] = useState<DrilldownData | null>(null);
  const [isDrilldownOpen, setIsDrilldownOpen] = useState(false);
  const [activeView, setActiveView] = useState<'overview' | 'rankings' | 'table'>('overview');

  const metrics = calculateMetrics(sessions);

  const handleMetricClick = (title: string, data: SessionData[]) => {
    setDrilldownData({ title, sessions: data });
    setIsDrilldownOpen(true);
  };

  const closeDrilldown = () => {
    setIsDrilldownOpen(false);
    setDrilldownData(null);
  };

  // Enhanced metrics with additional calculations
  const enhancedMetrics = useMemo(() => {
    const emptyClasses = sessions.filter(s => (s.checkedInCount || 0) === 0).length;
    const fullClasses = sessions.filter(s => 
      s.capacity && s.checkedInCount && s.checkedInCount >= s.capacity
    ).length;
    
    const avgRevenue = sessions.length > 0 ? metrics.totalRevenue / sessions.length : 0;
    
    return {
      ...metrics,
      emptyClasses,
      fullClasses,
      avgRevenue
    };
  }, [sessions, metrics]);

  const metricCards = [
    {
      title: 'Total Classes',
      value: formatNumber(enhancedMetrics.sessionCount),
      icon: Calendar,
      gradient: 'from-blue-700 via-blue-800 to-blue-900',
      subValue: `${enhancedMetrics.emptyClasses} empty`,
      data: sessions
    },
    {
      title: 'Total Check-ins',
      value: formatNumber(enhancedMetrics.totalCheckIns),
      icon: Users,
      gradient: 'from-green-600 via-green-700 to-green-800',
      subValue: `Avg: ${formatNumber(enhancedMetrics.avgCheckIns, 1)}`,
      data: sessions.filter(s => (s.checkedInCount || 0) > 0)
    },
    {
      title: 'Fill Rate',
      value: formatPercentage(enhancedMetrics.fillRate),
      icon: TrendingUp,
      gradient: 'from-purple-600 via-purple-700 to-purple-800',
      subValue: `${formatNumber(enhancedMetrics.totalCapacity)} capacity`,
      data: sessions
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(enhancedMetrics.totalRevenue),
      icon: DollarSign,
      gradient: 'from-emerald-600 via-emerald-700 to-emerald-800',
      subValue: `Avg: ${formatCurrency(enhancedMetrics.avgRevenue)}`,
      data: sessions.filter(s => (s.totalPaid || 0) > 0)
    },
    {
      title: 'Full Classes',
      value: formatNumber(enhancedMetrics.fullClasses),
      icon: Target,
      gradient: 'from-orange-600 via-orange-700 to-orange-800',
      subValue: `${formatPercentage(sessions.length > 0 ? enhancedMetrics.fullClasses / sessions.length * 100 : 0)} of total`,
      data: sessions.filter(s => s.capacity && s.checkedInCount && s.checkedInCount >= s.capacity)
    },
    {
      title: 'Consistency Score',
      value: `${enhancedMetrics.consistency}%`,
      icon: BarChart3,
      gradient: 'from-indigo-600 via-indigo-700 to-indigo-800',
      subValue: 'Variance-based stability',
      data: sessions
    }
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header mirroring GitHub styling */}
        <div className="bg-white/80 glass-card rounded-3xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white p-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
                  <LayoutDashboard className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">Class Intelligence Dashboard</h1>
                  <p className="text-blue-100 text-xs mt-1">Comprehensive analytics for {sessions.length} sessions</p>
                </div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-semibold border border-white/20 hover:bg-white/20 transition-colors">
                Upload New Data
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metricCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 20 }}
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

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-2 inline-flex gap-2"
        >
          {[
            { key: 'overview', label: 'Overview', icon: LayoutDashboard },
            { key: 'rankings', label: 'Rankings', icon: Award },
            { key: 'table', label: 'Data Table', icon: Activity }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveView(key as any)}
              className={`px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 ${
                activeView === key
                  ? 'bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-800 text-white shadow-xl'
                  : 'text-slate-700 hover:bg-white/60'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </motion.div>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeView === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Top Performers
                  </h3>
                  <Rankings sessions={sessions} />
                </div>

                <div className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl">
                  <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Quick Stats
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50">
                      <span className="text-sm font-semibold text-gray-700">Avg Class Size</span>
                      <span className="font-bold text-blue-700">{formatNumber(enhancedMetrics.avgCheckIns, 1)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50">
                      <span className="text-sm font-semibold text-gray-700">Revenue per Class</span>
                      <span className="font-bold text-green-700">{formatCurrency(enhancedMetrics.avgRevenue)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-purple-50 to-violet-50">
                      <span className="text-sm font-semibold text-gray-700">Capacity Utilization</span>
                      <span className="font-bold text-purple-700">{formatPercentage(enhancedMetrics.fillRate)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 rounded-xl bg-gradient-to-r from-orange-50 to-red-50">
                      <span className="text-sm font-semibold text-gray-700">Empty Classes</span>
                      <span className="font-bold text-orange-700">{enhancedMetrics.emptyClasses}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeView === 'rankings' && (
            <motion.div
              key="rankings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-orange-600 to-red-600">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Performance Rankings
                </h3>
              </div>
              <Rankings sessions={sessions} />
            </motion.div>
          )}

          {activeView === 'table' && (
            <motion.div
              key="table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/90 glass-card rounded-3xl p-6 border border-white/20 shadow-xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-xl bg-gradient-to-r from-slate-600 to-slate-700">
                  <Activity className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-slate-600 to-slate-700 bg-clip-text text-transparent">
                  Session Data
                </h3>
              </div>
              <DataTable sessions={sessions} />
            </motion.div>
          )}
        </AnimatePresence>
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