import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ShoppingBag, Users } from 'lucide-react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57SortTh, useSortableData } from '@/components/ui/P57SortTh';
import { TABLE_STYLES } from '@/styles/tableStyles';
import { downloadCsv } from '@/utils/csvExport';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClientConversionMonthOnMonthByTypeTableProps {
  data: NewClientData[];
  checkins?: any[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (row: any) => void;
}

type GroupDim = 'clientType' | 'location' | 'membership' | 'trainer';

const GROUP_OPTS: Array<{ value: GroupDim; label: string; plural: string; get: (c: NewClientData) => string }> = [
  { value: 'clientType', label: 'Client Type', plural: 'client types', get: (c) => c.isNew || 'Unknown' },
  { value: 'location', label: 'Location', plural: 'locations', get: (c) => c.firstVisitLocation || c.homeLocation || 'Unknown' },
  { value: 'membership', label: 'Membership', plural: 'memberships', get: (c) => c.membershipUsed || 'Unknown' },
  { value: 'trainer', label: 'Trainer', plural: 'trainers', get: (c) => c.trainerName || 'Unknown' },
];

interface GroupAgg {
  key: string;
  trials: number;
  newMembers: number;
  converted: number;
  retained: number;
  conversionPct: number;
  retentionPct: number;
  avgLtv: number;
  totalLtv: number;
  avgConvDays: number | null;
  avgVisits: number;
}

type MetricKey = 'trials' | 'newMembers' | 'converted' | 'retained' | 'conversionPct' | 'retentionPct' | 'avgLtv' | 'totalLtv' | 'avgConvDays' | 'avgVisits';
type MetricKind = 'int' | 'pct' | 'currency' | 'days' | 'decimal';

const METRIC_COLS: Array<{ key: MetricKey; label: string; kind: MetricKind; align: 'center' | 'right' }> = [
  { key: 'trials', label: 'Trials', kind: 'int', align: 'center' },
  { key: 'newMembers', label: 'New', kind: 'int', align: 'center' },
  { key: 'converted', label: 'Converted', kind: 'int', align: 'center' },
  { key: 'retained', label: 'Retained', kind: 'int', align: 'center' },
  { key: 'conversionPct', label: 'Conv %', kind: 'pct', align: 'center' },
  { key: 'retentionPct', label: 'Ret %', kind: 'pct', align: 'center' },
  { key: 'avgLtv', label: 'Avg LTV', kind: 'currency', align: 'right' },
  { key: 'totalLtv', label: 'Total LTV', kind: 'currency', align: 'right' },
  { key: 'avgConvDays', label: 'Avg Days', kind: 'days', align: 'center' },
  { key: 'avgVisits', label: 'Avg Visits', kind: 'decimal', align: 'center' },
];

function fmtValue(value: number | null, kind: MetricKind): string {
  if (value === null || value === undefined) return '—';
  if (kind === 'pct') return `${value.toFixed(1)}%`;
  if (kind === 'currency') return formatCurrency(value);
  if (kind === 'days') return `${Math.round(value)}d`;
  if (kind === 'decimal') return value.toFixed(1);
  return formatNumber(Math.round(value));
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ClientConversionMonthOnMonthByTypeTable: React.FC<ClientConversionMonthOnMonthByTypeTableProps> = ({
  data,
  onRowClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const [groupDim, setGroupDim] = useState<GroupDim>('clientType');
  const [query, setQuery] = useState('');
  const dim = GROUP_OPTS.find((d) => d.value === groupDim) ?? GROUP_OPTS[0];
  const tableId = `By ${dim.label}`;

  // Aggregate every client into its group bucket (single pass per dimension).
  const groups = useMemo(() => {
    const buckets = new Map<string, NewClientData[]>();
    data.forEach((c) => {
      const k = dim.get(c);
      const bucket = buckets.get(k);
      if (bucket) bucket.push(c);
      else buckets.set(k, [c]);
    });
    const aggs: Array<GroupAgg & { clients: NewClientData[] }> = [];
    buckets.forEach((clients, key) => {
      const trials = clients.length;
      const newMembers = clients.filter((c) => isInNewClientCohort(c)).length;
      const converted = clients.filter((c) => isConvertedInCohort(c)).length;
      const retained = clients.filter((c) => isRetainedInCohort(c)).length;
      const totalLtv = clients.reduce((sum, c) => sum + (c.ltv || 0), 0);
      const spans = clients.map((c) => c.conversionSpan).filter((v) => (v || 0) > 0);
      const visits = clients.map((c) => c.visitsPostTrial).filter((v) => (v || 0) > 0);
      aggs.push({
        key,
        clients,
        trials,
        newMembers,
        converted,
        retained,
        conversionPct: trials > 0 ? (converted / trials) * 100 : 0,
        retentionPct: trials > 0 ? (retained / trials) * 100 : 0,
        avgLtv: trials > 0 ? totalLtv / trials : 0,
        totalLtv,
        avgConvDays: spans.length > 0 ? spans.reduce((sum, v) => sum + v, 0) / spans.length : null,
        avgVisits: visits.length > 0 ? visits.reduce((sum, v) => sum + v, 0) / visits.length : 0,
      });
    });
    return aggs;
  }, [data, dim]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return groups;
    return groups.filter((g) => g.key.toLowerCase().includes(term));
  }, [groups, query]);

  const { rows, sortKey, sortDir, toggleSort } = useSortableData(
    filtered,
    (row, key) => (key === 'key' ? row.key : (row as unknown as Record<string, number | null>)[key] ?? null),
    'trials',
    'desc'
  );

  // Totals across the full filtered dataset (independent of search/sort).
  const totals = useMemo(() => {
    const trials = data.length;
    const converted = data.filter((c) => isConvertedInCohort(c)).length;
    const retained = data.filter((c) => isRetainedInCohort(c)).length;
    const newMembers = data.filter((c) => isInNewClientCohort(c)).length;
    const totalLtv = data.reduce((sum, c) => sum + (c.ltv || 0), 0);
    const spans = data.map((c) => c.conversionSpan).filter((v) => (v || 0) > 0);
    const visits = data.map((c) => c.visitsPostTrial).filter((v) => (v || 0) > 0);
    return {
      trials,
      newMembers,
      converted,
      retained,
      conversionPct: trials > 0 ? (converted / trials) * 100 : 0,
      retentionPct: trials > 0 ? (retained / trials) * 100 : 0,
      avgLtv: trials > 0 ? totalLtv / trials : 0,
      totalLtv,
      avgConvDays: spans.length > 0 ? spans.reduce((sum, v) => sum + v, 0) / spans.length : null,
      avgVisits: visits.length > 0 ? visits.reduce((sum, v) => sum + v, 0) / visits.length : 0,
    };
  }, [data]);

  const handleExport = () => {
    downloadCsv(
      `${tableId}.csv`,
      [{ key: 'group', header: dim.label }, ...METRIC_COLS.map((c) => ({ key: c.key, header: c.label }))],
      rows.map((r) => {
        const rec: Record<string, unknown> = { group: r.key };
        METRIC_COLS.forEach((c) => { rec[c.key] = r[c.key] ?? ''; });
        return rec;
      })
    );
  };

  // Register for copy
  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((n) => n.textContent?.trim() || '');
      const bodyRows = Array.from(table.querySelectorAll('tbody tr'))
        .map((n) => Array.from(n.querySelectorAll('td')).map((c) => c.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...bodyRows].join('\n');
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, rows]);

  return (
    <div ref={containerRef}>
      <P57TableShell
        icon={Users}
        title={tableId}
        description={`Retention, revenue, visits, and conversion performance by ${dim.plural} — aggregated over the filtered period. Click any row for drill-down evidence.`}
        rowCount={rows.length}
        rowCountLabel="groups"
        onSearch={setQuery}
        searchPlaceholder={`Search ${dim.plural}…`}
        onExportCsv={handleExport}
        actions={
          <div className="flex items-center gap-1 rounded-[10px] border border-[#ececef] bg-[#f6f7f9] p-[3px] dark:border-[#2a2a2e] dark:bg-[#141416]" role="group" aria-label="Group rows by">
            {GROUP_OPTS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setGroupDim(o.value)}
                aria-pressed={groupDim === o.value}
                className={groupDim === o.value
                  ? 'rounded-[7px] bg-slate-900 px-2.5 py-1 text-[12px] font-bold text-white shadow-sm dark:bg-white dark:text-slate-900'
                  : 'rounded-[7px] px-2.5 py-1 text-[12px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}
              >
                {o.label}
              </button>
            ))}
          </div>
        }
        meta={<span>{formatNumber(data.length)} clients in the filtered period · sorted by {sortKey === 'key' ? dim.label : METRIC_COLS.find((c) => c.key === sortKey)?.label ?? 'Trials'} ({sortDir === 'desc' ? 'high to low' : 'low to high'})</span>}
      >
        <div className="max-h-[560px] overflow-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <P57SortTh sortKey="key" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} className="sticky left-0 z-40 min-w-[220px]">
                  {dim.label}
                </P57SortTh>
                {METRIC_COLS.map((c) => (
                  <P57SortTh key={c.key} sortKey={c.key} activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align={c.align}>
                    {c.label}
                  </P57SortTh>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((g) => (
                <tr key={g.key} className="cursor-pointer" onClick={() => onRowClick?.({ type: g.key, clients: g.clients })}>
                  <td className="sticky left-0 z-20 px-3.5 py-2 text-[13px] font-semibold">{g.key}</td>
                  {METRIC_COLS.map((c) => (
                    <td key={c.key} className={c.align === 'right' ? 'px-3.5 py-2 text-right text-[13px] font-medium tabular-nums' : 'px-3.5 py-2 text-center text-[13px] font-medium tabular-nums'}>
                      {fmtValue(g[c.key], c.kind)}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={METRIC_COLS.length + 1} className="px-3.5 py-12 text-center text-sm text-slate-500">
                    No groups match the current search.
                  </td>
                </tr>
              )}
              <tr className={`${TABLE_STYLES.footer.row} cursor-pointer`} onClick={() => onRowClick?.({ type: `All ${dim.plural}`, clients: data })}>
                <td className={`${TABLE_STYLES.footer.cellSticky} ${TABLE_STYLES.footer.label} px-3.5 py-2`}>Total</td>
                {METRIC_COLS.map((c) => (
                  <td key={c.key} className={`${TABLE_STYLES.footer.cell} ${c.align === 'right' ? 'text-right' : 'text-center'}`}>
                    {fmtValue(totals[c.key], c.kind)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </P57TableShell>
    </div>
  );
};
// ─── New Client Membership Purchases Table ────────────────────────────────────

interface MembershipPurchasesTableProps {
  data: NewClientData[];
  onRowClick?: (row: any) => void;
}

export const NewClientMembershipPurchasesTable: React.FC<MembershipPurchasesTableProps> = ({ data, onRowClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'New Client Membership Purchases';
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<string>('uniqueMembers');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Only converted members — their first purchase is what we want
  const convertedMembers = useMemo(() => data.filter((c) => isConvertedInCohort(c)), [data]);

  const rows = useMemo(() => {
    type Bucket = {
      members: Set<string>;
      totalLtv: number;
      totalUnits: number;
      totalPurchaseCount: number;
      totalConvSpan: number;
      convSpanCount: number;
      totalVisits: number;
      visitCount: number;
    };
    const grouped: Record<string, Bucket> = {};

    convertedMembers.forEach((c) => {
      // Group by First Purchase Post Trial item name
      const key = (c.firstPurchaseItem || c.membershipsBoughtPostTrial || 'Unknown').trim() || 'Unknown';
      if (!grouped[key]) grouped[key] = { members: new Set(), totalLtv: 0, totalUnits: 0, totalPurchaseCount: 0, totalConvSpan: 0, convSpanCount: 0, totalVisits: 0, visitCount: 0 };
      const g = grouped[key];
      const memberId = c.memberId || c.email || String(Math.random());
      g.members.add(memberId);
      g.totalLtv += Number(c.ltv) || 0;
      g.totalUnits += 1; // one sale event per converted member
      g.totalPurchaseCount += Number(c.purchaseCountPostTrial) || 1;
      if ((c.conversionSpan || 0) > 0) { g.totalConvSpan += c.conversionSpan; g.convSpanCount += 1; }
      if ((c.visitsPostTrial || 0) > 0) { g.totalVisits += c.visitsPostTrial; g.visitCount += 1; }
    });

    return Object.entries(grouped)
      .map(([name, g]) => {
        const uniqueMembers = g.members.size;
        const totalLtv = g.totalLtv;
        const unitsSold = g.totalUnits;
        const atv = unitsSold > 0 ? totalLtv / unitsSold : 0; // avg transaction value
        const auv = uniqueMembers > 0 ? totalLtv / uniqueMembers : 0; // avg unit value per member
        const purchaseFreq = uniqueMembers > 0 ? g.totalPurchaseCount / uniqueMembers : 0;
        const avgConvDays = g.convSpanCount > 0 ? g.totalConvSpan / g.convSpanCount : null;
        const avgVisits = g.visitCount > 0 ? g.totalVisits / g.visitCount : 0;
        return { name, uniqueMembers, unitsSold, totalLtv, atv, auv, purchaseFreq, avgConvDays, avgVisits, _clients: g.members };
      })
      .sort((a, b) => b.uniqueMembers - a.uniqueMembers);
  }, [convertedMembers]);

  const totals = useMemo(() => {
    const uniqueMembers = new Set(convertedMembers.map((c) => c.memberId || c.email)).size;
    const totalLtv = rows.reduce((s, r) => s + r.totalLtv, 0);
    const unitsSold = rows.reduce((s, r) => s + r.unitsSold, 0);
    const atv = unitsSold > 0 ? totalLtv / unitsSold : 0;
    const auv = uniqueMembers > 0 ? totalLtv / uniqueMembers : 0;
    const purchaseFreqRows = rows.filter((r) => r.uniqueMembers > 0);
    const purchaseFreq = purchaseFreqRows.length > 0 ? purchaseFreqRows.reduce((s, r) => s + r.purchaseFreq, 0) / purchaseFreqRows.length : 0;
    const convDayRows = rows.filter((r) => r.avgConvDays !== null);
    const avgConvDays = convDayRows.length > 0 ? convDayRows.reduce((s, r) => s + (r.avgConvDays ?? 0), 0) / convDayRows.length : null;
    const avgVisitsRows = rows.filter((r) => r.avgVisits > 0);
    const avgVisits = avgVisitsRows.length > 0 ? avgVisitsRows.reduce((s, r) => s + r.avgVisits, 0) / avgVisitsRows.length : 0;
    return { uniqueMembers, unitsSold, totalLtv, atv, auv, purchaseFreq, avgConvDays, avgVisits };
  }, [rows, convertedMembers]);

  const displayedRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term ? rows.filter((r) => r.name.toLowerCase().includes(term)) : rows;
    return [...base].sort((a, b) => {
      const av = (a as unknown as Record<string, string | number | null>)[sortKey];
      const bv = (b as unknown as Record<string, string | number | null>)[sortKey];
      if (av === bv) return 0;
      if (av === null || av === undefined) return 1;
      if (bv === null || bv === undefined) return -1;
      const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'en-IN');
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [rows, query, sortKey, sortDir]);

  const toggleSort = (key: string) => {
    if (sortKey !== key) { setSortKey(key); setSortDir('desc'); }
    else setSortDir((d) => (d === 'desc' ? 'asc' : 'desc'));
  };

  const handleExportCsv = () => {
    const cols = [
      { key: 'name', header: 'First Purchase' },
      { key: 'uniqueMembers', header: 'Members' },
      { key: 'unitsSold', header: 'Units Sold' },
      { key: 'totalLtv', header: 'Total LTV' },
      { key: 'atv', header: 'ATV' },
      { key: 'auv', header: 'AUV' },
      { key: 'purchaseFreq', header: 'Purch. Freq' },
      { key: 'avgConvDays', header: 'Avg Conv Days' },
      { key: 'avgVisits', header: 'Avg Visits' },
    ];
    downloadCsv(`${tableId}.csv`, cols, displayedRows.map((r) => ({
      name: r.name, uniqueMembers: r.uniqueMembers, unitsSold: r.unitsSold,
      totalLtv: r.totalLtv, atv: r.atv, auv: r.auv, purchaseFreq: r.purchaseFreq,
      avgConvDays: r.avgConvDays ?? '', avgVisits: r.avgVisits,
    })));
  };

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

  return (
    <div ref={containerRef} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_4px_24px_rgba(15,23,42,0.08)]">
      <P57TableShell
        icon={ShoppingBag}
        title="New Client Purchases"
        description="First purchases made by converted members — grouped by payment type. Click a row for detail."
        rowCount={displayedRows.length}
        rowCountLabel="types"
        onSearch={setQuery}
        searchPlaceholder="Search purchase types…"
        onExportCsv={handleExportCsv}
        meta={<span>{formatNumber(totals.uniqueMembers)} converted members · {rows.length} purchase types</span>}
      >
      <div className="max-h-[480px] overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <P57SortTh sortKey="name" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} className="sticky left-0 z-40 min-w-[200px]">
                First Purchase
              </P57SortTh>
              <P57SortTh sortKey="uniqueMembers" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="center">Members</P57SortTh>
              <P57SortTh sortKey="unitsSold" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="center">Units Sold</P57SortTh>
              <P57SortTh sortKey="totalLtv" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="right">Total LTV</P57SortTh>
              <P57SortTh sortKey="atv" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="right">ATV</P57SortTh>
              <P57SortTh sortKey="auv" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="right">AUV</P57SortTh>
              <P57SortTh sortKey="purchaseFreq" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="center">Purch. Freq</P57SortTh>
              <P57SortTh sortKey="avgConvDays" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="center">Avg Conv Days</P57SortTh>
              <P57SortTh sortKey="avgVisits" activeKey={sortKey} dir={sortDir} onToggle={toggleSort} align="center">Avg Visits</P57SortTh>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedRows.map((row) => (
              <TableRow
                key={row.name}
                className="cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                <TableCell className="sticky left-0 z-10 px-5 py-3 text-[13px] font-semibold">{row.name}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.uniqueMembers)}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{formatNumber(row.unitsSold)}</TableCell>
                <TableCell className="py-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.totalLtv)}</TableCell>
                <TableCell className="py-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.atv)}</TableCell>
                <TableCell className="py-3 text-right text-[13px] font-medium text-slate-800">{formatCurrency(row.auv)}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{row.purchaseFreq.toFixed(1)}×</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{row.avgConvDays !== null ? `${row.avgConvDays.toFixed(0)}d` : '—'}</TableCell>
                <TableCell className="py-3 text-center text-[13px] font-medium text-slate-800">{row.avgVisits.toFixed(1)}</TableCell>
              </TableRow>
            ))}

            {/* Totals */}
            <TableRow className={TABLE_STYLES.footer.row}>
              <TableCell className={`${TABLE_STYLES.footer.cellSticky} ${TABLE_STYLES.footer.label} px-5 py-3`}>Total</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.uniqueMembers)}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.unitsSold)}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-right`}>{formatCurrency(totals.totalLtv)}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-right`}>{formatCurrency(totals.atv)}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-right`}>{formatCurrency(totals.auv)}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{totals.purchaseFreq.toFixed(1)}×</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{totals.avgConvDays !== null ? `${totals.avgConvDays.toFixed(0)}d` : '—'}</TableCell>
              <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{totals.avgVisits.toFixed(1)}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      </P57TableShell>
    </div>
  );
};

export default ClientConversionMonthOnMonthByTypeTable;
