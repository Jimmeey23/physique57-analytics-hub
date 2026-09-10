import React, { useMemo, useState } from 'react';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { P57SortTh } from '@/components/ui/P57SortTh';
import { P57Badge } from '@/components/ui/P57Badge';
import { TABLE_STYLES } from '@/styles/tableStyles';
import { downloadCsv } from '@/utils/csvExport';
import { Award, ChevronDown, ChevronRight, Layers3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { isConvertedInCohort, isInNewClientCohort, isRetainedInCohort } from '@/utils/clientRetention';

interface ClientConversionMembershipTableProps {
  data: NewClientData[];
  onRowClick?: (rowData: any) => void;
}

interface MembershipRow {
  membershipType: string;
  totalMembers: number;
  newMembers: number;
  converted: number;
  retained: number;
  totalLTV: number;
  totalVisits: number;
  conversionSpans: number[];
  clients: NewClientData[];
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  avgVisits: number;
  avgConversionSpan: number;
}

interface ChildBreakdownRow {
  label: string;
  totalMembers: number;
  newMembers: number;
  converted: number;
  retained: number;
  conversionRate: number;
  retentionRate: number;
  avgLTV: number;
  totalLTV: number;
  clients: NewClientData[];
}

const buildChildRows = (clients: NewClientData[]) => {
  const byClientType = clients.reduce<Record<string, ChildBreakdownRow>>((acc, client) => {
    const label = client.isNew || 'Unknown';
    if (!acc[label]) {
      acc[label] = {
        label,
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        totalLTV: 0,
        clients: [],
      };
    }
    acc[label].totalMembers += 1;
    if (isInNewClientCohort(client)) acc[label].newMembers += 1;
    if (isConvertedInCohort(client)) acc[label].converted += 1;
    if (isRetainedInCohort(client)) acc[label].retained += 1;
    acc[label].totalLTV += client.ltv || 0;
    acc[label].clients.push(client);
    return acc;
  }, {});

  return Object.values(byClientType)
    .map((row) => ({
      ...row,
      conversionRate: row.totalMembers > 0 ? (row.converted / row.totalMembers) * 100 : 0,
      retentionRate: row.totalMembers > 0 ? (row.retained / row.totalMembers) * 100 : 0,
      avgLTV: row.totalMembers > 0 ? row.totalLTV / row.totalMembers : 0,
    }))
    .sort((a, b) => b.totalMembers - a.totalMembers);
};

export const ClientConversionMembershipTable: React.FC<ClientConversionMembershipTableProps> = ({ data, onRowClick }) => {
  const [sortField, setSortField] = useState<string>();
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const tableId = 'Membership Type Performance';

  const membershipData = useMemo<MembershipRow[]>(() => {
    const grouped = data.reduce<Record<string, Omit<MembershipRow, 'conversionRate' | 'retentionRate' | 'avgLTV' | 'avgVisits' | 'avgConversionSpan'>>>((acc, client) => {
      const membership = client.membershipUsed || 'No Membership';
      if (!acc[membership]) {
        acc[membership] = {
          membershipType: membership,
          totalMembers: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          totalVisits: 0,
          conversionSpans: [],
          clients: [],
        };
      }

      const bucket = acc[membership];
      bucket.totalMembers += 1;
      if (isInNewClientCohort(client)) bucket.newMembers += 1;
      if (isConvertedInCohort(client)) bucket.converted += 1;
      if (isRetainedInCohort(client)) bucket.retained += 1;
      bucket.totalLTV += client.ltv || 0;
      bucket.totalVisits += client.visitsPostTrial || 0;
      if ((client.conversionSpan || 0) > 0) bucket.conversionSpans.push(client.conversionSpan);
      bucket.clients.push(client);
      return acc;
    }, {});

    return Object.values(grouped)
      .map((bucket) => ({
        ...bucket,
        conversionRate: bucket.totalMembers > 0 ? (bucket.converted / bucket.totalMembers) * 100 : 0,
        retentionRate: bucket.totalMembers > 0 ? (bucket.retained / bucket.totalMembers) * 100 : 0,
        avgLTV: bucket.totalMembers > 0 ? bucket.totalLTV / bucket.totalMembers : 0,
        avgVisits: bucket.totalMembers > 0 ? bucket.totalVisits / bucket.totalMembers : 0,
        avgConversionSpan:
          bucket.conversionSpans.length > 0
            ? bucket.conversionSpans.reduce((sum, value) => sum + value, 0) / bucket.conversionSpans.length
            : 0,
      }))
      .sort((a, b) => b.totalMembers - a.totalMembers);
  }, [data]);

  const displayedData = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term ? membershipData.filter((r) => r.membershipType.toLowerCase().includes(term)) : membershipData;
    if (!sortField) return base;
    return [...base].sort((a: any, b: any) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') return (aValue - bValue) * dir;
      return String(aValue ?? '').localeCompare(String(bValue ?? '')) * dir;
    });
  }, [membershipData, sortDirection, sortField, query]);

  const totals = useMemo<MembershipRow>(() => {
    const total = membershipData.reduce(
      (acc, row) => ({
        membershipType: 'TOTALS',
        totalMembers: acc.totalMembers + row.totalMembers,
        newMembers: acc.newMembers + row.newMembers,
        converted: acc.converted + row.converted,
        retained: acc.retained + row.retained,
        totalLTV: acc.totalLTV + row.totalLTV,
        totalVisits: acc.totalVisits + row.totalVisits,
        conversionSpans: [...acc.conversionSpans, ...row.conversionSpans],
        clients: [...acc.clients, ...row.clients],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgVisits: 0,
        avgConversionSpan: 0,
      }),
      {
        membershipType: 'TOTALS',
        totalMembers: 0,
        newMembers: 0,
        converted: 0,
        retained: 0,
        totalLTV: 0,
        totalVisits: 0,
        conversionSpans: [] as number[],
        clients: [] as NewClientData[],
        conversionRate: 0,
        retentionRate: 0,
        avgLTV: 0,
        avgVisits: 0,
        avgConversionSpan: 0,
      }
    );

    total.conversionRate = total.totalMembers > 0 ? (total.converted / total.totalMembers) * 100 : 0;
    total.retentionRate = total.totalMembers > 0 ? (total.retained / total.totalMembers) * 100 : 0;
    total.avgLTV = total.totalMembers > 0 ? total.totalLTV / total.totalMembers : 0;
    total.avgVisits = total.totalMembers > 0 ? total.totalVisits / total.totalMembers : 0;
    total.avgConversionSpan = total.conversionSpans.length > 0
      ? total.conversionSpans.reduce((sum, value) => sum + value, 0) / total.conversionSpans.length
      : 0;

    return total;
  }, [membershipData]);

  const handleExportCsv = () => {
    const cols = [
      { key: 'membershipType', header: 'Membership Type' },
      { key: 'totalMembers', header: 'Trials' },
      { key: 'newMembers', header: 'New Members' },
      { key: 'retained', header: 'Retained' },
      { key: 'retentionRate', header: 'Retention %' },
      { key: 'converted', header: 'Converted' },
      { key: 'conversionRate', header: 'Conversion %' },
      { key: 'avgLTV', header: 'Avg LTV' },
      { key: 'totalLTV', header: 'Total LTV' },
    ];
    const toRec = (r: MembershipRow): Record<string, unknown> => ({
      membershipType: r.membershipType, totalMembers: r.totalMembers,
      newMembers: r.newMembers, retained: r.retained, retentionRate: r.retentionRate,
      converted: r.converted, conversionRate: r.conversionRate,
      avgLTV: r.avgLTV, totalLTV: r.totalLTV,
    });
    downloadCsv(`${tableId}.csv`, cols, [...displayedData.map(toRec), { ...toRec(totals), membershipType: 'TOTALS' }]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleExpanded = (rowKey: string) => {
    setExpandedRows((current) =>
      current.includes(rowKey) ? current.filter((key) => key !== rowKey) : [...current, rowKey]
    );
  };

  return (
    <P57TableShell
      icon={Award}
      title="Memberships"
      description="Membership usage, access package preference, and revenue concentration. Expand a row for client-type detail; click any row for drill-down evidence."
      rowCount={displayedData.length}
      rowCountLabel="types"
      onSearch={setQuery}
      searchPlaceholder="Search memberships…"
      onExportCsv={handleExportCsv}
      meta={<span>{formatNumber(totals.totalMembers)} trials · {formatCurrency(totals.totalLTV)} total LTV</span>}
    >
        <div className="max-h-[560px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <P57SortTh sortKey="membershipType" activeKey={sortField ?? null} dir={sortDirection} onToggle={handleSort} className="sticky left-0 z-40 min-w-[320px]">Membership Type</P57SortTh>
                {[
                  ['totalMembers', 'Trials'],
                  ['newMembers', 'New Members'],
                  ['retained', 'Retained'],
                  ['retentionRate', 'Retention %'],
                  ['converted', 'Converted'],
                  ['conversionRate', 'Conversion %'],
                  ['avgLTV', 'Avg LTV'],
                  ['totalLTV', 'Total LTV'],
                ].map(([field, label]) => (
                  <P57SortTh
                    key={field}
                    sortKey={field}
                    activeKey={sortField ?? null}
                    dir={sortDirection}
                    onToggle={handleSort}
                    align={field === 'avgLTV' || field === 'totalLTV' ? 'right' : 'center'}
                  >
                    {label}
                  </P57SortTh>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((row) => {
                const isExpanded = expandedRows.includes(row.membershipType);
                const childRows = buildChildRows(row.clients);
                const topLocations = Array.from(new Set(row.clients.map((client) => client.homeLocation || client.firstVisitLocation).filter(Boolean))).slice(0, 3);

                return (
                  <React.Fragment key={row.membershipType}>
                    <TableRow className="cursor-pointer" onClick={() => onRowClick?.(row)}>
                      <TableCell className="sticky left-0 z-10 py-3">
                        <div className="flex items-center gap-3">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleExpanded(row.membershipType);
                            }}
                          >
                            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </Button>
                          <div>
                            <div className="font-semibold text-slate-900">{row.membershipType}</div>
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
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.totalMembers)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.newMembers)}</TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.retained)}</TableCell>
                      <TableCell className="text-center"><P57Badge tone="blue">{row.retentionRate.toFixed(1)}%</P57Badge></TableCell>
                      <TableCell className="text-center font-medium text-slate-900">{formatNumber(row.converted)}</TableCell>
                      <TableCell className="text-center"><P57Badge tone="green">{row.conversionRate.toFixed(1)}%</P57Badge></TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.avgLTV)}</TableCell>
                      <TableCell className="text-right font-medium text-slate-900">{formatCurrency(row.totalLTV)}</TableCell>
                    </TableRow>
                    {isExpanded && (childRows.length > 0 ? childRows.map((child) => (
                      <TableRow
                        key={`${row.membershipType}-${child.label}`}
                        className="cursor-pointer p57-group-row"
                        onClick={() => onRowClick?.({
                          membershipType: row.membershipType,
                          rowType: 'clientTypeChild',
                          label: child.label,
                          totalMembers: child.totalMembers,
                          newMembers: child.newMembers,
                          converted: child.converted,
                          retained: child.retained,
                          conversionRate: child.conversionRate,
                          retentionRate: child.retentionRate,
                          avgLTV: child.avgLTV,
                          totalLTV: child.totalLTV,
                          clients: child.clients, 
                        })}
                      >
                        <TableCell className="sticky left-0 z-10 py-2.5 pl-14">
                          <div className="flex items-start gap-3 text-sm text-slate-700">
                            <Layers3 className="mt-0.5 h-4 w-4 text-slate-400" />
                            <div>
                              <div className="font-semibold text-slate-900">{child.label}</div>
                              <div className="text-xs text-slate-500"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.totalMembers)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.newMembers)}</TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.retained)}</TableCell>
                        <TableCell className="text-center"><P57Badge tone="blue">{child.retentionRate.toFixed(1)}%</P57Badge></TableCell>
                        <TableCell className="text-center font-medium text-slate-900">{formatNumber(child.converted)}</TableCell>
                        <TableCell className="text-center"><P57Badge tone="green">{child.conversionRate.toFixed(1)}%</P57Badge></TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(child.avgLTV)}</TableCell>
                        <TableCell className="text-right font-medium text-slate-900">{formatCurrency(child.totalLTV)}</TableCell>
                      </TableRow>
                    )) : (
                      <TableRow className="bg-slate-50/70 hover:bg-slate-50/70">
                        <TableCell colSpan={9} className="px-6 py-4 text-sm text-slate-500">
                          No client-type detail available for this membership.
                        </TableCell>
                      </TableRow>
                    ))}
                  </React.Fragment>
                );
              })}
              <TableRow className={`${TABLE_STYLES.footer.row} cursor-pointer`} onClick={() => onRowClick?.(totals)}>
                <TableCell className={`${TABLE_STYLES.footer.cellSticky} ${TABLE_STYLES.footer.label} py-3`}>Totals</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.totalMembers)}</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.newMembers)}</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.retained)}</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{totals.retentionRate.toFixed(1)}%</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{formatNumber(totals.converted)}</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-center`}>{totals.conversionRate.toFixed(1)}%</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-right`}>{formatCurrency(totals.avgLTV)}</TableCell>
                <TableCell className={`${TABLE_STYLES.footer.cell} text-right`}>{formatCurrency(totals.totalLTV)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
    </P57TableShell>
  );
};

export default ClientConversionMembershipTable;
