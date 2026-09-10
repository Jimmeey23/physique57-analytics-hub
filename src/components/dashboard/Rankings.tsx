import { useState, useEffect, useMemo } from 'react';
import { RankingMetric, CalculatedMetrics } from '@/types';
import type { SessionData as HookSessionData } from '@/hooks/useSessionsData';

/** Hook rows plus the optional legacy fallbacks this component reads. */
type RankingSession = HookSessionData & {
  day?: string;
  instructor?: string;
  checkins?: number;
  bookings?: number;
  lateCancelled?: number;
  waitlistedCount?: number;
  waitlisted?: number;
};
import { formatNumber, formatCurrency, formatPercentage } from '@/utils/calculations';
import { Search, Trophy, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { BrandSpinner } from '@/components/ui/BrandSpinner';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57RankList, type P57RankItem } from '@/components/ui/P57RankList';
import { CellDrillDownModal } from '@/components/ui/CellDrillDownModal';

interface RankingGroup {
  key: string;
  className: string;
  day: string;
  time: string;
  location: string;
  trainer?: string;
  sessions: RankingSession[];
  metrics: CalculatedMetrics;
}

interface RankingsProps {
  data?: RankingSession[];
  sessions?: RankingSession[];
}

const SELECT_CLASS =
  'h-[30px] rounded-[9px] border border-[#ececef] bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-400 dark:border-[#2a2a2e] dark:bg-[#141416] dark:text-slate-200';

const Rankings = ({ data, sessions }: RankingsProps) => {
  // MainDashboard passes `sessions`, ClassAttendance passes `data` — accept both.
  const rows = data ?? sessions ?? [];
  const [topMetric, setTopMetric] = useState<RankingMetric>('classAvg');
  const [bottomMetric, setBottomMetric] = useState<RankingMetric>('classAvg');
  const [topCount, setTopCount] = useState(10);
  const [bottomCount, setBottomCount] = useState(10);
  const [minCheckins, setMinCheckins] = useState(0);
  const [minClasses, setMinClasses] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeTrainer, setIncludeTrainer] = useState(false);
  const [excludeHostedClasses, setExcludeHostedClasses] = useState(true);
  const [drill, setDrill] = useState<{ group: RankingGroup; metric: RankingMetric } | null>(null);

  const [rankedGroups, setRankedGroups] = useState<RankingGroup[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Group sessions by composite key
  useEffect(() => {
    if (rows.length === 0) {
      setRankedGroups([]);
      return;
    }

    setIsCalculating(true);

    const timer = setTimeout(() => {
      // Filter hosted classes if enabled
      const filteredData = excludeHostedClasses
        ? rows.filter(s => {
            const className = (s.sessionName || s.cleanedClass || s.classType || '').toLowerCase();
            const hostedPattern = /hosted|bridal|lrs|x p57|rugby|wework|olympics|birthday|host|raheja|pop|workshop|community|physique|soundrise|outdoor|p57 x|x/i;
            return !hostedPattern.test(className);
          })
        : rows;

      const groups = new Map<string, RankingSession[]>();

      filteredData.forEach((session) => {
        const key = [
          session.sessionName || session.cleanedClass || '',
          session.dayOfWeek || session.day || '',
          session.time || '',
          session.location || '',
          includeTrainer ? (session.trainerName || session.instructor || '') : undefined,
        ].filter(Boolean).join('|');

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(session);
      });

      const rankingGroups: RankingGroup[] = [];
      groups.forEach((sessionGroup, key) => {
        // Manual metrics calculation
        const totalCheckIns = sessionGroup.reduce((sum, s) => sum + (s.checkedInCount || s.checkins || 0), 0);
        const totalCapacity = sessionGroup.reduce((sum, s) => sum + (s.capacity || 0), 0);
        const totalRevenue = sessionGroup.reduce((sum, s) => sum + (s.totalPaid || s.revenue || 0), 0);
        const totalBooked = sessionGroup.reduce((sum, s) => sum + (s.bookedCount || s.bookings || 0), 0);
        const totalCancellations = sessionGroup.reduce((sum, s) => sum + (s.lateCancelledCount || s.lateCancelled || 0), 0);
        const totalWaitlisted = sessionGroup.reduce((sum, s) => sum + (s.waitlistedCount || s.waitlisted || 0), 0);

        const classAvg = sessionGroup.length > 0 ? totalCheckIns / sessionGroup.length : 0;
        const fillRate = totalCapacity > 0 ? (totalCheckIns / totalCapacity) * 100 : 0;
        const cancellationRate = totalBooked > 0 ? (totalCancellations / totalBooked) * 100 : 0;
        const waitlistRate = totalCapacity > 0 ? (totalWaitlisted / totalCapacity) * 100 : 0;
        const revPerCheckin = totalCheckIns > 0 ? totalRevenue / totalCheckIns : 0;
        const revPerBooking = totalBooked > 0 ? totalRevenue / totalBooked : 0;
        const revLostPerCancellation = totalCancellations > 0 ? revPerBooking * totalCancellations : 0;

        // Consistency calculation
        const avg = classAvg;
        const variance = sessionGroup.reduce((sum, s) => {
          const diff = (s.checkedInCount || s.checkins || 0) - avg;
          return sum + diff * diff;
        }, 0) / sessionGroup.length;
        const stdDev = Math.sqrt(variance);
        const consistencyScore = avg > 0 ? Math.max(0, 100 - (stdDev / avg) * 100) : 0;

        const compositeScore = (
          fillRate * 0.3 +
          classAvg * 0.25 +
          consistencyScore * 0.25 +
          (totalRevenue / sessionGroup.length / 100) * 0.2
        );

        const metrics: CalculatedMetrics = {
          classes: sessionGroup.length,
          emptyClasses: sessionGroup.filter(s => (s.checkedInCount || s.checkins || 0) === 0).length,
          nonEmptyClasses: sessionGroup.length - sessionGroup.filter(s => (s.checkedInCount || s.checkins || 0) === 0).length,
          fillRate,
          cancellationRate,
          waitlistRate,
          rank: 0,
          classAvg,
          classAvgNonEmpty: classAvg,
          revPerBooking,
          revPerCheckin,
          revLostPerCancellation,
          weightedAverage: fillRate,
          consistencyScore,
          totalRevenue,
          totalCheckIns,
          totalBookings: totalBooked,
          totalCancellations,
          totalCapacity,
          totalBooked,
          totalWaitlisted,
          status: 'Active',
          compositeScore
        };

        if (totalCheckIns < minCheckins || sessionGroup.length < minClasses) {
          return;
        }

        const parts = key.split('|');
        rankingGroups.push({
          key,
          className: parts[0] || 'Unknown',
          day: parts[1] || 'Unknown',
          time: parts[2] || 'Unknown',
          location: parts[3] || 'Unknown',
          trainer: includeTrainer ? parts[4] : undefined,
          sessions: sessionGroup,
          metrics,
        });
      });

      setRankedGroups(rankingGroups);
      setIsCalculating(false);
    }, 10);

    return () => clearTimeout(timer);
  }, [rows, includeTrainer, minCheckins, minClasses, excludeHostedClasses]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery) return rankedGroups;
    const query = searchQuery.toLowerCase();
    return rankedGroups.filter(g =>
      g.className.toLowerCase().includes(query) ||
      g.location.toLowerCase().includes(query) ||
      g.trainer?.toLowerCase().includes(query)
    );
  }, [rankedGroups, searchQuery]);

  const getMetricLabel = (metric: RankingMetric): string => {
    const labels: Record<RankingMetric, string> = {
      classAvg: 'Class Avg',
      fillRate: 'Fill Rate',
      totalRevenue: 'Revenue',
      consistencyScore: 'Consistency',
      totalCancellations: 'Late Cancellations',
      totalBooked: 'Total Booked',
      classes: 'Classes',
      compositeScore: 'Composite Score',
      revPerCheckin: 'Rev / Check-in',
      revPerBooking: 'Rev / Booking',
      cancellationRate: 'Cancel Rate',
      waitlistRate: 'Waitlist Rate',
      totalWaitlisted: 'Total Waitlisted',
      revLostPerCancellation: 'Rev Lost / Cancel',
    };
    return labels[metric];
  };

  const formatMetricValue = (metric: RankingMetric, value: number): string => {
    switch (metric) {
      case 'classAvg':
        return formatNumber(value, 1);
      case 'fillRate':
      case 'consistencyScore':
      case 'cancellationRate':
      case 'waitlistRate':
        return formatPercentage(value);
      case 'totalRevenue':
      case 'revPerCheckin':
      case 'revPerBooking':
      case 'revLostPerCancellation':
        return formatCurrency(value, true);
      case 'totalCancellations':
      case 'totalBooked':
      case 'classes':
      case 'totalWaitlisted':
        return formatNumber(value);
      case 'compositeScore':
        return formatNumber(value, 1);
      default:
        return formatNumber(value);
    }
  };

  const getTopPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...filteredGroups]
      .sort((a, b) => b.metrics[metric] - a.metrics[metric])
      .slice(0, count);
  };

  const getBottomPerformers = (metric: RankingMetric, count: number): RankingGroup[] => {
    return [...filteredGroups]
      .sort((a, b) => a.metrics[metric] - b.metrics[metric])
      .slice(0, count);
  };

  const topPerformers = getTopPerformers(topMetric, topCount);
  const bottomPerformers = getBottomPerformers(bottomMetric, bottomCount);

  const metricOptions: RankingMetric[] = [
    'classAvg',
    'fillRate',
    'totalRevenue',
    'consistencyScore',
    'compositeScore',
    'revPerCheckin',
    'revPerBooking',
    'cancellationRate',
    'waitlistRate',
    'totalWaitlisted',
    'revLostPerCancellation',
  ];

  const toRankItems = (groups: RankingGroup[], metric: RankingMetric): P57RankItem[] => {
    const max = Math.max(1, ...groups.map((g) => g.metrics[metric]));
    return groups.map((g, i) => ({
      rank: i + 1,
      name: g.className,
      sub: `${[g.day, g.time, g.location].filter((x) => x && x !== 'Unknown').join(' • ')}${g.trainer ? ` · ${g.trainer}` : ''} · ${g.metrics.classes} classes · ${formatNumber(g.metrics.totalCheckIns)} check-ins`,
      value: formatMetricValue(metric, g.metrics[metric]),
      barPct: max > 0 ? (g.metrics[metric] / max) * 100 : 0,
    }));
  };

  const drillRows = useMemo(() => {
    if (!drill) return [];
    return drill.group.sessions.map((s) => {
      const checkedIn = s.checkedInCount || s.checkins || 0;
      const capacity = s.capacity || 0;
      return {
        date: s.date || '—',
        time: s.time || '—',
        checkedIn: formatNumber(checkedIn),
        capacity: formatNumber(capacity),
        fill: capacity > 0 ? formatPercentage((checkedIn / capacity) * 100) : '—',
        revenue: formatCurrency(s.totalPaid || 0, true),
      };
    });
  }, [drill]);

  const openDrill = (groups: RankingGroup[], metric: RankingMetric, item: P57RankItem) => {
    const group = groups[item.rank - 1];
    if (group) setDrill({ group, metric });
  };

  return (
    <div className="relative space-y-6">
      {isCalculating && (
        <div className="absolute inset-0 z-10 flex items-start justify-center rounded-2xl bg-white/50 pt-20 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-full border border-blue-100 bg-white px-6 py-3 shadow-lg">
            <BrandSpinner ringOnly size="sm" />
            <span className="font-medium text-blue-700">Updating rankings...</span>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm">
            <input
              type="checkbox"
              checked={excludeHostedClasses}
              onChange={(e) => setExcludeHostedClasses(e.target.checked)}
              className="h-4 w-4 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm font-semibold text-slate-800">
              Exclude Hosted Classes
            </span>
          </label>

          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm font-semibold text-slate-700">
              Min Check-ins:
            </label>
            <input
              type="number"
              min="0"
              value={minCheckins}
              onChange={(e) => setMinCheckins(parseInt(e.target.value) || 0)}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="whitespace-nowrap text-sm font-semibold text-slate-700">
              Min Classes:
            </label>
            <input
              type="number"
              min="0"
              value={minClasses}
              onChange={(e) => setMinClasses(parseInt(e.target.value) || 0)}
              className="w-24 rounded-xl border border-slate-200 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <div className="flex max-w-md flex-1 items-center gap-2">
            <Search className="h-4 w-4 text-slate-600" />
            <input
              type="text"
              placeholder="Search classes, trainers, locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
            />
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Include Trainer</span>
            <button
              type="button"
              role="switch"
              aria-checked={includeTrainer}
              onClick={() => setIncludeTrainer(!includeTrainer)}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${
                includeTrainer ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  includeTrainer ? 'translate-x-8' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </Card>

      <div className="p57-stagger grid grid-cols-1 gap-6 lg:grid-cols-2">
        <P57TableShell
          icon={Trophy}
          title="Top Performers"
          description={`Highest-ranked classes by ${getMetricLabel(topMetric).toLowerCase()}. Click a row for session-level detail.`}
          rowCount={topPerformers.length}
          actions={
            <>
              <select
                value={topMetric}
                onChange={(e) => setTopMetric(e.target.value as RankingMetric)}
                className={SELECT_CLASS}
                aria-label="Top ranking metric"
              >
                {metricOptions.map((metric) => (
                  <option key={metric} value={metric}>
                    {getMetricLabel(metric)}
                  </option>
                ))}
              </select>
              <select
                value={topCount}
                onChange={(e) => setTopCount(parseInt(e.target.value))}
                className={SELECT_CLASS}
                aria-label="Top count"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
            </>
          }
          meta={<span>Hosted classes {excludeHostedClasses ? 'excluded' : 'included'}</span>}
        >
          <div className="max-h-[520px] overflow-y-auto">
            <P57RankList
              items={toRankItems(topPerformers, topMetric)}
              onSelect={(item) => openDrill(topPerformers, topMetric, item)}
              emptyText="No classes match the current filters."
            />
          </div>
        </P57TableShell>

        <P57TableShell
          icon={TrendingDown}
          title="Needs Improvement"
          description={`Lowest-ranked classes by ${getMetricLabel(bottomMetric).toLowerCase()}. Click a row for session-level detail.`}
          rowCount={bottomPerformers.length}
          actions={
            <>
              <select
                value={bottomMetric}
                onChange={(e) => setBottomMetric(e.target.value as RankingMetric)}
                className={SELECT_CLASS}
                aria-label="Bottom ranking metric"
              >
                {metricOptions.map((metric) => (
                  <option key={metric} value={metric} />
                ))}
              </select>
              <select
                value={bottomCount}
                onChange={(e) => setBottomCount(parseInt(e.target.value))}
                className={SELECT_CLASS}
                aria-label="Bottom count"
              >
                <option value={5}>Bottom 5</option>
                <option value={10}>Bottom 10</option>
                <option value={20}>Bottom 20</option>
              </select>
            </>
          }
          meta={<span>Hosted classes {excludeHostedClasses ? 'excluded' : 'included'}</span>}
        >
          <div className="max-h-[520px] overflow-y-auto">
            <P57RankList
              items={toRankItems(bottomPerformers, bottomMetric)}
              onSelect={(item) => openDrill(bottomPerformers, bottomMetric, item)}
              emptyText="No classes match the current filters."
            />
          </div>
        </P57TableShell>
      </div>

      <CellDrillDownModal
        open={drill !== null}
        onClose={() => setDrill(null)}
        title={drill ? `${drill.group.className} · ${getMetricLabel(drill.metric)}` : ''}
        subtitle="Session-level rows behind this ranked class"
        context={
          drill
            ? [
                { label: 'Class', value: drill.group.className },
                { label: 'Schedule', value: `${drill.group.day} · ${drill.group.time}` },
                { label: 'Location', value: drill.group.location },
                ...(drill.group.trainer ? [{ label: 'Trainer', value: drill.group.trainer }] : []),
                { label: getMetricLabel(drill.metric), value: formatMetricValue(drill.metric, drill.group.metrics[drill.metric]) },
              ]
            : []
        }
        columns={[
          { key: 'date', header: 'Date', mono: true },
          { key: 'time', header: 'Time', mono: true },
          { key: 'checkedIn', header: 'Checked In', align: 'right', mono: true },
          { key: 'capacity', header: 'Capacity', align: 'right', mono: true },
          { key: 'fill', header: 'Fill', align: 'right', mono: true },
          { key: 'revenue', header: 'Revenue', align: 'right', mono: true },
        ]}
        rows={drillRows}
      />
    </div>
  );
};

export default Rankings;
