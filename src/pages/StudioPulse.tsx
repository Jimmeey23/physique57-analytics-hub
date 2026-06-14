import React, { memo, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Funnel,
  FunnelChart,
  LabelList,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowUpRight,
  Banknote,
  CalendarClock,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  DollarSign,
  Filter,
  Flame,
  Gauge,
  HeartPulse,
  LayoutGrid,
  List,
  MapPin,
  Percent,
  RefreshCw,
  Repeat,
  Sparkles,
  Star,
  Tag,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';

import { Footer } from '@/components/ui/footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useGlobalLoading } from '@/hooks/useGlobalLoading';
import { StudioPulseFilterSection } from '@/components/dashboard/StudioPulseFilterSection';
import { StudioPulseMetricCard } from '@/components/dashboard/StudioPulseMetricCard';
import InsightDetailDialog from '@/components/dashboard/InsightDetailDialog';
import { UniversalDrillDownModal } from '@/components/dashboard/UniversalDrillDownModal';
import { MonthOnMonthTableNew } from '@/components/dashboard/MonthOnMonthTableNew';
import { ClientConversionMonthOnMonthByTypeTable } from '@/components/dashboard/ClientConversionMonthOnMonthByTypeTableEnhanced';
import { UnifiedTopBottomSellers } from '@/components/dashboard/UnifiedTopBottomSellers';
import DetailedComparisonView from '@/components/dashboard/DetailedComparisonView';

import { useGoogleSheets } from '@/hooks/useGoogleSheets';
import { useSessionsData } from '@/hooks/useSessionsData';
import { useNewClientData } from '@/hooks/useNewClientData';
import { usePayrollData } from '@/hooks/usePayrollData';
import { useLeadsData } from '@/hooks/useLeadsData';
import { useLateCancellationsData } from '@/hooks/useLateCancellationsData';
import { useExpirationsData } from '@/hooks/useExpirationsData';
import { useStudioAISummary } from '@/hooks/useStudioAISummary';

import { TrainerNameCell } from '@/components/ui/TrainerAvatar';
import { mapLocationIdToTab } from '@/utils/memberLifecycleFilters';
import { getDashboardDefaultDateRange, parseDate } from '@/utils/dateUtils';
import { isLeadConverted } from '@/utils/leadConversions';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Switch } from '@/components/ui/switch';
import { usePresenterMode, PulseSnapshot } from '@/hooks/usePresenterMode';
import { PresenterToolbar } from '@/components/dashboard/PresenterToolbar';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { AdminCodeGate } from '@/components/ui/AdminCodeGate';

/* ------------------------------------------------------------------ */
/* Studio definitions                                                  */
/* ------------------------------------------------------------------ */

type StudioId = 'all' | 'kwality' | 'supreme' | 'kenkere' | 'popup';

interface StudioDef {
  id: StudioId;
  name: string;
  area: string;
  accent: string; // gradient classes for the active tab + accents
  ring: string;
}

const STUDIOS: StudioDef[] = [
  { id: 'all', name: 'All Studios', area: 'Mumbai & Bengaluru', accent: 'from-slate-700 to-slate-900', ring: 'ring-slate-300' },
  { id: 'kwality', name: 'Kwality House', area: 'Kemps Corner, Mumbai', accent: 'from-blue-700 to-blue-900', ring: 'ring-blue-300' },
  { id: 'supreme', name: 'Supreme HQ', area: 'Bandra, Mumbai', accent: 'from-fuchsia-600 to-purple-700', ring: 'ring-fuchsia-300' },
  { id: 'kenkere', name: 'Kenkere House', area: 'Bengaluru', accent: 'from-emerald-600 to-teal-700', ring: 'ring-emerald-300' },
  { id: 'popup', name: 'Pop-up', area: 'Roaming', accent: 'from-amber-500 to-orange-600', ring: 'ring-amber-300' },
];

const FORMAT_COLORS: Record<string, string> = {
  Barre: '#1d4ed8',
  PowerCycle: '#06b6d4',
  Strength: '#f59e0b',
  Other: '#94a3b8',
};

type SalesMetricsMatrixRow = {
  label: string;
  type: 'currency' | 'number' | 'percent';
  values: Record<string, number>;
};

type SalesMetricDefinition = {
  definition: string;
  formula: string;
  businessMeaning: string;
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const monthKeyFromDate = (value?: string): string | null => {
  if (!value) return null;
  const d = parseDate(value);
  if (!d || isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const monthLabel = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(y, (m || 1) - 1, 1);
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
};

const getPreviousMonthKey = () => {
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;
};

const inStudio = (locationValue: string | undefined, studio: StudioId): boolean => {
  if (studio === 'all') return true;
  return mapLocationIdToTab(locationValue) === studio;
};

const normalizeClassName = (value?: string): string => {
  if (!value) return 'Unknown';
  return value
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/physique\s*57/gi, 'Physique57')
    .replace(/\s*[-–—]\s*(online|virtual|zoom|fb live|facebook live|livestream)/gi, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s+#?\d+$/g, '')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    || 'Unknown';
};

const classifyFormat = (value?: string): keyof typeof FORMAT_COLORS => {
  const v = (value || '').toLowerCase();
  if (v.includes('cycle') || v.includes('spin') || v.includes('ride')) return 'PowerCycle';
  if (v.includes('strength') || v.includes('sculpt') || v.includes('hiit') || v.includes('fit')) return 'Strength';
  if (v.includes('barre') || v.includes('57') || v.includes('mat') || v.includes('express') || v.includes('foundation')) return 'Barre';
  return 'Other'; // Catch-all: workshops, privates, events, cardio, pilates, yoga, etc.
};

const pctChange = (current: number, previous: number): number | null => {
  if (!previous) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
};

const formatSalesMetricCell = (value: number, type: SalesMetricsMatrixRow['type']) => {
  if (type === 'currency') return formatCurrency(value);
  if (type === 'percent') return formatPercentage(value);
  return formatNumber(value);
};

const salesMetricTypeMap: Record<string, 'metric' | 'product' | 'category' | 'seller' | 'member'> = {
  'Gross Sales': 'metric',
  'Net Sales': 'metric',
  'Transactions': 'metric',
  'Unique Members': 'member',
  'Average Transaction Value': 'metric',
  'Discount Value': 'metric',
  'Discounted Transactions': 'metric',
  'Discount Penetration': 'metric',
  'VAT Collected': 'metric',
  'Money Credits Used': 'metric',
  'Package Sales': 'category',
  'Retail Sales': 'category',
  'Membership Sales': 'category',
  'Drop-in Sales': 'product',
  'Online / System Sales': 'seller',
  'Top Seller Share': 'seller',
  'Distinct Products Sold': 'product',
  'Distinct Categories Sold': 'category',
  'Average Revenue per Member': 'member',
  'Promo-led Sales': 'metric',
};

const salesMetricDefinitions: Record<string, SalesMetricDefinition> = {
  'Gross Sales': {
    definition: 'Total billed sales value before deducting VAT.',
    formula: 'Sum of `paymentValue`.',
    businessMeaning: 'Shows topline commercial throughput and billing momentum.'
  },
  'Net Sales': {
    definition: 'Sales value after removing VAT from billed revenue.',
    formula: 'Sum of `paymentValue - paymentVAT`.',
    businessMeaning: 'Tracks the real revenue retained by the business from sales.'
  },
  'Transactions': {
    definition: 'Count of completed sales records in the period.',
    formula: 'Number of sales rows.',
    businessMeaning: 'Shows sales volume and purchase activity intensity.'
  },
  'Unique Members': {
    definition: 'Distinct members or customers who made purchases.',
    formula: 'Distinct `memberId` or fallback customer identity count.',
    businessMeaning: 'Shows customer reach and breadth of monetized engagement.'
  },
  'Average Transaction Value': {
    definition: 'Average net revenue generated per transaction.',
    formula: 'Net Sales / Transactions.',
    businessMeaning: 'Shows ticket size and upsell quality per purchase.'
  },
  'Discount Value': {
    definition: 'Total discount amount granted across eligible sales.',
    formula: 'Sum of `discountAmount`.',
    businessMeaning: 'Shows how much revenue was traded off to convert or retain demand.'
  },
  'Discounted Transactions': {
    definition: 'Transactions where a discount amount or percentage was applied.',
    formula: 'Count of rows with `discountAmount > 0` or `discountPercentage > 0`.',
    businessMeaning: 'Shows how frequently discounting is being used to close sales.'
  },
  'Discount Penetration': {
    definition: 'Share of transactions that carried a discount.',
    formula: 'Discounted Transactions / Transactions × 100.',
    businessMeaning: 'Shows how dependent the business is on discount-led conversion.'
  },
  'VAT Collected': {
    definition: 'Total VAT component collected on billed sales.',
    formula: 'Sum of `paymentVAT`.',
    businessMeaning: 'Helps separate statutory tax collections from operating revenue.'
  },
  'Money Credits Used': {
    definition: 'Value settled through money credits instead of direct payment.',
    formula: 'Sum of `paidInMoneyCredits`.',
    businessMeaning: 'Shows how much revenue was fulfilled through stored value or credits.'
  },
  'Package Sales': {
    definition: 'Net sales attributed to package-category products.',
    formula: 'Net Sales where `cleanedCategory` contains package.',
    businessMeaning: 'Shows package-led revenue contribution and commitment buying behavior.'
  },
  'Retail Sales': {
    definition: 'Net sales attributed to retail-category products.',
    formula: 'Net Sales where `cleanedCategory` contains retail.',
    businessMeaning: 'Shows ancillary merchandising contribution beyond core sessions.'
  },
  'Membership Sales': {
    definition: 'Net sales attributed to memberships or membership-like products.',
    formula: 'Net Sales where `membershipType` or `cleanedCategory` contains member.',
    businessMeaning: 'Shows recurring-access style demand and membership monetization strength.'
  },
  'Drop-in Sales': {
    definition: 'Net sales from single-class, trial, or drop-in purchases.',
    formula: 'Net Sales where product text contains drop, single, or trial.',
    businessMeaning: 'Shows lower-commitment entry demand and newcomer conversion opportunity.'
  },
  'Online / System Sales': {
    definition: 'Net sales attributed to online, system, or unattributed seller records.',
    formula: 'Net Sales where `soldBy` is blank, `-`, online, or system.',
    businessMeaning: 'Shows how much revenue is coming through non-human or self-serve channels.'
  },
  'Top Seller Share': {
    definition: 'Share of net sales contributed by the strongest seller for the period.',
    formula: 'Highest seller net revenue / Net Sales × 100.',
    businessMeaning: 'Shows concentration risk and dependence on top individual sellers.'
  },
  'Distinct Products Sold': {
    definition: 'Count of different products sold in the period.',
    formula: 'Distinct count of `cleanedProduct`.',
    businessMeaning: 'Shows assortment breadth and product mix diversity.'
  },
  'Distinct Categories Sold': {
    definition: 'Count of different sales categories represented in the period.',
    formula: 'Distinct count of `cleanedCategory`.',
    businessMeaning: 'Shows how balanced revenue is across major product families.'
  },
  'Average Revenue per Member': {
    definition: 'Average net revenue generated per purchasing member.',
    formula: 'Net Sales / Unique Members.',
    businessMeaning: 'Shows monetization depth per buyer and customer value quality.'
  },
  'Promo-led Sales': {
    definition: 'Net sales coming from promotional or discounted transactions.',
    formula: 'Net Sales where `isPromotional` is true or a discount was applied.',
    businessMeaning: 'Shows how much revenue is being driven by promotional mechanics.'
  },
};

const isWithinRange = (value: string | undefined, range: { start: string; end: string }): boolean => {
  const date = value ? parseDate(value) : null;
  if (!date) return false;

  const start = range.start ? new Date(`${range.start}T00:00:00`) : null;
  const end = range.end ? new Date(`${range.end}T23:59:59.999`) : null;

  if (start && date < start) return false;
  if (end && date > end) return false;
  return true;
};

// Converts "May-2026" or "May 2026" to "2026-05" for ISO comparison.
// Falls back to slicing if already ISO-like ("2026-05-01" → "2026-05").
const normalizeMonthYearToISO = (value: string): string => {
  if (/^\d{4}-\d{2}/.test(value)) return value.slice(0, 7);
  const normalized = value.replace(/-/g, ' ').trim();
  const parsed = new Date(`1 ${normalized}`);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
  }
  return value.slice(0, 7);
};

const isMonthKeyWithinRange = (value: string | undefined, range: { start: string; end: string }): boolean => {
  if (!value) return false;

  const normalizedValue = normalizeMonthYearToISO(value);
  const startKey = range.start ? range.start.slice(0, 7) : '';
  const endKey = range.end ? range.end.slice(0, 7) : '';

  if (startKey && normalizedValue < startKey) return false;
  if (endKey && normalizedValue > endKey) return false;
  return true;
};

const shiftRangeBackOneMonth = (range: { start: string; end: string }) => {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const shiftedStart = new Date(start.getFullYear(), start.getMonth() - 1, start.getDate());
  const shiftedEnd = new Date(end.getFullYear(), end.getMonth() - 1, end.getDate());

  const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(shiftedStart), end: format(shiftedEnd) };
};

const shiftRangeBackOneYear = (range: { start: string; end: string }) => {
  const start = new Date(`${range.start}T00:00:00`);
  const end = new Date(`${range.end}T00:00:00`);
  const shiftedStart = new Date(start.getFullYear() - 1, start.getMonth(), start.getDate());
  const shiftedEnd = new Date(end.getFullYear() - 1, end.getMonth(), end.getDate());

  const format = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  return { start: format(shiftedStart), end: format(shiftedEnd) };
};

/* ------------------------------------------------------------------ */
/* Small presentational pieces                                         */
/* ------------------------------------------------------------------ */

const RANK_ICONS_TOP = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
const RANK_ICONS_BOTTOM = ['🔴','🟠','🟡','⚠️','📉','📉','📉','📉','📉','📉'];
const RANK_ICONS = RANK_ICONS_TOP;

const AnimatedSectionCard: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  className?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon: Icon, iconGradient, className, action, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className={cn('rounded-3xl border border-slate-200/70 bg-white/95 p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] backdrop-blur-md', className)}
  >
    <div className="mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.06 }}
          className={cn('flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', iconGradient)}
        >
          <Icon className="h-5 w-5" />
        </motion.div>
        <div>
          <h3 className="text-xl font-black leading-tight tracking-tight text-slate-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs font-medium text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </motion.div>
);

const EmptyNote: React.FC<{ label?: string }> = ({ label = 'No data for this studio yet' }) => (
  <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 text-sm text-slate-400">
    {label}
  </div>
);

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
  fontSize: 12,
};

/* ------------------------------------------------------------------ */
/* Main page                                                           */
/* ------------------------------------------------------------------ */

// ── Format Comparison Section ─────────────────────────────────────────────────
type FormatCompTab = 'overview' | 'trainer';

interface FormatMetrics {
  name: string;
  sessions: number;
  visits: number;
  capacity: number;
  revenue: number;
  lateCancels: number;
  classAvg: number;
  fillRate: number;
  cancellationRate: number;
  revPerSession: number;
  emptyClasses: number;
  trainers: string[];
  locations: string[];
  trendPct: number;
  trend: 'growing' | 'declining' | 'stable';
  consistency: number;
  // monthly trend for sparkline
  monthlyAvg: { month: string; avg: number; fill: number }[];
}

function FormatComparisonSection({ sessions, trainerTabOnly }: { sessions: any[]; trainerTabOnly?: boolean }) {
  const [activeTab, setActiveTab] = useState<FormatCompTab>(trainerTabOnly ? 'trainer' : 'overview');
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'classAvg' | 'fillRate' | 'revenue' | 'sessions'>('classAvg');

  const formatMetrics = useMemo<FormatMetrics[]>(() => {
    const grouped: Record<string, typeof sessions> = {};
    sessions.forEach((s) => {
      const key = s.cleanedClass || s.classType || 'Unknown';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(s);
    });
    return Object.entries(grouped).map(([name, rows]) => {
      const visits = rows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
      const capacity = rows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
      const revenue = rows.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
      const lateCancels = rows.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
      const classAvg = rows.length > 0 ? visits / rows.length : 0;
      const fillRate = capacity > 0 ? (visits / capacity) * 100 : 0;
      const cancellationRate = visits + lateCancels > 0 ? (lateCancels / (visits + lateCancels)) * 100 : 0;
      const revPerSession = rows.length > 0 ? revenue / rows.length : 0;
      const emptyClasses = rows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
      const trainers = [...new Set(rows.map((s) => s.trainerName).filter(Boolean))];
      const locations = [...new Set(rows.map((s) => s.location).filter(Boolean))];

      // trend
      const sorted = [...rows].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const mid = Math.floor(sorted.length / 2);
      const firstAvg = mid > 0 ? sorted.slice(0, mid).reduce((s, r) => s + (Number(r.checkedInCount) || 0), 0) / mid : 0;
      const secondAvg = sorted.length - mid > 0 ? sorted.slice(mid).reduce((s, r) => s + (Number(r.checkedInCount) || 0), 0) / (sorted.length - mid) : 0;
      const trendPct = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
      const trend: FormatMetrics['trend'] = trendPct > 5 ? 'growing' : trendPct < -5 ? 'declining' : 'stable';

      // consistency
      const mean = classAvg;
      const variance = rows.length > 0 ? rows.reduce((s, r) => { const d = (Number(r.checkedInCount) || 0) - mean; return s + d * d; }, 0) / rows.length : 0;
      const stdDev = Math.sqrt(variance);
      const consistency = mean > 0 ? Math.max(0, Math.round(100 - (stdDev / mean) * 100)) : 0;

      // monthly sparkline
      const byMonth: Record<string, { visits: number; cap: number; n: number }> = {};
      rows.forEach((s) => {
        const mk = (s.date || '').slice(0, 7);
        if (!mk) return;
        if (!byMonth[mk]) byMonth[mk] = { visits: 0, cap: 0, n: 0 };
        byMonth[mk].visits += Number(s.checkedInCount) || 0;
        byMonth[mk].cap += Number(s.capacity) || 0;
        byMonth[mk].n += 1;
      });
      const monthlyAvg = Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({
        month,
        avg: d.n > 0 ? d.visits / d.n : 0,
        fill: d.cap > 0 ? (d.visits / d.cap) * 100 : 0,
      }));

      return { name, sessions: rows.length, visits, capacity, revenue, lateCancels, classAvg, fillRate, cancellationRate, revPerSession, emptyClasses, trainers, locations, trendPct, trend, consistency, monthlyAvg };
    }).sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sessions, sortBy]);

  const selected = useMemo(() => formatMetrics.find((f) => f.name === selectedFormat) || null, [formatMetrics, selectedFormat]);

  const trendColor = (t: FormatMetrics['trend']) => t === 'growing' ? 'text-emerald-600' : t === 'declining' ? 'text-red-500' : 'text-slate-500';
  const trendBg = (t: FormatMetrics['trend']) => t === 'growing' ? 'bg-emerald-50 border-emerald-200' : t === 'declining' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200';

  // Recharts tooltip style (inline)
  const ttStyle = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: 11, padding: '6px 10px' };

  return (
    <div className="space-y-5">
      {/* Tab bar — hidden when trainerTabOnly */}
      {!trainerTabOnly && <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
          {([
            { value: 'overview', label: '📊 Overview' },
            { value: 'trainer', label: '👤 Trainer Comparison' },
          ] as const).map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setActiveTab(value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                activeTab === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
              )}
            >{label}</button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Sort by</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
          >
            <option value="classAvg">Class Avg</option>
            <option value="fillRate">Fill Rate</option>
            <option value="revenue">Revenue</option>
            <option value="sessions">Sessions</option>
          </select>
        </div>
      </div>}

      {/* Overview tab — format cards */}
      {activeTab === 'overview' && (() => {
        const FMT_ORDER = ['PowerCycle', 'Barre', 'Strength', 'Other'] as const;
        const FMT_GRAD: Record<string, string> = {
          PowerCycle: 'from-blue-600 via-indigo-600 to-indigo-700',
          Barre: 'from-purple-600 via-violet-600 to-violet-700',
          Strength: 'from-rose-500 via-pink-600 to-pink-700',
          Other: 'from-slate-500 via-slate-600 to-slate-700',
        };
        const FMT_ACCENT: Record<string, string> = {
          PowerCycle: 'bg-blue-500/20 text-blue-100',
          Barre: 'bg-purple-500/20 text-purple-100',
          Strength: 'bg-rose-500/20 text-rose-100',
          Other: 'bg-slate-500/20 text-slate-200',
        };
        const FMT_BAR: Record<string, string> = {
          PowerCycle: 'bg-blue-300',
          Barre: 'bg-purple-300',
          Strength: 'bg-rose-300',
          Other: 'bg-slate-300',
        };

        const grouped: Record<string, typeof sessions> = {};
        FMT_ORDER.forEach((f) => { grouped[f] = []; });
        sessions.forEach((s) => { grouped[classifyFormat(s.cleanedClass || s.classType)].push(s); });

        const cards = FMT_ORDER.map((fmt) => {
          const rows = grouped[fmt];
          if (!rows.length) return null;
          const visits = rows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
          const capacity = rows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
          const revenue = rows.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
          const lateCancels = rows.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
          const emptyClasses = rows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
          const classAvg = rows.length ? visits / rows.length : 0;
          const fillRate = capacity ? (visits / capacity) * 100 : 0;

          const tv: Record<string, number> = {};
          rows.forEach((s) => { const t = s.trainerName || ''; if (t) tv[t] = (tv[t] || 0) + (Number(s.checkedInCount) || 0); });
          const topTrainer = Object.entries(tv).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          const cv: Record<string, number> = {};
          rows.forEach((s) => { const c = s.cleanedClass || s.classType || ''; if (c) cv[c] = (cv[c] || 0) + (Number(s.checkedInCount) || 0); });
          const topClass = Object.entries(cv).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          const tc: Record<string, number> = {};
          rows.forEach((s) => { const raw = s.startTime || s.time || ''; const m = raw.match(/(\d{1,2}:\d{2}\s*(?:AM|PM)?)/i); if (m) tc[m[1]] = (tc[m[1]] || 0) + 1; });
          const topTiming = Object.entries(tc).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

          return { fmt, sessionsCount: rows.length, visits, capacity, revenue, lateCancels, classAvg, fillRate, emptyClasses, nonEmptyClasses: rows.length - emptyClasses, topTrainer, topClass, topTiming };
        }).filter(Boolean) as { fmt: string; sessionsCount: number; visits: number; capacity: number; revenue: number; lateCancels: number; classAvg: number; fillRate: number; emptyClasses: number; nonEmptyClasses: number; topTrainer: string; topClass: string; topTiming: string }[];

        const fmtCur = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0, notation: 'compact' });

        return (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {cards.map((card) => (
              <div key={card.fmt} className={cn('relative overflow-hidden rounded-2xl bg-gradient-to-br text-white shadow-lg', FMT_GRAD[card.fmt])}>
                <div className="absolute inset-0 bg-black/10 pointer-events-none" />
                <div className="relative z-10 flex flex-col p-5 gap-4">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60 mb-0.5">Class Format</p>
                    <h3 className="text-2xl font-extrabold leading-tight tracking-tight">{card.fmt}</h3>
                    {card.fmt === 'Other' && (
                      <p className="mt-0.5 text-[10px] text-white/50 leading-snug">Workshops, privates, events, cardio, pilates, yoga &amp; uncategorised classes</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Total Sessions', value: card.sessionsCount.toLocaleString() },
                      { label: 'Revenue', value: fmtCur.format(card.revenue) },
                      { label: 'Avg Capacity', value: (card.capacity / (card.sessionsCount || 1)).toFixed(0) },
                      { label: 'Fill Rate', value: `${card.fillRate.toFixed(1)}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className={cn('rounded-xl px-3 py-2.5', FMT_ACCENT[card.fmt])}>
                        <p className="text-[10px] font-medium uppercase tracking-wider opacity-75 leading-none mb-1">{label}</p>
                        <p className="text-lg font-extrabold leading-none tabular-nums">{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-white/20 overflow-hidden">
                    <div className={cn('h-1.5 rounded-full', FMT_BAR[card.fmt])} style={{ width: `${Math.min(card.fillRate, 100)}%` }} />
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: 'Non-Empty Classes', value: card.nonEmptyClasses },
                      { label: 'Empty Classes', value: card.emptyClasses },
                      { label: 'Class Avg', value: card.classAvg.toFixed(1) },
                      { label: 'Late Cancelled', value: card.lateCancels },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-[11px] text-white/70 font-medium">{label}</span>
                        <span className="text-xs font-bold tabular-nums">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-white/20" />
                  <div>
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/50 mb-2">Top Performers</p>
                    <div className="space-y-1.5">
                      {[
                        { label: 'Trainer', value: card.topTrainer },
                        { label: 'Class', value: card.topClass },
                        { label: 'Timing', value: card.topTiming },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between gap-2">
                          <span className="text-[10px] text-white/60 font-semibold shrink-0">{label}</span>
                          <span className="text-[11px] font-bold text-right leading-tight truncate max-w-[60%]" title={value}>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Trainer comparison tab */}
      {activeTab === 'trainer' && (
        <div className="space-y-4">
          {/* Format selector */}
          <div className="flex flex-wrap gap-2">
            {formatMetrics.map((f) => (
              <button
                key={f.name}
                type="button"
                onClick={() => setSelectedFormat(f.name)}
                className={cn(
                  'px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all',
                  selectedFormat === f.name ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                )}
              >{f.name}</button>
            ))}
          </div>

          {selected ? (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-5 py-3 text-white">
                <h4 className="text-sm font-bold">Trainer breakdown for {selected.name}</h4>
                <p className="text-[11px] text-white/70">{selected.sessions} sessions · {selected.trainers.length} trainers</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                    <tr>
                      <th className="border-b border-slate-200 px-4 py-3 text-left">Trainer</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Sessions</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Visits</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Class Avg</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-left min-w-[120px]">Fill Rate</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Revenue</th>
                      <th className="border-b border-slate-200 px-3 py-3 text-right">Late Cancels</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {selected.trainers.map((trainer) => {
                      const trSessions = sessions.filter((s) => (s.cleanedClass || s.classType) === selected.name && s.trainerName === trainer);
                      const trVisits = trSessions.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
                      const trCap = trSessions.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
                      const trRev = trSessions.reduce((sum, s) => sum + (Number(s.revenue) || Number(s.totalPaid) || 0), 0);
                      const trLC = trSessions.reduce((sum, s) => sum + (Number(s.lateCancelledCount) || 0), 0);
                      const trAvg = trSessions.length > 0 ? trVisits / trSessions.length : 0;
                      const trFill = trCap > 0 ? (trVisits / trCap) * 100 : 0;
                      return (
                        <tr key={trainer} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2.5 font-medium text-slate-900 text-sm">{trainer}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700 text-right text-xs">{trSessions.length}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-700 text-right text-xs">{trVisits}</td>
                          <td className="px-3 py-2.5 tabular-nums font-bold text-blue-700 text-right text-xs">{trAvg.toFixed(1)}</td>
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-14 rounded-full bg-slate-100 overflow-hidden">
                                <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(trFill, 100)}%` }} />
                              </div>
                              <span className="text-xs text-slate-700 font-semibold">{trFill.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 tabular-nums text-green-700 font-semibold text-right text-xs">{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(trRev)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-500 text-right text-xs">{trLC}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-400">Select a format above to see trainer breakdown</div>
          )}
        </div>
      )}
    </div>
  );
}

const StudioPulse = memo(() => {
  const navigate = useNavigate();
  const { setLoading } = useGlobalLoading();
  const defaultDateRange = useMemo(() => getDashboardDefaultDateRange(), []);
  const [studio, setStudio] = useState<StudioId>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(defaultDateRange);
  const previousDateRange = useMemo(() => shiftRangeBackOneMonth(dateRange), [dateRange]);
  const previousYearDateRange = useMemo(() => shiftRangeBackOneYear(dateRange), [dateRange]);

  const { data: sales = [], loading: salesLoading, refetch: refetchSales } = useGoogleSheets();
  const { data: sessions = [], loading: sessionsLoading } = useSessionsData();
  const { data: clients = [], loading: clientsLoading } = useNewClientData();
  const { data: payroll = [], isLoading: payrollLoading } = usePayrollData();
  const { data: leads = [], loading: leadsLoading } = useLeadsData();
  const { data: lateCancels = [], loading: lcLoading } = useLateCancellationsData();
  const { data: expirations = [], loading: expLoading } = useExpirationsData();

  const anyLoading = salesLoading || sessionsLoading || clientsLoading || payrollLoading || leadsLoading || lcLoading || expLoading;

  useEffect(() => {
    setLoading(salesLoading, 'Reading the studio pulse...');
  }, [salesLoading, setLoading]);

  const filteredSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, dateRange)),
    [sales, studio, dateRange]
  );
  const previousSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, previousDateRange)),
    [sales, studio, previousDateRange]
  );
  const previousYearSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio) && isWithinRange(item.paymentDate, previousYearDateRange)),
    [sales, studio, previousYearDateRange]
  );
  const studioWideSales = useMemo(
    () => sales.filter((item) => inStudio(item.calculatedLocation, studio)),
    [sales, studio]
  );

  const filteredSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, dateRange)),
    [sessions, studio, dateRange]
  );
  const previousSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, previousDateRange)),
    [sessions, studio, previousDateRange]
  );
  const previousYearSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio) && isWithinRange(item.date, previousYearDateRange)),
    [sessions, studio, previousYearDateRange]
  );

  const filteredClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, dateRange)),
    [clients, studio, dateRange]
  );
  const previousClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, previousDateRange)),
    [clients, studio, previousDateRange]
  );
  const previousYearClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio) && isWithinRange(item.firstVisitDate, previousYearDateRange)),
    [clients, studio, previousYearDateRange]
  );

  const filteredPayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio) && isMonthKeyWithinRange(item.monthYear, dateRange)),
    [payroll, studio, dateRange]
  );
  const previousPayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio) && isMonthKeyWithinRange(item.monthYear, previousDateRange)),
    [payroll, studio, previousDateRange]
  );

  const filteredLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio) && isWithinRange(item.createdAt, dateRange)),
    [leads, studio, dateRange]
  );
  const previousLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio) && isWithinRange(item.createdAt, previousDateRange)),
    [leads, studio, previousDateRange]
  );

  const filteredLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, dateRange)),
    [lateCancels, studio, dateRange]
  );
  const previousLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, previousDateRange)),
    [lateCancels, studio, previousDateRange]
  );
  const previousYearLateCancels = useMemo(
    () => lateCancels.filter((item) => inStudio(item.location, studio) && isWithinRange(item.dateIST || item.sessionDateIST, previousYearDateRange)),
    [lateCancels, studio, previousYearDateRange]
  );

  /* ---------- Expirations (lapsed) ---------- */
  const filteredExpirations = useMemo(
    () => expirations.filter((item) => inStudio(item.homeLocation, studio) && isWithinRange(item.endDate, dateRange)),
    [expirations, studio, dateRange]
  );
  const previousExpirations = useMemo(
    () => expirations.filter((item) => inStudio(item.homeLocation, studio) && isWithinRange(item.endDate, previousDateRange)),
    [expirations, studio, previousDateRange]
  );
  const previousYearExpirations = useMemo(
    () => expirations.filter((item) => inStudio(item.homeLocation, studio) && isWithinRange(item.endDate, previousYearDateRange)),
    [expirations, studio, previousYearDateRange]
  );
  const expirationStats = useMemo(() => {
    const total = filteredExpirations.length;
    const prev = previousExpirations.length;
    const yoy = previousYearExpirations.length;
    const churned = filteredExpirations.filter((e) => /churn/i.test(e.status)).length;
    const byLocation: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const loc = e.homeLocation || 'Unknown';
      byLocation[loc] = (byLocation[loc] || 0) + 1;
    });
    const topLocations = Object.entries(byLocation)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
    return {
      total,
      churned,
      topLocations,
      momGrowth: pctChange(total, prev),
      yoyGrowth: pctChange(total, yoy),
    };
  }, [filteredExpirations, previousExpirations, previousYearExpirations]);

  /* ---------- Sales ---------- */
  const salesStats = useMemo(() => {
    const rows = filteredSales;
    let gross = 0;
    let net = 0;
    let discount = 0;
    let discountedTxns = 0;
    const members = new Set<string>();
    const monthly: Record<string, number> = {};
    const products: Record<string, number> = {};
    const discountByProduct: Record<string, { amount: number; count: number }> = {};

    rows.forEach((d) => {
      const pay = Number(d.paymentValue) || 0;
      const vat = Number(d.paymentVAT) || 0;
      gross += pay;
      net += pay - vat;
      const disc = Number(d.discountAmount) || 0;
      if (disc > 0) {
        discount += disc;
        discountedTxns += 1;
        const p = d.cleanedProduct || 'Other';
        discountByProduct[p] = discountByProduct[p] || { amount: 0, count: 0 };
        discountByProduct[p].amount += disc;
        discountByProduct[p].count += 1;
      }
      if (d.memberId) members.add(d.memberId);
      const mk = monthKeyFromDate(d.paymentDate);
      if (mk) monthly[mk] = (monthly[mk] || 0) + (pay - vat);
      const prod = d.cleanedProduct || 'Other';
      products[prod] = (products[prod] || 0) + (pay - vat);
    });

    const txns = rows.length;
    const monthsSorted = Object.keys(monthly).sort();
    const trend = monthsSorted.slice(-12).map((k) => ({ key: k, label: monthLabel(k), revenue: Math.round(monthly[k]) }));

    const last = monthsSorted[monthsSorted.length - 1];
    const prev = monthsSorted[monthsSorted.length - 2];
    const revDelta = last && prev ? pctChange(monthly[last], monthly[prev]) : null;
    const prevRows = previousSales;
    const prevGross = prevRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0), 0);
    const prevNet = prevRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const prevDiscountedTxns = prevRows.filter((d) => (Number(d.discountAmount) || 0) > 0).length;
    const prevDiscount = prevRows.reduce((sum, d) => sum + (Number(d.discountAmount) || 0), 0);
    const prevTxns = prevRows.length;
    const prevMembers = new Set(prevRows.map((d) => d.memberId).filter(Boolean)).size;
    const yoyRows = previousYearSales;
    const yoyGross = yoyRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0), 0);
    const yoyNet = yoyRows.reduce((sum, d) => sum + (Number(d.paymentValue) || 0) - (Number(d.paymentVAT) || 0), 0);
    const yoyDiscountedTxns = yoyRows.filter((d) => (Number(d.discountAmount) || 0) > 0).length;
    const yoyDiscount = yoyRows.reduce((sum, d) => sum + (Number(d.discountAmount) || 0), 0);
    const yoyTxns = yoyRows.length;
    const yoyMembers = new Set(yoyRows.map((d) => d.memberId).filter(Boolean)).size;

    const topProducts = Object.entries(products)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);

    const topDiscounts = Object.entries(discountByProduct)
      .map(([name, v]) => ({ name, amount: v.amount, count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      gross,
      net,
      txns,
      atv: txns ? net / txns : 0,
      members: members.size,
      discount,
      discountPenetration: txns ? (discountedTxns / txns) * 100 : 0,
      growth: {
        net: pctChange(net, prevNet),
        gross: pctChange(gross, prevGross),
        txns: pctChange(txns, prevTxns),
        members: pctChange(members.size, prevMembers),
        discount: pctChange(discount, prevDiscount),
        discountPenetration: pctChange(discountedTxns, prevDiscountedTxns),
      },
      yoyGrowth: {
        net: pctChange(net, yoyNet),
        gross: pctChange(gross, yoyGross),
        txns: pctChange(txns, yoyTxns),
        members: pctChange(members.size, yoyMembers),
        discount: pctChange(discount, yoyDiscount),
        discountPenetration: pctChange(discountedTxns, yoyDiscountedTxns),
      },
      trend,
      revDelta,
      topProducts,
      topDiscounts,
    };
  }, [filteredSales, previousSales, previousYearSales]);

  const salesMetricsMatrix = useMemo(() => {
    const monthlyMap = new Map<string, typeof filteredSales>();

    studioWideSales.forEach((item) => {
      const key = monthKeyFromDate(item.paymentDate);
      if (!key) return;
      const existing = monthlyMap.get(key) || [];
      existing.push(item);
      monthlyMap.set(key, existing);
    });

    const months = Array.from(monthlyMap.keys()).sort().reverse();
    const monthLabels: Record<string, string> = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));

    const metricRows: SalesMetricsMatrixRow[] = [
      { label: 'Gross Sales', type: 'currency', values: {} },
      { label: 'Net Sales', type: 'currency', values: {} },
      { label: 'Transactions', type: 'number', values: {} },
      { label: 'Unique Members', type: 'number', values: {} },
      { label: 'Average Transaction Value', type: 'currency', values: {} },
      { label: 'Discount Value', type: 'currency', values: {} },
      { label: 'Discounted Transactions', type: 'number', values: {} },
      { label: 'Discount Penetration', type: 'percent', values: {} },
      { label: 'VAT Collected', type: 'currency', values: {} },
      { label: 'Money Credits Used', type: 'currency', values: {} },
      { label: 'Package Sales', type: 'currency', values: {} },
      { label: 'Retail Sales', type: 'currency', values: {} },
      { label: 'Membership Sales', type: 'currency', values: {} },
      { label: 'Drop-in Sales', type: 'currency', values: {} },
      { label: 'Online / System Sales', type: 'currency', values: {} },
      { label: 'Top Seller Share', type: 'percent', values: {} },
      { label: 'Distinct Products Sold', type: 'number', values: {} },
      { label: 'Distinct Categories Sold', type: 'number', values: {} },
      { label: 'Average Revenue per Member', type: 'currency', values: {} },
      { label: 'Promo-led Sales', type: 'currency', values: {} },
    ];

    months.forEach((month) => {
      const rows = monthlyMap.get(month) || [];
      const gross = rows.reduce((sum, item) => sum + (Number(item.paymentValue) || 0), 0);
      const vat = rows.reduce((sum, item) => sum + (Number(item.paymentVAT) || 0), 0);
      const net = gross - vat;
      const txns = rows.length;
      const uniqueMembers = new Set(rows.map((item) => item.memberId || item.customerEmail).filter(Boolean)).size;
      const discountValue = rows.reduce((sum, item) => sum + (Number(item.discountAmount) || 0), 0);
      const discountedTxns = rows.filter((item) => (Number(item.discountAmount) || 0) > 0 || (Number(item.discountPercentage) || 0) > 0).length;
      const moneyCredits = rows.reduce((sum, item) => sum + (Number(item.paidInMoneyCredits) || 0), 0);
      const packageSales = rows.filter((item) => (item.cleanedCategory || '').toLowerCase().includes('package')).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const retailSales = rows.filter((item) => (item.cleanedCategory || '').toLowerCase().includes('retail')).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const membershipSales = rows.filter((item) => (item.membershipType || item.cleanedCategory || '').toLowerCase().includes('member')).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const dropInSales = rows.filter((item) => {
        const value = `${item.paymentItem || ''} ${item.cleanedProduct || ''} ${item.cleanedCategory || ''}`.toLowerCase();
        return value.includes('drop') || value.includes('single') || value.includes('trial');
      }).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const onlineSales = rows.filter((item) => !item.soldBy || item.soldBy === '-' || item.soldBy.toLowerCase().includes('online') || item.soldBy.toLowerCase().includes('system')).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);
      const sellerRevenue = rows.reduce<Record<string, number>>((acc, item) => {
        const seller = item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Unknown');
        acc[seller] = (acc[seller] || 0) + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0));
        return acc;
      }, {});
      const topSellerShare = net > 0 ? (Math.max(0, ...Object.values(sellerRevenue)) / net) * 100 : 0;
      const promoSales = rows.filter((item) => item.isPromotional || (Number(item.discountAmount) || 0) > 0).reduce((sum, item) => sum + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0)), 0);

      metricRows[0].values[month] = gross;
      metricRows[1].values[month] = net;
      metricRows[2].values[month] = txns;
      metricRows[3].values[month] = uniqueMembers;
      metricRows[4].values[month] = txns ? net / txns : 0;
      metricRows[5].values[month] = discountValue;
      metricRows[6].values[month] = discountedTxns;
      metricRows[7].values[month] = txns ? (discountedTxns / txns) * 100 : 0;
      metricRows[8].values[month] = vat;
      metricRows[9].values[month] = moneyCredits;
      metricRows[10].values[month] = packageSales;
      metricRows[11].values[month] = retailSales;
      metricRows[12].values[month] = membershipSales;
      metricRows[13].values[month] = dropInSales;
      metricRows[14].values[month] = onlineSales;
      metricRows[15].values[month] = topSellerShare;
      metricRows[16].values[month] = new Set(rows.map((item) => item.cleanedProduct).filter(Boolean)).size;
      metricRows[17].values[month] = new Set(rows.map((item) => item.cleanedCategory).filter(Boolean)).size;
      metricRows[18].values[month] = uniqueMembers ? net / uniqueMembers : 0;
      metricRows[19].values[month] = promoSales;
    });

    return { months, monthLabels, metricRows };
  }, [studioWideSales]);

  /* ---------- Sessions ---------- */
  const sessionStats = useMemo(() => {
    const rows = filteredSessions;
    let attendance = 0;
    let capacity = 0;
    let empty = 0;
    const monthly: Record<string, { att: number; cap: number }> = {};
    const formats: Record<string, number> = { Barre: 0, PowerCycle: 0, Strength: 0, Other: 0 };

    rows.forEach((s) => {
      const checked = Number(s.checkedInCount) || 0;
      const cap = Number(s.capacity) || 0;
      attendance += checked;
      capacity += cap;
      if (checked === 0) empty += 1;
      const fmt = classifyFormat(s.cleanedClass || s.classType);
      formats[fmt] += checked;
      const mk = monthKeyFromDate(s.date);
      if (mk) {
        monthly[mk] = monthly[mk] || { att: 0, cap: 0 };
        monthly[mk].att += checked;
        monthly[mk].cap += cap;
      }
    });

    const monthsSorted = Object.keys(monthly).sort();
    const trend = monthsSorted.slice(-12).map((k) => ({
      key: k,
      label: monthLabel(k),
      attendance: monthly[k].att,
      fill: monthly[k].cap > 0 ? Math.round((monthly[k].att / monthly[k].cap) * 100) : 0,
    }));

    const last = monthsSorted[monthsSorted.length - 1];
    const prev = monthsSorted[monthsSorted.length - 2];
    const attDelta = last && prev ? pctChange(monthly[last].att, monthly[prev].att) : null;
    const prevRows = previousSessions;
    const prevAttendance = prevRows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const prevCapacity = prevRows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
    const prevEmpty = prevRows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;
    const yoyRows = previousYearSessions;
    const yoyAttendance = yoyRows.reduce((sum, s) => sum + (Number(s.checkedInCount) || 0), 0);
    const yoyCapacity = yoyRows.reduce((sum, s) => sum + (Number(s.capacity) || 0), 0);
    const yoyEmpty = yoyRows.filter((s) => (Number(s.checkedInCount) || 0) === 0).length;

    const formatData = Object.entries(formats)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    return {
      totalSessions: rows.length,
      attendance,
      capacity,
      avgFill: capacity > 0 ? (attendance / capacity) * 100 : 0,
      classAvg: rows.length ? attendance / Math.max(rows.length - empty, 1) : 0,
      emptyShare: rows.length ? (empty / rows.length) * 100 : 0,
      growth: {
        attendance: pctChange(attendance, prevAttendance),
        totalSessions: pctChange(rows.length, prevRows.length),
        avgFill: pctChange(capacity > 0 ? (attendance / capacity) * 100 : 0, prevCapacity > 0 ? (prevAttendance / prevCapacity) * 100 : 0),
        emptyShare: pctChange(rows.length ? (empty / rows.length) * 100 : 0, prevRows.length ? (prevEmpty / prevRows.length) * 100 : 0),
      },
      yoyGrowth: {
        attendance: pctChange(attendance, yoyAttendance),
        totalSessions: pctChange(rows.length, yoyRows.length),
        avgFill: pctChange(capacity > 0 ? (attendance / capacity) * 100 : 0, yoyCapacity > 0 ? (yoyAttendance / yoyCapacity) * 100 : 0),
        emptyShare: pctChange(rows.length ? (empty / rows.length) * 100 : 0, yoyRows.length ? (yoyEmpty / yoyRows.length) * 100 : 0),
      },
      trend,
      attDelta,
      formatData,
    };
  }, [filteredSessions, previousSessions, previousYearSessions]);

  /* ---------- Clients (retention / conversion) ---------- */
  const clientStats = useMemo(() => {
    const rows = filteredClients;
    const total = rows.length;
    const converted = rows.filter((c) => c.conversionStatus === 'Converted').length;
    const retained = rows.filter((c) => c.retentionStatus === 'Retained').length;
    const ltvVals = rows.map((c) => Number(c.ltv) || 0).filter((v) => v > 0);
    const avgLtv = ltvVals.length ? ltvVals.reduce((a, b) => a + b, 0) / ltvVals.length : 0;
    const spanVals = rows.map((c) => Number(c.conversionSpan) || 0).filter((v) => v > 0);
    const avgSpan = spanVals.length ? spanVals.reduce((a, b) => a + b, 0) / spanVals.length : 0;
    const prevRows = previousClients;
    const yoyRows = previousYearClients;
    const prevTotal = prevRows.length;
    const prevConverted = prevRows.filter((c) => c.conversionStatus === 'Converted').length;
    const prevRetained = prevRows.filter((c) => c.retentionStatus === 'Retained').length;
    const yoyTotal = yoyRows.length;
    const yoyConverted = yoyRows.filter((c) => c.conversionStatus === 'Converted').length;
    const yoyRetained = yoyRows.filter((c) => c.retentionStatus === 'Retained').length;
    const lapsed = rows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    const prevLapsed = prevRows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    const yoyLapsed = yoyRows.filter((c) => /lapsed|inactive|expired|churn|lost/i.test(`${c.retentionStatus || ''} ${c.conversionStatus || ''}`)).length;
    return {
      newClients: total,
      conversionRate: total ? (converted / total) * 100 : 0,
      retentionRate: total ? (retained / total) * 100 : 0,
      converted,
      retained,
      lapsed,
      avgLtv,
      avgSpan,
      growth: {
        newClients: pctChange(total, prevTotal),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, prevTotal ? (prevConverted / prevTotal) * 100 : 0),
        retentionRate: pctChange(total ? (retained / total) * 100 : 0, prevTotal ? (prevRetained / prevTotal) * 100 : 0),
        lapsed: pctChange(lapsed, prevLapsed),
      },
      yoyGrowth: {
        newClients: pctChange(total, yoyTotal),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, yoyTotal ? (yoyConverted / yoyTotal) * 100 : 0),
        retentionRate: pctChange(total ? (retained / total) * 100 : 0, yoyTotal ? (yoyRetained / yoyTotal) * 100 : 0),
        lapsed: pctChange(lapsed, yoyLapsed),
      },
    };
  }, [filteredClients, previousClients, previousYearClients]);

  /* ---------- Trainers (payroll) ---------- */
  const trainerStats = useMemo(() => {
    const rows = filteredPayroll;
    const byTrainer: Record<string, { name: string; customers: number; sessions: number; nonEmpty: number; paid: number }> = {};
    rows.forEach((p) => {
      const name = p.teacherName || 'Unknown';
      byTrainer[name] = byTrainer[name] || { name, customers: 0, sessions: 0, nonEmpty: 0, paid: 0 };
      byTrainer[name].customers += Number(p.totalCustomers) || 0;
      byTrainer[name].sessions += Number(p.totalSessions) || 0;
      byTrainer[name].nonEmpty += Number(p.totalNonEmptySessions) || 0;
      byTrainer[name].paid += Number(p.totalPaid) || 0;
    });
    const all = Object.values(byTrainer)
      .map((t) => ({ ...t, classAvg: t.nonEmpty > 0 ? t.customers / t.nonEmpty : 0 }))
      .sort((a, b) => b.customers - a.customers);
    const prevRows = previousPayroll;
    const prevCustomers = prevRows.reduce((sum, p) => sum + (Number(p.totalCustomers) || 0), 0);
    return { top: all.slice(0, 6), all, growth: { customers: pctChange(rows.reduce((sum, p) => sum + (Number(p.totalCustomers) || 0), 0), prevCustomers) } };
  }, [filteredPayroll, previousPayroll]);

  /* ---------- Leads / Funnel ---------- */
  const leadStats = useMemo(() => {
    const rows = filteredLeads;
    const total = rows.length;
    const converted = rows.filter((l) => isLeadConverted(l)).length;
    const trials = rows.filter((l) => {
      const t = (l.trialStatus || '').toLowerCase();
      return t.includes('completed') || t.includes('trial') || t.includes('attended');
    }).length;
    const bySource: Record<string, { count: number; converted: number }> = {};
    rows.forEach((l) => {
      const src = l.source || 'Unknown';
      bySource[src] = bySource[src] || { count: 0, converted: 0 };
      bySource[src].count += 1;
      if (isLeadConverted(l)) bySource[src].converted += 1;
    });
    const topSources = Object.entries(bySource)
      .map(([name, v]) => ({ name, count: v.count, rate: v.count ? (v.converted / v.count) * 100 : 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    return {
      total,
      trials,
      converted,
      conversionRate: total ? (converted / total) * 100 : 0,
      funnel: [
        { stage: 'Leads', value: total },
        { stage: 'Trials', value: trials },
        { stage: 'Converted', value: converted },
      ],
      topSources,
      growth: {
        total: pctChange(total, previousLeads.length),
        conversionRate: pctChange(total ? (converted / total) * 100 : 0, previousLeads.length ? (previousLeads.filter((l) => isLeadConverted(l)).length / previousLeads.length) * 100 : 0),
      },
    };
  }, [filteredLeads, previousLeads]);

  /* ---------- Late cancellations ---------- */
  const lcStats = useMemo(() => {
    const rows = filteredLateCancels;
    const sameDay = rows.filter((d) => d.isSameDayCancellation).length;
    const penalty = rows.reduce((sum, d) => sum + (Number(d.chargedPenaltyAmount) || 0), 0);
    const prevRows = previousLateCancels;
    const prevSameDay = prevRows.filter((d) => d.isSameDayCancellation).length;
    const prevPenalty = prevRows.reduce((sum, d) => sum + (Number(d.chargedPenaltyAmount) || 0), 0);
    return {
      total: rows.length,
      sameDay,
      penalty,
      growth: {
        total: pctChange(rows.length, prevRows.length),
        sameDay: pctChange(sameDay, prevSameDay),
        penalty: pctChange(penalty, prevPenalty),
      },
    };
  }, [filteredLateCancels, previousLateCancels]);

  const classFormatSummary = useMemo(() => {
    const byFormat: Record<string, { sessions: number; attendance: number; revenue: number }> = {};
    filteredSessions.forEach((session) => {
      const key = classifyFormat(session.cleanedClass || session.classType);
      byFormat[key] = byFormat[key] || { sessions: 0, attendance: 0, revenue: 0 };
      byFormat[key].sessions += 1;
      byFormat[key].attendance += Number(session.checkedInCount) || 0;
      byFormat[key].revenue += Number(session.totalPaid) || 0;
    });
    return Object.entries(byFormat).map(([name, value]) => ({
      name,
      sessions: value.sessions,
      attendance: value.attendance,
      revenue: value.revenue,
      fillRate: value.sessions ? value.attendance / value.sessions : 0,
    }));
  }, [filteredSessions]);

  const churnSummary = useMemo(() => {
    const byLocation: Record<string, { count: number; penalty: number }> = {};
    filteredLateCancels.forEach((item) => {
      const key = item.location || 'Unknown';
      byLocation[key] = byLocation[key] || { count: 0, penalty: 0 };
      byLocation[key].count += 1;
      byLocation[key].penalty += Number(item.chargedPenaltyAmount) || 0;
    });
    return Object.entries(byLocation)
      .map(([name, value]) => ({ name, ...value }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [filteredLateCancels]);

  const studioWideLeads = useMemo(
    () => leads.filter((item) => inStudio(item.center, studio)),
    [leads, studio]
  );

  const studioWideClients = useMemo(
    () => clients.filter((item) => inStudio(item.firstVisitLocation || item.homeLocation, studio)),
    [clients, studio]
  );

  const studioWidePayroll = useMemo(
    () => payroll.filter((item) => inStudio(item.location, studio)),
    [payroll, studio]
  );

  const studioWideSessions = useMemo(
    () => sessions.filter((item) => inStudio(item.location, studio)),
    [sessions, studio]
  );

  const studioWideExpirations = useMemo(
    () => expirations.filter((item) => inStudio(item.homeLocation, studio)),
    [expirations, studio]
  );

  const funnelMatrix = useMemo(() => {
    const months = Array.from(new Set([
      ...studioWideLeads.map((item) => monthKeyFromDate(item.createdAt)).filter(Boolean) as string[],
      ...studioWideClients.map((item) => monthKeyFromDate(item.firstVisitDate)).filter(Boolean) as string[],
    ])).sort().reverse();

    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Leads Received', type: 'number', values: {} },
      { label: 'Trials / First Visits', type: 'number', values: {} },
      { label: 'Converted Members', type: 'number', values: {} },
      { label: 'Lead To Member %', type: 'percent', values: {} },
      { label: 'Retained Members', type: 'number', values: {} },
      { label: 'Retention %', type: 'percent', values: {} },
      { label: 'Visits Post Trial', type: 'number', values: {} },
      { label: 'Avg Visits Post Trial', type: 'number', values: {} },
      { label: 'LTV', type: 'currency', values: {} },
      { label: 'Memberships Bought', type: 'number', values: {} },
      { label: 'Avg Conversion Span', type: 'number', values: {} },
      { label: 'Trial to Conversion %', type: 'percent', values: {} },
      { label: 'Avg LTV', type: 'currency', values: {} },
      { label: 'Revenue from Retained', type: 'currency', values: {} },
      { label: 'Lead to Trial %', type: 'percent', values: {} },
    ];

    months.forEach((month) => {
      const leadRows = studioWideLeads.filter((item) => monthKeyFromDate(item.createdAt) === month);
      const clientRows = studioWideClients.filter((item) => monthKeyFromDate(item.firstVisitDate) === month);
      const converted = leadRows.filter((item) => isLeadConverted(item)).length;
      const retained = clientRows.filter((item) => item.retentionStatus === 'Retained').length;
      const visitsPostTrial = clientRows.reduce((sum, item) => sum + (Number(item.visitsPostTrial) || 0), 0);
      const ltv = clientRows.reduce((sum, item) => sum + (Number(item.ltv) || 0), 0);
      const membershipsBought = clientRows.filter((item) => `${item.membershipsBoughtPostTrial || ''}`.trim()).length;

      const trials = leadRows.filter((item) => {
        const t = (item.trialStatus || '').toLowerCase();
        return t.includes('completed') || t.includes('trial') || t.includes('attended');
      }).length;
      const avgConversionSpan = clientRows.length ? clientRows.reduce((sum, item) => sum + (Number(item.conversionSpan) || 0), 0) / clientRows.length : 0;
      const avgLtv = clientRows.length ? ltv / clientRows.length : 0;
      const revenueFromRetained = clientRows.filter((item) => item.retentionStatus === 'Retained').reduce((sum, item) => sum + (Number(item.ltv) || 0), 0);
      rows[0].values[month] = leadRows.length;
      rows[1].values[month] = clientRows.length;
      rows[2].values[month] = converted;
      rows[3].values[month] = leadRows.length ? (converted / leadRows.length) * 100 : 0;
      rows[4].values[month] = retained;
      rows[5].values[month] = clientRows.length ? (retained / clientRows.length) * 100 : 0;
      rows[6].values[month] = visitsPostTrial;
      rows[7].values[month] = clientRows.length ? visitsPostTrial / clientRows.length : 0;
      rows[8].values[month] = ltv;
      rows[9].values[month] = membershipsBought;
      rows[10].values[month] = avgConversionSpan;
      rows[11].values[month] = trials > 0 ? (converted / trials) * 100 : 0;
      rows[12].values[month] = avgLtv;
      rows[13].values[month] = revenueFromRetained;
      rows[14].values[month] = leadRows.length > 0 ? (trials / leadRows.length) * 100 : 0;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWideClients, studioWideLeads]);

  const trainerMatrix = useMemo(() => {
    const months = Array.from(new Set(studioWidePayroll.map((item) => {
      const my = item.monthYear;
      if (!my) return null;
      return normalizeMonthYearToISO(my);
    }).filter(Boolean) as string[])).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Trainers Active', type: 'number', values: {} },
      { label: 'Sessions', type: 'number', values: {} },
      { label: 'Empty Sessions', type: 'number', values: {} },
      { label: 'Active Sessions', type: 'number', values: {} },
      { label: 'Customers', type: 'number', values: {} },
      { label: 'Pay', type: 'currency', values: {} },
      { label: 'Avg Incl Empty', type: 'number', values: {} },
      { label: 'Avg Excl Empty', type: 'number', values: {} },
      { label: 'New Members', type: 'number', values: {} },
      { label: 'Conversion %', type: 'percent', values: {} },
      { label: 'Retention %', type: 'percent', values: {} },
    ];

    months.forEach((month) => {
      const monthRows = studioWidePayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month);
      const totalSessions = monthRows.reduce((sum, item) => sum + (Number(item.totalSessions) || 0), 0);
      const emptySessions = monthRows.reduce((sum, item) => sum + (Number(item.totalEmptySessions) || 0), 0);
      const activeSessions = monthRows.reduce((sum, item) => sum + (Number(item.totalNonEmptySessions) || 0), 0);
      const customers = monthRows.reduce((sum, item) => sum + (Number(item.totalCustomers) || 0), 0);
      const pay = monthRows.reduce((sum, item) => sum + (Number(item.totalPaid) || 0), 0);
      const newMembers = monthRows.reduce((sum, item) => sum + (Number(item.new) || 0), 0);
      const converted = monthRows.reduce((sum, item) => sum + (Number(item.converted) || 0), 0);
      const retained = monthRows.reduce((sum, item) => sum + (Number(item.retained) || 0), 0);

      rows[0].values[month] = new Set(monthRows.map((item) => item.teacherName).filter(Boolean)).size;
      rows[1].values[month] = totalSessions;
      rows[2].values[month] = emptySessions;
      rows[3].values[month] = activeSessions;
      rows[4].values[month] = customers;
      rows[5].values[month] = pay;
      rows[6].values[month] = totalSessions ? customers / totalSessions : 0;
      rows[7].values[month] = activeSessions ? customers / activeSessions : 0;
      rows[8].values[month] = newMembers;
      rows[9].values[month] = newMembers ? (converted / newMembers) * 100 : 0;
      rows[10].values[month] = newMembers ? (retained / newMembers) * 100 : 0;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWidePayroll]);

  const classMatrix = useMemo(() => {
    const months = Array.from(new Set(studioWideSessions.map((item) => monthKeyFromDate(item.date)).filter(Boolean) as string[])).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Sessions Conducted', type: 'number', values: {} },
      { label: 'Visits', type: 'number', values: {} },
      { label: 'Capacity', type: 'number', values: {} },
      { label: 'Fill Rate', type: 'percent', values: {} },
      { label: 'Empty Sessions', type: 'number', values: {} },
      { label: 'Avg Class Size', type: 'number', values: {} },
      { label: 'Distinct Trainers', type: 'number', values: {} },
      { label: 'Distinct Formats', type: 'number', values: {} },
    ];

    months.forEach((month) => {
      const monthRows = studioWideSessions.filter((item) => monthKeyFromDate(item.date) === month);
      const visits = monthRows.reduce((sum, item) => sum + (Number(item.checkedInCount) || 0), 0);
      const capacity = monthRows.reduce((sum, item) => sum + (Number(item.capacity) || 0), 0);
      const emptySessions = monthRows.filter((item) => (Number(item.checkedInCount) || 0) === 0).length;

      rows[0].values[month] = monthRows.length;
      rows[1].values[month] = visits;
      rows[2].values[month] = capacity;
      rows[3].values[month] = capacity ? (visits / capacity) * 100 : 0;
      rows[4].values[month] = emptySessions;
      rows[5].values[month] = monthRows.length ? visits / monthRows.length : 0;
      rows[6].values[month] = new Set(monthRows.map((item) => item.trainerName).filter(Boolean)).size;
      rows[7].values[month] = new Set(monthRows.map((item) => classifyFormat(item.cleanedClass || item.classType))).size;
    });

    return { months, monthLabels, metricRows: rows };
  }, [studioWideSessions]);

  const lapsedMatrix = useMemo(() => {
    const months = Array.from(new Set(studioWideExpirations.map((item) => monthKeyFromDate(item.endDate)).filter(Boolean) as string[])).sort().reverse();
    const monthLabels = Object.fromEntries(months.map((month) => [month, monthLabel(month)]));
    const rows: SalesMetricsMatrixRow[] = [
      { label: 'Due Renewals', type: 'number', values: {} },
      { label: 'Renewed', type: 'number', values: {} },
      { label: 'Lapsed', type: 'number', values: {} },
      { label: 'Churned', type: 'number', values: {} },
      { label: 'Reactivated', type: 'number', values: {} },
      { label: 'Revenue Recovered', type: 'currency', values: {} },
      { label: 'Revenue Lost', type: 'currency', values: {} },
      { label: 'Lapse Rate %', type: 'percent', values: {} },
      { label: 'Churn Rate %', type: 'percent', values: {} },
      { label: 'Renewal Rate %', type: 'percent', values: {} },
      { label: 'Reactivation Rate %', type: 'percent', values: {} },
      { label: 'Net Retention %', type: 'percent', values: {} },
      { label: 'Not Renewed', type: 'number', values: {} },
      { label: 'Pending / Unknown', type: 'number', values: {} },
      { label: 'Net Revenue Impact', type: 'currency', values: {} },
    ];
    months.forEach((month) => {
      const monthRows = studioWideExpirations.filter((item) => monthKeyFromDate(item.endDate) === month);
      const total = monthRows.length;
      const renewed = monthRows.filter((e) => /renew|active|converted|paid/i.test(e.status)).length;
      const lapsed = monthRows.filter((e) => /lapsed|expired|inactive/i.test(e.status)).length;
      const churned = monthRows.filter((e) => /churn/i.test(e.status)).length;
      const reactivated = monthRows.filter((e) => /reactivat/i.test(e.status)).length;
      const revenueRecovered = monthRows.filter((e) => /renew|active|converted|paid/i.test(e.status)).reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
      const revenueLost = monthRows.filter((e) => /lapsed|expired|inactive|churn/i.test(e.status)).reduce((sum, e) => sum + (Number(e.paid) || 0), 0);
      const notRenewed = total - renewed - reactivated;
      const pending = monthRows.filter((e) => !e.status || /pending|unknown|n\/a/i.test(e.status)).length;
      rows[0].values[month] = total;
      rows[1].values[month] = renewed;
      rows[2].values[month] = lapsed;
      rows[3].values[month] = churned;
      rows[4].values[month] = reactivated;
      rows[5].values[month] = revenueRecovered;
      rows[6].values[month] = revenueLost;
      rows[7].values[month] = total ? ((lapsed + churned) / total) * 100 : 0;
      rows[8].values[month] = total ? (churned / total) * 100 : 0;
      rows[9].values[month] = total ? (renewed / total) * 100 : 0;
      rows[10].values[month] = total ? (reactivated / total) * 100 : 0;
      rows[11].values[month] = total ? ((renewed + reactivated) / total) * 100 : 0;
      rows[12].values[month] = Math.max(0, notRenewed);
      rows[13].values[month] = pending;
      rows[14].values[month] = revenueRecovered - revenueLost;
    });
    return { months, monthLabels, metricRows: rows };
  }, [studioWideExpirations]);

  const lapsedByMembership = useMemo(() => {
    const byMembership: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const key = e.membershipName || 'Unknown';
      byMembership[key] = (byMembership[key] || 0) + 1;
    });
    return Object.entries(byMembership).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredExpirations]);

  const lapsedByTrainer = useMemo(() => {
    const byTrainer: Record<string, number> = {};
    filteredExpirations.forEach((e) => {
      const key = (e as any).teacherName || (e as any).instructor || (e as any).trainer || 'Unknown';
      byTrainer[key] = (byTrainer[key] || 0) + 1;
    });
    return Object.entries(byTrainer).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filteredExpirations]);

  const [funnelRankingDimension, setFunnelRankingDimension] = useState<'source' | 'location' | 'stage' | 'membership' | 'class'>('source');
  const [newMemberTableMetric, setNewMemberTableMetric] = useState<'source' | 'membership' | 'class'>('source');
  const [funnelChartMetric, setFunnelChartMetric] = useState<'leads' | 'converted' | 'retained' | 'ltv'>('leads');
  const [funnelRankingCount, setFunnelRankingCount] = useState<5 | 10 | 15 | 20>(5);
  const [editableSummaryText, setEditableSummaryText] = useState('');
  const [isSummaryEditing, setIsSummaryEditing] = useState(false);
  const [showFunnelMomTable, setShowFunnelMomTable] = useState(false);
  const [funnelChartView, setFunnelChartView] = useState<'funnel' | 'bar'>('funnel');
  const [showFunnelBreakdownTable, setShowFunnelBreakdownTable] = useState(false);
  const [showNewMemberMomTable, setShowNewMemberMomTable] = useState(false);
  const [showTrainerMomTable, setShowTrainerMomTable] = useState(false);
  const [showTrainerFormatSection, setShowTrainerFormatSection] = useState(false);
  const [scorecardSortKey, setScorecardSortKey] = useState<'sessions' | 'customers' | 'paid' | 'classAvg' | 'utilization' | 'conversionRate' | 'lateCancels' | 'revenueScore'>('sessions');
  const [scorecardSortDir, setScorecardSortDir] = useState<'desc' | 'asc'>('desc');
  const [showClassMomTable, setShowClassMomTable] = useState(false);
  const [showLapsedMomTable, setShowLapsedMomTable] = useState(false);
  const [churnLocationMetric, setChurnLocationMetric] = useState<'count' | 'penalty'>('count');
  const [lapseRankDimension, setLapseRankDimension] = useState<'membership' | 'location'>('membership');
  const [sessionRankingDimension, setSessionRankingDimension] = useState<'class' | 'trainer' | 'format' | 'location' | 'day' | 'time'>('class');
  const [sessionRankingMetric, setSessionRankingMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionRankingCount, setSessionRankingCount] = useState<10 | 20 | 30>(10);
  const [sessionViewMode, setSessionViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [sessionTableView, setSessionTableView] = useState<'default' | 'performance' | 'revenue' | 'attendance' | 'capacity' | 'cancellations'>('default');
  const [sessionDensity, setSessionDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [sessionMinCheckins, setSessionMinCheckins] = useState(0);
  const [sessionMinClasses, setSessionMinClasses] = useState(0);
  const [sessionIncludeTrainer, setSessionIncludeTrainer] = useState(false);
  const [sessionStatusFilter, setSessionStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sessionShowAdvanced, setSessionShowAdvanced] = useState(false);
  const [sessionExcludeHosted, setSessionExcludeHosted] = useState(false);
  const [sessionGrouping, setSessionGrouping] = useState<
    'none' | 'ClassDayTimeLocation' | 'ClassDayTimeLocationTrainer' | 'LocationClass' | 'ClassDay' | 'ClassTime' | 'ClassDayTrainer' | 'ClassTrainer' | 'DayTimeLocation' | 'DayTime' | 'TrainerLocation' | 'DayLocation' | 'TimeLocation' | 'ClassType' | 'TypeLocation' | 'TrainerDay' | 'ClassLocation' | 'TrainerTime' | 'AMSessions' | 'PMSessions' | 'MorningClasses' | 'EveningClasses' | 'Weekday' | 'Weekend' | 'Class' | 'Type' | 'Trainer' | 'Location' | 'Day' | 'Date' | 'Time' | 'SessionName'
  >('none');
  const [sessionTopMetric, setSessionTopMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionBottomMetric, setSessionBottomMetric] = useState<'classAvg' | 'fillRate' | 'visits' | 'sessions' | 'revenue' | 'cancellationRate' | 'revPerCheckin' | 'compositeScore'>('classAvg');
  const [sessionTopCount, setSessionTopCount] = useState<5 | 10 | 20>(10);
  const [sessionBottomCount, setSessionBottomCount] = useState<5 | 10 | 20>(10);
  const [sessionExpandedGroups, setSessionExpandedGroups] = useState<Set<string>>(new Set());
  const toggleSessionGroup = useCallback((key: string) => {
    setSessionExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }, []);

  /* ---------- Session Intelligence grouped rankings ---------- */
  const sessionIntelligence = useMemo(() => {
    type GroupRow = {
      name: string; sessions: number; visits: number; capacity: number; empty: number;
      revenue: number; memberships: number; packages: number; introOffers: number; singleClasses: number; lateCancels: number;
      children: Array<{ date: string; trainer: string; location: string; sessions: number; visits: number; capacity: number; fillRate: number; classAvg: number; empty: number; revenue: number; lateCancels: number; }>;
    };
    const grouped: Record<string, GroupRow> = {};
    filteredSessions.forEach((s) => {
      let key = '';
      if (sessionRankingDimension === 'class') key = normalizeClassName(s.sessionName || s.cleanedClass || s.classType);
      else if (sessionRankingDimension === 'trainer') key = s.trainerName || 'Unknown';
      else if (sessionRankingDimension === 'format') key = classifyFormat(s.cleanedClass || s.classType);
      else if (sessionRankingDimension === 'location') key = s.location || 'Unknown';
      else if (sessionRankingDimension === 'day') {
        const d = parseDate(s.date);
        key = d ? d.toLocaleDateString('en-IN', { weekday: 'long' }) : 'Unknown';
      } else if (sessionRankingDimension === 'time') key = s.time || 'Unknown';
      if (!key) key = 'Unknown';
      if (!grouped[key]) grouped[key] = { name: key, sessions: 0, visits: 0, capacity: 0, empty: 0, revenue: 0, memberships: 0, packages: 0, introOffers: 0, singleClasses: 0, lateCancels: 0, children: [] };
      const g = grouped[key];
      const visits = Number(s.checkedInCount) || 0;
      const cap = Number(s.capacity) || 0;
      const rev = Number(s.revenue) || Number(s.totalPaid) || 0;
      g.sessions += 1;
      g.visits += visits;
      g.capacity += cap;
      g.empty += visits === 0 ? 1 : 0;
      g.revenue += rev;
      g.memberships += Number(s.checkedInsWithMemberships) || 0;
      g.packages += Number(s.checkedInsWithPackages) || 0;
      g.introOffers += Number(s.checkedInsWithIntroOffers) || 0;
      g.singleClasses += Number(s.checkedInsWithSingleClasses) || 0;
      g.lateCancels += Number(s.lateCancelledCount) || 0;
      g.children.push({
        date: s.date,
        trainer: s.trainerName || '—',
        location: s.location || '—',
        sessions: 1,
        visits,
        capacity: cap,
        fillRate: cap > 0 ? (visits / cap) * 100 : 0,
        classAvg: visits,
        empty: visits === 0 ? 1 : 0,
        revenue: rev,
        lateCancels: Number(s.lateCancelledCount) || 0,
      });
    });
    const rows = Object.values(grouped).map((g) => ({
      ...g,
      classAvg: g.sessions > 0 ? g.visits / g.sessions : 0,
      fillRate: g.capacity > 0 ? (g.visits / g.capacity) * 100 : 0,
      children: [...g.children].sort((a, b) => b.date.localeCompare(a.date)),
    }));
    const enriched = rows.map((g) => {
      const cancellationRate = g.visits + g.lateCancels > 0 ? (g.lateCancels / (g.visits + g.lateCancels)) * 100 : 0;
      const revPerCheckin = g.visits > 0 ? g.revenue / g.visits : 0;
      const attendanceScore = Math.min(g.classAvg * 5, 100);
      const fillScore = Math.min(g.fillRate, 100);
      const sessionScore = Math.min(g.sessions * 2, 100);
      const compositeScore = attendanceScore * 0.4 + fillScore * 0.35 + sessionScore * 0.25;
      return { ...g, cancellationRate, revPerCheckin, compositeScore };
    }).filter((g) => g.visits >= sessionMinCheckins && g.sessions >= sessionMinClasses);
    const sorted = [...enriched].sort((a, b) => {
      if (sessionRankingMetric === 'classAvg') return b.classAvg - a.classAvg;
      if (sessionRankingMetric === 'fillRate') return b.fillRate - a.fillRate;
      if (sessionRankingMetric === 'visits') return b.visits - a.visits;
      if (sessionRankingMetric === 'revenue') return b.revenue - a.revenue;
      if (sessionRankingMetric === 'cancellationRate') return b.cancellationRate - a.cancellationRate;
      if (sessionRankingMetric === 'revPerCheckin') return b.revPerCheckin - a.revPerCheckin;
      if (sessionRankingMetric === 'compositeScore') return b.compositeScore - a.compositeScore;
      return b.sessions - a.sessions;
    });
    return { rows: sorted, top: sorted.slice(0, sessionRankingCount), bottom: [...sorted].reverse().slice(0, sessionRankingCount) };
  }, [filteredSessions, sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionMinCheckins, sessionMinClasses]);

  const funnelRankings = useMemo(() => {
    const leadLookup = new Map<string, any>();
    filteredLeads.forEach((lead) => {
      if (lead.memberId) leadLookup.set(`member:${lead.memberId}`, lead);
      if (lead.email) leadLookup.set(`email:${lead.email.toLowerCase()}`, lead);
    });

    const grouped = new Map<string, {
      name: string;
      leads: number;
      trials: number;
      converted: number;
      retained: number;
      visitsPostTrial: number;
      ltv: number;
      membershipsBought: number;
      uniqueMembers: Set<string>;
    }>();

    const getNameFromLead = (lead: any) => {
      if (funnelRankingDimension === 'source') return lead.source || 'Unknown';
      if (funnelRankingDimension === 'location') return lead.center || 'Unknown';
      if (funnelRankingDimension === 'stage') return lead.stage || 'Unknown';
      if (funnelRankingDimension === 'class') return lead.classType || 'Unknown';
      return 'Unknown';
    };

    filteredLeads.forEach((lead) => {
      const key = funnelRankingDimension === 'membership' ? 'Membership N/A' : getNameFromLead(lead);
      const current = grouped.get(key) || { name: key, leads: 0, trials: 0, converted: 0, retained: 0, visitsPostTrial: 0, ltv: 0, membershipsBought: 0, uniqueMembers: new Set<string>() };
      current.leads += 1;
      if ((lead.trialStatus || '').toLowerCase().match(/completed|trial|attended|booked/)) current.trials += 1;
      if (isLeadConverted(lead)) current.converted += 1;
      if (lead.memberId) current.uniqueMembers.add(lead.memberId);
      grouped.set(key, current);
    });

    filteredClients.forEach((client) => {
      const matchedLead = leadLookup.get(`member:${client.memberId}`) || leadLookup.get(`email:${client.email?.toLowerCase()}`);
      const key = funnelRankingDimension === 'membership'
        ? (client.membershipUsed || 'Unknown')
        : funnelRankingDimension === 'location'
          ? (client.firstVisitLocation || client.homeLocation || matchedLead?.center || 'Unknown')
          : funnelRankingDimension === 'class'
            ? (client.firstVisitEntityName || matchedLead?.classType || 'Unknown')
            : funnelRankingDimension === 'stage'
              ? (matchedLead?.stage || client.conversionStatus || 'Unknown')
              : (matchedLead?.source || 'Unknown');
      const current = grouped.get(key) || { name: key, leads: 0, trials: 0, converted: 0, retained: 0, visitsPostTrial: 0, ltv: 0, membershipsBought: 0, uniqueMembers: new Set<string>() };
      current.retained += client.retentionStatus === 'Retained' ? 1 : 0;
      current.visitsPostTrial += Number(client.visitsPostTrial) || 0;
      current.ltv += Number(client.ltv) || 0;
      current.membershipsBought += `${client.membershipsBoughtPostTrial || ''}`.trim() ? 1 : 0;
      if (client.memberId) current.uniqueMembers.add(client.memberId);
      grouped.set(key, current);
    });

    const rows = Array.from(grouped.values()).map((item) => ({
      ...item,
      uniqueMembers: item.uniqueMembers.size,
      conversionRate: item.leads ? (item.converted / item.leads) * 100 : 0,
      retentionRate: item.converted ? (item.retained / item.converted) * 100 : 0,
    })).sort((a, b) => {
      if (funnelChartMetric === 'converted') return b.converted - a.converted;
      if (funnelChartMetric === 'retained') return b.retained - a.retained;
      if (funnelChartMetric === 'ltv') return b.ltv - a.ltv;
      return b.leads - a.leads;
    });

    return {
      rows,
      top: rows.slice(0, funnelRankingCount),
      bottom: rows.slice(-funnelRankingCount).reverse(),
    };
  }, [filteredClients, filteredLeads, funnelChartMetric, funnelRankingDimension, funnelRankingCount]);

  const trainerRankingsExtended = useMemo(() => {
    const rows = trainerStats.all.map((trainer, index) => ({
      ...trainer,
      rank: index + 1,
      utilization: trainer.sessions > 0 ? (trainer.nonEmpty / trainer.sessions) * 100 : 0,
      conversionRate: filteredPayroll
        .filter((item) => item.teacherName === trainer.name)
        .reduce((sum, item) => sum + (Number(item.converted) || 0), 0) / Math.max(filteredPayroll.filter((item) => item.teacherName === trainer.name).reduce((sum, item) => sum + (Number(item.new) || 0), 0), 1) * 100,
      retentionRate: filteredPayroll
        .filter((item) => item.teacherName === trainer.name)
        .reduce((sum, item) => sum + (Number(item.retained) || 0), 0) / Math.max(filteredPayroll.filter((item) => item.teacherName === trainer.name).reduce((sum, item) => sum + (Number(item.new) || 0), 0), 1) * 100,
      lateCancels: filteredLateCancels.filter((item) => (`${item.teacherName || item.instructor || ''}`).toLowerCase() === trainer.name.toLowerCase()).length,
      revenueScore: trainer.paid + trainer.customers,
    })).sort((a, b) => b.revenueScore - a.revenueScore);

    return { rows, top: rows.slice(0, 5), bottom: rows.slice(-5).reverse() };
  }, [filteredLateCancels, filteredPayroll, trainerStats.all]);

  const salesCollapsedGroups = useMemo(() => {
    const groups = new Set<string>();
    sales.forEach((item) => {
      const category = item.cleanedCategory || 'Uncategorized';
      if (category) groups.add(category);
    });
    return groups;
  }, [sales]);

  const renderBulletSummary = (items: string[], columns: 1 | 2 = 1) => (
    <ul className={cn('space-y-1.5 text-sm text-slate-600', columns === 2 && 'grid gap-x-6 gap-y-2 md:grid-cols-2 md:space-y-0')}>
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );

  /** AI-powered section summary — shows spinner while loading, then bullets */
  const renderAISummary = (sectionKey: string, fallbackItems: string[], columns: 1 | 2 = 2) => {
    const s = getSummary(sectionKey);
    const loading = aiSectionLoading(sectionKey);
    const bullets = s ? s.bullets : fallbackItems;
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50/90 p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
            {loading ? 'Generating AI insights…' : s ? `AI insights · generated ${new Date(s.lastGenerated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Summary'}
          </span>
          {loading && <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-200 border-t-purple-500 shrink-0" />}
        </div>
        {renderBulletSummary(bullets, columns)}
      </div>
    );
  };

  const renderMatrixTable = (
    title: string,
    subtitle: string,
    months: string[],
    monthLabels: Record<string, string>,
    rows: SalesMetricsMatrixRow[],
    onCellClick: (row: SalesMetricsMatrixRow, month?: string) => void,
    rightAction?: React.ReactNode
  ) => (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-base font-bold">{title}</h4>
              <p className="text-xs text-white/75">{subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-white/20 font-semibold text-white">
              {rows.length} metrics
            </Badge>
            {rightAction}
          </div>
        </div>
      </div>
      <div className="relative h-px w-full overflow-hidden bg-gradient-to-r from-transparent via-blue-400 to-transparent">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400" />
      </div>
      {months.length ? (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 z-30">
              <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                <th className="sticky left-0 z-40 min-w-[280px] bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white border-r border-white/20">
                  Metric
                </th>
                {months.map((month) => (
                  <th key={month} className={`min-w-[90px] border-l border-white/20 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider ${month === activeMatrixMonthKey ? 'bg-blue-800 text-white' : 'text-white'}`}>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1">
                        {month === activeMatrixMonthKey ? <Star className="h-3 w-3" /> : null}
                        <span className="text-xs font-bold whitespace-nowrap">{monthLabels[month]?.split(' ')[0]}</span>
                      </div>
                      <span className={`text-xs ${month === activeMatrixMonthKey ? 'text-blue-100' : 'text-slate-300'}`}>{monthLabels[month]?.split(' ')[1]}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white">
              {rows.map((row) => (
                <tr key={row.label} className="h-[35px] bg-white">
                  <td className="sticky left-0 z-10 min-w-[280px] border-b border-gray-200 bg-white px-4 py-2 font-medium leading-none text-slate-900 border-r border-gray-200">
                    <button type="button" className="w-full text-left hover:text-blue-700" onClick={() => onCellClick(row)}>
                      {row.label}
                    </button>
                  </td>
                  {months.map((month) => (
                    <td
                      key={`${row.label}-${month}`}
                      className="h-[35px] border-b border-gray-200 bg-white px-3 py-2 text-center leading-none tabular-nums text-slate-700 cursor-pointer hover:bg-slate-50"
                      onClick={() => onCellClick(row, month)}
                    >
                      {formatSalesMetricCell(row.values[month] || 0, row.type)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-5">
          <EmptyNote label="No monthly data available" />
        </div>
      )}
    </div>
  );

  const renderRankingList = (
    title: string,
    items: Array<Record<string, any>>,
    metricKey: string,
    valueFormatter: (value: number) => string,
    caption: (item: Record<string, any>) => string,
    isBottom = false
  ) => (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl text-white ${isBottom ? 'bg-gradient-to-br from-slate-500 to-slate-700' : 'bg-gradient-to-br from-blue-700 to-slate-900'}`}>
          {isBottom ? <TrendingDown className="h-4 w-4" /> : <Trophy className="h-4 w-4" />}
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
          <p className="text-xs text-slate-500">Ranked by metric value</p>
        </div>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item, index) => (
          <div key={`${title}-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
            <span className={cn('flex items-center justify-center w-7 h-7 rounded-lg text-white font-bold text-xs shrink-0 select-none', isBottom ? 'bg-gradient-to-br from-red-700 to-red-900' : 'bg-gradient-to-br from-blue-700 to-blue-900')}>{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">{caption(item)}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-slate-950">{valueFormatter(Number(item[metricKey]) || 0)}</p>
            </div>
          </div>
        )) : <EmptyNote label="No ranking data available" />}
      </div>
    </div>
  );

  const activeStudio = STUDIOS.find((s) => s.id === studio) || STUDIOS[0];
  const { summary: aiSummary, loading: aiLoading, generate: generateAISummary, getSummary, isLoading: aiSectionLoading, refreshAll: refreshAllSummaries } = useStudioAISummary();
  const [insightOpen, setInsightOpen] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownConfig, setDrillDownConfig] = useState<{ title: string; type: any; data: any; relatedData: any[] } | null>(null);
  const [showMomTable, setShowMomTable] = useState(false);
  const activeMatrixMonthKey = useMemo(() => getPreviousMonthKey(), []);

  const revenueSparkline = useMemo(() => salesStats.trend.map((point) => point.revenue), [salesStats.trend]);
  const attendanceSparkline = useMemo(() => sessionStats.trend.map((point) => point.attendance), [sessionStats.trend]);
  const fillSparkline = useMemo(() => sessionStats.trend.map((point) => point.fill), [sessionStats.trend]);
  const lateCancelSparkline = useMemo(() => {
    const monthly: Record<string, number> = {};
    filteredLateCancels.forEach((item) => {
      const key = monthKeyFromDate(item.dateIST || item.sessionDateIST);
      if (key) monthly[key] = (monthly[key] || 0) + 1;
    });
    return Object.keys(monthly).sort().map((key) => monthly[key]);
  }, [filteredLateCancels]);

  const openMetricDrillDown = useCallback((title: string, type: any, data: any, relatedData: any[]) => {
    setDrillDownConfig({ title, type, data, relatedData });
    setDrillDownOpen(true);
  }, []);

  const openSalesMatrixDrillDown = useCallback((row: SalesMetricsMatrixRow, month?: string) => {
    const baseRows = month
      ? studioWideSales.filter((item) => monthKeyFromDate(item.paymentDate) === month)
      : studioWideSales;

    const normalizedLabel = row.label.toLowerCase();
    const filteredRows = baseRows.filter((item) => {
      const category = (item.cleanedCategory || '').toLowerCase();
      const membershipType = (item.membershipType || '').toLowerCase();
      const productText = `${item.paymentItem || ''} ${item.cleanedProduct || ''}`.toLowerCase();
      const soldBy = (item.soldBy || '').toLowerCase();
      const hasDiscount = (Number(item.discountAmount) || 0) > 0 || (Number(item.discountPercentage) || 0) > 0;

      if (normalizedLabel === 'package sales') return category.includes('package');
      if (normalizedLabel === 'retail sales') return category.includes('retail');
      if (normalizedLabel === 'membership sales') return membershipType.includes('member') || category.includes('member');
      if (normalizedLabel === 'drop-in sales') return productText.includes('drop') || productText.includes('single') || productText.includes('trial');
      if (normalizedLabel === 'online / system sales') return !soldBy || soldBy === '-' || soldBy.includes('online') || soldBy.includes('system');
      if (normalizedLabel === 'discounted transactions' || normalizedLabel === 'discount penetration' || normalizedLabel === 'discount value') return hasDiscount;
      if (normalizedLabel === 'promo-led sales') return !!item.isPromotional || hasDiscount;
      return true;
    });

    const contextMonthLabel = month ? salesMetricsMatrix.monthLabels[month] : 'All Months';
    openMetricDrillDown(
      `${row.label} • ${contextMonthLabel}`,
      salesMetricTypeMap[row.label] || 'metric',
      {
        name: row.label,
        rawData: filteredRows,
        filteredTransactionData: filteredRows,
        selectedMetric: row.label,
        metricValue: month ? row.values[month] || 0 : Object.values(row.values).reduce((sum, value) => sum + value, 0),
        drillDownContext: month ? 'studio-pulse-sales-matrix-month' : 'studio-pulse-sales-matrix-row',
        filterCriteria: month ? { month, metric: row.label } : { metric: row.label },
        contextDescription: month
          ? `${row.label} for ${activeStudio.name} in ${contextMonthLabel}: ${formatSalesMetricCell(row.values[month] || 0, row.type)}`
          : `${row.label} for ${activeStudio.name} across the full available sales history`,
      },
      filteredRows
    );
  }, [activeStudio.name, openMetricDrillDown, salesMetricsMatrix.monthLabels, studioWideSales]);

  const salesSellerSummary = useMemo(() => {
    const bySeller = studioWideSales.reduce<Record<string, number>>((acc, item) => {
      const seller = item.soldBy === '-' ? 'Online/System' : (item.soldBy || 'Online/System');
      acc[seller] = (acc[seller] || 0) + ((Number(item.paymentValue) || 0) - (Number(item.paymentVAT) || 0));
      return acc;
    }, {});
    const ranked = Object.entries(bySeller).sort((a, b) => b[1] - a[1]);
    const top = ranked[0];
    const second = ranked[1];
    const total = ranked.reduce((sum, [, value]) => sum + value, 0);
    return {
      topName: top?.[0] || 'N/A',
      topValue: top?.[1] || 0,
      gap: top && second ? top[1] - second[1] : top?.[1] || 0,
      share: total > 0 && top ? (top[1] / total) * 100 : 0,
    };
  }, [studioWideSales]);

  const matrixSummaryStats = useMemo(() => {
    const latestMonth = salesMetricsMatrix.months[0];
    const latestNet = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Net Sales')?.values[latestMonth] || 0 : 0;
    const latestAtv = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Average Transaction Value')?.values[latestMonth] || 0 : 0;
    const latestDiscount = latestMonth ? salesMetricsMatrix.metricRows.find((row) => row.label === 'Discount Penetration')?.values[latestMonth] || 0 : 0;
    return {
      latestMonth: latestMonth ? salesMetricsMatrix.monthLabels[latestMonth] : 'N/A',
      latestNet,
      latestAtv,
      latestDiscount,
    };
  }, [salesMetricsMatrix]);

  const locationSummary = useMemo(() => {
    const sections = [
      `Net sales closed at ${formatCurrency(salesStats.net)} across ${formatNumber(salesStats.txns)} transactions.`,
      `Unique members reached ${formatNumber(salesStats.members)} while attendance totaled ${formatNumber(sessionStats.attendance)} across ${formatNumber(sessionStats.totalSessions)} sessions.`,
      `Fill rate averaged ${formatPercentage(sessionStats.avgFill)} and late cancellations totaled ${formatNumber(lcStats.total)}.`,
    ];
    return {
      title: `${activeStudio.name} performance summary`,
      subtitle: `${activeStudio.area} · ${dateRange.start} to ${dateRange.end}`,
      badge: `${studio === 'all' ? 'All studios' : activeStudio.name}`,
      stats: [
        { label: 'Net Sales', value: formatCurrency(salesStats.net) },
        { label: 'Sessions', value: formatNumber(sessionStats.totalSessions) },
        { label: 'Members', value: formatNumber(salesStats.members) },
        { label: 'Late Cancels', value: formatNumber(lcStats.total) },
      ],
      sections: [
        { title: 'Sales readout', bullets: [sections[0], `Discounts applied: ${formatCurrency(salesStats.discount)}.`] },
        { title: 'Operations readout', bullets: [sections[1], sections[2]] },
      ],
    };
  }, [activeStudio, dateRange.end, dateRange.start, lcStats.total, salesStats.discount, salesStats.members, salesStats.net, salesStats.txns, sessionStats.attendance, sessionStats.avgFill, sessionStats.totalSessions, studio]);

  const sharedMetrics = useMemo(() => ({
    netSales: formatCurrency(salesStats.net),
    grossSales: formatCurrency(salesStats.gross),
    transactions: salesStats.txns,
    uniqueMembers: salesStats.members,
    totalSessions: sessionStats.totalSessions,
    attendance: sessionStats.attendance,
    avgFill: formatPercentage(sessionStats.avgFill),
    lateCancels: lcStats.total,
    lapsed: expirationStats.total,
    churned: expirationStats.churned,
    newClients: clientStats.newClients,
    converted: clientStats.converted,
    retained: clientStats.retained,
    conversionRate: formatPercentage(clientStats.conversionRate),
    retentionRate: formatPercentage(clientStats.retentionRate),
    momNetSales: salesStats.growth.net,
    yoyNetSales: salesStats.yoyGrowth.net,
  }), [salesStats, sessionStats, lcStats, expirationStats, clientStats]);

  const buildSummaryInput = useCallback((sectionKey: string, sectionContext?: string) => ({
    studioName: activeStudio.name,
    dateRange,
    metrics: sharedMetrics,
    sectionKey,
    sectionContext,
  }), [activeStudio.name, dateRange, sharedMetrics]);

  // Build rich section contexts — memoised so they update when data changes
  const sectionContexts = useMemo(() => {
    const topTrainers = [...trainerRankingsExtended.rows].sort((a, b) => b.paid - a.paid).slice(0, 3);
    const botTrainers = [...trainerRankingsExtended.rows].sort((a, b) => a.utilization - b.utilization).slice(0, 3);
    const topLapsed = lapsedByMembership.slice(0, 3);
    const topSessions = [...sessionIntelligence.rows].sort((a, b) => b.classAvg - a.classAvg).slice(0, 3);
    const botSessions = [...sessionIntelligence.rows].sort((a, b) => a.fillRate - b.fillRate).slice(0, 3);

    return {
      sales: [
        `Gross ${formatCurrency(salesStats.gross)} → Net ${formatCurrency(salesStats.net)} (${salesStats.gross > 0 ? ((salesStats.net / salesStats.gross) * 100).toFixed(1) : 0}% net margin after VAT)`,
        `ATV ${formatCurrency(salesStats.atv)} · Discount penetration ${formatPercentage(salesStats.discountPenetration)} · Total discount value ${formatCurrency(salesStats.discount)}`,
        `Transactions ${formatNumber(salesStats.txns)} · Unique buyers ${formatNumber(salesStats.members)} · Sales/member ${formatCurrency(salesStats.members > 0 ? salesStats.net / salesStats.members : 0)}`,
        salesStats.growth.net !== null ? `Net sales MoM: ${salesStats.growth.net > 0 ? '+' : ''}${salesStats.growth.net.toFixed(1)}%` : 'MoM comparison unavailable',
      ].join('\n'),

      funnel: [
        `${clientStats.newClients} new clients entered funnel · ${clientStats.converted} converted (${formatPercentage(clientStats.conversionRate)}) · ${clientStats.retained} retained (${formatPercentage(clientStats.retentionRate)})`,
        `Avg LTV post-trial: ${formatCurrency(clientStats.avgLtv)}`,
        `Conversion gap: ${formatNumber(clientStats.newClients - clientStats.converted)} new clients did NOT convert`,
        `Retention gap: ${formatNumber(clientStats.converted - clientStats.retained)} converted clients did NOT retain`,
        clientStats.conversionRate > 0 && clientStats.retentionRate > 0
          ? `Retention-to-conversion ratio: ${(clientStats.retentionRate / clientStats.conversionRate * 100).toFixed(0)}% of converters retained`
          : '',
      ].filter(Boolean).join('\n'),

      trainers: [
        `${trainerRankingsExtended.rows.length} trainers in period`,
        topTrainers.length ? `Top 3 by pay: ${topTrainers.map((t) => `${t.name} ${formatCurrency(t.paid)} (${formatNumber(t.sessions)} cls, ${formatPercentage(t.utilization)} fill)`).join(' | ')}` : '',
        botTrainers.length ? `Bottom 3 fill rate: ${botTrainers.map((t) => `${t.name} ${formatPercentage(t.utilization)} fill`).join(' | ')}` : '',
        `Studio avg fill ${formatPercentage(sessionStats.avgFill)} · Total late cancels ${formatNumber(lcStats.total)}`,
        `Total trainer pay: ${formatCurrency(trainerRankingsExtended.rows.reduce((s, r) => s + r.paid, 0))}`,
      ].filter(Boolean).join('\n'),

      lapsed: [
        `${expirationStats.total} lapsed · ${expirationStats.churned} churned · churn rate ${expirationStats.total ? ((expirationStats.churned / expirationStats.total) * 100).toFixed(1) : 0}%`,
        topLapsed.length ? `Top 3 lapsing memberships: ${topLapsed.map((m) => `${m.name} (${m.count})`).join(', ')}` : '',
        `Late cancellations: ${lcStats.total} total · ${lcStats.sameDay} same-day · ${formatCurrency(lcStats.penalty)} penalty revenue`,
        `Late cancel same-day rate: ${lcStats.total > 0 ? ((lcStats.sameDay / lcStats.total) * 100).toFixed(0) : 0}% of LCs are same-day`,
        expirationStats.momGrowth !== null ? `Lapsed MoM: ${expirationStats.momGrowth > 0 ? '+' : ''}${expirationStats.momGrowth.toFixed(1)}%` : '',
      ].filter(Boolean).join('\n'),

      attendance: [
        `${sessionStats.totalSessions} sessions · ${sessionStats.attendance} visits · ${formatPercentage(sessionStats.avgFill)} avg fill · ${formatPercentage(sessionStats.emptyShare)} empty-class rate`,
        `Avg class size (all): ${(sessionStats.totalSessions > 0 ? sessionStats.attendance / sessionStats.totalSessions : 0).toFixed(1)} · Avg class size (non-empty): ${sessionStats.classAvg.toFixed(1)}`,
        topSessions.length ? `Top 3 classes by avg size: ${topSessions.map((r) => `${r.name} (avg ${r.classAvg.toFixed(1)}, ${formatPercentage(r.fillRate)} fill)`).join(' | ')}` : '',
        botSessions.length ? `Bottom 3 by fill rate: ${botSessions.map((r) => `${r.name} (${formatPercentage(r.fillRate)} fill, ${r.sessions} cls)`).join(' | ')}` : '',
        `Late cancels ${lcStats.total} · Rev/visit ${formatCurrency(sessionStats.attendance > 0 ? salesStats.net / sessionStats.attendance : 0)}`,
      ].filter(Boolean).join('\n'),
    };
  }, [salesStats, clientStats, sessionStats, trainerRankingsExtended, expirationStats, lcStats, lapsedByMembership, sessionIntelligence.rows]);

  useEffect(() => {
    if (anyLoading) return;
    generateAISummary(buildSummaryInput('main'));
    generateAISummary(buildSummaryInput('sales', sectionContexts.sales));
    generateAISummary(buildSummaryInput('funnel', sectionContexts.funnel));
    generateAISummary(buildSummaryInput('trainers', sectionContexts.trainers));
    generateAISummary(buildSummaryInput('lapsed', sectionContexts.lapsed));
    generateAISummary(buildSummaryInput('attendance', sectionContexts.attendance));
  }, [anyLoading, studio, dateRange.start, dateRange.end]);

  const handleRefresh = useCallback(() => {
    refetchSales();
  }, [refetchSales]);

  const [summaryRefreshing, setSummaryRefreshing] = useState(false);
  const handleRefreshSummaries = useCallback(async () => {
    setSummaryRefreshing(true);
    await refreshAllSummaries([
      buildSummaryInput('main'),
      buildSummaryInput('sales', sectionContexts.sales),
      buildSummaryInput('funnel', sectionContexts.funnel),
      buildSummaryInput('trainers', sectionContexts.trainers),
      buildSummaryInput('lapsed', sectionContexts.lapsed),
      buildSummaryInput('attendance', sectionContexts.attendance),
    ]);
    setSummaryRefreshing(false);
  }, [buildSummaryInput, refreshAllSummaries, sectionContexts]);

  const handleResetFilters = useCallback(() => {
    setStudio('all');
    setDateRange(defaultDateRange);
  }, [defaultDateRange]);

  // ─── Admin auth + presenter mode ──────────────────────────────────────────
  const { isAdmin, error: adminError, unlock: unlockAdmin, lock: lockAdmin } = useAdminAuth();
  const { modeState: presenterMode, isPresenter, startSession, endSession, joinSession, broadcastSnapshot } = usePresenterMode(
    isAdmin ? (import.meta.env.VITE_PRESENTER_EMAIL ?? 'jimmeey@physique57india.com') : null
  );

  // Track scroll position for broadcast (presenter only)
  const [presenterScrollY, setPresenterScrollY] = useState(0);
  useEffect(() => {
    if (presenterMode.role !== 'presenter') return;
    const onScroll = () => setPresenterScrollY(Math.round(window.scrollY));
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [presenterMode.role]);

  // Collect current snapshot for broadcast
  const currentSnapshot: PulseSnapshot = {
    studio, dateRange,
    funnelRankingDimension, newMemberTableMetric, funnelChartMetric, funnelRankingCount,
    funnelChartView, showFunnelMomTable, showFunnelBreakdownTable, showNewMemberMomTable,
    showTrainerMomTable, showTrainerFormatSection, scorecardSortKey, scorecardSortDir,
    showClassMomTable, showLapsedMomTable, churnLocationMetric, lapseRankDimension,
    sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionViewMode,
    sessionTableView, sessionDensity, sessionMinCheckins, sessionMinClasses,
    sessionIncludeTrainer, sessionStatusFilter, sessionShowAdvanced, sessionExcludeHosted,
    sessionGrouping, sessionTopMetric, sessionBottomMetric, sessionTopCount, sessionBottomCount,
    showMomTable, insightOpen, drillDownOpen,
    scrollY: presenterScrollY,
  };

  // Broadcast whenever snapshot changes
  useEffect(() => {
    broadcastSnapshot(currentSnapshot);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [broadcastSnapshot,
    studio, dateRange.start, dateRange.end,
    funnelRankingDimension, newMemberTableMetric, funnelChartMetric, funnelRankingCount,
    funnelChartView, showFunnelMomTable, showFunnelBreakdownTable, showNewMemberMomTable,
    showTrainerMomTable, showTrainerFormatSection, scorecardSortKey, scorecardSortDir,
    showClassMomTable, showLapsedMomTable, churnLocationMetric, lapseRankDimension,
    sessionRankingDimension, sessionRankingMetric, sessionRankingCount, sessionViewMode,
    sessionTableView, sessionDensity, sessionMinCheckins, sessionMinClasses,
    sessionIncludeTrainer, sessionStatusFilter, sessionShowAdvanced, sessionExcludeHosted,
    sessionGrouping, sessionTopMetric, sessionBottomMetric, sessionTopCount, sessionBottomCount,
    showMomTable, insightOpen, drillDownOpen, presenterScrollY,
  ]);

  // Apply incoming snapshot (viewer)
  const applySnapshot = useCallback((snap: PulseSnapshot) => {
    setStudio(snap.studio);
    setDateRange(snap.dateRange);
    setFunnelRankingDimension(snap.funnelRankingDimension);
    setNewMemberTableMetric(snap.newMemberTableMetric);
    setFunnelChartMetric(snap.funnelChartMetric);
    setFunnelRankingCount(snap.funnelRankingCount);
    setFunnelChartView(snap.funnelChartView);
    setShowFunnelMomTable(snap.showFunnelMomTable);
    setShowFunnelBreakdownTable(snap.showFunnelBreakdownTable);
    setShowNewMemberMomTable(snap.showNewMemberMomTable);
    setShowTrainerMomTable(snap.showTrainerMomTable);
    setShowTrainerFormatSection(snap.showTrainerFormatSection);
    setScorecardSortKey(snap.scorecardSortKey);
    setScorecardSortDir(snap.scorecardSortDir);
    setShowClassMomTable(snap.showClassMomTable);
    setShowLapsedMomTable(snap.showLapsedMomTable);
    setChurnLocationMetric(snap.churnLocationMetric);
    setLapseRankDimension(snap.lapseRankDimension);
    setSessionRankingDimension(snap.sessionRankingDimension);
    setSessionRankingMetric(snap.sessionRankingMetric);
    setSessionRankingCount(snap.sessionRankingCount);
    setSessionViewMode(snap.sessionViewMode);
    setSessionTableView(snap.sessionTableView);
    setSessionDensity(snap.sessionDensity);
    setSessionMinCheckins(snap.sessionMinCheckins);
    setSessionMinClasses(snap.sessionMinClasses);
    setSessionIncludeTrainer(snap.sessionIncludeTrainer);
    setSessionStatusFilter(snap.sessionStatusFilter);
    setSessionShowAdvanced(snap.sessionShowAdvanced);
    setSessionExcludeHosted(snap.sessionExcludeHosted);
    setSessionGrouping(snap.sessionGrouping as any);
    setSessionTopMetric(snap.sessionTopMetric);
    setSessionBottomMetric(snap.sessionBottomMetric);
    setSessionTopCount(snap.sessionTopCount);
    setSessionBottomCount(snap.sessionBottomCount);
    setShowMomTable(snap.showMomTable);
    setInsightOpen(snap.insightOpen);
    setDrillDownOpen(snap.drillDownOpen);
    // scroll to presenter position smoothly
    window.scrollTo({ top: snap.scrollY, behavior: 'smooth' });
  }, []);

  const handleJoinSession = useCallback((code: string, name: string) => {
    joinSession(code, name, applySnapshot);
  }, [joinSession, applySnapshot]);

  // Lock viewer controls when following
  const viewerLocked = presenterMode.role === 'viewer' && presenterMode.isConnected;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 left-10 h-80 w-80 rounded-full bg-gradient-to-br from-blue-300/20 to-blue-900/10 blur-3xl" />
        <div className="absolute top-40 right-0 h-96 w-96 rounded-full bg-gradient-to-br from-fuchsia-300/15 to-purple-300/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-gradient-to-br from-emerald-300/15 to-teal-300/10 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1400px] px-4 py-8 md:px-8">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 text-center"
        >
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-1.5 text-xs font-semibold text-slate-600 backdrop-blur">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            Live · 360° Studio Pulse
          </div>
          <h1 className="bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 bg-clip-text text-3xl font-black tracking-tight text-transparent md:text-4xl">
            STUDIO PULSE
          </h1>
          <p className="mt-1 text-sm font-medium tracking-wide text-slate-500">
            PHYSIQUE 57 INDIA · A complete snapshot across every dashboard module
          </p>
        </motion.header>

        <div className="flex items-center gap-3">
          <PresenterToolbar
            modeState={presenterMode}
            isPresenter={isPresenter}
            onStart={startSession}
            onEnd={endSession}
            onJoin={handleJoinSession}
          />
          <div className="ml-auto flex items-center gap-2">
            {isAdmin ? (
              <button
                onClick={lockAdmin}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white/70 px-3 py-1.5 text-xs font-semibold text-amber-700 shadow-sm backdrop-blur transition hover:bg-amber-50"
                title="Lock admin mode"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                Admin
              </button>
            ) : (
              <AdminCodeGate onUnlock={unlockAdmin} error={adminError} />
            )}
          </div>
        </div>

        <div className={viewerLocked ? 'pointer-events-none select-none opacity-80' : ''}>
        <div className="mb-6 flex flex-wrap items-center justify-center gap-2 rounded-2xl border border-slate-200/70 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
          <div className="flex flex-1 flex-wrap justify-center gap-2">
          {STUDIOS.map((s) => {
            const active = s.id === studio;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStudio(s.id)}
                className={cn(
                  'group flex flex-1 basis-[120px] items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-center transition-all duration-300',
                  active ? cn('bg-gradient-to-br text-white shadow-md', s.accent) : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                <MapPin className={cn('h-4 w-4', active ? 'text-white' : 'text-slate-400')} />
                <span className="flex flex-col leading-tight">
                  <span className="text-sm font-bold">{s.name}</span>
                  <span className={cn('text-[10px]', active ? 'text-white/80' : 'text-slate-400')}>{s.area}</span>
                </span>
              </button>
            );
          })}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-1.5 border-slate-300">
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshSummaries}
              disabled={summaryRefreshing}
              className="gap-1.5 border-slate-300 text-purple-700 hover:border-purple-300 hover:bg-purple-50"
            >
              <Sparkles className={cn('h-3.5 w-3.5', summaryRefreshing && 'animate-spin')} />
              {summaryRefreshing ? 'Refreshing…' : 'Refresh Summaries'}
            </Button>
          </div>
        </div>

        <div className="mb-6">
          <StudioPulseFilterSection
            studio={studio}
            onStudioChange={setStudio}
            studios={STUDIOS}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            onReset={handleResetFilters}
          />
        </div>
        </div>{/* end viewer-lock wrapper */}

        <AnimatePresence mode="wait">
          <motion.div
            key={studio}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <StudioPulseMetricCard
                icon={<DollarSign className="h-5 w-5" />}
                title="Net Sales"
                metric={salesStats.net}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={salesStats.growth.net}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.net}
                sparklineData={revenueSparkline}
                tooltipContent="Net sales after VAT. Tracks retained revenue quality across the active period."
                subtext={`Gross ${formatCurrency(salesStats.gross)} · Discount ${formatCurrency(salesStats.discount)}`}
                iconContainerClassName="bg-gradient-to-br from-emerald-600 to-green-700 text-white"
                onClick={() => openMetricDrillDown('Net Sales', 'metric', { name: 'Net Sales', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
              />
              <StudioPulseMetricCard
                icon={<Banknote className="h-5 w-5" />}
                title="Units Sold"
                metric={salesStats.txns}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={salesStats.growth.txns}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.txns}
                sparklineData={revenueSparkline}
                tooltipContent="Completed sales transactions in the active window. Useful for purchase volume tracking."
                subtext={`ATV ${formatCurrency(salesStats.atv)} · ${formatPercentage(salesStats.discountPenetration)} discounted`}
                iconContainerClassName="bg-gradient-to-br from-blue-700 to-blue-900 text-white"
                onClick={() => openMetricDrillDown('Units Sold', 'product', { name: 'Units Sold', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
              />
              <StudioPulseMetricCard
                icon={<Users className="h-5 w-5" />}
                title="Unique Members"
                metric={salesStats.members}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={salesStats.growth.members}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.members}
                sparklineData={revenueSparkline}
                tooltipContent="Distinct purchasing members. Shows customer reach across the active sales mix."
                subtext="Unique buyers in the active period"
                iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white"
                onClick={() => openMetricDrillDown('Unique Members', 'member', { name: 'Unique Members', rawData: filteredSales, filteredTransactionData: filteredSales }, filteredSales)}
              />
              <StudioPulseMetricCard
                icon={<HeartPulse className="h-5 w-5" />}
                title="Lapsed Members"
                metric={expirationStats.total}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={expirationStats.momGrowth}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={expirationStats.yoyGrowth}
                sparklineData={revenueSparkline}
                tooltipContent="Members whose memberships expired in the selected period, sourced from the Expirations sheet."
                subtext={`${formatNumber(expirationStats.churned)} churned · memberships expired`}
                iconContainerClassName="bg-gradient-to-br from-slate-600 to-slate-800 text-white"
                onClick={() => openMetricDrillDown('Lapsed Members', 'client', { name: 'Lapsed Members', rawData: filteredExpirations as any, filteredTransactionData: filteredExpirations as any }, filteredExpirations as any)}
              />
              <StudioPulseMetricCard
                icon={<Activity className="h-5 w-5" />}
                title="Visits"
                metric={sessionStats.attendance}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.attendance}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.attendance}
                sparklineData={attendanceSparkline}
                tooltipContent="Total check-ins across sessions in the selected period."
                subtext={`${formatNumber(sessionStats.totalSessions)} sessions · Avg ${formatNumber(sessionStats.classAvg)} per non-empty class`}
                iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
                onClick={() => openMetricDrillDown('Visits', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
              />
              <StudioPulseMetricCard
                icon={<Gauge className="h-5 w-5" />}
                title="Sessions Conducted"
                metric={sessionStats.totalSessions}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.totalSessions}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.totalSessions}
                sparklineData={attendanceSparkline}
                tooltipContent="All conducted sessions during the selected period."
                subtext={`Fill rate ${formatPercentage(sessionStats.avgFill)} · Empty share ${formatPercentage(sessionStats.emptyShare)}`}
                iconContainerClassName="bg-gradient-to-br from-sky-600 to-cyan-700 text-white"
                onClick={() => openMetricDrillDown('Sessions Conducted', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
              />
              <StudioPulseMetricCard
                icon={<UserPlus className="h-5 w-5" />}
                title="Class Average"
                metric={sessionStats.classAvg}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={sessionStats.growth.attendance}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.attendance}
                sparklineData={attendanceSparkline}
                tooltipContent="Average check-ins per non-empty class. Indicates delivery density."
                subtext="Average check-ins per non-empty class"
                iconContainerClassName="bg-gradient-to-br from-teal-600 to-emerald-700 text-white"
                onClick={() => openMetricDrillDown('Class Average', 'trainer', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
              />
              <StudioPulseMetricCard
                icon={<Target className="h-5 w-5" />}
                title="Fill Rate"
                metric={sessionStats.avgFill}
                precision={0}
                metricUnit="%"
                formatter={(value) => `${Math.round(value)}%`}
                growthLabel="MoM"
                growthValue={sessionStats.growth.avgFill}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={sessionStats.yoyGrowth.avgFill}
                sparklineData={fillSparkline}
                tooltipContent="Capacity utilization across all sessions in the selected period."
                subtext={`${formatPercentage(sessionStats.emptyShare)} empty-session share`}
                iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-700 text-white"
                onClick={() => openMetricDrillDown('Fill Rate', 'location', { name: activeStudio.name, rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
              />
              <StudioPulseMetricCard
                icon={<Repeat className="h-5 w-5" />}
                title="Revenue / Session Visit"
                metric={sessionStats.attendance ? salesStats.net / sessionStats.attendance : 0}
                precision={0}
                formatter={formatCurrency}
                growthLabel="MoM"
                growthValue={salesStats.growth.net}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={salesStats.yoyGrowth.net}
                sparklineData={revenueSparkline}
                tooltipContent="Net sales divided by session visits. Indicates monetization efficiency per visit."
                subtext={`${formatNumber(sessionStats.attendance)} visits · ${formatNumber(sessionStats.totalSessions)} sessions`}
                iconContainerClassName="bg-gradient-to-br from-rose-600 to-pink-700 text-white"
                onClick={() => openMetricDrillDown('Revenue / Session Visit', 'metric', { name: 'Revenue / Session Visit', rawData: filteredSessions, filteredTransactionData: filteredSessions }, filteredSessions)}
              />
              <StudioPulseMetricCard
                icon={<CalendarClock className="h-5 w-5" />}
                title="Late Cancellations"
                metric={lcStats.total}
                precision={0}
                formatter={formatNumber}
                growthLabel="MoM"
                growthValue={lcStats.growth.total}
                secondaryGrowthLabel="YoY"
                secondaryGrowthValue={pctChange(lcStats.total, previousYearLateCancels.length)}
                sparklineData={lateCancelSparkline}
                tooltipContent="Late cancellations in the selected period. High values signal revenue leakage and scheduling friction."
                subtext={`${formatNumber(lcStats.sameDay)} same-day · Penalties ${formatCurrency(lcStats.penalty)}`}
                iconContainerClassName="bg-gradient-to-br from-amber-600 to-orange-700 text-white"
                onClick={() => openMetricDrillDown('Late Cancellations', 'location', { name: activeStudio.name, rawData: filteredLateCancels, filteredTransactionData: filteredLateCancels }, filteredLateCancels)}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
              <AnimatedSectionCard
                title="Selected Studio Summary"
                subtitle={`${activeStudio.name} · ${dateRange.start} to ${dateRange.end}`}
                icon={Sparkles}
                iconGradient="from-slate-700 to-slate-900"
                className="lg:col-span-3"
                action={
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => { setIsSummaryEditing((v) => !v); if (!isSummaryEditing && !editableSummaryText) { setEditableSummaryText((aiSummary?.bullets ?? locationSummary.sections.flatMap((s) => s.bullets)).map((b) => `• ${b}`).join('\n')); } }}>
                      {isSummaryEditing ? 'Done' : 'Edit'}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setInsightOpen(true)}>Expand</Button>
                  </div>
                }
              >
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 text-white">
                      <Sparkles className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {aiLoading ? 'Generating summary…' : `Performance Summary · ${activeStudio.name} · ${dateRange.start}–${dateRange.end}`}
                    </span>
                  </div>
                  <div className="p-5 space-y-5">
                    {aiLoading ? (
                      <div className="flex items-center gap-3 text-slate-400 py-4">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-purple-500" />
                        <span className="text-sm">Generating AI summary…</span>
                      </div>
                    ) : isSummaryEditing ? (
                      <textarea
                        className="w-full min-h-[220px] rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 resize-y font-medium"
                        value={editableSummaryText}
                        onChange={(e) => setEditableSummaryText(e.target.value)}
                        placeholder="Write your studio summary here. Use • to start bullet points."
                      />
                    ) : editableSummaryText ? (
                      <div className="space-y-4">
                        <div className="grid gap-2 sm:grid-cols-2">
                          {editableSummaryText.split('\n').filter(Boolean).map((line, i) => (
                            <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                              <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-500" />
                              <span className="text-[12px] leading-relaxed text-slate-700">{line.replace(/^[•\-]\s*/, '')}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (() => {
                      const bullets = aiSummary?.bullets ?? locationSummary.sections.flatMap((s) => s.bullets);
                      const narrative = aiSummary?.narrative;
                      return (
                        <div className="space-y-4">
                          {/* Narrative paragraph */}
                          {narrative ? (
                            <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50/60 to-slate-50 px-5 py-4">
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400">AI Studio Overview</span>
                              </div>
                              <p className="text-[13px] leading-relaxed text-slate-700 font-medium">{narrative}</p>
                            </div>
                          ) : (
                            <div className="rounded-2xl border border-slate-100 bg-slate-50/60 px-5 py-4">
                              <p className="text-[13px] leading-relaxed text-slate-600">
                                {`${activeStudio.name} recorded ${formatCurrency(salesStats.net)} net sales across ${formatNumber(salesStats.txns)} transactions with ${formatNumber(sessionStats.attendance)} visits across ${formatNumber(sessionStats.totalSessions)} sessions (${formatPercentage(sessionStats.avgFill)} avg fill). ${clientStats.newClients} new clients entered the funnel — ${formatPercentage(clientStats.conversionRate)} converted, ${formatPercentage(clientStats.retentionRate)} retained. ${expirationStats.total} memberships lapsed with ${expirationStats.churned} classified as churned.`}
                              </p>
                            </div>
                          )}
                          {/* Key bullets */}
                          <div>
                            <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">Key Insights</p>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {bullets.map((b, i) => (
                                <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-sm">
                                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-purple-400" />
                                  <span className="text-[12px] leading-relaxed text-slate-700">{b}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Quick stat strip */}
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 pt-1">
                            {[
                              { label: 'Net Sales', value: formatCurrency(salesStats.net) },
                              { label: 'Avg Fill', value: formatPercentage(sessionStats.avgFill) },
                              { label: 'Conv Rate', value: formatPercentage(clientStats.conversionRate) },
                              { label: 'Lapsed', value: formatNumber(expirationStats.total) },
                            ].map(({ label, value }) => (
                              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2.5 text-center">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                                <p className="mt-0.5 text-base font-extrabold tabular-nums text-slate-900">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </AnimatedSectionCard>
            </div>

            <AnimatedSectionCard title="Sales Metrics" subtitle="Month-on-month table and seller lists" icon={DollarSign} iconGradient="from-blue-700 to-blue-900">
              <div className="space-y-6">
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                          <DollarSign className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold">Monthly sales metrics matrix</h4>
                          <p className="text-xs text-white/75">Metrics appear in the first column followed by month columns for the active studio across the full available sales history.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-white/20 font-semibold text-white">
                          {salesMetricsMatrix.metricRows.length} metrics
                        </Badge>
                        <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5">
                          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">MoM</span>
                          <Switch checked={showMomTable} onCheckedChange={setShowMomTable} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="relative h-px w-full overflow-hidden bg-gradient-to-r from-transparent via-blue-400 to-transparent">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 animate-pulse duration-[3000ms]"></div>
                  </div>
                  {salesMetricsMatrix.months.length ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-30">
                          <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800">
                            <th className="sticky left-0 z-40 min-w-[280px] bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-white border-r border-white/20">Metric</th>
                            {salesMetricsMatrix.months.map((month) => (
                              <th key={month} className={`min-w-[90px] border-l border-white/20 px-3 py-3 text-center text-xs font-bold uppercase tracking-wider ${month === activeMatrixMonthKey ? 'bg-blue-800 text-white' : 'text-white'}`}>
                                <div className="flex flex-col items-center">
                                  <div className="flex items-center gap-1">
                                    {month === activeMatrixMonthKey ? <Star className="h-3 w-3" /> : null}
                                    <span className="text-xs font-bold whitespace-nowrap">{salesMetricsMatrix.monthLabels[month].split(' ')[0]}</span>
                                  </div>
                                  <span className={`text-xs ${month === activeMatrixMonthKey ? 'text-blue-100' : 'text-slate-300'}`}>{salesMetricsMatrix.monthLabels[month].split(' ')[1]}</span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {salesMetricsMatrix.metricRows.map((row) => (
                            <tr key={row.label} className="h-[35px] bg-white">
                              <td className="sticky left-0 z-10 min-w-[280px] border-b border-gray-200 bg-white px-4 py-2 font-medium leading-none text-slate-900 border-r border-gray-200">
                                <div className="flex items-center justify-between gap-2">
                                  <button
                                    type="button"
                                    className="flex-1 cursor-pointer text-left hover:text-blue-700"
                                    onClick={() => openSalesMatrixDrillDown(row)}
                                    title={`Open analytics for ${row.label}`}
                                  >
                                    {row.label}
                                  </button>
                                  <TooltipProvider delayDuration={120}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button type="button" className="inline-flex h-5 w-5 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-700" aria-label={`About ${row.label}`}>
                                          <CircleAlert className="h-3.5 w-3.5" />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent side="right" align="start" className="max-w-sm rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 shadow-[0_20px_40px_rgba(15,23,42,0.16)]">
                                        <div className="space-y-3">
                                          <div>
                                            <p className="text-sm font-semibold text-slate-950">{row.label}</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-600">{salesMetricDefinitions[row.label]?.definition || 'Metric definition unavailable.'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Formula</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-700">{salesMetricDefinitions[row.label]?.formula || 'N/A'}</p>
                                          </div>
                                          <div>
                                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">What It Tells You</p>
                                            <p className="mt-1 text-xs leading-5 text-slate-700">{salesMetricDefinitions[row.label]?.businessMeaning || 'N/A'}</p>
                                          </div>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </div>
                              </td>
                              {salesMetricsMatrix.months.map((month) => (
                                <td
                                  key={`${row.label}-${month}`}
                                  className="h-[35px] border-b border-gray-200 bg-white px-3 py-2 text-center leading-none tabular-nums text-slate-700 cursor-pointer hover:bg-slate-50"
                                  onClick={() => openSalesMatrixDrillDown(row, month)}
                                  title={`Open analytics for ${row.label} in ${salesMetricsMatrix.monthLabels[month]}`}
                                >
                                  {formatSalesMetricCell(row.values[month] || 0, row.type)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-5">
                      <EmptyNote label="No monthly sales metrics available for the selected studio and date range" />
                    </div>
                  )}
                </div>
                {renderAISummary('sales', [
                  `Latest net sales in ${matrixSummaryStats.latestMonth} closed at ${formatCurrency(matrixSummaryStats.latestNet)}.`,
                  `Average transaction value for the latest month sits at ${formatCurrency(matrixSummaryStats.latestAtv)}.`,
                  `Latest discount penetration is ${formatPercentage(matrixSummaryStats.latestDiscount)}, showing current discount dependence.`,
                  `The matrix remains independent of the date filter and reflects the full available sales history for ${activeStudio.name}.`,
                ])}
                {showMomTable ? (
                  <>
                    <MonthOnMonthTableNew data={sales as any} collapsedGroups={salesCollapsedGroups} contextInfo={{ dateRange: defaultDateRange, location: activeStudio.name }} />
                    {renderAISummary('sales', [
                      'Month columns are sorted newest first, with the active month highlighted for faster scanning.',
                      'Collapse groups to compare top-level categories before drilling into products.',
                      'Click any month cell to open context-aware analytics for that exact category or product slice.',
                    ])}
                  </>
                ) : null}
                <UnifiedTopBottomSellers data={filteredSales as any} onRowClick={(row) => openMetricDrillDown(row.title || row.name || 'Seller detail', row.type || 'seller', row, filteredSales)} />
                {renderAISummary('sales', [
                  `${salesSellerSummary.topName} is the current top seller across the displayed data.`,
                  `Top-seller share stands at ${formatPercentage(salesSellerSummary.share)}, indicating current concentration risk.`,
                  `The lead over the next seller is ${formatCurrency(salesSellerSummary.gap)}.`,
                ])}
              </div>
            </AnimatedSectionCard>

            <AnimatedSectionCard
              title="New Member Funnel & Conversions"
              subtitle="Lead, trial, conversion, retention, and source performance in one view"
              icon={UserPlus}
              iconGradient="from-blue-700 to-blue-900"
              action={
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                  <Switch checked={showNewMemberMomTable} onCheckedChange={setShowNewMemberMomTable} />
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StudioPulseMetricCard icon={<Users className="h-5 w-5" />} title="Leads Received" metric={leadStats.total} formatter={formatNumber} growthLabel="MoM" growthValue={leadStats.growth.total} secondaryGrowthLabel="YoY" secondaryGrowthValue={null} subtext="All leads captured in the active period" iconContainerClassName="bg-gradient-to-br from-blue-700 to-slate-900 text-white" />
                <StudioPulseMetricCard icon={<HeartPulse className="h-5 w-5" />} title="Trials / First Visits" metric={Math.max(leadStats.trials, clientStats.newClients)} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.newClients} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.newClients} subtext="Trials and first visits entering the funnel" iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-800 text-white" />
                <StudioPulseMetricCard icon={<Target className="h-5 w-5" />} title="Converted Members" metric={clientStats.converted} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.conversionRate} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.conversionRate} subtext={`${formatPercentage(clientStats.conversionRate)} conversion rate`} iconContainerClassName="bg-gradient-to-br from-emerald-600 to-teal-800 text-white" />
                <StudioPulseMetricCard icon={<Banknote className="h-5 w-5" />} title="Retained Members" metric={clientStats.retained} formatter={formatNumber} growthLabel="MoM" growthValue={clientStats.growth.retentionRate} secondaryGrowthLabel="YoY" secondaryGrowthValue={clientStats.yoyGrowth.retentionRate} subtext={`${formatPercentage(clientStats.retentionRate)} retained · Avg LTV ${formatCurrency(clientStats.avgLtv)}`} iconContainerClassName="bg-gradient-to-br from-amber-600 to-orange-800 text-white" />
              </div>

              {showNewMemberMomTable && (
                <div className="mt-6">
                  <div className="mb-3 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">First Column</span>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                      {([
                        { value: 'source', label: 'Lead Source' },
                        { value: 'membership', label: 'Membership' },
                        { value: 'class', label: 'Class / Format' },
                      ] as const).map(({ value, label }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setNewMemberTableMetric(value)}
                          className={cn(
                            'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                            newMemberTableMetric === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                          )}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                  <ClientConversionMonthOnMonthByTypeTable data={clients} />
                </div>
              )}

              {/* Funnel chart — full width */}
              <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-5">
                  <h4 className="text-sm font-semibold text-slate-900">Funnel chart</h4>
                </div>
                {funnelRankings.rows.length ? (
                  <div className="space-y-4">
                    {/* Single consolidated chart — toggled */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                        {([
                          { value: 'funnel', label: '🔻 Funnel' },
                          { value: 'bar', label: '📊 By Dimension' },
                        ] as const).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setFunnelChartView(value)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                              funnelChartView === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                            )}
                          >{label}</button>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowFunnelBreakdownTable((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 transition-colors"
                      >
                        {showFunnelBreakdownTable ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        Per-{funnelRankingDimension} Breakdown Table
                      </button>
                    </div>

                    {funnelChartView === 'funnel' ? (
                      <div className="space-y-4">
                        {/* Custom CSS funnel — proportional widths */}
                        {(() => {
                          const stages = [
                            { label: 'Leads', value: leadStats.total, color: 'from-slate-800 to-slate-900', pct: 100 },
                            { label: 'Trials', value: leadStats.trials, color: 'from-blue-800 to-blue-900', pct: leadStats.total ? Math.round((leadStats.trials / leadStats.total) * 100) : 0 },
                            { label: 'Converted', value: clientStats.converted, color: 'from-blue-600 to-blue-700', pct: leadStats.total ? Math.round((clientStats.converted / leadStats.total) * 100) : 0 },
                            { label: 'Retained', value: clientStats.retained, color: 'from-blue-400 to-blue-500', pct: leadStats.total ? Math.round((clientStats.retained / leadStats.total) * 100) : 0 },
                          ];
                          return (
                            <div className="flex flex-col gap-1.5 px-4">
                              {stages.map((s, i) => (
                                <div key={s.label} className="flex items-center gap-3">
                                  <div className="w-20 shrink-0 text-right">
                                    <span className="text-[11px] font-semibold text-slate-600">{s.label}</span>
                                  </div>
                                  <div className="flex-1 flex justify-center">
                                    <div
                                      className={`bg-gradient-to-r ${s.color} rounded-lg flex items-center justify-center h-10 transition-all duration-500`}
                                      style={{ width: `${Math.max(s.pct, 8)}%`, minWidth: 80 }}
                                    >
                                      <span className="text-white font-bold text-xs tabular-nums">{formatNumber(s.value)}</span>
                                    </div>
                                  </div>
                                  <div className="w-12 shrink-0">
                                    <span className="text-[11px] font-semibold text-slate-400 tabular-nums">{s.pct}%</span>
                                  </div>
                                  {i < stages.length - 1 && (
                                    <div className="absolute left-0 w-full" />
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                        {/* Per-source funnel breakdown */}
                        {leadStats.topSources.length > 0 && (
                          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">By Lead Source</p>
                            <div className="space-y-2">
                              {leadStats.topSources.map((src) => {
                                const barW = leadStats.total ? Math.max((src.count / leadStats.total) * 100, 4) : 4;
                                return (
                                  <div key={src.name} className="flex items-center gap-3">
                                    <div className="w-28 shrink-0 truncate text-[11px] font-semibold text-slate-700">{src.name}</div>
                                    <div className="flex-1 flex items-center gap-1.5">
                                      <div className="flex-1 h-5 bg-slate-200 rounded overflow-hidden relative">
                                        <div
                                          className="h-full bg-gradient-to-r from-blue-700 to-blue-500 rounded transition-all duration-500"
                                          style={{ width: `${barW}%` }}
                                        />
                                      </div>
                                    </div>
                                    <div className="w-16 shrink-0 text-right">
                                      <span className="text-[11px] tabular-nums font-semibold text-slate-800">{formatNumber(src.count)}</span>
                                      <span className="text-[10px] text-slate-400 ml-1">leads</span>
                                    </div>
                                    <div className="w-20 shrink-0 text-right">
                                      <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${src.rate >= 50 ? 'bg-emerald-100 text-emerald-700' : src.rate >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                        {src.rate.toFixed(0)}% conv
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div>
                        <p className="mb-2 text-center text-xs font-medium text-slate-500">
                          By {funnelRankingDimension} · {funnelChartMetric}
                        </p>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={funnelRankings.top.slice(0, 10)} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                            <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => funnelChartMetric === 'ltv' ? formatCurrency(v) : formatNumber(v)} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
                            <RechartsTooltip contentStyle={chartTooltipStyle} formatter={(v: number) => [funnelChartMetric === 'ltv' ? formatCurrency(v) : formatNumber(v), funnelChartMetric]} />
                            <Bar dataKey={funnelChartMetric === 'leads' ? 'leads' : funnelChartMetric} fill="#0f172a" radius={[0, 6, 6, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Per-dimension breakdown table — drill-down */}
                    {showFunnelBreakdownTable && (
                      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="bg-slate-900 px-5 py-3 text-white">
                          <h4 className="text-sm font-bold">Per-{funnelRankingDimension} funnel breakdown</h4>
                          <p className="text-[11px] text-white/60">Each {funnelRankingDimension}'s leads → trials → converted → retained pipeline</p>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full border-collapse text-sm">
                            <thead className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-500">
                              <tr>
                                <th className="border-b border-slate-200 px-4 py-3 text-left">{funnelRankingDimension === 'source' ? 'Source' : funnelRankingDimension.charAt(0).toUpperCase() + funnelRankingDimension.slice(1)}</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Leads</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Trials</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Conv.</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Ret.</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Conv %</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-center">Ret %</th>
                                <th className="border-b border-slate-200 px-3 py-3 text-right">LTV</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-slate-100">
                              {funnelRankings.rows.slice(0, 20).map((row) => (
                                <tr key={row.name} className="hover:bg-slate-50">
                                  <td className="px-4 py-2.5 font-semibold text-slate-900 text-xs">{row.name}</td>
                                  <td className="px-3 py-2.5 text-center tabular-nums text-slate-700 text-xs">{formatNumber(row.leads)}</td>
                                  <td className="px-3 py-2.5 text-center tabular-nums text-slate-700 text-xs">{formatNumber(row.trials)}</td>
                                  <td className="px-3 py-2.5 text-center tabular-nums text-emerald-700 font-semibold text-xs">{formatNumber(row.converted)}</td>
                                  <td className="px-3 py-2.5 text-center tabular-nums text-blue-700 font-semibold text-xs">{formatNumber(row.retained)}</td>
                                  <td className="px-3 py-2.5 text-center text-xs">
                                    <span className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${row.conversionRate >= 50 ? 'bg-emerald-100 text-emerald-700' : row.conversionRate >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                      {formatPercentage(row.conversionRate)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-center text-xs">
                                    <span className={`inline-block rounded-full px-2 py-0.5 font-bold text-[10px] ${row.retentionRate >= 50 ? 'bg-emerald-100 text-emerald-700' : row.retentionRate >= 25 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                                      {formatPercentage(row.retentionRate)}
                                    </span>
                                  </td>
                                  <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 font-semibold text-xs">{formatCurrency(row.ltv)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ) : <EmptyNote label="No funnel ranking data available" />}
              </div>

              {/* Group by + Metric selectors — control the ranking lists below */}
              <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                <div className="flex w-full max-w-2xl items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <span className="shrink-0 pl-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Group by</span>
                  {([
                    { value: 'source', label: 'Source', icon: <Tag className="h-3 w-3" /> },
                    { value: 'location', label: 'Location', icon: <MapPin className="h-3 w-3" /> },
                    { value: 'stage', label: 'Stage', icon: <TrendingUp className="h-3 w-3" /> },
                    { value: 'membership', label: 'Membership', icon: <Star className="h-3 w-3" /> },
                    { value: 'class', label: 'Class', icon: <Activity className="h-3 w-3" /> },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFunnelRankingDimension(opt.value)}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all',
                        funnelRankingDimension === opt.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 p-1">
                  <span className="shrink-0 pl-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Metric</span>
                  {([
                    { value: 'leads', label: 'Leads', icon: <UserPlus className="h-3 w-3" /> },
                    { value: 'converted', label: 'Converted', icon: <Target className="h-3 w-3" /> },
                    { value: 'retained', label: 'Retained', icon: <Repeat className="h-3 w-3" /> },
                    { value: 'ltv', label: 'LTV', icon: <DollarSign className="h-3 w-3" /> },
                  ] as const).map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFunnelChartMetric(opt.value)}
                      className={cn(
                        'inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11px] font-semibold transition-all',
                        funnelChartMetric === opt.value ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {renderRankingList('Top funnel segments', funnelRankings.top, funnelChartMetric === 'leads' ? 'leads' : funnelChartMetric, funnelChartMetric === 'ltv' ? formatCurrency : formatNumber, (item) => `${formatNumber(item.uniqueMembers)} members · ${formatPercentage(item.conversionRate)} conv · ${formatPercentage(item.retentionRate)} ret`, false)}
                {renderRankingList('Bottom funnel segments', funnelRankings.bottom, funnelChartMetric === 'leads' ? 'leads' : funnelChartMetric, funnelChartMetric === 'ltv' ? formatCurrency : formatNumber, (item) => `${formatNumber(item.trials)} trials · ${formatNumber(item.membershipsBought)} memberships · ${formatNumber(item.visitsPostTrial)} visits`, true)}
              </div>

              {/* Count selector below ranking lists */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-500">Show top/bottom</span>
                {([5, 10, 15, 20] as const).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setFunnelRankingCount(n)}
                    className={cn('rounded-full border px-3 py-1 text-xs font-semibold transition-colors', funnelRankingCount === n ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-600 hover:border-slate-300')}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Summary — full width at bottom */}
              <div className="mt-6">
                {renderAISummary('funnel', [
                  `Current conversion rate is ${formatPercentage(clientStats.conversionRate)} and retention rate is ${formatPercentage(clientStats.retentionRate)}.`,
                  `Average post-trial value is ${formatCurrency(clientStats.avgLtv)} with ${formatNumber(filteredClients.reduce((sum, item) => sum + (Number(item.visitsPostTrial) || 0), 0))} total post-trial visits.`,
                  `${clientStats.newClients} new clients entered the funnel — ${clientStats.converted} converted.`,
                ])}
              </div>
            </AnimatedSectionCard>

            <AnimatedSectionCard
              title="Teacher Scorecard"
              subtitle="Trainer attendance, fill, conversion, retention, and pay on one consistent shell"
              icon={UserCheck}
              iconGradient="from-blue-700 to-blue-900"
              action={
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                  <Switch checked={showTrainerMomTable} onCheckedChange={setShowTrainerMomTable} />
                </div>
              }
            >
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 bg-slate-100/80 px-5 py-4 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-slate-900">Trainer scorecard</h4>
                    <p className="text-xs text-slate-500">Click column header to sort · Attendance, fill, conversion, retention, and revenue score</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Sort by</span>
                    <select
                      value={scorecardSortKey}
                      onChange={(e) => setScorecardSortKey(e.target.value as typeof scorecardSortKey)}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400"
                    >
                      <option value="sessions">Classes</option>
                      <option value="customers">Avg Incl</option>
                      <option value="classAvg">Avg Excl</option>
                      <option value="paid">Pay</option>
                      <option value="utilization">Fill %</option>
                      <option value="conversionRate">Conv %</option>
                      <option value="lateCancels">Late Cancels</option>
                      <option value="revenueScore">Score</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setScorecardSortDir((d) => d === 'desc' ? 'asc' : 'desc')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-slate-400"
                    >{scorecardSortDir === 'desc' ? '↓ Desc' : '↑ Asc'}</button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {[
                          { label: 'Instructor', key: null },
                          { label: 'Cls', key: 'sessions' },
                          { label: 'Empty', key: null },
                          { label: 'Active', key: null },
                          { label: 'Pay', key: 'paid' },
                          { label: 'Avg Incl', key: 'customers' },
                          { label: 'Avg Excl', key: 'classAvg' },
                          { label: 'Fill', key: 'utilization' },
                          { label: 'New', key: null },
                          { label: 'Conv', key: null },
                          { label: 'Ret', key: null },
                          { label: 'Conv %', key: 'conversionRate' },
                          { label: 'Late', key: 'lateCancels' },
                          { label: 'Rev', key: null },
                          { label: 'Score', key: 'revenueScore' },
                        ].map(({ label, key }) => (
                          <th
                            key={label}
                            className={cn(
                              'border-b border-slate-200 px-3 py-3 text-center first:text-left',
                              key ? 'cursor-pointer hover:bg-slate-100 select-none' : ''
                            )}
                            onClick={() => {
                              if (!key) return;
                              const k = key as typeof scorecardSortKey;
                              if (scorecardSortKey === k) setScorecardSortDir((d) => d === 'desc' ? 'asc' : 'desc');
                              else { setScorecardSortKey(k); setScorecardSortDir('desc'); }
                            }}
                          >
                            <span className="flex items-center justify-center gap-0.5">
                              {label}
                              {key && scorecardSortKey === key && (
                                <span className="text-blue-600">{scorecardSortDir === 'desc' ? ' ↓' : ' ↑'}</span>
                              )}
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {trainerRankingsExtended.rows.length ? ([...trainerRankingsExtended.rows].sort((a, b) => {
                        const av = a[scorecardSortKey] as number;
                        const bv = b[scorecardSortKey] as number;
                        return scorecardSortDir === 'desc' ? bv - av : av - bv;
                      })).map((t) => (
                        <tr key={t.name} className="h-[44px] border-b border-slate-200">
                          <td className="px-3 py-2">
                            <TrainerNameCell name={t.name} />
                          </td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.sessions)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(Math.max(t.sessions - t.nonEmpty, 0))}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.nonEmpty)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatCurrency(t.paid)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.sessions ? t.customers / t.sessions : 0)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.classAvg)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatPercentage(t.utilization)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.new) || 0), 0))}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.converted) || 0), 0))}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(filteredPayroll.filter((item) => item.teacherName === t.name).reduce((sum, item) => sum + (Number(item.retained) || 0), 0))}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatPercentage(t.conversionRate || 0)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatNumber(t.lateCancels)}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{formatCurrency(t.paid)}</td>
                          <td className="px-3 py-2 text-center font-semibold text-slate-900">{formatNumber(t.revenueScore)}</td>
                        </tr>
                      )) : <tr><td colSpan={15} className="p-5"><EmptyNote label="No trainer scorecard data available" /></td></tr>}
                    </tbody>
                    {trainerRankingsExtended.rows.length > 0 && (() => {
                      const rows = trainerRankingsExtended.rows;
                      const totSessions = rows.reduce((s, r) => s + r.sessions, 0);
                      const totEmpty = rows.reduce((s, r) => s + Math.max(r.sessions - r.nonEmpty, 0), 0);
                      const totActive = rows.reduce((s, r) => s + r.nonEmpty, 0);
                      const totPaid = rows.reduce((s, r) => s + r.paid, 0);
                      const totCustomers = rows.reduce((s, r) => s + r.customers, 0);
                      const totLateCancels = rows.reduce((s, r) => s + r.lateCancels, 0);
                      const avgFill = rows.length ? rows.reduce((s, r) => s + r.utilization, 0) / rows.length : 0;
                      const avgConv = rows.length ? rows.reduce((s, r) => s + (r.conversionRate || 0), 0) / rows.length : 0;
                      const totScore = rows.reduce((s, r) => s + r.revenueScore, 0);
                      return (
                        <tfoot>
                          <tr className="bg-slate-900 text-white text-xs font-bold h-[44px]">
                            <td className="px-3 py-2">Totals / Avg</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totSessions)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totEmpty)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totActive)}</td>
                            <td className="px-3 py-2 text-center">{formatCurrency(totPaid)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totSessions ? totCustomers / totSessions : 0)}</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">{formatPercentage(avgFill)}</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">—</td>
                            <td className="px-3 py-2 text-center">{formatPercentage(avgConv)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totLateCancels)}</td>
                            <td className="px-3 py-2 text-center">{formatCurrency(totPaid)}</td>
                            <td className="px-3 py-2 text-center">{formatNumber(totScore)}</td>
                          </tr>
                        </tfoot>
                      );
                    })()}
                  </table>
                </div>
              </div>

              {/* Format × Trainer comparison — collapsed by default */}
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowTrainerFormatSection((v) => !v)}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left hover:bg-slate-100 transition-colors"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Trainer performance by format</h4>
                    <p className="text-xs text-slate-500">Per-trainer breakdown by format — sessions, avg attendance, fill rate, revenue, late cancels</p>
                  </div>
                  {showTrainerFormatSection ? <ChevronUp className="h-4 w-4 text-slate-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />}
                </button>
                {showTrainerFormatSection && (
                  <div className="mt-3">
                    <FormatComparisonSection sessions={filteredSessions} trainerTabOnly />
                  </div>
                )}
              </div>

              {showTrainerMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Month on month trainer table',
                    'Monthly trainer, class, conversion, and retention metrics.',
                    trainerMatrix.months,
                    trainerMatrix.monthLabels,
                    trainerMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${trainerMatrix.monthLabels[month]}` : ''}`, 'trainer', { name: row.label, rawData: month ? filteredPayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month) : filteredPayroll, filteredTransactionData: month ? filteredPayroll.filter((item) => item.monthYear && normalizeMonthYearToISO(item.monthYear) === month) : filteredPayroll }, filteredPayroll as any)
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {/* Top trainers by pay */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-slate-900 text-white">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Top trainers</h4>
                      <p className="text-xs text-slate-500">Ranked by total pay</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {trainerRankingsExtended.rows.slice(0, 10).map((item, index) => (
                      <div key={`top-trainer-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs shrink-0 select-none">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <TrainerNameCell name={item.name} />
                          <p className="mt-0.5 text-xs text-slate-500">{formatNumber(item.customers)} customers · {formatPercentage(item.utilization)} fill · {formatPercentage(item.conversionRate || 0)} conv</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-950">{formatCurrency(item.paid)}</p>
                        </div>
                      </div>
                    ))}
                    {!trainerRankingsExtended.rows.length && <EmptyNote label="No ranking data available" />}
                  </div>
                </div>
                {/* Bottom trainers by pay */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-700 to-red-900 text-white">
                      <TrendingDown className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">Bottom trainers</h4>
                      <p className="text-xs text-slate-500">Ranked by total pay</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {[...trainerRankingsExtended.rows].sort((a, b) => a.paid - b.paid).slice(0, 10).map((item, index) => (
                      <div key={`bot-trainer-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xs shrink-0 select-none">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <TrainerNameCell name={item.name} />
                          <p className="mt-0.5 text-xs text-slate-500">{formatNumber(item.sessions)} sessions · {formatNumber(item.lateCancels)} late cancels · {formatPercentage(item.retentionRate || 0)} ret</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-950">{formatCurrency(item.paid)}</p>
                        </div>
                      </div>
                    ))}
                    {!trainerRankingsExtended.rows.length && <EmptyNote label="No ranking data available" />}
                  </div>
                </div>
              </div>

              {/* Summary — full width at bottom */}
              <div className="mt-6">
                {renderAISummary('trainers', [
                  `${trainerRankingsExtended.rows.length} trainers in scorecard, top earner is ${trainerRankingsExtended.rows[0]?.name || 'N/A'}.`,
                  `Avg fill rate across all sessions is ${formatPercentage(sessionStats.avgFill)}.`,
                  'Conv % and Ret % are calculated from new members attributed to each trainer.',
                ])}
              </div>
            </AnimatedSectionCard>

            {/* ── LAPSED MEMBERS SECTION ── */}
            <AnimatedSectionCard
              title="Lapsed Members"
              subtitle="Membership expirations, churn pressure, and lifetime metrics"
              icon={Flame}
              iconGradient="from-red-700 to-rose-900"
              action={
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                  <Switch checked={showLapsedMomTable} onCheckedChange={setShowLapsedMomTable} />
                </div>
              }
            >
              {/* Metric cards */}
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StudioPulseMetricCard icon={<Flame className="h-5 w-5" />} title="Lapsed Members" metric={expirationStats.total} formatter={formatNumber} growthLabel="MoM" growthValue={expirationStats.momGrowth} secondaryGrowthLabel="YoY" secondaryGrowthValue={expirationStats.yoyGrowth} subtext={`${formatNumber(expirationStats.churned)} churned · memberships expired`} iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-800 text-white" />
                <StudioPulseMetricCard icon={<CalendarClock className="h-5 w-5" />} title="Late Cancellations" metric={lcStats.total} formatter={formatNumber} growthLabel="MoM" growthValue={lcStats.growth.total} secondaryGrowthLabel="YoY" secondaryGrowthValue={pctChange(lcStats.total, previousYearLateCancels.length)} subtext={`${formatNumber(lcStats.sameDay)} same-day · ${formatCurrency(lcStats.penalty)} penalty`} iconContainerClassName="bg-gradient-to-br from-amber-600 to-orange-800 text-white" />
                <StudioPulseMetricCard icon={<HeartPulse className="h-5 w-5" />} title="Churn Rate" metric={expirationStats.total ? (expirationStats.churned / expirationStats.total) * 100 : 0} precision={1} metricUnit="%" formatter={(v) => `${v.toFixed(1)}%`} growthLabel="MoM" growthValue={expirationStats.momGrowth} secondaryGrowthLabel="YoY" secondaryGrowthValue={expirationStats.yoyGrowth} subtext={`${formatNumber(expirationStats.churned)} of ${formatNumber(expirationStats.total)} lapsed`} iconContainerClassName="bg-gradient-to-br from-rose-600 to-red-900 text-white" />
                <StudioPulseMetricCard icon={<DollarSign className="h-5 w-5" />} title="Avg LTV (Lapsed)" metric={clientStats.avgLtv} precision={0} formatter={formatCurrency} growthLabel="MoM" growthValue={null} secondaryGrowthLabel="YoY" secondaryGrowthValue={null} subtext="Average lifetime value of lapsed clients" iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white" />
              </div>

              {/* Studio Churn Tracker — monthly trend */}
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">                                
                <div className="p-5">
                  {lapsedMatrix.months.length > 1 ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <AreaChart
                        data={[...lapsedMatrix.months].reverse().map((m) => ({
                          month: lapsedMatrix.monthLabels[m],
                          Lapsed: lapsedMatrix.metricRows[0]?.values[m] || 0,
                          Churned: lapsedMatrix.metricRows[1]?.values[m] || 0,
                        }))}
                        margin={{ top: 8, right: 16, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} />
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                        <Area type="monotone" dataKey="Lapsed" stroke="#f97316" fill="#f97316" fillOpacity={0.12} strokeWidth={2} />
                        <Area type="monotone" dataKey="Churned" stroke="#dc2626" fill="#dc2626" fillOpacity={0.12} strokeWidth={2} />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : <EmptyNote label="Not enough monthly data for trend" />}
                </div>
              </div>

              {/* MoM matrix table */}
              {showLapsedMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Lapsed members month on month',
                    'Monthly lapsed counts, churn rates, and lifetime metrics across the full available history.',
                    lapsedMatrix.months,
                    lapsedMatrix.monthLabels,
                    lapsedMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${lapsedMatrix.monthLabels[month]}` : ''}`, 'client', { name: row.label, rawData: month ? filteredExpirations.filter((item) => monthKeyFromDate(item.endDate) === month) : filteredExpirations, filteredTransactionData: month ? filteredExpirations.filter((item) => monthKeyFromDate(item.endDate) === month) : filteredExpirations }, filteredExpirations as any)
                  )}
                </div>
              )}

              {/* Renewal potential by membership — ranked table */}
              <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                        <Repeat className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold">Renewal Potential by Membership</h4>
                        <p className="text-xs text-white/75">Lapsed memberships ranked by count — high count = renewal opportunity</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{lapsedByMembership.length} types</Badge>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                        {['#', 'Membership Type', 'Lapsed Count', 'Share %', 'Potential'].map((col) => (
                          <th key={col} className="border-b border-slate-200 px-4 py-3 text-left">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {lapsedByMembership.length ? lapsedByMembership.map((item, i) => (
                        <tr key={item.name} className="h-[38px] border-b border-slate-100 hover:bg-slate-50">
                          <td className="px-4 py-2 w-10"><span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xs">{i + 1}</span></td>
                          <td className="px-4 py-2 font-medium text-slate-900">{item.name}</td>
                          <td className="px-4 py-2 tabular-nums text-slate-700">{formatNumber(item.count)}</td>
                          <td className="px-4 py-2 tabular-nums text-slate-700">
                            {expirationStats.total ? formatPercentage((item.count / expirationStats.total) * 100) : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <div className="h-2 flex-1 max-w-[120px] rounded-full bg-slate-100">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                                  style={{ width: `${expirationStats.total ? Math.min((item.count / lapsedByMembership[0].count) * 100, 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-semibold text-slate-500">
                                {item.count >= 20 ? 'High' : item.count >= 10 ? 'Med' : 'Low'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      )) : <tr><td colSpan={5} className="p-5"><EmptyNote label="No membership lapse data available" /></td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Churned Memberships — grouped by membership type, MoM columns */}
              {(() => {
                const churnedRows = filteredExpirations.filter((e) => /churn/i.test(e.status));
                const allMonths = [...new Set(churnedRows.map((e) => monthKeyFromDate(e.endDate)).filter(Boolean))].sort();
                const recentMonths = allMonths.slice(-6);
                type ChurnGroup = { name: string; total: number; uniqueMembers: Set<string>; totalPaid: number; byMonth: Record<string, { count: number; members: Set<string>; paid: number }> };
                const groups: Record<string, ChurnGroup> = {};
                churnedRows.forEach((e) => {
                  const key = e.membershipName || 'Unknown';
                  const mk = monthKeyFromDate(e.endDate) || 'Unknown';
                  if (!groups[key]) groups[key] = { name: key, total: 0, uniqueMembers: new Set(), totalPaid: 0, byMonth: {} };
                  const g = groups[key];
                  g.total += 1;
                  if (e.memberId) g.uniqueMembers.add(e.memberId);
                  g.totalPaid += Number(e.paid) || 0;
                  if (!g.byMonth[mk]) g.byMonth[mk] = { count: 0, members: new Set(), paid: 0 };
                  g.byMonth[mk].count += 1;
                  if (e.memberId) g.byMonth[mk].members.add(e.memberId);
                  g.byMonth[mk].paid += Number(e.paid) || 0;
                });
                const sortedGroups = Object.values(groups).sort((a, b) => b.total - a.total);
                const grandTotal = churnedRows.length;
                const grandMembers = new Set(churnedRows.map((e) => e.memberId).filter(Boolean)).size;
                const grandPaid = churnedRows.reduce((s, e) => s + (Number(e.paid) || 0), 0);
                const monthLabels: Record<string, string> = {};
                recentMonths.forEach((mk) => {
                  const [y, m] = mk.split('-');
                  const d = new Date(parseInt(y), parseInt(m) - 1, 1);
                  monthLabels[mk] = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
                });
                return (
                  <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-base font-bold">Churned Memberships ({formatNumber(expirationStats.churned)})</h4>
                            <p className="text-xs text-white/75">Grouped by membership type · last 6 months · lapsed count, unique members, avg LTV, churn share</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="bg-white/20 font-semibold text-white">{sortedGroups.length} types</Badge>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full border-collapse text-sm">
                        <thead className="sticky top-0 z-20">
                          <tr className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 text-[10px] uppercase tracking-[0.14em] text-white">
                            <th className="px-4 py-3 text-left sticky left-0 z-30 bg-slate-900 min-w-[200px] border-r border-white/10">Membership</th>
                            <th className="px-3 py-3 text-right whitespace-nowrap border-l border-white/10">Total</th>
                            <th className="px-3 py-3 text-right whitespace-nowrap border-l border-white/10">Members</th>
                            <th className="px-3 py-3 text-right whitespace-nowrap border-l border-white/10">Avg LTV</th>
                            <th className="px-3 py-3 text-right whitespace-nowrap border-l border-white/10">Churn %</th>
                            {recentMonths.map((mk) => (
                              <th key={mk} className="px-3 py-3 text-right whitespace-nowrap border-l border-white/10">{monthLabels[mk]}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                          {sortedGroups.map((g, i) => {
                            const avgLtv = g.uniqueMembers.size > 0 ? g.totalPaid / g.uniqueMembers.size : 0;
                            const churnShare = grandTotal > 0 ? (g.total / grandTotal) * 100 : 0;
                            return (
                              <tr key={g.name} className="hover:bg-slate-50 transition-colors">
                                <td className="px-4 py-2.5 sticky left-0 bg-white border-r border-slate-100 hover:bg-slate-50">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-[10px] shrink-0">{i + 1}</span>
                                    <span className="font-semibold text-slate-900 text-xs max-w-[160px] truncate">{g.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-right tabular-nums font-bold text-slate-900 text-xs">{formatNumber(g.total)}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{formatNumber(g.uniqueMembers.size)}</td>
                                <td className="px-3 py-2.5 text-right tabular-nums text-slate-700 text-xs">{avgLtv > 0 ? formatCurrency(avgLtv) : '—'}</td>
                                <td className="px-3 py-2.5 text-right text-xs">
                                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 font-bold text-[10px] ${churnShare >= 20 ? 'bg-red-100 text-red-700' : churnShare >= 10 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>
                                    {churnShare.toFixed(1)}%
                                  </span>
                                </td>
                                {recentMonths.map((mk) => {
                                  const m = g.byMonth[mk];
                                  return (
                                    <td key={mk} className="px-3 py-2.5 text-right tabular-nums text-xs">
                                      {m ? (
                                        <div className="flex flex-col items-end">
                                          <span className="font-semibold text-slate-900">{formatNumber(m.count)}</span>
                                          <span className="text-[9px] text-slate-400">{formatNumber(m.members.size)}m</span>
                                        </div>
                                      ) : <span className="text-slate-300">—</span>}
                                    </td>
                                  );
                                })}
                              </tr>
                            );
                          })}
                          {sortedGroups.length === 0 && (
                            <tr><td colSpan={5 + recentMonths.length} className="p-5 text-center text-xs text-slate-400">No churned membership records in the selected period</td></tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-700">
                            <td className="px-4 py-2.5 sticky left-0 bg-slate-900 border-r border-white/10">Totals</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(grandTotal)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(grandMembers)}</td>
                            <td className="px-3 py-2.5 text-right tabular-nums">{grandMembers > 0 ? formatCurrency(grandPaid / grandMembers) : '—'}</td>
                            <td className="px-3 py-2.5 text-right">100%</td>
                            {recentMonths.map((mk) => {
                              const mTotal = churnedRows.filter((e) => monthKeyFromDate(e.endDate) === mk).length;
                              return <td key={mk} className="px-3 py-2.5 text-right tabular-nums">{mTotal > 0 ? formatNumber(mTotal) : '—'}</td>;
                            })}
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Consolidated ranking panels */}
              <div className="mt-6 grid gap-4 lg:grid-cols-2">
                {/* Top lapse rankings — by membership or location */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 to-blue-900 text-white">
                        <Trophy className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Top Lapse Rankings</h4>
                        <p className="text-xs text-slate-500">Highest lapse count by membership or location</p>
                      </div>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                      <button
                        type="button"
                        onClick={() => setLapseRankDimension('membership')}
                        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', lapseRankDimension === 'membership' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}
                      >Membership</button>
                      <button
                        type="button"
                        onClick={() => setLapseRankDimension('location')}
                        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', lapseRankDimension === 'location' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}
                      >Location</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(lapseRankDimension === 'membership' ? lapsedByMembership : expirationStats.topLocations).slice(0, 8).map((item, index) => (
                      <div key={`top-lapse-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs shrink-0 select-none">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {expirationStats.total ? `${Math.round((item.count / expirationStats.total) * 100)}% of total lapsed` : '—'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-950">{formatNumber(item.count)}</p>
                        </div>
                      </div>
                    ))}
                    {(lapseRankDimension === 'membership' ? lapsedByMembership : expirationStats.topLocations).length === 0 && (
                      <EmptyNote label="No lapse ranking data available" />
                    )}
                  </div>
                </div>

                {/* Membership + Location lapse panel — metric toggle */}
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-700 to-red-900 text-white">
                        <TrendingDown className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">Bottom Lapse Rankings</h4>
                        <p className="text-xs text-slate-500">By membership type or location</p>
                      </div>
                    </div>
                    <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                      <button
                        type="button"
                        onClick={() => setLapseRankDimension('membership')}
                        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', lapseRankDimension === 'membership' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}
                      >Membership</button>
                      <button
                        type="button"
                        onClick={() => setLapseRankDimension('location')}
                        className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold transition-all', lapseRankDimension === 'location' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600')}
                      >Location</button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(lapseRankDimension === 'membership' ? lapsedByMembership : expirationStats.topLocations).slice(0, 8).map((item, index) => (
                      <div key={`lr-${item.name}-${index}`} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                        <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xs shrink-0 select-none">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold text-slate-900">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {lapseRankDimension === 'membership'
                              ? `${expirationStats.total ? Math.round((item.count / expirationStats.total) * 100) : 0}% of total lapsed`
                              : `${expirationStats.total ? Math.round((item.count / expirationStats.total) * 100) : 0}% of total`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-950">{formatNumber(item.count)}</p>
                        </div>
                      </div>
                    ))}
                    {(lapseRankDimension === 'membership' ? lapsedByMembership : expirationStats.topLocations).length === 0 && (
                      <EmptyNote label="No lapse data available" />
                    )}
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6">
                {renderAISummary('lapsed', [
                  `${formatNumber(expirationStats.total)} memberships expired, ${formatNumber(expirationStats.churned)} churned (${expirationStats.total ? formatPercentage((expirationStats.churned / expirationStats.total) * 100) : '0%'} churn rate).`,
                  `Late cancellations total ${formatNumber(lcStats.total)} with ${formatCurrency(lcStats.penalty)} in penalty revenue.`,
                  `${formatNumber(lcStats.sameDay)} same-day cancellations represent the highest revenue leakage risk.`,
                ])}
              </div>
            </AnimatedSectionCard>

            {/* ── CLASS ATTENDANCE SECTION ── */}
            <AnimatedSectionCard
              title="Class Attendance"
              subtitle="Session delivery, fill rates, format mix, and class-level utilization"
              icon={Activity}
              iconGradient="from-cyan-700 to-blue-900"
              action={
                <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">MoM Table</span>
                  <Switch checked={showClassMomTable} onCheckedChange={setShowClassMomTable} />
                </div>
              }
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
                <StudioPulseMetricCard icon={<Activity className="h-5 w-5" />} title="Visits" metric={sessionStats.attendance} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.attendance} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.attendance} subtext={`${formatNumber(sessionStats.totalSessions)} sessions · ${formatPercentage(sessionStats.avgFill)} fill`} iconContainerClassName="bg-gradient-to-br from-cyan-600 to-blue-800 text-white" />
                <StudioPulseMetricCard icon={<Gauge className="h-5 w-5" />} title="Avg Class Size" metric={sessionStats.classAvg} precision={1} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.attendance} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.attendance} subtext={`${formatPercentage(sessionStats.emptyShare)} empty-session share`} iconContainerClassName="bg-gradient-to-br from-slate-700 to-slate-900 text-white" />
                <StudioPulseMetricCard icon={<Target className="h-5 w-5" />} title="Fill Rate" metric={sessionStats.avgFill} precision={1} metricUnit="%" formatter={(v) => `${v.toFixed(1)}%`} growthLabel="MoM" growthValue={sessionStats.growth.avgFill} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.avgFill} subtext="Capacity utilization across all sessions" iconContainerClassName="bg-gradient-to-br from-orange-600 to-red-700 text-white" />
                <StudioPulseMetricCard icon={<BarChart3 className="h-5 w-5" />} title="Sessions Conducted" metric={sessionStats.totalSessions} precision={0} formatter={formatNumber} growthLabel="MoM" growthValue={sessionStats.growth.totalSessions} secondaryGrowthLabel="YoY" secondaryGrowthValue={sessionStats.yoyGrowth.totalSessions} subtext={`${formatPercentage(sessionStats.emptyShare)} empty share`} iconContainerClassName="bg-gradient-to-br from-teal-600 to-emerald-700 text-white" />
              </div>

              {showClassMomTable && (
                <div className="mt-6">
                  {renderMatrixTable(
                    'Class performance month on month',
                    'Monthly class delivery and utilization metrics.',
                    classMatrix.months,
                    classMatrix.monthLabels,
                    classMatrix.metricRows,
                    (row, month) => openMetricDrillDown(`${row.label}${month ? ` • ${classMatrix.monthLabels[month]}` : ''}`, 'location', { name: row.label, rawData: month ? filteredSessions.filter((item) => monthKeyFromDate(item.date) === month) : filteredSessions, filteredTransactionData: month ? filteredSessions.filter((item) => monthKeyFromDate(item.date) === month) : filteredSessions }, filteredSessions as any)
                  )}
                </div>
              )}

              {/* ── SESSION INTELLIGENCE ── */}
              <div className="mt-6 space-y-4">

                {/* ── Unified controls panel (mirrors reference repo Rankings controls) ── */}
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm space-y-4">

                  {/* Row 1: Rank By + Status + Advanced toggle */}
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Rank By</span>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                        {([
                          { value: 'class', label: 'Classes' },
                          { value: 'trainer', label: 'Trainers' },
                          { value: 'format', label: 'Formats' },
                          { value: 'location', label: 'Locations' },
                          { value: 'time', label: 'Times' },
                          { value: 'day', label: 'Days' },
                        ] as const).map(({ value, label }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setSessionRankingDimension(value)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                              sessionRankingDimension === value ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                            )}
                          >{label}</button>
                        ))}
                      </div>
                    </div>

                    <div className="h-6 w-px bg-slate-200 hidden sm:block" />

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Status</span>
                      <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                        {(['all', 'active', 'inactive'] as const).map((val) => {
                          const lbl = { all: 'All', active: 'Active', inactive: 'Discontinued' }[val];
                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setSessionStatusFilter(val)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionStatusFilter === val ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >{lbl}</button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSessionShowAdvanced((v) => !v)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-400 ml-auto"
                    >
                      {sessionShowAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      {sessionShowAdvanced ? 'Hide Advanced' : 'Show Advanced'}
                      {(sessionMinCheckins > 0 || sessionMinClasses > 0 || sessionIncludeTrainer || sessionExcludeHosted || sessionGrouping !== 'none') && (
                        <span className="rounded-full bg-slate-900 px-1.5 py-0.5 text-[10px] text-white">
                          {[sessionMinCheckins > 0, sessionMinClasses > 0, sessionIncludeTrainer, sessionExcludeHosted, sessionGrouping !== 'none'].filter(Boolean).length}
                        </span>
                      )}
                    </button>
                  </div>

                  {sessionShowAdvanced && (
                    <>
                      {/* Row 2: Thresholds + toggles */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-100 pt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Min Check-ins</span>
                          <input
                            type="number" min="0"
                            value={sessionMinCheckins}
                            onChange={(e) => setSessionMinCheckins(parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Min Classes</span>
                          <input
                            type="number" min="0"
                            value={sessionMinClasses}
                            onChange={(e) => setSessionMinClasses(parseInt(e.target.value) || 0)}
                            className="w-16 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          />
                        </div>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={sessionIncludeTrainer}
                            onClick={() => setSessionIncludeTrainer(!sessionIncludeTrainer)}
                            className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', sessionIncludeTrainer ? 'bg-slate-800' : 'bg-slate-300')}
                          >
                            <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow', sessionIncludeTrainer ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                          </button>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Include Trainer in Group Key</span>
                        </label>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={sessionExcludeHosted}
                            onClick={() => setSessionExcludeHosted(!sessionExcludeHosted)}
                            className={cn('relative inline-flex h-5 w-9 items-center rounded-full transition-colors', sessionExcludeHosted ? 'bg-slate-800' : 'bg-slate-300')}
                          >
                            <span className={cn('inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow', sessionExcludeHosted ? 'translate-x-[18px]' : 'translate-x-0.5')} />
                          </button>
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Exclude Hosted Classes</span>
                        </label>
                        <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Group By</span>
                          <select
                            value={sessionGrouping}
                            onChange={(e) => setSessionGrouping(e.target.value as typeof sessionGrouping)}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                          >
                            <option value="none">No Grouping</option>
                            <option value="ClassDayTimeLocation">✨ Class + Day + Time + Location (Recommended)</option>
                            <option value="ClassDayTimeLocationTrainer">👤 Class + Day + Time + Location + Trainer</option>
                            <option value="LocationClass">📍 Location → Class</option>
                            <option value="ClassDay">📅 Class → Day</option>
                            <option value="ClassTime">⏰ Class → Time</option>
                            <option value="ClassDayTrainer">🏋️ Class + Day + Trainer</option>
                            <option value="ClassTrainer">👥 Class + Trainer</option>
                            <option value="DayTimeLocation">🗓️ Day + Time + Location</option>
                            <option value="DayTime">📆 Day + Time</option>
                            <option value="TrainerLocation">🎯 Trainer + Location</option>
                            <option value="DayLocation">📌 Day + Location</option>
                            <option value="TimeLocation">⏱️ Time + Location</option>
                            <option value="ClassType">🎨 Class + Type</option>
                            <option value="TypeLocation">🏷️ Type + Location</option>
                            <option value="TrainerDay">👤 Trainer + Day</option>
                            <option value="ClassLocation">🏢 Class + Location</option>
                            <option value="TrainerTime">⏰ Trainer + Time</option>
                            <option value="AMSessions">🌅 AM Sessions (Before 12pm)</option>
                            <option value="PMSessions">🌆 PM Sessions (12pm+)</option>
                            <option value="MorningClasses">🌄 Morning Classes (6am-11am)</option>
                            <option value="EveningClasses">🌃 Evening Classes (5pm-9pm)</option>
                            <option value="Weekday">📊 Weekday (Mon-Fri)</option>
                            <option value="Weekend">🎉 Weekend (Sat-Sun)</option>
                            <option value="Class">📚 Class Only</option>
                            <option value="Type">🎯 Class Type</option>
                            <option value="Trainer">👤 Trainer Only</option>
                            <option value="Location">📍 Location Only</option>
                            <option value="Day">📅 Day of Week Only</option>
                            <option value="Date">📆 Date Only</option>
                            <option value="Time">⏰ Time Only</option>
                            <option value="SessionName">🎫 Session Name</option>
                          </select>
                        </div>
                      </div>

                      {/* Row 3: Table controls */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-slate-100 pt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Table</span>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                          {(['grouped', 'flat'] as const).map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setSessionViewMode(m)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionViewMode === m ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >
                              {m === 'grouped' ? <List className="w-3 h-3" /> : <BarChart3 className="w-3 h-3" />}
                              {m.charAt(0).toUpperCase() + m.slice(1)}
                            </button>
                          ))}
                        </div>
                        <select
                          value={sessionTableView}
                          onChange={(e) => setSessionTableView(e.target.value as typeof sessionTableView)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                        >
                          <option value="default">✨ All Metrics (Default)</option>
                          <option value="performance">🎯 Performance Focus</option>
                          <option value="revenue">💰 Revenue Analysis</option>
                          <option value="attendance">👥 Attendance Overview</option>
                          <option value="capacity">📊 Capacity Planning</option>
                          <option value="cancellations">❌ Cancellation Analysis</option>
                        </select>
                        <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-0.5 gap-0.5">
                          {(['comfortable', 'compact'] as const).map((d) => (
                            <button
                              key={d}
                              type="button"
                              onClick={() => setSessionDensity(d)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150',
                                sessionDensity === d ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:text-slate-600'
                              )}
                            >{d === 'comfortable' ? 'Cozy' : 'Compact'}</button>
                          ))}
                        </div>
                        <select
                          value={sessionRankingCount}
                          onChange={(e) => setSessionRankingCount(parseInt(e.target.value) as 10 | 20 | 30)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 focus:border-slate-400 outline-none"
                        >
                          <option value={10}>Show 10</option>
                          <option value={20}>Show 20</option>
                          <option value={30}>Show 30</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>

                {/* ── Top / Bottom performer cards (reference Rankings layout) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {/* Top Performers */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="bg-green-700 px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Top Performers</h3>
                          <p className="text-[10px] text-white/80 uppercase tracking-wider">Best in class</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionTopMetric}
                          onChange={(e) => setSessionTopMetric(e.target.value as typeof sessionTopMetric)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-white/10 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-green-700">📊 Class Avg</option>
                          <option value="fillRate" className="bg-green-700">📈 Fill Rate</option>
                          <option value="visits" className="bg-green-700">👥 Total Visits</option>
                          <option value="revenue" className="bg-green-700">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-green-700">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-green-700">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-green-700">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-green-700">⭐ Composite</option>
                        </select>
                        <select
                          value={sessionTopCount}
                          onChange={(e) => setSessionTopCount(parseInt(e.target.value) as 5 | 10 | 20)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-white/10 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value={5} className="bg-green-700">Top 5</option>
                          <option value={10} className="bg-green-700">Top 10</option>
                          <option value={20} className="bg-green-700">Top 20</option>
                        </select>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto bg-white">
                      {([...sessionIntelligence.rows]
                        .sort((a, b) => {
                          const key = sessionTopMetric as keyof typeof a;
                          return (b[key] as number) - (a[key] as number);
                        })
                        .slice(0, sessionTopCount)
                      ).map((group, index) => {
                        const fillPct = Math.min(group.fillRate, 100);
                        const metricVal = group[sessionTopMetric as keyof typeof group] as number;
                        const fmtTopVal = sessionTopMetric === 'fillRate' || sessionTopMetric === 'cancellationRate' || sessionTopMetric === 'compositeScore'
                          ? formatPercentage(metricVal)
                          : sessionTopMetric === 'revenue' || sessionTopMetric === 'revPerCheckin'
                          ? formatCurrency(metricVal)
                          : sessionTopMetric === 'classAvg'
                          ? metricVal.toFixed(1)
                          : formatNumber(metricVal);
                        return (
                          <div key={`top-${group.name}-${index}`} className="flex items-stretch gap-0 hover:bg-slate-50/80 transition-colors">
                            <div className="w-10 shrink-0 flex items-center justify-center">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0 px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 truncate">{group.name}</p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {formatNumber(group.sessions)} classes · {formatNumber(group.visits)} check-ins
                                  </p>
                                  <p className="text-[11px] text-green-700 font-semibold truncate mt-0.5">
                                    {formatPercentage(group.fillRate)} fill · {formatCurrency(group.revenue)} rev
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-base font-bold text-slate-900">{fmtTopVal}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-600 rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">{fillPct.toFixed(0)}% fill</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sessionIntelligence.rows.length === 0 && (
                        <div className="p-6"><EmptyNote label="No session data for selected filters" /></div>
                      )}
                    </div>
                  </div>

                  {/* Needs Improvement */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div className="bg-red-700 px-4 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                          <TrendingDown className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">Needs Improvement</h3>
                          <p className="text-[10px] text-white/80 uppercase tracking-wider">Requiring attention</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionBottomMetric}
                          onChange={(e) => setSessionBottomMetric(e.target.value as typeof sessionBottomMetric)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-red-700 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-red-700">📊 Class Avg</option>
                          <option value="fillRate" className="bg-red-700">📈 Fill Rate</option>
                          <option value="visits" className="bg-red-700">👥 Total Visits</option>
                          <option value="revenue" className="bg-red-700">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-red-700">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-red-700">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-red-700">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-red-700">⭐ Composite</option>
                        </select>
                        <select
                          value={sessionBottomCount}
                          onChange={(e) => setSessionBottomCount(parseInt(e.target.value) as 5 | 10 | 20)}
                          className="px-2 py-1.5 rounded-lg border border-white/40 bg-red-700 text-[11px] font-medium text-white focus:outline-none"
                        >
                          <option value={5} className="bg-red-700">Bottom 5</option>
                          <option value={10} className="bg-red-700">Bottom 10</option>
                          <option value={20} className="bg-red-700">Bottom 20</option>
                        </select>
                      </div>
                    </div>
                    <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto bg-white">
                      {([...sessionIntelligence.rows]
                        .sort((a, b) => {
                          const key = sessionBottomMetric as keyof typeof a;
                          return (a[key] as number) - (b[key] as number);
                        })
                        .slice(0, sessionBottomCount)
                      ).map((group, index) => {
                        const fillPct = Math.min(group.fillRate, 100);
                        const metricVal = group[sessionBottomMetric as keyof typeof group] as number;
                        const fmtBotVal = sessionBottomMetric === 'fillRate' || sessionBottomMetric === 'cancellationRate' || sessionBottomMetric === 'compositeScore'
                          ? formatPercentage(metricVal)
                          : sessionBottomMetric === 'revenue' || sessionBottomMetric === 'revPerCheckin'
                          ? formatCurrency(metricVal)
                          : sessionBottomMetric === 'classAvg'
                          ? metricVal.toFixed(1)
                          : formatNumber(metricVal);
                        return (
                          <div key={`bot-${group.name}-${index}`} className="flex items-stretch gap-0 hover:bg-slate-50/80 transition-colors">
                            <div className="w-10 shrink-0 flex items-center justify-center">
                              <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-red-700 to-red-900 text-white font-bold text-xs">{index + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0 px-4 py-3">
                              <div className="flex items-start justify-between gap-3 mb-1.5">
                                <div className="min-w-0">
                                  <p className="font-semibold text-sm text-slate-900 truncate">{group.name}</p>
                                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                    {formatNumber(group.sessions)} classes · {formatNumber(group.visits)} check-ins
                                  </p>
                                  <p className="text-[11px] text-red-600 font-semibold truncate mt-0.5">
                                    {formatPercentage(group.fillRate)} fill · {formatCurrency(group.revenue)} rev
                                  </p>
                                </div>
                                <div className="shrink-0 text-right">
                                  <span className="text-base font-bold text-slate-900">{fmtBotVal}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1 bg-slate-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${fillPct}%` }} />
                                </div>
                                <span className="text-[9px] text-slate-400 font-medium shrink-0">{fillPct.toFixed(0)}% fill</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {sessionIntelligence.rows.length === 0 && (
                        <div className="p-6"><EmptyNote label="No session data for selected filters" /></div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ── Session Intelligence grouped table (reference DataTable structure) ── */}
                <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 px-6 py-4 text-white">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold">Session Intelligence</h4>
                          <p className="text-xs text-white/70">
                            {formatNumber(sessionIntelligence.rows.length)} groups · {formatNumber(filteredSessions.length)} sessions · sorted by {sessionRankingMetric}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={sessionRankingMetric}
                          onChange={(e) => setSessionRankingMetric(e.target.value as typeof sessionRankingMetric)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/30 bg-white/10 text-xs font-medium text-white focus:outline-none"
                        >
                          <option value="classAvg" className="bg-slate-900">📊 Class Avg</option>
                          <option value="fillRate" className="bg-slate-900">📈 Fill Rate</option>
                          <option value="visits" className="bg-slate-900">👥 Total Visits</option>
                          <option value="revenue" className="bg-slate-900">💰 Revenue</option>
                          <option value="revPerCheckin" className="bg-slate-900">💵 Rev / Check-in</option>
                          <option value="sessions" className="bg-slate-900">📚 Sessions</option>
                          <option value="cancellationRate" className="bg-slate-900">❌ Cancel Rate</option>
                          <option value="compositeScore" className="bg-slate-900">⭐ Composite</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse text-sm">
                      <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                        <tr>
                          <th className="border-b border-slate-200 px-3 py-3 text-left w-10">#</th>
                          <th className="border-b border-slate-200 px-4 py-3 text-left min-w-[220px]">{sessionRankingDimension.charAt(0).toUpperCase() + sessionRankingDimension.slice(1)}</th>
                          {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Sessions</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Visits</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Capacity</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Empty</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Class Avg</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-left min-w-[130px]">Fill Rate</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Late Cancels</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Cancel Rate</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Revenue</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Rev/Check-in</th>
                          </>}
                          {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Composite</th>
                          )}
                          {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Memberships</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Packages</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Intros</th>
                            <th className="border-b border-slate-200 px-3 py-3 text-right">Singles</th>
                          </>}
                        </tr>
                      </thead>
                      <tbody className="bg-white">
                        {sessionIntelligence.rows.length ? sessionIntelligence.rows.map((row, i) => {
                          const expanded = sessionExpandedGroups.has(row.name);
                          const rowHeight = sessionDensity === 'compact' ? 'h-[32px]' : 'h-[42px]';
                          const childHeight = sessionDensity === 'compact' ? 'h-[28px]' : 'h-[36px]';
                          return (
                            <React.Fragment key={`si-${row.name}-${i}`}>
                              <tr
                                className={cn(rowHeight, 'border-b border-slate-100 hover:bg-slate-50 cursor-pointer')}
                                onClick={() => toggleSessionGroup(row.name)}
                              >
                                <td className="px-3 py-2 w-10"><span className="flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-blue-700 to-blue-900 text-white font-bold text-xs">{i + 1}</span></td>
                                <td className="px-4 py-2 font-semibold text-slate-900 max-w-[260px]">
                                  <div className="flex items-center gap-1.5">
                                    <ChevronRight className={cn('h-3.5 w-3.5 text-slate-400 flex-shrink-0 transition-transform', expanded ? 'rotate-90' : '')} />
                                    <span className="truncate">{row.name}</span>
                                  </div>
                                </td>
                                {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-700 text-right text-xs">{formatNumber(row.sessions)}</td>
                                  <td className="px-3 py-2 tabular-nums font-semibold text-slate-900 text-right text-xs">{formatNumber(row.visits)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.capacity)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.empty)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums font-bold text-blue-700 text-right text-xs">{row.classAvg.toFixed(1)}</td>
                                  <td className="px-3 py-2 tabular-nums">
                                    <div className="flex items-center gap-2">
                                      <div className="h-1.5 w-14 rounded-full bg-slate-100">
                                        <div className="h-1.5 rounded-full bg-cyan-500" style={{ width: `${Math.min(row.fillRate, 100)}%` }} />
                                      </div>
                                      <span className="text-xs font-semibold text-slate-800">{formatPercentage(row.fillRate)}</span>
                                    </div>
                                  </td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.lateCancels)}</td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                  <td className="px-3 py-2 tabular-nums text-right text-xs">
                                    <span className={cn('font-medium', row.cancellationRate > 15 ? 'text-red-600' : 'text-slate-600')}>
                                      {formatPercentage(row.cancellationRate)}
                                    </span>
                                  </td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                  <td className="px-3 py-2 tabular-nums font-semibold text-green-700 text-right text-xs">{formatCurrency(row.revenue)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-600 text-right text-xs">{formatCurrency(row.revPerCheckin)}</td>
                                </>}
                                {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                                  <td className="px-3 py-2 tabular-nums text-right text-xs">
                                    <span className="font-semibold text-slate-700">{row.compositeScore.toFixed(1)}</span>
                                  </td>
                                )}
                                {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.memberships)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.packages)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.introOffers)}</td>
                                  <td className="px-3 py-2 tabular-nums text-slate-500 text-right text-xs">{formatNumber(row.singleClasses)}</td>
                                </>}
                              </tr>
                              {expanded && row.children.map((child, ci) => (
                                <tr key={`si-child-${row.name}-${ci}`} className={cn(childHeight, 'border-b border-slate-50 bg-slate-50/50 hover:bg-slate-100/60')}>
                                  <td className="px-3 py-1.5 text-slate-300 text-xs text-center">↳</td>
                                  <td className="px-4 py-1.5 text-slate-600 text-xs min-w-[220px]">
                                    <div className="flex flex-col">
                                      <span className="font-semibold text-slate-700 truncate">{child.date}</span>
                                      <span className="text-[10px] text-slate-400 truncate">{child.trainer} · {child.location}</span>
                                    </div>
                                  </td>
                                  {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">1</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-700 text-right text-xs">{child.visits}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.capacity}</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.empty}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-blue-700 text-right text-xs font-medium">{child.classAvg.toFixed(1)}</td>
                                    <td className="px-3 py-1.5 tabular-nums">
                                      <div className="flex items-center gap-1.5">
                                        <div className="h-1 w-10 rounded-full bg-slate-200">
                                          <div className="h-1 rounded-full bg-cyan-400" style={{ width: `${Math.min(child.fillRate, 100)}%` }} />
                                        </div>
                                        <span className="text-[10px] text-slate-500">{child.fillRate.toFixed(0)}%</span>
                                      </div>
                                    </td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                    <td className="px-3 py-1.5 tabular-nums text-slate-400 text-right text-xs">{child.lateCancels}</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'cancellations') && (
                                    <td className="px-3 py-1.5 tabular-nums text-right text-xs text-slate-500">—</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                    <td className="px-3 py-1.5 tabular-nums text-green-700 text-right text-xs">{formatCurrency(child.revenue)}</td>
                                    <td className="px-3 py-1.5 tabular-nums text-slate-500 text-right text-xs">{child.visits > 0 ? formatCurrency(child.revenue / child.visits) : '—'}</td>
                                  </>}
                                  {(sessionTableView === 'default' || sessionTableView === 'performance') && (
                                    <td className="px-3 py-1.5 text-right text-xs text-slate-400">—</td>
                                  )}
                                  {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                    <td className="px-3 py-1.5 text-right text-xs text-slate-400" colSpan={4}>—</td>
                                  </>}
                                </tr>
                              ))}
                            </React.Fragment>
                          );
                        }) : <tr><td colSpan={18} className="p-5"><EmptyNote label="No session data available for the selected filters" /></td></tr>}
                      </tbody>
                      {sessionIntelligence.rows.length > 0 && (() => {
                        const rows = sessionIntelligence.rows;
                        const totSessions = rows.reduce((s, r) => s + r.sessions, 0);
                        const totVisits = rows.reduce((s, r) => s + r.visits, 0);
                        const totCapacity = rows.reduce((s, r) => s + r.capacity, 0);
                        const totEmpty = rows.reduce((s, r) => s + r.empty, 0);
                        const avgClassAvg = totSessions ? totVisits / totSessions : 0;
                        const avgFill = totCapacity ? (totVisits / totCapacity) * 100 : 0;
                        const totLC = rows.reduce((s, r) => s + r.lateCancels, 0);
                        const totRevenue = rows.reduce((s, r) => s + r.revenue, 0);
                        const avgRevPerCheckin = totVisits ? totRevenue / totVisits : 0;
                        const totMemberships = rows.reduce((s, r) => s + r.memberships, 0);
                        const totPackages = rows.reduce((s, r) => s + r.packages, 0);
                        const totIntros = rows.reduce((s, r) => s + r.introOffers, 0);
                        const totSingles = rows.reduce((s, r) => s + r.singleClasses, 0);
                        return (
                          <tfoot>
                            <tr className="bg-slate-900 text-white text-xs font-bold h-[40px]">
                              <td className="px-3 py-2"></td>
                              <td className="px-4 py-2">Totals / Avg ({rows.length} groups)</td>
                              {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totSessions)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totVisits)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'capacity') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totCapacity)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totEmpty)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'performance' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{avgClassAvg.toFixed(1)}</td>
                                <td className="px-3 py-2 text-right">{formatPercentage(avgFill)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'cancellations') && <td className="px-3 py-2 text-right">{formatNumber(totLC)}</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'cancellations') && <td className="px-3 py-2 text-right">—</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'revenue') && <>
                                <td className="px-3 py-2 text-right">{formatCurrency(totRevenue)}</td>
                                <td className="px-3 py-2 text-right">{formatCurrency(avgRevPerCheckin)}</td>
                              </>}
                              {(sessionTableView === 'default' || sessionTableView === 'performance') && <td className="px-3 py-2 text-right">—</td>}
                              {(sessionTableView === 'default' || sessionTableView === 'attendance') && <>
                                <td className="px-3 py-2 text-right">{formatNumber(totMemberships)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totPackages)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totIntros)}</td>
                                <td className="px-3 py-2 text-right">{formatNumber(totSingles)}</td>
                              </>}
                            </tr>
                          </tfoot>
                        );
                      })()}
                    </table>
                  </div>
                </div>

                {/* Summary */}
                <div className="mt-2">
                  {renderAISummary('attendance', [
                    `${formatNumber(sessionStats.totalSessions)} sessions conducted with ${formatNumber(sessionStats.attendance)} total visits and ${formatPercentage(sessionStats.avgFill)} average fill rate.`,
                    `Average class size across non-empty sessions is ${sessionStats.classAvg.toFixed(1)}, with ${formatPercentage(sessionStats.emptyShare)} of sessions running empty.`,
                    `${lcStats.total} late cancellations recorded across sessions — review slot patterns.`,
                  ])}
                </div>
              </div>
            </AnimatedSectionCard>

            {/* ── FORMAT COMPARISON SECTION ── */}
            <AnimatedSectionCard
              title="Class Formats & Performance Analysis"
              subtitle="Format-level attendance trends, fill rates, revenue, and trainer comparison"
              icon={BarChart3}
              iconGradient="from-violet-700 to-purple-900"
            >
              <div className="space-y-6">
                {/* Comparison cards (overview) */}
                <FormatComparisonSection sessions={filteredSessions} />
                {/* Detailed per-class breakdown — same data as Class Formats > Detailed tab */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-violet-900 to-purple-900 px-5 py-3 text-white">
                    <h4 className="text-sm font-bold">Detailed format breakdown</h4>
                    <p className="text-[11px] text-white/60">Per-class metrics: sessions, attendance, fill, revenue, late cancels</p>
                  </div>
                  <div className="p-4">
                    <DetailedComparisonView data={filteredSessions as any} />
                  </div>
                </div>
              </div>
            </AnimatedSectionCard>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white/80 p-4 backdrop-blur-sm">
              <p className="text-xs text-slate-500">
                Snapshot for <span className="font-semibold text-slate-700">{activeStudio.name}</span> · {activeStudio.area}
                <span className="ml-2">· {dateRange.start} to {dateRange.end}</span>
                {anyLoading && <span className="ml-2 italic text-slate-400">refreshing…</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Sales', path: '/sales-analytics' },
                  { label: 'Attendance', path: '/class-attendance' },
                  { label: 'Retention', path: '/client-retention' },
                  { label: 'Trainers', path: '/trainer-performance' },
                  { label: 'Funnel', path: '/funnel-leads' },
                ].map((link) => (
                  <button
                    key={link.path}
                    onClick={() => navigate(link.path)}
                    className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
                  >
                    {link.label} <ArrowUpRight className="h-3 w-3" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <InsightDetailDialog
        open={insightOpen}
        onOpenChange={setInsightOpen}
        title={locationSummary.title}
        subtitle={locationSummary.subtitle}
        badge={locationSummary.badge}
        stats={locationSummary.stats}
        sections={locationSummary.sections}
        footerNote="This summary uses the currently selected studio scope and date filter."
      />

      {drillDownConfig ? (
        <UniversalDrillDownModal
          isOpen={drillDownOpen}
          onClose={() => setDrillDownOpen(false)}
          data={drillDownConfig.data}
          relatedData={drillDownConfig.relatedData}
          type={drillDownConfig.type}
          title={drillDownConfig.title}
        />
      ) : null}

      <Footer />
    </div>
  );
});

StudioPulse.displayName = 'StudioPulse';

export default StudioPulse;
