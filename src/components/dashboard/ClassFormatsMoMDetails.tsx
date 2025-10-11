import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SessionData } from '@/hooks/useSessionsData';
import { formatCurrency, formatNumber } from '@/utils/formatters';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  sessions: SessionData[];
}

const toYYYYMM = (input?: string): string | null => {
  if (!input) return null;
  const s = String(input);
  if (s.includes('/')) {
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
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      return `${y}-${m}`;
    }
    if (/^\d{4}-\d{2}/.test(s)) return s.slice(0, 7);
  }
  return null;
};

type GroupBy = 'classType' | 'uniqueId1' | 'uniqueId2';

const ClassFormatsMoMDetails: React.FC<Props> = ({ sessions }) => {
  const [groupBy, setGroupBy] = useState<GroupBy>('classType');
  const months = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => {
      const ym = toYYYYMM(s.date);
      if (ym) set.add(ym);
    });
    const arr = Array.from(set);
    arr.sort();
    return arr.slice(-6);
  }, [sessions]);

  const rows = useMemo(() => {
    const within = new Set(months);
    const byKey: Record<string, {
      group: string;
      day: string; time: string; cls: string; trainer: string;
      sessions: number; checkins: number; late: number; cap: number; rev: number;
      emptySessions: number;
    }> = {};
    (sessions || []).forEach((s) => {
      const ym = toYYYYMM(s.date);
      if (!ym || !within.has(ym)) return;
      const groupVal = groupBy === 'classType' ? (s.classType || '-') : groupBy === 'uniqueId1' ? (s.uniqueId1 || '-') : (s.uniqueId2 || '-');
      const key = [groupVal, s.dayOfWeek || '-', s.time || '-', s.cleanedClass || s.classType || '-', s.trainerName || '-'].join(' | ');
      if (!byKey[key]) {
        byKey[key] = {
          group: groupVal,
          day: s.dayOfWeek || '-',
          time: s.time || '-',
          cls: s.cleanedClass || s.classType || '-',
          trainer: s.trainerName || '-',
          sessions: 0,
          checkins: 0,
          late: 0,
          cap: 0,
          rev: 0,
          emptySessions: 0,
        };
      }
      const r = byKey[key];
      r.sessions += 1;
      r.checkins += s.checkedInCount || 0;
      r.late += s.lateCancelledCount || 0;
      r.cap += s.capacity || 0;
      r.rev += s.totalPaid || s.revenue || 0;
      if ((s.checkedInCount || 0) === 0) r.emptySessions += 1;
    });
    return Object.values(byKey).sort((a, b) => a.group.localeCompare(b.group) || b.checkins - a.checkins);
  }, [sessions, months, groupBy]);

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-lg font-semibold text-gray-800">MoM Per-Class Details (last 6 months)</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Group</span>
          <Select value={groupBy} onValueChange={(v: any) => setGroupBy(v)}>
            <SelectTrigger className="h-8 w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="classType">Class Type</SelectItem>
              <SelectItem value="uniqueId1">Unique ID 1</SelectItem>
              <SelectItem value="uniqueId2">Unique ID 2</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Group</TableHead>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Trainer</TableHead>
                <TableHead className="text-right">Sessions</TableHead>
                <TableHead className="text-right">Check-ins</TableHead>
                <TableHead className="text-right">Late Cancels</TableHead>
                <TableHead className="text-right">Capacity</TableHead>
                <TableHead className="text-right">Fill %</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Class Avg (incl empty)</TableHead>
                <TableHead className="text-right">Class Avg (excl empty)</TableHead>
                <TableHead className="text-right">Revenue / Class</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(() => {
                const out: React.ReactNode[] = [];
                let currentGroup: string | null = null;
                let gSess = 0, gChk = 0, gLate = 0, gCap = 0, gRev = 0, gEmpty = 0;
                let tSess = 0, tChk = 0, tLate = 0, tCap = 0, tRev = 0, tEmpty = 0;

                const pushSubtotal = () => {
                  if (currentGroup === null) return;
                  const gFill = gCap > 0 ? (gChk / gCap) * 100 : 0;
                  out.push(
                    <TableRow key={`subtotal-${currentGroup}`} className="bg-slate-50">
                      <TableCell colSpan={5} className="font-semibold">Subtotal — {currentGroup}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(gSess)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(gChk)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(gLate)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(gCap)}</TableCell>
                      <TableCell className="text-right font-semibold">{gFill.toFixed(1)}%</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(gRev)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber(gSess > 0 ? gChk / gSess : 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatNumber((gSess - gEmpty) > 0 ? gChk / (gSess - gEmpty) : 0)}</TableCell>
                      <TableCell className="text-right font-semibold">{formatCurrency(gSess > 0 ? gRev / gSess : 0)}</TableCell>
                    </TableRow>
                  );
                  gSess = gChk = gLate = gCap = gRev = gEmpty = 0;
                };

                rows.forEach((r, idx) => {
                  if (currentGroup !== r.group) {
                    // flush previous group
                    pushSubtotal();
                    currentGroup = r.group;
                  }
                  const fill = r.cap > 0 ? (r.checkins / r.cap) * 100 : 0;
                  out.push(
                    <TableRow key={`${r.group}-${idx}`}>
                      <TableCell>{r.group}</TableCell>
                      <TableCell>{r.day}</TableCell>
                      <TableCell>{r.time}</TableCell>
                      <TableCell>{r.cls}</TableCell>
                      <TableCell>{r.trainer}</TableCell>
                      <TableCell className="text-right cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'sessions', row: r, groupBy } }))}>{formatNumber(r.sessions)}</TableCell>
                      <TableCell className="text-right cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'checkins', row: r, groupBy } }))}>{formatNumber(r.checkins)}</TableCell>
                      <TableCell className="text-right cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'late', row: r, groupBy } }))}>{formatNumber(r.late)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.cap)}</TableCell>
                      <TableCell className="text-right">{fill.toFixed(1)}%</TableCell>
                      <TableCell className="text-right cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-drilldown', { detail: { scope: 'revenue', row: r, groupBy } }))}>{formatCurrency(r.rev)}</TableCell>
                      <TableCell className="text-right">{formatNumber(r.sessions > 0 ? r.checkins / r.sessions : 0)}</TableCell>
                      <TableCell className="text-right">{formatNumber((r.sessions - r.emptySessions) > 0 ? r.checkins / (r.sessions - r.emptySessions) : 0)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(r.sessions > 0 ? r.rev / r.sessions : 0)}</TableCell>
                    </TableRow>
                  );
                  // accumulate
                  gSess += r.sessions; gChk += r.checkins; gLate += r.late; gCap += r.cap; gRev += r.rev; gEmpty += r.emptySessions;
                  tSess += r.sessions; tChk += r.checkins; tLate += r.late; tCap += r.cap; tRev += r.rev; tEmpty += r.emptySessions;
                });

                // final group
                pushSubtotal();

                // grand total
                const tFill = tCap > 0 ? (tChk / tCap) * 100 : 0;
                out.push(
                  <TableRow key="grand-total" className="bg-slate-100">
                    <TableCell colSpan={5} className="font-semibold">Grand Total</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(tSess)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(tChk)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(tLate)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(tCap)}</TableCell>
                    <TableCell className="text-right font-semibold">{tFill.toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(tRev)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber(tSess > 0 ? tChk / tSess : 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatNumber((tSess - tEmpty) > 0 ? tChk / (tSess - tEmpty) : 0)}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(tSess > 0 ? tRev / tSess : 0)}</TableCell>
                  </TableRow>
                );
                return out;
              })()}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ClassFormatsMoMDetails;
