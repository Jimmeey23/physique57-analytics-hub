import React, { useMemo, useState } from 'react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import type { SessionData } from '@/hooks/useSessionsData';
import { Crown, AlertTriangle, BarChart3, Download, RefreshCw, Filter, Users } from 'lucide-react';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57RankList, type P57RankItem } from '@/components/ui/P57RankList';
import { CellDrillDownModal } from '@/components/ui/CellDrillDownModal';
import { downloadCsv } from '@/utils/csvExport';

interface ClassFormatRankingsProps {
  data: SessionData[];
}

type SortCriteria = 'revenue' | 'sessions' | 'fill' | 'class-avg' | 'rev-per-seat' | 'rev-per-session' | 'empty-classes';

interface ClassRankEntry {
  classId: string;
  className: string;
  dayOfWeek: string;
  time: string;
  totalSessions: number;
  totalRevenue: number;
  totalCapacity: number;
  totalCheckins: number;
  fillRate: number;
  avgRevPerSession: number;
  avgRevPerSeat: number;
  emptyClassCount: number;
  nonEmptyClassCount: number;
  topTrainer: string;
  classSessions: SessionData[];
  isHosted: boolean;
}

const ClassFormatRankings: React.FC<ClassFormatRankingsProps> = ({ data }) => {
  const sessions = Array.isArray(data) ? data : [];
  const [sortBy, setSortBy] = useState<SortCriteria>('revenue');
  const [includeTrainers, setIncludeTrainers] = useState(true);
  const [excludeHosted, setExcludeHosted] = useState(false);
  const [minClasses, setMinClasses] = useState(1);
  const [minVisitors, setMinVisitors] = useState(0);
  const [drill, setDrill] = useState<ClassRankEntry | null>(null);

  const allRankings = useMemo(() => {
    // Group by uniqueId1 (unique class occurrence)
    const classMap = new Map<string, SessionData[]>();
    sessions.forEach(s => {
      const classId = s.uniqueId1 || s.sessionId || 'unknown';
      if (!classMap.has(classId)) classMap.set(classId, []);
      classMap.get(classId)!.push(s);
    });

    // Build ranking data for each class
    let rankings: ClassRankEntry[] = Array.from(classMap.entries()).map(([classId, classSessions]) => {
      const totalSessions = classSessions.length;
      const totalRevenue = classSessions.reduce((sum, s) => sum + (s.totalPaid || 0), 0);
      const totalCapacity = classSessions.reduce((sum, s) => sum + (s.capacity || 0), 0);
      const totalCheckins = classSessions.reduce((sum, s) => sum + (s.checkedInCount || 0), 0);
      const fillRate = totalCapacity > 0 ? (totalCheckins / totalCapacity) * 100 : 0;
      const avgRevPerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
      const avgRevPerSeat = totalCapacity > 0 ? totalRevenue / totalCapacity : 0;

      // Get first session details (class name, day, time)
      const firstSession = classSessions[0];
      const className = firstSession?.cleanedClass || firstSession?.classType || 'Unknown';
      const dayOfWeek = firstSession?.dayOfWeek || 'Unknown';
      const time = firstSession?.time || 'Unknown';

      // Check if class has any empty sessions (0 checkins)
      const emptyClassCount = classSessions.filter(s => s.checkedInCount === 0).length;
      const nonEmptyClassCount = totalSessions - emptyClassCount;

      // Check if class is hosted (contains "hosted" in class name)
      const isHosted = className.toLowerCase().includes('hosted');

      // Top trainer in this class by revenue
      const trainerMap = new Map<string, number>();
      classSessions.forEach(s => {
        const trainer = s.trainerName || 'Unknown';
        trainerMap.set(trainer, (trainerMap.get(trainer) || 0) + (s.totalPaid || 0));
      });
      let topTrainer = 'N/A';
      let maxTrainerRev = 0;
      trainerMap.forEach((rev, trainer) => {
        if (rev > maxTrainerRev) {
          maxTrainerRev = rev;
          topTrainer = trainer;
        }
      });

      return {
        classId,
        className,
        dayOfWeek,
        time,
        totalSessions,
        totalRevenue,
        totalCapacity,
        totalCheckins,
        fillRate,
        avgRevPerSession,
        avgRevPerSeat,
        emptyClassCount,
        nonEmptyClassCount,
        topTrainer,
        classSessions,
        isHosted,
      };
    });

    // Apply filters
    rankings = rankings.filter(r => {
      // Filter by minimum classes
      if (r.totalSessions < minClasses) return false;
      // Filter by minimum visitors
      if (r.totalCheckins < minVisitors) return false;
      // Filter out hosted classes if enabled
      if (excludeHosted && r.isHosted) return false;
      return true;
    });

    // Sort based on criteria
    rankings.sort((a, b) => {
      switch (sortBy) {
        case 'revenue':
          return b.totalRevenue - a.totalRevenue;
        case 'sessions':
          return b.totalSessions - a.totalSessions;
        case 'fill':
          return b.fillRate - a.fillRate;
        case 'class-avg':
          return (b.nonEmptyClassCount > 0 ? b.totalCheckins / b.nonEmptyClassCount : 0) - (a.nonEmptyClassCount > 0 ? a.totalCheckins / a.nonEmptyClassCount : 0);
        case 'rev-per-seat':
          return b.avgRevPerSeat - a.avgRevPerSeat;
        case 'rev-per-session':
          return b.avgRevPerSession - a.avgRevPerSession;
        case 'empty-classes':
          return b.emptyClassCount - a.emptyClassCount;
        default:
          return 0;
      }
    });

    return rankings;
  }, [sessions, sortBy, excludeHosted, minClasses, minVisitors]);

  // Split into top and bottom
  const topCount = Math.ceil(allRankings.length / 2);
  const topRankings = allRankings.slice(0, topCount);
  const bottomRankings = allRankings.slice(-topCount).reverse();

  const getMetricLabel = () => {
    switch (sortBy) {
      case 'revenue': return 'Revenue';
      case 'sessions': return 'Sessions';
      case 'fill': return 'Fill Rate';
      case 'class-avg': return 'Class Avg';
      case 'rev-per-seat': return 'Rev/Seat';
      case 'rev-per-session': return 'Rev/Session';
      case 'empty-classes': return 'Empty Classes';
      default: return 'Metric';
    }
  };

  const getMetricValue = (item: ClassRankEntry) => {
    switch (sortBy) {
      case 'revenue': return formatCurrency(item.totalRevenue);
      case 'sessions': return formatNumber(item.totalSessions);
      case 'fill': return `${item.fillRate.toFixed(1)}%`;
      case 'class-avg': return (item.nonEmptyClassCount > 0 ? item.totalCheckins / item.nonEmptyClassCount : 0).toFixed(1);
      case 'rev-per-seat': return formatCurrency(item.avgRevPerSeat);
      case 'rev-per-session': return formatCurrency(item.avgRevPerSession);
      case 'empty-classes': return formatNumber(item.emptyClassCount);
      default: return '—';
    }
  };

  const getMetricNumber = (item: ClassRankEntry): number => {
    switch (sortBy) {
      case 'revenue': return item.totalRevenue;
      case 'sessions': return item.totalSessions;
      case 'fill': return item.fillRate;
      case 'class-avg': return item.nonEmptyClassCount > 0 ? item.totalCheckins / item.nonEmptyClassCount : 0;
      case 'rev-per-seat': return item.avgRevPerSeat;
      case 'rev-per-session': return item.avgRevPerSession;
      case 'empty-classes': return item.emptyClassCount;
      default: return 0;
    }
  };

  const maxMetric = Math.max(1, ...allRankings.map(getMetricNumber));

  const toRankItems = (items: ClassRankEntry[], ranks: number[]): P57RankItem[] =>
    items.map((item, i) => ({
      rank: ranks[i] ?? i + 1,
      name: item.className,
      sub: [
        `${item.dayOfWeek} · ${item.time}`,
        `${formatNumber(item.totalSessions)} sessions`,
        `${item.fillRate.toFixed(1)}% fill`,
        ...(includeTrainers ? [item.topTrainer] : []),
        ...(item.isHosted ? ['Hosted'] : []),
      ].join(' · '),
      value: getMetricValue(item),
      barPct: (getMetricNumber(item) / maxMetric) * 100,
    }));

  const handleExport = () => {
    downloadCsv(
      `class-rankings-${new Date().toISOString().split('T')[0]}.csv`,
      [
        { key: 'rank', header: 'Rank' },
        { key: 'className', header: 'Class Name' },
        { key: 'trainer', header: 'Trainer' },
        { key: 'sessions', header: 'Sessions' },
        { key: 'revenue', header: 'Revenue' },
        { key: 'fillRate', header: 'Fill Rate %' },
      ],
      allRankings.map((item, idx) => ({
        rank: idx + 1,
        className: item.className,
        trainer: item.topTrainer,
        sessions: item.totalSessions,
        revenue: item.totalRevenue,
        fillRate: item.fillRate.toFixed(1),
      }))
    );
  };

  const renderPanel = (items: ClassRankEntry[], isTop: boolean, ranks: number[]) => (
    <P57TableShell
      icon={isTop ? Crown : AlertTriangle}
      title={isTop ? 'Top Performers' : 'Needs Improvement'}
      description={
        isTop
          ? `Highest-ranked class occurrences by ${getMetricLabel().toLowerCase()}. Click a row for session-level detail.`
          : `Lowest-ranked class occurrences by ${getMetricLabel().toLowerCase()}. Click a row for session-level detail.`
      }
      rowCount={items.length}
      meta={<span>{formatCurrency(items.reduce((s, r) => s + r.totalRevenue, 0))} combined revenue</span>}
    >
      <div className={items.length > 8 ? 'max-h-[560px] overflow-y-auto' : ''}>
        <P57RankList
          items={toRankItems(items, ranks)}
          onSelect={(item) => {
            const idx = ranks.indexOf(item.rank);
            if (idx >= 0) setDrill(items[idx]);
          }}
          emptyText="No classes to rank."
        />
      </div>
    </P57TableShell>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Individual Class Rankings</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Performance metrics by class occurrence with advanced filters</p>
        </div>

        {/* Main Filter and Sort Controls */}
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-[#2a2a2e] dark:bg-[#141416]">
          {/* Row 1: Sort and Toggles */}
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriteria)}
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:text-slate-100"
              aria-label="Sort rankings by"
            >
              <option value="revenue">Sort by Revenue</option>
              <option value="sessions">Sort by Sessions</option>
              <option value="fill">Sort by Fill Rate</option>
              <option value="class-avg">Sort by Class Avg</option>
              <option value="rev-per-seat">Sort by Rev/Seat</option>
              <option value="rev-per-session">Sort by Rev/Session</option>
              <option value="empty-classes">Sort by Empty Classes</option>
            </select>

            <div className="h-6 w-px bg-slate-300 dark:bg-[#2a2a2e]" />

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:hover:bg-[#232326]">
              <input
                type="checkbox"
                checked={includeTrainers}
                onChange={(e) => setIncludeTrainers(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600"
              />
              <Users className="h-4 w-4 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Show Trainers</span>
            </label>

            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 hover:bg-slate-50 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:hover:bg-[#232326]">
              <input
                type="checkbox"
                checked={excludeHosted}
                onChange={(e) => setExcludeHosted(e.target.checked)}
                className="h-4 w-4 rounded accent-blue-600"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Exclude Hosted</span>
            </label>
          </div>

          {/* Row 2: Min Classes and Min Visitors */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="h-3 w-3" />
                Min Classes
              </label>
              <input
                type="number"
                value={minClasses}
                onChange={(e) => setMinClasses(Math.max(1, parseInt(e.target.value) || 1))}
                min="1"
                max="100"
                className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Users className="h-3 w-3" />
                Min Visitors
              </label>
              <input
                type="number"
                value={minVisitors}
                onChange={(e) => setMinVisitors(Math.max(0, parseInt(e.target.value) || 0))}
                min="0"
                max="1000"
                className="w-20 rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm font-medium text-slate-900 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:text-slate-100"
              />
            </div>

            {/* Action Buttons */}
            <div className="ml-auto flex gap-2">
              <button
                onClick={() => {
                  setSortBy('revenue');
                  setIncludeTrainers(true);
                  setExcludeHosted(false);
                  setMinClasses(1);
                  setMinVisitors(0);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:text-slate-200 dark:hover:bg-[#232326]"
                title="Reset all filters to default values"
              >
                <RefreshCw className="h-4 w-4" />
                Reset
              </button>

              <button
                onClick={handleExport}
                className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-[#2a2a2e] dark:bg-[#1c1c1f] dark:text-slate-200 dark:hover:bg-[#232326]"
                title="Export rankings as CSV"
              >
                <Download className="h-4 w-4" />
                Export
              </button>

              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                title="View analytics and insights"
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </button>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-xs text-slate-600 dark:border-[#2a2a2e] dark:bg-white/5 dark:text-slate-400">
            <span className="font-semibold">Active Filters:</span> Min {minClasses}+ classes • Min {minVisitors}+ visitors {excludeHosted && '• Excluding hosted'} {includeTrainers && '• Trainers visible'}
          </div>
        </div>
      </div>

      {/* Top and Bottom Rankings */}
      {allRankings.length === 0 ? (
        <P57RankList items={[]} emptyText="No classes found — try adjusting your filters." />
      ) : (
        <div className="p57-stagger grid grid-cols-1 gap-6 lg:grid-cols-2">
          {renderPanel(topRankings, true, topRankings.map((_, i) => i + 1))}
          {renderPanel(bottomRankings, false, bottomRankings.map((_, i) => allRankings.length - i))}
        </div>
      )}

      <CellDrillDownModal
        open={drill !== null}
        onClose={() => setDrill(null)}
        title={drill ? drill.className : ''}
        subtitle={`${drill?.dayOfWeek ?? ''} · ${drill?.time ?? ''} · session-level rows`}
        context={
          drill
            ? [
                { label: 'Class', value: drill.className },
                { label: 'Schedule', value: `${drill.dayOfWeek} · ${drill.time}` },
                { label: 'Trainer', value: drill.topTrainer },
                { label: 'Sessions', value: formatNumber(drill.totalSessions) },
                { label: getMetricLabel(), value: getMetricValue(drill) },
              ]
            : []
        }
        columns={[
          { key: 'date', header: 'Date', mono: true },
          { key: 'trainer', header: 'Trainer' },
          { key: 'checkedIn', header: 'Checked In', align: 'right', mono: true },
          { key: 'capacity', header: 'Capacity', align: 'right', mono: true },
          { key: 'fill', header: 'Fill', align: 'right', mono: true },
          { key: 'revenue', header: 'Revenue', align: 'right', mono: true },
        ]}
        rows={(drill?.classSessions ?? []).map((s) => {
          const checkedIn = s.checkedInCount || 0;
          const capacity = s.capacity || 0;
          return {
            date: s.date || '—',
            trainer: s.trainerName || '—',
            checkedIn: formatNumber(checkedIn),
            capacity: formatNumber(capacity),
            fill: capacity > 0 ? `${((checkedIn / capacity) * 100).toFixed(1)}%` : '—',
            revenue: formatCurrency(s.totalPaid || 0),
          };
        })}
      />
    </div>
  );
};

export default ClassFormatRankings;
