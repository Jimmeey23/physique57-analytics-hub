 
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { NewClientData } from '@/types/dashboard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { getTableHeaderClasses } from '@/utils/colorThemes';
import { parseDate } from '@/utils/dateUtils';
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
  visitsSummary?: Record<string, number>; // e.g., "Jan 2024" -> 450
  onRowClick?: (row: any) => void;
}

interface MonthlyStats {
  month: string;
  sortKey: string;
  type: string;
  visits: number;
  totalTrials: number;
  newMembers: number;
  converted: number;
  retained: number;
  totalLTV: number;
  conversionIntervals: number[];
  visitsPostTrial: number[];
  clients: NewClientData[];
}

export const ClientConversionMonthOnMonthByTypeTable: React.FC<ClientConversionMonthOnMonthByTypeTableProps> = ({
  data,
  checkins,
  visitsSummary,
  onRowClick
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const registry = useMetricsTablesRegistry();
  const tableId = 'Client Conversion MoM by Type';

  const [sortField, setSortField] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const monthlyDataByType = useMemo(() => {
    if (!data || data.length === 0) return [] as MonthlyStats[];

    const monthlyStats: Record<string, MonthlyStats> = {};
    data.forEach(client => {
      const date = parseDate(client.firstVisitDate || '');
      if (!date) return;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      const clientType = client.isNew || 'Unknown';

      const key = `${monthKey}-${clientType}`;
      if (!monthlyStats[key]) {
        const [y, m] = monthKey.split('-');
        const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        const summaryKey = `${monthNames[parseInt(m)-1]} ${y}`;
        const visits = visitsSummary?.[summaryKey] || 0;
        monthlyStats[key] = {
          month: monthName,
          sortKey: monthKey,
          type: clientType,
          visits,
          totalTrials: 0,
          newMembers: 0,
          converted: 0,
          retained: 0,
          totalLTV: 0,
          conversionIntervals: [],
          visitsPostTrial: [],
          clients: []
        };
      }
      const stat = monthlyStats[key];
      stat.totalTrials++;
      stat.clients.push(client);

      const isNewValue = (client.isNew || '').toLowerCase();
      if (isNewValue.includes('new')) {
        stat.newMembers++;
      }
      if (client.conversionStatus === 'Converted') {
        stat.converted++;
      }
      if (client.retentionStatus === 'Retained') {
        stat.retained++;
      }
      stat.totalLTV += client.ltv || 0;
      if (client.conversionSpan && client.conversionSpan > 0) {
        stat.conversionIntervals.push(client.conversionSpan);
      }
      if (client.visitsPostTrial && client.visitsPostTrial > 0) {
        stat.visitsPostTrial.push(client.visitsPostTrial);
      }
    });

    return Object.values(monthlyStats).sort((a, b) => {
      const monthCompare = a.sortKey.localeCompare(b.sortKey);
      if (monthCompare !== 0) return monthCompare;
      if (a.type.toLowerCase().includes('new') && !b.type.toLowerCase().includes('new')) return -1;
      if (!a.type.toLowerCase().includes('new') && b.type.toLowerCase().includes('new')) return 1;
      return a.type.localeCompare(b.type);
    });
  }, [data, checkins, visitsSummary]);

  const tableData = useMemo(() => {
    return monthlyDataByType.map(stat => {
      const conversionRate = stat.newMembers > 0 ? (stat.converted / stat.newMembers) * 100 : 0;
      const retentionRate = stat.newMembers > 0 ? (stat.retained / stat.newMembers) * 100 : 0;
      const avgLTV = stat.totalTrials > 0 ? stat.totalLTV / stat.totalTrials : 0;
      const avgConversionDays = stat.conversionIntervals.length > 0 ? stat.conversionIntervals.reduce((sum, interval) => sum + interval, 0) / stat.conversionIntervals.length : 0;
      const avgVisits = stat.visitsPostTrial.length > 0 ? stat.visitsPostTrial.reduce((sum, visits) => sum + visits, 0) / stat.visitsPostTrial.length : 0;
      return { ...stat, conversionRate, retentionRate, avgLTV, avgConversionDays, avgVisits };
    });
  }, [monthlyDataByType]);

  const displayedData = useMemo(() => {
    if (!sortField) return tableData;
    const arr = [...tableData];
    return arr.sort((a: any, b: any) => {
      const av = a[sortField as any];
      const bv = b[sortField as any];
      const dir = sortDirection === 'asc' ? 1 : -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir;
      return String(av ?? '').localeCompare(String(bv ?? '')) * dir;
    });
  }, [tableData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('desc'); }
  };

  const totals = useMemo(() => {
    return tableData.reduce((acc, row) => ({
      visits: acc.visits + (row.visits || 0),
      totalTrials: acc.totalTrials + row.totalTrials,
      newMembers: acc.newMembers + row.newMembers,
      converted: acc.converted + row.converted,
      retained: acc.retained + row.retained,
      totalLTV: acc.totalLTV + row.totalLTV,
      conversionIntervals: [...acc.conversionIntervals, ...row.conversionIntervals],
      visitsPostTrial: [...acc.visitsPostTrial, ...row.visitsPostTrial]
    }), {
      visits: 0,
      totalTrials: 0,
      newMembers: 0,
      converted: 0,
      retained: 0,
      totalLTV: 0,
      conversionIntervals: [] as number[],
      visitsPostTrial: [] as number[]
    });
  }, [tableData]);

  const totalsRow = useMemo(() => {
    const conversionRate = totals.newMembers > 0 ? (totals.converted / totals.newMembers) * 100 : 0;
    const retentionRate = totals.newMembers > 0 ? (totals.retained / totals.newMembers) * 100 : 0;
    const avgLTV = totals.totalTrials > 0 ? totals.totalLTV / totals.totalTrials : 0;
    const avgConversionDays = totals.conversionIntervals.length > 0 ? totals.conversionIntervals.reduce((sum, interval) => sum + interval, 0) / totals.conversionIntervals.length : 0;
    const avgVisits = totals.visitsPostTrial.length > 0 ? totals.visitsPostTrial.reduce((sum, visits) => sum + visits, 0) / totals.visitsPostTrial.length : 0;
    return {
      month: 'TOTALS',
      type: 'All Types',
      visits: totals.visits,
      totalTrials: totals.totalTrials,
      newMembers: totals.newMembers,
      converted: totals.converted,
      retained: totals.retained,
      conversionRate,
      retentionRate,
      avgLTV,
      totalLTV: totals.totalLTV,
      avgConversionDays,
      avgVisits
    };
  }, [totals]);

  // Registry integration for copy-all-tabs
  useEffect(() => {
    if (!registry) return;
    const el = containerRef.current;
    if (!el) return;
    const getTextContent = () => {
      const table = el.querySelector('table');
      if (!table) return `${tableId} (No Data)`;
      let text = `${tableId}\n`;
      const headerCells = table.querySelectorAll('thead th');
      const headers: string[] = [];
      headerCells.forEach(cell => headers.push((cell.textContent || '').trim()));
      if (headers.length) {
        text += headers.join('\t') + '\n';
        text += headers.map(() => '---').join('\t') + '\n';
      }
      const rows = table.querySelectorAll('tbody tr');
      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowData: string[] = [];
        cells.forEach(c => rowData.push((c.textContent || '').trim()));
        if (rowData.length) text += rowData.join('\t') + '\n';
      });
      return text.trim();
    };
    registry.register({ id: tableId, getTextContent });
    return () => registry.unregister(tableId);
  }, [registry, tableData]);

  return (
    <Card ref={containerRef} className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-800 to-purple-900 text-white pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2 w-full">
          <Calendar className="w-5 h-5" />
          Month-on-Month Analysis by Client Type
          <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-white/30">
            {monthlyDataByType.length} Entries
          </Badge>
          <div className="ml-auto">
            <CopyTableButton
              tableRef={containerRef as any}
              tableName={tableId}
              size="sm"
              onCopyAllTabs={registry ? async () => registry.getAllTabsContent() : undefined}
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px]">
          <Table className="w-full">
            <TableHeader className="sticky top-0 z-20">
              <TableRow className={`border-b h-12 ${getTableHeaderClasses('retention')}`}>
                <TableHead onClick={() => handleSort('month')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-4 sticky left-0 z-10 min-w-[100px]">Month</TableHead>
                <TableHead onClick={() => handleSort('type')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Type</TableHead>
                <TableHead onClick={() => handleSort('totalTrials')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Trials</TableHead>
                <TableHead onClick={() => handleSort('newMembers')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[90px]">New Members</TableHead>
                <TableHead onClick={() => handleSort('retained')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Retained</TableHead>
                <TableHead onClick={() => handleSort('retentionRate')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Retention %</TableHead>
                <TableHead onClick={() => handleSort('converted')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Converted</TableHead>
                <TableHead onClick={() => handleSort('conversionRate')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Conversion %</TableHead>
                <TableHead onClick={() => handleSort('avgLTV')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Avg LTV</TableHead>
                <TableHead onClick={() => handleSort('totalLTV')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Total LTV</TableHead>
                <TableHead onClick={() => handleSort('avgConversionDays')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Avg Conv Days</TableHead>
                <TableHead onClick={() => handleSort('avgVisits')} className="cursor-pointer hover:bg-white/10 transition-colors font-bold text-white text-xs px-3 text-center min-w-[80px]">Avg Visits</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedData.map((row) => (
                <TableRow
                  key={`${row.month}-${row.type}`}
                  className="hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 h-10"
                  onClick={() => onRowClick?.(row)}
                >
                  <TableCell className="text-xs px-4 sticky left-0 bg-slate-100 z-10 border-r">
                    <span className="text-sm font-medium text-slate-900">{row.month}</span>
                  </TableCell>
                  <TableCell className="text-xs px-3 text-left">
                    <span className="text-sm font-medium text-slate-900">{row.type}</span>
                  </TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{formatNumber(row.totalTrials)}</TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{formatNumber(row.newMembers)}</TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{formatNumber(row.retained)}</TableCell>
                  <TableCell className="text-xs px-3 text-center">
                    <span className="text-sm font-medium text-slate-900">{row.retentionRate.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{formatNumber(row.converted)}</TableCell>
                  <TableCell className="text-xs px-3 text-center">
                    <span className="text-sm font-medium text-slate-900">{row.conversionRate.toFixed(1)}%</span>
                  </TableCell>
                  <TableCell className="text-xs px-3 text-right font-medium text-slate-900">{formatCurrency(row.avgLTV)}</TableCell>
                  <TableCell className="text-xs px-3 text-right font-medium text-slate-900">{formatCurrency(row.totalLTV)}</TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{row.avgConversionDays.toFixed(0)} days</TableCell>
                  <TableCell className="text-xs px-3 text-center font-medium text-slate-900">{row.avgVisits.toFixed(1)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="border-t-4 border-gray-800 text-gray-900">
                <TableCell className="border-t-4 border-gray-800 text-gray-900">{totalsRow.month}</TableCell>
                <TableCell className="text-xs px-3 text-center">
                  <Badge variant="outline" className="text-xs font-bold">
                    {totalsRow.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{formatNumber(totalsRow.totalTrials)}</TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{formatNumber(totalsRow.newMembers)}</TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{formatNumber(totalsRow.retained)}</TableCell>
                <TableCell className="text-xs px-3 text-center">
                  <span className={`font-bold ${totalsRow.retentionRate >= 70 ? 'text-green-600' : totalsRow.retentionRate >= 50 ? 'text-orange-600' : 'text-red-600'}`}>{totalsRow.retentionRate.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{formatNumber(totalsRow.converted)}</TableCell>
                <TableCell className="text-xs px-3 text-center">
                  <span className={`font-bold ${totalsRow.conversionRate >= 50 ? 'text-green-600' : totalsRow.conversionRate >= 30 ? 'text-orange-600' : 'text-red-600'}`}>{totalsRow.conversionRate.toFixed(1)}%</span>
                </TableCell>
                <TableCell className="text-xs px-3 text-right font-bold text-emerald-600">{formatCurrency(totalsRow.avgLTV)}</TableCell>
                <TableCell className="text-xs px-3 text-right font-bold text-green-600">{formatCurrency(totalsRow.totalLTV)}</TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{totalsRow.avgConversionDays.toFixed(0)} days</TableCell>
                <TableCell className="text-xs px-3 text-center font-bold">{totalsRow.avgVisits.toFixed(1)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};