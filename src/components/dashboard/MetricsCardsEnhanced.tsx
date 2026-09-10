import { useMemo } from 'react';
import type { SessionData as HookSessionData } from '@/hooks/useSessionsData';
import { adaptHookSessions } from '@/utils/sessionShape';
import { formatCurrency, formatNumber, formatPercentage, calculateMetrics } from '@/utils/calculations';
import { Calendar, Users, DollarSign, TrendingUp, AlertCircle, Target, type LucideIcon } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { MetricCard, MetricGrid, type MetricDelta } from '@/components/ui/MetricCard';

interface MetricsCardsEnhancedProps {
  sessions: HookSessionData[];
}

const SparkBack: React.FC<{ data: Array<{ value: number }>; color: string; caption: string; id: string }> = ({
  data,
  color,
  caption,
  id,
}) => (
  <div>
    <div className="h-[62px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id={`mce-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#mce-${id})`}
            isAnimationActive
            animationDuration={500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <p className="mt-1 text-[11px] leading-snug text-muted-foreground">{caption}</p>
  </div>
);

const deltaFor = (data: Array<{ value: number }>, invert = false): MetricDelta | undefined => {
  if (data.length < 2) return undefined;
  const prev = data[data.length - 2].value;
  const last = data[data.length - 1].value;
  if (prev === 0) return undefined;
  const pct = ((last - prev) / Math.abs(prev)) * 100;
  const dir: MetricDelta['tone'] = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'flat';
  const tone = invert ? (dir === 'up' ? 'down' : dir === 'down' ? 'up' : 'flat') : dir;
  return { value: `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`, tone };
};

export function MetricsCardsEnhanced({ sessions }: MetricsCardsEnhancedProps) {
  // Normalize hook rows so legacy readers (checkins, revenue, …) resolve.
  const rows = useMemo(() => adaptHookSessions(sessions || []), [sessions]);

  // Calculate overall metrics
  const metrics = useMemo(() => {
    if (rows.length === 0) {
      return {
        totalClasses: 0,
        totalCheckIns: 0,
        fillRate: 0,
        totalRevenue: 0,
        cancellationRate: 0,
        consistencyScore: 0,
        avgClassSize: 0,
      };
    }

    const calculated = calculateMetrics(rows);
    return {
      totalClasses: calculated.classes,
      totalCheckIns: calculated.totalCheckIns,
      fillRate: calculated.fillRate,
      totalRevenue: calculated.totalRevenue,
      cancellationRate: calculated.cancellationRate,
      consistencyScore: calculated.consistencyScore,
      avgClassSize: calculated.classAvg,
    };
  }, [rows]);

  // Generate time series data for flip-side sparklines
  const timeSeriesData = useMemo(() => {
    if (rows.length === 0) return [];

    const dateMap = new Map<string, { checkIns: number; revenue: number; classes: number }>();

    rows.forEach((session) => {
      const dateKey = session.date;
      const existing = dateMap.get(dateKey) || { checkIns: 0, revenue: 0, classes: 0 };
      dateMap.set(dateKey, {
        checkIns: existing.checkIns + (session.checkedInCount || 0),
        revenue: existing.revenue + (session.revenue || session.totalPaid || 0),
        classes: existing.classes + 1,
      });
    });

    return Array.from(dateMap.entries())
      .map(([date, data]) => ({
        date,
        checkIns: data.checkIns,
        revenue: data.revenue,
        classes: data.classes,
        avgClass: data.classes > 0 ? data.checkIns / data.classes : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days
  }, [rows]);

  const series = {
    classes: timeSeriesData.map((d) => ({ value: d.classes })),
    checkIns: timeSeriesData.map((d) => ({ value: d.checkIns })),
    avgClass: timeSeriesData.map((d) => ({ value: d.avgClass })),
    revenue: timeSeriesData.map((d) => ({ value: d.revenue })),
  };

  const cards: Array<{
    id: string;
    title: string;
    value: string;
    sub: string;
    icon: LucideIcon;
    accent: string;
    chartData: Array<{ value: number }>;
    caption: string;
    delta?: MetricDelta;
  }> = [
    {
      id: 'classes',
      title: 'Total Classes',
      value: formatNumber(metrics.totalClasses),
      sub: `${formatNumber(metrics.avgClassSize, 1)} avg size`,
      icon: Calendar,
      accent: '#2563eb',
      chartData: series.classes,
      caption: 'Daily classes held · last 30 days',
      delta: deltaFor(series.classes),
    },
    {
      id: 'checkIns',
      title: 'Check-ins',
      value: formatNumber(metrics.totalCheckIns),
      sub: 'Across filtered sessions',
      icon: Users,
      accent: '#16a34a',
      chartData: series.checkIns,
      caption: 'Daily check-ins · last 30 days',
      delta: deltaFor(series.checkIns),
    },
    {
      id: 'fillRate',
      title: 'Fill Rate',
      value: formatPercentage(metrics.fillRate),
      sub: 'Of total capacity',
      icon: Target,
      accent: '#9333ea',
      chartData: series.avgClass,
      caption: 'Daily average class size · last 30 days',
      delta: deltaFor(series.avgClass),
    },
    {
      id: 'revenue',
      title: 'Total Revenue',
      value: formatCurrency(metrics.totalRevenue, true),
      sub: 'Session revenue',
      icon: DollarSign,
      accent: '#059669',
      chartData: series.revenue,
      caption: 'Daily revenue · last 30 days',
      delta: deltaFor(series.revenue),
    },
    {
      id: 'cancellations',
      title: 'Cancellation Rate',
      value: formatPercentage(metrics.cancellationRate),
      sub: 'Of bookings',
      icon: AlertCircle,
      accent: '#ea580c',
      chartData: series.classes,
      caption: 'Daily classes held · last 30 days',
      delta: deltaFor(series.classes, true),
    },
    {
      id: 'consistency',
      title: 'Consistency',
      value: formatPercentage(metrics.consistencyScore),
      sub: 'Attendance steadiness',
      icon: TrendingUp,
      accent: '#0891b2',
      chartData: series.avgClass,
      caption: 'Daily average class size · last 30 days',
      delta: deltaFor(series.avgClass),
    },
  ];

  return (
    <MetricGrid cols={6}>
      {cards.map((card) => (
        <MetricCard
          key={card.id}
          label={card.title}
          value={card.value}
          sub={card.sub}
          delta={card.delta}
          icon={card.icon}
          accent={card.accent}
          detailsTitle={`${card.title} · trend`}
          details={<SparkBack id={card.id} data={card.chartData} color={card.accent} caption={card.caption} />}
        />
      ))}
    </MetricGrid>
  );
}
