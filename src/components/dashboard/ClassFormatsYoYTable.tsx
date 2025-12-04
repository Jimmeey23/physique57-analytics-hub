import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import CopyTableButton from '@/components/ui/CopyTableButton';
import { useRegisterTableForCopy } from '@/hooks/useRegisterTableForCopy';

type Canonical = 'powercycle' | 'barre' | 'strength' | 'other';

const toCanonical = (s?: string) => {
  const t = (s || '').toLowerCase();
  if (/power|cycle/.test(t)) return 'powercycle' as const;
  if (/barre/.test(t)) return 'barre' as const;
  if (/strength/.test(t)) return 'strength' as const;
  return 'other' as const;
};

interface ClassFormatsYoYTableProps {
  sessions: SessionData[];
  checkins: any[]; // raw checkins rows
}

export const ClassFormatsYoYTable: React.FC<ClassFormatsYoYTableProps> = ({ sessions, checkins }) => {
  const [metric, setMetric] = useState<'sessions' | 'checkins' | 'revenue' | 'fillRate' | 'lateCancelled'>('sessions');
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const { getAllTabsText } = useRegisterTableForCopy(tableContainerRef as any, 'Year-on-Year Comparison');

  const years = useMemo(() => {
    const parseYear = (input?: string): string | null => {
      if (!input) return null;
      const s = String(input);
      if (s.includes('/')) {
        const parts = s.split('/');
        if (parts.length >= 3) return parts[2].slice(0,4);
      } else if (/^\d{4}/.test(s)) {
        return s.slice(0,4);
      } else {
        const d = new Date(s);
        if (!isNaN(d.getTime())) return String(d.getFullYear());
      }
      return null;
    };
    const set = new Set<string>();
    sessions.forEach(s => {
      const y = parseYear(s.date);
      if (y) set.add(y);
    });
    checkins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const y = parseYear(typeof d === 'string' ? d : undefined);
      if (y) set.add(y);
    });
    const arr = Array.from(set);
    arr.sort();
    // keep last 4 years for readability
    return arr.slice(-4);
  }, [sessions, checkins]);

  const byYear = useMemo(() => {
    const result: Record<string, Record<Canonical, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }>> = {};
    years.forEach(y => {
      result[y] = {
        powercycle: { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 },
        barre: { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 },
        strength: { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 },
        other: { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 },
      };
    });

    const isTrueish = (val: any): boolean => {
      const s = String(val ?? '').trim().toLowerCase();
      return s === 'true' || s === 'yes' || s === '1';
    };

    const sessionAgg: Record<string, Record<Canonical, { checkins: number; revenue: number; late: number }>> = {};
    years.forEach(y => {
      sessionAgg[y] = {
        powercycle: { checkins: 0, revenue: 0, late: 0 },
        barre: { checkins: 0, revenue: 0, late: 0 },
        strength: { checkins: 0, revenue: 0, late: 0 },
        other: { checkins: 0, revenue: 0, late: 0 },
      };
    });

    sessions.forEach(s => {
      const y = (s.date ? String(s.date).slice(0,4) : undefined);
      if (!y || !result[y]) return;
      const f = toCanonical(s.cleanedClass || s.classType);
      if (!result[y][f]) return;
      result[y][f].sessions += 1;
      result[y][f].capacity += s.capacity || 0;
      sessionAgg[y][f].checkins += s.checkedInCount || 0;
      sessionAgg[y][f].revenue += s.totalPaid || s.revenue || 0;
      sessionAgg[y][f].late += s.lateCancelledCount || 0;
    });

    checkins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const y = typeof d === 'string' ? (d.includes('/') ? d.split('/')[2].slice(0,4) : d.slice(0,4)) : undefined;
      if (!y || !result[y]) return;
      const f = toCanonical(c.cleanedClass || c['Cleaned Class']);
      if (!result[y][f]) return;
      const checkedIn = isTrueish(c.checkedIn ?? c['Checked In'] ?? c['Checked in']);
      const late = isTrueish(c.isLateCancelled ?? c['Is Late Cancelled']);
      const paid = Number(c.paidAmount ?? c['Paid'] ?? 0) || 0;
      if (checkedIn) result[y][f].checkins += 1;
      if (late) result[y][f].late += 1;
      result[y][f].revenue += paid;
    });

    years.forEach(y => {
      (['powercycle','barre','strength','other'] as Canonical[]).forEach(fmt => {
        if (result[y][fmt].checkins === 0 && sessionAgg[y][fmt].checkins > 0) {
          result[y][fmt].checkins = sessionAgg[y][fmt].checkins;
        }
        if (result[y][fmt].revenue === 0 && sessionAgg[y][fmt].revenue > 0) {
          result[y][fmt].revenue = sessionAgg[y][fmt].revenue;
        }
        if (result[y][fmt].late === 0 && sessionAgg[y][fmt].late > 0) {
          result[y][fmt].late = sessionAgg[y][fmt].late;
        }
      });
    });

    return result;
  }, [sessions, checkins, years]);

  const renderValue = (y: string, f: Canonical) => {
    const row = byYear[y]?.[f];
    if (!row) return '-';
    switch (metric) {
      case 'sessions': return formatNumber(row.sessions);
      case 'checkins': return formatNumber(row.checkins);
      case 'revenue': return formatCurrency(row.revenue);
      case 'lateCancelled': return formatNumber(row.late);
      case 'fillRate': {
        const pct = row.capacity > 0 ? (row.checkins / row.capacity) * 100 : 0;
        return `${pct.toFixed(1)}%`;
      }
    }
  };

  const valueForCalc = (y: string, f: Canonical) => {
    const row = byYear[y]?.[f];
    if (!row) return 0;
    switch (metric) {
      case 'sessions': return row.sessions;
      case 'checkins': return row.checkins;
      case 'revenue': return row.revenue;
      case 'lateCancelled': return row.late;
      case 'fillRate': return row.capacity > 0 ? (row.checkins / row.capacity) * 100 : 0;
    }
  };

  const formatDelta = (delta: number, isPctPoints = false) => {
    const sign = delta > 0 ? '+' : delta < 0 ? '' : '';
    if (isPctPoints) return `${sign}${delta.toFixed(1)}pp`;
    return `${sign}${delta.toFixed(1)}%`;
  };

  const computeYoYDelta = (f: Canonical) => {
    if (years.length < 2) return '-';
    const last = years[years.length - 1];
    const prev = years[years.length - 2];
    if (metric === 'fillRate') {
      const d = valueForCalc(last, f) - valueForCalc(prev, f);
      return formatDelta(d, true);
    } else {
      const vPrev = valueForCalc(prev, f);
      const vLast = valueForCalc(last, f);
      if (!vPrev) return '-';
      const change = ((vLast - vPrev) / vPrev) * 100;
      return formatDelta(change);
    }
  };

  // Totals per year across formats
  const totalsByYear = useMemo(() => {
    const totals: Record<string, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }>= {};
    years.forEach(y => {
      const t = { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 };
      (['powercycle','barre','strength','other'] as Canonical[]).forEach(fmt => {
        const r = byYear[y]?.[fmt];
        if (!r) return;
        t.sessions += r.sessions;
        t.checkins += r.checkins;
        t.capacity += r.capacity;
        t.revenue += r.revenue;
        t.late += r.late;
      });
      totals[y] = t;
    });
    return totals;
  }, [byYear, years]);

  const renderTotalValue = (y: string) => {
    const t = totalsByYear[y];
    if (!t) return '-';
    switch (metric) {
      case 'sessions': return formatNumber(t.sessions);
      case 'checkins': return formatNumber(t.checkins);
      case 'revenue': return formatCurrency(t.revenue);
      case 'lateCancelled': return formatNumber(t.late);
      case 'fillRate': {
        const pct = t.capacity > 0 ? (t.checkins / t.capacity) * 100 : 0;
        return `${pct.toFixed(1)}%`;
      }
    }
  };

  const computeTotalsYoYDelta = () => {
    if (years.length < 2) return '-';
    const last = years[years.length - 1];
    const prev = years[years.length - 2];
    if (metric === 'fillRate') {
      const tLast = totalsByYear[last];
      const tPrev = totalsByYear[prev];
      if (!tLast || !tPrev) return '-';
      const vLast = tLast.capacity > 0 ? (tLast.checkins / tLast.capacity) * 100 : 0;
      const vPrev = tPrev.capacity > 0 ? (tPrev.checkins / tPrev.capacity) * 100 : 0;
      return formatDelta(vLast - vPrev, true);
    } else {
      const vPrev = valueForCalc(prev, 'powercycle') + valueForCalc(prev, 'barre') + valueForCalc(prev, 'strength') + valueForCalc(prev, 'other');
      const vLast = valueForCalc(last, 'powercycle') + valueForCalc(last, 'barre') + valueForCalc(last, 'strength') + valueForCalc(last, 'other');
      if (!vPrev) return '-';
      const change = ((vLast - vPrev) / vPrev) * 100;
      return formatDelta(change);
    }
  };

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">Year-on-Year Comparison</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Metric</span>
          <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
            <SelectTrigger className="h-8 w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sessions">Sessions Taught</SelectItem>
              <SelectItem value="checkins">Check-ins</SelectItem>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="lateCancelled">Late Cancelled</SelectItem>
              <SelectItem value="fillRate">Fill Rate</SelectItem>
            </SelectContent>
          </Select>
          <CopyTableButton 
            tableRef={tableContainerRef as any}
            tableName="Year-on-Year Comparison"
            size="sm"
            onCopyAllTabs={async () => getAllTabsText()}
          />
        </div>
      </CardHeader>
      <CardContent ref={tableContainerRef as any}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Format / Year</TableHead>
              {years.map((y, idx) => (
                <TableHead key={idx} className="text-right">{y}</TableHead>
              ))}
              <TableHead className="text-right">YoY Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(['powercycle','barre','strength'] as Canonical[]).map(fmt => (
              <TableRow key={fmt}>
                <TableCell className="font-medium capitalize">{fmt === 'powercycle' ? 'PowerCycle' : fmt}</TableCell>
                {years.map((y, idx) => (
                  <TableCell key={idx} className="text-right">{renderValue(y, fmt)}</TableCell>
                ))}
                <TableCell className="text-right">{computeYoYDelta(fmt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold text-white">All Formats</TableCell>
              {years.map((y, idx) => (
                <TableCell key={idx} className="text-right text-white">{renderTotalValue(y)}</TableCell>
              ))}
              <TableCell className="text-right text-white">{computeTotalsYoYDelta()}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClassFormatsYoYTable;
