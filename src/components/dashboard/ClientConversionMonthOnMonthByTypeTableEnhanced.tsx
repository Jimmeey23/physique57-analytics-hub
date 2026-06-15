import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientConversionMonthOnMonthByTypeTableProps {
  data: NewClientData[];
  checkins?: any[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (row: any) => void;
}

type MetricKey = 'trials' | 'newMembers' | 'converted' | 'retained' | 'retentionPct' | 'conversionPct' | 'avgLtv' | 'totalLtv' | 'avgConvDays' | 'avgVisits';

interface MonthCell {
  trials: number;
  newMembers: number;
  converted: number;
  retained: number;
  retentionPct: number;
  conversionPct: number;
  avgLtv: number;
  totalLtv: number;
  avgConvDays: number;
  avgVisits: number;
}

const METRIC_OPTS: { value: MetricKey; label: string }[] = [
  { value: 'trials', label: 'Trials' },
  { value: 'newMembers', label: 'New Members' },
  { value: 'converted', label: 'Converted' },
  { value: 'retained', label: 'Retained' },
  { value: 'retentionPct', label: 'Retention %' },
  { value: 'conversionPct', label: 'Conversion %' },
  { value: 'avgLtv', label: 'Avg LTV' },
  { value: 'totalLtv', label: 'Total LTV' },
  { value: 'avgConvDays', label: 'Avg Conv Days' },
  { value: 'avgVisits', label: 'Avg Visits' },
];

const MONTHS_SHOWN = 30;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMonthKey(dateStr: string): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtMonthKey(mk: string): string {
  const [year, month] = mk.split('-');
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[parseInt(month, 10) - 1]} ${year.slice(2)}`;
}

function buildCell(clients: NewClientData[], metric: MetricKey): number {
  const trials = clients.length;
  const newMembers = clients.filter((c) => isInNewClientCohort(c)).length;
  const converted = clients.filter((c) => isConvertedInCohort(c)).length;
  const retained = clients.filter((c) => isRetainedInCohort(c)).length;
  const totalLtv = clients.reduce((s, c) => s + (c.ltv || 0), 0);
  const convIntervals = clients.map((c) => c.conversionSpan).filter((v) => v > 0);
  const visitsList = clients.map((c) => c.visitsPostTrial).filter((v) => v > 0);

  switch (metric) {
    case 'trials': return trials;
    case 'newMembers': return newMembers;
    case 'converted': return converted;
    case 'retained': return retained;
    case 'retentionPct': return newMembers > 0 ? (retained / newMembers) * 100 : 0;
    case 'conversionPct': return newMembers > 0 ? (converted / newMembers) * 100 : 0;
    case 'avgLtv': return trials > 0 ? totalLtv / trials : 0;
    case 'totalLtv': return totalLtv;
    case 'avgConvDays': return convIntervals.length > 0 ? convIntervals.reduce((s, v) => s + v, 0) / convIntervals.length : 0;
    case 'avgVisits': return visitsList.length > 0 ? visitsList.reduce((s, v) => s + v, 0) / visitsList.length : 0;
  }
}

function fmtCell(value: number, metric: MetricKey): string {
  if (metric === 'retentionPct' || metric === 'conversionPct') return `${value.toFixed(1)}%`;
  if (metric === 'avgLtv' || metric === 'totalLtv') return formatCurrency(value);
  if (metric === 'avgConvDays') return `${value.toFixed(0)}d`;
  if (metric === 'avgVisits') return value.toFixed(1);
  return formatNumber(Math.round(value));
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ClientConversionMonthOnMonthByTypeTable: React.FC<ClientConversionMonthOnMonthByTypeTableProps> = ({
  data,
  onRowClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const [metric, setMetric] = useState<MetricKey>('trials');
  const [viewMode, setViewMode] = useState<'values' | 'growth'>('values');
  const tableId = 'Month-on-Month by Client Type';

  // Collect all month keys across all data, sorted newest-last
  const allMonths = useMemo(() => {
    const keys = new Set<string>();
    data.forEach((c) => {
      const mk = getMonthKey(c.firstVisitDate);
      if (mk) keys.add(mk);
    });
    const sorted = [...keys].sort();
    return sorted.slice(-MONTHS_SHOWN);
  }, [data]);

  // Most recent month (for current-month highlight)
  const currentMonth = allMonths[allMonths.length - 1] ?? '';

  // Unique client types (rows)
  const clientTypes = useMemo(() => {
    const types = new Set(data.map((c) => c.isNew || 'Unknown'));
    return [...types].sort((a, b) => {
      const aNew = a.toLowerCase().includes('new');
      const bNew = b.toLowerCase().includes('new');
      if (aNew && !bNew) return -1;
      if (!aNew && bNew) return 1;
      return a.localeCompare(b);
    });
  }, [data]);

  // Build matrix: clientType → month → clients[]
  const matrix = useMemo(() => {
    const m: Record<string, Record<string, NewClientData[]>> = {};
    clientTypes.forEach((ct) => { m[ct] = {}; });
    data.forEach((c) => {
      const ct = c.isNew || 'Unknown';
      const mk = getMonthKey(c.firstVisitDate);
      if (!mk || !m[ct]) return;
      if (!m[ct][mk]) m[ct][mk] = [];
      m[ct][mk].push(c);
    });
    return m;
  }, [data, clientTypes]);

  // Totals per month
  const monthTotals = useMemo(() => {
    const t: Record<string, NewClientData[]> = {};
    allMonths.forEach((mk) => {
      t[mk] = clientTypes.flatMap((ct) => matrix[ct]?.[mk] ?? []);
    });
    return t;
  }, [allMonths, clientTypes, matrix]);

  // Register for copy
  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((n) => n.textContent?.trim() || '');
      const rows = Array.from(table.querySelectorAll('tbody tr'))
        .map((n) => Array.from(n.querySelectorAll('td')).map((c) => c.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...rows].join('\n');
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, metric, allMonths]);

  const months = allMonths.slice().reverse(); // newest first for display

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span className="text-[15px] font-bold text-white">{tableId}</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{months.length} months</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{clientTypes.length} client types</span>
          </div>
          <p className="mt-1 text-[12px] text-slate-400">Click any row or totals cell to open detailed drill-down evidence for that slice.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Values / Growth toggle */}
          <div className="flex rounded-xl border border-white/10 bg-white/10 p-0.5">
            {(['values', 'growth'] as const).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${viewMode === v ? 'bg-violet-600 text-white shadow-sm' : 'text-white/60 hover:text-white'}`}
              >
                {v === 'values' ? 'Values' : 'Growth %'}
              </button>
            ))}
          </div>
          <CopyTableButton tableRef={containerRef as any} tableName={tableId} size="sm" onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined} />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/80">
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Months shown</div>
          <div className="mt-0.5 text-2xl font-bold text-slate-900">{months.length}</div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Client types</div>
          <div className="mt-0.5 text-2xl font-bold text-slate-900">{clientTypes.length}</div>
        </div>
        <div className="px-5 py-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Current metric</div>
          <div className="mt-0.5 text-[1.1rem] font-bold text-slate-900">{METRIC_OPTS.find((o) => o.value === metric)?.label}</div>
        </div>
      </div>

      {/* Metric selector */}
      <div className="flex flex-wrap gap-1.5 border-b border-slate-100 bg-slate-950 px-4 py-2.5">
        {METRIC_OPTS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setMetric(opt.value)}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${metric === opt.value ? 'bg-emerald-500 text-white shadow-sm' : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="max-h-[600px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-slate-950">
            <TableRow className="border-slate-800">
              <TableHead className="sticky left-0 z-30 min-w-[200px] bg-slate-950 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                Client Type
              </TableHead>
              {months.map((mk) => (
                <TableHead
                  key={mk}
                  className={`min-w-[70px] py-3 text-center text-xs font-semibold uppercase tracking-wide ${mk === currentMonth ? 'text-emerald-400' : 'text-white/70'}`}
                >
                  <div>{fmtMonthKey(mk).split(' ')[0]}</div>
                  <div className="text-[10px] font-normal opacity-70">{fmtMonthKey(mk).split(' ')[1]}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientTypes.map((ct, rowIdx) => {
              return (
                <TableRow
                  key={ct}
                  className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                  onClick={() => onRowClick?.({ type: ct, clients: data.filter((c) => c.isNew === ct) })}
                >
                  <TableCell className="sticky left-0 z-10 bg-inherit py-2.5">
                    <span className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[12px] font-semibold text-slate-800 shadow-sm">
                      {ct}
                    </span>
                  </TableCell>
                  {months.map((mk) => {
                    const clients = matrix[ct]?.[mk] ?? [];
                    if (viewMode === 'growth') {
                      // compare to previous month
                      const prevMk = months[months.indexOf(mk) + 1] ?? null;
                      const cur = buildCell(clients, metric);
                      const prev = prevMk ? buildCell(matrix[ct]?.[prevMk] ?? [], metric) : null;
                      const pct = prev !== null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
                      return (
                        <TableCell key={mk} className={`py-2 text-center text-xs font-semibold ${mk === currentMonth ? 'bg-emerald-50/60' : ''}`}>
                          {pct === null ? (
                            <span className="text-slate-300">—</span>
                          ) : (
                            <span className={pct >= 0 ? 'text-emerald-600' : 'text-red-500'}>
                              {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                            </span>
                          )}
                        </TableCell>
                      );
                    }
                    const value = buildCell(clients, metric);
                    return (
                      <TableCell key={mk} className={`py-2 text-center text-[12px] font-medium text-slate-800 ${mk === currentMonth ? 'bg-emerald-50/60 font-bold text-emerald-800' : ''} ${value === 0 ? 'text-slate-300' : ''}`}>
                        {value === 0 ? '0' : fmtCell(value, metric)}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}

            {/* Totals row */}
            <TableRow className="sticky bottom-0 z-10 border-t-2 border-slate-800 bg-slate-900 hover:bg-slate-800">
              <TableCell className="sticky left-0 z-20 bg-slate-900 py-3 text-xs font-bold uppercase tracking-widest text-white">
                Totals
              </TableCell>
              {months.map((mk) => {
                const clients = monthTotals[mk] ?? [];
                if (viewMode === 'growth') {
                  const prevMk = months[months.indexOf(mk) + 1] ?? null;
                  const cur = buildCell(clients, metric);
                  const prev = prevMk ? buildCell(monthTotals[prevMk] ?? [], metric) : null;
                  const pct = prev !== null && prev !== 0 ? ((cur - prev) / prev) * 100 : null;
                  return (
                    <TableCell key={mk} className={`py-3 text-center text-xs font-bold ${mk === currentMonth ? 'bg-emerald-900/30' : ''}`}>
                      {pct === null ? (
                        <span className="text-slate-500">—</span>
                      ) : (
                        <span className={pct >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                        </span>
                      )}
                    </TableCell>
                  );
                }
                const value = buildCell(clients, metric);
                return (
                  <TableCell key={mk} className={`py-3 text-center text-[12px] font-bold text-white ${mk === currentMonth ? 'bg-emerald-900/30 text-emerald-300' : ''}`}>
                    {fmtCell(value, metric)}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

// ─── New Client Membership Purchases Table ────────────────────────────────────

interface MembershipPurchasesTableProps {
  data: NewClientData[];
  onRowClick?: (row: any) => void;
}

type PurchaseGroupBy = 'membership' | 'clientType';

export const NewClientMembershipPurchasesTable: React.FC<MembershipPurchasesTableProps> = ({ data, onRowClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const [groupBy, setGroupBy] = useState<PurchaseGroupBy>('membership');
  const tableId = 'New Client Membership Purchases';

  const rows = useMemo(() => {
    type Bucket = { units: number; clients: Set<string>; totalValue: number; totalDays: number; dayCount: number; totalVisits: number; visitCount: number };
    const grouped: Record<string, Bucket> = {};

    const newClients = data.filter((c) => isInNewClientCohort(c));

    newClients.forEach((c) => {
      if (groupBy === 'membership') {
        // Split comma-separated memberships (same as ClientRetention)
        const raw = String(c.membershipsBoughtPostTrial || 'No Membership Purchase');
        const memberships = raw.split(',').map((m) => m.trim()).filter(Boolean);
        const keys = memberships.length > 0 ? memberships : ['No Membership Purchase'];
        keys.forEach((key) => {
          if (!grouped[key]) grouped[key] = { units: 0, clients: new Set(), totalValue: 0, totalDays: 0, dayCount: 0, totalVisits: 0, visitCount: 0 };
          const g = grouped[key];
          g.units += 1;
          g.clients.add(c.memberId || c.email);
          g.totalValue += c.ltv || 0;
          if ((c.conversionSpan || 0) > 0) { g.totalDays += c.conversionSpan; g.dayCount += 1; }
          if ((c.visitsPostTrial || 0) > 0) { g.totalVisits += c.visitsPostTrial; g.visitCount += 1; }
        });
      } else {
        // By client type — one row per client
        const key = c.isNew || 'Unknown';
        if (!grouped[key]) grouped[key] = { units: 0, clients: new Set(), totalValue: 0, totalDays: 0, dayCount: 0, totalVisits: 0, visitCount: 0 };
        const g = grouped[key];
        g.units += c.purchaseCountPostTrial || 1;
        g.clients.add(c.memberId || c.email);
        g.totalValue += c.ltv || 0;
        if ((c.conversionSpan || 0) > 0) { g.totalDays += c.conversionSpan; g.dayCount += 1; }
        if ((c.visitsPostTrial || 0) > 0) { g.totalVisits += c.visitsPostTrial; g.visitCount += 1; }
      }
    });

    return Object.entries(grouped)
      .map(([name, g]) => ({
        name,
        units: g.units,
        clients: g.clients.size,
        totalValue: g.totalValue,
        avgValue: g.clients.size > 0 ? g.totalValue / g.clients.size : 0,
        avgDays: g.dayCount > 0 ? g.totalDays / g.dayCount : null,
        avgVisits: g.visitCount > 0 ? g.totalVisits / g.visitCount : 0,
      }))
      .sort((a, b) => b.units - a.units);
  }, [data, groupBy]);

  const totals = useMemo(() => ({
    units: rows.reduce((s, r) => s + r.units, 0),
    clients: rows.reduce((s, r) => s + r.clients, 0),
    totalValue: rows.reduce((s, r) => s + r.totalValue, 0),
    avgValue: rows.length > 0 ? rows.reduce((s, r) => s + r.avgValue, 0) / rows.length : 0,
    avgDays: (() => { const ds = rows.filter((r) => r.avgDays !== null); return ds.length > 0 ? ds.reduce((s, r) => s + (r.avgDays ?? 0), 0) / ds.length : null; })(),
    avgVisits: rows.length > 0 ? rows.reduce((s, r) => s + r.avgVisits, 0) / rows.length : 0,
  }), [rows]);

  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((n) => n.textContent?.trim() || '');
      const tableRows = Array.from(table.querySelectorAll('tbody tr'))
        .map((n) => Array.from(n.querySelectorAll('td')).map((c) => c.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...tableRows].join('\n');
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, rows]);

  const newClientCount = data.filter((c) => isInNewClientCohort(c)).length;
  const membershipCount = rows.filter((r) => r.units > 0).length;

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-5 py-4">
        <div>
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="text-[15px] font-bold text-white">New Client Membership Purchases</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{newClientCount} New Clients</span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">{membershipCount} Memberships</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <CopyTableButton tableRef={containerRef as any} tableName={tableId} size="sm" onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined} />
        </div>
      </div>

      {/* Group-by selector */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-white px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Group By:</span>
        <div className="flex gap-1">
          {([
            { value: 'membership' as const, label: 'By Membership' },
            { value: 'clientType' as const, label: 'By Client Type' },
          ]).map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setGroupBy(value)}
              className={`rounded-full border px-4 py-1.5 text-[12px] font-semibold transition-all ${groupBy === value ? 'border-violet-300 bg-violet-600 text-white shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:text-violet-700'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <span className="ml-auto text-[11px] text-slate-400">
          {groupBy === 'membership' ? 'Aggregated by membership type across all client types' : 'Aggregated by client type across all memberships'}
        </span>
      </div>

      {/* Table */}
      <div className="max-h-[480px] overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-slate-950">
            <TableRow className="border-slate-800">
              <TableHead className="sticky left-0 z-30 min-w-[260px] bg-slate-950 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-white">
                {groupBy === 'membership' ? 'Membership Type' : 'Client Type'}
              </TableHead>
              {[
                ['units', 'Units', 'text-center'],
                ['clients', 'Clients', 'text-center'],
                ['totalValue', 'Total Value', 'text-right'],
                ['avgValue', 'Avg Value', 'text-right'],
                ['avgDays', 'Avg Days', 'text-center'],
                ['avgVisits', 'Avg Visits', 'text-center'],
              ].map(([, label, align]) => (
                <TableHead key={label} className={`py-3 pr-4 ${align} text-xs font-semibold uppercase tracking-wide text-white`}>
                  {label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow
                key={row.name}
                className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className={`sticky left-0 z-10 px-5 py-3 text-[13px] font-medium text-slate-900 ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>{row.name}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.units)}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.clients)}</TableCell>
                <TableCell className="py-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.totalValue)}</TableCell>
                <TableCell className="py-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.avgValue)}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{row.avgDays !== null ? `${row.avgDays.toFixed(1)}` : 'N/A'}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{row.avgVisits.toFixed(1)}</TableCell>
              </TableRow>
            ))}

            {/* Totals */}
            <TableRow className="sticky bottom-0 z-10 border-t-2 border-slate-800 bg-slate-900 hover:bg-slate-800">
              <TableCell className="sticky left-0 z-20 bg-slate-900 px-5 py-3 text-xs font-bold uppercase tracking-widest text-white">Total</TableCell>
              <TableCell className="py-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.units)}</TableCell>
              <TableCell className="py-3 text-center text-[13px] font-bold text-white">{formatNumber(totals.clients)}</TableCell>
              <TableCell className="py-3 text-right text-[13px] font-bold text-white">{formatCurrency(totals.totalValue)}</TableCell>
              <TableCell className="py-3 text-right text-[13px] font-bold text-white">{formatCurrency(totals.avgValue)}</TableCell>
              <TableCell className="py-3 text-center text-[13px] font-bold text-white">{totals.avgDays !== null ? `${totals.avgDays.toFixed(1)}` : 'N/A'}</TableCell>
              <TableCell className="py-3 text-center text-[13px] font-bold text-white">{totals.avgVisits.toFixed(1)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientConversionMonthOnMonthByTypeTable;
