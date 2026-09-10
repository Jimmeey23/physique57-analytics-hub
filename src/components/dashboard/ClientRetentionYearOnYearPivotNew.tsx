import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { TrendingUp } from 'lucide-react';
import { P57TableShell } from '@/components/ui/P57TableShell';
import { P57SortTh } from '@/components/ui/P57SortTh';
import { TABLE_STYLES } from '@/styles/tableStyles';
import { downloadCsv } from '@/utils/csvExport';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useMetricsTablesRegistry } from '@/contexts/MetricsTablesRegistryContext';
import { NewClientData } from '@/types/dashboard';
import { parseDate } from '@/utils/dateUtils';
import { isConverted, isNewClient, isRetained } from '@/utils/clientRetention';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { conversionRate as calcConversionRate, retentionRate as calcRetentionRate } from '@/utils/retentionRates';

type MetricKey =
  | 'trials'
  | 'newMembers'
  | 'converted'
  | 'retained'
  | 'retentionRate'
  | 'conversionRate'
  | 'avgLTV'
  | 'totalLTV'
  | 'avgConversionDays'
  | 'avgVisits';

const SELECT_CLASS =
  'h-[30px] rounded-[9px] border border-[#ececef] bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none transition-colors hover:border-slate-300 focus:border-blue-400 dark:border-[#2a2a2e] dark:bg-[#141416] dark:text-slate-200';

const METRIC_LABELS: Record<MetricKey, string> = {
  trials: 'Trials',
  newMembers: 'New Members',
  converted: 'Converted',
  retained: 'Retained',
  retentionRate: 'Retention %',
  conversionRate: 'Conversion %',
  avgLTV: 'Avg LTV',
  totalLTV: 'Total LTV',
  avgConversionDays: 'Avg Conv Days',
  avgVisits: 'Avg Visits',
};

type RowType = 'clientType' | 'membership';

interface Props {
  data: NewClientData[];
  months?: Array<{ key: string; display?: string; year: number; month: number }>;
  onRowClick?: (data: any) => void;
}

export const ClientRetentionYearOnYearPivot: React.FC<Props> = ({ data, months: providedMonths, onRowClick }) => {
  const [metric, setMetric] = useState<MetricKey>('trials');
  const [rowType, setRowType] = useState<RowType>('clientType');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'Client Retention YoY Pivot';
  
  const months = useMemo(() => {
    if (providedMonths && providedMonths.length > 0) {
      return providedMonths.map((month) => ({
        key: month.key,
        display: month.display || new Date(month.year, month.month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        year: month.year,
        month: month.month,
        monthName: new Date(month.year, month.month - 1, 1).toLocaleDateString('en-US', { month: 'short' })
      }));
    }

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const monthsArr: { key: string; display: string; year: number; month: number; monthName: string }[] = [];
    
    // Generate months from Jan to current month only
    for (let monthNum = 1; monthNum <= currentMonth; monthNum++) {
      const monthName = new Date(2024, monthNum - 1, 1).toLocaleDateString('en-US', { month: 'short' });
      
      // Add 2024 entry
      monthsArr.push({
        key: `2024-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} 2024`,
        year: 2024,
        month: monthNum,
        monthName: monthName
      });
      
      // Add 2025 entry
      monthsArr.push({
        key: `${currentYear}-${String(monthNum).padStart(2, '0')}`,
        display: `${monthName} ${currentYear}`,
        year: currentYear,
        month: monthNum,
        monthName: monthName
      });
    }
    return monthsArr;
  }, [providedMonths]);

  const comparisonYears = useMemo(() => {
    const years = Array.from(new Set(months.map((month) => month.year))).sort((a, b) => a - b);
    const latestYear = years[years.length - 1] ?? new Date().getFullYear();
    const baselineYear = years.length > 1 ? years[years.length - 2] : latestYear - 1;
    return { baselineYear, latestYear };
  }, [months]);

  const rowKeys = useMemo(() => {
    const set = new Set<string>();
    data.forEach(c => {
      const key = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      set.add(key);
    });
    return Array.from(set).sort((a, b) => {
      if (rowType === 'clientType') {
        const an = a.toLowerCase();
        const bn = b.toLowerCase();
        if (isNewClient(an) && !isNewClient(bn)) return -1;
        if (!isNewClient(an) && isNewClient(bn)) return 1;
      }
      return a.localeCompare(b);
    });
  }, [data, rowType]);

  const pivot = useMemo(() => {
    const initCell = () => ({ 
      trials: 0, 
      newMembers: 0, 
      converted: 0, 
      retained: 0, 
      totalLTV: 0, 
      conversionIntervals: [] as number[],
      visitsPostTrial: [] as number[],
      clients: [] as NewClientData[] // Store actual client data for drill-down
    });
    const map: Record<string, Record<string, any>> = {};
    
    rowKeys.forEach(rk => {
      map[rk] = {};
      months.forEach(m => {
        map[rk][m.key] = initCell();
      });
    });

    data.forEach(c => {
      const d = parseDate(c.firstVisitDate || '');
      if (!d) return;
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const dataKey = `${year}-${String(month).padStart(2, '0')}`;
      const rowKey = rowType === 'clientType' ? (c.isNew || 'Unknown') : (c.membershipUsed || 'Unknown');
      
      if (!map[rowKey]) return;
      const bucket = map[rowKey][dataKey];
      if (!bucket) return;
      
      bucket.trials += 1;
      if (isNewClient(c)) bucket.newMembers += 1;
      if (isConverted(c)) bucket.converted += 1;
      if (isRetained(c)) bucket.retained += 1;
      bucket.totalLTV += c.ltv || 0;
      bucket.clients.push(c); // Add client to bucket
      
      // Add conversion interval and visits tracking
      if (c.conversionSpan !== undefined && c.conversionSpan !== null) {
        bucket.conversionIntervals.push(c.conversionSpan);
      }
      if (c.visitsPostTrial !== undefined && c.visitsPostTrial !== null) {
        bucket.visitsPostTrial.push(c.visitsPostTrial);
      }
    });

    // Derived metrics
    rowKeys.forEach(rk => {
      months.forEach(m => {
        const b = map[rk][m.key];
        if (!b) return;
        b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
        b.conversionRate = calcConversionRate(b.converted, b.newMembers);
        b.retentionRate = calcRetentionRate(b.retained, b.newMembers);
        b.avgConversionDays = b.conversionIntervals.length > 0 
          ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
          : 0;
        b.avgVisits = b.visitsPostTrial.length > 0
          ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
          : 0;
      });
    });
    
    return map;
  }, [data, rowKeys, months, rowType]);

  const metricRaw = (cell: any): number => {
    if (!cell) return 0;
    switch (metric) {
      case 'trials': return cell.trials || 0;
      case 'newMembers': return cell.newMembers || 0;
      case 'converted': return cell.converted || 0;
      case 'retained': return cell.retained || 0;
      case 'retentionRate': return cell.retentionRate || 0;
      case 'conversionRate': return cell.conversionRate || 0;
      case 'avgLTV': return cell.avgLTV || 0;
      case 'totalLTV': return cell.totalLTV || 0;
      case 'avgConversionDays': return cell.avgConversionDays || 0;
      case 'avgVisits': return cell.avgVisits || 0;
    }
  };

  const rowLabel = rowType === 'clientType' ? 'Client Type' : 'Membership';

  const handleExportCsv = () => {
    downloadCsv(
      `${tableId} - ${METRIC_LABELS[metric]}.csv`,
      [{ key: 'row', header: rowLabel }, ...months.map((m: any) => ({ key: m.key, header: `${m.monthName} ${m.year}` }))],
      [
        ...sortedRowKeys.map((rk) => {
          const rec: Record<string, unknown> = { row: rk };
          months.forEach((m: any) => { rec[m.key] = metricRaw(pivot[rk]?.[m.key]); });
          return rec;
        }),
        (() => {
          const rec: Record<string, unknown> = { row: 'TOTALS' };
          months.forEach((m: any) => { rec[m.key] = metricRaw(totalsRow[m.key]); });
          return rec;
        })(),
      ]
    );
  };

  const sortedRowKeys = useMemo(() => {
    if (!sortColumn) return rowKeys;
    
    const sorted = [...rowKeys].sort((a, b) => {
      if (sortColumn === 'row') return a.localeCompare(b);
      
      const aData = pivot[a];
      const bData = pivot[b];
      if (!aData || !bData) return 0;
      
      const aCurr = aData[sortColumn];
      const bCurr = bData[sortColumn];
      if (!aCurr || !bCurr) return 0;
      
      let aVal = 0, bVal = 0;
      switch (metric) {
        case 'trials': aVal = aCurr.trials || 0; bVal = bCurr.trials || 0; break;
        case 'newMembers': aVal = aCurr.newMembers || 0; bVal = bCurr.newMembers || 0; break;
        case 'converted': aVal = aCurr.converted || 0; bVal = bCurr.converted || 0; break;
        case 'retained': aVal = aCurr.retained || 0; bVal = bCurr.retained || 0; break;
        case 'retentionRate': aVal = aCurr.retentionRate || 0; bVal = bCurr.retentionRate || 0; break;
        case 'conversionRate': aVal = aCurr.conversionRate || 0; bVal = bCurr.conversionRate || 0; break;
        case 'avgLTV': aVal = aCurr.avgLTV || 0; bVal = bCurr.avgLTV || 0; break;
        case 'totalLTV': aVal = aCurr.totalLTV || 0; bVal = bCurr.totalLTV || 0; break;
      }
      
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return sorted;
  }, [rowKeys, sortColumn, sortDir, pivot, metric]);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(col);
      setSortDir('desc');
    }
  };

  // Calculate totals
  const totalsRow = useMemo(() => {
    const totals: Record<string, any> = {};
    
    months.forEach(m => {
      totals[m.key] = { 
        trials: 0, 
        newMembers: 0, 
        converted: 0, 
        retained: 0, 
        totalLTV: 0,
        conversionIntervals: [] as number[],
        visitsPostTrial: [] as number[],
        clients: [] as NewClientData[]
      };
      
      rowKeys.forEach(rk => {
        const cell = pivot[rk]?.[m.key];
        
        if (cell) {
          totals[m.key].trials += cell.trials || 0;
          totals[m.key].newMembers += cell.newMembers || 0;
          totals[m.key].converted += cell.converted || 0;
          totals[m.key].retained += cell.retained || 0;
          totals[m.key].totalLTV += cell.totalLTV || 0;
          totals[m.key].conversionIntervals.push(...(cell.conversionIntervals || []));
          totals[m.key].visitsPostTrial.push(...(cell.visitsPostTrial || []));
          totals[m.key].clients.push(...(cell.clients || []));
        }
      });
      
      const b = totals[m.key];
      b.avgLTV = b.trials > 0 ? b.totalLTV / b.trials : 0;
      b.conversionRate = calcConversionRate(b.converted, b.newMembers);
      b.retentionRate = calcRetentionRate(b.retained, b.newMembers);
      b.avgConversionDays = b.conversionIntervals.length > 0 
        ? b.conversionIntervals.reduce((sum: number, val: number) => sum + val, 0) / b.conversionIntervals.length 
        : 0;
      b.avgVisits = b.visitsPostTrial.length > 0
        ? b.visitsPostTrial.reduce((sum: number, val: number) => sum + val, 0) / b.visitsPostTrial.length
        : 0;
    });
    
    return totals;
  }, [pivot, rowKeys, months]);

  // Multi-metric export across ALL metrics & months for both previous and current year
  const generateAllTabsContent = useCallback(() => {
    const sections: string[] = [];
    sections.push(`${tableId} - All Metrics Export`);
    sections.push(`Exported on ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`);
    sections.push(`Row Mode: ${rowType}`);
    sections.push('');

    const metricKeys = Object.keys(METRIC_LABELS) as MetricKey[];
    const formatVal = (mk: MetricKey, cell: any) => {
      switch (mk) {
        case 'trials': return formatNumber(cell?.trials || 0);
        case 'newMembers': return formatNumber(cell?.newMembers || 0);
        case 'converted': return formatNumber(cell?.converted || 0);
        case 'retained': return formatNumber(cell?.retained || 0);
        case 'retentionRate': return `${(cell?.retentionRate || 0).toFixed(1)}%`;
        case 'conversionRate': return `${(cell?.conversionRate || 0).toFixed(1)}%`;
        case 'avgLTV': return formatCurrency(cell?.avgLTV || 0);
        case 'totalLTV': return formatCurrency(cell?.totalLTV || 0);
        case 'avgConversionDays': return `${Math.round(cell?.avgConversionDays || 0)}`;
        case 'avgVisits': return `${(cell?.avgVisits || 0).toFixed(1)}`;
      }
    };

    metricKeys.forEach(mk => {
      sections.push(`\n${METRIC_LABELS[mk].toUpperCase()}`);
      const headers = [rowType === 'clientType' ? 'Client Type' : 'Membership'];
      months.forEach(m => headers.push(m.display));
      sections.push(headers.join('\t'));
      sections.push(headers.map(() => '---').join('\t'));

      rowKeys.forEach(rk => {
        const row: string[] = [rk];
        months.forEach(m => {
          const cell = pivot[rk]?.[m.key];
          row.push(formatVal(mk, cell) as string);
        });
        sections.push(row.join('\t'));
      });

      // Totals row
      const totalRow: string[] = ['TOTALS'];
      months.forEach(m => {
        const cell = totalsRow[m.key];
        totalRow.push(formatVal(mk, cell) as string);
      });
      sections.push(totalRow.join('\t'));
    });

    return sections.join('\n');
  }, [pivot, rowKeys, months, totalsRow, rowType, tableId]);

  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      let text = `${tableId}\nMetric: ${METRIC_LABELS[metric]} | Rows: ${rowType}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(h => headers.push((h.textContent || '').trim().replace(/Prev \| Curr/i, '').trim()));
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(r => {
        const cells = r.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, metric, rowType, pivot, sortedRowKeys]);

  return (
    <div ref={containerRef}>
      <P57TableShell
        icon={TrendingUp}
        title="Year on Year"
        description="Year comparison across all reporting months. Studio and client filters apply; the date range is ignored. Click any cell for supporting client evidence."
        rowCount={sortedRowKeys.length}
        rowCountLabel="rows"
        onExportCsv={handleExportCsv}
        actions={
          <>
            <div className="flex items-center gap-1 rounded-[10px] border border-[#ececef] bg-[#f6f7f9] p-[3px] dark:border-[#2a2a2e] dark:bg-[#141416]" role="group" aria-label="Row grouping">
              {([['clientType', 'Client Type'], ['membership', 'Membership']] as const).map(([v, label]) => (
                <button key={v} type="button" onClick={() => setRowType(v)} aria-pressed={rowType === v}
                  className={rowType === v ? 'rounded-[7px] bg-slate-900 px-2.5 py-1 text-[12px] font-bold text-white shadow-sm dark:bg-white dark:text-slate-900' : 'rounded-[7px] px-2.5 py-1 text-[12px] font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'}>
                  {label}
                </button>
              ))}
            </div>
            <select value={metric} onChange={(e) => setMetric(e.target.value as MetricKey)} className={SELECT_CLASS} aria-label="Metric">
              {(Object.keys(METRIC_LABELS) as MetricKey[]).map((k) => (
                <option key={k} value={k}>{METRIC_LABELS[k]}</option>
              ))}
            </select>
            <CopyTableButton tableRef={containerRef as any} tableName={tableId} size="sm" onCopyAllTabs={async () => generateAllTabsContent()} />
          </>
        }
        meta={<span>{comparisonYears.baselineYear} vs {comparisonYears.latestYear} · {rowLabel} · {METRIC_LABELS[metric]}</span>}
      >
        <div className="max-h-[560px] overflow-auto" data-table="client-retention-yoy-pivot" data-table-name={tableId}>
          <table className="min-w-full relative" data-table="client-retention-yoy-pivot" data-table-name={tableId}>
            <thead>
              <tr>
                <P57SortTh sortKey="row" activeKey={sortColumn} dir={sortDir} onToggle={handleSort} className="sticky left-0 z-40 min-w-[300px]">
                  {rowLabel}
                </P57SortTh>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  return (
                    <P57SortTh
                      key={m.key}
                      sortKey={m.key}
                      activeKey={sortColumn}
                      dir={sortDir}
                      onToggle={handleSort}
                      align="center"
                      className={`min-w-[90px] ${
                        isFirstOfGroup ? 'border-l border-slate-300' : ''
                      } ${
                        isLastOfGroup ? 'border-r border-slate-300' : ''
                      }`}
                    >
                      <span className="flex flex-col items-center leading-tight">
                        <span>{m.monthName}</span>
                        <span className="text-[10px] font-semibold normal-case tracking-normal text-slate-400">{m.year}</span>
                      </span>
                    </P57SortTh>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {sortedRowKeys.map((rk) => (
                <tr 
                  key={rk} 
                  className="cursor-pointer"
                  onClick={() => {
                    // Aggregate clients from all months for this row
                    const allClients = months.flatMap(m => pivot[rk]?.[m.key]?.clients || []);
                    onRowClick?.({ 
                      rowKey: rk, 
                      rowType, 
                      data: pivot[rk], 
                      metric,
                      clients: allClients
                    });
                  }}
                >
                  <td className="sticky left-0 z-20 px-4 py-2 text-sm font-semibold">
                    {rk}
                  </td>
                  {months.map((m, index) => {
                    const prevMonth = index > 0 ? months[index - 1] : null;
                    const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                    
                    const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                    const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                    
                    const cellData = pivot[rk]?.[m.key];
                    
                    return (
                      <td 
                        key={m.key} 
                        className={`px-2 py-2 text-center text-sm tabular-nums ${
                          isFirstOfGroup ? 'border-l border-slate-200' : 'border-l'
                        } ${
                          isLastOfGroup ? 'border-r border-slate-200' : ''
                        }`}
                        onClick={(e) => {
                          // Allow clicking individual cells for month-specific drill-down
                          e.stopPropagation();
                          const clients = cellData?.clients || [];
                          onRowClick?.({ 
                            rowKey: rk, 
                            rowType,
                            month: m.month,
                            year: m.year,
                            data: cellData,
                            metric,
                            clients: clients
                          });
                        }}
                      >
                        {(() => {
                          const val = cellData || {};
                          switch (metric) {
                            case 'trials': return formatNumber(val.trials || 0);
                            case 'newMembers': return formatNumber(val.newMembers || 0);
                            case 'converted': return formatNumber(val.converted || 0);
                            case 'retained': return formatNumber(val.retained || 0);
                            case 'conversionRate': return `${(val.conversionRate || 0).toFixed(1)}%`;
                            case 'retentionRate': return `${(val.retentionRate || 0).toFixed(1)}%`;
                            case 'avgLTV': return formatCurrency(val.avgLTV || 0);
                            case 'totalLTV': return formatCurrency(val.totalLTV || 0);
                            case 'avgConversionDays': return `${(val.avgConversionDays || 0).toFixed(0)}`;
                            case 'avgVisits': return `${(val.avgVisits || 0).toFixed(1)}`;
                          }
                        })()}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Totals Row */}
              <tr className={TABLE_STYLES.footer.row}>
                <td className={`${TABLE_STYLES.footer.cellSticky} ${TABLE_STYLES.footer.label} px-4 py-2`}>Totals</td>
                {months.map((m, index) => {
                  const prevMonth = index > 0 ? months[index - 1] : null;
                  const nextMonth = index < months.length - 1 ? months[index + 1] : null;
                  
                  const isFirstOfGroup = !prevMonth || prevMonth.month !== m.month;
                  const isLastOfGroup = !nextMonth || nextMonth.month !== m.month;
                  
                  const cellData = totalsRow[m.key];
                  
                  return (
                    <td 
                      key={m.key} 
                      className={`${TABLE_STYLES.footer.cell} cursor-pointer text-center ${
                        isFirstOfGroup ? 'border-l border-white/20' : 'border-l border-white/10'
                      } ${
                        isLastOfGroup ? 'border-r border-white/20' : ''
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const clients = cellData?.clients || [];
                        onRowClick?.({ 
                          rowKey: 'TOTALS', 
                          rowType,
                          month: m.month,
                          year: m.year,
                          data: cellData,
                          metric,
                          clients: clients
                        });
                      }}
                    >
                      {(() => {
                        const val = cellData || {};
                        switch (metric) {
                          case 'trials': return formatNumber(val.trials || 0);
                          case 'newMembers': return formatNumber(val.newMembers || 0);
                          case 'converted': return formatNumber(val.converted || 0);
                          case 'retained': return formatNumber(val.retained || 0);
                          case 'conversionRate': return `${(val.conversionRate || 0).toFixed(1)}%`;
                          case 'retentionRate': return `${(val.retentionRate || 0).toFixed(1)}%`;
                          case 'avgLTV': return formatCurrency(val.avgLTV || 0);
                          case 'totalLTV': return formatCurrency(val.totalLTV || 0);
                          case 'avgConversionDays': return `${(val.avgConversionDays || 0).toFixed(0)}`;
                          case 'avgVisits': return `${(val.avgVisits || 0).toFixed(1)}`;
                        }
                      })()}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </P57TableShell>
    </div>
  );
};

export default ClientRetentionYearOnYearPivot;
