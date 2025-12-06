import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';

type Canonical = 'powercycle' | 'barre' | 'strength' | 'other';

const toCanonical = (s?: string) => {
  const t = (s || '').toLowerCase();
  if (/power|cycle/.test(t)) return 'powercycle' as const;
  if (/barre/.test(t)) return 'barre' as const;
  if (/strength/.test(t)) return 'strength' as const;
  return 'other' as const;
};

interface ClassFormatsMoMTableProps {
  sessions: SessionData[];
  checkins: any[]; // raw checkins rows
  onDrillDown?: (data: { format: string; month: string; metric: string; value: number }) => void;
}

export const ClassFormatsMoMTable: React.FC<ClassFormatsMoMTableProps> = ({ sessions, checkins, onDrillDown }) => {
  const [metric, setMetric] = useState<'sessions' | 'checkins' | 'revenue' | 'fillRate' | 'lateCancelled'>('sessions');

  const handleCellClick = (format: string, month: string, value: number) => {
    if (onDrillDown) {
      onDrillDown({
        format,
        month,
        metric,
        value
      });
    }
  };

  const toYYYYMM = (input?: string): string | null => {
    if (!input) return null;
    const s = String(input);
    if (s.includes('/')) {
      // assume DD/MM/YYYY
      const parts = s.split('/');
      if (parts.length >= 3) {
        const dd = parseInt(parts[0]);
        const mm = parseInt(parts[1]);
        const yyyy = parseInt(parts[2]);
        if (!isNaN(yyyy) && !isNaN(mm) && !isNaN(dd)) {
          const d = new Date(yyyy, mm - 1, dd);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            return `${y}-${m}`;
          }
        }
      }
    } else {
      // try ISO-like
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}`;
      }
      // if looks like YYYY-MM-DD or YYYY-MM, slice(0,7)
      if (/^\d{4}-\d{2}/.test(s)) return s.slice(0,7);
    }
    return null;
  };

  const months = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach(s => {
      const ym = toYYYYMM(s.date);
      if (ym) set.add(ym);
    });
    checkins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const ym = toYYYYMM(typeof d === 'string' ? d : undefined);
      if (ym) set.add(ym);
    });
    const arr = Array.from(set);
    arr.sort();
    return arr.slice(-6);
  }, [sessions, checkins]);

  const byMonth = useMemo(() => {
    const result: Record<string, Record<Canonical, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }>> = {};
    months.forEach(m => {
      result[m] = {
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

    // Session-based accumulators as a fallback
    const sessionAgg: Record<string, Record<Canonical, { checkins: number; revenue: number; late: number }>> = {};
    months.forEach(m => {
      sessionAgg[m] = {
        powercycle: { checkins: 0, revenue: 0, late: 0 },
        barre: { checkins: 0, revenue: 0, late: 0 },
        strength: { checkins: 0, revenue: 0, late: 0 },
        other: { checkins: 0, revenue: 0, late: 0 },
      };
    });

    sessions.forEach(s => {
      const m = toYYYYMM(s.date || undefined);
      if (!m || !result[m]) return;
      const f = toCanonical(s.cleanedClass || s.classType);
      if (!result[m][f]) return;
      result[m][f].sessions += 1;
      result[m][f].capacity += s.capacity || 0;
      sessionAgg[m][f].checkins += s.checkedInCount || 0;
      sessionAgg[m][f].revenue += s.totalPaid || s.revenue || 0;
      sessionAgg[m][f].late += s.lateCancelledCount || 0;
    });

    checkins.forEach(c => {
      const d = c.dateIST || c['dateIST'] || c['Date (IST)'];
      const m = typeof d === 'string' ? toYYYYMM(d) : null;
      if (!m || !result[m]) return;
      const f = toCanonical(c.cleanedClass || c['Cleaned Class']);
      if (!result[m][f]) return;
      const checkedIn = isTrueish(c.checkedIn ?? c['Checked In'] ?? c['Checked in']);
      const late = isTrueish(c.isLateCancelled ?? c['Is Late Cancelled']);
      const paid = Number(c.paidAmount ?? c['Paid'] ?? 0) || 0;
      if (checkedIn) result[m][f].checkins += 1;
      if (late) result[m][f].late += 1;
      result[m][f].revenue += paid;
    });

    // Apply session-based fallback if checkins/revenue are zero
    months.forEach(m => {
      (['powercycle','barre','strength','other'] as Canonical[]).forEach(fmt => {
        if (result[m][fmt].checkins === 0 && sessionAgg[m][fmt].checkins > 0) {
          result[m][fmt].checkins = sessionAgg[m][fmt].checkins;
        }
        if (result[m][fmt].revenue === 0 && sessionAgg[m][fmt].revenue > 0) {
          result[m][fmt].revenue = sessionAgg[m][fmt].revenue;
        }
        if (result[m][fmt].late === 0 && sessionAgg[m][fmt].late > 0) {
          result[m][fmt].late = sessionAgg[m][fmt].late;
        }
      });
    });

    return result;
  }, [sessions, checkins, months]);

  const headerMonths = months.map(m => {
    const [y, mo] = m.split('-');
    const d = new Date(Number(y), Number(mo)-1, 1);
    return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
  });

  const renderValue = (m: string, f: Canonical) => {
    const row = byMonth[m]?.[f];
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

  const valueForCalc = (m: string, f: Canonical) => {
    const row = byMonth[m]?.[f];
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

  const computeMoMDelta = (f: Canonical) => {
    if (months.length < 2) return '-';
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
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

  // Totals per month across formats
  const totalsByMonth = useMemo(() => {
    const totals: Record<string, { sessions: number; checkins: number; capacity: number; revenue: number; late: number }>= {};
    months.forEach(m => {
      const t = { sessions: 0, checkins: 0, capacity: 0, revenue: 0, late: 0 };
      (['powercycle','barre','strength','other'] as Canonical[]).forEach(fmt => {
        const r = byMonth[m]?.[fmt];
        if (!r) return;
        t.sessions += r.sessions;
        t.checkins += r.checkins;
        t.capacity += r.capacity;
        t.revenue += r.revenue;
        t.late += r.late;
      });
      totals[m] = t;
    });
    return totals;
  }, [byMonth, months]);

  const renderTotalValue = (m: string) => {
    const t = totalsByMonth[m];
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

  const computeTotalsMoMDelta = () => {
    if (months.length < 2) return '-';
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    if (metric === 'fillRate') {
      const tLast = totalsByMonth[last];
      const tPrev = totalsByMonth[prev];
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
        <CardTitle className="text-lg font-semibold text-gray-800">Month-on-Month Comparison</CardTitle>
        <div className="flex flex-wrap gap-1">
          <Button
            variant={metric === 'sessions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('sessions')}
            className="h-8"
          >
            Sessions
          </Button>
          <Button
            variant={metric === 'checkins' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('checkins')}
            className="h-8"
          >
            Check-ins
          </Button>
          <Button
            variant={metric === 'revenue' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('revenue')}
            className="h-8"
          >
            Revenue
          </Button>
          <Button
            variant={metric === 'fillRate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMetric('fillRate')}
            className="h-8"
          >
            Fill Rate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Format / Month</TableHead>
              {headerMonths.map((hm, idx) => (
                <TableHead key={idx} className="text-right">{hm}</TableHead>
              ))}
              <TableHead className="text-right">MoM Δ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(['powercycle','barre','strength'] as Canonical[]).map(fmt => {
              const formatName = fmt === 'powercycle' ? 'PowerCycle' : fmt;
              return (
                <TableRow key={fmt}>
                  <TableCell className="font-medium capitalize">{formatName}</TableCell>
                  {months.map((m, idx) => {
                    const value = renderValue(m, fmt);
                    return (
                      <TableCell 
                        key={idx} 
                        className="text-right cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleCellClick(formatName, m, parseFloat(String(value).replace(/[^0-9.-]/g, '')) || 0)}
                      >
                        {value}
                      </TableCell>
                    );
                  })}
                  <TableCell className="text-right">{computeMoMDelta(fmt)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">All Formats</TableCell>
              {months.map((m, idx) => (
                <TableCell key={idx} className="text-right">{renderTotalValue(m)}</TableCell>
              ))}
              <TableCell className="text-right">{computeTotalsMoMDelta()}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ClassFormatsMoMTable;
