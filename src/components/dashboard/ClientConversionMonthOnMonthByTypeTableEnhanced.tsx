import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, ChevronDown, ChevronRight, Layers3 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';

interface CheckinData {
  memberId: string;
  sessionName: string;
  location: string;
  date: string;
  isNew: string;
  month: string;
  year: string;
}

interface ClientConversionMonthOnMonthByTypeTableProps {
  data: NewClientData[];
  checkins?: CheckinData[];
  visitsSummary?: Record<string, number>;
  onRowClick?: (row: any) => void;
}

interface GroupStats {
  type: string;
  totalTrials: number;
  newMembers: number;
  converted: number;
  retained: number;
  totalLTV: number;
  conversionIntervals: number[];
  visitsPostTrial: number[];
  clients: NewClientData[];
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  avgConversionDays: number;
  avgVisits: number;
}

interface MembershipChildRow {
  membership: string;
  totalTrials: number;
  newMembers: number;
  converted: number;
  retained: number;
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  totalLTV: number;
  avgConversionDays: number;
  avgVisits: number;
  clients: NewClientData[];
}

const buildMembershipRows = (clients: NewClientData[]): MembershipChildRow[] => {
  const grouped = clients.reduce<Record<string, MembershipChildRow>>((acc, client) => {
    const membership = client.membershipUsed || client.membershipsBoughtPostTrial || 'No Membership Recorded';
    if (!acc[membership]) {
      acc[membership] = {
        membership,
        totalTrials: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        totalLTV: 0,
        avgConversionDays: 0,
        avgVisits: 0,
        clients: [],
      };
    }

    acc[membership].totalTrials += 1;
    if (isInNewClientCohort(client)) acc[membership].newMembers += 1;
    if (isConvertedInCohort(client)) acc[membership].converted += 1;
    if (isRetainedInCohort(client)) acc[membership].retained += 1;
    acc[membership].totalLTV += client.ltv || 0;
    acc[membership].clients.push(client);
    return acc;
  }, {});

  return Object.values(grouped)
    .map((row) => {
      const conversionSpans = row.clients.map((client) => client.conversionSpan || 0).filter((value) => value > 0);
      const visitsPostTrial = row.clients.map((client) => client.visitsPostTrial || 0).filter((value) => value > 0);

      return {
        ...row,
        conversionRate: row.newMembers > 0 ? (row.converted / row.newMembers) * 100 : 0,
        retentionRate: row.newMembers > 0 ? (row.retained / row.newMembers) * 100 : 0,
        avgLTV: row.totalTrials > 0 ? row.totalLTV / row.totalTrials : 0,
        avgConversionDays:
          conversionSpans.length > 0
            ? conversionSpans.reduce((sum, value) => sum + value, 0) / conversionSpans.length
            : 0,
        avgVisits:
          visitsPostTrial.length > 0
            ? visitsPostTrial.reduce((sum, value) => sum + value, 0) / visitsPostTrial.length
            : 0,
      };
    })
    .sort((a, b) => b.totalTrials - a.totalTrials);
};

export const ClientConversionMonthOnMonthByTypeTable: React.FC<ClientConversionMonthOnMonthByTypeTableProps> = ({
  data,
  onRowClick,
}) => {
  const totalsRowStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#1e40af',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    borderTopColor: '#1d4ed8',
  };

  const totalsCellStyle: React.CSSProperties = {
    ['--retention-totals-bg' as string]: '#1e40af',
    ['--retention-totals-text' as string]: '#ffffff',
    ['--retention-totals-border' as string]: 'rgba(255, 255, 255, 0.16)',
    backgroundColor: '#1e40af',
    color: '#ffffff',
    borderColor: 'rgba(255, 255, 255, 0.16)',
    borderTopColor: '#1d4ed8',
  };

  const tableId = 'By Client Type';
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const [sortField, setSortField] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [rowType, setRowType] = useState<'clientType' | 'membership' | 'teacher'>('clientType');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const tableData = useMemo<GroupStats[]>(() => {
    const grouped = data.reduce<Record<string, Omit<GroupStats, 'conversionRate' | 'retentionRate' | 'avgLTV' | 'avgConversionDays' | 'avgVisits'>>>((acc, client) => {
      const key = rowType === 'clientType'
        ? client.isNew || 'Unknown'
        : rowType === 'membership'
          ? client.membershipUsed || 'Unknown'
          : client.trainerName || 'Unknown';

      if (!acc[key]) {
        acc[key] = {
          type: key,
          totalTrials: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          conversionIntervals: [],
          visitsPostTrial: [],
          clients: [],
        };
      }

      const bucket = acc[key];
      bucket.totalTrials += 1;
      if (isInNewClientCohort(client)) bucket.newMembers += 1;
      if (isConvertedInCohort(client)) bucket.converted += 1;
      if (isRetainedInCohort(client)) bucket.retained += 1;
      bucket.totalLTV += client.ltv || 0;
      if ((client.conversionSpan || 0) > 0) bucket.conversionIntervals.push(client.conversionSpan);
      if ((client.visitsPostTrial || 0) > 0) bucket.visitsPostTrial.push(client.visitsPostTrial);
      bucket.clients.push(client);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((bucket) => ({
        ...bucket,
        conversionRate: bucket.newMembers > 0 ? (bucket.converted / bucket.newMembers) * 100 : 0,
        retentionRate: bucket.newMembers > 0 ? (bucket.retained / bucket.newMembers) * 100 : 0,
        avgLTV: bucket.totalTrials > 0 ? bucket.totalLTV / bucket.totalTrials : 0,
        avgConversionDays:
          bucket.conversionIntervals.length > 0
            ? bucket.conversionIntervals.reduce((sum, value) => sum + value, 0) / bucket.conversionIntervals.length
            : 0,
        avgVisits:
          bucket.visitsPostTrial.length > 0
            ? bucket.visitsPostTrial.reduce((sum, value) => sum + value, 0) / bucket.visitsPostTrial.length
            : 0,
      }))
      .sort((a, b) => {
        if (rowType === 'clientType') {
          const aNew = a.type.toLowerCase().includes('new');
          const bNew = b.type.toLowerCase().includes('new');
          if (aNew && !bNew) return -1;
          if (!aNew && bNew) return 1;
        }
        return a.type.localeCompare(b.type);
      });
  }, [data, rowType]);

  const displayedData = useMemo(() => {
    if (!sortField) return tableData;
    return [...tableData].sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * dir;
      return String(aValue ?? '').localeCompare(String(bValue ?? '')) * dir;
    });
  }, [sortDirection, sortField, tableData]);

  const totalsRow = useMemo<GroupStats>(() => {
    const totals = tableData.reduce(
      (acc, row) => ({
        type: 'TOTALS',
        totalTrials: acc.totalTrials + row.totalTrials,
        newMembers: acc.newMembers + row.newMembers,
        converted: acc.converted + row.converted,
        retained: acc.retained + row.retained,
        totalLTV: acc.totalLTV + row.totalLTV,
        conversionIntervals: [...acc.conversionIntervals, ...row.conversionIntervals],
        visitsPostTrial: [...acc.visitsPostTrial, ...row.visitsPostTrial],
        clients: [...acc.clients, ...row.clients],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgConversionDays: 0,
        avgVisits: 0,
      }),
      {
        type: 'TOTALS',
        totalTrials: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        conversionIntervals: [] as number[],
        visitsPostTrial: [] as number[],
        clients: [] as NewClientData[],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgConversionDays: 0,
        avgVisits: 0,
      }
    );

    totals.conversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers) * 100 : 0;
    totals.retentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers) * 100 : 0;
    totals.avgLTV = totals.totalTrials > 0 ? totals.totalLTV / totals.totalTrials : 0;
    totals.avgConversionDays = totals.conversionIntervals.length > 0
      ? totals.conversionIntervals.reduce((sum, value) => sum + value, 0) / totals.conversionIntervals.length
      : 0;
    totals.avgVisits = totals.visitsPostTrial.length > 0
      ? totals.visitsPostTrial.reduce((sum, value) => sum + value, 0) / totals.visitsPostTrial.length
      : 0;

    return totals;
  }, [tableData]);

  useEffect(() => {
    if (!registry || !containerRef.current) return;
    const getTextContent = () => {
      const table = containerRef.current?.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      const headers = Array.from(table.querySelectorAll('thead th')).map((node) => node.textContent?.trim() || '');
      const rows = Array.from(table.querySelectorAll('tbody tr'))
        .map((node) => Array.from(node.querySelectorAll('td')).map((cell) => cell.textContent?.trim() || '').join('\t'))
        .filter(Boolean);
      return [tableId, headers.join('\t'), ...rows].join('\n').trim();
    };

    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableId, displayedData, rowType]);

  const toggleExpanded = (rowKey: string) => {
    setExpandedRows((current) =>
      current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey]
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  return (
    <Card ref={containerRef} className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
      <CardHeader className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5" />
            {tableId}
            <Badge className="border-white/20 bg-white/10 text-white">{displayedData.length} rows</Badge>
          </CardTitle>
          <p className="mt-2 text-sm text-slate-300">
            Cleaner parent rows, attached membership child rows, and clickable totals for full drill-down coverage.
          </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex rounded-2xl border border-white/10 bg-white/10 p-1.5 shadow-inner backdrop-blur-sm">
              {([
                ['clientType', 'Client Type'],
                ['membership', 'Membership'],
                ['teacher', 'Teacher'],
              ] as const).map(([value, label]) => (
                <Button
                  key={value}
                  size="sm"
                  variant="ghost"
                  onClick={() => setRowType(value)}
                  className={rowType === value ? 'rounded-xl border border-blue-400/30 bg-blue-500 text-white shadow-sm hover:bg-blue-400' : 'rounded-xl border border-white/10 bg-transparent text-blue-100 hover:bg-blue-500/20 hover:text-white'}
                >
                  {label}
                </Button>
              ))}
            </div>
            <CopyTableButton tableRef={containerRef as any} tableName={tableId} size="sm" onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid gap-3 border-b border-slate-200 bg-slate-50/90 px-5 py-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Displayed rows</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatNumber(displayedData.length)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total trials</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatNumber(totalsRow.totalTrials)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Total LTV</div>
            <div className="mt-1 text-2xl font-semibold text-slate-950">{formatCurrency(totalsRow.totalLTV)}</div>
          </div>
        </div>
        <div className="max-h-[680px] overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 z-20 bg-slate-950">
              <TableRow className="border-slate-800 bg-slate-950 hover:bg-slate-950">
                <TableHead className="sticky left-0 z-10 min-w-[320px] bg-slate-950 text-xs font-semibold uppercase tracking-wide text-white">
                  {rowType === 'clientType' ? 'Client Type' : rowType === 'membership' ? 'Membership' : 'Teacher'}
                </TableHead>
                {[
                  ['totalTrials', 'Trials'],
                  ['newMembers', 'New Members'],
                  ['retained', 'Retained'],
                  ['retentionRate', 'Retention %'],
                  ['converted', 'Converted'],
                  ['conversionRate', 'Conversion %'],
                  ['avgLTV', 'Avg LTV'],
                  ['totalLTV', 'Total LTV'],
                  ['avgConversionDays', 'Avg Conv Days'],
                  ['avgVisits', 'Avg Visits'],
                ].map(([field, label]) => (
                  <TableHead
                    key={field}
                    onClick={() => handleSort(field)}
                    className="cursor-pointer text-center text-xs font-semibold uppercase tracking-wide text-white"
                  >
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((row) => {
                const isExpanded = expandedRows.includes(row.type);
                const membershipRows = buildMembershipRows(row.clients);
                const topLocations = Array.from(new Set(row.clients.map((client) => client.firstVisitLocation).filter(Boolean))).slice(0, 3);
                return (
                  <React.Fragment key={row.type}>
                    <TableRow className="cursor-pointer border-b border-slate-100 bg-white/90 hover:bg-indigo-50/40" onClick={() => onRowClick?.(row)}>
                      <TableCell className="sticky left-0 z-10 bg-inherit py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(row.type);
                            }}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div>
                            <div className="font-semibold text-slate-900">{row.type}</div>
                            <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
                              {topLocations.map((location) => (
                                <Badge key={location} variant="outline" className="rounded-full border-slate-200 bg-slate-50 text-slate-600">
                                  {location}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.totalTrials)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.newMembers)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.retained)}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{row.retentionRate.toFixed(1)}%</span></TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.converted)}</TableCell>
                      <TableCell className="text-center"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{row.conversionRate.toFixed(1)}%</span></TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.avgLTV)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.totalLTV)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{row.avgConversionDays.toFixed(0)} days</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{row.avgVisits.toFixed(1)}</TableCell>
                    </TableRow>
                    {isExpanded && (membershipRows.length > 0 ? membershipRows.map((membership) => (
                      <TableRow
                        key={`${row.type}-${membership.membership}`}
                        className="cursor-pointer border-b border-blue-100 bg-blue-50/70 hover:bg-blue-100/80"
                        onClick={() => onRowClick?.({
                          type: membership.membership,
                          parentType: row.type,
                          rowType: 'membershipChild',
                          totalTrials: membership.totalTrials,
                          newMembers: membership.newMembers,
                          converted: membership.converted,
                          retained: membership.retained,
                          conversionRate: membership.conversionRate,
                          retentionRate: membership.retentionRate,
                          avgLTV: membership.avgLTV,
                          totalLTV: membership.totalLTV,
                          avgConversionDays: membership.avgConversionDays,
                          avgVisits: membership.avgVisits,
                          clients: membership.clients,
                        })}
                      >
                        <TableCell className="sticky left-0 z-10 bg-blue-50/70 py-2.5 pl-14">
                          <div className="flex items-start gap-3 text-sm text-slate-700">
                            <Layers3 className="mt-0.5 h-4 w-4 text-blue-600" />
                            <div>
                              <div className="font-semibold text-slate-900">{membership.membership}</div>
                              <div className="text-xs text-slate-500">Attached child row under {row.type}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(membership.totalTrials)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(membership.newMembers)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(membership.retained)}</TableCell>
                        <TableCell className="text-center"><span className="inline-flex rounded-full bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-700">{membership.retentionRate.toFixed(1)}%</span></TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(membership.converted)}</TableCell>
                        <TableCell className="text-center"><span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{membership.conversionRate.toFixed(1)}%</span></TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(membership.avgLTV)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(membership.totalLTV)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{membership.avgConversionDays.toFixed(0)} days</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{membership.avgVisits.toFixed(1)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                        <TableCell colSpan={11} className="px-6 py-4 text-sm text-slate-500">
                          No membership detail available for this row.
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              <TableRow className="cursor-pointer border-t-4 border-blue-700" style={totalsRowStyle} onClick={() => onRowClick?.(totalsRow)}>
                <TableCell className="sticky left-0 z-10 py-3 text-center font-bold" style={totalsCellStyle}>TOTALS</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totalsRow.totalTrials)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totalsRow.newMembers)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totalsRow.retained)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totalsRow.retentionRate.toFixed(1)}%</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{formatNumber(totalsRow.converted)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totalsRow.conversionRate.toFixed(1)}%</TableCell>
                <TableCell className="text-right font-bold" style={totalsCellStyle}>{formatCurrency(totalsRow.avgLTV)}</TableCell>
                <TableCell className="text-right font-bold" style={totalsCellStyle}>{formatCurrency(totalsRow.totalLTV)}</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totalsRow.avgConversionDays.toFixed(0)} days</TableCell>
                <TableCell className="text-center font-bold" style={totalsCellStyle}>{totalsRow.avgVisits.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClientConversionMonthOnMonthByTypeTable;
